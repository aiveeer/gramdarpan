'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Building2,
  User,
  MapPin,
  X,
  Eye,
  Pencil,
  Phone,
  CreditCard,
  Accessibility,
  Home,
  Layers,
  Ruler,
  Calendar,
  Users,
  ArrowRight,
  SearchX,
  Loader2,
} from 'lucide-react';

// ===== TYPE DEFINITIONS =====

interface WardInfo {
  wardNumber: string;
  wardName: string;
  wardNameMr: string;
}

interface RoadInfo {
  roadNumber: string;
  roadName: string;
  roadNameMr: string;
}

interface OwnerInfo {
  id: string;
  ownerNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  firstNameMr: string;
  middleNameMr: string | null;
  lastNameMr: string | null;
  ownershipType: string;
}

interface TaxDetail {
  name: string;
  nameMarathi: string;
  rate: number;
}

interface PropertyResult {
  id: string;
  propertyNumber: string;
  citySurveyNo: string | null;
  area: number | null;
  builtUpArea: number | null;
  usageType: string | null;
  constructionType: string | null;
  floorInfo: string | null;
  yearBuilt: string | null;
  propertyStatus: string;
  ward: WardInfo | null;
  road: RoadInfo | null;
  owner: OwnerInfo | null;
  totalTaxRate: number;
  taxDetails: TaxDetail[];
  ownersCount: number;
}

interface LinkedProperty {
  propertyNumber: string;
  ownershipType: string;
  usageType: string | null;
  area: number | null;
  ward: { wardNumber: string; wardNameMr: string } | null;
}

interface OwnerResult {
  id: string;
  ownerNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  firstNameMr: string;
  middleNameMr: string | null;
  lastNameMr: string | null;
  fullName: string;
  fullNameMr: string;
  mobileNumber: string | null;
  aadhaarNumber: string | null;
  isDisabled: boolean;
  disabilityType: string | null;
  disabilityPercentage: number | null;
  linkedProperties: LinkedProperty[];
  linkedPropertiesCount: number;
}

interface WardProperty {
  propertyNumber: string;
  usageType: string | null;
  area: number | null;
  propertyStatus: string;
}

interface WardResult {
  id: string;
  wardNumber: string;
  wardName: string;
  wardNameMr: string;
  population: number | null;
  area: number | null;
  description: string | null;
  propertiesCount: number;
  properties: WardProperty[];
}

interface SearchResults {
  properties: PropertyResult[];
  owners: OwnerResult[];
  wards: WardResult[];
  totalResults: number;
}

// ===== SKELETON COMPONENTS =====

function PropertySkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OwnerSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== PROPERTY RESULT CARD =====

function PropertyResultCard({ property }: { property: PropertyResult }) {
  const ownerName = property.owner
    ? `${property.owner.firstNameMr || property.owner.firstName} ${property.owner.middleNameMr || property.owner.middleName || ''} ${property.owner.lastNameMr || property.owner.lastName}`.replace(/\s+/g, ' ').trim()
    : '-';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{property.propertyNumber}</h3>
              <Badge variant={property.propertyStatus === 'Active' ? 'default' : 'secondary'}>
                {property.propertyStatus === 'Active' ? 'सक्रिय' : property.propertyStatus}
              </Badge>
              {property.ownersCount > 1 && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {property.ownersCount} मालक
                </Badge>
              )}
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {property.owner && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>{ownerName}</span>
                  {property.owner.ownershipType && (
                    <Badge variant="outline" className="text-xs ml-1">{property.owner.ownershipType}</Badge>
                  )}
                </div>
              )}
              {property.ward && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>वार्ड {property.ward.wardNumber} - {property.ward.wardNameMr || property.ward.wardName}</span>
                </div>
              )}
              {property.road && (
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  <span>रस्ता: {property.road.roadNameMr || property.road.roadName}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {property.usageType && (
                <Badge variant="outline" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  {property.usageType}
                </Badge>
              )}
              {property.constructionType && (
                <Badge variant="outline" className="text-xs">
                  <Home className="h-3 w-3 mr-1" />
                  {property.constructionType}
                </Badge>
              )}
              {property.area && (
                <Badge variant="outline" className="text-xs">
                  <Ruler className="h-3 w-3 mr-1" />
                  {property.area} चौ.फूट
                </Badge>
              )}
              {property.builtUpArea && (
                <Badge variant="outline" className="text-xs">
                  बांधलेले: {property.builtUpArea} चौ.फूट
                </Badge>
              )}
              {property.citySurveyNo && (
                <Badge variant="outline" className="text-xs">
                  सर्वे क्र. {property.citySurveyNo}
                </Badge>
              )}
            </div>

            {property.taxDetails.length > 0 && (
              <div className="mt-2">
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">एकूण कर दर</span>
                  <span className="font-semibold text-sm text-primary">₹{property.totalTaxRate.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {property.taxDetails.map((tax, i) => (
                    <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {tax.nameMarathi}: ₹{tax.rate}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Eye className="h-3 w-3 mr-1" /> सविस्तर
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Pencil className="h-3 w-3 mr-1" /> संपादा
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== OWNER RESULT CARD =====

function OwnerResultCard({ owner }: { owner: OwnerResult }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{owner.fullNameMr || owner.fullName}</h3>
              {owner.fullNameMr && owner.fullName && owner.fullNameMr !== owner.fullName && (
                <span className="text-sm text-muted-foreground">({owner.fullName})</span>
              )}
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">मालक क्र.</span>
                <Badge variant="outline" className="text-xs">{owner.ownerNumber}</Badge>
              </div>
              {owner.mobileNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{owner.mobileNumber}</span>
                </div>
              )}
              {owner.aadhaarNumber && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span>आधार: ****{owner.aadhaarNumber.slice(-4)}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {owner.linkedPropertiesCount} मालमत्ता
              </Badge>
              {owner.isDisabled && (
                <Badge variant="destructive" className="text-xs">
                  <Accessibility className="h-3 w-3 mr-1" />
                  अपंग{owner.disabilityType ? ` - ${owner.disabilityType}` : ''}
                  {owner.disabilityPercentage ? ` (${owner.disabilityPercentage}%)` : ''}
                </Badge>
              )}
            </div>

            {owner.linkedProperties.length > 0 && (
              <div className="mt-2">
                <Separator className="my-2" />
                <p className="text-xs font-medium mb-1">जोडलेल्या मालमत्ता:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {owner.linkedProperties.map((lp, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{lp.propertyNumber}</span>
                      {lp.usageType && <Badge variant="outline" className="text-xs h-4">{lp.usageType}</Badge>}
                      {lp.ownershipType && <Badge variant="outline" className="text-xs h-4">{lp.ownershipType}</Badge>}
                      {lp.ward && <span className="text-muted-foreground">वार्ड {lp.ward.wardNumber}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Eye className="h-3 w-3 mr-1" /> सविस्तर
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Pencil className="h-3 w-3 mr-1" /> संपादा
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== WARD RESULT CARD =====

function WardResultCard({ ward }: { ward: WardResult }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">वार्ड {ward.wardNumber}</h3>
              <span className="text-sm text-muted-foreground">{ward.wardNameMr || ward.wardName}</span>
            </div>

            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {ward.population !== null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>लोकसंख्या: {ward.population}</span>
                </div>
              )}
              {ward.area !== null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5 shrink-0" />
                  <span>क्षेत्रफळ: {ward.area} चौ.मी.</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>मालमत्ता: {ward.propertiesCount}</span>
              </div>
            </div>

            {ward.description && (
              <p className="mt-1 text-xs text-muted-foreground">{ward.description}</p>
            )}

            {ward.properties.length > 0 && (
              <div className="mt-2">
                <Separator className="my-2" />
                <p className="text-xs font-medium mb-1">या वार्डातील मालमत्ता ({ward.propertiesCount} पैकी):</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {ward.properties.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{p.propertyNumber}</span>
                      {p.usageType && <Badge variant="outline" className="text-xs h-4">{p.usageType}</Badge>}
                      {p.area && <span className="text-muted-foreground">{p.area} चौ.फूट</span>}
                    </div>
                  ))}
                  {ward.propertiesCount > ward.properties.length && (
                    <p className="text-xs text-muted-foreground italic">
                      + {ward.propertiesCount - ward.properties.length} आणखी मालमत्ता...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Eye className="h-3 w-3 mr-1" /> सविस्तर
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Pencil className="h-3 w-3 mr-1" /> संपादा
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== EMPTY STATE =====

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {hasQuery ? (
          <SearchX className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Search className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {hasQuery ? 'कोणतेही परिणाम सापडले नाहीत' : 'शोधा'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasQuery
          ? 'कृपया वेगळ्या शब्दांसह शोधा किंवा श्रेणी बदला'
          : 'मालमत्ता क्रमांक, मालकाचे नाव किंवा वार्ड क्रमांक शोधण्यासाठी वरील शोध बॉक्स वापरा'}
      </p>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (q: string, cat: string) => {
    if (!q.trim()) {
      setResults(null);
      setHasSearched(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ q: q.trim(), category: cat });
      const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast({
        title: 'शोध त्रुटी',
        description: 'शोधण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        performSearch(value, category);
      }, 300);
    },
    [category, performSearch]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value);
      if (query.trim()) {
        performSearch(query, value);
      }
    },
    [query, performSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults(null);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Quick stats
  const propertyCount = results?.properties.length ?? 0;
  const ownerCount = results?.owners.length ?? 0;
  const wardCount = results?.wards.length ?? 0;
  const totalResults = results?.totalResults ?? 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-10 pr-10 h-12 text-base"
              placeholder="मालमत्ता क्रमांक, मालकाचे नाव, वार्ड क्रमांक शोधा..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="mt-3">
            <Tabs value={category} onValueChange={handleCategoryChange}>
              <TabsList className="w-full grid grid-cols-4 h-auto">
                <TabsTrigger value="all" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                  <Search className="h-3.5 w-3.5" />
                  <span>सर्व</span>
                </TabsTrigger>
                <TabsTrigger value="property" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>मालमत्ता</span>
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5" />
                  <span>मालक</span>
                </TabsTrigger>
                <TabsTrigger value="ward" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>वार्ड</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {hasSearched && !loading && results && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">
            एकूण परिणाम: <span className="text-primary">{totalResults}</span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          {category === 'all' && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" /> {propertyCount} मालमत्ता
              </Badge>
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" /> {ownerCount} मालक
              </Badge>
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" /> {wardCount} वार्ड
              </Badge>
            </div>
          )}
          {category === 'property' && (
            <Badge variant="outline" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" /> {propertyCount} मालमत्ता सापडल्या
            </Badge>
          )}
          {category === 'owner' && (
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" /> {ownerCount} मालक सापडले
            </Badge>
          )}
          {category === 'ward' && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" /> {wardCount} वार्ड सापडले
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {(category === 'all' || category === 'property') && (
            <div>
              {category === 'all' && <h3 className="text-sm font-semibold text-muted-foreground mb-2">मालमत्ता</h3>}
              <PropertySkeleton />
              <PropertySkeleton />
            </div>
          )}
          {(category === 'all' || category === 'owner') && (
            <div>
              {category === 'all' && <h3 className="text-sm font-semibold text-muted-foreground mb-2">मालक</h3>}
              <OwnerSkeleton />
              <OwnerSkeleton />
            </div>
          )}
          {(category === 'all' || category === 'ward') && (
            <div>
              {category === 'all' && <h3 className="text-sm font-semibold text-muted-foreground mb-2">वार्ड</h3>}
              <WardSkeleton />
              <WardSkeleton />
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && results && (
        <div className="space-y-4">
          {totalResults === 0 ? (
            <EmptyState hasQuery />
          ) : (
            <>
              {/* Properties Section */}
              {(category === 'all' || category === 'property') && propertyCount > 0 && (
                <div>
                  {category === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">मालमत्ता ({propertyCount})</h3>
                    </div>
                  )}
                  <div className="space-y-3">
                    {results.properties.map((p) => (
                      <PropertyResultCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Owners Section */}
              {(category === 'all' || category === 'owner') && ownerCount > 0 && (
                <div>
                  {category === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">मालक ({ownerCount})</h3>
                    </div>
                  )}
                  <div className="space-y-3">
                    {results.owners.map((o) => (
                      <OwnerResultCard key={o.id} owner={o} />
                    ))}
                  </div>
                </div>
              )}

              {/* Wards Section */}
              {(category === 'all' || category === 'ward') && wardCount > 0 && (
                <div>
                  {category === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">वार्ड ({wardCount})</h3>
                    </div>
                  )}
                  <div className="space-y-3">
                    {results.wards.map((w) => (
                      <WardResultCard key={w.id} ward={w} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Initial State (no search yet) */}
      {!hasSearched && (
        <EmptyState hasQuery={false} />
      )}
    </div>
  );
}
