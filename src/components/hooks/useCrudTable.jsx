// Content of components/hooks/useCrudTable.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook'; 
import useDebounce from '@/components/hooks/useDebounce'; // Corrected path

// Default configuration, can be overridden
const DEFAULT_CONFIG = {
  entityName: 'Item',
  entityNamePlural: 'Items',
  initialPageSize: 10,
  searchDebounceDelay: 300,
  initialSortField: 'created_date',
  initialSortDirection: 'desc',
  idField: 'id',
  toastMessages: {
    fetchError: (entityName, error) => `Failed to load ${entityName}: ${error?.message || 'Unknown error'}`,
    createSuccess: (entityName, item) => `${entityName} "${item?.name || item?.title || item?.id || 'ID'}" created successfully.`,
    updateSuccess: (entityName, item) => `${entityName} "${item?.name || item?.title || item?.id || 'ID'}" updated successfully.`,
    deleteSuccess: (entityName, item) => `${entityName} "${item?.name || item?.title || item?.id || 'ID'}" deleted successfully.`,
    deleteError: (entityName, error) => `Failed to delete ${entityName}: ${error?.message || 'Unknown error'}`,
    bulkDeleteSuccess: (count, entityName) => `Successfully deleted ${count} ${entityName}.`,
    bulkDeleteError: (error) => `Failed to delete items: ${error?.message || 'Unknown error'}`,
  }
};

export default function useCrudTable(entitySDK, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const {
    entityName,
    entityNamePlural,
    initialPageSize,
    searchDebounceDelay,
    initialSortField,
    initialSortDirection,
    idField,
    DialogComponent, // Component for Add/Edit dialog
    initialFilters = {}, // Allow passing more complex initial filters
    filterFn, // Custom client-side filter function: (item, filters) => boolean
    sortFn,   // Custom client-side sort function: (items, sortConfig) => sortedItems
    toastMessages,
  } = config;

  const { t } = useLanguageHook();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceDelay);

  const [activeFilters, setActiveFilters] = useState({ ...initialFilters, searchTerm });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
  });

  const [sortConfig, setSortConfig] = useState({
    field: initialSortField,
    direction: initialSortDirection,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // For editing
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Server-side filtering and sorting would happen here if API supports it.
      // For now, fetching all and then client-side filtering/sorting.
      const allItems = await entitySDK.list(); 
      setItems(Array.isArray(allItems) ? allItems : []);
    } catch (err) {
      setError(err);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: toastMessages.fetchError(entityNamePlural, err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [entitySDK, entityNamePlural, t, toast, toastMessages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filtering and sorting
  useEffect(() => {
    let processedItems = [...items];

    // Client-side filtering
    if (filterFn && typeof filterFn === 'function') {
      processedItems = processedItems.filter(item => filterFn(item, { ...activeFilters, searchTerm: debouncedSearchTerm }));
    } else {
      // Basic default search if no filterFn
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        processedItems = processedItems.filter(item => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(lowerSearchTerm)
          )
        );
      }
      // Apply other activeFilters if no specific filterFn
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (key !== 'searchTerm' && value !== undefined && value !== null && value !== '' && value !== 'all') {
           processedItems = processedItems.filter(item => {
            if(item[key] === undefined) return false; // field does not exist on item
            if(Array.isArray(item[key])) return item[key].includes(value); // check if value is in array
            return String(item[key]).toLowerCase() === String(value).toLowerCase(); // exact match for other fields
          });
        }
      });
    }

    // Client-side sorting
    if (sortFn && typeof sortFn === 'function') {
      processedItems = sortFn(processedItems, sortConfig);
    } else if (sortConfig.field) {
      processedItems.sort((a, b) => {
        const valA = a[sortConfig.field];
        const valB = b[sortConfig.field];
        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    
    setFilteredItems(processedItems);
    setPagination(prev => ({ ...prev, totalItems: processedItems.length, totalPages: Math.ceil(processedItems.length / prev.pageSize) }));
  }, [items, debouncedSearchTerm, activeFilters, sortConfig, filterFn, sortFn]);

  const paginatedItems = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, pagination.currentPage, pagination.pageSize]);


  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setActiveFilters(prev => ({...prev, searchTerm: newSearchTerm }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);
  
  const handleFilterChange = useCallback((filterName, value) => {
    setActiveFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleSortChange = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  }, []);

  const handleAddNew = useCallback(() => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (itemId) => {
    if (!itemId) return;
    // Optional: Add a confirmation dialog here
    // if (!window.confirm(t('common.confirmDelete', {item: entityName}))) return;
    try {
      await entitySDK.delete(itemId);
      const itemForToast = items.find(it => it[idField] === itemId) || { [idField]: itemId };
      toast({ title: t('common.success'), description: toastMessages.deleteSuccess(entityName, itemForToast) });
      fetchData(); // Refresh data
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: toastMessages.deleteError(entityName, err),
        variant: 'destructive',
      });
    }
  }, [entitySDK, fetchData, t, toast, entityName, toastMessages, items, idField]);
  
  const handleDialogClose = useCallback((refresh = false) => {
    setIsDialogOpen(false);
    setCurrentItem(null);
    if (refresh) {
      fetchData();
    }
  }, [fetchData]);

  // Dialog submit handler (passed to DialogComponent)
  const handleDialogSubmit = useCallback(async (formData) => {
    try {
      let result;
      const isEditing = currentItem && currentItem[idField];
      if (isEditing) {
        result = await entitySDK.update(currentItem[idField], formData);
        toast({ title: t('common.success'), description: toastMessages.updateSuccess(entityName, result) });
      } else {
        result = await entitySDK.create(formData);
        toast({ title: t('common.success'), description: toastMessages.createSuccess(entityName, result) });
      }
      handleDialogClose(true); // Close dialog and refresh
      return result;
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error);
      toast({
        title: t('common.error'),
        description: error.message || `Failed to save ${entityName}.`,
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  }, [currentItem, entitySDK, handleDialogClose, t, toast, entityName, idField, toastMessages]);
  
  const handleToggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((isChecked) => {
    if (isChecked) {
      // Select all items on the current page (or all filtered items if desired)
      const currentPageItemIds = paginatedItems.map(item => item[idField]);
      setSelectedItems(new Set(currentPageItemIds));
    } else {
      setSelectedItems(new Set());
    }
  }, [paginatedItems, idField]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    // Optional: Add a confirmation dialog here
    // if (!window.confirm(t('common.confirmBulkDelete', { count: selectedItems.size, items: entityNamePlural}))) return;

    try {
      // Assuming SDK has a bulkDelete or we loop through deletes
      // For simplicity, looping here. A real SDK might have `entitySDK.bulkDelete(Array.from(selectedItems))`
      // This is NOT efficient for many items.
      setLoading(true); // Indicate loading for bulk operation
      for (const itemId of selectedItems) {
        await entitySDK.delete(itemId);
      }
      toast({ title: t('common.success'), description: toastMessages.bulkDeleteSuccess(selectedItems.size, entityNamePlural) });
      setSelectedItems(new Set());
      setIsSelectionModeActive(false);
      fetchData(); // Refresh
    } catch (err) {
      toast({
        title: t('common.error'),
        description: toastMessages.bulkDeleteError(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedItems, entitySDK, fetchData, t, toast, entityNamePlural, toastMessages]);


  return {
    items: paginatedItems, // Displayed items after pagination
    allItems: items, // All items fetched from server (before client-side processing)
    filteredItemsCount: filteredItems.length, // Count after filtering, before pagination
    loading,
    error,
    searchTerm,
    activeFilters,
    pagination,
    sortConfig,
    isDialogOpen,
    currentItem,
    selectedItems,
    isSelectionModeActive,
    
    fetchData, // Expose to allow manual refresh
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleDialogClose,
    handleDialogSubmit, // Can be passed to the dialog
    DialogComponent, // Pass dialog component to the page for rendering
    
    setSelectedItems,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleBulkDelete,
    entityName,
    entityNamePlural,
  };
}