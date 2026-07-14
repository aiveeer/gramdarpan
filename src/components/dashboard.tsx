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
      gradient: 'from-teal-500 to-teal-700',
      iconBg: 'bg-white/25',
    },
    {
      title: 'कर मागणी',
      value: formatCurrency(stats.totalDemand),
      icon: TrendingUp,
      gradient: 'from-orange-400 to-orange-600',
      iconBg: 'bg-white/25',
    },
    {
      title: 'कर वसूल',
      value: formatCurrency(stats.totalPaid),
      icon: TrendingDown,
      gradient: 'from-emerald-400 to-emerald-600',
      iconBg: 'bg-white/25',
    },
    {
      title: 'बकायपोरी',
      value: formatCurrency(stats.outstandingBalance),
      icon: IndianRupee,
      gradient: 'from-red-400 to-red-600',
      iconBg: 'bg-white/25',
    },
    {
      title: 'वसूल दर',
      value: `${collectionRate}%`,
      icon: BarChart3,
      gradient: collectionRate > 70 ? 'from-emerald-400 to-emerald-600' : collectionRate > 40 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600',
      iconBg: 'bg-white/25',
    },
    {
      title: 'प्राप्ती',
      value: formatCurrency(stats.totalReceiptAmount),
      icon: ArrowUpRight,
      gradient: 'from-cyan-400 to-cyan-600',
      iconBg: 'bg-white/25',
    },
    {
      title: 'पावती',
      value: formatCurrency(stats.totalPaymentAmount),
      icon: ArrowDownRight,
      gradient: 'from-purple-500 to-purple-700',
      iconBg: 'bg-white/25',
    },
    {
      title: 'बँक शिल्लक',
      value: formatCurrency(stats.totalBankBalance),
      icon: Landmark,
      gradient: 'from-blue-500 to-blue-700',
      iconBg: 'bg-white/25',
    },
  ];

  const infoCards = [
    { title: 'वार्ड', value: stats.totalWards, icon: MapPin, gradient: 'from-teal-400 to-teal-500' },
    { title: 'मालक', value: stats.totalOwners, icon: Users, gradient: 'from-orange-400 to-orange-500' },
    { title: 'रस्ते', value: stats.totalRoads, icon: ClipboardList, gradient: 'from-emerald-400 to-emerald-500' },
    { title: 'कर्मचारी', value: stats.totalEmployees, icon: UserCog, gradient: 'from-red-400 to-red-500' },
    { title: 'कर आकारणी', value: stats.totalTaxAssessments, icon: Calculator, gradient: 'from-purple-400 to-purple-500' },
    { title: 'मागणी नोंद', value: stats.totalDemandRegisters, icon: Receipt, gradient: 'from-cyan-400 to-cyan-500' },
    { title: 'संपत्ती', value: stats.totalAssets, icon: Package, gradient: 'from-amber-400 to-amber-500' },
    { title: 'योजना', value: stats.totalSchemes, icon: Flag, gradient: 'from-indigo-400 to-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-saffron to-gp-green" />
          आर्थिक आढावा
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-green to-gp-teal" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-4 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-white/80">{card.title}</p>
                  <p className="text-xl font-bold drop-shadow-sm">{card.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.iconBg} backdrop-blur-sm flex items-center justify-center`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-purple to-gp-cyan" />
          माहिती सारांश
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-cyan to-gp-amber" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white text-center shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200`}
            >
              <card.icon className="h-5 w-5 mx-auto mb-1 text-white/90" />
              <p className="text-lg font-bold drop-shadow-sm">{card.value}</p>
              <p className="text-[10px] text-white/75 font-medium">{card.title}</p>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-gp-teal overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-transparent">
            <CardTitle className="text-sm font-bold text-gp-teal-dark">मालमत्ता मूल्य</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">खरेदी मूल्य</span>
                <span className="font-semibold">{formatCurrency(stats.totalAssetPurchaseValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">सध्याचे मूल्य</span>
                <span className="font-semibold">{formatCurrency(stats.totalAssetCurrentValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">साठा मूल्य</span>
                <span className="font-semibold">{formatCurrency(stats.totalStockValue)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm font-bold">एकूण मूल्य</span>
                <Badge className="bg-gp-teal text-white hover:bg-gp-teal-dark text-sm">
                  {formatCurrency(stats.totalAssetCurrentValue + stats.totalStockValue)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gp-saffron overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-transparent">
            <CardTitle className="text-sm font-bold text-gp-saffron">कर वसूल सारांश</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">एकूण मागणी</span>
                <span className="font-semibold">{formatCurrency(stats.totalDemand)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">एकूण वसूल</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">बकायपोरी</span>
                <span className="font-bold text-red-600">{formatCurrency(stats.outstandingBalance)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold">वसूल टक्केवारी</span>
                  <span className="text-sm font-black">{collectionRate}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      collectionRate > 70
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : collectionRate > 40
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
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
