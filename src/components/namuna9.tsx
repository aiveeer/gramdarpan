'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { FileText, Printer, RefreshCw, Search, Receipt } from 'lucide-react';

interface Payment {
  id: string;
  amountPaid: number;
  balance: number;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
}

interface Namuna9 {
  id: string;
  propertyId: string;
  financialYear: string;
  currentTax: number;
  previousBalance: number;
  penalty: number;
  totalDemand: number;
  payments: Payment[];
  property: {
    id: string;
    propertyNumber: string;
    ownerName: string;
    occupantName: string | null;
    mobileNumber: string | null;
    ward: string | null;
    road: string | null;
    area: number | null;
    constructionType: string | null;
    usageType: string | null;
  };
}

interface Property {
  id: string;
  propertyNumber: string;
  ownerName: string;
  mobileNumber: string | null;
  taxRates: { taxMasterId: string; rate: number; taxMaster: { name: string; nameMarathi: string; order: number } }[];
}

export default function Namuna9Component() {
  const [records, setRecords] = useState<Namuna9[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [previousBalance, setPreviousBalance] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [searching, setSearching] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, propRes] = await Promise.all([
        fetch('/api/namuna9'),
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/namuna9?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'शोध अयशस्वी', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPropertyId) {
      toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/namuna9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          financialYear,
          previousBalance,
          penalty,
        }),
      });
      if (res.ok) {
        toast({ title: 'यशस्वी', description: 'नमुना ९ (मागणी नोंदवही) तयार झाला' });
        fetchData();
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'नमुना ९ तयार करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = (record: Namuna9) => {
    const prop = record.property;
    const totalPaid = record.payments.reduce((sum: number, p: Payment) => sum + p.amountPaid, 0);
    const balance = record.totalDemand - totalPaid;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>नमुना ९ - मागणी नोंदवही</title>
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
        <h1>नमुना ९ - मागणी नोंदवही</h1>
        <h2>Demand Register</h2>
        <h2 style="font-size:13px;">वित्तीय वर्ष: ${record.financialYear}</h2>
        
        <div class="info-grid">
          <div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${prop.propertyNumber}</div>
          <div class="info-item"><strong>मालकाचे नाव:</strong> ${prop.ownerName}</div>
          <div class="info-item"><strong>भोगवटादार:</strong> ${prop.occupantName || '-'}</div>
          <div class="info-item"><strong>मोबाईल:</strong> ${prop.mobileNumber || '-'}</div>
          <div class="info-item"><strong>वार्ड:</strong> ${prop.ward || '-'}</div>
          <div class="info-item"><strong>रस्ता:</strong> ${prop.road || '-'}</div>
          <div class="info-item"><strong>क्षेत्रफळ:</strong> ${prop.area || '-'} चौ.फूट</div>
          <div class="info-item"><strong>बांधकाम:</strong> ${prop.constructionType || '-'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>वर्णन</th>
              <th style="text-align:right;">रक्कम (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>चालू वर्ष कर</td>
              <td style="text-align:right;">₹${record.currentTax.toFixed(2)}</td>
            </tr>
            <tr>
              <td>मागील थकबाकी</td>
              <td style="text-align:right;">₹${record.previousBalance.toFixed(2)}</td>
            </tr>
            <tr>
              <td>दंड</td>
              <td style="text-align:right;">₹${record.penalty.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>एकूण मागणी</strong></td>
              <td style="text-align:right;"><strong>₹${record.totalDemand.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td>एकूण भरलेली रक्कम</td>
              <td style="text-align:right;">₹${totalPaid.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>शिल्लक रक्कम</strong></td>
              <td style="text-align:right;"><strong>₹${balance.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        ${record.payments.length > 0 ? `
        <h3>पावती तपशील</h3>
        <table>
          <thead>
            <tr>
              <th>पावती क्र.</th>
              <th>दिनांक</th>
              <th>रक्कम (₹)</th>
              <th>पद्धत</th>
            </tr>
          </thead>
          <tbody>
            ${record.payments.map((p: Payment) => `
              <tr>
                <td>${p.receiptNumber}</td>
                <td>${new Date(p.paymentDate).toLocaleDateString('mr-IN')}</td>
                <td>₹${p.amountPaid.toFixed(2)}</td>
                <td>${p.paymentMethod}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

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

  const getBalanceForRecord = (record: Namuna9) => {
    const totalPaid = record.payments.reduce((sum: number, p: Payment) => sum + p.amountPaid, 0);
    return record.totalDemand - totalPaid;
  };

  return (
    <div className="space-y-6">
      {/* Search & Generate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">नमुना ९ - मागणी नोंदवही (Demand Register)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Citizen */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base">नागरिक शोधा (Search Citizen)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <Label>मालमत्ता क्र./मोबाईल/मालक नाव</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="शोधा..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="outline" onClick={handleSearch} disabled={searching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>निवडलेली मालमत्ता:</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {searchResults.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyNumber} - {p.ownerName} {p.mobileNumber ? `(${p.mobileNumber})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Generate Demand */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base">मागणी नोंदवही तयार करा</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>मालमत्ता निवडा (मॅन्युअल)</Label>
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
              <div>
                <Label>मागील थकबाकी (₹)</Label>
                <Input
                  type="number"
                  value={previousBalance}
                  onChange={(e) => setPreviousBalance(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div>
                <Label>दंड (₹)</Label>
                <Input
                  type="number"
                  value={penalty}
                  onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">चालू वर्ष कर</div>
                  <div className="text-lg font-bold">₹{previousBalance === 0 && penalty === 0 ? '---' : '+'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">मागील थकबाकी</div>
                  <div className="text-lg font-bold">₹{previousBalance.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">दंड</div>
                  <div className="text-lg font-bold">₹{penalty.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">एकूण मागणी</div>
                  <div className="text-lg font-bold text-primary">= ऑटो कॅल्क्युलेट</div>
                </div>
              </div>
              <div className="text-xs text-center text-muted-foreground mt-2">
                चालू वर्ष कर + मागील थकबाकी + दंड = एकूण मागणी
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={generating || !selectedPropertyId} className="w-full sm:w-auto">
              <Receipt className="h-4 w-4 mr-1" />
              {generating ? 'तयार होत आहे...' : 'Generate Demand Register'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">नमुना ९ रेकॉर्ड्स</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">नमुना ९ रेकॉर्ड नाहीत. वर मागणी नोंदवही तयार करा.</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto" ref={printRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>क्र.</TableHead>
                    <TableHead>मालमत्ता क्र.</TableHead>
                    <TableHead>मालक</TableHead>
                    <TableHead>वित्तीय वर्ष</TableHead>
                    <TableHead className="text-right">चालू कर</TableHead>
                    <TableHead className="text-right">थकबाकी</TableHead>
                    <TableHead className="text-right">दंड</TableHead>
                    <TableHead className="text-right">एकूण मागणी</TableHead>
                    <TableHead className="text-right">शिल्लक</TableHead>
                    <TableHead>क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r, index) => {
                    const balance = getBalanceForRecord(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{r.property.propertyNumber}</TableCell>
                        <TableCell>{r.property.ownerName}</TableCell>
                        <TableCell>{r.financialYear}</TableCell>
                        <TableCell className="text-right">₹{r.currentTax.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{r.previousBalance.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{r.penalty.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{r.totalDemand.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={balance > 0 ? 'destructive' : 'default'}>
                            ₹{balance.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(r)}>
                            <Printer className="h-4 w-4 mr-1" /> प्रिंट
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
