'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  Building2, Package, Map, Route, TreePine,
} from 'lucide-react';

// ===== TYPES =====

interface AssetsProps {
  financialYear: string;
}

interface AssetRecord {
  id: string;
  assetName: string;
  assetNameMr?: string;
  assetType?: string;
  assetNumber?: string;
  category?: string;
  purchaseDate?: string;
  purchaseCost: number;
  currentValue: number;
  depreciation: number;
  location?: string;
  condition?: string;
  status: string;
  serialNo?: string;
  financialYear: string;
  [key: string]: unknown;
}

interface StockRecord {
  id: string;
  itemName: string;
  itemNameMr?: string;
  category?: string;
  unit?: string;
  quantity: number;
  ratePerUnit?: number;
  totalValue: number;
  minStock?: number;
  maxStock?: number;
  supplier?: string;
  status: string;
  financialYear: string;
  [key: string]: unknown;
}

interface LandRecord {
  id: string;
  landName: string;
  landNameMr?: string;
  surveyNo?: string;
  areaAcres?: number;
  areaHectares?: number;
  areaGunthe?: number;
  landType?: string;
  ownershipType?: string;
  usageType?: string;
  mapNo?: string;
  gatNo?: string;
  financialYear: string;
  [key: string]: unknown;
}

interface RoadRecord {
  id: string;
  roadName: string;
  roadNameMr?: string;
  roadType?: string;
  roadLength?: number;
  roadWidth?: number;
  surfaceType?: string;
  constructionYear?: string;
  estimatedCost?: number;
  condition?: string;
  financialYear: string;
  [key: string]: unknown;
}

interface TreeRecord {
  id: string;
  treeType: string;
  treeTypeMr?: string;
  location?: string;
  plantDate?: string;
  height?: number;
  girth?: number;
  canopyDiameter?: number;
  condition?: string;
  estimatedValue?: number;
  isProtected: boolean;
  financialYear: string;
  [key: string]: unknown;
}

// ===== HELPERS =====

function safeExtract(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.records)) return obj.records;
  }
  return [];
}

const conditionLabels: Record<string, string> = {
  good: 'चांगली',
  fair: 'सरासरी',
  poor: 'खराब',
  damaged: 'खराब झालेली',
};

// ===== COMPONENT =====

export default function Assets({ financialYear }: AssetsProps) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [roads, setRoads] = useState<RoadRecord[]>([]);
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'asset' | 'stock' | 'land' | 'road' | 'tree'>('asset');
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, sRes, lRes, rRes, tRes] = await Promise.all([
        fetch(`/api/assets?financialYear=${financialYear}`),
        fetch(`/api/assets?type=stock&financialYear=${financialYear}`),
        fetch(`/api/assets?type=land&financialYear=${financialYear}`),
        fetch(`/api/assets?type=road&financialYear=${financialYear}`),
        fetch(`/api/assets?type=tree&financialYear=${financialYear}`),
      ]);
      const [aData, sData, lData, rData, tData] = await Promise.all([aRes.json(), sRes.json(), lRes.json(), rRes.json(), tRes.json()]);
      setAssets(safeExtract(aData) as AssetRecord[]);
      setStocks(safeExtract(sData) as StockRecord[]);
      setLands(safeExtract(lData) as LandRecord[]);
      setRoads(safeExtract(rData) as RoadRecord[]);
      setTrees(safeExtract(tData) as TreeRecord[]);
    } catch {
      setError('डेटा लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDialog = (type: typeof dialogType, record?: Record<string, unknown>) => {
    setDialogType(type);
    if (record) {
      setEditing(record);
      setForm({ ...record });
    } else {
      setEditing(null);
      const base: Record<string, unknown> = { financialYear };
      switch (type) {
        case 'asset': Object.assign(base, { purchaseCost: 0, currentValue: 0, depreciation: 0, status: 'active' }); break;
        case 'stock': Object.assign(base, { quantity: 0, ratePerUnit: 0, totalValue: 0, minStock: 0, maxStock: 0, status: 'In Stock' }); break;
        case 'land': Object.assign(base, { areaAcres: 0, areaHectares: 0, areaGunthe: 0 }); break;
        case 'road': Object.assign(base, { roadLength: 0, roadWidth: 0, estimatedCost: 0 }); break;
        case 'tree': Object.assign(base, { height: 0, girth: 0, canopyDiameter: 0, estimatedValue: 0, isProtected: false }); break;
      }
      setForm(base);
    }
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const typeParam = dialogType === 'asset' ? '' : `type=${dialogType}&`;
      const url = `/api/assets?${typeParam}financialYear=${financialYear}`;
      const payload = { action: editing ? 'update' : 'create', ...(editing ? { id: editing.id } : {}), ...form, financialYear };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast({ title: 'त्रुटी', description: json.error || 'जतन करताना त्रुटी', variant: 'destructive' });
        return;
      }
      toast({ title: editing ? 'अपडेट झाले' : 'जोडले' });
      setDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: 'जतन करताना त्रुटी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (type: typeof dialogType, id: string) => {
    if (!confirm('ही नोंद हटवायची?')) return;
    try {
      const typeParam = type === 'asset' ? '' : `type=${type}&`;
      await fetch(`/api/assets?${typeParam}financialYear=${financialYear}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      toast({ title: 'हटवले' });
      fetchData();
    } catch {
      toast({ title: 'हटवताना त्रुटी', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />पुन्हा प्रयत्न करा</Button>
        </CardContent>
      </Card>
    );
  }

  const renderDialogFields = () => {
    switch (dialogType) {
      case 'asset':
        return (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">नाव *</Label><Input value={(form.assetName as string) || ''} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} /></div>
              <div><Label className="text-xs">मराठीत</Label><Input value={(form.assetNameMr as string) || ''} onChange={e => setForm(f => ({ ...f, assetNameMr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">प्रकार</Label><Input value={(form.assetType as string) || ''} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} /></div>
              <div><Label className="text-xs">क्रमांक</Label><Input value={(form.assetNumber as string) || ''} onChange={e => setForm(f => ({ ...f, assetNumber: e.target.value }))} /></div>
              <div><Label className="text-xs">वर्ग</Label><Input value={(form.category as string) || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">खरेदी दिनांक</Label><Input type="date" value={(form.purchaseDate as string) || ''} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} /></div>
              <div><Label className="text-xs">अनुक्रमांक</Label><Input value={(form.serialNo as string) || ''} onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">खरेदी किंमत</Label><Input type="number" value={(form.purchaseCost as number) || 0} onChange={e => setForm(f => ({ ...f, purchaseCost: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">सध्याचे मूल्य</Label><Input type="number" value={(form.currentValue as number) || 0} onChange={e => setForm(f => ({ ...f, currentValue: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">घसारा</Label><Input type="number" value={(form.depreciation as number) || 0} onChange={e => setForm(f => ({ ...f, depreciation: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">स्थान</Label><Input value={(form.location as string) || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">स्थिती</Label>
                <Select value={(form.condition as string) || 'good'} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">चांगली</SelectItem>
                    <SelectItem value="fair">सरासरी</SelectItem>
                    <SelectItem value="poor">खराब</SelectItem>
                    <SelectItem value="damaged">खराब झालेली</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">स्थिती</Label>
                <Select value={(form.status as string) || 'active'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">सक्रिय</SelectItem>
                    <SelectItem value="disposed">विल्हेवाट</SelectItem>
                    <SelectItem value="under_repair">दुरुस्तीत</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'stock':
        return (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">वस्तूचे नाव *</Label><Input value={(form.itemName as string) || ''} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} /></div>
              <div><Label className="text-xs">मराठीत</Label><Input value={(form.itemNameMr as string) || ''} onChange={e => setForm(f => ({ ...f, itemNameMr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">वर्ग</Label><Input value={(form.category as string) || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label className="text-xs">एकक</Label><Input value={(form.unit as string) || ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
              <div><Label className="text-xs">पुरवठादार</Label><Input value={(form.supplier as string) || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">प्रमाण</Label><Input type="number" value={(form.quantity as number) || 0} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">दर प्रति एकक</Label><Input type="number" value={(form.ratePerUnit as number) || 0} onChange={e => setForm(f => ({ ...f, ratePerUnit: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">एकूण मूल्य</Label><Input type="number" value={(form.totalValue as number) || 0} onChange={e => setForm(f => ({ ...f, totalValue: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">किमान साठा</Label><Input type="number" value={(form.minStock as number) || 0} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">कमाल साठा</Label><Input type="number" value={(form.maxStock as number) || 0} onChange={e => setForm(f => ({ ...f, maxStock: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label className="text-xs">स्थिती</Label>
              <Select value={(form.status as string) || 'In Stock'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Stock">साठ्यात</SelectItem>
                  <SelectItem value="Low Stock">कमी साठा</SelectItem>
                  <SelectItem value="Out of Stock">साठा संपला</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'land':
        return (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">जमीन नाव *</Label><Input value={(form.landName as string) || ''} onChange={e => setForm(f => ({ ...f, landName: e.target.value }))} /></div>
              <div><Label className="text-xs">मराठीत</Label><Input value={(form.landNameMr as string) || ''} onChange={e => setForm(f => ({ ...f, landNameMr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">सर्व्हे क्र.</Label><Input value={(form.surveyNo as string) || ''} onChange={e => setForm(f => ({ ...f, surveyNo: e.target.value }))} /></div>
              <div><Label className="text-xs">नकाशा क्र.</Label><Input value={(form.mapNo as string) || ''} onChange={e => setForm(f => ({ ...f, mapNo: e.target.value }))} /></div>
              <div><Label className="text-xs">गट क्र.</Label><Input value={(form.gatNo as string) || ''} onChange={e => setForm(f => ({ ...f, gatNo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">एकर</Label><Input type="number" step="0.01" value={(form.areaAcres as number) || 0} onChange={e => setForm(f => ({ ...f, areaAcres: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">हेक्टर</Label><Input type="number" step="0.01" value={(form.areaHectares as number) || 0} onChange={e => setForm(f => ({ ...f, areaHectares: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">गुंठे</Label><Input type="number" step="0.01" value={(form.areaGunthe as number) || 0} onChange={e => setForm(f => ({ ...f, areaGunthe: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">जमीन प्रकार</Label>
                <Select value={(form.landType as string) || 'agricultural'} onValueChange={v => setForm(f => ({ ...f, landType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agricultural">शेतजमीन</SelectItem>
                    <SelectItem value="residential">राहणीमत</SelectItem>
                    <SelectItem value="commercial">व्यावसायिक</SelectItem>
                    <SelectItem value="government">सरकारी</SelectItem>
                    <SelectItem value="gairan">गायरान</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">मालकी प्रकार</Label>
                <Select value={(form.ownershipType as string) || 'government'} onValueChange={v => setForm(f => ({ ...f, ownershipType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">सरकारी</SelectItem>
                    <SelectItem value="panchayat">पंचायत</SelectItem>
                    <SelectItem value="private">खाजगी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">वापर</Label>
                <Select value={(form.usageType as string) || 'other'} onValueChange={v => setForm(f => ({ ...f, usageType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farming">शेती</SelectItem>
                    <SelectItem value="housing">राहणी</SelectItem>
                    <SelectItem value="commercial_use">व्यावसायिक</SelectItem>
                    <SelectItem value="public_use">सार्वजनिक</SelectItem>
                    <SelectItem value="other">इतर</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'road':
        return (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">रस्ता नाव *</Label><Input value={(form.roadName as string) || ''} onChange={e => setForm(f => ({ ...f, roadName: e.target.value }))} /></div>
              <div><Label className="text-xs">मराठीत</Label><Input value={(form.roadNameMr as string) || ''} onChange={e => setForm(f => ({ ...f, roadNameMr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">प्रकार</Label>
                <Select value={(form.roadType as string) || 'village'} onValueChange={v => setForm(f => ({ ...f, roadType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="village">गावरस्ता</SelectItem>
                    <SelectItem value="district">जिल्हा रस्ता</SelectItem>
                    <SelectItem value="state">राज्य महामार्ग</SelectItem>
                    <SelectItem value="national">राष्ट्रीय महामार्ग</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">पृष्ठभाग</Label>
                <Select value={(form.surfaceType as string) || 'kutcha'} onValueChange={v => setForm(f => ({ ...f, surfaceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kutcha">कच्चा</SelectItem>
                    <SelectItem value="pucca">पक्का</SelectItem>
                    <SelectItem value="concrete">काँक्रीट</SelectItem>
                    <SelectItem value="wbm">WBM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">लांबी (मी.)</Label><Input type="number" value={(form.roadLength as number) || 0} onChange={e => setForm(f => ({ ...f, roadLength: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">रुंदी (मी.)</Label><Input type="number" value={(form.roadWidth as number) || 0} onChange={e => setForm(f => ({ ...f, roadWidth: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">बांधणी वर्ष</Label><Input value={(form.constructionYear as string) || ''} onChange={e => setForm(f => ({ ...f, constructionYear: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">अंदाजित खर्च</Label><Input type="number" value={(form.estimatedCost as number) || 0} onChange={e => setForm(f => ({ ...f, estimatedCost: Number(e.target.value) }))} /></div>
              <div>
                <Label className="text-xs">स्थिती</Label>
                <Select value={(form.condition as string) || 'good'} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">चांगली</SelectItem>
                    <SelectItem value="fair">सरासरी</SelectItem>
                    <SelectItem value="poor">खराब</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'tree':
        return (
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">झाडाचा प्रकार *</Label><Input value={(form.treeType as string) || ''} onChange={e => setForm(f => ({ ...f, treeType: e.target.value }))} /></div>
              <div><Label className="text-xs">स्थान</Label><Input value={(form.location as string) || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">लावणी दिनांक</Label><Input type="date" value={(form.plantDate as string) || ''} onChange={e => setForm(f => ({ ...f, plantDate: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">उंची (मी.)</Label><Input type="number" step="0.1" value={(form.height as number) || 0} onChange={e => setForm(f => ({ ...f, height: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">घेर (सेमी)</Label><Input type="number" step="0.1" value={(form.girth as number) || 0} onChange={e => setForm(f => ({ ...f, girth: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">छत्री व्यास (मी.)</Label><Input type="number" step="0.1" value={(form.canopyDiameter as number) || 0} onChange={e => setForm(f => ({ ...f, canopyDiameter: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">अंदाजित मूल्य</Label><Input type="number" value={(form.estimatedValue as number) || 0} onChange={e => setForm(f => ({ ...f, estimatedValue: Number(e.target.value) }))} /></div>
              <div>
                <Label className="text-xs">स्थिती</Label>
                <Select value={(form.condition as string) || 'good'} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">चांगली</SelectItem>
                    <SelectItem value="fair">सरासरी</SelectItem>
                    <SelectItem value="poor">खराब</SelectItem>
                    <SelectItem value="dead">मृत</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={(form.isProtected as boolean) || false} onCheckedChange={v => setForm(f => ({ ...f, isProtected: v === true }))} />
              <Label className="text-xs">संरक्षित</Label>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="asset">
        <TabsList className="flex-wrap">
          <TabsTrigger value="asset" className="gap-1"><Building2 className="h-4 w-4" />स्थावर मालमत्ता</TabsTrigger>
          <TabsTrigger value="stock" className="gap-1"><Package className="h-4 w-4" />साठा</TabsTrigger>
          <TabsTrigger value="land" className="gap-1"><Map className="h-4 w-4" />जमीन</TabsTrigger>
          <TabsTrigger value="road" className="gap-1"><Route className="h-4 w-4" />रस्ते</TabsTrigger>
          <TabsTrigger value="tree" className="gap-1"><TreePine className="h-4 w-4" />झाडे</TabsTrigger>
        </TabsList>

        {/* ===== FIXED ASSETS ===== */}
        <TabsContent value="asset" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">स्थावर मालमत्ता यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openDialog('asset')}><Plus className="h-4 w-4 mr-1" />नवीन मालमत्ता</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">नाव</TableHead>
                      <TableHead className="text-xs">प्रकार</TableHead>
                      <TableHead className="text-xs">क्रमांक</TableHead>
                      <TableHead className="text-xs text-right">खरेदी किंमत</TableHead>
                      <TableHead className="text-xs text-right">सध्याचे मूल्य</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणतीही मालमत्ता नाही</TableCell></TableRow>
                    ) : assets.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="text-sm">{a.assetName}</div>
                          {a.assetNameMr && <div className="text-xs text-muted-foreground">{a.assetNameMr}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{a.assetType || '-'}</TableCell>
                        <TableCell className="text-xs font-mono">{a.assetNumber || '-'}</TableCell>
                        <TableCell className="text-right text-sm">₹{(a.purchaseCost || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(a.currentValue || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge variant="outline">{a.status === 'active' ? 'सक्रिय' : a.status === 'disposed' ? 'विल्हेवाट' : 'दुरुस्तीत'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDialog('asset', a)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord('asset', a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== INVENTORY ===== */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">साठा यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openDialog('stock')}><Plus className="h-4 w-4 mr-1" />नवीन वस्तू</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">वस्तूचे नाव</TableHead>
                      <TableHead className="text-xs">वर्ग</TableHead>
                      <TableHead className="text-xs text-right">प्रमाण</TableHead>
                      <TableHead className="text-xs text-right">दर</TableHead>
                      <TableHead className="text-xs text-right">एकूण मूल्य</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणताही साठा नाही</TableCell></TableRow>
                    ) : stocks.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="text-sm">{s.itemName}</div>
                          {s.itemNameMr && <div className="text-xs text-muted-foreground">{s.itemNameMr}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{s.category || '-'}</TableCell>
                        <TableCell className="text-right text-sm">{s.quantity} {s.unit || ''}</TableCell>
                        <TableCell className="text-right text-sm">₹{(s.ratePerUnit || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-sm">₹{(s.totalValue || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'In Stock' ? 'default' : s.status === 'Low Stock' ? 'secondary' : 'destructive'}>
                            {s.status === 'In Stock' ? 'साठ्यात' : s.status === 'Low Stock' ? 'कमी साठा' : 'साठा संपला'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDialog('stock', s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord('stock', s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LAND ===== */}
        <TabsContent value="land" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">जमीन यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openDialog('land')}><Plus className="h-4 w-4 mr-1" />नवीन जमीन</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">जमीन नाव</TableHead>
                      <TableHead className="text-xs">सर्व्हे क्र.</TableHead>
                      <TableHead className="text-xs text-right">एकर</TableHead>
                      <TableHead className="text-xs text-right">गुंठे</TableHead>
                      <TableHead className="text-xs">प्रकार</TableHead>
                      <TableHead className="text-xs">मालकी</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणतीही जमीन नाही</TableCell></TableRow>
                    ) : lands.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{l.landName}</TableCell>
                        <TableCell className="text-xs font-mono">{l.surveyNo || '-'}</TableCell>
                        <TableCell className="text-right text-sm">{(l.areaAcres || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm">{(l.areaGunthe || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{l.landType || '-'}</TableCell>
                        <TableCell className="text-xs">{l.ownershipType || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDialog('land', l)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord('land', l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ROADS ===== */}
        <TabsContent value="road" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">रस्ते यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openDialog('road')}><Plus className="h-4 w-4 mr-1" />नवीन रस्ता</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">रस्ता नाव</TableHead>
                      <TableHead className="text-xs">प्रकार</TableHead>
                      <TableHead className="text-xs text-right">लांबी (मी.)</TableHead>
                      <TableHead className="text-xs text-right">रुंदी (मी.)</TableHead>
                      <TableHead className="text-xs">पृष्ठभाग</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roads.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणतेही रस्ते नाहीत</TableCell></TableRow>
                    ) : roads.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.roadName}</TableCell>
                        <TableCell className="text-xs">{r.roadType || '-'}</TableCell>
                        <TableCell className="text-right text-sm">{(r.roadLength || 0).toFixed(0)}</TableCell>
                        <TableCell className="text-right text-sm">{(r.roadWidth || 0).toFixed(0)}</TableCell>
                        <TableCell className="text-xs">{r.surfaceType || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{conditionLabels[r.condition || ''] || r.condition || '-'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDialog('road', r)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord('road', r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TREES ===== */}
        <TabsContent value="tree" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">झाडे यादी</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => openDialog('tree')}><Plus className="h-4 w-4 mr-1" />नवीन झाड</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">झाडाचा प्रकार</TableHead>
                      <TableHead className="text-xs">स्थान</TableHead>
                      <TableHead className="text-xs">लावणी दिनांक</TableHead>
                      <TableHead className="text-xs text-right">उंची (मी.)</TableHead>
                      <TableHead className="text-xs">स्थिती</TableHead>
                      <TableHead className="text-xs">संरक्षित</TableHead>
                      <TableHead className="text-xs text-right">कृती</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trees.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोणतीही झाडे नाहीत</TableCell></TableRow>
                    ) : trees.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{t.treeType}</TableCell>
                        <TableCell className="text-xs">{t.location || '-'}</TableCell>
                        <TableCell className="text-xs">{t.plantDate || '-'}</TableCell>
                        <TableCell className="text-right text-sm">{(t.height || 0).toFixed(1)}</TableCell>
                        <TableCell><Badge variant="outline">{conditionLabels[t.condition || ''] || t.condition || '-'}</Badge></TableCell>
                        <TableCell><Badge variant={t.isProtected ? 'default' : 'secondary'}>{t.isProtected ? 'हो' : 'नाही'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDialog('tree', t)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord('tree', t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generic Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'संपादन' : 'नवीन नोंद'} - {{
                asset: 'स्थावर मालमत्ता',
                stock: 'साठा',
                land: 'जमीन',
                road: 'रस्ता',
                tree: 'झाड',
              }[dialogType]}
            </DialogTitle>
          </DialogHeader>
          {renderDialogFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>रद्द करा</Button>
            <Button onClick={saveRecord} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}जतन करा
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
