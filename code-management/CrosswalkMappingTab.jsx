
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Crosswalk } from '@/api/entities';
import { MedicalCode } from '@/api/entities';
import { InternalCode } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FilterX, AlertTriangle, RefreshCw, GitMerge } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Placeholder for CrosswalkDialog - to be created later
// import CrosswalkDialog from './CrosswalkDialog';

// Cache for CrosswalkMappingTab
const crosswalkApiCache = {
  crosswalks: { data: null, timestamp: null, loading: false, error: null },
  medicalCodes: { data: null, timestamp: null, loading: false, error: null },
  internalCodes: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = crosswalkApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < crosswalkApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (crosswalkApiCache[cacheKey]) {
    crosswalkApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (crosswalkApiCache[cacheKey]) {
    crosswalkApiCache[cacheKey].loading = isLoading;
    if (isLoading) crosswalkApiCache[cacheKey].error = null;
  }
};

const codeTypeOptions = [
    { value: 'all', labelKey: 'filters.allCodeTypes', defaultValue: 'All Code Types' },
    { value: 'ICD9', label: 'ICD-9' },
    { value: 'ICD10', label: 'ICD-10' },
    { value: 'CPT', label: 'CPT' },
    { value: 'HCPCS', label: 'HCPCS' },
    { value: 'Internal', label: 'Internal' },
];

const mappingTypeOptions = [
    { value: 'all', labelKey: 'filters.allMappingTypes', defaultValue: 'All Mapping Types' },
    { value: 'Single', label: 'Single' },
    { value: 'Alternative', label: 'Alternative' },
    { value: 'Combination', label: 'Combination' },
    { value: 'No Map', label: 'No Map' },
];

const accuracyOptions = [
    { value: 'all', labelKey: 'filters.allAccuracies', defaultValue: 'All Accuracies' },
    { value: 'Exact', label: 'Exact' },
    { value: 'Approximate', label: 'Approximate' },
    { value: 'Partial', label: 'Partial' },
];

export default function CrosswalkMappingTab() {
  const { t, language } = useLanguageHook();
  const [crosswalksData, setCrosswalksData] = useState([]);
  const [medicalCodesData, setMedicalCodesData] = useState([]);
  const [internalCodesData, setInternalCodesData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [filters, setFilters] = useState({
    searchTerm: '',
    anchorType: 'all',
    targetType: 'all',
    mappingType: 'all',
    accuracy: 'all',
    isActive: 'all',
  });

  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [currentMapping, setCurrentMapping] = useState(null);
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    const fetchWithCache = async (cacheKey, apiCall) => {
      if (!forceRefresh && isCacheValid(cacheKey) && crosswalkApiCache[cacheKey].data) {
        return crosswalkApiCache[cacheKey].data;
      }
      if (crosswalkApiCache[cacheKey].loading && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300)); 
        return crosswalkApiCache[cacheKey].data || [];
      }
      
      setCacheLoading(cacheKey, true);
      try {
        const data = await apiCall();
        const validData = Array.isArray(data) ? data : [];
        updateCache(cacheKey, validData);
        return validData;
      } catch (err) {
        console.error(`Error fetching ${cacheKey}:`, err);
        updateCache(cacheKey, crosswalkApiCache[cacheKey].data || [], err.message);
        throw err; 
      } finally {
        setCacheLoading(cacheKey, false);
      }
    };

    setLoading(true);
    setError(null);
    let attemptError = null;

    try {
      const [fetchedCrosswalks, fetchedMedicalCodes, fetchedInternalCodes] = await Promise.allSettled([
        fetchWithCache('crosswalks', () => Crosswalk.list('-updated_date')),
        fetchWithCache('medicalCodes', () => MedicalCode.list()),
        fetchWithCache('internalCodes', () => InternalCode.list())
      ]);

      if (fetchedCrosswalks.status === 'fulfilled') setCrosswalksData(fetchedCrosswalks.value);
      else attemptError = fetchedCrosswalks.reason;

      if (fetchedMedicalCodes.status === 'fulfilled') setMedicalCodesData(fetchedMedicalCodes.value);

      if (fetchedInternalCodes.status === 'fulfilled') setInternalCodesData(fetchedInternalCodes.value);
      
      if (attemptError) throw attemptError;

      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching crosswalk data:', err);
      let errorMessage = t('errors.fetchFailedGeneral', { defaultValue: 'Failed to load crosswalk mappings. Please try again.' });
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
    setFilters({ searchTerm: '', anchorType: 'all', targetType: 'all', mappingType: 'all', accuracy: 'all', isActive: 'all' });
  };

  const getCodeDescription = useCallback((codeValue, codeType) => {
    if (!codeValue || !codeType) return t('common.notAvailableShort', { defaultValue: "N/A" });
    let foundCode;
    if (codeType === 'Internal') {
      foundCode = internalCodesData.find(c => c.code_number === codeValue);
    } else {
      // More robust check for medical codes considering different systems (e.g. ICD10-CM, ICD10-PCS)
      foundCode = medicalCodesData.find(c => c.code === codeValue && c.code_system && c.code_system.toUpperCase().startsWith(codeType.toUpperCase()));
    }
    if (!foundCode) return `${codeValue} (${t('common.descriptionUnavailable', { defaultValue: "Desc. N/A"})})`;
    
    return language === 'he' && foundCode.description_he ? foundCode.description_he : (foundCode.description_en || codeValue);
  }, [internalCodesData, medicalCodesData, language, t]);

  const filteredCrosswalks = crosswalksData.filter(cw => {
    const searchLower = filters.searchTerm.toLowerCase();
    // Ensure target_codes exists and is an array before trying to map for description search
    const targetCodesForSearch = (Array.isArray(cw.target_codes) ? cw.target_codes : []);
    const anchorDesc = getCodeDescription(cw.anchor_code, cw.anchor_type).toLowerCase();
    const targetDescs = targetCodesForSearch.map(tc => getCodeDescription(tc, cw.target_code_type).toLowerCase()).join(' ');

    const matchesSearch = !filters.searchTerm ||
      (cw.anchor_code && cw.anchor_code.toLowerCase().includes(searchLower)) ||
      targetCodesForSearch.some(tc => tc && tc.toLowerCase().includes(searchLower)) ||
      anchorDesc.includes(searchLower) ||
      targetDescs.includes(searchLower) ||
      (cw.combination_scenario && cw.combination_scenario.toLowerCase().includes(searchLower)) ||
      (cw.mapping_option && cw.mapping_option.toLowerCase().includes(searchLower));

    const matchesAnchorType = filters.anchorType === 'all' || cw.anchor_type === filters.anchorType;
    const matchesTargetType = filters.targetType === 'all' || cw.target_code_type === filters.targetType;
    const matchesMappingType = filters.mappingType === 'all' || cw.mapping_type === filters.mappingType;
    const matchesAccuracy = filters.accuracy === 'all' || cw.accuracy === filters.accuracy;
    const matchesActive = filters.isActive === 'all' || String(cw.is_active) === filters.isActive;

    return matchesSearch && matchesAnchorType && matchesTargetType && matchesMappingType && matchesAccuracy && matchesActive;
  });
  
  const statusOptions = [ 
    { value: 'all', labelKey: 'filters.allStatuses', defaultValue: 'All Statuses' },
    { value: 'true', labelKey: 'status.active', defaultValue: 'Active' },
    { value: 'false', labelKey: 'status.inactive', defaultValue: 'Inactive' },
  ];

  const renderBadge = (value, type) => {
    let variant = "secondary";
    let text = value;

    if (type === "accuracy") {
        if (value === "Exact") variant = "success";
        else if (value === "Approximate") variant = "warning"; // Assuming you have a 'warning' variant
        else if (value === "Partial") variant = "destructive";
        text = t(`accuracy.${value?.toLowerCase()}`, { defaultValue: value });
    } else if (type === "status") {
        if (value === true || value === "true") variant = "success"; else variant = "outline";
        text = (value === true || value === "true") ? t('status.active', {defaultValue: "Active"}) : t('status.inactive', {defaultValue: "Inactive"});
    } else if (type === "mappingType"){
        text = t(`mappingType.${value?.replace(/\s+/g, '')}`, { defaultValue: value }); // e.g. mappingType.NoMap
    }
    return <Badge variant={variant} className="text-xs whitespace-nowrap">{text}</Badge>;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('crosswalkMapping.filtersTitle', {defaultValue: 'Filter Crosswalk Mappings'})}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              placeholder={t('search.placeholderGeneral', { defaultValue: 'Search codes, descriptions...' })}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
             <Select value={filters.anchorType} onValueChange={(value) => handleFilterChange('anchorType', value)}>
                <SelectTrigger><SelectValue placeholder={t('crosswalkMapping.anchorType', { defaultValue: 'Anchor Type' })} /></SelectTrigger>
                <SelectContent>
                    {codeTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label || t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.targetType} onValueChange={(value) => handleFilterChange('targetType', value)}>
                <SelectTrigger><SelectValue placeholder={t('crosswalkMapping.targetType', { defaultValue: 'Target Type' })} /></SelectTrigger>
                <SelectContent>
                    {codeTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label || t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.mappingType} onValueChange={(value) => handleFilterChange('mappingType', value)}>
                <SelectTrigger><SelectValue placeholder={t('crosswalkMapping.mappingType', { defaultValue: 'Mapping Type' })} /></SelectTrigger>
                <SelectContent>
                    {mappingTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label || t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.accuracy} onValueChange={(value) => handleFilterChange('accuracy', value)}>
                <SelectTrigger><SelectValue placeholder={t('crosswalkMapping.accuracy', { defaultValue: 'Accuracy' })} /></SelectTrigger>
                <SelectContent>
                    {accuracyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label || t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)}>
                <SelectTrigger><SelectValue placeholder={t('filters.selectActiveStatus', {defaultValue: "Select Active Status"})} /></SelectTrigger>
                <SelectContent>
                    {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
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
        <h2 className="text-xl font-semibold">{t('crosswalkMapping.listTitle', {defaultValue: "Crosswalk Mappings"})} ({filteredCrosswalks.length})</h2>
        <Button onClick={() => alert(t('common.featureComingSoon', {defaultValue: 'Add new crosswalk mapping feature coming soon!'}))} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('crosswalkMapping.addMapping', {defaultValue: "Add Mapping"})}
        </Button>
      </div>
      
      {loading && <LoadingSpinner />}

      {!loading && filteredCrosswalks.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('crosswalkMapping.noMappingsMatchFilters', { defaultValue: 'No Mappings Match Your Filters' })}
          description={t('crosswalkMapping.tryAdjustingFilters', { defaultValue: 'Try adjusting your search terms or filter selections, or add a new mapping.' })}
        />
      )}

      {!loading && filteredCrosswalks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCrosswalks.map(cw => (
            <Card key={cw.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                        {t('crosswalkMapping.anchor', { defaultValue: 'Anchor' })}: {cw.anchor_code} ({cw.anchor_type})
                    </CardTitle>
                    <div className="flex flex-col space-y-1 items-end">
                        {renderBadge(cw.mapping_type, "mappingType")}
                        {renderBadge(cw.accuracy, "accuracy")}
                        {renderBadge(cw.is_active, "status")}
                    </div>
                </div>
                <CardDescription className="text-xs truncate" title={getCodeDescription(cw.anchor_code, cw.anchor_type)}>
                  {getCodeDescription(cw.anchor_code, cw.anchor_type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div>
                    <p className="text-sm font-medium">{t('crosswalkMapping.targets', {defaultValue: 'Target(s)'})} ({cw.target_code_type}):</p>
                    <ul className="list-disc list-inside pl-1">
                        {/* MODIFIED PART: Added Array.isArray check for cw.target_codes */}
                        {cw.target_codes && Array.isArray(cw.target_codes) ? cw.target_codes.map((tc, index) => (
                            <li key={index} className="text-xs text-gray-600 dark:text-gray-300 truncate" title={getCodeDescription(tc, cw.target_code_type)}>
                                {tc} - {getCodeDescription(tc, cw.target_code_type)}
                            </li>
                        )) : (
                          <li className="text-xs text-gray-500">{t('common.noTargetCodes', {defaultValue: 'No target codes specified.'})}</li>
                        )}
                    </ul>
                </div>
                {cw.combination_scenario && (
                  <div>
                    <p className="text-sm font-medium">{t('crosswalkMapping.combinationScenario', {defaultValue: 'Combination Scenario'})}:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{cw.combination_scenario}</p>
                  </div>
                )}
                {cw.mapping_option && (
                  <div>
                    <p className="text-sm font-medium">{t('crosswalkMapping.mappingOption', {defaultValue: 'Mapping Option'})}:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{cw.mapping_option}</p>
                  </div>
                )}
              </CardContent>
              {/* CardFooter for actions */}
            </Card>
          ))}
        </div>
      )}
      {/* 
      {isDialogOpen && (
        <CrosswalkDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          currentMapping={currentMapping}
          onSave={handleSaveMapping}
          // ... other necessary props
        />
      )}
      */}
    </div>
  );
}
