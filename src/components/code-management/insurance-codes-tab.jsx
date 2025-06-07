
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InsuranceCode } from '@/api/entities';
import InsuranceCodeDialog from './insurance-code-dialog';
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
import { Plus, Search, RefreshCw, FilterX, AlertTriangle, Pencil, Shield, CheckCircle2, FileText, UploadCloud, DownloadCloud, Edit, Trash2, SearchX } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import StatusBadge from '@/components/common/StatusBadge';
import { DataTable } from '@/components/ui/data-table'; 
import InsuranceCodeCard from './InsuranceCodeCard';
import InsuranceCodeFilters from './InsuranceCodeFilters';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';
import ErrorDisplay from '@/components/common/ErrorDisplay';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const booleanFilterOptions = (t, fieldNameKey, trueLabelKey, falseLabelKey) => [
  { value: 'all', label: t(`filters.all${fieldNameKey.charAt(0).toUpperCase() + fieldNameKey.slice(1)}`, { defaultValue: `All (${t(fieldNameKey)})` }) },
  { value: 'true', label: t(trueLabelKey, { defaultValue: `${t(fieldNameKey)}: Yes` }) },
  { value: 'false', label: t(falseLabelKey, { defaultValue: `${t(fieldNameKey)}: No` }) },
];

const sortOptionsConfig = (t, language) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'code', label: t('sortOptions.code', { defaultValue: 'Code' }) },
    { value: language === 'he' ? 'name_he' : 'name_en', label: t('sortOptions.name', { defaultValue: 'Name' }) },
    { value: 'category_path', label: t('sortOptions.categoryPath', { defaultValue: 'Category Path' }) },
    { value: 'requires_preauthorization', label: t('sortOptions.requiresPreAuth', { defaultValue: 'Requires Pre-Auth' }) },
    { value: 'is_active', label: t('sortOptions.status', { defaultValue: 'Status' }) },
];

export default function InsuranceCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: InsuranceCode,
    entityName: t('insuranceCodes.entityNameSingular', { defaultValue: 'Insurance Code' }),
    entityNamePlural: t('insuranceCodes.titleMultiple', { defaultValue: 'Insurance Codes' }),
    DialogComponent: InsuranceCodeDialog,
    initialSort: [{ id: 'code', desc: false }], // useEntityModule expects {id, desc}
    initialFilters: {
      searchTerm: '',
      requiresPreauthorization: 'all',
      isActive: 'all',
      categoryPathQuery: '',
    },
    searchFields: ['code', 'name_en', 'name_he', 'category_path'],
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase();
        if (term) {
            const nameEn = item.name_en?.toLowerCase() || '';
            const nameHe = item.name_he?.toLowerCase() || '';
            if (!(item.code?.toLowerCase().includes(term) || nameEn.includes(term) || nameHe.includes(term))) return false;
        }
        if (filters.requiresPreauthorization !== 'all' && String(item.requires_preauthorization) !== filters.requiresPreauthorization) return false;
        if (filters.isActive !== 'all' && String(item.is_active) !== filters.isActive) return false;
        if (filters.categoryPathQuery) {
            const lowerCategoryPathQuery = filters.categoryPathQuery.toLowerCase();
            if (!item.category_path?.toLowerCase().includes(lowerCategoryPathQuery)) return false;
        }
        return true;
    },
    storageKey: 'insuranceCodesView',
  }), [t, language]); // Added language as a dependency

  const {
    items: insuranceCodes, 
    loading, error, filters,
    sortConfig, // This is an array: [{id: 'field', desc: boolean}] from useEntityModule
    pagination,
    selectedItems, setSelectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshInsuranceCodes,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, 
  } = useEntityModule(entityConfig) || { // Added fallback for destructuring robustness
    items: [], loading: false, error: null, filters: entityConfig.initialFilters, sortConfig: entityConfig.initialSort,
    pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 1, pageIndex: 0 },
    selectedItems: [], setSelectedItems: () => {},
    isDialogOpen: false, currentItem: null,
    handleRefresh: () => {}, handleFilterChange: () => {}, handleSortChange: () => {}, handlePageChange: () => {}, handlePageSizeChange: () => {},
    handleAddNew: () => {}, handleEdit: () => {}, handleBulkDelete: async () => ({successCount: 0, failCount: 0}),
    isSelectionModeActive: false, setIsSelectionModeActive: () => {},
    handleToggleSelection: () => {}, handleSelectAll: () => {}, handleSelfSubmittingDialogClose: () => {},
    filteredAndSortedItems: [],
  };
  
  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const resetFiltersAndSort = useCallback(() => {
    handleFilterChange(null, entityConfig.initialFilters);
    handleSortChange(entityConfig.initialSort);
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, setIsSelectionModeActive, setSelectedItems]);


  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(item => item.id === selectedItems[0]) || insuranceCodes.find(item => item.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle', { defaultValue: 'Item not found' }), description: t('errors.itemNotFoundToEditDesc', { defaultValue: 'The selected item could not be found for editing.' }), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit', { defaultValue: 'Edit' })}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit', { defaultValue: 'Edit' })}), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', { defaultValue: 'Select only one item to edit' }), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName, defaultValue: 'Please select only one {{entity}} to edit.' }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, insuranceCodes, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural, defaultValue: 'Are you sure you want to delete {{count}} {{item}}?' }))) {
        handleBulkDelete(selectedItems);
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete', { defaultValue: 'Delete' })}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete', { defaultValue: 'Delete' })}), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'insuranceCodes.addNewCode', defaultLabel: 'Add New Code', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Codes', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon!' }), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import', { defaultValue: 'Import' }), defaultValue: 'The {{featureName}} feature is under development.' }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export Codes', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon!' }), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export', { defaultValue: 'Export' }), defaultValue: 'The {{featureName}} feature is under development.' }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const insuranceCodeTableColumns = useMemo(() => [
    { accessorKey: 'code', header: t('insuranceCodes.fields.code', { defaultValue: 'Code' }), enableSorting: true },
    {
      accessorKey: language === 'he' ? 'name_he' : 'name_en',
      header: t('insuranceCodes.fields.name', { defaultValue: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'name', language, 'en', t('common.notSet', { defaultValue: 'N/A' }))
    },
    {
      accessorKey: 'category_path',
      header: t('insuranceCodes.fields.categoryPath', { defaultValue: 'Category Path' }),
      enableSorting: true,
      cell: ({ row }) => row.original.category_path || t('common.notSet', { defaultValue: 'N/A' })
    },
    {
      accessorKey: 'requires_preauthorization',
      header: t('insuranceCodes.fields.requiresPreAuthShort', { defaultValue: 'Pre-Auth' }),
      cell: ({ row }) => (
        row.original.requires_preauthorization ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })
      ),
      enableSorting: true
    },
    {
      accessorKey: 'is_active',
      header: t('insuranceCodes.fields.isActiveShort', { defaultValue: 'Status' }),
      cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} t={t} />,
      enableSorting: true
    },
    {
      accessorKey: 'updated_date',
      header: t('fields.lastUpdated', { defaultValue: 'Last Updated' }),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true
    },
  ], [t, language]);

  const currentSortOptionValue = useMemo(() => {
    if (!sortConfig || !Array.isArray(sortConfig) || sortConfig.length === 0 || !sortConfig[0] || !sortConfig[0].id) {
      // Fallback to initialSort if sortConfig is not properly formed
      const initialSortItem = entityConfig.initialSort[0];
      if (initialSortItem && initialSortItem.id) {
        return initialSortItem.desc ? `-${initialSortItem.id}` : initialSortItem.id;
      }
      return '-updated_date'; // Ultimate fallback
    }
    const currentSort = sortConfig[0];
    return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
  }, [sortConfig, entityConfig.initialSort]);
  
  const cardViewSortConfig = useMemo(() => {
    if (Array.isArray(sortConfig) && sortConfig.length > 0 && sortConfig[0] && typeof sortConfig[0].id === 'string') {
      return {
        key: sortConfig[0].id,
        direction: sortConfig[0].desc ? 'descending' : 'ascending'
      };
    }
    // Fallback if sortConfig from useEntityModule is not in the expected array format or is empty
    const initialSortItem = entityConfig.initialSort[0];
    if (initialSortItem && initialSortItem.id) {
        return { key: initialSortItem.id, direction: initialSortItem.desc ? 'descending' : 'ascending' };
    }
    return { key: 'updated_date', direction: 'descending' }; // Default sort for card view filter
  }, [sortConfig, entityConfig.initialSort]);

  const handleSortFilterChange = (value) => {
    const isDesc = value.startsWith('-');
    const field = isDesc ? value.substring(1) : value;
    // Ensure handleSortChange is called with the array format useEntityModule expects
    handleSortChange([{ id: field, desc: isDesc }]);
  };


  const renderContent = () => {
    if (loading && insuranceCodes.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural, defaultValue: 'Loading insurance codes...' })} isFullScreen={false} />;
    }
    if (error && insuranceCodes.length === 0) {
      return null;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => !val || val === 'all');

    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={Shield} 
              title={t('insuranceCodes.emptyState.noCodesTitle', { defaultValue: 'No Insurance Codes Yet' })}
              description={t('insuranceCodes.emptyState.noCodesDesc', { defaultValue: 'Get started by adding a new insurance code.' })}
              actionButton={<Button onClick={() => handleAddNew()} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"><Plus className="mr-2 h-4 w-4" />{t('insuranceCodes.addNewCode', { defaultValue: 'Add New Code' })}</Button>}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('insuranceCodes.emptyState.noCodesMatchTitle', { defaultValue: 'No Insurance Codes Match Filters' })}
              description={t('insuranceCodes.emptyState.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {insuranceCodes.map(code => (
                <InsuranceCodeCard
                  key={code.id}
                  codeItem={code}
                  onEdit={() => handleEdit(code)}
                  language={language}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(code.id)}
                  onToggleSelection={() => handleToggleSelection(code.id)}
                />
              ))}
            </div>
          )}
           {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1, defaultValue: 'Page {{page}} of {{totalPages}}' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}>
                {t('buttons.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          )}
        </>
      );
    }

    if (currentView === 'table') {
        return (
            <DataTable
                columns={insuranceCodeTableColumns}
                data={insuranceCodes}
                loading={loading}
                error={error}
                onRetry={refreshInsuranceCodes}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('insuranceCodes.emptyState.noCodesDesc', { defaultValue: 'Get started by adding a new insurance code.' }) : t('insuranceCodes.emptyState.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })}
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => handleSelectAll(insuranceCodes.map(c => c.id))}
                currentSort={sortConfig}
                onSortChange={handleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
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
          <Shield className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} /> 
          {t('insuranceCodes.listTitle', { defaultValue: "Insurance Codes" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading ? t('common.loadingEllipsis', { defaultValue: "..." }) : pagination.totalCount || 0})
          </span>
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={entityConfig.entityName}
                t={t} isRTL={isRTL}
              />
          <Button onClick={refreshInsuranceCodes} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['card', 'table']}
            entityName={t('insuranceCodes.entityNamePlural', { defaultValue: 'Insurance Codes' })}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>

      <InsuranceCodeFilters
        filters={filters || entityConfig.initialFilters} 
        onFiltersChange={handleFilterChange || (() => {})} 
        onResetFilters={resetFiltersAndSort || (() => {})} 
        // Pass the derived cardViewSortConfig for the 'card' view scenario
        sortConfig={cardViewSortConfig}
        onSortChange={(newSort) => { 
            if (newSort && newSort.key) {
                 handleSortChange([{ id: newSort.key, desc: newSort.direction === 'descending' }]);
            }
        }}
        currentView={currentView} 
        sortOptionValue={currentSortOptionValue}
        onSortOptionChange={handleSortFilterChange} 
        sortOptions={sortOptionsConfig(t, language)}
        preAuthOptions={booleanFilterOptions(t, 'requiresPreAuth', 'filters.requiresPreAuthTrue', 'filters.requiresPreAuthFalse')}
        statusOptions={booleanFilterOptions(t, 'isActive', 'filters.isActiveTrue', 'filters.isActiveFalse')}
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      />

      {error && insuranceCodes.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error), defaultValue: 'Some items could not be loaded due to an error: {{message}}' })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <InsuranceCodeDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          codeItem={currentItem}
        />
      )}
    </div>
  );
}
