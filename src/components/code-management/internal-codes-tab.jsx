
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InternalCode } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook'; // Corrected path
import { useToast } from "@/components/ui/use-toast";
import { useEntityModule } from '@/components/hooks/useEntityModule'; // Corrected path
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
// Updated Lucide icons based on outline's usage, ensuring all used icons are present
import {
  Plus, Edit, Trash2, UploadCloud, DownloadCloud, RefreshCw, FileSignature, AlertTriangle, XCircle, CheckCircle2,
  Search, FilterX, Pencil, ListOrdered, Tag, SearchX // Added new icons from outline
} from 'lucide-react';
import InternalCodeCard from './InternalCodeCard'; // Card component for internal codes
import InternalCodeFilters from './InternalCodeFilters'; // Filters specific to internal codes
import InternalCodeDialog from './internal-code-dialog'; // Dialog for add/edit
import LoadingSpinner from '@/components/ui/loading-spinner'; // Keep existing import
import EmptyState from '@/components/ui/empty-state'; // Keep existing import
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table'; // Fixed import path
import { Badge } from '@/components/ui/badge';
import { enUS, he } from 'date-fns/locale';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import StatusBadge from '@/components/common/StatusBadge'; // Reusable status badge
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils'; // New utility imports
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // New UI imports
import { Input } from '@/components/ui/input'; // New UI imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // New UI imports
import { Label } from '@/components/ui/label'; // New UI imports

// Helper for date formatting - keeping local for now as per outline
const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Reusable filter options for boolean fields
const booleanFilterOptions = (t, fieldNameKey, trueLabelKey, falseLabelKey) => [
  { value: 'all', label: t(`filters.all${fieldNameKey.charAt(0).toUpperCase() + fieldNameKey.slice(1)}`, { defaultValue: `All (${t(fieldNameKey)})` }) },
  { value: 'true', label: t(trueLabelKey, { defaultValue: `${t(fieldNameKey)}: Yes` }) },
  { value: 'false', label: t(falseLabelKey, { defaultValue: `${t(fieldNameKey)}: No` }) },
];

const sortOptionsConfig = (t) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'code_number', label: t('sortOptions.codeNumber', { defaultValue: 'Code Number' }) },
    { value: 'description_en', label: t('sortOptions.descriptionEn', { defaultValue: 'Description (EN)' }) },
    { value: 'description_he', label: t('sortOptions.descriptionHe', { defaultValue: 'Description (HE)' }) },
    { value: 'category_path', label: t('sortOptions.categoryPath', { defaultValue: 'Category Path' }) },
    { value: 'is_billable', label: t('sortOptions.billable', { defaultValue: 'Billable' }) },
    { value: 'is_active', label: t('sortOptions.status', { defaultValue: 'Status' }) },
];

// Simple ErrorDisplay component (kept from original, as not explicitly modified in outline)
const ErrorDisplay = ({ errorMessage, onRetry }) => {
    const { t } = useLanguageHook();
    const { isRTL } = useLanguageHook();
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
            <Button onClick={onRetry} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('buttons.retry')}
            </Button>
        </div>
    );
};

export default function InternalCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  // const currentLocale = getLocaleObject(language); // Not used directly after removing internal StatusBadge

  const entityConfig = useMemo(() => ({
    entitySDK: InternalCode,
    entityName: t('internalCodes.entityNameSingular', { defaultValue: 'Internal Code' }), // Updated key
    entityNamePlural: t('internalCodes.titleMultiple', { defaultValue: 'Internal Codes' }),
    DialogComponent: InternalCodeDialog,
    initialSort: [{ id: 'code_number', desc: false }], // Changed initial sort field and direction
    initialFilters: {
      searchTerm: '',
      isBillable: 'all',
      isActive: 'all',
      tagsQuery: '',
      categoryPathQuery: '',
    },
    searchFields: ['code_number', 'description_en', 'description_he', 'category_path', 'tags'], // Added 'tags'
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase();
        if (term) {
            const codeNumber = item.code_number?.toLowerCase() || '';
            const descEn = item.description_en?.toLowerCase() || '';
            const descHe = item.description_he?.toLowerCase() || '';
            const categoryPath = item.category_path?.toLowerCase() || '';
            const tagsMatch = Array.isArray(item.tags) && item.tags.some(tag => tag?.toLowerCase().includes(term));

            if (!(codeNumber.includes(term) || descEn.includes(term) || descHe.includes(term) || categoryPath.includes(term) || tagsMatch)) {
                return false;
            }
        }
        if (filters.isBillable !== 'all' && String(item.is_billable) !== filters.isBillable) return false;
        if (filters.isActive !== 'all' && String(item.is_active) !== filters.isActive) return false;
        if (filters.tagsQuery) {
            const lowerTagsQuery = filters.tagsQuery.toLowerCase();
            if (!Array.isArray(item.tags) || !item.tags.some(tag => tag?.toLowerCase().includes(lowerTagsQuery))) {
                return false;
            }
        }
        if (filters.categoryPathQuery) {
            const lowerCategoryPathQuery = filters.categoryPathQuery.toLowerCase();
            if (!item.category_path?.toLowerCase().includes(lowerCategoryPathQuery)) {
                return false;
            }
        }
        return true;
    },
    storageKey: 'internalCodesView',
  }), [t]);

  const {
    items: internalCodes, // This now holds the filtered and paginated data
    loading, error, filters, sortConfig, pagination, selectedItems, setSelectedItems, // setSelectedItems added for explicit clear
    isDialogOpen, currentItem,
    handleRefresh: refreshInternalCodes,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // All items after filtering and sorting (used for edit check)
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card')); // Updated storage key

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView); // Updated storage key
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const resetFiltersAndSort = useCallback(() => {
    handleFilterChange(null, entityConfig.initialFilters);
    handleSortChange(entityConfig.initialSort);
    setIsSelectionModeActive(false);
    setSelectedItems([]); // Explicitly clear selected items
  }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, setIsSelectionModeActive, setSelectedItems]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(item => item.id === selectedItems[0]) || internalCodes.find(item => item.id === selectedItems[0]); // Check filtered/sorted first
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
    } else if (selectedItems.length === 0) {
        setIsSelectionModeActive(true);
        toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit')}), variant: "info" });
    } else {
        toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, internalCodes, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
        if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural }))) {
            handleBulkDelete(selectedItems);
        }
    } else {
        setIsSelectionModeActive(true);
        toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete')}), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]); // Explicitly clear selected items
  }, [setIsSelectionModeActive, setSelectedItems]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'internalCodes.addNewCode', defaultLabel: 'Add New Code', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Codes', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import') }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export Codes', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  // Wrapper for self-submitting dialog close
  const handleDialogCloseWrapper = useCallback((refreshNeeded, actionType = null, entityName = '') => {
    handleSelfSubmittingDialogClose(refreshNeeded, actionType, entityName);
  }, [handleSelfSubmittingDialogClose]);

  const internalCodeTableColumns = useMemo(() => [
    { accessorKey: 'code_number', header: t('internalCodes.fields.codeNumber'), enableSorting: true },
    {
      accessorKey: language === 'he' ? 'description_he' : 'description_en',
      header: t('internalCodes.fields.description'),
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'description', language, 'en', t('common.notSet'))
    },
    {
      accessorKey: 'category_path',
      header: t('internalCodes.fields.categoryPath'),
      enableSorting: true,
      cell: ({ row }) => row.original.category_path || t('common.notSet')
    },
    {
      accessorKey: 'is_billable',
      header: t('internalCodes.fields.isBillableShort.title', {defaultValue: "Billable"}),
      cell: ({ row }) => row.original.is_billable ? t('internalCodes.fields.isBillableShort.true') : t('internalCodes.fields.isBillableShort.false'),
      enableSorting: true
    },
    {
      accessorKey: 'is_active',
      header: t('internalCodes.fields.isActiveShort.title', {defaultValue: "Status"}),
      cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} t={t} />,
      enableSorting: true
    },
    {
      accessorKey: 'tags',
      header: t('internalCodes.fields.tags'),
      cell: ({ row }) => Array.isArray(row.original.tags) && row.original.tags.length > 0
                        ? row.original.tags.map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1 text-xs">{tag}</Badge>)
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

  const currentSortOptionValue = useMemo(() => {
    if (!sortConfig || sortConfig.length === 0) return `-${entityConfig.initialSort[0].id}`;
    const currentSort = sortConfig[0];
    return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
  }, [sortConfig, entityConfig.initialSort]);

  const handleSortFilterChange = (value) => {
    const isDesc = value.startsWith('-');
    const field = isDesc ? value.substring(1) : value;
    handleSortChange([{ id: field, desc: isDesc }]);
  };

  const renderContent = () => {
    if (loading && internalCodes.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    if (error && internalCodes.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshInternalCodes} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => {
      // Exclude pagination related keys and check for empty/default filter values
      if (['page', 'pageSize'].includes(key)) return true;
      return !val || (typeof val === 'string' && (val === '' || val === 'all')) || (Array.isArray(val) && val.length === 0);
    });


    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={ListOrdered} // Changed icon
              title={t('internalCodes.emptyState.noCodesTitle')} // Updated key
              description={t('internalCodes.emptyState.noCodesDesc')} // Updated key
              actionButton={<Button onClick={() => handleAddNew()} className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"><Plus className="mr-2 h-4 w-4" />{t('internalCodes.addNewCode')}</Button>} // Updated text
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX} // Changed icon
              title={t('internalCodes.emptyState.noCodesMatchTitle')} // Updated key
              description={t('internalCodes.emptyState.noCodesMatchDesc')} // Updated key
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {internalCodes.map(code => (
                <InternalCodeCard
                  key={code.id}
                  codeItem={code} // Changed prop name to codeItem
                  onEdit={() => handleEdit(code)} // Changed prop name to onEdit
                  language={language}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(code.id)}
                  onToggleSelection={() => handleToggleSelection(code.id)}
                />
              ))}
            </div>
          )}
           {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && ( // Using totalPages derived from totalCount and pageSize
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1 })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}
              >
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
                columns={internalCodeTableColumns}
                data={internalCodes} // Data is already filtered and paginated by useEntityModule
                loading={loading}
                error={error}
                onRetry={refreshInternalCodes}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied
                  ? t('internalCodes.emptyState.noCodesDesc') // Updated key
                  : t('internalCodes.emptyState.noCodesMatchDesc') // Updated key
                }
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection} // Pass the handler directly
                onSelectAllRows={() => handleSelectAll(internalCodes.map(c => c.id))} // Pass the handler with visible items
                currentSort={sortConfig} // sortConfig from useEntityModule is an array [{id, desc}]
                onSortChange={handleSortChange}
                pagination={{ // Pass pagination object directly
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
          <ListOrdered className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('internalCodes.listTitle', { defaultValue: "Internal Codes" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading && pagination.totalCount === 0 ? t('common.loadingEllipsis') : pagination.totalCount || 0})
          </span>
        </h3>
        <div className="flex items-center gap-2">
             <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={entityConfig.entityName}
                t={t} isRTL={isRTL} // Added isRTL
              />
          <Button onClick={refreshInternalCodes} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }} // Updated storage key
            availableViews={['card', 'table']} // Explicitly define available views
            entityName={t('internalCodes.titleMultiple')} // Updated key
            t={t} isRTL={isRTL} // Added isRTL
          />
        </div>
      </div>

      {isSelectionModeActive && (
        <div className="sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="selectAllVisibleInternalCodes"
                checked={selectedItems.length > 0 && internalCodes.every(item => selectedItems.includes(item.id))} // Check if all visible items are selected
                onCheckedChange={() => handleSelectAll(internalCodes.map(item => item.id))} // Select all visible items
                aria-label={t('bulkActions.selectAllVisible')}
                disabled={internalCodes.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleInternalCodes" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItems.length > 0
                    ? t('bulkActions.selectedCount', { count: selectedItems.length })
                    : t('bulkActions.selectItemsPromptShort', { mode: t('common.action') })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelSelectionMode} className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} /> {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={selectedItems.length === 1 ? handleEditWithSelectionCheck : handleDeleteWithSelectionCheck}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItems.length === 0}
              >
                {selectedItems.length === 1 ? t('common.edit') : t('common.delete')} {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      <InternalCodeFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort} // Changed to new reset function
        sortOptionValue={currentSortOptionValue} // New prop for sort select value
        onSortOptionChange={handleSortFilterChange} // New prop for sort select handler
        sortOptions={sortOptionsConfig(t)} // New prop for sort options
        billableOptions={booleanFilterOptions(t, 'isBillable', 'internalCodes.filters.isBillableTrue', 'internalCodes.filters.isBillableFalse')} // New prop for billable options
        statusOptions={booleanFilterOptions(t, 'isActive', 'internalCodes.filters.isActiveTrue', 'internalCodes.filters.isActiveFalse')} // New prop for status options
        t={t} language={language} isRTL={isRTL}
        loading={loading} // New prop
      />

      {error && internalCodes.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <InternalCodeDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleDialogCloseWrapper(refresh, actionType, itemName)} // Using wrapper
          codeItem={currentItem} // Changed prop name to codeItem
          t={t} language={language} isRTL={isRTL} // Added t, language, isRTL props
        />
      )}
    </div>
  );
}
