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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, RefreshCw, Loader2, Landmark, MapPin,
  User, Building2, Route, Percent, Users, HardHat, Search
} from 'lucide-react';

// ===== TYPES =====

interface MastersProps {
  financialYear: string;
}

interface MasterRecord {
  id: string;
  [key: string]: unknown;
}

// ===== API HELPERS =====

async function apiGet(table: string, search?: string): Promise<MasterRecord[]> {
  const params = new URLSearchParams({ table });
  if (search) params.set('search', search);
  const res = await fetch(`/api/master?${params}`);
  if (!res.ok) throw new Error('Fetch failed');
  const data = await res.json();
  // Handle both array and single object responses
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && !data.error) {
    // Single record (village) - wrap in array
    return [data];
  }
  return [];
}

async function apiCreate(table: string, data: Record<string, unknown>) {
  const res = await fetch('/api/master', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', table, data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'निर्मिणी अयशस्वी');
  return json;
}

async function apiUpdate(table: string, id: string, data: Record<string, unknown>) {
  const res = await fetch('/api/master', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', table, id, data: { id, ...data } }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'अपडेट अयशस्वी');
  return json;
}

async function apiDelete(table: string, id: string) {
  const res = await fetch(`/api/master?table=${table}&id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(json.error || 'हटवणे अयशस्वी');
  }
  return res.json();
}

// ===== TAB CONFIG =====

interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  apiTable: string;
  columns: { key: string; label: string }[];
  formFields: FormFieldConfig[];
  isSingleRecord?: boolean;
}

interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

const tabConfigs: TabConfig[] = [
  {
    key: 'village',
    label: 'गाव माहिती',
    icon: <Landmark className="h-4 w-4" />,
    apiTable: 'village',
    isSingleRecord: true,
    columns: [
      { key: 'gramPanchayatName', label: 'ग्रामपंचायत' },
      { key: 'taluka', label: 'तालुका' },
      { key: 'district', label: 'जिल्हा' },
      { key: 'pinCode', label: 'पिन कोड' },
      { key: 'population', label: 'लोकसंख्या' },
      { key: 'sarpanchName', label: 'सरपंच' },
    ],
    formFields: [
      { key: 'gramPanchayatName', label: 'ग्रामपंचायतचे नाव', type: 'text', required: true },
      { key: 'gramPanchayatNameMr', label: 'मराठीत नाव', type: 'text' },
      { key: 'taluka', label: 'तालुका', type: 'text', required: true },
      { key: 'district', label: 'जिल्हा', type: 'text', required: true },
      { key: 'pinCode', label: 'पिन कोड', type: 'text' },
      { key: 'population', label: 'लोकसंख्या', type: 'number' },
      { key: 'sarpanchName', label: 'सरपंच', type: 'text' },
      { key: 'secretaryName', label: 'ग्रामसेवक', type: 'text' },
    ],
  },
  {
    key: 'ward',
    label: 'वार्ड',
    icon: <MapPin className="h-4 w-4" />,
    apiTable: 'ward',
    columns: [
      { key: 'wardNo', label: 'वार्ड क्र.' },
      { key: 'wardName', label: 'वार्ड नाव' },
      { key: 'wardNameMr', label: 'वार्ड नाव (मराठी)' },
      { key: 'population', label: 'लोकसंख्या' },
      { key: 'households', label: 'कुटुंबे' },
      { key: 'area', label: 'क्षेत्रफळ' },
    ],
    formFields: [
      { key: 'wardNo', label: 'वार्ड क्र.', type: 'number', required: true },
      { key: 'wardName', label: 'वार्ड नाव', type: 'text', required: true },
      { key: 'wardNameMr', label: 'वार्ड नाव मराठी', type: 'text' },
      { key: 'population', label: 'लोकसंख्या', type: 'number' },
      { key: 'households', label: 'कुटुंबे', type: 'number' },
      { key: 'area', label: 'क्षेत्रफळ', type: 'number' },
    ],
  },
  {
    key: 'owner',
    label: 'मालक',
    icon: <User className="h-4 w-4" />,
    apiTable: 'owner',
    columns: [
      { key: 'ownerName', label: 'मालकाचे नाव' },
      { key: 'ownerNameMr', label: 'नाव (मराठी)' },
      { key: 'aadhaarNo', label: 'आधार क्र.' },
      { key: 'mobileNo', label: 'मोबाईल' },
      { key: 'address', label: 'पत्ता' },
    ],
    formFields: [
      { key: 'ownerName', label: 'मालकाचे नाव', type: 'text', required: true },
      { key: 'ownerNameMr', label: 'मराठीत नाव', type: 'text' },
      { key: 'aadhaarNo', label: 'आधार क्र.', type: 'text', placeholder: 'XXXX XXXX XXXX' },
      { key: 'mobileNo', label: 'मोबाईल', type: 'text', placeholder: '10 अंकी मोबाईल क्र.' },
      { key: 'address', label: 'पत्ता', type: 'text' },
    ],
  },
  {
    key: 'property',
    label: 'मालमत्ता',
    icon: <Building2 className="h-4 w-4" />,
    apiTable: 'property',
    columns: [
      { key: 'propertyNo', label: 'मालमत्ता क्र.' },
      { key: 'ownerName', label: 'मालकाचे नाव' },
      { key: 'propertyType', label: 'प्रकार' },
      { key: 'wardId', label: 'वार्ड' },
      { key: 'areaSqFt', label: 'क्षेत्रफळ' },
      { key: 'isTaxExempt', label: 'करमुक्त' },
    ],
    formFields: [
      { key: 'propertyNo', label: 'मालमत्ता क्रमांक', type: 'text', required: true },
      { key: 'ownerName', label: 'मालकाचे नाव', type: 'text', required: true },
      { key: 'propertyType', label: 'मालमत्ता प्रकार', type: 'select', required: true, options: [
        { value: 'residential', label: 'राहणीमान' },
        { value: 'commercial', label: 'व्यावसायिक' },
        { value: 'industrial', label: 'औद्योगिक' },
        { value: 'agricultural', label: 'शेती' },
        { value: 'vacant', label: 'रिकामी जागा' },
        { value: 'mixed', label: 'मिश्र' },
      ] },
      { key: 'propertyUse', label: 'वापर', type: 'select', options: [
        { value: 'self_occupied', label: 'स्वतःचा वापर' },
        { value: 'rented', label: 'भाड्याने दिलेली' },
        { value: 'vacant', label: 'रिकामी' },
        { value: 'commercial_use', label: 'व्यावसायिक वापर' },
      ] },
      { key: 'constructionType', label: 'बांधकाम प्रकार', type: 'select', options: [
        { value: 'pucca', label: 'पक्के' },
        { value: 'semi_pucca', label: 'अर्धपक्के' },
        { value: 'kutcha', label: 'कच्चे' },
        { value: 'open', label: 'खुली जागा' },
      ] },
      { key: 'wardId', label: 'वार्ड', type: 'text' },
      { key: 'roadId', label: 'रस्ता', type: 'text' },
      { key: 'areaSqFt', label: 'क्षेत्रफळ चौ.फूट', type: 'number' },
      { key: 'builtUpArea', label: 'बांधलेले क्षेत्रफळ', type: 'number' },
      { key: 'isTaxExempt', label: 'करमुक्त', type: 'checkbox' },
      { key: 'waterConnection', label: 'पाणी जोडणी', type: 'checkbox' },
      { key: 'electricityConnection', label: 'वीज जोडणी', type: 'checkbox' },
    ],
  },
  {
    key: 'road',
    label: 'रस्ते',
    icon: <Route className="h-4 w-4" />,
    apiTable: 'road',
    columns: [
      { key: 'roadNo', label: 'रस्ता क्र.' },
      { key: 'roadName', label: 'रस्ता नाव' },
      { key: 'roadNameMr', label: 'नाव (मराठी)' },
      { key: 'roadType', label: 'प्रकार' },
      { key: 'lengthM', label: 'लांबी (मी)' },
      { key: 'widthM', label: 'रुंदी (मी)' },
    ],
    formFields: [
      { key: 'roadNo', label: 'रस्ता क्र.', type: 'text', required: true },
      { key: 'roadName', label: 'रस्ता नाव', type: 'text', required: true },
      { key: 'roadNameMr', label: 'मराठीत नाव', type: 'text' },
      { key: 'roadType', label: 'प्रकार', type: 'select', options: [
        { value: 'pucca', label: 'पक्का' },
        { value: 'kutcha', label: 'कच्चा' },
        { value: 'wbm', label: 'WBM' },
        { value: 'concrete', label: 'कॉंक्रीट' },
        { value: 'paver', label: 'पेव्हर' },
      ] },
      { key: 'lengthM', label: 'लांबी मी.', type: 'number' },
      { key: 'widthM', label: 'रुंदी मी.', type: 'number' },
    ],
  },
  {
    key: 'tax',
    label: 'कर प्रकार',
    icon: <Percent className="h-4 w-4" />,
    apiTable: 'tax',
    columns: [
      { key: 'taxName', label: 'कराचे नाव' },
      { key: 'taxNameMr', label: 'नाव (मराठी)' },
      { key: 'taxType', label: 'प्रकार' },
      { key: 'taxRate', label: 'दर' },
      { key: 'isEnabled', label: 'सक्षम' },
    ],
    formFields: [
      { key: 'taxName', label: 'कराचे नाव', type: 'text', required: true },
      { key: 'taxNameMr', label: 'मराठीत नाव', type: 'text', required: true },
      { key: 'taxType', label: 'प्रकार', type: 'select', required: true, options: [
        { value: 'general', label: 'सामान्य' },
        { value: 'penalty', label: 'दंड' },
        { value: 'interest', label: 'व्याज' },
        { value: 'other', label: 'इतर' },
      ] },
      { key: 'taxRate', label: 'दर', type: 'number', required: true },
      { key: 'isEnabled', label: 'सक्षम', type: 'checkbox' },
    ],
  },
  {
    key: 'employee',
    label: 'कर्मचारी',
    icon: <Users className="h-4 w-4" />,
    apiTable: 'employee',
    columns: [
      { key: 'employeeName', label: 'नाव' },
      { key: 'designation', label: 'पद' },
      { key: 'department', label: 'विभाग' },
      { key: 'basicPay', label: 'मूळ वेतन' },
      { key: 'isActive', label: 'सक्रिय' },
    ],
    formFields: [
      { key: 'employeeName', label: 'नाव', type: 'text', required: true },
      { key: 'employeeNameMr', label: 'मराठीत नाव', type: 'text' },
      { key: 'designation', label: 'पद', type: 'text', required: true },
      { key: 'department', label: 'विभाग', type: 'select', options: [
        { value: 'administration', label: 'प्रशासन' },
        { value: 'accounts', label: 'लेखा' },
        { value: 'revenue', label: 'महसूल' },
        { value: 'public_works', label: 'सार्वजनिक बांधकाम' },
        { value: 'water_supply', label: 'पाणीपुरवठा' },
        { value: 'sanitation', label: 'स्वच्छता' },
        { value: 'health', label: 'आरोग्य' },
        { value: 'education', label: 'शिक्षण' },
      ] },
      { key: 'basicPay', label: 'मूळ वेतन', type: 'number' },
      { key: 'da', label: 'महागाई भत्ता', type: 'number' },
      { key: 'hra', label: 'घरभाडे भत्ता', type: 'number' },
      { key: 'isActive', label: 'सक्रिय', type: 'checkbox' },
    ],
  },
  {
    key: 'contractor',
    label: 'कंत्राटदार',
    icon: <HardHat className="h-4 w-4" />,
    apiTable: 'contractor',
    columns: [
      { key: 'contractorName', label: 'नाव' },
      { key: 'contractorNameMr', label: 'नाव (मराठी)' },
      { key: 'mobileNo', label: 'मोबाईल' },
      { key: 'bankName', label: 'बँक' },
      { key: 'address', label: 'पत्ता' },
    ],
    formFields: [
      { key: 'contractorName', label: 'नाव', type: 'text', required: true },
      { key: 'contractorNameMr', label: 'मराठीत नाव', type: 'text' },
      { key: 'aadhaarNo', label: 'आधार क्र.', type: 'text', placeholder: 'XXXX XXXX XXXX' },
      { key: 'mobileNo', label: 'मोबाईल', type: 'text', placeholder: '10 अंकी मोबाईल क्र.' },
      { key: 'bankName', label: 'बँक', type: 'text' },
      { key: 'ifscCode', label: 'IFSC कोड', type: 'text' },
      { key: 'address', label: 'पत्ता', type: 'text' },
    ],
  },
];

// ===== MAIN COMPONENT =====

export default function Masters({ financialYear }: MastersProps) {
  const [activeTab, setActiveTab] = useState('village');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const currentConfig = tabConfigs.find(t => t.key === activeTab)!;

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(currentConfig.apiTable, searchTerm || undefined);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('माहिती लोड करण्यात त्रुटी आली');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentConfig.apiTable, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset search when tab changes
  useEffect(() => {
    setSearchTerm('');
    setError(null);
  }, [activeTab]);

  // Open dialog for add
  const handleAdd = () => {
    setEditingRecord(null);
    const initialData: Record<string, unknown> = {};
    currentConfig.formFields.forEach(f => {
      if (f.type === 'checkbox') {
        initialData[f.key] = false;
      } else if (f.type === 'number') {
        initialData[f.key] = '';
      } else {
        initialData[f.key] = '';
      }
    });
    setFormData(initialData);
    setDialogOpen(true);
  };

  // Open dialog for edit
  const handleEdit = (record: MasterRecord) => {
    setEditingRecord(record);
    const initialData: Record<string, unknown> = {};
    currentConfig.formFields.forEach(f => {
      initialData[f.key] = record[f.key] ?? (f.type === 'checkbox' ? false : '');
    });
    setFormData(initialData);
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    // Validate required fields
    const missingFields = currentConfig.formFields
      .filter(f => f.required && !formData[f.key] && formData[f.key] !== 0)
      .map(f => f.label);
    if (missingFields.length > 0) {
      toast({
        title: 'प्रमाणित त्रुटी',
        description: `खालील फील्ड आवश्यक आहेत: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare data: convert number fields and clean empty strings
      const cleanData: Record<string, unknown> = {};
      currentConfig.formFields.forEach(f => {
        const val = formData[f.key];
        if (f.type === 'number') {
          cleanData[f.key] = val === '' || val === null || val === undefined ? null : Number(val);
        } else if (f.type === 'checkbox') {
          cleanData[f.key] = val === true || val === 'true' || val === 1;
        } else {
          cleanData[f.key] = val || null;
        }
      });

      if (editingRecord) {
        await apiUpdate(currentConfig.apiTable, editingRecord.id, cleanData);
        toast({ title: 'यशस्वी', description: 'माहिती अपडेट झाली' });
      } else {
        await apiCreate(currentConfig.apiTable, cleanData);
        toast({ title: 'यशस्वी', description: 'नवीन रेकॉर्ड जोडला' });
      }
      setDialogOpen(false);
      fetchRecords();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'जतन करण्यात त्रुटी';
      toast({
        title: 'त्रुटी',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('हे रेकॉर्ड हटवायचे आहे का?')) return;
    setDeleting(id);
    try {
      await apiDelete(currentConfig.apiTable, id);
      toast({ title: 'यशस्वी', description: 'रेकॉर्ड हटवला' });
      fetchRecords();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'हटवण्यात त्रुटी';
      toast({
        title: 'त्रुटी',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Render cell value
  const renderCellValue = (record: MasterRecord, colKey: string) => {
    const value = record[colKey];
    if (colKey === 'isEnabled' || colKey === 'isActive') {
      return value ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">होय</Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">नाही</Badge>
      );
    }
    if (colKey === 'isTaxExempt' || colKey === 'waterConnection' || colKey === 'electricityConnection') {
      return value ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">होय</Badge>
      ) : (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">नाही</Badge>
      );
    }
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  // ===== FORM FIELD RENDERER =====

  const renderFormField = (field: FormFieldConfig) => {
    const value = formData[field.key];

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox
            id={field.key}
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, [field.key]: checked }))
            }
          />
          <Label htmlFor={field.key} className="cursor-pointer text-sm">
            {field.label}
          </Label>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key} className="text-sm">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={value ? String(value) : ''}
            onValueChange={(val) =>
              setFormData(prev => ({ ...prev, [field.key]: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.label + ' निवडा'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1.5">
        <Label htmlFor={field.key} className="text-sm">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={field.key}
          type={field.type === 'number' ? 'number' : 'text'}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, [field.key]: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))
          }
          placeholder={field.placeholder || field.label + ' टाका'}
          className="w-full"
        />
      </div>
    );
  };

  // ===== MAIN RENDER =====

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab List - Scrollable on mobile */}
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex h-auto min-w-full flex-nowrap gap-1 bg-muted p-1 rounded-lg">
            {tabConfigs.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        {tabConfigs.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                    {!loading && Array.isArray(records) && (
                      <Badge variant="secondary" className="ml-2">
                        {records.length} रेकॉर्ड
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="शोधा..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9 w-40 sm:w-56"
                      />
                    </div>
                    {/* Refresh */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRecords}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {/* Add button */}
                    <Button size="sm" onClick={handleAdd}>
                      <Plus className="h-4 w-4 mr-1" />
                      {tab.isSingleRecord ? 'संपादन' : 'नवीन'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">लोड होत आहे...</span>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-red-500 font-medium">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={fetchRecords}>
                      पुन्हा प्रयत्न करा
                    </Button>
                  </div>
                )}

                {/* Data Table */}
                {!loading && !error && (
                  <>
                    {/* Single record view (Village Info) */}
                    {tab.isSingleRecord && Array.isArray(records) && records.length === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tab.formFields.map(field => (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{field.label}</Label>
                              <p className="text-sm font-medium">
                                {records[0][field.key] !== null && records[0][field.key] !== undefined
                                  ? String(records[0][field.key])
                                  : '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(records[0])}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> संपादन
                        </Button>
                      </div>
                    )}

                    {/* Single record view - no data yet */}
                    {tab.isSingleRecord && Array.isArray(records) && records.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground mb-4">गाव माहिती उपलब्ध नाही</p>
                        <Button size="sm" onClick={handleAdd}>
                          <Plus className="h-4 w-4 mr-1" /> माहिती जोडा
                        </Button>
                      </div>
                    )}

                    {/* Table view for multiple records */}
                    {!tab.isSingleRecord && (
                      <>
                        {Array.isArray(records) && records.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground mb-2">कोणतेही रेकॉर्ड आढळले नाहीत</p>
                            <Button size="sm" onClick={handleAdd}>
                              <Plus className="h-4 w-4 mr-1" /> नवीन रेकॉर्ड जोडा
                            </Button>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12 text-center">क्र.</TableHead>
                                  {tab.columns.map(col => (
                                    <TableHead key={col.key}>{col.label}</TableHead>
                                  ))}
                                  <TableHead className="text-center sticky right-0 bg-background">क्रिया</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.isArray(records) && records.map((record, idx) => (
                                  <TableRow key={record.id || idx}>
                                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                    {tab.columns.map(col => (
                                      <TableCell key={col.key}>
                                        {renderCellValue(record, col.key)}
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-center sticky right-0 bg-background">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleEdit(record)}
                                          title="संपादन"
                                        >
                                          <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleDelete(record.id)}
                                          disabled={deleting === record.id}
                                          title="हटवा"
                                        >
                                          {deleting === record.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4 text-red-600" />
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
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? `${currentConfig.label} संपादन` : `नवीन ${currentConfig.label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {currentConfig.formFields.map(field => renderFormField(field))}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              रद्द करा
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  जतन होत आहे...
                </>
              ) : (
                'जतन करा'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
