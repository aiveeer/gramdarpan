'use client';

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Database,
  Calculator,
  Receipt,
  ClipboardList,
  Warehouse,
  Landmark,
  Flag,
  BarChart3,
  LogOut,
  IndianRupee,
  Wallet,
  UserCog,
  Loader2,
} from 'lucide-react';

// Direct import for login (always needed first)
import LoginForm from '@/components/login-form';

// Lazy imports for other pages
const Dashboard = lazy(() => import('@/components/dashboard'));
const Masters = lazy(() => import('@/components/masters'));
const TaxManagement = lazy(() => import('@/components/tax-management'));
const Financial = lazy(() => import('@/components/financial'));
const BudgetWorks = lazy(() => import('@/components/budget-works'));
const Salary = lazy(() => import('@/components/salary'));
const Assets = lazy(() => import('@/components/assets'));
const BankAccounts = lazy(() => import('@/components/bank-accounts'));
const Schemes = lazy(() => import('@/components/schemes'));
const Reports = lazy(() => import('@/components/reports'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">लोड होत आहे...</p>
      </div>
    </div>
  );
}

interface SessionData {
  id: string;
  username: string;
  name: string;
  nameMarathi: string;
  role: string;
}

const menuItems = [
  { id: 'dashboard', label: 'डॅशबोर्ड', icon: LayoutDashboard, group: 'मुख्य' },
  { id: 'masters', label: 'मास्टर डेटा', icon: Database, group: 'मास्टर' },
  { id: 'tax', label: 'कर व्यवस्थापन', icon: Calculator, group: 'व्यवहार' },
  { id: 'financial', label: 'आर्थिक व्यवहार', icon: Receipt, group: 'व्यवहार' },
  { id: 'budget', label: 'बजेट व कामे', icon: ClipboardList, group: 'व्यवहार' },
  { id: 'salary', label: 'पगार', icon: Wallet, group: 'व्यवहार' },
  { id: 'assets', label: 'मालमत्ता', icon: Warehouse, group: 'संपत्ती' },
  { id: 'bank', label: 'बँक खाते', icon: Landmark, group: 'संपत्ती' },
  { id: 'schemes', label: 'योजना', icon: Flag, group: 'संपत्ती' },
  { id: 'reports', label: 'अहवाल', icon: BarChart3, group: 'अहवाल' },
];

const financialYears = ['2024-25', '2025-26', '2026-27', '2023-24'];

export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setSession(data.user);
        }
      }
    } catch {
      // Silently handle - user is not authenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = (userData: SessionData) => {
    setSession(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setSession(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const props = { financialYear };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'masters': return <Masters {...props} />;
      case 'tax': return <TaxManagement {...props} />;
      case 'financial': return <Financial {...props} />;
      case 'budget': return <BudgetWorks {...props} />;
      case 'salary': return <Salary {...props} />;
      case 'assets': return <Assets {...props} />;
      case 'bank': return <BankAccounts {...props} />;
      case 'schemes': return <Schemes {...props} />;
      case 'reports': return <Reports {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  // Group menu items
  const groups = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <SidebarProvider>
      <TooltipProvider>
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-b from-gp-teal-dark to-sidebar">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gp-saffron text-white font-bold text-lg shadow-md">
                ग्रा
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground">ग्रामदर्पण</span>
                <span className="text-xs text-sidebar-foreground/70">ग्रामपंचायत ERP</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {Object.entries(groups).map(([groupName, items]) => (
              <SidebarGroup key={groupName}>
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  {groupName}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeTab === item.id}
                          onClick={() => setActiveTab(item.id)}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border bg-gradient-to-t from-gp-teal-dark to-sidebar">
            <div className="px-2 py-2 space-y-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/80">
                <UserCog className="h-4 w-4 text-gp-saffron" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-sidebar-foreground truncate">
                    {session.nameMarathi || session.name}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/50">
                    {session.role === 'gpo' ? 'अधिकारी' : 'ऑपरेटर'}
                  </span>
                </div>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} tooltip="लॉगआउट">
                    <LogOut className="h-4 w-4" />
                    <span>लॉगआउट</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-gradient-to-r from-gp-teal-light via-background to-gp-teal-light px-4 lg:px-6 sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">आर्थिक वर्ष:</span>
            </div>
            <Select value={financialYear} onValueChange={setFinancialYear}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map((fy) => (
                  <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {menuItems.find(m => m.id === activeTab)?.label || 'डॅशबोर्ड'}
              </span>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
