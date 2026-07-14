'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, Calculator,
  FileText, Receipt, Landmark, AlertCircle, IndianRupee,
} from 'lucide-react';

// ===== INTERFACES =====

interface PropertyOption {
  id: string;
  propertyNo: string;
  ownerName?: string;
  ownerNameMr?: string;
}

interface TaxAssessmentRecord {
  id: string;
  propertyId: string;
  financialYear: string;
  propertyTax: number;
  waterTax: number;
  lightTax: number;
  professionTax: number;
  miscTax: number;
  totalTax: number;
  concession: number;
  netDemand: number;
  remarks: string | null;
  totalArea: number;
  capitalValue: number;
  taxRatePercent: number;
  houseTaxAmt: number;
  lightTaxAmt: number;
  healthTaxAmt: number;
  waterTaxAmt: number;
  property?: { propertyNo: string; ownerName?: string; ownerNameMr?: string };
  [key: string]: unknown;
}

interface DemandRegisterRecord {
  id: string;
  propertyId: string;
  financialYear: string;
  openingBalance: number;
  totalDemand: number;
  totalCollection: number;
  closingBalance: number;
  penalty: number;
  discount: number;
  currentTax: number;
  previousBalance: number;
  interest: number;
  remarks: string | null;
  property?: { propertyNo: string; ownerName?: string; ownerNameMr?: string };
  [key: string]: unknown;
}

interface TaxPaymentRecord {
  id: string;
  propertyId: string;
  receiptNo: string;
  financialYear: string;
  amount: number;
  amountPaid: number;
  totalDemand: number;
  balance: number;
  paymentDate: string;
  paymentMode: string;
  chequeNo: string | null;
  bankName: string | null;
  collectedBy: string | null;
  remarks: string | null;
  property?: { propertyNo: string; ownerName?: string; ownerNameMr?: string };
  [key: string]: unknown;
}

interface TaxManagementProps {
  financialYear: string;
}

// ===== HELPER =====
function safeExtractData(res: { data?: unknown }): unknown[] {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && typeof res.data === 'object' && Array.isArray((res.data as Record<string, unknown>).data)) {
    return (res.data as Record<string, unknown>).data as unknown[];
  }
  return [];
}

function formatCurrency(val: number | string | null | undefined): string {
  const num = parseFloat(String(val || 0));
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getPropertyLabel(prop: { propertyNo?: string; ownerName?: string; ownerNameMr?: string } | undefined): string {
  if (!prop) return '-';
  return `${prop.propertyNo || '-'}${prop.ownerNameMr ? ` (${prop.ownerNameMr})` : prop.ownerName ? ` (${prop.ownerName})` : ''}`;
}

// ===== MAIN COMPONENT =====

export default function TaxManagement({ financialYear }: TaxManagementProps) {
  // Properties for dropdown
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Tab 1: Tax Assessment
  const [assessments, setAssessments] = useState<TaxAssessmentRecord[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentEditing, setAssessmentEditing] = useState<TaxAssessmentRecord | null>(null);
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    propertyId: '',
    propertyTax: 0, waterTax: 0, lightTax: 0, professionTax: 0, miscTax: 0,
    concession: 0, remarks: '',
    totalArea: 0, capitalValue: 0, taxRatePercent: 0,
    houseTaxAmt: 0, lightTaxAmt: 0, healthTaxAmt: 0, waterTaxAmt: 0,
  });

  // Tab 2: Demand Register
  const [demands, setDemands] = useState<DemandRegisterRecord[]>([]);
  const [demandsLoading, setDemandsLoading] = useState(true);
  const [demandDialogOpen, setDemandDialogOpen] = useState(false);
  const [demandEditing, setDemandEditing] = useState<DemandRegisterRecord | null>(null);
  const [demandSaving, setDemandSaving] = useState(false);
  const [demandForm, setDemandForm] = useState({
    propertyId: '',
    openingBalance: 0, totalDemand: 0, totalCollection: 0,
    penalty: 0, discount: 0, currentTax: 0, previousBalance: 0,
    interest: 0, remarks: '',
  });

  // Tab 3: Tax Payment
  const [payments, setPayments] = useState<TaxPaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentEditing, setPaymentEditing] = useState<TaxPaymentRecord | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    propertyId: '', receiptNo: '',
    amount: 0, amountPaid: 0, totalDemand: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'cash', chequeNo: '', bankName: '',
    collectedBy: '', remarks: '',
  });

  // ===== FETCH PROPERTIES =====
  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const res = await fetch('/api/master?table=property');
      const data = await res.json();
      const records = safeExtractData({ data });
      const mapped = Array.isArray(records)
        ? records.map((p: Record<string, unknown>) => ({
            id: String(p.id || ''),
            propertyNo: String(p.propertyNo || p.propertyNumber || ''),
            ownerName: String(p.ownerName || ''),
            ownerNameMr: String(p.ownerNameMr || ''),
          }))
        : [];
      setProperties(mapped);
    } catch {
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // ===== FETCH ASSESSMENTS =====
  const fetchAssessments = useCallback(async () => {
    setAssessmentsLoading(true);
    try {
      const res = await fetch(`/api/tax-assessment?financialYear=${financialYear}`);
      const data = await res.json();
      const records = safeExtractData(data);
      setAssessments(Array.isArray(records) ? records as TaxAssessmentRecord[] : []);
    } catch {
      setAssessments([]);
    } finally {
      setAssessmentsLoading(false);
    }
  }, [financialYear]);

  // ===== FETCH DEMANDS =====
  const fetchDemands = useCallback(async () => {
    setDemandsLoading(true);
    try {
      const res = await fetch(`/api/demand?financialYear=${financialYear}`);
      const data = await res.json();
      const records = safeExtractData(data);
      setDemands(Array.isArray(records) ? records as DemandRegisterRecord[] : []);
    } catch {
      setDemands([]);
    } finally {
      setDemandsLoading(false);
    }
  }, [financialYear]);

  // ===== FETCH PAYMENTS =====
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch(`/api/tax-payment?financialYear=${financialYear}`);
      const data = await res.json();
      const records = safeExtractData(data);
      setPayments(Array.isArray(records) ? records as TaxPaymentRecord[] : []);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [financialYear]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchAssessments();
    fetchDemands();
    fetchPayments();
  }, [fetchAssessments, fetchDemands, fetchPayments]);

  // ===== AUTO-CALCULATE ASSESSMENT =====
  const assessmentTotalTax = assessmentForm.propertyTax + assessmentForm.waterTax + assessmentForm.lightTax + assessmentForm.professionTax + assessmentForm.miscTax;
  const assessmentNetDemand = assessmentTotalTax - assessmentForm.concession;

  // ===== AUTO-CALCULATE DEMAND =====
  const demandClosingBalance = assessmentForm ? 
    demandForm.openingBalance + demandForm.totalDemand - demandForm.totalCollection + demandForm.penalty + demandForm.interest - demandForm.discount : 0;

  // ===== AUTO-CALCULATE PAYMENT =====
  const paymentBalance = paymentForm.totalDemand - paymentForm.amountPaid;

  // ===== ASSESSMENT CRUD =====
  const openAssessmentDialog = (record?: TaxAssessmentRecord) => {
    if (record) {
      setAssessmentEditing(record);
      setAssessmentForm({
        propertyId: record.propertyId,
        propertyTax: record.propertyTax || 0,
        waterTax: record.waterTax || 0,
        lightTax: record.lightTax || 0,
        professionTax: record.professionTax || 0,
        miscTax: record.miscTax || 0,
        concession: record.concession || 0,
        remarks: record.remarks || '',
        totalArea: record.totalArea || 0,
        capitalValue: record.capitalValue || 0,
        taxRatePercent: record.taxRatePercent || 0,
        houseTaxAmt: record.houseTaxAmt || 0,
        lightTaxAmt: record.lightTaxAmt || 0,
        healthTaxAmt: record.healthTaxAmt || 0,
        waterTaxAmt: record.waterTaxAmt || 0,
      });
    } else {
      setAssessmentEditing(null);
      setAssessmentForm({
        propertyId: '', propertyTax: 0, waterTax: 0, lightTax: 0,
        professionTax: 0, miscTax: 0, concession: 0, remarks: '',
        totalArea: 0, capitalValue: 0, taxRatePercent: 0,
        houseTaxAmt: 0, lightTaxAmt: 0, healthTaxAmt: 0, waterTaxAmt: 0,
      });
    }
    setAssessmentDialogOpen(true);
  };

  const saveAssessment = async () => {
    if (!assessmentForm.propertyId) {
      toast({ title: 'त्रुटी', description: 'कृपया मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setAssessmentSaving(true);
    try {
      const body = {
        ...(assessmentEditing ? { id: assessmentEditing.id } : {}),
        ...assessmentForm,
        financialYear,
      };
      const res = await fetch('/api/tax-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: assessmentEditing ? 'कर आकारणी अपडेट झाली' : 'कर आकारणी जोडली' });
        setAssessmentDialogOpen(false);
        fetchAssessments();
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'जतन करण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'कर आकारणी जतन करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setAssessmentSaving(false);
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm('ही कर आकारणी खात्रीने हटवायची आहे का?')) return;
    try {
      const res = await fetch(`/api/tax-assessment?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: 'कर आकारणी हटवली' });
        fetchAssessments();
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'हटवण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'हटवण्यात अयशस्वी', variant: 'destructive' });
    }
  };

  // ===== DEMAND CRUD =====
  const openDemandDialog = (record?: DemandRegisterRecord) => {
    if (record) {
      setDemandEditing(record);
      setDemandForm({
        propertyId: record.propertyId,
        openingBalance: record.openingBalance || 0,
        totalDemand: record.totalDemand || 0,
        totalCollection: record.totalCollection || 0,
        penalty: record.penalty || 0,
        discount: record.discount || 0,
        currentTax: record.currentTax || 0,
        previousBalance: record.previousBalance || 0,
        interest: record.interest || 0,
        remarks: record.remarks || '',
      });
    } else {
      setDemandEditing(null);
      setDemandForm({
        propertyId: '', openingBalance: 0, totalDemand: 0, totalCollection: 0,
        penalty: 0, discount: 0, currentTax: 0, previousBalance: 0,
        interest: 0, remarks: '',
      });
    }
    setDemandDialogOpen(true);
  };

  const saveDemand = async () => {
    if (!demandForm.propertyId) {
      toast({ title: 'त्रुटी', description: 'कृपया मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setDemandSaving(true);
    try {
      const body = {
        ...(demandEditing ? { id: demandEditing.id } : {}),
        ...demandForm,
        financialYear,
      };
      const res = await fetch('/api/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: demandEditing ? 'मागणी रजिस्टर अपडेट झाला' : 'मागणी रजिस्टर जोडला' });
        setDemandDialogOpen(false);
        fetchDemands();
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'जतन करण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'मागणी रजिस्टर जतन करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setDemandSaving(false);
    }
  };

  const deleteDemand = async (id: string) => {
    if (!confirm('हा मागणी रजिस्टर खात्रीने हटवायचा आहे का?')) return;
    try {
      const res = await fetch(`/api/demand?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: 'मागणी रजिस्टर हटवला' });
        fetchDemands();
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'हटवण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'हटवण्यात अयशस्वी', variant: 'destructive' });
    }
  };

  // ===== PAYMENT CRUD =====
  const openPaymentDialog = (record?: TaxPaymentRecord) => {
    if (record) {
      setPaymentEditing(record);
      setPaymentForm({
        propertyId: record.propertyId,
        receiptNo: record.receiptNo || '',
        amount: record.amount || 0,
        amountPaid: record.amountPaid || 0,
        totalDemand: record.totalDemand || 0,
        paymentDate: record.paymentDate ? new Date(record.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMode: record.paymentMode || 'cash',
        chequeNo: record.chequeNo || '',
        bankName: record.bankName || '',
        collectedBy: record.collectedBy || '',
        remarks: record.remarks || '',
      });
    } else {
      setPaymentEditing(null);
      setPaymentForm({
        propertyId: '', receiptNo: '',
        amount: 0, amountPaid: 0, totalDemand: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'cash', chequeNo: '', bankName: '',
        collectedBy: '', remarks: '',
      });
    }
    setPaymentDialogOpen(true);
  };

  const savePayment = async () => {
    if (!paymentForm.propertyId) {
      toast({ title: 'त्रुटी', description: 'कृपया मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setPaymentSaving(true);
    try {
      const body = {
        ...(paymentEditing ? { id: paymentEditing.id } : {}),
        ...paymentForm,
        financialYear,
      };
      const res = await fetch('/api/tax-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: paymentEditing ? 'कर वसूल अपडेट झाली' : 'कर वसूल जोडली' });
        setPaymentDialogOpen(false);
        fetchPayments();
        fetchDemands(); // Refresh demand to see updated collection
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'जतन करण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'कर वसूल जतन करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setPaymentSaving(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('ही कर वसूल खात्रीने हटवायची आहे का?')) return;
    try {
      const res = await fetch(`/api/tax-payment?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'यशस्वी', description: 'कर वसूल हटवली' });
        fetchPayments();
        fetchDemands();
      } else {
        toast({ title: 'त्रुटी', description: data.error || 'हटवण्यात अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'हटवण्यात अयशस्वी', variant: 'destructive' });
    }
  };

  // ===== SUMMARY STATS =====
  const totalAssessmentNetDemand = assessments.reduce((s, a) => s + (a.netDemand || 0), 0);
  const totalDemandClosingBalance = demands.reduce((s, d) => s + (d.closingBalance || 0), 0);
  const totalPaymentsCollected = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calculator className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">एकूण निव्वळ मागणी</p>
                <p className="text-lg font-bold">{formatCurrency(totalAssessmentNetDemand)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">शेवटची शिल्लक</p>
                <p className="text-lg font-bold">{formatCurrency(totalDemandClosingBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <IndianRupee className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">एकूण वसूल</p>
                <p className="text-lg font-bold">{formatCurrency(totalPaymentsCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="w-full flex-wrap mb-4">
              <TabsTrigger value="assessment" className="flex-1 text-xs sm:text-sm">
                <Calculator className="h-4 w-4 mr-1" /> कर आकारणी
              </TabsTrigger>
              <TabsTrigger value="demand" className="flex-1 text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1" /> मागणी रजिस्टर
              </TabsTrigger>
              <TabsTrigger value="collection" className="flex-1 text-xs sm:text-sm">
                <Landmark className="h-4 w-4 mr-1" /> कर वसूल
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB 1: कर आकारणी ===== */}
            <TabsContent value="assessment">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <h3 className="text-lg font-semibold">कर आकारणी ({financialYear})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchAssessments} disabled={assessmentsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${assessmentsLoading ? 'animate-spin' : ''}`} /> रिफ्रेश
                  </Button>
                  <Button size="sm" onClick={() => openAssessmentDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> नवीन आकारणी
                  </Button>
                </div>
              </div>

              {assessmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !Array.isArray(assessments) || assessments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>कर आकारणी डेटा उपलब्ध नाही</p>
                  <p className="text-sm">नवीन आकारणी जोडण्यासाठी वरील बटण वापरा</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">क्र.</TableHead>
                        <TableHead>मालमत्ता</TableHead>
                        <TableHead className="text-right">संपत्ती कर</TableHead>
                        <TableHead className="text-right">पाणी कर</TableHead>
                        <TableHead className="text-right">दिवाबत्ती कर</TableHead>
                        <TableHead className="text-right">एकूण कर</TableHead>
                        <TableHead className="text-right">सवलत</TableHead>
                        <TableHead className="text-right">निव्वळ मागणी</TableHead>
                        <TableHead className="text-center w-24">कृती</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map((rec, idx) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{getPropertyLabel(rec.property as PropertyOption & { propertyNo: string })}</div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.propertyTax)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.waterTax)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.lightTax)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(rec.totalTax)}</TableCell>
                          <TableCell className="text-right text-emerald-600">-{formatCurrency(rec.concession)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(rec.netDemand)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAssessmentDialog(rec)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAssessment(rec.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ===== TAB 2: मागणी रजिस्टर ===== */}
            <TabsContent value="demand">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <h3 className="text-lg font-semibold">मागणी रजिस्टर ({financialYear})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchDemands} disabled={demandsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${demandsLoading ? 'animate-spin' : ''}`} /> रिफ्रेश
                  </Button>
                  <Button size="sm" onClick={() => openDemandDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> नवीन मागणी
                  </Button>
                </div>
              </div>

              {demandsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !Array.isArray(demands) || demands.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>मागणी रजिस्टर डेटा उपलब्ध नाही</p>
                  <p className="text-sm">नवीन मागणी जोडण्यासाठी वरील बटण वापरा</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">क्र.</TableHead>
                        <TableHead>मालमत्ता</TableHead>
                        <TableHead className="text-right">आरंभी शिल्लक</TableHead>
                        <TableHead className="text-right">एकूण मागणी</TableHead>
                        <TableHead className="text-right">एकूण वसूल</TableHead>
                        <TableHead className="text-right">दंड</TableHead>
                        <TableHead className="text-right">व्याज</TableHead>
                        <TableHead className="text-right">सूट</TableHead>
                        <TableHead className="text-right">शेवटची शिल्लक</TableHead>
                        <TableHead className="text-center w-24">कृती</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demands.map((rec, idx) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{getPropertyLabel(rec.property as PropertyOption & { propertyNo: string })}</div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.openingBalance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.totalDemand)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(rec.totalCollection)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(rec.penalty)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(rec.interest)}</TableCell>
                          <TableCell className="text-right text-emerald-600">-{formatCurrency(rec.discount)}</TableCell>
                          <TableCell className="text-right font-bold">
                            <Badge variant={rec.closingBalance > 0 ? 'destructive' : 'default'}>
                              {formatCurrency(rec.closingBalance)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDemandDialog(rec)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDemand(rec.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ===== TAB 3: कर वसूल ===== */}
            <TabsContent value="collection">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <h3 className="text-lg font-semibold">कर वसूल ({financialYear})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchPayments} disabled={paymentsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${paymentsLoading ? 'animate-spin' : ''}`} /> रिफ्रेश
                  </Button>
                  <Button size="sm" onClick={() => openPaymentDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> नवीन वसूल
                  </Button>
                </div>
              </div>

              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !Array.isArray(payments) || payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>कर वसूल डेटा उपलब्ध नाही</p>
                  <p className="text-sm">नवीन वसूल जोडण्यासाठी वरील बटण वापरा</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">क्र.</TableHead>
                        <TableHead>पावती क्र.</TableHead>
                        <TableHead>मालमत्ता</TableHead>
                        <TableHead className="text-right">एकूण मागणी</TableHead>
                        <TableHead className="text-right">भरलेली रक्कम</TableHead>
                        <TableHead className="text-right">शिल्लक</TableHead>
                        <TableHead>दिनांक</TableHead>
                        <TableHead>पद्धत</TableHead>
                        <TableHead className="text-center w-24">कृती</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((rec, idx) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{rec.receiptNo}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{getPropertyLabel(rec.property as PropertyOption & { propertyNo: string })}</div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(rec.totalDemand)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(rec.amountPaid)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={rec.balance > 0 ? 'destructive' : 'default'}>
                              {formatCurrency(rec.balance)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString('mr-IN') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {rec.paymentMode === 'cash' ? 'रोख' : rec.paymentMode === 'cheque' ? 'चेक' : 'ऑनलाइन'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPaymentDialog(rec)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePayment(rec.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ===== DIALOG: TAX ASSESSMENT ===== */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {assessmentEditing ? 'कर आकारणी संपादन' : 'नवीन कर आकारणी'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Property Select */}
            <div className="sm:col-span-2">
              <Label>मालमत्ता *</Label>
              <Select value={assessmentForm.propertyId} onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder="मालमत्ता निवडा" /></SelectTrigger>
                <SelectContent>
                  {propertiesLoading ? (
                    <SelectItem value="_loading" disabled>लोड होत आहे...</SelectItem>
                  ) : properties.length === 0 ? (
                    <SelectItem value="_empty" disabled>मालमत्ता उपलब्ध नाही</SelectItem>
                  ) : (
                    properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyNo}{p.ownerNameMr ? ` (${p.ownerNameMr})` : p.ownerName ? ` (${p.ownerName})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Details */}
            <div>
              <Label>एकूण क्षेत्रफळ</Label>
              <Input type="number" value={assessmentForm.totalArea || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, totalArea: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>भांडवली मूल्य</Label>
              <Input type="number" value={assessmentForm.capitalValue || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, capitalValue: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>कर दर %</Label>
              <Input type="number" step="0.01" value={assessmentForm.taxRatePercent || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, taxRatePercent: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>

            {/* Tax Breakdown */}
            <div className="sm:col-span-2 mt-2">
              <p className="font-semibold text-sm border-b pb-1 mb-2">कर तपशील</p>
            </div>
            <div>
              <Label>संपत्ती कर</Label>
              <Input type="number" value={assessmentForm.propertyTax || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, propertyTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>पाणी कर</Label>
              <Input type="number" value={assessmentForm.waterTax || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, waterTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>दिवाबत्ती कर</Label>
              <Input type="number" value={assessmentForm.lightTax || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, lightTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>व्यवसाय कर</Label>
              <Input type="number" value={assessmentForm.professionTax || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, professionTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>इतर कर</Label>
              <Input type="number" value={assessmentForm.miscTax || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, miscTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>सवलत</Label>
              <Input type="number" value={assessmentForm.concession || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, concession: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>

            {/* Individual Tax Amounts */}
            <div className="sm:col-span-2 mt-2">
              <p className="font-semibold text-sm border-b pb-1 mb-2">वैयक्तिक कर रक्कम</p>
            </div>
            <div>
              <Label>घरकर रक्कम</Label>
              <Input type="number" value={assessmentForm.houseTaxAmt || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, houseTaxAmt: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>दिवाबत्ती कर रक्कम</Label>
              <Input type="number" value={assessmentForm.lightTaxAmt || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, lightTaxAmt: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>आरोग्य कर रक्कम</Label>
              <Input type="number" value={assessmentForm.healthTaxAmt || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, healthTaxAmt: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>पाणी कर रक्कम</Label>
              <Input type="number" value={assessmentForm.waterTaxAmt || ''} onChange={(e) => setAssessmentForm(prev => ({ ...prev, waterTaxAmt: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>

            {/* Auto-Calculated Totals */}
            <div className="sm:col-span-2 mt-2 bg-muted/50 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>एकूण कर:</span>
                <span className="font-bold">{formatCurrency(assessmentTotalTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>सवलत:</span>
                <span className="text-emerald-600">-{formatCurrency(assessmentForm.concession)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1">
                <span className="font-semibold">निव्वळ मागणी:</span>
                <span className="font-bold text-lg">{formatCurrency(assessmentNetDemand)}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>शेरा</Label>
              <Input value={assessmentForm.remarks} onChange={(e) => setAssessmentForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="शेरा" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>रद्द करा</Button>
            <Button onClick={saveAssessment} disabled={assessmentSaving}>
              {assessmentSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> जतन होत आहे...</> : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: DEMAND REGISTER ===== */}
      <Dialog open={demandDialogOpen} onOpenChange={setDemandDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {demandEditing ? 'मागणी रजिस्टर संपादन' : 'नवीन मागणी रजिस्टर'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Property Select */}
            <div className="sm:col-span-2">
              <Label>मालमत्ता *</Label>
              <Select value={demandForm.propertyId} onValueChange={(v) => setDemandForm(prev => ({ ...prev, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder="मालमत्ता निवडा" /></SelectTrigger>
                <SelectContent>
                  {propertiesLoading ? (
                    <SelectItem value="_loading" disabled>लोड होत आहे...</SelectItem>
                  ) : properties.length === 0 ? (
                    <SelectItem value="_empty" disabled>मालमत्ता उपलब्ध नाही</SelectItem>
                  ) : (
                    properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyNo}{p.ownerNameMr ? ` (${p.ownerNameMr})` : p.ownerName ? ` (${p.ownerName})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>आरंभी शिल्लक</Label>
              <Input type="number" value={demandForm.openingBalance || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>मागील शिल्लक</Label>
              <Input type="number" value={demandForm.previousBalance || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, previousBalance: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>चालू कर</Label>
              <Input type="number" value={demandForm.currentTax || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, currentTax: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>एकूण मागणी</Label>
              <Input type="number" value={demandForm.totalDemand || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, totalDemand: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>एकूण वसूल</Label>
              <Input type="number" value={demandForm.totalCollection || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, totalCollection: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>दंड</Label>
              <Input type="number" value={demandForm.penalty || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, penalty: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>व्याज</Label>
              <Input type="number" value={demandForm.interest || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, interest: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>सूट</Label>
              <Input type="number" value={demandForm.discount || ''} onChange={(e) => setDemandForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>

            {/* Auto-Calculated Closing Balance */}
            <div className="sm:col-span-2 mt-2 bg-muted/50 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>आरंभी शिल्लक:</span>
                <span>{formatCurrency(demandForm.openingBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+ एकूण मागणी:</span>
                <span>{formatCurrency(demandForm.totalDemand)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>- एकूण वसूल:</span>
                <span className="text-emerald-600">{formatCurrency(demandForm.totalCollection)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+ दंड:</span>
                <span className="text-amber-600">{formatCurrency(demandForm.penalty)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>+ व्याज:</span>
                <span className="text-amber-600">{formatCurrency(demandForm.interest)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>- सूट:</span>
                <span className="text-emerald-600">{formatCurrency(demandForm.discount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1">
                <span className="font-semibold">शेवटची शिल्लक:</span>
                <span className="font-bold text-lg">{formatCurrency(demandClosingBalance)}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>शेरा</Label>
              <Input value={demandForm.remarks} onChange={(e) => setDemandForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="शेरा" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDemandDialogOpen(false)}>रद्द करा</Button>
            <Button onClick={saveDemand} disabled={demandSaving}>
              {demandSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> जतन होत आहे...</> : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: TAX PAYMENT ===== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {paymentEditing ? 'कर वसूल संपादन' : 'नवीन कर वसूल'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Property Select */}
            <div className="sm:col-span-2">
              <Label>मालमत्ता *</Label>
              <Select value={paymentForm.propertyId} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder="मालमत्ता निवडा" /></SelectTrigger>
                <SelectContent>
                  {propertiesLoading ? (
                    <SelectItem value="_loading" disabled>लोड होत आहे...</SelectItem>
                  ) : properties.length === 0 ? (
                    <SelectItem value="_empty" disabled>मालमत्ता उपलब्ध नाही</SelectItem>
                  ) : (
                    properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyNo}{p.ownerNameMr ? ` (${p.ownerNameMr})` : p.ownerName ? ` (${p.ownerName})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>पावती क्र.</Label>
              <Input
                value={paymentForm.receiptNo}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, receiptNo: e.target.value }))}
                placeholder="स्वयं-निर्मित"
                disabled={!!paymentEditing}
              />
              {!paymentEditing && <p className="text-xs text-muted-foreground mt-1">रिकामे सोडल्यास स्वयं-निर्मित होईल</p>}
            </div>
            <div>
              <Label>दिनांक</Label>
              <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))} />
            </div>
            <div>
              <Label>एकूण मागणी</Label>
              <Input type="number" value={paymentForm.totalDemand || ''} onChange={(e) => setPaymentForm(prev => ({ ...prev, totalDemand: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>रक्कम</Label>
              <Input type="number" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>
            <div>
              <Label>भरलेली रक्कम</Label>
              <Input type="number" value={paymentForm.amountPaid || ''} onChange={(e) => setPaymentForm(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))} placeholder="0" />
            </div>

            {/* Auto-Calculated Balance */}
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>एकूण मागणी:</span>
                <span>{formatCurrency(paymentForm.totalDemand)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>- भरलेली रक्कम:</span>
                <span className="text-emerald-600">{formatCurrency(paymentForm.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1">
                <span className="font-semibold">शिल्लक:</span>
                <span className="font-bold text-lg">{formatCurrency(paymentBalance)}</span>
              </div>
            </div>

            <div className="sm:col-span-2 mt-2">
              <p className="font-semibold text-sm border-b pb-1 mb-2">पेमेंट तपशील</p>
            </div>

            <div>
              <Label>पद्धत</Label>
              <Select value={paymentForm.paymentMode} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, paymentMode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">रोख</SelectItem>
                  <SelectItem value="cheque">चेक</SelectItem>
                  <SelectItem value="online">ऑनलाइन</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentForm.paymentMode === 'cheque' && (
              <>
                <div>
                  <Label>चेक क्र.</Label>
                  <Input value={paymentForm.chequeNo} onChange={(e) => setPaymentForm(prev => ({ ...prev, chequeNo: e.target.value }))} placeholder="चेक क्रमांक" />
                </div>
                <div>
                  <Label>बँकेचे नाव</Label>
                  <Input value={paymentForm.bankName} onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))} placeholder="बँकेचे नाव" />
                </div>
              </>
            )}

            <div>
              <Label>वसूल करणारे</Label>
              <Input value={paymentForm.collectedBy} onChange={(e) => setPaymentForm(prev => ({ ...prev, collectedBy: e.target.value }))} placeholder="वसूल करणाऱ्याचे नाव" />
            </div>
            <div>
              <Label>शेरा</Label>
              <Input value={paymentForm.remarks} onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="शेरा" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>रद्द करा</Button>
            <Button onClick={savePayment} disabled={paymentSaving}>
              {paymentSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> जतन होत आहे...</> : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
