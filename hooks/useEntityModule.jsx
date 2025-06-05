
import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

export default function useEntityModule(entityConfig) {
  // Initial validation
  if (!entityConfig || !entityConfig.entitySDK) {
    console.error('[useEntityModule] Critical Error: entityConfig or entitySDK is missing. entityConfig:', entityConfig);
    // Return a fully-formed object with no-op functions to prevent downstream errors
    return {
      items: [], rawItems: [], filteredAndSortedItems: [],
      loading: false, error: 'Invalid entity configuration provided to useEntityModule.',
      filters: {}, setFilters: () => console.warn("useEntityModule not initialized: setFilters called."),
      sortConfig: { key: '', direction: 'ascending' }, setSortConfig: () => console.warn("useEntityModule not initialized: setSortConfig called."),
      pagination: { pageIndex: 0, pageSize: 10, totalItems: 0, totalPages: 0 },
      handleRefresh: () => console.warn("useEntityModule not initialized: handleRefresh called."),
      handleSearch: () => console.warn("useEntityModule not initialized: handleSearch called."),
      handleFilterChange: () => console.warn("useEntityModule not initialized: handleFilterChange called."),
      handleSortChange: () => console.warn("useEntityModule not initialized: handleSortChange called."),
      handlePageChange: () => console.warn("useEntityModule not initialized: handlePageChange called."),
      handlePageSizeChange: () => console.warn("useEntityModule not initialized: handlePageSizeChange called."),
    };
  }

  const {
    entitySDK,
    entityName = 'Item',
    entityNamePlural = 'Items',
    initialFilters = {},
    filterFunction,
    storageKey = 'entityModule',
    defaultSort = { key: 'updated_date', direction: 'descending' },
  } = entityConfig;

  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
      return savedSort || defaultSort;
    } catch (e) {
      console.warn(`[useEntityModule] Failed to load saved sort config for ${storageKey}:`, e);
      return defaultSort;
    }
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: (filters && typeof filters.pageSize === 'number') ? filters.pageSize : 10,
  });

  const fetchData = useCallback(async () => {
    if (!entitySDK || typeof entitySDK.list !== 'function') {
      console.error('[useEntityModule] Critical Error: entitySDK.list is not a function. entitySDK:', entitySDK);
      setError(`Invalid entity SDK for ${entityNamePlural}. Cannot fetch data.`);
      setLoading(false);
      setRawItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let sortParam = '';
      if (sortConfig && sortConfig.key) {
        sortParam = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      }
      
      const data = await entitySDK.list(sortParam || (defaultSort.direction === 'descending' ? `-${defaultSort.key}` : defaultSort.key));
      setRawItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`[useEntityModule] Error fetching ${entityNamePlural}:`, err);
      setError(err.message || `Failed to fetch ${entityNamePlural}`);
      setRawItems([]); // Ensure rawItems is an array on error
    } finally {
      setLoading(false);
    }
  }, [entitySDK, entityNamePlural, sortConfig, defaultSort.key, defaultSort.direction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate filteredAndSortedItems
  const internalFilteredAndSortedItems = useMemo(() => {
    let itemsToProcess = Array.isArray(rawItems) ? rawItems : [];

    if (typeof filterFunction === 'function') {
      try {
        console.log(`[useEntityModule] Filtering ${entityNamePlural}. Raw items count: ${itemsToProcess.length}`);
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
            return true; // Decide how to handle items that cause filter errors (include or exclude)
          }
        });
      } catch (err) {
        console.error(`[useEntityModule] Error applying filterFunction for ${entityNamePlural}:`, err);
        // itemsToProcess remains as is or could be set to empty array if filtering is critical
      }
    } else if (filterFunction !== undefined) { // It's defined but not a function
        console.warn(`[useEntityModule] filterFunction for ${entityNamePlural} was provided but is not a function. Type: ${typeof filterFunction}`);
    }


    if (sortConfig && sortConfig.key) {
      try {
        itemsToProcess = [...itemsToProcess].sort((a, b) => {
          // Handle cases where a or b or their sort key might be undefined/null
          const aVal = a ? a[sortConfig.key] : undefined;
          const bVal = b ? b[sortConfig.key] : undefined;

          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sortConfig.direction === 'ascending' ? 1 : -1; // nulls/undefined last in ascending
          if (bVal == null) return sortConfig.direction === 'ascending' ? -1 : 1; // nulls/undefined last in ascending

          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else if (aVal instanceof Date && bVal instanceof Date) {
            comparison = aVal.getTime() - bVal.getTime();
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else { // Mixed types or other types, convert to string for basic comparison
            comparison = String(aVal).localeCompare(String(bVal));
          }
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
      } catch (err) {
        console.error(`[useEntityModule] Error during sorting for ${entityNamePlural}:`, err);
      }
    }
    return itemsToProcess;
  }, [rawItems, filters, sortConfig, filterFunction, entityNamePlural]);
  
  // Ensure filteredAndSortedItems is always an array
  const filteredAndSortedItems = Array.isArray(internalFilteredAndSortedItems) ? internalFilteredAndSortedItems : [];

  const items = useMemo(() => {
    // Uses the guaranteed 'filteredAndSortedItems'
    const startIndex = pagination.pageIndex * pagination.pageSize;
    return filteredAndSortedItems.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredAndSortedItems, pagination]);

  useEffect(() => {
    try {
      saveToStorage(`${storageKey}_filters`, filters);
    } catch (e) {
      console.warn(`[useEntityModule] Failed to save filters for ${storageKey}:`, e);
    }
  }, [filters, storageKey]);

  useEffect(() => {
    try {
      saveToStorage(`${storageKey}_sort`, sortConfig);
    } catch (e) {
      console.warn(`[useEntityModule] Failed to save sort config for ${storageKey}:`, e);
    }
  }, [sortConfig, storageKey]);

  const handleRefresh = useCallback(() => fetchData(), [fetchData]);

  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, searchTerm, page: 1 })); // Reset to page 1 on search
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    const updateFilters = (prev) => {
        if (typeof newFilters === 'function') return { ...newFilters(prev), page: 1 };
        return { ...prev, ...newFilters, page: 1 };
    };
    setFilters(updateFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSortChange = useCallback((newSortConfig) => {
    if (typeof newSortConfig === 'function') setSortConfig(newSortConfig);
    else setSortConfig(newSortConfig);
  }, []);

  const handlePageChange = useCallback((newPageIndex) => {
    setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }));
    setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 })); // also update filters if page size is there
  }, []);

  return {
    items, 
    rawItems, 
    filteredAndSortedItems,
    loading, 
    error,
    filters, 
    setFilters,
    sortConfig, 
    setSortConfig,
    pagination: {
      ...pagination,
      totalItems: filteredAndSortedItems.length,
      totalPages: Math.ceil(filteredAndSortedItems.length / pagination.pageSize) || 1, // Ensure totalPages is at least 1
      currentPage: pagination.pageIndex + 1, // Add currentPage for compatibility
      totalCount: filteredAndSortedItems.length, // Add totalCount for compatibility
    },
    handleRefresh, 
    handleSearch, 
    handleFilterChange, 
    handleSortChange, 
    handlePageChange, 
    handlePageSizeChange,
  };
}

// Named export for compatibility
export { useEntityModule };
