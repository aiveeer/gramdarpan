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
import { FileText, Printer, RefreshCw, Search } from 'lucide-react';

interface TaxDetail { taxMasterId: string; taxName: string; taxNameMarathi: string; rate: number; amount: number; }
interface OwnerInfo { owner: { firstName: string; lastName: string; firstNameMr: string; lastNameMr: string }; ownershipType: string }
interface PropertyInfo { id: string; propertyNumber: string; area: number | null; constructionType: string | null; usageType: string | null; ward?: { wardNameMr: string }; road?: { roadNameMr: string }; owners: OwnerInfo[]; taxRates: { taxMasterId: string; rate: number; taxMaster: { name: string; nameMarathi: string; isEnabled: boolean; order: number } }[] }
interface Namuna8Record { id: string; propertyId: string; financialYear: string; taxDetails: string; totalTax: number; property: PropertyInfo }

export default function Namuna8Component() {
  const [records, setRecords] = useState<Namuna8Record[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, propRes] = await Promise.all([fetch('/api/namuna8'), fetch('/api/master?table=property')]);
      setRecords(await recRes.json());
      setProperties(await propRes.json());
    } catch { toast({ title: 'त्रुटी', description: 'डेटा लोड अयशस्वी', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!selectedPropertyId) { toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/namuna8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: selectedPropertyId, financialYear }) });
      if (res.ok) { toast({ title: 'यशस्वी', description: 'नमुना ८ तयार झाला' }); fetchData(); }
      else { const err = await res.json(); toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' }); }
    } catch { toast({ title: 'त्रुटी', description: 'नमुना ८ तयार करण्यात अयशस्वी', variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const handleGenerateAll = async () => {
    if (properties.length === 0) return;
    setGenerating(true);
    try {
      for (const prop of properties) { await fetch('/api/namuna8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: prop.id, financialYear }) }); }
      toast({ title: 'यशस्वी', description: 'सर्वांसाठी नमुना ८ तयार' }); fetchData();
    } catch { toast({ title: 'त्रुटी', variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const getOwnerName = (prop: PropertyInfo) => {
    const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
    if (!owner) return prop.owners?.[0] ? `${prop.owners[0].owner.firstNameMr || prop.owners[0].owner.firstName} ${prop.owners[0].owner.lastNameMr || prop.owners[0].owner.lastName}` : '-';
    return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
  };

  const handlePrint = (record: Namuna8Record) => {
    const taxDetails: TaxDetail[] = JSON.parse(record.taxDetails || '[]');
    const prop = record.property;
    const ownerName = getOwnerName(prop);
    const occupant = prop.owners?.find(o => o.ownershipType === 'भोगवटादार');

    const printContent = `<!DOCTYPE html><html><head><title>नमुना ८</title>
<style>body{font-family:'Noto Sans Devanagari',Arial,sans-serif;margin:20px}h1{text-align:center;font-size:18px}h2{text-align:center;font-size:14px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #333;padding:6px 8px;font-size:12px}th{background:#f0f0f0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px}.info-item{font-size:13px}.info-item strong{display:inline-block;min-width:140px}.total-row{font-weight:bold;background:#f9f9f9}.footer{margin-top:30px;display:flex;justify-content:space-between;font-size:12px}@media print{body{margin:0}}</style></head><body>
<h1>नमुना ८ - कर आकारणी नोंदवही</h1><h2>Tax Assessment Register</h2><h2 style="font-size:13px">वित्तीय वर्ष: ${record.financialYear}</h2>
<div class="info-grid">
<div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${prop.propertyNumber}</div>
<div class="info-item"><strong>मालकाचे नाव:</strong> ${ownerName}</div>
<div class="info-item"><strong>भोगवटादार:</strong> ${occupant ? `${occupant.owner.firstNameMr || occupant.owner.firstName} ${occupant.owner.lastNameMr || occupant.owner.lastName}` : '-'}</div>
<div class="info-item"><strong>वार्ड:</strong> ${prop.ward?.wardNameMr || '-'}</div>
<div class="info-item"><strong>रस्ता:</strong> ${prop.road?.roadNameMr || '-'}</div>
<div class="info-item"><strong>क्षेत्रफळ:</strong> ${prop.area || '-'} चौ.फूट</div>
<div class="info-item"><strong>बांधकाम प्रकार:</strong> ${prop.constructionType || '-'}</div>
<div class="info-item"><strong>वापर प्रकार:</strong> ${prop.usageType || '-'}</div>
</div>
<table><thead><tr><th>क्र.</th><th>कराचे नाव</th><th>दर (₹/चौ.फूट)</th><th>क्षेत्रफळ</th><th>रक्कम (₹)</th></tr></thead><tbody>
${taxDetails.map((td, i) => `<tr><td>${i + 1}</td><td>${td.taxNameMarathi} (${td.taxName})</td><td>${td.rate}</td><td>${prop.area || 0}</td><td>${td.amount.toFixed(2)}</td></tr>`).join('')}
<tr class="total-row"><td colspan="4" style="text-align:right"><strong>एकूण कर</strong></td><td><strong>₹${record.totalTax.toFixed(2)}</strong></td></tr></tbody></table>
<div class="footer"><div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div><div>सही व मुद्रा</div></div></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
  };

  const filtered = records.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return r.property.propertyNumber.toLowerCase().includes(s) || getOwnerName(r.property).toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl">नमुना ८ - कर आकारणी नोंदवही</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}><RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div><Label>मालमत्ता निवडा</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                <SelectContent>{properties.map(p => (<SelectItem key={p.id} value={p.id}>{p.propertyNumber} - {getOwnerName(p)}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>वित्तीय वर्ष</Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['2023-24', '2024-25', '2025-26'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button onClick={handleGenerate} disabled={generating || !selectedPropertyId}><FileText className="h-4 w-4 mr-1" />{generating ? 'तयार होत आहे...' : 'नमुना ८ तयार करा'}</Button></div>
            <div className="flex items-end"><Button variant="outline" onClick={handleGenerateAll} disabled={generating}>सर्वांसाठी</Button></div>
          </div>
          <div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="मालमत्ता क्र./मालक नाव शोधा..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div></div>
          {loading ? <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div> :
           filtered.length === 0 ? <div className="text-center py-8 text-muted-foreground">नमुना ८ रेकॉर्ड नाहीत</div> : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table><TableHeader><TableRow>
                <TableHead>क्र.</TableHead><TableHead>मालमत्ता क्र.</TableHead><TableHead>मालक</TableHead><TableHead>वार्ड</TableHead><TableHead>क्षेत्रफळ</TableHead><TableHead>बांधकाम</TableHead><TableHead>वापर</TableHead><TableHead>वित्तीय वर्ष</TableHead><TableHead className="text-right">एकूण कर (₹)</TableHead><TableHead>क्रिया</TableHead>
              </TableRow></TableHeader><TableBody>
                {filtered.map((r, i) => (<TableRow key={r.id}>
                  <TableCell>{i + 1}</TableCell><TableCell className="font-medium">{r.property.propertyNumber}</TableCell><TableCell>{getOwnerName(r.property)}</TableCell>
                  <TableCell>{r.property.ward?.wardNameMr || '-'}</TableCell><TableCell>{r.property.area || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{r.property.constructionType || '-'}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{r.property.usageType || '-'}</Badge></TableCell>
                  <TableCell>{r.financialYear}</TableCell><TableCell className="text-right font-semibold">₹{r.totalTax.toFixed(2)}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => handlePrint(r)}><Printer className="h-4 w-4 mr-1" />प्रिंट</Button></TableCell>
                </TableRow>))}
              </TableBody></Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
