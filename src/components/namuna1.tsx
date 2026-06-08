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
  ClipboardList, Printer, RefreshCw, Search, Building2, Users,
  MapPin, ArrowRight, CheckCircle2, FileText, Landmark, ChevronRight,
  Database, Hash, Ruler, Compass, IndianRupee, Loader2, AlertCircle,
  User, Home, Calendar, Layers, Route, Zap
} from 'lucide-react';

// Types
interface OwnerInfo {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    firstNameMr: string;
    lastNameMr: string;
    address: string | null;
    addressMr: string | null;
    mobileNumber: string | null;
  };
  ownershipType: string;
}

interface PropertyInfo {
  id: string;
  propertyNumber: string;
  citySurveyNo: string | null;
  area: number | null;
  builtUpArea: number | null;
  constructionType: string | null;
  usageType: string | null;
  floorInfo: string | null;
  yearBuilt: string | null;
  boundaries: string | null;
  propertyStatus: string;
  ward?: {
    wardNumber: string;
    wardNameMr: string;
    wardName: string;
  };
  road?: {
    roadNameMr: string;
    roadName: string;
  };
  owners: OwnerInfo[];
  taxRates: {
    taxMasterId: string;
    rate: number;
    taxMaster: {
      name: string;
      nameMarathi: string;
      isEnabled: boolean;
      order: number;
      category: string;
    };
  }[];
}

interface VillageInfo {
  id: string;
  gramPanchayatName: string;
  gramPanchayatNameMr: string;
  taluka: string;
  district: string;
  state: string;
  pinCode: string | null;
  sarpanchName: string | null;
  sarpanchNameMr: string | null;
  secretaryName: string | null;
  secretaryNameMr: string | null;
}

// Section header component with colored left border
function SectionHeader({
  number,
  title,
  titleEn,
  icon: Icon,
  color,
  bgColor,
}: {
  number: string;
  title: string;
  titleEn: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg mb-4"
      style={{
        background: bgColor,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
        style={{ background: color }}
      >
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: color }}
          >
            {number}
          </span>
          <span className="font-bold text-sm" style={{ color }}>
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{titleEn}</span>
      </div>
    </div>
  );
}

// Auto-fill badge with green styling and checkmark
function AutoFillBadge() {
  return (
    <Badge
      variant="outline"
      className="ml-2 text-[10px] px-1.5 py-0 border-green-400 text-green-700 bg-green-50 font-semibold"
    >
      <CheckCircle2 className="h-3 w-3 mr-0.5 text-green-600" />
      ऑटो-फिल
    </Badge>
  );
}

// Auto-filled input field with green tint
function AutoFilledField({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  const IconComp = Icon;
  return (
    <div>
      <Label className="flex items-center text-xs font-semibold text-cyan-800 mb-1">
        {IconComp && <IconComp className="h-3 w-3 mr-1 text-cyan-600" />}
        {label}
        <AutoFillBadge />
      </Label>
      <Input
        value={value}
        readOnly
        className="bg-green-50/70 border-green-200 text-green-900 font-medium focus:ring-0 text-sm h-9"
      />
    </div>
  );
}

// Process Flow step type
type ProcessStep = 'select' | 'fetch' | 'autofill' | 'form';

export default function Namuna1Component() {
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [villageInfo, setVillageInfo] = useState<VillageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PropertyInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyInfo | null>(null);
  const [activeStep, setActiveStep] = useState<ProcessStep>('select');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, villageRes] = await Promise.all([
        fetch('/api/master?table=property'),
        fetch('/api/master?table=village'),
      ]);
      setProperties(await propRes.json());
      const village = await villageRes.json();
      setVillageInfo(village);
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-fill when property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(prop || null);
      setActiveStep('autofill');
      setTimeout(() => setActiveStep('form'), 800);
    } else {
      setSelectedProperty(null);
      setActiveStep('select');
    }
  }, [selectedPropertyId, properties]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/namuna9?search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
        toast({
          title: '✅ शोध यशस्वी',
          description: `${data.length} मालमत्ता सापडल्या`,
          className: 'border-cyan-300 bg-cyan-50',
        });
      } else {
        toast({ title: 'शोध निकाल', description: 'कोणतीही मालमत्ता सापडली नाही', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'शोध अयशस्वी', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const getOwnerName = (prop: PropertyInfo) => {
    const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
    if (!owner) return prop.owners?.[0]
      ? `${prop.owners[0].owner.firstNameMr || prop.owners[0].owner.firstName} ${prop.owners[0].owner.lastNameMr || prop.owners[0].owner.lastName}`
      : '-';
    return `${owner.owner.firstNameMr || owner.owner.firstName} ${owner.owner.lastNameMr || owner.owner.lastName}`;
  };

  const getOwnerAddress = (prop: PropertyInfo) => {
    const owner = prop.owners?.find(o => o.ownershipType === 'मालक');
    if (!owner && prop.owners?.[0]) {
      return prop.owners[0].owner.addressMr || prop.owners[0].owner.address || '-';
    }
    return owner?.owner.addressMr || owner?.owner.address || '-';
  };

  const getOccupantName = (prop: PropertyInfo) => {
    const occupant = prop.owners?.find(o => o.ownershipType === 'भोगवटादार');
    if (!occupant) return '-';
    return `${occupant.owner.firstNameMr || occupant.owner.firstName} ${occupant.owner.lastNameMr || occupant.owner.lastName}`;
  };

  const getBoundaries = (prop: PropertyInfo) => {
    if (!prop.boundaries) return { east: '-', west: '-', north: '-', south: '-' };
    try {
      const parsed = JSON.parse(prop.boundaries);
      return {
        east: parsed.east || parsed['पूर्व'] || '-',
        west: parsed.west || parsed['पश्चिम'] || '-',
        north: parsed.north || parsed['उत्तर'] || '-',
        south: parsed.south || parsed['दक्षिण'] || '-',
      };
    } catch {
      return { east: prop.boundaries, west: '-', north: '-', south: '-' };
    }
  };

  // Print template - Government format with Indian flag colors
  const handlePrint = () => {
    if (!selectedProperty) {
      toast({ title: 'त्रुटी', description: 'कृपया मालमत्ता निवडा', variant: 'destructive' });
      return;
    }

    const prop = selectedProperty;
    const boundaries = getBoundaries(prop);
    const ownerName = getOwnerName(prop);
    const ownerAddress = getOwnerAddress(prop);
    const occupantName = getOccupantName(prop);

    const printContent = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>नमुना १ - मालमत्ता नोंदणी पत्र</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; padding: 15px; font-size: 11px; color: #1a1a1a; }

  /* Indian Flag Header */
  .flag-bar { display: flex; height: 6px; width: 100%; }
  .flag-saffron { flex: 1; background: #FF9933; }
  .flag-white { flex: 1; background: #FFFFFF; border-bottom: 1px solid #e0e0e0; border-top: 1px solid #e0e0e0; }
  .flag-green { flex: 1; background: #138808; }

  .header-section { text-align: center; padding: 12px 0 8px; border-bottom: 2px solid #0d7377; margin-bottom: 12px; }
  .gp-name { font-size: 16px; font-weight: 700; color: #0d7377; margin-bottom: 2px; }
  .gp-name-en { font-size: 11px; color: #555; margin-bottom: 4px; }
  .gp-details { font-size: 11px; color: #666; margin-bottom: 6px; }
  .form-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 8px 0 2px; padding: 6px; border: 2px solid #0d7377; background: #e8f8f5; display: inline-block; }
  .form-title-en { font-size: 10px; color: #777; margin-bottom: 4px; }

  /* Section */
  .section-title { font-weight: 700; font-size: 12px; margin: 14px 0 8px; padding: 5px 8px; border-left: 4px solid #0d7377; background: #f0fafa; color: #0d7377; }
  .section-num { display: inline-block; background: #0d7377; color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 3px; margin-right: 6px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 10px; }
  .info-item { font-size: 11px; padding: 3px 0; border-bottom: 1px dotted #ccc; }
  .info-item strong { display: inline-block; min-width: 160px; color: #333; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { border: 1px solid #555; padding: 5px 8px; font-size: 11px; text-align: left; vertical-align: middle; }
  th { background: #0d7377; color: white; font-weight: 600; text-align: center; font-size: 10px; }

  .row-even { background: #e8f8f5; }
  .row-odd { background: #ffffff; }

  .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
  .signature-block { text-align: center; min-width: 130px; }
  .signature-line { border-top: 1px solid #333; padding-top: 4px; margin-top: 35px; font-size: 10px; font-weight: 600; }
  .watermark { position: fixed; bottom: 50%; right: 50%; transform: translate(50%, 50%); font-size: 60px; color: rgba(0,0,0,0.03); font-weight: 700; pointer-events: none; }

  @media print {
    body { padding: 5px; }
    .flag-bar, th, .row-even { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .form-title, .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="watermark">नमुना १</div>

<!-- Indian Flag Bar -->
<div class="flag-bar">
  <div class="flag-saffron"></div>
  <div class="flag-white"></div>
  <div class="flag-green"></div>
</div>

<!-- Header -->
<div class="header-section">
  <div class="gp-name">${villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'}</div>
  <div class="gp-name-en">${villageInfo?.gramPanchayatName || 'Gram Panchayat'}</div>
  <div class="gp-details">तालुका: ${villageInfo?.taluka || '-'} | जिल्हा: ${villageInfo?.district || '-'} | राज्य: ${villageInfo?.state || '-'}${villageInfo?.pinCode ? ` | पिन कोड: ${villageInfo.pinCode}` : ''}</div>
  <div class="form-title">नमुना १ — मालमत्ता नोंदणी पत्र</div>
  <div class="form-title-en">Property Registration Form</div>
</div>

<!-- Section 1 -->
<div class="section-title"><span class="section-num">१</span>मालमत्तेची साधारण माहिती / General Property Information</div>
<div class="info-grid">
  <div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${prop.propertyNumber}</div>
  <div class="info-item"><strong>शहर सर्वेक्षण क्रमांक:</strong> ${prop.citySurveyNo || '-'}</div>
  <div class="info-item"><strong>वार्ड क्रमांक व नाव:</strong> ${prop.ward ? `${prop.ward.wardNumber} - ${prop.ward.wardNameMr}` : '-'}</div>
  <div class="info-item"><strong>रस्ता नाव:</strong> ${prop.road?.roadNameMr || '-'}</div>
  <div class="info-item"><strong>मालमत्तेचा वापर:</strong> ${prop.usageType || '-'}</div>
  <div class="info-item"><strong>बांधकाम प्रकार:</strong> ${prop.constructionType || '-'}</div>
  <div class="info-item"><strong>मालमत्ता स्थिती:</strong> ${prop.propertyStatus}</div>
  <div class="info-item"><strong>बांधणी वर्ष:</strong> ${prop.yearBuilt || '-'}</div>
</div>

<!-- Section 2 -->
<div class="section-title"><span class="section-num">२</span>क्षेत्रफळ माहिती / Area Information</div>
<div class="info-grid">
  <div class="info-item"><strong>एकूण क्षेत्रफळ:</strong> ${prop.area || '-'} चौ.फूट</div>
  <div class="info-item"><strong>बांधलेले क्षेत्रफळ:</strong> ${prop.builtUpArea || '-'} चौ.फूट</div>
  <div class="info-item"><strong>मजला माहिती:</strong> ${prop.floorInfo || '-'}</div>
</div>

<!-- Section 3 -->
<div class="section-title"><span class="section-num">३</span>मालक व भोगवटादार माहिती / Owner & Occupant Information</div>
<div class="info-grid">
  <div class="info-item"><strong>मालकाचे नाव:</strong> ${ownerName}</div>
  <div class="info-item"><strong>मालकाचा पत्ता:</strong> ${ownerAddress}</div>
  <div class="info-item"><strong>भोगवटादाराचे नाव:</strong> ${occupantName}</div>
</div>
${prop.owners && prop.owners.length > 1 ? `
<table>
  <thead><tr><th>क्र.</th><th>नाव</th><th>मालकी प्रकार</th><th>मोबाईल</th></tr></thead>
  <tbody>
    ${prop.owners.map((o, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}"><td style="text-align:center">${i + 1}</td><td>${o.owner.firstNameMr || o.owner.firstName} ${o.owner.lastNameMr || o.owner.lastName}</td><td style="text-align:center">${o.ownershipType}</td><td>${o.owner.mobileNumber || '-'}</td></tr>`).join('')}
  </tbody>
</table>
` : ''}

<!-- Section 4 -->
<div class="section-title"><span class="section-num">४</span>सीमा माहिती / Boundary Information</div>
<table>
  <thead><tr><th style="width:120px">दिशा / Direction</th><th>शेजारी मालमत्ता / वर्णन</th></tr></thead>
  <tbody>
    <tr class="row-even"><td style="text-align:center; font-weight:600">पूर्व (East)</td><td>${boundaries.east}</td></tr>
    <tr class="row-odd"><td style="text-align:center; font-weight:600">पश्चिम (West)</td><td>${boundaries.west}</td></tr>
    <tr class="row-even"><td style="text-align:center; font-weight:600">उत्तर (North)</td><td>${boundaries.north}</td></tr>
    <tr class="row-odd"><td style="text-align:center; font-weight:600">दक्षिण (South)</td><td>${boundaries.south}</td></tr>
  </tbody>
</table>

${prop.taxRates && prop.taxRates.length > 0 ? `
<!-- Section 5 -->
<div class="section-title"><span class="section-num">५</span>लागू कर दर / Applicable Tax Rates</div>
<table>
  <thead><tr><th style="width:30px">क्र.</th><th>कराचे नाव / Tax Name</th><th style="width:80px">कर प्रकार</th><th style="width:90px">दर (₹/चौ.फूट)</th><th style="width:70px">स्थिती</th></tr></thead>
  <tbody>
    ${prop.taxRates.map((tr, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}"><td style="text-align:center">${i + 1}</td><td>${tr.taxMaster.nameMarathi} (${tr.taxMaster.name})</td><td style="text-align:center">${tr.taxMaster.category || '-'}</td><td style="text-align:right; font-weight:600">₹${tr.rate}</td><td style="text-align:center; color: ${tr.taxMaster.isEnabled ? '#138808' : '#c0392b'}; font-weight:600">${tr.taxMaster.isEnabled ? 'सक्षम' : 'अक्षम'}</td></tr>`).join('')}
  </tbody>
</table>
` : ''}

<!-- Footer Signatures -->
<div class="footer">
  <div class="signature-block">
    <div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div>
  </div>
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
  नमुना १ - मालमत्ता नोंदणी पत्र | ${villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'} | दिनांक: ${new Date().toLocaleDateString('mr-IN')}
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

  const filteredProperties = searchTerm
    ? properties.filter(p =>
        p.propertyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getOwnerName(p).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : properties;

  // Process flow steps
  const processSteps: { key: ProcessStep; label: string; labelEn: string; icon: React.ReactNode; color: string }[] = [
    { key: 'select', label: 'मालमत्ता निवडा', labelEn: 'Select Property', icon: <Building2 className="h-4 w-4" />, color: '#0d7377' },
    { key: 'fetch', label: 'मास्टर डेटा', labelEn: 'Master Data', icon: <Database className="h-4 w-4" />, color: '#16a085' },
    { key: 'autofill', label: 'ऑटो फिल', labelEn: 'Auto Fill', icon: <CheckCircle2 className="h-4 w-4" />, color: '#27ae60' },
    { key: 'form', label: 'नमुना १ तयार', labelEn: 'Form Ready', icon: <ClipboardList className="h-4 w-4" />, color: '#0d7377' },
  ];

  const getStepIndex = (step: ProcessStep) => processSteps.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(activeStep);

  // Construction & Usage type badge helpers
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

  const getConstructionBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline" className="text-xs">-</Badge>;
    const colors = CONSTRUCTION_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    return <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-xs font-semibold`}>{type}</Badge>;
  };

  const getUsageBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline" className="text-xs">-</Badge>;
    const colors = USAGE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    return <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-xs font-semibold`}>{type}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* ===== HEADER CARD WITH CYAN/TEAL GRADIENT ===== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #0d7377 0%, #16a085 40%, #1abc9c 70%, #0d7377 100%)',
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
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                >
                  <ClipboardList className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">नमुना १</h1>
                  <p className="text-cyan-100 text-sm font-medium">मालमत्ता नोंदणी पत्र</p>
                  <p className="text-cyan-200/70 text-xs">Property Registration Form</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-xs px-3 py-1">
                  <Hash className="h-3 w-3 mr-1" />
                  {properties.length} मालमत्ता
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
                        <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Master → Auto Fill → नमुना १ Flow */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5 text-cyan-200" />
                <span className="text-white/90 font-medium">Property Master</span>
              </div>
              <span className="text-white/40">+</span>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-200" />
                <span className="text-white/90 font-medium">Owner Master</span>
              </div>
              <span className="text-white/40">+</span>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-200" />
                <span className="text-white/90 font-medium">Ward Master</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40" />
              <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
                <span className="text-green-200 font-semibold">Auto Fill</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40" />
              <div className="flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-400/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-cyan-200" />
                <span className="text-cyan-100 font-bold">नमुना १</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== VILLAGE INFO + SEARCH + SELECT CARD ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #16a085, #1abc9c)' }} />
        <CardContent className="p-5 space-y-4">
          {/* Village Info Banner */}
          {villageInfo && (
            <div
              className="rounded-xl p-4 border border-cyan-200"
              style={{ background: 'linear-gradient(135deg, #e8f8f5, #f0fafa)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #0d7377, #16a085)' }}>
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-cyan-900 text-base">{villageInfo.gramPanchayatNameMr}</div>
                  <div className="text-xs text-cyan-600">{villageInfo.gramPanchayatName}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div className="text-xs">
                  <span className="text-cyan-600 font-semibold">तालुका:</span>
                  <span className="ml-1 text-cyan-900 font-medium">{villageInfo.taluka}</span>
                </div>
                <div className="text-xs">
                  <span className="text-cyan-600 font-semibold">जिल्हा:</span>
                  <span className="ml-1 text-cyan-900 font-medium">{villageInfo.district}</span>
                </div>
                <div className="text-xs">
                  <span className="text-cyan-600 font-semibold">राज्य:</span>
                  <span className="ml-1 text-cyan-900 font-medium">{villageInfo.state}</span>
                </div>
                {villageInfo.pinCode && (
                  <div className="text-xs">
                    <span className="text-cyan-600 font-semibold">पिन कोड:</span>
                    <span className="ml-1 text-cyan-900 font-medium">{villageInfo.pinCode}</span>
                  </div>
                )}
              </div>
              {(villageInfo.sarpanchNameMr || villageInfo.secretaryNameMr) && (
                <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-cyan-200">
                  {villageInfo.sarpanchNameMr && (
                    <div className="text-xs">
                      <span className="text-cyan-600 font-semibold">सरपंच:</span>
                      <span className="ml-1 text-cyan-900 font-medium">{villageInfo.sarpanchNameMr}</span>
                    </div>
                  )}
                  {villageInfo.secretaryNameMr && (
                    <div className="text-xs">
                      <span className="text-cyan-600 font-semibold">सचिव:</span>
                      <span className="ml-1 text-cyan-900 font-medium">{villageInfo.secretaryNameMr}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Bar with Cyan Theme */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-cyan-800 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              मालमत्ता शोधा
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                <Input
                  placeholder="मालमत्ता क्रमांक / मालक नाव / मोबाईल नंबर..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10 border-cyan-200 focus:ring-cyan-500/20 focus:border-cyan-400 h-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="h-10 px-4 font-semibold shadow-md"
                style={{ background: searching ? undefined : 'linear-gradient(135deg, #0d7377, #16a085)' }}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1.5" />
                    शोधा
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'मालमत्ता क्रमांक', icon: Hash },
                { label: 'मालकाचे नाव', icon: User },
                { label: 'मोबाईल नंबर', icon: Building2 },
              ].map((hint) => (
                <Badge key={hint.label} variant="outline" className="text-[10px] px-2 py-0.5 border-cyan-200 text-cyan-600 bg-cyan-50/50">
                  <hint.icon className="h-2.5 w-2.5 mr-0.5" />
                  {hint.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search Results as selectable cards */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-cyan-700">शोध निकाल ({searchResults.length})</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {searchResults.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedPropertyId(prop.id)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      selectedPropertyId === prop.id
                        ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedPropertyId === prop.id ? 'bg-cyan-500' : 'bg-cyan-100'}`}>
                        <Building2 className={`h-4 w-4 ${selectedPropertyId === prop.id ? 'text-white' : 'text-cyan-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{prop.propertyNumber}</div>
                        <div className="text-xs text-muted-foreground truncate">{getOwnerName(prop)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Property Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-cyan-800 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                मालमत्ता निवडा
              </Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="border-cyan-200 focus:ring-cyan-500/20 focus:border-cyan-400 h-10">
                  <SelectValue placeholder="मालमत्ता निवडा..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-semibold">{p.propertyNumber}</span>
                      <span className="text-muted-foreground"> — {getOwnerName(p)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handlePrint}
                disabled={!selectedProperty}
                className="w-full sm:w-auto h-10 px-6 font-semibold shadow-md"
                style={{
                  background: !selectedProperty ? undefined : 'linear-gradient(135deg, #0d7377, #16a085)',
                }}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                प्रिंट करा
              </Button>
            </div>
          </div>

          {/* Selected Property Preview */}
          {selectedProperty && (
            <div
              className="p-4 rounded-xl border border-cyan-200"
              style={{ background: 'linear-gradient(135deg, #e8f8f5, #f0fdfa)' }}
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0d7377, #16a085)' }}>
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-cyan-900 text-sm">{selectedProperty.propertyNumber}</span>
                    {getConstructionBadge(selectedProperty.constructionType)}
                    {getUsageBadge(selectedProperty.usageType)}
                    <Badge className="bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs">
                      <MapPin className="h-3 w-3 mr-0.5" />
                      {selectedProperty.ward?.wardNameMr || '-'}
                    </Badge>
                    <Badge className={`text-xs border ${selectedProperty.propertyStatus === 'Active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                      {selectedProperty.propertyStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-cyan-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {getOwnerName(selectedProperty)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      {selectedProperty.road?.roadNameMr || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {selectedProperty.area || 0} चौ.फूट
                    </span>
                    {selectedProperty.taxRates.length > 0 && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {selectedProperty.taxRates.filter(t => t.taxMaster.isEnabled).length} कर दर
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== LOADING STATE ===== */}
      {loading ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #16a085, #1abc9c)' }} />
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3 justify-center mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              <span className="text-cyan-700 font-semibold">डेटा लोड होत आहे...</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !selectedProperty ? (
        /* ===== EMPTY STATE ===== */
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d7377, #16a085, #1abc9c)' }} />
          <CardContent className="p-12 text-center">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #e8f8f5, #d5f5e3)' }}
            >
              <ClipboardList className="h-10 w-10 text-cyan-300" />
            </div>
            <p className="text-lg font-bold text-cyan-900">मालमत्ता निवडा</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              वरील ड्रॉपडाउनमधून किंवा शोध बारद्वारे मालमत्ता निवडल्यावर नमुना १ ऑटोमॅटिक भरला जाईल
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                <Building2 className="h-3 w-3 text-cyan-500" />
                Property Master
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Auto Fill
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-1 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                <ClipboardList className="h-3 w-3 text-cyan-500" />
                नमुना १
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ===== FORM DISPLAY — नमुना १ ===== */
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)' }} />

          {/* Form Title Header */}
          <div
            className="p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #e8f8f5, #f0fafa)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d7377, #16a085)' }}>
                <Landmark className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <div className="font-bold text-cyan-900 text-lg">{villageInfo?.gramPanchayatNameMr || 'ग्रामपंचायत'}</div>
                <div className="text-xs text-cyan-600">{villageInfo?.gramPanchayatName || ''}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              तालुका: {villageInfo?.taluka || '-'} | जिल्हा: {villageInfo?.district || '-'} | राज्य: {villageInfo?.state || '-'}
            </div>
            <Separator className="my-3" />
            <div
              className="inline-block border-2 border-cyan-500 rounded-xl px-6 py-3"
              style={{ background: 'linear-gradient(135deg, rgba(13,115,119,0.08), rgba(22,160,133,0.08))' }}
            >
              <h3 className="text-2xl font-bold text-cyan-800">नमुना १</h3>
              <p className="text-sm font-semibold text-cyan-700">मालमत्ता नोंदणी पत्र</p>
              <p className="text-xs text-cyan-600">Property Registration Form</p>
            </div>
          </div>

          <CardContent className="space-y-1 px-4 sm:px-6 pb-6">
            {/* Section 1: मालमत्तेची साधारण माहिती */}
            <SectionHeader
              number="१"
              title="मालमत्तेची साधारण माहिती"
              titleEn="General Property Information"
              icon={Home}
              color="#0d7377"
              bgColor="#e8f8f5"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
              <AutoFilledField label="मालमत्ता क्रमांक" value={selectedProperty.propertyNumber} icon={Hash} />
              <AutoFilledField label="शहर सर्वेक्षण क्रमांक" value={selectedProperty.citySurveyNo || '-'} icon={FileText} />
              <AutoFilledField
                label="वार्ड क्रमांक व नाव"
                value={selectedProperty.ward ? `${selectedProperty.ward.wardNumber} - ${selectedProperty.ward.wardNameMr}` : '-'}
                icon={MapPin}
              />
              <AutoFilledField label="रस्ता नाव" value={selectedProperty.road?.roadNameMr || '-'} icon={Route} />
              <AutoFilledField label="मालमत्तेचा वापर" value={selectedProperty.usageType || '-'} icon={Layers} />
              <AutoFilledField label="बांधकाम प्रकार" value={selectedProperty.constructionType || '-'} icon={Building2} />
              <div>
                <Label className="flex items-center text-xs font-semibold text-cyan-800 mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-cyan-600" />
                  मालमत्ता स्थिती
                  <AutoFillBadge />
                </Label>
                <div className="mt-0.5">
                  <Badge className={`text-sm px-3 py-1 border ${selectedProperty.propertyStatus === 'Active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                    {selectedProperty.propertyStatus === 'Active' ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {selectedProperty.propertyStatus}</>
                    ) : (
                      <><AlertCircle className="h-3.5 w-3.5 mr-1" /> {selectedProperty.propertyStatus}</>
                    )}
                  </Badge>
                </div>
              </div>
              <AutoFilledField label="बांधणी वर्ष" value={selectedProperty.yearBuilt || '-'} icon={Calendar} />
            </div>

            <Separator className="my-3" />

            {/* Section 2: क्षेत्रफळ माहिती */}
            <SectionHeader
              number="२"
              title="क्षेत्रफळ माहिती"
              titleEn="Area Information"
              icon={Ruler}
              color="#16a085"
              bgColor="#e8f8f5"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-1">
              <AutoFilledField label="एकूण क्षेत्रफळ (चौ.फूट)" value={String(selectedProperty.area || '-')} icon={Ruler} />
              <AutoFilledField label="बांधलेले क्षेत्रफळ (चौ.फूट)" value={String(selectedProperty.builtUpArea || '-')} icon={Building2} />
              <AutoFilledField label="मजला माहिती" value={selectedProperty.floorInfo || '-'} icon={Layers} />
            </div>

            <Separator className="my-3" />

            {/* Section 3: मालक व भोगवटादार */}
            <SectionHeader
              number="३"
              title="मालक व भोगवटादार माहिती"
              titleEn="Owner & Occupant Information"
              icon={Users}
              color="#0d7377"
              bgColor="#e8f8f5"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
              <AutoFilledField label="मालकाचे नाव" value={getOwnerName(selectedProperty)} icon={User} />
              <AutoFilledField label="मालकाचा पत्ता" value={getOwnerAddress(selectedProperty)} icon={MapPin} />
              <AutoFilledField label="भोगवटादाराचे नाव" value={getOccupantName(selectedProperty)} icon={Users} />
            </div>

            {/* All Owners Table */}
            {selectedProperty.owners && selectedProperty.owners.length > 0 && (
              <div className="mt-4 px-1">
                <Label className="mb-2 block text-xs font-semibold text-cyan-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  सर्व मालक / भोगवटादार यादी
                </Label>
                <div className="overflow-x-auto rounded-lg border border-cyan-200">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: 'linear-gradient(90deg, #0d7377, #16a085)' }}>
                        <TableHead className="text-white font-semibold w-12 text-center">क्र.</TableHead>
                        <TableHead className="text-white font-semibold">नाव</TableHead>
                        <TableHead className="text-white font-semibold text-center">मालकी प्रकार</TableHead>
                        <TableHead className="text-white font-semibold">मोबाईल</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProperty.owners.map((o, i) => (
                        <TableRow key={o.owner.id} className={i % 2 === 0 ? 'bg-cyan-50/30' : 'bg-white'}>
                          <TableCell className="text-center font-medium text-sm">{i + 1}</TableCell>
                          <TableCell className="font-medium text-sm">
                            {o.owner.firstNameMr || o.owner.firstName} {o.owner.lastNameMr || o.owner.lastName}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs border ${
                              o.ownershipType === 'मालक'
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                : o.ownershipType === 'भोगवटादार'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-purple-100 text-purple-800 border-purple-300'
                            }`}>
                              {o.ownershipType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.owner.mobileNumber || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Separator className="my-3" />

            {/* Section 4: सीमा माहिती */}
            <SectionHeader
              number="४"
              title="सीमा माहिती"
              titleEn="Boundary Information"
              icon={Compass}
              color="#16a085"
              bgColor="#e8f8f5"
            />
            <div className="overflow-x-auto rounded-lg border border-teal-200 px-1">
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'linear-gradient(90deg, #16a085, #1abc9c)' }}>
                    <TableHead className="text-white font-semibold w-36 text-center">दिशा / Direction</TableHead>
                    <TableHead className="text-white font-semibold">शेजारी मालमत्ता / वर्णन</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const b = getBoundaries(selectedProperty);
                    const directions = [
                      { mr: 'पूर्व', en: 'East', value: b.east, icon: '→', color: 'text-orange-600' },
                      { mr: 'पश्चिम', en: 'West', value: b.west, icon: '←', color: 'text-blue-600' },
                      { mr: 'उत्तर', en: 'North', value: b.north, icon: '↑', color: 'text-green-600' },
                      { mr: 'दक्षिण', en: 'South', value: b.south, icon: '↓', color: 'text-red-600' },
                    ];
                    return directions.map((d, i) => (
                      <TableRow key={d.en} className={i % 2 === 0 ? 'bg-teal-50/30' : 'bg-white'}>
                        <TableCell className="font-semibold text-center">
                          <span className={`text-lg mr-1 ${d.color}`}>{d.icon}</span>
                          <span className="text-sm">{d.mr}</span>
                          <span className="text-xs text-muted-foreground ml-1">({d.en})</span>
                        </TableCell>
                        <TableCell className="text-sm">{d.value}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Section 5: Tax Rates */}
            {selectedProperty.taxRates && selectedProperty.taxRates.length > 0 && (
              <>
                <Separator className="my-3" />
                <SectionHeader
                  number="५"
                  title="लागू कर दर"
                  titleEn="Applicable Tax Rates"
                  icon={IndianRupee}
                  color="#0d7377"
                  bgColor="#e8f8f5"
                />
                <div className="overflow-x-auto rounded-lg border border-cyan-200 px-1">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: 'linear-gradient(90deg, #0d7377, #16a085)' }}>
                        <TableHead className="text-white font-semibold w-12 text-center">क्र.</TableHead>
                        <TableHead className="text-white font-semibold">कराचे नाव</TableHead>
                        <TableHead className="text-white font-semibold text-center">कर प्रकार</TableHead>
                        <TableHead className="text-white font-semibold text-right">दर (₹/चौ.फूट)</TableHead>
                        <TableHead className="text-white font-semibold text-center">स्थिती</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProperty.taxRates.map((tr, i) => (
                        <TableRow key={tr.taxMasterId} className={`${i % 2 === 0 ? 'bg-cyan-50/30' : 'bg-white'} ${!tr.taxMaster.isEnabled ? 'opacity-60' : ''}`}>
                          <TableCell className="text-center font-medium text-sm">{i + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{tr.taxMaster.nameMarathi}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {tr.taxMaster.category === 'general' ? 'सामान्य' : tr.taxMaster.category === 'penalty' ? 'दंड' : tr.taxMaster.category === 'interest' ? 'व्याज' : tr.taxMaster.category || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">₹{tr.rate}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs border ${tr.taxMaster.isEnabled ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                              {tr.taxMaster.isEnabled ? 'सक्षम' : 'अक्षम'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Signature Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  दिनांक
                </p>
                <p className="border-t pt-2 text-sm mt-8 font-medium">
                  {new Date().toLocaleDateString('mr-IN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">मालकाची सही</p>
                <div className="border-t pt-2 mt-8 text-xs text-muted-foreground">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">ग्रामसेवक सही</p>
                <div className="border-t pt-2 mt-8 text-xs text-muted-foreground">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">सरपंच सही व मुद्रा</p>
                <div className="border-t pt-2 mt-8 text-xs text-muted-foreground">&nbsp;</div>
              </div>
            </div>

            {/* Print Button at bottom */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handlePrint}
                className="h-11 px-8 text-sm font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0d7377, #16a085)' }}
              >
                <Printer className="h-5 w-5 mr-2" />
                नमुना १ प्रिंट करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
