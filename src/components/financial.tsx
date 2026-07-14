'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Receipt,
  CreditCard,
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Edit3,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReceiptRecord {
  id: string;
  receiptNo: string;
  receiptDate: string;
  financialYear: string;
  payerName: string;
  payerNameMr?: string;
  amount: number;
  taxType: string;
  paymentMode: string;
  chequeNo?: string;
  bankName?: string;
  description?: string;
  headOfAccount?: string;
  headOfAccountMr?: string;
  voucherNumber?: string;
  receivedFrom?: string;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  voucherNo: string;
  voucherDate: string;
  financialYear: string;
  payeeName: string;
  payeeNameMr?: string;
  amount: number;
  headOfAccount: string;
  headOfAccountMr?: string;
  paymentMode: string;
  chequeNo?: string;
  bankName?: string;
  description?: string;
  paidTo?: string;
  createdAt: string;
}

interface VoucherRecord {
  id: string;
  voucherNo: string;
  voucherDate: string;
  financialYear: string;
  voucherType: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
  createdAt: string;
}

// ─── Component Props ────────────────────────────────────────────────────────

interface FinancialProps {
  financialYear: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('mr-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Financial({ financialYear }: FinancialProps) {
  // ── State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('receipt');

  // Receipts
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);

  // Payments
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // Vouchers
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [vouchersError, setVouchersError] = useState<string | null>(null);

  // Dialog / Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // ── Fetch functions ─────────────────────────────────────────────────────

  const fetchReceipts = useCallback(async () => {
    setReceiptsLoading(true);
    setReceiptsError(null);
    try {
      const res = await fetch(`/api/transactions?type=receipt&financialYear=${encodeURIComponent(financialYear)}`);
      if (!res.ok) throw new Error('API त्रुटी');
      const data = await res.json();
      const records = Array.isArray(data) ? data : (data?.data || []);
      setReceipts(records as ReceiptRecord[]);
    } catch {
      setReceiptsError('प्राप्ती माहिती लोड करताना त्रुटी आली');
    } finally {
      setReceiptsLoading(false);
    }
  }, [financialYear]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const res = await fetch(`/api/transactions?type=payment&financialYear=${encodeURIComponent(financialYear)}`);
      if (!res.ok) throw new Error('API त्रुटी');
      const data = await res.json();
      const records = Array.isArray(data) ? data : (data?.data || []);
      setPayments(records as PaymentRecord[]);
    } catch {
      setPaymentsError('पावती माहिती लोड करताना त्रुटी आली');
    } finally {
      setPaymentsLoading(false);
    }
  }, [financialYear]);

  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    setVouchersError(null);
    try {
      const res = await fetch(`/api/transactions?type=voucher&financialYear=${encodeURIComponent(financialYear)}`);
      if (!res.ok) throw new Error('API त्रुटी');
      const data = await res.json();
      const records = Array.isArray(data) ? data : (data?.data || []);
      setVouchers(records as VoucherRecord[]);
    } catch {
      setVouchersError('जर्नल वाउचर माहिती लोड करताना त्रुटी आली');
    } finally {
      setVouchersLoading(false);
    }
  }, [financialYear]);

  // ── Load data on mount & tab change ─────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'receipt') fetchReceipts();
    else if (activeTab === 'payment') fetchPayments();
    else if (activeTab === 'voucher') fetchVouchers();
  }, [activeTab, fetchReceipts, fetchPayments, fetchVouchers]);

  // ── CRUD Handlers ───────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ financialYear });
    setDialogOpen(true);
  };

  const openEditDialog = (record: Record<string, unknown>) => {
    setEditingId(record.id as string);
    setFormData({ ...record });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const getApiType = (): string => {
    if (activeTab === 'receipt') return 'receipt';
    if (activeTab === 'payment') return 'payment';
    return 'voucher';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const type = getApiType();
      const payload: Record<string, unknown> = {
        action: editingId ? 'update' : 'create',
        ...formData,
        financialYear,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: type, ...payload }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'जतन करताना त्रुटी आली');
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({});

      // Refresh the active tab
      if (activeTab === 'receipt') fetchReceipts();
      else if (activeTab === 'payment') fetchPayments();
      else fetchVouchers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'जतन करताना त्रुटी आली';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const type = getApiType();
      const res = await fetch(`/api/transactions?type=${type}&id=${deletingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('हटवताना त्रुटी आली');

      setDeleteDialogOpen(false);
      setDeletingId(null);

      // Refresh the active tab
      if (activeTab === 'receipt') fetchReceipts();
      else if (activeTab === 'payment') fetchPayments();
      else fetchVouchers();
    } catch {
      alert('हटवताना त्रुटी आली');
    } finally {
      setDeleting(false);
    }
  };

  // ── Form field change handler ───────────────────────────────────────────

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Search filter ───────────────────────────────────────────────────────

  const filterRecords = <T extends Record<string, unknown>>(records: T[]): T[] => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) =>
        v != null && String(v).toLowerCase().includes(term)
      )
    );
  };

  // ── Summary stats ───────────────────────────────────────────────────────

  const receiptTotal = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const paymentTotal = payments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const voucherTotal = vouchers.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // ── Render Receipts Form ────────────────────────────────────────────────

  const renderReceiptForm = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="receiptNo">पावती क्र. *</Label>
        <Input
          id="receiptNo"
          value={(formData.receiptNo as string) || ''}
          onChange={(e) => handleFieldChange('receiptNo', e.target.value)}
          placeholder="पावती क्रमांक"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="receiptDate">दिनांक *</Label>
        <Input
          id="receiptDate"
          type="date"
          value={(formData.receiptDate as string) || ''}
          onChange={(e) => handleFieldChange('receiptDate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payerName">देणाऱ्याचे नाव *</Label>
        <Input
          id="payerName"
          value={(formData.payerName as string) || ''}
          onChange={(e) => handleFieldChange('payerName', e.target.value)}
          placeholder="देणाऱ्याचे नाव"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payerNameMr">मराठीत नाव</Label>
        <Input
          id="payerNameMr"
          value={(formData.payerNameMr as string) || ''}
          onChange={(e) => handleFieldChange('payerNameMr', e.target.value)}
          placeholder="मराठीत नाव"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">रक्कम (₹) *</Label>
        <Input
          id="amount"
          type="number"
          value={(formData.amount as string | number) || ''}
          onChange={(e) => handleFieldChange('amount', e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxType">कर प्रकार</Label>
        <Select
          value={(formData.taxType as string) || ''}
          onValueChange={(v) => handleFieldChange('taxType', v)}
        >
          <SelectTrigger id="taxType">
            <SelectValue placeholder="कर प्रकार निवडा" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="House Tax">गृहकर</SelectItem>
            <SelectItem value="Water Tax">पाणीकर</SelectItem>
            <SelectItem value="Light Tax">दिवाकर</SelectItem>
            <SelectItem value="Health Tax">आरोग्यकर</SelectItem>
            <SelectItem value="Profession Tax">व्यवसायकर</SelectItem>
            <SelectItem value="Other">इतर</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentMode">पद्धत</Label>
        <Select
          value={(formData.paymentMode as string) || ''}
          onValueChange={(v) => handleFieldChange('paymentMode', v)}
        >
          <SelectTrigger id="paymentMode">
            <SelectValue placeholder="पद्धत निवडा" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">रोख</SelectItem>
            <SelectItem value="cheque">चेक</SelectItem>
            <SelectItem value="online">ऑनलाइन</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="headOfAccount">लेखाशीर्षक</Label>
        <Input
          id="headOfAccount"
          value={(formData.headOfAccount as string) || ''}
          onChange={(e) => handleFieldChange('headOfAccount', e.target.value)}
          placeholder="लेखाशीर्षक"
        />
      </div>
      {(formData.paymentMode === 'cheque' || formData.paymentMode === 'Cheque') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="chequeNo">चेक क्र.</Label>
            <Input
              id="chequeNo"
              value={(formData.chequeNo as string) || ''}
              onChange={(e) => handleFieldChange('chequeNo', e.target.value)}
              placeholder="चेक क्रमांक"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">बँक</Label>
            <Input
              id="bankName"
              value={(formData.bankName as string) || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
              placeholder="बँकेचे नाव"
            />
          </div>
        </>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">वर्णन</Label>
        <Textarea
          id="description"
          value={(formData.description as string) || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="वर्णन"
          rows={2}
        />
      </div>
    </div>
  );

  // ── Render Payments Form ────────────────────────────────────────────────

  const renderPaymentForm = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="voucherNo">वाउचर क्र. *</Label>
        <Input
          id="voucherNo"
          value={(formData.voucherNo as string) || ''}
          onChange={(e) => handleFieldChange('voucherNo', e.target.value)}
          placeholder="वाउचर क्रमांक"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="voucherDate">दिनांक *</Label>
        <Input
          id="voucherDate"
          type="date"
          value={(formData.voucherDate as string) || ''}
          onChange={(e) => handleFieldChange('voucherDate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payeeName">प्राप्तकर्ता *</Label>
        <Input
          id="payeeName"
          value={(formData.payeeName as string) || ''}
          onChange={(e) => handleFieldChange('payeeName', e.target.value)}
          placeholder="प्राप्तकर्त्याचे नाव"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payeeNameMr">मराठीत नाव</Label>
        <Input
          id="payeeNameMr"
          value={(formData.payeeNameMr as string) || ''}
          onChange={(e) => handleFieldChange('payeeNameMr', e.target.value)}
          placeholder="मराठीत नाव"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">रक्कम (₹) *</Label>
        <Input
          id="amount"
          type="number"
          value={(formData.amount as string | number) || ''}
          onChange={(e) => handleFieldChange('amount', e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headOfAccount">लेखाशीर्षक *</Label>
        <Input
          id="headOfAccount"
          value={(formData.headOfAccount as string) || ''}
          onChange={(e) => handleFieldChange('headOfAccount', e.target.value)}
          placeholder="लेखाशीर्षक"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentMode">पद्धत</Label>
        <Select
          value={(formData.paymentMode as string) || ''}
          onValueChange={(v) => handleFieldChange('paymentMode', v)}
        >
          <SelectTrigger id="paymentMode">
            <SelectValue placeholder="पद्धत निवडा" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">रोख</SelectItem>
            <SelectItem value="cheque">चेक</SelectItem>
            <SelectItem value="online">ऑनलाइन</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(formData.paymentMode === 'cheque' || formData.paymentMode === 'Cheque') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="chequeNo">चेक क्र.</Label>
            <Input
              id="chequeNo"
              value={(formData.chequeNo as string) || ''}
              onChange={(e) => handleFieldChange('chequeNo', e.target.value)}
              placeholder="चेक क्रमांक"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">बँक</Label>
            <Input
              id="bankName"
              value={(formData.bankName as string) || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
              placeholder="बँकेचे नाव"
            />
          </div>
        </>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">वर्णन</Label>
        <Textarea
          id="description"
          value={(formData.description as string) || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="वर्णन"
          rows={2}
        />
      </div>
    </div>
  );

  // ── Render Voucher Form ─────────────────────────────────────────────────

  const renderVoucherForm = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="voucherNo">वाउचर क्र. *</Label>
        <Input
          id="voucherNo"
          value={(formData.voucherNo as string) || ''}
          onChange={(e) => handleFieldChange('voucherNo', e.target.value)}
          placeholder="वाउचर क्रमांक"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="voucherDate">दिनांक *</Label>
        <Input
          id="voucherDate"
          type="date"
          value={(formData.voucherDate as string) || ''}
          onChange={(e) => handleFieldChange('voucherDate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="voucherType">प्रकार *</Label>
        <Select
          value={(formData.voucherType as string) || ''}
          onValueChange={(v) => handleFieldChange('voucherType', v)}
        >
          <SelectTrigger id="voucherType">
            <SelectValue placeholder="प्रकार निवडा" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Journal">जर्नल</SelectItem>
            <SelectItem value="Contra">कॉन्ट्रा</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">रक्कम (₹) *</Label>
        <Input
          id="amount"
          type="number"
          value={(formData.amount as string | number) || ''}
          onChange={(e) => handleFieldChange('amount', e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="debitAccount">डेबिट खाते *</Label>
        <Input
          id="debitAccount"
          value={(formData.debitAccount as string) || ''}
          onChange={(e) => handleFieldChange('debitAccount', e.target.value)}
          placeholder="डेबिट खाते"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="creditAccount">क्रेडिट खाते *</Label>
        <Input
          id="creditAccount"
          value={(formData.creditAccount as string) || ''}
          onChange={(e) => handleFieldChange('creditAccount', e.target.value)}
          placeholder="क्रेडिट खाते"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="narration">निवेदन</Label>
        <Textarea
          id="narration"
          value={(formData.narration as string) || ''}
          onChange={(e) => handleFieldChange('narration', e.target.value)}
          placeholder="निवेदन / तपशील"
          rows={2}
        />
      </div>
    </div>
  );

  // ── Render Dialog ───────────────────────────────────────────────────────

  const getDialogTitle = () => {
    if (editingId) {
      if (activeTab === 'receipt') return 'प्राप्ती सुधारणा';
      if (activeTab === 'payment') return 'पावती सुधारणा';
      return 'जर्नल वाउचर सुधारणा';
    }
    if (activeTab === 'receipt') return 'नवीन प्राप्ती';
    if (activeTab === 'payment') return 'नवीन पावती';
    return 'नवीन जर्नल वाउचर';
  };

  const renderForm = () => {
    if (activeTab === 'receipt') return renderReceiptForm();
    if (activeTab === 'payment') return renderPaymentForm();
    return renderVoucherForm();
  };

  // ── Loading skeleton ────────────────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  // ── Render Receipts Table ───────────────────────────────────────────────

  const renderReceiptsTab = () => {
    const filtered = filterRecords(receipts);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">प्राप्ती नोंदी</CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {filtered.length} नोंदी
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="शोधा..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button onClick={openAddDialog} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" />
                नवीन प्राप्ती
              </Button>
            </div>
          </div>
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm mt-2 p-2 bg-green-50 rounded-md border border-green-200">
            <IndianRupee className="h-4 w-4 text-green-700" />
            <span className="font-semibold text-green-800">एकूण प्राप्ती: {formatCurrency(receiptTotal)}</span>
            <span className="text-green-600">|</span>
            <span className="text-green-700">वित्तीय वर्ष: {financialYear}</span>
          </div>
        </CardHeader>
        <CardContent>
          {receiptsLoading ? (
            renderSkeleton()
          ) : receiptsError ? (
            <div className="flex items-center gap-2 p-4 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{receiptsError}</span>
              <Button variant="outline" size="sm" onClick={fetchReceipts}>पुन्हा प्रयत्न करा</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>प्राप्तीच्या नोंदी आढळल्या नाहीत</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={openAddDialog}>
                नवीन प्राप्ती जोडा
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">क्र.</TableHead>
                    <TableHead>पावती क्र.</TableHead>
                    <TableHead>दिनांक</TableHead>
                    <TableHead>देणाऱ्याचे नाव</TableHead>
                    <TableHead>रक्कम</TableHead>
                    <TableHead>कर प्रकार</TableHead>
                    <TableHead>पद्धत</TableHead>
                    <TableHead>लेखाशीर्षक</TableHead>
                    <TableHead className="text-right">कृती</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.receiptNo || r.voucherNumber || '—'}</TableCell>
                      <TableCell>{formatDate(r.receiptDate)}</TableCell>
                      <TableCell>{r.payerName || r.receivedFrom || '—'}</TableCell>
                      <TableCell className="font-semibold text-green-700">{formatCurrency(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.taxType || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            r.paymentMode === 'cash'
                              ? 'bg-amber-100 text-amber-800'
                              : r.paymentMode === 'online'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {r.paymentMode === 'cash' ? 'रोख' : r.paymentMode === 'cheque' ? 'चेक' : r.paymentMode === 'online' ? 'ऑनलाइन' : r.paymentMode || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.headOfAccount || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(r as unknown as Record<string, unknown>)}
                            title="सुधारणा"
                          >
                            <Edit3 className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(r.id)}
                            title="हटवा"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Render Payments Table ───────────────────────────────────────────────

  const renderPaymentsTab = () => {
    const filtered = filterRecords(payments);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">पावती नोंदी</CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {filtered.length} नोंदी
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="शोधा..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button onClick={openAddDialog} size="sm" className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-1" />
                नवीन पावती
              </Button>
            </div>
          </div>
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm mt-2 p-2 bg-red-50 rounded-md border border-red-200">
            <IndianRupee className="h-4 w-4 text-red-700" />
            <span className="font-semibold text-red-800">एकूण पेमेंट: {formatCurrency(paymentTotal)}</span>
            <span className="text-red-600">|</span>
            <span className="text-red-700">वित्तीय वर्ष: {financialYear}</span>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            renderSkeleton()
          ) : paymentsError ? (
            <div className="flex items-center gap-2 p-4 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{paymentsError}</span>
              <Button variant="outline" size="sm" onClick={fetchPayments}>पुन्हा प्रयत्न करा</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>पावतीच्या नोंदी आढळल्या नाहीत</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={openAddDialog}>
                नवीन पावती जोडा
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">क्र.</TableHead>
                    <TableHead>वाउचर क्र.</TableHead>
                    <TableHead>दिनांक</TableHead>
                    <TableHead>प्राप्तकर्ता</TableHead>
                    <TableHead>रक्कम</TableHead>
                    <TableHead>लेखाशीर्षक</TableHead>
                    <TableHead>पद्धत</TableHead>
                    <TableHead className="text-right">कृती</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.voucherNo || '—'}</TableCell>
                      <TableCell>{formatDate(r.voucherDate)}</TableCell>
                      <TableCell>{r.payeeName || r.paidTo || '—'}</TableCell>
                      <TableCell className="font-semibold text-red-700">{formatCurrency(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.headOfAccount || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            r.paymentMode === 'cash'
                              ? 'bg-amber-100 text-amber-800'
                              : r.paymentMode === 'online'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {r.paymentMode === 'cash' ? 'रोख' : r.paymentMode === 'cheque' ? 'चेक' : r.paymentMode === 'online' ? 'ऑनलाइन' : r.paymentMode || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(r as unknown as Record<string, unknown>)}
                            title="सुधारणा"
                          >
                            <Edit3 className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(r.id)}
                            title="हटवा"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Render Vouchers Table ───────────────────────────────────────────────

  const renderVouchersTab = () => {
    const filtered = filterRecords(vouchers);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">जर्नल वाउचर नोंदी</CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {filtered.length} नोंदी
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="शोधा..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button onClick={openAddDialog} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-1" />
                नवीन वाउचर
              </Button>
            </div>
          </div>
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm mt-2 p-2 bg-purple-50 rounded-md border border-purple-200">
            <IndianRupee className="h-4 w-4 text-purple-700" />
            <span className="font-semibold text-purple-800">एकूण रक्कम: {formatCurrency(voucherTotal)}</span>
            <span className="text-purple-600">|</span>
            <span className="text-purple-700">वित्तीय वर्ष: {financialYear}</span>
          </div>
        </CardHeader>
        <CardContent>
          {vouchersLoading ? (
            renderSkeleton()
          ) : vouchersError ? (
            <div className="flex items-center gap-2 p-4 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{vouchersError}</span>
              <Button variant="outline" size="sm" onClick={fetchVouchers}>पुन्हा प्रयत्न करा</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <NotebookPen className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>जर्नल वाउचर नोंदी आढळल्या नाहीत</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={openAddDialog}>
                नवीन वाउचर जोडा
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">क्र.</TableHead>
                    <TableHead>वाउचर क्र.</TableHead>
                    <TableHead>दिनांक</TableHead>
                    <TableHead>प्रकार</TableHead>
                    <TableHead>रक्कम</TableHead>
                    <TableHead>डेबिट खाते</TableHead>
                    <TableHead>क्रेडिट खाते</TableHead>
                    <TableHead>निवेदन</TableHead>
                    <TableHead className="text-right">कृती</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.voucherNo || '—'}</TableCell>
                      <TableCell>{formatDate(r.voucherDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            r.voucherType === 'Journal'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-teal-100 text-teal-800'
                          }
                        >
                          {r.voucherType === 'Journal' ? 'जर्नल' : 'कॉन्ट्रा'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-purple-700">{formatCurrency(r.amount)}</TableCell>
                      <TableCell>{r.debitAccount || '—'}</TableCell>
                      <TableCell>{r.creditAccount || '—'}</TableCell>
                      <TableCell className="text-sm max-w-32 truncate">{r.narration || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(r as unknown as Record<string, unknown>)}
                            title="सुधारणा"
                          >
                            <Edit3 className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(r.id)}
                            title="हटवा"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-100">
          <IndianRupee className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold">आर्थिक व्यवहार</h2>
          <p className="text-sm text-muted-foreground">वित्तीय वर्ष: {financialYear}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receipt" className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4" />
            <span>प्राप्ती</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>पावती</span>
          </TabsTrigger>
          <TabsTrigger value="voucher" className="flex items-center gap-1.5">
            <NotebookPen className="h-4 w-4" />
            <span>जर्नल वाउचर</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="mt-4">
          {renderReceiptsTab()}
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          {renderPaymentsTab()}
        </TabsContent>

        <TabsContent value="voucher" className="mt-4">
          {renderVouchersTab()}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{renderForm()}</div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              रद्द करा
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={
                activeTab === 'receipt'
                  ? 'bg-green-600 hover:bg-green-700'
                  : activeTab === 'payment'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }
            >
              {saving ? 'जतन होत आहे...' : editingId ? 'सुधारणा जतन करा' : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>हटवण्याची पुष्टी</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            ही नोंद हटवायची आहे याची खात्री आहे का? ही कृती पूर्ववत करता येणार नाही.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              रद्द करा
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'हटवत आहे...' : 'हटवा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
