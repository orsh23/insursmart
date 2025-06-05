
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { InsuredPerson } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

import InsuredPersonDialog from './InsuredPersonDialog';
import InsuredPersonCard from './InsuredPersonCard';
import InsuredPersonDetailsDrawer from './InsuredPersonDetailsDrawer';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import InsuredPersonFilterBar from './InsuredPersonFilterBar';
import ImportDialog from '@/components/common/ImportDialog';
import { Badge } from '@/components/ui/badge';

import {
    Users, Plus, UploadCloud, FilterX, RefreshCw, AlertTriangle
} from 'lucide-react';

import { format, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Utility functions for localStorage (can be moved to a shared utils file)
export const loadFromStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error loading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

export const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error);
    }
};

// Generic caching mechanism (can be moved to a shared utils or hook)
const createApiCache = () => ({
  data: null,
  timestamp: null,
  loading: false,
  error: null,
  expirationTime: 2 * 60 * 1000, // 2 minutes
});

// Generic useEntityModule hook
// This hook encapsulates common CRUD operations, filtering, sorting, pagination, and caching
// It's a simplification and assumes client-side filtering/sorting for simplicity.
export const useEntityModule = (config) => {
    const {
        entitySDK,
        entityNameSingular, // e.g., 'Insured Person'
        entityNamePlural,   // e.g., 'Insured Persons'
        initialFilters,
        sortConfigKey = 'full_name', // Default sort key for data table headers
        filterFunction: customFilterFunction, // Optional client-side filter function
    } = config;

    const { t } = useLanguageHook();
    const { toast } = useToast();

    // Data state
    const [allRawItems, setAllRawItems] = useState([]); // All items fetched, before client-side filtering/sorting
    const [filteredItems, setFilteredItems] = useState([]); // Filtered and sorted items (before pagination)
    const [items, setItems] = useState([]); // Paginated items (what's displayed)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Dialog/Drawer state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Selection state
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

    // Filters and Sorting
    const storageKeyPrefix = `entity_${entitySDK.name}`; // e.g., "entity_InsuredPerson"
    const [filters, setFilters] = useState(() => loadFromStorage(`${storageKeyPrefix}_filters`, initialFilters));
    const [sortConfig, setSortConfig] = useState(() => loadFromStorage(`${storageKeyPrefix}_sortConfig`, { key: sortConfigKey, direction: 'ascending' }));
    const [pagination, setPagination] = useState({
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
        totalItems: 0, // total after filtering/sorting
        totalPages: 0,
    });

    const apiCache = useMemo(() => createApiCache(), []);

    const isCacheValid = useCallback(() => {
        return apiCache.data && (Date.now() - apiCache.timestamp) < apiCache.expirationTime;
    }, [apiCache]);

    const updateCache = useCallback((data, error = null) => {
        apiCache.data = data;
        apiCache.timestamp = Date.now();
        apiCache.error = error;
        apiCache.loading = false;
    }, [apiCache]);

    const setCacheLoading = useCallback((isLoading) => {
        apiCache.loading = isLoading;
        if (isLoading) apiCache.error = null;
    }, [apiCache]);

    // Data fetching logic
    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh && isCacheValid() && apiCache.data) {
            setAllRawItems(apiCache.data);
            if (apiCache.error) setError(apiCache.error);
            setLoading(false);
            return;
        }

        if (apiCache.loading && !forceRefresh) {
            await new Promise(resolve => {
                const checkCompletion = () => {
                    if (!apiCache.loading) resolve();
                    else setTimeout(checkCompletion, 100);
                };
                checkCompletion();
            });
            if (isCacheValid() && apiCache.data) {
                setAllRawItems(apiCache.data);
                if (apiCache.error) setError(apiCache.error);
            } else if (!apiCache.loading && apiCache.error) {
                setError(apiCache.error);
            }
            setLoading(false);
            return;
        }

        setCacheLoading(true);
        try {
            const fetchedItems = await entitySDK.list('-updated_date');
            const validData = Array.isArray(fetchedItems) ? fetchedItems : [];
            setAllRawItems(validData);
            updateCache(validData);
            setRetryCount(0);
        } catch (err) {
            console.error(`Error fetching ${entityNamePlural}:`, err);
            let errorMessage = t('errors.fetchFailedGeneral', { item: entityNamePlural });
            if (err.response?.status === 429 || err.message?.includes("429")) {
                errorMessage = t('errors.rateLimitExceededShort');
                if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
            } else if (err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed to fetch')) {
                errorMessage = t('errors.networkErrorGeneral');
                if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
            } else {
                setError(errorMessage);
            }
            if (isCacheValid() && apiCache.data) {
                updateCache(apiCache.data, errorMessage);
            } else {
                updateCache([], errorMessage);
            }
        } finally {
            setCacheLoading(false);
            setLoading(false);
        }
    }, [t, retryCount, entitySDK, entityNamePlural, apiCache, isCacheValid, updateCache, setCacheLoading]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (retryCount > 0 && retryCount <= 3 && (error?.includes(t('errors.rateLimitExceededShort')) || error?.includes(t('errors.networkErrorGeneral')))) {
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000); // Exponential backoff
            const timer = setTimeout(() => fetchData(true), delay);
            return () => clearTimeout(timer);
        }
    }, [retryCount, error, fetchData, t]);

    // Apply filtering and sorting and pagination
    useEffect(() => {
        let currentItems = allRawItems;

        if (customFilterFunction) {
            currentItems = currentItems.filter(item => customFilterFunction(item, filters));
        } else {
             // Basic filtering fallback if no customFilterFunction is provided
             // This part should be customized per entity if needed
             const { searchTerm } = filters;
             if (searchTerm) {
                 const termLower = searchTerm.toLowerCase();
                 currentItems = currentItems.filter(item =>
                    Object.values(item).some(val => 
                        String(val).toLowerCase().includes(termLower)
                    )
                 );
             }
        }

        // Apply sorting
        if (sortConfig.key) {
            currentItems.sort((a, b) => {
                let valA, valB;
                const getValue = (obj, path) => path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
                valA = getValue(a, sortConfig.key);
                valB = getValue(b, sortConfig.key);

                // Handle string comparison for case-insensitivity
                if (typeof valA === 'string' && typeof valB === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                } else if (sortConfig.key.includes('date')) { // Special handling for date strings
                    valA = isValid(parseISO(valA)) ? parseISO(valA).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
                    valB = isValid(parseISO(valB)) ? parseISO(valB).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
                }
                
                if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
                if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? 1 : -Infinity; // Sort nulls to end

                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        setFilteredItems(currentItems); // Store the full filtered/sorted list

        // Apply pagination
        const totalItemsCount = currentItems.length;
        const totalPagesCount = Math.ceil(totalItemsCount / pagination.pageSize);
        
        // Ensure current page is valid after filtering
        const newPage = Math.min(pagination.page, totalPagesCount > 0 ? totalPagesCount : 1);

        setPagination(prev => ({
            ...prev,
            totalItems: totalItemsCount,
            totalPages: totalPagesCount,
            page: newPage // Update page if it changed
        }));

        const startIndex = (newPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        setItems(currentItems.slice(startIndex, endIndex));

        saveToStorage(`${storageKeyPrefix}_filters`, filters);
        saveToStorage(`${storageKeyPrefix}_sortConfig`, sortConfig);

    }, [allRawItems, filters, sortConfig, pagination.pageSize, pagination.page, customFilterFunction, storageKeyPrefix]);

    // Handlers
    const handleRefresh = useCallback(() => {
        setRetryCount(0);
        fetchData(true);
        toast({
            title: t('common.refreshingData'),
            description: t('messages.fetchingLatest', { item: entityNamePlural }),
        });
    }, [fetchData, t, entityNamePlural, toast]);

    const handleFilterChange = useCallback((newFiltersObj) => {
        setFilters(prev => ({ ...prev, ...newFiltersObj, page: 1 }));
    }, []);

    const handleSortChange = useCallback((newSortState) => {
        if (newSortState && newSortState.length > 0) {
            const { id, desc } = newSortState[0];
            setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
        } else {
            setSortConfig({ key: sortConfigKey, direction: 'ascending' }); // Reset to default sort
        }
    }, [sortConfigKey]);

    const handlePageChange = useCallback((newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    }, []);

    const handlePageSizeChange = useCallback((newPageSize) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
        setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 })); // Keep filter.pageSize in sync
    }, []);

    const handleAddNew = useCallback(() => {
        setCurrentItem(null);
        setIsDialogOpen(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    }, []);

    const handleDelete = useCallback(async (id, name = '') => {
        setLoading(true);
        try {
            await entitySDK.delete(id);
            toast({
                title: t('messages.success'),
                description: t('messages.deleteSuccess', { name: name || t('common.item'), item: entityNameSingular }),
            });
            fetchData(true);
        } catch (err) {
            console.error(`Error deleting ${entityNameSingular} ${id}:`, err);
            toast({
                title: t('errors.deleteFailedTitle'),
                description: t('messages.deleteError', { name: name || t('common.item'), error: err.message, item: entityNameSingular }),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [entitySDK, fetchData, t, toast, entityNameSingular]);

    const handleBulkDelete = useCallback(async (ids, itemNames = []) => {
        if (!ids || ids.length === 0) return;
        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const id of ids) {
            try {
                await entitySDK.delete(id);
                successCount++;
            } catch (err) {
                console.error(`Error deleting ${entityNameSingular} ${id}:`, err);
                errorCount++;
            }
        }
        setLoading(false);
        if (successCount > 0) {
            toast({
                title: t('messages.success'),
                description: t('messages.bulkDeleteSuccess', { count: successCount, item: entityNamePlural }),
            });
            fetchData(true);
        }
        if (errorCount > 0) {
            toast({
                title: t('errors.deleteFailedTitle'),
                description: t('messages.bulkDeletePartialError', { successCount, errorCount, item: entityNamePlural }),
                variant: "destructive",
            });
        }
        setSelectedItems(new Set()); // Clear selection after bulk operation
        setIsSelectionModeActive(false);
    }, [entitySDK, fetchData, t, toast, entityNameSingular, entityNamePlural]);

    const handleToggleSelection = useCallback((itemId) => {
        setSelectedItems(prevIds => {
            const newSelectedIds = new Set(prevIds);
            if (newSelectedIds.has(itemId)) newSelectedIds.delete(itemId);
            else newSelectedIds.add(itemId);
            return newSelectedIds;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedItems(prevIds => {
            const currentIds = new Set(prevIds);
            const allVisibleIds = items.map(item => item.id).filter(id => id != null); // Use current paginated items
            
            const allCurrentlySelectedOnPage = allVisibleIds.length > 0 && allVisibleIds.every(id => currentIds.has(id));

            if (allCurrentlySelectedOnPage) {
                allVisibleIds.forEach(id => currentIds.delete(id));
            } else {
                allVisibleIds.forEach(id => currentIds.add(id));
            }
            return currentIds;
        });
    }, [items]);

    const handleSelfSubmittingDialogClose = useCallback((refreshNeeded, operationType = null, itemName = '') => {
        setIsDialogOpen(false);
        setCurrentItem(null);
        if (refreshNeeded) {
            fetchData(true);
            const nameToDisplay = itemName || t('common.item');
            if (operationType === 'create') {
                toast({ title: t('messages.success'), description: t('messages.createSuccess', { name: nameToDisplay, item: entityNameSingular }) });
            } else if (operationType === 'update') {
                toast({ title: t('messages.success'), description: t('messages.updateSuccess', { name: nameToDisplay, item: entityNameSingular }) });
            }
        }
    }, [fetchData, t, toast, entityNameSingular]);

    return {
        items, // Paginated data, ready for display (table/cards)
        allRawItems, // All data before client-side filtering/pagination (useful for deriving filter options)
        filteredItems, // Filtered and sorted data (before pagination)
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
        handleRefresh,
        handleFilterChange,
        handleSortChange,
        handlePageChange,
        handlePageSizeChange,
        handleAddNew,
        handleEdit,
        handleDelete,
        handleBulkDelete,
        isSelectionModeActive,
        setIsSelectionModeActive,
        handleToggleSelection,
        handleSelectAll,
        handleSelfSubmittingDialogClose,
    };
};

export default function InsuredPersonsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: InsuredPerson,
    entityNameSingular: t('insurance.insuredPersons.singularTitle'),
    entityNamePlural: t('insurance.insuredPersons.title'),
    initialFilters: {
      searchTerm: '',
      gender: 'all',
      city: 'all',
      page: 1,
      pageSize: 10,
    },
    sortConfigKey: 'full_name',
    filterFunction: (item, filters) => {
        let matches = true;
        const { searchTerm, gender, city } = filters;

        if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            matches = matches && (
                (item.full_name && item.full_name.toLowerCase().includes(termLower)) ||
                (item.identification?.number && item.identification.number.includes(termLower)) ||
                (item.contact?.email && item.contact.email.toLowerCase().includes(termLower)) ||
                (item.contact?.phone && item.contact.phone.includes(termLower))
            );
        }
        if (gender !== 'all') matches = matches && (item.gender === gender);
        if (city !== 'all') matches = matches && (item.address?.city === city);

        return matches;
    },
  }), [t]);

  const {
    items: insuredPersons, // This is the paginated data
    allRawItems: allInsuredPersons, // All fetched data (for filter options)
    filteredItems: filteredAndSortedPersons, // All filtered and sorted data (for total count)
    loading,
    error,
    filters,
    setFilters, // Provided by useEntityModule but overridden locally for setting page to 1
    sortConfig,
    setSortConfig,
    pagination,
    selectedItems: selectedItemIdsSet, // Renamed selectedItems to selectedItemIdsSet, assuming it's a Set
    setSelectedItems: setSelectedItemIdsSet, // Renamed setter to match new name
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshInsuredPersons,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll: handleSelectAllVisible,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  const selectedItemIds = Array.from(selectedItemIdsSet); // Convert Set to Array for usage if needed

  const currentLocale = getLocaleObject(language);

  // Remaining component-specific states
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedPersonIdForDrawer, setSelectedPersonIdForDrawer] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' });

  // Current view preference, managed locally
  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('insuredpersons_view_preference', 'card'));

  // Update current view preference in local storage
  useEffect(() => {
    saveToStorage('insuredpersons_view_preference', currentView);
  }, [currentView]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'insurance.insuredPersons.addNewButton', defaultLabel: 'Add New Person', icon: Plus, action: handleAddNew, type: 'add' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    ...(externalActionsConfig || []) // Allow external actions to be passed in
  ], [handleAddNew, setIsImportDialogOpen, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItemIdsSet.size === 1) {
      const personIdToEdit = selectedItemIdsSet.values().next().value;
      const personToEdit = insuredPersons.find(p => p.id === personIdToEdit); // Use current paginated persons
      if (personToEdit) {
        handleEdit(personToEdit);
      }
    } else if (selectedItemIdsSet.size === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('insurance.insuredPersons.singularTitle') }) });
    } else {
       toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('insurance.insuredPersons.title')}), variant: 'info' });
    }
  }, [selectedItemIdsSet, handleEdit, setIsSelectionModeActive, t, toast, insuredPersons]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItemIdsSet.size > 0) {
      const idsToDelete = Array.from(selectedItemIdsSet);
      const firstItemName = idsToDelete.length > 0 ? (allInsuredPersons.find(p => p.id === idsToDelete[0])?.full_name || t('insurance.insuredPersons.singularTitle')) : t('insurance.insuredPersons.singularTitle');
      const itemName = idsToDelete.length === 1 ? firstItemName : t('insurance.insuredPersons.title');
      setDeleteDialogState({
          isOpen: true,
          itemIds: idsToDelete,
          itemName: itemName,
          message: t('insurance.insuredPersons.bulkDeleteConfirmMessage', { count: idsToDelete.length, itemName: itemName.toLowerCase() })
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('insurance.insuredPersons.title') }) });
    }
  }, [selectedItemIdsSet, allInsuredPersons, t, toast]);

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    await handleBulkDelete(deleteDialogState.itemIds);
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '', message: '' });
  };

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItemIdsSet(new Set());
  }, [setIsSelectionModeActive, setSelectedItemIdsSet]);

  const handlePersonDialogClose = useCallback((refreshNeeded, operationType = null, personNameParam = '') => {
    handleSelfSubmittingDialogClose(refreshNeeded, operationType, personNameParam);
    if (!isSelectionModeActive) { // if selection mode was active, keep it active after dialog
        // if selection mode was active, and items were edited, clear selection mode
        // if (operationType === 'update' && selectedItemIdsSet.size > 0) {
        //     handleCancelSelectionMode();
        // }
    }
  }, [handleSelfSubmittingDialogClose, isSelectionModeActive]);

  const openDetailsDrawer = (personId) => {
    const personToView = allInsuredPersons.find(p => p.id === personId); // Use allInsuredPersons for details
    if (personToView) {
        setSelectedPersonIdForDrawer(personId);
        setIsDetailsDrawerOpen(true);
    } else {
        toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundMessage', {item: t('insurance.insuredPersons.singularTitle')}), variant: "warning"});
    }
  };

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    const personsToCreate = records.map(rec => ({
        full_name: rec['Full Name'] || rec['full_name'],
        date_of_birth: rec['Date of Birth (YYYY-MM-DD)'] || rec['date_of_birth'], // Ensure correct header for date
        gender: rec['Gender']?.toLowerCase() || rec['gender']?.toLowerCase(),
        contact: {
            phone: rec['Phone'] || rec['phone'],
            email: rec['Email'] || rec['email'],
        },
        identification: {
            type: rec['ID Type (national_id/insurance_number/passport)']?.toLowerCase() || rec['identification_type']?.toLowerCase(), // Ensure correct header for ID type
            number: rec['ID Number'] || rec['identification_number'],
        },
        address: { city: rec['City'] || rec['city'] }
    })).filter(p => p.full_name && p.identification?.type && p.identification?.number);

    if(personsToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('insurance.insuredPersons.title')}), variant: 'warning'});
        return;
    }

    let successCount = 0; let errorCount = 0;
    for (const personData of personsToCreate) {
        try { await InsuredPerson.create(personData); successCount++; }
        catch (err) { console.error("Error creating insured person from import:", err, personData); errorCount++; }
    }
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount, errorCount, entity: t('insurance.insuredPersons.title')}),
    });
    if (successCount > 0) refreshInsuredPersons();
  };

  const personColumns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: t('insurance.insuredPersons.fields.fullName'),
      cell: ({ row }) => row.original.full_name || t('common.notSet'),
      enableSorting: true,
    },
    {
      accessorKey: 'identification.number',
      header: t('insurance.insuredPersons.fields.idNumber'),
      cell: ({ row }) => `${row.original.identification?.type ? t(`idType.${row.original.identification.type.toLowerCase()}`, {defaultValue: row.original.identification.type}) : ''}: ${row.original.identification?.number || t('common.notSet')}`,
      enableSorting: true,
    },
    {
      accessorKey: 'contact.email',
      header: t('common.email'),
      cell: ({ row }) => row.original.contact?.email || t('common.notSet'),
      enableSorting: true,
    },
    {
      accessorKey: 'contact.phone',
      header: t('common.phone'),
      cell: ({ row }) => row.original.contact?.phone || t('common.notSet'),
      enableSorting: true,
    },
     {
      accessorKey: 'date_of_birth',
      header: t('common.dateOfBirth'),
      cell: ({ row }) => (row.original.date_of_birth && isValid(parseISO(row.original.date_of_birth))
        ? format(parseISO(row.original.date_of_birth), 'PP', { locale: currentLocale })
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
  ], [t, currentLocale]);

  if (loading && insuredPersons.length === 0 && !error) { // Show full spinner only on initial load without data
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('insurance.insuredPersons.title')})} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <Users className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('insurance.insuredPersons.title')} ({pagination.totalItems})
        </h2>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItemIdsSet.size}
                itemTypeForActions={t('insurance.insuredPersons.singularTitle', {defaultValue: 'Insured Person'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={refreshInsuredPersons} disabled={loading && insuredPersons.length === 0}>
                <RefreshCw className={`h-4 w-4 ${loading && insuredPersons.length === 0 ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh')}
            </Button>
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); }}
                availableViews={['card', 'table']}
                entityName={t('insurance.insuredPersons.title')}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <InsuredPersonFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={() => {
          setFilters(entityConfig.initialFilters); // Reset to initial filters
          setSortConfig({ key: 'full_name', direction: 'ascending' }); // Reset to default sort
          handleCancelSelectionMode();
           toast({
              title: t('filters.clearedTitle'),
              description: t('filters.filtersReset', { item: t('insurance.insuredPersons.title') }),
          });
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => handleSortChange([{ id: key, desc: sortConfig.key === key && sortConfig.direction === 'ascending' }])}
        allPersons={allInsuredPersons} // For deriving filter options like city
        t={t} language={language} isRTL={isRTL}
      />

      {error && (filteredAndSortedPersons.length === 0 || pagination.totalItems === 0) && (
         <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
                 {/* Removed retryCount from condition, assuming useEntityModule handles its retries or error is persistent */}
                 { (error.includes(t('errors.networkErrorGeneral')) || error.includes(t('errors.rateLimitExceededShort'))) && (pagination.totalItems === 0) &&
                    <p className="text-sm text-destructive dark:text-red-300 mt-1">{t('errors.retryingSoon')}</p>
                }
                <Button variant="outline" size="sm" onClick={refreshInsuredPersons} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow')}
                </Button>
            </CardContent>
        </Card>
      )}

      {!loading && !error && filteredAndSortedPersons.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('insurance.insuredPersons.noPersonsFilterDesc')}
          message={t('insurance.insuredPersons.noPersonsDesc')}
          actionButton={
            <Button onClick={handleAddNew}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewInsuredPerson', {defaultValue: 'Add New Person'})}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {(!error || filteredAndSortedPersons.length > 0) && (filteredAndSortedPersons.length > 0 || (loading && filteredAndSortedPersons.length > 0)) && (
        <>
          {currentView === 'card' && insuredPersons.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {insuredPersons.map((person) => (
                <InsuredPersonCard
                  key={person.id}
                  person={person}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIdsSet.has(person.id)}
                  onToggleSelection={() => handleToggleSelection(person.id)}
                  onCardClick={() => !isSelectionModeActive && openDetailsDrawer(person.id)}
                />
              ))}
            </div>
          )}

          {currentView === 'table' && (
            <DataTable
              columns={personColumns}
              data={insuredPersons} // paginated items
              loading={loading && insuredPersons.length === 0} // Show loading state only if data is empty during load
              error={null}
              entityName={t('insurance.insuredPersons.title')}
              pagination={{
                currentPage: pagination.page,
                pageSize: pagination.pageSize,
                totalItems: pagination.totalItems,
                totalPages: pagination.totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
              onSortChange={handleSortChange}
              currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIdsSet}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openDetailsDrawer(item.id)}
              t={t} language={language} isRTL={isRTL}
            />
          )}

          {currentView === 'card' && pagination.totalPages > 1 && (
             <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.page, totalPages: pagination.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isDialogOpen && (
        <InsuredPersonDialog
          isOpen={isDialogOpen}
          onClose={handlePersonDialogClose}
          personData={currentItem}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {isDetailsDrawerOpen && selectedPersonIdForDrawer && (
        <InsuredPersonDetailsDrawer
          personId={selectedPersonIdForDrawer}
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEdit={(personToEdit) => {
            setIsDetailsDrawerOpen(false); // Close drawer first
            handleEdit(personToEdit);
          }}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          entityName={t('insurance.insuredPersons.title')}
          onImport={handleImportSubmit}
          sampleHeaders={['Full Name', 'Date of Birth (YYYY-MM-DD)', 'Gender (male/female/other)', 'Phone', 'Email', 'ID Type (national_id/insurance_number/passport)', 'ID Number', 'City']}
          language={language}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('insurance.insuredPersons.singularTitle'), count: deleteDialogState.itemIds?.length || 1})}
        description={deleteDialogState.message}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={loading && deleteDialogState.isOpen}
        t={t} isRTL={isRTL}
      />
    </div>
  );
}
