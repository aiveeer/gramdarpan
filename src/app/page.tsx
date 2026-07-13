'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  LayoutDashboard,
  Database,
  BookOpen,
  FileText,
  Receipt,
  ClipboardList,
  Search,
  LogIn,
  Activity,
  ChevronRight,
  Building2,
  MapPin,
  Users,
  Route,
  Droplets,
  Lightbulb,
  HeartPulse,
  UserCog,
  Landmark,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  LogOut,
  CheckCircle2,
  ArrowRight,
  Wrench,
  BarChart3,
  HandCoins,
  Wallet,
  NotebookPen,
  Calculator,
  DropletsIcon,
  Warehouse,
  Package,
  Banknote,
  BookOpenCheck,
  BanknoteIcon,
  FileSpreadsheet,
  FolderOpen,
  Flag,
  CalendarDays,
  HomeIcon,
  Layers,
  UserCircle,
  Ruler,
  Percent,
  Pill,
  HardHat,
  PiggyBank,
  Tag,
  Accessibility,
  CircleDollarSign,
  CreditCard,
  BookCopy,
  ReceiptText,
  ListChecks,
  PackageCheck,
  FolderArchive,
  HandCoinsIcon,
  FileCheck2,
  FileBadge,
  FileBarChart,
  FileLock2,
  ScrollText,
  Gauge,
  TreePine,
  Compass,
  Stamp,
  RotateCcw,
} from 'lucide-react';

import LoginForm from '@/components/login-form';

// Dynamic imports to reduce initial bundle size and prevent SSR crashes
const MasterData = dynamic(() => import('@/components/master-data'), { ssr: false });
const Namuna8Component = dynamic(() => import('@/components/namuna8'), { ssr: false });
const Namuna9Component = dynamic(() => import('@/components/namuna9'), { ssr: false });
const Namuna9KaComponent = dynamic(() => import('@/components/namuna9ka'), { ssr: false });
const Namuna1Component = dynamic(() => import('@/components/namuna1'), { ssr: false });
const AuthLogs = dynamic(() => import('@/components/auth-logs'), { ssr: false });
const GlobalSearch = dynamic(() => import('@/components/global-search'), { ssr: false });
const ExcelImportExport = dynamic(() => import('@/components/excel-import-export'), { ssr: false });
const DailyTransactions = dynamic(() => import('@/components/daily-transactions'), { ssr: false });
const AutoRegisters = dynamic(() => import('@/components/auto-registers'), { ssr: false });
const NamunaReports = dynamic(() => import('@/components/namuna-reports'), { ssr: false });
const ERPDashboard = dynamic(() => import('@/components/erp-dashboard'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Navigation Data ─────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  color?: string;
};

type NavGroup = {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
};

const masterEntryItems: NavItem[] = [
  { id: 'master-village', label: 'ग्रामपंचायत माहिती', labelEn: 'Village Info', icon: Building2 },
  { id: 'master-fy', label: 'वित्तीय वर्ष', labelEn: 'Financial Year', icon: CalendarDays },
  { id: 'master-ward', label: 'वार्ड माहिती', labelEn: 'Ward Info', icon: MapPin },
  { id: 'master-road', label: 'रस्ता माहिती', labelEn: 'Road Info', icon: Route },
  { id: 'master-property', label: 'मालमत्ता माहिती', labelEn: 'Property Info', icon: HomeIcon },
  { id: 'master-owner', label: 'मालक माहिती', labelEn: 'Owner Info', icon: Users },
  { id: 'master-floor', label: 'मजला माहिती', labelEn: 'Floor Info', icon: Layers },
  { id: 'master-tax', label: 'कर दर', labelEn: 'Tax Rates', icon: Percent },
  { id: 'master-water-tax', label: 'पाणीकर दर', labelEn: 'Water Tax Rates', icon: Droplets },
  { id: 'master-ready-reckoner', label: 'रेडीरेकनर दर', labelEn: 'Ready Reckoner Rates', icon: Calculator },
  { id: 'master-streetlight', label: 'दिवाबत्ती माहिती', labelEn: 'Street Light Info', icon: Lightbulb },
  { id: 'master-health', label: 'आरोग्य व स्वच्छता', labelEn: 'Health & Sanitation', icon: HeartPulse },
  { id: 'master-employee', label: 'कर्मचारी माहिती', labelEn: 'Employee Info', icon: HardHat },
  { id: 'master-scheme', label: 'योजना माहिती', labelEn: 'Scheme Info', icon: FolderOpen },
  { id: 'master-bank', label: 'बँक खाती', labelEn: 'Bank Accounts', icon: PiggyBank },
  { id: 'master-budget', label: 'बजेट शिर्ष', labelEn: 'Budget Heads', icon: BanknoteIcon },
  { id: 'master-demand-type', label: 'मागणी प्रकार', labelEn: 'Demand Categories', icon: Tag },
  { id: 'master-disability', label: 'अपंगत्व नोंदणी', labelEn: 'Disability Register', icon: Accessibility },
];

const dailyTransactionItems: NavItem[] = [
  { id: 'txn-receipt', label: 'पावती एंट्री', labelEn: 'Receipt Entry', icon: Receipt, color: 'text-green-600' },
  { id: 'txn-payment', label: 'पेमेंट एंट्री', labelEn: 'Payment Entry', icon: CreditCard, color: 'text-red-600' },
  { id: 'txn-journal', label: 'जर्नल एंट्री', labelEn: 'Journal Entry', icon: NotebookPen, color: 'text-purple-600' },
  { id: 'txn-demand', label: 'मागणी निर्मिती', labelEn: 'Demand Generation', icon: CircleDollarSign, color: 'text-amber-600' },
  { id: 'txn-collection', label: 'वसूल एंट्री', labelEn: 'Collection Entry', icon: HandCoins, color: 'text-teal-600' },
  { id: 'txn-tax-assessment', label: 'कर आकारणी (नमुना ८)', labelEn: 'Tax Assessment', icon: Calculator, color: 'text-emerald-600' },
  { id: 'txn-water-bill', label: 'पाणी बिल', labelEn: 'Water Bill', icon: DropletsIcon, color: 'text-sky-600' },
  { id: 'txn-asset', label: 'मालमत्ता एंट्री', labelEn: 'Asset Entry', icon: Warehouse, color: 'text-orange-600' },
  { id: 'txn-stock', label: 'साठा एंट्री', labelEn: 'Stock Entry', icon: Package, color: 'text-indigo-600' },
  { id: 'txn-scheme-fund', label: 'योजना निधी', labelEn: 'Scheme Fund', icon: Banknote, color: 'text-rose-600' },
  { id: 'txn-budget', label: 'अंदाजपत्रक एंट्री', labelEn: 'Budget Entry', icon: ClipboardList, color: 'text-cyan-600' },
  { id: 'txn-work', label: 'विकासकाम एंट्री', labelEn: 'Work Entry', icon: HardHat, color: 'text-lime-600' },
  { id: 'txn-salary', label: 'वेतन एंट्री', labelEn: 'Salary Entry', icon: IndianRupee, color: 'text-emerald-600' },
];

const autoRegisterItems: NavItem[] = [
  { id: 'reg-cash-book', label: 'सामान्य रोकड वही (नमुना ५)', labelEn: 'Cash Book', icon: BookOpen, color: 'text-green-600' },
  { id: 'reg-daily-cash', label: 'दैनिक रोकडवही (नमुना ५ क)', labelEn: 'Daily Cash Book', icon: BookCopy, color: 'text-teal-600' },
  { id: 'reg-classified', label: 'वर्गीकृत नोंदवही (नमुना ६)', labelEn: 'Classified Register', icon: BookOpenCheck, color: 'text-emerald-600' },
  { id: 'reg-receipt', label: 'सामान्य पावती (नमुना ७)', labelEn: 'General Receipt', icon: ReceiptText, color: 'text-cyan-600' },
  { id: 'reg-demand', label: 'कर मागणी नोंदवही (नमुना ९)', labelEn: 'Tax Demand Register', icon: BookOpenCheck, color: 'text-amber-600' },
  { id: 'reg-tax-receipt', label: 'कर व फी पावती (नमुना १०)', labelEn: 'Tax & Fee Receipt', icon: Receipt, color: 'text-purple-600' },
  { id: 'reg-misc-demand', label: 'किरकोळ कर व फी आकारणी (नमुना ११)', labelEn: 'Miscellaneous Tax & Fee Assessment', icon: FileText, color: 'text-rose-600' },
  { id: 'reg-petty-cash', label: 'किरकोळ रोकडवही (नमुना १८)', labelEn: 'Petty Cash Book', icon: IndianRupee, color: 'text-orange-600' },
  { id: 'reg-muster-roll', label: 'हजेरीपट (नमुना १९)', labelEn: 'Muster Roll', icon: ClipboardList, color: 'text-lime-600' },
];

interface NamunaSubGroup {
  label: string;
  items: NavItem[];
}

const namunaReportSubGroups: NamunaSubGroup[] = [
  {
    label: 'अर्थसंकल्प व आर्थिक विवरण',
    items: [
      { id: 'namuna-1', label: 'नमुना १ - अर्थसंकल्प/अंदाजपत्रक', labelEn: 'Budget Estimate', icon: Calculator, color: 'text-cyan-600' },
      { id: 'namuna-2', label: 'नमुना २ - पुनर्विनियोजन व नियत वाटप', labelEn: 'Re-appropriation & Allocation', icon: FileCheck2, color: 'text-teal-600' },
    ],
  },
  {
    label: 'आर्थिक स्थिती विवरण',
    items: [
      { id: 'namuna-3', label: 'नमुना ३ - जमा खर्च विवरण', labelEn: 'Income & Expenditure Statement', icon: Gauge, color: 'text-green-600' },
      { id: 'namuna-4', label: 'नमुना ४ - मत्ता व दायित्वे', labelEn: 'Assets & Liabilities', icon: FileBarChart, color: 'text-emerald-600' },
    ],
  },
  {
    label: 'रोकड व पावती',
    items: [
      { id: 'namuna-5', label: 'नमुना ५ - सामान्य रोकड वही', labelEn: 'General Cash Book', icon: BookOpen, color: 'text-green-600' },
      { id: 'namuna-5ka', label: 'नमुना ५ क - दैनिक रोकडवही', labelEn: 'Daily Cash Book', icon: BookCopy, color: 'text-teal-600' },
      { id: 'namuna-6', label: 'नमुना ६ - वर्गीकृत नोंदवही', labelEn: 'Classified Receipt Register', icon: BookOpenCheck, color: 'text-cyan-600' },
      { id: 'namuna-7', label: 'नमुना ७ - सामान्य पावती', labelEn: 'General Receipt', icon: ReceiptText, color: 'text-amber-600' },
    ],
  },
  {
    label: 'कर आकारणी व मागणी',
    items: [
      { id: 'namuna-8', label: 'नमुना ८ - कर आकारणी नोंदवही', labelEn: 'Tax Assessment Register', icon: FileText, color: 'text-emerald-600' },
      { id: 'namuna-9', label: 'नमुना ९ - कर मागणी नोंदवही', labelEn: 'Tax Demand Register', icon: BookOpen, color: 'text-amber-600' },
      { id: 'namuna-9ka', label: 'नमुना ९ क - कराची मागणी पावती', labelEn: 'Tax Demand Bill', icon: Receipt, color: 'text-rose-600' },
      { id: 'namuna-10', label: 'नमुना १० - कर व फी बाबत पावती', labelEn: 'Tax & Fee Receipt', icon: IndianRupee, color: 'text-purple-600' },
      { id: 'namuna-11', label: 'नमुना ११ - किरकोळ कर व फी आकारणी नोंदवही', labelEn: 'Miscellaneous Tax & Fee Assessment Register', icon: ScrollText, color: 'text-orange-600' },
    ],
  },
  {
    label: 'खर्च व प्रमाणक',
    items: [
      { id: 'namuna-12', label: 'नमुना १२ - अकस्मात खर्चाचे प्रमाणक', labelEn: 'Contingent Expense Voucher', icon: FileText, color: 'text-red-600' },
      { id: 'namuna-18', label: 'नमुना १८ - किरकोळ रोकडवही', labelEn: 'Petty Cash Book', icon: IndianRupee, color: 'text-orange-600' },
    ],
  },
  {
    label: 'कर्मचारी व वेतन',
    items: [
      { id: 'namuna-13', label: 'नमुना १३ - कर्मचारी नोंदवही', labelEn: 'Employee Register', icon: UserCog, color: 'text-blue-600' },
      { id: 'namuna-14', label: 'नमुना १४ - मुद्रांक हिशोब नोंदवही', labelEn: 'Stamp Account Register', icon: Stamp, color: 'text-indigo-600' },
      { id: 'namuna-21', label: 'नमुना २१ - कर्मचाऱ्याच्या देयकाची नोंदवही', labelEn: 'Employee Bill Register', icon: NotebookPen, color: 'text-sky-600' },
      { id: 'namuna-31', label: 'नमुना ३१ - प्रवास भत्ता देयक', labelEn: 'Travel Allowance Bill', icon: RotateCcw, color: 'text-teal-600' },
    ],
  },
  {
    label: 'साठा व मालमत्ता',
    items: [
      { id: 'namuna-15', label: 'नमुना १५ - उपभोग्य वस्तू साठा नोंदवही', labelEn: 'Consumable Stock Register', icon: PackageCheck, color: 'text-indigo-600' },
      { id: 'namuna-16', label: 'नमुना १६ - जडवस्तू संग्रह व जंगम मालमत्ता नोंदवही', labelEn: 'Dead Stock & Movable Property Register', icon: FolderArchive, color: 'text-amber-600' },
      { id: 'namuna-17', label: 'नमुना १७ - अग्रीम/अनामत रक्कम नोंदवही', labelEn: 'Advance & Deposit Register', icon: HandCoinsIcon, color: 'text-purple-600' },
      { id: 'namuna-22', label: 'नमुना २२ - स्थावर मालमत्ता नोंदवही', labelEn: 'Immovable Property Register', icon: Building2, color: 'text-orange-600' },
      { id: 'namuna-23', label: 'नमुना २३ - ताब्यातील रस्त्यांची नोंदवही', labelEn: 'Road Register', icon: Route, color: 'text-slate-600' },
      { id: 'namuna-24', label: 'नमुना २४ - जमिनीची नोंदवही', labelEn: 'Land Register', icon: Compass, color: 'text-amber-700' },
      { id: 'namuna-25', label: 'नमुना २५ - गुंतवणूक नोंदवही', labelEn: 'Investment Register', icon: TrendingUp, color: 'text-emerald-600' },
      { id: 'namuna-33', label: 'नमुना ३३ - वृक्ष नोंदवही', labelEn: 'Tree Register', icon: TreePine, color: 'text-green-600' },
    ],
  },
  {
    label: 'विकासकाम व देयक',
    items: [
      { id: 'namuna-19', label: 'नमुना १९ - हजेरीपट (मजुरांची हजेरी)', labelEn: 'Muster Roll / Attendance', icon: ClipboardList, color: 'text-lime-600' },
      { id: 'namuna-20', label: 'नमुना २० - कामाच्या अंदाजाची नोंदवही', labelEn: 'Estimate Register for Works', icon: Ruler, color: 'text-cyan-600' },
      { id: 'namuna-20ka', label: 'नमुना २० क - मोजमाप वही', labelEn: 'Measurement Book', icon: Ruler, color: 'text-sky-600' },
      { id: 'namuna-20kha', label: 'नमुना २० ख - कामाचे देयक', labelEn: 'Work Bill', icon: FileText, color: 'text-rose-600' },
    ],
  },
  {
    label: 'मासिक विवरण व लेखापरीक्षण',
    items: [
      { id: 'namuna-26ka', label: 'नमुना २६ क - जमा मासिक विवरण', labelEn: 'Monthly Income Statement', icon: TrendingUp, color: 'text-teal-600' },
      { id: 'namuna-26kha', label: 'नमुना २६ ख - खर्चाचे मासिक विवरण', labelEn: 'Monthly Expenditure Statement', icon: TrendingDown, color: 'text-red-600' },
      { id: 'namuna-27', label: 'नमुना २७ - लेखा परीक्षण आक्षेप पूर्तता विवरण', labelEn: 'Audit Objection Compliance Statement', icon: Shield, color: 'text-amber-600' },
      { id: 'namuna-28', label: 'नमुना २८ - मागासवर्गीय 15% व महिला बालकल्याण 10% खर्चाचे मासिक विवरण', labelEn: 'SC 15% & Women/Child Welfare 10% Monthly Expenditure', icon: HeartPulse, color: 'text-pink-600' },
      { id: 'namuna-29', label: 'नमुना २९ - कर्जाची नोंदवही', labelEn: 'Loan Register', icon: Banknote, color: 'text-orange-600' },
      { id: 'namuna-30', label: 'नमुना ३० - लेखा परीक्षण आक्षेप पूर्तता नोंदवही', labelEn: 'Audit Objection Compliance Register', icon: FileLock2, color: 'text-slate-600' },
      { id: 'namuna-32', label: 'नमुना ३२ - रक्कमेच्या परताव्यासाठीचा आदेश', labelEn: 'Refund Order', icon: RotateCcw, color: 'text-purple-600' },
    ],
  },
];

// ─── Helper: Placeholder Component ───────────────────────────────────────────

function PlaceholderView({ title, titleEn, icon: Icon, color }: { title: string; titleEn: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <div className="h-2 rounded-t-lg" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        <CardContent className="p-8 text-center">
          <div className="h-20 w-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
            <Icon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-4">{titleEn}</p>
          <Badge variant="outline" className="px-4 py-1.5 text-sm" style={{ borderColor: color, color }}>
            या विभागाचे काम सुरू आहे
          </Badge>
          <p className="text-xs text-muted-foreground mt-3">This module is under development</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<{
    authenticated: boolean;
    user?: { id: string; name: string; nameMarathi: string; role: string; username: string };
    loginAt?: string | null;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<SessionLog[]>([]);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    masters: false,
    transactions: false,
    registers: false,
    namuna: false,
  });

  // Check auth session
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }
    } catch { /* ignore */ }
    setUser({ authenticated: false });
    return { authenticated: false };
  }, []);

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok && isMounted) setStats(await res.json());
      } catch { /* ignore */ }
    };
    const loadLogs = async () => {
      try {
        const res = await fetch('/api/auth/logs?limit=5');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRecentLogs(data.sessions || []);
        }
      } catch { /* ignore */ }
    };
    const loadSessionData = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        if (isMounted) setUser({ authenticated: false });
      }
    };
    loadData();
    loadLogs();
    loadSessionData();
    const interval = setInterval(() => {
      loadData();
      loadLogs();
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('mr-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Handle logout from child components (LoginForm) or header
  const handleLogout = useCallback(async () => {
    try {
      // Server-side logout to clear cookies and log the session
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore server errors
    }
    // Also manually clear cookies client-side as fallback
    document.cookie = 'session_user_id=; path=/; max-age=0';
    document.cookie = 'session_user_role=; path=/; max-age=0';
    document.cookie = 'session_id=; path=/; max-age=0';
    // Force a full page reload to ensure clean state transition
    window.location.reload();
  }, []);

  // Handle successful login from child components - directly set user state from login response
  const handleLoginSuccess = useCallback((loginData: {
    id: string;
    username: string;
    name: string;
    nameMarathi: string;
    role: string;
    sessionId: string;
  }) => {
    // Directly set user state from login response data (no second API call needed)
    setUser({
      authenticated: true,
      user: {
        id: loginData.id,
        name: loginData.name,
        nameMarathi: loginData.nameMarathi,
        role: loginData.role,
        username: loginData.username,
      },
      loginAt: new Date().toISOString(),
    });
    setActiveView('dashboard');
    refreshStats();
  }, [refreshStats]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    if (viewId === 'dashboard') refreshStats();
  };

  // ─── Render Main Content ─────────────────────────────────────────────────

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ERPDashboard stats={stats} user={user} recentLogs={recentLogs} setActiveView={setActiveView} formatTime={formatTime} refreshStats={refreshStats} />;

      // Master Data entries - route to the master data component with appropriate tab
      case 'master-village':
        return <MasterData initialTab="village" />;
      case 'master-fy':
        return <MasterData initialTab="fy" />;
      case 'master-ward':
        return <MasterData initialTab="ward" />;
      case 'master-road':
        return <MasterData initialTab="road" />;
      case 'master-property':
        return <MasterData initialTab="property" />;
      case 'master-owner':
        return <MasterData initialTab="owner" />;
      case 'master-floor':
        return <MasterData initialTab="floorInfo" />;
      case 'master-tax':
        return <MasterData initialTab="tax" />;
      case 'master-water-tax':
        return <MasterData initialTab="waterSupply" />;
      case 'master-ready-reckoner':
        return <MasterData initialTab="readyReckoner" />;
      case 'master-streetlight':
        return <MasterData initialTab="streetLight" />;
      case 'master-health':
        return <MasterData initialTab="drainage" />;
      case 'master-employee':
        return <MasterData initialTab="employee" />;
      case 'master-scheme':
        return <MasterData initialTab="scheme" />;
      case 'master-bank':
        return <MasterData initialTab="bank" />;
      case 'master-budget':
        return <MasterData initialTab="budget-head" />;
      case 'master-demand-type':
        return <MasterData initialTab="demandCategory" />;
      case 'master-disability':
        return <MasterData initialTab="disability" />;
      case 'master-contractor':
        return <MasterData initialTab="contractor" />;

      // Daily Transactions - use DailyTransactions component with initial tab
      case 'txn-receipt':
        return <DailyTransactions initialTab="receipt" />;
      case 'txn-payment':
        return <DailyTransactions initialTab="payment" />;
      case 'txn-journal':
        return <DailyTransactions initialTab="journal" />;
      case 'txn-demand':
        return <Namuna9Component />;
      case 'txn-collection':
        return <DailyTransactions initialTab="collection" />;
      case 'txn-tax-assessment':
        return <Namuna8Component />;
      case 'txn-water-bill':
        return <DailyTransactions initialTab="water-bill" />;
      case 'txn-asset':
        return <DailyTransactions initialTab="asset" />;
      case 'txn-stock':
        return <DailyTransactions initialTab="stock" />;
      case 'txn-scheme-fund':
        return <DailyTransactions initialTab="scheme-fund" />;
      case 'txn-budget':
        return <DailyTransactions initialTab="budget" />;
      case 'txn-work':
        return <DailyTransactions initialTab="work" />;
      case 'txn-salary':
        return <DailyTransactions initialTab="salary" />;

      // Auto Registers - use AutoRegisters component with initial tab
      case 'reg-cash-book':
        return <AutoRegisters initialTab="cash-book" />;
      case 'reg-daily-cash':
        return <NamunaReports initialNamuna="5ka" onNavigate={handleNavClick} />;
      case 'reg-classified':
        return <NamunaReports initialNamuna="6" onNavigate={handleNavClick} />;
      case 'reg-receipt':
        return <AutoRegisters initialTab="receipt" />;
      case 'reg-demand':
        return <AutoRegisters initialTab="demand" />;
      case 'reg-tax-receipt':
        return <NamunaReports initialNamuna="10" onNavigate={handleNavClick} />;
      case 'reg-misc-demand':
        return <NamunaReports initialNamuna="11" onNavigate={handleNavClick} />;
      case 'reg-petty-cash':
        return <NamunaReports initialNamuna="18" onNavigate={handleNavClick} />;
      case 'reg-muster-roll':
        return <NamunaReports initialNamuna="19" onNavigate={handleNavClick} />;
      case 'reg-payment':
        return <AutoRegisters initialTab="payment" />;
      case 'reg-collection':
        return <AutoRegisters initialTab="collection" />;
      case 'reg-asset':
        return <AutoRegisters initialTab="asset" />;
      case 'reg-stock':
        return <AutoRegisters initialTab="stock" />;
      case 'reg-grant':
        return <AutoRegisters initialTab="grant" />;
      case 'registers-receipt-payment':
        return <AutoRegisters initialTab="receipt" />;
      case 'registers-ledger':
        return <AutoRegisters initialTab="ledger" />;

      // Namuna Reports - use NamunaReports component with initial namuna
      case 'namuna-1':
        return <Namuna1Component />;
      case 'namuna-2':
        return <NamunaReports initialNamuna="2" onNavigate={handleNavClick} />;
      case 'namuna-3':
        return <NamunaReports initialNamuna="3" onNavigate={handleNavClick} />;
      case 'namuna-4':
        return <NamunaReports initialNamuna="4" onNavigate={handleNavClick} />;
      case 'namuna-5':
        return <NamunaReports initialNamuna="5" onNavigate={handleNavClick} />;
      case 'namuna-5ka':
        return <NamunaReports initialNamuna="5ka" onNavigate={handleNavClick} />;
      case 'namuna-6':
        return <NamunaReports initialNamuna="6" onNavigate={handleNavClick} />;
      case 'namuna-7':
        return <NamunaReports initialNamuna="7" onNavigate={handleNavClick} />;
      case 'namuna-8':
        return <Namuna8Component />;
      case 'namuna-9':
        return <Namuna9Component />;
      case 'namuna-9ka':
        return <Namuna9KaComponent />;
      case 'namuna-10':
        return <NamunaReports initialNamuna="10" onNavigate={handleNavClick} />;
      case 'namuna-11':
        return <NamunaReports initialNamuna="11" onNavigate={handleNavClick} />;
      case 'namuna-12':
        return <NamunaReports initialNamuna="12" onNavigate={handleNavClick} />;
      case 'namuna-13':
        return <NamunaReports initialNamuna="13" onNavigate={handleNavClick} />;
      case 'namuna-14':
        return <NamunaReports initialNamuna="14" onNavigate={handleNavClick} />;
      case 'namuna-15':
        return <NamunaReports initialNamuna="15" onNavigate={handleNavClick} />;
      case 'namuna-16':
        return <NamunaReports initialNamuna="16" onNavigate={handleNavClick} />;
      case 'namuna-17':
        return <NamunaReports initialNamuna="17" onNavigate={handleNavClick} />;
      case 'namuna-18':
        return <NamunaReports initialNamuna="18" onNavigate={handleNavClick} />;
      case 'namuna-19':
        return <NamunaReports initialNamuna="19" onNavigate={handleNavClick} />;
      case 'namuna-20':
        return <NamunaReports initialNamuna="20" onNavigate={handleNavClick} />;
      case 'namuna-20ka':
        return <NamunaReports initialNamuna="20ka" onNavigate={handleNavClick} />;
      case 'namuna-20kha':
        return <NamunaReports initialNamuna="20kha" onNavigate={handleNavClick} />;
      case 'namuna-21':
        return <NamunaReports initialNamuna="21" onNavigate={handleNavClick} />;
      case 'namuna-22':
        return <NamunaReports initialNamuna="22" onNavigate={handleNavClick} />;
      case 'namuna-23':
        return <NamunaReports initialNamuna="23" onNavigate={handleNavClick} />;
      case 'namuna-24':
        return <NamunaReports initialNamuna="24" onNavigate={handleNavClick} />;
      case 'namuna-25':
        return <NamunaReports initialNamuna="25" onNavigate={handleNavClick} />;
      case 'namuna-26ka':
        return <NamunaReports initialNamuna="26ka" onNavigate={handleNavClick} />;
      case 'namuna-26kha':
        return <NamunaReports initialNamuna="26kha" onNavigate={handleNavClick} />;
      case 'namuna-27':
        return <NamunaReports initialNamuna="27" onNavigate={handleNavClick} />;
      case 'namuna-28':
        return <NamunaReports initialNamuna="28" onNavigate={handleNavClick} />;
      case 'namuna-29':
        return <NamunaReports initialNamuna="29" onNavigate={handleNavClick} />;
      case 'namuna-30':
        return <NamunaReports initialNamuna="30" onNavigate={handleNavClick} />;
      case 'namuna-31':
        return <NamunaReports initialNamuna="31" onNavigate={handleNavClick} />;
      case 'namuna-32':
        return <NamunaReports initialNamuna="32" onNavigate={handleNavClick} />;
      case 'namuna-33':
        return <NamunaReports initialNamuna="33" onNavigate={handleNavClick} />;

      // Search
      case 'search':
        return <GlobalSearch />;

      // Auth
      case 'logs':
        return <AuthLogs />;

      // Excel
      case 'excel':
        return <ExcelImportExport />;

      default:
        return <ERPDashboard stats={stats} user={user} recentLogs={recentLogs} setActiveView={setActiveView} formatTime={formatTime} refreshStats={refreshStats} />;
    }
  };

  // ─── Get active label for breadcrumb ─────────────────────────────────────

  const getActiveLabel = () => {
    if (activeView === 'dashboard') return 'डॅशबोर्ड';
    if (activeView === 'search') return 'शोधा';
    if (activeView === 'login') return 'लॉगिन';
    if (activeView === 'logs') return 'लॉग';
    if (activeView === 'excel') return 'आयात/निर्यात';

    // Search in all navigation items
    const allItems = [
      ...masterEntryItems,
      ...dailyTransactionItems,
      ...autoRegisterItems,
      ...namunaReportSubGroups.flatMap((g) => g.items),
    ];
    const found = allItems.find((item) => item.id === activeView);
    return found ? found.label : 'डॅशबोर्ड';
  };

  // If not authenticated, show full-screen login page (no sidebar, no header, no features)
  if (!user?.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d7377 0%, #0a5c5f 30%, #1a5632 100%)' }}>
        <div className="w-full max-w-md mx-4">
          {/* Indian Flag Tricolor Bar */}
          <div className="flex h-1.5 w-full rounded-t-xl overflow-hidden mb-0">
            <div className="flex-1" style={{ background: '#FF9933' }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ background: '#138808' }} />
          </div>
          {/* Logo and Title */}
          <div className="bg-white/10 backdrop-blur-sm p-6 text-center border-b border-white/10">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">ग्रामदर्पण</h1>
            <p className="text-sm text-teal-100/80">ग्रामपंचायत लेखा संहिता ERP — महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११</p>
          </div>
          {/* Login Form */}
          <div className="bg-white rounded-b-xl shadow-2xl">
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
            />
          </div>
          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-teal-100/60">© 2024 ग्रामदर्पण — महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११</p>
          </div>
          {/* Indian Flag Tricolor Bar Bottom */}
          <div className="flex h-1 w-full rounded-b-xl overflow-hidden mt-4">
            <div className="flex-1" style={{ background: '#FF9933' }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ background: '#138808' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #f0faf5 0%, #f8faf9 30%, #ffffff 100%)' }}>
        {/* ─── Indian Flag Tricolor Bar ──────────────────────────────── */}
        <div className="flex h-1.5 w-full shrink-0">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>

        {/* ─── Header ────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 shadow-lg" style={{ background: 'linear-gradient(135deg, #0d7377 0%, #0a5c5f 50%, #1a5632 100%)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-white/20 text-white" />
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight text-white">
                  ग्रामदर्पण ERP पोर्टल
                </h1>
                <p className="text-xs text-teal-100/80 hidden sm:block">
                  Gramdarpan — Maharashtra Gram Panchayat Accounting ERP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Financial Year Selector */}
              <div className="hidden sm:flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-100/70" />
                <Select value={financialYear} onValueChange={setFinancialYear}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Info */}
              {user?.authenticated && user.user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: user.user.role === 'gpo' ? '#27ae60' : '#e67e22' }}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{user.user.nameMarathi}</span>
                    <Badge className={`${user.user.role === 'gpo' ? 'bg-green-500' : 'bg-amber-500'} text-white text-xs border-0`}>
                      {user.user.role === 'gpo' ? 'GPO' : 'Operator'}
                    </Badge>
                  </div>
                  {user.loginAt && (
                    <div className="hidden lg:flex items-center gap-1 text-xs text-teal-100/70 bg-white/10 rounded-full px-2.5 py-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(user.loginAt)}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white hover:bg-white/20 h-8 px-2"
                    title="लॉगआउट"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1 text-xs">लॉगआउट</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView('login')}
                  className="text-white hover:bg-white/20 h-8 px-2"
                  title="लॉगिन करा"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1 text-xs">लॉगिन</span>
                </Button>
              )}

              {/* Mobile FY selector */}
              <div className="sm:hidden flex items-center gap-1 bg-white/10 rounded-full px-2 py-1 text-xs text-white">
                <CalendarDays className="h-3 w-3" />
                <span>{financialYear}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Body: Sidebar + Main ──────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <Sidebar collapsible="icon" className="border-r border-gray-200">
            <SidebarHeader className="p-3">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0d7377, #1a5632)' }}>
                  <Flag className="h-5 w-5 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-bold text-teal-800 leading-tight">GP ERP</p>
                  <p className="text-[10px] text-muted-foreground">लेखा संहिता</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="px-2">
              {/* Dashboard - only when authenticated */}
              {user?.authenticated && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeView === 'dashboard'}
                        onClick={() => handleNavClick('dashboard')}
                        tooltip="डॅशबोर्ड"
                        className={activeView === 'dashboard' ? 'bg-teal-50 text-teal-800 font-semibold hover:bg-teal-100' : ''}
                      >
                        <LayoutDashboard className="h-4 w-4 text-teal-600" />
                        <span>डॅशबोर्ड</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              )}

              <SidebarSeparator />

              {user?.authenticated && user.user && (<>
              {/* मास्टर एंट्री (Master Entry) */}
              <SidebarGroup>
                <Collapsible open={expandedGroups.masters} onOpenChange={() => toggleGroup('masters')} className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-sidebar-accent rounded-md w-full">
                      <div className="flex items-center gap-2 w-full">
                        <Database className="h-4 w-4 text-purple-600" />
                        <span className="flex-1 text-left">मास्टर एंट्री</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {masterEntryItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={activeView === item.id}
                              onClick={() => handleNavClick(item.id)}
                              tooltip={item.label}
                              className={`text-xs h-7 ${activeView === item.id ? 'bg-purple-50 text-purple-800 font-medium' : ''}`}
                            >
                              <item.icon className={`h-3.5 w-3.5 ${activeView === item.id ? 'text-purple-600' : 'text-muted-foreground'}`} />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>

              <SidebarSeparator />

              {/* दैनंदिन व्यवहार (Daily Transactions) */}
              <SidebarGroup>
                <Collapsible open={expandedGroups.transactions} onOpenChange={() => toggleGroup('transactions')} className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-sidebar-accent rounded-md w-full">
                      <div className="flex items-center gap-2 w-full">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <span className="flex-1 text-left">दैनंदिन व्यवहार</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {dailyTransactionItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={activeView === item.id}
                              onClick={() => handleNavClick(item.id)}
                              tooltip={item.label}
                              className={`text-xs h-7 ${activeView === item.id ? 'bg-green-50 text-green-800 font-medium' : ''}`}
                            >
                              <item.icon className={`h-3.5 w-3.5 ${activeView === item.id ? (item.color || 'text-green-600') : 'text-muted-foreground'}`} />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>

              <SidebarSeparator />

              {/* ऑटो रजिस्टर (Auto Registers) */}
              <SidebarGroup>
                <Collapsible open={expandedGroups.registers} onOpenChange={() => toggleGroup('registers')} className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-sidebar-accent rounded-md w-full">
                      <div className="flex items-center gap-2 w-full">
                        <BookOpenCheck className="h-4 w-4 text-amber-600" />
                        <span className="flex-1 text-left">ऑटो रजिस्टर</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {autoRegisterItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={activeView === item.id}
                              onClick={() => handleNavClick(item.id)}
                              tooltip={item.label}
                              className={`text-xs h-7 ${activeView === item.id ? 'bg-amber-50 text-amber-800 font-medium' : ''}`}
                            >
                              <item.icon className={`h-3.5 w-3.5 ${activeView === item.id ? (item.color || 'text-amber-600') : 'text-muted-foreground'}`} />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>

              <SidebarSeparator />

              {/* नमुना अहवाल (Namuna Reports 1-33) */}
              <SidebarGroup>
                <Collapsible open={expandedGroups.namuna} onOpenChange={() => toggleGroup('namuna')} className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-sidebar-accent rounded-md w-full">
                      <div className="flex items-center gap-2 w-full">
                        <ClipboardList className="h-4 w-4 text-emerald-600" />
                        <span className="flex-1 text-left">नमुना अहवाल (१-३३)</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarMenu>
                      {namunaReportSubGroups.map((subGroup, sgIdx) => (
                        <SidebarMenuItem key={sgIdx}>
                          <div className="px-2 py-1.5">
                            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{subGroup.label}</p>
                          </div>
                          <SidebarMenuSub>
                            {subGroup.items.map((item) => (
                              <SidebarMenuSubItem key={item.id}>
                                <SidebarMenuSubButton
                                  isActive={activeView === item.id}
                                  onClick={() => handleNavClick(item.id)}
                                  className={activeView === item.id ? 'bg-emerald-50 text-emerald-800 font-medium' : ''}
                                >
                                  <item.icon className={`h-3.5 w-3.5 ${activeView === item.id ? (item.color || 'text-emerald-600') : 'text-muted-foreground'}`} />
                                  <span className="text-xs">{item.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>

              <SidebarSeparator />

              {/* Bottom nav: Search, Excel */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeView === 'search'}
                        onClick={() => handleNavClick('search')}
                        tooltip="शोधा"
                        className={activeView === 'search' ? 'bg-sky-50 text-sky-800 font-semibold' : ''}
                      >
                        <Search className="h-4 w-4 text-sky-600" />
                        <span>शोधा</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeView === 'excel'}
                        onClick={() => handleNavClick('excel')}
                        tooltip="आयात/निर्यात"
                        className={activeView === 'excel' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span>आयात/निर्यात</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              </>)}

              {/* Auth-related nav: Login/Logout/Logs - always visible */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {!user?.authenticated ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={activeView === 'login'}
                          onClick={() => handleNavClick('login')}
                          tooltip="लॉगिन करा"
                          className={activeView === 'login' ? 'bg-orange-50 text-orange-800 font-semibold' : ''}
                        >
                          <LogIn className="h-4 w-4 text-orange-600" />
                          <span>लॉगिन करा</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (<>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={activeView === 'logs'}
                          onClick={() => handleNavClick('logs')}
                          tooltip="लॉग"
                          className={activeView === 'logs' ? 'bg-slate-50 text-slate-800 font-semibold' : ''}
                        >
                          <Activity className="h-4 w-4 text-slate-600" />
                          <span>लॉग</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={handleLogout}
                          tooltip="लॉगआउट"
                          className="text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 text-red-600" />
                          <span>लॉगआउट</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3">
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(135deg, #f0faf5, #e8f8f0)' }}>
                  <p className="text-[10px] font-medium text-teal-700">महाराष्ट्र ग्रामपंचायत</p>
                  <p className="text-[9px] text-muted-foreground">लेखा संहिता २०११</p>
                </div>
              </div>
            </SidebarFooter>

            <SidebarRail />
          </Sidebar>

          {/* Main Content Area */}
          <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
            {/* Breadcrumb / Active View Indicator */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <LayoutDashboard className="h-4 w-4 text-teal-600" />
                <button onClick={() => handleNavClick('dashboard')} className="text-muted-foreground hover:text-teal-700 transition-colors">
                  डॅशबोर्ड
                </button>
                {activeView !== 'dashboard' && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-teal-800">{getActiveLabel()}</span>
                  </>
                )}
                <div className="ml-auto">
                  <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-600">
                    {financialYear}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
              {renderMainContent()}
            </div>

            {/* Footer */}
            <footer className="mt-auto shrink-0" style={{ background: 'linear-gradient(135deg, #0d7377, #1a5632)' }}>
              <div className="px-4 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-teal-100/70 gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    <span>ग्रामदर्पण ERP पोर्टल &copy; 2024</span>
                  </div>
                  <span className="text-xs">ग्रामदर्पण — महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११</span>
                </div>
              </div>
              {/* Indian flag tricolor at bottom */}
              <div className="flex h-1 w-full">
                <div className="flex-1" style={{ background: '#FF9933' }} />
                <div className="flex-1 bg-white" />
                <div className="flex-1" style={{ background: '#138808' }} />
              </div>
            </footer>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
