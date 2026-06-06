'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, Settings, FileText, BookOpen, Receipt, BarChart3 } from 'lucide-react';
import TaxMasterComponent from '@/components/tax-master';
import PropertyMasterComponent from '@/components/property-master';
import Namuna8Component from '@/components/namuna8';
import Namuna9Component from '@/components/namuna9';
import Namuna9KaComponent from '@/components/namuna9ka';

interface DashboardStats {
  totalProperties: number;
  totalTaxMasters: number;
  enabledTaxMasters: number;
  totalNamuna8: number;
  totalNamuna9: number;
  totalPayments: number;
  totalDemand: number;
  totalPaid: number;
  outstandingBalance: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok && isMounted) {
          setStats(await res.json());
        }
      } catch {
        // ignore
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // ignore
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'dashboard') {
      refreshStats();
    }
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
                <h1 className="text-lg font-bold leading-tight">मालमत्ता कर व्यवस्थापन</h1>
                <p className="text-xs text-muted-foreground">Property Tax Management System</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>वित्तीय वर्ष 2024-25</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>डॅशबोर्ड</span>
            </TabsTrigger>
            <TabsTrigger value="tax-master" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4" />
              <span>कर मास्टर</span>
            </TabsTrigger>
            <TabsTrigger value="property-master" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Building2 className="h-4 w-4" />
              <span>मालमत्ता</span>
            </TabsTrigger>
            <TabsTrigger value="namuna8" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span>नमुना ८</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span>नमुना ९</span>
            </TabsTrigger>
            <TabsTrigger value="namuna9ka" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Receipt className="h-4 w-4" />
              <span>नमुना ९-क</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
                    <div className="text-xs text-muted-foreground">एकूण मालमत्ता</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Settings className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats?.enabledTaxMasters || 0}</div>
                    <div className="text-xs text-muted-foreground">सक्षम कर</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats?.totalNamuna8 || 0}</div>
                    <div className="text-xs text-muted-foreground">नमुना ८</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats?.totalNamuna9 || 0}</div>
                    <div className="text-xs text-muted-foreground">नमुना ९</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Receipt className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
                    <div className="text-xs text-muted-foreground">पावत्या</div>
                  </CardContent>
                </Card>
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
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>वसूल</span>
                      <span>{stats?.totalDemand ? ((stats.totalPaid / stats.totalDemand) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-green-500 rounded-full h-3 transition-all"
                        style={{ width: `${stats?.totalDemand ? Math.min((stats.totalPaid / stats.totalDemand) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">द्रुत कार्य</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                      onClick={() => setActiveTab('tax-master')}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Settings className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">कर मास्टर</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('property-master')}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">नवीन मालमत्ता</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('namuna8')}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">नमुना ८</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('namuna9')}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">नमुना ९</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('namuna9ka')}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">पावती</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Flow Diagram */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">प्रक्रिया प्रवाह</h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <Settings className="h-5 w-5 mx-auto mb-1" />
                      <span>कर मास्टर</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <Building2 className="h-5 w-5 mx-auto mb-1" />
                      <span>मालमत्ता मास्टर</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <FileText className="h-5 w-5 mx-auto mb-1" />
                      <span>नमुना ८<br/><small>कर आकारणी</small></span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <BookOpen className="h-5 w-5 mx-auto mb-1" />
                      <span>नमुना ९<br/><small>मागणी नोंदवही</small></span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <Receipt className="h-5 w-5 mx-auto mb-1" />
                      <span>नमुना ९-क<br/><small>पावती</small></span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">नमुना ८ सूत्र</h4>
                      <div className="text-muted-foreground">
                        क्षेत्रफळ × कर दर = कर रक्कम<br/>
                        सर्व करांची बेरीज = एकूण कर
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">नमुना ९ सूत्र</h4>
                      <div className="text-muted-foreground">
                        चालू वर्ष कर + मागील थकबाकी + दंड = एकूण मागणी
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-1">नमुना ९-क</h4>
                      <div className="text-muted-foreground">
                        मागणी - भरलेली रक्कम = शिल्लक<br/>
                        (Partial Payment Supported)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tax-master">
            <TaxMasterComponent />
          </TabsContent>

          <TabsContent value="property-master">
            <PropertyMasterComponent />
          </TabsContent>

          <TabsContent value="namuna8">
            <Namuna8Component />
          </TabsContent>

          <TabsContent value="namuna9">
            <Namuna9Component />
          </TabsContent>

          <TabsContent value="namuna9ka">
            <Namuna9KaComponent />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-2">
            <span>मालमत्ता कर व्यवस्थापन प्रणाली © 2024</span>
            <span>Property Tax Management System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
