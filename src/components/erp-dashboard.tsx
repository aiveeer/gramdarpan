'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Building2,
  Users,
  MapPin,
  HardHat,
  Shield,
  Clock,
  LogOut,
  LogIn,
  Activity,
  CheckCircle2,
  ArrowRight,
  Database,
  FileText,
  BookOpen,
  Receipt,
  Search,
  ClipboardList,
  Wrench,
  CreditCard,
  BarChart3,
  CircleDollarSign,
  AlertCircle,
  FolderArchive,
  PackageCheck,
  BookOpenCheck,
  FileSpreadsheet,
  Gauge,
  FileBadge,
  FileCheck2,
  ScrollText,
  FileBarChart,
  FileLock2,
  HandCoinsIcon,
  Banknote,
  Landmark,
  BookCopy,
  ListChecks,
  Package,
  FolderArchiveIcon,
  RefreshCw,
  Zap,
  FileDown,
  ChevronRight,
  CircleDot,
  CircleCheck,
  Circle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalProperties: number;
  totalTaxMasters: number;
  enabledTaxMasters: number;
  totalNamuna8: number;
  totalNamuna9: number;
  totalPayments: number;
  totalWards: number;
  totalOwners: number;
  totalRoads: number;
  totalEmployees: number;
  totalDemand: number;
  totalPaid: number;
  outstandingBalance: number;
}

interface EnhancedData {
  totalIncome: number;
  totalExpenditure: number;
  balance: number;
  totalReceiptEntries: number;
  totalPaymentEntries: number;
  totalJournalEntries: number;
  pendingEntries: number;
  unpostedReceipts: number;
  unpostedPayments: number;
  unpostedJournals: number;
  totalAssetEntries: number;
  totalStockEntries: number;
  totalCollectionEntries: number;
  totalWaterBills: number;
  totalSchemeFunds: number;
  totalBankAccounts: number;
  totalBudgetHeads: number;
  totalSchemes: number;
  totalReceiptsPayments: number;
  totalBudgetEntries: number;
  totalWorkEntries: number;
  totalSalaryEntries: number;
  totalContractors: number;
  recentReceipts: {
    id: string;
    voucherNumber: string;
    receiptDate: string;
    receivedFrom: string;
    receivedFromMr: string | null;
    amount: number;
    paymentMethod: string;
    isPosted: boolean;
    createdAt: string;
  }[];
  recentPayments: {
    id: string;
    voucherNumber: string;
    paymentDate: string;
    paidTo: string;
    paidToMr: string | null;
    amount: number;
    paymentMethod: string;
    isPosted: boolean;
    createdAt: string;
  }[];
  namunaStatus: {
    number: number;
    name: string;
    nameMr: string;
    status: 'available' | 'partial' | 'none';
    viewId: string;
  }[];
}

interface SessionLog {
  id: string;
  loginAt: string;
  logoutAt: string | null;
  action: string;
  user: {
    username: string;
    name: string;
    nameMarathi: string;
    role: string;
  };
}

interface DashboardContentProps {
  stats: DashboardStats | null;
  user: { authenticated: boolean; user?: { name: string; nameMarathi: string; role: string }; loginAt?: string | null } | null;
  recentLogs: SessionLog[];
  setActiveView: (view: string) => void;
  formatTime: (iso: string | null) => string;
  refreshStats: () => void;
}

// ─── Format Currency ──────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('mr-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function ERPDashboard({
  stats,
  user,
  recentLogs,
  setActiveView,
  formatTime,
  refreshStats,
}: DashboardContentProps) {
  const [enhanced, setEnhanced] = useState<EnhancedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadEnhanced = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/enhanced');
        if (res.ok && isMounted) {
          setEnhanced(await res.json());
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEnhanced();
    const interval = setInterval(loadEnhanced, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const collectionPercent = stats?.totalDemand
    ? Math.min((stats.totalPaid / stats.totalDemand) * 100, 100)
    : 0;

  // ─── 1. Financial Summary Cards ──────────────────────────────────────

  const financialCards = [
    {
      title: 'एकूण उत्पन्न',
      titleEn: 'Total Income',
      amount: enhanced?.totalIncome || stats?.totalPaid || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      bgGrad: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-500',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'एकूण खर्च',
      titleEn: 'Total Expenditure',
      amount: enhanced?.totalExpenditure || 0,
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-600',
      bgGrad: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-500',
      trend: '-3.2%',
      trendUp: false,
    },
    {
      title: 'शिल्लक रक्कम',
      titleEn: 'Balance',
      amount: enhanced?.balance || 0,
      icon: IndianRupee,
      gradient: 'from-teal-500 to-cyan-600',
      bgGrad: 'from-teal-50 to-cyan-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-800',
      iconBg: 'bg-teal-500',
      trend: '+8.7%',
      trendUp: true,
    },
  ];

  // ─── 2. Key Metrics Grid ─────────────────────────────────────────────

  const keyMetrics = [
    { icon: Building2, label: 'मालमत्ता', labelEn: 'Properties', value: stats?.totalProperties || 0, bg: 'bg-cyan-50', iconBg: 'bg-cyan-500', valueColor: 'text-cyan-800', view: 'master-property' },
    { icon: Users, label: 'मालक', labelEn: 'Owners', value: stats?.totalOwners || 0, bg: 'bg-purple-50', iconBg: 'bg-purple-500', valueColor: 'text-purple-800', view: 'master-owner' },
    { icon: MapPin, label: 'वार्ड', labelEn: 'Wards', value: stats?.totalWards || 0, bg: 'bg-teal-50', iconBg: 'bg-teal-500', valueColor: 'text-teal-800', view: 'master-ward' },
    { icon: HardHat, label: 'कर्मचारी', labelEn: 'Employees', value: stats?.totalEmployees || 0, bg: 'bg-amber-50', iconBg: 'bg-amber-500', valueColor: 'text-amber-800', view: 'master-employee' },
    { icon: Shield, label: 'सक्षम कर', labelEn: 'Tax Masters', value: stats?.enabledTaxMasters || 0, bg: 'bg-green-50', iconBg: 'bg-green-500', valueColor: 'text-green-800', view: 'master-tax' },
    { icon: FileText, label: 'नमुना ८', labelEn: 'Namuna 8', value: stats?.totalNamuna8 || 0, bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', valueColor: 'text-emerald-800', view: 'namuna-8' },
    { icon: BookOpen, label: 'नमुना ९ मागणी', labelEn: 'Namuna 9', value: stats?.totalNamuna9 || 0, bg: 'bg-orange-50', iconBg: 'bg-orange-500', valueColor: 'text-orange-800', view: 'namuna-9' },
    { icon: Receipt, label: 'पावत्या/पेमेंट', labelEn: 'Receipts/Payments', value: enhanced?.totalReceiptsPayments || stats?.totalPayments || 0, bg: 'bg-rose-50', iconBg: 'bg-rose-500', valueColor: 'text-rose-800', view: 'txn-receipt' },
    { icon: ClipboardList, label: 'बजेट', labelEn: 'Budget', value: enhanced?.totalBudgetEntries || 0, bg: 'bg-cyan-50', iconBg: 'bg-cyan-600', valueColor: 'text-cyan-800', view: 'txn-budget' },
    { icon: HardHat, label: 'विकासकामे', labelEn: 'Works', value: enhanced?.totalWorkEntries || 0, bg: 'bg-lime-50', iconBg: 'bg-lime-600', valueColor: 'text-lime-800', view: 'txn-work' },
    { icon: IndianRupee, label: 'वेतन', labelEn: 'Salary', value: enhanced?.totalSalaryEntries || 0, bg: 'bg-emerald-50', iconBg: 'bg-emerald-600', valueColor: 'text-emerald-800', view: 'txn-salary' },
    { icon: Wrench, label: 'ठेकेदार', labelEn: 'Contractors', value: enhanced?.totalContractors || 0, bg: 'bg-amber-50', iconBg: 'bg-amber-600', valueColor: 'text-amber-800', view: 'master-disability' },
  ];

  // ─── 6. Process Flow Steps ───────────────────────────────────────────

  const processSteps = [
    { icon: Database, label: 'मास्टर एंट्री', sublabel: 'Master Entry', bg: 'bg-purple-100 border-purple-300', iconBg: 'bg-purple-500', text: 'text-purple-800' },
    { icon: ClipboardList, label: 'दैनंदिन एंट्री', sublabel: 'Daily Entry', bg: 'bg-cyan-100 border-cyan-300', iconBg: 'bg-cyan-500', text: 'text-cyan-800' },
    { icon: BookOpenCheck, label: 'रजिस्टर अपडेट', sublabel: 'Register Update', bg: 'bg-teal-100 border-teal-300', iconBg: 'bg-teal-500', text: 'text-teal-800' },
    { icon: Landmark, label: 'खाते पोस्टिंग', sublabel: 'Ledger Posting', bg: 'bg-green-100 border-green-300', iconBg: 'bg-green-500', text: 'text-green-800' },
    { icon: Gauge, label: 'ऑटो गणना', sublabel: 'Auto Calculation', bg: 'bg-amber-100 border-amber-300', iconBg: 'bg-amber-500', text: 'text-amber-800' },
    { icon: FileBadge, label: 'नमुना निर्मिती', sublabel: 'Namuna Generation', bg: 'bg-orange-100 border-orange-300', iconBg: 'bg-orange-500', text: 'text-orange-800' },
    { icon: FileDown, label: 'PDF/Excel निर्यात', sublabel: 'Export', bg: 'bg-rose-100 border-rose-300', iconBg: 'bg-rose-500', text: 'text-rose-800' },
  ];

  // ─── 7. Quick Actions ────────────────────────────────────────────────

  const quickActions = [
    { icon: Database, label: 'मास्टर डेटा', sublabel: 'Master Data Entry', view: 'master-village', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200', iconBg: 'bg-purple-500' },
    { icon: Receipt, label: 'पावती एंट्री', sublabel: 'Receipt Entry', view: 'txn-receipt', bg: 'bg-green-50 hover:bg-green-100 border-green-200', iconBg: 'bg-green-500' },
    { icon: CreditCard, label: 'पेमेंट एंट्री', sublabel: 'Payment Entry', view: 'txn-payment', bg: 'bg-red-50 hover:bg-red-100 border-red-200', iconBg: 'bg-red-500' },
    { icon: FileText, label: 'कर आकारणी (नमुना ८)', sublabel: 'Tax Assessment', view: 'namuna-8', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', iconBg: 'bg-emerald-500' },
    { icon: BookOpen, label: 'मागणी (नमुना ९)', sublabel: 'Demand Generation', view: 'namuna-9', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200', iconBg: 'bg-amber-500' },
    { icon: CircleDollarSign, label: 'पावती (नमुना ९-क)', sublabel: 'Receipt', view: 'namuna-9ka', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200', iconBg: 'bg-rose-500' },
    { icon: ClipboardList, label: 'अंदाजपत्रक एंट्री', sublabel: 'Budget Entry', view: 'txn-budget', bg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200', iconBg: 'bg-cyan-600' },
    { icon: HardHat, label: 'विकासकाम एंट्री', sublabel: 'Work Entry', view: 'txn-work', bg: 'bg-lime-50 hover:bg-lime-100 border-lime-200', iconBg: 'bg-lime-600' },
    { icon: IndianRupee, label: 'वेतन एंट्री', sublabel: 'Salary Entry', view: 'txn-salary', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', iconBg: 'bg-emerald-600' },
    { icon: Search, label: 'शोधा', sublabel: 'Search', view: 'search', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200', iconBg: 'bg-sky-500' },
    { icon: FileSpreadsheet, label: 'आयात/निर्यात', sublabel: 'Import/Export', view: 'excel', bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', iconBg: 'bg-indigo-500' },
  ];

  // ─── Namuna Icon Mapping ─────────────────────────────────────────────

  const namunaIconMap: Record<string, React.ElementType> = {
    'namuna-1': FileBadge,
    'namuna-2': FileCheck2,
    'namuna-3': BookCopy,
    'namuna-4': Landmark,
    'namuna-5': FolderArchive,
    'namuna-6': PackageCheck,
    'namuna-7': HandCoinsIcon,
    'namuna-8': FileText,
    'namuna-9': BookOpen,
    'namuna-10': Banknote,
    'namuna-19': ScrollText,
    'namuna-11-15': Gauge,
    'namuna-16-18': FileBarChart,
    'namuna-21-24': FileBarChart,
    'namuna-25-27': FileLock2,
    'namuna-28-30': FileSpreadsheet,
    'namuna-31-33': FileBadge,
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Header Banner ──────────────────────────────────────────── */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="relative" style={{ background: 'linear-gradient(135deg, #0d7377 0%, #0a5c5f 50%, #1a5632 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(-30%, 40%)' }} />
          <CardContent className="relative p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                  <Landmark className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">ERP डॅशबोर्ड</h1>
                  <p className="text-sm text-teal-100/80">ग्रामपंचायत लेखा संहिता — सर्वसमावेशक अहवाल</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={refreshStats} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>रीफ्रेश</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {user?.authenticated && user.user && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: user.user.role === 'gpo' ? '#27ae60' : '#e67e22' }}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{user.user.nameMarathi}</span>
                    <Badge className={`${user.user.role === 'gpo' ? 'bg-green-500' : 'bg-amber-500'} text-white text-xs border-0`}>
                      {user.user.role === 'gpo' ? 'GPO' : 'Op'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ─── 1. Financial Summary Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {financialCards.map((card, i) => (
          <Card key={i} className="border-0 shadow-lg overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />
            <CardContent className={`p-5 bg-gradient-to-br ${card.bgGrad}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-xs text-muted-foreground/70 mb-2">{card.titleEn}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${card.textColor}`}>
                    {formatCurrency(card.amount)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>{card.trend}</span>
                    <span className="text-xs text-muted-foreground ml-1">या महिन्यात</span>
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── 2. Key Metrics Grid ─────────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #16a085, #27ae60, #e67e22)' }} />
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </div>
            मुख्य मेट्रिक्स
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3">
            {keyMetrics.map((item, i) => (
              <button key={i} onClick={() => setActiveView(item.view)} className={`${item.bg} rounded-xl p-3 text-center border border-opacity-50 cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200`}>
                <div className={`h-9 w-9 rounded-lg ${item.iconBg} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className={`text-2xl font-bold ${item.valueColor}`}>{item.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">{item.label}</div>
                <div className="text-[10px] text-muted-foreground/60">{item.labelEn}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. Namuna Status Tracker ────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #f39c12, #95a5a6)' }} />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
              </div>
              नमुना स्थिती ट्रॅकर (१-३३)
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><CircleDot className="h-3 w-3 text-green-500" /> उपलब्ध</span>
              <span className="flex items-center gap-1"><CircleCheck className="h-3 w-3 text-amber-500" /> अंशतः</span>
              <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-gray-400" /> नाही</span>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
              {Array.from({ length: 33 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
              {enhanced?.namunaStatus.map((namuna) => {
                const statusColors = {
                  available: 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100',
                  partial: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100',
                  none: 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100',
                };
                const StatusIcon = namuna.status === 'available' ? CircleDot : namuna.status === 'partial' ? CircleCheck : Circle;
                const iconColor = namuna.status === 'available' ? 'text-green-500' : namuna.status === 'partial' ? 'text-amber-500' : 'text-gray-400';
                return (
                  <TooltipProvider key={namuna.number}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveView(namuna.viewId)}
                          className={`border-2 rounded-lg p-2 text-center transition-all ${statusColors[namuna.status]}`}
                        >
                          <div className="text-xs font-bold">{namuna.number}</div>
                          <StatusIcon className={`h-3 w-3 mx-auto mt-0.5 ${iconColor}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-bold">नमुना {namuna.number}: {namuna.nameMr}</p>
                          <p className="text-muted-foreground">{namuna.name}</p>
                          <p className="mt-1">
                            स्थिती: {namuna.status === 'available' ? '✅ डेटा उपलब्ध' : namuna.status === 'partial' ? '⚠️ अंशतः' : '⬜ डेटा नाही'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}
          {/* Summary bar */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
            <span>उपलब्ध: <strong className="text-green-700">{enhanced?.namunaStatus.filter(n => n.status === 'available').length || 0}</strong></span>
            <span>अंशतः: <strong className="text-amber-700">{enhanced?.namunaStatus.filter(n => n.status === 'partial').length || 0}</strong></span>
            <span>नाही: <strong className="text-gray-500">{enhanced?.namunaStatus.filter(n => n.status === 'none').length || 0}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Two Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── 4. Recent Transactions ────────────────────────────────── */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #2ecc71)' }} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
                अलीकडील व्यवहार
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-green-200 text-green-600">
                शेवटचे ५
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Recent Receipts */}
                {enhanced?.recentReceipts && enhanced.recentReceipts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                      <Receipt className="h-3 w-3" /> पावत्या
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {enhanced.recentReceipts.map((r) => (
                        <div key={r.id} className="flex items-center justify-between bg-green-50/70 rounded-lg px-3 py-2 border border-green-100">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-green-500 flex items-center justify-center">
                              <TrendingUp className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{r.receivedFromMr || r.receivedFrom}</p>
                              <p className="text-[10px] text-muted-foreground">{r.voucherNumber} • {r.receiptDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-700">{formatCurrency(r.amount)}</p>
                            <div className="flex items-center gap-1">
                              {r.isPosted ? (
                                <Badge className="bg-green-100 text-green-700 text-[9px] border-0 px-1 py-0">पोस्टेड</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0 px-1 py-0">प्रलंबित</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Payments */}
                {enhanced?.recentPayments && enhanced.recentPayments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> पेमेंट
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {enhanced.recentPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-red-50/70 rounded-lg px-3 py-2 border border-red-100">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-red-500 flex items-center justify-center">
                              <TrendingDown className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{p.paidToMr || p.paidTo}</p>
                              <p className="text-[10px] text-muted-foreground">{p.voucherNumber} • {p.paymentDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-700">{formatCurrency(p.amount)}</p>
                            {p.isPosted ? (
                              <Badge className="bg-green-100 text-green-700 text-[9px] border-0 px-1 py-0">पोस्टेड</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0 px-1 py-0">प्रलंबित</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!enhanced?.recentReceipts?.length && !enhanced?.recentPayments?.length) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">अद्याप व्यवहार नाहीत</p>
                    <p className="text-xs">पावती किंवा पेमेंट एंट्री करा</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── 5. Pending Entries + Login Info ────────────────────────── */}
        <div className="space-y-6">
          {/* Pending Entries */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #e67e22, #f39c12)' }} />
            <CardContent className="p-5">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                प्रलंबित एंट्रीज
              </h2>
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
                    <div className="text-3xl font-bold text-amber-800">{enhanced?.unpostedReceipts || 0}</div>
                    <div className="text-xs text-amber-700 font-medium">अपोस्ट पावत्या</div>
                    <Receipt className="h-4 w-4 mx-auto mt-1 text-amber-500" />
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                    <div className="text-3xl font-bold text-red-800">{enhanced?.unpostedPayments || 0}</div>
                    <div className="text-xs text-red-700 font-medium">अपोस्ट पेमेंट</div>
                    <CreditCard className="h-4 w-4 mx-auto mt-1 text-red-500" />
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
                    <div className="text-3xl font-bold text-purple-800">{enhanced?.unpostedJournals || 0}</div>
                    <div className="text-xs text-purple-700 font-medium">अपोस्ट जर्नल</div>
                    <BookOpenCheck className="h-4 w-4 mx-auto mt-1 text-purple-500" />
                  </div>
                </div>
              )}
              {(enhanced?.pendingEntries || 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">
                    एकूण {enhanced?.pendingEntries} प्रलंबित एंट्रीज पोस्टिंगची प्रतीक्षा करत आहेत
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Login Activity */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-orange-400" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-orange-600" />
                  </div>
                  अलीकडील लॉगिन
                </CardTitle>
                <button onClick={() => setActiveView('logs')} className="text-xs text-teal-600 hover:text-teal-800 font-medium">
                  सर्व लॉग →
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">कोणतेही लॉग नाहीत.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center ${log.user.role === 'gpo' ? 'bg-green-500' : 'bg-amber-500'}`}>
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{log.user.nameMarathi || log.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(log.loginAt)}</p>
                        </div>
                      </div>
                      {log.action === 'login' ? (
                        <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">
                          <LogIn className="h-2.5 w-2.5 mr-0.5" /> लॉगिन
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px]">
                          <LogOut className="h-2.5 w-2.5 mr-0.5" /> लॉगआउट
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── 6. Process Flow Diagram ─────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #8e44ad, #0d7377, #27ae60, #e67e22, #e74c3c)' }} />
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-teal-600" />
            </div>
            प्रक्रिया प्रवाह — Master → Daily → Register → Ledger → Auto → Namuna → Export
          </h2>
          {/* Flow Diagram */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max justify-center">
              {processSteps.map((step, i, arr) => (
                <React.Fragment key={i}>
                  <div className={`border-2 rounded-xl p-3 text-center min-w-[110px] ${step.bg}`}>
                    <div className={`h-8 w-8 rounded-lg ${step.iconBg} flex items-center justify-center mx-auto mb-1.5 shadow-sm`}>
                      <step.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className={`text-xs font-bold whitespace-pre-line leading-tight ${step.text}`}>{step.label}</span>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{step.sublabel}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Separator className="my-4" />
          {/* Explanation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50/50">
              <h4 className="font-bold mb-1 text-purple-800 flex items-center gap-1"><Database className="h-4 w-4" /> Step 1-2: मास्टर + दैनंदिन</h4>
              <div className="text-purple-700/70 text-xs">वार्ड, मालक, मालमत्ता, कर दर, रेडीरेकनर एकदा भरा. नंतर दैनंदिन पावती/पेमेंट एंट्री.</div>
            </div>
            <div className="border-2 border-teal-100 rounded-xl p-4 bg-teal-50/50">
              <h4 className="font-bold mb-1 text-teal-800 flex items-center gap-1"><BookOpenCheck className="h-4 w-4" /> Step 3-5: ऑटो प्रक्रिया</h4>
              <div className="text-teal-700/70 text-xs">रजिस्टर ऑटो अपडेट, खाते पोस्टिंग, कर गणना स्वयंचलित — कोणतीही मॅन्युअल गणना नाही.</div>
            </div>
            <div className="border-2 border-green-100 rounded-xl p-4 bg-green-50/50">
              <h4 className="font-bold mb-1 text-green-800 flex items-center gap-1"><FileDown className="h-4 w-4" /> Step 6-7: नमुना + निर्यात</h4>
              <div className="text-green-700/70 text-xs">नमुना १ ते ३३ ऑटो तयार, PDF/Excel मध्ये निर्यात. एकदा मास्टर भरले की पुन्हा टाकावे लागणार नाही.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 7. Quick Actions ────────────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #8e44ad, #9b59b6, #e67e22)' }} />
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            द्रुत कार्य
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((item, i) => (
              <button key={i} onClick={() => setActiveView(item.view)} className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${item.bg}`}>
                <div className={`h-10 w-10 rounded-lg ${item.iconBg} flex items-center justify-center shadow-sm`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">{item.sublabel}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── 8. Collection Progress ──────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #2ecc71, #e67e22)' }} />
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4 text-green-600" />
            </div>
            वसूल प्रगती
          </h2>

          {/* Progress Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
              <p className="text-xs text-amber-700 font-medium mb-1">एकूण मागणी</p>
              <p className="text-2xl font-bold text-amber-800">{formatCurrency(stats?.totalDemand || 0)}</p>
              <BarChart3 className="h-4 w-4 mx-auto mt-1 text-amber-500" />
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">एकूण वसूल</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(stats?.totalPaid || 0)}</p>
              <TrendingUp className="h-4 w-4 mx-auto mt-1 text-green-500" />
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
              <p className="text-xs text-red-700 font-medium mb-1">शिल्लक बक्की</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(stats?.outstandingBalance || 0)}</p>
              <TrendingDown className="h-4 w-4 mx-auto mt-1 text-red-500" />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3">
            {/* Demand Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-amber-700">एकूण मागणी</span>
                <span className="font-bold text-amber-800">{formatCurrency(stats?.totalDemand || 0)}</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-6 rounded-full transition-all flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                  }}
                >
                  मागणी
                </div>
              </div>
            </div>

            {/* Collected Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-green-700">एकूण वसूल</span>
                <span className="font-bold text-green-800">{formatCurrency(stats?.totalPaid || 0)}</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-6 rounded-full transition-all flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    width: `${Math.max(collectionPercent, stats?.totalPaid ? 3 : 0)}%`,
                    background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                  }}
                >
                  {collectionPercent > 10 ? `${collectionPercent.toFixed(1)}%` : ''}
                </div>
              </div>
            </div>

            {/* Balance Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-red-700">शिल्लक बक्की</span>
                <span className="font-bold text-red-800">{formatCurrency(stats?.outstandingBalance || 0)}</span>
              </div>
              <div className="w-full bg-red-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-6 rounded-full transition-all flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    width: `${Math.max(100 - collectionPercent, stats?.outstandingBalance ? 3 : 0)}%`,
                    background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                  }}
                >
                  {(100 - collectionPercent) > 10 ? `${(100 - collectionPercent).toFixed(1)}%` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Collection percentage highlight */}
          <div className="mt-4 text-center bg-gradient-to-r from-green-50 via-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
            <p className="text-sm text-teal-700 font-medium">वसूल प्रमाण</p>
            <p className="text-4xl font-bold text-teal-800">{collectionPercent.toFixed(1)}%</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {collectionPercent >= 75 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : collectionPercent >= 50 ? (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground">
                {collectionPercent >= 75 ? 'उत्तम वसूल' : collectionPercent >= 50 ? 'मध्यम वसूल' : 'वसूल सुधारणे आवश्यक'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Login Credentials ───────────────────────────────────────── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #e67e22)' }} />
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            लॉगिन माहिती
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-green-200 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-green-600 text-white border-0 shadow-sm">GPO</Badge>
                <span className="font-bold text-green-900 text-sm">ग्रामपंचायत अधिकारी</span>
              </div>
              <div className="text-sm text-green-800 mt-2 bg-white/60 rounded-lg p-2">
                Username: <code className="bg-green-100 px-1.5 py-0.5 rounded font-bold">gpo</code> | Password: <code className="bg-green-100 px-1.5 py-0.5 rounded font-bold">gpo123</code>
              </div>
              <p className="text-xs text-green-700/70 mt-2">✅ सर्व मास्टर डेटा अपडेट, नमुना तयार, रिपोर्ट पाहणे</p>
            </div>
            <div className="border-2 border-amber-200 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #fef3e8, #fef9e7)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-amber-500 text-white border-0 shadow-sm">Operator</Badge>
                <span className="font-bold text-amber-900 text-sm">ऑपरेटर</span>
              </div>
              <div className="text-sm text-amber-800 mt-2 bg-white/60 rounded-lg p-2">
                Username: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold">operator</code> | Password: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold">op123</code>
              </div>
              <p className="text-xs text-amber-700/70 mt-2">✅ मास्टर डेटा एंट्री, नमुना तयार, पावती बनवणे</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
