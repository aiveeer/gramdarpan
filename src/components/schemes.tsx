'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  Flag, BookOpen,
} from 'lucide-react';

// ===== TYPES =====

interface SchemesProps {
  financialYear: string;
}

interface SchemeRecord {
  id: string;
  schemeName: string;
  schemeNameMr?: string;
  schemeCode?: string;
  schemeType?: string;
  department?: string;
  grantAmount?: number;
  receivedAmount: number;
  expenditure: number;
  balance: number;
  financialYear: string;
  startDate?: string;
  endDate?: string;
  status: string;
  [key: string]: unknown;
}

interface FundEntryRecord {
  id: string;
  schemeId?: string;
  entryType: string;
  entryDate?: string;
  amount: number;
  description?: string;
  voucherNo?: string;
  financialYear: string;
  scheme?: { schemeName: string; schemeNameMr?: string };
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

const schemeStatusLabels: Record<string, string> = {
  active: 'सक्रिय',
  completed: 'पूर्ण',
  suspended: 'सस्पेंड',
  closed: 'बंद',
};

const schemeStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-amber-100 text-amber-800',
  closed: 'bg-red-100 text-red-800',
};

const entryTypeLabels: Record<string, string> = {
  Receipt: 'प्राप्ती',
  Payment: 'पावती',
};

// ===== COMPONENT =====

export default function Schemes({ financialYear }: SchemesProps) {
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [funds, setFunds] = useState<FundEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheme dialog
  const [schDialogOpen, setSchDialogOpen] = useState(false);
  const [schEditing, setSchEditing] = useState<SchemeRecord | null>(null);
  const [schForm, setSchForm] = useState<Partial<SchemeRecord>>({});
  const [saving, setSaving] = useState(false);

  // Fund dialog
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [fundEditing, setFundEditing] = useState<FundEntryRecord | null>(null);
  const [fundForm, setFundForm] = useState<Partial<FundEntryRecord>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schRes, fundRes] = await Promise.all([
        fetch(`/api/schemes?financialYear=${financialYear}`),
        fetch(`/api/schemes?type=fund&financialYear=${financialYear}`),
      ]);
      const schData = await schRes.json();
      const fundData = await fundRes.json();
      setSchemes(safeExtract(schData) as SchemeRecord[]);
      setFunds(safeExtract(fundData) as FundEntryRecord[]);
    } catch {
      setError('डेटा लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== SCHEME CRUD =====

  const openSchDialog = (record?: SchemeRecord) => {
    if (record) {
      setSchEditing(record);
      setSchForm({ ...record });
    } else {
      setSchEditing(null);
      setSchForm({ grantAmount: 0, receivedAmount: 0, expenditure: 0, balance: 0, status: 'active', financialYear });
    }
    setSchDialogOpen(true);
  };

  const saveSch = async () => {
    setSaving(true);
    try {
      const balance = (schForm.grantAmount || 0) - (schForm.expenditure || 0);
      const payload = { ...schForm, balance, financialYear };
      if (schEditing) {
        await fetch('/api/schemes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: schEditing.id, ...payload }) });
      } else {
        await fetch('/api/schemes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      toast({ title: schEditing ? 'योजना अपडेट झाली' : 'योजना जोडली' });
      setSchDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSch = async (id: string) => {
    if (!confirm('ही योजना हटवायची?')) return;
    try {
      await fetch('/api/schemes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'योजना हटवली' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // ===== FUND CRUD =====

  const openFundDialog = (record?: FundEntryRecord) => {
    if (record) {
      setFundEditing(record);
      setFundForm({ ...record });
    } else {
      setFundEditing(null);
      setFundForm({ entryType: 'Receipt', amount: 0, financialYear });
    }
    setFundDialogOpen(true);
  };

  const saveFund = async () => {
    setSaving(true);
    try {
      const payload = { ...fundForm, financialYear };
      if (fundEditing) {
        await fetch('/api/schemes?type=fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: fundEditing.id, ...payload }) });
      } else {
        await fetch('/api/schemes?type=fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      toast({ title: fundEditing ? 'निधी नोंद अपडेट झाली' : 'निधी नोंद जोडली' });
      setFundDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteFund = async (id: string) => {
    if (!confirm('ही निधी नोंद हटवायची?')) return;
    try {
      await fetch('/api/schemes?type=fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'निधी नोंद हटवली' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // Summary
  const totalGrant = schemes.reduce((s, r) => s + (r.grantAmount || 0), 0);
  const totalReceived = schemes.reduce((s, r) => s + (r.receivedAmount || 0), 0);
  const totalExpenditure = schemes.reduce((s, r) => s + (r.expenditure || 0), 0);
  const totalBalance = schemes.reduce((s, r) => s + (r.balance || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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
      <Tabs defaultValue="schemes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="schemes" className="gap-1"><Flag className="h-4 w-4" />योजना</TabsTrigger>
          <TabsTrigger value="funds" className="gap-1"><BookOpen className="h-4 w-4" />निधी नोंद</TabsTrigger>
        </TabsList>

        {/* ===== SCHEMES TAB ===== */}
        <TabsContent value="schemes" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">अनुदान रक्कम</p>
                <p className="text-lg font-bold text-primary">₹{totalGrant.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">प्राप्त रक्कम</p>
                <p className="text-lg font-bold text-green-600">₹{totalReceived.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">खर्च</p>
                <p className="text-lg font-bold text-destructive">₹{totalExpenditure.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">शिल्लक</p>
                <p className="text-lg font-bold">₹{totalBalance.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">योजना यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openSchDialog()}><Plus className="h-4 w-4 mr-1" />नवीन योजना</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">योजनेचे नाव</TableHead>
                      <TableHead className="text-xs">कोड</TableHead>
                      <TableHead className="text-xs">प्रकार</TableHead>
                      <TableHead className="text-xs text-right">अनुदान</TableHead>
                      <TableHead className="text-xs text-right">प्राप्त</TableHead>
                      <TableHead className="text-xs text-right">खर्च</TableHead>
                      <TableHead className="text-xs text-right">शिल्लक</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemes.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">कोणतीही योजना नाही</TableCell></TableRow>
                    ) : schemes.map(sch => (
                      <TableRow key={sch.id}>
                        <TableCell>
                          <div className="text-sm">{sch.schemeName}</div>
                          {sch.schemeNameMr && <div className="text-xs text-muted-foreground">{sch.schemeNameMr}</div>}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{sch.schemeCode || '-'}</TableCell>
                        <TableCell className="text-xs">{sch.schemeType || '-'}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sch.grantAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sch.receivedAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sch.expenditure || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm font-medium">₹{(sch.balance || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge className={schemeStatusColors[sch.status] || ''}>{schemeStatusLabels[sch.status] || sch.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openSchDialog(sch)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSch(sch.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Scheme Dialog */}
          <Dialog open={schDialogOpen} onOpenChange={setSchDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{schEditing ? 'योजना संपादन' : 'नवीन योजना'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">योजनेचे नाव *</Label><Input value={schForm.schemeName || ''} onChange={e => setSchForm(f => ({ ...f, schemeName: e.target.value }))} placeholder="Scheme Name" /></div>
                  <div><Label className="text-xs">मराठीत</Label><Input value={schForm.schemeNameMr || ''} onChange={e => setSchForm(f => ({ ...f, schemeNameMr: e.target.value }))} placeholder="योजनेचे नाव मराठीत" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">योजना कोड</Label><Input value={schForm.schemeCode || ''} onChange={e => setSchForm(f => ({ ...f, schemeCode: e.target.value }))} placeholder="SCH-001" /></div>
                  <div>
                    <Label className="text-xs">प्रकार</Label>
                    <Select value={schForm.schemeType || 'central'} onValueChange={v => setSchForm(f => ({ ...f, schemeType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">केंद्रीय</SelectItem>
                        <SelectItem value="state">राज्य</SelectItem>
                        <SelectItem value="district">जिल्हा</SelectItem>
                        <SelectItem value="other">इतर</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">विभाग</Label><Input value={schForm.department || ''} onChange={e => setSchForm(f => ({ ...f, department: e.target.value }))} placeholder="विभाग" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">अनुदान रक्कम</Label><Input type="number" value={schForm.grantAmount || 0} onChange={e => setSchForm(f => ({ ...f, grantAmount: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">प्राप्त रक्कम</Label><Input type="number" value={schForm.receivedAmount || 0} onChange={e => setSchForm(f => ({ ...f, receivedAmount: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">खर्च</Label><Input type="number" value={schForm.expenditure || 0} onChange={e => setSchForm(f => ({ ...f, expenditure: Number(e.target.value) }))} /></div>
                </div>
                <div className="bg-muted p-2 rounded text-sm">
                  शिल्लक: ₹{((schForm.grantAmount || 0) - (schForm.expenditure || 0)).toLocaleString('en-IN')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">सुरू दिनांक</Label><Input type="date" value={schForm.startDate || ''} onChange={e => setSchForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div><Label className="text-xs">शेवटचा दिनांक</Label><Input type="date" value={schForm.endDate || ''} onChange={e => setSchForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                </div>
                <div>
                  <Label className="text-xs">स्थिती</Label>
                  <Select value={schForm.status || 'active'} onValueChange={v => setSchForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">सक्रिय</SelectItem>
                      <SelectItem value="completed">पूर्ण</SelectItem>
                      <SelectItem value="suspended">सस्पेंड</SelectItem>
                      <SelectItem value="closed">बंद</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSchDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveSch} disabled={saving || !schForm.schemeName}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== FUND ENTRIES TAB ===== */}
        <TabsContent value="funds" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">निधी नोंदी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openFundDialog()}><Plus className="h-4 w-4 mr-1" />नवीन नोंद</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">योजना</TableHead>
                      <TableHead className="text-xs">प्रकार</TableHead>
                      <TableHead className="text-xs">दिनांक</TableHead>
                      <TableHead className="text-xs text-right">रक्कम</TableHead>
                      <TableHead className="text-xs">वर्णन</TableHead>
                      <TableHead className="text-xs">वाउचर क्र.</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funds.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणतीही निधी नोंद नाही</TableCell></TableRow>
                    ) : funds.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm">{f.scheme?.schemeNameMr || f.scheme?.schemeName || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={f.entryType === 'Receipt' ? 'default' : 'secondary'}>
                            {entryTypeLabels[f.entryType] || f.entryType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{f.entryDate || '-'}</TableCell>
                        <TableCell className="text-right text-sm font-medium">₹{(f.amount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-xs max-w-32 truncate">{f.description || '-'}</TableCell>
                        <TableCell className="text-xs font-mono">{f.voucherNo || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openFundDialog(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteFund(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Fund Entry Dialog */}
          <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{fundEditing ? 'निधी नोंद संपादन' : 'नवीन निधी नोंद'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label className="text-xs">योजना</Label>
                  <Select value={fundForm.schemeId || '__none__'} onValueChange={v => setFundForm(f => ({ ...f, schemeId: v === '__none__' ? undefined : v }))}>
                    <SelectTrigger><SelectValue placeholder="योजना निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणतीही नाही</SelectItem>
                      {schemes.map(sch => (
                        <SelectItem key={sch.id} value={sch.id}>{sch.schemeNameMr || sch.schemeName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">प्रकार *</Label>
                    <Select value={fundForm.entryType || 'Receipt'} onValueChange={v => setFundForm(f => ({ ...f, entryType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receipt">प्राप्ती</SelectItem>
                        <SelectItem value="Payment">पावती</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">दिनांक</Label><Input type="date" value={fundForm.entryDate || ''} onChange={e => setFundForm(f => ({ ...f, entryDate: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">रक्कम</Label><Input type="number" value={fundForm.amount || 0} onChange={e => setFundForm(f => ({ ...f, amount: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">वाउचर क्र.</Label><Input value={fundForm.voucherNo || ''} onChange={e => setFundForm(f => ({ ...f, voucherNo: e.target.value }))} placeholder="VCH-001" /></div>
                </div>
                <div>
                  <Label className="text-xs">वर्णन</Label>
                  <Textarea value={fundForm.description || ''} onChange={e => setFundForm(f => ({ ...f, description: e.target.value }))} placeholder="वर्णन" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFundDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveFund} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
