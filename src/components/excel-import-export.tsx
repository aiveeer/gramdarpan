'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileDown,
  Trash2,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Table definitions
const TABLES = [
  { key: 'ward', label: 'वार्ड', labelEn: 'Ward' },
  { key: 'owner', label: 'मालक', labelEn: 'Owner' },
  { key: 'road', label: 'रस्ता', labelEn: 'Road' },
  { key: 'drainage', label: 'नाला', labelEn: 'Drainage' },
  { key: 'waterSupply', label: 'पाणीपुरवठा', labelEn: 'Water Supply' },
  { key: 'streetLight', label: 'दिवाबती', labelEn: 'Street Light' },
  { key: 'readyReckoner', label: 'रेडी रेकनर', labelEn: 'Ready Reckoner' },
  { key: 'disability', label: 'विकलांगता', labelEn: 'Disability' },
  { key: 'employee', label: 'कर्मचारी', labelEn: 'Employee' },
  { key: 'tax', label: 'कर', labelEn: 'Tax' },
  { key: 'property', label: 'मालमत्ता', labelEn: 'Property' },
] as const;

type TableKey = (typeof TABLES)[number]['key'];

interface ImportError {
  row: number;
  message: string;
  data?: Record<string, string>;
}

interface ImportResult {
  successCount: number;
  errorCount: number;
  totalRows: number;
  errors: ImportError[];
}

export default function ExcelImportExport() {
  const [activeTable, setActiveTable] = useState<TableKey>('ward');
  const [parsedData, setParsedData] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Parse CSV text into array of objects
  const parseCSV = useCallback((text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);

    const records: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header.trim()] = values[idx]?.trim() || '';
      });
      records.push(record);
    }
    return records;
  }, []);

  // Parse a single CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current);
    return result;
  };

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportResult(null);

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'xlsx') {
        toast({
          title: 'चुकीचा फाईल प्रकार',
          description: 'कृपया .csv किंवा .xlsx फाईल निवडा',
          variant: 'destructive',
        });
        return;
      }

      if (ext === 'xlsx') {
        toast({
          title: 'Excel फाईल',
          description: 'कृपया .xlsx फाईल .csv मध्ये रूपांतरित करा किंवा .csv फाईल वापरा',
          variant: 'destructive',
        });
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const data = parseCSV(text);
          if (data.length === 0) {
            toast({
              title: 'रिकामी फाईल',
              description: 'फाईलमध्ये कोणतेही डेटा नाही',
              variant: 'destructive',
            });
            return;
          }
          setParsedData(data);
          setShowPreview(true);
          toast({
            title: 'फाईल वाचली',
            description: `${data.length} रेकॉर्ड आढळले`,
          });
        } catch {
          toast({
            title: 'फाईल वाचण्यात त्रुटी',
            description: 'CSV फाईल वाचता आली नाही',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    },
    [parseCSV, toast]
  );

  // Handle import
  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/excel/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: activeTable,
          data: parsedData,
        }),
      });

      const result: ImportResult = await res.json();

      if (!res.ok) {
        toast({
          title: 'आयात त्रुटी',
          description: result.errors?.[0]?.message || 'आयात करताना त्रुटी आली',
          variant: 'destructive',
        });
      } else {
        setImportResult(result);
        if (result.errorCount === 0) {
          toast({
            title: 'आयात यशस्वी!',
            description: `${result.successCount} रेकॉर्ड यशस्वीरित्या आयात केले`,
          });
        } else {
          toast({
            title: 'आयात अंशतः यशस्वी',
            description: `${result.successCount} यशस्वी, ${result.errorCount} त्रुटी`,
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: 'नेटवर्क त्रुटी',
        description: 'सर्व्हरशी संपर्क साधता आला नाही',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle export
  const handleExport = async (table: TableKey) => {
    try {
      const res = await fetch(`/api/excel/export?table=${table}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${table}_export.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'निर्यात यशस्वी',
        description: `${TABLES.find((t) => t.key === table)?.label || table} डेटा डाउनलोड केला`,
      });
    } catch {
      toast({
        title: 'निर्यात त्रुटी',
        description: 'डेटा निर्यात करताना त्रुटी आली',
        variant: 'destructive',
      });
    }
  };

  // Handle template download
  const handleTemplateDownload = async (table: TableKey) => {
    try {
      const res = await fetch(`/api/excel/export?table=${table}&template=true`);
      if (!res.ok) throw new Error('Template download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'टेम्पलेट डाउनलोड',
        description: `${TABLES.find((t) => t.key === table)?.label || table} टेम्पलेट डाउनलोड केला`,
      });
    } catch {
      toast({
        title: 'त्रुटी',
        description: 'टेम्पलेट डाउनलोड करताना त्रुटी',
        variant: 'destructive',
      });
    }
  };

  // Clear file
  const clearFile = () => {
    setParsedData(null);
    setFileName('');
    setShowPreview(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get preview columns
  const previewColumns = parsedData && parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <div className="space-y-4">
      {/* Table Tabs */}
      <Tabs
        value={activeTable}
        onValueChange={(v) => {
          setActiveTable(v as TableKey);
          clearFile();
        }}
      >
        <TabsList className="flex flex-wrap w-full h-auto gap-1">
          {TABLES.map((table) => (
            <TabsTrigger
              key={table.key}
              value={table.key}
              className="text-xs sm:text-sm py-1.5"
            >
              {table.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABLES.map((table) => (
          <TabsContent key={table.key} value={table.key}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Import Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4" />
                    आयात (Import) - {table.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Download */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateDownload(table.key)}
                      className="gap-1"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      टेम्पलेट डाउनलोड
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      CSV स्वरूपात टेम्पलेट डाउनलोड करा
                    </span>
                  </div>

                  <Separator />

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CSV फाईल निवडा</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        फाईल निवडा
                      </Button>
                      {fileName && (
                        <>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {fileName}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFile}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      केवळ .csv फाईल समर्थित. पहिली ओळ हेडर असावी.
                    </p>
                  </div>

                  {/* Preview Toggle */}
                  {parsedData && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {showPreview ? 'पूर्वावलोकन लपवा' : 'पूर्वावलोकन दाखवा'}
                      </Button>
                      <Badge variant="secondary">{parsedData.length} रेकॉर्ड</Badge>
                    </div>
                  )}

                  {/* Import Button */}
                  {parsedData && (
                    <Button
                      onClick={handleImport}
                      disabled={importing}
                      className="w-full gap-2"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          आयात सुरू...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {parsedData.length} रेकॉर्ड आयात करा
                        </>
                      )}
                    </Button>
                  )}

                  {/* Import Progress */}
                  {importing && (
                    <Progress value={undefined} className="h-2 animate-pulse" />
                  )}

                  {/* Import Results */}
                  {importResult && (
                    <div className="space-y-3 pt-2">
                      <Separator />
                      <div className="text-sm font-medium">आयात परिणाम</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="text-lg font-bold">{importResult.totalRows}</div>
                          <div className="text-xs text-muted-foreground">एकूण</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-700">
                            {importResult.successCount}
                          </div>
                          <div className="text-xs text-muted-foreground">यशस्वी</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-700">
                            {importResult.errorCount}
                          </div>
                          <div className="text-xs text-muted-foreground">त्रुटी</div>
                        </div>
                      </div>

                      {/* Error Details */}
                      {importResult.errors.length > 0 && (
                        <ScrollArea className="max-h-48">
                          <div className="space-y-1">
                            {importResult.errors.map((err, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 p-2 bg-red-50 rounded text-xs"
                              >
                                <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium">ओळ {err.row}:</span>{' '}
                                  {err.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="h-4 w-4" />
                    निर्यात (Export) - {table.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <span>{table.label} मास्टर टेबलचा डेटा CSV स्वरूपात डाउनलोड करा</span>
                    </div>
                    <Button
                      onClick={() => handleExport(table.key)}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <Download className="h-4 w-4" />
                      {table.label} डेटा निर्यात करा
                    </Button>
                  </div>

                  <Separator />

                  {/* Quick Export All */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">सर्व टेबल निर्यात</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TABLES.map((t) => (
                        <Button
                          key={t.key}
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(t.key)}
                          className="gap-1 text-xs"
                        >
                          <Download className="h-3 w-3" />
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Template All */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">सर्व टेम्पलेट डाउनलोड</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TABLES.map((t) => (
                        <Button
                          key={t.key}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateDownload(t.key)}
                          className="gap-1 text-xs"
                        >
                          <FileDown className="h-3 w-3" />
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview */}
            {showPreview && parsedData && parsedData.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4" />
                    डेटा पूर्वावलोकन ({parsedData.length} रेकॉर्ड)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          {previewColumns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap text-xs">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 50).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            {previewColumns.map((col) => (
                              <TableCell key={col} className="text-xs max-w-[200px] truncate">
                                {row[col] || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parsedData.length > 50 && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        आणखी {parsedData.length - 50} रेकॉर्ड आहेत...
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Instructions Card */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">सूचना:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>आयात करण्यापूर्वी टेम्पलेट डाउनलोड करा आणि त्यात डेटा भरा.</li>
                      <li>CSV फाईलची पहिली ओळ हेडर (फील्ड नावे) असावी.</li>
                      <li>आवश्यक फील्ड रिक्त असल्यास रेकॉर्ड आयात होणार नाही.</li>
                      <li>डुप्लिकेट क्रमांक असल्यास त्रुटी दिसेल.</li>
                      <li>
                        मालमत्ता आयात करताना wardNumber आणि roadNumber फील्ड वापरा
                        (id नाही).
                      </li>
                      <li>बुलियन फील्डसाठी true/false, 1/0, किंवा होय/नाही वापरा.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Status Summary - shown when there's an import result */}
      {importResult && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <span className="font-medium">आयात पूर्ण:</span>{' '}
                {importResult.successCount} यशस्वी
                {importResult.errorCount > 0 && (
                  <span className="text-red-600">
                    , {importResult.errorCount} त्रुटी
                  </span>
                )}
                {' '}/ एकूण {importResult.totalRows} रेकॉर्ड
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
