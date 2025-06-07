import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Tariff } from '@/api/entities';
import { Contract } from '@/api/entities';
import { InsuranceCode } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FilterX, FileText, RefreshCw, AlertTriangle, DollarSign, Users, Settings, Briefcase, TagIcon, Coins } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TariffDialog from './TariffDialog';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { getLocalizedValue } from '@/components/utils/i18n-utils';
import { DataTable } from '@/components/ui/data-table';
// Removed @tanstack/react-table import

// Sample Data (kept as per instruction)
const sampleTariffs = [
  { id: "tariff-1", contract_id: "contract-1", insurance_code: "INS-0001-GEN", doctor_id: null, base_price: 250, currency: "ILS", finalization_type: "Claim", composition: [{ component_type: "Base", pricing_model:"Fixed", amount: 250}], validation_rules: [], created_date: "2023-01-15T10:00:00Z", updated_date: "2023-01-15T10:00:00Z" },
  { id: "tariff-2", contract_id: "contract-2", insurance_code: "INS-0025-CARDIO", doctor_id: "doctor-1", base_price: 1200, currency: "ILS", finalization_type: "RFC", composition: [{component_type: "Base", pricing_model:"Fixed", amount: 1000}, {component_type: "DoctorFee", pricing_model:"Fixed", amount: 200}], validation_rules: [{rule_type: "age_limit", rule_value: "18+"}], created_date: "2023-02-20T11:30:00Z", updated_date: "2023-03-01T09:00:00Z" },
  { id: "tariff-3", contract_id: "contract-1", insurance_code: "INS-0010-ORTHO", doctor_id: "doctor-2", base_price: 800, currency: "USD", finalization_type: "Hybrid", composition: [], validation_rules: [], created_date: "2023-04-01T14:15:00Z", updated_date: "2023-04-01T14:15:00Z" },
];

const sampleContracts = [
  { id: "contract-1", contract_number: "CTR-2023-001", name_en: "General Services Agreement", name_he: "הסכם שירותים כללי" },
  { id: "contract-2", contract_number: "CTR-2024-SPECIAL-A", name_en: "Special Cardiology Services", name_he: "שירותי קרדיולוגיה מיוחדים" },
];

const sampleInsuranceCodes = [
  { id: "icode-1", code: "INS-0001-GEN", name_en: "General Consultation", name_he: "ייעוץ כללי" },
  { id: "icode-2", code: "INS-0025-CARDIO", name_en: "Cardiology Procedure Package", name_he: "חבילת פרוצדורות קרדיולוגיות" },
  { id: "icode-3", code: "INS-0010-ORTHO", name_en: "Orthopedic Surgery Basic", name_he: "ניתוח אורטופדי בסיסי"},
];

const sampleDoctors = [
  { id: "doctor-1", first_name_en: "Avi", last_name_en: "Cohen", first_name_he: "אבי", last_name_he: "כהן", specialties: ["Cardiology"] },
  { id: "doctor-2", first_name_en: "Sara", last_name_en: "Levi", first_name_he: "שרה", last_name_he: "לוי", specialties: ["Orthopedics"] },
];

// Cache for auxiliary data
const tariffsApiCache = {
  contracts: { data: null, timestamp: null, loading: false, error: null },
  insuranceCodes: { data: null, timestamp: null, loading: false, error: null },
  doctors: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = tariffsApiCache[cacheKey];
  return entry && entry.data && entry.timestamp && (Date.now() - entry.timestamp) < tariffsApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (tariffsApiCache[cacheKey]) tariffsApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (tariffsApiCache[cacheKey]) {
    tariffsApiCache[cacheKey].loading = isLoading;
    if (isLoading) tariffsApiCache[cacheKey].error = null;
  }
};

const finalizationTypeOptions = (t) => [ 
  { value: 'all', label: t('filters.allFinalizationTypes', { defaultValue: 'All Finalization Types' }) },
  { value: 'RFC', label: t('finalizationTypes.rfc', { defaultValue: 'RFC' }) },
  { value: 'Claim', label: t('finalizationTypes.claim', { defaultValue: 'Claim' }) },
  { value: 'Hybrid', label: t('finalizationTypes.hybrid', { defaultValue: 'Hybrid' }) },
];

export default function TariffsTab({ globalActionsConfig: externalActionsConfig }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [allContracts, setAllContracts] = useState([]);
  const [allInsuranceCodes, setAllInsuranceCodes] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);

  // Safe date formatter specifically for table cells
  const formatCellDate = useCallback((dateValue) => {
    if (!dateValue) return t('common.notSet', { defaultValue: 'N/A' });
    
    try {
      let dateObj;
      if (dateValue instanceof Date) {
        dateObj = dateValue;
      } else if (typeof dateValue === 'string') {
        dateObj = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      } else {
        return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      }

      if (isNaN(dateObj.getTime())) {
        return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      }

      // Use simple, safe formatting without date-fns for now
      return dateObj.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date in cell:', error, dateValue);
      return t('common.invalidDate', { defaultValue: 'Invalid Date' });
    }
  }, [language, t]);

  // Auxiliary data fetching (Contracts, Insurance Codes, Doctors)
  const fetchAuxiliaryData = useCallback(async (forceRefresh = false) => {
    const fetchWithCache = async (cacheKey, apiCall, setData, entityName, sampleDataFallback) => {
      if (!forceRefresh && isCacheValid(cacheKey) && tariffsApiCache[cacheKey].data) {
        setData(tariffsApiCache[cacheKey].data); 
        return;
      }
      if (tariffsApiCache[cacheKey].loading && !forceRefresh) return; 
      setCacheLoading(cacheKey, true);
      try {
        let data;
        try { 
          data = await apiCall(); 
        } catch (apiError) {
          console.warn(`API call failed for ${entityName}, using sample data:`, apiError);
          data = sampleDataFallback; 
        }
        const validData = Array.isArray(data) ? data : [];
        setData(validData); 
        updateCache(cacheKey, validData);
      } catch (err) { 
        console.error(`Error fetching ${entityName}:`, err);
        setData(sampleDataFallback || []); 
        updateCache(cacheKey, sampleDataFallback || [], `Error fetching, using sample data for ${entityName}`); 
      } finally {
        setCacheLoading(cacheKey, false);
      }
    };

    await Promise.all([
      fetchWithCache('contracts', () => Contract.list(), setAllContracts, 'Contracts', sampleContracts),
      fetchWithCache('insuranceCodes', () => InsuranceCode.list(), setAllInsuranceCodes, 'Insurance Codes', sampleInsuranceCodes),
      fetchWithCache('doctors', () => Doctor.list(), setAllDoctors, 'Doctors', sampleDoctors),
    ]);
  }, []);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  const entityConfig = useMemo(() => ({
    entitySDK: Tariff,
    entityName: t('tariffs.itemTitleSingular', { defaultValue: 'Tariff' }),
    entityNamePlural: t('tariffs.itemTitlePlural', { defaultValue: 'Tariffs' }),
    DialogComponent: TariffDialog,
    FormComponent: null, 
    initialFilters: {
      searchTerm: '',
      contractId: 'all',
      insuranceCode: 'all',
      doctorId: 'all',
      finalizationType: 'all',
      page: 1,
      pageSize: 10,
    },
    filterFunction: (tariff, filters) => {
        const searchTermLower = filters.searchTerm?.toLowerCase() || '';
        const contract = (allContracts || []).find(c => c.id === tariff.contract_id);
        const insCode = (allInsuranceCodes || []).find(ic => ic.code === tariff.insurance_code); 
        const doctor = (allDoctors || []).find(d => d.id === tariff.doctor_id);

        const matchesSearch = !filters.searchTerm ||
            (contract && contract.contract_number?.toLowerCase().includes(searchTermLower)) ||
            (contract && getLocalizedValue(contract, 'name', language, 'en')?.toLowerCase().includes(searchTermLower)) ||
            (insCode && insCode.code?.toLowerCase().includes(searchTermLower)) ||
            (insCode && getLocalizedValue(insCode, 'name', language, 'en')?.toLowerCase().includes(searchTermLower)) ||
            (doctor && `${getLocalizedValue(doctor, 'first_name', language, 'en')} ${getLocalizedValue(doctor, 'last_name', language, 'en')}`.toLowerCase().includes(searchTermLower)) ||
            (tariff.base_price?.toString().includes(searchTermLower));

        const matchesContract = filters.contractId === 'all' || tariff.contract_id === filters.contractId;
        const matchesInsuranceCode = filters.insuranceCode === 'all' || tariff.insurance_code === filters.insuranceCode;
        const matchesDoctor = filters.doctorId === 'all' || tariff.doctor_id === filters.doctorId || (filters.doctorId === 'none' && !tariff.doctor_id);
        const matchesFinalization = filters.finalizationType === 'all' || tariff.finalization_type === filters.finalizationType;

        return matchesSearch && matchesContract && matchesInsuranceCode && matchesDoctor && matchesFinalization;
    },
    storageKey: 'tariffsView',
    defaultSort: { key: 'insurance_code', direction: 'asc' }, 
  }), [t, allContracts, allInsuranceCodes, allDoctors, language]);

  const {
    items: filteredAndSortedItems = [],
    loading = false, 
    error = null, 
    filters = {}, 
    setFilters,
    selectedItems = [], 
    setSelectedItems, 
    isDialogOpen = false, 
    setIsDialogOpen, 
    currentItem = null, 
    setCurrentItem,
    handleRefresh: refreshTariffsInternal, 
    handleFilterChange,
    handleAddNew, 
    handleEdit, 
    handleDelete, 
    handleBulkDelete, 
    isSelectionModeActive = false, 
    setIsSelectionModeActive,
    handleToggleSelection, 
    handleSelectAll, 
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig) || {};

  const refreshTariffs = useCallback((force = false) => {
    fetchAuxiliaryData(force); 
    if (refreshTariffsInternal) refreshTariffsInternal(); 
  }, [fetchAuxiliaryData, refreshTariffsInternal]);

  const contractOptions = useMemo(() => {
    const contracts = allContracts || [];
    return [
      { value: 'all', label: t('filters.allContracts', {defaultValue: 'All Contracts'}) }, 
      ...contracts.map(c => ({ 
        value: c.id, 
        label: `${c.contract_number} (${getLocalizedValue(c, 'name', language, 'en')})` 
      }))
    ];
  }, [allContracts, t, language]);

  const insuranceCodeOptions = useMemo(() => {
    const codes = allInsuranceCodes || [];
    return [
      { value: 'all', label: t('filters.allInsuranceCodes', {defaultValue: 'All Insurance Codes'}) }, 
      ...codes.map(ic => ({ 
        value: ic.code, 
        label: `${ic.code} (${getLocalizedValue(ic, 'name', language, 'en')})` 
      }))
    ];
  }, [allInsuranceCodes, t, language]);

  const doctorOptions = useMemo(() => {
    const doctors = allDoctors || [];
    return [
      { value: 'all', label: t('filters.allDoctors', {defaultValue: 'All Doctors'}) }, 
      ...doctors.map(d => ({ 
        value: d.id, 
        label: `${getLocalizedValue(d, 'first_name', language, 'en')} ${getLocalizedValue(d, 'last_name', language, 'en')}`.trim() 
      }))
    ];
  }, [allDoctors, t, language]);

  const currentFinalizationTypeOptions = useMemo(() => finalizationTypeOptions(t), [t]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'tariffs.addTariff', defaultLabel: 'Add Tariff', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    const selectedItemsArray = selectedItems || [];
    const filteredItems = filteredAndSortedItems || [];
    
    if (selectedItemsArray.length === 1) {
      const itemToEdit = filteredItems.find(item => item.id === selectedItemsArray[0]);
      if (itemToEdit && handleEdit) {
        handleEdit(itemToEdit); 
      } else {
        toast({ 
          title: t('common.error'), 
          description: t('errors.itemNotFoundToEditDesc', {item: t('tariffs.itemTitleSingular')}), 
          variant: 'destructive' 
        });
      }
      if (setIsSelectionModeActive) setIsSelectionModeActive(false);
      if (setSelectedItems) setSelectedItems([]);
    } else if (selectedItemsArray.length > 1) {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectOneToEditDesc', { entity: t('tariffs.itemTitleSingular') }),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectItemsPromptShort', { mode: t('common.edit').toLowerCase() }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, setSelectedItems, t, toast, filteredAndSortedItems]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    const selectedItemsArray = selectedItems || [];
    if (selectedItemsArray.length > 0 && handleBulkDelete) {
      handleBulkDelete(); 
    } else {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete').toLowerCase()}),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleBulkDelete, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    if (setIsSelectionModeActive) setIsSelectionModeActive(false);
    if (setSelectedItems) setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);
  
  const currentLoading = loading || tariffsApiCache.contracts.loading || tariffsApiCache.insuranceCodes.loading || tariffsApiCache.doctors.loading;
  const currentError = error || tariffsApiCache.contracts.error || tariffsApiCache.insuranceCodes.error || tariffsApiCache.doctors.error;

  const columns = useMemo(() => [
    {
      accessorKey: 'contract_id',
      header: t('tariffs.fields.contract', { defaultValue: 'Contract' }),
      cell: ({ row }) => {
        const contractId = row.original?.contract_id;
        if (!contractId) return t('common.notSet', { defaultValue: 'N/A' });
        
        const contract = allContracts?.find(c => c.id === contractId);
        if (!contract) return contractId;
        
        return (
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                <span className="truncate" title={`${contract.contract_number} (${getLocalizedValue(contract, 'name', language, 'en', '')})`}>
                    {getLocalizedValue(contract, 'name', language, 'en', contract.contract_number || contractId)}
                </span>
            </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'insurance_code',
      header: t('tariffs.fields.insuranceCode', { defaultValue: 'Insurance Code' }),
      cell: ({ row }) => {
        const code = row.original?.insurance_code;
        if (!code) return t('common.notSet', { defaultValue: 'N/A' });
        
        const insuranceCode = allInsuranceCodes?.find(ic => ic.code === code);
        return (
            <div className="font-medium truncate" title={`${code} (${getLocalizedValue(insuranceCode, 'name', language, 'en', '')})`}>
                {insuranceCode ? getLocalizedValue(insuranceCode, 'name', language, 'en', code) : code}
            </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'doctor_id',
      header: t('tariffs.fields.doctor', { defaultValue: 'Doctor' }),
      cell: ({ row }) => {
        const doctorId = row.original?.doctor_id;
        if (!doctorId) return t('common.general', { defaultValue: 'General' });
        
        const doctor = allDoctors?.find(d => d.id === doctorId);
        if (!doctor) return doctorId;
        
        const firstName = getLocalizedValue(doctor, 'first_name', language, 'en');
        const lastName = getLocalizedValue(doctor, 'last_name', language, 'en');
        return (
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Users className="h-3.5 w-3.5 text-gray-500" />
                <span className="truncate">{`${firstName} ${lastName}`.trim() || t('common.unknownDoctor', { defaultValue: 'Unknown Doctor' })}</span>
            </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'base_price',
      header: t('tariffs.fields.basePrice', { defaultValue: 'Base Price' }),
      cell: ({ row }) => {
        const price = row.original?.base_price;
        const currency = row.original?.currency || 'ILS';
        if (typeof price !== 'number') return t('common.notSet', { defaultValue: 'N/A' });
        
        return (
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                <span className="font-medium">{`${price.toLocaleString()} ${currency}`}</span>
            </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'finalization_type',
      header: t('tariffs.fields.finalizationType', { defaultValue: 'Finalization' }),
      cell: ({ row }) => {
        const type = row.original?.finalization_type;
        if (!type) return t('common.notSet', { defaultValue: 'N/A' });
        
        return (
          <Badge variant="outline">
            {t(`finalizationTypes.${type.toLowerCase()}`, { defaultValue: type })}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'composition',
      header: t('tariffs.fields.composition', { defaultValue: 'Components' }),
      cell: ({ row }) => {
        const composition = row.original?.composition;
        if (!Array.isArray(composition) || composition.length === 0) {
          return t('common.notSet', { defaultValue: 'N/A' });
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {composition.slice(0, 3).map((comp, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {t(`componentTypes.${comp.component_type?.toLowerCase()}`, { defaultValue: comp.component_type || 'Unknown' })}
              </Badge>
            ))}
            {composition.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{composition.length - 3}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'validation_rules',
      header: t('tariffs.fields.validationRules', { defaultValue: 'Rules' }),
      cell: ({ row }) => {
        const rules = row.original?.validation_rules;
        if (!Array.isArray(rules) || rules.length === 0) {
          return t('common.none', { defaultValue: 'None' });
        }
        
        return (
          <Badge variant="outline" className="text-xs">
            {rules.length} {t('common.rules', { defaultValue: 'rules' })}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'created_date',
      header: t('common.created', { defaultValue: 'Created' }),
      cell: ({ row }) => formatCellDate(row.original?.created_date),
      enableSorting: true,
    },
    {
      accessorKey: 'updated_date',
      header: t('common.updated', { defaultValue: 'Updated' }),
      cell: ({ row }) => formatCellDate(row.original?.updated_date),
      enableSorting: true,
    },
  ], [t, language, allContracts, allInsuranceCodes, allDoctors, formatCellDate, isRTL]);

  if (currentLoading && (!filteredAndSortedItems || filteredAndSortedItems.length === 0)) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('pageTitles.tariffs', { defaultValue: 'Tariffs'}) })} />;
  }

  if (currentError && (!filteredAndSortedItems || filteredAndSortedItems.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">{t('errors.dataLoadErrorTitle', { defaultValue: 'Error Loading Data' })}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{currentError}</p>
        <Button onClick={() => refreshTariffs(true)} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> {t('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Coins className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('pageTitles.tariffManagement', { defaultValue: 'Tariff Management' })} ({(filteredAndSortedItems && filteredAndSortedItems.length) || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={(selectedItems && selectedItems.length) || 0}
                itemTypeForActions={t('tariffs.itemTitleSingular', { defaultValue: 'Tariff' })}
                t={t}
              />
            <Button onClick={() => refreshTariffs(true)} variant="outline" disabled={currentLoading}>
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${currentLoading ? 'animate-spin' : ''}`} />{t('buttons.refresh')}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('tariffs.filtersTitle', {defaultValue: 'Filter Tariffs'})}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <Input
              placeholder={t('search.placeholderTariffs', {defaultValue: 'Search tariffs...'})}
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange && handleFilterChange('searchTerm', e.target.value)}
              className="lg:col-span-1 xl:col-span-1"
            />
            <Select value={filters.contractId || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('contractId', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectContract')}/></SelectTrigger>
              <SelectContent>
                {contractOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.insuranceCode || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('insuranceCode', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectInsuranceCode')}/></SelectTrigger>
              <SelectContent>
                {insuranceCodeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
             <Select value={filters.doctorId || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('doctorId', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectDoctor')}/></SelectTrigger>
              <SelectContent>
                {doctorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                <SelectItem value="none">{t('common.notApplicableShort', {defaultValue: 'N/A'})}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.finalizationType || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('finalizationType', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectFinalizationType')}/></SelectTrigger>
              <SelectContent>
                {currentFinalizationTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <Button variant="outline" onClick={() => setFilters && setFilters(entityConfig.initialFilters)}>
              <FilterX className="h-4 w-4 mr-2 rtl:ml-2" />{t('buttons.resetFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentLoading && filteredAndSortedItems && filteredAndSortedItems.length > 0 && (
        <LoadingSpinner message={t('messages.updatingData', { item: t('pageTitles.tariffs') })} />
      )}

      {!currentLoading && (!filteredAndSortedItems || filteredAndSortedItems.length === 0) ? (
        <EmptyState 
          icon={FileText} 
          title={t('tariffs.noTariffsMatchFilters', {defaultValue: 'No Tariffs Match Filters'})} 
          description={t('tariffs.tryAdjustingFiltersOrAdd', {defaultValue:'Try adjusting filters or add a new tariff.'})} 
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredAndSortedItems} 
          loading={currentLoading}
          entityName={t('tariffs.itemTitlePlural', { defaultValue: 'Tariffs' })}
          emptyMessage={t('tariffs.noTariffsMatchFilters', {defaultValue: 'No Tariffs Match Filters'})}
          onRowClick={handleEdit}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={(itemId, checked) => {
            if (handleToggleSelection) {
              handleToggleSelection(itemId);
            }
          }}
          onSelectAllRows={(checked) => {
            if (handleSelectAll) {
              handleSelectAll(checked);
            }
          }}
          t={t}
        />
      )}

      {isDialogOpen && TariffDialog && handleSelfSubmittingDialogClose && (
        <TariffDialog
          isOpen={isDialogOpen}
          onClose={(refreshNeeded, actionType) => {
            handleSelfSubmittingDialogClose(refreshNeeded, actionType, t('tariffs.itemTitleSingular'));
          }}
          tariff={currentItem}
          t={t}
          allContracts={allContracts}
          allInsuranceCodes={allInsuranceCodes}
          allDoctors={allDoctors}
        />
      )}
    </div>
  );
}