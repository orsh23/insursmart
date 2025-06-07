import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

// Enhanced rate limiting utility
const createRateLimiter = () => {
  const requestCache = new Map();
  const lastRequestTime = new Map();
  
  const withRateLimit = async (entityName, apiCall, retries = 3, baseDelay = 2000) => {
    if (typeof apiCall !== 'function') {
      console.error('[useEntityModule] apiCall is not a function:', apiCall);
      throw new Error('API call must be a function');
    }
    
    const now = Date.now();
    const lastTime = lastRequestTime.get(entityName) || 0;
    const timeSinceLastRequest = now - lastTime;
    
    const minInterval = 1000; 
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const cacheKey = `${entityName}-${apiCall.toString()}`;
    
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }
    
    const executeRequest = async () => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          lastRequestTime.set(entityName, Date.now());
          const result = await apiCall();
          requestCache.delete(cacheKey);
          return result;
        } catch (error) {
          const isRateLimit = error.message?.includes('Rate limit') || 
                             error.response?.status === 429 ||
                             error.message?.includes('rate limit');
          
          if (isRateLimit && attempt < retries) {
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.warn(`Rate limited on ${entityName}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          requestCache.delete(cacheKey);
          throw error;
        }
      }
    };
    
    const promise = executeRequest();
    requestCache.set(cacheKey, promise);
    return promise;
  };
  
  return { withRateLimit };
};

const globalRateLimiter = createRateLimiter();

export function useEntityModule(config) {
  const toastHook = useToast();
  const toast = toastHook?.toast || ((options) => console.warn('Toast not available:', options));

  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  
  const {
    entitySDK,
    entityName = 'Item',
    entityNamePlural = 'Items',
    DialogComponent,
    initialSort = [{ id: 'created_date', desc: true }],
    initialFilters = {},
    searchFields = [],
    filterFunction,
    storageKey = 'entityModule',
  } = config || {};

  // Ensure we always have valid default sort
  const defaultSortConfig = useMemo(() => {
    if (Array.isArray(initialSort) && initialSort.length > 0 && initialSort[0] && typeof initialSort[0].id === 'string') {
        return initialSort.map(s => ({ key: s.id, desc: !!s.desc }));
    }
    return [{ key: 'created_date', desc: true }];
  }, [initialSort]);

  // Initial validation with comprehensive fallbacks
  if (!entitySDK || typeof entitySDK.list !== 'function') {
    console.error(`[useEntityModule] Critical Error for ${entityName}: entitySDK is missing or invalid.`);
    
    // Return stable, working functions with proper function signatures
    const stableNoOp = useCallback(() => {
      console.warn(`useEntityModule (${entityName}) not fully initialized: function called.`);
    }, [entityName]);

    const stableAsyncNoOp = useCallback(async () => {
      console.warn(`useEntityModule (${entityName}) not fully initialized: async operation called.`);
      return { successCount: 0, failCount: 0 };
    }, [entityName]);

    const stableFilterChangeHandler = useCallback((filterKey, filterValue) => {
      console.warn(`useEntityModule (${entityName}) not fully initialized: handleFilterChange called.`);
    }, [entityName]);

    const stableSortChangeHandler = useCallback((newSorts) => {
      console.warn(`useEntityModule (${entityName}) not fully initialized: handleSortChange called.`);
    }, [entityName]);

    const stablePageChangeHandler = useCallback((newPageIndex) => {
      console.warn(`useEntityModule (${entityName}) not fully initialized: handlePageChange called.`);
    }, [entityName]);

    return {
      items: [], 
      rawItems: [], 
      filteredAndSortedItems: [],
      loading: false, 
      error: `Invalid SDK for ${entityName}.`,
      filters: initialFilters, 
      sortConfig: defaultSortConfig, 
      pagination: { 
        currentPage: 1, 
        pageSize: 10, 
        totalCount: 0, 
        totalPages: 1, 
        pageIndex: 0 
      },
      selectedItems: [], 
      setSelectedItems: stableNoOp,
      isSelectionModeActive: false, 
      setIsSelectionModeActive: stableNoOp,
      isDialogOpen: false, 
      setIsDialogOpen: stableNoOp,
      currentItem: null, 
      setCurrentItem: stableNoOp,
      handleRefresh: stableNoOp,
      handleFilterChange: stableFilterChangeHandler,
      handleSortChange: stableSortChangeHandler,
      handlePageChange: stablePageChangeHandler,
      handlePageSizeChange: stablePageChangeHandler,
      handleAddNew: stableNoOp,
      handleEdit: stableNoOp,
      handleBulkDelete: stableAsyncNoOp,
      handleToggleSelection: stableNoOp,
      handleSelectAll: stableNoOp,
      handleSelfSubmittingDialogClose: stableNoOp,
    };
  }

  // State management
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(() => {
    try {
      const savedFilters = loadFromStorage(`${storageKey}_filters`, null);
      return savedFilters ? { ...initialFilters, ...savedFilters } : initialFilters;
    } catch (e) {
      console.warn(`[useEntityModule] Failed to load saved filters for ${storageKey}:`, e);
      return initialFilters;
    }
  });

  const [sortConfig, setSortConfig] = useState(() => {
    try {
      const savedSort = loadFromStorage(`${storageKey}_sort`, null);
      if (Array.isArray(savedSort) && savedSort.length > 0 && savedSort[0] && typeof savedSort[0].key === 'string') {
        return savedSort;
      }
      return defaultSortConfig;
    } catch (e) {
      console.warn(`[useEntityModule] Failed to load saved sort config for ${storageKey}:`, e);
      return defaultSortConfig;
    }
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: (filters && typeof filters.pageSize === 'number') ? filters.pageSize : 10,
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Stable handleRefresh function with better error handling
  const handleRefresh = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current || !entitySDK || typeof entitySDK.list !== 'function') {
      console.warn('[useEntityModule] handleRefresh called but conditions not met');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Prevent multiple simultaneous calls
    if (!forceRefresh && timeSinceLastFetch < 500) {
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      lastFetchRef.current = now;
    }

    try {
      let sortParam = '';
      if (Array.isArray(sortConfig) && sortConfig.length > 0 && sortConfig[0]?.key) {
         sortParam = sortConfig[0].desc ? `-${sortConfig[0].key}` : sortConfig[0].key;
      } else if (Array.isArray(defaultSortConfig) && defaultSortConfig.length > 0 && defaultSortConfig[0]?.key) {
         sortParam = defaultSortConfig[0].desc ? `-${defaultSortConfig[0].key}` : defaultSortConfig[0].key;
      }

      const apiCall = () => entitySDK.list(sortParam, undefined, filters);
      const data = await globalRateLimiter.withRateLimit(entityName, apiCall);

      if (isMountedRef.current) {
        setRawItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error(`Error fetching ${entityNamePlural}:`, err);
      
      const isRateLimitError = err.message?.toLowerCase().includes('rate limit') || err.response?.status === 429;
      
      if (isRateLimitError) {
        setError(new Error('Too many requests. Please wait a moment and try again.'));
      } else {
        let errorMessage = `Failed to fetch ${entityNamePlural}. Please check your connection.`;
        if (err?.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = String(err);
        }
        setError(new Error(errorMessage));
      }
      setRawItems([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    entitySDK, 
    entityName, 
    entityNamePlural, 
    sortConfig, 
    defaultSortConfig, 
    filters
  ]);

  // Filtered and sorted items with better error handling
  const filteredAndSortedItems = useMemo(() => {
    let itemsToProcess = Array.isArray(rawItems) ? rawItems : [];

    if (typeof filterFunction === 'function') {
      try {
        const currentFilters = (typeof filters === 'object' && filters !== null) ? filters : {};
        itemsToProcess = itemsToProcess.filter(item => {
          if (item === undefined || item === null) {
            console.warn('[useEntityModule] Undefined or null item encountered during filtering.');
            return false;
          }
          try {
            return filterFunction(item, currentFilters);
          } catch (innerFilterError) {
            console.error('[useEntityModule] Error inside provided filterFunction for item:', item, innerFilterError);
            return true;
          }
        });
      } catch (filterError) {
        console.error('[useEntityModule] Error in filtering logic:', filterError);
      }
    }
    return itemsToProcess;
  }, [rawItems, filters, filterFunction]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, pagination.pageIndex, pagination.pageSize]);

  // Update pagination totals
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: filteredAndSortedItems.length,
      totalPages: Math.max(1, Math.ceil(filteredAndSortedItems.length / prev.pageSize))
    }));
  }, [filteredAndSortedItems.length, pagination.pageSize]);

  // Stable handler functions with better error handling
  const handleFilterChange = useCallback((filterKey, filterValue) => {
    try {
      if (filterKey === null || filterKey === undefined) {
        setFilters(filterValue || initialFilters);
        saveToStorage(`${storageKey}_filters`, filterValue || initialFilters);
      } else {
        const newFilters = { ...filters, [filterKey]: filterValue };
        setFilters(newFilters);
        saveToStorage(`${storageKey}_filters`, newFilters);
      }
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    } catch (error) {
      console.error('[useEntityModule] Error in handleFilterChange:', error);
    }
  }, [filters, initialFilters, storageKey]);

  const handleSortChange = useCallback((newSorts) => {
    try {
      const formattedSorts = Array.isArray(newSorts)
        ? newSorts.map(s => ({ key: s.id || s.key || '', desc: !!s.desc }))
        : [];

      setSortConfig(formattedSorts);
      saveToStorage(`${storageKey}_sort`, formattedSorts);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    } catch (error) {
      console.error('[useEntityModule] Error in handleSortChange:', error);
    }
  }, [storageKey]);

  const handlePageChange = useCallback((newPageIndex) => {
    try {
      setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));
    } catch (error) {
      console.error('[useEntityModule] Error in handlePageChange:', error);
    }
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    try {
      setPagination(prev => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }));
    } catch (error) {
      console.error('[useEntityModule] Error in handlePageSizeChange:', error);
    }
  }, []);

  const handleAddNew = useCallback(() => {
    try {
      setCurrentItem(null);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('[useEntityModule] Error in handleAddNew:', error);
    }
  }, []);

  const handleEdit = useCallback((item) => {
    try {
      setCurrentItem(item);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('[useEntityModule] Error in handleEdit:', error);
    }
  }, []);

  const handleBulkDelete = useCallback(async (itemIds) => {
    if (!Array.isArray(itemIds) || itemIds.length === 0 || !entitySDK || typeof entitySDK.delete !== 'function') {
      return { successCount: 0, failCount: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (const itemId of itemIds) {
      try {
        await entitySDK.delete(itemId);
        successCount++;
      } catch (error) {
        console.error(`[useEntityModule] Failed to delete item ${itemId}:`, error);
        failCount++;
      }
    }
    
    // Refresh data after bulk delete
    if (typeof handleRefresh === 'function') {
      handleRefresh(true);
    }
    
    return { successCount, failCount };
  }, [entitySDK, handleRefresh]);

  const handleToggleSelection = useCallback((itemId) => {
    try {
      setSelectedItems(prev => {
        if (prev.includes(itemId)) {
          return prev.filter(id => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    } catch (error) {
      console.error('[useEntityModule] Error in handleToggleSelection:', error);
    }
  }, []);

  const handleSelectAll = useCallback((itemIdsToSelectOrDeselect, shouldSelect) => {
    try {
      if (Array.isArray(itemIdsToSelectOrDeselect)) {
          if (shouldSelect) {
              setSelectedItems(prev => [...new Set([...prev, ...itemIdsToSelectOrDeselect])]);
          } else {
              setSelectedItems(prev => prev.filter(id => !itemIdsToSelectOrDeselect.includes(id)));
          }
      } else {
          const allVisibleIds = paginatedItems.map(item => item.id).filter(Boolean);
          const allCurrentlyVisibleSelected = allVisibleIds.every(id => selectedItems.includes(id));
          if (allCurrentlyVisibleSelected) {
              setSelectedItems(prev => prev.filter(id => !allVisibleIds.includes(id)));
          } else {
              setSelectedItems(prev => [...new Set([...prev, ...allVisibleIds])]);
          }
      }
    } catch (error) {
      console.error('[useEntityModule] Error in handleSelectAll:', error);
    }
  }, [paginatedItems, selectedItems]);

  const handleSelfSubmittingDialogClose = useCallback((refreshNeeded, actionType, itemName) => {
    try {
      setIsDialogOpen(false);
      setCurrentItem(null);
      
      setSelectedItems([]);
      setIsSelectionModeActive(false);
      
      if (refreshNeeded && typeof handleRefresh === 'function') {
        handleRefresh(true);
        if (toast && actionType && itemName) {
            const successMessages = {
              create: `Successfully created ${itemName}.`,
              update: `Successfully updated ${itemName}.`,
              delete: `Successfully deleted ${itemName}.`,
            };
            toast({
              title: 'Success',
              description: successMessages[actionType] || 'Action completed successfully.',
            });
          }
      }
    } catch (error) {
      console.error('[useEntityModule] Error in handleSelfSubmittingDialogClose:', error);
    }
  }, [handleRefresh, toast]);

  // Initial data load
  useEffect(() => {
    if (typeof handleRefresh === 'function') {
      handleRefresh();
    }
  }, [handleRefresh]);

  return {
    items: paginatedItems,
    rawItems,
    filteredAndSortedItems,
    
    loading,
    error,
    filters,
    sortConfig,
    pagination: {
      ...pagination,
      currentPage: pagination.pageIndex + 1,
      totalPages: Math.ceil(filteredAndSortedItems.length / pagination.pageSize) || 1,
      totalCount: filteredAndSortedItems.length,
    },
    
    selectedItems,
    setSelectedItems,
    isSelectionModeActive,
    setIsSelectionModeActive,
    
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
    handleBulkDelete,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  };
}

export default useEntityModule;