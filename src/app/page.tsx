'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, FileText, BookOpen, Receipt, BarChart3, Database, LogIn, Users, MapPin, Route, Droplets, Lightbulb, Shield, Activity, ClipboardList, Search, FileSpreadsheet, Clock, LogOut, CheckCircle2, ArrowRight, Landmark, IndianRupee, TrendingUp, TrendingDown, UserCog, Wrench } from 'lucide-react';
import MasterData from '@/components/master-data';
import Namuna8Component from '@/components/namuna8';
import Namuna9Component from '@/components/namuna9';
import Namuna9KaComponent from '@/components/namuna9ka';
import Namuna1Component from '@/components/namuna1';
import LoginForm from '@/components/login-form';
import AuthLogs from '@/components/auth-logs';
import GlobalSearch from '@/components/global-search';
import ExcelImportExport from '@/components/excel-import-export';

interface DashboardStats {
  totalProperties: number; totalTaxMasters: number; enabledTaxMasters: number;
  totalNamuna8: number; totalNamuna9: number; totalPayments: number;
  totalWards: number; totalOwners: number; totalRoads: number; totalEmployees: number;
  totalDemand: number; totalPaid: number; outstandingBalance: number;
}

interface SessionLog {
  id: string; loginAt: string; logoutAt: string | null; action: string;
  user: { username: string; name: string; nameMarathi: string; role: string; };
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ authenticated: boolean; user?: { name: string; nameMarathi: string; role: string }; loginAt?: string | null } | null>(null);
  const [recentLogs, setRecentLogs] = useState<SessionLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok && isMounted) setStats(await res.json());
      } catch { /* ignore */ }
    };
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) setUser(await res.json());
      } catch { /* ignore */ }
    };
    const loadLogs = async () => {
      try {
        const res = await fetch('/api/auth/logs?limit=5');
        if (res.ok) {
          const data = await res.json();
          setRecentLogs(data.sessions || []);
        }
      } catch { /* ignore */ }
    };
    loadData(); loadSession(); loadLogs();
    const interval = setInterval(() => { loadData(); loadLogs(); }, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const refreshStats = async () => {
    try { const res = await fetch('/api/dashboard'); if (res.ok) setStats(await res.json()); } catch { /* ignore */ }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try { return new Date(isoString).toLocaleString('mr-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return isoString; }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f0faf5 0%, #f8faf9 30%, #ffffff 100%)' }}>
      {/* Header with gradient */}
      <header className="sticky top-0 z-50 shadow-lg" style={{ background: 'linear-gradient(135deg, #0d7377 0%, #0a5c5f 50%, #094e51 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                <Landmark className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-white">ग्रामपंचायत मालमत्ता कर व्यवस्थापन</h1>
                <p className="text-xs text-teal-100/80">Gram Panchayat Property Tax Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.authenticated && user.user && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: user.user.role === 'gpo' ? '#27ae60' : '#e67e22' }}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{user.user.nameMarathi}</span>
                    <Badge className={`${user.user.role === 'gpo' ? 'bg-green-500' : 'bg-amber-500'} text-white text-xs border-0`}>
                      {user.user.role === 'gpo' ? 'GPO' : 'Operator'}
                    </Badge>
                  </div>
                  {user.loginAt && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-teal-100/70 bg-white/10 rounded-full px-2.5 py-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(user.loginAt)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 text-sm text-teal-100/70 bg-white/10 rounded-full px-3 py-1.5">
                <BarChart3 className="h-4 w-4" />
                <span>वित्तीय वर्ष 2024-25</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'dashboard') refreshStats(); }}>
          <TabsList className="flex flex-wrap w-full mb-6 h-auto gap-1 bg-white/80 backdrop-blur shadow-sm border p-1 rounded-xl">
            {[
              { value: 'dashboard', icon: BarChart3, label: 'डॅशबोर्ड', color: 'text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white' },
              { value: 'master-data', icon: Database, label: 'मास्टर डेटा', color: 'text-purple-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white' },
              { value: 'namuna1', icon: ClipboardList, label: 'नमुना १', color: 'text-cyan-700 data-[state=active]:bg-cyan-600 data-[state=active]:text-white' },
              { value: 'namuna8', icon: FileText, label: 'नमुना ८', color: 'text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white' },
              { value: 'namuna9', icon: BookOpen, label: 'नमुना ९', color: 'text-amber-700 data-[state=active]:bg-amber-600 data-[state=active]:text-white' },
              { value: 'namuna9ka', icon: Receipt, label: 'नमुना ९-क', color: 'text-rose-700 data-[state=active]:bg-rose-600 data-[state=active]:text-white' },
              { value: 'search', icon: Search, label: 'शोधा', color: 'text-sky-700 data-[state=active]:bg-sky-600 data-[state=active]:text-white' },
              { value: 'excel', icon: FileSpreadsheet, label: 'आयात/निर्यात', color: 'text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white' },
              { value: 'login', icon: LogIn, label: 'लॉगिन', color: 'text-orange-700 data-[state=active]:bg-orange-600 data-[state=active]:text-white' },
              { value: 'logs', icon: Activity, label: 'लॉग', color: 'text-slate-700 data-[state=active]:bg-slate-600 data-[state=active]:text-white' },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className={`flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm rounded-lg transition-all ${tab.color}`}>
                <tab.icon className="h-4 w-4" /><span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Current Login Status Banner */}
              {user?.authenticated && user.user && (
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }} />
                  <CardContent className="relative p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-md" style={{ background: user.user.role === 'gpo' ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{user.user.nameMarathi}</span>
                            <Badge className={`${user.user.role === 'gpo' ? 'bg-green-600' : 'bg-amber-500'} text-white border-0 shadow-sm`}>
                              {user.user.role === 'gpo' ? 'GPO - ग्रामपंचायत अधिकारी' : 'Operator - ऑपरेटर'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>लॉगिन वेळ: {formatTime(user.loginAt)}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-2" />
                            <span className="text-green-700 font-medium">सक्रिय सत्र</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('login')} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
                        <LogOut className="h-3.5 w-3.5" /> लॉगआउट
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards - colorful */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { icon: MapPin, label: 'वार्ड', value: stats?.totalWards || 0, bg: 'bg-teal-50', iconBg: 'bg-teal-500', iconColor: 'text-white', valueColor: 'text-teal-800' },
                  { icon: Users, label: 'मालक', value: stats?.totalOwners || 0, bg: 'bg-purple-50', iconBg: 'bg-purple-500', iconColor: 'text-white', valueColor: 'text-purple-800' },
                  { icon: Building2, label: 'मालमत्ता', value: stats?.totalProperties || 0, bg: 'bg-cyan-50', iconBg: 'bg-cyan-500', iconColor: 'text-white', valueColor: 'text-cyan-800' },
                  { icon: Route, label: 'रस्ते', value: stats?.totalRoads || 0, bg: 'bg-amber-50', iconBg: 'bg-amber-500', iconColor: 'text-white', valueColor: 'text-amber-800' },
                  { icon: Shield, label: 'सक्षम कर', value: stats?.enabledTaxMasters || 0, bg: 'bg-green-50', iconBg: 'bg-green-500', iconColor: 'text-white', valueColor: 'text-green-800' },
                  { icon: FileText, label: 'नमुना ८', value: stats?.totalNamuna8 || 0, bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', iconColor: 'text-white', valueColor: 'text-emerald-800' },
                  { icon: BookOpen, label: 'नमुना ९', value: stats?.totalNamuna9 || 0, bg: 'bg-orange-50', iconBg: 'bg-orange-500', iconColor: 'text-white', valueColor: 'text-orange-800' },
                  { icon: Receipt, label: 'पावत्या', value: stats?.totalPayments || 0, bg: 'bg-rose-50', iconBg: 'bg-rose-500', iconColor: 'text-white', valueColor: 'text-rose-800' },
                ].map((item, i) => (
                  <Card key={i} className="border-0 shadow-sm overflow-hidden">
                    <CardContent className={`p-3 text-center ${item.bg}`}>
                      <div className={`h-9 w-9 rounded-lg ${item.iconBg} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                        <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                      <div className={`text-2xl font-bold ${item.valueColor}`}>{item.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial Summary */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #e67e22, #27ae60)' }} />
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-teal-600" />
                    आर्थिक सारांश
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center p-5 rounded-xl border-2 border-teal-100" style={{ background: 'linear-gradient(135deg, #e0f5f5, #f0fafa)' }}>
                      <IndianRupee className="h-6 w-6 mx-auto mb-1 text-teal-600" />
                      <div className="text-sm text-muted-foreground mb-1">एकूण मागणी</div>
                      <div className="text-3xl font-bold text-teal-800">₹{(stats?.totalDemand || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-5 rounded-xl border-2 border-green-100" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
                      <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      <div className="text-sm text-muted-foreground mb-1">एकूण भरलेली रक्कम</div>
                      <div className="text-3xl font-bold text-green-700">₹{(stats?.totalPaid || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-5 rounded-xl border-2 border-rose-100" style={{ background: 'linear-gradient(135deg, #fdedec, #fff5f5)' }}>
                      <TrendingDown className="h-6 w-6 mx-auto mb-1 text-rose-600" />
                      <div className="text-sm text-muted-foreground mb-1">एकूण बक्की</div>
                      <div className="text-3xl font-bold text-rose-700">₹{(stats?.outstandingBalance || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>वसूल प्रमाण</span>
                      <span className="text-green-700">{stats?.totalDemand ? ((stats.totalPaid / stats.totalDemand) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div className="h-4 rounded-full transition-all" style={{ width: `${stats?.totalDemand ? Math.min((stats.totalPaid / stats.totalDemand) * 100, 100) : 0}%`, background: 'linear-gradient(90deg, #27ae60, #2ecc71)' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Login Activity */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="h-1 bg-orange-400" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-orange-600" />
                        </div>
                        अलीकडील लॉगिन क्रियाकलाप
                      </CardTitle>
                      <button onClick={() => setActiveTab('logs')} className="text-xs text-teal-600 hover:text-teal-800 font-medium">
                        सर्व लॉग पहा →
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentLogs.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">कोणतेही लॉग नाहीत. प्रथम लॉगिन करा.</div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>युजर</TableHead>
                              <TableHead>भूमिका</TableHead>
                              <TableHead>क्रिया</TableHead>
                              <TableHead>वेळ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-medium text-sm">{log.user.nameMarathi || log.user.name}</TableCell>
                                <TableCell>
                                  <Badge className={`text-xs border-0 ${log.user.role === 'gpo' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {log.user.role === 'gpo' ? 'GPO' : 'Op'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {log.action === 'login' ? (
                                    <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                      <LogIn className="h-3 w-3 mr-1" />लॉगिन
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-800 border-0 text-xs">
                                      <LogOut className="h-3 w-3 mr-1" />लॉगआउट
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatTime(log.loginAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #8e44ad, #9b59b6)' }} />
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-purple-600" />
                      </div>
                      द्रुत कार्य
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { icon: Database, label: 'मास्टर डेटा', tab: 'master-data', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200', iconBg: 'bg-purple-500', iconColor: 'text-white' },
                        { icon: ClipboardList, label: 'नमुना १', tab: 'namuna1', bg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200', iconBg: 'bg-cyan-500', iconColor: 'text-white' },
                        { icon: FileText, label: 'नमुना ८', tab: 'namuna8', bg: 'bg-green-50 hover:bg-green-100 border-green-200', iconBg: 'bg-green-500', iconColor: 'text-white' },
                        { icon: BookOpen, label: 'नमुना ९', tab: 'namuna9', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200', iconBg: 'bg-amber-500', iconColor: 'text-white' },
                        { icon: Receipt, label: 'पावती', tab: 'namuna9ka', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200', iconBg: 'bg-rose-500', iconColor: 'text-white' },
                        { icon: Search, label: 'शोधा', tab: 'search', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200', iconBg: 'bg-sky-500', iconColor: 'text-white' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setActiveTab(item.tab)} className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${item.bg}`}>
                          <div className={`h-10 w-10 rounded-lg ${item.iconBg} flex items-center justify-center shadow-sm`}>
                            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Process Flow */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #16a085, #27ae60, #e67e22)' }} />
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-teal-600" />
                    </div>
                    प्रक्रिया प्रवाह (Master → Auto Fill → नमुना)
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    {[
                      { icon: Database, label: 'मास्टर डेटा\n(एकदा भरा)', bg: 'bg-purple-100 border-purple-300', iconBg: 'bg-purple-500', text: 'text-purple-800' },
                      { icon: Building2, label: 'मालमत्ता\nमास्टर', bg: 'bg-cyan-100 border-cyan-300', iconBg: 'bg-cyan-500', text: 'text-cyan-800' },
                      { icon: ClipboardList, label: 'नमुना १\nनोंदणी', bg: 'bg-teal-100 border-teal-300', iconBg: 'bg-teal-500', text: 'text-teal-800' },
                      { icon: FileText, label: 'नमुना ८\nकर आकारणी', bg: 'bg-green-100 border-green-300', iconBg: 'bg-green-500', text: 'text-green-800' },
                      { icon: BookOpen, label: 'नमुना ९\nमागणी', bg: 'bg-amber-100 border-amber-300', iconBg: 'bg-amber-500', text: 'text-amber-800' },
                      { icon: Receipt, label: 'नमुना ९-क\nपावती', bg: 'bg-rose-100 border-rose-300', iconBg: 'bg-rose-500', text: 'text-rose-800' },
                    ].map((item, i, arr) => (
                      <React.Fragment key={i}>
                        <div className={`border-2 rounded-xl p-3 text-center ${item.bg}`}>
                          <div className={`h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center mx-auto mb-1.5`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className={`text-xs font-medium whitespace-pre-line ${item.text}`}>{item.label}</span>
                        </div>
                        {i < arr.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400" />}
                      </React.Fragment>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50/50">
                      <h4 className="font-bold mb-1 text-purple-800">Step 1: Master Data Entry</h4>
                      <div className="text-purple-700/70">ऑपरेटर/GPO एकदा मास्टर डेटा भरतील. वार्ड, मालक, मालमत्ता, कर दर, रेडीरेकनर सर्व एकदा भरा.</div>
                    </div>
                    <div className="border-2 border-teal-100 rounded-xl p-4 bg-teal-50/50">
                      <h4 className="font-bold mb-1 text-teal-800">Step 2: Auto Generation</h4>
                      <div className="text-teal-700/70">Property + Owner + Ward Master → नमुना १ ऑटो भरला जाईल. Tax + Ready Reckoner → नमुना ८, ९ ऑटो तयार.</div>
                    </div>
                    <div className="border-2 border-green-100 rounded-xl p-4 bg-green-50/50">
                      <h4 className="font-bold mb-1 text-green-800">Step 3: No Re-Entry</h4>
                      <div className="text-green-700/70">एकदा मास्टर डेटा भरल्यानंतर नमुना १ ते ३३ साठी पुन्हा माहिती टाकावी लागणार नाही.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Info */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #e67e22)' }} />
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-green-600" />
                    </div>
                    लॉगिन माहिती (दोन युजर)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-2 border-green-200 rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-9 w-9 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <Badge className="bg-green-600 text-white border-0 shadow-sm">GPO</Badge>
                        <span className="font-bold text-green-900">ग्रामपंचायत अधिकारी</span>
                      </div>
                      <div className="text-sm text-green-800 mt-2 bg-white/60 rounded-lg p-2">Username: <code className="bg-green-100 px-1.5 py-0.5 rounded font-bold">gpo</code> | Password: <code className="bg-green-100 px-1.5 py-0.5 rounded font-bold">gpo123</code></div>
                      <p className="text-xs text-green-700/70 mt-2">✅ सर्व मास्टर डेटा अपडेट, नमुना तयार, रिपोर्ट पाहणे</p>
                    </div>
                    <div className="border-2 border-amber-200 rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #fef3e8, #fef9e7)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <Badge className="bg-amber-500 text-white border-0 shadow-sm">Operator</Badge>
                        <span className="font-bold text-amber-900">ऑपरेटर</span>
                      </div>
                      <div className="text-sm text-amber-800 mt-2 bg-white/60 rounded-lg p-2">Username: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold">operator</code> | Password: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold">op123</code></div>
                      <p className="text-xs text-amber-700/70 mt-2">✅ मास्टर डेटा एंट्री, नमुना तयार, पावती बनवणे</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="master-data"><MasterData /></TabsContent>
          <TabsContent value="namuna1"><Namuna1Component /></TabsContent>
          <TabsContent value="namuna8"><Namuna8Component /></TabsContent>
          <TabsContent value="namuna9"><Namuna9Component /></TabsContent>
          <TabsContent value="namuna9ka"><Namuna9KaComponent /></TabsContent>
          <TabsContent value="search"><GlobalSearch /></TabsContent>
          <TabsContent value="excel"><ExcelImportExport /></TabsContent>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="logs"><AuthLogs /></TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto shadow-inner" style={{ background: 'linear-gradient(135deg, #0d7377, #094e51)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-teal-100/70 gap-2">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              <span>ग्रामपंचायत मालमत्ता कर व्यवस्थापन प्रणाली © 2024</span>
            </div>
            <span>Gram Panchayat Property Tax Management System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
