'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Save, Plus, RefreshCw } from 'lucide-react';

interface TaxMaster {
  id: string;
  name: string;
  nameMarathi: string;
  rate: number;
  isEnabled: boolean;
  order: number;
}

export default function TaxMasterComponent() {
  const [taxes, setTaxes] = useState<TaxMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTax, setNewTax] = useState({ name: '', nameMarathi: '', rate: 0 });

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tax-master');
      const data = await res.json();
      if (data.length === 0) {
        // Auto seed
        await fetch('/api/tax-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
        const res2 = await fetch('/api/tax-master');
        const data2 = await res2.json();
        setTaxes(data2);
      } else {
        setTaxes(data);
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'कर मास्टर लोड करण्यात अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleToggle = (id: string, isEnabled: boolean) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, isEnabled } : t));
  };

  const handleRateChange = (id: string, rate: number) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, rate } : t));
  };

  const handleNameMarathiChange = (id: string, nameMarathi: string) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, nameMarathi } : t));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/tax-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkUpdate',
          taxes: taxes.map(t => ({
            id: t.id,
            rate: t.rate,
            isEnabled: t.isEnabled,
            nameMarathi: t.nameMarathi,
          })),
        }),
      });
      if (res.ok) {
        toast({ title: 'यशस्वी', description: 'कर मास्टर अपडेट झाला' });
      } else {
        toast({ title: 'त्रुटी', description: 'अपडेट अयशस्वी', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'अपडेट अयशस्वी', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTax = async () => {
    if (!newTax.name || !newTax.nameMarathi) {
      toast({ title: 'त्रुटी', description: 'कराचे नाव आणि मराठी नाव आवश्यक आहे', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/tax-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTax,
          isEnabled: true,
          order: taxes.length + 1,
        }),
      });
      if (res.ok) {
        toast({ title: 'यशस्वी', description: 'नवीन कर जोडला' });
        setNewTax({ name: '', nameMarathi: '', rate: 0 });
        fetchTaxes();
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'कर जोडण्यात अयशस्वी', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl">कर मास्टर (Tax Master)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTaxes} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'जतन करत आहे...' : 'सर्व जतन करा'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">लोड होत आहे...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">क्र.</TableHead>
                    <TableHead>कर नाव (English)</TableHead>
                    <TableHead>कर नाव (मराठी)</TableHead>
                    <TableHead className="w-32">दर (₹)</TableHead>
                    <TableHead className="w-24 text-center">सक्षम</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((tax, index) => (
                    <TableRow key={tax.id} className={!tax.isEnabled ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>
                        <Input
                          value={tax.nameMarathi}
                          onChange={(e) => handleNameMarathiChange(tax.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tax.rate}
                          onChange={(e) => handleRateChange(tax.id, parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                          min={0}
                          step={0.5}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={tax.isEnabled}
                          onCheckedChange={(checked) => handleToggle(tax.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">नवीन कर जोडा</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <Label>कर नाव (English)</Label>
              <Input
                value={newTax.name}
                onChange={(e) => setNewTax(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Road Tax"
              />
            </div>
            <div>
              <Label>कर नाव (मराठी)</Label>
              <Input
                value={newTax.nameMarathi}
                onChange={(e) => setNewTax(prev => ({ ...prev, nameMarathi: e.target.value }))}
                placeholder="उदा. रस्ता कर"
              />
            </div>
            <div>
              <Label>दर (₹)</Label>
              <Input
                type="number"
                value={newTax.rate}
                onChange={(e) => setNewTax(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                min={0}
              />
            </div>
            <Button onClick={handleAddTax}>
              <Plus className="h-4 w-4 mr-1" /> जोडा
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
