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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Home, MapPin, User, Route,
  Droplets, Lightbulb, Calculator, Accessibility, Users, Settings,
  Building2, Save, X, Loader2, Landmark, Zap, Droplet, Sun,
  FileText, AlertTriangle, Percent, MoreHorizontal, Eye, ToggleLeft,
  Compass, CalendarDays, PiggyBank, BanknoteIcon, FolderOpen, HardHat,
  Layers, Tag
} from 'lucide-react';

// ===== TAB COLOR DEFINITIONS =====

const tabColors = {
  village: { bg: 'bg-teal-50', header: 'from-teal-600 to-teal-700', text: 'text-teal-800', icon: 'bg-teal-500', badge: 'bg-teal-100 text-teal-800', border: 'border-teal-200', headerBg: 'bg-teal-600', headerText: 'text-white', ring: 'ring-teal-500' },
  ward: { bg: 'bg-green-50', header: 'from-green-600 to-green-700', text: 'text-green-800', icon: 'bg-green-500', badge: 'bg-green-100 text-green-800', border: 'border-green-200', headerBg: 'bg-green-600', headerText: 'text-white', ring: 'ring-green-500' },
  owner: { bg: 'bg-purple-50', header: 'from-purple-600 to-purple-700', text: 'text-purple-800', icon: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200', headerBg: 'bg-purple-600', headerText: 'text-white', ring: 'ring-purple-500' },
  property: { bg: 'bg-cyan-50', header: 'from-cyan-600 to-cyan-700', text: 'text-cyan-800', icon: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-800', border: 'border-cyan-200', headerBg: 'bg-cyan-600', headerText: 'text-white', ring: 'ring-cyan-500' },
  road: { bg: 'bg-amber-50', header: 'from-amber-600 to-amber-700', text: 'text-amber-800', icon: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200', headerBg: 'bg-amber-600', headerText: 'text-white', ring: 'ring-amber-500' },
  drainage: { bg: 'bg-blue-50', header: 'from-blue-600 to-blue-700', text: 'text-blue-800', icon: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200', headerBg: 'bg-blue-600', headerText: 'text-white', ring: 'ring-blue-500' },
  waterSupply: { bg: 'bg-sky-50', header: 'from-sky-600 to-sky-700', text: 'text-sky-800', icon: 'bg-sky-500', badge: 'bg-sky-100 text-sky-800', border: 'border-sky-200', headerBg: 'bg-sky-600', headerText: 'text-white', ring: 'ring-sky-500' },
  streetLight: { bg: 'bg-yellow-50', header: 'from-yellow-600 to-yellow-700', text: 'text-yellow-800', icon: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200', headerBg: 'bg-yellow-600', headerText: 'text-white', ring: 'ring-yellow-500' },
  readyReckoner: { bg: 'bg-orange-50', header: 'from-orange-600 to-orange-700', text: 'text-orange-800', icon: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', border: 'border-orange-200', headerBg: 'bg-orange-600', headerText: 'text-white', ring: 'ring-orange-500' },
  disability: { bg: 'bg-pink-50', header: 'from-pink-600 to-pink-700', text: 'text-pink-800', icon: 'bg-pink-500', badge: 'bg-pink-100 text-pink-800', border: 'border-pink-200', headerBg: 'bg-pink-600', headerText: 'text-white', ring: 'ring-pink-500' },
  employee: { bg: 'bg-indigo-50', header: 'from-indigo-600 to-indigo-700', text: 'text-indigo-800', icon: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-800', border: 'border-indigo-200', headerBg: 'bg-indigo-600', headerText: 'text-white', ring: 'ring-indigo-500' },
  tax: { bg: 'bg-rose-50', header: 'from-rose-600 to-rose-700', text: 'text-rose-800', icon: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-200', headerBg: 'bg-rose-600', headerText: 'text-white', ring: 'ring-rose-500' },
  bank: { bg: 'bg-emerald-50', header: 'from-emerald-600 to-emerald-700', text: 'text-emerald-800', icon: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200', headerBg: 'bg-emerald-600', headerText: 'text-white', ring: 'ring-emerald-500' },
  namuna8: { bg: 'bg-lime-50', header: 'from-lime-600 to-lime-700', text: 'text-lime-800', icon: 'bg-lime-500', badge: 'bg-lime-100 text-lime-800', border: 'border-lime-200', headerBg: 'bg-lime-600', headerText: 'text-white', ring: 'ring-lime-500' },
  namuna13: { bg: 'bg-fuchsia-50', header: 'from-fuchsia-600 to-fuchsia-700', text: 'text-fuchsia-800', icon: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800', border: 'border-fuchsia-200', headerBg: 'bg-fuchsia-600', headerText: 'text-white', ring: 'ring-fuchsia-500' },
  namuna22: { bg: 'bg-stone-50', header: 'from-stone-600 to-stone-700', text: 'text-stone-800', icon: 'bg-stone-500', badge: 'bg-stone-100 text-stone-800', border: 'border-stone-200', headerBg: 'bg-stone-600', headerText: 'text-white', ring: 'ring-stone-500' },
  namuna23: { bg: 'bg-violet-50', header: 'from-violet-600 to-violet-700', text: 'text-violet-800', icon: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800', border: 'border-violet-200', headerBg: 'bg-violet-600', headerText: 'text-white', ring: 'ring-violet-500' },
  namuna24: { bg: 'bg-amber-50', header: 'from-amber-700 to-amber-800', text: 'text-amber-900', icon: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-300', headerBg: 'bg-amber-700', headerText: 'text-white', ring: 'ring-amber-600' },
  namuna33: { bg: 'bg-green-50', header: 'from-green-700 to-green-800', text: 'text-green-900', icon: 'bg-green-600', badge: 'bg-green-100 text-green-800', border: 'border-green-300', headerBg: 'bg-green-700', headerText: 'text-white', ring: 'ring-green-600' },
};

type TabColorKey = keyof typeof tabColors;

// ===== SHARED HELPERS =====

async function apiGet(table: string, search?: string) {
  const params = new URLSearchParams({ table });
  if (search) params.set('search', search);
  const res = await fetch(`/api/master?${params}`);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

async function apiCreate(table: string, data: Record<string, unknown>) {
  const res = await fetch('/api/master', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Create failed');
  return json;
}

async function apiUpdate(table: string, data: Record<string, unknown>) {
  const res = await fetch('/api/master', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Update failed');
  return json;
}

async function apiDelete(table: string, id: string) {
  const res = await fetch(`/api/master?table=${table}&id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

async function apiSeed(table: string) {
  const res = await fetch('/api/master', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action: 'seed' }),
  });
  return res.json();
}

// ===== SECTION HEADER COMPONENT =====

function SectionHeader({ colorKey, title, icon, count, search, onSearchChange, onRefresh, onAdd, loading }: {
  colorKey: TabColorKey;
  title: string;
  icon: React.ReactNode;
  count: number;
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  loading: boolean;
}) {
  const c = tabColors[colorKey];
  return (
    <div className={`rounded-t-xl bg-gradient-to-r ${c.header} p-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`${c.icon} p-2 rounded-lg text-white`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <Badge className={`${c.badge} border-0 font-bold text-sm`}>{count}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
            <Input
              className="pl-9 w-48 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              placeholder="शोधा..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onAdd} className={`bg-gradient-to-r ${c.header} text-white shadow-lg hover:opacity-90 border-0`}>
            <Plus className="h-4 w-4 mr-1" /> नवीन
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== COLORED TABLE HEADER =====

function ColoredTableHeader({ colorKey, children }: { colorKey: TabColorKey; children: React.ReactNode }) {
  const c = tabColors[colorKey];
  return (
    <TableHeader>
      <TableRow className={`${c.headerBg} hover:${c.headerBg}`}>
        {children}
      </TableRow>
    </TableHeader>
  );
}

function ColoredTableHead({ colorKey, children, className }: { colorKey: TabColorKey; children: React.ReactNode; className?: string }) {
  const c = tabColors[colorKey];
  return (
    <TableHead className={`${c.headerText} font-bold ${className || ''}`}>
      {children}
    </TableHead>
  );
}

// ================================================================
// TAB 1: VILLAGE INFO (गाव माहिती) - Single Record Form
// ================================================================

function VillageInfoTab() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const c = tabColors.village;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet('village');
      setData(result);
      if (result) {
        setForm({
          gramPanchayatName: String(result.gramPanchayatName || ''),
          gramPanchayatNameMr: String(result.gramPanchayatNameMr || ''),
          taluka: String(result.taluka || ''),
          district: String(result.district || ''),
          state: String(result.state || 'महाराष्ट्र'),
          pinCode: String(result.pinCode || ''),
          population: String(result.population || ''),
          totalArea: String(result.totalArea || ''),
          gramSabhaDate: String(result.gramSabhaDate || ''),
          sarpanchName: String(result.sarpanchName || ''),
          sarpanchNameMr: String(result.sarpanchNameMr || ''),
          secretaryName: String(result.secretaryName || ''),
          secretaryNameMr: String(result.secretaryNameMr || ''),
        });
      } else {
        setForm({ state: 'महाराष्ट्र' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData: Record<string, unknown> = {};
      if (data?.id) saveData.id = data.id;
      for (const [key, value] of Object.entries(form)) {
        if (key === 'population') {
          saveData[key] = value ? parseInt(value) : null;
        } else if (key === 'totalArea') {
          saveData[key] = value ? parseFloat(value) : null;
        } else {
          saveData[key] = value || null;
        }
      }
      await (data?.id ? apiUpdate('village', saveData) : apiCreate('village', saveData));
      toast({ title: 'यशस्वी', description: 'गाव माहिती जतन झाली' });
      fetchData();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'जतन अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${c.header} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`${c.icon} p-2 rounded-lg text-white`}><Landmark className="h-5 w-5" /></div>
          <h3 className="text-lg font-bold text-white">गाव माहिती</h3>
        </div>
      </div>
      <CardContent className="p-6"><div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div></CardContent>
    </Card>
  );

  const fields = [
    { key: 'gramPanchayatName', label: 'ग्रामपंचायतचे नाव (English)', required: true },
    { key: 'gramPanchayatNameMr', label: 'ग्रामपंचायतचे नाव (मराठी)', required: true },
    { key: 'taluka', label: 'तालुका' },
    { key: 'district', label: 'जिल्हा' },
    { key: 'state', label: 'राज्य' },
    { key: 'pinCode', label: 'पिन कोड' },
    { key: 'population', label: 'लोकसंख्या', type: 'number' },
    { key: 'totalArea', label: 'एकूण क्षेत्रफळ (चौ.मी.)', type: 'number' },
    { key: 'gramSabhaDate', label: 'ग्रामसभा दिनांक' },
    { key: 'sarpanchName', label: 'सरपंचाचे नाव (English)' },
    { key: 'sarpanchNameMr', label: 'सरपंचाचे नाव (मराठी)' },
    { key: 'secretaryName', label: 'सचिवाचे नाव (English)' },
    { key: 'secretaryNameMr', label: 'सचिवाचे नाव (मराठी)' },
  ];

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${c.header} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${c.icon} p-2 rounded-lg text-white`}><Landmark className="h-5 w-5" /></div>
            <h3 className="text-lg font-bold text-white">गाव माहिती</h3>
            <Badge className={`${c.badge} border-0`}>{data ? 1 : 0}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
          </Button>
        </div>
      </div>
      <CardContent className={`${c.bg} p-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className={`text-sm ${c.text} font-medium`}>
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={form[f.key] || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                type={f.type || 'text'}
                placeholder={f.label}
                className="bg-white"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className={`bg-gradient-to-r ${c.header} text-white shadow-lg border-0 hover:opacity-90`}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'जतन करत आहे...' : 'जतन करा'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================================================
// GENERIC CRUD LIST - Reusable with color theming
// ================================================================

interface CrudListProps {
  title: string;
  table: string;
  colorKey: TabColorKey;
  icon: React.ReactNode;
  columns: { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[];
  formFields: FormField[];
  seedOnEmpty?: boolean;
  renderExtraForm?: (data: Record<string, unknown>, setData: (d: Record<string, unknown>) => void) => React.ReactNode;
  renderExtraColumns?: (item: Record<string, unknown>) => React.ReactNode;
  defaultFormData?: Record<string, unknown>;
}

interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: number;
}

function CrudList({
  title,
  table,
  colorKey,
  icon,
  columns,
  formFields,
  seedOnEmpty,
  renderExtraForm,
  renderExtraColumns,
  defaultFormData,
}: CrudListProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(defaultFormData || {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const c = tabColors[colorKey];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let result = await apiGet(table, search || undefined);
      if (!Array.isArray(result)) result = result ? [result] : [];
      if (result.length === 0 && seedOnEmpty) {
        await apiSeed(table);
        result = await apiGet(table, search || undefined);
        if (!Array.isArray(result)) result = result ? [result] : [];
      }
      setItems(result);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [table, search, seedOnEmpty]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    setFormData(defaultFormData || {});
    setDialogOpen(true);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    const fd: Record<string, unknown> = {};
    for (const f of formFields) {
      fd[f.key] = item[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'number' ? '' : '');
    }
    setFormData(fd);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('हा रेकॉर्ड हटवायचा आहे का?')) return;
    setDeleting(id);
    try {
      await apiDelete(table, id);
      toast({ title: 'यशस्वी', description: 'रेकॉर्ड हटवला' });
      fetchData();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'हटवणे अयशस्वी', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData: Record<string, unknown> = { ...formData };
      if (editItem?.id) saveData.id = editItem.id;
      for (const f of formFields) {
        if (f.type === 'number' && saveData[f.key] !== undefined && saveData[f.key] !== '') {
          saveData[f.key] = parseFloat(String(saveData[f.key])) || 0;
        }
        if (f.type === 'number' && (saveData[f.key] === '' || saveData[f.key] === undefined)) {
          saveData[f.key] = null;
        }
      }
      await (editItem?.id ? apiUpdate(table, saveData) : apiCreate(table, saveData));
      toast({ title: 'यशस्वी', description: editItem?.id ? 'रेकॉर्ड अपडेट झाला' : 'नवीन रेकॉर्ड जोडला' });
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'जतन अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items;

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        colorKey={colorKey}
        title={title}
        icon={icon}
        count={filteredItems.length}
        search={search}
        onSearchChange={setSearch}
        onRefresh={fetchData}
        onAdd={handleAdd}
        loading={loading}
      />
      <CardContent className={`${c.bg} p-4`}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">कोणतेही रेकॉर्ड नाहीत</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg border-white/50 shadow-sm">
            <Table>
              <ColoredTableHeader colorKey={colorKey}>
                <ColoredTableHead colorKey={colorKey} className="w-12">क्र.</ColoredTableHead>
                {columns.map((col) => (
                  <ColoredTableHead key={col.key} colorKey={colorKey}>{col.label}</ColoredTableHead>
                ))}
                <ColoredTableHead colorKey={colorKey} className="w-24 text-right">क्रिया</ColoredTableHead>
              </ColoredTableHeader>
              <TableBody>
                {filteredItems.map((item, idx) => (
                  <TableRow key={String(item.id)} className="hover:bg-white/60">
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                      </TableCell>
                    ))}
                    {renderExtraColumns && <TableCell>{renderExtraColumns(item)}</TableCell>}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="hover:bg-white/60">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(String(item.id))}
                          disabled={deleting === String(item.id)}
                          className="hover:bg-white/60"
                        >
                          {deleting === String(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${c.text}`}>
              <div className={`${c.icon} p-1.5 rounded text-white`}>{icon}</div>
              {editItem ? 'रेकॉर्ड संपादा' : 'नवीन रेकॉर्ड'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {formFields.map((f) => (
              <div key={f.key} className={`space-y-1 ${f.colSpan === 2 ? 'sm:col-span-2' : ''}`}>
                <Label className="text-sm">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </Label>
                {f.type === 'select' ? (
                  <Select
                    value={String(formData[f.key] || '')}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={f.placeholder || 'निवडा'} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'checkbox' ? (
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      checked={!!formData[f.key]}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, [f.key]: !!checked }))}
                    />
                    <span className="text-sm text-muted-foreground">{f.placeholder || 'होय'}</span>
                  </div>
                ) : f.type === 'textarea' ? (
                  <Textarea
                    value={String(formData[f.key] || '')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || f.label}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={String(formData[f.key] ?? '')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    type={f.type || 'text'}
                    placeholder={f.placeholder || f.label}
                  />
                )}
              </div>
            ))}
            {renderExtraForm && renderExtraForm(formData, setFormData)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" /> रद्द करा
            </Button>
            <Button onClick={handleSave} disabled={saving} className={`bg-gradient-to-r ${c.header} text-white border-0 hover:opacity-90`}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? 'जतन करत आहे...' : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ================================================================
// TAB 2: WARD (वार्ड)
// ================================================================

function WardTab() {
  return (
    <CrudList
      title="वार्ड"
      table="ward"
      colorKey="ward"
      icon={<MapPin className="h-5 w-5" />}
      columns={[
        { key: 'wardNumber', label: 'वार्ड क्र.' },
        { key: 'wardName', label: 'वार्ड नाव' },
        { key: 'wardNameMr', label: 'वार्ड नाव (मराठी)' },
        { key: 'population', label: 'लोकसंख्या', render: (i) => String(i.population ?? '-') },
        { key: 'area', label: 'क्षेत्रफळ', render: (i) => i.area ? `${i.area} चौ.मी.` : '-' },
      ]}
      formFields={[
        { key: 'wardNumber', label: 'वार्ड क्रमांक', required: true },
        { key: 'wardName', label: 'वार्ड नाव (English)', required: true },
        { key: 'wardNameMr', label: 'वार्ड नाव (मराठी)', required: true },
        { key: 'population', label: 'लोकसंख्या', type: 'number' },
        { key: 'area', label: 'क्षेत्रफळ (चौ.मी.)', type: 'number' },
        { key: 'description', label: 'वर्णन', type: 'textarea', colSpan: 2 },
      ]}
    />
  );
}

// ================================================================
// TAB 3: OWNER (मालक)
// ================================================================

function OwnerTab() {
  return (
    <CrudList
      title="मालक"
      table="owner"
      colorKey="owner"
      icon={<User className="h-5 w-5" />}
      columns={[
        { key: 'ownerNumber', label: 'मालक क्र.' },
        { key: 'firstName', label: 'नाव', render: (i) => `${i.firstName || ''} ${i.middleName || ''} ${i.lastName || ''}`.trim() },
        { key: 'firstNameMr', label: 'नाव (मराठी)', render: (i) => `${i.firstNameMr || ''} ${i.middleNameMr || ''} ${i.lastNameMr || ''}`.trim() },
        { key: 'mobileNumber', label: 'मोबाईल' },
        { key: 'isDisabled', label: 'अपंग', render: (i) => i.isDisabled ? <Badge variant="destructive">होय</Badge> : 'नाही' },
      ]}
      formFields={[
        { key: 'ownerNumber', label: 'मालक क्रमांक', required: true },
        { key: 'firstName', label: 'पहिले नाव', required: true },
        { key: 'middleName', label: 'मधले नाव' },
        { key: 'lastName', label: 'आडनाव', required: true },
        { key: 'firstNameMr', label: 'पहिले नाव (मराठी)', required: true },
        { key: 'middleNameMr', label: 'मधले नाव (मराठी)' },
        { key: 'lastNameMr', label: 'आडनाव (मराठी)' },
        { key: 'mobileNumber', label: 'मोबाईल क्रमांक', placeholder: '10 अंकी क्रमांक' },
        { key: 'aadhaarNumber', label: 'आधार क्रमांक' },
        { key: 'panNumber', label: 'PAN क्रमांक' },
        { key: 'email', label: 'ईमेल' },
        { key: 'address', label: 'पत्ता', type: 'textarea', colSpan: 2 },
        { key: 'addressMr', label: 'पत्ता (मराठी)', type: 'textarea', colSpan: 2 },
        { key: 'isDisabled', label: 'अपंगत्व', type: 'checkbox', placeholder: 'अपंग आहे' },
        { key: 'disabilityType', label: 'अपंगत्व प्रकार' },
        { key: 'disabilityPercentage', label: 'अपंगत्व टक्के', type: 'number' },
      ]}
    />
  );
}

// ================================================================
// TAB 4: ROAD (रस्ते)
// ================================================================

function RoadTab() {
  const [wards, setWards] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    apiGet('ward').then((d) => setWards(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <CrudList
      title="रस्ते"
      table="road"
      colorKey="road"
      icon={<Route className="h-5 w-5" />}
      columns={[
        { key: 'roadNumber', label: 'रस्ता क्र.' },
        { key: 'roadName', label: 'रस्ता नाव' },
        { key: 'roadNameMr', label: 'रस्ता नाव (मराठी)' },
        { key: 'roadType', label: 'प्रकार' },
        { key: 'length', label: 'लांबी (मी.)', render: (i) => String(i.length ?? '-') },
        { key: 'width', label: 'रुंदी (मी.)', render: (i) => String(i.width ?? '-') },
      ]}
      formFields={[
        { key: 'roadNumber', label: 'रस्ता क्रमांक', required: true },
        { key: 'roadName', label: 'रस्ता नाव (English)', required: true },
        { key: 'roadNameMr', label: 'रस्ता नाव (मराठी)', required: true },
        { key: 'roadType', label: 'रस्ता प्रकार', type: 'select', options: [
          { value: 'पक्का', label: 'पक्का' },
          { value: 'अर्धपक्का', label: 'अर्धपक्का' },
          { value: 'कच्चा', label: 'कच्चा' },
        ]},
        { key: 'length', label: 'लांबी (मीटर)', type: 'number' },
        { key: 'width', label: 'रुंदी (मीटर)', type: 'number' },
      ]}
      renderExtraForm={(formData, setFormData) => (
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-sm">वार्ड</Label>
          <Select
            value={String(formData.wardId || '')}
            onValueChange={(v) => setFormData({ ...formData, wardId: v === '__none__' ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="वार्ड निवडा" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">कोणताही नाही</SelectItem>
              {wards.map((w: Record<string, unknown>) => (
                <SelectItem key={String(w.id)} value={String(w.id)}>
                  {String(w.wardNumber)} - {String(w.wardNameMr || w.wardName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}

// ================================================================
// TAB 5: DRAINAGE (कालवे)
// ================================================================

function DrainageTab() {
  const [wards, setWards] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    apiGet('ward').then((d) => setWards(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <CrudList
      title="कालवे"
      table="drainage"
      colorKey="drainage"
      icon={<Droplets className="h-5 w-5" />}
      columns={[
        { key: 'drainageNumber', label: 'कालवा क्र.' },
        { key: 'drainageName', label: 'कालवा नाव' },
        { key: 'drainageNameMr', label: 'नाव (मराठी)' },
        { key: 'drainageType', label: 'प्रकार' },
        { key: 'length', label: 'लांबी (मी.)', render: (i) => String(i.length ?? '-') },
        { key: 'status', label: 'स्थिती' },
      ]}
      formFields={[
        { key: 'drainageNumber', label: 'कालवा क्रमांक', required: true },
        { key: 'drainageName', label: 'कालवा नाव (English)', required: true },
        { key: 'drainageNameMr', label: 'कालवा नाव (मराठी)', required: true },
        { key: 'drainageType', label: 'कालवा प्रकार', type: 'select', options: [
          { value: 'उघडा', label: 'उघडा' },
          { value: 'बंद', label: 'बंद' },
        ]},
        { key: 'length', label: 'लांबी (मीटर)', type: 'number' },
        { key: 'status', label: 'स्थिती', type: 'select', options: [
          { value: 'Active', label: 'सक्रिय' },
          { value: 'Inactive', label: 'निष्क्रिय' },
          { value: 'Under Repair', label: 'दुरुस्तीत' },
        ]},
      ]}
      renderExtraForm={(formData, setFormData) => (
        <div className="space-y-1">
          <Label className="text-sm">वार्ड</Label>
          <Select
            value={String(formData.wardId || '')}
            onValueChange={(v) => setFormData({ ...formData, wardId: v === '__none__' ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="वार्ड निवडा" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">कोणताही नाही</SelectItem>
              {wards.map((w: Record<string, unknown>) => (
                <SelectItem key={String(w.id)} value={String(w.id)}>
                  {String(w.wardNumber)} - {String(w.wardNameMr || w.wardName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}

// ================================================================
// TAB 6: WATER SUPPLY (पाणीपुरवठा)
// ================================================================

function WaterSupplyTab() {
  const [wards, setWards] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    apiGet('ward').then((d) => setWards(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <CrudList
      title="पाणीपुरवठा"
      table="waterSupply"
      colorKey="waterSupply"
      icon={<Droplet className="h-5 w-5" />}
      columns={[
        { key: 'connectionNumber', label: 'जोडणी क्र.' },
        { key: 'connectionType', label: 'जोडणी प्रकार' },
        { key: 'connectionStatus', label: 'स्थिती' },
        { key: 'tapSize', label: 'नळ आकार' },
        { key: 'monthlyRate', label: 'मासिक दर', render: (i) => `₹${i.monthlyRate ?? 0}` },
      ]}
      formFields={[
        { key: 'connectionNumber', label: 'जोडणी क्रमांक', required: true },
        { key: 'connectionType', label: 'जोडणी प्रकार', type: 'select', required: true, options: [
          { value: 'घरगुती', label: 'घरगुती' },
          { value: 'व्यावसायिक', label: 'व्यावसायिक' },
          { value: 'औद्योगिक', label: 'औद्योगिक' },
        ]},
        { key: 'connectionStatus', label: 'जोडणी स्थिती', type: 'select', options: [
          { value: 'Active', label: 'सक्रिय' },
          { value: 'Inactive', label: 'निष्क्रिय' },
          { value: 'Disconnected', label: 'खंडित' },
        ]},
        { key: 'tapSize', label: 'नळ आकार' },
        { key: 'monthlyRate', label: 'मासिक दर (₹)', type: 'number' },
      ]}
      renderExtraForm={(formData, setFormData) => (
        <div className="space-y-1">
          <Label className="text-sm">वार्ड</Label>
          <Select
            value={String(formData.wardId || '')}
            onValueChange={(v) => setFormData({ ...formData, wardId: v === '__none__' ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="वार्ड निवडा" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">कोणताही नाही</SelectItem>
              {wards.map((w: Record<string, unknown>) => (
                <SelectItem key={String(w.id)} value={String(w.id)}>
                  {String(w.wardNumber)} - {String(w.wardNameMr || w.wardName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}

// ================================================================
// TAB 7: STREET LIGHT (दिवाबत्ती)
// ================================================================

function StreetLightTab() {
  const [wards, setWards] = useState<Record<string, unknown>[]>([]);
  const [roads, setRoads] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    apiGet('ward').then((d) => setWards(Array.isArray(d) ? d : [])).catch(() => {});
    apiGet('road').then((d) => setRoads(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <CrudList
      title="दिवाबत्ती"
      table="streetLight"
      colorKey="streetLight"
      icon={<Sun className="h-5 w-5" />}
      columns={[
        { key: 'lightNumber', label: 'दिवा क्र.' },
        { key: 'lightType', label: 'दिवा प्रकार' },
        { key: 'wattage', label: 'वॅटेज', render: (i) => i.wattage ? `${i.wattage} W` : '-' },
        { key: 'poleNumber', label: 'खांब क्र.' },
        { key: 'status', label: 'स्थिती' },
      ]}
      formFields={[
        { key: 'lightNumber', label: 'दिवा क्रमांक', required: true },
        { key: 'lightType', label: 'दिवा प्रकार', type: 'select', required: true, options: [
          { value: 'LED', label: 'LED' },
          { value: 'CFL', label: 'CFL' },
          { value: 'Tube', label: 'Tube' },
          { value: 'इतर', label: 'इतर' },
        ]},
        { key: 'wattage', label: 'वॅटेज (W)', type: 'number' },
        { key: 'poleNumber', label: 'खांब क्रमांक' },
        { key: 'status', label: 'स्थिती', type: 'select', options: [
          { value: 'Working', label: 'चालू' },
          { value: 'Not Working', label: 'बंद' },
          { value: 'Under Repair', label: 'दुरुस्तीत' },
        ]},
      ]}
      renderExtraForm={(formData, setFormData) => (
        <>
          <div className="space-y-1">
            <Label className="text-sm">वार्ड</Label>
            <Select
              value={String(formData.wardId || '')}
              onValueChange={(v) => setFormData({ ...formData, wardId: v === '__none__' ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="वार्ड निवडा" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">कोणताही नाही</SelectItem>
                {wards.map((w: Record<string, unknown>) => (
                  <SelectItem key={String(w.id)} value={String(w.id)}>
                    {String(w.wardNumber)} - {String(w.wardNameMr || w.wardName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">रस्ता</Label>
            <Select
              value={String(formData.roadId || '')}
              onValueChange={(v) => setFormData({ ...formData, roadId: v === '__none__' ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="रस्ता निवडा" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">कोणताही नाही</SelectItem>
                {roads.map((r: Record<string, unknown>) => (
                  <SelectItem key={String(r.id)} value={String(r.id)}>
                    {String(r.roadNumber)} - {String(r.roadNameMr || r.roadName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    />
  );
}

// ================================================================
// TAB 8: READY RECKONER (रेडीरेकनर)
// ================================================================

function ReadyReckonerTab() {
  return (
    <CrudList
      title="रेडीरेकनर"
      table="readyReckoner"
      colorKey="readyReckoner"
      icon={<Calculator className="h-5 w-5" />}
      columns={[
        { key: 'usageType', label: 'वापर प्रकार' },
        { key: 'constructionType', label: 'बांधकाम प्रकार' },
        { key: 'ratePerSqFt', label: 'दर (₹/चौ.फूट)', render: (i) => `₹${i.ratePerSqFt ?? 0}` },
        { key: 'year', label: 'वर्ष' },
        { key: 'zone', label: 'झोन', render: (i) => String(i.zone ?? '-') },
      ]}
      formFields={[
        { key: 'usageType', label: 'वापर प्रकार', type: 'select', required: true, options: [
          { value: 'राहणीमान', label: 'राहणीमान' },
          { value: 'व्यावसायिक', label: 'व्यावसायिक' },
          { value: 'औद्योगिक', label: 'औद्योगिक' },
          { value: 'शेती', label: 'शेती' },
        ]},
        { key: 'constructionType', label: 'बांधकाम प्रकार', type: 'select', required: true, options: [
          { value: 'झोपडी किंवा मातीचे घर', label: 'झोपडी किंवा मातीचे घर' },
          { value: 'दगड विटा/मातीचे बांधकाम', label: 'दगड विटा/मातीचे बांधकाम' },
          { value: 'दगड विट/सिमेंटचे बांधकाम', label: 'दगड विट/सिमेंटचे बांधकाम' },
          { value: 'आर.सि.सि. बांधकाम', label: 'आर.सि.सि. बांधकाम' },
          { value: 'पहिला मजला', label: 'पहिला मजला' },
          { value: 'जमीन/खुली जागा', label: 'जमीन/खुली जागा' },
          { value: 'पक्के', label: 'पक्के' },
          { value: 'अर्धपक्के', label: 'अर्धपक्के' },
          { value: 'कच्चे', label: 'कच्चे' },
          { value: 'इतर', label: 'इतर' },
        ]},
        { key: 'ratePerSqFt', label: 'दर प्रति चौ.फूट (₹)', type: 'number', required: true },
        { key: 'year', label: 'वर्ष', required: true, placeholder: 'उदा. 2024-25' },
        { key: 'zone', label: 'झोन' },
      ]}
    />
  );
}

// ================================================================
// TAB 9: DISABILITY (अपंगत्व) - auto-seed on empty
// ================================================================

function DisabilityTab() {
  return (
    <CrudList
      title="अपंगत्व"
      table="disability"
      colorKey="disability"
      icon={<Accessibility className="h-5 w-5" />}
      seedOnEmpty
      columns={[
        { key: 'disabilityType', label: 'अपंगत्व प्रकार' },
        { key: 'disabilityTypeMr', label: 'प्रकार (मराठी)' },
        { key: 'percentageRange', label: 'टक्के श्रेणी' },
        { key: 'description', label: 'वर्णन', render: (i) => String(i.description ?? '-') },
      ]}
      formFields={[
        { key: 'disabilityType', label: 'अपंगत्व प्रकार (English)', required: true },
        { key: 'disabilityTypeMr', label: 'अपंगत्व प्रकार (मराठी)', required: true },
        { key: 'percentageRange', label: 'टक्के श्रेणी', required: true, placeholder: 'उदा. 40-100' },
        { key: 'description', label: 'वर्णन', type: 'textarea', colSpan: 2 },
      ]}
    />
  );
}

// ================================================================
// TAB 10: EMPLOYEE (कर्मचारी)
// ================================================================

function EmployeeTab() {
  return (
    <CrudList
      title="कर्मचारी"
      table="employee"
      colorKey="employee"
      icon={<Users className="h-5 w-5" />}
      columns={[
        { key: 'employeeId', label: 'कर्मचारी क्र.' },
        { key: 'firstName', label: 'नाव', render: (i) => `${i.firstName || ''} ${i.middleName || ''} ${i.lastName || ''}`.trim() },
        { key: 'designation', label: 'पद' },
        { key: 'mobileNumber', label: 'मोबाईल' },
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-600 text-white">सक्रिय</Badge> : <Badge variant="destructive">निष्क्रिय</Badge> },
      ]}
      formFields={[
        { key: 'employeeId', label: 'कर्मचारी क्रमांक', required: true },
        { key: 'firstName', label: 'पहिले नाव', required: true },
        { key: 'middleName', label: 'मधले नाव' },
        { key: 'lastName', label: 'आडनाव', required: true },
        { key: 'firstNameMr', label: 'पहिले नाव (मराठी)', required: true },
        { key: 'middleNameMr', label: 'मधले नाव (मराठी)' },
        { key: 'lastNameMr', label: 'आडनाव (मराठी)' },
        { key: 'designation', label: 'पद', required: true },
        { key: 'designationMr', label: 'पद (मराठी)' },
        { key: 'mobileNumber', label: 'मोबाईल क्रमांक' },
        { key: 'aadhaarNumber', label: 'आधार क्रमांक' },
        { key: 'joinDate', label: 'रुजू दिनांक', placeholder: 'उदा. 2024-01-15' },
        { key: 'salary', label: 'पगार (₹)', type: 'number' },
        { key: 'isActive', label: 'सक्रिय', type: 'checkbox', placeholder: 'सक्रिय आहे' },
      ]}
    />
  );
}

// ================================================================
// TAB 11: TAX MASTER (कर मास्टर) - auto-seed, enable/disable, dynamic
// ================================================================

// Default 14 taxes
const DEFAULT_TAXES = [
  { name: 'House Tax', nameMarathi: 'गृहकर', rate: 12, isEnabled: true, order: 1, category: 'general' },
  { name: 'Water Tax', nameMarathi: 'पाणीकर', rate: 5, isEnabled: true, order: 2, category: 'general' },
  { name: 'Light Tax', nameMarathi: 'दिवाबत्ती कर', rate: 3, isEnabled: true, order: 3, category: 'general' },
  { name: 'Health Tax', nameMarathi: 'आरोग्य कर', rate: 2, isEnabled: true, order: 4, category: 'general' },
  { name: 'Education Tax', nameMarathi: 'शिक्षण कर', rate: 2, isEnabled: true, order: 5, category: 'general' },
  { name: 'Tree Tax', nameMarathi: 'वृक्ष कर', rate: 1, isEnabled: true, order: 6, category: 'general' },
  { name: 'Employment Tax', nameMarathi: 'रोजगार कर', rate: 2, isEnabled: true, order: 7, category: 'general' },
  { name: 'Drainage Tax', nameMarathi: 'नाला कर', rate: 3, isEnabled: true, order: 8, category: 'general' },
  { name: 'Sanitation Tax', nameMarathi: 'स्वच्छता कर', rate: 2, isEnabled: true, order: 9, category: 'general' },
  { name: 'Fire Tax', nameMarathi: 'अग्निशामक कर', rate: 1, isEnabled: true, order: 10, category: 'general' },
  { name: 'Special Tax', nameMarathi: 'विशेष कर', rate: 0, isEnabled: false, order: 11, category: 'other' },
  { name: 'Penalty', nameMarathi: 'दंड', rate: 0, isEnabled: true, order: 12, category: 'penalty' },
  { name: 'Interest', nameMarathi: 'व्याज', rate: 0, isEnabled: true, order: 13, category: 'interest' },
  { name: 'Other Charges', nameMarathi: 'इतर आकारणी', rate: 0, isEnabled: false, order: 14, category: 'other' },
];

// Map which Namuna forms each tax category appears in
const TAX_NAMUNA_MAP: Record<string, string[]> = {
  general: ['नमुना ८', 'नमुना ९', 'नमुना ९-क'],
  penalty: ['नमुना ८', 'नमुना ९'],
  interest: ['नमुना ८', 'नमुना ९'],
  other: ['नमुना ८'],
};

function TaxTab() {
  const [taxes, setTaxes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: '', nameMarathi: '', rate: 0, isEnabled: true, order: 0, category: 'general',
  });
  const [search, setSearch] = useState('');

  const c = tabColors.tax;

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      let result = await apiGet('tax');
      if (!Array.isArray(result)) result = [];
      if (result.length === 0) {
        await apiSeed('tax');
        result = await apiGet('tax');
        if (!Array.isArray(result)) result = [];
      }
      setTaxes(result);
    } catch {
      toast({ title: 'त्रुटी', description: 'कर मास्टर लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      const tax = taxes.find((t) => t.id === id);
      if (tax) {
        await apiUpdate('tax', { id, isEnabled, name: tax.name, nameMarathi: tax.nameMarathi, rate: tax.rate, order: tax.order, category: tax.category });
        setTaxes((prev) => prev.map((t) => (t.id === id ? { ...t, isEnabled } : t)));
        toast({
          title: 'यशस्वी',
          description: isEnabled
            ? `${String(tax.nameMarathi)} कर सक्षम केला - नमुना ८, ९, ९-क मध्ये दिसेल`
            : `${String(tax.nameMarathi)} कर अक्षम केला - नमुना ८, ९, ९-क मधून काढला जाईल`,
        });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'अपडेट अयशस्वी', variant: 'destructive' });
    }
  };

  const handleRateChange = async (id: string, rate: number) => {
    try {
      const tax = taxes.find((t) => t.id === id);
      if (tax) {
        await apiUpdate('tax', { id, rate, name: tax.name, nameMarathi: tax.nameMarathi, isEnabled: tax.isEnabled, order: tax.order, category: tax.category });
        setTaxes((prev) => prev.map((t) => (t.id === id ? { ...t, rate } : t)));
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'दर अपडेट अयशस्वी', variant: 'destructive' });
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: '', nameMarathi: '', rate: 0, isEnabled: true, order: taxes.length + 1, category: 'general' });
    setDialogOpen(true);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setFormData({
      name: item.name || '',
      nameMarathi: item.nameMarathi || '',
      rate: item.rate || 0,
      isEnabled: item.isEnabled ?? true,
      order: item.order || 0,
      category: item.category || 'general',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData: Record<string, unknown> = {
        ...formData,
        rate: parseFloat(String(formData.rate)) || 0,
        order: parseInt(String(formData.order)) || 0,
      };
      if (editItem?.id) saveData.id = editItem.id;
      await (editItem?.id ? apiUpdate('tax', saveData) : apiCreate('tax', saveData));
      toast({ title: 'यशस्वी', description: editItem?.id ? 'कर अपडेट झाला' : 'नवीन कर जोडला' });
      setDialogOpen(false);
      fetchTaxes();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'जतन अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('हा कर हटवायचा आहे का?')) return;
    try {
      await apiDelete('tax', id);
      toast({ title: 'यशस्वी', description: 'कर हटवला' });
      fetchTaxes();
    } catch {
      toast({ title: 'त्रुटी', description: 'हटवणे अयशस्वी', variant: 'destructive' });
    }
  };

  const filteredTaxes = taxes.filter((t) =>
    !search || String(t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.nameMarathi || '').includes(search) ||
    String(t.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'general': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border">सामान्य</Badge>;
      case 'penalty': return <Badge className="bg-red-100 text-red-800 border-red-200 border">दंड</Badge>;
      case 'interest': return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border">व्याज</Badge>;
      case 'other': return <Badge className="bg-purple-100 text-purple-800 border-purple-200 border">इतर</Badge>;
      default: return <Badge variant="outline">{cat}</Badge>;
    }
  };

  const getNamunaIndicator = (cat: string, isEnabled: boolean) => {
    const namunas = TAX_NAMUNA_MAP[cat] || [];
    if (!isEnabled) return null;
    return (
      <div className="flex items-center gap-1 mt-1">
        <Eye className="h-3 w-3 text-rose-600" />
        <span className="text-xs text-rose-600 font-medium">
          {namunas.join(', ')}
        </span>
      </div>
    );
  };

  const enabledCount = taxes.filter((t) => t.isEnabled).length;
  const disabledCount = taxes.length - enabledCount;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${c.header} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`${c.icon} p-2 rounded-lg text-white`}>
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">कर मास्टर</h3>
              <p className="text-xs text-white/70 mt-0.5">कर सक्षम/अक्षम केल्यास नमुना ८, ९, ९-क अपडेट होतील</p>
            </div>
            <Badge className={`${c.badge} border-0 font-bold text-sm`}>{filteredTaxes.length}</Badge>
            <Badge className="bg-green-100 text-green-800 border-0 text-xs">सक्षम: {enabledCount}</Badge>
            <Badge className="bg-red-100 text-red-800 border-0 text-xs">अक्षम: {disabledCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
              <Input className="pl-9 w-48 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30" placeholder="शोधा..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchTaxes} disabled={loading} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAdd} className={`bg-gradient-to-r ${c.header} text-white shadow-lg hover:opacity-90 border-0`}>
              <Plus className="h-4 w-4 mr-1" /> नवीन कर
            </Button>
          </div>
        </div>
      </div>

      <CardContent className={`${c.bg} p-4`}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto border rounded-lg border-white/50 shadow-sm">
            <Table>
              <ColoredTableHeader colorKey="tax">
                <ColoredTableHead colorKey="tax" className="w-12">क्र.</ColoredTableHead>
                <ColoredTableHead colorKey="tax">कर नाव</ColoredTableHead>
                <ColoredTableHead colorKey="tax">मराठी नाव</ColoredTableHead>
                <ColoredTableHead colorKey="tax" className="w-32">दर (₹)</ColoredTableHead>
                <ColoredTableHead colorKey="tax">वर्ग</ColoredTableHead>
                <ColoredTableHead colorKey="tax">नमुना</ColoredTableHead>
                <ColoredTableHead colorKey="tax" className="w-24 text-center">सक्षम</ColoredTableHead>
                <ColoredTableHead colorKey="tax" className="w-24 text-right">क्रिया</ColoredTableHead>
              </ColoredTableHeader>
              <TableBody>
                {filteredTaxes.map((tax, idx) => (
                  <TableRow key={String(tax.id)} className={`hover:bg-white/60 transition-colors ${!tax.isEnabled ? 'opacity-50 bg-gray-50' : ''}`}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{String(tax.name)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{String(tax.nameMarathi)}</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={Number(tax.rate)}
                        onChange={(e) => handleRateChange(String(tax.id), parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 text-sm"
                        min={0}
                        step={0.5}
                        disabled={!tax.isEnabled}
                      />
                    </TableCell>
                    <TableCell>{getCategoryBadge(String(tax.category || 'general'))}</TableCell>
                    <TableCell>{getNamunaIndicator(String(tax.category || 'general'), !!tax.isEnabled)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={!!tax.isEnabled}
                          onCheckedChange={(checked) => handleToggle(String(tax.id), checked)}
                        />
                        <span className={`text-xs font-medium ${tax.isEnabled ? 'text-green-600' : 'text-red-500'}`}>
                          {tax.isEnabled ? 'चालू' : 'बंद'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tax)} className="hover:bg-white/60">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(String(tax.id))} className="hover:bg-white/60">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tax propagation info */}
        <div className="mt-4 p-3 bg-white/60 rounded-lg border border-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <ToggleLeft className="h-4 w-4 text-rose-600" />
            <span className="text-sm font-semibold text-rose-800">डायनॅमिक कर लॉजिक</span>
          </div>
          <p className="text-xs text-rose-700">
            कर सक्षम/अक्षम केल्यास ते आपोआप नमुना ८ (मालमत्ता कर विवरण), नमुना ९ (कर आकारणी), नमुना ९-क (कर वसुली) या फॉर्ममध्ये दिसेल किंवा लपेल.
            सामान्य कर तिन्ही नमुनांमध्ये दिसतात, दंड व व्याज नमुना ८ व ९ मध्ये दिसतात, इतर केवळ नमुना ८ मध्ये.
          </p>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${c.text}`}>
              <div className={`${c.icon} p-1.5 rounded text-white`}><Settings className="h-4 w-4" /></div>
              {editItem ? 'कर संपादा' : 'नवीन कर'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <Label className="text-sm">कर नाव (English) <span className="text-red-500">*</span></Label>
              <Input value={String(formData.name || '')} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">कर नाव (मराठी) <span className="text-red-500">*</span></Label>
              <Input value={String(formData.nameMarathi || '')} onChange={(e) => setFormData((p) => ({ ...p, nameMarathi: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">दर (₹)</Label>
              <Input type="number" value={Number(formData.rate)} onChange={(e) => setFormData((p) => ({ ...p, rate: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">क्रम</Label>
              <Input type="number" value={Number(formData.order)} onChange={(e) => setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">वर्ग</Label>
              <Select value={String(formData.category || 'general')} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">सामान्य</SelectItem>
                  <SelectItem value="penalty">दंड</SelectItem>
                  <SelectItem value="interest">व्याज</SelectItem>
                  <SelectItem value="other">इतर</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex items-center gap-2 pt-6">
              <Checkbox checked={!!formData.isEnabled} onCheckedChange={(c) => setFormData((p) => ({ ...p, isEnabled: !!c }))} />
              <Label className="text-sm">सक्षम</Label>
            </div>
            {/* Namuna indicator in dialog */}
            <div className="sm:col-span-2 p-2 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-medium">हा कर खालील नमुन्यांमध्ये दिसेल:</span>
                <span className="font-bold">{(TAX_NAMUNA_MAP[String(formData.category || 'general')] || []).join(', ')}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" /> रद्द</Button>
            <Button onClick={handleSave} disabled={saving} className={`bg-gradient-to-r ${c.header} text-white border-0 hover:opacity-90`}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              जतन करा
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ================================================================
// TAB 12: PROPERTY (मालमत्ता) - Complex with owners & tax rates
// ================================================================

interface PropertyItem {
  id: string;
  propertyNumber: string;
  wardId?: string;
  roadId?: string;
  citySurveyNo?: string;
  area?: number;
  builtUpArea?: number;
  boundaries?: string;
  constructionType?: string;
  usageType?: string;
  floorInfo?: string;
  yearBuilt?: string;
  propertyStatus?: string;
  waterConnectionId?: string;
  boundaryEast?: string;
  boundaryWest?: string;
  boundarySouth?: string;
  boundaryNorth?: string;
  lengthEast?: number;
  widthEast?: number;
  lengthWest?: number;
  widthWest?: number;
  lengthSouth?: number;
  widthSouth?: number;
  lengthNorth?: number;
  widthNorth?: number;
  totalLength?: number;
  totalWidth?: number;
  depreciationRate?: number;
  usageFactor?: number;
  taxRate?: number;
  houseTax?: number;
  lightTax?: number;
  healthTax?: number;
  waterTax?: number;
  constructionDetails?: string;
  ward?: { id: string; wardNumber: string; wardName: string; wardNameMr: string };
  road?: { id: string; roadNumber: string; roadName: string; roadNameMr: string };
  owners?: { id: string; ownerId: string; ownershipType: string; owner: { id: string; ownerNumber: string; firstName: string; lastName: string; firstNameMr: string; lastNameMr: string } }[];
  taxRates?: { id: string; taxMasterId: string; rate: number; taxMaster: { id: string; name: string; nameMarathi: string; isEnabled: boolean } }[];
}

interface TaxMasterItem {
  id: string;
  name: string;
  nameMarathi: string;
  rate: number;
  isEnabled: boolean;
  order: number;
  category: string;
}

function PropertyTab() {
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PropertyItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [wards, setWards] = useState<Record<string, unknown>[]>([]);
  const [roads, setRoads] = useState<Record<string, unknown>[]>([]);
  const [owners, setOwners] = useState<Record<string, unknown>[]>([]);
  const [taxMasters, setTaxMasters] = useState<TaxMasterItem[]>([]);

  const c = tabColors.property;

  const [formData, setFormData] = useState<Record<string, unknown>>({
    propertyNumber: '',
    wardId: '',
    roadId: '',
    citySurveyNo: '',
    area: '',
    builtUpArea: '',
    boundaries: '',
    constructionType: '',
    usageType: '',
    floorInfo: '',
    yearBuilt: '',
    propertyStatus: 'Active',
    waterConnectionId: '',
    boundaryEast: '',
    boundaryWest: '',
    boundaryNorth: '',
    boundarySouth: '',
    lengthEast: '',
    widthEast: '',
    lengthWest: '',
    widthWest: '',
    lengthSouth: '',
    widthSouth: '',
    lengthNorth: '',
    widthNorth: '',
    totalLength: '',
    totalWidth: '',
    depreciationRate: '',
    usageFactor: '',
    taxRate: '',
    houseTax: '',
    lightTax: '',
    healthTax: '',
    waterTax: '',
  });
  const [selectedOwners, setSelectedOwners] = useState<{ ownerId: string; ownershipType: string }[]>([]);
  const [selectedTaxRates, setSelectedTaxRates] = useState<{ taxMasterId: string; rate: number }[]>([]);

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    try {
      let result = await apiGet('property', search || undefined);
      if (!Array.isArray(result)) result = result ? [result] : [];
      setItems(result as PropertyItem[]);
    } catch {
      toast({ title: 'त्रुटी', description: 'मालमत्ता डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchMasters = useCallback(async () => {
    try {
      const [w, r, o, t] = await Promise.all([apiGet('ward'), apiGet('road'), apiGet('owner'), apiGet('tax')]);
      setWards(Array.isArray(w) ? w : []);
      setRoads(Array.isArray(r) ? r : []);
      setOwners(Array.isArray(o) ? o : []);
      setTaxMasters(Array.isArray(t) ? (t as TaxMasterItem[]).filter((tx) => tx.isEnabled) : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchProperty(); fetchMasters(); }, [fetchProperty, fetchMasters]);

  const handleAdd = () => {
    setEditItem(null);
    setFormData({
      propertyNumber: '', wardId: '', roadId: '', citySurveyNo: '',
      area: '', builtUpArea: '', boundaries: '', constructionType: '',
      usageType: '', floorInfo: '', yearBuilt: '', propertyStatus: 'Active',
      waterConnectionId: '', boundaryEast: '', boundaryWest: '', boundaryNorth: '', boundarySouth: '',
      lengthEast: '', widthEast: '', lengthWest: '', widthWest: '',
      lengthSouth: '', widthSouth: '', lengthNorth: '', widthNorth: '',
      totalLength: '', totalWidth: '', depreciationRate: '', usageFactor: '1',
      taxRate: '', houseTax: '', lightTax: '', healthTax: '', waterTax: '',
    });
    setSelectedOwners([]);
    setSelectedTaxRates(taxMasters.map((t) => ({ taxMasterId: t.id, rate: t.rate })));
    setDialogOpen(true);
  };

  const handleEdit = (item: PropertyItem) => {
    setEditItem(item);
    // Parse boundaries if it's JSON
    let boundaryEast = '';
    let boundaryWest = '';
    let boundaryNorth = '';
    let boundarySouth = '';
    try {
      if (item.boundaries) {
        const b = typeof item.boundaries === 'string' ? JSON.parse(item.boundaries) : item.boundaries;
        boundaryEast = b.east || b.purv || '';
        boundaryWest = b.west || b.paschim || '';
        boundaryNorth = b.north || b.uttar || '';
        boundarySouth = b.south || b.dakshin || '';
      }
    } catch {
      // boundaries is plain text
    }

    setFormData({
      propertyNumber: item.propertyNumber || '',
      wardId: item.wardId || '',
      roadId: item.roadId || '',
      citySurveyNo: item.citySurveyNo || '',
      area: item.area ?? '',
      builtUpArea: item.builtUpArea ?? '',
      boundaries: item.boundaries || '',
      constructionType: item.constructionType || '',
      usageType: item.usageType || '',
      floorInfo: item.floorInfo || '',
      yearBuilt: item.yearBuilt || '',
      propertyStatus: item.propertyStatus || 'Active',
      waterConnectionId: item.waterConnectionId || '',
      boundaryEast: item.boundaryEast || boundaryEast,
      boundaryWest: item.boundaryWest || boundaryWest,
      boundaryNorth: item.boundaryNorth || boundaryNorth,
      boundarySouth: item.boundarySouth || boundarySouth,
      lengthEast: (item as Record<string, unknown>).lengthEast ?? '',
      widthEast: (item as Record<string, unknown>).widthEast ?? '',
      lengthWest: (item as Record<string, unknown>).lengthWest ?? '',
      widthWest: (item as Record<string, unknown>).widthWest ?? '',
      lengthSouth: (item as Record<string, unknown>).lengthSouth ?? '',
      widthSouth: (item as Record<string, unknown>).widthSouth ?? '',
      lengthNorth: (item as Record<string, unknown>).lengthNorth ?? '',
      widthNorth: (item as Record<string, unknown>).widthNorth ?? '',
      totalLength: (item as Record<string, unknown>).totalLength ?? '',
      totalWidth: (item as Record<string, unknown>).totalWidth ?? '',
      depreciationRate: (item as Record<string, unknown>).depreciationRate ?? '',
      usageFactor: (item as Record<string, unknown>).usageFactor ?? '1',
      taxRate: (item as Record<string, unknown>).taxRate ?? '',
      houseTax: (item as Record<string, unknown>).houseTax ?? '',
      lightTax: (item as Record<string, unknown>).lightTax ?? '',
      healthTax: (item as Record<string, unknown>).healthTax ?? '',
      waterTax: (item as Record<string, unknown>).waterTax ?? '',
    });
    setSelectedOwners(
      item.owners?.map((o) => ({ ownerId: o.ownerId, ownershipType: o.ownershipType })) || []
    );
    setSelectedTaxRates(
      item.taxRates?.map((tr) => ({ taxMasterId: tr.taxMasterId, rate: tr.rate })) ||
      taxMasters.map((t) => ({ taxMasterId: t.id, rate: t.rate }))
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData: Record<string, unknown> = { ...formData };
      if (editItem?.id) saveData.id = editItem.id;
      // Convert numeric
      if (saveData.area !== undefined && saveData.area !== '') saveData.area = parseFloat(String(saveData.area)) || null;
      else saveData.area = null;
      if (saveData.builtUpArea !== undefined && saveData.builtUpArea !== '') saveData.builtUpArea = parseFloat(String(saveData.builtUpArea)) || null;
      else saveData.builtUpArea = null;
      // Empty strings to null for foreign keys
      if (!saveData.wardId) saveData.wardId = null;
      if (!saveData.roadId) saveData.roadId = null;
      if (!saveData.waterConnectionId) saveData.waterConnectionId = null;

      // Combine boundary fields into JSON
      const boundaryObj = {
        east: saveData.boundaryEast || '',
        west: saveData.boundaryWest || '',
        north: saveData.boundaryNorth || '',
        south: saveData.boundarySouth || '',
      };
      saveData.boundaries = JSON.stringify(boundaryObj);
      delete saveData.boundaryEast;
      delete saveData.boundaryWest;
      delete saveData.boundaryNorth;
      delete saveData.boundarySouth;

      saveData.owners = selectedOwners;
      saveData.taxRates = selectedTaxRates.filter((tr) => tr.rate > 0);

      await (editItem?.id ? apiUpdate('property', saveData) : apiCreate('property', saveData));
      toast({ title: 'यशस्वी', description: editItem?.id ? 'मालमत्ता अपडेट झाली' : 'नवीन मालमत्ता जोडली' });
      setDialogOpen(false);
      fetchProperty();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'जतन अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ही मालमत्ता हटवायची आहे का?')) return;
    setDeleting(id);
    try {
      await apiDelete('property', id);
      toast({ title: 'यशस्वी', description: 'मालमत्ता हटवली' });
      fetchProperty();
    } catch (err: unknown) {
      toast({ title: 'त्रुटी', description: err instanceof Error ? err.message : 'हटवणे अयशस्वी', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const addOwnerRow = () => {
    setSelectedOwners((prev) => [...prev, { ownerId: '', ownershipType: 'मालक' }]);
  };

  const removeOwnerRow = (idx: number) => {
    setSelectedOwners((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOwnerRow = (idx: number, field: 'ownerId' | 'ownershipType', value: string) => {
    setSelectedOwners((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  };

  const updateTaxRate = (taxMasterId: string, rate: number) => {
    setSelectedTaxRates((prev) => {
      const exists = prev.find((t) => t.taxMasterId === taxMasterId);
      if (exists) return prev.map((t) => (t.taxMasterId === taxMasterId ? { ...t, rate } : t));
      return [...prev, { taxMasterId, rate }];
    });
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${c.header} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`${c.icon} p-2 rounded-lg text-white`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">मालमत्ता</h3>
              <p className="text-xs text-white/70">मालक जोडणी, कर दर, सीमा माहिती</p>
            </div>
            <Badge className={`${c.badge} border-0 font-bold text-sm`}>{items.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
              <Input className="pl-9 w-48 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30" placeholder="शोधा..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchProperty} disabled={loading} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAdd} className={`bg-gradient-to-r ${c.header} text-white shadow-lg hover:opacity-90 border-0`}>
              <Plus className="h-4 w-4 mr-1" /> नवीन
            </Button>
          </div>
        </div>
      </div>

      <CardContent className={`${c.bg} p-4`}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">कोणतीही मालमत्ता नाही</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg border-white/50 shadow-sm">
            <Table>
              <ColoredTableHeader colorKey="property">
                <ColoredTableHead colorKey="property" className="w-12">क्र.</ColoredTableHead>
                <ColoredTableHead colorKey="property">मालमत्ता क्र.</ColoredTableHead>
                <ColoredTableHead colorKey="property">मालक</ColoredTableHead>
                <ColoredTableHead colorKey="property">वार्ड</ColoredTableHead>
                <ColoredTableHead colorKey="property">रस्ता</ColoredTableHead>
                <ColoredTableHead colorKey="property">वापर</ColoredTableHead>
                <ColoredTableHead colorKey="property">क्षेत्रफळ</ColoredTableHead>
                <ColoredTableHead colorKey="property">स्थिती</ColoredTableHead>
                <ColoredTableHead colorKey="property" className="w-24 text-right">क्रिया</ColoredTableHead>
              </ColoredTableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-white/60">
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.propertyNumber}</TableCell>
                    <TableCell>
                      {item.owners?.map((o) => `${o.owner.firstNameMr || o.owner.firstName} ${o.owner.lastNameMr || o.owner.lastName}`).join(', ') || '-'}
                    </TableCell>
                    <TableCell>{item.ward?.wardNameMr || item.ward?.wardName || '-'}</TableCell>
                    <TableCell>{item.road?.roadNameMr || item.road?.roadName || '-'}</TableCell>
                    <TableCell>{item.usageType || '-'}</TableCell>
                    <TableCell>{item.area ? `${item.area} चौ.मी.` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.propertyStatus === 'Active' ? 'default' : 'destructive'}>
                        {item.propertyStatus === 'Active' ? 'सक्रिय' : item.propertyStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="hover:bg-white/60">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="hover:bg-white/60">
                          {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${c.text}`}>
              <div className={`${c.icon} p-1.5 rounded text-white`}><Building2 className="h-4 w-4" /></div>
              {editItem ? 'मालमत्ता संपादा' : 'नवीन मालमत्ता'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Property Info */}
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${c.text}`}>
                <div className={`${c.icon} p-1 rounded text-white`}><Home className="h-3.5 w-3.5" /></div>
                मालमत्ता माहिती
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">मालमत्ता क्रमांक <span className="text-red-500">*</span></Label>
                  <Input value={String(formData.propertyNumber || '')} onChange={(e) => setFormData((p) => ({ ...p, propertyNumber: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">वार्ड</Label>
                  <Select value={String(formData.wardId || '__none__')} onValueChange={(v) => setFormData((p) => ({ ...p, wardId: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="वार्ड निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणताही नाही</SelectItem>
                      {wards.map((w) => (
                        <SelectItem key={String(w.id)} value={String(w.id)}>
                          {String(w.wardNumber)} - {String(w.wardNameMr || w.wardName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">रस्ता</Label>
                  <Select value={String(formData.roadId || '__none__')} onValueChange={(v) => setFormData((p) => ({ ...p, roadId: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="रस्ता निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणताही नाही</SelectItem>
                      {roads.map((r) => (
                        <SelectItem key={String(r.id)} value={String(r.id)}>
                          {String(r.roadNumber)} - {String(r.roadNameMr || r.roadName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">शहर सर्वेक्षण क्र.</Label>
                  <Input value={String(formData.citySurveyNo || '')} onChange={(e) => setFormData((p) => ({ ...p, citySurveyNo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">क्षेत्रफळ (चौ.मी.)</Label>
                  <Input type="number" value={String(formData.area ?? '')} onChange={(e) => setFormData((p) => ({ ...p, area: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">बांधलेले क्षेत्रफळ (चौ.मी.)</Label>
                  <Input type="number" value={String(formData.builtUpArea ?? '')} onChange={(e) => setFormData((p) => ({ ...p, builtUpArea: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">बांधकाम प्रकार</Label>
                  <Select value={String(formData.constructionType || '__none__')} onValueChange={(v) => setFormData((p) => ({ ...p, constructionType: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणताही नाही</SelectItem>
                      <SelectItem value="झोपडी किंवा मातीचे घर">झोपडी किंवा मातीचे घर</SelectItem>
                      <SelectItem value="दगड विटा/मातीचे बांधकाम">दगड विटा/मातीचे बांधकाम</SelectItem>
                      <SelectItem value="दगड विट/सिमेंटचे बांधकाम">दगड विट/सिमेंटचे बांधकाम</SelectItem>
                      <SelectItem value="आर.सि.सि. बांधकाम">आर.सि.सि. बांधकाम</SelectItem>
                      <SelectItem value="पहिला मजला">पहिला मजला</SelectItem>
                      <SelectItem value="जमीन/खुली जागा">जमीन/खुली जागा</SelectItem>
                      <SelectItem value="पक्के">पक्के</SelectItem>
                      <SelectItem value="अर्धपक्के">अर्धपक्के</SelectItem>
                      <SelectItem value="कच्चे">कच्चे</SelectItem>
                      <SelectItem value="इतर">इतर</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">वापर प्रकार</Label>
                  <Select value={String(formData.usageType || '__none__')} onValueChange={(v) => setFormData((p) => ({ ...p, usageType: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणताही नाही</SelectItem>
                      <SelectItem value="राहणीमान">राहणीमान</SelectItem>
                      <SelectItem value="व्यावसायिक">व्यावसायिक</SelectItem>
                      <SelectItem value="औद्योगिक">औद्योगिक</SelectItem>
                      <SelectItem value="शेती">शेती</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">मजला माहिती</Label>
                  <Input value={String(formData.floorInfo || '')} onChange={(e) => setFormData((p) => ({ ...p, floorInfo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">बांधणी वर्ष</Label>
                  <Input value={String(formData.yearBuilt || '')} onChange={(e) => setFormData((p) => ({ ...p, yearBuilt: e.target.value }))} placeholder="उदा. 2020" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">स्थिती</Label>
                  <Select value={String(formData.propertyStatus || 'Active')} onValueChange={(v) => setFormData((p) => ({ ...p, propertyStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">सक्रिय</SelectItem>
                      <SelectItem value="Inactive">निष्क्रिय</SelectItem>
                      <SelectItem value="Demolished">विध्वंस</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Boundaries (चतु:सीमा) */}
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${c.text}`}>
                <div className={`${c.icon} p-1 rounded text-white`}><Compass className="h-3.5 w-3.5" /></div>
                चतु:सीमा (Boundaries) - नमुना ८
              </h4>
              <div className="space-y-4">
                {[
                  { dir: 'East', label: 'पूर्व', bKey: 'boundaryEast', lKey: 'lengthEast', wKey: 'widthEast' },
                  { dir: 'West', label: 'पश्चिम', bKey: 'boundaryWest', lKey: 'lengthWest', wKey: 'widthWest' },
                  { dir: 'South', label: 'दक्षिण', bKey: 'boundarySouth', lKey: 'lengthSouth', wKey: 'widthSouth' },
                  { dir: 'North', label: 'उत्तर', bKey: 'boundaryNorth', lKey: 'lengthNorth', wKey: 'widthNorth' },
                ].map((b) => (
                  <div key={b.dir} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-white/50">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">{b.label} ({b.dir}) सीमा नाव</Label>
                      <Input value={String(formData[b.bKey] || '')} onChange={(e) => setFormData((p) => ({ ...p, [b.bKey]: e.target.value }))} placeholder={`${b.label}ेकडील सीमा`} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">लांबी (मी./फूट)</Label>
                      <Input type="number" value={String(formData[b.lKey] ?? '')} onChange={(e) => setFormData((p) => ({ ...p, [b.lKey]: e.target.value }))} placeholder="लांबी" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">रुंदी (मी./फूट)</Label>
                      <Input type="number" value={String(formData[b.wKey] ?? '')} onChange={(e) => setFormData((p) => ({ ...p, [b.wKey]: e.target.value }))} placeholder="रुंदी" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Namuna 8 Tax Calculation Fields */}
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${c.text}`}>
                <div className={`${c.icon} p-1 rounded text-white`}><Calculator className="h-3.5 w-3.5" /></div>
                नमुना ८ कर गणना (Tax Calculation)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">घसारा दर (Depreciation)</Label>
                  <Input type="number" step="0.1" value={String(formData.depreciationRate ?? '')} onChange={(e) => setFormData((p) => ({ ...p, depreciationRate: e.target.value }))} placeholder="उदा. 0.7" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">वापरानुसार भारांक (Usage Factor)</Label>
                  <Input type="number" step="0.1" value={String(formData.usageFactor ?? '1')} onChange={(e) => setFormData((p) => ({ ...p, usageFactor: e.target.value }))} placeholder="उदा. 1.0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">कर दर % (Tax Rate)</Label>
                  <Input type="number" step="0.1" value={String(formData.taxRate ?? '')} onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.value }))} placeholder="उदा. 1.2" />
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50">
                <p className="text-xs font-semibold text-amber-800 mb-2">कर रक्कम (Tax Amounts in ₹)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">घरपट्टी (House Tax)</Label>
                    <Input type="number" value={String(formData.houseTax ?? '')} onChange={(e) => setFormData((p) => ({ ...p, houseTax: e.target.value }))} placeholder="₹" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">दिवाबत्ती कर (Light Tax)</Label>
                    <Input type="number" value={String(formData.lightTax ?? '')} onChange={(e) => setFormData((p) => ({ ...p, lightTax: e.target.value }))} placeholder="₹" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">आरोग्यरक्षण कर (Health Tax)</Label>
                    <Input type="number" value={String(formData.healthTax ?? '')} onChange={(e) => setFormData((p) => ({ ...p, healthTax: e.target.value }))} placeholder="₹" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">सा. पाणीपट्टी (Water Tax)</Label>
                    <Input type="number" value={String(formData.waterTax ?? '')} onChange={(e) => setFormData((p) => ({ ...p, waterTax: e.target.value }))} placeholder="₹" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Owner Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold flex items-center gap-2 ${c.text}`}>
                  <div className={`${c.icon} p-1 rounded text-white`}><User className="h-3.5 w-3.5" /></div>
                  मालक माहिती
                </h4>
                <Button variant="outline" size="sm" onClick={addOwnerRow} className={`${c.text} border-current`}>
                  <Plus className="h-4 w-4 mr-1" /> मालक जोडा
                </Button>
              </div>
              {selectedOwners.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 border rounded-lg border-dashed">
                  कोणताही मालक जोडलेला नाही. &quot;मालक जोडा&quot; बटण क्लिक करा.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOwners.map((o, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-3 border rounded-lg bg-white/50">
                      <div className="space-y-1 flex-1 w-full sm:w-auto">
                        <Label className="text-sm">मालक</Label>
                        <Select value={o.ownerId} onValueChange={(v) => updateOwnerRow(idx, 'ownerId', v)}>
                          <SelectTrigger><SelectValue placeholder="मालक निवडा" /></SelectTrigger>
                          <SelectContent>
                            {owners.map((ow) => (
                              <SelectItem key={String(ow.id)} value={String(ow.id)}>
                                {String(ow.ownerNumber)} - {String(ow.firstNameMr || ow.firstName)} {String(ow.lastNameMr || ow.lastName)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 w-full sm:w-40">
                        <Label className="text-sm">मालकी प्रकार</Label>
                        <Select value={o.ownershipType} onValueChange={(v) => updateOwnerRow(idx, 'ownershipType', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="मालक">मालक</SelectItem>
                            <SelectItem value="भोगवटादार">भोगवटादार</SelectItem>
                            <SelectItem value="कर्ता">कर्ता</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeOwnerRow(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Tax Rate Assignment */}
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${c.text}`}>
                <div className={`${c.icon} p-1 rounded text-white`}><Settings className="h-3.5 w-3.5" /></div>
                कर दर सेटिंग
              </h4>
              {taxMasters.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">कोणताही सक्षम कर नाही. कर मास्टर तयार करा.</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <ColoredTableHeader colorKey="property">
                      <ColoredTableHead colorKey="property">कर नाव</ColoredTableHead>
                      <ColoredTableHead colorKey="property">मराठी नाव</ColoredTableHead>
                      <ColoredTableHead colorKey="property" className="w-32">दर (₹)</ColoredTableHead>
                    </ColoredTableHeader>
                    <TableBody>
                      {taxMasters.map((tax) => {
                        const tr = selectedTaxRates.find((t) => t.taxMasterId === tax.id);
                        return (
                          <TableRow key={tax.id} className="hover:bg-white/60">
                            <TableCell className="font-medium">{tax.name}</TableCell>
                            <TableCell>{tax.nameMarathi}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={tr?.rate ?? tax.rate}
                                onChange={(e) => updateTaxRate(tax.id, parseFloat(e.target.value) || 0)}
                                className="h-8 w-24 text-sm"
                                min={0}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" /> रद्द करा
            </Button>
            <Button onClick={handleSave} disabled={saving} className={`bg-gradient-to-r ${c.header} text-white border-0 hover:opacity-90`}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? 'जतन करत आहे...' : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ================================================================
// TAB 13: FINANCIAL YEAR (वित्तीय वर्ष) - uses 'village' color key (teal)
// ================================================================

function FinancialYearTab() {
  return (
    <CrudList
      title="वित्तीय वर्ष"
      table="fy"
      colorKey="village"
      icon={<CalendarDays className="h-5 w-5" />}
      seedOnEmpty
      columns={[
        { key: 'year', label: 'वर्ष' },
        { key: 'startDate', label: 'सुरू दिनांक' },
        { key: 'endDate', label: 'शेवटचा दिनांक' },
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-100 text-green-800 border-0">होय</Badge> : 'नाही' },
        { key: 'isLocked', label: 'लॉक', render: (i) => i.isLocked ? <Badge className="bg-red-100 text-red-800 border-0">लॉक</Badge> : <Badge className="bg-gray-100 text-gray-600 border-0">उघडे</Badge> },
      ]}
      formFields={[
        { key: 'year', label: 'वित्तीय वर्ष (उदा. 2024-25)', required: true },
        { key: 'startDate', label: 'सुरू दिनांक (YYYY-MM-DD)', required: true, placeholder: '2024-04-01' },
        { key: 'endDate', label: 'शेवटचा दिनांक (YYYY-MM-DD)', required: true, placeholder: '2025-03-31' },
        { key: 'isActive', label: 'सक्रिय वर्ष', type: 'checkbox', placeholder: 'हे सध्याचे सक्रिय वर्ष आहे' },
        { key: 'isLocked', label: 'लॉक', type: 'checkbox', placeholder: 'हे वर्ष लॉक करा' },
      ]}
      defaultFormData={{ isActive: false, isLocked: false }}
    />
  );
}

// ================================================================
// TAB 14: BANK ACCOUNT (बँक खाते) - uses 'bank' color key (emerald)
// ================================================================

function BankAccountTab() {
  return (
    <CrudList
      title="बँक खाते"
      table="bank"
      colorKey="bank"
      icon={<PiggyBank className="h-5 w-5" />}
      columns={[
        { key: 'accountNumber', label: 'खाते क्र.' },
        { key: 'bankName', label: 'बँकेचे नाव' },
        { key: 'branchName', label: 'शाखा' },
        { key: 'ifscCode', label: 'IFSC कोड' },
        { key: 'accountType', label: 'खाते प्रकार' },
        { key: 'balance', label: 'शिल्लक', render: (i) => `₹${Number(i.balance || 0).toLocaleString('mr-IN')}` },
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-100 text-green-800 border-0">होय</Badge> : 'नाही' },
      ]}
      formFields={[
        { key: 'accountNumber', label: 'खाते क्रमांक', required: true },
        { key: 'bankName', label: 'बँकेचे नाव', required: true },
        { key: 'branchName', label: 'शाखेचे नाव' },
        { key: 'ifscCode', label: 'IFSC कोड' },
        { key: 'accountType', label: 'खाते प्रकार', type: 'select', required: true, options: [
          { value: 'Savings', label: 'बचत (Savings)' },
          { value: 'Current', label: 'चालू (Current)' },
          { value: 'FD', label: 'मुदत ठेव (FD)' },
        ]},
        { key: 'balance', label: 'शिल्लक रक्कम (₹)', type: 'number' },
        { key: 'isActive', label: 'सक्रिय', type: 'checkbox', placeholder: 'खाते सक्रिय आहे' },
      ]}
      defaultFormData={{ accountType: 'Savings', balance: 0, isActive: true }}
    />
  );
}

// ================================================================
// TAB 15: BUDGET HEAD (बजेट शिर्ष) - uses 'tax' color key (rose)
// ================================================================

function BudgetHeadTab() {
  return (
    <CrudList
      title="बजेट शिर्ष"
      table="budget-head"
      colorKey="tax"
      icon={<BanknoteIcon className="h-5 w-5" />}
      seedOnEmpty
      columns={[
        { key: 'code', label: 'कोड' },
        { key: 'name', label: 'नाव' },
        { key: 'nameMr', label: 'नाव (मराठी)' },
        { key: 'category', label: 'वर्ग', render: (i) => {
          const catMap: Record<string, { label: string; cls: string }> = {
            income: { label: 'उत्पन्न', cls: 'bg-green-100 text-green-800' },
            expenditure: { label: 'खर्च', cls: 'bg-red-100 text-red-800' },
            asset: { label: 'मालमत्ता', cls: 'bg-amber-100 text-amber-800' },
            liability: { label: 'दायित्व', cls: 'bg-purple-100 text-purple-800' },
          };
          const cat = catMap[String(i.category)] || { label: String(i.category ?? '-'), cls: 'bg-gray-100 text-gray-800' };
          return <Badge className={`${cat.cls} border-0`}>{cat.label}</Badge>;
        }},
        { key: 'type', label: 'प्रकार', render: (i) => {
          const typeMap: Record<string, { label: string; cls: string }> = {
            revenue: { label: 'महसूल', cls: 'bg-teal-100 text-teal-800' },
            capital: { label: 'भांडवल', cls: 'bg-indigo-100 text-indigo-800' },
          };
          const t = typeMap[String(i.type)] || { label: String(i.type ?? '-'), cls: 'bg-gray-100 text-gray-800' };
          return <Badge className={`${t.cls} border-0`}>{t.label}</Badge>;
        }},
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-100 text-green-800 border-0">होय</Badge> : 'नाही' },
      ]}
      formFields={[
        { key: 'code', label: 'शिर्ष कोड', required: true },
        { key: 'name', label: 'शिर्ष नाव (English)', required: true },
        { key: 'nameMr', label: 'शिर्ष नाव (मराठी)', required: true },
        { key: 'category', label: 'वर्ग', type: 'select', required: true, options: [
          { value: 'income', label: 'उत्पन्न (Income)' },
          { value: 'expenditure', label: 'खर्च (Expenditure)' },
          { value: 'asset', label: 'मालमत्ता (Asset)' },
          { value: 'liability', label: 'दायित्व (Liability)' },
        ]},
        { key: 'type', label: 'प्रकार', type: 'select', required: true, options: [
          { value: 'revenue', label: 'महसूल (Revenue)' },
          { value: 'capital', label: 'भांडवल (Capital)' },
        ]},
        { key: 'parentCode', label: 'पालक शिर्ष कोड' },
        { key: 'isActive', label: 'सक्रिय', type: 'checkbox', placeholder: 'शिर्ष सक्रिय आहे' },
      ]}
      defaultFormData={{ category: 'income', type: 'revenue', isActive: true }}
    />
  );
}

// ================================================================
// TAB 16: SCHEME (योजना) - uses 'owner' color key (purple)
// ================================================================

function SchemeTab() {
  return (
    <CrudList
      title="योजना"
      table="scheme"
      colorKey="owner"
      icon={<FolderOpen className="h-5 w-5" />}
      columns={[
        { key: 'schemeNumber', label: 'योजना क्र.' },
        { key: 'schemeName', label: 'योजना नाव' },
        { key: 'schemeNameMr', label: 'योजना नाव (मराठी)' },
        { key: 'schemeType', label: 'प्रकार', render: (i) => {
          const typeMap: Record<string, { label: string; cls: string }> = {
            Central: { label: 'केंद्र', cls: 'bg-amber-100 text-amber-800' },
            State: { label: 'राज्य', cls: 'bg-blue-100 text-blue-800' },
            GP: { label: 'ग्रामपंचायत', cls: 'bg-green-100 text-green-800' },
          };
          const t = typeMap[String(i.schemeType)] || { label: String(i.schemeType ?? '-'), cls: 'bg-gray-100 text-gray-800' };
          return <Badge className={`${t.cls} border-0`}>{t.label}</Badge>;
        }},
        { key: 'totalAllocation', label: 'एकूण तरतूद', render: (i) => `₹${Number(i.totalAllocation || 0).toLocaleString('mr-IN')}` },
        { key: 'financialYear', label: 'वित्तीय वर्ष' },
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-100 text-green-800 border-0">होय</Badge> : 'नाही' },
      ]}
      formFields={[
        { key: 'schemeNumber', label: 'योजना क्रमांक', required: true },
        { key: 'schemeName', label: 'योजना नाव (English)', required: true },
        { key: 'schemeNameMr', label: 'योजना नाव (मराठी)', required: true },
        { key: 'schemeType', label: 'योजना प्रकार', type: 'select', required: true, options: [
          { value: 'Central', label: 'केंद्र सरकार (Central)' },
          { value: 'State', label: 'राज्य सरकार (State)' },
          { value: 'GP', label: 'ग्रामपंचायत (GP)' },
        ]},
        { key: 'fundSource', label: 'निधी स्रोत' },
        { key: 'totalAllocation', label: 'एकूण तरतूद (₹)', type: 'number' },
        { key: 'financialYear', label: 'वित्तीय वर्ष' },
        { key: 'isActive', label: 'सक्रिय', type: 'checkbox', placeholder: 'योजना सक्रिय आहे' },
      ]}
      defaultFormData={{ schemeType: 'State', totalAllocation: 0, isActive: true }}
    />
  );
}

// ================================================================
// TAB 17: CONTRACTOR (कंत्राटदार) - uses 'employee' color key (indigo)
// ================================================================

function ContractorTab() {
  return (
    <CrudList
      title="कंत्राटदार"
      table="contractor"
      colorKey="employee"
      icon={<HardHat className="h-5 w-5" />}
      columns={[
        { key: 'contractorId', label: 'कंत्राटदार क्र.' },
        { key: 'firstName', label: 'नाव', render: (i) => `${i.firstName || ''} ${i.middleName || ''} ${i.lastName || ''}`.trim() },
        { key: 'firmName', label: 'फर्म नाव' },
        { key: 'mobileNumber', label: 'मोबाईल' },
        { key: 'panNumber', label: 'PAN' },
        { key: 'gstNumber', label: 'GST' },
        { key: 'isActive', label: 'सक्रिय', render: (i) => i.isActive ? <Badge className="bg-green-100 text-green-800 border-0">होय</Badge> : 'नाही' },
      ]}
      formFields={[
        { key: 'contractorId', label: 'कंत्राटदार क्रमांक', required: true },
        { key: 'firstName', label: 'पहिले नाव', required: true },
        { key: 'middleName', label: 'मधले नाव' },
        { key: 'lastName', label: 'आडनाव', required: true },
        { key: 'firstNameMr', label: 'पहिले नाव (मराठी)' },
        { key: 'middleNameMr', label: 'मधले नाव (मराठी)' },
        { key: 'lastNameMr', label: 'आडनाव (मराठी)' },
        { key: 'firmName', label: 'फर्म / कंपनीचे नाव' },
        { key: 'firmNameMr', label: 'फर्म नाव (मराठी)' },
        { key: 'mobileNumber', label: 'मोबाईल क्रमांक', placeholder: '10 अंकी क्रमांक' },
        { key: 'aadhaarNumber', label: 'आधार क्रमांक' },
        { key: 'panNumber', label: 'PAN क्रमांक' },
        { key: 'gstNumber', label: 'GST क्रमांक' },
        { key: 'address', label: 'पत्ता', type: 'textarea', colSpan: 2 },
        { key: 'addressMr', label: 'पत्ता (मराठी)', type: 'textarea', colSpan: 2 },
        { key: 'bankName', label: 'बँकेचे नाव' },
        { key: 'bankAccountNo', label: 'बँक खाते क्र.' },
        { key: 'ifscCode', label: 'IFSC कोड' },
        { key: 'isActive', label: 'सक्रिय', type: 'checkbox', placeholder: 'कंत्राटदार सक्रिय आहे' },
      ]}
      defaultFormData={{ isActive: true }}
    />
  );
}

// ================================================================
// TAB: FLOOR INFO (मजला माहिती)
// ================================================================

function FloorInfoTab() {
  return (
    <CrudList
      title="मजला माहिती"
      table="floorInfo"
      colorKey="property"
      icon={<Layers className="h-5 w-5" />}
      columns={[
        { key: 'floorNumber', label: 'मजला क्र.' },
        { key: 'floorName', label: 'मजला नाव' },
        { key: 'floorNameMr', label: 'मजला नाव (मराठी)' },
        { key: 'floorIndex', label: 'क्रमांक', render: (i) => String(i.floorIndex ?? '-') },
      ]}
      formFields={[
        { key: 'floorNumber', label: 'मजला क्रमांक', required: true },
        { key: 'floorName', label: 'मजला नाव (English)', required: true },
        { key: 'floorNameMr', label: 'मजला नाव (मराठी)', required: true },
        { key: 'floorIndex', label: 'क्रमांक (Index)', type: 'number' },
      ]}
      seedOnEmpty
    />
  );
}

// ================================================================
// TAB: DEMAND CATEGORY (मागणी प्रकार)
// ================================================================

function DemandCategoryTab() {
  return (
    <CrudList
      title="मागणी प्रकार"
      table="demandCategory"
      colorKey="tax"
      icon={<Tag className="h-5 w-5" />}
      columns={[
        { key: 'code', label: 'कोड' },
        { key: 'name', label: 'नाव' },
        { key: 'nameMr', label: 'नाव (मराठी)' },
        { key: 'description', label: 'वर्णन', render: (i) => String(i.description || '-').slice(0, 40) },
      ]}
      formFields={[
        { key: 'code', label: 'कोड', required: true },
        { key: 'name', label: 'नाव (English)', required: true },
        { key: 'nameMr', label: 'नाव (मराठी)', required: true },
        { key: 'description', label: 'वर्णन', type: 'textarea', colSpan: 2 },
      ]}
      seedOnEmpty
    />
  );
}

// ================================================================
// MAIN COMPONENT - Master Data with Colored Tabs
// ================================================================

interface MasterDataProps {
  initialTab?: string;
}

export default function MasterData({ initialTab }: MasterDataProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'village');
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  // When initialTab changes from parent, update the active tab
  if (initialTab && initialTab !== prevInitialTab) {
    setActiveTab(initialTab);
    setPrevInitialTab(initialTab);
  }

  const tabs: { value: string; colorKey: TabColorKey; label: string; icon: React.ReactNode }[] = [
    { value: 'village', colorKey: 'village', label: 'गाव माहिती', icon: <Landmark className="h-4 w-4" /> },
    { value: 'ward', colorKey: 'ward', label: 'वार्ड', icon: <MapPin className="h-4 w-4" /> },
    { value: 'owner', colorKey: 'owner', label: 'मालक', icon: <User className="h-4 w-4" /> },
    { value: 'property', colorKey: 'property', label: 'मालमत्ता', icon: <Building2 className="h-4 w-4" /> },
    { value: 'road', colorKey: 'road', label: 'रस्ते', icon: <Route className="h-4 w-4" /> },
    { value: 'drainage', colorKey: 'drainage', label: 'कालवे', icon: <Droplets className="h-4 w-4" /> },
    { value: 'waterSupply', colorKey: 'waterSupply', label: 'पाणीपुरवठा', icon: <Droplet className="h-4 w-4" /> },
    { value: 'streetLight', colorKey: 'streetLight', label: 'दिवाबत्ती', icon: <Sun className="h-4 w-4" /> },
    { value: 'readyReckoner', colorKey: 'readyReckoner', label: 'रेडीरेकनर', icon: <Calculator className="h-4 w-4" /> },
    { value: 'disability', colorKey: 'disability', label: 'अपंगत्व', icon: <Accessibility className="h-4 w-4" /> },
    { value: 'employee', colorKey: 'employee', label: 'कर्मचारी', icon: <Users className="h-4 w-4" /> },
    { value: 'tax', colorKey: 'tax', label: 'कर मास्टर', icon: <Settings className="h-4 w-4" /> },
    { value: 'fy', colorKey: 'village', label: 'वित्तीय वर्ष', icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'bank', colorKey: 'bank', label: 'बँक खाते', icon: <PiggyBank className="h-4 w-4" /> },
    { value: 'budget-head', colorKey: 'tax', label: 'बजेट शिर्ष', icon: <BanknoteIcon className="h-4 w-4" /> },
    { value: 'scheme', colorKey: 'owner', label: 'योजना', icon: <FolderOpen className="h-4 w-4" /> },
    { value: 'contractor', colorKey: 'employee', label: 'कंत्राटदार', icon: <HardHat className="h-4 w-4" /> },
    { value: 'floorInfo', colorKey: 'property', label: 'मजला', icon: <Layers className="h-4 w-4" /> },
    { value: 'demandCategory', colorKey: 'tax', label: 'मागणी प्रकार', icon: <Tag className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {tabs.map((tab) => {
              const c = tabColors[tab.colorKey];
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-all
                    ${isActive
                      ? `bg-gradient-to-r ${c.header} text-white shadow-md`
                      : `${c.text} hover:${c.bg}`
                    }
                  `}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="village"><VillageInfoTab /></TabsContent>
        <TabsContent value="ward"><WardTab /></TabsContent>
        <TabsContent value="owner"><OwnerTab /></TabsContent>
        <TabsContent value="property"><PropertyTab /></TabsContent>
        <TabsContent value="road"><RoadTab /></TabsContent>
        <TabsContent value="drainage"><DrainageTab /></TabsContent>
        <TabsContent value="waterSupply"><WaterSupplyTab /></TabsContent>
        <TabsContent value="streetLight"><StreetLightTab /></TabsContent>
        <TabsContent value="readyReckoner"><ReadyReckonerTab /></TabsContent>
        <TabsContent value="disability"><DisabilityTab /></TabsContent>
        <TabsContent value="employee"><EmployeeTab /></TabsContent>
        <TabsContent value="tax"><TaxTab /></TabsContent>
        <TabsContent value="fy"><FinancialYearTab /></TabsContent>
        <TabsContent value="bank"><BankAccountTab /></TabsContent>
        <TabsContent value="budget-head"><BudgetHeadTab /></TabsContent>
        <TabsContent value="scheme"><SchemeTab /></TabsContent>
        <TabsContent value="contractor"><ContractorTab /></TabsContent>
        <TabsContent value="floorInfo"><FloorInfoTab /></TabsContent>
        <TabsContent value="demandCategory"><DemandCategoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
