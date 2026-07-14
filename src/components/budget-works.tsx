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
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  ClipboardList, Hammer, IndianRupee,
} from 'lucide-react';

// ===== TYPES =====

interface BudgetWorksProps {
  financialYear: string;
}

interface BudgetHeadRecord {
  id: string;
  headName: string;
  headNameMr?: string;
  headCode: string;
  category?: string;
  financialYear: string;
  budgetAmount: number;
  revisedAmount?: number;
  expenditure: number;
  balance: number;
  [key: string]: unknown;
}

interface WorkRecord {
  id: string;
  workName: string;
  workNameMr?: string;
  schemeName?: string;
  headId?: string;
  estimatedCost: number;
  approvedCost?: number;
  tenderAmount?: number;
  contractorName?: string;
  startDate?: string;
  endDate?: string;
  progressPercent: number;
  status: string;
  financialYear: string;
  head?: { headName: string; headNameMr?: string };
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

const categoryLabels: Record<string, string> = {
  income: 'उत्पन्न',
  expenditure: 'खर्च',
};

const statusLabels: Record<string, string> = {
  planned: 'आराखडा',
  in_progress: 'सुरू',
  completed: 'पूर्ण',
};

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
};

// ===== COMPONENT =====

export default function BudgetWorks({ financialYear }: BudgetWorksProps) {
  const [budgetHeads, setBudgetHeads] = useState<BudgetHeadRecord[]>([]);
  const [works, setWorks] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Budget Head dialog
  const [bhDialogOpen, setBhDialogOpen] = useState(false);
  const [bhEditing, setBhEditing] = useState<BudgetHeadRecord | null>(null);
  const [bhForm, setBhForm] = useState<Partial<BudgetHeadRecord>>({});
  const [saving, setSaving] = useState(false);

  // Work dialog
  const [wkDialogOpen, setWkDialogOpen] = useState(false);
  const [wkEditing, setWkEditing] = useState<WorkRecord | null>(null);
  const [wkForm, setWkForm] = useState<Partial<WorkRecord>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bhRes, wkRes] = await Promise.all([
        fetch(`/api/budget?financialYear=${financialYear}`),
        fetch(`/api/works?financialYear=${financialYear}`),
      ]);
      const bhData = await bhRes.json();
      const wkData = await wkRes.json();
      setBudgetHeads(safeExtract(bhData) as BudgetHeadRecord[]);
      setWorks(safeExtract(wkData) as WorkRecord[]);
    } catch {
      setError('डेटा लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== BUDGET HEAD CRUD =====

  const openBhDialog = (record?: BudgetHeadRecord) => {
    if (record) {
      setBhEditing(record);
      setBhForm({ ...record });
    } else {
      setBhEditing(null);
      setBhForm({ category: 'income', budgetAmount: 0, revisedAmount: 0, expenditure: 0, financialYear });
    }
    setBhDialogOpen(true);
  };

  const saveBh = async () => {
    setSaving(true);
    try {
      const balance = ((bhForm.revisedAmount || bhForm.budgetAmount) || 0) - (bhForm.expenditure || 0);
      const payload = { ...bhForm, balance, financialYear };
      let res: Response;
      if (bhEditing) {
        res = await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: bhEditing.id, ...payload }) });
      } else {
        res = await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      const json = await res.json();
      if (!res.ok || json.error) {
        toast({ title: 'त्रुटी', description: json.error || 'जतन करताना त्रुटी', variant: 'destructive' });
        return;
      }
      toast({ title: bhEditing ? 'बजेट शिर्षक अपडेट झाले' : 'बजेट शिर्षक जोडले' });
      setBhDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteBh = async (id: string) => {
    if (!confirm('हे बजेट शिर्षक हटवायचे?')) return;
    try {
      await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'बजेट शिर्षक हटवले' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // ===== WORK CRUD =====

  const openWkDialog = (record?: WorkRecord) => {
    if (record) {
      setWkEditing(record);
      setWkForm({ ...record });
    } else {
      setWkEditing(null);
      setWkForm({ estimatedCost: 0, approvedCost: 0, tenderAmount: 0, progressPercent: 0, status: 'planned', financialYear });
    }
    setWkDialogOpen(true);
  };

  const saveWk = async () => {
    setSaving(true);
    try {
      const payload = { ...wkForm, financialYear };
      let res: Response;
      if (wkEditing) {
        res = await fetch('/api/works', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: wkEditing.id, ...payload }) });
      } else {
        res = await fetch('/api/works', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      const json = await res.json();
      if (!res.ok || json.error) {
        toast({ title: 'त्रुटी', description: json.error || 'जतन करताना त्रुटी', variant: 'destructive' });
        return;
      }
      toast({ title: wkEditing ? 'काम अपडेट झाले' : 'काम जोडले' });
      setWkDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteWk = async (id: string) => {
    if (!confirm('हे काम हटवायचे?')) return;
    try {
      await fetch('/api/works', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'काम हटवले' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // ===== SUMMARY =====

  const totalBudget = budgetHeads.reduce((s, b) => s + (b.budgetAmount || 0), 0);
  const totalExpenditure = budgetHeads.reduce((s, b) => s + (b.expenditure || 0), 0);
  const totalBalance = budgetHeads.reduce((s, b) => s + (((b.revisedAmount || b.budgetAmount) || 0) - (b.expenditure || 0)), 0);

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
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
      <Tabs defaultValue="budget">
        <TabsList className="flex-wrap">
          <TabsTrigger value="budget" className="gap-1"><ClipboardList className="h-4 w-4" />बजेट शिर्षक</TabsTrigger>
          <TabsTrigger value="works" className="gap-1"><Hammer className="h-4 w-4" />कामे</TabsTrigger>
        </TabsList>

        {/* ===== BUDGET HEADS TAB ===== */}
        <TabsContent value="budget" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">एकूण बजेट</p>
                <p className="text-xl font-bold text-primary">₹{totalBudget.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">एकूण खर्च</p>
                <p className="text-xl font-bold text-destructive">₹{totalExpenditure.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">एकूण शिल्लक</p>
                <p className="text-xl font-bold text-green-600">₹{totalBalance.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">बजेट शिर्षक यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openBhDialog()}><Plus className="h-4 w-4 mr-1" />नवीन शिर्षक</Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">शिर्षक कोड</TableHead>
                      <TableHead className="text-xs">शिर्षक नाव</TableHead>
                      <TableHead className="text-xs">वर्ग</TableHead>
                      <TableHead className="text-xs text-right">बजेट रक्कम</TableHead>
                      <TableHead className="text-xs text-right">सुधारित रक्कम</TableHead>
                      <TableHead className="text-xs text-right">खर्च</TableHead>
                      <TableHead className="text-xs text-right">शिल्लक</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetHeads.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">कोणतेही बजेट शिर्षक नाहीत</TableCell></TableRow>
                    ) : budgetHeads.map(bh => {
                      const bal = ((bh.revisedAmount || bh.budgetAmount) || 0) - (bh.expenditure || 0);
                      return (
                        <TableRow key={bh.id}>
                          <TableCell className="font-mono text-xs">{bh.headCode}</TableCell>
                          <TableCell>
                            <div className="text-sm">{bh.headName}</div>
                            {bh.headNameMr && <div className="text-xs text-muted-foreground">{bh.headNameMr}</div>}
                          </TableCell>
                          <TableCell><Badge variant="outline">{categoryLabels[bh.category || ''] || bh.category}</Badge></TableCell>
                          <TableCell className="text-right text-sm">₹{(bh.budgetAmount || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right text-sm">₹{((bh.revisedAmount || 0)).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right text-sm">₹{(bh.expenditure || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right text-sm font-medium" style={{ color: bal >= 0 ? 'green' : 'red' }}>₹{bal.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openBhDialog(bh)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBh(bh.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Budget Head Dialog */}
          <Dialog open={bhDialogOpen} onOpenChange={setBhDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{bhEditing ? 'बजेट शिर्षक संपादन' : 'नवीन बजेट शिर्षक'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">शिर्षक नाव *</Label><Input value={bhForm.headName || ''} onChange={e => setBhForm(f => ({ ...f, headName: e.target.value }))} placeholder="Head Name" /></div>
                  <div><Label className="text-xs">मराठीत</Label><Input value={bhForm.headNameMr || ''} onChange={e => setBhForm(f => ({ ...f, headNameMr: e.target.value }))} placeholder="शिर्षक नाव मराठीत" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">शिर्षक कोड *</Label><Input value={bhForm.headCode || ''} onChange={e => setBhForm(f => ({ ...f, headCode: e.target.value }))} placeholder="BH-001" /></div>
                  <div>
                    <Label className="text-xs">वर्ग</Label>
                    <Select value={bhForm.category || 'income'} onValueChange={v => setBhForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">उत्पन्न</SelectItem>
                        <SelectItem value="expenditure">खर्च</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">बजेट रक्कम</Label><Input type="number" value={bhForm.budgetAmount || 0} onChange={e => setBhForm(f => ({ ...f, budgetAmount: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">सुधारित रक्कम</Label><Input type="number" value={bhForm.revisedAmount || 0} onChange={e => setBhForm(f => ({ ...f, revisedAmount: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">खर्च</Label><Input type="number" value={bhForm.expenditure || 0} onChange={e => setBhForm(f => ({ ...f, expenditure: Number(e.target.value) }))} /></div>
                </div>
                <div className="bg-muted p-2 rounded text-sm">
                  शिल्लक: ₹{(((bhForm.revisedAmount || bhForm.budgetAmount) || 0) - (bhForm.expenditure || 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBhDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveBh} disabled={saving || !bhForm.headName || !bhForm.headCode}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== WORKS TAB ===== */}
        <TabsContent value="works" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">कामे यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openWkDialog()}><Plus className="h-4 w-4 mr-1" />नवीन काम</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">कामाचे नाव</TableHead>
                      <TableHead className="text-xs">योजना</TableHead>
                      <TableHead className="text-xs">बजेट शिर्षक</TableHead>
                      <TableHead className="text-xs text-right">अंदाजित खर्च</TableHead>
                      <TableHead className="text-xs text-right">मंजूर खर्च</TableHead>
                      <TableHead className="text-xs">प्रगती</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {works.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">कोणतीही कामे नाहीत</TableCell></TableRow>
                    ) : works.map(wk => (
                      <TableRow key={wk.id}>
                        <TableCell>
                          <div className="text-sm">{wk.workName}</div>
                          {wk.workNameMr && <div className="text-xs text-muted-foreground">{wk.workNameMr}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{wk.schemeName || '-'}</TableCell>
                        <TableCell className="text-xs">{wk.head?.headNameMr || wk.head?.headName || '-'}</TableCell>
                        <TableCell className="text-right text-sm">₹{(wk.estimatedCost || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(wk.approvedCost || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(wk.progressPercent || 0, 100)}%` }} />
                            </div>
                            <span className="text-xs">{wk.progressPercent || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={statusColors[wk.status] || ''}>{statusLabels[wk.status] || wk.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openWkDialog(wk)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteWk(wk.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Work Dialog */}
          <Dialog open={wkDialogOpen} onOpenChange={setWkDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{wkEditing ? 'काम संपादन' : 'नवीन काम'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">कामाचे नाव *</Label><Input value={wkForm.workName || ''} onChange={e => setWkForm(f => ({ ...f, workName: e.target.value }))} placeholder="Work Name" /></div>
                  <div><Label className="text-xs">मराठीत</Label><Input value={wkForm.workNameMr || ''} onChange={e => setWkForm(f => ({ ...f, workNameMr: e.target.value }))} placeholder="कामाचे नाव मराठीत" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">योजना</Label><Input value={wkForm.schemeName || ''} onChange={e => setWkForm(f => ({ ...f, schemeName: e.target.value }))} placeholder="योजनेचे नाव" /></div>
                  <div>
                    <Label className="text-xs">बजेट शिर्षक</Label>
                    <Select value={wkForm.headId || '__none__'} onValueChange={v => setWkForm(f => ({ ...f, headId: v === '__none__' ? undefined : v }))}>
                      <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">कोणतेही नाही</SelectItem>
                        {budgetHeads.map(bh => (
                          <SelectItem key={bh.id} value={bh.id}>{bh.headNameMr || bh.headName} ({bh.headCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">अंदाजित खर्च</Label><Input type="number" value={wkForm.estimatedCost || 0} onChange={e => setWkForm(f => ({ ...f, estimatedCost: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">मंजूर खर्च</Label><Input type="number" value={wkForm.approvedCost || 0} onChange={e => setWkForm(f => ({ ...f, approvedCost: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">टेंडर रक्कम</Label><Input type="number" value={wkForm.tenderAmount || 0} onChange={e => setWkForm(f => ({ ...f, tenderAmount: Number(e.target.value) }))} /></div>
                </div>
                <div><Label className="text-xs">कंत्राटदार</Label><Input value={wkForm.contractorName || ''} onChange={e => setWkForm(f => ({ ...f, contractorName: e.target.value }))} placeholder="कंत्राटदाराचे नाव" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">सुरू दिनांक</Label><Input type="date" value={wkForm.startDate || ''} onChange={e => setWkForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div><Label className="text-xs">शेवटचा दिनांक</Label><Input type="date" value={wkForm.endDate || ''} onChange={e => setWkForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">प्रगती %</Label><Input type="number" min={0} max={100} value={wkForm.progressPercent || 0} onChange={e => setWkForm(f => ({ ...f, progressPercent: Number(e.target.value) }))} /></div>
                  <div>
                    <Label className="text-xs">स्थिती</Label>
                    <Select value={wkForm.status || 'planned'} onValueChange={v => setWkForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">आराखडा</SelectItem>
                        <SelectItem value="in_progress">सुरू</SelectItem>
                        <SelectItem value="completed">पूर्ण</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWkDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveWk} disabled={saving || !wkForm.workName}>
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
