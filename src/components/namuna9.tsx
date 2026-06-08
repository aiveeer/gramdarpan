'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Printer, RefreshCw, Search, Receipt, BookOpen,
  IndianRupee, ArrowRight, Plus, Calculator, FileText,
  CheckCircle2, AlertCircle, Home, User, Phone, MapPin,
  ChevronDown, X, Loader2
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
  ward?: { wardNameMr: string; wardName: string; wardNumber: string };
  road?: { roadNameMr: string };
  owners: OwnerInfo[];
  taxRates: { taxMasterId: string; rate: number; taxMaster: { name: string; nameMarathi: string } }[];
  namuna9s: { totalDemand: number; payments: { amountPaid: number }[] }[];
  payments: { amountPaid: number }[];
}

interface Payment {
  id: string; amountPaid: number; balance: number;
  receiptNumber: string; paymentDate: string; paymentMethod: string;
}

interface Namuna9Record {
  id: string; propertyId: string; financialYear: string;
  currentTax: number; previousBalance: number; penalty: number;
  interest: number; totalDemand: number;
  payments: Payment[];
  property: PropertyInfo;
}

interface VillageInfo {
  gramPanchayatNameMr?: string; gramPanchayatName?: string;
  taluka?: string; district?: string;
  sarpanchNameMr?: string; secretaryNameMr?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getOwnerName = (prop: PropertyInfo) => {
  const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
  if (!owner && prop.owners?.[0]) {
    const o = prop.owners[0];
    return `${o.owner.firstNameMr || o.owner.firstName} ${o.owner.lastNameMr || o.owner.lastName}`;
  }
  return owner ? `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}` : '-';
};

const getMobile = (prop: PropertyInfo) => {
  const owner = prop.owners?.find(o => o.ownershipType === 'मालक') || prop.owners?.[0];
  return owner?.owner.mobileNumber || '-';
};

const getBalance = (r: Namuna9Record) => {
  const totalPaid = r.payments.reduce((s, p) => s + p.amountPaid, 0);
  return r.totalDemand - totalPaid;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Namuna9Component() {
  const [records, setRecords] = useState<Namuna9Record[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [village, setVillage] = useState<VillageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /* search */
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PropertyInfo[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyInfo | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  /* generate */
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [previousBalance, setPreviousBalance] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [interest, setInterest] = useState(0);
  const [generating, setGenerating] = useState(false);

  /* computed current tax */
  const computedCurrentTax = selectedProperty
    ? selectedProperty.taxRates
        ?.filter(tr => tr.taxMaster?.isEnabled)
        .reduce((s, tr) => s + (selectedProperty.area || 0) * tr.rate, 0) || 0
    : 0;

  const totalDemandPreview = computedCurrentTax + previousBalance + penalty + interest;

  /* ---- fetch data ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [n9Res, propRes, vilRes] = await Promise.all([
        fetch('/api/namuna9'),
        fetch('/api/master?table=property'),
        fetch('/api/master?table=village'),
      ]);
      setRecords(await n9Res.json());
      setProperties(await propRes.json());
      const vData = await vilRes.json();
      setVillage(Array.isArray(vData) ? vData[0] : vData);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करताना त्रुटी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- search handler ---- */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/namuna9?search=${encodeURIComponent(searchQuery)}`);
      const data: PropertyInfo[] = await res.json();
      setSearchResults(data);
      if (data.length > 0) {
        handleSelectProperty(data[0]);
      } else {
        toast({ title: 'शोध निकाल', description: 'कोणतीही मालमत्ता सापडली नाही', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'शोधताना त्रुटी', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProperty = (prop: PropertyInfo) => {
    setSelectedPropertyId(prop.id);
    setSelectedProperty(prop);
    /* auto-calculate previous balance from outstanding */
    const totalPaid = prop.payments?.reduce((s: number, pm: { amountPaid: number }) => s + pm.amountPaid, 0) || 0;
    const totalDemand = prop.namuna9s?.reduce((s: number, n9: { totalDemand: number }) => s + n9.totalDemand, 0) || 0;
    const outstanding = totalDemand - totalPaid;
    setPreviousBalance(outstanding > 0 ? Math.round(outstanding * 100) / 100 : 0);
    setPenalty(0);
    setInterest(0);
  };

  /* ---- generate handler ---- */
  const handleGenerate = async () => {
    if (!selectedPropertyId) {
      toast({ title: 'त्रुटी', description: 'कृपया मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/namuna9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId, financialYear, previousBalance, penalty, interest }),
      });
      if (res.ok) {
        toast({ title: '✅ यशस्वी', description: 'नमुना ९ मागणी नोंदवही तयार झाली' });
        fetchData();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedProperty(null);
        setSelectedPropertyId('');
        setPreviousBalance(0);
        setPenalty(0);
        setInterest(0);
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error || 'नमुना ९ तयार करता आला नाही', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'सर्व्हर त्रुटी', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  /* ---- print handler ---- */
  const handlePrint = (record: Namuna9Record) => {
    const prop = record.property;
    const totalPaid = record.payments.reduce((s, p) => s + p.amountPaid, 0);
    const balance = record.totalDemand - totalPaid;
    const ownerName = getOwnerName(prop);
    const mobileNo = getMobile(prop);
    const villageName = village?.gramPanchayatNameMr || village?.gramPanchayatName || '';
    const taluka = village?.taluka || '';
    const district = village?.district || '';
    const sarpanch = village?.sarpanchNameMr || '';
    const secretary = village?.secretaryNameMr || '';

    const printContent = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना ९ - मागणी नोंदवही</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans Devanagari', 'Mangal', Arial, sans-serif; margin: 15px; color: #1a1a1a; font-size: 12px; }
  .flag-bar { height: 6px; background: linear-gradient(90deg, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%); border-radius: 3px; margin-bottom: 12px; }
  .header { text-align: center; margin-bottom: 10px; }
  .header h1 { font-size: 16px; font-weight: 700; color: #b45309; }
  .header h2 { font-size: 13px; font-weight: 600; color: #92400e; margin-top: 2px; }
  .header .sub { font-size: 11px; color: #78350f; margin-top: 2px; }
  .village-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 10px 0; font-size: 12px; padding: 8px; border: 1px solid #d97706; border-radius: 6px; background: #fffbeb; }
  .village-info .item { display: flex; gap: 6px; }
  .village-info .label { font-weight: 600; min-width: 120px; color: #92400e; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #d97706; padding: 6px 10px; font-size: 12px; }
  th { background: #fef3c7; font-weight: 600; color: #92400e; text-align: left; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { background: #fffbeb; font-weight: 700; font-size: 13px; color: #92400e; }
  .demand-breakdown th { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
  .outstanding-red { color: #dc2626; font-weight: 700; }
  .paid-green { color: #16a34a; font-weight: 700; }
  .formula-bar { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 12px 0; padding: 8px; background: #fef3c7; border-radius: 8px; border: 1px dashed #d97706; flex-wrap: wrap; }
  .formula-item { background: white; padding: 4px 10px; border-radius: 6px; border: 1px solid #fbbf24; font-size: 12px; text-align: center; }
  .formula-item .val { font-weight: 700; color: #b45309; display: block; margin-top: 2px; }
  .formula-plus { font-weight: 700; color: #d97706; font-size: 16px; }
  .formula-eq { font-weight: 700; color: #b45309; font-size: 16px; }
  .formula-total { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 14px; text-align: center; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; align-items: flex-end; }
  .footer .sign { text-align: center; min-width: 150px; }
  .footer .sign .line { border-top: 1px solid #333; margin-top: 30px; padding-top: 4px; }
  .watermark { position: fixed; bottom: 50%; right: 10%; font-size: 60px; color: rgba(217,119,6,0.04); transform: rotate(-30deg); font-weight: 700; pointer-events: none; z-index: -1; }
  @media print { body { margin: 10px; } .watermark { display: none; } }
</style></head><body>
<div class="watermark">नमुना ९</div>
<div class="flag-bar"></div>
<div class="header">
  <h1>नमुना ९ - मागणी नोंदवही</h1>
  <h2>Demand Register</h2>
  <div class="sub">वित्तीय वर्ष: ${record.financialYear} | दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div>
</div>
<div class="village-info">
  <div class="item"><span class="label">ग्रामपंचायत:</span> ${villageName}</div>
  <div class="item"><span class="label">मालमत्ता क्र.:</span> ${prop.propertyNumber}</div>
  <div class="item"><span class="label">तालुका:</span> ${taluka}</div>
  <div class="item"><span class="label">मालक:</span> ${ownerName}</div>
  <div class="item"><span class="label">जिल्हा:</span> ${district}</div>
  <div class="item"><span class="label">मोबाईल:</span> ${mobileNo}</div>
  <div class="item"><span class="label">वार्ड:</span> ${prop.ward?.wardNameMr || '-'}</div>
  <div class="item"><span class="label">क्षेत्रफळ:</span> ${prop.area || '-'} चौ.फूट</div>
</div>

<div class="formula-bar">
  <div class="formula-item">चालू वर्ष कर<span class="val">₹${fmt(record.currentTax)}</span></div>
  <span class="formula-plus">+</span>
  <div class="formula-item">मागील थकबाकी<span class="val">₹${fmt(record.previousBalance)}</span></div>
  <span class="formula-plus">+</span>
  <div class="formula-item">दंड<span class="val">₹${fmt(record.penalty)}</span></div>
  <span class="formula-plus">+</span>
  <div class="formula-item">व्याज<span class="val">₹${fmt(record.interest)}</span></div>
  <span class="formula-eq">=</span>
  <div class="formula-total">एकूण मागणी: ₹${fmt(record.totalDemand)}</div>
</div>

<table class="demand-breakdown">
  <thead><tr><th>वर्णन</th><th style="text-align:right">रक्कम (₹)</th></tr></thead>
  <tbody>
    <tr><td>चालू वर्ष कर</td><td class="amount">₹${fmt(record.currentTax)}</td></tr>
    <tr><td>मागील थकबाकी</td><td class="amount">₹${fmt(record.previousBalance)}</td></tr>
    <tr><td>दंड</td><td class="amount">₹${fmt(record.penalty)}</td></tr>
    <tr><td>व्याज</td><td class="amount">₹${fmt(record.interest)}</td></tr>
    <tr class="total-row"><td>एकूण मागणी</td><td class="amount">₹${fmt(record.totalDemand)}</td></tr>
    <tr><td>भरलेली रक्कम</td><td class="amount paid-green">₹${fmt(totalPaid)}</td></tr>
    <tr class="total-row"><td>शिल्लक बक्की</td><td class="amount ${balance > 0 ? 'outstanding-red' : 'paid-green'}">₹${fmt(balance)}</td></tr>
  </tbody>
</table>

${record.payments.length > 0 ? `
<h3 style="font-size:13px;margin:14px 0 6px;color:#92400e;">भरलेली पावत्या</h3>
<table>
  <thead><tr><th>पावती क्र.</th><th>तारीख</th><th>रक्कम (₹)</th><th>पद्धत</th><th>शिल्लक (₹)</th></tr></thead>
  <tbody>
    ${record.payments.map(p => `<tr><td>${p.receiptNumber}</td><td>${new Date(p.paymentDate).toLocaleDateString('mr-IN')}</td><td class="amount">₹${fmt(p.amountPaid)}</td><td>${p.paymentMethod}</td><td class="amount">₹${fmt(p.balance)}</td></tr>`).join('')}
  </tbody>
</table>` : ''}

<div class="footer">
  <div class="sign"><div class="line">मालकाची सही</div></div>
  <div class="sign"><div class="line">ग्रामसेवक सही</div></div>
  <div class="sign"><div class="line">सरपंच सही व मुद्रा</div>${sarpanch ? `<div style="font-size:10px;margin-top:2px;color:#666;">(${sarpanch})</div>` : ''}</div>
  <div class="sign"><div class="line">सचिव सही व मुद्रा</div>${secretary ? `<div style="font-size:10px;margin-top:2px;color:#666;">(${secretary})</div>` : ''}</div>
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  };

  /* ---- summary stats ---- */
  const totalDemandAll = records.reduce((s, r) => s + r.totalDemand, 0);
  const totalPaidAll = records.reduce((s, r) => s + r.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
  const totalOutstanding = totalDemandAll - totalPaidAll;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ===== HEADER CARD ===== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="relative" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 40%, #92400e 100%)' }}>
          {/* decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', transform: 'translate(-30%, 30%)' }} />
          <CardContent className="relative p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">नमुना ९ — मागणी नोंदवही</h1>
                <p className="text-amber-100/80 mt-1">Demand Register | ग्रामपंचायत मालमत्ता कर मागणी नोंदवही</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Badge className="bg-amber-400/30 text-amber-100 border border-amber-300/40 text-xs">
                    <Calculator className="h-3 w-3 mr-1" />
                    चालू कर + थकबाकी + दंड + व्याज = मागणी
                  </Badge>
                  <Badge className="bg-white/15 text-white border border-white/20 text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    वित्तीय वर्ष {financialYear}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-amber-400" />
          <CardContent className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
            <div className="h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-amber-700">एकूण मागणी</div>
              <div className="text-xl font-bold text-amber-800">₹{fmt(totalDemandAll)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-green-400" />
          <CardContent className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <div className="h-11 w-11 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-green-700">एकूण वसूल</div>
              <div className="text-xl font-bold text-green-800">₹{fmt(totalPaidAll)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-red-400" />
          <CardContent className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
            <div className="h-11 w-11 rounded-xl bg-red-500 flex items-center justify-center shadow-sm">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-red-700">एकूण बक्की</div>
              <div className="text-xl font-bold text-red-800">₹{fmt(totalOutstanding)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== SEARCH SECTION ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706, #b45309)' }} />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Search className="h-4 w-4 text-amber-600" />
            </div>
            नागरिक शोधा
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            मालमत्ता क्रमांक, मोबाईल नंबर किंवा मालकाचे नाव टाकून शोधा
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              <Input
                placeholder="मालमत्ता क्रमांक / मोबाईल नंबर / मालकाचे नाव..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                style={{ background: '#fffbeb' }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSelectedProperty(null); setSelectedPropertyId(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={searching} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
              शोधा
            </Button>
          </div>

          {/* Search result tags */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
              <Home className="h-3 w-3 mr-1" /> मालमत्ता क्रमांक
            </Badge>
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
              <Phone className="h-3 w-3 mr-1" /> मोबाईल नंबर
            </Badge>
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
              <User className="h-3 w-3 mr-1" /> मालकाचे नाव
            </Badge>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-amber-800">
                <ChevronDown className="h-4 w-4 inline mr-1" />
                शोध निकाल ({searchResults.length} सापडले) — मालमत्ता निवडा:
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {searchResults.map(prop => {
                  const isSelected = selectedPropertyId === prop.id;
                  const totalPaid = prop.payments?.reduce((s: number, pm: { amountPaid: number }) => s + pm.amountPaid, 0) || 0;
                  const totalDem = prop.namuna9s?.reduce((s: number, n9: { totalDemand: number }) => s + n9.totalDemand, 0) || 0;
                  const outstanding = totalDem - totalPaid;
                  return (
                    <button
                      key={prop.id}
                      onClick={() => handleSelectProperty(prop)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200'
                          : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-amber-600" />
                            <span className="font-bold text-amber-800">{prop.propertyNumber}</span>
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{getOwnerName(prop)}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {prop.ward && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{prop.ward.wardNameMr}</span>}
                            {getMobile(prop) !== '-' && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{getMobile(prop)}</span>}
                          </div>
                        </div>
                        {outstanding > 0 ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">₹{fmt(outstanding)} बक्की</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">भरलेले</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== GENERATE DEMAND ===== */}
      {selectedProperty && (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)' }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-amber-600" />
              </div>
              मागणी नोंदवही तयार करा
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected property info */}
            <div className="p-4 rounded-xl border-2 border-amber-200" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Home className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-amber-800 text-lg">{selectedProperty.propertyNumber}</span>
                <Badge className="bg-amber-500 text-white border-0 text-xs">निवडलेली मालमत्ता</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-amber-600">मालक</span>
                  <div className="font-medium">{getOwnerName(selectedProperty)}</div>
                </div>
                <div>
                  <span className="text-xs text-amber-600">वार्ड</span>
                  <div className="font-medium">{selectedProperty.ward?.wardNameMr || '-'}</div>
                </div>
                <div>
                  <span className="text-xs text-amber-600">क्षेत्रफळ</span>
                  <div className="font-medium">{selectedProperty.area || '-'} चौ.फूट</div>
                </div>
                <div>
                  <span className="text-xs text-amber-600">वापर</span>
                  <div className="font-medium">{selectedProperty.usageType || '-'}</div>
                </div>
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-semibold">वित्तीय वर्ष</Label>
                <Select value={financialYear} onValueChange={setFinancialYear}>
                  <SelectTrigger className="mt-1 border-amber-200" />
                  <SelectContent>
                    {['2022-23', '2023-24', '2024-25', '2025-26'].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1">
                  मागील थकबाकी (₹)
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1 py-0">ऑटो</Badge>
                </Label>
                <Input
                  type="number"
                  value={previousBalance || ''}
                  onChange={e => setPreviousBalance(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="mt-1 border-amber-200 focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">दंड (₹)</Label>
                <Input
                  type="number"
                  value={penalty || ''}
                  onChange={e => setPenalty(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="mt-1 border-amber-200 focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">व्याज (₹)</Label>
                <Input
                  type="number"
                  value={interest || ''}
                  onChange={e => setInterest(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="mt-1 border-amber-200 focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* ===== DEMAND FORMULA DISPLAY ===== */}
            <div className="p-5 rounded-xl border-2 border-dashed border-amber-300" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9e7)' }}>
              <div className="text-center text-sm font-semibold text-amber-800 mb-4">
                <Calculator className="h-4 w-4 inline mr-1" />
                मागणी सूत्र (Demand Formula)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {/* चालू वर्ष कर */}
                <div className="flex flex-col items-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white border-2 border-teal-200 shadow-sm min-w-[90px]">
                  <span className="text-[10px] sm:text-xs text-teal-600 font-medium">चालू वर्ष कर</span>
                  <span className="text-sm sm:text-lg font-bold text-teal-700">₹{fmt(computedCurrentTax)}</span>
                </div>
                <Plus className="h-5 w-5 text-amber-500 font-bold" />
                {/* मागील थकबाकी */}
                <div className="flex flex-col items-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white border-2 border-orange-200 shadow-sm min-w-[90px]">
                  <span className="text-[10px] sm:text-xs text-orange-600 font-medium">मागील थकबाकी</span>
                  <span className="text-sm sm:text-lg font-bold text-orange-700">₹{fmt(previousBalance)}</span>
                </div>
                <Plus className="h-5 w-5 text-amber-500 font-bold" />
                {/* दंड */}
                <div className="flex flex-col items-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white border-2 border-red-200 shadow-sm min-w-[90px]">
                  <span className="text-[10px] sm:text-xs text-red-600 font-medium">दंड</span>
                  <span className="text-sm sm:text-lg font-bold text-red-700">₹{fmt(penalty)}</span>
                </div>
                <Plus className="h-5 w-5 text-amber-500 font-bold" />
                {/* व्याज */}
                <div className="flex flex-col items-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white border-2 border-purple-200 shadow-sm min-w-[90px]">
                  <span className="text-[10px] sm:text-xs text-purple-600 font-medium">व्याज</span>
                  <span className="text-sm sm:text-lg font-bold text-purple-700">₹{fmt(interest)}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-600 font-bold" />
                {/* एकूण मागणी */}
                <div className="flex flex-col items-center px-4 py-3 rounded-xl shadow-md min-w-[120px]" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <span className="text-[10px] sm:text-xs text-amber-100 font-medium">एकूण मागणी</span>
                  <span className="text-lg sm:text-2xl font-bold text-white">₹{fmt(totalDemandPreview)}</span>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedPropertyId}
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-md px-8 py-3 text-base font-semibold"
              >
                {generating ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />तयार होत आहे...</>
                ) : (
                  <><Receipt className="h-5 w-5 mr-2" />मागणी नोंदवही तयार करा</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setSelectedProperty(null); setSelectedPropertyId(''); setSearchResults([]); setSearchQuery(''); setPreviousBalance(0); setPenalty(0); setInterest(0); }}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <X className="h-4 w-4 mr-1" />रद्द करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== RECORDS TABLE ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #d97706, #b45309, #92400e)' }} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-amber-600" />
              </div>
              नमुना ९ रेकॉर्ड्स
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">{records.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <RefreshCw className="h-4 w-4 mr-1" />रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
              <p className="text-muted-foreground mt-3">लोड होत आहे...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-amber-300 mb-3" />
              <p className="text-lg text-muted-foreground">नमुना ९ रेकॉर्ड नाहीत</p>
              <p className="text-sm text-muted-foreground mt-1">वर नागरिक शोधून मागणी नोंदवही तयार करा</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto border-2 border-amber-100 rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50 hover:bg-amber-50">
                    <TableHead className="text-amber-800 font-semibold">क्र.</TableHead>
                    <TableHead className="text-amber-800 font-semibold">मालमत्ता क्र.</TableHead>
                    <TableHead className="text-amber-800 font-semibold">मालक</TableHead>
                    <TableHead className="text-amber-800 font-semibold">वित्तीय वर्ष</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">चालू कर</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">थकबाकी</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">दंड</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">व्याज</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">एकूण मागणी</TableHead>
                    <TableHead className="text-right text-amber-800 font-semibold">शिल्लक</TableHead>
                    <TableHead className="text-center text-amber-800 font-semibold">क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r, i) => {
                    const bal = getBalance(r);
                    const isPaidOff = bal <= 0;
                    return (
                      <TableRow key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-semibold text-amber-800">{r.property.propertyNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{getOwnerName(r.property)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                            {r.financialYear}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">₹{fmt(r.currentTax)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">₹{fmt(r.previousBalance)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-600">₹{fmt(r.penalty)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-purple-600">₹{fmt(r.interest)}</TableCell>
                        <TableCell className="text-right font-bold text-amber-700 font-mono">₹{fmt(r.totalDemand)}</TableCell>
                        <TableCell className="text-right">
                          {isPaidOff ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs font-semibold">
                              <CheckCircle2 className="h-3 w-3 mr-1" />₹0.00
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs font-semibold">
                              <AlertCircle className="h-3 w-3 mr-1" />₹{fmt(bal)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(r)}
                            className="text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                          >
                            <Printer className="h-4 w-4 mr-1" />प्रिंट
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
