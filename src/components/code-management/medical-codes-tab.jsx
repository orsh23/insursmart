
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MedicalCode } from '@/api/entities';
import MedicalCodeDialog from './medical-code-dialog';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { useEntityModule } from '@/components/hooks/useEntityModule';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Search, RefreshCw, FilterX, AlertTriangle, Pencil, Code, CheckCircle2, Tag, UploadCloud, DownloadCloud, Edit, Trash2, SearchX } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import StatusBadge from '@/components/common/StatusBadge';
import { DataTable } from '@/components/ui/data-table';
import MedicalCodeCard from './MedicalCodeCard';
import MedicalCodeFilters from './MedicalCodeFilters';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';
import ErrorDisplay from '@/components/common/ErrorDisplay';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const codeSystemFilterOptions = (t) => [
  { value: 'all', label: t('filters.allCodeSystems', { defaultValue: 'All Systems' }) },
  { value: 'ICD9-DX', label: t('codeSystems.ICD9-DX', { defaultValue: 'ICD-9-DX' }) },
  { value: 'ICD10-CM', label: t('codeSystems.ICD10-CM', { defaultValue: 'ICD-10-CM' }) },
  { value: 'ICD10-PCS', label: t('codeSystems.ICD10-PCS', { defaultValue: 'ICD-10-PCS' }) },
  { value: 'CPT', label: t('codeSystems.CPT', { defaultValue: 'CPT' }) },
  { value: 'HCPCS', label: t('codeSystems.HCPCS', { defaultValue: 'HCPCS' }) },
  { value: 'ICD9-PROC', label: t('codeSystems.ICD9-PROC', { defaultValue: 'ICD-9-PROC' }) },
];

const statusFilterOptions = (t) => [
  { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
  { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
  { value: 'deprecated', label: t('status.deprecated', { defaultValue: 'Deprecated' }) },
];

const sortOptionsConfig = (t) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'code', label: t('sortOptions.code', { defaultValue: 'Code' }) },
    { value: 'code_system', label: t('sortOptions.codeSystem', { defaultValue: 'Code System' }) },
    { value: 'description_en', label: t('sortOptions.descriptionEn', { defaultValue: 'Description (EN)' }) },
    { value: 'description_he', label: t('sortOptions.descriptionHe', { defaultValue: 'Description (HE)' }) },
    { value: 'status', label: t('sortOptions.status', { defaultValue: 'Status' }) },
    { value: 'catalog_path', label: t('sortOptions.catalogPath', { defaultValue: 'Catalog Path' }) },
];

export default function MedicalCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const entityConfig = useMemo(() => ({
    entitySDK: MedicalCode,
    entityName: t('medicalCodes.entityNameSingular', { defaultValue: 'Medical Code' }),
    entityNamePlural: t('medicalCodes.titleMultiple', { defaultValue: 'Medical Codes' }),
    DialogComponent: MedicalCodeDialog,
    initialSort: [{ id: 'code', desc: false }],
    initialFilters: {
      searchTerm: '',
      codeSystem: 'all',
      status: 'all',
      tagsQuery: '',
      catalogPathQuery: '',
    },
    searchFields: ['code', 'description_en', 'description_he', 'catalog_path', 'tags'],
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase();
        if (term) {
            const descEn = item.description_en?.toLowerCase() || '';
            const descHe = item.description_he?.toLowerCase() || '';
            const code = item.code?.toLowerCase() || '';
            const catalogPath = item.catalog_path?.toLowerCase() || '';
            const tags = Array.isArray(item.tags) ? item.tags.map(tag => tag?.toLowerCase()).join(' ') : '';
            if (!(code.includes(term) || descEn.includes(term) || descHe.includes(term) || catalogPath.includes(term) || tags.includes(term))) {
                return false;
            }
        }
        if (filters.codeSystem !== 'all' && item.code_system !== filters.codeSystem) return false;
        if (filters.status !== 'all' && item.status !== filters.status) return false;
        if (filters.tagsQuery) {
            const lowerTagsQuery = filters.tagsQuery.toLowerCase();
            if (!Array.isArray(item.tags) || !item.tags.some(tag => tag?.toLowerCase().includes(lowerTagsQuery))) return false;
        }
        if (filters.catalogPathQuery) {
            const lowerCatalogPathQuery = filters.catalogPathQuery.toLowerCase();
            if (!item.catalog_path?.toLowerCase().includes(lowerCatalogPathQuery)) return false;
        }
        return true;
    },
    storageKey: 'medicalCodesView',
  }), [t]);

  const {
    items: medicalCodes,
    loading, error, filters, 
    sortConfig,
    pagination, 
    selectedItems, 
    isDialogOpen, currentItem,
    handleRefresh, // Renamed for clarity, was refreshMedicalCodes
    handleFilterChange,
    handleSortChange,
    handlePageChange, handlePageSizeChange, handleAddNew, handleEdit,
    handleBulkDelete, isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems,
    setSelectedItems,
  } = useEntityModule(entityConfig);
  
  // Ensure critical handlers are functions, providing a no-op if undefined
  const safeHandleRefresh = typeof handleRefresh === 'function' ? handleRefresh : () => { console.warn("handleRefresh is not a function or is undefined."); };
  const safeHandleFilterChange = typeof handleFilterChange === 'function' ? handleFilterChange : () => { console.warn("handleFilterChange is not a function or is undefined."); };
  const safeHandleSortChange = typeof handleSortChange === 'function' ? handleSortChange : () => { console.warn("handleSortChange is not a function or is undefined."); };
  const safeHandlePageChange = typeof handlePageChange === 'function' ? handlePageChange : () => { console.warn("handlePageChange is not a function or is undefined."); };
  const safeHandlePageSizeChange = typeof handlePageSizeChange === 'function' ? handlePageSizeChange : () => { console.warn("handlePageSizeChange is not a function or is undefined."); };
  const safeHandleAddNew = typeof handleAddNew === 'function' ? handleAddNew : () => { console.warn("handleAddNew is not a function or is undefined."); };
  const safeHandleEdit = typeof handleEdit === 'function' ? handleEdit : () => { console.warn("handleEdit is not a function or is undefined."); };
  const safeHandleBulkDelete = typeof handleBulkDelete === 'function' ? handleBulkDelete : async () => { console.warn("handleBulkDelete is not a function or is undefined."); return {successCount:0, failCount:0}; };
  const safeSetIsSelectionModeActive = typeof setIsSelectionModeActive === 'function' ? setIsSelectionModeActive : () => { console.warn("setIsSelectionModeActive is not a function or is undefined."); };
  const safeSetSelectedItems = typeof setSelectedItems === 'function' ? setSelectedItems : () => { console.warn("setSelectedItems is not a function or is undefined."); };
  const safeHandleToggleSelection = typeof handleToggleSelection === 'function' ? handleToggleSelection : () => { console.warn("handleToggleSelection is not a function or is undefined."); };
  const safeHandleSelectAll = typeof handleSelectAll === 'function' ? handleSelectAll : () => { console.warn("handleSelectAll is not a function or is undefined."); };
  const safeHandleSelfSubmittingDialogClose = typeof handleSelfSubmittingDialogClose === 'function' ? handleSelfSubmittingDialogClose : () => { console.warn("handleSelfSubmittingDialogClose is not a function or is undefined."); };


  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));
  
  // Prevent view change from triggering unnecessary re-fetches
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  // Use useCallback to prevent unnecessary re-renders that could trigger API calls
  const resetFiltersAndSort = useCallback(() => {
    safeHandleFilterChange(null, entityConfig.initialFilters); // Resets all filters
    safeHandleSortChange(entityConfig.initialSort); // Resets sort to initial
    safeSetIsSelectionModeActive(false); // Also cancel selection mode
    safeSetSelectedItems([]);
  }, [safeHandleFilterChange, safeHandleSortChange, entityConfig.initialFilters, entityConfig.initialSort, safeSetIsSelectionModeActive, safeSetSelectedItems]);

  // Use useCallback to prevent unnecessary re-renders
  const handleEditWithSelectionCheck = useCallback(() => {
    if (!selectedItems || !Array.isArray(selectedItems)) {
      console.warn('selectedItems is not properly defined or not an array.');
      return;
    }

    if (selectedItems.length === 1) {
      // Find from the full (filtered & sorted, but not paginated) list or paginated list
      const itemToEdit = filteredAndSortedItems?.find(item => item.id === selectedItems[0]) || medicalCodes?.find(item => item.id === selectedItems[0]);
      if (itemToEdit) {
        safeHandleEdit(itemToEdit);
      } else if (toast) {
        toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
      }
    } else if (selectedItems.length === 0) {
      // If nothing selected, enable selection mode and prompt
      safeSetIsSelectionModeActive(true);
      if (toast) {
        toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit')}), variant: "info" });
      }
    } else {
      if (toast) {
        toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
      }
    }
  }, [selectedItems, safeHandleEdit, safeSetIsSelectionModeActive, t, toast, filteredAndSortedItems, medicalCodes, entityConfig.entityName]);

  // Use useCallback to prevent unnecessary re-renders
  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      safeSetIsSelectionModeActive(true);
      if (toast) {
        toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete')}), variant: "info" });
      }
      return;
    }
    if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural }))) {
      safeHandleBulkDelete(selectedItems); // handleBulkDelete is from useEntityModule
    }
  }, [selectedItems, safeHandleBulkDelete, safeSetIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);

  // Use useCallback to prevent unnecessary re-renders
  const handleCancelSelectionMode = useCallback(() => {
    safeSetIsSelectionModeActive(false);
    safeSetSelectedItems([]);
  }, [safeSetIsSelectionModeActive, safeSetSelectedItems]);

  // Memoize the global actions config to prevent unnecessary re-renders
  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'medicalCodes.addNewCode', defaultLabel: 'Add New Code', icon: Plus, action: safeHandleAddNew, type: 'add'}, // safeHandleAddNew from useEntityModule
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Codes', icon: UploadCloud, action: () => toast && toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import') }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export Codes', icon: DownloadCloud, action: () => toast && toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [safeHandleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);
  
  // Use useCallback to prevent unnecessary re-renders
  const handleDialogCloseWrapper = useCallback((refreshNeeded, actionType = null, entityNameParam = '') => {
    // Use entityName from entityConfig if param is empty
    const effectiveEntityName = entityNameParam || entityConfig.entityName;
    safeHandleSelfSubmittingDialogClose(refreshNeeded, actionType, effectiveEntityName); // from useEntityModule
  }, [safeHandleSelfSubmittingDialogClose, entityConfig.entityName]);

  // Memoize table columns to prevent unnecessary re-renders
  const medicalCodeTableColumns = useMemo(() => [
    { accessorKey: 'code', header: t('medicalCodes.fields.code'), enableSorting: true },
    { accessorKey: 'code_system', header: t('medicalCodes.fields.codeSystem'), enableSorting: true, cell: ({row}) => t(`codeSystems.${row.original.code_system}`, {defaultValue: row.original.code_system}) },
    { 
      accessorKey: language === 'he' ? 'description_he' : 'description_en', 
      id: 'description', // Stable ID for sorting
      header: t('medicalCodes.fields.description'), 
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'description', language, 'en', t('common.notSet'))
    },
    { 
      accessorKey: 'status', 
      header: t('medicalCodes.fields.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} statusTypes={{ active: {label: 'Active', variant: 'success'}, deprecated: {label: 'Deprecated', variant: 'outline'}}} />,
      enableSorting: true
    },
    { 
      accessorKey: 'catalog_path', 
      header: t('medicalCodes.fields.catalogPath'), 
      enableSorting: true,
      cell: ({ row }) => row.original.catalog_path || t('common.notSet')
    },
    { 
      accessorKey: 'tags', 
      header: t('medicalCodes.fields.tags'),
      cell: ({ row }) => Array.isArray(row.original.tags) && row.original.tags.length > 0 
                        ? <div className="flex flex-wrap gap-1">{row.original.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div>
                        : t('common.notSet'),
      enableSorting: false
    },
    { 
      accessorKey: 'updated_date', 
      header: t('fields.lastUpdated'),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true
    },
  ], [t, language]);

  // Memoize the sort value to prevent unnecessary re-calculations
  const currentSortOptionValue = useMemo(() => {
    if (!sortConfig || sortConfig.length === 0) {
        // If sortConfig is empty, return the initial sort value
        const initialSortField = entityConfig.initialSort[0].id;
        const initialSortDesc = entityConfig.initialSort[0].desc;
        return initialSortDesc ? `-${initialSortField}` : initialSortField;
    }
    const currentSort = sortConfig[0];
    return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
  }, [sortConfig, entityConfig.initialSort]);

  // Use useCallback to prevent unnecessary re-renders
  const handleSortFilterChange = useCallback((value) => {
    const isDesc = value.startsWith('-');
    const field = isDesc ? value.substring(1) : value;
    safeHandleSortChange([{ id: field, desc: isDesc }]);
  }, [safeHandleSortChange]);


  const renderContent = () => {
    if (loading && medicalCodes.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    if (error && medicalCodes.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={safeHandleRefresh} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.values(filters || {}).every(val =>
      !val || (typeof val === 'string' && (val === '' || val === 'all')) || (Array.isArray(val) && val.length === 0)
    );

    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={Code}
              title={t('medicalCodes.emptyState.noCodesTitle', {defaultValue: "No Medical Codes Found"})}
              description={t('medicalCodes.emptyState.noCodesDesc', {defaultValue: "It looks like you haven't added any medical codes yet. Get started by adding a new one!"})}
              actionButton={<Button onClick={safeHandleAddNew} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"><Plus className="mr-2 h-4 w-4" />{t('medicalCodes.addNewCode')}</Button>}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('medicalCodes.emptyState.noCodesMatchTitle', {defaultValue: "No Matching Medical Codes"})}
              description={t('medicalCodes.emptyState.noCodesMatchDesc', {defaultValue: "Try adjusting your filters or search terms."})}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {medicalCodes.map(code => (
                <MedicalCodeCard 
                  key={code.id} 
                  codeItem={code} 
                  onEdit={safeHandleEdit ? () => safeHandleEdit(code) : undefined} 
                  language={language}
                  isRTL={isRTL}
                  currentLocale={currentLocale}
                  t={t}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(code.id)}
                  onToggleSelection={safeHandleToggleSelection ? () => safeHandleToggleSelection(code.id) : undefined}
                />
              ))}
            </div>
          )}
           {pagination.totalPages > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => safeHandlePageChange(pagination.currentPage - 2)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: pagination.totalPages })}
              </span>
              <Button variant="outline" size="sm" onClick={() => safeHandlePageChange(pagination.currentPage)} disabled={pagination.currentPage >= pagination.totalPages || loading}>
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      );
    }
    
    if (currentView === 'table') {
        return (
            <DataTable
                columns={medicalCodeTableColumns}
                data={medicalCodes} // paginatedItems
                loading={loading}
                error={error}
                onRetry={safeHandleRefresh}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('medicalCodes.emptyState.noCodesDesc') : t('medicalCodes.emptyState.noCodesMatchDesc')}
                onRowClick={safeHandleEdit ? (row) => safeHandleEdit(row.original) : undefined}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={safeHandleToggleSelection}
                onSelectAllRows={safeHandleSelectAll ? () => safeHandleSelectAll(medicalCodes.map(c => c.id)) : undefined} // Ensure handleSelectAll from useEntityModule is used
                currentSort={sortConfig}
                onSortChange={safeHandleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: pagination.totalPages,
                }}
                onPageChange={(pageIndex) => safeHandlePageChange(pageIndex)} // DataTable expects 0-based pageIndex
                onPageSizeChange={safeHandlePageSizeChange}
                t={t}
            />
        );
    }
    return null;
  };

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Code className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('medicalCodes.listTitle', { defaultValue: "Medical Codes" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading && pagination.totalCount === undefined ? t('common.loadingEllipsis', {defaultValue: "..."}) : pagination.totalCount || 0})
          </span>
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                isSelectionModeActive={isSelectionModeActive || false}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems?.length || 0}
                itemTypeForActions={entityConfig.entityName}
                t={t} isRTL={isRTL}
              />
          <Button onClick={safeHandleRefresh} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { 
              setCurrentView(view); 
              saveToStorage(entityConfig.storageKey + '_viewPreference', view); 
              handleCancelSelectionMode(); 
            }}
            availableViews={['card', 'table']}
            entityName={t('medicalCodes.entityNamePlural')}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>
      
      <MedicalCodeFilters 
        filters={filters || {}} 
        onFiltersChange={safeHandleFilterChange}
        onResetFilters={resetFiltersAndSort}
        sortOptionValue={currentSortOptionValue}
        onSortOptionChange={handleSortFilterChange}
        sortOptions={sortOptionsConfig(t)}
        codeSystemOptions={codeSystemFilterOptions(t)}
        statusOptions={statusFilterOptions(t)}
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      />

      {error && medicalCodes.length > 0 && ( // Show only if there's already some data but an update failed
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && entityConfig.DialogComponent && (
        <entityConfig.DialogComponent
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleDialogCloseWrapper(refresh, actionType, itemName)}
          codeItem={currentItem} // currentItem from useEntityModule
        />
      )}
    </div>
  );
}
