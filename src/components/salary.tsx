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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  Users, Wallet,
} from 'lucide-react';

// ===== TYPES =====

interface SalaryProps {
  financialYear: string;
}

interface EmployeeRecord {
  id: string;
  employeeName: string;
  employeeNameMr?: string;
  designation: string;
  designationMr?: string;
  department?: string;
  basicPay?: number;
  da?: number;
  hra?: number;
  grossSalary?: number;
  isActive: boolean;
  [key: string]: unknown;
}

interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicPay: number;
  da: number;
  hra: number;
  ma: number;
  deductions: number;
  netPay: number;
  paymentDate: string;
  paymentMode: string;
  financialYear: string;
  employee?: { employeeName: string; employeeNameMr?: string; designation?: string };
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

const monthLabels: Record<string, string> = {
  '01': 'जानेवारी', '02': 'फेब्रुवारी', '03': 'मार्च', '04': 'एप्रिल',
  '05': 'मे', '06': 'जून', '07': 'जुलै', '08': 'ऑगस्ट',
  '09': 'सप्टेंबर', '10': 'ऑक्टोबर', '11': 'नोव्हेंबर', '12': 'डिसेंबर',
};

const paymentModeLabels: Record<string, string> = {
  cash: 'रोख',
  bank_transfer: 'बँक हस्तांतरण',
  cheque: 'चेक',
};

// ===== COMPONENT =====

export default function Salary({ financialYear }: SalaryProps) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Employee dialog
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empEditing, setEmpEditing] = useState<EmployeeRecord | null>(null);
  const [empForm, setEmpForm] = useState<Partial<EmployeeRecord>>({});
  const [saving, setSaving] = useState(false);

  // Salary dialog
  const [salDialogOpen, setSalDialogOpen] = useState(false);
  const [salEditing, setSalEditing] = useState<SalaryRecord | null>(null);
  const [salForm, setSalForm] = useState<Partial<SalaryRecord>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, salRes] = await Promise.all([
        fetch(`/api/master?table=employee`),
        fetch(`/api/salary?financialYear=${financialYear}`),
      ]);
      const empData = await empRes.json();
      const salData = await salRes.json();
      setEmployees(safeExtract(empData) as EmployeeRecord[]);
      setSalaries(safeExtract(salData) as SalaryRecord[]);
    } catch {
      setError('डेटा लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== EMPLOYEE CRUD =====

  const openEmpDialog = (record?: EmployeeRecord) => {
    if (record) {
      setEmpEditing(record);
      setEmpForm({ ...record });
    } else {
      setEmpEditing(null);
      setEmpForm({ basicPay: 0, da: 0, hra: 0, isActive: true });
    }
    setEmpDialogOpen(true);
  };

  const saveEmp = async () => {
    setSaving(true);
    try {
      const grossSalary = (empForm.basicPay || 0) + (empForm.da || 0) + (empForm.hra || 0);
      const payload = { ...empForm, grossSalary };
      if (empEditing) {
        await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', table: 'employee', id: empEditing.id, data: { id: empEditing.id, ...payload } }),
        });
      } else {
        await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', table: 'employee', data: payload }),
        });
      }
      toast({ title: empEditing ? 'कर्मचारी अपडेट झाला' : 'कर्मचारी जोडला' });
      setEmpDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteEmp = async (id: string) => {
    if (!confirm('हा कर्मचारी हटवायचा?')) return;
    try {
      await fetch(`/api/master?table=employee&id=${id}`, { method: 'DELETE' });
      toast({ title: 'कर्मचारी हटवला' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // ===== SALARY CRUD =====

  const openSalDialog = (record?: SalaryRecord) => {
    if (record) {
      setSalEditing(record);
      setSalForm({ ...record });
    } else {
      setSalEditing(null);
      const defaultEmp = employees.find(e => e.isActive);
      setSalForm({
        employeeId: defaultEmp?.id || '',
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
        year: new Date().getFullYear(),
        basicPay: defaultEmp?.basicPay || 0,
        da: defaultEmp?.da || 0,
        hra: defaultEmp?.hra || 0,
        ma: 0,
        deductions: 0,
        netPay: 0,
        paymentMode: 'bank_transfer',
        financialYear,
      });
    }
    setSalDialogOpen(true);
  };

  const onSalEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const bp = emp.basicPay || 0;
      const da = emp.da || 0;
      const hra = emp.hra || 0;
      setSalForm(f => ({ ...f, employeeId: empId, basicPay: bp, da, hra }));
    } else {
      setSalForm(f => ({ ...f, employeeId: empId }));
    }
  };

  const calcNetPay = () => {
    const bp = salForm.basicPay || 0;
    const da = salForm.da || 0;
    const hra = salForm.hra || 0;
    const ma = salForm.ma || 0;
    const ded = salForm.deductions || 0;
    return bp + da + hra + ma - ded;
  };

  const saveSal = async () => {
    setSaving(true);
    try {
      const netPay = calcNetPay();
      const payload = { ...salForm, netPay, financialYear };
      if (salEditing) {
        await fetch('/api/salary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: salEditing.id, ...payload }) });
      } else {
        await fetch('/api/salary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...payload }) });
      }
      toast({ title: salEditing ? 'पगार अपडेट झाला' : 'पगार जोडला' });
      setSalDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSal = async (id: string) => {
    if (!confirm('ही पगार नोंद हटवायची?')) return;
    try {
      await fetch('/api/salary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'पगार नोंद हटवली' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  // Summary
  const totalNetPay = salaries.reduce((s, r) => s + (r.netPay || 0), 0);

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
      <Tabs defaultValue="employees">
        <TabsList className="flex-wrap">
          <TabsTrigger value="employees" className="gap-1"><Users className="h-4 w-4" />कर्मचारी</TabsTrigger>
          <TabsTrigger value="salary" className="gap-1"><Wallet className="h-4 w-4" />पगार</TabsTrigger>
        </TabsList>

        {/* ===== EMPLOYEES TAB ===== */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">कर्मचारी यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openEmpDialog()}><Plus className="h-4 w-4 mr-1" />नवीन कर्मचारी</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">नाव</TableHead>
                      <TableHead className="text-xs">पद</TableHead>
                      <TableHead className="text-xs">विभाग</TableHead>
                      <TableHead className="text-xs text-right">मूळ वेतन</TableHead>
                      <TableHead className="text-xs text-right">म.भ.</TableHead>
                      <TableHead className="text-xs text-right">घ.भ.</TableHead>
                      <TableHead className="text-xs">सक्रिय</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">कोणतेही कर्मचारी नाहीत</TableCell></TableRow>
                    ) : employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="text-sm">{emp.employeeName}</div>
                          {emp.employeeNameMr && <div className="text-xs text-muted-foreground">{emp.employeeNameMr}</div>}
                        </TableCell>
                        <TableCell className="text-sm">{emp.designationMr || emp.designation}</TableCell>
                        <TableCell className="text-sm">{emp.department || '-'}</TableCell>
                        <TableCell className="text-right text-sm">₹{(emp.basicPay || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(emp.da || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(emp.hra || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={emp.isActive ? 'default' : 'secondary'}>{emp.isActive ? 'सक्रिय' : 'निष्क्रिय'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEmpDialog(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEmp(emp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Employee Dialog */}
          <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{empEditing ? 'कर्मचारी संपादन' : 'नवीन कर्मचारी'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">नाव *</Label><Input value={empForm.employeeName || ''} onChange={e => setEmpForm(f => ({ ...f, employeeName: e.target.value }))} placeholder="Employee Name" /></div>
                  <div><Label className="text-xs">मराठीत</Label><Input value={empForm.employeeNameMr || ''} onChange={e => setEmpForm(f => ({ ...f, employeeNameMr: e.target.value }))} placeholder="नाव मराठीत" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">पद *</Label><Input value={empForm.designation || ''} onChange={e => setEmpForm(f => ({ ...f, designation: e.target.value }))} placeholder="Designation" /></div>
                  <div><Label className="text-xs">विभाग</Label><Input value={empForm.department || ''} onChange={e => setEmpForm(f => ({ ...f, department: e.target.value }))} placeholder="विभाग" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">मूळ वेतन</Label><Input type="number" value={empForm.basicPay || 0} onChange={e => setEmpForm(f => ({ ...f, basicPay: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">महागाई भत्ता</Label><Input type="number" value={empForm.da || 0} onChange={e => setEmpForm(f => ({ ...f, da: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">घरभाडे भत्ता</Label><Input type="number" value={empForm.hra || 0} onChange={e => setEmpForm(f => ({ ...f, hra: Number(e.target.value) }))} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={empForm.isActive !== false} onCheckedChange={v => setEmpForm(f => ({ ...f, isActive: v === true }))} />
                  <Label className="text-xs">सक्रिय</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmpDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveEmp} disabled={saving || !empForm.employeeName || !empForm.designation}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== SALARY TAB ===== */}
        <TabsContent value="salary" className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">एकूण पगार नोंदी</p>
                <p className="text-xl font-bold">{salaries.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">एकूण निव्वळ वेतन</p>
                <p className="text-xl font-bold text-primary">₹{totalNetPay.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">पगार नोंदी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openSalDialog()}><Plus className="h-4 w-4 mr-1" />नवीन पगार</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">कर्मचारी</TableHead>
                      <TableHead className="text-xs">महिना</TableHead>
                      <TableHead className="text-xs text-right">मूळ वेतन</TableHead>
                      <TableHead className="text-xs text-right">म.भ.</TableHead>
                      <TableHead className="text-xs text-right">घ.भ.</TableHead>
                      <TableHead className="text-xs text-right">वै.भ.</TableHead>
                      <TableHead className="text-xs text-right">कपलेली</TableHead>
                      <TableHead className="text-xs text-right">निव्वळ</TableHead>
                      <TableHead className="text-xs">पद्धत</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaries.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">कोणतीही पगार नोंद नाही</TableCell></TableRow>
                    ) : salaries.map(sal => (
                      <TableRow key={sal.id}>
                        <TableCell className="text-sm">
                          {sal.employee?.employeeNameMr || sal.employee?.employeeName || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{monthLabels[sal.month] || sal.month} {sal.year}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sal.basicPay || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sal.da || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sal.hra || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(sal.ma || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">₹{(sal.deductions || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm font-bold">₹{(sal.netPay || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge variant="outline">{paymentModeLabels[sal.paymentMode] || sal.paymentMode}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openSalDialog(sal)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSal(sal.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Salary Dialog */}
          <Dialog open={salDialogOpen} onOpenChange={setSalDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{salEditing ? 'पगार संपादन' : 'नवीन पगार नोंद'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label className="text-xs">कर्मचारी *</Label>
                  <Select value={salForm.employeeId || ''} onValueChange={onSalEmployeeChange}>
                    <SelectTrigger><SelectValue placeholder="कर्मचारी निवडा" /></SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.isActive).map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.employeeNameMr || emp.employeeName} - {emp.designationMr || emp.designation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">महिना *</Label>
                    <Select value={salForm.month || '01'} onValueChange={v => setSalForm(f => ({ ...f, month: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(monthLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">वर्ष *</Label><Input type="number" value={salForm.year || new Date().getFullYear()} onChange={e => setSalForm(f => ({ ...f, year: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">मूळ वेतन</Label><Input type="number" value={salForm.basicPay || 0} onChange={e => setSalForm(f => ({ ...f, basicPay: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">महागाई भत्ता</Label><Input type="number" value={salForm.da || 0} onChange={e => setSalForm(f => ({ ...f, da: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">घरभाडे भत्ता</Label><Input type="number" value={salForm.hra || 0} onChange={e => setSalForm(f => ({ ...f, hra: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">वैद्यकीय भत्ता</Label><Input type="number" value={salForm.ma || 0} onChange={e => setSalForm(f => ({ ...f, ma: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">कपलेली रक्कम</Label><Input type="number" value={salForm.deductions || 0} onChange={e => setSalForm(f => ({ ...f, deductions: Number(e.target.value) }))} /></div>
                </div>
                <div className="bg-muted p-2 rounded text-sm font-medium">
                  निव्वळ वेतन: ₹{calcNetPay().toLocaleString('en-IN')}
                </div>
                <div>
                  <Label className="text-xs">पद्धत</Label>
                  <Select value={salForm.paymentMode || 'bank_transfer'} onValueChange={v => setSalForm(f => ({ ...f, paymentMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">रोख</SelectItem>
                      <SelectItem value="bank_transfer">बँक हस्तांतरण</SelectItem>
                      <SelectItem value="cheque">चेक</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSalDialogOpen(false)}>रद्द करा</Button>
                <Button onClick={saveSal} disabled={saving || !salForm.employeeId}>
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
