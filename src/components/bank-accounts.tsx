'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  Landmark, IndianRupee,
} from 'lucide-react';

// ===== TYPES =====

interface BankAccountsProps {
  financialYear: string;
}

interface BankAccountRecord {
  id: string;
  bankName: string;
  branchName?: string;
  accountNo: string;
  ifscCode?: string;
  accountType?: string;
  balance: number;
  openingBalance: number;
  financialYear: string;
  [key: string]: unknown;
}

// ===== HELPERS =====

function safeExtract(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.records)) return obj.records;
  }
  return [];
}

const accountTypeLabels: Record<string, string> = {
  savings: 'बचत',
  current: 'चालू',
};

// ===== COMPONENT =====

export default function BankAccounts({ financialYear }: BankAccountsProps) {
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRecord | null>(null);
  const [form, setForm] = useState<Partial<BankAccountRecord>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bank?financialYear=${financialYear}`);
      const data = await res.json();
      setAccounts(safeExtract(data) as BankAccountRecord[]);
    } catch {
      setError('डेटा लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDialog = (record?: BankAccountRecord) => {
    if (record) {
      setEditing(record);
      setForm({ ...record });
    } else {
      setEditing(null);
      setForm({ accountType: 'savings', balance: 0, openingBalance: 0, financialYear });
    }
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, financialYear };
      if (editing) {
        await fetch('/api/bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: editing.id, ...payload }) });
      } else {
        await fetch('/api/bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      toast({ title: editing ? 'बँक खाते अपडेट झाले' : 'बँक खाते जोडले' });
      setDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('हे बँक खाते हटवायचे?')) return;
    try {
      await fetch('/api/bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'बँक खाते हटवले' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalOpeningBalance = accounts.reduce((s, a) => s + (a.openingBalance || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />पुन्हा प्रयत्न करा</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">एकूण खाती</p>
              <p className="text-xl font-bold">{accounts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">एकूण शिल्लक</p>
              <p className="text-xl font-bold text-green-600">₹{totalBalance.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">आरंभी शिल्लक</p>
              <p className="text-xl font-bold">₹{totalOpeningBalance.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">बँक खाते यादी</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => openDialog()}><Plus className="h-4 w-4 mr-1" />नवीन खाते</Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">बँकेचे नाव</TableHead>
                  <TableHead className="text-xs">शाखा</TableHead>
                  <TableHead className="text-xs">खाते क्रमांक</TableHead>
                  <TableHead className="text-xs">IFSC कोड</TableHead>
                  <TableHead className="text-xs">प्रकार</TableHead>
                  <TableHead className="text-xs text-right">आरंभी शिल्लक</TableHead>
                  <TableHead className="text-xs text-right">शिल्लक</TableHead>
                  <TableHead className="text-xs text-right">कृती</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">कोणतेही बँक खाते नाहीत</TableCell></TableRow>
                ) : accounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium text-sm">{acc.bankName}</TableCell>
                    <TableCell className="text-sm">{acc.branchName || '-'}</TableCell>
                    <TableCell className="text-sm font-mono">{acc.accountNo}</TableCell>
                    <TableCell className="text-xs font-mono">{acc.ifscCode || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{accountTypeLabels[acc.accountType || ''] || acc.accountType || '-'}</Badge></TableCell>
                    <TableCell className="text-right text-sm">₹{(acc.openingBalance || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-sm font-bold">₹{(acc.balance || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(acc)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord(acc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'बँक खाते संपादन' : 'नवीन बँक खाते'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">बँकेचे नाव *</Label><Input value={form.bankName || ''} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="बँकेचे नाव" /></div>
              <div><Label className="text-xs">शाखा</Label><Input value={form.branchName || ''} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} placeholder="शाखा" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">खाते क्रमांक *</Label><Input value={form.accountNo || ''} onChange={e => setForm(f => ({ ...f, accountNo: e.target.value }))} placeholder="खाते क्रमांक" /></div>
              <div><Label className="text-xs">IFSC कोड</Label><Input value={form.ifscCode || ''} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))} placeholder="IFSC कोड" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">खाते प्रकार</Label>
                <Select value={form.accountType || 'savings'} onValueChange={v => setForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">बचत खाते</SelectItem>
                    <SelectItem value="current">चालू खाते</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">आरंभी शिल्लक</Label><Input type="number" value={form.openingBalance || 0} onChange={e => setForm(f => ({ ...f, openingBalance: Number(e.target.value) }))} /></div>
            </div>
            <div><Label className="text-xs">शिल्लक</Label><Input type="number" value={form.balance || 0} onChange={e => setForm(f => ({ ...f, balance: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>रद्द करा</Button>
            <Button onClick={save} disabled={saving || !form.bankName || !form.accountNo}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
