import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { MaterialsBoM } from '@/api/entities';
import { Material } from '@/api/entities';
import { InsuranceCode } from '@/api/entities'; // To get descriptions for procedure_code
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FilterX, ListTree, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
// Placeholder for BoMDialog - to be created later
// import BoMDialog from './BoMDialog';

// Cache for BillOfMaterialsTab
const bomApiCache = {
  boms: { data: null, timestamp: null, loading: false, error: null },
  materials: { data: null, timestamp: null, loading: false, error: null },
  insuranceCodes: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = bomApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < bomApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (bomApiCache[cacheKey]) {
    bomApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (bomApiCache[cacheKey]) {
    bomApiCache[cacheKey].loading = isLoading;
    if (isLoading) bomApiCache[cacheKey].error = null;
  }
};

const bomStatusOptions = [
  { value: 'all', labelKey: 'filters.allStatuses', defaultValue: 'All Statuses' },
  { value: 'draft', labelKey: 'status.draft', defaultValue: 'Draft' },
  { value: 'active', labelKey: 'status.active', defaultValue: 'Active' },
  { value: 'deprecated', labelKey: 'status.deprecated', defaultValue: 'Deprecated' },
];

export default function BillOfMaterialsTab() {
  const { t, language } = useLanguageHook();
  const [bomsData, setBomsData] = useState([]);
  const [materialsData, setMaterialsData] = useState([]);
  const [insuranceCodesData, setInsuranceCodesData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const [filters, setFilters] = useState({
    searchTerm: '', // Will search procedure_code, version, notes
    status: 'all',
    // provider_id: 'all' // Add if provider data becomes available for filtering
  });

  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [currentBom, setCurrentBom] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const fetchWithCache = async (cacheKey, apiCall, entityName) => {
      if (!forceRefresh && isCacheValid(cacheKey) && bomApiCache[cacheKey].data) {
        return bomApiCache[cacheKey].data;
      }
      if (bomApiCache[cacheKey].loading && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return bomApiCache[cacheKey].data || [];
      }
      
      setCacheLoading(cacheKey, true);
      try {
        const data = await apiCall();
        const validData = Array.isArray(data) ? data : [];
        updateCache(cacheKey, validData);
        return validData;
      } catch (err) {
        console.error(`Error fetching ${entityName}:`, err);
        updateCache(cacheKey, bomApiCache[cacheKey].data || [], err.message);
        throw err;
      } finally {
        setCacheLoading(cacheKey, false);
      }
    };

    setLoading(true);
    setError(null);
    let attemptError = null;

    try {
      const [fetchedBoms, fetchedMaterials, fetchedInsuranceCodes] = await Promise.allSettled([
        fetchWithCache('boms', () => MaterialsBoM.list('-updated_date'), 'BoMs'),
        fetchWithCache('materials', () => Material.list(), 'Materials'),
        fetchWithCache('insuranceCodes', () => InsuranceCode.list(), 'Insurance Codes')
      ]);

      if (fetchedBoms.status === 'fulfilled') setBomsData(fetchedBoms.value);
      else attemptError = fetchedBoms.reason;

      if (fetchedMaterials.status === 'fulfilled') setMaterialsData(fetchedMaterials.value);
      // Non-critical, BoMs can still display without full material details if this fails

      if (fetchedInsuranceCodes.status === 'fulfilled') setInsuranceCodesData(fetchedInsuranceCodes.value);
      // Non-critical for procedure code descriptions

      if (attemptError) throw attemptError; // Prioritize BoM fetching error

      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching BoM tab data:', err);
      let errorMessage = t('errors.fetchFailedGeneral', { defaultValue: 'Failed to load Bill of Materials. Please try again.' });
      if (err.response?.status === 429 || err.message?.includes('429')) {
        errorMessage = t('errors.rateLimitExceededShort', { defaultValue: 'Too many requests. Please wait and try refreshing.' });
        setRetryCount(prev => prev + 1);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, fetchData]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({ searchTerm: '', status: 'all' });
  };

  const getProcedureCodeName = useCallback((procedureCodeValue) => {
    if (!procedureCodeValue || !insuranceCodesData.length) return procedureCodeValue; // Fallback to code itself
    const insCode = insuranceCodesData.find(ic => ic.code === procedureCodeValue);
    return insCode ? (language === 'he' && insCode.name_he ? insCode.name_he : insCode.name_en) : procedureCodeValue;
  }, [insuranceCodesData, language]);

  const getMaterialName = useCallback((materialId) => {
    if (!materialId || !materialsData.length) return t('common.unknownMaterial', { defaultValue: 'Unknown Material' });
    const mat = materialsData.find(m => m.id === materialId);
    return mat ? (language === 'he' && mat.name_he ? mat.name_he : mat.name_en) : t('common.unknownMaterial', { defaultValue: 'Unknown Material' });
  }, [materialsData, language, t]);

  const filteredBoms = bomsData.filter(bom => {
    const searchLower = filters.searchTerm.toLowerCase();
    const matchesSearch = !filters.searchTerm ||
      (bom.procedure_code && bom.procedure_code.toLowerCase().includes(searchLower)) ||
      (getProcedureCodeName(bom.procedure_code)?.toLowerCase().includes(searchLower)) ||
      (bom.version && bom.version.toLowerCase().includes(searchLower)) ||
      (bom.notes && bom.notes.toLowerCase().includes(searchLower));
    
    const matchesStatus = filters.status === 'all' || bom.status === filters.status;
    // Add provider filter if needed later

    return matchesSearch && matchesStatus;
  });

  const renderStatusBadge = (status) => {
    let variant = "secondary";
    if (status === 'active') variant = "success";
    else if (status === 'draft') variant = "outline"; // Or some other distinct variant
    
    return <Badge variant={variant} className="text-xs">{t(`status.${status}`, { defaultValue: status })}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('boms.filtersTitle', { defaultValue: 'Filter Bill of Materials' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              placeholder={t('search.placeholderBoMs', { defaultValue: 'Search by procedure, version, notes...' })}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full"
            />
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectStatus', {defaultValue: "Select Status"})} /></SelectTrigger>
              <SelectContent>
                {bomStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetFilters} className="text-sm">
              <FilterX className="h-4 w-4 mr-2" />
              {t('buttons.resetFilters', {defaultValue: "Reset Filters"})}
            </Button>
             <Button onClick={() => fetchData(true)} variant="outline" className="text-sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('buttons.refresh', {defaultValue: "Refresh"})}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-500 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('boms.listTitle', {defaultValue: "Bill of Materials List"})} ({filteredBoms.length})</h2>
        <Button onClick={() => alert(t('common.featureComingSoon', {defaultValue: 'Add new BoM feature coming soon!'}))} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('boms.addBoM', {defaultValue: "Add BoM"})}
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      
      {!loading && filteredBoms.length === 0 && (
        <EmptyState
          icon={ListTree}
          title={t('boms.noBoMsMatchFilters', { defaultValue: 'No BoMs Match Your Filters' })}
          description={t('boms.tryAdjustingFilters', { defaultValue: 'Try adjusting your search terms or filter selections, or add a new Bill of Materials.' })}
        />
      )}

      {!loading && filteredBoms.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBoms.map(bom => (
            <Card key={bom.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">
                            {t('boms.procedure', { defaultValue: 'Procedure' })}: {bom.procedure_code}
                        </CardTitle>
                        <CardDescription className="text-xs">{getProcedureCodeName(bom.procedure_code)}</CardDescription>
                    </div>
                    {renderStatusBadge(bom.status)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('boms.version', { defaultValue: 'Version' })}: {bom.version}
                    {bom.effective_date && ` | ${t('boms.effective', {defaultValue: 'Effective'})}: ${format(new Date(bom.effective_date), 'dd/MM/yyyy')}`}
                    {bom.expiry_date && ` | ${t('boms.expires', {defaultValue: 'Expires'})}: ${format(new Date(bom.expiry_date), 'dd/MM/yyyy')}`}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">{t('boms.materialsList', {defaultValue: 'Materials'})} ({bom.materials?.length || 0}):</h4>
                  {(bom.materials && bom.materials.length > 0) ? (
                    <ul className="list-disc list-inside text-xs space-y-1 max-h-40 overflow-y-auto pr-2">
                      {bom.materials.map((item, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span>
                            {getMaterialName(item.material_id)}: {item.quantity}
                            {!item.is_mandatory && <Badge variant="outline" className="ml-1 text-xxs">{t('boms.optional', {defaultValue: 'Optional'})}</Badge>}
                          </span>
                          {Array.isArray(item.alternatives) && item.alternatives.length > 0 && (
                            <Badge variant="info" className="ml-1 text-xxs">{t('boms.alternatives', {defaultValue: 'Alts'})}: {item.alternatives.length}</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">{t('boms.noMaterialsListed', {defaultValue: 'No materials listed for this BoM.'})}</p>
                  )}
                </div>
                {bom.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">{t('common.notes', {defaultValue: 'Notes'})}:</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={bom.notes}>{bom.notes}</p>
                  </div>
                )}
              </CardContent>
              {/* Add CardFooter for actions like Edit/View Details later if needed */}
            </Card>
          ))}
        </div>
      )}
      {/* 
      {isDialogOpen && (
        <BoMDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          currentBom={currentBom}
          onSave={handleSaveBom} // To be implemented
          materialsData={materialsData} // Pass for selection
          insuranceCodesData={insuranceCodesData} // Pass for procedure code selection
          // ... other necessary props
        />
      )}
      */}
    </div>
  );
}