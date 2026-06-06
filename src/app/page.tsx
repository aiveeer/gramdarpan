'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, FileText, BookOpen, Receipt, BarChart3, Database, LogIn, Users, MapPin, Route, Droplets, Lightbulb, Shield, Activity, ClipboardList, Search, FileSpreadsheet, Clock, LogOut, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">ग्रामपंचायत मालमत्ता कर व्यवस्थापन</h1>
                <p className="text-xs text-muted-foreground">Gram Panchayat Property Tax Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.authenticated && user.user && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm font-medium">{user.user.nameMarathi}</span>
                    <Badge variant={user.user.role === 'gpo' ? 'default' : 'secondary'} className={user.user.role === 'gpo' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.user.role === 'gpo' ? 'GPO' : 'Operator'}
                    </Badge>
                  </div>
                  {user.loginAt && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>लॉगिन: {formatTime(user.loginAt)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
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
          <TabsList className="flex flex-wrap w-full mb-6 h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" /><span>डॅशबोर्ड</span>
            </TabsTrigger>
            <TabsTrigger value="master-data" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Database className="h-4 w-4" /><span>मास्टर डेटा</span>
            </TabsTrigger>
            <TabsTrigger value="namuna1" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4" /><span>नमुना १</span>
            </TabsTrigger>
            <TabsTrigger value="namuna8" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /><span>नमुना ८</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" /><span>नमुना ९</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9ka" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Receipt className="h-4 w-4" /><span>नमुना ९-क</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Search className="h-4 w-4" /><span>शोधा</span>
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <FileSpreadsheet className="h-4 w-4" /><span>आयात/निर्यात</span>
            </TabsTrigger>
            <TabsTrigger value="login" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <LogIn className="h-4 w-4" /><span>लॉगिन</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Activity className="h-4 w-4" /><span>लॉग</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Current Login Status Banner */}
              {user?.authenticated && user.user && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{user.user.nameMarathi}</span>
                            <Badge className={user.user.role === 'gpo' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}>
                              {user.user.role === 'gpo' ? 'GPO - ग्रामपंचायत अधिकारी' : 'Operator - ऑपरेटर'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>लॉगिन वेळ: {formatTime(user.loginAt)}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-2" />
                            <span className="text-green-700">सक्रिय सत्र</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('login')} className="text-sm text-muted-foreground hover:text-foreground underline">
                        लॉगआउट करा →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { icon: MapPin, label: 'वार्ड', value: stats?.totalWards || 0 },
                  { icon: Users, label: 'मालक', value: stats?.totalOwners || 0 },
                  { icon: Building2, label: 'मालमत्ता', value: stats?.totalProperties || 0 },
                  { icon: Route, label: 'रस्ते', value: stats?.totalRoads || 0 },
                  { icon: Shield, label: 'सक्षम कर', value: stats?.enabledTaxMasters || 0 },
                  { icon: FileText, label: 'नमुना ८', value: stats?.totalNamuna8 || 0 },
                  { icon: BookOpen, label: 'नमुना ९', value: stats?.totalNamuna9 || 0 },
                  { icon: Receipt, label: 'पावत्या', value: stats?.totalPayments || 0 },
                ].map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <item.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-xl font-bold">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial Summary */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">आर्थिक सारांश</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">एकूण मागणी</div>
                      <div className="text-3xl font-bold">₹{(stats?.totalDemand || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">एकूण भरलेली रक्कम</div>
                      <div className="text-3xl font-bold text-green-700">₹{(stats?.totalPaid || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">एकूण बक्की</div>
                      <div className="text-3xl font-bold text-red-700">₹{(stats?.outstandingBalance || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>वसूल</span>
                      <span>{stats?.totalDemand ? ((stats.totalPaid / stats.totalDemand) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-green-500 rounded-full h-3 transition-all" style={{ width: `${stats?.totalDemand ? Math.min((stats.totalPaid / stats.totalDemand) * 100, 100) : 0}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Login Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        अलीकडील लॉगिन क्रियाकलाप
                      </CardTitle>
                      <button onClick={() => setActiveTab('logs')} className="text-xs text-muted-foreground hover:text-foreground underline">
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
                            <TableRow>
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
                                  <Badge variant="outline" className={`text-xs ${log.user.role === 'gpo' ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'}`}>
                                    {log.user.role === 'gpo' ? 'GPO' : 'Op'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {log.action === 'login' ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      <LogIn className="h-3 w-3 mr-1" />लॉगिन
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
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
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">द्रुत कार्य</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { icon: Database, label: 'मास्टर डेटा', tab: 'master-data', color: 'text-blue-600' },
                        { icon: ClipboardList, label: 'नमुना १', tab: 'namuna1', color: 'text-purple-600' },
                        { icon: FileText, label: 'नमुना ८', tab: 'namuna8', color: 'text-green-600' },
                        { icon: BookOpen, label: 'नमुना ९', tab: 'namuna9', color: 'text-amber-600' },
                        { icon: Receipt, label: 'पावती', tab: 'namuna9ka', color: 'text-red-600' },
                        { icon: Search, label: 'शोधा', tab: 'search', color: 'text-cyan-600' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setActiveTab(item.tab)} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <item.icon className={`h-6 w-6 ${item.color}`} />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Process Flow */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">प्रक्रिया प्रवाह (Master → Auto Fill → नमुना)</h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                    {[
                      { icon: Database, label: 'मास्टर डेटा\n(एकदा भरा)' },
                      { icon: Building2, label: 'मालमत्ता\nमास्टर' },
                      { icon: ClipboardList, label: 'नमुना १\nनोंदणी', highlight: true },
                      { icon: FileText, label: 'नमुना ८\nकर आकारणी' },
                      { icon: BookOpen, label: 'नमुना ९\nमागणी' },
                      { icon: Receipt, label: 'नमुना ९-क\nपावती' },
                    ].map((item, i, arr) => (
                      <React.Fragment key={i}>
                        <div className={`border rounded-lg p-3 text-center ${item.highlight ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}`}>
                          <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.highlight ? 'text-primary' : ''}`} />
                          <span className={`text-xs whitespace-pre-line ${item.highlight ? 'font-semibold text-primary' : ''}`}>{item.label}</span>
                        </div>
                        {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 1: Master Data Entry (Manual)</h4>
                      <div className="text-muted-foreground">ऑपरेटर/GPO एकदा मास्टर डेटा भरतील. वार्ड, मालक, मालमत्ता, कर दर, रेडीरेकनर सर्व एकदा भरा.</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 2: Auto Generation</h4>
                      <div className="text-muted-foreground">Property Master + Owner Master + Ward Master → नमुना १ ऑटो भरला जाईल. Tax Master + Ready Reckoner → नमुना ८, ९ ऑटो तयार.</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 3: No Re-Entry Required</h4>
                      <div className="text-muted-foreground">एकदा मास्टर डेटा भरल्यानंतर नमुना १ ते ३३ साठी पुन्हा माहिती टाकावी लागणार नाही.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Info */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">लॉगिन माहिती (दोन युजर)</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600 text-white"><Shield className="h-3 w-3 mr-1" />GPO</Badge>
                        <span className="font-semibold">ग्रामपंचायत अधिकारी</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Username: <code className="bg-muted px-1 rounded">gpo</code> | Password: <code className="bg-muted px-1 rounded">gpo123</code></div>
                      <p className="text-xs text-muted-foreground mt-1">सर्व मास्टर डेटा अपडेट, नमुना तयार, रिपोर्ट पाहणे</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-500 text-white"><Shield className="h-3 w-3 mr-1" />Operator</Badge>
                        <span className="font-semibold">ऑपरेटर</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Username: <code className="bg-muted px-1 rounded">operator</code> | Password: <code className="bg-muted px-1 rounded">op123</code></div>
                      <p className="text-xs text-muted-foreground mt-1">मास्टर डेटा एंट्री, नमुना तयार, पावती बनवणे</p>
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
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-2">
            <span>ग्रामपंचायत मालमत्ता कर व्यवस्थापन प्रणाली © 2024</span>
            <span>Gram Panchayat Property Tax Management System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
