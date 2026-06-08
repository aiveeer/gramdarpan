'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  FileText, Printer, RefreshCw, Search, Building2, IndianRupee,
  ChevronRight, Zap, Database, Calculator, CheckCircle2, AlertCircle,
  Layers, ArrowDownToLine, Hash, Users, MapPin, Route, Loader2,
  FileSpreadsheet, Eye
} from 'lucide-react';

interface TaxDetail {
  taxMasterId: string;
  taxName: string;
  taxNameMarathi: string;
  rate: number;
  amount: number;
}

interface OwnerInfo {
  owner: {
    firstName: string;
    lastName: string;
    firstNameMr: string;
    lastNameMr: string;
  };
  ownershipType: string;
}

interface PropertyInfo {
  id: string;
  propertyNumber: string;
  area: number | null;
  builtUpArea: number | null;
  constructionType: string | null;
  usageType: string | null;
  citySurveyNo: string | null;
  ward?: { wardNameMr: string; wardNumber: string; wardName: string };
  road?: { roadNameMr: string; roadNumber: string; roadName: string };
  owners: OwnerInfo[];
  taxRates: {
    taxMasterId: string;
    rate: number;
    taxMaster: { name: string; nameMarathi: string; isEnabled: boolean; order: number; category: string };
  }[];
}

interface Namuna8Record {
  id: string;
  propertyId: string;
  financialYear: string;
  taxDetails: string;
  totalTax: number;
  createdAt: string;
  property: PropertyInfo;
}

interface VillageInfo {
  gramPanchayatName: string;
  gramPanchayatNameMr: string;
  taluka: string;
  district: string;
  state: string;
  sarpanchNameMr?: string;
  secretaryNameMr?: string;
}

// Process flow step types
type ProcessStep = 'select' | 'fetch' | 'calculate' | 'generate';

const CONSTRUCTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'पक्के': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'अर्धपक्के': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'कच्चे': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'इतर': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
};

const USAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'राहणीमान': { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' },
  'व्यावसायिक': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  'औद्योगिक': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  'शेती': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
};

function getConstructionBadge(type: string | null) {
  if (!type) return <Badge variant="outline" className="text-xs">-</Badge>;
  const colors = CONSTRUCTION_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  return (
    <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-xs font-semibold`}>
      {type}
    </Badge>
  );
}

function getUsageBadge(type: string | null) {
  if (!type) return <Badge variant="outline" className="text-xs">-</Badge>;
  const colors = USAGE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  return (
    <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-xs font-semibold`}>
      {type}
    </Badge>
  );
}

export default function Namuna8Component() {
  const [records, setRecords] = useState<Namuna8Record[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [villageInfo, setVillageInfo] = useState<VillageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStep, setActiveStep] = useState<ProcessStep>('select');
  const [selectedRecord, setSelectedRecord] = useState<Namuna8Record | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({ current: 0, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, propRes, villageRes] = await Promise.all([
        fetch('/api/namuna8'),
        fetch('/api/master?table=property'),
        fetch('/api/master?table=village'),
      ]);
      setRecords(await recRes.json());
      setProperties(await propRes.json());
      const villageData = await villageRes.json();
      if (villageData && !Array.isArray(villageData)) setVillageInfo(villageData);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update process flow step
  useEffect(() => {
    if (selectedPropertyId) setActiveStep('fetch');
    else setActiveStep('select');
  }, [selectedPropertyId]);

  const handleGenerate = async () => {
    if (!selectedPropertyId) {
      toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setActiveStep('calculate');
    try {
      const res = await fetch('/api/namuna8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId, financialYear }),
      });
      if (res.ok) {
        setActiveStep('generate');
        toast({
          title: '✅ यशस्वी',
          description: 'नमुना ८ तयार झाला',
          className: 'border-green-300 bg-green-50',
        });
        fetchData();
        setTimeout(() => setActiveStep('select'), 2000);
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' });
        setActiveStep('fetch');
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'नमुना ८ तयार करण्यात अयशस्वी', variant: 'destructive' });
      setActiveStep('fetch');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (properties.length === 0) return;
    setGeneratingAll(true);
    setGenerating(true);
    setActiveStep('calculate');
    setGenerateProgress({ current: 0, total: properties.length });
    try {
      for (let i = 0; i < properties.length; i++) {
        await fetch('/api/namuna8', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: properties[i].id, financialYear }),
        });
        setGenerateProgress({ current: i + 1, total: properties.length });
      }
      setActiveStep('generate');
      toast({
        title: '✅ यशस्वी',
        description: `सर्व ${properties.length} मालमत्तांसाठी नमुना ८ तयार`,
        className: 'border-green-300 bg-green-50',
      });
      fetchData();
      setTimeout(() => setActiveStep('select'), 2000);
    } catch {
      toast({ title: 'त्रुटी', description: 'काही मालमत्तांसाठी तयार करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setGenerating(false);
      setGeneratingAll(false);
      setGenerateProgress({ current: 0, total: 0 });
    }
  };

  const getOwnerName = (prop: PropertyInfo) => {
    const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
    if (!owner)
      return prop.owners?.[0]
        ? `${prop.owners[0].owner.firstNameMr || prop.owners[0].owner.firstName} ${prop.owners[0].owner.lastNameMr || prop.owners[0].owner.lastName}`
        : '-';
    return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
  };

  const getOccupantName = (prop: PropertyInfo) => {
    const occupant = prop.owners?.find(o => o.ownershipType === 'भोगवटादार');
    if (!occupant) return '-';
    return `${occupant.owner.firstNameMr || occupant.owner.firstName} ${occupant.owner.lastNameMr || occupant.owner.lastName}`;
  };

  const parseTaxDetails = (taxDetailsStr: string): TaxDetail[] => {
    try {
      return JSON.parse(taxDetailsStr || '[]');
    } catch {
      return [];
    }
  };

  // Print template with Indian flag colors and government format
  const handlePrint = (record: Namuna8Record) => {
    const taxDetails = parseTaxDetails(record.taxDetails);
    const prop = record.property;
    const ownerName = getOwnerName(prop);
    const occupantName = getOccupantName(prop);

    const printContent = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना ८ - कर आकारणी नोंदवही</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; padding: 15px; font-size: 11px; color: #1a1a1a; }
  
  /* Indian Flag Header */
  .flag-bar { display: flex; height: 6px; width: 100%; }
  .flag-saffron { flex: 1; background: #FF9933; }
  .flag-white { flex: 1; background: #FFFFFF; }
  .flag-green { flex: 1; background: #138808; }
  
  .header-section { text-align: center; padding: 12px 0 8px; border-bottom: 2px solid #138808; margin-bottom: 12px; }
  .gp-name { font-size: 16px; font-weight: 700; color: #138808; margin-bottom: 2px; }
  .gp-name-en { font-size: 11px; color: #555; margin-bottom: 4px; }
  .form-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 6px 0 2px; }
  .form-title-en { font-size: 10px; color: #777; margin-bottom: 4px; }
  .fin-year { font-size: 12px; font-weight: 600; color: #FF9933; }
  
  /* Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; }
  .info-item { font-size: 11px; padding: 2px 0; }
  .info-item strong { display: inline-block; min-width: 120px; color: #333; }
  .info-item span { color: #1a1a1a; font-weight: 600; }
  
  /* Tax Table */
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #555; padding: 5px 8px; font-size: 11px; text-align: left; vertical-align: middle; }
  th { background: #138808; color: white; font-weight: 600; text-align: center; font-size: 10px; }
  th:last-child, td:last-child { text-align: right; }
  th:nth-child(4), td:nth-child(4) { text-align: center; }
  th:nth-child(3), td:nth-child(3) { text-align: right; }
  
  .row-even { background: #f0faf5; }
  .row-odd { background: #ffffff; }
  .total-row { background: #eafaf1 !important; font-weight: 700; }
  .total-row td { border-top: 2px solid #138808; font-size: 12px; }
  .total-amount { color: #138808; font-size: 14px; font-weight: 700; }
  
  /* Footer */
  .footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .signature-block { text-align: center; min-width: 120px; }
  .signature-line { border-top: 1px solid #333; padding-top: 4px; margin-top: 30px; font-size: 10px; font-weight: 600; }
  .watermark { position: fixed; bottom: 50%; right: 50%; transform: translate(50%, 50%); font-size: 60px; color: rgba(0,0,0,0.03); font-weight: 700; pointer-events: none; }
  
  @media print {
    body { padding: 5px; }
    .flag-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .row-even { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="watermark">नमुना ८</div>

<!-- Indian Flag Bar -->
<div class="flag-bar">
  <div class="flag-saffron"></div>
  <div class="flag-white"></div>
  <div class="flag-green"></div>
</div>

<!-- Header -->
<div class="header-section">
  <div class="gp-name">${villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'}</div>
  <div class="gp-name-en">${villageInfo?.gramPanchayatName || 'Gram Panchayat'}${villageInfo ? `, ${villageInfo.taluka}, ${villageInfo.district}` : ''}</div>
  <div class="form-title">नमुना ८ - कर आकारणी नोंदवही</div>
  <div class="form-title-en">Form 8 - Tax Assessment Register</div>
  <div class="fin-year">वित्तीय वर्ष / Financial Year: ${record.financialYear}</div>
</div>

<!-- Property Info -->
<div class="info-grid">
  <div class="info-item"><strong>मालमत्ता क्र.:</strong> <span>${prop.propertyNumber}</span></div>
  <div class="info-item"><strong>मालकाचे नाव:</strong> <span>${ownerName}</span></div>
  <div class="info-item"><strong>भोगवटादार:</strong> <span>${occupantName}</span></div>
  <div class="info-item"><strong>वार्ड:</strong> <span>${prop.ward?.wardNameMr || '-'}</span></div>
  <div class="info-item"><strong>रस्ता:</strong> <span>${prop.road?.roadNameMr || '-'}</span></div>
  <div class="info-item"><strong>क्षेत्रफळ:</strong> <span>${prop.area || 0} चौ.फूट</span></div>
  <div class="info-item"><strong>बांधकाम:</strong> <span>${prop.constructionType || '-'}</span></div>
  <div class="info-item"><strong>वापर:</strong> <span>${prop.usageType || '-'}</span></div>
  <div class="info-item"><strong>शहर सर्वे क्र.:</strong> <span>${prop.citySurveyNo || '-'}</span></div>
  <div class="info-item"><strong>बांधलेले क्षेत्रफळ:</strong> <span>${prop.builtUpArea || '-'} चौ.फूट</span></div>
</div>

<!-- Tax Breakdown Table -->
<table>
  <thead>
    <tr>
      <th style="width:30px">क्र.<br/>Sr</th>
      <th>कराचे नाव / Tax Name</th>
      <th style="width:80px">दर (₹)<br/>Rate</th>
      <th style="width:60px">क्षेत्रफळ<br/>Area</th>
      <th style="width:90px">रक्कम (₹)<br/>Amount</th>
    </tr>
  </thead>
  <tbody>
    ${taxDetails
      .map(
        (td, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td style="text-align:center">${i + 1}</td>
      <td>${td.taxNameMarathi} (${td.taxName})</td>
      <td style="text-align:right">${td.rate.toFixed(2)}</td>
      <td style="text-align:center">${prop.area || 0}</td>
      <td style="text-align:right; font-weight:600">₹${td.amount.toFixed(2)}</td>
    </tr>`
      )
      .join('')}
    <tr class="total-row">
      <td colspan="4" style="text-align:right; padding-right:10px;">एकूण कर / Total Tax</td>
      <td style="text-align:right"><span class="total-amount">₹${record.totalTax.toFixed(2)}</span></td>
    </tr>
  </tbody>
</table>

<!-- Footer Signatures -->
<div class="footer">
  <div class="signature-block">
    <div class="signature-line">मालकाची सही<br/>Owner Signature</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">ग्रामसेवक सही<br/>Gram Sevak Signature</div>
  </div>
  <div class="signature-block">
    <div class="signature-line">सरपंच सही व मुद्रा<br/>Sarpanch Signature & Seal</div>
  </div>
</div>

<div style="text-align:center; margin-top:15px; font-size:9px; color:#999;">
  दिनांक / Date: ${new Date().toLocaleDateString('mr-IN')} | नमुना ८ - कर आकारणी नोंदवही | ${villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'}
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  };

  // Print all records
  const handlePrintAll = () => {
    if (filtered.length === 0) {
      toast({ title: 'त्रुटी', description: 'प्रिंट करण्यासाठी रेकॉर्ड नाहीत', variant: 'destructive' });
      return;
    }

    const allRows = filtered
      .map((record, ri) => {
        const taxDetails = parseTaxDetails(record.taxDetails);
        const prop = record.property;
        const ownerName = getOwnerName(prop);
        const occupantName = getOccupantName(prop);

        return `
      <div style="page-break-inside:avoid; margin-bottom:20px; ${ri > 0 ? 'page-break-before:auto;' : ''}">
        <!-- Indian Flag Bar -->
        <div class="flag-bar">
          <div class="flag-saffron"></div>
          <div class="flag-white"></div>
          <div class="flag-green"></div>
        </div>
        
        <div class="header-section">
          <div class="gp-name">${villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'}</div>
          <div class="gp-name-en">${villageInfo?.gramPanchayatName || 'Gram Panchayat'}${villageInfo ? `, ${villageInfo.taluka}, ${villageInfo.district}` : ''}</div>
          <div class="form-title">नमुना ८ - कर आकारणी नोंदवही</div>
          <div class="fin-year">वित्तीय वर्ष: ${record.financialYear}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item"><strong>मालमत्ता क्र.:</strong> <span>${prop.propertyNumber}</span></div>
          <div class="info-item"><strong>मालकाचे नाव:</strong> <span>${ownerName}</span></div>
          <div class="info-item"><strong>भोगवटादार:</strong> <span>${occupantName}</span></div>
          <div class="info-item"><strong>वार्ड:</strong> <span>${prop.ward?.wardNameMr || '-'}</span></div>
          <div class="info-item"><strong>रस्ता:</strong> <span>${prop.road?.roadNameMr || '-'}</span></div>
          <div class="info-item"><strong>क्षेत्रफळ:</strong> <span>${prop.area || 0} चौ.फूट</span></div>
          <div class="info-item"><strong>बांधकाम:</strong> <span>${prop.constructionType || '-'}</span></div>
          <div class="info-item"><strong>वापर:</strong> <span>${prop.usageType || '-'}</span></div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width:30px">क्र.</th>
              <th>कराचे नाव</th>
              <th style="width:80px">दर (₹)</th>
              <th style="width:60px">क्षेत्रफळ</th>
              <th style="width:90px">रक्कम (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${taxDetails
              .map(
                (td, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
              <td style="text-align:center">${i + 1}</td>
              <td>${td.taxNameMarathi} (${td.taxName})</td>
              <td style="text-align:right">${td.rate.toFixed(2)}</td>
              <td style="text-align:center">${prop.area || 0}</td>
              <td style="text-align:right; font-weight:600">₹${td.amount.toFixed(2)}</td>
            </tr>`
              )
              .join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align:right; padding-right:10px;">एकूण कर</td>
              <td style="text-align:right"><span class="total-amount">₹${record.totalTax.toFixed(2)}</span></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <div class="signature-block"><div class="signature-line">मालकाची सही</div></div>
          <div class="signature-block"><div class="signature-line">ग्रामसेवक सही</div></div>
          <div class="signature-block"><div class="signature-line">सरपंच सही व मुद्रा</div></div>
        </div>
      </div>`;
      })
      .join('');

    const printContent = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना ८ - सर्व रेकॉर्ड्स</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; padding: 15px; font-size: 11px; color: #1a1a1a; }
  .flag-bar { display: flex; height: 6px; width: 100%; }
  .flag-saffron { flex: 1; background: #FF9933; }
  .flag-white { flex: 1; background: #FFFFFF; }
  .flag-green { flex: 1; background: #138808; }
  .header-section { text-align: center; padding: 10px 0 6px; border-bottom: 2px solid #138808; margin-bottom: 10px; }
  .gp-name { font-size: 15px; font-weight: 700; color: #138808; }
  .gp-name-en { font-size: 10px; color: #555; }
  .form-title { font-size: 13px; font-weight: 700; margin: 4px 0; }
  .fin-year { font-size: 11px; font-weight: 600; color: #FF9933; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 15px; margin: 8px 0; padding: 6px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; }
  .info-item { font-size: 10px; padding: 1px 0; }
  .info-item strong { display: inline-block; min-width: 110px; color: #333; }
  .info-item span { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { border: 1px solid #555; padding: 4px 6px; font-size: 10px; text-align: left; vertical-align: middle; }
  th { background: #138808; color: white; font-weight: 600; text-align: center; }
  th:last-child, td:last-child { text-align: right; }
  th:nth-child(4), td:nth-child(4) { text-align: center; }
  th:nth-child(3), td:nth-child(3) { text-align: right; }
  .row-even { background: #f0faf5; }
  .row-odd { background: #ffffff; }
  .total-row { background: #eafaf1 !important; font-weight: 700; }
  .total-row td { border-top: 2px solid #138808; }
  .total-amount { color: #138808; font-size: 13px; font-weight: 700; }
  .footer { margin-top: 15px; display: flex; justify-content: space-between; }
  .signature-block { text-align: center; min-width: 100px; }
  .signature-line { border-top: 1px solid #333; padding-top: 3px; margin-top: 25px; font-size: 9px; font-weight: 600; }
  @media print { .flag-bar, th, .row-even, .total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${allRows}</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  };

  const filtered = records.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.property.propertyNumber.toLowerCase().includes(s) ||
      getOwnerName(r.property).toLowerCase().includes(s) ||
      (r.property.ward?.wardNameMr || '').toLowerCase().includes(s)
    );
  });

  const totalTaxAmount = filtered.reduce((sum, r) => sum + r.totalTax, 0);
  const totalProperties = filtered.length;

  const processSteps: { key: ProcessStep; label: string; labelEn: string; icon: React.ReactNode; color: string }[] = [
    { key: 'select', label: 'मालमत्ता निवडा', labelEn: 'Select Property', icon: <Building2 className="h-4 w-4" />, color: '#0d7377' },
    { key: 'fetch', label: 'मास्टर डेटा', labelEn: 'Master Data', icon: <Database className="h-4 w-4" />, color: '#2ecc71' },
    { key: 'calculate', label: 'कर गणना', labelEn: 'Tax Calculation', icon: <Calculator className="h-4 w-4" />, color: '#27ae60' },
    { key: 'generate', label: 'नमुना ८ तयार', labelEn: 'Generate', icon: <FileText className="h-4 w-4" />, color: '#1e8449' },
  ];

  const getStepIndex = (step: ProcessStep) => processSteps.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(activeStep);

  // Selected property info
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="space-y-5">
      {/* ===== HEADER CARD WITH GRADIENT ===== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #1e8449 0%, #27ae60 30%, #0d7377 70%, #16a085 100%)',
          }}
        >
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)',
            }}
          />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                >
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">नमुना ८</h1>
                  <p className="text-green-100 text-sm font-medium">कर आकारणी नोंदवही</p>
                  <p className="text-green-200/70 text-xs">Tax Assessment Register</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-xs px-3 py-1">
                  <Hash className="h-3 w-3 mr-1" />
                  {records.length} रेकॉर्ड्स
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchData}
                  disabled={loading}
                  className="text-white hover:bg-white/20 h-9"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  रिफ्रेश
                </Button>
              </div>
            </div>

            {/* Process Flow Indicator */}
            <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-xs font-medium">प्रक्रिया प्रवाह / Process Flow</span>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  Step {currentStepIndex + 1} / {processSteps.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {processSteps.map((step, i) => {
                  const isActive = i === currentStepIndex;
                  const isCompleted = i < currentStepIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <div
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: isActive
                            ? 'rgba(255,255,255,0.3)'
                            : isCompleted
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(255,255,255,0.05)',
                          border: isActive ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid transparent',
                        }}
                      >
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: isCompleted
                              ? '#2ecc71'
                              : isActive
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(255,255,255,0.1)',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <span className="text-white font-semibold">{i + 1}</span>
                          )}
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-white text-xs font-semibold leading-tight">{step.label}</div>
                          <div className="text-white/50 text-[10px] leading-tight">{step.labelEn}</div>
                        </div>
                      </div>
                      {i < processSteps.length - 1 && (
                        <ChevronRight
                          className="h-4 w-4 text-white/30 flex-shrink-0"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== CONTROLS CARD ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #27ae60, #2ecc71, #0d7377)' }} />
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Property Select */}
            <div className="lg:col-span-4">
              <Label className="text-sm font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                मालमत्ता निवडा
              </Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="border-green-200 focus:ring-green-500/20 focus:border-green-400 h-10">
                  <SelectValue placeholder="मालमत्ता निवडा..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-semibold">{p.propertyNumber}</span>
                      <span className="text-muted-foreground"> - {getOwnerName(p)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Financial Year */}
            <div className="lg:col-span-3">
              <Label className="text-sm font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                वित्तीय वर्ष
              </Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger className="border-green-200 focus:ring-green-500/20 focus:border-green-400 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'].map(y => (
                    <SelectItem key={y} value={y}>
                      <span className="font-semibold">{y}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="lg:col-span-3 flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedPropertyId}
                className="w-full h-10 text-sm font-semibold shadow-md"
                style={{
                  background: generating || !selectedPropertyId ? undefined : 'linear-gradient(135deg, #27ae60, #2ecc71)',
                }}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    तयार होत आहे...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1.5" />
                    नमुना ८ तयार करा
                  </>
                )}
              </Button>
            </div>

            {/* Generate All Button */}
            <div className="lg:col-span-2 flex items-end">
              <Button
                variant="outline"
                onClick={handleGenerateAll}
                disabled={generating || properties.length === 0}
                className="w-full h-10 text-sm border-2 border-green-300 text-green-700 hover:bg-green-50 font-semibold"
              >
                {generatingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {generateProgress.current}/{generateProgress.total}
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4 mr-1" />
                    सर्वांसाठी
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected Property Preview */}
          {selectedProperty && (
            <div className="mt-4 p-3 rounded-lg border border-green-200" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-green-900 text-sm">{selectedProperty.propertyNumber}</span>
                    {getConstructionBadge(selectedProperty.constructionType)}
                    {getUsageBadge(selectedProperty.usageType)}
                    <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs">
                      <MapPin className="h-3 w-3 mr-0.5" />
                      {selectedProperty.ward?.wardNameMr || '-'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-green-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {getOwnerName(selectedProperty)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      {selectedProperty.road?.roadNameMr || '-'}
                    </span>
                    <span>क्षेत्रफळ: {selectedProperty.area || 0} चौ.फूट</span>
                    <span>कर दर: {selectedProperty.taxRates.filter(t => t.taxMaster.isEnabled).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
              <Input
                placeholder="मालमत्ता क्र./मालक नाव/वार्ड शोधा..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:ring-green-500/20 focus:border-green-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
            <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-800">{totalProperties}</div>
            <div className="text-xs text-green-600">एकूण रेकॉर्ड्स</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #e8f8f5, #f0fafa)' }}>
            <Building2 className="h-5 w-5 mx-auto mb-1 text-teal-600" />
            <div className="text-2xl font-bold text-teal-800">{properties.length}</div>
            <div className="text-xs text-teal-600">एकूण मालमत्ता</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #fdebd0, #fef9e7)' }}>
            <IndianRupee className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-2xl font-bold text-amber-800">
              ₹{totalTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-amber-600">एकूण कर</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #eafaf1, #e8f8f5)' }}>
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <div className="text-2xl font-bold text-emerald-800">
              {totalProperties > 0 ? (totalTaxAmount / totalProperties).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
            </div>
            <div className="text-xs text-emerald-600">सरासरी कर (₹)</div>
          </CardContent>
        </Card>
      </div>

      {/* ===== RECORDS TABLE ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #1e8449, #27ae60, #2ecc71)' }} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              कर आकारणी नोंदवही
            </CardTitle>
            <div className="flex items-center gap-2">
              {filtered.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintAll}
                  className="text-green-700 border-green-300 hover:bg-green-50"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  सर्व प्रिंट
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-green-300" />
              </div>
              <p className="text-muted-foreground font-medium">नमुना ८ रेकॉर्ड नाहीत</p>
              <p className="text-xs text-muted-foreground mt-1">
                वरील निवडीवरून मालमत्ता निवडून &quot;नमुना ८ तयार करा&quot बटण दाबा
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <style jsx>{`
                div::-webkit-scrollbar { width: 6px; }
                div::-webkit-scrollbar-track { background: #f0faf5; border-radius: 3px; }
                div::-webkit-scrollbar-thumb { background: #2ecc71; border-radius: 3px; }
                div::-webkit-scrollbar-thumb:hover { background: #27ae60; }
              `}</style>
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    <TableHead className="text-green-800 font-semibold text-xs">क्र.</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">मालमत्ता क्र.</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">मालक</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">वार्ड</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">क्षेत्रफळ</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">बांधकाम</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">वापर</TableHead>
                    <TableHead className="text-green-800 font-semibold text-xs">वित्तीय वर्ष</TableHead>
                    <TableHead className="text-right text-green-800 font-semibold text-xs">एकूण कर (₹)</TableHead>
                    <TableHead className="text-center text-green-800 font-semibold text-xs">क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className={`cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-green-50/30'} hover:bg-green-50`}
                    >
                      <TableCell className="text-xs font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <span className="font-bold text-green-800 text-sm">{r.property.propertyNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm">{getOwnerName(r.property)}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {r.property.ward?.wardNameMr || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.property.area || '-'}
                        <span className="text-xs ml-0.5">चौ.फूट</span>
                      </TableCell>
                      <TableCell>{getConstructionBadge(r.property.constructionType)}</TableCell>
                      <TableCell>{getUsageBadge(r.property.usageType)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs font-semibold">
                          <Layers className="h-3 w-3 mr-0.5" />
                          {r.financialYear}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className="font-bold text-lg"
                          style={{ color: '#27ae60' }}
                        >
                          ₹{r.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(r);
                              setShowDetail(true);
                            }}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="सविस्तर पहा"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(r)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="प्रिंट"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Total Footer */}
          {filtered.length > 0 && (
            <div className="mt-4 p-4 rounded-xl border-2 border-green-200" style={{ background: 'linear-gradient(135deg, #eafaf1, #d5f5e3)' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-green-700 font-medium">एकूण कर रक्कम (Total Tax)</div>
                    <div className="text-xs text-green-600">
                      {totalProperties} मालमत्तांसाठी / For {totalProperties} properties
                    </div>
                  </div>
                </div>
                <div
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                  style={{ color: '#27ae60' }}
                >
                  ₹{totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== DETAIL MODAL (INLINE) ===== */}
      {showDetail && selectedRecord && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)' }} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                </div>
                कर विभाजन सविस्तर माहिती
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedRecord(null);
                }}
                className="text-muted-foreground"
              >
                ✕ बंद करा
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Property Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'मालमत्ता क्र.', value: selectedRecord.property.propertyNumber, icon: <Building2 className="h-3.5 w-3.5" /> },
                { label: 'मालक', value: getOwnerName(selectedRecord.property), icon: <Users className="h-3.5 w-3.5" /> },
                { label: 'वार्ड', value: selectedRecord.property.ward?.wardNameMr || '-', icon: <MapPin className="h-3.5 w-3.5" /> },
                { label: 'रस्ता', value: selectedRecord.property.road?.roadNameMr || '-', icon: <Route className="h-3.5 w-3.5" /> },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-green-100 bg-green-50/50">
                  <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className="font-bold text-green-900 text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'क्षेत्रफळ', value: `${selectedRecord.property.area || 0} चौ.फूट` },
                { label: 'बांधकाम', value: selectedRecord.property.constructionType || '-' },
                { label: 'वापर', value: selectedRecord.property.usageType || '-' },
                {
                  label: 'वित्तीय वर्ष',
                  value: selectedRecord.financialYear,
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-teal-100 bg-teal-50/50">
                  <div className="text-xs text-teal-600 mb-1">{item.label}</div>
                  <div className="font-bold text-teal-900 text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Tax Breakdown Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(90deg, #1e8449, #27ae60)' }}>
                    <TableHead className="text-white font-semibold text-xs">क्र.</TableHead>
                    <TableHead className="text-white font-semibold text-xs">कराचे नाव</TableHead>
                    <TableHead className="text-white font-semibold text-xs text-right">दर (₹/चौ.फूट)</TableHead>
                    <TableHead className="text-white font-semibold text-xs text-center">क्षेत्रफळ</TableHead>
                    <TableHead className="text-white font-semibold text-xs text-right">रक्कम (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseTaxDetails(selectedRecord.taxDetails).map((td, i) => (
                    <TableRow
                      key={td.taxMasterId}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-green-50/50'}
                    >
                      <TableCell className="text-xs font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-900 text-sm">{td.taxNameMarathi}</div>
                        <div className="text-xs text-muted-foreground">{td.taxName}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">₹{td.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-sm">{selectedRecord.property.area || 0}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-700">₹{td.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-green-100/80">
                    <TableCell colSpan={4} className="text-right font-bold text-green-900 text-sm pr-4">
                      एकूण कर / Total Tax
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="font-extrabold text-lg"
                        style={{ color: '#27ae60' }}
                      >
                        ₹{selectedRecord.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Calculation Formula */}
            <div className="mt-4 p-3 rounded-lg border border-green-200 bg-green-50/50">
              <div className="text-xs text-green-700 font-medium mb-1">गणना सूत्र (Calculation Formula):</div>
              <div className="text-xs text-green-800 font-mono">
                कर रक्कम = दर (Rate) × क्षेत्रफळ (Area) | एकूण कर = सर्व सक्षम करांची बेरीज
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedRecord(null);
                }}
                className="border-green-300 text-green-700"
              >
                बंद करा
              </Button>
              <Button
                size="sm"
                onClick={() => handlePrint(selectedRecord)}
                className="shadow-md"
                style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}
              >
                <Printer className="h-4 w-4 mr-1" />
                प्रिंट करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== VILLAGE INFO FOOTER ===== */}
      {villageInfo && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)' }} />
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-green-800">{villageInfo.gramPanchayatNameMr}</span>
                <span>|</span>
                <span>{villageInfo.taluka}, {villageInfo.district}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-green-600" />
                <span>नमुना ८ - कर आकारणी नोंदवही</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
