'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, FileText, BookOpen, Receipt, BarChart3, Database, LogIn, Users, MapPin, Route, Droplets, Lightbulb, UserCheck, Shield, Activity } from 'lucide-react';
import MasterData from '@/components/master-data';
import Namuna8Component from '@/components/namuna8';
import Namuna9Component from '@/components/namuna9';
import Namuna9KaComponent from '@/components/namuna9ka';
import LoginForm from '@/components/login-form';
import AuthLogs from '@/components/auth-logs';

interface DashboardStats {
  totalProperties: number; totalTaxMasters: number; enabledTaxMasters: number;
  totalNamuna8: number; totalNamuna9: number; totalPayments: number;
  totalWards: number; totalOwners: number; totalRoads: number; totalEmployees: number;
  totalDemand: number; totalPaid: number; outstandingBalance: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ authenticated: boolean; user?: { name: string; nameMarathi: string; role: string } } | null>(null);

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
    loadData(); loadSession();
    const interval = setInterval(loadData, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const refreshStats = async () => {
    try { const res = await fetch('/api/dashboard'); if (res.ok) setStats(await res.json()); } catch { /* ignore */ }
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
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm">{user.user.nameMarathi}</span>
                  <Badge variant={user.user.role === 'gpo' ? 'default' : 'secondary'}>
                    {user.user.role === 'gpo' ? 'GPO' : 'Operator'}
                  </Badge>
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
            <TabsTrigger value="namuna8" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /><span>नमुना ८</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" /><span>नमुना ९</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9ka" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Receipt className="h-4 w-4" /><span>नमुना ९-क</span>
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

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">द्रुत कार्य</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { icon: Database, label: 'मास्टर डेटा', tab: 'master-data' },
                      { icon: FileText, label: 'नमुना ८', tab: 'namuna8' },
                      { icon: BookOpen, label: 'नमुना ९', tab: 'namuna9' },
                      { icon: Receipt, label: 'पावती', tab: 'namuna9ka' },
                      { icon: LogIn, label: 'लॉगिन', tab: 'login' },
                      { icon: Activity, label: 'लॉग', tab: 'logs' },
                    ].map((item, i) => (
                      <button key={i} onClick={() => setActiveTab(item.tab)} className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <item.icon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Process Flow */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">प्रक्रिया प्रवाह (Master → Auto Fill → नमुना)</h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                    {[
                      { icon: Database, label: 'मास्टर डेटा\n(एकदा भरा)' },
                      { icon: MapPin, label: 'वार्ड/मालक\n/रस्ते/कर' },
                      { icon: Building2, label: 'मालमत्ता\nमास्टर' },
                      { icon: FileText, label: 'नमुना ८\nकर आकारणी' },
                      { icon: BookOpen, label: 'नमुना ९\nमागणी' },
                      { icon: Receipt, label: 'नमुना ९-क\nपावती' },
                    ].map((item, i, arr) => (
                      <React.Fragment key={i}>
                        <div className="border rounded-lg p-3 bg-muted/30 text-center">
                          <item.icon className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs whitespace-pre-line">{item.label}</span>
                        </div>
                        {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 1: Master Data Entry</h4>
                      <div className="text-muted-foreground">ऑपरेटर/GPO एकदा मास्टर डेटा भरतील. नंतर नमुना फॉर्ममध्ये पुन्हा माहिती टाकावी लागणार नाही.</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 2: Auto Generation</h4>
                      <div className="text-muted-foreground">Property Master + Tax Master + Ready Reckoner → नमुना ८, ९ ऑटो तयार</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">Step 3: Receipt</h4>
                      <div className="text-muted-foreground">मागणी - भरलेली रक्कम = शिल्लक. Partial Payment Supported.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Info */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">लॉगिन माहिती</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2"><Badge className="bg-green-600">GPO</Badge><span className="font-semibold">ग्रामपंचायत अधिकारी</span></div>
                      <div className="text-sm text-muted-foreground">Username: <code className="bg-muted px-1 rounded">gpo</code> | Password: <code className="bg-muted px-1 rounded">gpo123</code></div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2"><Badge variant="secondary">Operator</Badge><span className="font-semibold">ऑपरेटर</span></div>
                      <div className="text-sm text-muted-foreground">Username: <code className="bg-muted px-1 rounded">operator</code> | Password: <code className="bg-muted px-1 rounded">op123</code></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="master-data"><MasterData /></TabsContent>
          <TabsContent value="namuna8"><Namuna8Component /></TabsContent>
          <TabsContent value="namuna9"><Namuna9Component /></TabsContent>
          <TabsContent value="namuna9ka"><Namuna9KaComponent /></TabsContent>
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
