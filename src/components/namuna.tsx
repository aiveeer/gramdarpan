'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BookOpen, ArrowLeft, RefreshCw, AlertCircle, FileText,
  Calculator, Receipt, Landmark, Warehouse, Users, Building2,
  Wallet, ClipboardList, TrendingUp, CreditCard, Package,
} from 'lucide-react';

interface NamunaProps {
  financialYear: string;
}

interface NamunaInfo {
  number: number;
  name: string;
  nameMr: string;
  icon: React.ElementType;
  gradient: string;
}

const NAMUNA_LIST: NamunaInfo[] = [
  { number: 1, name: 'Budget Estimate', nameMr: 'अंदाजपत्रक', icon: Calculator, gradient: 'from-teal-500 to-teal-600' },
  { number: 2, name: 'Re-appropriation & Revised Budget', nameMr: 'पुनर्विनियोजन / सुधारित अंदाज', icon: Calculator, gradient: 'from-teal-600 to-teal-700' },
  { number: 3, name: 'Cash Book', nameMr: 'रोख रजिस्टर', icon: Wallet, gradient: 'from-orange-400 to-orange-600' },
  { number: 4, name: 'Bank Book', nameMr: 'बँक रजिस्टर', icon: Landmark, gradient: 'from-blue-500 to-blue-700' },
  { number: 5, name: 'Asset Register', nameMr: 'स्थावर मालमत्ता रजिस्टर', icon: Building2, gradient: 'from-emerald-400 to-emerald-600' },
  { number: 6, name: 'Stock Register', nameMr: 'साठा रजिस्टर', icon: Package, gradient: 'from-amber-400 to-amber-600' },
  { number: 7, name: 'Grant Register', nameMr: 'अनुदान रजिस्टर', icon: TrendingUp, gradient: 'from-cyan-400 to-cyan-600' },
  { number: 8, name: 'Property Tax Register', nameMr: 'मालमत्ता कर रजिस्टर', icon: Receipt, gradient: 'from-red-400 to-red-600' },
  { number: 9, name: 'Demand Register', nameMr: 'मागणी व वसूल रजिस्टर', icon: ClipboardList, gradient: 'from-purple-500 to-purple-700' },
  { number: 10, name: 'Scheme Grant Register', nameMr: 'योजना अनुदान रजिस्टर', icon: CreditCard, gradient: 'from-pink-400 to-pink-600' },
  { number: 11, name: 'Water Tax Register', nameMr: 'पाणीपट्टी रजिस्टर', icon: Landmark, gradient: 'from-sky-400 to-sky-600' },
  { number: 12, name: 'Light Tax Register', nameMr: 'दिवाबत्ती कर रजिस्टर', icon: Receipt, gradient: 'from-yellow-400 to-yellow-600' },
  { number: 13, name: 'Sanitation Tax Register', nameMr: 'स्वच्छता कर रजिस्टर', icon: Receipt, gradient: 'from-green-400 to-green-600' },
  { number: 14, name: 'Profession Tax Register', nameMr: 'व्यवसाय कर रजिस्टर', icon: Calculator, gradient: 'from-indigo-400 to-indigo-600' },
  { number: 15, name: 'Transfer Register', nameMr: 'हस्तांतरण रजिस्टर', icon: ClipboardList, gradient: 'from-violet-400 to-violet-600' },
  { number: 16, name: 'Contingent Register', nameMr: 'आकस्मिक खर्च रजिस्टर', icon: Wallet, gradient: 'from-rose-400 to-rose-600' },
  { number: 17, name: 'Salary Register', nameMr: 'पगार रजिस्टर', icon: Users, gradient: 'from-emerald-500 to-emerald-700' },
  { number: 18, name: 'Daily Wage Register', nameMr: 'दैनंदिन मजुरी रजिस्टर', icon: Users, gradient: 'from-orange-500 to-orange-700' },
  { number: 19, name: 'Works Register', nameMr: 'कामे रजिस्टर', icon: ClipboardList, gradient: 'from-teal-400 to-teal-600' },
  { number: 20, name: 'Measurement Book', nameMr: 'मोजमाप पुस्तिका', icon: FileText, gradient: 'from-blue-400 to-blue-600' },
  { number: 21, name: 'Material Register', nameMr: 'सामग्री रजिस्टर', icon: Warehouse, gradient: 'from-amber-500 to-amber-700' },
  { number: 22, name: 'Dead Stock Register', nameMr: 'मृत साठा रजिस्टर', icon: Warehouse, gradient: 'from-stone-400 to-stone-600' },
  { number: 23, name: 'Consumable Register', nameMr: 'वापरणी सामग्री रजिस्टर', icon: Package, gradient: 'from-lime-500 to-lime-700' },
  { number: 24, name: 'Inspection Register', nameMr: 'तपासणी रजिस्टर', icon: ClipboardList, gradient: 'from-fuchsia-400 to-fuchsia-600' },
  { number: 25, name: 'Meeting Register', nameMr: 'सभा रजिस्टर', icon: Users, gradient: 'from-cyan-500 to-cyan-700' },
  { number: 26, name: 'Correspondence Register', nameMr: 'पत्रव्यवहार रजिस्टर', icon: FileText, gradient: 'from-red-500 to-red-700' },
  { number: 27, name: 'Visitor Register', nameMr: 'भेटी रजिस्टर', icon: Users, gradient: 'from-emerald-400 to-teal-600' },
  { number: 28, name: 'Complaint Register', nameMr: 'तक्रार रजिस्टर', icon: FileText, gradient: 'from-orange-400 to-red-500' },
  { number: 29, name: 'Resolutions Register', nameMr: 'ठराव रजिस्टर', icon: BookOpen, gradient: 'from-purple-400 to-purple-600' },
  { number: 30, name: 'Audit Report Register', nameMr: 'लेखापरीक्षण अहवाल रजिस्टर', icon: FileText, gradient: 'from-blue-500 to-indigo-600' },
  { number: 31, name: 'Recovery Register', nameMr: 'वसूली रजिस्टर', icon: TrendingUp, gradient: 'from-teal-500 to-emerald-600' },
  { number: 32, name: 'Advance Register', nameMr: 'अडवान्स रजिस्टर', icon: CreditCard, gradient: 'from-amber-400 to-orange-600' },
  { number: 33, name: 'Guarantee Register', nameMr: 'हमी रजिस्टर', icon: FileText, gradient: 'from-indigo-500 to-purple-600' },
];

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  if (typeof val === 'boolean') return val ? 'हो' : 'नाही';
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return String(obj.nameMr || obj.name || obj.headNameMr || obj.headName || obj.schemeNameMr || obj.schemeName || JSON.stringify(val));
  }
  return String(val);
}

export default function Namuna({ financialYear }: NamunaProps) {
  const [activeNamuna, setActiveNamuna] = useState<number | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNamuna = useCallback(async () => {
    if (!activeNamuna) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/namuna-reports?namuna=${activeNamuna}&financialYear=${financialYear}`);
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      setData(json);
    } catch {
      setError('नमुना डेटा लोड करताना त्रुटी');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeNamuna, financialYear]);

  useEffect(() => {
    if (activeNamuna) fetchNamuna();
  }, [activeNamuna, fetchNamuna]);

  // Namuna list view
  if (!activeNamuna) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-saffron to-gp-green" />
          नमुने (१-३३)
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-green to-gp-teal" />
        </h2>
        <p className="text-sm text-muted-foreground">महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११ नुसार ३३ नमुने</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {NAMUNA_LIST.map((n) => (
            <div
              key={n.number}
              onClick={() => setActiveNamuna(n.number)}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${n.gradient} p-3 text-white cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.04] transition-all duration-200`}
            >
              <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-white/10" />
              <div className="flex items-start gap-2 relative z-10">
                <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <n.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/80">नमुना {n.number}</p>
                  <p className="text-sm font-bold leading-tight truncate">{n.nameMr}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view for a specific Namuna
  const namunaInfo = NAMUNA_LIST.find(n => n.number === activeNamuna);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setActiveNamuna(null); setData(null); }}
          className="border-gp-teal/30 text-gp-teal hover:bg-gp-teal/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />मागे
        </Button>
        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${namunaInfo?.gradient || 'from-teal-400 to-teal-600'} flex items-center justify-center shadow`}>
          {namunaInfo?.icon && <namunaInfo.icon className="h-4 w-4 text-white" />}
        </div>
        <div>
          <h2 className="text-lg font-bold">नमुना {activeNamuna}: {namunaInfo?.nameMr || ''}</h2>
          <p className="text-xs text-muted-foreground">{namunaInfo?.name || ''}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchNamuna}>
            <RefreshCw className="h-4 w-4 mr-1" />रीफ्रेश
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchNamuna}>
              <RefreshCw className="h-4 w-4 mr-2" />पुन्हा प्रयत्न करा
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <NamunaDataView data={data} />
      ) : null}
    </div>
  );
}

function NamunaDataView({ data }: { data: Record<string, unknown> }) {
  // Try to find an array of records to display in the table
  const entries = (Array.isArray(data.entries) ? data.entries
    : Array.isArray(data.records) ? data.records
    : Array.isArray(data.data) ? data.data
    : null) as Record<string, unknown>[] | null;

  const summary = data.summary as Record<string, unknown> | undefined;
  const namuna = data.namuna as string | undefined;

  return (
    <div className="space-y-4">
      {namuna && (
        <Badge className="bg-gradient-to-r from-gp-teal to-gp-teal-dark text-white text-sm px-3 py-1">
          {namuna}
        </Badge>
      )}

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) return null;
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, s => s.toUpperCase())
              .replace('Total', 'एकूण')
              .replace('Count', 'संख्या')
              .replace('Entries', 'नोंदी')
              .replace('Amount', 'रक्कम')
              .replace('Balance', 'शिल्लक')
              .replace('Receipts', 'प्राप्ती')
              .replace('Payments', 'पावती')
              .replace('Deposits', 'ठेवी')
              .replace('Withdrawals', 'उत्तर्या')
              .replace('Demand', 'मागणी')
              .replace('Paid', 'वसूल')
              .replace('Outstanding', 'बकायपोरी')
              .replace('Collected', 'वसूल')
              .replace('Depreciation', 'घसारा')
              .replace('Purchase', 'खरेदी')
              .replace('Current', 'सध्याचे')
              .replace('Value', 'मूल्य')
              .replace('Cost', 'खर्च')
              .replace('Groups', 'गट')
              .replace('Schemes', 'योजना');
            return (
              <Card key={key} className="border-l-4 border-l-gp-teal">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-bold">
                    {typeof value === 'number'
                      ? value > 999
                        ? `₹${value.toLocaleString('en-IN')}`
                        : value.toLocaleString('en-IN')
                      : String(value)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      {entries && entries.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gp-teal to-gp-teal-dark">
                    <TableHead className="text-xs text-white w-10">#</TableHead>
                    {Object.keys(entries[0]).filter(k => k !== 'id').slice(0, 8).map(key => (
                      <TableHead key={key} className="text-xs text-white whitespace-nowrap">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((rec, idx) => (
                    <TableRow key={String(rec.id || idx)} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {Object.entries(rec).filter(([k]) => k !== 'id').slice(0, 8).map(([key, val]) => (
                        <TableCell key={key} className="text-sm whitespace-nowrap max-w-[200px] truncate">
                          {formatValue(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">या नमुन्यात अद्याप डेटा नाही</p>
            <p className="text-xs text-muted-foreground/60 mt-1">संबंधित मास्टर डेटा आणि व्यवहार नोंदवल्यावर डेटा दिसेल</p>
          </CardContent>
        </Card>
      )}

      {entries && entries.length > 0 && (
        <Badge variant="outline" className="text-sm">एकूण नोंदी: {entries.length}</Badge>
      )}
    </div>
  );
}
