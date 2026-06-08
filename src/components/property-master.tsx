'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';

interface TaxMaster {
  id: string;
  name: string;
  nameMarathi: string;
  rate: number;
  isEnabled: boolean;
  order: number;
}

interface PropertyTaxRate {
  id: string;
  taxMasterId: string;
  rate: number;
  taxMaster: TaxMaster;
}

interface Property {
  id: string;
  propertyNumber: string;
  ownerName: string;
  occupantName: string | null;
  mobileNumber: string | null;
  ward: string | null;
  road: string | null;
  citySurveyNo: string | null;
  area: number | null;
  boundaries: string | null;
  constructionType: string | null;
  usageType: string | null;
  floorInfo: string | null;
  taxRates: PropertyTaxRate[];
}

const emptyForm = {
  propertyNumber: '',
  ownerName: '',
  occupantName: '',
  mobileNumber: '',
  ward: '',
  road: '',
  citySurveyNo: '',
  area: '',
  boundaries: '',
  constructionType: '',
  usageType: '',
  floorInfo: '',
};

const constructionTypes = ['पक्के', 'अर्धपक्के', 'कच्चे', 'इतर'];
const usageTypes = ['राहणीमान', 'व्यावसायिक', 'औद्योगिक', 'सार्वजनिक', 'इतर'];

export default function PropertyMasterComponent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [taxMasters, setTaxMasters] = useState<TaxMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formTaxRates, setFormTaxRates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, taxRes] = await Promise.all([
        fetch('/api/property'),
        fetch('/api/tax-master'),
      ]);
      const propData = await propRes.json();
      const taxData = await taxRes.json();
      setProperties(propData);
      setTaxMasters(taxData.filter((t: TaxMaster) => t.isEnabled));
    } catch {
      toast({ title: 'त्रुटी', description: 'डेटा लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchData();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/property?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setProperties(data);
    } catch {
      toast({ title: 'त्रुटी', description: 'शोध अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    const initialRates: Record<string, number> = {};
    taxMasters.forEach(t => {
      initialRates[t.id] = t.rate;
    });
    setFormTaxRates(initialRates);
    setDialogOpen(true);
  };

  const openEditDialog = (property: Property) => {
    setEditingId(property.id);
    setForm({
      propertyNumber: property.propertyNumber,
      ownerName: property.ownerName,
      occupantName: property.occupantName || '',
      mobileNumber: property.mobileNumber || '',
      ward: property.ward || '',
      road: property.road || '',
      citySurveyNo: property.citySurveyNo || '',
      area: property.area?.toString() || '',
      boundaries: property.boundaries || '',
      constructionType: property.constructionType || '',
      usageType: property.usageType || '',
      floorInfo: property.floorInfo || '',
    });
    const rates: Record<string, number> = {};
    taxMasters.forEach(t => {
      const existing = property.taxRates.find(tr => tr.taxMasterId === t.id);
      rates[t.id] = existing ? existing.rate : t.rate;
    });
    setFormTaxRates(rates);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.propertyNumber || !form.ownerName) {
      toast({ title: 'त्रुटी', description: 'मालमत्ता क्रमांक आणि मालकाचे नाव आवश्यक', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const taxRates = Object.entries(formTaxRates)
        .filter(([, rate]) => rate > 0)
        .map(([taxMasterId, rate]) => ({ taxMasterId, rate }));

      const body = { ...form, taxRates };
      let res;
      if (editingId) {
        res = await fetch('/api/property', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editingId }),
        });
      } else {
        res = await fetch('/api/property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        toast({ title: 'यशस्वी', description: editingId ? 'मालमत्ता अपडेट झाली' : 'नवीन मालमत्ता जोडली' });
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: 'त्रुटी', description: err.error || 'अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'जतन करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ही मालमत्ता हटवायची आहे का?')) return;
    try {
      const res = await fetch(`/api/property?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'यशस्वी', description: 'मालमत्ता हटवली' });
        fetchData();
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'हटवण्यात अयशस्वी', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl">मालमत्ता मास्टर (Property Master)</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <Input
                  placeholder="मालमत्ता क्र./नाव/मोबाईल शोधा..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
              </Button>
              <Button size="sm" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-1" /> नवीन मालमत्ता
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">कोणतीही मालमत्ता नाही. नवीन मालमत्ता जोडा.</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>क्र.</TableHead>
                    <TableHead>मालमत्ता क्र.</TableHead>
                    <TableHead>मालकाचे नाव</TableHead>
                    <TableHead>भोगवटादार</TableHead>
                    <TableHead>मोबाईल</TableHead>
                    <TableHead>वार्ड</TableHead>
                    <TableHead>क्षेत्रफळ</TableHead>
                    <TableHead>बांधकाम</TableHead>
                    <TableHead>वापर</TableHead>
                    <TableHead>क्रिया</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{p.propertyNumber}</TableCell>
                      <TableCell>{p.ownerName}</TableCell>
                      <TableCell>{p.occupantName || '-'}</TableCell>
                      <TableCell>{p.mobileNumber || '-'}</TableCell>
                      <TableCell>{p.ward || '-'}</TableCell>
                      <TableCell>{p.area ? `${p.area} चौ.फूट` : '-'}</TableCell>
                      <TableCell><Badge variant="outline">{p.constructionType || '-'}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{p.usageType || '-'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'मालमत्ता संपादन' : 'नवीन मालमत्ता नोंदणी'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>मालमत्ता क्रमांक *</Label>
                <Input
                  value={form.propertyNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, propertyNumber: e.target.value }))}
                  placeholder="उदा. P-001"
                />
              </div>
              <div>
                <Label>मालकाचे नाव *</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="पूर्ण नाव"
                />
              </div>
              <div>
                <Label>भोगवटादाराचे नाव</Label>
                <Input
                  value={form.occupantName}
                  onChange={(e) => setForm(prev => ({ ...prev, occupantName: e.target.value }))}
                  placeholder="भोगवटादार नाव"
                />
              </div>
              <div>
                <Label>मोबाईल नंबर</Label>
                <Input
                  value={form.mobileNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="मोबाईल नंबर"
                />
              </div>
              <div>
                <Label>वार्ड</Label>
                <Input
                  value={form.ward}
                  onChange={(e) => setForm(prev => ({ ...prev, ward: e.target.value }))}
                  placeholder="वार्ड नंबर/नाव"
                />
              </div>
              <div>
                <Label>रस्ता</Label>
                <Input
                  value={form.road}
                  onChange={(e) => setForm(prev => ({ ...prev, road: e.target.value }))}
                  placeholder="रस्ता नाव"
                />
              </div>
              <div>
                <Label>सिटी सर्व्हे नं.</Label>
                <Input
                  value={form.citySurveyNo}
                  onChange={(e) => setForm(prev => ({ ...prev, citySurveyNo: e.target.value }))}
                  placeholder="सिटी सर्व्हे नंबर"
                />
              </div>
              <div>
                <Label>क्षेत्रफळ (चौ.फूट)</Label>
                <Input
                  type="number"
                  value={form.area}
                  onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="क्षेत्रफळ"
                />
              </div>
              <div>
                <Label>चतु:सीमा</Label>
                <Input
                  value={form.boundaries}
                  onChange={(e) => setForm(prev => ({ ...prev, boundaries: e.target.value }))}
                  placeholder="पूर्व, पश्चिम, उत्तर, दक्षिण"
                />
              </div>
              <div>
                <Label>बांधकाम प्रकार</Label>
                <Select
                  value={form.constructionType}
                  onValueChange={(value) => setForm(prev => ({ ...prev, constructionType: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                  <SelectContent>
                    {constructionTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>वापर प्रकार</Label>
                <Select
                  value={form.usageType}
                  onValueChange={(value) => setForm(prev => ({ ...prev, usageType: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                  <SelectContent>
                    {usageTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>मजला माहिती</Label>
                <Input
                  value={form.floorInfo}
                  onChange={(e) => setForm(prev => ({ ...prev, floorInfo: e.target.value }))}
                  placeholder="उदा. G+1"
                />
              </div>
            </div>

            {/* Tax Rates */}
            <div>
              <h3 className="text-lg font-semibold mb-3">कर दर (Tax Rates)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {taxMasters.map(tax => (
                  <div key={tax.id} className="border rounded-lg p-3">
                    <Label className="text-sm">{tax.nameMarathi}</Label>
                    <Input
                      type="number"
                      value={formTaxRates[tax.id] || 0}
                      onChange={(e) => setFormTaxRates(prev => ({
                        ...prev,
                        [tax.id]: parseFloat(e.target.value) || 0
                      }))}
                      className="h-8 mt-1"
                      min={0}
                      step={0.5}
                    />
                    <span className="text-xs text-muted-foreground">₹ / चौ.फूट</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>रद्द करा</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'जतन करत आहे...' : 'जतन करा'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
