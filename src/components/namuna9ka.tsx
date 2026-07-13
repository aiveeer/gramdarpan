'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Printer, RefreshCw, Search, CreditCard, FileText,
  IndianRupee, CheckCircle2, AlertCircle, Wallet,
  ArrowRight, User, Building2, Phone, Hash,
  ChevronDown, Receipt, CircleDollarSign, Scale,
  HandCoins, Clock
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OwnerInfo {
  owner: {
    firstName: string; lastName: string;
    firstNameMr: string; lastNameMr: string;
    mobileNumber: string | null;
  };
  ownershipType: string;
}

interface PropertyInfo {
  id: string;
  propertyNumber: string;
  area: number | null;
  constructionType: string | null;
  usageType: string | null;
  ward?: { wardNameMr: string };
  road?: { roadNameMr: string };
  owners: OwnerInfo[];
}

interface PaymentInfo {
  id: string;
  namuna9Id: string;
  amountPaid: number;
  balance: number;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  property: PropertyInfo;
  namuna9: { totalDemand: number };
}

interface Namuna9Info {
  id: string;
  propertyId: string;
  financialYear: string;
  totalDemand: number;
  currentTax: number;
  previousBalance: number;
  penalty: number;
  interest: number;
  payments: PaymentInfo[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getOwnerName = (prop: PropertyInfo | null | undefined) => {
  if (!prop?.owners?.length) return '-';
  const owner = prop.owners.find(o => o.ownershipType === 'मालक') || prop.owners[0];
  return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
};

const getOwnerMobile = (prop: PropertyInfo | null | undefined) => {
  if (!prop?.owners?.length) return '-';
  const owner = prop.owners.find(o => o.ownershipType === 'मालक') || prop.owners[0];
  return owner.owner.mobileNumber || '-';
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('mr-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('mr-IN', { year: 'numeric', month: 'long', day: 'numeric' });

const paymentMethodLabel: Record<string, string> = {
  Cash: 'रोख',
  Cheque: 'चेक',
  Online: 'ऑनलाइन',
  DD: 'डिमांड ड्राफ्ट',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Namuna9KaComponent() {
  const [namuna9Records, setNamuna9Records] = useState<Namuna9Info[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PropertyInfo[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedNamuna9Id, setSelectedNamuna9Id] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paying, setPaying] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PaymentInfo | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [allPayments, setAllPayments] = useState<PaymentInfo[]>([]);

  /* ---- data fetch ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [n9Res, propRes, payRes] = await Promise.all([
        fetch('/api/namuna9'),
        fetch('/api/master?table=property'),
        fetch('/api/payment'),
      ]);
      const n9Data = await n9Res.json();
      setNamuna9Records(Array.isArray(n9Data) ? n9Data : []);
      const propData = await propRes.json();
      setProperties(Array.isArray(propData) ? propData : []);
      const payData = await payRes.json();
      setAllPayments(Array.isArray(payData) ? payData : []);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करता आला नाही', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- search ---- */
  const handleSearch = async () => {
    if (!searchQuery.trim()) { toast({ title: 'शोधा', description: 'कृपया शोध शब्द टाका', variant: 'destructive' }); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/namuna9?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
        handlePropertySelect(data[0].id, data);
      }
    } catch {
      toast({ title: 'त्रुटी', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  /* ---- property select ---- */
  const handlePropertySelect = (propId: string, overrideResults?: PropertyInfo[]) => {
    setSelectedPropertyId(propId);
    const n9 = namuna9Records.find(n => n.propertyId === propId);
    if (n9) {
      setSelectedNamuna9Id(n9.id);
      const totalPaid = n9.payments.reduce((s, p) => s + p.amountPaid, 0);
      setPaymentAmount((n9.totalDemand - totalPaid).toFixed(2));
    }
  };

  /* ---- outstanding calculation ---- */
  const getOutstanding = (propertyId: string) => {
    const recs = namuna9Records.filter(n => n.propertyId === propertyId);
    const totalDemand = recs.reduce((s, n) => s + n.totalDemand, 0);
    const totalPaid = recs.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
    return { totalDemand, totalPaid, balance: totalDemand - totalPaid };
  };

  const outstandingInfo = selectedPropertyId ? getOutstanding(selectedPropertyId) : null;
  const selectedProp = properties.find(p => p.id === selectedPropertyId) || searchResults.find(p => p.id === selectedPropertyId);

  /* ---- pay ---- */
  const handlePay = async () => {
    if (!selectedPropertyId || !selectedNamuna9Id || !paymentAmount) {
      toast({ title: 'त्रुटी', description: 'सर्व माहिती भरा', variant: 'destructive' });
      return;
    }
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: 'त्रुटी', description: 'वैध रक्कम टाका', variant: 'destructive' });
      return;
    }
    if (outstandingInfo && amt > outstandingInfo.balance) {
      toast({ title: 'त्रुटी', description: `शिल्लक रक्कम ${formatCurrency(outstandingInfo.balance)} पेक्षा जास्त भरू शकत नाही`, variant: 'destructive' });
      return;
    }
    setPaying(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId, namuna9Id: selectedNamuna9Id, amountPaid: amt, paymentMethod }),
      });
      if (res.ok) {
        const payment = await res.json();
        setLastReceipt(payment);
        setReceiptDialogOpen(true);
        toast({ title: '✅ यशस्वी!', description: 'पावती तयार झाली' });
        setPaymentAmount('');
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error || 'पेमेंट अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'सर्व्हर त्रुटी', variant: 'destructive' });
    } finally {
      setPaying(false);
    }
  };

  /* ---- print receipt ---- */
  const handlePrintReceipt = (payment: PaymentInfo) => {
    const prop = payment.property;
    const ownerName = getOwnerName(prop);
    const mobile = getOwnerMobile(prop);
    const wardName = prop?.ward?.wardNameMr || '-';

    const printContent = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना ९-क पावती</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans Devanagari',Arial,sans-serif;margin:0;padding:20px;background:#fff;color:#1a1a1a}
  .receipt-box{max-width:750px;margin:0 auto;border:3px double #333;padding:0;overflow:hidden}
  .flag-bar{height:8px;background:linear-gradient(90deg,#FF9933 33%,#fff 33%,#fff 66%,#138808 66%)}
  .header{background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-align:center;padding:14px 20px}
  .header h1{font-size:22px;margin:0;letter-spacing:1px}
  .header h2{font-size:14px;font-weight:400;margin:3px 0 0;opacity:.9}
  .body-area{padding:20px 24px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:14px}
  .info-item{font-size:13px;padding:3px 0}
  .info-item strong{display:inline-block;min-width:140px;color:#555}
  .divider{border:none;border-top:1px dashed #999;margin:14px 0}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{border:1px solid #333;padding:9px 10px;font-size:13px;text-align:left}
  th{background:#f5f5f5;font-weight:600}
  .amt{text-align:right;font-family:monospace}
  .received-box{background:#e8f5e9;border:2px solid #27ae60;border-radius:6px;padding:12px;text-align:center;margin:14px 0}
  .received-box .label{font-size:13px;color:#555}
  .received-box .value{font-size:28px;font-weight:700;color:#1b7a3d;margin-top:2px}
  .balance-box{background:#fdedec;border:2px solid #e74c3c;border-radius:6px;padding:10px;text-align:center;margin:10px 0}
  .balance-box .label{font-size:13px;color:#555}
  .balance-box .value{font-size:22px;font-weight:700;color:#c0392b;margin-top:2px}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;font-size:12px;color:#666}
  .sig-area{width:140px;text-align:center}
  .sig-line{border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:12px;font-weight:600;color:#333}
  @media print{body{margin:0;padding:0}.receipt-box{border:3px double #333}}
</style></head><body>
<div class="receipt-box">
  <div class="flag-bar"></div>
  <div class="header">
    <h1>नमुना ९-क — पावती</h1>
    <h2>मालमत्ता कर प्राप्ती पावती (Property Tax Receipt)</h2>
  </div>
  <div class="body-area">
    <div class="info-grid">
      <div class="info-item"><strong>पावती क्रमांक:</strong> ${payment.receiptNumber}</div>
      <div class="info-item"><strong>दिनांक:</strong> ${formatDate(payment.paymentDate)}</div>
      <div class="info-item"><strong>मालमत्ता क्र.:</strong> ${prop?.propertyNumber || '-'}</div>
      <div class="info-item"><strong>मालक:</strong> ${ownerName}</div>
      <div class="info-item"><strong>मोबाईल:</strong> ${mobile}</div>
      <div class="info-item"><strong>वार्ड:</strong> ${wardName}</div>
      <div class="info-item"><strong>पद्धत:</strong> ${paymentMethodLabel[payment.paymentMethod] || payment.paymentMethod}</div>
      <div class="info-item"><strong>वित्तीय वर्ष:</strong> ${payment.namuna9?.financialYear || '-'}</div>
    </div>
    <hr class="divider">
    <table>
      <thead><tr><th>वर्णन (Description)</th><th class="amt">रक्कम (₹)</th></tr></thead>
      <tbody>
        <tr><td>एकूण मागणी (Total Demand)</td><td class="amt">${formatCurrency(payment.namuna9?.totalDemand || 0)}</td></tr>
        <tr><td>प्राप्त रक्कम (Received Amount)</td><td class="amt" style="font-weight:700;color:#1b7a3d">${formatCurrency(payment.amountPaid)}</td></tr>
        <tr><td>शिल्लक रक्कम (Balance)</td><td class="amt" style="font-weight:700;color:#c0392b">${formatCurrency(payment.balance)}</td></tr>
      </tbody>
    </table>
    <div class="received-box">
      <div class="label">प्राप्त रक्कम (Received Amount)</div>
      <div class="value">${formatCurrency(payment.amountPaid)}</div>
    </div>
    <div class="balance-box">
      <div class="label">शिल्लक (Balance Outstanding)</div>
      <div class="value">${formatCurrency(payment.balance)}</div>
    </div>
    <div class="footer">
      <div class="sig-area"><div class="sig-line">मालकाची सही</div></div>
      <div style="font-size:11px;color:#999;text-align:center">ही पावती संगणकीय तयार केलेली आहे</div>
      <div class="sig-area"><div class="sig-line">अधिकृत सही व मुद्रा</div></div>
    </div>
  </div>
  <div class="flag-bar"></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.focus(); }
  };

  /* ---- render ---- */
  return (
    <div className="space-y-6">
      {/* ========== HEADER CARD ========== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="relative" style={{ background: 'linear-gradient(135deg, #be123c, #e11d48, #c0392b)' }}>
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #fff, #fecdd3)' }}>
                <Receipt className="h-9 w-9 text-rose-700" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">नमुना ९-क</h1>
                <h2 className="text-base sm:text-lg text-rose-100 font-medium">पावती / Receipt — मालमत्ता कर प्राप्ती</h2>
                <p className="text-xs text-rose-200/70 mt-1">Property Tax Payment Receipt Generation</p>
              </div>
              <div className="hidden md:flex flex-col items-end gap-1">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('mr-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  वित्तीय वर्ष 2024-25
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ========== CITIZEN SEARCH ========== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)' }} />
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">नागरिक शोधा</h3>
              <p className="text-xs text-muted-foreground">मालमत्ता क्रमांक, मोबाईल नंबर किंवा मालकाचे नाव टाका</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="मालमत्ता क्रमांक / मोबाईल नंबर / मालकाचे नाव..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-base border-2 border-amber-200 focus:border-amber-400 rounded-xl"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="h-12 px-8 rounded-xl text-base font-semibold"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              {searching ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />शोधत आहे...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" />शोधा</>
              )}
            </Button>
          </div>

          {/* Search type hints */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { icon: Hash, label: 'मालमत्ता क्रमांक', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { icon: Phone, label: 'मोबाईल नंबर', color: 'bg-sky-50 text-sky-700 border-sky-200' },
              { icon: User, label: 'मालकाचे नाव', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            ].map((hint, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${hint.color}`}>
                <hint.icon className="h-3 w-3" />{hint.label}
              </span>
            ))}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">{searchResults.length} मालमत्ता सापडल्या</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePropertySelect(p.id, searchResults)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedPropertyId === p.id
                        ? 'border-rose-400 bg-rose-50 shadow-sm'
                        : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/50'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: selectedPropertyId === p.id ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'linear-gradient(135deg, #fecdd3, #fda4af)' }}>
                      <Building2 className={`h-5 w-5 ${selectedPropertyId === p.id ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.propertyNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{getOwnerName(p)}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0 rotate-[-90deg]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {searching && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />शोधत आहे...
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== OUTSTANDING TAX DISPLAY ========== */}
      {outstandingInfo && (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #f59e0b, #27ae60, #e74c3c)' }} />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-100">
                <Scale className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">बक्की माहिती</h3>
                <p className="text-xs text-muted-foreground">
                  मालमत्ता: <span className="font-semibold">{selectedProp?.propertyNumber}</span> &middot; मालक: <span className="font-semibold">{getOwnerName(selectedProp)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Demand - Amber */}
              <div className="relative rounded-2xl p-5 text-center overflow-hidden border-2 border-amber-200"
                style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 bg-amber-400" />
                <CircleDollarSign className="h-7 w-7 mx-auto mb-1 text-amber-700" />
                <div className="text-xs font-semibold text-amber-800/70 mb-1">एकूण मागणी</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">{formatCurrency(outstandingInfo.totalDemand)}</div>
              </div>

              {/* Total Paid - Green */}
              <div className="relative rounded-2xl p-5 text-center overflow-hidden border-2 border-green-200"
                style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 bg-green-400" />
                <CheckCircle2 className="h-7 w-7 mx-auto mb-1 text-green-700" />
                <div className="text-xs font-semibold text-green-800/70 mb-1">भरलेली रक्कम</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-green-900">{formatCurrency(outstandingInfo.totalPaid)}</div>
              </div>

              {/* Balance - Red */}
              <div className="relative rounded-2xl p-5 text-center overflow-hidden border-2 border-rose-200"
                style={{ background: 'linear-gradient(135deg, #fecdd3, #fda4af)' }}>
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 bg-rose-400" />
                <AlertCircle className="h-7 w-7 mx-auto mb-1 text-rose-700" />
                <div className="text-xs font-semibold text-rose-800/70 mb-1">शिल्लक बक्की</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-900">{formatCurrency(outstandingInfo.balance)}</div>
              </div>
            </div>

            {/* Progress bar */}
            {outstandingInfo.totalDemand > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">वसूल प्रमाण</span>
                  <span className="text-green-700 font-bold">
                    {((outstandingInfo.totalPaid / outstandingInfo.totalDemand) * 100).toFixed(1)}% भरले
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((outstandingInfo.totalPaid / outstandingInfo.totalDemand) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== PAYMENT ENTRY SECTION ========== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #be123c, #e11d48, #f43f5e)' }} />
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">पेमेंट एंट्री</h3>
              <p className="text-xs text-muted-foreground">रक्कम, पद्धत निवडा आणि पावती तयार करा</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Property Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-rose-500" />मालमत्ता
              </Label>
              <Select value={selectedPropertyId} onValueChange={(v) => handlePropertySelect(v)}>
                <SelectTrigger className="h-11 rounded-lg border-2 border-rose-100 focus:border-rose-300">
                  <SelectValue placeholder="मालमत्ता निवडा" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyNumber} — {getOwnerName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Namuna9 Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-rose-500" />नमुना ९ (वर्ष)
              </Label>
              <Select value={selectedNamuna9Id} onValueChange={setSelectedNamuna9Id}>
                <SelectTrigger className="h-11 rounded-lg border-2 border-rose-100 focus:border-rose-300">
                  <SelectValue placeholder="नमुना ९ निवडा" />
                </SelectTrigger>
                <SelectContent>
                  {namuna9Records
                    .filter(n => n.propertyId === selectedPropertyId)
                    .map(n => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.financialYear} — मागणी: {formatCurrency(n.totalDemand)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-rose-500" />रक्कम (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="h-11 pl-9 rounded-lg border-2 border-rose-100 focus:border-rose-300 text-lg font-semibold"
                />
              </div>
              {outstandingInfo && outstandingInfo.balance > 0 && (
                <button
                  onClick={() => setPaymentAmount(outstandingInfo.balance.toFixed(2))}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <HandCoins className="h-3 w-3" />
                  पूर्ण रक्कम भरा: {formatCurrency(outstandingInfo.balance)}
                </button>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-rose-500" />पद्धत
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11 rounded-lg border-2 border-rose-100 focus:border-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">💰 रोख (Cash)</SelectItem>
                  <SelectItem value="Cheque">📝 चेक (Cheque)</SelectItem>
                  <SelectItem value="Online">📱 ऑनलाइन (Online)</SelectItem>
                  <SelectItem value="DD">🏦 डिमांड ड्राफ्ट (DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment summary preview */}
          {paymentAmount && outstandingInfo && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">भरलेली रक्कम: <strong className="text-green-700">{formatCurrency(parseFloat(paymentAmount) || 0)}</strong></span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">शिल्लक होईल: <strong className="text-rose-700">{formatCurrency(outstandingInfo.balance - (parseFloat(paymentAmount) || 0))}</strong></span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-5">
            <Button
              onClick={handlePay}
              disabled={paying || !selectedNamuna9Id || !paymentAmount}
              className="w-full sm:w-auto h-14 px-10 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
            >
              {paying ? (
                <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />प्रक्रिया सुरू...</>
              ) : (
                <><Receipt className="h-5 w-5 mr-2" />पावती तयार करा</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========== PAYMENTS TABLE ========== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">अलीकडील पावत्या</CardTitle>
              <Badge variant="secondary" className="text-xs">{allPayments.length}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-lg">
              <RefreshCw className="h-4 w-4 mr-1" />रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">अद्याप पावत्या नाहीत</p>
              <p className="text-xs text-muted-foreground/60 mt-1">वरील फॉर्म वापरून पहिली पावती तयार करा</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">पावती क्र.</TableHead>
                    <TableHead className="font-semibold">दिनांक</TableHead>
                    <TableHead className="font-semibold">मालमत्ता</TableHead>
                    <TableHead className="font-semibold">मालक</TableHead>
                    <TableHead className="text-right font-semibold">प्राप्त रक्कम</TableHead>
                    <TableHead className="text-right font-semibold">शिल्लक</TableHead>
                    <TableHead className="font-semibold">पद्धत</TableHead>
                    <TableHead className="font-semibold">क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map(p => (
                    <TableRow key={p.id} className="hover:bg-rose-50/30 transition-colors">
                      <TableCell>
                        <span className="font-mono text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md">
                          {p.receiptNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm">{p.property?.propertyNumber || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getOwnerName(p.property)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-700 text-sm bg-green-50 px-2 py-0.5 rounded-md">
                          {formatCurrency(p.amountPaid)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={p.balance > 0 ? 'destructive' : 'default'}
                          className={`text-xs font-bold ${p.balance > 0 ? 'bg-rose-100 text-rose-800 border-0' : 'bg-green-100 text-green-800 border-0'}`}
                        >
                          {formatCurrency(p.balance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {paymentMethodLabel[p.paymentMethod] || p.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReceipt(p)}
                          className="h-8 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                        >
                          <Printer className="h-4 w-4 mr-1" />प्रिंट
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== RECEIPT DIALOG ========== */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Green header */}
          <div style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }} className="p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white text-xl">
                <CheckCircle2 className="h-6 w-6" />
                पावती यशस्वीरित्या तयार झाली!
              </DialogTitle>
            </DialogHeader>
          </div>

          {lastReceipt && (
            <div className="p-6 space-y-4">
              {/* Receipt Box */}
              <div className="border-3 rounded-2xl overflow-hidden" style={{ border: '3px double #333' }}>
                {/* Indian Flag Bar */}
                <div className="h-2" style={{ background: 'linear-gradient(90deg, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)' }} />

                {/* Receipt Header */}
                <div className="text-center py-3 px-4" style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}>
                  <h2 className="text-xl font-bold text-white">नमुना ९-क — पावती</h2>
                  <p className="text-xs text-rose-100">मालमत्ता कर प्राप्ती पावती</p>
                </div>

                {/* Receipt Body */}
                <div className="p-5 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">पावती क्रमांक:</span> <strong className="font-mono text-rose-700">{lastReceipt.receiptNumber}</strong></div>
                    <div><span className="text-muted-foreground">दिनांक:</span> <strong>{formatDate(lastReceipt.paymentDate)}</strong></div>
                    <div><span className="text-muted-foreground">मालमत्ता:</span> <strong>{selectedProp?.propertyNumber}</strong></div>
                    <div><span className="text-muted-foreground">मालक:</span> <strong>{getOwnerName(selectedProp)}</strong></div>
                    <div><span className="text-muted-foreground">पद्धत:</span> <strong>{paymentMethodLabel[lastReceipt.paymentMethod] || lastReceipt.paymentMethod}</strong></div>
                    <div><span className="text-muted-foreground">वित्तीय वर्ष:</span> <strong>{lastReceipt.namuna9?.financialYear || '-'}</strong></div>
                  </div>

                  <Separator />

                  {/* Amounts Table */}
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">एकूण मागणी</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(lastReceipt.namuna9?.totalDemand || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-green-50">
                        <TableCell className="font-semibold text-green-800">प्राप्त रक्कम (Received)</TableCell>
                        <TableCell className="text-right font-extrabold text-green-800 text-lg">{formatCurrency(lastReceipt.amountPaid)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-rose-50">
                        <TableCell className="font-semibold text-rose-800">शिल्लक (Balance)</TableCell>
                        <TableCell className="text-right font-extrabold text-rose-800 text-lg">{formatCurrency(lastReceipt.balance)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Received Amount Highlight */}
                  <div className="rounded-xl p-4 text-center border-2 border-green-300"
                    style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                    <div className="text-sm text-green-700 font-medium">प्राप्त रक्कम</div>
                    <div className="text-4xl font-extrabold text-green-800 mt-1">{formatCurrency(lastReceipt.amountPaid)}</div>
                  </div>

                  {/* Balance Highlight */}
                  {lastReceipt.balance > 0 && (
                    <div className="rounded-xl p-3 text-center border-2 border-rose-200"
                      style={{ background: 'linear-gradient(135deg, #fecdd3, #fda4af)' }}>
                      <div className="text-sm text-rose-700 font-medium">शिल्लक बक्की</div>
                      <div className="text-2xl font-extrabold text-rose-900 mt-1">{formatCurrency(lastReceipt.balance)}</div>
                    </div>
                  )}

                  {/* Signature Area */}
                  <div className="flex justify-between items-end pt-4 text-xs text-muted-foreground">
                    <div className="text-center w-28">
                      <div className="border-t border-gray-400 pt-1 font-semibold text-gray-600">मालकाची सही</div>
                    </div>
                    <div className="text-center text-[10px] text-gray-400">संगणकीय पावती</div>
                    <div className="text-center w-28">
                      <div className="border-t border-gray-400 pt-1 font-semibold text-gray-600">अधिकृत सही व मुद्रा</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Flag Bar */}
                <div className="h-2" style={{ background: 'linear-gradient(90deg, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)' }} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => handlePrintReceipt(lastReceipt)}
                  className="flex-1 h-12 rounded-xl text-base font-semibold"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                >
                  <Printer className="h-5 w-5 mr-2" />प्रिंट करा
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setReceiptDialogOpen(false)}
                  className="flex-1 h-12 rounded-xl text-base"
                >
                  बंद करा
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
