import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Provider } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Added for Select All
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, Building2, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'; // Added XCircle, CheckCircle2
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ProviderDialog from './ProviderDialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ProviderDetailsDrawer from './ProviderDetailsDrawer';
import ProviderCard from './ProviderCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import ProviderFilterBar from './ProviderFilterBar';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { useEntityModule } from '@/components/hooks/useEntityModule';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const getProviderName = (prov, language, t) => {
  if (!prov || !prov.name) return t('common.unknownProvider', {defaultValue: "Unknown Provider"});
  // Default to English name if specific language name is missing, then to Hebrew if English is missing
  const primaryName = language === 'he' ? prov.name.he : prov.name.en;
  const secondaryName = language === 'he' ? prov.name.en : prov.name.he;
  return primaryName || secondaryName || t('common.unknownProvider', {defaultValue: "Unknown Provider"});
};


export default function ProvidersTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [currentProviderForDialog, setCurrentProviderForDialog] = useState(null);

  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false,
    itemIds: [], 
    itemName: '',
    message: ''
  });
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedProviderIdForDrawer, setSelectedProviderIdForDrawer] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // State for selection mode
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());


  const entityConfig = useMemo(() => ({
    entitySDK: Provider,
    entityName: t('providers.itemTitleSingular', { defaultValue: 'Provider' }),
    entityNamePlural: t('providers.titleMultiple', { defaultValue: 'Providers' }),
    DialogComponent: ProviderDialog,
    initialFilters: {
      searchTerm: '', providerType: 'all', status: 'all', city: '',
      contactPerson: '', notes: '', legalType: 'all', page: 1, pageSize: 10,
    },
    filterFunction: (sourceItems, filters) => {
        if (!Array.isArray(sourceItems)) return [];
        return sourceItems.filter(prov => {
            const searchTermLower = filters.searchTerm?.toLowerCase() || '';
            // Ensure provider name is correctly retrieved before toLowerCase()
            const providerNameString = getProviderName(prov, language, t);
            const name = typeof providerNameString === 'string' ? providerNameString.toLowerCase() : '';
            const legalIdentifier = prov.legal?.identifier?.toLowerCase() || '';

            const searchMatch = !filters.searchTerm || name.includes(searchTermLower) || legalIdentifier.includes(searchTermLower);
            const typeMatch = filters.providerType === 'all' || prov.provider_type === filters.providerType;
            const statusMatch = filters.status === 'all' || prov.status === filters.status;
            // Corrected city match to handle 'all' or empty string
            const cityMatch = filters.city === 'all' || filters.city === '' || (prov.contact?.city && prov.contact.city === filters.city);
            const contactPersonMatch = filters.contactPerson === '' || !filters.contactPerson || (prov.contact?.contact_person_name && prov.contact.contact_person_name.toLowerCase().includes(filters.contactPerson.toLowerCase()));
            const notesMatch = filters.notes === '' || !filters.notes || (prov.notes && prov.notes.toLowerCase().includes(filters.notes.toLowerCase()));
            const legalTypeMatch = filters.legalType === 'all' || !filters.legalType || (prov.legal?.type && prov.legal.type === filters.legalType);
            return searchMatch && typeMatch && statusMatch && cityMatch && contactPersonMatch && notesMatch && legalTypeMatch;
        });
    },
    storageKey: 'providersView',
    defaultSort: { key: 'updated_date', direction: 'descending' }, // Changed to object
  }), [t, language]);

  const {
    items: paginatedProviders,
    rawItems: allProviders, 
    filteredAndSortedItems, // All items after hook's filtering/sorting, before pagination
    loading, error, filters, setFilters, sortConfig, setSortConfig, pagination,
    handleRefresh, handleSearch, handleFilterChange,
    handleSortChange: handleEntitySortChange, // Renamed to avoid conflict
    handlePageChange, handlePageSizeChange,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(() => {
    if (passedView) return passedView;
    return loadFromStorage('providers_view_preference', 'card');
  });
  
  const handleViewChange = (newView) => {
    setCurrentView(newView);
    saveToStorage('providers_view_preference', newView);
    setSelectedItemIds(new Set()); // Clear selection when view changes
    setIsSelectionModeActive(false); // Exit selection mode
  };

  const openProviderDialogForEdit = (providerToEdit) => {
    setCurrentProviderForDialog(providerToEdit);
    setIsProviderDialogOpen(true);
  };
  
  const openProviderDialogForAdd = () => {
    setCurrentProviderForDialog(null);
    setIsProviderDialogOpen(true);
  };

  const handleProviderDialogClose = (refreshNeeded, operationType = null, providerNameParam = '') => {
    setIsProviderDialogOpen(false);
    setCurrentProviderForDialog(null);
    if (refreshNeeded) {
      handleRefresh();
      const nameToDisplay = providerNameParam || t('common.item', {defaultValue: "item"});
      if (operationType === 'create') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('providers.createSuccess', { name: nameToDisplay, defaultValue: `Provider "${nameToDisplay}" has been successfully created.` }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('providers.updateSuccess', { name: nameToDisplay, defaultValue: `Provider "${nameToDisplay}" has been successfully updated.` }) });
      }
    }
  };
  
  const openDetailsDrawer = (provider) => {
    if (isSelectionModeActive) return; // Don't open drawer if in selection mode
    if (!provider || !provider.id) return;
    setSelectedProviderIdForDrawer(provider.id);
    setIsDetailsDrawerOpen(true);
  };

  const handleStartSelectionMode = (mode) => { // 'edit' or 'delete'
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set()); // Clear previous selections
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItemIds(new Set());
  };
  
  const handleToggleSelection = useCallback((itemId, checked) => {
    setSelectedItemIds(prevIds => {
      const newSelectedIds = new Set(prevIds);
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId);
      } else {
        newSelectedIds.add(itemId);
      }
      return newSelectedIds;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const itemsToConsider = currentView === 'table' ? filteredAndSortedItems : paginatedProviders;
    if (!Array.isArray(itemsToConsider)) return;

    const allVisibleItemIds = itemsToConsider.map(item => item.id).filter(id => id != null);
    
    const allCurrentlySelectedOnPage = allVisibleItemIds.length > 0 && allVisibleItemIds.every(id => selectedItemIds.has(id));

    if (allCurrentlySelectedOnPage) {
      setSelectedItemIds(prevIds => {
        const newIds = new Set(prevIds);
        allVisibleItemIds.forEach(id => newIds.delete(id));
        return newIds;
      });
    } else {
      setSelectedItemIds(prevIds => new Set([...prevIds, ...allVisibleItemIds]));
    }
  }, [paginatedProviders, filteredAndSortedItems, currentView, selectedItemIds]);


  const handleConfirmSelectionAction = () => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ title: t('bulkActions.noItemsSelectedTitle', { defaultValue: 'No Items Selected' }), description: t('bulkActions.selectItemsPrompt', { mode: selectionMode, defaultValue: `Please select items to ${selectionMode}.` }), variant: "warning" });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const providerToEdit = allProviders.find(p => p.id === idsArray[0]);
        if (providerToEdit) {
          openProviderDialogForEdit(providerToEdit);
        } else {
          toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
        }
      } else {
        toast({ title: t('bulkActions.selectOneToEditTitle', { defaultValue: 'Select One Item' }), description: t('bulkActions.selectOneToEditDesc', { entity: t('providers.itemTitleSingular') }), variant: "info" });
        return; // Keep selection mode active for user to correct
      }
    } else if (selectionMode === 'delete') {
        const firstItemName = getProviderName(allProviders.find(p => p.id === idsArray[0]), language, t);
        const itemName = idsArray.length === 1 ? firstItemName : t('providers.itemTitlePluralItems', { count: idsArray.length, defaultValue: `${idsArray.length} providers` });
        setDeleteDialogState({
            isOpen: true,
            itemIds: idsArray,
            itemName: itemName,
            message: t('providers.bulkDeleteConfirmMessage', {count: idsArray.length, itemName: itemName, defaultValue: `Are you sure you want to delete ${itemName}? This action cannot be undone.`})
        });
    }
    // For edit, dialog opens. For delete, confirm dialog opens. Selection mode should ideally close after initiating action.
    // However, if edit needs correction (e.g. >1 selected), keep mode active.
    // If it's a single edit, dialog opens, mode can close.
    // If delete confirm, mode can close.
    if (selectionMode === 'edit' && idsArray.length === 1) {
        handleCancelSelectionMode();
    } else if (selectionMode === 'delete' && idsArray.length > 0) {
        // Deferring cancel selection mode until after delete confirmation.
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    let successes = 0;
    let failures = 0;
    
    for (const id of deleteDialogState.itemIds) {
      const providerNameForToast = getProviderName(allProviders.find(p => p.id === id), language, t);
      try {
        await Provider.delete(id);
        successes++;
      } catch (err) {
        console.error(`Failed to delete provider ${id}:`, err);
        failures++;
        toast({
          title: t('errors.deleteFailedTitle', {defaultValue: "Deletion Failed"}),
          description: t('providers.deleteError', { name: providerNameForToast, error: err.message, defaultValue: `Could not delete provider "${providerNameForToast}". Error: ${err.message}` }),
          variant: "destructive",
        });
      }
    }
    toast({
      title: t('bulkActions.deleteResultTitle', {defaultValue: "Deletion Result"}),
      description: t('bulkActions.deleteResultDesc', {successCount: successes, failCount: failures, entity: t('providers.titleMultiple', {defaultValue: "Providers"})})
    });

    if (successes > 0) {
      handleRefresh();
    }
    setDeleteDialogState({isOpen: false, itemIds: [], itemName: '', message: ''});
    handleCancelSelectionMode(); // Close selection mode after deletion attempt
  };

  const handleImportSubmit = async (file) => {
    setIsImportDialogOpen(false);
    if (!file) {
      toast({ title: t('import.noFileTitle', {defaultValue: "No File Selected"}), description: t('import.noFileDesc', {defaultValue: "Please select a file to import."}), variant: "warning" });
      return;
    }
    toast({ title: t('import.comingSoonTitle', {defaultValue: "Import Coming Soon"}), description: t('import.featureNotImplemented', {entity: t('providers.titleMultiple')}), variant: "info" });
  };

  const providerGlobalActions = useMemo(() => [
    { labelKey: 'providers.addProvider', defaultLabel: 'Add Provider', icon: Plus, action: openProviderDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' }, 
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => alert(t('common.featureComingSoon', {featureName: 'Export'})), disabled: true, type: 'export' },
  ], [t, openProviderDialogForAdd]); // onStartSelectionMode is not a dep as it's stable from useState

  const providerColumns = useMemo(() => [
    // DataTable will handle its own selection column if `isSelectionModeActive` is passed correctly
    {
      accessorKey: 'name',
      header: t('providers.fields.name', {defaultValue: 'Provider Name'}),
      cell: ({ row }) => getProviderName(row.original, language, t),
      enableSorting: true,
    },
    {
      accessorKey: 'provider_type',
      header: t('providers.fields.provider_type', {defaultValue: 'Type'}),
      cell: ({ row }) => t(`providerTypes.${row.original.provider_type}`, { defaultValue: row.original.provider_type?.replace(/_/g, ' ') || t('common.notSet', {defaultValue: 'N/A'}) }),
      enableSorting: true,
    },
    {
      accessorKey: 'contact.city',
      header: t('providers.fields.city', {defaultValue: 'City'}),
      cell: ({ row }) => row.original.contact?.city || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: t('providers.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.original.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {t(`status.${row.original.status}`, {defaultValue: row.original.status})}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'updated_date',
      header: t('common.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date)) ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.unknown', {defaultValue: 'Unknown'})),
      enableSorting: true
    },
  ], [t, language, currentLocale]);
  
  const itemsForSelectAll = currentView === 'table' ? filteredAndSortedItems : paginatedProviders;
  const allVisibleSelected = Array.isArray(itemsForSelectAll) && itemsForSelectAll.length > 0 && itemsForSelectAll.every(item => selectedItemIds.has(item.id));


  if (loading && !allProviders.length) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('providers.titleMultiple') })} />;
  }

  if (error && !allProviders.length) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle', {defaultValue: "Data Load Error"})}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{typeof error === 'string' ? error : error?.message || t('errors.genericFetchError')}</p>
        <Button onClick={() => handleRefresh()} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry', {defaultValue: 'Retry'})}
        </Button>
      </div>
    );
  }
  
  const totalItemsCount = pagination?.totalItems || filteredAndSortedItems?.length || 0;

  return (
    <div className="space-y-4">
      {/* Main Header */}
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <Building2 className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                {t('providers.titleMultiple')} ({totalItemsCount})
            </h2>
            <div className="flex items-center gap-2">
                <GlobalActionButton
                    actionsConfig={providerGlobalActions}
                    onStartSelectionMode={handleStartSelectionMode} // Pass the new handler
                    itemTypeForActions={t('providers.itemTitleSingular')}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={() => handleRefresh()} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('buttons.refresh', {defaultValue: "Refresh"})}
                </Button>
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    availableViews={['card', 'table']}
                    entityName={t('providers.titleMultiple')}
                    t={t} isRTL={isRTL}
                />
            </div>
        </div>
      )}

      {/* Contextual Action Bar for Selection Mode */}
      {isSelectionModeActive && (
        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAllVisible"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible', { defaultValue: 'Select all visible' })}
              />
              <label htmlFor="selectAllVisible" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {t('bulkActions.selectedCount', { count: selectedItemIds.size, defaultValue: `${selectedItemIds.size} selected`})}
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
                onClick={handleConfirmSelectionAction}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItemIds.size === 0}
              >
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {selectionMode === 'edit' ? t('common.edit', {defaultValue: 'Edit'}) : t('common.delete', {defaultValue: 'Delete'})} {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isSelectionModeActive && (
        <ProviderFilterBar
          filters={filters}
          onFiltersChange={handleFilterChange} 
          onResetFilters={() => { 
              setFilters(entityConfig.initialFilters); 
              setSortConfig({ key: 'name.en', direction: 'ascending' }); 
              setSelectedItemIds(new Set()); 
          }}
          sortConfig={sortConfig} 
          onSortChange={(key) => { 
              let newKey = key;
              // Adjust sort key for name based on language if needed, or handle in useEntityModule
              // if (key === 'name') newKey = language === 'he' ? 'name.he' : 'name.en';
              
              let direction = 'ascending';
              if (sortConfig.key === newKey && sortConfig.direction === 'ascending') {
                  direction = 'descending';
              }
              setSortConfig({ key: newKey, direction });
          }}
          allProviders={allProviders}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {error && allProviders.length > 0 && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('providers.titleMultiple'), message: typeof error === 'string' ? error : error?.message || ""})}</span>
        </div>
      )}

      {loading && allProviders.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('providers.titleMultiple') })} />}

      {!loading && totalItemsCount === 0 && (Object.values(filters).some(f => f && f !== 'all' && (Array.isArray(f) ? f.length > 0 : true) && f !== filters.page && f !== filters.pageSize && f !== filters.searchTerm) && allProviders.length > 0) ? (
        <EmptyState
          icon={Building2}
          title={t('emptyStates.noFilterMatchTitle', {item: t('providers.titleMultiple')})}
          message={t('emptyStates.noFilterMatchMessage', {defaultValue: "Try adjusting your search or filter criteria."})}
          t={t} isRTL={isRTL}
        />
      ) : !loading && totalItemsCount === 0 && !error ? (
        <EmptyState
          icon={Building2}
          title={t('emptyStates.noDataTitle', {item: t('providers.titleMultiple')})}
          message={t('emptyStates.noDataMessage', {item: t('providers.itemTitleSingular')})}
           actionButton={
             !isSelectionModeActive && <Button onClick={openProviderDialogForAdd}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('providers.addProvider')}</Button>
          }
          t={t} isRTL={isRTL}
        />
      ) : (paginatedProviders.length > 0 || (loading && allProviders.length > 0)) && (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProviders.map(prov => (
                <ProviderCard
                    key={prov.id}
                    provider={prov}
                    currentLocale={currentLocale}
                    t={t} isRTL={isRTL}
                    isSelectionModeActive={isSelectionModeActive}
                    isSelected={selectedItemIds.has(prov.id)}
                    onToggleSelection={handleToggleSelection}
                    onCardClick={() => openDetailsDrawer(prov)}
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
             <DataTable
              columns={providerColumns}
              data={paginatedProviders} 
              loading={loading && allProviders.length > 0}
              error={null} 
              pagination={{
                currentPage: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
                totalItems: totalItemsCount,
                totalPages: Math.ceil(totalItemsCount / pagination.pageSize),
                onPageChange: (newPage) => handlePageChange(newPage - 1),
                onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [10, 20, 50, 100],
              }}
              onSortChange={(newSortState) => { 
                  if (newSortState && newSortState.length > 0) {
                      const { id, desc } = newSortState[0];
                      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
                  } else { 
                      setSortConfig(entityConfig.defaultSort);
                  }
              }}
              currentSort={sortConfig.key ? [{id: sortConfig.key, desc: sortConfig.direction === 'descending'}] : []}
              entityName={t('providers.titleMultiple')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection} // Pass id and checked state
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openDetailsDrawer(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {/* Pagination for Card View */}
          {currentView === 'card' && totalItemsCount > pagination.pageSize && (
            <div className="flex items-center justify-between space-x-2 rtl:space-x-reverse py-3 px-1 border-t dark:border-gray-700 mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('dataTable.paginationSummary', {
                    start: pagination.pageIndex * pagination.pageSize + 1,
                    end: Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalItemsCount),
                    total: totalItemsCount,
                    entity: t('providers.titleMultiple').toLowerCase()
                })}
              </div>
              <div className="space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(pagination.pageIndex - 1)} 
                  disabled={pagination.pageIndex === 0 || loading}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('buttons.previous', {defaultValue: "Previous"})}
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(pagination.pageIndex + 1)} 
                  disabled={(pagination.pageIndex + 1) * pagination.pageSize >= totalItemsCount || loading}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('buttons.next', {defaultValue: "Next"})}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isProviderDialogOpen && (
        <ProviderDialog
          isOpen={isProviderDialogOpen}
          onClose={handleProviderDialogClose}
          provider={currentProviderForDialog}
          allCities={Array.from(new Set(allProviders.map(p => p.contact?.city).filter(Boolean)))}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds.length})}
          description={deleteDialogState.message}
          confirmText={t('common.delete', {defaultValue: "Delete"})}
          cancelText={t('common.cancel', {defaultValue: "Cancel"})}
          loading={loading} 
          t={t} isRTL={isRTL}
        />
      )}
      {isDetailsDrawerOpen && selectedProviderIdForDrawer && (
        <ProviderDetailsDrawer
          providerId={selectedProviderIdForDrawer}
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEditProvider={(providerToEdit) => { // Ensure this function receives the provider object
            setIsDetailsDrawerOpen(false); // Close drawer first
            openProviderDialogForEdit(providerToEdit);
          }}
          onDeleteProvider={(providerToDelete) => {
             setIsDetailsDrawerOpen(false);
             setDeleteDialogState({
                isOpen: true,
                itemIds: [providerToDelete.id],
                itemName: getProviderName(providerToDelete, language, t),
                message: t('providers.deleteConfirmMessage', { name: getProviderName(providerToDelete, language, t) })
            });
          }}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            onOpenChange={setIsImportDialogOpen}
            onImport={handleImportSubmit}
            entityName={t('providers.titleMultiple')}
            sampleHeaders={['Name EN', 'Name HE', 'Provider Type (hospital, clinic, etc.)', 'Legal Type (company, licensed_dealer, registered_association)', 'Legal ID', 'Status (active, inactive)', 'City', 'Phone', 'Contact Person', 'Email', 'Notes']}
            language={language} isRTL={isRTL}
        />
      )}
    </div>
  );
}