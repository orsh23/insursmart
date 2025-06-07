
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { PolicyCoverage } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import PolicyCoverageDialog from './PolicyCoverageDialog';
import PolicyCoverageCard from './PolicyCoverageCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog'; // Corrected path
import DataTable from '@/components/ui/data-table'; 
import PolicyCoverageFilterBar from './PolicyCoverageFilterBar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Plus, Edit, Trash2, UploadCloud, DownloadCloud, Eye,
    RefreshCw, SquareCheckBig, XCircle, FilterX, AlertTriangle
} from 'lucide-react'; 
import { format, parseISO, isValid } from 'date-fns'; 
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const apiCache = {
  items: { data: null, timestamp: null, loading: false, error: null },
  // Add other related data caches if needed (e.g., policiesMap)
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

export default function PolicyConfigTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [policyCoverages, setPolicyCoverages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  const [filters, setFilters] = useState({
    searchTerm: '', // Search by policy ID, coverage details
    policyId: 'all', // Example filter, if coverages are linked to specific policies
    coverageType: 'all', // Example: hospital_days_limit, annual_deductible
    isActive: 'all', // Assuming a status field like is_active
    page: 1,
    pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'policy_id', direction: 'ascending' }); // Default sort

  const [isCoverageDialogOpen, setIsCoverageDialogOpen] = useState(false);
  const [currentCoverage, setCurrentCoverage] = useState(null);
  // const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false); // For future if needed
  // const [selectedCoverageIdForDrawer, setSelectedCoverageIdForDrawer] = useState(null); // For future
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' });

  const [currentView, setCurrentView] = useState(localStorage.getItem('policy_config_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set()); // THIS IS THE KEY STATE

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'items';
    setLoading(true);
    setError(null);

    if (!forceRefresh && isCacheValid(cacheKey) && apiCache[cacheKey].data) {
        setPolicyCoverages(apiCache[cacheKey].data);
        if(apiCache[cacheKey].error) setError(apiCache[cacheKey].error);
        setLoading(false);
        return;
    }
    if (apiCache[cacheKey]?.loading && !forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (apiCache[cacheKey]?.data) setPolicyCoverages(apiCache[cacheKey].data);
        setLoading(false);
        return;
    }
    
    setCacheLoading(cacheKey, true);
    try {
      // IMPORTANT: Replace with actual entity if PolicyCoverage is not the correct one
      // Or, if this tab manages a subset of InsurancePolicy fields, fetch InsurancePolicy
      // const fetchedData = await PolicyCoverage.list(); 
      // MOCK DATA for PolicyCoverage
      const mockPolicyCoverages = [
        { id: 'pc1', policy_id: 'POL-001', allows_doctor_fee: true, allows_implantables: true, annual_deductible: 500, copay_percentage: 20, out_of_pocket_max: 5000, hospital_days_limit: 30, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc2', policy_id: 'POL-002', allows_doctor_fee: false, allows_implantables: false, annual_deductible: 1000, copay_percentage: 10, out_of_pocket_max: 10000, hospital_days_limit: 0, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc3', policy_id: 'POL-003', allows_doctor_fee: true, allows_implantables: false, annual_deductible: 0, copay_percentage: 0, out_of_pocket_max: 0, hospital_days_limit: 15, is_active: false, updated_date: new Date().toISOString() },
        { id: 'pc4', policy_id: 'POL-004', allows_doctor_fee: true, allows_implantables: true, annual_deductible: 200, copay_percentage: 15, out_of_pocket_max: 2000, hospital_days_limit: 10, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc5', policy_id: 'POL-005', allows_doctor_fee: false, allows_implantables: true, annual_deductible: 750, copay_percentage: 25, out_of_pocket_max: 7500, hospital_days_limit: 25, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc6', policy_id: 'POL-006', allows_doctor_fee: true, allows_implantables: false, annual_deductible: 100, copay_percentage: 5, out_of_pocket_max: 1000, hospital_days_limit: 5, is_active: false, updated_date: new Date().toISOString() },
        { id: 'pc7', policy_id: 'POL-007', allows_doctor_fee: true, allows_implantables: true, annual_deductible: 0, copay_percentage: 0, out_of_pocket_max: 0, hospital_days_limit: 0, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc8', policy_id: 'POL-008', allows_doctor_fee: false, allows_implantables: false, annual_deductible: 2000, copay_percentage: 30, out_of_pocket_max: 20000, hospital_days_limit: 60, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc9', policy_id: 'POL-009', allows_doctor_fee: true, allows_implantables: true, annual_deductible: 300, copay_percentage: 18, out_of_pocket_max: 3000, hospital_days_limit: 12, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc10', policy_id: 'POL-010', allows_doctor_fee: false, allows_implantables: true, annual_deductible: 900, copay_percentage: 22, out_of_pocket_max: 9000, hospital_days_limit: 40, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc11', policy_id: 'POL-011', allows_doctor_fee: true, allows_implantables: false, annual_deductible: 400, copay_percentage: 12, out_of_pocket_max: 4000, hospital_days_limit: 20, is_active: true, updated_date: new Date().toISOString() },
        { id: 'pc12', policy_id: 'POL-012', allows_doctor_fee: false, allows_implantables: false, annual_deductible: 1500, copay_percentage: 28, out_of_pocket_max: 15000, hospital_days_limit: 50, is_active: false, updated_date: new Date().toISOString() },
      ];
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const fetchedData = mockPolicyCoverages;

      const validData = Array.isArray(fetchedData) ? fetchedData : [];
      setPolicyCoverages(validData);
      updateCache(cacheKey, validData);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching policy coverages:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { defaultValue: `Failed to fetch ${t('policyCoverage.pageTitle', {defaultValue: 'Policy Coverages'})}.`});
       if (err.response?.status === 429 || err.message?.includes("429")) {
          errorMessage = t('errors.rateLimitExceededShort', { defaultValue: 'Rate limit reached. Retrying soon.'});
          if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else if (err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed to fetch')) {
        errorMessage = t('errors.networkErrorGeneral', { defaultValue: 'Network error. Please check your connection and try again.'});
         if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else {
         setError(errorMessage);
      }
      if (isCacheValid(cacheKey) && apiCache[cacheKey].data) {
         updateCache(cacheKey, apiCache[cacheKey].data, errorMessage);
      } else {
         updateCache(cacheKey, [], errorMessage);
      }
    } finally {
      setCacheLoading(cacheKey, false);
      setLoading(false);
    }
  }, [t, retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

   useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && (error?.includes(t('errors.rateLimitExceededShort')) || error?.includes(t('errors.networkErrorGeneral')))) {
      const delay = Math.min(1000 * Math.pow(2, retryCount -1), 8000);
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, error, fetchData, t]);

  const handleRefresh = () => {
    updateCache('items', null); // Invalidate cache for items
    setRetryCount(0);
    fetchData(true); // forceRefresh = true
    toast({
        title: t('common.refreshingData', { defaultValue: "Refreshing Data"}),
        description: t('messages.fetchingLatest', { item: t('insurance.tabs.policyConfig', {defaultValue: 'Policy Configurations'}), defaultValue: `Fetching latest Policy Configurations...`}),
    });
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handleSortChange = useCallback((newSortState) => {
    setSortConfig(newSortState);
    setFilters(prev => ({ ...prev, page: 1 })); // Reset page to 1 on sort change
  }, []);

  const handleDataTableSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      setSortConfig({ key: newSortState[0].id, direction: newSortState[0].desc ? 'descending' : 'ascending' });
    } else {
      // Default sort or clear sort
      setSortConfig({ key: 'policy_id', direction: 'ascending' }); // Adjust default sort key
    }
    setFilters(prev => ({ ...prev, page: 1 })); // Reset page to 1 on sort change
  }, []);

  const filteredAndSortedCoverages = useMemo(() => {
    let items = Array.isArray(policyCoverages) ? policyCoverages.filter(Boolean) : [];

    // Apply filters (example filters, adjust to PolicyCoverage entity fields)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      items = items.filter(item =>
        (item.policy_id && String(item.policy_id).toLowerCase().includes(term)) || // Assuming policy_id is searchable
        // Add other searchable fields from PolicyCoverage
        (item.notes && item.notes.toLowerCase().includes(term)) 
      );
    }
    if (filters.policyId !== 'all') {
        items = items.filter(item => item.policy_id === filters.policyId);
    }
    // Add more filters based on PolicyCoverage structure, e.g., coverageType, isActive
    if (filters.isActive !== 'all') {
      items = items.filter(item => String(item.is_active) === filters.isActive);
    }

    // Apply sorting
    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle nested properties if sortConfig.key is like 'object.property'
        if (sortConfig.key.includes('.')) {
            const keys = sortConfig.key.split('.');
            valA = keys.reduce((obj, key) => obj?.[key], a);
            valB = keys.reduce((obj, key) => obj?.[key], b);
        }

        // Specific type handling for sorting
        if (sortConfig.key === 'updated_date' || sortConfig.key === 'created_date') {
          valA = a[sortConfig.key] ? parseISO(a[sortConfig.key]).getTime() : 0;
          valB = b[sortConfig.key] ? parseISO(b[sortConfig.key]).getTime() : 0;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        } else if (typeof valA === 'boolean') {
           valA = valA ? 1: 0;
           valB = valB ? 1: 0;
        } else if (typeof valA === 'number') {
          // No special handling needed, numbers compare directly
        }
        
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [policyCoverages, filters, sortConfig]);

  const paginatedItems = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedCoverages.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedCoverages, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedCoverages.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  const handlePageChange = useCallback((newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);
  
  const handlePageSizeChange = (newPageSize) => {
    setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const openItemDialog = (item = null) => {
    setCurrentCoverage(item);
    setIsCoverageDialogOpen(true);
  };

  const handleDialogClose = (refreshNeeded, operationType = null, itemName = '') => {
    setIsCoverageDialogOpen(false);
    setCurrentCoverage(null);
    if (refreshNeeded) {
      handleRefresh();
      const itemDisplay = itemName || t('policyCoverage.itemTitleGeneric', {defaultValue: 'Policy Coverage'});
      if (operationType === 'create') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('policyCoverage.createSuccess', { name: itemDisplay, defaultValue: `${itemDisplay} has been successfully created.` }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('policyCoverage.updateSuccess', { name: itemDisplay, defaultValue: `${itemDisplay} has been successfully updated.` }) });
      }
    }
    if (isSelectionModeActive && refreshNeeded) { // Exit selection mode after successful action
        cancelSelectionMode();
    }
  };

  const openDeleteDialog = (itemIds, itemName = '') => {
    const idsToDelete = itemIds instanceof Set ? itemIds : (itemIds ? new Set([itemIds]) : new Set());
    if (idsToDelete.size === 0) {
      toast({ title: t('bulkActions.noSelectionTitle', { defaultValue: "No Selection" }), description: t('bulkActions.noSelectionToDeleteDesc', { entity: t('policyCoverage.pageTitle', { defaultValue: 'Policy Coverages' }) }), variant: "warning" });
      return;
    }
    const displayItemName = idsToDelete.size === 1 ? itemName || t('common.item', {defaultValue: 'item'}) : `${idsToDelete.size} ${t('common.items', {defaultValue: 'items'})}`;
    setDeleteDialogState({ isOpen: true, itemIds: idsToDelete, itemName: displayItemName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.size === 0) return;
    setLoading(true);
    let successes = 0;
    let failures = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        // await PolicyCoverage.delete(id); // Use correct Entity
        console.log(`Mock Deleting PolicyCoverage ${id}`); // Mock delete
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
        successes++;
      } catch (err) {
        console.error("Error deleting policy coverage:", err);
        failures++;
      }
    }
    setLoading(false);

    if (successes > 0) {
      toast({
        title: t('common.success', { defaultValue: "Success" }),
        description: t('common.deleteSuccessMultiple', { count: successes, item: deleteDialogState.itemName }),
        variant: "success",
      });
      handleRefresh();
    }
    if (failures > 0) {
       toast({
        title: t('common.error', { defaultValue: "Error" }),
        description: t('common.deleteErrorPartial', { successCount: successes, failCount: failures, item: deleteDialogState.itemName }),
        variant: "destructive",
      });
    }

    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '' });
    cancelSelectionMode();
  };

  const handleToggleSelection = useCallback((itemId) => {
    if (itemId === undefined || itemId === null) return;
    setSelectedItemIds(prevIds => {
        const newSelectedIds = new Set(prevIds); // Ensure it's always a new Set instance
        if (newSelectedIds.has(itemId)) {
            newSelectedIds.delete(itemId);
        } else {
            newSelectedIds.add(itemId);
        }
        return newSelectedIds;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    setSelectedItemIds(prevIds => {
        const newSelectedIds = new Set(prevIds);
        
        const itemsToConsider = (currentView === 'table' ? paginatedItems : filteredAndSortedCoverages);
        const allVisibleValidItems = itemsToConsider.filter(item => item && typeof item.id !== 'undefined' && item.id !== null);
        
        const allCurrentlySelectedOnPage = allVisibleValidItems.length > 0 && allVisibleValidItems.every(item => newSelectedIds.has(item.id));

        if (allCurrentlySelectedOnPage) {
            allVisibleValidItems.forEach(item => newSelectedIds.delete(item.id));
        } else {
            allVisibleValidItems.forEach(item => newSelectedIds.add(item.id));
        }
        return newSelectedIds;
    });
  }, [paginatedItems, filteredAndSortedCoverages, currentView]);

  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedItemIds(new Set());
  };

  const openEditFromSelection = () => {
    if (selectedItemIds.size === 1) {
      const itemIdToEdit = selectedItemIds.values().next().value;
      const itemToEdit = policyCoverages.find(item => item.id === itemIdToEdit);
      if (itemToEdit) {
        openItemDialog(itemToEdit);
      }
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', {defaultValue: 'Select One Item'}), description: t('bulkActions.selectOneToEditDesc', {entity: t('policyCoverage.pageTitle', {defaultValue: 'Policy Coverages'})}), variant: 'info' });
    }
  };

  const handleDeleteFromSelection = () => {
    if (selectedItemIds.size === 0) {
      toast({ title: t('bulkActions.noSelectionTitle', {defaultValue: "No Selection"}), description: t('bulkActions.noSelectionToDeleteDesc', {entity: t('policyCoverage.pageTitle', {defaultValue: 'Policy Coverages'}) }), variant: "warning"});
      return;
    }
    openDeleteDialog(selectedItemIds);
  };

  const handleImportSubmit = async (file) => {
    setIsImportDialogOpen(false);
    toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: t('policyCoverage.importFeatureName', {defaultValue: 'Policy Coverage Import'})}) });
    // Actual import logic here
    // const records = await parseFile(file); // Example
    // if (!records || records.length === 0) { ... }
    // setLoading(true); ... PolicyCoverage.bulkCreate(mappedRecords) ... setLoading(false);
    // fetchData(true);
  };

  const clearFiltersAndSort = () => {
    setFilters({
      searchTerm: '',
      policyId: 'all',
      coverageType: 'all',
      isActive: 'all',
      page: 1,
      pageSize: 10,
    });
    setSortConfig({ key: 'policy_id', direction: 'ascending' });
    toast({
        title: t('filters.clearedTitle', { defaultValue: "Filters Cleared"}),
        description: t('filters.filtersReset', { item: t('insurance.tabs.policyConfig', {defaultValue: 'Policy Configurations'}), defaultValue: `Policy Configuration filters and sorting have been reset.`}),
    });
  };

  const globalActionsConfig = useMemo(() => {
    const itemsForSelection = currentView === 'table' ? paginatedItems : filteredAndSortedCoverages;
    const validItemsForSelection = itemsForSelection.filter(item => item && item.id);
    const allVisibleSelected = validItemsForSelection.length > 0 && validItemsForSelection.every(p => selectedItemIds.has(p.id));

    if (isSelectionModeActive) {
      return [
        { type: 'edit', labelKey: 'buttons.editSelected', defaultLabel: `Edit Selected (${selectedItemIds.size})`, onClick: openEditFromSelection, disabled: selectedItemIds.size !== 1, icon: Edit },
        { type: 'delete', labelKey: 'buttons.deleteSelected', defaultLabel: `Delete Selected (${selectedItemIds.size})`, onClick: handleDeleteFromSelection, disabled: selectedItemIds.size === 0, icon: Trash2 },
        { isSeparator: true },
        { 
          type: 'selectAll', 
          labelKey: allVisibleSelected ? 'buttons.deselectAllVisible' : 'buttons.selectAllVisible', 
          defaultLabel: allVisibleSelected ? t('buttons.deselectAllVisible', {count: validItemsForSelection.length}) : t('buttons.selectAllVisible', {count: validItemsForSelection.length}), 
          onClick: handleSelectAllVisible,
          disabled: validItemsForSelection.length === 0,
          icon: SquareCheckBig 
        },
        { isSeparator: true },
        { type: 'cancel', labelKey: 'buttons.cancelSelection', defaultLabel: 'Cancel Selection', onClick: cancelSelectionMode, icon: XCircle },
      ];
    }
    return [
      { type: 'add', labelKey: 'policyCoverage.addNew', defaultLabel: 'Add Policy Coverage', onClick: () => openItemDialog(), icon: Plus },
      { isSeparator: true },
      { type: 'edit', labelKey: 'policyCoverage.enterEditMode', defaultLabel: 'Edit Coverages', onClick: () => setIsSelectionModeActive(true), icon: Edit },
      { type: 'delete', labelKey: 'policyCoverage.enterDeleteMode', defaultLabel: 'Delete Coverages', onClick: () => setIsSelectionModeActive(true), icon: Trash2 },
      { isSeparator: true },
      { type: 'import', labelKey: 'policyCoverage.import', defaultLabel: 'Import Coverages', onClick: () => setIsImportDialogOpen(true), icon: UploadCloud },
      { type: 'export', labelKey: 'policyCoverage.export', defaultLabel: 'Export Coverages', onClick: () => toast({title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: t('policyCoverage.exportFeatureName', {defaultValue: 'Export Policy Coverages'})})}), disabled: true, icon: DownloadCloud },
    ];
  }, [
    isSelectionModeActive, 
    selectedItemIds, 
    filteredAndSortedCoverages, 
    paginatedItems, 
    currentView,
    t, 
    openItemDialog, 
    setIsImportDialogOpen, 
    handleSelectAllVisible, 
    cancelSelectionMode, 
    openEditFromSelection, 
    handleDeleteFromSelection
  ]);

  const columns = useMemo(() => [
    // Select column is handled by DataTable itself based on isSelectionModeActive prop
    {
      accessorKey: 'policy_id',
      header: t('policyCoverage.fields.policyId', {defaultValue: 'Policy ID'}),
      cell: ({ row }) => row.original.policy_id || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    {
      accessorKey: 'allows_doctor_fee',
      header: t('policyCoverage.fields.allowsDoctorFeeShort', {defaultValue: 'Doctor Fee'}),
      cell: ({ row }) => (typeof row.original.allows_doctor_fee === 'boolean' ? (row.original.allows_doctor_fee ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'})) : t('common.notSet', {defaultValue: 'N/A'})),
      enableSorting: true,
    },
    {
      accessorKey: 'allows_implantables',
      header: t('policyCoverage.fields.allowsImplantablesShort', {defaultValue: 'Implantables'}),
      cell: ({ row }) => (typeof row.original.allows_implantables === 'boolean' ? (row.original.allows_implantables ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'})) : t('common.notSet', {defaultValue: 'N/A'})),
      enableSorting: true,
    },
    {
      accessorKey: 'annual_deductible',
      header: t('policyCoverage.fields.annualDeductibleShort', {defaultValue: 'Deductible'}),
      cell: ({ row }) => (typeof row.original.annual_deductible === 'number' ? `${row.original.annual_deductible.toLocaleString(language)}` : t('common.notSet', {defaultValue: 'N/A'})),
      enableSorting: true,
    },
    {
      accessorKey: 'copay_percentage',
      header: t('policyCoverage.fields.copayPercentageShort', {defaultValue: 'Copay %'}),
      cell: ({ row }) => (typeof row.original.copay_percentage === 'number' ? `${row.original.copay_percentage}%` : t('common.notSet', {defaultValue: 'N/A'})),
      enableSorting: true,
    },
    {
      accessorKey: 'is_active', // Assuming a status field, adapt if different
      header: t('policyCoverage.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
          <Badge className={`text-xs ${row.original.is_active ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
            {row.original.is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})}
          </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'updated_date',
      header: t('common.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date)) ? format(parseISO(row.original.updated_date), 'PP pp', { locale: currentLocale }) : t('common.unknown', {defaultValue: 'Unknown'})),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: () => <div className="text-right rtl:text-left">{t('common.actions', {defaultValue: 'Actions'})}</div>,
      cell: ({ row }) => {
          const item = row.original;
          if (!item || !item.id) return null;
          return (
            <div className="text-right rtl:text-left">
              {/* <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(item.id); }} title={t('buttons.viewDetails', {defaultValue: 'View Details'})}>
                <Eye className="h-4 w-4" />
              </Button> */}
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openItemDialog(item); }} title={t('common.edit', {defaultValue: 'Edit'})}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500" onClick={(e) => { e.stopPropagation(); openDeleteDialog(item.id, item.policy_id || t('policyCoverage.itemTitleGeneric', {defaultValue: `Config ${item.id}`})); }} title={t('common.delete', {defaultValue: 'Delete'})}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
      },
      enableSorting: false,
    },
  ], [t, language, currentLocale, isRTL, openDeleteDialog, openItemDialog]);


  // If still loading initial data and no cache, show main spinner
  if (loading && policyCoverages.length === 0 && !isCacheValid('items')) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('policyCoverage.pageTitle', { defaultValue: 'Policy Coverages' }) })} />;
  }
  
  // If error on initial load and no cache, show full error state
  if (error && policyCoverages.length === 0 && (!apiCache.items?.data || !isCacheValid('items'))) {
     return (
      <Card className="mt-6 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('errors.dataLoadErrorTitle', {defaultValue: "Data Load Error"})}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {(error.includes(t('errors.rateLimitExceededShort')) || error.includes(t('errors.networkErrorGeneral'))) && retryCount < 3 && (
             <p className="text-sm text-gray-500 dark:text-gray-300">{t('errors.retryingSoon', {defaultValue: 'Retrying automatically soon...'})}</p>
          )}
          <Button onClick={() => { setRetryCount(0); handleRefresh();}} variant="outline" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('buttons.retry', {defaultValue: 'Retry'})}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayItems = currentView === 'card' ? paginatedItems : filteredAndSortedCoverages; // For card view, we only show paginated items. For table, DataTable handles its own pagination on the full filtered set.

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          <ShieldCheck className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
          {t('insurance.tabs.policyConfig', { defaultValue: 'Policy Configuration' })} ({totalItems})
        </h2>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={globalActionsConfig}
                isSelectionModeActive={isSelectionModeActive}
                selectedItemCount={selectedItemIds.size}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh', {defaultValue: 'Refresh'})}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => {
                  setCurrentView(view);
                  localStorage.setItem('policy_config_view_preference', view);
                  if (isSelectionModeActive) cancelSelectionMode(); // Exit selection mode if view changes
              }}
              entityName="policy_config" // Use a unique name for localStorage
            />
        </div>
      </div>
      
      <PolicyCoverageFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={clearFiltersAndSort}
        // Pass any necessary data for filter options (e.g., policiesList)
        // policiesList={Object.values(policiesMap || {}).map(p => ({value: p.id, label: p.number}))} 
        currentView={currentView}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        t={t} language={language}
        isSelectionModeActive={isSelectionModeActive}
      />

      {error && (policyCoverages.length > 0 || retryCount > 0) && ( // Show error if there's data but an error occurred (e.g., failed refresh)
         <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred', {defaultValue: 'An Error Occurred'})}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3 border-destructive text-destructive hover:bg-destructive/20">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retry', {defaultValue: "Retry"})}
                </Button>
            </CardContent>
        </Card>
      )}

      {apiCache.items?.error && !error && ( // Show cache error if main error isn't set
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{apiCache.items.error}</span>
        </div>
      )}

      {loading && policyCoverages.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: t('policyCoverage.pageTitle', {defaultValue: 'Policy Coverages'}) })} />}

      {!loading && filteredAndSortedCoverages.length === 0 && policyCoverages.length > 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('emptyStates.noMatchTitle', { item: t('policyCoverage.itemsTitleGenericP', {defaultValue: 'Policy Coverages'}), defaultValue: `No ${t('policyCoverage.itemsTitleGenericP', {defaultValue: 'Policy Coverages'})} Match Filters` })}
          message={t('emptyStates.noMatchFilterDesc', {defaultValue: "Try adjusting filters or create a new item."})}
        />
      ) : !loading && policyCoverages.length === 0 && !error ? ( // No data at all and no error
        <EmptyState
          icon={ShieldCheck}
          title={t('emptyStates.noDataTitle', { item: t('policyCoverage.itemsTitleGenericP', {defaultValue: 'Policy Coverages'}), defaultValue: `No ${t('policyCoverage.itemsTitleGenericP', {defaultValue: 'Policy Coverages'})} Yet`})}
          message={t('emptyStates.noDataDesc', { item: t('policyCoverage.itemTitleGeneric', {defaultValue: 'Policy Coverage'}), defaultValue: `Start by adding a new ${t('policyCoverage.itemTitleGeneric', {defaultValue: 'Policy Coverage'})} or importing data.`})}
          actionButton={
            <Button onClick={() => openItemDialog()}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewPolicyConfig', {defaultValue: 'Add New Configuration'})}
            </Button>
          }
        />
      ) : (
        <>
          {currentView === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedItems.map((item) => {
                  if (!item || typeof item.id === 'undefined') return null;
                  return (
                    <PolicyCoverageCard // Ensure this card component exists and is correctly implemented
                        key={item.id}
                        coverage={item}
                        t={t} isRTL={isRTL} language={language} currentLocale={currentLocale}
                        isSelectionModeActive={isSelectionModeActive}
                        isSelected={selectedItemIds.has(item.id)}
                        onToggleSelection={handleToggleSelection}
                    />
                  );
              })}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAndSortedCoverages} // Pass all filtered/sorted for DataTable's own pagination
              isLoading={loading && policyCoverages.length > 0}
              error={null} // Error is handled above for empty state
              entityName={t('insurance.tabs.policyConfig', {defaultValue: 'Policy Configurations'})}
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [5, 10, 20, 50, 100],
              }}
              onSortChange={handleDataTableSortChange}
              currentSort={[{id: sortConfig.key, desc: sortConfig.direction === 'descending'}]}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
              // onRowClick={({original: item}) => !isSelectionModeActive && item?.id && handleViewDetails(item.id)}
              t={t} language={language} isRTL={isRTL}
            />
          )}

          {currentView === 'card' && totalPages > 1 && (
            <div className="flex justify-between items-center py-3 px-1 border-t dark:border-gray-700 mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('dataTable.paginationSummary', { 
                    start: (filters.page - 1) * filters.pageSize + 1, 
                    end: Math.min(filters.page * filters.pageSize, filteredAndSortedCoverages.length), 
                    total: filteredAndSortedCoverages.length,
                    entity: t('policyCoverage.itemsTitleGenericP', {defaultValue: 'Policy Coverages'}).toLowerCase()
                })}
              </div>
              <div className="space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('buttons.previous', {defaultValue: 'Previous'})}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('buttons.next', {defaultValue: 'Next'})}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isCoverageDialogOpen && (
        <PolicyCoverageDialog
          isOpen={isCoverageDialogOpen}
          onClose={handleDialogClose}
          coverageItem={currentCoverage} // Updated prop name
          // Pass any other necessary props like policiesList for a dropdown
        />
      )}
      
      {/* Details Drawer if implemented
      {selectedCoverageIdForDrawer && (
        <PolicyCoverageDetailsDrawer
            itemId={selectedCoverageIdForDrawer}
            isOpen={isDetailsDrawerOpen}
            onClose={() => { setIsDetailsDrawerOpen(false); setSelectedCoverageIdForDrawer(null); }}
            onEdit={(itemData) => { setIsDetailsDrawerOpen(false); openItemDialog(itemData); }}
            onDelete={(itemId, itemName) => { setIsDetailsDrawerOpen(false); openDeleteConfirmDialog(itemId, itemName); }}
        />
      )} */}
      
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSubmit={handleImportSubmit} // Updated prop name
          entityName={t('insurance.tabs.policyConfig', {defaultValue: 'Policy Configurations'})}
          // Assuming PolicyCoverage.schema() returns a structure usable by ImportDialog for validation/headers
          // For now, using sampleHeaders as in outline
          sampleHeaders={['policy_id', 'allows_doctor_fee (true/false)', 'annual_deductible (number)', 'copay_percentage (number)', 'is_active (true/false)']}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.size || 1, defaultValue: `Confirm Delete`})}
        description={t('common.confirmDeleteDescription', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.size || 1, defaultValue: "Are you sure you want to delete this item(s)? This action cannot be undone."})}
        confirmText={t('common.delete', {defaultValue: 'Delete'})}
        cancelText={t('common.cancel', {defaultValue: 'Cancel'})}
        loading={loading}
      />
    </div>
  );
}
