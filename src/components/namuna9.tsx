'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Printer, RefreshCw, Search, Receipt } from 'lucide-react';

interface OwnerInfo { owner: { firstName: string; lastName: string; firstNameMr: string; lastNameMr: string; mobileNumber: string | null }; ownershipType: string }
interface PropertyInfo { id: string; propertyNumber: string; area: number | null; constructionType: string | null; usageType: string | null; ward?: { wardNameMr: string }; road?: { roadNameMr: string }; owners: OwnerInfo[]; taxRates: { taxMasterId: string; rate: number; taxMaster: { name: string; nameMarathi: string } }[]; namuna9s: { totalDemand: number; payments: { amountPaid: number }[] }[]; payments: { amountPaid: number }[] }
interface Payment { id: string; amountPaid: number; balance: number; receiptNumber: string; paymentDate: string; paymentMethod: string }
interface Namuna9Record { id: string; propertyId: string; financialYear: string; currentTax: number; previousBalance: number; penalty: number; interest: number; totalDemand: number; payments: Payment[]; property: PropertyInfo }

export default function Namuna9Component() {
  const [records, setRecords] = useState<Namuna9Record[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PropertyInfo[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [previousBalance, setPreviousBalance] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [interest, setInterest] = useState(0);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [n9Res, propRes] = await Promise.all([fetch('/api/namuna9'), fetch('/api/master?table=property')]);
      setRecords(await n9Res.json());
      setProperties(await propRes.json());
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

  const handleGenerate = async () => {
    if (!selectedPropertyId) { toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/namuna9', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: selectedPropertyId, financialYear, previousBalance, penalty, interest }) });
      if (res.ok) { toast({ title: 'यशस्वी', description: 'नमुना ९ तयार झाला' }); fetchData(); setSearchQuery(''); setSearchResults([]); }
      else { const err = await res.json(); toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' }); }
    } catch { toast({ title: 'त्रुटी', variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const getOwnerName = (prop: PropertyInfo) => {
    const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
    if (!owner) return prop.owners?.[0] ? `${prop.owners[0].owner.firstNameMr || prop.owners[0].owner.firstName} ${prop.owners[0].owner.lastNameMr || prop.owners[0].owner.lastName}` : '-';
    return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
  };

  const getBalance = (r: Namuna9Record) => {
    const totalPaid = r.payments.reduce((s, p) => s + p.amountPaid, 0);
    return r.totalDemand - totalPaid;
  };

  const handlePrint = (record: Namuna9Record) => {
    const prop = record.property; const totalPaid = record.payments.reduce((s, p) => s + p.amountPaid, 0); const balance = record.totalDemand - totalPaid; const ownerName = getOwnerName(prop);
    const printContent = `<!DOCTYPE html><html><head><title>नमुना ९</title><style>body{font-family:'Noto Sans Devanagari',Arial,sans-serif;margin:20px}h1{text-align:center;font-size:18px}h2{text-align:center;font-size:14px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #333;padding:6px 8px;font-size:12px}th{background:#f0f0f0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px}.info-item{font-size:13px}.info-item strong{display:inline-block;min-width:140px}.total-row{font-weight:bold;background:#f9f9f9}.footer{margin-top:30px;display:flex;justify-content:space-between;font-size:12px}@media print{body{margin:0}}</style></head><body>
<h1>नमुना ९ - मागणी नोंदवही</h1><h2>Demand Register</h2><h2 style="font-size:13px">वित्तीय वर्ष: ${record.financialYear}</h2>
<div class="info-grid"><div class="info-item"><strong>मालमत्ता क्र.:</strong> ${prop.propertyNumber}</div><div class="info-item"><strong>मालक:</strong> ${ownerName}</div><div class="info-item"><strong>वार्ड:</strong> ${prop.ward?.wardNameMr || '-'}</div><div class="info-item"><strong>क्षेत्रफळ:</strong> ${prop.area || '-'} चौ.फूट</div></div>
<table><thead><tr><th>वर्णन</th><th style="text-align:right">रक्कम (₹)</th></tr></thead><tbody>
<tr><td>चालू वर्ष कर</td><td style="text-align:right">₹${record.currentTax.toFixed(2)}</td></tr>
<tr><td>मागील थकबाकी</td><td style="text-align:right">₹${record.previousBalance.toFixed(2)}</td></tr>
<tr><td>दंड</td><td style="text-align:right">₹${record.penalty.toFixed(2)}</td></tr>
<tr><td>व्याज</td><td style="text-align:right">₹${record.interest.toFixed(2)}</td></tr>
<tr class="total-row"><td><strong>एकूण मागणी</strong></td><td style="text-align:right"><strong>₹${record.totalDemand.toFixed(2)}</strong></td></tr>
<tr><td>भरलेली रक्कम</td><td style="text-align:right">₹${totalPaid.toFixed(2)}</td></tr>
<tr class="total-row"><td><strong>शिल्लक</strong></td><td style="text-align:right"><strong>₹${balance.toFixed(2)}</strong></td></tr>
</tbody></table>
<div class="footer"><div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div><div>सही व मुद्रा</div></div></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-xl">नमुना ९ - मागणी नोंदवही (Demand Register)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base">नागरिक शोधा</h3>
            <div className="flex gap-2">
              <Input placeholder="मालमत्ता क्र./मोबाईल/मालक नाव..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <Button variant="outline" onClick={handleSearch} disabled={searching}><Search className="h-4 w-4" /></Button>
            </div>
            {searchResults.length > 0 && (
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{searchResults.map(p => (<SelectItem key={p.id} value={p.id}>{p.propertyNumber} - {getOwnerName(p)}</SelectItem>))}</SelectContent>
              </Select>
            )}
          </div>
          {/* Generate */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base">मागणी नोंदवही तयार करा</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div><Label>मालमत्ता</Label><Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}><SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyNumber} - {getOwnerName(p)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>वित्तीय वर्ष</Label><Select value={financialYear} onValueChange={setFinancialYear}><SelectTrigger /><SelectContent>{['2023-24', '2024-25', '2025-26'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>मागील थकबाकी (₹)</Label><Input type="number" value={previousBalance} onChange={e => setPreviousBalance(parseFloat(e.target.value) || 0)} min={0} /></div>
              <div><Label>दंड (₹)</Label><Input type="number" value={penalty} onChange={e => setPenalty(parseFloat(e.target.value) || 0)} min={0} /></div>
              <div><Label>व्याज (₹)</Label><Input type="number" value={interest} onChange={e => setInterest(parseFloat(e.target.value) || 0)} min={0} /></div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-center">
              <strong>सूत्र:</strong> चालू वर्ष कर + मागील थकबाकी + दंड + व्याज = एकूण मागणी
            </div>
            <Button onClick={handleGenerate} disabled={generating || !selectedPropertyId}><Receipt className="h-4 w-4 mr-1" />{generating ? 'तयार होत आहे...' : 'Generate Demand Register'}</Button>
          </div>
        </CardContent>
      </Card>
      {/* Records */}
      <Card>
        <CardHeader><div className="flex items-center justify-between flex-wrap gap-4"><CardTitle className="text-lg">नमुना ९ रेकॉर्ड्स</CardTitle><Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" />रिफ्रेश</Button></div></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div> :
           records.length === 0 ? <div className="text-center py-8 text-muted-foreground">नमुना ९ रेकॉर्ड नाहीत</div> : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table><TableHeader><TableRow>
                <TableHead>क्र.</TableHead><TableHead>मालमत्ता क्र.</TableHead><TableHead>मालक</TableHead><TableHead>वित्तीय वर्ष</TableHead>
                <TableHead className="text-right">चालू कर</TableHead><TableHead className="text-right">थकबाकी</TableHead><TableHead className="text-right">दंड</TableHead><TableHead className="text-right">व्याज</TableHead><TableHead className="text-right">एकूण मागणी</TableHead><TableHead className="text-right">शिल्लक</TableHead><TableHead>क्रिया</TableHead>
              </TableRow></TableHeader><TableBody>
                {records.map((r, i) => { const bal = getBalance(r); return (
                  <TableRow key={r.id}>
                    <TableCell>{i + 1}</TableCell><TableCell className="font-medium">{r.property.propertyNumber}</TableCell><TableCell>{getOwnerName(r.property)}</TableCell><TableCell>{r.financialYear}</TableCell>
                    <TableCell className="text-right">₹{r.currentTax.toFixed(2)}</TableCell><TableCell className="text-right">₹{r.previousBalance.toFixed(2)}</TableCell><TableCell className="text-right">₹{r.penalty.toFixed(2)}</TableCell><TableCell className="text-right">₹{r.interest.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">₹{r.totalDemand.toFixed(2)}</TableCell>
                    <TableCell className="text-right"><Badge variant={bal > 0 ? 'destructive' : 'default'}>₹{bal.toFixed(2)}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => handlePrint(r)}><Printer className="h-4 w-4 mr-1" />प्रिंट</Button></TableCell>
                  </TableRow>); })}
              </TableBody></Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
