
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Provider } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, Building2, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
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
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const getProviderName = (prov, language, t) => {
  if (!prov || typeof prov !== 'object' || !prov.name || typeof prov.name !== 'object') {
    return t('common.unknownProvider', {defaultValue: "Unknown Provider"});
  }
  const primaryName = language === 'he' ? prov.name.he : prov.name.en;
  const secondaryName = language === 'he' ? prov.name.en : prov.name.he;
  return primaryName || secondaryName || t('common.unknownProvider', {defaultValue: "Unknown Provider"});
};

// Memoized filter function to avoid recreating on every render
const createProviderFilter = (filters, language, t) => (prov) => {
  if (!prov || typeof prov !== 'object') return false;
  
  // Search term matching
  if (filters.searchTerm) {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const providerName = getProviderName(prov, language, t).toLowerCase();
    const legalIdentifier = prov.legal?.identifier?.toLowerCase() || '';
    
    if (!providerName.includes(searchTermLower) && !legalIdentifier.includes(searchTermLower)) {
      return false;
    }
  }
  
  // Simple field matches
  if (filters.providerType !== 'all' && prov.provider_type !== filters.providerType) return false;
  if (filters.status !== 'all' && prov.status !== filters.status) return false;
  if (filters.legalType !== 'all' && filters.legalType && prov.legal?.type !== filters.legalType) return false;
  
  // City matching
  if (filters.city && filters.city !== 'all') {
    const cityVal = prov.contact?.city || '';
    if (cityVal !== filters.city) return false;
  }
  
  // Contact person matching
  if (filters.contactPerson) {
    const contactPersonName = prov.contact?.contact_person_name?.toLowerCase() || '';
    if (!contactPersonName.includes(filters.contactPerson.toLowerCase())) return false;
  }
  
  // Notes matching
  if (filters.notes) {
    const notesVal = (prov.notes || '').toLowerCase();
    if (!notesVal.includes(filters.notes.toLowerCase())) return false;
  }
  
  return true;
};

// Memoized sort function
const createProviderSorter = (sortConfig, language, t) => (a, b) => {
  if (!sortConfig || !sortConfig.key) return 0;
  
  let aVal = a[sortConfig.key];
  let bVal = b[sortConfig.key];

  if (sortConfig.key === 'name') {
    aVal = getProviderName(a, language, t).toLowerCase();
    bVal = getProviderName(b, language, t).toLowerCase();
  }

  // Handle null/undefined values
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;

  let comparison = 0;
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    comparison = aVal.localeCompare(bVal);
  } else if (aVal instanceof Date && bVal instanceof Date) {
    comparison = aVal.getTime() - bVal.getTime();
  } else {
    comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
  }

  return sortConfig.direction === 'ascending' ? comparison : -comparison;
};

export default function ProvidersTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = useMemo(() => getLocaleObject(language), [language]);

  // State
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState(() => {
    try {
      const saved = loadFromStorage('providers_filters', null);
      return saved || {
        searchTerm: '', providerType: 'all', status: 'all', city: '',
        contactPerson: '', notes: '', legalType: 'all', page: 1, pageSize: 10,
      };
    } catch (e) {
      console.warn('[ProvidersTab] Failed to load filters from storage:', e);
      return {
        searchTerm: '', providerType: 'all', status: 'all', city: '',
        contactPerson: '', notes: '', legalType: 'all', page: 1, pageSize: 10,
      };
    }
  });

  const [sortConfig, setSortConfig] = useState(() => {
    try {
      const saved = loadFromStorage('providers_sort', null);
      return saved || { key: 'updated_date', direction: 'descending' };
    } catch (e) {
      console.warn('[ProvidersTab] Failed to load sort config from storage:', e);
      return { key: 'updated_date', direction: 'descending' };
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    if (passedView) return passedView;
    try {
      return loadFromStorage('providers_view_preference', 'card');
    } catch (e) {
      console.warn('[ProvidersTab] Failed to load view preference from storage:', e);
      return 'card';
    }
  });

  // Dialog and drawer states
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [currentProviderForDialog, setCurrentProviderForDialog] = useState(null);
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false, itemIds: [], itemName: '', message: ''
  });
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedProviderIdForDrawer, setSelectedProviderIdForDrawer] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Selection states
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  // Optimized fetch providers with error boundary
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let sortParam = '';
      if (sortConfig?.key) {
        sortParam = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      }
      
      const data = await Provider.list(sortParam || '-updated_date');
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ProvidersTab] Error fetching providers:', err);
      setError(err.message || 'Failed to fetch providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Optimized filtering and sorting with memoization
  const filteredAndSortedProviders = useMemo(() => {
    if (!Array.isArray(providers) || providers.length === 0) return [];
    
    const filterFn = createProviderFilter(filters, language, t);
    const filtered = providers.filter(filterFn);
    
    if (!sortConfig?.key) return filtered;
    
    const sortFn = createProviderSorter(sortConfig, language, t);
    return [...filtered].sort(sortFn); // Create a new array for sorting to avoid mutating original
  }, [providers, filters, sortConfig, language, t]);

  // Optimized pagination
  const pagination = useMemo(() => {
    const totalItems = filteredAndSortedProviders.length;
    const pageSize = Math.max(1, filters.pageSize || 10);
    const pageIndex = Math.max(0, (filters.page || 1) - 1);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    return { pageIndex, pageSize, totalItems, totalPages };
  }, [filteredAndSortedProviders.length, filters.pageSize, filters.page]);

  const paginatedProviders = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    return filteredAndSortedProviders.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredAndSortedProviders, pagination.pageIndex, pagination.pageSize]);

  // Optimized handlers with useCallback
  const handleRefresh = useCallback(() => {
    fetchProviders();
    toast({
      title: t('common.refreshingData', {defaultValue: "Refreshing Data"}),
      description: t('messages.fetchingLatest', { item: t('providers.titleMultiple') }),
    });
  }, [fetchProviders, toast, t]);

  const handleFilterChange = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    try {
      saveToStorage('providers_filters', updatedFilters);
    } catch (e) {
      console.warn('[ProvidersTab] Failed to save filters:', e);
    }
  }, [filters]);

  const handlePageChange = useCallback((newPageIndex) => {
    setFilters(prev => ({ ...prev, page: newPageIndex + 1 }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  const handleViewChange = useCallback((newView) => {
    setCurrentView(newView);
    try {
      saveToStorage('providers_view_preference', newView);
    } catch (e) {
      console.warn('[ProvidersTab] Failed to save view preference:', e);
    }
    setSelectedItemIds(new Set());
    setIsSelectionModeActive(false);
  }, []);

  const handleSortChange = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    try {
      saveToStorage('providers_sort', newSortConfig);
    } catch (e) {
      console.warn('[ProvidersTab] Failed to save sort config:', e);
    }
  }, [sortConfig]);

  // Dialog handlers
  const openProviderDialogForEdit = useCallback((providerToEdit) => {
    setCurrentProviderForDialog(providerToEdit);
    setIsProviderDialogOpen(true);
  }, []);
  
  const openProviderDialogForAdd = useCallback(() => {
    setCurrentProviderForDialog(null);
    setIsProviderDialogOpen(true);
  }, []);

  const handleProviderDialogClose = useCallback((refreshNeeded, operationType = null, providerNameParam = '') => {
    setIsProviderDialogOpen(false);
    setCurrentProviderForDialog(null);
    if (refreshNeeded) {
      fetchProviders();
      const nameToDisplay = providerNameParam || t('common.item', {defaultValue: "item"});
      const messageKey = operationType === 'create' ? 'providers.createSuccess' : 'providers.updateSuccess';
      toast({ 
        title: t('messages.success', {defaultValue: "Success!"}), 
        description: t(messageKey, { name: nameToDisplay }) 
      });
    }
  }, [fetchProviders, toast, t]);

  // Selection handlers
  const handleStartSelectionMode = useCallback((mode) => {
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set());
  }, []);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItemIds(new Set());
  }, []);

  const handleToggleSelection = useCallback((itemId) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const itemsToConsider = currentView === 'table' ? filteredAndSortedProviders : paginatedProviders;
    const allVisibleItemIds = itemsToConsider.map(item => item.id).filter(Boolean);
    const allCurrentlySelected = allVisibleItemIds.length > 0 && allVisibleItemIds.every(id => selectedItemIds.has(id));

    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (allCurrentlySelected) {
        allVisibleItemIds.forEach(id => newSet.delete(id));
      } else {
        allVisibleItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [currentView, filteredAndSortedProviders, paginatedProviders, selectedItemIds]);

  const openDetailsDrawer = useCallback((provider) => {
    if (isSelectionModeActive || !provider?.id) return;
    setSelectedProviderIdForDrawer(provider.id);
    setIsDetailsDrawerOpen(true);
  }, [isSelectionModeActive]);

  // Memoized global actions
  const providerGlobalActions = useMemo(() => [
    { labelKey: 'providers.addProvider', defaultLabel: 'Add Provider', icon: Plus, action: openProviderDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' }, 
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', {featureName: t('buttons.export')}) }), disabled: true, type: 'export' },
  ], [openProviderDialogForAdd, toast, t]);

  // Memoized table columns
  const providerColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: t('providers.fields.name', {defaultValue: 'Provider Name'}),
      cell: ({ row }) => getProviderName(row.original, language, t),
      enableSorting: true,
    },
    {
      accessorKey: 'provider_type',
      header: t('providers.fields.provider_type', {defaultValue: 'Type'}),
      cell: ({ row }) => t(`providerTypes.${row.original.provider_type}`, { 
        defaultValue: row.original.provider_type?.replace(/_/g, ' ') || t('common.notSet', {defaultValue: 'N/A'}) 
      }),
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.original.status === 'active' 
            ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' 
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'
        }`}>
          {t(`status.${row.original.status}`, {defaultValue: row.original.status})}
        </span>
      ),
      enableSorting: true,
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

  const handleConfirmSelectionAction = useCallback(() => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ 
        title: t('bulkActions.noItemsSelectedTitle', { defaultValue: 'No Items Selected' }), 
        description: t('bulkActions.selectItemsPrompt', { mode: selectionMode }), 
        variant: "warning" 
      });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const providerToEdit = providers.find(p => p.id === idsArray[0]);
        if (providerToEdit) {
          openProviderDialogForEdit(providerToEdit);
          handleCancelSelectionMode(); // Close selection mode after opening dialog
        } else {
          toast({ 
            title: t('errors.itemNotFoundTitle'), 
            description: t('errors.itemNotFoundToEditDesc'), 
            variant: "warning" 
          });
        }
      } else {
        toast({ 
          title: t('bulkActions.selectOneToEditTitle'), 
          description: t('bulkActions.selectOneToEditDesc', { entity: t('providers.itemTitleSingular') }), 
          variant: "info" 
        });
      }
    } else if (selectionMode === 'delete') {
      const firstItemName = getProviderName(providers.find(p => p.id === idsArray[0]), language, t);
      const itemName = idsArray.length === 1 
        ? firstItemName 
        : t('providers.itemTitlePluralItems', { count: idsArray.length });
      
      setDeleteDialogState({
        isOpen: true,
        itemIds: idsArray,
        itemName: itemName,
        message: t('providers.bulkDeleteConfirmMessage', {count: idsArray.length, itemName: itemName})
      });
    }
  }, [selectedItemIds, selectionMode, providers, language, t, toast, openProviderDialogForEdit, handleCancelSelectionMode]);

  const handleConfirmDelete = useCallback(async () => {
    const { itemIds } = deleteDialogState;
    if (!itemIds?.length) return;
    
    let successes = 0;
    let failures = 0;
    
    // Set loading for the confirmation dialog
    setDeleteDialogState(prev => ({ ...prev, loading: true }));

    for (const id of itemIds) {
      try {
        await Provider.delete(id);
        successes++;
      } catch (err) {
        console.error(`[ProvidersTab] Failed to delete provider ${id}:`, err);
        failures++;
        const providerName = getProviderName(providers.find(p => p.id === id), language, t);
        toast({
          title: t('errors.deleteFailedTitle', {defaultValue: "Deletion Failed"}),
          description: t('providers.deleteError', { name: providerName, error: err.message }),
          variant: "destructive",
        });
      }
    }
    
    if (successes > 0) {
      toast({
        title: t('bulkActions.deleteResultTitle'),
        description: t('bulkActions.deleteResultDesc', {
          successCount: successes, 
          failCount: failures, 
          entity: t('providers.titleMultiple')
        })
      });
      fetchProviders();
    }
    
    setDeleteDialogState({isOpen: false, itemIds: [], itemName: '', message: ''});
    handleCancelSelectionMode();
  }, [deleteDialogState, providers, language, t, toast, fetchProviders, handleCancelSelectionMode]);

  const handleImportSubmit = useCallback(async (file) => {
    setIsImportDialogOpen(false);
    if (!file) {
      toast({ 
        title: t('import.noFileTitle'), 
        description: t('import.noFileDesc'), 
        variant: "warning" 
      });
      return;
    }
    toast({ 
      title: t('import.comingSoonTitle'), 
      description: t('import.featureNotImplemented', {entity: t('providers.titleMultiple')}), 
      variant: "info" 
    });
  }, [toast, t]);

  // Memoized computed values
  const itemsForSelectAll = useMemo(() => 
    currentView === 'table' ? filteredAndSortedProviders : paginatedProviders
  , [currentView, filteredAndSortedProviders, paginatedProviders]);

  const allVisibleSelected = useMemo(() => 
    Array.isArray(itemsForSelectAll) && 
    itemsForSelectAll.length > 0 && 
    itemsForSelectAll.every(item => selectedItemIds.has(item.id))
  , [itemsForSelectAll, selectedItemIds]);

  const totalItemsCount = pagination.totalItems;
  const hasFilters = useMemo(() => 
    Object.entries(filters).some(([key, value]) => {
      // Exclude pagination related filters and empty search term
      if (['page', 'pageSize'].includes(key)) return false;
      if (key === 'searchTerm') return value && value.trim() !== '';
      // For other filters, check if they are not 'all' or empty string
      return value !== 'all' && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    })
  , [filters]);

  // Early returns for loading and error states
  if (loading && !providers.length) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('providers.titleMultiple') })} />;
  }

  if (error && !providers.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">
          {t('errors.dataLoadErrorTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {typeof error === 'string' ? error : error?.message || t('errors.genericFetchError')}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry')}
        </Button>
      </div>
    );
  }
  
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
                    onStartSelectionMode={handleStartSelectionMode}
                    itemTypeForActions={t('providers.itemTitleSingular')}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('buttons.refresh')}
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

      {/* Selection Mode Header */}
      {isSelectionModeActive && (
        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAllVisible"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible')}
              />
              <label htmlFor="selectAllVisible" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {t('bulkActions.selectedCount', { count: selectedItemIds.size })}
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
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSelectionAction}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItemIds.size === 0}
              >
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {selectionMode === 'edit' ? t('common.edit') : t('common.delete')} {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
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
              setFilters({
                searchTerm: '', providerType: 'all', status: 'all', city: '',
                contactPerson: '', notes: '', legalType: 'all', page: 1, pageSize: 10,
              }); 
              // Reset sort config
              const defaultSort = { key: 'updated_date', direction: 'descending' };
              setSortConfig(defaultSort);
              try {
                saveToStorage('providers_sort', defaultSort);
              } catch (e) {
                console.warn('[ProvidersTab] Failed to save default sort config on reset:', e);
              }
              setSelectedItemIds(new Set()); 
          }}
          sortConfig={sortConfig} 
          onSortChange={handleSortChange} // Use the new centralized handler
          allProviders={providers}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {/* Error Message */}
      {error && providers.length > 0 && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('providers.titleMultiple'), message: typeof error === 'string' ? error : error?.message || ""})}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && providers.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('providers.titleMultiple') })} />}

      {/* Content */}
      {!loading && totalItemsCount === 0 && hasFilters ? (
        <EmptyState
          icon={Building2}
          title={t('emptyStates.noFilterMatchTitle', {item: t('providers.titleMultiple')})}
          message={t('emptyStates.noFilterMatchMessage')}
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
      ) : (paginatedProviders.length > 0 || (loading && providers.length > 0)) && (
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
              loading={loading && providers.length > 0}
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
                      const { id } = newSortState[0];
                      handleSortChange(id); // Call the centralized handleSortChange
                  } else { 
                      // If sorting is cleared, set a default
                      const defaultSort = { key: 'updated_date', direction: 'descending' };
                      setSortConfig(defaultSort);
                      try {
                          saveToStorage('providers_sort', defaultSort);
                      } catch (e) {
                          console.warn('[ProvidersTab] Failed to save default sort config:', e);
                      }
                  }
              }}
              currentSort={sortConfig.key ? [{id: sortConfig.key, desc: sortConfig.direction === 'descending'}] : []}
              entityName={t('providers.titleMultiple')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openDetailsDrawer(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {/* Card View Pagination */}
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
                  {t('buttons.previous')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(pagination.pageIndex + 1)} 
                  disabled={(pagination.pageIndex + 1) * pagination.pageSize >= totalItemsCount || loading}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('buttons.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      {isProviderDialogOpen && (
        <ProviderDialog
          isOpen={isProviderDialogOpen}
          onClose={handleProviderDialogClose}
          provider={currentProviderForDialog}
          allCities={Array.from(new Set(providers.map(p => p.contact?.city).filter(Boolean)))}
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
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          loading={deleteDialogState.loading || loading} 
          t={t} isRTL={isRTL}
        />
      )}
      {isDetailsDrawerOpen && selectedProviderIdForDrawer && (
        <ProviderDetailsDrawer
          providerId={selectedProviderIdForDrawer}
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEditProvider={(providerToEdit) => {
            setIsDetailsDrawerOpen(false);
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
