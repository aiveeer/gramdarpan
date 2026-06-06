'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  };
}

interface Property {
  id: string;
  propertyNumber: string;
  ownerName: string;
  occupantName: string | null;
  mobileNumber: string | null;
}

export default function Namuna9KaComponent() {
  const [namuna9Records, setNamuna9Records] = useState<Namuna9[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Payment form
  const [selectedNamuna9Id, setSelectedNamuna9Id] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paying, setPaying] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Payment | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  // All payments
  const [allPayments, setAllPayments] = useState<Payment[]>([]);

  const fetchNamuna9Data = useCallback(async () => {
    setLoading(true);
    try {
      const [n9Res, propRes] = await Promise.all([
        fetch('/api/namuna9'),
        fetch('/api/property'),
      ]);
      setNamuna9Records(await n9Res.json());
      setProperties(await propRes.json());
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNamuna9Data();
  }, [fetchNamuna9Data]);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payment');
      setAllPayments(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/property?search=${encodeURIComponent(searchQuery)}`);
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

  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const n9 = namuna9Records.find(n => n.propertyId === propId);
    if (n9) {
      setSelectedNamuna9Id(n9.id);
      // Calculate balance
      const totalPaid = n9.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      const balance = n9.totalDemand - totalPaid;
      setPaymentAmount(balance.toFixed(2));
    }
  };

  const handlePay = async () => {
    if (!selectedPropertyId || !selectedNamuna9Id || !paymentAmount) {
      toast({ title: 'त्रुटी', description: 'सर्व माहिती भरा', variant: 'destructive' });
      return;
    }

    const n9 = namuna9Records.find(n => n.id === selectedNamuna9Id);
    if (n9) {
      const totalPaid = n9.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      const balance = n9.totalDemand - totalPaid;
      if (parseFloat(paymentAmount) > balance) {
        toast({ title: 'त्रुटी', description: `शिल्लक रक्कम ₹${balance.toFixed(2)} पेक्षा जास्त आहे`, variant: 'destructive' });
        return;
      }
    }

    setPaying(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          namuna9Id: selectedNamuna9Id,
          amountPaid: parseFloat(paymentAmount),
          paymentMethod,
        }),
      });

      if (res.ok) {
        const payment = await res.json();
        setLastReceipt(payment);
        setReceiptDialogOpen(true);
        toast({ title: 'यशस्वी', description: 'पावती तयार झाली' });
        setPaymentAmount('');
        fetchNamuna9Data();
        fetchPayments();
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'पेमेंट अयशस्वी', variant: 'destructive' });
    } finally {
      setPaying(false);
    }
  };

  const handlePrintReceipt = (payment: Payment, n9?: Namuna9) => {
    const prop = n9?.property || namuna9Records.find(r => r.id === payment.namuna9Id)?.property;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>नमुना ९-क - पावती</title>
        <style>
          body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
          h2 { text-align: center; font-size: 14px; margin-bottom: 15px; }
          .receipt-box { border: 2px solid #333; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; }
          .info-item { font-size: 13px; }
          .info-item strong { display: inline-block; min-width: 130px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #333; padding: 8px; font-size: 13px; text-align: left; }
          th { background-color: #f0f0f0; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .highlight { font-size: 16px; font-weight: bold; text-align: center; padding: 10px; background-color: #e8f5e9; border-radius: 4px; margin: 10px 0; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; padding-top: 10px; border-top: 1px solid #ccc; }
          .stamp { width: 120px; height: 60px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1>नमुना ९-क</h1>
            <h2>पावती (Receipt)</h2>
          </div>

          <div class="info-grid">
            <div class="info-item"><strong>पावती क्रमांक:</strong> ${payment.receiptNumber}</div>
            <div class="info-item"><strong>दिनांक:</strong> ${new Date(payment.paymentDate).toLocaleDateString('mr-IN')}</div>
            ${prop ? `
            <div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${prop.propertyNumber}</div>
            <div class="info-item"><strong>मालकाचे नाव:</strong> ${prop.ownerName}</div>
            <div class="info-item"><strong>भोगवटादार:</strong> ${prop.occupantName || '-'}</div>
            <div class="info-item"><strong>मोबाईल:</strong> ${prop.mobileNumber || '-'}</div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>वर्णन</th>
                <th style="text-align:right;">रक्कम (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${n9 ? `
              <tr>
                <td>एकूण मागणी</td>
                <td style="text-align:right;">₹${n9.totalDemand.toFixed(2)}</td>
              </tr>
              <tr>
                <td>मागील भरलेली रक्कम</td>
                <td style="text-align:right;">₹${(n9.totalDemand - payment.balance - payment.amountPaid).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>प्राप्त रक्कम (Received)</td>
                <td style="text-align:right;"><strong>₹${payment.amountPaid.toFixed(2)}</strong></td>
              </tr>
              <tr class="total-row">
                <td>शिल्लक (Balance)</td>
                <td style="text-align:right;"><strong>₹${payment.balance.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="highlight">
            प्राप्त रक्कम: ₹${payment.amountPaid.toFixed(2)} | पद्धत: ${payment.paymentMethod}
          </div>

          <div class="footer">
            <div>
              <div>दिनांक: ${new Date(payment.paymentDate).toLocaleDateString('mr-IN')}</div>
              <div>वेळ: ${new Date(payment.paymentDate).toLocaleTimeString('mr-IN')}</div>
            </div>
            <div>
              <div class="stamp">मुद्रा / सही</div>
            </div>
          </div>
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

  const getOutstandingForProperty = (propertyId: string) => {
    const records = namuna9Records.filter(n => n.propertyId === propertyId);
    const totalDemand = records.reduce((sum, n) => sum + n.totalDemand, 0);
    const totalPaid = records.reduce((sum, n) => sum + n.payments.reduce((s, p) => s + p.amountPaid, 0), 0);
    return { totalDemand, totalPaid, balance: totalDemand - totalPaid };
  };

  const selectedN9 = namuna9Records.find(n => n.id === selectedNamuna9Id);
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const outstandingInfo = selectedPropertyId ? getOutstandingForProperty(selectedPropertyId) : null;

  return (
    <div className="space-y-6">
      {/* Search & Pay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">नमुना ९-क - पावती (Receipt)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Citizen */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              नागरिक शोधा
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
              <div>
                <Label>निवडलेली मालमत्ता:</Label>
                <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
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

          {/* Outstanding Info */}
          {outstandingInfo && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-base mb-3">बक्की माहिती</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">एकूण मागणी</div>
                  <div className="text-xl font-bold">₹{outstandingInfo.totalDemand.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">भरलेली रक्कम</div>
                  <div className="text-xl font-bold text-green-700">₹{outstandingInfo.totalPaid.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">शिल्लक</div>
                  <div className="text-xl font-bold text-red-700">₹{outstandingInfo.balance.toFixed(2)}</div>
                </div>
              </div>

              {/* Partial Payment Info */}
              <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
                <strong>उदाहरण:</strong> जर मागणी ₹5,000 असेल व ₹2,000 भरले, तर शिल्लक ₹3,000 पावतीत दिसेल.
              </div>
            </div>
          )}

          {/* Payment Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              पेमेंट एंट्री
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>मालमत्ता निवडा</Label>
                <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
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
                <Label>नमुना ९ निवडा</Label>
                <Select value={selectedNamuna9Id} onValueChange={setSelectedNamuna9Id}>
                  <SelectTrigger><SelectValue placeholder="नमुना ९ निवडा" /></SelectTrigger>
                  <SelectContent>
                    {namuna9Records
                      .filter(n => n.propertyId === selectedPropertyId)
                      .map(n => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.financialYear} - ₹{n.totalDemand}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>रक्कम (₹)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="रक्कम"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <Label>पेमेंट पद्धत</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">रोख</SelectItem>
                    <SelectItem value="Cheque">चेक</SelectItem>
                    <SelectItem value="Online">ऑनलाइन</SelectItem>
                    <SelectItem value="DD">डिमांड ड्राफ्ट</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handlePay} disabled={paying || !selectedNamuna9Id} className="w-full sm:w-auto">
              <CreditCard className="h-4 w-4 mr-1" />
              {paying ? 'प्रक्रिया सुरू...' : 'पावती तयार करा'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">अलीकडील पावत्या</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPayments}>
              <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">पावत्या नाहीत.</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>पावती क्र.</TableHead>
                    <TableHead>दिनांक</TableHead>
                    <TableHead>मालमत्ता</TableHead>
                    <TableHead>मालक</TableHead>
                    <TableHead className="text-right">भरलेली रक्कम</TableHead>
                    <TableHead className="text-right">शिल्लक</TableHead>
                    <TableHead>पद्धत</TableHead>
                    <TableHead>क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map((p) => {
                    const n9 = namuna9Records.find(n => n.id === p.namuna9Id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.receiptNumber}</TableCell>
                        <TableCell>{new Date(p.paymentDate).toLocaleDateString('mr-IN')}</TableCell>
                        <TableCell>{n9?.property?.propertyNumber || '-'}</TableCell>
                        <TableCell>{n9?.property?.ownerName || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-700">₹{p.amountPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.balance > 0 ? 'destructive' : 'default'}>
                            ₹{p.balance.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.paymentMethod}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(p, n9)}>
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

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              पावती तयार झाली
            </DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4">
              <div className="border-2 rounded-lg p-6 space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">नमुना ९-क - पावती</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><strong>पावती क्रमांक:</strong> {lastReceipt.receiptNumber}</div>
                  <div><strong>दिनांक:</strong> {new Date(lastReceipt.paymentDate).toLocaleDateString('mr-IN')}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><strong>मालमत्ता:</strong> {selectedProperty?.propertyNumber}</div>
                  <div><strong>मालक:</strong> {selectedProperty?.ownerName}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-muted-foreground">प्राप्त रक्कम</div>
                  <div className="text-3xl font-bold text-green-700">₹{lastReceipt.amountPaid.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-muted-foreground">शिल्लक</div>
                    <div className="text-xl font-bold text-red-700">₹{lastReceipt.balance.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-sm text-muted-foreground">पद्धत</div>
                    <div className="text-xl font-bold">{lastReceipt.paymentMethod}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handlePrintReceipt(lastReceipt, selectedN9)}>
                  <Printer className="h-4 w-4 mr-1" /> प्रिंट करा
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
