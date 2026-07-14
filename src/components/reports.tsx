'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calculator, Receipt, CreditCard, ClipboardList,
  Warehouse, Wallet, Landmark, BarChart3,
  ArrowLeft, AlertCircle, RefreshCw,
} from 'lucide-react';

// ===== TYPES =====

interface ReportsProps {
  financialYear: string;
}

interface ReportConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  apiEndpoint: string;
  description: string;
  columns: { key: string; label: string; align?: string; format?: 'currency' | 'percent' }[];
}

// ===== HELPERS =====

function safeExtract(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.records)) return obj.records;
  }
  return [];
}

function formatValue(val: unknown, format?: string): string {
  if (val === null || val === undefined) return '-';
  if (format === 'currency') return `₹${Number(val).toLocaleString('en-IN')}`;
  if (format === 'percent') return `${Number(val)}%`;
  if (typeof val === 'boolean') return val ? 'हो' : 'नाही';
  if (typeof val === 'object') {
    // Nested object - try to get name fields
    const obj = val as Record<string, unknown>;
    return String(obj.nameMr || obj.name || obj.headNameMr || obj.headName || obj.employeeNameMr || obj.employeeName || obj.schemeNameMr || obj.schemeName || JSON.stringify(val));
  }
  return String(val);
}

// ===== REPORT CONFIGS =====

const reportConfigs: ReportConfig[] = [
  {
    id: 'tax-assessment',
    title: 'कर आकारणी अहवाल',
    icon: <Calculator className="h-6 w-6" />,
    apiEndpoint: '/api/tax-assessment',
    description: 'सर्व कर आकारणीचा तपशील',
    columns: [
      { key: 'property.propertyNo', label: 'मालमत्ता क्र.' },
      { key: 'property.ownerNameMr', label: 'मालक' },
      { key: 'totalTax', label: 'एकूण कर', align: 'right', format: 'currency' },
      { key: 'concession', label: 'सवलत', align: 'right', format: 'currency' },
      { key: 'netDemand', label: 'निव्वळ मागणी', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'demand',
    title: 'मागणी व वसूल अहवाल',
    icon: <Receipt className="h-6 w-6" />,
    apiEndpoint: '/api/demand',
    description: 'मागणी व वसूल तपशील',
    columns: [
      { key: 'property.propertyNo', label: 'मालमत्ता क्र.' },
      { key: 'totalDemand', label: 'एकूण मागणी', align: 'right', format: 'currency' },
      { key: 'totalCollection', label: 'एकूण वसूल', align: 'right', format: 'currency' },
      { key: 'closingBalance', label: 'शिल्लक', align: 'right', format: 'currency' },
      { key: 'penalty', label: 'दंड', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'receipt',
    title: 'प्राप्ती अहवाल',
    icon: <CreditCard className="h-6 w-6" />,
    apiEndpoint: '/api/transactions?type=receipt',
    description: 'सर्व प्राप्ती नोंदी',
    columns: [
      { key: 'receiptNo', label: 'पावती क्र.' },
      { key: 'payerName', label: 'देणार' },
      { key: 'amount', label: 'रक्कम', align: 'right', format: 'currency' },
      { key: 'taxType', label: 'कर प्रकार' },
      { key: 'paymentMode', label: 'पद्धत' },
    ],
  },
  {
    id: 'payment',
    title: 'पावती अहवाल',
    icon: <CreditCard className="h-6 w-6" />,
    apiEndpoint: '/api/transactions?type=payment',
    description: 'सर्व पावती नोंदी',
    columns: [
      { key: 'voucherNo', label: 'वाउचर क्र.' },
      { key: 'payeeName', label: 'घेणार' },
      { key: 'amount', label: 'रक्कम', align: 'right', format: 'currency' },
      { key: 'headOfAccount', label: 'शिर्षक' },
      { key: 'paymentMode', label: 'पद्धत' },
    ],
  },
  {
    id: 'budget',
    title: 'बजेट अहवाल',
    icon: <ClipboardList className="h-6 w-6" />,
    apiEndpoint: '/api/budget',
    description: 'बजेट शिर्षक तपशील',
    columns: [
      { key: 'headCode', label: 'शिर्षक कोड' },
      { key: 'headNameMr', label: 'शिर्षक नाव' },
      { key: 'category', label: 'वर्ग' },
      { key: 'budgetAmount', label: 'बजेट रक्कम', align: 'right', format: 'currency' },
      { key: 'expenditure', label: 'खर्च', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'asset',
    title: 'मालमत्ता अहवाल',
    icon: <Warehouse className="h-6 w-6" />,
    apiEndpoint: '/api/assets',
    description: 'स्थावर मालमत्ता तपशील',
    columns: [
      { key: 'assetName', label: 'नाव' },
      { key: 'assetType', label: 'प्रकार' },
      { key: 'purchaseCost', label: 'खरेदी किंमत', align: 'right', format: 'currency' },
      { key: 'currentValue', label: 'सध्याचे मूल्य', align: 'right', format: 'currency' },
      { key: 'status', label: 'स्थिती' },
    ],
  },
  {
    id: 'salary',
    title: 'पगार अहवाल',
    icon: <Wallet className="h-6 w-6" />,
    apiEndpoint: '/api/salary',
    description: 'पगार नोंद तपशील',
    columns: [
      { key: 'employee.employeeNameMr', label: 'कर्मचारी' },
      { key: 'month', label: 'महिना' },
      { key: 'basicPay', label: 'मूळ वेतन', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'कपलेली', align: 'right', format: 'currency' },
      { key: 'netPay', label: 'निव्वळ', align: 'right', format: 'currency' },
    ],
  },
  {
    id: 'bank',
    title: 'बँक अहवाल',
    icon: <Landmark className="h-6 w-6" />,
    apiEndpoint: '/api/bank',
    description: 'बँक खाते तपशील',
    columns: [
      { key: 'bankName', label: 'बँकेचे नाव' },
      { key: 'accountNo', label: 'खाते क्र.' },
      { key: 'accountType', label: 'प्रकार' },
      { key: 'openingBalance', label: 'आरंभी शिल्लक', align: 'right', format: 'currency' },
      { key: 'balance', label: 'शिल्लक', align: 'right', format: 'currency' },
    ],
  },
];

// ===== COMPONENT =====

export default function Reports({ financialYear }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(financialYear);

  const config = reportConfigs.find(r => r.id === activeReport);

  const fetchReport = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const sep = config.apiEndpoint.includes('?') ? '&' : '?';
      const res = await fetch(`${config.apiEndpoint}${sep}financialYear=${yearFilter}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setRecords(safeExtract(data) as Record<string, unknown>[]);
    } catch {
      setError('अहवाल लोड करताना त्रुटी आली');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [config, yearFilter]);

  useEffect(() => {
    if (activeReport) fetchReport();
  }, [activeReport, fetchReport]);

  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  };

  // Show report cards
  if (!activeReport) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">अहवाल</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">आर्थिक वर्ष:</span>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2025-26">2025-26</SelectItem>
                <SelectItem value="2023-24">2023-24</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportConfigs.map(report => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow border"
              onClick={() => setActiveReport(report.id)}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {report.icon}
                </div>
                <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show report table
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveReport(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />मागे
          </Button>
          <h2 className="text-lg font-semibold">{config?.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">आर्थिक वर्ष:</span>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-25">2024-25</SelectItem>
              <SelectItem value="2025-26">2025-26</SelectItem>
              <SelectItem value="2023-24">2023-24</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReport}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchReport}><RefreshCw className="h-4 w-4 mr-2" />पुन्हा प्रयत्न करा</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10">#</TableHead>
                    {config?.columns.map(col => (
                      <TableHead key={col.key} className={`text-xs ${col.align === 'right' ? 'text-right' : ''}`}>
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(config?.columns.length || 0) + 1} className="text-center text-muted-foreground py-8">
                        कोणतेही माहिती उपलब्ध नाही
                      </TableCell>
                    </TableRow>
                  ) : records.map((rec, idx) => (
                    <TableRow key={String(rec.id || idx)}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {config?.columns.map(col => (
                        <TableCell key={col.key} className={`text-sm ${col.align === 'right' ? 'text-right' : ''}`}>
                          {formatValue(getNestedValue(rec, col.key), col.format)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {!loading && !error && records.length > 0 && (
        <div className="flex gap-4">
          <Badge variant="outline">एकूण नोंदी: {records.length}</Badge>
        </div>
      )}
    </div>
  );
}
