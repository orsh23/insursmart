
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Provider } from '@/api/entities';
import { City } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, Hospital, RefreshCw, AlertTriangle, XCircle, CheckCircle2, SearchX } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ProviderDialog from './ProviderDialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ProviderCard from './ProviderCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/ui/data-table';
import ProviderFilterBar from './ProviderFilterBar';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { useEntityModule } from '@/components/hooks/useEntityModule';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Helper to get localized value safely
const getLocalizedValue = (item, keyPath, language, defaultLang = 'en', defaultVal = '') => {
  const keys = keyPath.split('.');
  let current = item;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'object' && current !== null) {
    return language === 'he' ? (current.he || current.en) : (current.en || current.he);
  }
  return current || defaultVal;
};

// Helper component for status display
const StatusBadge = ({ status, t }) => {
  if (!status) return null;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      status === 'active'
        ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'
    }`}>
      {t(`status.${status}`, {defaultValue: status})}
    </span>
  );
};

// Helper component for displaying errors
const ErrorDisplay = ({ errorMessage, onRetry, t, isRTL }) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">
      {t('errors.dataLoadErrorTitle', {defaultValue: 'Error Loading Data'})}
    </h2>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      {errorMessage || t('errors.genericFetchError', {defaultValue: 'Failed to fetch data. Please try again.'})}
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
        <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t('buttons.retry', {defaultValue: 'Retry'})}
      </Button>
    )}
  </div>
);

export default function ProvidersTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = useMemo(() => getLocaleObject(language), [language]);

  const [cities, setCities] = useState([]);

  // Fetch cities for filter dropdown with rate limiting protection
  useEffect(() => {
    const fetchCities = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const cityData = await City.list(undefined, 100, undefined, ['name_en', 'name_he']);
        if (Array.isArray(cityData)) {
          const uniqueCities = Array.from(new Set(
            cityData.map(c => language === 'he' ? (c.name_he || c.name_en) : (c.name_en || c.name_he))
                      .filter(Boolean)
          )).sort((a,b) => a.localeCompare(b, language));
          setCities(uniqueCities);
        }
      } catch (error) {
        console.error("Error fetching cities for provider filters:", error);
      }
    };
    fetchCities();
  }, [language]);

  const entityConfig = useMemo(() => ({
    entitySDK: Provider,
    entityName: t('providers.itemTitleSingular', { defaultValue: 'Provider' }),
    entityNamePlural: t('providers.titleMultiple', { defaultValue: 'Providers' }),
    DialogComponent: ProviderDialog,
    initialSort: [{ id: 'name.en', desc: false }],
    initialFilters: {
      searchTerm: '',
      providerType: 'all',
      status: 'all',
      city: 'all',
    },
    // Updated searchFields to match new filterFunction
    searchFields: ['name.en', 'name.he', 'legal.identifier', 'contact.email', 'contact.phone', 'contact.city', 'contact.contact_person_name'],
    filterFunction: (item, filters) => {
        const searchTerm = filters.searchTerm?.toLowerCase();
        if (searchTerm) {
            const searchableText = [
              getLocalizedValue(item, 'name', language),
              item.legal?.identifier,
              item.contact?.email,
              item.contact?.phone,
              item.contact?.city,
              item.contact?.contact_person_name
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) return false;
        }
        if (filters.providerType !== 'all' && item.provider_type !== filters.providerType) return false;
        if (filters.status !== 'all' && item.status !== filters.status) return false;
        if (filters.city !== 'all' && (item.contact?.city?.toLowerCase() !== filters.city?.toLowerCase())) return false;
        return true;
    },
    storageKey: 'providersView',
  }), [t, language]);

  const {
    items: providers = [],
    loading = false,
    error = null,
    filters = {},
    sortConfig = [],
    pagination = { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 1 },
    selectedItems = [],
    isDialogOpen = false,
    currentItem = null,
    handleRefresh: refreshProviders,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    isSelectionModeActive = false,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
    setSelectedItems,
  } = useEntityModule(entityConfig) || {};

  const [currentView, setCurrentView] = useState(() => {
    if (passedView) return passedView;
    try {
      return loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card');
    } catch (e) {
      console.warn('[ProvidersTab] Failed to load view preference from storage:', e);
      return 'card';
    }
  });

  // Define handleCancelSelectionMode BEFORE using it in other functions
  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  // New handler for view change with proper persistence
  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    try {
      saveToStorage(entityConfig.storageKey + '_viewPreference', view);
    } catch (e) {
      console.warn('Failed to save view preference:', e);
    }
    handleCancelSelectionMode();
  }, [entityConfig.storageKey, handleCancelSelectionMode]);
  
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = providers.find(it => it.id === selectedItems[0]);
      if (itemToEdit) {
        handleEdit(itemToEdit);
        setIsSelectionModeActive(false);
        setSelectedItems([]);
      } else {
        toast({
          title: t('errors.itemNotFoundTitle', {defaultValue: 'Item Not Found'}),
          description: t('errors.itemNotFoundToEditDesc', {defaultValue: 'The selected item could not be found for editing.'}),
          variant: "warning"
        });
      }
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({
        title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit', {defaultValue: 'Edit'})}),
        description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit', {defaultValue: 'Edit'})}),
        variant: "info"
      });
    } else {
      toast({
        title: t('bulkActions.selectOneToEditTitle', {defaultValue: 'Select Only One Item'}),
        description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName, defaultValue: `Please select only one ${entityConfig.entityName} to edit.` }),
        variant: 'info'
      });
    }
  }, [selectedItems, providers, handleEdit, setIsSelectionModeActive, setSelectedItems, t, toast, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      const firstItemName = getLocalizedValue(providers.find(p => p.id === selectedItems[0]), 'name', language, 'en', t('common.unknownProvider', {defaultValue: "Unknown Provider"}));
      const itemName = selectedItems.length === 1
        ? firstItemName
        : t('common.multipleItems', { count: selectedItems.length, defaultValue: `${selectedItems.length} items` });

      setDeleteDialogState({
        isOpen: true,
        itemIds: selectedItems,
        itemName: itemName,
        message: t('common.deleteConfirmMessage', {count: selectedItems.length, itemName: itemName, defaultValue: `Are you sure you want to delete ${itemName}?`})
      });

    } else {
      setIsSelectionModeActive(true);
      toast({
        title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete', {defaultValue: 'Delete'})}),
        description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete', {defaultValue: 'Delete'})}),
        variant: "info"
      });
    }
  }, [selectedItems, providers, setIsSelectionModeActive, t, toast, language]);

  // State for confirmation dialog (for delete)
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false, itemIds: [], itemName: '', message: '', loading: false
  });

  const handleConfirmDelete = useCallback(async () => {
    const { itemIds } = deleteDialogState;
    if (!itemIds?.length) return;

    setDeleteDialogState(prev => ({ ...prev, loading: true }));

    const result = await handleBulkDelete(itemIds);

    setDeleteDialogState({isOpen: false, itemIds: [], itemName: '', message: '', loading: false});
    setIsSelectionModeActive(false);
    setSelectedItems([]);

    if (result.successCount > 0) {
      toast({
        title: t('bulkActions.deleteResultTitle', {defaultValue: 'Deletion Results'}),
        description: t('bulkActions.deleteResultDesc', {
          successCount: result.successCount,
          failCount: result.failCount,
          entity: entityConfig.entityNamePlural,
          defaultValue: `Successfully deleted ${result.successCount} ${entityConfig.entityNamePlural}. Failed to delete ${result.failCount}.`
        })
      });
    }
  }, [deleteDialogState, handleBulkDelete, setIsSelectionModeActive, setSelectedItems, toast, t, entityConfig.entityNamePlural]);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleImportSubmit = useCallback(async (file) => {
    setIsImportDialogOpen(false);
    if (!file) {
      toast({
        title: t('import.noFileTitle', {defaultValue: 'No file selected!'}),
        description: t('import.noFileDesc', {defaultValue: 'Please select a file to import.'}),
        variant: "warning"
      });
      return;
    }
    toast({
      title: t('import.comingSoonTitle', {defaultValue: 'Import Coming Soon!'}),
      description: t('import.featureNotImplemented', {entity: t('providers.titleMultiple'), defaultValue: `Import for ${t('providers.titleMultiple')} is not yet implemented.`}),
      variant: "info"
    });
  }, [toast, t]);

  const memoizedGlobalActionsConfig = useMemo(() => {
    const baseActions = [
      { labelKey: 'providers.addProvider', defaultLabel: 'Add Provider', icon: Plus, action: handleAddNew, type: 'add' },
      { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: [0,1] },
      { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'any' },
       { isSeparator: true },
      { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
      { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
    ];
    return [...baseActions, ...(externalActionsConfig || [])];
  }, [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const providerTableColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: t('providers.fields.name', {defaultValue: 'Provider Name'}),
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'name', language, 'en', t('common.notSet', {defaultValue: 'N/A'}))
    },
    {
      accessorKey: 'provider_type',
      header: t('providers.fields.provider_type', {defaultValue: 'Type'}),
      enableSorting: true,
      cell: ({row}) => t(`providerTypes.${row.original.provider_type}`, {defaultValue: row.original.provider_type?.replace(/_/g, ' ') || t('common.notSet', {defaultValue: 'N/A'})})
    },
    {
      accessorKey: 'legal.identifier',
      header: t('providers.fields.legalIdentifier', {defaultValue: 'Legal ID'}),
      enableSorting: true,
      cell: ({ row }) => row.original.legal?.identifier || t('common.notSet', {defaultValue: 'N/A'})
    },
    {
      accessorKey: 'status',
      header: t('providers.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
      enableSorting: true
    },
    {
      accessorKey: 'contact.city',
      header: t('providers.fields.city', {defaultValue: 'City'}),
      enableSorting: true,
      cell: ({ row }) => row.original.contact?.city || t('common.notSet', {defaultValue: 'N/A'})
    },
    {
      accessorKey: 'updated_date',
      header: t('common.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({ row }) => {
        const date = row.original.updated_date;
        return date && isValid(parseISO(date))
          ? formatDistanceToNow(parseISO(date), { addSuffix: true, locale: currentLocale })
          : t('common.unknown', {defaultValue: 'Unknown'});
      },
      enableSorting: true
    },
  ], [t, language, currentLocale]);

  const renderContent = () => {
    const noItems = pagination.totalCount === 0;
    const hasFiltersApplied = Object.entries(filters).some(([key, value]) => {
      if (['page', 'pageSize'].includes(key)) return false;
      if (key === 'searchTerm') return value && value.trim() !== '';
      return value !== 'all' && value !== '';
    });

    if (loading && noItems && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }

    if (error && noItems) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshProviders} t={t} isRTL={isRTL} />;
    }

    if (noItems && hasFiltersApplied) {
      return (
        <EmptyState
          icon={SearchX}
          title={t('emptyStates.noFilterMatchTitle', {item: entityConfig.entityNamePlural})}
          message={t('emptyStates.noFilterMatchMessage')}
          t={t} isRTL={isRTL}
        />
      );
    }

    if (noItems && !hasFiltersApplied) {
      return (
        <EmptyState
          icon={Hospital}
          title={t('emptyStates.noDataTitle', {item: entityConfig.entityNamePlural})}
          message={t('emptyStates.noDataMessage', {item: entityConfig.entityName})}
          actionButton={
            !isSelectionModeActive && <Button onClick={handleAddNew}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('providers.addProvider')}</Button>
          }
          t={t} isRTL={isRTL}
        />
      );
    }

    if (currentView === 'card') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {providers.map(prov => (
              <ProviderCard
                key={prov.id}
                provider={prov}
                currentLocale={currentLocale}
                t={t} isRTL={isRTL}
                isSelectionModeActive={isSelectionModeActive}
                isSelected={selectedItems.includes(prov.id)}
                onToggleSelection={() => handleToggleSelection(prov.id)}
                onCardClick={() => !isSelectionModeActive && handleEdit(prov)}
              />
            ))}
          </div>
          {pagination.totalCount > pagination.pageSize && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: pagination.totalPages, defaultValue: `Page ${pagination.currentPage} of ${pagination.totalPages}` })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loading}>
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
                columns={providerTableColumns}
                data={providers}
                loading={loading}
                error={null}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={t('emptyStates.noDataMessage', {item: entityConfig.entityName})}
                onRowClick={(row) => !isSelectionModeActive && handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => {
                  const allVisibleItemIds = providers.map(item => item.id).filter(Boolean);
                  const allCurrentlySelected = allVisibleItemIds.length > 0 && allVisibleItemIds.every(id => selectedItems.includes(id));
                  if (allCurrentlySelected) {
                    setSelectedItems(prev => prev.filter(id => !allVisibleItemIds.includes(id)));
                  } else {
                    setSelectedItems(prev => Array.from(new Set([...prev, ...allVisibleItemIds])));
                  }
                }}
                currentSort={sortConfig}
                onSortChange={handleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: pagination.totalPages,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    itemsPerPageOptions: [10, 20, 50, 100],
                }}
                t={t} language={language} isRTL={isRTL}
            />
        );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Main Header */}
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <Hospital className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                {entityConfig.entityNamePlural} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis') : pagination.totalCount || 0})
            </h2>
            <div className="flex items-center gap-2">
                <GlobalActionButton
                    actionsConfig={memoizedGlobalActionsConfig}
                    isSelectionModeActive={isSelectionModeActive}
                    onCancelSelectionMode={handleCancelSelectionMode}
                    selectedItemCount={selectedItems.length}
                    itemTypeForActions={entityConfig.entityName}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={refreshProviders} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('buttons.refresh')}
                </Button>
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    availableViews={['card', 'table']}
                    entityName={entityConfig.entityNamePlural}
                    t={t} isRTL={isRTL}
                />
            </div>
        </div>
      )}

      {/* Selection Mode Header */}
      {isSelectionModeActive && (
        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAllVisible"
                checked={providers.length > 0 && providers.every(item => selectedItems.includes(item.id))}
                onCheckedChange={() => {
                  const allVisibleItemIds = providers.map(item => item.id).filter(Boolean);
                  const allCurrentlySelected = allVisibleItemIds.length > 0 && allVisibleItemIds.every(id => selectedItems.includes(id));
                  if (allCurrentlySelected) {
                    setSelectedItems(prev => prev.filter(id => !allVisibleItemIds.includes(id)));
                  } else {
                    setSelectedItems(prev => Array.from(new Set([...prev, ...allVisibleItemIds])));
                  }
                }}
                aria-label={t('bulkActions.selectAllVisible', {defaultValue: 'Select all visible items'})}
              />
              <label htmlFor="selectAllVisible" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {t('bulkActions.selectedCount', { count: selectedItems.length, defaultValue: `${selectedItems.length} selected`})}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSelectionMode}
                className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.cancel', {defaultValue: 'Cancel'})}
              </Button>
              <Button
                size="sm"
                onClick={handleEditWithSelectionCheck}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItems.length === 0}
              >
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.edit', {defaultValue: 'Edit'})} {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </Button>
               <Button
                size="sm"
                onClick={handleDeleteWithSelectionCheck}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                disabled={selectedItems.length === 0}
              >
                <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.delete', {defaultValue: 'Delete'})} {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!isSelectionModeActive && (
        <ProviderFilterBar
          filters={filters}
          onFiltersChange={handleFilterChange}
          onResetFilters={() => {
              handleFilterChange(null, entityConfig.initialFilters);
              handleSortChange(entityConfig.initialSort);
              saveToStorage(entityConfig.storageKey + '_filters', entityConfig.initialFilters);
              saveToStorage(entityConfig.storageKey + '_sort', entityConfig.initialSort);
          }}
          sortConfig={sortConfig.length > 0 ? { key: sortConfig[0].id, direction: sortConfig[0].desc ? 'descending' : 'ascending' } : {key: entityConfig.initialSort[0].id, direction: entityConfig.initialSort[0].desc ? 'descending' : 'ascending' }}
          onSortChange={(newSortKey) => {
              const currentSortField = sortConfig[0]?.id;
              const currentDesc = sortConfig[0]?.desc;
              handleSortChange([{ id: newSortKey, desc: currentSortField === newSortKey ? !currentDesc : false }]);
          }}
          cityOptions={cities}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {/* Error Message (for partial load) */}
      {error && providers.length > 0 && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: typeof error === 'string' ? error : error?.message || "", defaultValue: `There was a problem loading some ${entityConfig.entityNamePlural}.`})}</span>
        </div>
      )}

      {/* Loading State (for additional data or updates) */}
      {loading && providers.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />}

      {/* Content */}
      {renderContent()}

      {/* Dialogs */}
      {isDialogOpen && (
        <ProviderDialog
          isOpen={isDialogOpen}
          onClose={(refreshNeeded, operationType = null, providerNameParam = '') => handleSelfSubmittingDialogClose(refreshNeeded, operationType, providerNameParam)}
          provider={currentItem}
          allCities={cities}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || entityConfig.entityName, count: deleteDialogState.itemIds.length, defaultValue: `Confirm Deletion`})}
          description={deleteDialogState.message || t('common.confirmDeleteDescription', {item: deleteDialogState.itemName || entityConfig.entityName, count: deleteDialogState.itemIds.length, defaultValue: `Are you sure you want to delete ${deleteDialogState.itemIds.length} ${entityConfig.entityNamePlural}?`})}
          confirmText={t('common.delete', {defaultValue: 'Delete'})}
          cancelText={t('common.cancel', {defaultValue: 'Cancel'})}
          loading={deleteDialogState.loading}
          t={t} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            onOpenChange={setIsImportDialogOpen}
            onImport={handleImportSubmit}
            entityName={entityConfig.entityNamePlural}
            sampleHeaders={['Name EN', 'Name HE', 'Provider Type (hospital, clinic, etc.)', 'Legal Type (company, licensed_dealer, registered_association)', 'Legal ID', 'Status (active, inactive)', 'City', 'Phone', 'Contact Person', 'Email', 'Notes']}
            language={language} isRTL={isRTL}
            t={t}
        />
      )}
    </div>
  );
}
