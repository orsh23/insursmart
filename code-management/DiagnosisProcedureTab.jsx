
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { DiagnosisProcedureMapping } from '@/api/entities';
import { MedicalCode } from '@/api/entities'; // For looking up code descriptions
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Link2, Info, RefreshCw, FilterX, AlertTriangle, Pencil, ListFilter, ListChecks, FileWarning } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import DiagnosisProcedureDialog from './DiagnosisProcedureDialog';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Cache for DiagnosisProcedureTab
const diagnosisApiCache = {
  mappings: { data: null, timestamp: null, loading: false, error: null },
  medicalCodes: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 3 * 60 * 1000, // 3 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = diagnosisApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < diagnosisApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (diagnosisApiCache[cacheKey]) {
    diagnosisApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (diagnosisApiCache[cacheKey]) {
    diagnosisApiCache[cacheKey].loading = isLoading;
    if (isLoading) diagnosisApiCache[cacheKey].error = null;
  }
};

const mappingTypeFilterOptions = (t) => [
  { value: 'all', label: t('filters.allMappingTypes', { defaultValue: 'All Mapping Types' }) },
  { value: 'primary', label: t('mappingType.primary', { defaultValue: 'Primary' }) },
  { value: 'secondary', label: t('mappingType.secondary', { defaultValue: 'Secondary' }) },
  { value: 'conditional', label: t('mappingType.conditional', { defaultValue: 'Conditional' }) },
];

const booleanFilterOptions = (t, fieldName = 'active') => [
  { value: 'all', label: t(`filters.all${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`, { defaultValue: `All (${fieldName})` }) },
  { value: 'true', label: t(`filters.${fieldName}True`, { defaultValue: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: Yes` }) },
  { value: 'false', label: t(`filters.${fieldName}False`, { defaultValue: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: No` }) },
];

const sortOptionsConfig = (t, language) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'diagnosis_code', label: t('sortOptions.diagnosisCode', { defaultValue: 'Diagnosis Code' }) },
    { value: 'procedure_code', label: t('sortOptions.procedureCode', { defaultValue: 'Procedure Code' }) },
    { value: 'mapping_type', label: t('sortOptions.mappingType', { defaultValue: 'Mapping Type' }) },
    { value: 'is_active', label: t('sortOptions.status', { defaultValue: 'Status' }) },
    { value: 'notes', label: t('sortOptions.notes', { defaultValue: 'Notes' }) },
    { value: 'validity_rules_count', label: t('sortOptions.validityRulesCount', {defaultValue: 'Validity Rules (Count)'})},
];


export default function DiagnosisProcedureTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [mappingsData, setMappingsData] = useState([]);
  const [medicalCodes, setMedicalCodes] = useState([]); // For looking up descriptions
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [filters, setFilters] = useState({
    searchTerm: '', // For diagnosis/procedure codes, their descriptions, notes
    mappingType: 'all',
    isActive: 'all',
    diagnosisCode: '',    // New: Specific filter for diagnosis code
    procedureCode: '',    // New: Specific filter for procedure code
    validityRuleType: '', // New: Filter by validity rule type (text input)
    validityRuleValue: '',// New: Filter by validity rule value (text input)
  });
  const [sortBy, setSortBy] = useState('-updated_date'); // Default sort

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMapping, setCurrentMapping] = useState(null);

  const currentMappingTypeOptions = mappingTypeFilterOptions(t);
  const currentIsActiveOptions = booleanFilterOptions(t, 'active');
  const currentSortOptions = sortOptionsConfig(t, language);

  const getMedicalCodeDescription = useCallback((code) => {
    const found = medicalCodes.find(mc => mc.code === code);
    if (found) {
        return found[`description_${language}`] || found.description_en || code;
    }
    return code; // Fallback to code itself if not found
  }, [medicalCodes, language]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const fetchWithCache = async (cacheKey, apiCall, setDataCallback) => {
      if (!forceRefresh && isCacheValid(cacheKey) && diagnosisApiCache[cacheKey].data) {
         setDataCallback(diagnosisApiCache[cacheKey].data);
         return diagnosisApiCache[cacheKey].data;
      }
      if (diagnosisApiCache[cacheKey].loading && !forceRefresh) {
         await new Promise(resolve => setTimeout(resolve, 300));
         if(isCacheValid(cacheKey) && diagnosisApiCache[cacheKey].data) {
            setDataCallback(diagnosisApiCache[cacheKey].data);
            return diagnosisApiCache[cacheKey].data;
         }
      }
      
      setCacheLoading(cacheKey, true);
      try {
        const data = await apiCall();
        const validData = Array.isArray(data) ? data : [];
        setDataCallback(validData);
        updateCache(cacheKey, validData);
        return validData;
      } catch (err) {
        console.error(`Error fetching ${cacheKey}:`, err);
        updateCache(cacheKey, diagnosisApiCache[cacheKey].data || [], err.message);
        throw err;
      } finally {
        setCacheLoading(cacheKey, false);
      }
    };

    setLoading(true);
    setError(null);

    try {
      await Promise.allSettled([
        fetchWithCache('mappings', () => DiagnosisProcedureMapping.list(), setMappingsData),
        fetchWithCache('medicalCodes', () => MedicalCode.list(), setMedicalCodes) // For descriptions
      ]);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching diagnosis-procedure data:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { item: t('diagnosisProcedure.entityNamePlural', {defaultValue: "Diagnosis-Procedure Mappings"}), defaultValue: 'Failed to load mappings.' });
      if (err.response?.status === 429 || err.message?.includes('429')) {
        errorMessage = t('errors.rateLimitExceededShort', { defaultValue: 'Too many requests. Please wait and try refreshing.' });
        if (retryCount < 3) setRetryCount(prev => prev + 1);
      }
      setError(errorMessage);
      if(!diagnosisApiCache.mappings.data) updateCache('mappings', [], errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t, retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && error && error.includes('Too many requests')) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, fetchData, error]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      mappingType: 'all',
      isActive: 'all',
      diagnosisCode: '',
      procedureCode: '',
      validityRuleType: '',
      validityRuleValue: '',
    });
    setSortBy('-updated_date');
  };

  const filteredAndSortedMappings = mappingsData
    .filter(m => {
      const searchLower = filters.searchTerm.toLowerCase();
      const diagCodeLower = filters.diagnosisCode.toLowerCase();
      const procCodeLower = filters.procedureCode.toLowerCase();
      const ruleTypeLower = filters.validityRuleType.toLowerCase();
      const ruleValueLower = filters.validityRuleValue.toLowerCase();

      const matchesSearchTerm = !filters.searchTerm ||
        (m.diagnosis_code && m.diagnosis_code.toLowerCase().includes(searchLower)) ||
        (m.procedure_code && m.procedure_code.toLowerCase().includes(searchLower)) ||
        (getMedicalCodeDescription(m.diagnosis_code).toLowerCase().includes(searchLower)) ||
        (getMedicalCodeDescription(m.procedure_code).toLowerCase().includes(searchLower)) ||
        (m.notes && m.notes.toLowerCase().includes(searchLower));

      const matchesMappingType = filters.mappingType === 'all' || m.mapping_type === filters.mappingType;
      const matchesIsActive = filters.isActive === 'all' || String(m.is_active) === filters.isActive;
      
      const matchesDiagnosisCode = !filters.diagnosisCode || (m.diagnosis_code && m.diagnosis_code.toLowerCase().includes(diagCodeLower));
      const matchesProcedureCode = !filters.procedureCode || (m.procedure_code && m.procedure_code.toLowerCase().includes(procCodeLower));
      
      const matchesValidityRule = (!filters.validityRuleType && !filters.validityRuleValue) ||
        (Array.isArray(m.validity_rules) && m.validity_rules.some(rule => 
            (!filters.validityRuleType || (rule.rule_type && rule.rule_type.toLowerCase().includes(ruleTypeLower))) &&
            (!filters.validityRuleValue || (rule.rule_value && rule.rule_value.toLowerCase().includes(ruleValueLower)))
        ));

      return matchesSearchTerm && matchesMappingType && matchesIsActive && matchesDiagnosisCode && matchesProcedureCode && matchesValidityRule;
    })
    .sort((a, b) => {
        const field = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
        const reverse = sortBy.startsWith('-');
        
        let valA = a[field];
        let valB = b[field];

        if (field === 'updated_date') {
            valA = a.updated_date ? parseISO(a.updated_date) : new Date(0);
            valB = b.updated_date ? parseISO(b.updated_date) : new Date(0);
            if (!isValid(valA)) valA = new Date(0);
            if (!isValid(valB)) valB = new Date(0);
        } else if (field === 'validity_rules_count') {
            valA = Array.isArray(a.validity_rules) ? a.validity_rules.length : 0;
            valB = Array.isArray(b.validity_rules) ? b.validity_rules.length : 0;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') { // For is_active
            valA = valA ? 1 : 0;
            valB = valB ? 1 : 0;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
            valA = (valA || '').toLowerCase(); // Handle null/undefined strings
            valB = (valB || '').toLowerCase();
        } else if (valA === null || valA === undefined) { // Handle nulls to sort them consistently
            valA = reverse ? 'zzzzzzzz' : ''; 
            valB = reverse ? 'zzzzzzzz' : '';
        }
        
        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
        
        return reverse ? comparison * -1 : comparison;
    });


  const renderStatusBadge = (status) => {
    const text = status ? t('status.activeShort', {defaultValue:"Active"}) : t('status.inactiveShort', {defaultValue:"Inactive"});
    const variant = status ? 'success' : 'outline';
    return <Badge variant={variant} className="text-xs whitespace-nowrap">{text}</Badge>;
  };
  
  const getMappingTypeDisplay = (type) => {
    const option = mappingTypeFilterOptions(t).find(opt => opt.value === type);
    // Fallback to type if not found in options, or use a generic label
    return option ? (option.labelKey ? t(option.labelKey, { defaultValue: option.defaultValue }) : option.label) : (type || t('common.notSet', {defaultValue: 'N/A'}));
  };

  const openDialog = (mapping = null) => {
    setCurrentMapping(mapping);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (refreshNeeded, actionType = null, entityName = '') => {
    setIsDialogOpen(false);
    setCurrentMapping(null);
    if (refreshNeeded) {
      fetchData(true);
      if (actionType && entityName) {
        const messageKey = actionType === 'create' ? 'toasts.createdSuccess' : 'toasts.updatedSuccess';
        const defaultMessage = actionType === 'create' ? `${entityName} created successfully.` : `${entityName} updated successfully.`;
        toast({
          title: t('toasts.successTitle', {defaultValue: "Success"}),
          description: t(messageKey, { item: entityName, defaultValue: defaultMessage }),
          variant: 'success',
        });
      }
    }
  };

  const showInitialLoading = loading && mappingsData.length === 0 && !isCacheValid('mappings');
  const showUpdateLoading = loading && mappingsData.length > 0;
  const showErrorState = error && mappingsData.length === 0 && !loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {t('diagnosisProcedure.listTitle', { defaultValue: "Diagnosis-Procedure Mappings" })}{' '}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({showInitialLoading ? t('common.loadingEllipsis', {defaultValue: "..."}) : filteredAndSortedMappings.length})
                </span>
            </h2>
        </div>
        <Button onClick={() => openDialog()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('diagnosisProcedure.addMapping', { defaultValue: "Add Mapping" })}
        </Button>
      </div>

      <Card className="dark:bg-gray-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-200">{t('filters.filterAndSortDP', { defaultValue: 'Filter & Sort D-P Mappings' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Input
                    placeholder={t('search.placeholderDP', { defaultValue: 'Search codes, descriptions, notes...' })}
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                <Select value={filters.mappingType} onValueChange={(value) => handleFilterChange('mappingType', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectMappingType', { defaultValue: "Select Mapping Type" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{mappingTypeFilterOptions(t).map(opt => <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectActiveStatus', { defaultValue: "Select Active Status" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{booleanFilterOptions(t, 'active').map(opt => <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                 <div className="lg:col-span-1">
                     <Label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('filters.sortBy', {defaultValue: "Sort By"})}</Label>
                    <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
                        <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            <SelectValue placeholder={t('filters.selectSort', { defaultValue: "Select sort order" })} />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                            {sortOptionsConfig(t, language).map(opt => (
                                <SelectItem key={`sort-dp-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 rtl:sm:space-x-reverse pt-2">
                <Button variant="outline" onClick={resetFilters} className="text-sm w-full sm:w-auto dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                    <FilterX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('buttons.resetFilters', { defaultValue: "Reset Filters" })}
                </Button>
                <Button onClick={() => fetchData(true)} variant="outline" className="text-sm w-full sm:w-auto dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading && diagnosisApiCache.mappings.loading}>
                  <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading && diagnosisApiCache.mappings.loading ? 'animate-spin' : ''}`} />
                  {t('buttons.refresh', { defaultValue: "Refresh" })}
                </Button>
            </div>
        </CardContent>
      </Card>

      {showErrorState && (
        <div className="p-4 my-4 bg-red-50 dark:bg-red-900/30 border border-red-500 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
           {retryCount > 0 && error.includes('Too many requests') && <span className="text-xs">({t('errors.retryingAttempt', {current: retryCount, max:3, defaultValue: `Retrying attempt ${retryCount}/3...`})})</span>}
        </div>
      )}
      
      {showInitialLoading && <LoadingSpinner message={t('messages.loadingInitialData', { item: t('diagnosisProcedure.entityNamePlural', {defaultValue: "mappings"})})} />}
      {showUpdateLoading && <LoadingSpinner message={t('messages.updatingData', { item: t('diagnosisProcedure.entityNamePlural', {defaultValue: "mappings"}) })} />}


      {!loading && !error && filteredAndSortedMappings.length === 0 && (
        <div className="mt-8">
            <EmptyState
            icon={Search}
            title={t('diagnosisProcedure.noMappingsMatchFilters', { defaultValue: 'No Mappings Match Your Filters' })}
            description={t('diagnosisProcedure.tryAdjustingFilters', { defaultValue: 'Try adjusting your search terms or filter selections, or add a new mapping.' })}
            actionButton={Object.values(filters).every(f => f === '' || f === 'all') && (
                <Button onClick={() => openDialog()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('diagnosisProcedure.addFirstMapping', { defaultValue: 'Add First Mapping' })}
                </Button>
            )}
            />
        </div>
      )}

      {!showInitialLoading && !error && filteredAndSortedMappings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedMappings.map(mapping => (
            <Card key={mapping.id} className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold text-blue-600 dark:text-blue-400 break-all">
                    {mapping.diagnosis_code} <span className="text-gray-400 dark:text-gray-500 font-normal">{'<>'}</span> {mapping.procedure_code}
                  </CardTitle>
                  <div className="flex flex-col space-y-1 items-end">
                    {/*{renderMappingTypeBadge(mapping.mapping_type)}*/}
                    {renderStatusBadge(mapping.is_active)}
                  </div>
                </div>
                 <CardDescription className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                    {t('common.lastUpdated', {defaultValue: "Updated"})}: {mapping.updated_date && isValid(parseISO(mapping.updated_date)) ? formatDistanceToNow(parseISO(mapping.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.notSet', {defaultValue: 'N/A'})}
                 </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm text-gray-700 dark:text-gray-300 pt-0 pb-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('diagnosisProcedure.diagnosisCode', { defaultValue: 'Diagnosis' })}:</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{mapping.diagnosis_code}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={getMedicalCodeDescription(mapping.diagnosis_code)}>
                    {getMedicalCodeDescription(mapping.diagnosis_code)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('diagnosisProcedure.procedureCode', { defaultValue: 'Procedure' })}:</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{mapping.procedure_code}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={getMedicalCodeDescription(mapping.procedure_code)}>
                    {getMedicalCodeDescription(mapping.procedure_code)}
                  </p>
                </div>
                {Array.isArray(mapping.validity_rules) && mapping.validity_rules.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('diagnosisProcedure.fields.validityRules', {defaultValue: 'Validity Rules'})}:</p>
                    <ul className="list-disc list-inside pl-1 space-y-0.5">
                      {mapping.validity_rules.slice(0,2).map((rule, index) => ( // Show first 2 rules
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 truncate" title={`${rule.rule_type}: ${rule.rule_value}`}>
                          <span className="font-semibold">{t(`validityRuleTypes.${rule.rule_type?.toLowerCase()}`, {defaultValue: rule.rule_type})}:</span> {rule.rule_value}
                        </li>
                      ))}
                       {mapping.validity_rules.length > 2 && <li className="text-xs text-gray-500 dark:text-gray-400">+{mapping.validity_rules.length - 2} {t('common.more', {defaultValue: 'more'})}</li>}
                    </ul>
                  </div>
                )}
                {mapping.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('common.notes', {defaultValue: 'Notes'})}:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap truncate" title={mapping.notes}>
                        {mapping.notes.length > 100 ? `${mapping.notes.substring(0, 100)}...` : mapping.notes}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t dark:border-gray-700 pt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => openDialog(mapping)} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                  <Pencil className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('buttons.edit', {defaultValue: "Edit"})}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <DiagnosisProcedureDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          mapping={currentMapping}
        />
      )}
    </div>
  );
}
