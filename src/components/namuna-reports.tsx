'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Printer, Download, RefreshCw, ArrowLeft,
  FileText, BookOpen, Receipt, FolderArchive,
  PackageCheck, HandCoins, CircleDollarSign, BookCopy,
  FileBadge, FileCheck2, FileBarChart, FileLock2,
  ScrollText, Gauge, Users,
  TrendingUp, TrendingDown,
  IndianRupee, AlertCircle, CheckCircle2, Loader2,
  Search as SearchIcon, Landmark,
} from 'lucide-react';

// ─── Namuna Definitions ───────────────────────────────────────────────────

interface NamunaDef {
  num: number;
  nameMr: string;
  nameEn: string;
  category: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}

const NAMUNA_DEFS: NamunaDef[] = [
  // अर्थसंकल्प व आर्थिक विवरण
  { num: 1, nameMr: 'अर्थसंकल्प/अंदाजपत्रक', nameEn: 'Budget Estimate', category: 'budget', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: FileBadge },
  { num: 2, nameMr: 'पुनर्विनियोजन व नियत वाटप (सुधारित अर्थसंकल्प)', nameEn: 'Re-appropriation & Revised Budget', category: 'budget', color: 'text-teal-600', bg: 'bg-teal-50', icon: FileCheck2 },
  // आर्थिक स्थिती विवरण
  { num: 3, nameMr: 'ग्रामपंचायत जमा-खर्च विवरण', nameEn: 'Income & Expenditure Statement', category: 'financial', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: FileBarChart },
  { num: 4, nameMr: 'ग्रामपंचायतीची मत्ता व दायित्वे', nameEn: 'Assets & Liabilities', category: 'financial', color: 'text-teal-600', bg: 'bg-teal-50', icon: Gauge },
  // रोकड व पावती
  { num: 5, nameMr: 'सामान्य रोकड वही', nameEn: 'General Cash Book', category: 'cash', color: 'text-green-600', bg: 'bg-green-50', icon: BookCopy },
  { num: 5.1, nameMr: 'दैनिक रोकडवही (५ क)', nameEn: 'Daily Cash Book', category: 'cash', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: BookCopy },
  { num: 6, nameMr: 'वर्गीकृत नोंदवही', nameEn: 'Classified Receipt Register', category: 'cash', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: BookOpen },
  { num: 7, nameMr: 'सामान्य पावती', nameEn: 'General Receipt', category: 'cash', color: 'text-green-600', bg: 'bg-green-50', icon: Receipt },
  // कर आकारणी व मागणी
  { num: 8, nameMr: 'कर आकारणी नोंदवही', nameEn: 'Tax Assessment Register', category: 'tax', color: 'text-green-600', bg: 'bg-green-50', icon: FileText },
  { num: 9, nameMr: 'कर मागणी नोंदवही', nameEn: 'Tax Demand Register', category: 'tax', color: 'text-amber-600', bg: 'bg-amber-50', icon: BookOpen },
  { num: 9.1, nameMr: 'कराची मागणी पावती (९ क)', nameEn: 'Tax Demand Bill', category: 'tax', color: 'text-rose-600', bg: 'bg-rose-50', icon: Receipt },
  { num: 10, nameMr: 'कर व फी बाबत पावती', nameEn: 'Tax & Fee Receipt', category: 'tax', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: CircleDollarSign },
  { num: 11, nameMr: 'किरकोळ कर व फी आकारणी नोंदवही', nameEn: 'Miscellaneous Tax & Fee Assessment Register', category: 'tax', color: 'text-purple-600', bg: 'bg-purple-50', icon: ScrollText },
  // खर्च व प्रमाणक
  { num: 12, nameMr: 'अकस्मात खर्चाचे प्रमाणक', nameEn: 'Contingent Expense Voucher', category: 'expense', color: 'text-red-600', bg: 'bg-red-50', icon: FileText },
  { num: 18, nameMr: 'किरकोळ रोकडवही', nameEn: 'Petty Cash Book', category: 'expense', color: 'text-orange-600', bg: 'bg-orange-50', icon: BookCopy },
  // कर्मचारी व वेतन
  { num: 13, nameMr: 'कर्मचारी नोंदवही', nameEn: 'Employee Register', category: 'employee', color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
  { num: 14, nameMr: 'मुद्रांक हिशोब नोंदवही', nameEn: 'Stamp Account Register', category: 'employee', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText },
  { num: 21, nameMr: 'कर्मचाऱ्याच्या देयकाची नोंदवही', nameEn: 'Employee Bill Register', category: 'employee', color: 'text-green-600', bg: 'bg-green-50', icon: IndianRupee },
  { num: 31, nameMr: 'प्रवास भत्ता देयक', nameEn: 'Travel Allowance Bill', category: 'employee', color: 'text-teal-600', bg: 'bg-teal-50', icon: FileText },
  // साठा व मालमत्ता
  { num: 15, nameMr: 'उपभोग्य वस्तू साठा नोंदवही', nameEn: 'Consumable Stock Register', category: 'asset', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: PackageCheck },
  { num: 16, nameMr: 'जडवस्तू संग्रह व जंगम मालमत्ता नोंदवही', nameEn: 'Dead Stock & Movable Property Register', category: 'asset', color: 'text-orange-600', bg: 'bg-orange-50', icon: FolderArchive },
  { num: 17, nameMr: 'अग्रीम/अनामत रक्कम नोंदवही', nameEn: 'Advance & Deposit Register', category: 'asset', color: 'text-purple-600', bg: 'bg-purple-50', icon: HandCoins },
  { num: 22, nameMr: 'स्थावर मालमत्ता नोंदवही', nameEn: 'Immovable Property Register', category: 'asset', color: 'text-orange-600', bg: 'bg-orange-50', icon: FolderArchive },
  { num: 23, nameMr: 'ताब्यातील रस्त्यांची नोंदवही', nameEn: 'Road Register', category: 'asset', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText },
  { num: 24, nameMr: 'जमिनीची नोंदवही', nameEn: 'Land Register', category: 'asset', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Landmark },
  { num: 25, nameMr: 'गुंतवणूक नोंदवही', nameEn: 'Investment Register', category: 'asset', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: TrendingUp },
  { num: 33, nameMr: 'वृक्ष नोंदवही', nameEn: 'Tree Register', category: 'asset', color: 'text-green-600', bg: 'bg-green-50', icon: FileText },
  // विकासकाम व देयक
  { num: 19, nameMr: 'हजेरीपट (मजुरांची हजेरी)', nameEn: 'Muster Roll / Attendance', category: 'works', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText },
  { num: 20, nameMr: 'कामाच्या अंदाजाची नोंदवही', nameEn: 'Estimate Register for Works', category: 'works', color: 'text-orange-600', bg: 'bg-orange-50', icon: FileText },
  { num: 20.1, nameMr: 'मोजमाप वही (२० क)', nameEn: 'Measurement Book', category: 'works', color: 'text-rose-600', bg: 'bg-rose-50', icon: FileText },
  { num: 20.2, nameMr: 'कामाचे देयक (२० ख)', nameEn: 'Work Bill', category: 'works', color: 'text-red-600', bg: 'bg-red-50', icon: FileText },
  // मासिक विवरण व लेखापरीक्षण
  { num: 26.1, nameMr: 'जमा मासिक विवरण (२६ क)', nameEn: 'Monthly Income Statement', category: 'audit', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
  { num: 26.2, nameMr: 'खर्चाचे मासिक विवरण (२६ ख)', nameEn: 'Monthly Expenditure Statement', category: 'audit', color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
  { num: 27, nameMr: 'लेखापरीक्षण आक्षेपांच्या पुर्तेचे मासिक विवरण', nameEn: 'Audit Objection Compliance Monthly Statement', category: 'audit', color: 'text-slate-600', bg: 'bg-slate-50', icon: FileLock2 },
  { num: 28, nameMr: 'मागासवर्गीय 15% व महिला बालकल्याण 10% खर्चाचे मासिक विवरण', nameEn: 'SC 15% & Women/Child Welfare 10% Monthly Expenditure', category: 'audit', color: 'text-purple-600', bg: 'bg-purple-50', icon: FileBarChart },
  { num: 29, nameMr: 'कर्जाची नोंदवही', nameEn: 'Loan Register', category: 'audit', color: 'text-rose-600', bg: 'bg-rose-50', icon: FileText },
  { num: 30, nameMr: 'लेखा परीक्षण आक्षेप पूर्तता नोंदवही', nameEn: 'Audit Objection Compliance Register', category: 'audit', color: 'text-gray-600', bg: 'bg-gray-50', icon: FileLock2 },
  { num: 32, nameMr: 'रकमेच्या परताव्यासाठीचा आदेश', nameEn: 'Refund Order', category: 'audit', color: 'text-red-600', bg: 'bg-red-50', icon: FileText },
];

// ─── Category Definitions ────────────────────────────────────────────────

const CATEGORIES: Record<string, { label: string; labelEn: string; color: string; gradient: string }> = {
  budget:    { label: 'अर्थसंकल्प व आर्थिक विवरण', labelEn: 'Budget & Financial',   color: '#0891b2', gradient: 'from-cyan-600 to-teal-700' },
  financial: { label: 'आर्थिक स्थिती विवरण',     labelEn: 'Financial Position',  color: '#059669', gradient: 'from-green-600 to-emerald-700' },
  cash:      { label: 'रोकड व पावती',           labelEn: 'Cash & Receipts',     color: '#16a34a', gradient: 'from-green-500 to-lime-600' },
  tax:       { label: 'कर आकारणी व मागणी',      labelEn: 'Tax & Demand',        color: '#dc2626', gradient: 'from-red-600 to-rose-700' },
  expense:   { label: 'खर्च व प्रमाणक',          labelEn: 'Expenses & Vouchers',  color: '#ea580c', gradient: 'from-orange-600 to-amber-700' },
  employee:  { label: 'कर्मचारी व वेतन',         labelEn: 'Employees & Salary',  color: '#2563eb', gradient: 'from-blue-600 to-indigo-700' },
  asset:     { label: 'साठा व मालमत्ता',          labelEn: 'Stock & Assets',      color: '#9333ea', gradient: 'from-purple-600 to-violet-700' },
  works:     { label: 'विकासकाम व देयक',         labelEn: 'Works & Bills',       color: '#d97706', gradient: 'from-amber-600 to-orange-700' },
  audit:     { label: 'मासिक विवरण व लेखापरीक्षण', labelEn: 'Monthly & Audit',    color: '#475569', gradient: 'from-slate-600 to-gray-700' },
};

// ─── Types ────────────────────────────────────────────────────────────────

interface NamunaReportsProps {
  initialNamuna?: string;
  onNavigate?: (viewId: string) => void;
}

interface ReportData {
  title: string;
  titleEn: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totals: Record<string, unknown>;
  meta?: Record<string, unknown>;
  villageName?: string;
  taluka?: string;
  district?: string;
  financialYear?: string;
  namuna?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(val: unknown): string {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function isCurrencyKey(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes('रक्कम') || k.includes('किंमत') || k.includes('मूल्य') || k.includes('जमा') ||
    k.includes('नामे') || k.includes('शिल्लक') || k.includes('कर') || k.includes('मागणी') ||
    k.includes('वसूल') || k.includes('बक्की') || k.includes('खर्च') || k.includes('उत्पन्न') ||
    k.includes('प्राप्त') || k.includes('ठेव') || k.includes('काढा') || k.includes('घसरण') ||
    k.includes('खरेदी') || k.includes('सध्याची') || k.includes('एकूण_कर') || k.includes('एकूण_मागणी') ||
    k.includes('एकूण_वसूल') || k.includes('एकूण_शिल्लक') || k.includes('एकूण_जमा') || k.includes('एकूण_नामे') ||
    k.includes('एकूण_बक्की') || k.includes('एकूण_खर्च') || k.includes('एकूण_उत्पन्न') ||
    k.includes('एकूण_मूल्य') || k.includes('एकूण_भरलेले') || k.includes('एकूण_रक्कम') ||
    k.includes('एकूण_प्राप्त') || k.includes('एकूण_खरेदी') || k.includes('एकूण_सध्याची') ||
    k.includes('भरलेले') || k.includes('चालू_कर') || k.includes('मागील_बक्की') ||
    k.includes('दंड') || k.includes('व्याज') || k.includes('एकूण_मागणी') || k.includes('निव्वळ') ||
    k.includes('फरक') || k.includes('एकूण_मालमत्ता') || k.includes('एकूण_देणेदारी') ||
    k.includes('एकूण_घसरण') || k.includes('एकूण_खरेदी_किंमत') || k.includes('एकूण_सध्याची_किंमत');
}

function isNumberKey(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes('शिल्लक') || k.includes('टक्के') || k.includes('वसूल_टक्के') || k.includes('क्षेत्रफळ') || k === '_sr' || k.includes('प्रमाण');
}

function isTotalKey(key: string): boolean {
  return key.startsWith('एकूण') || key.startsWith('निव्वळ') || key.startsWith('फरक');
}

// ─── Namuna Key Parsing & Display ──────────────────────────────────────────

/** Convert initialNamuna string like "5ka", "9ka", "20ka", "20kha", "26ka", "26kha" to the decimal num used in NAMUNA_DEFS */
function parseNamunaKey(key: string): number {
  const s = key.trim().toLowerCase();
  // Sub-forms: 5ka → 5.1, 9ka → 9.1, 20ka → 20.1, 20kha → 20.2, 26ka → 26.1, 26kha → 26.2
  if (s === '5ka') return 5.1;
  if (s === '9ka') return 9.1;
  if (s === '20ka') return 20.1;
  if (s === '20kha') return 20.2;
  if (s === '26ka') return 26.1;
  if (s === '26kha') return 26.2;
  return parseInt(s, 10);
}

/** Format namuna num for display: 5.1 → "५ क", 20.2 → "२० ख", etc. */
function formatNamunaNum(num: number): string {
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  const toMr = (n: number) => String(n).split('').map(c => marathiDigits[parseInt(c)] ?? c).join('');
  const base = Math.floor(num);
  const sub = Math.round((num - base) * 10); // 1=क, 2=ख
  const suffix = sub === 1 ? ' क' : sub === 2 ? ' ख' : '';
  return toMr(base) + suffix;
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function NamunaReports({ initialNamuna, onNavigate }: NamunaReportsProps) {
  const [selectedNamuna, setSelectedNamuna] = useState<number | null>(
    initialNamuna ? parseNamunaKey(initialNamuna) : null
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Grouped namunas
  const groupedNamunas = useMemo(() => {
    const groups: Record<string, NamunaDef[]> = {};
    for (const n of NAMUNA_DEFS) {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    }
    return groups;
  }, []);

  // Filtered namunas for grid
  const filteredNamunas = useMemo(() => {
    let items = NAMUNA_DEFS;
    if (categoryFilter !== 'all') {
      items = items.filter(n => n.category === categoryFilter);
    }
    return items;
  }, [categoryFilter]);

  // Fetch report data
  const fetchReport = useCallback(async (namunaNum: number, fy: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auto-generate?namuna=${namunaNum}&financialYear=${fy}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on selection
  useEffect(() => {
    if (selectedNamuna === null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/auto-generate?namuna=${selectedNamuna}&financialYear=${financialYear}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setReportData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setReportData(null);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedNamuna, financialYear]);

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    if (!reportData?.rows || !searchQuery.trim()) return reportData?.rows || [];
    const q = searchQuery.toLowerCase();
    return reportData.rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [reportData?.rows, searchQuery]);

  // Get current namuna definition
  const currentNamuna = useMemo(
    () => NAMUNA_DEFS.find(n => n.num === selectedNamuna),
    [selectedNamuna]
  );

  // Print handler
  const handlePrint = () => {
    if (!reportData || !currentNamuna) return;
    const catInfo = CATEGORIES[currentNamuna.category];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const tableHeaders = reportData.headers.map(h => `<th style="border:1px solid #ccc;padding:6px 10px;background:${catInfo.color};color:white;font-size:11px;text-align:left;">${h}</th>`).join('');
    const tableRows = filteredRows.map((row, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = reportData.headers.map(h => {
        const key = h.replace(/\s+/g, '_').replace(/[().]/g, '');
        const val = row[key] ?? row[h] ?? '-';
        const isCurrency = isCurrencyKey(key);
        const style = isCurrency ? 'text-align:right;font-weight:600;' : '';
        const display = isCurrency && typeof val === 'number' ? formatCurrency(val) : String(val);
        return `<td style="border:1px solid #e2e8f0;padding:5px 10px;font-size:11px;background:${bgColor};${style}">${display}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    const totalsHtml = reportData.totals ? Object.entries(reportData.totals).map(([k, v]) => {
      const isCur = isCurrencyKey(k);
      const display = isCur && typeof v === 'number' ? formatCurrency(v) : String(v);
      return `<div style="display:inline-block;margin:4px 12px;font-size:12px;"><strong>${k.replace(/_/g, ' ')}:</strong> ${display}</div>`;
    }).join('') : '';

    printWindow.document.write(`
      <html><head><title>${reportData.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; color: #1e293b; }
        .flag-bar { display: flex; height: 6px; margin-bottom: 16px; }
        .flag-bar div { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .header-info { text-align: center; margin-bottom: 12px; }
        .header-info h1 { font-size: 16px; margin: 0; color: ${catInfo.color}; }
        .header-info h2 { font-size: 12px; margin: 4px 0 0; color: #64748b; }
        .header-info .village { font-size: 13px; font-weight: 600; margin: 8px 0 2px; }
        .header-info .meta { font-size: 11px; color: #64748b; }
        .totals-bar { margin-top: 16px; padding: 10px 16px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid ${catInfo.color}; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
        .signature div { text-align: center; font-size: 11px; border-top: 1px solid #94a3b8; padding-top: 8px; min-width: 150px; }
        @media print { body { margin: 10px; } }
      </style></head><body>
      <div class="flag-bar"><div style="background:#FF9933"></div><div style="background:white"></div><div style="background:#138808"></div></div>
      <div class="header-info">
        <div class="village">${reportData.villageName || 'ग्रामपंचायत'}</div>
        <div class="meta">${reportData.taluka ? `ता. ${reportData.taluka}` : ''} ${reportData.district ? `जि. ${reportData.district}` : ''}</div>
        <h1>${reportData.title}</h1>
        <h2>${reportData.titleEn}</h2>
        <div class="meta">वित्तीय वर्ष: ${reportData.financialYear || financialYear}</div>
      </div>
      <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
      ${totalsHtml ? `<div class="totals-bar">${totalsHtml}</div>` : ''}
      <div class="signature">
        <div>मालकाची सही</div>
        <div>ग्रामसेवक सही</div>
        <div>सरपंच सही व मुद्रा</div>
        <div>सचिव सही व मुद्रा</div>
      </div>
      <div class="flag-bar" style="margin-top:24px"><div style="background:#FF9933"></div><div style="background:white"></div><div style="background:#138808"></div></div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Export CSV handler
  const handleExport = () => {
    if (!reportData) return;
    const rows = filteredRows;
    let csv = reportData.headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(row => {
      const cells = reportData.headers.map(h => {
        const key = h.replace(/\s+/g, '_').replace(/[().]/g, '');
        const val = row[key] ?? row[h] ?? '-';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csv += cells.join(',') + '\n';
    });
    // Totals row
    if (reportData.totals) {
      const totalCells = reportData.headers.map(h => {
        const key = h.replace(/\s+/g, '_').replace(/[().]/g, '');
        const val = reportData.totals?.[key];
        return val !== undefined ? `"${val}"` : '""';
      });
      csv += totalCells.join(',') + '\n';
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `namuna-${selectedNamuna}-${financialYear}.csv`;
    link.click();
  };

  // ─── RENDER: Grid View ────────────────────────────────────────────────

  if (selectedNamuna === null) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-teal-600 to-emerald-700">
                <FileBadge className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                  नमुना अहवाल (१-३३)
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Namuna Reports 1-33 | सर्व सरकारी नमुने एकाच ठिकाणी
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 shadow-sm text-sm px-3 py-1">
                {NAMUNA_DEFS.length} नमुने
              </Badge>
            </div>

            {/* Financial Year Selector */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">वित्तीय वर्ष:</span>
                <Select value={financialYear} onValueChange={setFinancialYear}>
                  <SelectTrigger className="w-[130px] h-9 text-sm border-teal-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm border-teal-200">
                  <SelectValue placeholder="सर्व वर्ग" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सर्व वर्ग (All)</SelectItem>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>{cat.label} ({cat.labelEn})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Groups */}
        {categoryFilter === 'all' ? (
          Object.entries(groupedNamunas).map(([catKey, namunas]) => {
            const catInfo = CATEGORIES[catKey];
            if (!catInfo) return null;
            return (
              <div key={catKey} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-3 px-1">
                  <div className="h-7 w-1.5 rounded-full" style={{ background: catInfo.color }} />
                  <h3 className="text-sm font-bold" style={{ color: catInfo.color }}>
                    {catInfo.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">({catInfo.labelEn})</span>
                  <Badge className="text-[10px] border-0 px-2" style={{ background: catInfo.color + '18', color: catInfo.color }}>
                    {namunas.length}
                  </Badge>
                </div>
                {/* Namuna Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {namunas.map(n => (
                    <button
                      key={n.num}
                      onClick={() => setSelectedNamuna(n.num)}
                      className="group relative flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:h-1 transition-all" style={{ background: catInfo.color }} />
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${n.bg}`}>
                        <n.icon className={`h-4 w-4 ${n.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge className="text-[9px] border-0 font-bold px-1.5 py-0 leading-4 text-white" style={{ background: catInfo.color }}>
                            {formatNamunaNum(n.num)}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-semibold leading-tight truncate">{n.nameMr}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight truncate">{n.nameEn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          /* Filtered grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredNamunas.map(n => {
              const catInfo = CATEGORIES[n.category];
              return (
                <button
                  key={n.num}
                  onClick={() => setSelectedNamuna(n.num)}
                  className="group relative flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:h-1 transition-all" style={{ background: catInfo?.color || '#059669' }} />
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${n.bg}`}>
                    <n.icon className={`h-4 w-4 ${n.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge className="text-[9px] border-0 font-bold px-1.5 py-0 leading-4 text-white" style={{ background: catInfo?.color || '#059669' }}>
                        {formatNamunaNum(n.num)}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-semibold leading-tight truncate">{n.nameMr}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight truncate">{n.nameEn}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Report Detail View ───────────────────────────────────────

  const catInfo = currentNamuna ? CATEGORIES[currentNamuna.category] : null;
  const catColor = catInfo?.color || '#059669';

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-2 bg-gradient-to-r" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}bb)` }} />
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedNamuna(null); setReportData(null); setSearchQuery(''); setError(null); }}
              className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {currentNamuna && (
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-md shrink-0 ${currentNamuna.bg}`}>
                <currentNamuna.icon className={`h-6 w-6 ${currentNamuna.color}`} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: catColor }}>
                {reportData?.title || (currentNamuna ? `नमुना ${currentNamuna.num} — ${currentNamuna.nameMr}` : 'नमुना अहवाल')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {reportData?.titleEn || currentNamuna?.nameEn || ''}
              </p>
              {reportData?.villageName && (
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {reportData.villageName}
                  {reportData.taluka ? ` | ता. ${reportData.taluka}` : ''}
                  {reportData.district ? ` | जि. ${reportData.district}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="text-white border-0 shadow-sm" style={{ background: catColor }}>
                नमुना {selectedNamuna}
              </Badge>
              {catInfo && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: catColor + '40', color: catColor }}>
                  {catInfo.label}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Financial Year */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">वित्तीय वर्ष:</span>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="अहवालात शोधा..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedNamuna && fetchReport(selectedNamuna, financialYear)}
                disabled={loading}
                className="h-8 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                पुन्हा लोड
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!reportData || loading}
                className="h-8 text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                प्रिंट
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!reportData || loading}
                className="h-8 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">अहवाल लोड करताना त्रुटी</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedNamuna && fetchReport(selectedNamuna, financialYear)}
              className="ml-auto h-8 text-xs border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              पुन्हा प्रयत्न
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: catColor }} />
              <span className="text-sm font-medium" style={{ color: catColor }}>
                नमुना {selectedNamuna} अहवाल तयार होत आहे...
              </span>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-10 w-full" style={{ opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Table */}
      {!loading && reportData && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}88)` }} />

          {/* Indian Flag Bar */}
          <div className="flex h-1">
            <div className="flex-1" style={{ background: '#FF9933' }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ background: '#138808' }} />
          </div>

          {/* Village & Title Banner */}
          <div className="p-3 text-center border-b" style={{ background: catColor + '08' }}>
            <p className="text-sm font-bold" style={{ color: catColor }}>
              {reportData.villageName || 'ग्रामपंचायत'}
              {reportData.taluka ? ` | ता. ${reportData.taluka}` : ''}
              {reportData.district ? ` | जि. ${reportData.district}` : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              वित्तीय वर्ष: {reportData.financialYear || financialYear}
            </p>
          </div>

          {filteredRows.length === 0 ? (
            /* Empty State */
            <CardContent className="p-12 text-center">
              <div className={`h-20 w-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${currentNamuna?.bg || 'bg-gray-50'}`}>
                {currentNamuna ? (
                  <currentNamuna.icon className={`h-10 w-10 ${currentNamuna.color} opacity-40`} />
                ) : (
                  <FileText className="h-10 w-10 text-gray-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                {searchQuery ? 'शोध निकाल सापडले नाहीत' : 'या नमुन्यासाठी डेटा उपलब्ध नाही'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `'${searchQuery}' या शोधाशी जुळणारे नोंदी सापडल्या नाहीत. कृपया वेगळा शब्द वापरा.`
                  : 'या नमुन्यासाठी डेटा तयार करण्याकरिता कृपया संबंधित पावती/पेमेंट एंट्री किंवा मास्टर डेटा जोडा.'
                }
              </p>
              {!searchQuery && (
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>💡 पावती एंट्री → नमुना ३, ११, १२</span>
                  <span>💡 कर आकारणी → नमुना ८, ९</span>
                </div>
              )}
            </CardContent>
          ) : (
            /* Data Table */
            <div className="max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <style>{`
                .report-table::-webkit-scrollbar { width: 6px; height: 6px; }
                .report-table::-webkit-scrollbar-track { background: #f1f5f9; }
                .report-table::-webkit-scrollbar-thumb { background: ${catColor}40; border-radius: 3px; }
                .report-table::-webkit-scrollbar-thumb:hover { background: ${catColor}80; }
              `}</style>
              <Table className="report-table">
                <TableHeader>
                  <TableRow style={{ background: catColor }}>
                    {reportData.headers.map(h => (
                      <TableHead
                        key={h}
                        className="text-white text-xs font-semibold py-3 whitespace-nowrap"
                        style={{ background: catColor }}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, rowIdx) => (
                    <TableRow
                      key={rowIdx}
                      className={`hover:bg-gray-50/80 transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : ''}`}
                      style={rowIdx % 2 !== 0 ? { background: catColor + '06' } : {}}
                    >
                      {reportData.headers.map(h => {
                        const key = h.replace(/\s+/g, '_').replace(/[().]/g, '');
                        const val = row[key] ?? row[h] ?? '-';
                        const isCurr = isCurrencyKey(key);
                        const isNum = isNumberKey(key);
                        const isRightAlign = isCurr || isNum;

                        let display: string;
                        if (isCurr && typeof val === 'number') {
                          display = formatCurrency(val);
                        } else if (typeof val === 'number') {
                          display = val.toLocaleString('en-IN');
                        } else {
                          display = String(val);
                        }

                        return (
                          <TableCell
                            key={h}
                            className={`text-xs py-2.5 whitespace-nowrap ${isRightAlign ? 'text-right font-medium' : ''} ${isCurr ? 'font-semibold' : ''}`}
                          >
                            {display}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals Footer */}
          {reportData.totals && filteredRows.length > 0 && (
            <div className="border-t p-3" style={{ background: `linear-gradient(90deg, ${catColor}08, ${catColor}04)` }}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {Object.entries(reportData.totals).map(([key, val]) => {
                  const isCurr = isCurrencyKey(key);
                  const display = isCurr && typeof val === 'number' ? formatCurrency(val) : String(val);
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-sm font-bold" style={{ color: isCurr ? catColor : 'inherit' }}>
                        {display}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Record count footer */}
          {filteredRows.length > 0 && (
            <div className="border-t px-3 py-2 flex items-center justify-between" style={{ background: catColor + '06' }}>
              <span className="text-xs text-muted-foreground">
                एकूण {filteredRows.length} नोंदी
                {searchQuery && reportData.rows && filteredRows.length !== reportData.rows.length && (
                  <span> (शोध: {reportData.rows.length} पैकी)</span>
                )}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  शोध साफ करा
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quick Navigation to other Namunas */}
      {!loading && currentNamuna && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">इतर नमुने:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NAMUNA_DEFS.filter(n => n.num !== selectedNamuna).map(n => {
                const nCatInfo = CATEGORIES[n.category];
                return (
                  <button
                    key={n.num}
                    onClick={() => { setSelectedNamuna(n.num); setSearchQuery(''); }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:shadow-sm ${n.bg} ${n.color}`}
                  >
                    <n.icon className="h-3 w-3" />
                    {formatNamunaNum(n.num)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
