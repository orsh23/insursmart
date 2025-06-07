
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DoctorProviderAffiliation } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { Provider } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
// Corrected DataTable import path
import DataTable from '@/components/ui/data-table';
import LinkageDialog from './LinkageDialog';
import LinkageFilterBar from './LinkageFilterBar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

import { Plus, Network, Edit, Trash2, UploadCloud, RefreshCw, XCircle, CheckCircle2, AlertTriangle, DownloadCloud } from 'lucide-react';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import EmptyState from '@/components/ui/empty-state';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

// Placeholder for ImportDialog - assuming it exists or will be implemented
// import ImportDialog from '@/components/common/ImportDialog';


export default function ProviderDoctorLinkageTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = language === 'he' ? he : enUS;

  const [linkages, setLinkages] = useState([]); // This will hold the currently displayed (paginated) data
  const [allLinkages, setAllLinkages] = useState([]); // Store for original fetched data (before filtering/sorting)
  const [doctorsMap, setDoctorsMap] = useState({});
  const [providersMap, setProvidersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(() => loadFromStorage('linkage_filters', {
    searchTerm: '',
    provider_id: 'all',
    doctor_id: 'all',
    affiliation_status: 'all',
    page: 1,
    pageSize: 10,
  }));

  const [sortConfig, setSortConfig] = useState(() => loadFromStorage('linkage_sort_config', { key: 'start_date', direction: 'descending' }));

  const [isLinkageDialogOpen, setIsLinkageDialogOpen] = useState(false);
  const [currentLinkageForDialog, setCurrentLinkageForDialog] = useState(null);

  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false); // Placeholder if needed

  // State for selection mode
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const [currentView, setCurrentView] = useState(() => loadFromStorage('linkage_view_preference', 'table')); // Default table


  const getDoctorName = useCallback((id) => {
    const doc = doctorsMap[id];
    if (!doc) return id;
    if (typeof doc === 'string') return doc; // Already formatted name
    // Fallback for older doctor map structure, if any
    return `${doc.first_name_en || doc.first_name_he || ''} ${doc.last_name_en || doc.last_name_he || ''}`.trim() || id;
  }, [doctorsMap]);

  const getProviderName = useCallback((id) => {
    const prov = providersMap[id];
    if (!prov) return id;
    if (typeof prov === 'string') return prov; // Already formatted name
    // Fallback
    return prov.name?.en || prov.name?.he || id;
  }, [providersMap]);


  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // Add staggered delays to prevent rate limiting on multiple simultaneous calls
      const [docData, provData, affData] = await Promise.all([
        new Promise(resolve => setTimeout(() => resolve(Doctor.list()), 100)),
        new Promise(resolve => setTimeout(() => resolve(Provider.list()), 300)),
        new Promise(resolve => setTimeout(() => resolve(DoctorProviderAffiliation.list()), 600))
      ]);

      const docMap = {};
      (Array.isArray(docData) ? docData : []).forEach(d => {
        const fName = language === 'he' ? (d.first_name_he || d.first_name_en) : (d.first_name_en || d.first_name_he);
        const lName = language === 'he' ? (d.last_name_he || d.last_name_en) : (d.last_name_en || d.last_name_he);
        docMap[d.id] = `${fName || ''} ${lName || ''}`.trim() || d.id;
      });
      setDoctorsMap(docMap);

      const provMap = {};
      (Array.isArray(provData) ? provData : []).forEach(p => {
        provMap[p.id] = language === 'he' ? (p.name?.he || p.name?.en) : (p.name?.en || p.name?.he) || p.id;
      });
      setProvidersMap(provMap);

      setAllLinkages(Array.isArray(affData) ? affData : []);

    } catch (err) {
      console.error("Error fetching data for Linkage tab", err);
      let errorMessage = err.message || t('errors.fetchFailedGeneral', { item: t('linkage.itemTitlePlural') });

      if (err.message?.includes('Rate limit') || err.response?.status === 429) {
        errorMessage = t('errors.rateLimitExceeded', { defaultValue: 'Service is temporarily busy. Please try again in a few moments.' });
        // For rate limiting, set a retry timer
        setTimeout(() => {
          if (!forceRefresh) { // Only auto-retry if this wasn't a manual refresh
            fetchData(true);
          }
        }, 5000);
      }

      setError(errorMessage);
      toast({ title: t('errors.dataLoadErrorTitle'), description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    saveToStorage('linkage_filters', filters);
  }, [filters]);

  useEffect(() => {
    saveToStorage('linkage_sort_config', sortConfig);
  }, [sortConfig]);

  const handleRefresh = () => {
    fetchData(true);
    toast({
      title: t('common.refreshingData'),
      description: t('messages.fetchingLatest', { item: t('linkage.itemTitlePlural') }),
    });
  };

  const filteredAndSortedLinkages = useMemo(() => {
    let items = Array.isArray(allLinkages) ? allLinkages.filter(Boolean) : [];
    const { searchTerm, provider_id, doctor_id, affiliation_status } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(link =>
        (getDoctorName(link.doctor_id) || '').toLowerCase().includes(termLower) ||
        (getProviderName(link.provider_id) || '').toLowerCase().includes(termLower)
      );
    }
    if (provider_id !== 'all') items = items.filter(link => link.provider_id === provider_id);
    if (doctor_id !== 'all') items = items.filter(link => link.doctor_id === doctor_id);
    if (affiliation_status !== 'all') items = items.filter(link => link.affiliation_status === affiliation_status);

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'doctor_id') {
          valA = getDoctorName(a.doctor_id)?.toLowerCase();
          valB = getDoctorName(b.doctor_id)?.toLowerCase();
        } else if (sortConfig.key === 'provider_id') {
          valA = getProviderName(a.provider_id)?.toLowerCase();
          valB = getProviderName(b.provider_id)?.toLowerCase();
        } else if (sortConfig.key === 'start_date' || sortConfig.key === 'end_date') {
          // Handle null/undefined dates for sorting. Latest dates first for descending.
          valA = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
          valB = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        // Handle mixed types or null/undefined values for generic sorting
        if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;


        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [allLinkages, filters, sortConfig, getDoctorName, getProviderName, language]);

  const paginatedLinkages = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    return filteredAndSortedLinkages.slice(startIndex, endIndex);
  }, [filteredAndSortedLinkages, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedLinkages.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize) || 1;

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSortChange = useCallback((newSortKey) => {
    setSortConfig(prevSortConfig => {
      let direction = 'ascending';
      if (prevSortConfig.key === newSortKey && prevSortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (prevSortConfig.key === newSortKey && prevSortConfig.direction === 'descending') {
        // If already descending, clicking again removes sort or cycles to default
        return { key: 'start_date', direction: 'descending' }; // Default sort
      }
      return { key: newSortKey, direction };
    });
  }, []);

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));

  const openLinkageDialogForEdit = (linkageToEdit) => {
    setCurrentLinkageForDialog(linkageToEdit);
    setIsLinkageDialogOpen(true);
  };

  const openLinkageDialogForAdd = () => {
    setCurrentLinkageForDialog(null); // For new linkage
    setIsLinkageDialogOpen(true);
  };

  const handleLinkageDialogClose = (refreshNeeded) => {
    setIsLinkageDialogOpen(false);
    setCurrentLinkageForDialog(null);
    if (refreshNeeded) {
      fetchData(true); // Refresh all data
      // Toast handled inside dialog for specific create/update messages
    }
  };

  const handleStartSelectionMode = (mode) => {
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set());
    toast({
      title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode}`, { defaultValue: mode }) }),
      description: t('bulkActions.selectionModeActiveDesc', { mode: t(`common.${mode}`, { defaultValue: mode }), entity: t('linkage.itemTitlePlural') }),
      variant: 'info'
    });
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItemIds(new Set());
  };

  const handleToggleSelection = useCallback((itemId) => {
    if (itemId === undefined || itemId === null) return;
    setSelectedItemIds(prevIds => {
      const newSelectedIds = new Set(prevIds);
      if (newSelectedIds.has(itemId)) newSelectedIds.delete(itemId);
      else newSelectedIds.add(itemId);
      return newSelectedIds;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    // For table view, select all visible (paginatedLinkages)
    const itemsToConsider = paginatedLinkages;
    const allVisibleValidItemIds = itemsToConsider.filter(item => item && item.id != null).map(item => item.id);

    const allCurrentlySelectedOnPage = allVisibleValidItemIds.length > 0 && allVisibleValidItemIds.every(id => selectedItemIds.has(id));

    if (allCurrentlySelectedOnPage) {
      setSelectedItemIds(prevIds => {
        const newIds = new Set(prevIds);
        allVisibleValidItemIds.forEach(id => newIds.delete(id));
        return newIds;
      });
    } else {
      setSelectedItemIds(prevIds => new Set([...prevIds, ...allVisibleValidItemIds]));
    }
  }, [paginatedLinkages, selectedItemIds]);


  const handleConfirmSelectionAction = () => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ title: t('bulkActions.noItemsSelectedTitle'), description: t('bulkActions.selectItemsPrompt', { mode: selectionMode }), variant: "warning" });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const linkageToEdit = allLinkages.find(link => link.id === idsArray[0]);
        if (linkageToEdit) {
          openLinkageDialogForEdit(linkageToEdit);
        } else {
          toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
        }
      } else {
        toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: t('linkage.itemTitleSingular') }), variant: "info" });
        return;
      }
    } else if (selectionMode === 'delete') {
      const itemName = idsArray.length === 1 ? t('linkage.itemTitleSingular') : t('linkage.itemTitlePlural');
      setDeleteDialogState({
        isOpen: true,
        itemIds: idsArray,
        itemName: itemName, // This will be used like "Confirm Delete Linkage (X)" or "Confirm Delete Linkages (X)"
        message: t('linkage.bulkDeleteConfirmMessage', { count: idsArray.length, itemName: t('linkage.itemTitlePlural').toLowerCase() })
      });
    }

    if (!(selectionMode === 'edit' && idsArray.length > 1)) {
      handleCancelSelectionMode();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await DoctorProviderAffiliation.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting linkage ${id}:`, err);
        toast({
          title: t('errors.deleteFailedTitle'),
          description: t('linkage.deleteError', { error: err.message }),
          variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({
        title: t('messages.success'),
        description: t('bulkActions.deleteResultDesc', { successCount: successCount, failCount: errorCount, entity: t('linkage.itemTitlePlural') })
      });
      fetchData(true);
    }
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  };

  const handleImportSubmit = async (records) => { // Placeholder
    setIsImportDialogOpen(false);
    toast({ title: t('import.comingSoonTitle'), description: t('import.featureNotImplemented', { entity: t('linkage.itemTitlePlural') }), variant: 'info' });
  };

  const linkageGlobalActionsConfig = useMemo(() => [
    { labelKey: 'linkage.addLink', defaultLabel: 'Add Linkage', icon: Plus, action: openLinkageDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: () => handleStartSelectionMode('edit'), type: 'edit' },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: () => handleStartSelectionMode('delete'), type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('common.export', { defaultValue: 'Export' }) }) }), disabled: true, type: 'export' },
  ], [t, openLinkageDialogForAdd, handleStartSelectionMode, setIsImportDialogOpen, toast]);

  const linkageColumnsForTable = useMemo(() => [
    {
      accessorKey: 'doctor_id',
      header: t('fields.doctor', { defaultValue: 'Doctor' }),
      cell: ({ row }) => getDoctorName(row.original.doctor_id),
      enableSorting: true,
    },
    {
      accessorKey: 'provider_id',
      header: t('fields.provider', { defaultValue: 'Provider' }),
      cell: ({ row }) => getProviderName(row.original.provider_id),
      enableSorting: true,
    },
    {
      accessorKey: 'start_date',
      header: t('fields.startDate', { defaultValue: 'Start Date' }),
      cell: ({ row }) => row.original.start_date ? format(new Date(row.original.start_date), 'PP', { locale: currentLocale }) : t('common.notSet', { defaultValue: 'Not Set' }),
      enableSorting: true,
    },
    {
      accessorKey: 'end_date',
      header: t('fields.endDate', { defaultValue: 'End Date' }),
      cell: ({ row }) => row.original.end_date ? format(new Date(row.original.end_date), 'PP', { locale: currentLocale }) : t('common.notSet', { defaultValue: 'Not Set' }),
      enableSorting: true,
    },
    {
      accessorKey: 'affiliation_status',
      header: t('fields.affiliationStatus', { defaultValue: 'Affiliation Status' }),
      cell: ({ row }) => (
        <Badge className={`text-xs ${
          row.original.affiliation_status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200'
            : row.original.affiliation_status === 'inactive' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-200'
        }`}>
          {t(`status.${row.original.affiliation_status}`, { defaultValue: row.original.affiliation_status })}
        </Badge>
      ),
      enableSorting: true,
    },
  ], [t, getDoctorName, getProviderName, currentLocale, language]);

  if (loading && allLinkages.length === 0 && !error) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('linkage.itemTitlePlural') })} />;
  }

  if (error && allLinkages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle', { defaultValue: 'Failed to load data' })}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry', { defaultValue: 'Retry' })}
        </Button>
      </div>
    );
  }

  const itemsForSelectAllCheckbox = paginatedLinkages;
  const allVisibleSelected = Array.isArray(itemsForSelectAllCheckbox) && itemsForSelectAllCheckbox.length > 0 && itemsForSelectAllCheckbox.every(item => selectedItemIds.has(item.id));


  return (
    <div className="space-y-4">
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <Network className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('pageTitles.providerDoctorLinkageShort', { defaultValue: 'Provider-Doctor Linkages' })} ({totalItems})
          </h2>
          <div className="flex items-center gap-2">
            <GlobalActionButton
              actionsConfig={linkageGlobalActionsConfig}
              onStartSelectionMode={handleStartSelectionMode}
              itemTypeForActions={t('linkage.itemTitleSingular', { defaultValue: 'Linkage' })}
              t={t} isRTL={isRTL}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.refresh', { defaultValue: 'Refresh' })}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); saveToStorage('linkage_view_preference', view); }}
              availableViews={['table']} // Only table view is supported for linkages since card view doesn't make much sense for relationships
              entityName={t('linkage.itemTitlePlural', { defaultValue: 'Provider-Doctor Linkages' })}
              t={t} isRTL={isRTL}
            />
          </div>
        </div>
      )}

      {isSelectionModeActive && (
        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="selectAllVisibleLinkages"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible', { defaultValue: 'Select all visible' })}
                disabled={itemsForSelectAllCheckbox.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleLinkages" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItemIds.size > 0
                  ? t('bulkActions.selectedCount', { count: selectedItemIds.size, defaultValue: `Selected ${selectedItemIds.size}` })
                  : t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode}`, { defaultValue: selectionMode }), defaultValue: `Select items to ${selectionMode}` })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelSelectionMode} className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button size="sm" onClick={handleConfirmSelectionAction} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white" disabled={selectedItemIds.size === 0 || (selectionMode === 'edit' && selectedItemIds.size !== 1)}>
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {selectionMode === 'edit' ? t('common.edit', { defaultValue: 'Edit' }) : t('common.delete', { defaultValue: 'Delete' })} {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isSelectionModeActive && (
        <LinkageFilterBar
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          doctors={Object.keys(doctorsMap).map(id => ({ id, name: getDoctorName(id) }))}
          providers={Object.keys(providersMap).map(id => ({ id, name: getProviderName(id) }))}
          t={t} isRTL={isRTL} language={language}
        />
      )}

      {error && !loading && allLinkages.length > 0 && ( // Show only if there's already some data but an update failed
        <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: t('linkage.itemTitlePlural', { defaultValue: 'linkages' }), message: error, defaultValue: `Some ${t('linkage.itemTitlePlural')} could not be loaded: ${error}` })}</span>
        </div>
      )}

      {(loading && allLinkages.length > 0) && <LoadingSpinner message={t('messages.updatingData', { item: t('linkage.itemTitlePlural') })} />}

      {!loading && totalItems === 0 && (filters.searchTerm || filters.provider_id !== 'all' || filters.doctor_id !== 'all' || filters.affiliation_status !== 'all') && allLinkages.length > 0 ? (
        <EmptyState
          icon={Network}
          title={t('linkage.noLinkagesFound', { defaultValue: 'No Linkages Found' })}
          message={t('linkage.noLinkagesFilterMessage', { defaultValue: 'No linkages match your current filters. Try adjusting them.' })}
        />
      ) : !loading && totalItems === 0 && !error ? (
        <EmptyState
          icon={Network}
          title={t('linkage.noLinkagesFound', { defaultValue: 'No Linkages Found' })}
          message={t('linkage.startAdding', { defaultValue: 'It looks like you haven\'t added any linkages yet. Click the button below to add your first linkage.' })}
          actionButton={
            !isSelectionModeActive && <Button onClick={openLinkageDialogForAdd}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('linkage.addLink', { defaultValue: 'Add Linkage' })}</Button>
          }
        />
      ) : (paginatedLinkages.length > 0 || (loading && allLinkages.length > 0)) && (
        <>
          {/* Card view can be added here if needed, for now, only table */}
          {currentView === 'table' && (
            <DataTable
              columns={linkageColumnsForTable}
              data={paginatedLinkages} // Use paginatedLinkages for current page data
              loading={loading && paginatedLinkages.length === 0} // Only show full overlay if no data loaded yet
              error={null}
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [10, 20, 50, 100],
              }}
              onSortChange={(newSortState) => {
                if (newSortState && newSortState.length > 0) {
                  const { id, desc } = newSortState[0];
                  handleSortChange(id, desc ? 'descending' : 'ascending');
                } else {
                  handleSortChange('start_date', 'descending'); // Default sort
                }
              }}
              currentSort={sortConfig.key ? [{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }] : []}
              entityName={t('linkage.itemTitlePlural', { defaultValue: 'Doctor-Provider Affiliations' })}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible} // Passed to DataTable for global select all
              onRowClick={({ original: item }) => !isSelectionModeActive && item?.id && openLinkageDialogForEdit(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {/* Pagination for Card View, if implemented */}
        </>
      )}

      {isLinkageDialogOpen && (
        <LinkageDialog
          open={isLinkageDialogOpen}
          onOpenChange={setIsLinkageDialogOpen} // For controlled dialog
          onCloseDialog={handleLinkageDialogClose} // Custom close handler
          affiliationData={currentLinkageForDialog}
          doctorsList={Object.keys(doctorsMap).map(id => ({ id, name: getDoctorName(id) }))} // Pass lists for dropdowns
          providersList={Object.keys(providersMap).map(id => ({ id, name: getProviderName(id) }))}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', { item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.length || 1, defaultValue: `Confirm Delete ${deleteDialogState.itemName}` })}
          description={deleteDialogState.message}
          confirmText={t('common.delete', { defaultValue: 'Delete' })}
          cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
          loading={loading && deleteDialogState.isOpen} // Show loading on dialog if main list is loading during delete
          t={t} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && ( // Placeholder
        // Make sure you have an ImportDialog component imported and available
        // <ImportDialog
        //   isOpen={isImportDialogOpen}
        //   onClose={() => setIsImportDialogOpen(false)}
        //   onImportSubmit={handleImportSubmit}
        //   entityName={t('linkage.itemTitlePlural')}
        //   sampleHeaders={['Doctor License', 'Provider Legal ID', 'Start Date (YYYY-MM-DD)', 'End Date (YYYY-MM-DD)', 'Status (active/inactive/pending_approval)']}
        //   language={language} isRTL={isRTL}
        // />
        // For now, it will just show a toast if uncommented and ImportDialog is not defined.
        null
      )}
    </div>
  );
}
