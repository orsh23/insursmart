
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Crosswalk } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Search, GitCompareArrows, RefreshCw, FilterX, AlertTriangle, Pencil, Layers, CheckCircle2, Shuffle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import CrosswalkDialog from './crosswalk-dialog';
import { useToast } from "@/components/ui/use-toast";
import { useEntityModule } from '@/components/hooks/useEntityModule'; // Fixed import path
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage'; // Fixed import path

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const codeTypeFilterOptions = (t) => [
  { value: 'all', label: t('filters.allCodeTypes', { defaultValue: 'All Code Types' }) },
  { value: 'ICD9', label: t('codeSystems.ICD9', { defaultValue: 'ICD-9' }) },
  { value: 'ICD10', label: t('codeSystems.ICD10', { defaultValue: 'ICD-10' }) },
  { value: 'CPT', label: t('codeSystems.CPT', { defaultValue: 'CPT' }) },
  { value: 'HCPCS', label: t('codeSystems.HCPCS', { defaultValue: 'HCPCS' }) },
  { value: 'Internal', label: t('codeSystems.Internal', { defaultValue: 'Internal' }) },
];

const mappingTypeFilterOptions = (t) => [
  { value: 'all', label: t('filters.allMappingTypes', { defaultValue: 'All Mapping Types' }) },
  { value: 'Single', label: t('mappingTypes.single', { defaultValue: 'Single' }) },
  { value: 'Alternative', label: t('mappingTypes.alternative', { defaultValue: 'Alternative' }) },
  { value: 'Combination', label: t('mappingTypes.combination', { defaultValue: 'Combination' }) },
  { value: 'No Map', label: t('mappingTypes.noMap', { defaultValue: 'No Map' }) },
];

const accuracyFilterOptions = (t) => [
  { value: 'all', label: t('filters.allAccuracyLevels', { defaultValue: 'All Accuracy Levels' }) },
  { value: 'Exact', label: t('accuracyLevels.exact', { defaultValue: 'Exact' }) },
  { value: 'Approximate', label: t('accuracyLevels.approximate', { defaultValue: 'Approximate' }) },
  { value: 'Partial', label: t('accuracyLevels.partial', { defaultValue: 'Partial' }) },
];

const booleanFilterOptions = (t, fieldName = 'status') => [
  { value: 'all', label: t(`filters.all${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`, { defaultValue: `All (${fieldName})` }) },
  { value: 'true', label: t(`filters.${fieldName}True`, { defaultValue: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: Yes` }) },
  { value: 'false', label: t(`filters.${fieldName}False`, { defaultValue: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: No` }) },
];

const sortOptionsConfig = (t) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'anchor_code', label: t('sortOptions.anchorCode', { defaultValue: 'Anchor Code' }) },
    { value: 'anchor_type', label: t('sortOptions.anchorType', { defaultValue: 'Anchor Type' }) },
    { value: 'target_code_type', label: t('sortOptions.targetCodeType', { defaultValue: 'Target Type' }) },
    { value: 'target_codes', label: t('sortOptions.targetCodesCount', { defaultValue: 'Target Codes (Count)' }) },
    { value: 'mapping_type', label: t('sortOptions.mappingType', { defaultValue: 'Mapping Type' }) },
    { value: 'accuracy', label: t('sortOptions.accuracy', { defaultValue: 'Accuracy' }) },
    { value: 'is_active', label: t('sortOptions.status', { defaultValue: 'Status' }) },
    { value: 'combination_scenario', label: t('sortOptions.combinationScenario', { defaultValue: 'Combination Scenario' }) },
    { value: 'mapping_option', label: t('sortOptions.mappingOption', { defaultValue: 'Mapping Option' }) },
];


export default function CrosswalksTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const entityConfig = useMemo(() => ({
    entitySDK: Crosswalk,
    entityName: t('crosswalks.entityNameSingular', { defaultValue: 'Crosswalk Mapping' }),
    entityNamePlural: t('crosswalks.entityNamePlural', { defaultValue: 'Crosswalk Mappings' }),
    DialogComponent: CrosswalkDialog,
    FormComponent: null,
    initialFilters: {
      searchTerm: '',
      anchorType: 'all',
      targetCodeType: 'all',
      mappingType: 'all',
      accuracy: 'all',
      isActive: 'all',
      targetCodesSearch: '',
      combinationScenarioSearch: '',
      mappingOptionSearch: '',
      page: 1,
      pageSize: 10,
    },
    filterFunction: (sourceItems, filters) => { // Fixed: now takes sourceItems and returns filtered array
        if (!Array.isArray(sourceItems)) return [];

        return sourceItems.filter(item => {
            const searchLower = filters.searchTerm?.toLowerCase() || '';
            const targetCodesSearchLower = filters.targetCodesSearch?.toLowerCase() || '';
            const combinationScenarioSearchLower = filters.combinationScenarioSearch?.toLowerCase() || '';
            const mappingOptionSearchLower = filters.mappingOptionSearch?.toLowerCase() || '';

            const matchesSearchTerm = !filters.searchTerm ||
                (item.anchor_code && item.anchor_code.toLowerCase().includes(searchLower)) ||
                (Array.isArray(item.target_codes) && item.target_codes.some(tc => tc.toLowerCase().includes(searchLower))) ||
                (item.combination_scenario && item.combination_scenario.toLowerCase().includes(searchLower)) ||
                (item.mapping_option && item.mapping_option.toLowerCase().includes(searchLower));

            const matchesAnchorType = filters.anchorType === 'all' || item.anchor_type === filters.anchorType;
            const matchesTargetCodeType = filters.targetCodeType === 'all' || item.target_code_type === filters.targetCodeType;
            const matchesMappingType = filters.mappingType === 'all' || item.mapping_type === filters.mappingType;
            const matchesAccuracy = filters.accuracy === 'all' || item.accuracy === filters.accuracy;
            const matchesIsActive = filters.isActive === 'all' || String(item.is_active) === filters.isActive;

            const matchesTargetCodes = !filters.targetCodesSearch ||
                (Array.isArray(item.target_codes) && item.target_codes.some(tc => tc.toLowerCase().includes(targetCodesSearchLower)));

            const matchesCombinationScenario = !filters.combinationScenarioSearch ||
                (item.combination_scenario && item.combination_scenario.toLowerCase().includes(combinationScenarioSearchLower));

            const matchesMappingOption = !filters.mappingOptionSearch ||
                (item.mapping_option && item.mapping_option.toLowerCase().includes(mappingOptionSearchLower));

            return matchesSearchTerm && matchesAnchorType && matchesTargetCodeType && matchesMappingType && matchesAccuracy && matchesIsActive && matchesTargetCodes && matchesCombinationScenario && matchesMappingOption;
        });
    },
    sortFunction: (items, currentSortConfig) => {
      if (!currentSortConfig || !currentSortConfig.sortBy) return items;
      const field = currentSortConfig.sortBy.startsWith('-') ? currentSortConfig.sortBy.substring(1) : currentSortConfig.sortBy;
      const reverse = currentSortConfig.sortBy.startsWith('-');

      return [...items].sort((a, b) => {
          let valA;
          let valB;

          if (field === 'updated_date') {
              valA = (typeof a.updated_date === 'string' && a.updated_date) ? parseISO(a.updated_date) : new Date(0);
              valB = (typeof b.updated_date === 'string' && b.updated_date) ? parseISO(b.updated_date) : new Date(0);
              if (!isValid(valA)) valA = new Date(0);
              if (!isValid(valB)) valB = new Date(0);
          } else if (field === 'target_codes') {
              valA = Array.isArray(a.target_codes) ? a.target_codes.length : 0;
              valB = Array.isArray(b.target_codes) ? b.target_codes.length : 0;
              if (valA === valB && Array.isArray(a.target_codes) && a.target_codes.length > 0) {
                   valA = a.target_codes[0].toLowerCase();
                   valB = b.target_codes[0].toLowerCase();
              }
          } else if (typeof a[field] === 'boolean' && typeof b[field] === 'boolean') {
              valA = a[field] ? 1 : 0;
              valB = b[field] ? 1 : 0;
          } else {
              valA = a[field];
              valB = b[field];
              if (typeof valA === 'string' && typeof valB === 'string') {
                  valA = (valA || '').toLowerCase();
                  valB = (valB || '').toLowerCase();
              } else if (valA === null || valA === undefined) {
                  valA = reverse ? 'zzzzzzzz' : '';
              } else if (valB === null || valB === undefined) {
                  valB = reverse ? 'zzzzzzzz' : '';
              }
          }

          let comparison = 0;
          if (valA > valB) comparison = 1;
          else if (valA < valB) comparison = -1;

          return reverse ? comparison * -1 : comparison;
      });
    },
    storageKey: 'crosswalksView',
  }), [t]);

  const {
    items: crosswalks,
    loading, error, filters, setFilters,
    sortConfig,
    setSortConfig,
    pagination, setPagination,
    selectedItems, setSelectedItems, isDialogOpen, setIsDialogOpen, currentItem, setCurrentItem,
    handleRefresh: refreshCrosswalks,
    handleFilterChange,
    handlePageChange, handlePageSizeChange, handleAddNew, handleEdit,
    handleBulkDelete, isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('crosswalksView_viewPreference', 'card'));
  // These states are not used for filter options, they are passed as functions to useEntityModule
  // const [currentAnchorTypeOptions, setCurrentAnchorTypeOptions] = useState(codeTypeFilterOptions(t));
  // const [currentTargetCodeTypeOptions, setCurrentTargetCodeTypeOptions] = useState(codeTypeFilterOptions(t));
  // const [currentMappingTypeOptions, setCurrentMappingTypeOptions] = useState(mappingTypeFilterOptions(t));
  // const [currentAccuracyOptions, setCurrentAccuracyOptions] = useState(accuracyFilterOptions(t));
  // const [currentIsActiveOptions, setCurrentIsActiveOptions] = useState(booleanFilterOptions(t, 'status'));

  useEffect(() => {
    if (passedView) {
      setCurrentView(passedView);
      saveToStorage('crosswalksView_viewPreference', passedView);
    }
  }, [passedView]);

  const resetFilters = useCallback(() => {
    setFilters(entityConfig.initialFilters);
    setSortConfig({ sortBy: '-updated_date' });
  }, [setFilters, entityConfig.initialFilters, setSortConfig]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'crosswalks.addMapping', defaultLabel: 'Add Mapping', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = crosswalks.find(item => item.id === selectedItems[0]);
      if (itemToEdit) {
        handleEdit(itemToEdit);
      }
      setIsSelectionModeActive(false);
    } else if (selectedItems.length === 0) {
      toast({
        title: t('toasts.noItemSelectedTitle', { defaultValue: 'No Item Selected' }),
        description: t('toasts.noItemSelectedDescription', { defaultValue: 'Please select an item to edit.' }),
        variant: 'info',
      });
    } else {
      toast({
        title: t('toasts.multipleItemsSelectedTitle', { defaultValue: 'Multiple Items Selected' }),
        description: t('toasts.multipleItemsSelectedEditDescription', { defaultValue: 'Please select only one item to edit.' }),
        variant: 'info',
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, crosswalks]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems);
      setIsSelectionModeActive(false);
    } else {
      toast({
        title: t('toasts.noItemSelectedTitle', { defaultValue: 'No Item Selected' }),
        description: t('toasts.noItemSelectedDeleteDescription', { defaultValue: 'Please select items to delete.' }),
        variant: 'info',
      });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleDialogClose = useCallback((refreshNeeded, actionType = null, entityName = '') => {
    handleSelfSubmittingDialogClose(refreshNeeded, actionType, entityName);
  }, [handleSelfSubmittingDialogClose]);

  const renderStatusBadge = (status) => {
    const text = status ? t('status.activeShort', {defaultValue:"Active"}) : t('status.inactiveShort', {defaultValue:"Inactive"});
    const variant = status ? 'success' : 'outline';
    return <Badge variant={variant} className="text-xs whitespace-nowrap">{text}</Badge>;
  };

  const getDisplayValue = (value, type) => {
    if (!value) return t('common.notSet', {defaultValue: 'N/A'});
    let options;
    switch(type) {
        case 'codeType':
          options = [
            { value: 'ICD9', label: t('codeSystems.ICD9', { defaultValue: 'ICD-9' }) },
            { value: 'ICD10', label: t('codeSystems.ICD10', { defaultValue: 'ICD-10' }) },
            { value: 'CPT', label: t('codeSystems.CPT', { defaultValue: 'CPT' }) },
            { value: 'HCPCS', label: t('codeSystems.HCPCS', { defaultValue: 'HCPCS' }) },
            { value: 'Internal', label: t('codeSystems.Internal', { defaultValue: 'Internal' }) },
          ];
          break;
        case 'mappingType':
          options = [
            { value: 'Single', label: t('mappingTypes.single', { defaultValue: 'Single' }) },
            { value: 'Alternative', label: t('mappingTypes.alternative', { defaultValue: 'Alternative' }) },
            { value: 'Combination', label: t('mappingTypes.combination', { defaultValue: 'Combination' }) },
            { value: 'No Map', label: t('mappingTypes.noMap', { defaultValue: 'No Map' }) },
          ];
          break;
        case 'accuracy':
          options = [
            { value: 'Exact', label: t('accuracyLevels.exact', { defaultValue: 'Exact' }) },
            { value: 'Approximate', label: t('accuracyLevels.approximate', { defaultValue: 'Approximate' }) },
            { value: 'Partial', label: t('accuracyLevels.partial', { defaultValue: 'Partial' }) },
          ];
          break;
        default: return value;
    }
    const found = options.find(opt => opt.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Shuffle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('crosswalks.listTitle', { defaultValue: "Crosswalk Mappings" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading ? t('common.loadingEllipsis', {defaultValue: "..."}) : crosswalks.length})
          </span>
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('crosswalks.entityNameSingular', { defaultValue: 'Crosswalk Mapping' })}
                t={t}
              />
          <Button onClick={() => refreshCrosswalks()} variant="outline" className="text-sm dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
        </div>
      </div>

      <Card className="dark:bg-gray-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium text-gray-700 dark:text-gray-200">{t('filters.filterAndSortCrosswalks', { defaultValue: 'Filter & Sort Mappings' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                <Input
                    placeholder={t('search.placeholderCrosswalks', { defaultValue: 'Search anchor, target, scenario...' })}
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                <Select value={filters.anchorType} onValueChange={(value) => handleFilterChange('anchorType', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectAnchorType', { defaultValue: "Anchor Type" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{codeTypeFilterOptions(t).map(opt => <SelectItem key={`at-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filters.targetCodeType} onValueChange={(value) => handleFilterChange('targetCodeType', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectTargetType', { defaultValue: "Target Type" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{codeTypeFilterOptions(t).map(opt => <SelectItem key={`tt-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filters.mappingType} onValueChange={(value) => handleFilterChange('mappingType', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectMappingType', { defaultValue: "Mapping Type" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{mappingTypeFilterOptions(t).map(opt => <SelectItem key={`mt-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filters.accuracy} onValueChange={(value) => handleFilterChange('accuracy', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectAccuracy', { defaultValue: "Accuracy Level" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{accuracyFilterOptions(t).map(opt => <SelectItem key={`ac-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)} disabled={loading}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><SelectValue placeholder={t('filters.selectStatus', { defaultValue: "Status" })} /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">{booleanFilterOptions(t, 'status').map(opt => <SelectItem key={`ia-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                 <Input
                    placeholder={t('filters.filterByTargetCodes', { defaultValue: 'Filter by Target Codes' })}
                    value={filters.targetCodesSearch}
                    onChange={(e) => handleFilterChange('targetCodesSearch', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                 <Input
                    placeholder={t('filters.filterByCombinationScenario', { defaultValue: 'Filter by Combination Scenario' })}
                    value={filters.combinationScenarioSearch}
                    onChange={(e) => handleFilterChange('combinationScenarioSearch', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                 <Input
                    placeholder={t('filters.filterByMappingOption', { defaultValue: 'Filter by Mapping Option' })}
                    value={filters.mappingOptionSearch}
                    onChange={(e) => handleFilterChange('mappingOptionSearch', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('filters.sortBy', {defaultValue: "Sort By"})}</Label>
                    <Select value={sortConfig?.sortBy || '-updated_date'} onValueChange={(value) => setSortConfig({ sortBy: value })} disabled={loading}>
                         <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            <SelectValue placeholder={t('filters.selectSort', { defaultValue: "Select sort order" })} />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                            {sortOptionsConfig(t).map(opt => (
                                <SelectItem key={`sort-cw-${opt.value}`} value={opt.value} className="dark:hover:bg-gray-600">{opt.label}</SelectItem>
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
                <Button onClick={() => refreshCrosswalks()} variant="outline" className="text-sm w-full sm:w-auto dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
                  {t('buttons.refresh', { defaultValue: "Refresh" })}
                </Button>
            </div>
        </CardContent>
      </Card>

       {error && (
        <div className="p-4 my-4 bg-red-50 dark:bg-red-900/30 border border-red-500 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {loading && crosswalks.length === 0 && <LoadingSpinner message={t('messages.loadingInitialData', { item: t('crosswalks.entityNamePlural', {defaultValue: "crosswalks"})})} />}
      {loading && crosswalks.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('crosswalks.entityNamePlural', {defaultValue: "crosswalks"}) })} />}


      {!loading && !error && crosswalks.length === 0 && (
        <div className="mt-8">
            <EmptyState
            icon={Search}
            title={t('crosswalks.noMappingsMatchFilters', { defaultValue: 'No Mappings Match Your Filters' })}
            description={t('crosswalks.tryAdjustingFilters', { defaultValue: 'Try adjusting your search terms or filter selections, or add a new mapping.' })}
            actionButton={Object.values(filters).every(f => f === '' || f === 'all') && (
                <Button onClick={() => handleAddNew()} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('crosswalks.addFirstMapping', { defaultValue: 'Add First Mapping' })}
                </Button>
            )}
            />
        </div>
      )}

      {!loading && !error && crosswalks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crosswalks.map(cw => (
            <Card key={cw.id} className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-md font-semibold text-purple-600 dark:text-purple-400 break-all" title={cw.anchor_code}>
                    {t('crosswalks.anchorField', {defaultValue:"Anchor"})}: {cw.anchor_code} ({getDisplayValue(cw.anchor_type, 'codeType')})
                  </CardTitle>
                   {renderStatusBadge(cw.is_active)}
                </div>
                 <CardDescription className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                   {t('common.lastUpdated', {defaultValue: "Updated"})}: {(typeof cw.updated_date === 'string' && cw.updated_date && isValid(parseISO(cw.updated_date))) ? formatDistanceToNow(parseISO(cw.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.notSet', {defaultValue: 'N/A'})}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1.5 text-sm text-gray-700 dark:text-gray-300 pt-0 pb-3">
                <div className="flex items-center gap-1.5" title={t('crosswalks.targetField', {defaultValue: "Target"})}>
                    <Layers className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{getDisplayValue(cw.target_code_type, 'codeType')}:</span>
                    <span className="truncate">{(Array.isArray(cw.target_codes) && cw.target_codes.length > 0) ? cw.target_codes.join(', ') : t('common.notSet', {defaultValue: 'N/A'})}</span>
                </div>
                <div className="flex items-center gap-1.5" title={t('crosswalks.mappingTypeField', {defaultValue: "Mapping Type"})}>
                    <GitCompareArrows className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{t('crosswalks.mappingTypeFieldShort', {defaultValue: "Type"})}:</span>
                    <span>{getDisplayValue(cw.mapping_type, 'mappingType')}</span>
                </div>
                <div className="flex items-center gap-1.5" title={t('crosswalks.accuracyField', {defaultValue: "Accuracy"})}>
                    <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{t('crosswalks.accuracyFieldShort', {defaultValue: "Accuracy"})}:</span>
                    <span>{getDisplayValue(cw.accuracy, 'accuracy')}</span>
                </div>

                {cw.combination_scenario && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 pt-1" title={t('crosswalks.combinationScenarioField', {defaultValue: "Combination Scenario"})}>
                    <span className="font-semibold">{t('crosswalks.combinationScenarioFieldShort', {defaultValue: "Scenario"})}: </span>
                    <span className="truncate block">{cw.combination_scenario}</span>
                  </p>
                )}
                {cw.mapping_option && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 pt-1" title={t('crosswalks.mappingOptionField', {defaultValue: "Mapping Option"})}>
                    <span className="font-semibold">{t('crosswalks.mappingOptionFieldShort', {defaultValue: "Option"})}: </span>
                    <span className="truncate block">{cw.mapping_option}</span>
                  </p>
                )}
              </CardContent>
              <CardFooter className="border-t dark:border-gray-700 pt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(cw)}
                  className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
                >
                  <Pencil className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('buttons.edit', {defaultValue: "Edit"})}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <CrosswalkDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleDialogClose(refresh, actionType, itemName)}
          crosswalk={currentItem}
        />
      )}
    </div>
  );
}
