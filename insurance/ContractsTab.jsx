
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ContractDialog from './ContractDialog';
import InsuranceContractCard from './InsuranceContractCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import ImportDialog from '@/components/common/ImportDialog';
import { 
    Eye, Plus, Edit, Trash2, UploadCloud, DownloadCloud, FileText, Users,
    RefreshCw, ArrowUpDown, ChevronDown, ChevronUp, ListFilter, SquareCheckBig, XCircle, FilterX, AlertTriangle
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const apiCache = {
  items: { data: null, timestamp: null, loading: false, error: null },
  providersMap: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = apiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < apiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (apiCache[cacheKey]) {
    apiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (apiCache[cacheKey]) {
    apiCache[cacheKey].loading = isLoading;
    if(isLoading) apiCache[cacheKey].error = null;
  }
};

export default function ContractsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [providersMap, setProvidersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  const [filters, setFilters] = useState({
    searchTerm: '', // Search by contract number, name, or provider name
    providerId: 'all',
    status: 'all', // draft, active, expired, terminated
    validFromDate: '',
    validToDate: '',
    page: 1,
    pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'contract_number', direction: 'ascending' });

  // Dialog states
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState(null); // Used for add/edit
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' }); // Unified delete state

  // New UI/UX states
  const [currentView, setCurrentView] = useState(localStorage.getItem('insurance_contracts_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const [allProvidersOptions, setAllProvidersOptions] = useState([]); // For filter dropdown

  const fetchRelatedData = useCallback(async (forceRefresh = false) => {
    const providersCacheKey = 'providersMap';
    if (!forceRefresh && isCacheValid(providersCacheKey) && apiCache[providersCacheKey].data) {
        const mapData = apiCache[providersCacheKey].data;
        setProvidersMap(mapData);
        // Re-populate options from cached map, mapping to current language
        const options = Object.entries(mapData).map(([id, name]) => ({ value: id, label: name }));
        setAllProvidersOptions([{ value: 'all', label: t('filters.allProviders') }, ...options]);
        return mapData;
    }
    setCacheLoading(providersCacheKey, true);
    try {
        const providers = await Provider.list();
        const map = {};
        const options = (Array.isArray(providers) ? providers : []).map(p => {
            map[p.id] = p.name?.[language] || p.name?.en || t('common.unknownProvider');
            return { value: p.id, label: map[p.id] };
        });
        setProvidersMap(map);
        setAllProvidersOptions([{ value: 'all', label: t('filters.allProviders') }, ...options]);
        updateCache(providersCacheKey, map);
        return map;
    } catch (err) {
        console.error("Error fetching providers map:", err);
        toast({
            title: t('errors.fetchFailedTitle', { defaultValue: "Related Data Load Failed" }),
            description: t('errors.fetchRelatedDataErrorShort', { entity: t('providers.titlePlural')}),
            variant: 'warning',
        });
        updateCache(providersCacheKey, {}, err.message);
        return {};
    } finally {
        setCacheLoading(providersCacheKey, false);
    }
  }, [t, language, toast]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const itemsCacheKey = 'items';
    setLoading(true);
    setError(null);

    await fetchRelatedData(forceRefresh); // Ensure providers are fetched first

    if (!forceRefresh && isCacheValid(itemsCacheKey) && apiCache[itemsCacheKey].data) {
        setContracts(apiCache[itemsCacheKey].data);
        if(apiCache[itemsCacheKey].error) setError(apiCache[itemsCacheKey].error);
        setLoading(false);
        return;
    }
    if (apiCache[itemsCacheKey]?.loading && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (apiCache[itemsCacheKey]?.data) setContracts(apiCache[itemsCacheKey].data);
        setLoading(false);
        return;
    }

    setCacheLoading(itemsCacheKey, true);
    try {
      const fetchedItems = await Contract.list('-updated_date');
      const validData = Array.isArray(fetchedItems) ? fetchedItems : [];
      setContracts(validData);
      updateCache(itemsCacheKey, validData);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { entity: t('contracts.titlePlural') });
      if (err.response?.status === 429 || err.message?.includes("429")) {
          errorMessage = t('errors.rateLimitExceededShort');
          if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else if (err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed to fetch')) {
        errorMessage = t('errors.networkErrorGeneral');
         if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else {
         setError(errorMessage);
      }
      updateCache(itemsCacheKey, isCacheValid(itemsCacheKey) && apiCache[itemsCacheKey].data ? apiCache[itemsCacheKey].data : [], errorMessage);
    } finally {
      setCacheLoading(itemsCacheKey, false);
      setLoading(false);
    }
  }, [t, retryCount, fetchRelatedData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && (error?.includes(t('errors.rateLimitExceededShort')) || error?.includes(t('errors.networkErrorGeneral')))) {
      const delay = Math.min(1000 * Math.pow(2, retryCount -1), 8000); 
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, error, fetchData, t]);

  const handleRefresh = () => {
    setRetryCount(0);
    fetchData(true);
    toast({
        title: t('common.refreshingData'),
        description: t('messages.fetchingLatest', { item: t('contracts.titlePlural') }),
    });
  };

  const clearFilters = () => {
    setFilters({ 
        searchTerm: '', 
        providerId: 'all', 
        status: 'all', 
        validFromDate: '', 
        validToDate: '',
        page: 1, 
        pageSize: 10 
    });
    setSortConfig({ key: 'contract_number', direction: 'ascending' });
    toast({
        title: t('filters.clearedTitle'),
        description: t('filters.filtersReset', { item: t('contracts.titlePlural') }),
    });
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  const sortedAndFilteredItems = useMemo(() => {
    let items = [...contracts].filter(item => item && item.id);

    items = items.filter(item => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const providerName = providersMap[item.provider_id]?.toLowerCase() || '';
        
        const searchMatch = filters.searchTerm === '' || 
                            (item.contract_number && item.contract_number.toLowerCase().includes(searchTermLower)) ||
                            (item.name_en && item.name_en.toLowerCase().includes(searchTermLower)) ||
                            (item.name_he && item.name_he.toLowerCase().includes(searchTermLower)) ||
                            (providerName && providerName.toLowerCase().includes(searchTermLower));
        
        const providerMatch = filters.providerId === 'all' || item.provider_id === filters.providerId;
        const statusMatch = filters.status === 'all' || item.status === filters.status;

        const validFrom = item.valid_from ? parseISO(item.valid_from) : null;
        const validTo = item.valid_to ? parseISO(item.valid_to) : null;

        const filterValidFrom = filters.validFromDate ? parseISO(filters.validFromDate) : null;
        const filterValidTo = filters.validToDate ? parseISO(filters.validToDate) : null;

        const validFromMatch = !filterValidFrom || (validFrom && validFrom >= filterValidFrom);
        const validToMatch = !filterValidTo || (validTo && validTo <= filterValidTo);

        return searchMatch && providerMatch && statusMatch && validFromMatch && validToMatch;
    });

    if (sortConfig.key) {
        items.sort((a, b) => {
            if (!a || !b) return 0;
            let valA, valB;
            if (['valid_from', 'valid_to', 'updated_date'].includes(sortConfig.key)) {
                valA = a[sortConfig.key] ? parseISO(a[sortConfig.key]).getTime() : 0;
                valB = b[sortConfig.key] ? parseISO(b[sortConfig.key]).getTime() : 0;
            } else if (sortConfig.key === 'provider_id') {
                valA = (providersMap[a.provider_id] || '').toLowerCase();
                valB = (providersMap[b.provider_id] || '').toLowerCase();
            } else if (sortConfig.key === 'contract_name' || sortConfig.key === 'name_en') { // Handle contract_name as alias for name_en for sorting
                valA = (a.name_en || a.name_he || '').toLowerCase();
                valB = (b.name_en || b.name_he || '').toLowerCase();
            } else {
                valA = (a[sortConfig.key] || '').toString().toLowerCase();
                valB = (b[sortConfig.key] || '').toString().toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return items;
  }, [contracts, filters, sortConfig, providersMap, language]);

  const paginatedItems = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return sortedAndFilteredItems.slice(start, end);
  }, [sortedAndFilteredItems, filters.page, filters.pageSize]);

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(sortedAndFilteredItems.length / filters.pageSize);
    if (newPage > 0 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const handleDataTableSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      const { id, desc } = newSortState[0];
      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
    } else {
      setSortConfig({ key: 'contract_number', direction: 'ascending' }); // Default sort
    }
  }, []);

  const openItemDialog = (item = null) => {
    setCurrentContract(item);
    setIsContractDialogOpen(true);
  };

  const handleDialogClose = (refreshNeeded, operationType = null, itemName = '') => {
    setIsContractDialogOpen(false);
    setCurrentContract(null);
    if (refreshNeeded) {
      fetchData(true);
      const itemDisplayName = itemName || t('contracts.titleSingular');
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('contracts.createSuccess', { name: itemDisplayName }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('contracts.updateSuccess', { name: itemDisplayName }) });
      } else { // Generic refresh message for successful operation
        toast({ title: t('messages.success'), description: t('contracts.saveSuccessDesc', { item: itemDisplayName }) });
      }
    }
    if (isSelectionModeActive && refreshNeeded) {
        cancelSelectionMode();
    }
  };
  
  const openDeleteDialog = useCallback((itemIds, itemName = '') => {
    const idsToDelete = itemIds instanceof Set ? itemIds : (itemIds ? new Set([itemIds]) : new Set());
    if (idsToDelete.size === 0) {
        toast({ title: t('bulkActions.noSelectionTitle'), description: t('bulkActions.noSelectionToDeleteDesc', {entity: t('contracts.titlePlural') }), variant: "warning"});
        return;
    }
    const displayItemName = idsToDelete.size === 1 ? itemName || t('contracts.titleSingular') : `${idsToDelete.size} ${t('contracts.titlePlural')}`;
    setDeleteDialogState({ isOpen: true, itemIds: idsToDelete, itemName: displayItemName });
  }, [t, toast]);

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.size === 0) return;

    setLoading(true);
    let successes = 0;
    let failures = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await Contract.delete(id);
        successes++;
      } catch (err) {
        console.error(`Failed to delete contract ${id}:`, err);
        failures++;
      }
    }
    setLoading(false);

    if (successes > 0) {
      toast({
        title: t('messages.success'),
        description: t('contracts.deleteSuccess', { count: successes }),
      });
      fetchData(true);
    }
    if (failures > 0) {
      toast({
        title: t('errors.deleteFailedTitle'),
        description: t('contracts.deleteErrorSome', { count: failures }),
        variant: "destructive",
      });
    }
    
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '' });
    cancelSelectionMode();
  };
  
  // SELECTION MODE LOGIC
  const handleToggleSelection = useCallback((itemId) => {
    if (!itemId) return;
    setSelectedItemIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds); 
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId);
      } else {
        newSelectedIds.add(itemId);
      }
      return newSelectedIds;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const itemsToConsider = (currentView === 'table' ? paginatedItems : sortedAndFilteredItems)
                            .filter(item => item && item.id);

    if (itemsToConsider.length === 0) return;
    
    const currentSelection = selectedItemIds; 

    const allCurrentlyVisibleSelected = itemsToConsider.length > 0 && itemsToConsider.every(item => currentSelection.has(item.id));

    setSelectedItemIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds); 
      if (allCurrentlyVisibleSelected) {
        itemsToConsider.forEach(item => item.id && newSelectedIds.delete(item.id));
      } else {
        itemsToConsider.forEach(item => item.id && newSelectedIds.add(item.id));
      }
      return newSelectedIds;
    });
  }, [selectedItemIds, paginatedItems, sortedAndFilteredItems, currentView]);
  
  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedItemIds(new Set());
  };

  const openEditFromSelection = () => {
    const currentSelection = selectedItemIds;
    if (currentSelection.size === 1) {
      const itemIdToEdit = currentSelection.values().next().value;
      const itemToEdit = contracts.find(item => item && item.id === itemIdToEdit);
      if (itemToEdit) {
        openItemDialog(itemToEdit);
      } else {
         toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc', { item: t('contracts.titleSingular')}), variant: 'destructive'});
      }
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: t('contracts.titlePlural') }), variant: 'info' });
    }
  };

  const handleDeleteFromSelection = () => {
    const currentSelection = selectedItemIds;
    if (currentSelection.size === 0) {
      toast({ title: t('bulkActions.noSelectionTitle'), description: t('bulkActions.noSelectionToDeleteDesc', {entity: t('contracts.titlePlural') }), variant: "warning"});
      return;
    }
    openDeleteDialog(currentSelection);
  };

  const handleImportSubmit = async (records) => {
      setIsImportDialogOpen(false);
      toast({title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: 'Contracts Import'})});
  };

  const globalActionsConfig = useMemo(() => {
    const currentItemsForSelection = (currentView === 'table' ? paginatedItems : sortedAndFilteredItems)
                                      .filter(item => item && item.id);
    const currentSelection = selectedItemIds;
    const allVisibleSelected = currentItemsForSelection.length > 0 && currentItemsForSelection.every(item => currentSelection.has(item.id));

    if (isSelectionModeActive) {
      return [
        { type: 'edit', labelKey: 'buttons.editSelected', defaultLabel: `Edit Selected (${currentSelection.size})`, onClick: openEditFromSelection, disabled: currentSelection.size !== 1, icon: Edit },
        { type: 'delete', labelKey: 'buttons.deleteSelected', defaultLabel: `Delete Selected (${currentSelection.size})`, onClick: handleDeleteFromSelection, disabled: currentSelection.size === 0, icon: Trash2 },
        { isSeparator: true },
        { 
          type: 'selectAll', 
          labelKey: allVisibleSelected ? 'buttons.deselectAllVisible' : 'buttons.selectAllVisible', 
          defaultLabel: allVisibleSelected ? `Deselect All (${currentItemsForSelection.length})` : `Select All (${currentItemsForSelection.length})`, 
          onClick: handleSelectAllVisible,
          disabled: currentItemsForSelection.length === 0,
          icon: SquareCheckBig 
        },
        { isSeparator: true },
        { type: 'cancel', labelKey: 'buttons.cancelSelection', defaultLabel: 'Cancel Selection', onClick: cancelSelectionMode, icon: XCircle },
      ];
    }
    return [
      { type: 'add', labelKey: 'contracts.addNew', defaultLabel: 'Add Contract', onClick: () => openItemDialog(), icon: Plus },
      { isSeparator: true },
      { type: 'edit', labelKey: 'contracts.enterEditMode', defaultLabel: 'Edit Contracts', onClick: () => setIsSelectionModeActive(true), icon: Edit },
      { type: 'delete', labelKey: 'contracts.enterDeleteMode', defaultLabel: 'Delete Contracts', onClick: () => setIsSelectionModeActive(true), icon: Trash2 },
      { isSeparator: true },
      { type: 'import', labelKey: 'contracts.import', defaultLabel: 'Import Contracts', onClick: () => setIsImportDialogOpen(true), icon: UploadCloud }, 
      { type: 'export', labelKey: 'contracts.export', defaultLabel: 'Export Contracts', onClick: () => toast({title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: 'Export Contracts'})}), disabled: true, icon: DownloadCloud },
    ];
  }, [isSelectionModeActive, selectedItemIds, sortedAndFilteredItems, paginatedItems, currentView, t, openItemDialog, setIsImportDialogOpen, handleSelectAllVisible, cancelSelectionMode, openEditFromSelection, handleDeleteFromSelection]);
  
  const formatDateForTable = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return t('common.notSet');
    return format(parseISO(dateString), 'PP', { locale: currentLocale });
  };

  const openDetailsDrawer = useCallback((itemId) => {
      // setSelectedContractIdForDrawer(itemId);
      // setIsDetailsDrawerOpen(true);
      // For now, open edit dialog as details view is not implemented
      const itemToView = contracts.find(item => item && item.id === itemId);
      if (itemToView) openItemDialog(itemToView);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundDesc', { item: t('contracts.titleSingular')}), variant: 'destructive'});
  }, [contracts, openItemDialog, toast, t]);

  const contractColumns = useMemo(() => [
    { 
      accessorKey: 'contract_number', 
      header: t('contracts.fields.contractNumber'),
      cell: ({ row }) => row.original.contract_number || t('common.notSet'),
      enableSorting: true,
    },
    { 
      id: 'provider_name', 
      accessorKey: 'provider_id', 
      header: t('contracts.fields.providerName'),
      cell: ({ row }) => providersMap[row.original.provider_id] || t('common.unknownProvider'),
      enableSorting: true,
    },
    { 
      id: 'contract_name', 
      accessorKey: 'name_en', 
      header: t('contracts.fields.contractName'),
      cell: ({ row }) => row.original.name_en || row.original.name_he || t('contracts.unnamedContract'),
      enableSorting: true,
    },
    { 
      accessorKey: 'status', 
      header: t('contracts.fields.status'),
      cell: ({ row }) => {
        const statusLabel = t(`contractStatus.${row.original.status}`);
        const statusVariant = { draft: 'outline', active: 'active', expired: 'secondary', terminated: 'destructive' }[row.original.status] || 'default';
        return <Badge variant={statusVariant} className="text-xs">{statusLabel}</Badge>;
      },
      enableSorting: true,
    },
    { 
      accessorKey: 'valid_from', 
      header: t('contracts.fields.validFrom'),
      cell: ({ row }) => formatDateForTable(row.original.valid_from),
      enableSorting: true,
    },
    { 
      accessorKey: 'valid_to', 
      header: t('contracts.fields.validTo'),
      cell: ({ row }) => formatDateForTable(row.original.valid_to),
      enableSorting: true,
    },
    { 
      accessorKey: 'updated_date', 
      header: t('common.lastUpdated'),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date)) ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.unknown')),
      enableSorting: true 
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetailsDrawer(row.original.id);}} title={t('buttons.viewDetails')} className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openItemDialog(row.original);}} title={t('buttons.edit')} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteDialog(row.original.id, row.original.contract_number || t('contracts.titleSingular'));}} title={t('buttons.delete')} className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [t, currentLocale, providersMap, openDetailsDrawer, openItemDialog, openDeleteDialog]);
  
  const contractStatusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses') },
    { value: 'draft', label: t('contractStatus.draft') },
    { value: 'active', label: t('contractStatus.active') },
    { value: 'expired', label: t('contractStatus.expired') },
    { value: 'terminated', label: t('contractStatus.terminated') },
  ], [t]);
  
  const sortOptions = useMemo(() => [
    { key: 'contract_number', labelKey: 'contracts.fields.contractNumber', defaultValue: 'Contract No.' },
    { key: 'provider_id', labelKey: 'contracts.fields.providerName', defaultValue: 'Provider' },
    { key: 'name_en', labelKey: 'contracts.fields.contractName', defaultValue: 'Name' }, 
    { key: 'status', labelKey: 'contracts.fields.status', defaultValue: 'Status' },
    { key: 'valid_from', labelKey: 'contracts.fields.validFrom', defaultValue: 'Valid From' },
    { key: 'valid_to', labelKey: 'contracts.fields.validTo', defaultValue: 'Valid To' },
    { key: 'updated_date', labelKey: 'common.lastUpdated', defaultValue: 'Last Updated' },
  ], [t]);

  if (loading && contracts.length === 0 && !isCacheValid('items')) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('contracts.titlePlural') })} />;
  }
  
  if (error && contracts.length === 0 && (!apiCache.items.data || !isCacheValid('items')) ) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        {(error.includes(t('errors.rateLimitExceededShort')) || error.includes(t('errors.networkErrorGeneral'))) && retryCount < 3 && (
           <p className="text-sm text-gray-500 dark:text-gray-300">{t('errors.retryingSoon')}</p>
        )}
        <Button onClick={() => { setRetryCount(0); handleRefresh();}} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <ListFilter className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
              <CardTitle className="dark:text-gray-100">
                {isSelectionModeActive 
                    ? t('contracts.selectionModeTitle', { count: selectedItemIds.size })
                    : t('filters.filterAndSortTitle', { entity: t('contracts.titlePlural')})
                }
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isSelectionModeActive && (
                <ViewSwitcher 
                    currentView={currentView} 
                    onViewChange={(newView) => { 
                        setCurrentView(newView); 
                        localStorage.setItem('insurance_contracts_view_preference', newView);
                        cancelSelectionMode();
                    }}
                    entityName="insurance_contracts"
                />
              )}
              <GlobalActionButton actionsConfig={globalActionsConfig} />
            </div>
          </div>
        </CardHeader>
        {!isSelectionModeActive && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Input
                aria-label={t('contracts.searchPlaceholder')}
                placeholder={t('contracts.searchPlaceholder')}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
              <Select value={filters.providerId} onValueChange={(value) => handleFilterChange('providerId', value)}>
                <SelectTrigger aria-label={t('filters.selectProvider')} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('filters.selectProvider')} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {allProvidersOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger aria-label={t('filters.selectStatus')} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('filters.selectStatus')} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {contractStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder={t('filters.validFromDate')}
                value={filters.validFromDate}
                onChange={(e) => handleFilterChange('validFromDate', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
              <Input
                type="date"
                placeholder={t('filters.validToDate')}
                value={filters.validToDate}
                onChange={(e) => handleFilterChange('validToDate', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
             <div className="flex items-center gap-4 pt-3 border-t dark:border-gray-700 mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                      {t('filters.sortBy')}: {t(sortOptions.find(o => o.key === sortConfig.key)?.labelKey || sortConfig.key, { defaultValue: sortOptions.find(o => o.key === sortConfig.key)?.defaultValue || sortConfig.key})}
                      {getSortIndicator(sortConfig.key) || <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="dark:bg-gray-700 dark:text-gray-200">
                    {sortOptions.map(option => (
                      <DropdownMenuItem key={option.key} onClick={() => requestSort(option.key)} className={`text-xs dark:hover:bg-gray-600 ${sortConfig.key === option.key ? 'bg-gray-100 dark:bg-gray-600' : ''}`}>
                        {t(option.labelKey, {defaultValue: option.defaultValue})}
                        {getSortIndicator(option.key)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                 <Select 
                    value={String(filters.pageSize)} 
                    onValueChange={(value) => setFilters(prev => ({...prev, pageSize: parseInt(value), page: 1}))}
                >
                    <SelectTrigger className="w-[120px] text-xs dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                        <SelectValue placeholder={t('filters.itemsPerPage')} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                        {[10, 20, 50, 100].map(size => (
                            <SelectItem key={size} value={String(size)} className="text-xs dark:hover:bg-gray-600">
                                {t('filters.showItems', {count: size})}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-3">
                <Button onClick={clearFilters} variant="outline" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                  <FilterX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.clearFiltersAndSort')}
                </Button>
                <Button onClick={handleRefresh} variant="outline" disabled={loading && apiCache.items.loading} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                  <RefreshCw className={`h-4 w-4 ${loading && apiCache.items.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.refresh')}
                </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {apiCache.items?.error && !error && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{apiCache.items.error}</span>
        </div>
      )}

      {loading && contracts.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('contracts.titlePlural') })} />}

      {!loading && sortedAndFilteredItems.length === 0 && contracts.length > 0 ? (
        <EmptyState
          icon={FileText}
          title={t('emptyStates.noMatchFilterTitle', { entity: t('contracts.titlePlural') })}
          message={t('emptyStates.noMatchFilterMessage')}
        />
      ) : !loading && contracts.length === 0 && !error ? (
        <EmptyState
          icon={FileText}
          title={t('emptyStates.noDataTitle', { item: t('contracts.titlePlural'), defaultValue: `No ${t('contracts.titlePlural')} Yet`})}
          message={t('emptyStates.noDataMessage', { item: t('contracts.titleSingular'), defaultValue: `Start by adding a new ${t('contracts.titleSingular')} or importing data.`})}
          actionButton={
            <Button onClick={() => openItemDialog()} className="mt-4">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('contracts.addNew', {defaultValue: 'Add New Contract'})}
            </Button>
          }
        />
      ) : (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedItems.map(item => item && (
                <InsuranceContractCard
                    key={item.id}
                    contract={item}
                    t={t} isRTL={isRTL} language={language} currentLocale={currentLocale}
                    isSelectionModeActive={isSelectionModeActive}
                    isSelected={selectedItemIds.has(item.id)}
                    onToggleSelection={handleToggleSelection}
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
            <DataTable
              columns={contractColumns}
              data={paginatedItems.filter(i => i)}
              isLoading={loading && contracts.length > 0}
              error={error && contracts.length > 0 ? error : null}
              onRetry={handleRefresh}
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: sortedAndFilteredItems.length,
                totalPages: Math.ceil(sortedAndFilteredItems.length / filters.pageSize),
              }}
              onPageChange={handlePageChange}
              currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
              onSortChange={handleDataTableSortChange}
              entityName={t('contracts.titlePlural')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
            />
          )}
          {currentView === 'card' && sortedAndFilteredItems.length > filters.pageSize && (
            <div className="flex items-center justify-between space-x-2 py-3 px-1 border-t dark:border-gray-700 mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                 {t('dataTable.paginationSummary', { 
                    start: (filters.page - 1) * filters.pageSize + 1, 
                    end: Math.min(filters.page * filters.pageSize, sortedAndFilteredItems.length), 
                    total: sortedAndFilteredItems.length,
                    entity: t('contracts.titlePlural').toLowerCase()
                })}
              </div>
              <div className="space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1 || (loading && contracts.length > 0)}
                >
                  {t('buttons.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === Math.ceil(sortedAndFilteredItems.length / filters.pageSize) || (loading && contracts.length > 0)}
                >
                  {t('buttons.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isContractDialogOpen && (
        <ContractDialog
          isOpen={isContractDialogOpen}
          onCloseDialog={handleDialogClose}
          contractData={currentContract}
          providerOptions={allProvidersOptions.filter(opt => opt.value !== 'all')}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(isOpen) => setDeleteDialogState(prev => ({ ...prev, isOpen }))}
          onConfirm={handleConfirmDelete}
          title={t('contracts.deleteConfirmTitle', { count: deleteDialogState.itemIds?.size || 0})}
          description={t('contracts.deleteConfirmMessage', { count: deleteDialogState.itemIds?.size || 0, name: deleteDialogState.itemName })}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            onImportSubmit={handleImportSubmit}
            entityName={t('contracts.titlePlural')}
            sampleHeaders={['provider_id', 'contract_number', 'name_en', 'name_he', 'valid_from', 'valid_to', 'status']}
        />
      )}
    </div>
  );
}
