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
  Building2, Save, X, Loader2
} from 'lucide-react';

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

// ================================================================
// TAB 1: VILLAGE INFO (गाव माहिती) - Single Record Form
// ================================================================

function VillageInfoTab() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

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

  if (loading) return <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>;

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">गाव माहिती</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-sm">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={form[f.key] || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                type={f.type || 'text'}
                placeholder={f.label}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'जतन करत आहे...' : 'जतन करा'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================================================
// GENERIC CRUD LIST - Reusable for most master tables
// ================================================================

interface CrudListProps {
  title: string;
  table: string;
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
      // Convert number fields
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="secondary" className="ml-2">{filteredItems.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-48"
                placeholder="शोधा..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> नवीन
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">कोणतेही रेकॉर्ड नाहीत</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">क्र.</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  <TableHead className="w-24 text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, idx) => (
                  <TableRow key={String(item.id)}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                      </TableCell>
                    ))}
                    {renderExtraColumns && <TableCell>{renderExtraColumns(item)}</TableCell>}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(String(item.id))}
                          disabled={deleting === String(item.id)}
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
            <DialogTitle>{editItem ? 'रेकॉर्ड संपादा' : 'नवीन रेकॉर्ड'}</DialogTitle>
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
            <Button onClick={handleSave} disabled={saving}>
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
      icon={<Droplets className="h-5 w-5" />}
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
      icon={<Lightbulb className="h-5 w-5" />}
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
// TAB 11: TAX MASTER (कर मास्टर) - auto-seed on empty, enable/disable
// ================================================================

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
        toast({ title: 'यशस्वी', description: isEnabled ? 'कर सक्षम केला' : 'कर अक्षम केला' });
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
      case 'general': return <Badge variant="outline">सामान्य</Badge>;
      case 'penalty': return <Badge className="bg-red-100 text-red-800 border-red-200">दंड</Badge>;
      case 'interest': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">व्याज</Badge>;
      case 'other': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">इतर</Badge>;
      default: return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            कर मास्टर
            <Badge variant="secondary">{filteredTaxes.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-48" placeholder="शोधा..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchTaxes} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> नवीन
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">क्र.</TableHead>
                  <TableHead>कर नाव</TableHead>
                  <TableHead>मराठी नाव</TableHead>
                  <TableHead className="w-32">दर (₹)</TableHead>
                  <TableHead>वर्ग</TableHead>
                  <TableHead className="w-20 text-center">सक्षम</TableHead>
                  <TableHead className="w-24 text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxes.map((tax, idx) => (
                  <TableRow key={String(tax.id)} className={!tax.isEnabled ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{String(tax.name)}</TableCell>
                    <TableCell>{String(tax.nameMarathi)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={Number(tax.rate)}
                        onChange={(e) => handleRateChange(String(tax.id), parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 text-sm"
                        min={0}
                        step={0.5}
                      />
                    </TableCell>
                    <TableCell>{getCategoryBadge(String(tax.category || 'general'))}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!tax.isEnabled}
                        onCheckedChange={(checked) => handleToggle(String(tax.id), checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tax)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(String(tax.id))}>
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
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'कर संपादा' : 'नवीन कर'}</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" /> रद्द</Button>
            <Button onClick={handleSave} disabled={saving}>
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
      waterConnectionId: '',
    });
    setSelectedOwners([]);
    setSelectedTaxRates(taxMasters.map((t) => ({ taxMasterId: t.id, rate: t.rate })));
    setDialogOpen(true);
  };

  const handleEdit = (item: PropertyItem) => {
    setEditItem(item);
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            मालमत्ता
            <Badge variant="secondary">{items.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-48" placeholder="शोधा..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={fetchProperty} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> नवीन
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">कोणतीही मालमत्ता नाही</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">क्र.</TableHead>
                  <TableHead>मालमत्ता क्र.</TableHead>
                  <TableHead>मालक</TableHead>
                  <TableHead>वार्ड</TableHead>
                  <TableHead>रस्ता</TableHead>
                  <TableHead>वापर</TableHead>
                  <TableHead>क्षेत्रफळ</TableHead>
                  <TableHead>स्थिती</TableHead>
                  <TableHead className="w-24 text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
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
            <DialogTitle>{editItem ? 'मालमत्ता संपादा' : 'नवीन मालमत्ता'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Property Info */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Home className="h-4 w-4" /> मालमत्ता माहिती</h4>
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
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-sm">सीमा</Label>
                  <Textarea value={String(formData.boundaries || '')} onChange={(e) => setFormData((p) => ({ ...p, boundaries: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">बांधकाम प्रकार</Label>
                  <Select value={String(formData.constructionType || '__none__')} onValueChange={(v) => setFormData((p) => ({ ...p, constructionType: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">कोणताही नाही</SelectItem>
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

            {/* Owner Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> मालक माहिती</h4>
                <Button variant="outline" size="sm" onClick={addOwnerRow}>
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
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-3 border rounded-lg bg-muted/30">
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
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Settings className="h-4 w-4" /> कर दर सेटिंग</h4>
              {taxMasters.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">कोणताही सक्षम कर नाही. कर मास्टर तयार करा.</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>कर नाव</TableHead>
                        <TableHead>मराठी नाव</TableHead>
                        <TableHead className="w-32">दर (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxMasters.map((tax) => {
                        const tr = selectedTaxRates.find((t) => t.taxMasterId === tax.id);
                        return (
                          <TableRow key={tax.id}>
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
            <Button onClick={handleSave} disabled={saving}>
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
// MAIN COMPONENT - Master Data with Tabs
// ================================================================

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('village');

  const tabs = [
    { value: 'village', label: 'गाव माहिती', icon: <Home className="h-4 w-4" /> },
    { value: 'ward', label: 'वार्ड', icon: <MapPin className="h-4 w-4" /> },
    { value: 'owner', label: 'मालक', icon: <User className="h-4 w-4" /> },
    { value: 'road', label: 'रस्ते', icon: <Route className="h-4 w-4" /> },
    { value: 'drainage', label: 'कालवे', icon: <Droplets className="h-4 w-4" /> },
    { value: 'waterSupply', label: 'पाणीपुरवठा', icon: <Droplets className="h-4 w-4" /> },
    { value: 'streetLight', label: 'दिवाबत्ती', icon: <Lightbulb className="h-4 w-4" /> },
    { value: 'readyReckoner', label: 'रेडीरेकनर', icon: <Calculator className="h-4 w-4" /> },
    { value: 'disability', label: 'अपंगत्व', icon: <Accessibility className="h-4 w-4" /> },
    { value: 'employee', label: 'कर्मचारी', icon: <Users className="h-4 w-4" /> },
    { value: 'tax', label: 'कर मास्टर', icon: <Settings className="h-4 w-4" /> },
    { value: 'property', label: 'मालमत्ता', icon: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="village"><VillageInfoTab /></TabsContent>
        <TabsContent value="ward"><WardTab /></TabsContent>
        <TabsContent value="owner"><OwnerTab /></TabsContent>
        <TabsContent value="road"><RoadTab /></TabsContent>
        <TabsContent value="drainage"><DrainageTab /></TabsContent>
        <TabsContent value="waterSupply"><WaterSupplyTab /></TabsContent>
        <TabsContent value="streetLight"><StreetLightTab /></TabsContent>
        <TabsContent value="readyReckoner"><ReadyReckonerTab /></TabsContent>
        <TabsContent value="disability"><DisabilityTab /></TabsContent>
        <TabsContent value="employee"><EmployeeTab /></TabsContent>
        <TabsContent value="tax"><TaxTab /></TabsContent>
        <TabsContent value="property"><PropertyTab /></TabsContent>
      </Tabs>
    </div>
  );
}
