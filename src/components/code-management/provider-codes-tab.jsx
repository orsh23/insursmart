
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { ProviderInternalCode } from '@/api/entities';
import { Provider } from '@/api/entities';
import { CodeCatalog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileCode2, Tag, FolderTree, Edit, Trash2, UploadCloud, DownloadCloud } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ProviderCodeDialog from './provider-code-dialog';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

import { useEntityModule } from '@/components/hooks/useEntityModule';
import ProviderCodeCard from './ProviderCodeCard';
import ProviderCodeFilters from './ProviderCodeFilters';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import DataTable from '@/components/common/DataTable'; // Assuming this component exists

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Helper functions for local storage
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

export default function ProviderCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [providersData, setProvidersData] = useState([]);
  const [providerMap, setProviderMap] = useState(new Map());

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providerData = await Provider.list();
        if (Array.isArray(providerData)) {
          setProvidersData(providerData);
          const newMap = new Map();
          providerData.forEach(p => newMap.set(p.id, p.name?.[language] || p.name?.en || p.id));
          setProviderMap(newMap);
        } else {
          setProvidersData([]);
          setProviderMap(new Map());
        }
      } catch (err) {
        console.error("Failed to fetch providers for Provider Codes tab:", err);
        toast({
          title: t('errors.fetchFailed', { entity: t('providers.titlePlural', { defaultValue: 'Providers' }) }),
          description: err.message,
          variant: 'destructive',
        });
      }
    };
    fetchProviders();
  }, [language, t, toast]);

  const entityConfig = useMemo(() => ({
    entitySDK: ProviderInternalCode,
    entityName: t('providerCodes.itemTitleSingular'),
    entityNamePlural: t('providerCodes.itemTitlePlural'),
    DialogComponent: ProviderCodeDialog,
    FormComponent: null,
    initialSort: { field: 'updated_date', direction: 'desc' },
    initialFilters: {
      searchTerm: '',
      providerId: 'all',
      status: 'all',
      tagsQuery: '',
      categoryPathQuery: '',
    },
    // formHook is intentionally omitted since DialogComponent handles its own state & submission
    filterFields: [
      { name: 'searchTerm', type: 'text', placeholder: t('search.placeholderProviderCodes', { defaultValue: 'Search code, desc, provider...' }) },
      { name: 'providerId', type: 'select', placeholder: t('filters.selectProvider', { defaultValue: "Select Provider" }) },
      { name: 'categoryPathQuery', type: 'text', placeholder: t('filters.filterByCategoryPath', { defaultValue: 'Filter by Category Path' }) },
      { name: 'tagsQuery', type: 'text', placeholder: t('filters.filterByTags', { defaultValue: 'Filter by Tags' }) },
      { name: 'status', type: 'select', placeholder: t('filters.selectStatus', { defaultValue: "Select Status" }) },
    ],
    searchFields: ['code_number', 'description_en', 'description_he'],
    getFormValues: (data) => ({
      id: data.id || undefined,
      provider_id: data.provider_id || '',
      code_number: data.code_number || '',
      description_en: data.description_en || '',
      description_he: data.description_he || '',
      category_id: data.category_id || null,
      category_path: data.category_path || '',
      tags: data.tags || [],
      status: data.status === undefined ? true : Boolean(data.status), // Default to true if not set
    }),
    filterFunction: (sourceItems, filters) => { // Modified to accept sourceItems and return filtered array
      if (!Array.isArray(sourceItems)) return []; // Guard clause

      return sourceItems.filter(item => {
        const lowerSearchTerm = filters.searchTerm?.toLowerCase() || '';
        const lowerProviderName = providerMap.get(item.provider_id)?.toLowerCase();

        // Search term filter
        if (lowerSearchTerm && !(
            (item.code_number && String(item.code_number).toLowerCase().includes(lowerSearchTerm)) ||
            (item.description_en && item.description_en.toLowerCase().includes(lowerSearchTerm)) ||
            (item.description_he && item.description_he.toLowerCase().includes(lowerSearchTerm)) ||
            (Array.isArray(item.tags) && item.tags.some(tag => tag && String(tag).toLowerCase().includes(lowerSearchTerm))) ||
            (lowerProviderName && lowerProviderName.includes(lowerSearchTerm))
        )) {
            return false;
        }

        // Provider ID filter
        if (filters.providerId && filters.providerId !== 'all' && item.provider_id !== filters.providerId) {
            return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all') {
            const isActiveFilter = filters.status === 'true' || filters.status === 'active';
            const itemStatus = item.status === true || item.status === 'active';
            if (itemStatus !== isActiveFilter) {
                return false;
            }
        }

        // Tags query filter
        if (filters.tagsQuery) {
            const lowerTagsSearch = filters.tagsQuery.toLowerCase();
            if (!(Array.isArray(item.tags) && item.tags.some(tag => tag && String(tag).toLowerCase().includes(lowerTagsSearch)))) {
                return false;
            }
        }

        // Category Path query filter
        if (filters.categoryPathQuery) {
            const lowerCategoryPathSearch = filters.categoryPathQuery.toLowerCase();
            if (!(item.category_path && String(item.category_path).toLowerCase().includes(lowerCategoryPathSearch))) {
                return false;
            }
        }
        return true; // Item passes all filters
      });
    },
    storageKey: 'providerCodesView',
    getProviderNameById: (providerId) => {
        const provider = Array.isArray(providersData) ? providersData.find(p => p.id === providerId) : null;
        return provider ? (language === 'he' ? (provider.name?.he || provider.name?.en) : (provider.name?.en || provider.name?.he)) : t('common.unknownProvider');
    }
  }), [t, language, providersData, providerMap]);

  const {
    items: providerCodes, // Aliased 'items' to 'providerCodes'
    loading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    pagination,
    setPagination,
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshProviderCodes,
    // handleSearch, // Not directly used in this component's new filter bar setup
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleDelete, // This is the one from useEntityModule for single item delete
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose, // Use this for dialogs that save themselves
    filteredAndSortedItems // Added this from useEntityModule
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('providerCodesView_viewPreference', 'card'));
  
  useEffect(() => {
    if (passedView) {
      setCurrentView(passedView);
      saveToStorage('providerCodesView_viewPreference', passedView);
    }
  }, [passedView]);
  
  // Define these functions AFTER useEntityModule returns the required functions
  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(it => it.id === selectedItems[0]); // Find from the full list
        if (itemToEdit) {
            handleEdit(itemToEdit);
        } else {
            toast({ title: t('errors.itemNotFoundTitle', { defaultValue: 'Item Not Found' }), description: t('errors.itemNotFoundToEditDesc', { defaultValue: 'The selected item could not be found for editing.' }), variant: "warning" });
        }
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', { defaultValue: 'Selection Mode Enabled' }), description: t('bulkActions.selectItemToEditDesc', { entity: t('providerCodes.itemTitleSingular', { defaultValue: 'item' }) }), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', { defaultValue: 'Select Only One Item' }), description: t('bulkActions.selectOneToEditDesc', { entity: t('providerCodes.itemTitlePlural', { defaultValue: 'items' }) }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems); // Assuming selectedItems are already IDs
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', { defaultValue: 'Selection Mode Enabled' }), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('providerCodes.itemTitlePlural', { defaultValue: 'items' }) }), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  // Now define memoizedGlobalActionsConfig AFTER the handler functions are defined
  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'providerCodes.addProviderCode', defaultLabel: 'Add Provider Code', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit' },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import', { defaultValue: 'Import' }) }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export', { defaultValue: 'Export' }) }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || []) 
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  if (loading && providerCodes.length === 0 && !error) { // Adjusted loading condition
    return <LoadingSpinner message={t('messages.loadingData', { item: t('providerCodes.itemTitlePluralLow', { defaultValue: 'provider codes' }) })} isFullScreen={false} />;
  }

  if (error && providerCodes.length === 0) {
    return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshProviderCodes} />;
  }

  const noItems = pagination.totalCount === 0; // Check total filtered count
  const noFiltersApplied = Object.values(filters || {}).every(val =>
    !val || (typeof val === 'string' && (val === '' || val === 'all')) || (Array.isArray(val) && val.length === 0)
  );

  const providerCodeColumnsForTable = useMemo(() => [
    { 
      accessorKey: 'code_number', 
      header: t('providerCodes.fields.codeNumber', {defaultValue: 'Code Number'}),
      cell: ({ row }) => row.original.code_number || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'provider_name', 
      header: t('providerCodes.fields.providerName', {defaultValue: 'Provider'}),
      cell: ({ row }) => providerMap.get(row.original.provider_id) || t('common.unknown', {defaultValue: 'Unknown'}),
      enableSorting: false, // Sorting by provider name is not supported directly through accessorKey on nested data
    },
    { 
      accessorKey: 'description_en', 
      header: t('providerCodes.fields.descriptionEn', {defaultValue: 'Description (EN)'}),
      cell: ({ row }) => row.original.description_en || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'status', 
      header: t('providerCodes.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.status === true ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.status === true ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})}
        </Badge>
      ),
      enableSorting: true,
    },
  ], [t, providerMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <FileCode2 className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('providerCodes.title')} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis', { defaultValue: "..." }) : pagination.totalCount || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('providerCodes.itemTitleSingular')}
                t={t}
              />
          <Button onClick={refreshProviderCodes} variant="outline" size="sm" className="ml-2" disabled={loading}>
            {loading ? <LoadingSpinner size={16} /> : t('buttons.refresh', { defaultValue: 'Refresh' })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage('providerCodesView_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['card', 'table']}
            entityName="providerCodes"
            t={t}
          />
        </div>
      </div>
       <ProviderCodeFilters
        filters={filters}
        onFiltersChange={handleFilterChange} // handleFilterChange from useEntityModule
        onResetFilters={() => {
            setFilters(entityConfig.initialFilters);
            setSortConfig([{ id: 'updated_date', desc: true}]); // Reset to default sort for useEntityModule
            handleCancelSelectionMode();
        }}
        // The following two lines correctly translate useEntityModule's array sortConfig to ProviderCodeFilters' expected object format
        sortConfig={sortConfig.length > 0 ? {key: sortConfig[0].id, direction: sortConfig[0].desc ? 'descending': 'ascending'} : {key: entityConfig.initialSort.field, direction: entityConfig.initialSort.direction === 'desc' ? 'descending' : 'ascending'}}
        onSortChange={(key) => handleSortChange([{id: key, desc: sortConfig[0]?.id === key ? !sortConfig[0]?.desc : false }])} // Pass array to handleSortChange
        allProviderCodes={filteredAndSortedItems || []} // Pass filtered and sorted items for deriving filter options
        allProviders={providersData || []}
        t={t} language={language} isRTL={isRTL}
      />
      {error && providerCodes.length > 0 && <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshProviderCodes} />}
      {loading && providerCodes.length > 0 && ( // Show partial loading if some items are loaded
        <LoadingSpinner message={t('messages.loadingMoreData', { defaultValue: 'Loading more data...' })} isFullScreen={false} />
      )}

      {currentView === 'card' && ( // Corrected from 'grid' to 'card' to match state
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={FileCode2}
              title={t('providerCodes.noCodesYetTitle', { defaultValue: 'No Provider Codes Yet' })}
              description={t('providerCodes.noCodesYetDesc', { defaultValue: 'Get started by adding a new provider code.' })}
              actionButton={
                <Button onClick={handleAddNew} variant="default" size="sm">
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('providerCodes.buttons.addNewCode', { defaultValue: 'Add New Code' })}
                </Button>
              }
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={FileCode2}
              title={t('providerCodes.noCodesMatchTitle', { defaultValue: 'No Provider Codes Match Filters' })}
              description={t('providerCodes.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {providerCodes.map(codeItem => ( // Use providerCodes (which is the current page's items)
                <ProviderCodeCard
                  key={codeItem.id}
                  code={codeItem}
                  providerName={providerMap.get(codeItem.provider_id) || t('common.unknown', { defaultValue: 'Unknown' })}
                  currentLocale={getLocaleObject(language)}
                  t={t}
                  isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(codeItem.id)}
                  onToggleSelection={() => handleToggleSelection(codeItem.id)}
                  onCardClick={handleEdit} // Changed from handleEditItem to handleEdit
                />
              ))}
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)} // Use currentPage
                disabled={pagination.currentPage === 1 || loading} // Use currentPage
              >
                {t('buttons.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.pageIndicator', { currentPage: pagination.currentPage, totalPages: pagination.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)} // Use currentPage
                disabled={pagination.currentPage >= pagination.totalPages || loading} // Use currentPage
              >
                {t('buttons.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          )}
        </>
      )}
      {currentView === 'table' && (
        <DataTable
          columns={providerCodeColumnsForTable}
          data={providerCodes} // This should be the paginated data
          loading={loading}
          error={error}
          onRetry={refreshProviderCodes}
          entityName={t('providerCodes.itemTitlePlural', { defaultValue: 'Provider Codes' })}
          emptyMessage={noFiltersApplied 
            ? t('providerCodes.noCodesYetDesc', { defaultValue: 'Get started by adding a new provider code.' })
            : t('providerCodes.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })
          }
          onRowClick={(row) => handleEdit(row.original)}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={(itemId, isSelected) => {
            if (isSelected) {
              setSelectedItems(prev => [...prev, itemId]);
            } else {
              setSelectedItems(prev => prev.filter(id => id !== itemId));
            }
          }}
          onSelectAllRows={() => {
            // Only select items on the current page to avoid unintended bulk selection
            if (selectedItems.length === providerCodes.length && providerCodes.every(item => selectedItems.includes(item.id))) {
              // If all currently displayed items are selected, deselect them
              setSelectedItems(prev => prev.filter(id => !providerCodes.map(item => item.id).includes(id)));
            } else {
              // Select all currently displayed items, adding them to existing selections
              setSelectedItems(prev => [...new Set([...prev, ...providerCodes.map(item => item.id)])]);
            }
          }}
          currentSort={sortConfig}
          onSortChange={(newSortConfig) => setSortConfig(newSortConfig)}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalCount,
            pageSize: pagination.pageSize
          }}
          onPageChange={handlePageChange}
          t={t} // Pass translation function to DataTable
        />
      )}
      {isDialogOpen && ( // Consolidates add and edit dialog rendering
         <ProviderCodeDialog
          isOpen={isDialogOpen}
          // The dialog's onClose is expected to pass (refresh: boolean, itemDetails: object|null)
          // handleSelfSubmittingDialogClose takes (refresh, actionType: 'create'|'update'|null, identifier: string|null)
          onClose={(refresh, itemDetails) => handleSelfSubmittingDialogClose(
            refresh, 
            itemDetails ? (itemDetails.id ? 'update' : 'create') : null, 
            itemDetails?.code_number || ''
          )}
          providerCode={currentItem} // currentItem will be null for "Add New"
          providers={providersData || []} // Pass providers data
        />
      )}
    </div>
  );
}
