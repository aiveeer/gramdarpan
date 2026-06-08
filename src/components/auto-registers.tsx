'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookCopy,
  Landmark,
  Receipt,
  CreditCard,
  BookOpen,
  ListChecks,
  FolderArchive,
  PackageCheck,
  HandCoins,
  Gauge,
  CircleDollarSign,
  IndianRupee,
  Printer,
  Download,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react';

// ─── Register Tab Configuration ───────────────────────────────────────

interface RegisterTab {
  id: string;
  namuna: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const REGISTER_TABS: RegisterTab[] = [
  { id: 'cash-book', namuna: '3', label: 'रोकड वही', labelEn: 'Cash Book (नमुना ३)', icon: BookCopy, color: '#27ae60', gradient: 'from-green-600 to-emerald-600' },
  { id: 'bank-book', namuna: '4', label: 'बँक वही', labelEn: 'Bank Book (नमुना ४)', icon: Landmark, color: '#0d9488', gradient: 'from-teal-600 to-cyan-600' },
  { id: 'receipt', namuna: '12', label: 'पावती रजिस्टर', labelEn: 'Receipt Register (नमुना १२)', icon: Receipt, color: '#16a34a', gradient: 'from-green-500 to-lime-500' },
  { id: 'payment', namuna: '13', label: 'पेमेंट रजिस्टर', labelEn: 'Payment Register (नमुना १३)', icon: CreditCard, color: '#dc2626', gradient: 'from-red-500 to-rose-500' },
  { id: 'demand', namuna: '9', label: 'मागणी रजिस्टर', labelEn: 'Demand Register (नमुना ९)', icon: BookOpen, color: '#d97706', gradient: 'from-amber-500 to-orange-500' },
  { id: 'collection', namuna: '19', label: 'वसूल रजिस्टर', labelEn: 'Collection Register', icon: ListChecks, color: '#0891b2', gradient: 'from-cyan-500 to-sky-500' },
  { id: 'asset', namuna: '5', label: 'मालमत्ता रजिस्टर', labelEn: 'Asset Register (नमुना ५)', icon: FolderArchive, color: '#ea580c', gradient: 'from-orange-500 to-amber-500' },
  { id: 'stock', namuna: '6', label: 'साठा रजिस्टर', labelEn: 'Stock Register (नमुना ६)', icon: PackageCheck, color: '#6366f1', gradient: 'from-indigo-500 to-violet-500' },
  { id: 'grant', namuna: '7', label: 'अनुदान रजिस्टर', labelEn: 'Grant Register (नमुना ७)', icon: HandCoins, color: '#9333ea', gradient: 'from-purple-500 to-fuchsia-500' },
  { id: 'ledger', namuna: '14', label: 'खाते खत', labelEn: 'Ledger (नमुना १४)', icon: BookOpen, color: '#7c3aed', gradient: 'from-violet-500 to-purple-500' },
  { id: 'trial-balance', namuna: '15', label: 'तपासणी पत्र', labelEn: 'Trial Balance (नमुना १५)', icon: Gauge, color: '#d97706', gradient: 'from-amber-500 to-yellow-500' },
  { id: 'dcb', namuna: '10', label: 'DCB', labelEn: 'Demand Collection Balance', icon: CircleDollarSign, color: '#dc2626', gradient: 'from-red-500 to-pink-500' },
  { id: 'salary', namuna: '11', label: 'वेतन रजिस्टर', labelEn: 'Salary Register', icon: IndianRupee, color: '#059669', gradient: 'from-emerald-500 to-green-500' },
];

// ─── Types ────────────────────────────────────────────────────────────

interface ApiResponse {
  title: string;
  titleEn: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totals: Record<string, unknown>;
  meta: {
    village: { gramPanchayatNameMr?: string; taluka?: string; district?: string } | null;
    financialYear: string;
    totalEntries?: number;
  };
}

interface AutoRegistersProps {
  initialTab?: string;
}

// ─── Currency Formatter ───────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('mr-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(val: unknown): string {
  const num = Number(val) || 0;
  return num.toLocaleString('mr-IN');
}

// ─── Detect column type from header label ─────────────────────────────

function detectColumnType(header: string): 'currency' | 'number' | 'percent' | 'badge' | 'text' {
  if (header.includes('₹') || header.includes('किंमत') || header.includes('रक्कम') || header.includes('मूल्य') || header.includes('कर') || header.includes('मागणी') || header.includes('वसूल') || header.includes('शिल्लक') || header.includes('बक्की') || header.includes('जमा') || header.includes('नामे') || header.includes('ठेव') || header.includes('उधार') || header.includes('वेतन') || header.includes('कपात') || header.includes('घसारा') || header.includes('अंदाज') || header.includes('वास्तव') || header.includes('फरक') || header.includes('भांडवल') || header.includes('थकबाकी') || header.includes('दंड') || header.includes('व्याज') || header.includes('प्राप्ती') || header.includes('अर्ज')) {
    return 'currency';
  }
  if (header.includes('%') || header.includes('दर') || header.includes('वय')) {
    return 'number';
  }
  if (header.includes('प्रकार') || header.includes('स्थिती') || header.includes('शिल्लक प्रकार') || header.includes('श्रेणी')) {
    return 'badge';
  }
  return 'text';
}

// ─── Main Component ───────────────────────────────────────────────────

export default function AutoRegisters({ initialTab }: AutoRegistersProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'cash-book');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentTab = REGISTER_TABS.find(t => t.id === activeTab) || REGISTER_TABS[0];

  // Fetch data from auto-generate API
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/auto-generate?namuna=${currentTab.namuna}&financialYear=${financialYear}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'डेटा आणण्यात त्रुटी');
      }

      const result: ApiResponse = await res.json();
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'डेटा आणण्यात त्रुटी');
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [currentTab.namuna, financialYear]);

  useEffect(() => {
    const cleanup = fetchData();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [fetchData]);

  // Reset search when tab changes
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  // Filter entries by search term
  const filteredRows = searchTerm && data?.rows
    ? data.rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()))
    : data?.rows || [];

  // Column keys derived from rows
  const columnKeys: string[] = data?.rows?.[0] ? Object.keys(data.rows[0]) : [];
  const columnTypes: Record<string, string> = {};
  if (data?.headers) {
    data.headers.forEach((h, i) => {
      if (columnKeys[i]) {
        columnTypes[columnKeys[i]] = detectColumnType(h);
      }
    });
  }

  // ─── Render Cell Value ──────────────────────────────────────────────

  const renderCellValue = (key: string, value: unknown, _idx: number) => {
    const colType = columnTypes[key] || 'text';

    switch (colType) {
      case 'currency': {
        const num = Number(value) || 0;
        if (num === 0) return <span className="text-muted-foreground">-</span>;

        let colorClass = '';
        if (key === 'debit' || key === 'deposit' || key === 'debitAmount' || key === 'totalDebit') {
          colorClass = 'text-green-700 font-medium';
        } else if (key === 'credit' || key === 'withdrawal' || key === 'creditAmount' || key === 'totalCredit') {
          colorClass = 'text-red-700 font-medium';
        } else if (key === 'balance' || key === 'outstanding' || key === 'totalBalance') {
          colorClass = num >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold';
        }

        return <span className={colorClass}>{formatCurrency(num)}</span>;
      }

      case 'number': {
        const num = Number(value) || 0;
        if (key === 'depreciationRate') return <span>{num}%</span>;
        if (key === 'age') return <span>{num} वर्षे</span>;
        if (key === 'quantity') return <span className="font-medium">{formatNumber(value)}</span>;
        return <span>{formatNumber(value)}</span>;
      }

      case 'badge': {
        const strVal = String(value || '-');
        let badgeClass = 'bg-gray-100 text-gray-700';

        if (strVal === 'Receipt' || strVal === 'जमा' || strVal === 'Deposit' || strVal === 'ठेव') {
          badgeClass = 'bg-green-100 text-green-800';
        } else if (strVal === 'Payment' || strVal === 'नामे' || strVal === 'Withdrawal' || strVal === 'उधार') {
          badgeClass = 'bg-red-100 text-red-800';
        } else if (strVal === 'Active' || strVal === 'In Stock' || strVal === 'Debit') {
          badgeClass = 'bg-green-100 text-green-800';
        } else if (strVal === 'Low Stock' || strVal === 'Credit' || strVal === 'Disposed') {
          badgeClass = 'bg-amber-100 text-amber-800';
        } else if (strVal === 'Issued') {
          badgeClass = 'bg-blue-100 text-blue-800';
        } else if (strVal === 'income') {
          badgeClass = 'bg-green-100 text-green-800';
        } else if (strVal === 'expenditure') {
          badgeClass = 'bg-red-100 text-red-800';
        } else if (strVal === 'प्राप्ती') {
          badgeClass = 'bg-green-100 text-green-800';
        } else if (strVal === 'अर्ज') {
          badgeClass = 'bg-red-100 text-red-800';
        }

        return <Badge className={`text-[10px] border-0 px-1.5 py-0 ${badgeClass}`}>{strVal}</Badge>;
      }

      default: {
        const strVal = String(value || '-');
        // Truncate long text
        if (strVal.length > 40) {
          return <span title={strVal} className="text-xs">{strVal.substring(0, 40)}...</span>;
        }
        return <span>{strVal}</span>;
      }
    }
  };

  // ─── Print Handler ──────────────────────────────────────────────────

  const handlePrint = () => {
    const tableEl = document.getElementById('register-table-container');
    if (!tableEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const villageName = data?.meta?.village?.gramPanchayatNameMr || 'ग्रामपंचायत';

    printWindow.document.write(`
      <html><head><title>${currentTab.label} - ${currentTab.labelEn}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; font-size: 11px; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
        h2 { font-size: 12px; text-align: center; color: #666; margin-top: 0; }
        .village-info { text-align: center; font-size: 11px; margin-bottom: 10px; color: #444; }
        .flag-bar { display: flex; gap: 0; margin-bottom: 12px; }
        .flag-bar div { height: 4px; flex: 1; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th, td { border: 1px solid #999; padding: 3px 6px; text-align: left; }
        th { background: ${currentTab.color}; color: white; font-weight: bold; font-size: 9px; }
        .total-row { background: #f0f0f0; font-weight: bold; }
        .summary-box { margin-top: 12px; border: 1px solid #999; padding: 8px; }
        .summary-box h3 { font-size: 11px; margin: 0 0 5px; }
        .summary-item { display: inline-block; margin-right: 20px; font-size: 10px; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature div { text-align: center; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="flag-bar"><div style="background:#FF9933"></div><div style="background:white"></div><div style="background:#138808"></div></div>
      <h1>${currentTab.label} ${currentTab.labelEn ? `(${currentTab.labelEn})` : ''}</h1>
      <h2>वित्तीय वर्ष: ${financialYear}</h2>
      <div class="village-info">${villageName}${data?.meta?.village?.taluka ? `, ता. ${data.meta.village.taluka}` : ''}${data?.meta?.village?.district ? `, जि. ${data.meta.village.district}` : ''}</div>
      ${tableEl.outerHTML}
      <div class="summary-box">
        <h3>सारांश</h3>
        ${data?.totals ? Object.entries(data.totals).map(([k, v]) => `<span class="summary-item"><strong>${k}:</strong> ${typeof v === 'number' ? formatCurrency(v as number) : String(v)}</span>`).join('') : ''}
      </div>
      <div class="signature">
        <div>मालकाची सही</div>
        <div>ग्रामसेवक सही</div>
        <div>सरपंच सही व मुद्रा</div>
        <div>सचिव सही व मुद्रा</div>
      </div>
      <div class="flag-bar" style="margin-top:20px"><div style="background:#FF9933"></div><div style="background:white"></div><div style="background:#138808"></div></div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // ─── CSV Export Handler ─────────────────────────────────────────────

  const handleExport = () => {
    if (!data || filteredRows.length === 0) return;

    const headers = data.headers.map(h => `"${h}"`).join(',');
    const rows = filteredRows.map(row =>
      columnKeys.map(key => {
        const val = row[key];
        const colType = columnTypes[key] || 'text';
        const text = colType === 'currency'
          ? String(Number(val) || 0)
          : String(val || '');
        return `"${text.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentTab.id}-register-${financialYear}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ─── Summary Cards ─────────────────────────────────────────────────

  const renderSummaryCards = () => {
    if (!data?.totals) return null;

    const cards: Array<{ label: string; value: string; icon: React.ElementType; color: string; subtext?: string }> = [];
    const t = data.totals;

    switch (activeTab) {
      case 'cash-book':
        cards.push(
          { label: 'एकूण जमा', value: formatCurrency(Number(t.totalDebit) || 0), icon: TrendingUp, color: '#27ae60' },
          { label: 'एकूण नावे', value: formatCurrency(Number(t.totalCredit) || 0), icon: TrendingDown, color: '#e74c3c' },
          { label: 'शिल्लक शेष', value: formatCurrency(Number(t.closingBalance) || 0), icon: Scale, color: '#0d7377' },
        );
        break;
      case 'bank-book':
        cards.push(
          { label: 'एकूण ठेव', value: formatCurrency(Number(t.totalDeposits) || 0), icon: TrendingUp, color: '#27ae60' },
          { label: 'एकूण उधार', value: formatCurrency(Number(t.totalWithdrawals) || 0), icon: TrendingDown, color: '#e74c3c' },
          { label: 'शिल्लक शेष', value: formatCurrency(Number(t.closingBalance) || 0), icon: Scale, color: '#0d9488' },
        );
        break;
      case 'receipt':
        cards.push(
          { label: 'एकूण जमा', value: formatCurrency(Number(t.totalCredit) || 0), icon: FileText, color: '#16a34a' },
          { label: 'एकूण नोंदी', value: String(t.totalEntries || 0), icon: ListChecks, color: '#059669' },
        );
        break;
      case 'payment':
        cards.push(
          { label: 'एकूण नावे', value: formatCurrency(Number(t.totalDebit) || 0), icon: FileText, color: '#dc2626' },
          { label: 'एकूण नोंदी', value: String(t.totalEntries || 0), icon: ListChecks, color: '#e74c3c' },
        );
        break;
      case 'demand':
        cards.push(
          { label: 'एकूण मागणी', value: formatCurrency(Number(t.totalDemand) || 0), icon: TrendingUp, color: '#d97706' },
          { label: 'एकूण वसूल', value: formatCurrency(Number(t.totalPaid) || 0), icon: CheckCircle2, color: '#16a34a' },
          { label: 'एकूण बक्की', value: formatCurrency(Number(t.totalOutstanding) || 0), icon: AlertCircle, color: '#dc2626' },
        );
        break;
      case 'collection':
      case 'asset':
      case 'stock':
      case 'grant':
      case 'ledger':
      case 'trial-balance':
      case 'dcb':
      case 'salary':
        // Generic summary from totals object
        Object.entries(t).forEach(([key, val]) => {
          if (typeof val === 'number' && val !== 0 && key !== 'totalEntries' && key !== 'totalAccounts' && key !== 'totalItems' && key !== 'totalAssets' && key !== 'inStockCount' && key !== 'totalDays') {
            cards.push({
              label: key.replace(/([A-Z])/g, ' $1').trim(),
              value: formatCurrency(val),
              icon: val > 0 ? TrendingUp : TrendingDown,
              color: val > 0 ? currentTab.color : '#dc2626',
            });
          }
        });
        // Add count cards
        if (t.totalEntries) cards.unshift({ label: 'एकूण नोंदी', value: String(t.totalEntries), icon: ListChecks, color: '#0891b2' });
        if (t.totalAssets) cards.unshift({ label: 'एकूण मालमत्ता', value: String(t.totalAssets), icon: FolderArchive, color: '#ea580c' });
        if (t.totalItems) cards.unshift({ label: 'एकूण वस्तू', value: String(t.totalItems), icon: PackageCheck, color: '#6366f1' });
        if (t.inStockCount) cards.push({ label: 'साठ्यात', value: String(t.inStockCount), icon: PackageCheck, color: '#16a34a' });
        if (t.totalAccounts) cards.push({ label: 'एकूण खाती', value: String(t.totalAccounts), icon: BookOpen, color: '#7c3aed' });
        if (t.difference !== undefined) {
          const diff = Number(t.difference);
          cards.push({
            label: 'फरक',
            value: formatCurrency(Math.abs(diff)),
            icon: Scale,
            color: diff === 0 ? '#16a34a' : '#d97706',
            subtext: diff === 0 ? '✓ ताळमेळ बरोबर' : '⚠ ताळमेळ नाही',
          });
        }
        break;
    }

    if (cards.length === 0) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.slice(0, 6).map((card, idx) => (
          <Card key={idx} className="border-0 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: card.color }} />
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: card.color + '15' }}
              >
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
                {card.subtext && (
                  <p className={`text-[10px] ${card.subtext.startsWith('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                    {card.subtext}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ─── Render Table ───────────────────────────────────────────────────

  const renderTable = () => {
    if (loading) {
      return (
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: currentTab.color }} />
            <span className="text-sm text-muted-foreground">डेटा लोड होत आहे...</span>
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-10 w-full" style={{ opacity: 0.3 + (i * 0.05) }} />
          ))}
        </CardContent>
      );
    }

    if (error) {
      return (
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#fef2f2' }}>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-lg font-medium text-red-700">त्रुटी</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchData()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            पुन्हा प्रयत्न करा
          </Button>
        </CardContent>
      );
    }

    if (!data || filteredRows.length === 0) {
      return (
        <CardContent className="p-12 text-center">
          <div className="h-20 w-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: currentTab.color + '10' }}>
            <currentTab.icon className="h-10 w-10" style={{ color: currentTab.color, opacity: 0.3 }} />
          </div>
          <p className="text-lg font-medium text-muted-foreground">कोणतेही डेटा नाहीत</p>
          <p className="text-sm text-muted-foreground mt-1">वित्तीय वर्ष बदलून पहा किंवा नवीन एंट्री जोडा</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md" style={{ background: currentTab.color + '10' }}>वित्तीय वर्ष: {financialYear}</span>
          </div>
        </CardContent>
      );
    }

    const headers = data.headers || [];
    const keys = columnKeys;

    return (
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar" id="register-table-container">
        <Table>
          <TableHeader>
            <TableRow style={{ background: `linear-gradient(90deg, ${currentTab.color}, ${currentTab.color}cc)` }}>
              <TableHead className="text-[10px] font-bold text-white w-10 text-center">क्र.</TableHead>
              {headers.map((header, hIdx) => (
                <TableHead
                  key={hIdx}
                  className={`text-[10px] font-bold text-white ${columnTypes[keys[hIdx]] === 'currency' || columnTypes[keys[hIdx]] === 'number' ? 'text-right' : ''}`}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, idx) => (
              <TableRow
                key={idx}
                className={`hover:bg-gray-50/80 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
              >
                <TableCell className="text-xs text-muted-foreground text-center font-mono">{idx + 1}</TableCell>
                {keys.map((key, kIdx) => (
                  <TableCell
                    key={kIdx}
                    className={`text-sm ${columnTypes[key] === 'currency' || columnTypes[key] === 'number' ? 'text-right' : ''}`}
                  >
                    {renderCellValue(key, row[key], kIdx)}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Totals Row */}
            {filteredRows.length > 0 && (
              <TableRow className="font-bold" style={{ background: currentTab.color + '10' }}>
                <TableCell className="text-xs text-center font-bold" style={{ color: currentTab.color }}>
                  {'≡'}
                </TableCell>
                {keys.map((key, kIdx) => {
                  const colType = columnTypes[key] || 'text';
                  if (colType === 'currency' || colType === 'number') {
                    const total = filteredRows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
                    return (
                      <TableCell key={kIdx} className="text-sm text-right font-bold" style={{ color: currentTab.color }}>
                        {colType === 'currency' ? formatCurrency(total) : formatNumber(total)}
                      </TableCell>
                    );
                  }
                  if (kIdx === 0) {
                    return (
                      <TableCell key={kIdx} className="text-sm font-bold" style={{ color: currentTab.color }}>
                        एकूण
                      </TableCell>
                    );
                  }
                  return <TableCell key={kIdx} className="text-sm" />;
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header Card with Gradient ── */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${currentTab.gradient} opacity-10`} />
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${currentTab.color}, ${currentTab.color}88)` }} />
          <CardContent className="p-4 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}cc)` }}
                >
                  <currentTab.icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: currentTab.color }}>
                    {currentTab.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">{currentTab.labelEn}</p>
                  {data?.meta?.village?.gramPanchayatNameMr && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.meta.village.gramPanchayatNameMr}
                      {data.meta.village.taluka ? `, ता. ${data.meta.village.taluka}` : ''}
                      {data.meta.village.district ? `, जि. ${data.meta.village.district}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="text-xs border-0 shadow-sm"
                  style={{ background: currentTab.color + '20', color: currentTab.color }}
                >
                  {filteredRows.length} नोंदी
                </Badge>
                <Badge variant="outline" className="text-xs" style={{ borderColor: currentTab.color + '40', color: currentTab.color }}>
                  नमुना {currentTab.namuna}
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ── Tab Navigation (horizontal scrollable) ── */}
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {REGISTER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` } : {}}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Controls: FY selector, Search, Print/Export ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={financialYear} onValueChange={setFinancialYear}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-24">2023-24</SelectItem>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2025-26">2025-26</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="शोधा..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 text-xs"
                disabled={!data || filteredRows.length === 0}
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                प्रिंट
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 text-xs"
                disabled={!data || filteredRows.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                निर्यात
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
                className="h-9 text-xs"
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats Cards ── */}
      {renderSummaryCards()}

      {/* ── Register Data Table ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${currentTab.color}, ${currentTab.color}88)` }} />
        {renderTable()}

        {/* Footer with count */}
        {filteredRows.length > 0 && (
          <div
            className="p-3 border-t flex items-center justify-between"
            style={{ background: currentTab.color + '08' }}
          >
            <span className="text-sm font-medium" style={{ color: currentTab.color }}>
              एकूण: {filteredRows.length} नोंदी
            </span>
            {searchTerm && (
              <span className="text-xs text-muted-foreground">
                शोध: &quot;{searchTerm}&quot; — {filteredRows.length} सापडले
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Custom Scrollbar Styles ── */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
