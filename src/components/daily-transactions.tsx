'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Receipt,
  CreditCard,
  NotebookPen,
  Warehouse,
  Package,
  HandCoins,
  Droplets,
  Banknote,
  ClipboardList,
  HardHat,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Calculator,
} from 'lucide-react';

// ─── Tab Configuration ────────────────────────────────────────────────

interface TabConfig {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const TABS: TabConfig[] = [
  { id: 'receipt', label: 'पावती एंट्री', labelEn: 'Receipt Entry', icon: Receipt, color: '#27ae60', bgColor: 'bg-green-50', borderColor: 'border-green-200', gradientFrom: '#27ae60', gradientTo: '#2ecc71' },
  { id: 'payment', label: 'पेमेंट एंट्री', labelEn: 'Payment Entry', icon: CreditCard, color: '#e74c3c', bgColor: 'bg-red-50', borderColor: 'border-red-200', gradientFrom: '#e74c3c', gradientTo: '#c0392b' },
  { id: 'journal', label: 'जर्नल एंट्री', labelEn: 'Journal Entry', icon: NotebookPen, color: '#8e44ad', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', gradientFrom: '#8e44ad', gradientTo: '#9b59b6' },
  { id: 'asset', label: 'मालमत्ता एंट्री', labelEn: 'Asset Entry', icon: Warehouse, color: '#ea580c', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', gradientFrom: '#ea580c', gradientTo: '#f97316' },
  { id: 'stock', label: 'साठा एंट्री', labelEn: 'Stock Entry', icon: Package, color: '#6366f1', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', gradientFrom: '#6366f1', gradientTo: '#818cf8' },
  { id: 'collection', label: 'वसूल एंट्री', labelEn: 'Collection Entry', icon: HandCoins, color: '#0d9488', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', gradientFrom: '#0d9488', gradientTo: '#14b8a6' },
  { id: 'water-bill', label: 'पाणी बिल', labelEn: 'Water Bill', icon: Droplets, color: '#0ea5e9', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', gradientFrom: '#0ea5e9', gradientTo: '#38bdf8' },
  { id: 'scheme-fund', label: 'योजना निधी', labelEn: 'Scheme Fund', icon: Banknote, color: '#e11d48', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', gradientFrom: '#e11d48', gradientTo: '#f43f5e' },
  { id: 'budget', label: 'अंदाजपत्रक एंट्री', labelEn: 'Budget Entry', icon: ClipboardList, color: '#0891b2', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', gradientFrom: '#0891b2', gradientTo: '#06b6d4' },
  { id: 'work', label: 'विकासकाम एंट्री', labelEn: 'Work Entry', icon: HardHat, color: '#65a30d', bgColor: 'bg-lime-50', borderColor: 'border-lime-200', gradientFrom: '#65a30d', gradientTo: '#84cc16' },
  { id: 'salary', label: 'वेतन एंट्री', labelEn: 'Salary Entry', icon: IndianRupee, color: '#059669', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', gradientFrom: '#059669', gradientTo: '#10b981' },
];

// ─── Form Field Types ─────────────────────────────────────────────────

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'employee-select' | 'contractor-select';
  required?: boolean;
  options?: string[];
  readOnly?: boolean;
  sectionHeader?: string;
  sectionColor?: string;
}

// ─── Main Component ───────────────────────────────────────────────────

interface DailyTransactionsProps {
  initialTab?: string;
}

export default function DailyTransactions({ initialTab }: DailyTransactionsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'receipt');
  const [entries, setEntries] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [properties, setProperties] = useState<Array<{ id: string; propertyNumber: string }>>([]);
  const [schemes, setSchemes] = useState<Array<{ id: string; schemeName: string; schemeNameMr: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; employeeId: string; firstName: string; lastName: string; firstNameMr?: string; lastNameMr?: string; designation?: string }>>([]);
  const [contractors, setContractors] = useState<Array<{ id: string; contractorId: string; firstName: string; lastName: string; firmName?: string }>>([]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  // Fetch entries for active tab
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/transactions?type=${activeTab}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const result = Array.isArray(data) ? data : (data as Record<string, unknown>)?.data || [];
          setEntries(prev => ({ ...prev, [activeTab]: result as unknown[] }));
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    void load();
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    return () => controller.abort();
  }, [activeTab]);

  // Fetch properties, schemes, employees, contractors for dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const propRes = await fetch('/api/master?table=property');
        if (propRes.ok) {
          const propData = await propRes.json();
          setProperties((propData.data || []).map((p: { id: string; propertyNumber: string }) => ({ id: p.id, propertyNumber: p.propertyNumber })));
        }
      } catch { /* ignore */ }
      try {
        const schRes = await fetch('/api/master?table=schemeInfo');
        if (schRes.ok) {
          const schData = await schRes.json();
          setSchemes((Array.isArray(schData) ? schData : []).map((s: { id: string; schemeName: string; schemeNameMr: string }) => ({ id: s.id, schemeName: s.schemeName, schemeNameMr: s.schemeNameMr })));
        }
      } catch { /* ignore */ }
      try {
        const empRes = await fetch('/api/master?table=employee');
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees((Array.isArray(empData) ? empData : []).map((e: { id: string; employeeId: string; firstName: string; lastName: string; firstNameMr?: string; lastNameMr?: string; designation?: string }) => ({
            id: e.id, employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName,
            firstNameMr: e.firstNameMr, lastNameMr: e.lastNameMr, designation: e.designation,
          })));
        }
      } catch { /* ignore */ }
      try {
        const conRes = await fetch('/api/master?table=contractor');
        if (conRes.ok) {
          const conData = await conRes.json();
          setContractors((Array.isArray(conData) ? conData : []).map((c: { id: string; contractorId: string; firstName: string; lastName: string; firmName?: string }) => ({
            id: c.id, contractorId: c.contractorId, firstName: c.firstName, lastName: c.lastName, firmName: c.firmName,
          })));
        }
      } catch { /* ignore */ }
    };
    fetchMasters();
  }, []);

  // Reset form state when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setShowForm(false);
    setEditingId(null);
    setFormData({});
    setSearchTerm('');
  };

  // Salary auto-calculation handler
  const handleSalaryFieldChange = useCallback((name: string, value: number) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      const bp = Number(newData.basicPay) || 0;
      const da = Number(newData.da) || 0;
      const hra = Number(newData.hra) || 0;
      const ta = Number(newData.ta) || 0;
      const ma = Number(newData.ma) || 0;
      const oa = Number(newData.otherAllowance) || 0;
      const pf = Number(newData.pf) || 0;
      const esi = Number(newData.esi) || 0;
      const tds = Number(newData.tds) || 0;
      const pt = Number(newData.professionalTax) || 0;
      const od = Number(newData.otherDeduction) || 0;

      const grossSalary = bp + da + hra + ta + ma + oa;
      const totalDeduction = pf + esi + tds + pt + od;
      const netSalary = grossSalary - totalDeduction;

      return { ...newData, grossSalary, totalDeduction, netSalary };
    });
  }, []);

  // Form field configurations per tab
  const getFormFields = (): FormField[] => {
    switch (activeTab) {
      case 'receipt':
        return [
          { name: 'receiptDate', label: 'पावती तारीख / Date', type: 'date', required: true },
          { name: 'receivedFrom', label: 'कोणाकडून मिळाले / Received From', type: 'text', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'headOfAccount', label: 'लेखाशिर्ष / Head of Account', type: 'text' },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
          { name: 'paymentMethod', label: 'पेमेंट पद्धत / Payment Method', type: 'select', options: ['Cash', 'Bank'] },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
        ];
      case 'payment':
        return [
          { name: 'paymentDate', label: 'पेमेंट तारीख / Date', type: 'date', required: true },
          { name: 'paidTo', label: 'कोणाला दिले / Paid To', type: 'text', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'headOfAccount', label: 'लेखाशिर्ष / Head of Account', type: 'text' },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
          { name: 'paymentMethod', label: 'पेमेंट पद्धत / Payment Method', type: 'select', options: ['Cash', 'Bank', 'Cheque', 'DD'] },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
        ];
      case 'journal':
        return [
          { name: 'entryDate', label: 'तारीख / Date', type: 'date', required: true },
          { name: 'debitAccount', label: 'डेबिट खाते / Debit Account', type: 'text', required: true },
          { name: 'creditAccount', label: 'क्रेडिट खाते / Credit Account', type: 'text', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
        ];
      case 'asset':
        return [
          { name: 'assetName', label: 'मालमत्ता नाव / Asset Name', type: 'text', required: true },
          { name: 'assetNameMr', label: 'मालमत्ता नाव (मराठी)', type: 'text', required: true },
          { name: 'assetType', label: 'मालमत्ता प्रकार / Asset Type', type: 'select', options: ['Building', 'Vehicle', 'Equipment', 'Furniture', 'Land', 'Other'] },
          { name: 'purchaseDate', label: 'खरेदी तारीख / Purchase Date', type: 'date' },
          { name: 'purchaseCost', label: 'खरेदी किंमत / Purchase Cost', type: 'number' },
          { name: 'currentValue', label: 'सध्याची किंमत / Current Value', type: 'number' },
          { name: 'depreciationRate', label: 'घसरण दर / Depreciation Rate %', type: 'number' },
          { name: 'location', label: 'ठिकाण / Location', type: 'text' },
          { name: 'status', label: 'स्थिती / Status', type: 'select', options: ['Active', 'Disposed', 'Under Maintenance'] },
        ];
      case 'stock':
        return [
          { name: 'itemName', label: 'वस्तूचे नाव / Item Name', type: 'text', required: true },
          { name: 'itemNameMr', label: 'वस्तूचे नाव (मराठी)', type: 'text', required: true },
          { name: 'category', label: 'वर्ग / Category', type: 'text' },
          { name: 'quantity', label: 'संख्या / Quantity', type: 'number', required: true },
          { name: 'unit', label: 'एकक / Unit', type: 'select', options: ['Pieces', 'Kg', 'Liter', 'Meter', 'Box', 'Set'] },
          { name: 'unitPrice', label: 'एकक किंमत / Unit Price', type: 'number' },
          { name: 'status', label: 'स्थिती / Status', type: 'select', options: ['In Stock', 'Issued', 'Low Stock'] },
        ];
      case 'collection':
        return [
          { name: 'collectionDate', label: 'वसूल तारीख / Date', type: 'date', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'collectionType', label: 'वसूल प्रकार / Collection Type', type: 'select', options: ['Tax', 'Water', 'Light', 'Health', 'Other'] },
          { name: 'paymentMethod', label: 'पेमेंट पद्धत / Payment Method', type: 'select', options: ['Cash', 'Bank', 'Cheque', 'Online'] },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
        ];
      case 'water-bill':
        return [
          { name: 'billNumber', label: 'बिल क्रमांक / Bill Number', type: 'text', required: true },
          { name: 'billDate', label: 'बिल तारीख / Bill Date', type: 'date', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'penalty', label: 'दंड / Penalty', type: 'number' },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
        ];
      case 'scheme-fund':
        return [
          { name: 'entryDate', label: 'तारीख / Date', type: 'date', required: true },
          { name: 'amount', label: 'रक्कम / Amount', type: 'number', required: true },
          { name: 'entryType', label: 'एंट्री प्रकार / Entry Type', type: 'select', options: ['Receipt', 'Payment'] },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
        ];
      case 'budget':
        return [
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'], required: true },
          { name: 'budgetHeadCode', label: 'अंदाज शिर्ष कोड / Budget Head Code', type: 'text', required: true },
          { name: 'budgetHeadName', label: 'अंदाज शिर्ष नाव / Budget Head Name', type: 'text' },
          { name: 'budgetHeadNameMr', label: 'अंदाज शिर्ष नाव (मराठी)', type: 'text' },
          { name: 'category', label: 'वर्ग / Category', type: 'select', options: ['income', 'expenditure'] },
          { name: 'type', label: 'प्रकार / Type', type: 'select', options: ['revenue', 'capital'] },
          { name: 'originalBudget', label: 'मूळ अंदाज / Original Budget', type: 'number', required: true },
          { name: 'revisedBudget', label: 'दुरुस्ती अंदाज / Revised Budget', type: 'number' },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
        ];
      case 'work':
        return [
          { name: 'workNumber', label: 'काम क्रमांक / Work Number', type: 'text', required: true },
          { name: 'workName', label: 'कामाचे नाव / Work Name', type: 'text', required: true },
          { name: 'workNameMr', label: 'कामाचे नाव (मराठी)', type: 'text' },
          { name: 'workType', label: 'कामाचा प्रकार / Work Type', type: 'select', options: ['New', 'Repair', 'Maintenance'] },
          { name: 'contractorId', label: 'कंत्राटदार / Contractor', type: 'contractor-select' },
          { name: 'sanctionDate', label: 'मंजुरी तारीख / Sanction Date', type: 'date' },
          { name: 'sanctionAmount', label: 'मंजुरी रक्कम / Sanction Amount', type: 'number', required: true },
          { name: 'workOrderDate', label: 'कामाचा आदेश तारीख / Work Order Date', type: 'date' },
          { name: 'completionDate', label: 'पूर्णता तारीख / Completion Date', type: 'date' },
          { name: 'progressPercent', label: 'प्रगती % / Progress %', type: 'number' },
          { name: 'totalExpenditure', label: 'एकूण खर्च / Total Expenditure', type: 'number' },
          { name: 'status', label: 'स्थिती / Status', type: 'select', options: ['Sanctioned', 'InProgress', 'Completed', 'Billed'] },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
          { name: 'description', label: 'वर्णन / Description', type: 'textarea' },
        ];
      case 'salary':
        return [
          { name: 'employeeId', label: 'कर्मचारी / Employee', type: 'employee-select', required: true, sectionHeader: 'कर्मचारी माहिती', sectionColor: '#059669' },
          { name: 'financialYear', label: 'वित्तीय वर्ष / Financial Year', type: 'select', options: ['2024-25', '2023-24', '2025-26'] },
          { name: 'month', label: 'महिना / Month', type: 'select', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
          { name: 'basicPay', label: 'मूल वेतन / Basic Pay', type: 'number', required: true, sectionHeader: 'मिळकत / Earnings', sectionColor: '#059669' },
          { name: 'da', label: 'महागाई भत्ता / DA', type: 'number' },
          { name: 'hra', label: 'घरभाडा भत्ता / HRA', type: 'number' },
          { name: 'ta', label: 'प्रवास भत्ता / TA', type: 'number' },
          { name: 'ma', label: 'वैद्यक भत्ता / MA', type: 'number' },
          { name: 'otherAllowance', label: 'इतर भत्ता / Other Allowance', type: 'number' },
          { name: 'grossSalary', label: 'सकल वेतन / Gross Salary', type: 'number', readOnly: true },
          { name: 'pf', label: 'भविष्यनिर्वाह निधी / PF', type: 'number', sectionHeader: 'कपात / Deductions', sectionColor: '#dc2626' },
          { name: 'esi', label: 'ESI', type: 'number' },
          { name: 'tds', label: 'TDS', type: 'number' },
          { name: 'professionalTax', label: 'व्यावसायिक कर / Professional Tax', type: 'number' },
          { name: 'otherDeduction', label: 'इतर कपात / Other Deduction', type: 'number' },
          { name: 'totalDeduction', label: 'एकूण कपात / Total Deduction', type: 'number', readOnly: true },
          { name: 'netSalary', label: 'निव्वळ वेतन / Net Salary', type: 'number', readOnly: true, sectionHeader: 'निव्वळ / Net', sectionColor: '#059669' },
          { name: 'paymentDate', label: 'पेमेंट तारीख / Payment Date', type: 'date', sectionHeader: 'पेमेंट माहिती', sectionColor: '#0891b2' },
          { name: 'paymentMethod', label: 'पेमेंट पद्धत / Payment Method', type: 'select', options: ['Cash', 'Bank', 'Cheque'] },
          { name: 'status', label: 'स्थिती / Status', type: 'select', options: ['Pending', 'Paid'] },
        ];
      default:
        return [];
    }
  };

  // Table columns per tab
  const getTableColumns = () => {
    switch (activeTab) {
      case 'receipt':
        return [
          { key: 'voucherNumber', label: 'वाउचर क्र.' },
          { key: 'receiptDate', label: 'तारीख' },
          { key: 'receivedFrom', label: 'कोणाकडून' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
          { key: 'headOfAccount', label: 'लेखाशिर्ष' },
          { key: 'paymentMethod', label: 'पद्धत' },
        ];
      case 'payment':
        return [
          { key: 'voucherNumber', label: 'वाउचर क्र.' },
          { key: 'paymentDate', label: 'तारीख' },
          { key: 'paidTo', label: 'कोणाला' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
          { key: 'headOfAccount', label: 'लेखाशिर्ष' },
          { key: 'paymentMethod', label: 'पद्धत' },
        ];
      case 'journal':
        return [
          { key: 'voucherNumber', label: 'वाउचर क्र.' },
          { key: 'entryDate', label: 'तारीख' },
          { key: 'debitAccount', label: 'डेबिट' },
          { key: 'creditAccount', label: 'क्रेडिट' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
        ];
      case 'asset':
        return [
          { key: 'assetNumber', label: 'मालमत्ता क्र.' },
          { key: 'assetName', label: 'नाव' },
          { key: 'assetType', label: 'प्रकार' },
          { key: 'purchaseCost', label: 'खरेदी किंमत', isAmount: true },
          { key: 'currentValue', label: 'सध्याची किंमत', isAmount: true },
          { key: 'status', label: 'स्थिती' },
        ];
      case 'stock':
        return [
          { key: 'stockNumber', label: 'साठा क्र.' },
          { key: 'itemName', label: 'वस्तू' },
          { key: 'category', label: 'वर्ग' },
          { key: 'quantity', label: 'संख्या' },
          { key: 'unitPrice', label: 'एकक किंमत', isAmount: true },
          { key: 'totalValue', label: 'एकूण मूल्य', isAmount: true },
          { key: 'status', label: 'स्थिती' },
        ];
      case 'collection':
        return [
          { key: 'collectionNumber', label: 'वसूल क्र.' },
          { key: 'collectionDate', label: 'तारीख' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
          { key: 'collectionType', label: 'प्रकार' },
          { key: 'paymentMethod', label: 'पद्धत' },
        ];
      case 'water-bill':
        return [
          { key: 'billNumber', label: 'बिल क्र.' },
          { key: 'billDate', label: 'तारीख' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
          { key: 'penalty', label: 'दंड', isAmount: true },
          { key: 'totalAmount', label: 'एकूण', isAmount: true },
          { key: 'status', label: 'स्थिती' },
        ];
      case 'scheme-fund':
        return [
          { key: 'voucherNumber', label: 'वाउचर क्र.' },
          { key: 'entryDate', label: 'तारीख' },
          { key: 'amount', label: 'रक्कम', isAmount: true },
          { key: 'entryType', label: 'प्रकार' },
          { key: 'description', label: 'वर्णन' },
        ];
      case 'budget':
        return [
          { key: 'budgetHeadCode', label: 'शिर्ष कोड' },
          { key: 'budgetHeadName', label: 'शिर्ष नाव' },
          { key: 'financialYear', label: 'वित्तीय वर्ष' },
          { key: 'category', label: 'वर्ग' },
          { key: 'type', label: 'प्रकार' },
          { key: 'originalBudget', label: 'मूळ अंदाज', isAmount: true },
          { key: 'revisedBudget', label: 'दुरुस्ती अंदाज', isAmount: true },
        ];
      case 'work':
        return [
          { key: 'workNumber', label: 'काम क्र.' },
          { key: 'workName', label: 'कामाचे नाव' },
          { key: 'workType', label: 'प्रकार' },
          { key: 'sanctionDate', label: 'मंजुरी तारीख' },
          { key: 'sanctionAmount', label: 'मंजुरी रक्कम', isAmount: true },
          { key: 'progressPercent', label: 'प्रगती %' },
          { key: 'status', label: 'स्थिती' },
        ];
      case 'salary':
        return [
          { key: 'employeeId', label: 'कर्मचारी' },
          { key: 'financialYear', label: 'वित्तीय वर्ष' },
          { key: 'month', label: 'महिना' },
          { key: 'grossSalary', label: 'सकल वेतन', isAmount: true },
          { key: 'totalDeduction', label: 'एकूण कपात', isAmount: true },
          { key: 'netSalary', label: 'निव्वळ वेतन', isAmount: true },
          { key: 'status', label: 'स्थिती' },
        ];
      default:
        return [];
    }
  };

  const refreshEntries = () => {
    setLoading(true);
    fetch(`/api/transactions?type=${activeTab}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const result = Array.isArray(data) ? data : (data as Record<string, unknown[]>).data || [];
        setEntries(prev => ({ ...prev, [activeTab]: result }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async () => {
    try {
      // Use _type for transaction type to avoid conflict with budget 'type' field
      const payload = { ...formData, _type: activeTab };
      if (editingId) {
        payload.id = editingId;
      }
      await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setShowForm(false);
      setEditingId(null);
      setFormData({});
      refreshEntries();
    } catch { /* ignore */ }
  };

  const handleEdit = (entry: Record<string, unknown>) => {
    setEditingId(entry.id as string);
    setFormData(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/transactions?type=${activeTab}&id=${id}`, { method: 'DELETE' });
      refreshEntries();
    } catch { /* ignore */ }
  };

  // Helper: get employee display name
  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId || e.employeeId === empId);
    if (emp) {
      return `${emp.firstNameMr || emp.firstName} ${emp.lastNameMr || emp.lastName}`;
    }
    return empId;
  };

  // Helper: get contractor display name
  const getContractorName = (conId: string) => {
    const con = contractors.find(c => c.id === conId || c.contractorId === conId);
    if (con) {
      return con.firmName || `${con.firstName} ${con.lastName}`;
    }
    return conId;
  };

  const filteredEntries = (entries[activeTab] || []) as Record<string, unknown>[];
  const displayEntries = searchTerm
    ? filteredEntries.filter(e => JSON.stringify(e).toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredEntries;

  // Calculate total
  const totalAmount = displayEntries.reduce((sum, e) => {
    let amtKey = 'amount';
    if (activeTab === 'asset') amtKey = 'purchaseCost';
    else if (activeTab === 'stock') amtKey = 'totalValue';
    else if (activeTab === 'budget') amtKey = 'originalBudget';
    else if (activeTab === 'work') amtKey = 'sanctionAmount';
    else if (activeTab === 'salary') amtKey = 'netSalary';
    return sum + (Number(e[amtKey]) || 0);
  }, 0);

  const formatCurrency = (val: unknown) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('mr-IN')}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'In Stock': 'bg-green-100 text-green-800',
      'Disposed': 'bg-red-100 text-red-800',
      'Under Maintenance': 'bg-amber-100 text-amber-800',
      'Issued': 'bg-blue-100 text-blue-800',
      'Low Stock': 'bg-orange-100 text-orange-800',
      'Pending': 'bg-amber-100 text-amber-800',
      'Paid': 'bg-green-100 text-green-800',
      'Cash': 'bg-emerald-100 text-emerald-800',
      'Bank': 'bg-blue-100 text-blue-800',
      'Cheque': 'bg-purple-100 text-purple-800',
      'Online': 'bg-sky-100 text-sky-800',
      'DD': 'bg-indigo-100 text-indigo-800',
      'Receipt': 'bg-green-100 text-green-800',
      'Payment': 'bg-red-100 text-red-800',
      'Sanctioned': 'bg-blue-100 text-blue-800',
      'InProgress': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-green-100 text-green-800',
      'Billed': 'bg-purple-100 text-purple-800',
      'income': 'bg-emerald-100 text-emerald-800',
      'expenditure': 'bg-red-100 text-red-800',
      'revenue': 'bg-sky-100 text-sky-800',
      'capital': 'bg-violet-100 text-violet-800',
      'New': 'bg-blue-100 text-blue-800',
      'Repair': 'bg-amber-100 text-amber-800',
      'Maintenance': 'bg-purple-100 text-purple-800',
    };
    return <Badge className={`text-xs border-0 ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</Badge>;
  };

  // Render a table cell value
  const renderCellValue = (entry: Record<string, unknown>, col: { key: string; isAmount?: boolean }) => {
    const val = entry[col.key];
    if (col.isAmount) return formatCurrency(val);

    // Special rendering for employeeId in salary table
    if (col.key === 'employeeId' && activeTab === 'salary') {
      return getEmployeeName(String(val || ''));
    }

    // Special rendering for status and payment method columns
    if (col.key === 'status' || col.key === 'paymentMethod' || col.key === 'entryType' ||
        col.key === 'collectionType' || col.key === 'category' || col.key === 'type' ||
        col.key === 'workType') {
      return <StatusBadge status={String(val || '')} />;
    }

    // Special rendering for progressPercent
    if (col.key === 'progressPercent') {
      const pct = Number(val) || 0;
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#059669' : '#f59e0b' }} />
          </div>
          <span className="text-xs">{pct}%</span>
        </div>
      );
    }

    return String(val || '-');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }} />
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }}>
                <currentTab.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: currentTab.color }}>{currentTab.label}</h2>
                <p className="text-sm text-muted-foreground">{currentTab.labelEn}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs border-0 shadow-sm" style={{ background: currentTab.color + '20', color: currentTab.color }}>
                {displayEntries.length} नोंदी
              </Badge>
              <Badge className="text-xs border-0 bg-amber-50 text-amber-800">
                <IndianRupee className="h-3 w-3 mr-1" />
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${tab.gradientFrom}, ${tab.gradientTo})` } : {}}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="शोधा..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setFormData({}); }}
              className="h-9 text-white"
              style={{ background: `linear-gradient(135deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }}
            >
              <Plus className="h-4 w-4 mr-1" />
              नवीन एंट्री
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }} />
        {loading ? (
          <CardContent className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        ) : displayEntries.length === 0 ? (
          <CardContent className="p-12 text-center">
            <currentTab.icon className="h-16 w-16 mx-auto mb-4 opacity-20" style={{ color: currentTab.color }} />
            <p className="text-lg font-medium text-muted-foreground">कोणतीही नोंद नाही</p>
            <p className="text-sm text-muted-foreground mt-1">नवीन एंट्री जोडण्यासाठी वरील बटण वापरा</p>
          </CardContent>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ background: currentTab.color + '10' }}>
                  <TableHead className="text-xs font-semibold" style={{ color: currentTab.color }}>क्र.</TableHead>
                  {getTableColumns().map(col => (
                    <TableHead key={col.key} className="text-xs font-semibold" style={{ color: currentTab.color }}>
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold text-right" style={{ color: currentTab.color }}>क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.map((entry, idx) => (
                  <TableRow key={entry.id as string} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {getTableColumns().map(col => (
                      <TableCell key={col.key} className="text-sm">
                        {renderCellValue(entry, col)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(entry)} className="p-1 rounded hover:bg-blue-50">
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(entry.id as string)} className="p-1 rounded hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {displayEntries.length > 0 && (
          <div className="p-3 border-t flex items-center justify-between" style={{ background: currentTab.color + '08' }}>
            <span className="text-sm font-medium" style={{ color: currentTab.color }}>
              एकूण: {displayEntries.length} नोंदी
            </span>
            <span className="text-sm font-bold" style={{ color: currentTab.color }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        )}
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }}>
                {editingId ? <Edit3 className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
              </div>
              {editingId ? 'एंट्री संपादा' : 'नवीन एंट्री'} - {currentTab.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {getFormFields().map((field, fieldIdx) => (
              <React.Fragment key={field.name}>
                {/* Section header */}
                {field.sectionHeader && (
                  <div className="flex items-center gap-2 pt-2 pb-1 border-b" style={{ borderColor: field.sectionColor + '40' }}>
                    <div className="h-5 w-1.5 rounded-full" style={{ background: field.sectionColor }} />
                    <span className="text-sm font-semibold" style={{ color: field.sectionColor }}>{field.sectionHeader}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {field.readOnly && (
                      <span className="ml-2 text-xs text-emerald-600 flex items-center gap-0.5 inline-flex">
                        <Calculator className="h-3 w-3" />
                        स्वयं-गणना
                      </span>
                    )}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={String(formData[field.name] || '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="text-sm"
                      rows={2}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={String(formData[field.name] || '')}
                      onValueChange={val => setFormData(prev => ({ ...prev, [field.name]: val }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="निवडा..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'employee-select' ? (
                    <Select
                      value={String(formData[field.name] || '')}
                      onValueChange={val => setFormData(prev => ({ ...prev, [field.name]: val }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="कर्मचारी निवडा..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstNameMr || emp.firstName} {emp.lastNameMr || emp.lastName} ({emp.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'contractor-select' ? (
                    <Select
                      value={String(formData[field.name] || '')}
                      onValueChange={val => setFormData(prev => ({ ...prev, [field.name]: val }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="कंत्राटदार निवडा..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contractors.map(con => (
                          <SelectItem key={con.id} value={con.id}>
                            {con.firmName || `${con.firstName} ${con.lastName}`} ({con.contractorId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      value={String(formData[field.name] || '')}
                      onChange={e => {
                        const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                        if (activeTab === 'salary' && field.type === 'number' && !field.readOnly) {
                          handleSalaryFieldChange(field.name, value as number);
                        } else {
                          setFormData(prev => ({ ...prev, [field.name]: value }));
                        }
                      }}
                      className={`text-sm ${field.readOnly ? 'bg-emerald-50 border-emerald-200 font-semibold' : ''}`}
                      readOnly={field.readOnly}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
            {/* Property selector for collection and water-bill */}
            {(activeTab === 'collection' || activeTab === 'water-bill') && properties.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">मालमत्ता / Property</Label>
                <Select
                  value={String(formData.propertyId || '')}
                  onValueChange={val => setFormData(prev => ({ ...prev, propertyId: val }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="मालमत्ता निवडा..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.propertyNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Scheme selector for scheme-fund */}
            {activeTab === 'scheme-fund' && schemes.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">योजना / Scheme</Label>
                <Select
                  value={String(formData.schemeId || '')}
                  onValueChange={val => setFormData(prev => ({ ...prev, schemeId: val }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="योजना निवडा..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schemes.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.schemeNameMr || s.schemeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Salary calculation summary */}
            {activeTab === 'salary' && (Number(formData.grossSalary) > 0 || Number(formData.totalDeduction) > 0) && (
              <div className="mt-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm mb-2">
                  <Calculator className="h-4 w-4" />
                  वेतन गणना सारांश
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-emerald-100/70">
                    <div className="text-xs text-emerald-600">सकल वेतन</div>
                    <div className="text-sm font-bold text-emerald-800">{formatCurrency(formData.grossSalary)}</div>
                  </div>
                  <div className="p-2 rounded bg-red-100/70">
                    <div className="text-xs text-red-600">एकूण कपात</div>
                    <div className="text-sm font-bold text-red-800">{formatCurrency(formData.totalDeduction)}</div>
                  </div>
                  <div className="p-2 rounded bg-blue-100/70">
                    <div className="text-xs text-blue-600">निव्वळ वेतन</div>
                    <div className="text-sm font-bold text-blue-800">{formatCurrency(formData.netSalary)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-sm">रद्द करा</Button>
            <Button onClick={handleSubmit} className="text-white text-sm" style={{ background: `linear-gradient(135deg, ${currentTab.gradientFrom}, ${currentTab.gradientTo})` }}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {editingId ? 'अपडेट करा' : 'जतन करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
