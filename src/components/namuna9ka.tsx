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
import { toast } from '@/hooks/use-toast';
import { Printer, RefreshCw, Search, CreditCard, FileText } from 'lucide-react';

interface OwnerInfo { owner: { firstName: string; lastName: string; firstNameMr: string; lastNameMr: string; mobileNumber: string | null }; ownershipType: string }
interface PropertyInfo { id: string; propertyNumber: string; area: number | null; constructionType: string | null; usageType: string | null; ward?: { wardNameMr: string }; road?: { roadNameMr: string }; owners: OwnerInfo[] }
interface PaymentInfo { id: string; namuna9Id: string; amountPaid: number; balance: number; receiptNumber: string; paymentDate: string; paymentMethod: string; property: PropertyInfo; namuna9: { totalDemand: number } }
interface Namuna9Info { id: string; financialYear: string; totalDemand: number; payments: PaymentInfo[] }

const getOwnerName = (prop: PropertyInfo | null | undefined) => {
  if (!prop?.owners?.length) return '-';
  const owner = prop.owners.find(o => o.ownershipType === 'मालक') || prop.owners[0];
  return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
};

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [n9Res, propRes, payRes] = await Promise.all([fetch('/api/namuna9'), fetch('/api/master?table=property'), fetch('/api/payment')]);
      setNamuna9Records(await n9Res.json());
      setProperties(await propRes.json());
      setAllPayments(await payRes.json());
    } catch { toast({ title: 'त्रुटी', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/namuna9?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length > 0) setSelectedPropertyId(data[0].id);
    } catch { toast({ title: 'त्रुटी', variant: 'destructive' }); }
    finally { setSearching(false); }
  };

  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const n9 = namuna9Records.find(n => n.propertyId === propId);
    if (n9) { setSelectedNamuna9Id(n9.id); const totalPaid = n9.payments.reduce((s, p) => s + p.amountPaid, 0); setPaymentAmount((n9.totalDemand - totalPaid).toFixed(2)); }
  };

  const handlePay = async () => {
    if (!selectedPropertyId || !selectedNamuna9Id || !paymentAmount) { toast({ title: 'त्रुटी', description: 'सर्व माहिती भरा', variant: 'destructive' }); return; }
    setPaying(true);
    try {
      const res = await fetch('/api/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: selectedPropertyId, namuna9Id: selectedNamuna9Id, amountPaid: parseFloat(paymentAmount), paymentMethod }) });
      if (res.ok) { const payment = await res.json(); setLastReceipt(payment); setReceiptDialogOpen(true); toast({ title: 'यशस्वी', description: 'पावती तयार झाली' }); setPaymentAmount(''); fetchData(); }
      else { const err = await res.json(); toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' }); }
    } catch { toast({ title: 'त्रुटी', variant: 'destructive' }); }
    finally { setPaying(false); }
  };

  const handlePrintReceipt = (payment: PaymentInfo) => {
    const prop = payment.property; const ownerName = getOwnerName(prop);
    const printContent = `<!DOCTYPE html><html><head><title>नमुना ९-क</title><style>body{font-family:'Noto Sans Devanagari',Arial,sans-serif;margin:20px;max-width:800px;margin:0 auto}.receipt-box{border:2px solid #333;padding:20px}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px}h1{text-align:center;font-size:20px;margin:0}h2{text-align:center;font-size:14px;margin:5px 0 0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px}.info-item{font-size:13px}.info-item strong{display:inline-block;min-width:130px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #333;padding:8px;font-size:13px}th{background:#f0f0f0}.total-row{font-weight:bold;background:#f9f9f9}.highlight{font-size:16px;font-weight:bold;text-align:center;padding:10px;background:#e8f5e9;border-radius:4px;margin:10px 0}.footer{margin-top:20px;display:flex;justify-content:space-between;font-size:12px}@media print{body{margin:0}}</style></head><body>
<div class="receipt-box"><div class="header"><h1>नमुना ९-क</h1><h2>पावती (Receipt)</h2></div>
<div class="info-grid"><div class="info-item"><strong>पावती क्रमांक:</strong> ${payment.receiptNumber}</div><div class="info-item"><strong>दिनांक:</strong> ${new Date(payment.paymentDate).toLocaleDateString('mr-IN')}</div><div class="info-item"><strong>मालमत्ता क्र.:</strong> ${prop?.propertyNumber || '-'}</div><div class="info-item"><strong>मालक:</strong> ${ownerName}</div></div>
<table><thead><tr><th>वर्णन</th><th style="text-align:right">रक्कम (₹)</th></tr></thead><tbody>
<tr><td>एकूण मागणी</td><td style="text-align:right">₹${payment.namuna9?.totalDemand?.toFixed(2) || '-'}</td></tr>
<tr class="total-row"><td>प्राप्त रक्कम (Received)</td><td style="text-align:right"><strong>₹${payment.amountPaid.toFixed(2)}</strong></td></tr>
<tr class="total-row"><td>शिल्लक (Balance)</td><td style="text-align:right"><strong>₹${payment.balance.toFixed(2)}</strong></td></tr></tbody></table>
<div class="highlight">प्राप्त रक्कम: ₹${payment.amountPaid.toFixed(2)} | पद्धत: ${payment.paymentMethod}</div>
<div class="footer"><div>दिनांक: ${new Date(payment.paymentDate).toLocaleDateString('mr-IN')}</div><div style="width:120px;height:60px;border:1px dashed #999;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px">मुद्रा / सही</div></div></div></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
  };

  const getOutstanding = (propertyId: string) => {
    const recs = namuna9Records.filter(n => n.propertyId === propertyId);
    const totalDemand = recs.reduce((s, n) => s + n.totalDemand, 0);
    const totalPaid = recs.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
    return { totalDemand, totalPaid, balance: totalDemand - totalPaid };
  };

  const outstandingInfo = selectedPropertyId ? getOutstanding(selectedPropertyId) : null;
  const selectedProp = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-xl">नमुना ९-क - पावती (Receipt)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2"><Search className="h-4 w-4" />नागरिक शोधा</h3>
            <div className="flex gap-2"><Input placeholder="मालमत्ता क्र./मोबाईल/मालक नाव..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /><Button variant="outline" onClick={handleSearch} disabled={searching}><Search className="h-4 w-4" /></Button></div>
            {searchResults.length > 0 && (<Select value={selectedPropertyId} onValueChange={handlePropertySelect}><SelectTrigger /><SelectContent>{searchResults.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyNumber} - {getOwnerName(p)}</SelectItem>)}</SelectContent></Select>)}
          </div>
          {/* Outstanding */}
          {outstandingInfo && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-base mb-3">बक्की माहिती</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-3"><div className="text-sm text-muted-foreground">एकूण मागणी</div><div className="text-xl font-bold">₹{outstandingInfo.totalDemand.toFixed(2)}</div></div>
                <div className="bg-green-50 rounded-lg p-3"><div className="text-sm text-muted-foreground">भरलेली रक्कम</div><div className="text-xl font-bold text-green-700">₹{outstandingInfo.totalPaid.toFixed(2)}</div></div>
                <div className="bg-red-50 rounded-lg p-3"><div className="text-sm text-muted-foreground">शिल्लक</div><div className="text-xl font-bold text-red-700">₹{outstandingInfo.balance.toFixed(2)}</div></div>
              </div>
            </div>
          )}
          {/* Payment Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />पेमेंट एंट्री</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><Label>मालमत्ता</Label><Select value={selectedPropertyId} onValueChange={handlePropertySelect}><SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyNumber} - {getOwnerName(p)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>नमुना ९</Label><Select value={selectedNamuna9Id} onValueChange={setSelectedNamuna9Id}><SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger><SelectContent>{namuna9Records.filter(n => n.propertyId === selectedPropertyId).map(n => <SelectItem key={n.id} value={n.id}>{n.financialYear} - ₹{n.totalDemand}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>रक्कम (₹)</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min={0} step={0.01} /></div>
              <div><Label>पद्धत</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger /><SelectContent><SelectItem value="Cash">रोख</SelectItem><SelectItem value="Cheque">चेक</SelectItem><SelectItem value="Online">ऑनलाइन</SelectItem><SelectItem value="DD">डिमांड ड्राफ्ट</SelectItem></SelectContent></Select></div>
            </div>
            <Button onClick={handlePay} disabled={paying || !selectedNamuna9Id}><CreditCard className="h-4 w-4 mr-1" />{paying ? 'प्रक्रिया सुरू...' : 'पावती तयार करा'}</Button>
          </div>
        </CardContent>
      </Card>
      {/* Recent Payments */}
      <Card>
        <CardHeader><div className="flex items-center justify-between flex-wrap gap-4"><CardTitle className="text-lg">अलीकडील पावत्या</CardTitle><Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" />रिफ्रेश</Button></div></CardHeader>
        <CardContent>
          {allPayments.length === 0 ? <div className="text-center py-8 text-muted-foreground">पावत्या नाहीत</div> : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>पावती क्र.</TableHead><TableHead>दिनांक</TableHead><TableHead>मालमत्ता</TableHead><TableHead>मालक</TableHead><TableHead className="text-right">रक्कम</TableHead><TableHead className="text-right">शिल्लक</TableHead><TableHead>पद्धत</TableHead><TableHead>क्रिया</TableHead></TableRow></TableHeader>
              <TableBody>{allPayments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.receiptNumber}</TableCell>
                  <TableCell>{new Date(p.paymentDate).toLocaleDateString('mr-IN')}</TableCell>
                  <TableCell>{p.property?.propertyNumber || '-'}</TableCell>
                  <TableCell>{getOwnerName(p.property)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-700">₹{p.amountPaid.toFixed(2)}</TableCell>
                  <TableCell className="text-right"><Badge variant={p.balance > 0 ? 'destructive' : 'default'}>₹{p.balance.toFixed(2)}</Badge></TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(p)}><Printer className="h-4 w-4 mr-1" />प्रिंट</Button></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />पावती तयार झाली</DialogTitle></DialogHeader>
          {lastReceipt && (
            <div className="space-y-4">
              <div className="border-2 rounded-lg p-6 space-y-4">
                <div className="text-center border-b pb-4"><h2 className="text-xl font-bold">नमुना ९-क - पावती</h2></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><strong>पावती क्रमांक:</strong> {lastReceipt.receiptNumber}</div>
                  <div><strong>दिनांक:</strong> {new Date(lastReceipt.paymentDate).toLocaleDateString('mr-IN')}</div>
                  <div><strong>मालमत्ता:</strong> {selectedProp?.propertyNumber}</div>
                  <div><strong>मालक:</strong> {getOwnerName(selectedProp)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center"><div className="text-sm text-muted-foreground">प्राप्त रक्कम</div><div className="text-3xl font-bold text-green-700">₹{lastReceipt.amountPaid.toFixed(2)}</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 text-center"><div className="text-sm text-muted-foreground">शिल्लक</div><div className="text-xl font-bold text-red-700">₹{lastReceipt.balance.toFixed(2)}</div></div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center"><div className="text-sm text-muted-foreground">पद्धत</div><div className="text-xl font-bold">{lastReceipt.paymentMethod}</div></div>
                </div>
              </div>
              <div className="flex justify-end"><Button onClick={() => handlePrintReceipt(lastReceipt)}><Printer className="h-4 w-4 mr-1" />प्रिंट करा</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
