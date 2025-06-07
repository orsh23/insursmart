
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tariff } from '@/api/entities';
import { Contract } from '@/api/entities';
import { InsuranceCode } from '@/api/entities';
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
import TariffDialog from './TariffDialog';
import TariffCard from './TariffCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import ImportDialog from '@/components/common/ImportDialog';
import {
    Eye, Plus, Edit, Trash2, UploadCloud, DownloadCloud, DollarSign as TariffIcon, // Changed alias to TariffIcon
    RefreshCw, ArrowUpDown, ChevronDown, ChevronUp, ListFilter, SquareCheckBig, XCircle, FilterX, AlertTriangle, UserCircle, Building
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const apiCache = {
  items: { data: null, timestamp: null, loading: false, error: null },
  contractsMap: { data: null, timestamp: null, loading: false, error: null }, // { contract_id: {number, provider_name} }
  insuranceCodesMap: { data: null, timestamp: null, loading: false, error: null }, // { code_id: {code, name} }
  providersMap: { data: null, timestamp: null, loading: false, error: null }, // { provider_id: name }
  expirationTime: 5 * 60 * 1000,
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

export default function TariffsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  // Renamed tariffs to tariffItems
  const [tariffItems, setTariffItems] = useState([]);
  const [contractsMap, setContractsMap] = useState({});
  const [insuranceCodesMap, setInsuranceCodesMap] = useState({});
  const [providersMap, setProvidersMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  // Filters updated as per outline
  const [filters, setFilters] = useState({
    searchTerm: '', // Search by contract number, insurance code, or provider name
    contractId: 'all',
    insuranceCodeId: 'all', // New filter
    finalizationType: 'all',
    minBasePrice: '', // New filter
    maxBasePrice: '', // New filter
    page: 1,
    pageSize: 10,
  });
  // Sort config default changed
  const [sortConfig, setSortConfig] = useState({ key: 'contract_id', direction: 'ascending' });

  // Dialog states
  const [isTariffDialogOpen, setIsTariffDialogOpen] = useState(false);
  const [currentTariff, setCurrentTariff] = useState(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false); // For future use
  const [selectedTariffIdForDrawer, setSelectedTariffIdForDrawer] = useState(null); // For future use
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirm] = useState(false);

  // New UI/UX states
  const [currentView, setCurrentView] = useState(localStorage.getItem('insurance_tariffs_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const [allContractsOptions, setAllContractsOptions] = useState([]);
  const [allInsuranceCodesOptions, setAllInsuranceCodesOptions] = useState([]); // New options state

  const fetchRelatedData = useCallback(async (forceRefresh = false) => {
    const providersCacheKey = 'providersMap';
    const contractsCacheKey = 'contractsMap';
    const codesCacheKey = 'insuranceCodesMap';

    let currentProvidersMap = apiCache[providersCacheKey]?.data || {};
    let currentContractsMap = apiCache[contractsCacheKey]?.data || {};
    let currentCodesMap = apiCache[codesCacheKey]?.data || {};

    try {
      // Fetch Providers Map (needed for contract display)
      if (forceRefresh || !isCacheValid(providersCacheKey) || Object.keys(currentProvidersMap).length === 0) {
        setCacheLoading(providersCacheKey, true);
        const providers = await Provider.list();
        const pMap = providers.reduce((acc, p) => {
          acc[p.id] = p.name?.[language] || p.name?.en || t('common.unknownProvider');
          return acc;
        }, {});
        setProvidersMap(pMap);
        updateCache(providersCacheKey, pMap);
        currentProvidersMap = pMap;
        setCacheLoading(providersCacheKey, false);
      } else {
        setProvidersMap(currentProvidersMap);
      }

      // Fetch Contracts Map
      if (forceRefresh || !isCacheValid(contractsCacheKey) || Object.keys(currentContractsMap).length === 0) {
        setCacheLoading(contractsCacheKey, true);
        const contracts = await Contract.list();
        const cMap = contracts.reduce((acc, c) => {
          acc[c.id] = {
            number: c.contract_number || t('common.unknownContract'),
            provider_name: currentProvidersMap[c.provider_id] || t('common.unknownProvider')
          };
          return acc;
        }, {});
        setContractsMap(cMap);
        const cOptions = contracts.map(c => ({
            value: c.id,
            label: `${c.contract_number} (${currentProvidersMap[c.provider_id] || t('common.unknownProvider')})`
        }));
        setAllContractsOptions([{ value: 'all', label: t('filters.allContracts', {defaultValue: 'All Contracts'}) }, ...cOptions]);
        updateCache(contractsCacheKey, cMap);
        setCacheLoading(contractsCacheKey, false);
      } else {
        setContractsMap(currentContractsMap);
        // Ensure options are still populated if only cache is hit
        if (allContractsOptions.length === 0 && Object.keys(currentContractsMap).length > 0) {
             const contracts = await Contract.list();
             const cOptions = contracts.map(c => ({
                 value: c.id,
                 label: `${c.contract_number} (${currentProvidersMap[c.provider_id] || t('common.unknownProvider')})`
             }));
             setAllContractsOptions([{ value: 'all', label: t('filters.allContracts', {defaultValue: 'All Contracts'}) }, ...cOptions]);
        }
      }

      // Fetch Insurance Codes Map
      if (forceRefresh || !isCacheValid(codesCacheKey) || Object.keys(currentCodesMap).length === 0) {
        setCacheLoading(codesCacheKey, true);
        const codes = await InsuranceCode.list();
        const iMap = codes.reduce((acc, code) => {
          acc[code.id] = {
            code: code.code || t('common.unknownCode'),
            name: code[`name_${language}`] || code.name_en || t('common.unnamedCode')
          };
          return acc;
        }, {});
        setInsuranceCodesMap(iMap);
        const icOptions = codes.map(c => ({
            value: c.id,
            label: `${c.code} - ${c[`name_${language}`] || c.name_en || t('common.unnamedCode')}`
        }));
        setAllInsuranceCodesOptions([{ value: 'all', label: t('filters.allInsuranceCodes', {defaultValue: 'All Insurance Codes'}) }, ...icOptions]);
        updateCache(codesCacheKey, iMap);
        setCacheLoading(codesCacheKey, false);
      } else {
        setInsuranceCodesMap(currentCodesMap);
         if (allInsuranceCodesOptions.length === 0 && Object.keys(currentCodesMap).length > 0) {
            const codes = await InsuranceCode.list();
            const icOptions = codes.map(c => ({
                value: c.id,
                label: `${c.code} - ${c[`name_${language}`] || c.name_en || t('common.unnamedCode')}`
            }));
            setAllInsuranceCodesOptions([{ value: 'all', label: t('filters.allInsuranceCodes', {defaultValue: 'All Insurance Codes'}) }, ...icOptions]);
        }
      }
    } catch (err) {
      console.error("Error fetching related data for Tariffs:", err);
       toast({
            title: t('errors.fetchFailedTitle', { defaultValue: "Related Data Load Failed" }),
            description: t('errors.fetchRelatedDataErrorShort', { entity: t('tariffs.titlePlural', {defaultValue: "Tariffs"})}),
            variant: 'destructive',
        });
    }
  }, [t, language, toast, allContractsOptions.length, allInsuranceCodesOptions.length]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const itemsCacheKey = 'items';
    setLoading(true);
    setError(null);

    await fetchRelatedData(forceRefresh);

    if (!forceRefresh && isCacheValid(itemsCacheKey) && apiCache[itemsCacheKey].data) {
        setTariffItems(apiCache[itemsCacheKey].data);
        if(apiCache[itemsCacheKey].error) setError(apiCache[itemsCacheKey].error);
        setLoading(false);
        return;
    }
    if (apiCache[itemsCacheKey]?.loading && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (apiCache[itemsCacheKey]?.data) setTariffItems(apiCache[itemsCacheKey].data);
        setLoading(false);
        return;
    }

    setCacheLoading(itemsCacheKey, true);
    try {
      const fetchedItems = await Tariff.list('-updated_date');
      const validData = Array.isArray(fetchedItems) ? fetchedItems : [];
      setTariffItems(validData);
      updateCache(itemsCacheKey, validData);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching tariffs:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) });
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
        description: t('messages.fetchingLatest', { item: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) }),
    });
  };

  const clearFilters = () => {
    // Updated filters to include new ones
    setFilters({
      searchTerm: '', contractId: 'all', insuranceCodeId: 'all', finalizationType: 'all',
      minBasePrice: '', maxBasePrice: '', page: 1, pageSize: 10
    });
    // Sort config default changed
    setSortConfig({ key: 'contract_id', direction: 'ascending' });
    toast({
        title: t('filters.clearedTitle'),
        description: t('filters.filtersReset', { item: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) }),
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
    let items = [...tariffItems].filter(item => item && item.id); // Ensure item and item.id exist

    items = items.filter(item => {
        if (!item) return false;

        const searchTermLower = filters.searchTerm.toLowerCase();
        const contractInfo = contractsMap[item.contract_id];
        const insuranceCodeInfo = insuranceCodesMap[item.insurance_code];

        const searchMatch = filters.searchTerm === '' ||
                            (contractInfo?.number && contractInfo.number.toLowerCase().includes(searchTermLower)) ||
                            (contractInfo?.provider_name && contractInfo.provider_name.toLowerCase().includes(searchTermLower)) ||
                            (insuranceCodeInfo?.code && insuranceCodeInfo.code.toLowerCase().includes(searchTermLower)) ||
                            (insuranceCodeInfo?.name && insuranceCodeInfo.name.toLowerCase().includes(searchTermLower));

        const contractMatch = filters.contractId === 'all' || item.contract_id === filters.contractId;
        const insuranceCodeMatch = filters.insuranceCodeId === 'all' || item.insurance_code === filters.insuranceCodeId;
        const finalizationMatch = filters.finalizationType === 'all' || item.finalization_type === filters.finalizationType;

        const minPrice = parseFloat(filters.minBasePrice);
        const maxPrice = parseFloat(filters.maxBasePrice);
        const priceMatch = (isNaN(minPrice) || (item.base_price ?? -Infinity) >= minPrice) &&
                           (isNaN(maxPrice) || (item.base_price ?? Infinity) <= maxPrice);

        return searchMatch && contractMatch && insuranceCodeMatch && finalizationMatch && priceMatch;
    });

    if (sortConfig.key) {
        items.sort((a, b) => {
            if (!a || !b) return 0;
            let valA, valB;

            switch (sortConfig.key) {
                case 'updated_date':
                    valA = a.updated_date ? parseISO(a.updated_date).getTime() : 0;
                    valB = b.updated_date ? parseISO(b.updated_date).getTime() : 0;
                    break;
                case 'contract_id':
                    valA = (contractsMap[a.contract_id]?.number || '').toLowerCase();
                    valB = (contractsMap[b.contract_id]?.number || '').toLowerCase();
                    break;
                case 'insurance_code':
                    valA = (insuranceCodesMap[a.insurance_code]?.code || '').toLowerCase();
                    valB = (insuranceCodesMap[b.insurance_code]?.code || '').toLowerCase();
                    break;
                case 'base_price':
                    valA = a.base_price || 0;
                    valB = b.base_price || 0;
                    break;
                case 'finalization_type':
                    valA = (a.finalization_type || '').toString().toLowerCase();
                    valB = (b.finalization_type || '').toString().toLowerCase();
                    break;
                default:
                    valA = (a[sortConfig.key] || '').toString().toLowerCase();
                    valB = (b[sortConfig.key] || '').toString().toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return items;
  }, [tariffItems, filters, sortConfig, contractsMap, insuranceCodesMap]);

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
      setSortConfig({ key: 'contract_id', direction: 'ascending' });
    }
  }, []);

  const openTariffDialog = (item = null) => {
    setCurrentTariff(item);
    setIsTariffDialogOpen(true);
  };

  const handleTariffDialogClose = (refreshNeeded, operationType = null, itemName = '') => {
    setIsTariffDialogOpen(false);
    setCurrentTariff(null);
    if (refreshNeeded) {
      fetchData(true);
      const itemDisplayName = itemName || t('tariffs.titleSingular', {defaultValue: 'Tariff'});
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('tariffs.createSuccess', { name: itemDisplayName }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('tariffs.updateSuccess', { name: itemDisplayName }) });
      } else {
        toast({ title: t('messages.success'), description: t('tariffs.saveSuccessDesc', { item: itemDisplayName }) });
      }
    }
    if (isSelectionModeActive && refreshNeeded) {
        cancelSelectionMode();
    }
  };

  const openDetailsDrawer = useCallback((itemId) => {
      // setSelectedTariffIdForDrawer(itemId); // For future use
      // setIsDetailsDrawerOpen(true); // For future use
      // For now, open edit dialog as details view is not implemented for tariffs
      const itemToView = tariffItems.find(item => item && item.id === itemId);
      if (itemToView) openTariffDialog(itemToView);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundDesc', { item: t('tariffs.titleSingular', {defaultValue: 'Tariff'})}), variant: 'destructive'});
  }, [tariffItems, openTariffDialog, t, toast]);

  const openDeleteConfirmDialog = (item) => {
    if (!item && selectedItemIds.size === 0) {
        toast({ title: t('bulkActions.noSelectionTitle'), description: t('bulkActions.noSelectionToDeleteDesc', {entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) }), variant: "warning"});
        return;
    }
    if (item) {
        setSelectedItemIds(new Set([item.id]));
    }
    setIsBulkDeleteConfirm(true);
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return; // Should be caught by openDeleteConfirmDialog

    setIsBulkDeleteConfirm(false);
    setLoading(true);
    let successes = 0;
    let failures = 0;

    for (const id of selectedItemIds) {
      try {
        await Tariff.delete(id);
        successes++;
      } catch (err) {
        console.error(`Failed to delete tariff ${id}:`, err);
        failures++;
      }
    }
    setLoading(false);

    if (successes > 0) {
      toast({
        title: t('messages.success'),
        description: t('tariffs.deleteSuccess', { count: successes }),
      });
      fetchData(true);
    }
    if (failures > 0) {
      toast({
        title: t('errors.deleteFailedTitle'),
        description: t('tariffs.deleteErrorSome', { count: failures }),
        variant: "destructive",
      });
    }

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

    const allCurrentlyVisibleSelected = itemsToConsider.length > 0 && itemsToConsider.every(item => selectedItemIds.has(item.id));

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
    if (selectedItemIds.size === 1) {
      const itemIdToEdit = selectedItemIds.values().next().value;
      const itemToEdit = tariffItems.find(item => item && item.id === itemIdToEdit);
      if (itemToEdit) {
        openTariffDialog(itemToEdit);
      } else {
         toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc', { item: t('tariffs.titleSingular', {defaultValue: 'Tariff'})}), variant: 'destructive'});
      }
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) }), variant: 'info' });
    }
  };

  const handleDeleteFromSelection = () => {
    if (selectedItemIds.size === 0) {
      toast({ title: t('bulkActions.noSelectionTitle'), description: t('bulkActions.noSelectionToDeleteDesc', {entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) }), variant: "warning"});
      return;
    }
    setIsBulkDeleteConfirm(true);
  };

  const handleImportSubmit = async (records) => {
      setIsImportDialogOpen(false);
      toast({title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: t('tariffs.importTariffs', {defaultValue: 'Tariffs Import'})})});
  };

  const globalActionsConfig = useMemo(() => {
    const currentItemsForSelection = (currentView === 'table' ? paginatedItems : sortedAndFilteredItems)
                                      .filter(item => item && item.id);
    const allVisibleSelected = currentItemsForSelection.length > 0 && currentItemsForSelection.every(item => selectedItemIds.has(item.id));

    if (isSelectionModeActive) {
      return [
        { type: 'edit', labelKey: 'buttons.editSelected', defaultLabel: t('buttons.editSelected', {count: selectedItemIds.size}), onClick: openEditFromSelection, disabled: selectedItemIds.size !== 1, icon: Edit },
        { type: 'delete', labelKey: 'buttons.deleteSelected', defaultLabel: t('buttons.deleteSelected', {count: selectedItemIds.size}), onClick: handleDeleteFromSelection, disabled: selectedItemIds.size === 0, icon: Trash2 },
        { isSeparator: true },
        {
          type: 'selectAll',
          labelKey: allVisibleSelected ? 'buttons.deselectAllVisible' : 'buttons.selectAllVisible',
          defaultLabel: allVisibleSelected ? t('buttons.deselectAllVisible', {count: currentItemsForSelection.length}) : t('buttons.selectAllVisible', {count: currentItemsForSelection.length}),
          onClick: handleSelectAllVisible,
          disabled: currentItemsForSelection.length === 0,
          icon: SquareCheckBig
        },
        { isSeparator: true },
        { type: 'cancel', labelKey: 'buttons.cancelSelection', defaultLabel: t('buttons.cancelSelection', {defaultValue: 'Cancel Selection'}), onClick: cancelSelectionMode, icon: XCircle },
      ];
    }
    return [
      { type: 'add', labelKey: 'tariffs.addTariff', defaultLabel: t('tariffs.addTariff', {defaultValue: 'Add Tariff'}), onClick: () => openTariffDialog(), icon: Plus },
      { isSeparator: true },
      { type: 'edit', labelKey: 'tariffs.enterEditMode', defaultLabel: t('tariffs.enterEditMode', {defaultValue: 'Edit Tariffs'}), onClick: () => setIsSelectionModeActive(true), icon: Edit },
      { type: 'delete', labelKey: 'tariffs.enterDeleteMode', defaultLabel: t('tariffs.enterDeleteMode', {defaultValue: 'Delete Tariffs'}), onClick: () => setIsSelectionModeActive(true), icon: Trash2 },
      { isSeparator: true },
      { type: 'import', labelKey: 'tariffs.importTariffs', defaultLabel: t('tariffs.importTariffs', {defaultValue: 'Import Tariffs'}), onClick: () => setIsImportDialogOpen(true), icon: UploadCloud, disabled: true },
      { type: 'export', labelKey: 'tariffs.exportTariffs', defaultLabel: t('tariffs.exportTariffs', {defaultValue: 'Export Tariffs'}), onClick: () => toast({title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: t('tariffs.exportTariffs', {defaultValue: 'Export Tariffs'})})}), disabled: true, icon: DownloadCloud },
    ];
  }, [isSelectionModeActive, selectedItemIds, sortedAndFilteredItems, paginatedItems, currentView, t, openTariffDialog, setIsImportDialogOpen, handleSelectAllVisible, cancelSelectionMode, openEditFromSelection, handleDeleteFromSelection, toast]);

  const tariffColumns = useMemo(() => [
    {
      accessorKey: 'contract_id',
      header: t('tariffs.fields.contractNumber', {defaultValue: 'Contract No.'}),
      cell: ({ row }) => contractsMap[row.original.contract_id]?.number || row.original.contract_id,
      enableSorting: true,
    },
    {
      id: 'provider_name',
      header: t('tariffs.fields.providerName', {defaultValue: 'Provider'}),
      cell: ({ row }) => contractsMap[row.original.contract_id]?.provider_name || t('common.notSet'),
      enableSorting: false,
    },
    {
      accessorKey: 'insurance_code',
      header: t('tariffs.fields.insuranceCode', {defaultValue: 'Insurance Code'}),
      cell: ({ row }) => insuranceCodesMap[row.original.insurance_code]?.code || row.original.insurance_code,
      enableSorting: true,
    },
     {
      id: 'insurance_code_name',
      header: t('tariffs.fields.codeName', {defaultValue: 'Code Name'}),
      cell: ({ row }) => insuranceCodesMap[row.original.insurance_code]?.name || t('common.notSet'),
      enableSorting: false,
    },
    {
      accessorKey: 'base_price',
      header: t('tariffs.fields.basePrice', {defaultValue: 'Base Price'}),
      cell: ({ row }) => new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: row.original.currency || 'ILS', minimumFractionDigits: 0 }).format(row.original.base_price ?? 0),
      enableSorting: true,
    },
    {
      accessorKey: 'finalization_type',
      header: t('tariffs.fields.finalizationType', {defaultValue: 'Finalization'}),
      cell: ({ row }) => {
        const finalizationLabel = t(`finalizationType.${row.original.finalization_type}`, {defaultValue: row.original.finalization_type});
        const finalizationVariant = { RFC: 'outline', Claim: 'secondary', Hybrid: 'default' }[row.original.finalization_type] || 'default';
        return <Badge variant={finalizationVariant} className="text-xs">{finalizationLabel}</Badge>;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'updated_date',
      header: t('common.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date)) ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.unknown')),
      enableSorting: true
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={() => openDetailsDrawer(row.original.id)} title={t('buttons.viewDetails', {defaultValue: 'View Details'})} className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [t, language, currentLocale, contractsMap, insuranceCodesMap, openDetailsDrawer]);

  const sortOptions = useMemo(() => [
    { key: 'contract_id', labelKey: 'tariffs.fields.contractNumber', defaultValue: 'Contract No.' },
    { key: 'insurance_code', labelKey: 'tariffs.fields.insuranceCode', defaultValue: 'Insurance Code' },
    { key: 'base_price', labelKey: 'tariffs.fields.basePrice', defaultValue: 'Base Price' },
    { key: 'finalization_type', labelKey: 'tariffs.fields.finalizationType', defaultValue: 'Finalization Type' },
    { key: 'updated_date', labelKey: 'common.lastUpdated', defaultValue: 'Last Updated' },
  ], [t]);

  if (loading && tariffItems.length === 0 && !isCacheValid('items')) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) })} />;
  }

  if (error && tariffItems.length === 0 && (!apiCache.items.data || !isCacheValid('items')) ) {
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
          {t('buttons.retry', {defaultValue: 'Retry'})}
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
                    ? t('tariffs.selectionModeTitle', { count: selectedItemIds.size })
                    : t('filters.filterAndSortTitle', { entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'})})
                }
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isSelectionModeActive && (
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(newView) => {
                        setCurrentView(newView);
                        localStorage.setItem('insurance_tariffs_view_preference', newView);
                        cancelSelectionMode();
                    }}
                    entityName="insurance_tariffs"
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
                aria-label={t('tariffs.searchPlaceholder', {defaultValue: 'Search by Contract, Code, Provider...'})}
                placeholder={t('tariffs.searchPlaceholder', {defaultValue: 'Search by Contract, Code, Provider...'})}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
              <Select value={filters.contractId} onValueChange={(value) => handleFilterChange('contractId', value)}>
                <SelectTrigger aria-label={t('filters.selectContract', {defaultValue: 'Select Contract'})} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('filters.selectContract', {defaultValue: 'Select Contract'})} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    <SelectItem value="all" className="dark:hover:bg-gray-600">{t('filters.allContracts', {defaultValue: 'All Contracts'})}</SelectItem>
                    {allContractsOptions.filter(opt => opt.value !== 'all').map(option => (
                        <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={filters.insuranceCodeId} onValueChange={(value) => handleFilterChange('insuranceCodeId', value)}>
                <SelectTrigger aria-label={t('filters.selectInsuranceCode', {defaultValue: 'Select Insurance Code'})} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('filters.selectInsuranceCode', {defaultValue: 'Select Insurance Code'})} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    <SelectItem value="all" className="dark:hover:bg-gray-600">{t('filters.allInsuranceCodes', {defaultValue: 'All Insurance Codes'})}</SelectItem>
                    {allInsuranceCodesOptions.filter(opt => opt.value !== 'all').map(option => (
                        <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={filters.finalizationType} onValueChange={(value) => handleFilterChange('finalizationType', value)}>
                <SelectTrigger aria-label={t('filters.selectFinalizationType', {defaultValue: 'Select Finalization Type'})} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('filters.selectFinalizationType', {defaultValue: 'Select Finalization Type'})} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    <SelectItem value="all" className="dark:hover:bg-gray-600">{t('filters.allTypes', {defaultValue: 'All Types'})}</SelectItem>
                    {['RFC', 'Claim', 'Hybrid'].map(type => (
                        <SelectItem key={type} value={type} className="dark:hover:bg-gray-600">{t(`finalizationType.${type}`, {defaultValue: type})}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={t('filters.minBasePrice', {defaultValue: 'Min Base Price'})}
                value={filters.minBasePrice}
                onChange={(e) => handleFilterChange('minBasePrice', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
              <Input
                type="number"
                placeholder={t('filters.maxBasePrice', {defaultValue: 'Max Base Price'})}
                value={filters.maxBasePrice}
                onChange={(e) => handleFilterChange('maxBasePrice', e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
            </div>
             <div className="flex items-center gap-4 pt-3 border-t dark:border-gray-700 mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                      {t('filters.sortBy', {defaultValue: 'Sort By'})}: {t(sortOptions.find(o => o.key === sortConfig.key)?.labelKey || sortConfig.key, { defaultValue: sortOptions.find(o => o.key === sortConfig.key)?.defaultValue || sortConfig.key})}
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
                        <SelectValue placeholder={t('filters.itemsPerPage', {defaultValue: 'Items per page'})} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                        {[10, 20, 50, 100].map(size => (
                            <SelectItem key={size} value={String(size)} className="text-xs dark:hover:bg-gray-600">
                                {t('filters.showItems', {count: size, defaultValue: `Show ${size}`})}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-3">
                <Button onClick={clearFilters} variant="outline" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                  <FilterX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.clearFiltersAndSort', {defaultValue: 'Clear Filters & Sort'})}
                </Button>
                <Button onClick={handleRefresh} variant="outline" disabled={loading && apiCache.items.loading} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                  <RefreshCw className={`h-4 w-4 ${loading && apiCache.items.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.refresh', {defaultValue: 'Refresh'})}
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

      {loading && tariffItems.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) })} />}

      {!loading && sortedAndFilteredItems.length === 0 && tariffItems.length > 0 ? (
        <EmptyState
          icon={TariffIcon}
          title={t('emptyStates.noMatchFilterTitle', { entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) })}
          message={t('emptyStates.noMatchFilterMessage', {defaultValue: 'No items match your current filters. Try adjusting them.'})}
        />
      ) : !loading && tariffItems.length === 0 && !error ? (
        <EmptyState
          icon={TariffIcon}
          title={t('emptyStates.noDataTitle', { entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}) })}
          message={t('emptyStates.noDataMessage', { entity: t('tariffs.titleSingular', {defaultValue: 'Tariff'}) })}
          actionButton={
            <Button onClick={() => openTariffDialog()} className="mt-4">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('tariffs.addNew', {defaultValue: 'Add New Tariff'})}
            </Button>
          }
        />
      ) : (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {paginatedItems.filter(item => item && item.id).map(item => (
                <TariffCard
                    key={item.id}
                    tariff={item}
                    contractInfo={contractsMap[item.contract_id]}
                    insuranceCodeInfo={insuranceCodesMap[item.insurance_code]}
                    onViewDetails={openDetailsDrawer}
                    currentLocale={currentLocale}
                    isSelectionModeActive={isSelectionModeActive}
                    isSelected={selectedItemIds.has(item.id)}
                    onToggleSelection={handleToggleSelection}
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
            <DataTable
              columns={tariffColumns}
              data={paginatedItems.filter(item => item && item.id)}
              isLoading={loading && tariffItems.length > 0}
              error={error && tariffItems.length > 0 ? error : null}
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
              entityName={t('tariffs.titlePlural', {defaultValue: 'Tariffs'})}
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
                    entity: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}).toLowerCase()
                })}
              </div>
              <div className="space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1 || (loading && tariffItems.length > 0)}
                >
                  {t('buttons.previous', {defaultValue: 'Previous'})}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === Math.ceil(sortedAndFilteredItems.length / filters.pageSize) || (loading && tariffItems.length > 0)}
                >
                  {t('buttons.next', {defaultValue: 'Next'})}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isTariffDialogOpen && (
        <TariffDialog
          isOpen={isTariffDialogOpen}
          onCloseDialog={handleTariffDialogClose}
          tariffData={currentTariff}
          contractOptions={allContractsOptions.filter(opt => opt.value !== 'all')}
          insuranceCodeOptions={allInsuranceCodesOptions.filter(opt => opt.value !== 'all')}
        />
      )}
      {isBulkDeleteConfirmOpen && (
        <ConfirmationDialog
          open={isBulkDeleteConfirmOpen}
          onOpenChange={setIsBulkDeleteConfirm}
          onConfirm={handleBulkDelete}
          title={t('tariffs.deleteConfirmTitle', { count: selectedItemIds.size})}
          description={t('tariffs.deleteConfirmMessage', { count: selectedItemIds.size })}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            onImportSubmit={handleImportSubmit}
            entityName={t('tariffs.titlePlural', {defaultValue: 'Tariffs'})}
            sampleHeaders={['contract_id', 'insurance_code', 'base_price', 'currency', 'finalization_type', 'component_type', 'pricing_model', 'recipient_type', 'amount']}
        />
      )}
      {/* Details Drawer for future use
      {isDetailsDrawerOpen && selectedTariffIdForDrawer && (
        <TariffDetailsDrawer
          tariffId={selectedTariffIdForDrawer}
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEdit={openTariffDialog}
        />
      )}
      */}
    </div>
  );
}
