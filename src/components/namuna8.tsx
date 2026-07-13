'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  FileText, Printer, RefreshCw, Search, Building2, IndianRupee,
  ChevronRight, Zap, Database, Calculator, CheckCircle2, AlertCircle,
  Layers, ArrowDownToLine, Hash, Users, MapPin, Route, Loader2,
  Landmark, Scale, BookOpen
} from 'lucide-react';

// ===== INTERFACES =====

interface ConstructionDetail {
  type: string;
  rate: number;
  area: number;
  capitalValue: number;
  taxAmount: number;
}

interface OwnerInfo {
  owner: { firstName: string; lastName: string; firstNameMr: string; lastNameMr: string };
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
  yearBuilt?: string;
  ward?: { wardNameMr: string; wardNumber: string; wardName: string };
  road?: { roadNameMr: string; roadNumber: string; roadName: string };
  owners: OwnerInfo[];
  taxRates: { taxMasterId: string; rate: number; taxMaster: { name: string; nameMarathi: string; isEnabled: boolean; order: number; category: string } }[];
}

interface Namuna8Record {
  id: string;
  propertyId: string;
  financialYear: string;
  taxDetails: string;
  totalTax: number;
  totalArea?: number;
  landRate?: number;
  buildingRate?: number;
  constructionRate?: number;
  depreciationRate?: number;
  usageFactor?: number;
  capitalValue?: number;
  taxRatePercent?: number;
  houseTaxAmt?: number;
  lightTaxAmt?: number;
  healthTaxAmt?: number;
  waterTaxAmt?: number;
  totalTaxAmt?: number;
  constructionDetails?: string;
  appealHouseTax?: number;
  appealLightTax?: number;
  appealHealthTax?: number;
  appealWaterTax?: number;
  appealTotalTax?: number;
  remarks?: string;
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

// ===== CONSTANTS =====

type ProcessStep = 'select' | 'fetch' | 'calculate' | 'generate';

const CONSTRUCTION_TYPES = [
  { type: 'झोपडी किंवा मातीचे घर', rate: 6403 },
  { type: 'दगड विटा/मातीचे बांधकाम', rate: 9979 },
  { type: 'दगड विट/सिमेंटचे बांधकाम', rate: 14923 },
  { type: 'आर.सि.सि. बांधकाम', rate: 17424 },
  { type: 'पहिला मजला', rate: 34848 },
  { type: 'जमीन/खुली जागा', rate: 1310 },
];

const BOUNDARY_DIRS = [
  { key: 'East', label: 'पूर्व', bField: 'boundaryEast' as const, lField: 'lengthEast' as const, wField: 'widthEast' as const },
  { key: 'West', label: 'पश्चिम', bField: 'boundaryWest' as const, lField: 'lengthWest' as const, wField: 'widthWest' as const },
  { key: 'South', label: 'दक्षिण', bField: 'boundarySouth' as const, lField: 'lengthSouth' as const, wField: 'widthSouth' as const },
  { key: 'North', label: 'उत्तर', bField: 'boundaryNorth' as const, lField: 'lengthNorth' as const, wField: 'widthNorth' as const },
];

const fmt = (n: number | null | undefined, d = 2) => {
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

// Shared cell classes
const cellBase = 'border border-green-300 px-1 py-1 text-[10px]';
const cellR = `${cellBase} text-right`;
const cellC = `${cellBase} text-center`;

// ===== MAIN COMPONENT =====

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
      const recData = await recRes.json();
      setRecords(Array.isArray(recData) ? recData : []);
      const propData = await propRes.json();
      setProperties(Array.isArray(propData) ? propData : []);
      const vd = await villageRes.json();
      if (vd && !Array.isArray(vd)) setVillageInfo(vd);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setActiveStep(selectedPropertyId ? 'fetch' : 'select'); }, [selectedPropertyId]);

  const handleGenerate = async () => {
    if (!selectedPropertyId) { toast({ title: 'त्रुटी', description: 'मालमत्ता निवडा', variant: 'destructive' }); return; }
    setGenerating(true); setActiveStep('calculate');
    try {
      const res = await fetch('/api/namuna8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: selectedPropertyId, financialYear }) });
      if (res.ok) { setActiveStep('generate'); toast({ title: 'यशस्वी', description: 'नमुना ८ तयार झाला' }); fetchData(); setTimeout(() => setActiveStep('select'), 2000); }
      else { const err = await res.json(); toast({ title: 'त्रुटी', description: err.error, variant: 'destructive' }); setActiveStep('fetch'); }
    } catch { toast({ title: 'त्रुटी', description: 'नमुना ८ तयार करण्यात अयशस्वी', variant: 'destructive' }); setActiveStep('fetch'); }
    finally { setGenerating(false); }
  };

  const handleGenerateAll = async () => {
    if (properties.length === 0) return;
    setGeneratingAll(true); setGenerating(true); setActiveStep('calculate');
    setGenerateProgress({ current: 0, total: properties.length });
    try {
      for (let i = 0; i < properties.length; i++) {
        await fetch('/api/namuna8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: properties[i].id, financialYear }) });
        setGenerateProgress({ current: i + 1, total: properties.length });
      }
      setActiveStep('generate'); toast({ title: 'यशस्वी', description: `सर्व ${properties.length} मालमत्तांसाठी नमुना ८ तयार` });
      fetchData(); setTimeout(() => setActiveStep('select'), 2000);
    } catch { toast({ title: 'त्रुटी', description: 'काही मालमत्तांसाठी तयार करण्यात अयशस्वी', variant: 'destructive' }); }
    finally { setGenerating(false); setGeneratingAll(false); setGenerateProgress({ current: 0, total: 0 }); }
  };

  const getOwnerName = (prop: PropertyInfo) => {
    const o = prop.owners?.find(x => x.ownershipType === 'मालक');
    if (!o) return prop.owners?.[0] ? `${prop.owners[0].owner.firstNameMr || prop.owners[0].owner.firstName} ${prop.owners[0].owner.lastNameMr || prop.owners[0].owner.lastName}` : '-';
    return `${o.owner.firstNameMr || o.owner.firstName} ${o.owner.lastNameMr || o.owner.lastName}`;
  };

  const getOccupantName = (prop: PropertyInfo) => {
    const o = prop.owners?.find(x => x.ownershipType === 'भोगवटादार');
    if (!o) return getOwnerName(prop);
    return `${o.owner.firstNameMr || o.owner.firstName} ${o.owner.lastNameMr || o.owner.lastName}`;
  };

  const parseCD = (s: string | null | undefined): ConstructionDetail[] => { try { return JSON.parse(s || '[]'); } catch { return []; } };

  const filtered = records.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return r.property.propertyNumber.toLowerCase().includes(s) || getOwnerName(r.property).toLowerCase().includes(s) || (r.property.ward?.wardNameMr || '').toLowerCase().includes(s);
  });

  const totalTaxAmount = filtered.reduce((s, r) => s + (r.totalTaxAmt || r.totalTax || 0), 0);
  const totalProperties = filtered.length;
  const avgTax = totalProperties > 0 ? totalTaxAmount / totalProperties : 0;
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Process steps
  const processSteps: { key: ProcessStep; label: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: 'select', label: 'मालमत्ता निवडा', labelEn: 'Select Property', icon: <Building2 className="h-4 w-4" /> },
    { key: 'fetch', label: 'मास्टर डेटा', labelEn: 'Master Data', icon: <Database className="h-4 w-4" /> },
    { key: 'calculate', label: 'कर गणना', labelEn: 'Tax Calculation', icon: <Calculator className="h-4 w-4" /> },
    { key: 'generate', label: 'नमुना ८ तयार', labelEn: 'Generate', icon: <FileText className="h-4 w-4" /> },
  ];
  const currentStepIndex = processSteps.findIndex(s => s.key === activeStep);

  // ===== PRINT FUNCTION =====
  const handlePrintGovFormat = () => {
    if (filtered.length === 0) { toast({ title: 'त्रुटी', description: 'प्रिंट करण्यासाठी रेकॉर्ड नाहीत', variant: 'destructive' }); return; }
    const gpName = villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत';
    const taluka = villageInfo?.taluka || '';
    const district = villageInfo?.district || '';
    const fyParts = financialYear.split('-');
    const fyFull = `सन ${fyParts[0]}-${(fyParts[1]?.length === 2 ? '20' : '') + (fyParts[1] || '')}`;

    // Build rows for each property
    const rows = filtered.map((rec, idx) => {
      const p = rec.property;
      const on = getOwnerName(p);
      const occ = getOccupantName(p);
      const cd = parseCD(rec.constructionDetails).filter(c => c.area > 0);
      const rn = p.road?.roadNameMr || '-';
      const totalBlockRows = 4 + Math.max(cd.length, 1) + 1 + 1; // boundaries + constructions + total + note

      const rowBg = idx % 2 === 0 ? '#f0faf5' : '#ffffff';
      const allRows: string[] = [];

      // 4 Boundary rows
      BOUNDARY_DIRS.forEach((dir, bi) => {
        const bName = p[dir.bField] || '-';
        const bLen = p[dir.lField] || (bi === 0 ? p.totalLength : null) || '';
        const bWid = p[dir.wField] || (bi === 0 ? p.totalWidth : null) || '';
        allRows.push(`<tr style="background:${rowBg}">
          ${bi === 0 ? `<td rowspan="${totalBlockRows}" class="ctr" style="font-weight:700">${idx + 1}</td><td rowspan="${totalBlockRows}">${rn}</td><td rowspan="${totalBlockRows}" class="ctr">${p.citySurveyNo || '-'}</td><td rowspan="${totalBlockRows}" class="ctr" style="font-weight:700;color:#1a5632">${p.propertyNumber}</td><td rowspan="${totalBlockRows}">${on}</td><td rowspan="${totalBlockRows}">${occ}</td>` : ''}
          <td class="ctr" style="font-weight:600;color:#1a5632">${dir.label}</td>
          <td>${bName}</td>
          <td class="rt">${bLen || '-'}</td>
          <td class="rt">${bWid || '-'}</td>
          ${bi === 0 ? `<td rowspan="4">${p.constructionType || '-'}</td><td rowspan="4" class="ctr">${p.yearBuilt || '-'}</td><td rowspan="4" class="rt">${fmt(p.builtUpArea || p.area)}</td><td rowspan="4" class="rt">${fmt(rec.landRate)}</td><td rowspan="4" class="rt">${fmt(rec.buildingRate)}</td><td rowspan="4" class="rt">${fmt(rec.constructionRate)}</td><td rowspan="4" class="rt">${fmt(rec.depreciationRate)}</td><td rowspan="4" class="rt">${fmt(rec.usageFactor)}</td><td rowspan="4" class="rt" style="font-weight:700">${fmt(rec.capitalValue)}</td><td rowspan="4" class="rt">${fmt(rec.taxRatePercent)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt" style="font-weight:600">${fmt(rec.houseTaxAmt)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.lightTaxAmt)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.healthTaxAmt)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.waterTaxAmt)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt bold" style="color:#138808">${fmt(rec.totalTaxAmt)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.appealHouseTax)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.appealLightTax)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.appealHealthTax)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.appealWaterTax)}</td><td rowspan="${Math.max(cd.length, 1)}" class="rt">${fmt(rec.appealTotalTax)}</td><td rowspan="${totalBlockRows}">${rec.remarks || '-'}</td>` : ''}
        </tr>`);
      });

      // Construction type rows
      if (cd.length > 0) {
        cd.forEach((c, ci) => {
          allRows.push(`<tr style="background:${rowBg}">
            <td colspan="4"></td>
            <td style="font-weight:600">${c.type}</td>
            <td class="ctr">${ci === 0 ? (p.yearBuilt || '-') : ''}</td>
            <td class="rt">${fmt(c.area)}</td>
            <td class="rt">${c.type === 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
            <td class="rt">${c.type !== 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
            <td class="rt">${c.type !== 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
            <td class="rt">${fmt(rec.depreciationRate)}</td>
            <td class="rt">${fmt(rec.usageFactor)}</td>
            <td class="rt" style="font-weight:700">${fmt(c.capitalValue)}</td>
            <td class="rt">${fmt(rec.taxRatePercent)}</td>
            ${ci === 0 ? '' : ''}
          </tr>`);
        });
      } else {
        allRows.push(`<tr style="background:${rowBg}">
          <td colspan="4"></td>
          <td>${p.constructionType || '-'}</td>
          <td class="ctr">${p.yearBuilt || '-'}</td>
          <td class="rt">${fmt(p.builtUpArea || p.area)}</td>
          <td class="rt">${fmt(rec.landRate)}</td>
          <td class="rt">${fmt(rec.buildingRate)}</td>
          <td class="rt">${fmt(rec.constructionRate)}</td>
          <td class="rt">${fmt(rec.depreciationRate)}</td>
          <td class="rt">${fmt(rec.usageFactor)}</td>
          <td class="rt" style="font-weight:700">${fmt(rec.capitalValue)}</td>
          <td class="rt">${fmt(rec.taxRatePercent)}</td>
        </tr>`);
      }

      // Total row
      allRows.push(`<tr class="total-row">
        <td colspan="8" class="rt bold" style="padding-right:6px">एकुण</td>
        <td class="rt bold">${fmt(rec.totalArea || p.builtUpArea || p.area)}</td>
        <td colspan="8"></td>
        <td class="rt bold">${fmt(rec.houseTaxAmt)}</td>
        <td class="rt bold">${fmt(rec.lightTaxAmt)}</td>
        <td class="rt bold">${fmt(rec.healthTaxAmt)}</td>
        <td class="rt bold">${fmt(rec.waterTaxAmt)}</td>
        <td class="rt bold" style="color:#138808;font-size:11px">₹${fmt(rec.totalTaxAmt)}</td>
        <td class="rt">${fmt(rec.appealHouseTax)}</td>
        <td class="rt">${fmt(rec.appealLightTax)}</td>
        <td class="rt">${fmt(rec.appealHealthTax)}</td>
        <td class="rt">${fmt(rec.appealWaterTax)}</td>
        <td class="rt">${fmt(rec.appealTotalTax)}</td>
      </tr>`);

      // Note row
      allRows.push(`<tr class="note-row"><td colspan="31" style="text-align:left;padding:2px 6px;font-size:8px">शेरे: ${rec.remarks || '-'} | सरपंचाची स्वाक्षरी: ________________</td></tr>`);

      return allRows.join('\n');
    }).join('\n');

    const html = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना ८</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans Devanagari',Arial,sans-serif;padding:10px;font-size:9px;color:#1a1a1a}
  .flag-bar{display:flex;height:5px;width:100%}.flag-saffron{flex:1;background:#FF9933}.flag-white{flex:1;background:#FFF}.flag-green{flex:1;background:#138808}
  .form-header{text-align:center;padding:6px 0;border-bottom:2px solid #138808;margin-bottom:6px}
  .form-title{font-size:12px;font-weight:700}.rule-ref{font-size:9px;color:#666}
  .fy-row{display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:3px 6px;background:#f8f9fa;border:1px solid #ddd}
  .fy-row span{font-size:10px;font-weight:600}
  .gp-info{display:flex;justify-content:space-between;font-size:9px;padding:2px 6px}
  .gp-info span{font-weight:600}
  table{width:100%;border-collapse:collapse;margin:6px 0}
  th,td{border:1px solid #555;padding:2px 3px;font-size:7.5px;text-align:center;vertical-align:middle;line-height:1.3}
  th{background:#138808;color:#fff;font-weight:600;font-size:7px}
  .rt{text-align:right}.ctr{text-align:center}.bold{font-weight:700}
  .total-row{background:#c8e6c9!important;font-weight:700}.total-row td{border-top:2px solid #138808;font-size:8px}
  .note-row{background:#fff9c4!important}
  .header-main th{background:#0d5c2e;font-size:7.5px;padding:3px 1px}
  .header-sub th{background:#138808;font-size:7px;padding:2px}
  .header-num th{background:#1a7a3a;font-size:7px;padding:1px;color:#c8e6c9}
  .footer{margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end}
  .sig-block{text-align:center;min-width:120px}
  .sig-line{border-top:1px solid #333;padding-top:3px;margin-top:25px;font-size:9px;font-weight:600}
  @media print{body{padding:3px;font-size:7px}.flag-bar,th,.total-row,.note-row{-webkit-print-color-adjust:exact;print-color-adjust:exact}table{page-break-inside:auto}tr{page-break-inside:avoid}}
</style></head><body>
<div class="flag-bar"><div class="flag-saffron"></div><div class="flag-white"></div><div class="flag-green"></div></div>
<div class="form-header"><div class="form-title">नमुना नंबर ८</div><div class="rule-ref">नियम (३२) १ पहा</div></div>
<div class="fy-row"><span>${fyFull} या वर्षासाठी कर आकारणी नोंदवही</span><span style="font-size:9px">पान क्र. _____</span></div>
<div class="gp-info"><span>ग्रामपंचायत: ${gpName}</span><span>तालुका: ${taluka}</span><span>जिल्हा: ${district}</span></div>
<table><thead>
<tr class="header-main"><th rowspan="3" style="width:20px">अ.क्र.</th><th rowspan="3" style="width:50px">रस्त्याचे नाव</th><th rowspan="3" style="width:35px">सिटी सर्वे नंबर</th><th rowspan="3" style="width:30px">मालमत्ता क्र</th><th rowspan="3" style="width:55px">मालकाचे नाव</th><th rowspan="3" style="width:55px">भोगवटा करणारा नाव</th><th colspan="4" style="background:#0a7e3a">क्षेत्रफळ (७-१०)</th><th rowspan="3" style="width:60px">मालमत्तेचे वर्णन</th><th rowspan="3" style="width:25px">बांधका माचे वर्ष</th><th rowspan="3" style="width:30px">क्षेत्रफळ चौ.मी.</th><th colspan="3" style="background:#0a7e3a">रेडीरेकनर दर</th><th rowspan="3" style="width:22px">घसारा दर</th><th rowspan="3" style="width:22px">भारांक</th><th rowspan="3" style="width:40px">भांडवली मूल्य</th><th rowspan="3" style="width:22px">करदर</th><th colspan="5" style="background:#0a7e3a">कराची रक्कम (रु.)</th><th colspan="5" style="background:#b71c1c">अपिलाचे निकाल (रु.)</th><th rowspan="3" style="width:45px">शेरे</th></tr>
<tr class="header-sub"><th rowspan="2" style="background:#0a7e3a">चर्तू:सिमा</th><th rowspan="2" style="background:#0a7e3a">नाव</th><th rowspan="2" style="background:#0a7e3a">लांबी</th><th rowspan="2" style="background:#0a7e3a">रुंदी</th><th rowspan="2" style="background:#0a7e3a">जमीन</th><th rowspan="2" style="background:#0a7e3a">इमारत</th><th rowspan="2" style="background:#0a7e3a">बांधकाम</th><th>घरपट्टी</th><th>दिवाबत्ती</th><th>आरोग्य</th><th>पाणीपट्टी</th><th>एकुण</th><th style="background:#8b0000">घरपट्टी</th><th style="background:#8b0000">दिवाबत्ती</th><th style="background:#8b0000">आरोग्य</th><th style="background:#8b0000">पाणीपट्टी</th><th style="background:#8b0000">एकुण</th></tr>
<tr class="header-num"><th>२१</th><th>२२</th><th>२३</th><th>२४</th><th>२५</th><th style="background:#6d0000">२६</th><th style="background:#6d0000">२७</th><th style="background:#6d0000">२८</th><th style="background:#6d0000">२९</th><th style="background:#6d0000">३०</th></tr>
</thead><tbody>${rows}</tbody></table>
<div class="footer"><div class="sig-block"><div class="sig-line">मालकाची सही</div></div><div class="sig-block"><div class="sig-line">ग्रामसेवक सही</div></div><div class="sig-block"><div class="sig-line">सरपंच सही व मुद्रा</div></div></div>
<div style="text-align:center;margin-top:10px;font-size:8px;color:#999">दिनांक: ${new Date().toLocaleDateString('mr-IN')} | नमुना ८ | ${gpName}</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
  };

  // ===== RENDER =====
  return (
    <div className="space-y-5">
      {/* HEADER CARD */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="relative" style={{ background: 'linear-gradient(135deg, #1a5632 0%, #0d7377 50%, #1a5632 100%)' }}>
          <div className="flex h-1.5"><div className="flex-1" style={{ background: '#FF9933' }} /><div className="flex-1 bg-white" /><div className="flex-1" style={{ background: '#138808' }} /></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)' }} />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">नमुना नंबर ८</h1>
                  <p className="text-green-100 text-sm font-medium">कर आकारणी नोंदवही</p>
                  <p className="text-green-200/70 text-xs">नियम (३२) १ पहा | Tax Assessment Register</p>
                  {villageInfo && <p className="text-amber-200 text-xs mt-1 font-semibold">{villageInfo.gramPanchayatNameMr} | ता. {villageInfo.taluka} | जि. {villageInfo.district}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-xs px-3 py-1"><Hash className="h-3 w-3 mr-1" />{records.length} रेकॉर्ड्स</Badge>
                <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="text-white hover:bg-white/20 h-9"><RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />रिफ्रेश</Button>
              </div>
            </div>
            {/* Process Flow */}
            <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-xs font-medium">प्रक्रिया प्रवाह</span>
                <Badge className="bg-white/20 text-white border-0 text-xs">Step {currentStepIndex + 1} / {processSteps.length}</Badge>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {processSteps.map((step, i) => {
                  const isActive = i === currentStepIndex;
                  const isCompleted = i < currentStepIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all" style={{ background: isActive ? 'rgba(255,255,255,0.3)' : isCompleted ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: isActive ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid transparent' }}>
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs" style={{ background: isCompleted ? '#2ecc71' : isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}>
                          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <span className="text-white font-semibold">{i + 1}</span>}
                        </div>
                        <div className="hidden sm:block"><div className="text-white text-xs font-semibold leading-tight">{step.label}</div><div className="text-white/50 text-[10px] leading-tight">{step.labelEn}</div></div>
                      </div>
                      {i < processSteps.length - 1 && <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CONTROLS */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #FF9933, #FFF, #138808)' }} />
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <Label className="text-sm font-semibold text-green-800 mb-1.5 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />मालमत्ता निवडा</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="border-green-200 focus:ring-green-500/20 focus:border-green-400 h-10"><SelectValue placeholder="मालमत्ता निवडा..." /></SelectTrigger>
                <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}><span className="font-semibold">{p.propertyNumber}</span><span className="text-muted-foreground"> - {getOwnerName(p)}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Label className="text-sm font-semibold text-green-800 mb-1.5 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />वित्तीय वर्ष</Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger className="border-green-200 focus:ring-green-500/20 focus:border-green-400 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'].map(y => <SelectItem key={y} value={y}><span className="font-semibold">सन {y}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-3 flex items-end">
              <Button onClick={handleGenerate} disabled={generating || !selectedPropertyId} className="w-full h-10 text-sm font-semibold shadow-md" style={{ background: generating || !selectedPropertyId ? undefined : 'linear-gradient(135deg, #1a5632, #0d7377)' }}>
                {generating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />तयार होत आहे...</> : <><Zap className="h-4 w-4 mr-1.5" />नमुना ८ तयार करा</>}
              </Button>
            </div>
            <div className="lg:col-span-2 flex items-end">
              <Button variant="outline" onClick={handleGenerateAll} disabled={generating || properties.length === 0} className="w-full h-10 text-sm border-2 border-green-300 text-green-700 hover:bg-green-50 font-semibold">
                {generatingAll ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{generateProgress.current}/{generateProgress.total}</> : <><ArrowDownToLine className="h-4 w-4 mr-1" />सर्वांसाठी</>}
              </Button>
            </div>
          </div>
          {selectedProperty && (
            <div className="mt-4 p-3 rounded-lg border border-green-200" style={{ background: 'linear-gradient(135deg, #eafaf1, #f0fdf4)' }}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center shadow-sm flex-shrink-0"><Building2 className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-green-900 text-sm">{selectedProperty.propertyNumber}</span>
                    <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs">{selectedProperty.constructionType || '-'}</Badge>
                    <Badge className="bg-teal-100 text-teal-800 border border-teal-300 text-xs">{selectedProperty.usageType || '-'}</Badge>
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs"><MapPin className="h-3 w-3 mr-0.5" />{selectedProperty.ward?.wardNameMr || '-'}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-green-700">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getOwnerName(selectedProperty)}</span>
                    <span className="flex items-center gap-1"><Route className="h-3 w-3" />{selectedProperty.road?.roadNameMr || '-'}</span>
                    <span>क्षेत्रफळ: {selectedProperty.area || 0} चौ.मी.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
              <Input placeholder="मालमत्ता क्र./मालक नाव/वार्ड शोधा..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-green-200 focus:ring-green-500/20 focus:border-green-400" />
            </div>
            {filtered.length > 0 && (
              <Button onClick={handlePrintGovFormat} className="shadow-md" style={{ background: 'linear-gradient(135deg, #1a5632, #0d7377)' }}>
                <Printer className="h-4 w-4 mr-1.5" />शासकीय स्वरूप प्रिंट
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FileText, val: totalProperties, label: 'एकूण रेकॉर्ड्स', bg1: '#e8f5e9', bg2: '#f1f8e9', color: '#138808', ic: 'text-green-600' },
          { icon: Building2, val: properties.length, label: 'एकूण मालमत्ता', bg1: '#e0f2f1', bg2: '#e8f5e9', color: '#0d7377', ic: 'text-teal-600' },
          { icon: IndianRupee, val: `₹${totalTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, label: 'एकूण कर', bg1: '#fff3e0', bg2: '#fff8e1', color: '#FF9933', ic: 'text-amber-600' },
          { icon: Scale, val: `₹${avgTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, label: 'सरासरी कर', bg1: '#e8f5e9', bg2: '#e0f2f1', color: '#1a5632', ic: 'text-emerald-600' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: s.color }} />
            <CardContent className="p-4 text-center" style={{ background: `linear-gradient(135deg, ${s.bg1}, ${s.bg2})` }}>
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.ic}`} />
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== MAIN EXCEL FORMAT TABLE ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="flex h-1.5"><div className="flex-1" style={{ background: '#FF9933' }} /><div className="flex-1 bg-white" /><div className="flex-1" style={{ background: '#138808' }} /></div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center"><BookOpen className="h-4 w-4 text-green-600" /></div>
              नमुना ८ - कर आकारणी नोंदवही (३१ स्तंभ)
            </CardTitle>
            <div className="flex items-center gap-2">
              {villageInfo && <Badge className="bg-green-50 text-green-800 border border-green-200 text-xs"><Landmark className="h-3 w-3 mr-1" />{villageInfo.gramPanchayatNameMr}</Badge>}
              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-xs">सन {financialYear}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-8" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-8 w-8 text-green-300" /></div><p className="text-muted-foreground font-medium">नमुना ८ रेकॉर्ड नाहीत</p><p className="text-xs text-muted-foreground mt-1">मालमत्ता निवडून &quot;नमुना ८ तयार करा&quot; बटण दाबा</p></div>
          ) : (
            <div className="overflow-x-auto border border-green-200 rounded-lg" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full border-collapse min-w-[2400px]" style={{ fontSize: '11px' }}>
                <thead>
                  {/* Row 1: Main Headers */}
                  <tr style={{ background: '#0d5c2e' }}>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '35px' }}>अ.क्र.<br/><span className="text-green-300 text-[8px]">(१)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '70px' }}>रस्त्याचे<br/>नाव<br/><span className="text-green-300 text-[8px]">(२)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '50px' }}>सिटी<br/>सर्वे<br/>नंबर<br/><span className="text-green-300 text-[8px]">(३)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '45px' }}>मालमत्ता<br/>क्र<br/><span className="text-green-300 text-[8px]">(४)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '85px' }}>मालकाचे<br/>नाव<br/><span className="text-green-300 text-[8px]">(५)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '85px' }}>भोगवटा<br/>करणारा<br/>नाव<br/><span className="text-green-300 text-[8px]">(६)</span></th>
                    <th colSpan={4} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ background: '#0a7e3a' }}>क्षेत्रफळ (७-१०)</th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '85px' }}>मालमत्तेचे<br/>वर्णन<br/><span className="text-green-300 text-[8px]">(११)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '40px' }}>बांधका<br/>माचे<br/>वर्ष<br/><span className="text-green-300 text-[8px]">(१२)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '45px' }}>क्षेत्रफळ<br/>चौ.मी.<br/><span className="text-green-300 text-[8px]">(१३)</span></th>
                    <th colSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ background: '#0a7e3a' }}>रेडीरेकनर दर प्रति चौ.मी.</th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '35px' }}>घसारा<br/>दर<br/><span className="text-green-300 text-[8px]">(१७)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '38px' }}>वापरा<br/>नुसार<br/>भारांक<br/><span className="text-green-300 text-[8px]">(१८)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '65px' }}>एकुण<br/>भांडवली<br/>मूल्य (रु.)<br/><span className="text-green-300 text-[8px]">(१९)</span></th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '35px' }}>करचा<br/>दर<br/><span className="text-green-300 text-[8px]">(२०)</span></th>
                    <th colSpan={5} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ background: '#0a7e3a' }}>कराची रक्कम (रु.) (२१-२५)</th>
                    <th colSpan={5} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ background: '#b71c1c' }}>अपिलाचे निकाल (रु.) (२६-३०)</th>
                    <th rowSpan={3} className="border border-green-700 text-white px-1 py-2 text-[10px] font-bold" style={{ minWidth: '60px' }}>शेरे व दुरुस्त्या<br/><span className="text-green-300 text-[8px]">(३१)</span></th>
                  </tr>
                  {/* Row 2: Sub Headers */}
                  <tr style={{ background: '#138808' }}>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>चर्तू:सिमा</th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '55px' }}>नाव</th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>लांबी<br/>(मी.)</th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>रुंदी<br/>(मी.)</th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>जमीन<br/><span className="text-green-300 text-[7px]">(१४)</span></th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>इमारत<br/><span className="text-green-300 text-[7px]">(१५)</span></th>
                    <th rowSpan={2} className="border border-green-700 text-white px-1 py-1 text-[9px] font-semibold" style={{ background: '#0a7e3a', minWidth: '40px' }}>बांधकाम<br/><span className="text-green-300 text-[7px]">(१६)</span></th>
                    <th className="border border-green-700 text-white px-1 py-1 text-[8px] font-semibold" style={{ minWidth: '42px' }}>घरपट्टी</th>
                    <th className="border border-green-700 text-white px-1 py-1 text-[8px] font-semibold" style={{ minWidth: '40px' }}>दिवाबत्ती<br/>कर</th>
                    <th className="border border-green-700 text-white px-1 py-1 text-[8px] font-semibold" style={{ minWidth: '42px' }}>आरोग्य<br/>रक्षण कर</th>
                    <th className="border border-green-700 text-white px-1 py-1 text-[8px] font-semibold" style={{ minWidth: '40px' }}>सा.<br/>पाणीपट्टी</th>
                    <th className="border border-green-700 text-white px-1 py-1 text-[8px] font-semibold" style={{ minWidth: '48px' }}>एकुण कर</th>
                    <th className="border border-red-800 text-white px-1 py-1 text-[8px] font-semibold" style={{ background: '#8b0000', minWidth: '38px' }}>घरपट्टी</th>
                    <th className="border border-red-800 text-white px-1 py-1 text-[8px] font-semibold" style={{ background: '#8b0000', minWidth: '36px' }}>दिवाबत्ती</th>
                    <th className="border border-red-800 text-white px-1 py-1 text-[8px] font-semibold" style={{ background: '#8b0000', minWidth: '38px' }}>आरोग्य</th>
                    <th className="border border-red-800 text-white px-1 py-1 text-[8px] font-semibold" style={{ background: '#8b0000', minWidth: '36px' }}>पाणीपट्टी</th>
                    <th className="border border-red-800 text-white px-1 py-1 text-[8px] font-semibold" style={{ background: '#8b0000', minWidth: '42px' }}>एकुण</th>
                  </tr>
                  {/* Row 3: Column Numbers for Tax/Appeal */}
                  <tr style={{ background: '#1a7a3a' }}>
                    <th className="border border-green-700 text-green-200 px-1 py-0.5 text-[8px]">२१</th>
                    <th className="border border-green-700 text-green-200 px-1 py-0.5 text-[8px]">२२</th>
                    <th className="border border-green-700 text-green-200 px-1 py-0.5 text-[8px]">२३</th>
                    <th className="border border-green-700 text-green-200 px-1 py-0.5 text-[8px]">२४</th>
                    <th className="border border-green-700 text-green-200 px-1 py-0.5 text-[8px]">२५</th>
                    <th className="border border-red-800 text-red-200 px-1 py-0.5 text-[8px]" style={{ background: '#6d0000' }}>२६</th>
                    <th className="border border-red-800 text-red-200 px-1 py-0.5 text-[8px]" style={{ background: '#6d0000' }}>२७</th>
                    <th className="border border-red-800 text-red-200 px-1 py-0.5 text-[8px]" style={{ background: '#6d0000' }}>२८</th>
                    <th className="border border-red-800 text-red-200 px-1 py-0.5 text-[8px]" style={{ background: '#6d0000' }}>२९</th>
                    <th className="border border-red-800 text-red-200 px-1 py-0.5 text-[8px]" style={{ background: '#6d0000' }}>३०</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((rec, idx) => {
                    const p = rec.property;
                    const on = getOwnerName(p);
                    const occ = getOccupantName(p);
                    const cd = parseCD(rec.constructionDetails).filter(c => c.area > 0);
                    const rn = p.road?.roadNameMr || '-';
                    const cdCount = Math.max(cd.length, 1);
                    const totalBlockRows = 4 + cdCount + 1 + 1; // 4 boundaries + construction rows + total + note
                    const rowBg = idx % 2 === 0 ? 'bg-green-50/50' : 'bg-white';

                    return (
                      <React.Fragment key={rec.id}>
                        {/* ===== 4 BOUNDARY ROWS ===== */}
                        {BOUNDARY_DIRS.map((dir, bi) => {
                          const bName = p[dir.bField] || '-';
                          const bLen = p[dir.lField] || (bi === 0 ? p.totalLength : null) || null;
                          const bWid = p[dir.wField] || (bi === 0 ? p.totalWidth : null) || null;

                          return (
                            <tr key={dir.key} className={rowBg}>
                              {bi === 0 && (
                                <>
                                  {/* Cols 1-6: span entire property block */}
                                  <td rowSpan={totalBlockRows} className={`${cellC} font-bold text-green-900 align-top`}>{idx + 1}</td>
                                  <td rowSpan={totalBlockRows} className={`${cellBase} align-top`}>{rn}</td>
                                  <td rowSpan={totalBlockRows} className={`${cellC} align-top`}>{p.citySurveyNo || '-'}</td>
                                  <td rowSpan={totalBlockRows} className={`${cellC} font-bold text-green-800 align-top`}>{p.propertyNumber}</td>
                                  <td rowSpan={totalBlockRows} className={`${cellBase} align-top`}>{on}</td>
                                  <td rowSpan={totalBlockRows} className={`${cellBase} align-top`}>{occ}</td>
                                </>
                              )}
                              {/* Cols 7-10: boundary data per row */}
                              <td className={`${cellC} font-medium text-green-800`}>{dir.label}</td>
                              <td className={cellBase}>{bName}</td>
                              <td className={cellR}>{bLen != null ? fmt(bLen) : '-'}</td>
                              <td className={cellR}>{bWid != null ? fmt(bWid) : '-'}</td>

                              {bi === 0 && (
                                <>
                                  {/* Cols 11-20: span 4 boundary rows */}
                                  <td rowSpan={4} className={`${cellBase} align-top`}>{p.constructionType || '-'}</td>
                                  <td rowSpan={4} className={`${cellC} align-top`}>{p.yearBuilt || '-'}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(p.builtUpArea || p.area)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.landRate)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.buildingRate)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.constructionRate)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.depreciationRate)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.usageFactor)}</td>
                                  <td rowSpan={4} className={`${cellR} font-semibold align-top`}>{fmt(rec.capitalValue)}</td>
                                  <td rowSpan={4} className={`${cellR} align-top`}>{fmt(rec.taxRatePercent)}</td>

                                  {/* Cols 21-25: tax amounts span construction rows */}
                                  <td rowSpan={cdCount} className={`${cellR} font-semibold align-top`}>{fmt(rec.houseTaxAmt)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`}>{fmt(rec.lightTaxAmt)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`}>{fmt(rec.healthTaxAmt)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`}>{fmt(rec.waterTaxAmt)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} font-bold text-green-800 align-top`} style={{ background: '#e8f5e9' }}>{fmt(rec.totalTaxAmt)}</td>

                                  {/* Cols 26-30: appeal amounts span construction rows */}
                                  <td rowSpan={cdCount} className={`${cellR} align-top`} style={{ background: '#fce4ec' }}>{fmt(rec.appealHouseTax)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`} style={{ background: '#fce4ec' }}>{fmt(rec.appealLightTax)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`} style={{ background: '#fce4ec' }}>{fmt(rec.appealHealthTax)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} align-top`} style={{ background: '#fce4ec' }}>{fmt(rec.appealWaterTax)}</td>
                                  <td rowSpan={cdCount} className={`${cellR} font-semibold align-top`} style={{ background: '#fce4ec' }}>{fmt(rec.appealTotalTax)}</td>

                                  {/* Col 31: span entire property block */}
                                  <td rowSpan={totalBlockRows} className={`${cellBase} text-[9px] align-top`}>{rec.remarks || '-'}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}

                        {/* ===== CONSTRUCTION TYPE ROWS ===== */}
                        {cd.length > 0 ? (
                          cd.map((c, ci) => (
                            <tr key={`cd-${ci}`} className={rowBg}>
                              {/* Cols 7-10: empty */}
                              <td className={cellBase}></td>
                              <td className={cellBase}></td>
                              <td className={cellBase}></td>
                              <td className={cellBase}></td>
                              {/* Cols 11-20: construction data */}
                              <td className={`${cellBase} font-medium`}>{c.type}</td>
                              <td className={cellC}>{ci === 0 ? (p.yearBuilt || '-') : ''}</td>
                              <td className={cellR}>{fmt(c.area)}</td>
                              <td className={cellR}>{c.type === 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
                              <td className={cellR}>{c.type !== 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
                              <td className={cellR}>{c.type !== 'जमीन/खुली जागा' ? fmt(c.rate) : '-'}</td>
                              <td className={cellR}>{fmt(rec.depreciationRate)}</td>
                              <td className={cellR}>{fmt(rec.usageFactor)}</td>
                              <td className={`${cellR} font-semibold`}>{fmt(c.capitalValue)}</td>
                              <td className={cellR}>{fmt(rec.taxRatePercent)}</td>
                              {/* Cols 21-30: covered by rowspan from first boundary row */}
                            </tr>
                          ))
                        ) : (
                          /* Default row when no construction details */
                          <tr className={rowBg}>
                            <td className={cellBase}></td><td className={cellBase}></td><td className={cellBase}></td><td className={cellBase}></td>
                            <td className={cellBase}>{p.constructionType || '-'}</td>
                            <td className={cellC}>{p.yearBuilt || '-'}</td>
                            <td className={cellR}>{fmt(p.builtUpArea || p.area)}</td>
                            <td className={cellR}>{fmt(rec.landRate)}</td>
                            <td className={cellR}>{fmt(rec.buildingRate)}</td>
                            <td className={cellR}>{fmt(rec.constructionRate)}</td>
                            <td className={cellR}>{fmt(rec.depreciationRate)}</td>
                            <td className={cellR}>{fmt(rec.usageFactor)}</td>
                            <td className={`${cellR} font-semibold`}>{fmt(rec.capitalValue)}</td>
                            <td className={cellR}>{fmt(rec.taxRatePercent)}</td>
                          </tr>
                        )}

                        {/* ===== TOTAL ROW ===== */}
                        <tr style={{ background: '#c8e6c9' }}>
                          {/* Cols 7-10: empty */}
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          {/* Cols 11-12: label */}
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500 text-right pr-2 font-bold text-green-900 text-[11px]">एकुण</td>
                          {/* Col 13: total area */}
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[11px] font-bold text-green-900">{fmt(rec.totalArea || p.builtUpArea || p.area)}</td>
                          {/* Cols 14-20: empty */}
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          <td className="border-2 border-green-500"></td>
                          {/* Cols 21-25: total taxes */}
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[11px] font-bold">{fmt(rec.houseTaxAmt)}</td>
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[11px] font-bold">{fmt(rec.lightTaxAmt)}</td>
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[11px] font-bold">{fmt(rec.healthTaxAmt)}</td>
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[11px] font-bold">{fmt(rec.waterTaxAmt)}</td>
                          <td className="border-2 border-green-500 text-right px-1 py-1 text-[12px] font-bold text-green-900" style={{ background: '#a5d6a7' }}>₹{fmt(rec.totalTaxAmt)}</td>
                          {/* Cols 26-30: total appeals */}
                          <td className="border-2 border-red-300 text-right px-1 py-1 text-[10px]" style={{ background: '#ef9a9a' }}>{fmt(rec.appealHouseTax)}</td>
                          <td className="border-2 border-red-300 text-right px-1 py-1 text-[10px]" style={{ background: '#ef9a9a' }}>{fmt(rec.appealLightTax)}</td>
                          <td className="border-2 border-red-300 text-right px-1 py-1 text-[10px]" style={{ background: '#ef9a9a' }}>{fmt(rec.appealHealthTax)}</td>
                          <td className="border-2 border-red-300 text-right px-1 py-1 text-[10px]" style={{ background: '#ef9a9a' }}>{fmt(rec.appealWaterTax)}</td>
                          <td className="border-2 border-red-300 text-right px-1 py-1 text-[10px] font-bold" style={{ background: '#ef9a9a' }}>{fmt(rec.appealTotalTax)}</td>
                        </tr>

                        {/* ===== NOTE / शेरे ROW ===== */}
                        <tr style={{ background: '#fff9c4' }}>
                          <td colSpan={31} className="border border-amber-300 px-2 py-1 text-[9px] text-amber-900 font-medium">
                            शेरे: {rec.remarks || '-'} | अनुप्रमाणीतकरणारी सरपंचाची स्वाक्षरी: ________________
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* ===== GRAND TOTAL ROW ===== */}
                  {filtered.length > 1 && (
                    <tr style={{ background: '#1a5632' }}>
                      <td colSpan={17} className="border-2 border-green-700 text-right pr-2 py-2 text-[12px] font-bold text-white">सर्व एकुण रक्कम</td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[12px] font-bold text-white">{fmt(filtered.reduce((s, r) => s + (r.capitalValue || 0), 0))}</td>
                      <td className="border-2 border-green-700"></td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[11px] font-bold text-white">{fmt(filtered.reduce((s, r) => s + (r.houseTaxAmt || 0), 0))}</td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[11px] font-bold text-white">{fmt(filtered.reduce((s, r) => s + (r.lightTaxAmt || 0), 0))}</td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[11px] font-bold text-white">{fmt(filtered.reduce((s, r) => s + (r.healthTaxAmt || 0), 0))}</td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[11px] font-bold text-white">{fmt(filtered.reduce((s, r) => s + (r.waterTaxAmt || 0), 0))}</td>
                      <td className="border-2 border-green-700 text-right px-1 py-2 text-[13px] font-bold" style={{ background: '#FF9933', color: '#fff' }}>₹{fmt(totalTaxAmount)}</td>
                      <td colSpan={5} className="border-2 border-red-800" style={{ background: '#8b0000' }}></td>
                      <td className="border-2 border-green-700"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          {filtered.length > 0 && (
            <div className="mt-4 p-3 rounded-lg border border-green-200 bg-green-50/50">
              <div className="flex flex-wrap gap-4 text-[10px] text-green-800">
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm" style={{ background: '#c8e6c9' }} /><span>एकुण रांग</span></div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm" style={{ background: '#fff9c4' }} /><span>शेरे / नोंद</span></div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm" style={{ background: '#fce4ec' }} /><span>अपिलाचे निकाल</span></div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm" style={{ background: '#1a5632' }} /><span>सर्व एकुण</span></div>
                <span className="font-semibold">बांधकाम प्रकार दर:</span>
                {CONSTRUCTION_TYPES.map(ct => <span key={ct.type}>{ct.type}: ₹{ct.rate}</span>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER SIGNATURE SECTION */}
      {filtered.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6" style={{ background: 'linear-gradient(135deg, #f1f8e9, #e8f5e9)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
              {['मालकाची सही|Owner Signature', 'ग्रामसेवक सही|Gram Sevak', 'सरपंच सही व मुद्रा|Sarpanch & Seal'].map((s, i) => {
                const [mr, en] = s.split('|');
                return (
                  <div key={i} className="text-center">
                    <div className="text-sm font-semibold text-green-800 mb-8">{mr}</div>
                    <div className="border-t-2 border-green-700 pt-2 min-w-[150px]"><span className="text-xs text-green-600">{en}</span></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
