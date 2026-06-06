'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { FileText, Printer, RefreshCw, Search } from 'lucide-react';

interface TaxDetail {
  taxMasterId: string;
  taxName: string;
  taxNameMarathi: string;
  rate: number;
  amount: number;
}

interface PropertyTaxRate {
  id: string;
  taxMasterId: string;
  rate: number;
  taxMaster: {
    id: string;
    name: string;
    nameMarathi: string;
    rate: number;
    isEnabled: boolean;
    order: number;
  };
}

interface Property {
  id: string;
  propertyNumber: string;
  ownerName: string;
  occupantName: string | null;
  mobileNumber: string | null;
  ward: string | null;
  road: string | null;
  citySurveyNo: string | null;
  area: number | null;
  boundaries: string | null;
  constructionType: string | null;
  usageType: string | null;
  floorInfo: string | null;
  taxRates: PropertyTaxRate[];
}

interface Namuna8 {
  id: string;
  propertyId: string;
  financialYear: string;
  taxDetails: string;
  totalTax: number;
  property: Property;
}

export default function Namuna8Component() {
  const [records, setRecords] = useState<Namuna8[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, propRes] = await Promise.all([
        fetch('/api/namuna8'),
        fetch('/api/property'),
      ]);
      setRecords(await recRes.json());
      setProperties(await propRes.json());
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!selectedPropertyId) {
      toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/namuna8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId, financialYear }),
      });
      if (res.ok) {
        toast({ title: 'यशस्वी', description: 'नमुना ८ तयार झाला' });
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'नमुना ८ तयार करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (properties.length === 0) {
      toast({ title: 'त्रुटी', description: 'मालमत्ता नाहीत', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      for (const prop of properties) {
        await fetch('/api/namuna8', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: prop.id, financialYear }),
        });
      }
      toast({ title: 'यशस्वी', description: 'सर्व मालमत्तांसाठी नमुना ८ तयार झाला' });
      fetchData();
    } catch {
      toast({ title: 'त्रुटी', description: 'नमुना ८ तयार करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = (record: Namuna8) => {
    const taxDetails: TaxDetail[] = JSON.parse(record.taxDetails || '[]');
    const property = record.property;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>नमुना ८ - कर आकारणी नोंदवही</title>
        <style>
          body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
          h2 { text-align: center; font-size: 14px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; }
          .info-item { font-size: 13px; }
          .info-item strong { display: inline-block; min-width: 150px; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>नमुना ८ - कर आकारणी नोंदवही</h1>
        <h2>Tax Assessment Register</h2>
        <h2 style="font-size:13px;">वित्तीय वर्ष: ${record.financialYear}</h2>
        
        <div class="info-grid">
          <div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${property.propertyNumber}</div>
          <div class="info-item"><strong>मालकाचे नाव:</strong> ${property.ownerName}</div>
          <div class="info-item"><strong>भोगवटादार:</strong> ${property.occupantName || '-'}</div>
          <div class="info-item"><strong>मोबाईल:</strong> ${property.mobileNumber || '-'}</div>
          <div class="info-item"><strong>वार्ड:</strong> ${property.ward || '-'}</div>
          <div class="info-item"><strong>रस्ता:</strong> ${property.road || '-'}</div>
          <div class="info-item"><strong>सिटी सर्व्हे नं.:</strong> ${property.citySurveyNo || '-'}</div>
          <div class="info-item"><strong>क्षेत्रफळ:</strong> ${property.area || '-'} चौ.फूट</div>
          <div class="info-item"><strong>चतु:सीमा:</strong> ${property.boundaries || '-'}</div>
          <div class="info-item"><strong>बांधकाम प्रकार:</strong> ${property.constructionType || '-'}</div>
          <div class="info-item"><strong>वापर प्रकार:</strong> ${property.usageType || '-'}</div>
          <div class="info-item"><strong>मजला माहिती:</strong> ${property.floorInfo || '-'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>क्र.</th>
              <th>कराचे नाव</th>
              <th>दर (₹/चौ.फूट)</th>
              <th>क्षेत्रफळ (चौ.फूट)</th>
              <th>रक्कम (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${taxDetails.map((td: TaxDetail, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>${td.taxNameMarathi} (${td.taxName})</td>
                <td>${td.rate}</td>
                <td>${property.area || 0}</td>
                <td>${td.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align:right;"><strong>एकूण कर</strong></td>
              <td><strong>₹${record.totalTax.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div>
          <div>सही व मुद्रा</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.property.propertyNumber.toLowerCase().includes(s) ||
      r.property.ownerName.toLowerCase().includes(s) ||
      r.financialYear.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl">नमुना ८ - कर आकारणी नोंदवही</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>मालमत्ता निवडा</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger><SelectValue placeholder="मालमत्ता निवडा" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyNumber} - {p.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>वित्तीय वर्ष</Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={generating || !selectedPropertyId}>
                <FileText className="h-4 w-4 mr-1" />
                {generating ? 'तयार होत आहे...' : 'नमुना ८ तयार करा'}
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleGenerateAll} disabled={generating}>
                सर्वांसाठी तयार करा
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="मालमत्ता क्र./मालक नाव शोधा..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">नमुना ८ रेकॉर्ड नाहीत. वर नमुना ८ तयार करा.</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto" ref={printRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>क्र.</TableHead>
                    <TableHead>मालमत्ता क्र.</TableHead>
                    <TableHead>मालकाचे नाव</TableHead>
                    <TableHead>वार्ड</TableHead>
                    <TableHead>क्षेत्रफळ</TableHead>
                    <TableHead>बांधकाम</TableHead>
                    <TableHead>वापर</TableHead>
                    <TableHead>वित्तीय वर्ष</TableHead>
                    <TableHead className="text-right">एकूण कर (₹)</TableHead>
                    <TableHead>क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r, index) => (
                    <TableRow key={r.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{r.property.propertyNumber}</TableCell>
                      <TableCell>{r.property.ownerName}</TableCell>
                      <TableCell>{r.property.ward || '-'}</TableCell>
                      <TableCell>{r.property.area || '-'}</TableCell>
                      <TableCell>{r.property.constructionType || '-'}</TableCell>
                      <TableCell>{r.property.usageType || '-'}</TableCell>
                      <TableCell>{r.financialYear}</TableCell>
                      <TableCell className="text-right font-semibold">₹{r.totalTax.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handlePrint(r)}>
                          <Printer className="h-4 w-4 mr-1" /> प्रिंट
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
    </div>
  );
}
