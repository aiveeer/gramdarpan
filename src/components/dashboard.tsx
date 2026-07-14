'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, IndianRupee, TrendingUp, TrendingDown,
  Wallet, Landmark, TreePine, Package, BarChart3, ClipboardList,
  UserCog, MapPin, Receipt, ArrowUpRight, ArrowDownRight, Calculator, Flag,
} from 'lucide-react';

interface DashboardProps {
  financialYear: string;
}

interface Stats {
  totalProperties: number;
  totalWards: number;
  totalOwners: number;
  totalRoads: number;
  totalEmployees: number;
  totalTaxAssessments: number;
  totalDemandRegisters: number;
  totalTaxPayments: number;
  totalReceipts: number;
  totalPayments: number;
  totalAssets: number;
  totalStock: number;
  totalBanks: number;
  totalSchemes: number;
  totalBudgetHeads: number;
  totalDemand: number;
  totalPaid: number;
  outstandingBalance: number;
  totalReceiptAmount: number;
  totalPaymentAmount: number;
  totalAssetPurchaseValue: number;
  totalAssetCurrentValue: number;
  totalStockValue: number;
  totalBankBalance: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('mr-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard({ financialYear }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [financialYear]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const data = json.data || json;
      setStats(data);
    } catch (err) {
      setError('डॅशबोर्ड डेटा लोड करता आला नाही');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button onClick={fetchStats} className="mt-2 text-sm text-primary underline">
            पुन्हा प्रयत्न करा
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const collectionRate = stats.totalDemand > 0
    ? Math.round((stats.totalPaid / stats.totalDemand) * 100)
    : 0;

  const metricCards = [
    {
      title: 'एकूण मालमत्ता',
      value: stats.totalProperties.toString(),
      icon: Building2,
      color: 'text-gp-teal',
      bg: 'bg-gp-teal-light',
      border: 'border-l-gp-teal',
      iconBg: 'bg-gp-teal',
      iconColor: 'text-white',
    },
    {
      title: 'कर मागणी',
      value: formatCurrency(stats.totalDemand),
      icon: TrendingUp,
      color: 'text-gp-saffron',
      bg: 'bg-gp-saffron-light',
      border: 'border-l-gp-saffron',
      iconBg: 'bg-gp-saffron',
      iconColor: 'text-white',
    },
    {
      title: 'कर वसूल',
      value: formatCurrency(stats.totalPaid),
      icon: TrendingDown,
      color: 'text-gp-green',
      bg: 'bg-gp-green-light',
      border: 'border-l-gp-green',
      iconBg: 'bg-gp-green',
      iconColor: 'text-white',
    },
    {
      title: 'बकायपोरी',
      value: formatCurrency(stats.outstandingBalance),
      icon: IndianRupee,
      color: 'text-gp-red',
      bg: 'bg-gp-red-light',
      border: 'border-l-gp-red',
      iconBg: 'bg-gp-red',
      iconColor: 'text-white',
    },
    {
      title: 'वसूल दर',
      value: `${collectionRate}%`,
      icon: BarChart3,
      color: collectionRate > 70 ? 'text-gp-green' : collectionRate > 40 ? 'text-gp-saffron' : 'text-gp-red',
      bg: collectionRate > 70 ? 'bg-gp-green-light' : collectionRate > 40 ? 'bg-gp-saffron-light' : 'bg-gp-red-light',
      border: collectionRate > 70 ? 'border-l-gp-green' : collectionRate > 40 ? 'border-l-gp-saffron' : 'border-l-gp-red',
      iconBg: collectionRate > 70 ? 'bg-gp-green' : collectionRate > 40 ? 'bg-gp-saffron' : 'bg-gp-red',
      iconColor: 'text-white',
    },
    {
      title: 'प्राप्ती',
      value: formatCurrency(stats.totalReceiptAmount),
      icon: ArrowUpRight,
      color: 'text-gp-cyan',
      bg: 'bg-gp-cyan-light',
      border: 'border-l-gp-cyan',
      iconBg: 'bg-gp-cyan',
      iconColor: 'text-white',
    },
    {
      title: 'पावती',
      value: formatCurrency(stats.totalPaymentAmount),
      icon: ArrowDownRight,
      color: 'text-gp-purple',
      bg: 'bg-gp-purple-light',
      border: 'border-l-gp-purple',
      iconBg: 'bg-gp-purple',
      iconColor: 'text-white',
    },
    {
      title: 'बँक शिल्लक',
      value: formatCurrency(stats.totalBankBalance),
      icon: Landmark,
      color: 'text-gp-blue',
      bg: 'bg-gp-blue-light',
      border: 'border-l-gp-blue',
      iconBg: 'bg-gp-blue',
      iconColor: 'text-white',
    },
  ];

  const infoCards = [
    { title: 'वार्ड', value: stats.totalWards, icon: MapPin, color: 'text-gp-teal', bg: 'bg-gp-teal-light' },
    { title: 'मालक', value: stats.totalOwners, icon: Users, color: 'text-gp-saffron', bg: 'bg-gp-saffron-light' },
    { title: 'रस्ते', value: stats.totalRoads, icon: ClipboardList, color: 'text-gp-green', bg: 'bg-gp-green-light' },
    { title: 'कर्मचारी', value: stats.totalEmployees, icon: UserCog, color: 'text-gp-red', bg: 'bg-gp-red-light' },
    { title: 'कर आकारणी', value: stats.totalTaxAssessments, icon: Calculator, color: 'text-gp-purple', bg: 'bg-gp-purple-light' },
    { title: 'मागणी नोंद', value: stats.totalDemandRegisters, icon: Receipt, color: 'text-gp-cyan', bg: 'bg-gp-cyan-light' },
    { title: 'संपत्ती', value: stats.totalAssets, icon: Package, color: 'text-gp-amber', bg: 'bg-gp-amber-light' },
    { title: 'योजना', value: stats.totalSchemes, icon: Flag, color: 'text-gp-indigo', bg: 'bg-gp-indigo-light' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3">आर्थिक आढावा</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <Card key={card.title} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${card.border} ${card.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">माहिती सारांश</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {infoCards.map((card) => (
            <Card key={card.title} className={`hover:shadow-lg transition-all duration-200 ${card.bg}`}>
              <CardContent className="p-3 text-center">
                <div className={`h-8 w-8 rounded-lg ${card.bg} mx-auto mb-1.5 flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground">{card.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">मालमत्ता मूल्य</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">खरेदी मूल्य</span>
                <span className="font-medium">{formatCurrency(stats.totalAssetPurchaseValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">सध्याचे मूल्य</span>
                <span className="font-medium">{formatCurrency(stats.totalAssetCurrentValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">साठा मूल्य</span>
                <span className="font-medium">{formatCurrency(stats.totalStockValue)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm font-medium">एकूण मूल्य</span>
                <Badge variant="secondary" className="text-sm">
                  {formatCurrency(stats.totalAssetCurrentValue + stats.totalStockValue)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">कर वसूल सारांश</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">एकूण मागणी</span>
                <span className="font-medium">{formatCurrency(stats.totalDemand)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">एकूण वसूल</span>
                <span className="font-medium text-gp-green">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">बकायपोरी</span>
                <span className="font-medium text-gp-red">{formatCurrency(stats.outstandingBalance)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">वसूल टक्केवारी</span>
                  <span className="text-sm font-bold">{collectionRate}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      collectionRate > 70 ? 'bg-gp-green' : collectionRate > 40 ? 'bg-gp-saffron' : 'bg-gp-red'
                    }`}
                    style={{ width: `${Math.min(collectionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
