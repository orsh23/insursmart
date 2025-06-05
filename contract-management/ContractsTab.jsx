import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities'; // To fetch provider names
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

import ContractDialog from './ContractDialog';
import ContractCard from './ContractCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import ContractFilterBar from './ContractFilterBar';
import ImportDialog from '@/components/common/ImportDialog';
import { Badge } from '@/components/ui/badge';

import {
    ScrollText, Plus, UploadCloud, FilterX, RefreshCw, AlertTriangle, FileSignature
} from 'lucide-react';

import { format, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Simplified cache
const contractsApiCache = {
  contracts: { data: null, timestamp: null, loading: false, error: null },
  providers: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = contractsApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < contractsApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (contractsApiCache[cacheKey]) {
    contractsApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
   if (contractsApiCache[cacheKey]) {
    contractsApiCache[cacheKey].loading = isLoading;
    if(isLoading) contractsApiCache[cacheKey].error = null;
  }
};


export default function ContractsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [contracts, setContracts] = useState([]);
  const [providers, setProviders] = useState([]); // Store providers for names
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    providerId: 'all',
    page: 1,
    pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name_en', direction: 'ascending' });

  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' });

  const [currentView, setCurrentView] = useState(localStorage.getItem('contracts_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const getLocalizedContractName = useCallback((contract) => {
    if (!contract) return t('contracts.unknownContract', {defaultValue: 'Unknown Contract'});
    const lang = t('common.langCode', {defaultValue: 'en'});
    const localizedName = lang === 'he' ? (contract.name_he || contract.name_en) : (contract.name_en || contract.name_he);
    return localizedName || contract.contract_number || t('contracts.unknownContract', {defaultValue: 'Unknown Contract'});
  }, [t]);

  const providersMap = useMemo(() => {
    return providers.reduce((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {});
  }, [providers]);

  const getProviderName = useCallback((providerId) => {
    const provider = providersMap[providerId];
    if (!provider) return t('common.unknownProvider');
    const lang = t('common.langCode', {defaultValue: 'en'});
    return lang === 'he' ? (provider.name?.he || provider.name?.en) : (provider.name?.en || provider.name?.he);
  }, [providersMap, t]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    let fetchError = null;

    // Fetch Providers
    const providerCacheKey = 'providers';
    if (forceRefresh || !isCacheValid(providerCacheKey) || !contractsApiCache[providerCacheKey].data) {
        setCacheLoading(providerCacheKey, true);
        try {
            const fetchedProviders = await Provider.list();
            const validProviders = Array.isArray(fetchedProviders) ? fetchedProviders : [];
            setProviders(validProviders);
            updateCache(providerCacheKey, validProviders);
        } catch (err) {
            console.error("Error fetching providers:", err);
            fetchError = fetchError || err;
             if (isCacheValid(providerCacheKey) && contractsApiCache[providerCacheKey].data) {
                updateCache(providerCacheKey, contractsApiCache[providerCacheKey].data, err.message);
             } else {
                updateCache(providerCacheKey, [], err.message);
             }
        } finally {
            setCacheLoading(providerCacheKey, false);
        }
    } else if (contractsApiCache[providerCacheKey].data) {
        setProviders(contractsApiCache[providerCacheKey].data);
         if (contractsApiCache[providerCacheKey].error) fetchError = fetchError || new Error(contractsApiCache[providerCacheKey].error);
    }

    // Fetch Contracts
    const contractCacheKey = 'contracts';
     if (forceRefresh || !isCacheValid(contractCacheKey) || !contractsApiCache[contractCacheKey].data) {
        setCacheLoading(contractCacheKey, true);
        try {
            const fetchedContracts = await Contract.list('-updated_date');
            const validContracts = Array.isArray(fetchedContracts) ? fetchedContracts : [];
            setContracts(validContracts);
            updateCache(contractCacheKey, validContracts);
            setRetryCount(0); // Reset retry on successful fetch
        } catch (err) {
            console.error("Error fetching contracts:", err);
            fetchError = fetchError || err;
            if (isCacheValid(contractCacheKey) && contractsApiCache[contractCacheKey].data) {
                updateCache(contractCacheKey, contractsApiCache[contractCacheKey].data, err.message);
            } else {
                updateCache(contractCacheKey, [], err.message);
            }
        } finally {
            setCacheLoading(contractCacheKey, false);
        }
    } else if (contractsApiCache[contractCacheKey].data) {
        setContracts(contractsApiCache[contractCacheKey].data);
        if (contractsApiCache[contractCacheKey].error) fetchError = fetchError || new Error(contractsApiCache[contractCacheKey].error);
    }
    
    if (fetchError) {
        let errorMessage = t('errors.fetchFailedGeneral', { item: t('pageTitles.contracts')});
        if (fetchError.response?.status === 429 || fetchError.message?.includes("429")) {
            errorMessage = t('errors.rateLimitExceededShort');
            if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
        } else if (fetchError.message?.toLowerCase().includes('network error') || fetchError.message?.toLowerCase().includes('failed to fetch')) {
            errorMessage = t('errors.networkErrorGeneral');
            if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
        } else {
            setError(errorMessage);
        }
    }
    setLoading(false);
  }, [t, retryCount]);


  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && (error?.includes(t('errors.rateLimitExceededShort')) || error?.includes(t('errors.networkErrorGeneral')))) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, error, fetchData, t]);

  const handleRefresh = () => {
    setRetryCount(0);
    fetchData(true);
    toast({
      title: t('common.refreshingData'),
      description: t('messages.fetchingLatest', { item: t('pageTitles.contracts') }),
    });
  };

  const filteredAndSortedContracts = useMemo(() => {
    let items = Array.isArray(contracts) ? contracts.filter(Boolean) : [];
    const { searchTerm, status, providerId } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(c =>
        (getLocalizedContractName(c) && getLocalizedContractName(c).toLowerCase().includes(termLower)) ||
        (c.contract_number && c.contract_number.toLowerCase().includes(termLower)) ||
        (getProviderName(c.provider_id) && getProviderName(c.provider_id).toLowerCase().includes(termLower))
      );
    }
    if (status !== 'all') items = items.filter(c => c.status === status);
    if (providerId !== 'all') items = items.filter(c => c.provider_id === providerId);

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'name_en' || sortConfig.key === 'name_he') {
            valA = a[sortConfig.key]?.toLowerCase() || '';
            valB = b[sortConfig.key]?.toLowerCase() || '';
        } else if (sortConfig.key === 'provider_name') {
            valA = getProviderName(a.provider_id)?.toLowerCase() || '';
            valB = getProviderName(b.provider_id)?.toLowerCase() || '';
        } else if (sortConfig.key === 'valid_from' || sortConfig.key === 'valid_to' || sortConfig.key === 'updated_date') {
          valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
          valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
        }
        
        if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [contracts, filters, sortConfig, getLocalizedContractName, getProviderName]);

  const paginatedContracts = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedContracts.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedContracts, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedContracts.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));

  const handleDataTableSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      const { id, desc } = newSortState[0];
      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
    } else {
      setSortConfig({ key: 'name_en', direction: 'ascending' }); // Default sort
    }
  }, []);
  
  const openContractDialog = (contract = null) => {
    setCurrentContract(contract);
    setIsContractDialogOpen(true);
  };

  const handleContractDialogClose = (refreshNeeded, operationType = null, contractTitleParam = '') => {
    setIsContractDialogOpen(false);
    setCurrentContract(null);
    if (refreshNeeded) {
      fetchData(true);
      const nameToDisplay = contractTitleParam || t('common.item');
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('contracts.createSuccess', { name: nameToDisplay }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('contracts.updateSuccess', { name: nameToDisplay }) });
      }
    }
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedItemIds(new Set());
  };

  const handleEditAction = () => {
    if (selectedItemIds.size === 1) {
      const contractIdToEdit = selectedItemIds.values().next().value;
      const contractToEdit = contracts.find(c => c.id === contractIdToEdit);
      if (contractToEdit) {
        openContractDialog(contractToEdit);
      }
    } else if (selectedItemIds.size === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('contracts.itemTitleSingular', {defaultValue: 'Contract'}) }) });
    } else {
       toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('pageTitles.contracts')}), variant: 'info' });
    }
  };

  const handleDeleteAction = () => {
    if (selectedItemIds.size > 0) {
      const idsToDelete = Array.from(selectedItemIds);
      const firstItemName = idsToDelete.length > 0 ? getLocalizedContractName(contracts.find(c => c.id === idsToDelete[0])) : t('contracts.itemTitleSingular', {defaultValue: 'Contract'});
      const itemName = idsToDelete.length === 1 ? firstItemName : t('pageTitles.contracts');
      setDeleteDialogState({
          isOpen: true,
          itemIds: idsToDelete,
          itemName: itemName,
          message: t('contracts.bulkDeleteConfirmMessage', { count: idsToDelete.length, itemName: itemName.toLowerCase() })
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('pageTitles.contracts') }) });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await Contract.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting contract ${id}:`, err);
        const contractName = getLocalizedContractName(contracts.find(c => c.id === id)) || t('contracts.itemTitleSingular', {defaultValue: 'Contract'});
        toast({
            title: t('errors.deleteFailedTitle'),
            description: t('contracts.deleteError', { name: contractName, error: err.message }),
            variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({
        title: t('messages.success'),
        description: t('contracts.bulkDeleteSuccess', { count: successCount }),
      });
      fetchData(true);
    }
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '', message: '' });
    handleCancelSelectionMode();
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
    const itemsToConsider = currentView === 'table' ? filteredAndSortedContracts : paginatedContracts;
    const allVisibleValidItems = itemsToConsider.filter(item => item && item.id != null);
    setSelectedItemIds(prevIds => {
      const currentIds = new Set(prevIds);
      const allCurrentlySelectedOnPage = allVisibleValidItems.length > 0 && allVisibleValidItems.every(item => currentIds.has(item.id));
      if (allCurrentlySelectedOnPage) {
        allVisibleValidItems.forEach(item => currentIds.delete(item.id));
      } else {
        allVisibleValidItems.forEach(item => currentIds.add(item.id));
      }
      return currentIds;
    });
  }, [paginatedContracts, filteredAndSortedContracts, currentView]);

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    // Basic mapping, adjust based on actual CSV headers and Contract entity structure
    const contractsToCreate = records.map(rec => ({
        name_en: rec['Name EN'] || rec['name_en'],
        name_he: rec['Name HE'] || rec['name_he'],
        contract_number: rec['Contract Number'] || rec['contract_number'],
        provider_id: rec['Provider ID'] || rec['provider_id'], // Needs to be actual ID or have a lookup
        valid_from: rec['Valid From'] || rec['valid_from'],
        valid_to: rec['Valid To'] || rec['valid_to'],
        status: rec['Status']?.toLowerCase() || rec['status']?.toLowerCase() || 'draft',
        // Add other fields as necessary from CSV
    })).filter(c => (c.name_en || c.name_he || c.contract_number) && c.provider_id && c.valid_from);

    if(contractsToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('pageTitles.contracts')}), variant: 'warning'});
        return;
    }

    let successCount = 0; let errorCount = 0;
    for (const contractData of contractsToCreate) {
        try { await Contract.create(contractData); successCount++; }
        catch (err) { console.error("Error creating contract from import:", err, contractData); errorCount++; }
    }
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount, errorCount, entity: t('pageTitles.contracts')}),
    });
    if (successCount > 0) fetchData(true);
  };

  const globalActionsConfig = useMemo(() => [
    { labelKey: 'contracts.addNewContract', defaultLabel: 'Add New Contract', icon: Plus, action: () => openContractDialog() },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true) },
  ], [t, openContractDialog, setIsImportDialogOpen]);

  const contractColumns = useMemo(() => [
    { 
      accessorKey: 'name', // Combined name for sorting/filtering
      header: t('contracts.fields.name'),
      cell: ({ row }) => getLocalizedContractName(row.original) || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'contract_number', 
      header: t('contracts.fields.contractNumber'),
      cell: ({ row }) => row.original.contract_number || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'provider_name', // Using provider_name for sorting/filtering convenience
      header: t('contracts.fields.provider'),
      cell: ({ row }) => getProviderName(row.original.provider_id) || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'status', 
      header: t('contracts.fields.status'),
      cell: ({ row }) => {
        const statusText = row.original.status ? t(`contractStatus.${row.original.status.toLowerCase()}`, {defaultValue: row.original.status}) : t('common.notSet');
        let statusBadgeVariant = 'secondary';
        if (row.original.status === 'active') statusBadgeVariant = 'success';
        else if (row.original.status === 'expired' || row.original.status === 'terminated') statusBadgeVariant = 'destructive_outline';
        else if (row.original.status === 'draft') statusBadgeVariant = 'outline';
        return <Badge variant={statusBadgeVariant} className="text-xs">{statusText}</Badge>;
      },
      enableSorting: true,
    },
    { 
      accessorKey: 'valid_from', 
      header: t('contracts.fields.validFrom'),
      cell: ({ row }) => (row.original.valid_from && isValid(parseISO(row.original.valid_from))
        ? format(parseISO(row.original.valid_from), 'PP', { locale: currentLocale })
        : t('common.notSet')
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'valid_to', 
      header: t('contracts.fields.validTo'),
      cell: ({ row }) => (row.original.valid_to && isValid(parseISO(row.original.valid_to))
        ? format(parseISO(row.original.valid_to), 'PP', { locale: currentLocale })
        : t('common.notSet')
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'updated_date', 
      header: t('common.lastUpdated'),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date))
        ? format(parseISO(row.original.updated_date), 'PP', { locale: currentLocale })
        : t('common.unknown')
      ),
      enableSorting: true,
    },
  ], [t, currentLocale, getLocalizedContractName, getProviderName]);

  if (loading && !contracts.length && !error) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('pageTitles.contracts')})} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <FileSignature className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('pageTitles.contracts')} ({totalItems})
        </h2>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={globalActionsConfig}
                onEditItems={handleEditAction}
                onDeleteItems={handleDeleteAction}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItemIds.size}
                itemTypeForActions={t('contracts.itemTitleSingular', {defaultValue: 'Contract'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading && contractsApiCache.contracts.loading}>
                <RefreshCw className={`h-4 w-4 ${loading && contractsApiCache.contracts.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh')}
            </Button>
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); localStorage.setItem('contracts_view_preference', view);}}
                availableViews={['card', 'table']}
                entityName={t('pageTitles.contracts')}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <ContractFilterBar
        filters={filters}
        onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
        onResetFilters={() => {
          setFilters({ searchTerm: '', status: 'all', providerId: 'all', page: 1, pageSize: filters.pageSize });
          setSortConfig({ key: 'name_en', direction: 'ascending' });
          handleCancelSelectionMode();
          toast({
              title: t('filters.clearedTitle'),
              description: t('filters.filtersReset', { item: t('pageTitles.contracts') }),
          });
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => {
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
            setSortConfig({ key, direction });
        }}
        providers={providers} // Pass providers for the filter dropdown
        t={t} language={language} isRTL={isRTL}
      />
      
      {error && (contracts.length === 0 || retryCount > 0) && (
         <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
                 { (error.includes(t('errors.networkErrorGeneral')) || error.includes(t('errors.rateLimitExceededShort'))) && retryCount < 3 &&
                    <p className="text-sm text-destructive dark:text-red-300 mt-1">{t('errors.retryingSoon')}</p>
                }
                <Button variant="outline" size="sm" onClick={() => {setRetryCount(0); handleRefresh();}} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow')}
                </Button>
            </CardContent>
        </Card>
      )}

      {!loading && !error && filteredAndSortedContracts.length === 0 && (
        <EmptyState
          icon={FileSignature}
          title={t('contracts.noContractsFilterDesc')}
          message={t('contracts.noContractsDesc')}
          actionButton={
            <Button onClick={() => openContractDialog()}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewContract', {defaultValue: 'Add New Contract'})}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {(!error || contracts.length > 0) && (filteredAndSortedContracts.length > 0 || loading && contracts.length > 0) && (
        <>
          {currentView === 'card' && paginatedContracts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  providerName={getProviderName(contract.provider_id)}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIds.has(contract.id)}
                  onToggleSelection={() => handleToggleSelection(contract.id)}
                  onCardClick={() => !isSelectionModeActive && openContractDialog(contract)}
                />
              ))}
            </div>
          )}

          {currentView === 'table' && (
            <DataTable
              columns={contractColumns}
              data={filteredAndSortedContracts}
              loading={loading && contracts.length > 0}
              error={null} // Error is handled globally for the tab
              entityName={t('pageTitles.contracts')}
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
              onSortChange={handleDataTableSortChange}
              currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openContractDialog(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          
          {currentView === 'card' && totalPages > 1 && (
             <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: filters.page, totalPages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isContractDialogOpen && (
        <ContractDialog
          isOpen={isContractDialogOpen}
          onClose={handleContractDialogClose}
          contractData={currentContract}
          providers={providers} // Pass providers to the dialog for selection
          t={t} language={language} isRTL={isRTL}
        />
      )}
      
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          entityName={t('pageTitles.contracts')}
          onImport={handleImportSubmit}
          language={language}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('contracts.itemTitleSingular', {defaultValue:'Contract'}), count: deleteDialogState.itemIds?.length || 1})}
        description={deleteDialogState.message}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={loading && deleteDialogState.isOpen}
        t={t} isRTL={isRTL}
      />
    </div>
  );
}