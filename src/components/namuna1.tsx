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
import { toast } from '@/hooks/use-toast';
import { Printer, RefreshCw, Search, FileText, Building2, Users, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

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

// Auto-fill badge component
function AutoFillBadge() {
  return (
    <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50">
      <CheckCircle2 className="h-3 w-3 mr-0.5" />
      ऑटो-फिल
    </Badge>
  );
}

export default function Namuna1Component() {
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [villageInfo, setVillageInfo] = useState<VillageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PropertyInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyInfo | null>(null);

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
    } else {
      setSelectedProperty(null);
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
        east: parsed.east || parsed.pूर्व || '-',
        west: parsed.west || parsed.पश्चिम || '-',
        north: parsed.north || parsed.उत्तर || '-',
        south: parsed.south || parsed.दक्षिण || '-',
      };
    } catch {
      return { east: prop.boundaries, west: '-', north: '-', south: '-' };
    }
  };

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

    const printContent = `<!DOCTYPE html><html><head><title>नमुना १ - मालमत्ता नोंदणी पत्र</title>
<style>
  body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; font-size: 13px; }
  h1 { text-align: center; font-size: 18px; margin-bottom: 2px; }
  h2 { text-align: center; font-size: 14px; margin-top: 2px; }
  .village-header { text-align: center; margin-bottom: 15px; }
  .village-header h3 { font-size: 16px; margin: 2px 0; }
  .village-header p { font-size: 12px; margin: 2px 0; color: #555; }
  .form-title { text-align: center; border: 2px solid #333; padding: 8px; margin: 15px 0; background: #f9f9f9; }
  .form-title h2 { margin: 0; font-size: 16px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 15px; }
  .info-item { font-size: 12px; padding: 4px 0; border-bottom: 1px dotted #ccc; }
  .info-item strong { display: inline-block; min-width: 160px; }
  .boundaries-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .boundaries-table th, .boundaries-table td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; text-align: center; }
  .boundaries-table th { background: #f0f0f0; }
  .section-title { font-weight: bold; font-size: 13px; margin: 15px 0 8px 0; border-bottom: 1px solid #999; padding-bottom: 3px; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
  .footer-item { text-align: center; }
  .footer-item .line { border-top: 1px solid #333; width: 180px; margin-top: 40px; padding-top: 4px; }
  @media print { body { margin: 10px; } }
</style></head><body>

<div class="village-header">
  <h3>ग्रामपंचायत: ${villageInfo?.gramPanchayatNameMr || '-'}</h3>
  <p>तालुका: ${villageInfo?.taluka || '-'} | जिल्हा: ${villageInfo?.district || '-'} | राज्य: ${villageInfo?.state || '-'}</p>
</div>

<div class="form-title">
  <h2>नमुना १ - मालमत्ता नोंदणी पत्र</h2>
  <p style="font-size:11px; margin:2px 0 0 0">Property Registration Form</p>
</div>

<div class="section-title">१. मालमत्तेची साधारण माहिती</div>
<div class="info-grid">
  <div class="info-item"><strong>मालमत्ता क्रमांक:</strong> ${prop.propertyNumber}</div>
  <div class="info-item"><strong>शहर सर्वेक्षण क्रमांक:</strong> ${prop.citySurveyNo || '-'}</div>
  <div class="info-item"><strong>वार्ड क्रमांक व नाव:</strong> ${prop.ward ? `${prop.ward.wardNumber} - ${prop.ward.wardNameMr}` : '-'}</div>
  <div class="info-item"><strong>रस्ता नाव:</strong> ${prop.road?.roadNameMr || '-'}</div>
  <div class="info-item"><strong>मालमत्तेचा वापर:</strong> ${prop.usageType || '-'}</div>
  <div class="info-item"><strong>बांधकाम प्रकार:</strong> ${prop.constructionType || '-'}</div>
  <div class="info-item"><strong>मालमत्ता स्थिती:</strong> ${prop.propertyStatus || '-'}</div>
  <div class="info-item"><strong>बांधणी वर्ष:</strong> ${prop.yearBuilt || '-'}</div>
</div>

<div class="section-title">२. क्षेत्रफळ माहिती</div>
<div class="info-grid">
  <div class="info-item"><strong>एकूण क्षेत्रफळ:</strong> ${prop.area || '-'} चौ.फूट</div>
  <div class="info-item"><strong>बांधलेले क्षेत्रफळ:</strong> ${prop.builtUpArea || '-'} चौ.फूट</div>
  <div class="info-item"><strong>मजला माहिती:</strong> ${prop.floorInfo || '-'}</div>
</div>

<div class="section-title">३. मालक व भोगवटादार माहिती</div>
<div class="info-grid">
  <div class="info-item"><strong>मालकाचे नाव:</strong> ${ownerName}</div>
  <div class="info-item"><strong>मालकाचा पत्ता:</strong> ${ownerAddress}</div>
  <div class="info-item"><strong>भोगवटादाराचे नाव:</strong> ${occupantName}</div>
</div>

<div class="section-title">४. सीमा माहिती</div>
<table class="boundaries-table">
  <thead><tr><th>दिशा</th><th>शेजारी मालमत्ता / वर्णन</th></tr></thead>
  <tbody>
    <tr><td>पूर्व</td><td>${boundaries.east}</td></tr>
    <tr><td>पश्चिम</td><td>${boundaries.west}</td></tr>
    <tr><td>उत्तर</td><td>${boundaries.north}</td></tr>
    <tr><td>दक्षिण</td><td>${boundaries.south}</td></tr>
  </tbody>
</table>

${prop.taxRates && prop.taxRates.length > 0 ? `
<div class="section-title">५. लागू कर दर</div>
<table class="boundaries-table">
  <thead><tr><th>क्र.</th><th>कराचे नाव</th><th>दर (₹/चौ.फूट)</th></tr></thead>
  <tbody>
    ${prop.taxRates.map((tr, i) => `<tr><td>${i + 1}</td><td>${tr.taxMaster.nameMarathi} (${tr.taxMaster.name})</td><td>${tr.rate}</td></tr>`).join('')}
  </tbody>
</table>
` : ''}

<div class="footer">
  <div class="footer-item">
    <div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div>
  </div>
  <div class="footer-item">
    <div class="line">मालकाची सही</div>
  </div>
  <div class="footer-item">
    <div class="line">ग्रामसेवक सही</div>
  </div>
  <div class="footer-item">
    <div class="line">सरपंच सही व मुद्रा</div>
  </div>
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

  return (
    <div className="space-y-6">
      {/* Header Card with Search and Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl">नमुना १ - मालमत्ता नोंदणी पत्र</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-base">मालमत्ता शोधा</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="मालमत्ता क्रमांक / मालक नाव / मोबाईल नंबर..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Property selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>मालमत्ता निवडा</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="मालमत्ता निवडा..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyNumber} - {getOwnerName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handlePrint} disabled={!selectedProperty} className="w-full sm:w-auto">
                <Printer className="h-4 w-4 mr-1" /> प्रिंट करा
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-fill Process Flow Explanation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-muted/30">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Property Master</span>
            </div>
            <span className="text-muted-foreground">+</span>
            <div className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-muted/30">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Owner Master</span>
            </div>
            <span className="text-muted-foreground">+</span>
            <div className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-muted/30">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Ward Master</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Auto Fill</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-primary/10 border-primary/30">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">नमुना १</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            डेटा लोड होत आहे...
          </CardContent>
        </Card>
      ) : !selectedProperty ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">मालमत्ता निवडा</p>
            <p className="text-sm mt-1">वरील ड्रॉपडाउनमधून मालमत्ता निवडल्यावर नमुना १ ऑटोमॅटिक भरला जाईल</p>
          </CardContent>
        </Card>
      ) : (
        /* Form Display - नमुना १ */
        <Card>
          <CardHeader>
            <div className="text-center">
              <h2 className="text-lg font-bold">ग्रामपंचायत: {villageInfo?.gramPanchayatNameMr || '-'}</h2>
              <p className="text-sm text-muted-foreground">
                तालुका: {villageInfo?.taluka || '-'} | जिल्हा: {villageInfo?.district || '-'} | राज्य: {villageInfo?.state || '-'}
              </p>
              <Separator className="my-3" />
              <div className="border-2 border-foreground/20 rounded-lg p-3 bg-muted/30">
                <h3 className="text-xl font-bold">नमुना १</h3>
                <p className="text-sm font-medium">मालमत्ता नोंदणी पत्र</p>
                <p className="text-xs text-muted-foreground">Property Registration Form</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section 1: Basic Property Info */}
            <div>
              <h4 className="font-semibold text-base mb-3 border-b pb-1">१. मालमत्तेची साधारण माहिती</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center">मालमत्ता क्रमांक <AutoFillBadge /></Label>
                  <Input value={selectedProperty.propertyNumber} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">शहर सर्वेक्षण क्रमांक <AutoFillBadge /></Label>
                  <Input value={selectedProperty.citySurveyNo || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">वार्ड क्रमांक व नाव <AutoFillBadge /></Label>
                  <Input
                    value={selectedProperty.ward ? `${selectedProperty.ward.wardNumber} - ${selectedProperty.ward.wardNameMr}` : '-'}
                    readOnly
                    className="bg-green-50/50 border-green-200"
                  />
                </div>
                <div>
                  <Label className="flex items-center">रस्ता नाव <AutoFillBadge /></Label>
                  <Input value={selectedProperty.road?.roadNameMr || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">मालमत्तेचा वापर <AutoFillBadge /></Label>
                  <Input value={selectedProperty.usageType || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">बांधकाम प्रकार <AutoFillBadge /></Label>
                  <Input value={selectedProperty.constructionType || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">मालमत्ता स्थिती <AutoFillBadge /></Label>
                  <div className="mt-1">
                    <Badge variant={selectedProperty.propertyStatus === 'Active' ? 'default' : 'destructive'}>
                      {selectedProperty.propertyStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="flex items-center">बांधणी वर्ष <AutoFillBadge /></Label>
                  <Input value={selectedProperty.yearBuilt || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2: Area Info */}
            <div>
              <h4 className="font-semibold text-base mb-3 border-b pb-1">२. क्षेत्रफळ माहिती</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center">एकूण क्षेत्रफळ (चौ.फूट) <AutoFillBadge /></Label>
                  <Input value={selectedProperty.area || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">बांधलेले क्षेत्रफळ (चौ.फूट) <AutoFillBadge /></Label>
                  <Input value={selectedProperty.builtUpArea || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">मजला माहिती <AutoFillBadge /></Label>
                  <Input value={selectedProperty.floorInfo || '-'} readOnly className="bg-green-50/50 border-green-200" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3: Owner & Occupant Info */}
            <div>
              <h4 className="font-semibold text-base mb-3 border-b pb-1">३. मालक व भोगवटादार माहिती</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center">मालकाचे नाव <AutoFillBadge /></Label>
                  <Input value={getOwnerName(selectedProperty)} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">मालकाचा पत्ता <AutoFillBadge /></Label>
                  <Input value={getOwnerAddress(selectedProperty)} readOnly className="bg-green-50/50 border-green-200" />
                </div>
                <div>
                  <Label className="flex items-center">भोगवटादाराचे नाव <AutoFillBadge /></Label>
                  <Input value={getOccupantName(selectedProperty)} readOnly className="bg-green-50/50 border-green-200" />
                </div>
              </div>

              {/* All Owners Table */}
              {selectedProperty.owners && selectedProperty.owners.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">सर्व मालक / भोगवटादार यादी</Label>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>क्र.</TableHead>
                          <TableHead>नाव</TableHead>
                          <TableHead>मालकी प्रकार</TableHead>
                          <TableHead>मोबाईल</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProperty.owners.map((o, i) => (
                          <TableRow key={o.owner.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">
                              {o.owner.firstNameMr || o.owner.firstName} {o.owner.lastNameMr || o.owner.lastName}
                            </TableCell>
                            <TableCell>
                              <Badge variant={o.ownershipType === 'मालक' ? 'default' : 'secondary'}>
                                {o.ownershipType}
                              </Badge>
                            </TableCell>
                            <TableCell>{o.owner.mobileNumber || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Section 4: Boundaries */}
            <div>
              <h4 className="font-semibold text-base mb-3 border-b pb-1">४. सीमा माहिती</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">दिशा</TableHead>
                      <TableHead>शेजारी मालमत्ता / वर्णन</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const b = getBoundaries(selectedProperty);
                      return (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">पूर्व (East)</TableCell>
                            <TableCell>{b.east}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">पश्चिम (West)</TableCell>
                            <TableCell>{b.west}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">उत्तर (North)</TableCell>
                            <TableCell>{b.north}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">दक्षिण (South)</TableCell>
                            <TableCell>{b.south}</TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Section 5: Tax Rates (if available) */}
            {selectedProperty.taxRates && selectedProperty.taxRates.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-base mb-3 border-b pb-1">५. लागू कर दर</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>क्र.</TableHead>
                          <TableHead>कराचे नाव</TableHead>
                          <TableHead>कर प्रकार</TableHead>
                          <TableHead className="text-right">दर (₹/चौ.फूट)</TableHead>
                          <TableHead>स्थिती</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProperty.taxRates.map((tr, i) => (
                          <TableRow key={tr.taxMasterId}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">{tr.taxMaster.nameMarathi}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{tr.taxMaster.name}</TableCell>
                            <TableCell className="text-right">₹{tr.rate}</TableCell>
                            <TableCell>
                              <Badge variant={tr.taxMaster.isEnabled ? 'default' : 'destructive'}>
                                {tr.taxMaster.isEnabled ? 'सक्षम' : 'अक्षम'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Footer section - Signatures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">दिनांक</p>
                <p className="border-t pt-2 text-sm mt-10">
                  {new Date().toLocaleDateString('mr-IN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">मालकाची सही</p>
                <div className="border-t pt-2 mt-10">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">ग्रामसेवक सही</p>
                <div className="border-t pt-2 mt-10">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">सरपंच सही व मुद्रा</p>
                <div className="border-t pt-2 mt-10">&nbsp;</div>
              </div>
            </div>

            {/* Print Button at bottom */}
            <div className="flex justify-center pt-4">
              <Button onClick={handlePrint} size="lg">
                <Printer className="h-5 w-5 mr-2" /> नमुना १ प्रिंट करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
