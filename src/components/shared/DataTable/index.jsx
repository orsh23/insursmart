import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { ArrowUpDown, ChevronDown, ChevronUp, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { useLanguageHook } from '@/components/useLanguageHook';

const DataTable = ({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  pagination, // { currentPage, pageSize, totalItems, totalPages }
  onPageChange,
  currentSort, // { key, direction: 'ascending' | 'descending' } or TanStack Table's array format
  onSortChange,
  entityName = "Items",
  customFilterLogic, // Optional: (item, filters) => boolean
  currentFilters, // Optional: object of current filters for client-side use
  // New props for selection
  isSelectionModeActive = false,
  selectedRowIds = new Set(), // Set of selected item IDs
  onRowSelectionChange, // (itemId: string) => void
  onSelectAllRows, // () => void
}) => {
  const { t, isRTL } = useLanguageHook();
  const [localFilters, setLocalFilters] = useState({}); // For column-level filtering if needed

  const processedData = useMemo(() => {
    if (customFilterLogic && currentFilters && Object.keys(currentFilters).length > 0) {
      return data.filter(item => customFilterLogic(item, currentFilters));
    }
    return data;
  }, [data, customFilterLogic, currentFilters]);

  const handleSort = (columnKey) => {
    if (!onSortChange) return;

    let newDirection = 'ascending';
    let sortKeyToUse = columnKey;

    // Compatibility with TanStack Table sort state (array of objects)
    if (Array.isArray(currentSort) && currentSort.length > 0 && currentSort[0].id === columnKey) {
      newDirection = currentSort[0].desc ? 'ascending' : 'descending';
    } else if (typeof currentSort === 'object' && currentSort?.key === columnKey) {
      newDirection = currentSort.direction === 'ascending' ? 'descending' : 'ascending';
    }
    
    // TanStack Table expects an array like [{ id: 'columnKey', desc: boolean }]
    // Adapt if your onSortChange expects a different format
    onSortChange([{ id: sortKeyToUse, desc: newDirection === 'descending' }]);
  };

  const getSortIndicator = (columnKey) => {
    let isActive = false;
    let isDescending = false;

    if (Array.isArray(currentSort) && currentSort.length > 0 && currentSort[0].id === columnKey) {
      isActive = true;
      isDescending = currentSort[0].desc;
    } else if (typeof currentSort === 'object' && currentSort?.key === columnKey) {
      isActive = true;
      isDescending = currentSort.direction === 'descending';
    }

    if (!isActive) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return isDescending ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronUp className="ml-2 h-4 w-4" />;
  };
  
  const isAllVisibleSelected = useMemo(() => {
    if (!isSelectionModeActive || processedData.length === 0) return false;
    return processedData.every(item => selectedRowIds.has(item.id));
  }, [isSelectionModeActive, processedData, selectedRowIds]);

  const isSomeVisibleSelected = useMemo(() => {
    if (!isSelectionModeActive || processedData.length === 0) return false;
    return processedData.some(item => selectedRowIds.has(item.id)) && !isAllVisibleSelected;
  }, [isSelectionModeActive, processedData, selectedRowIds, isAllVisibleSelected]);


  if (isLoading && (!processedData || processedData.length === 0)) {
    return <LoadingSpinner message={t('messages.loadingData', { item: entityName })} />;
  }

  if (error && (!processedData || processedData.length === 0)) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-600 dark:text-red-400">{t('errors.dataLoadErrorTitle', {defaultValue: "Data Load Error"})}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-4">
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('buttons.retry', {defaultValue: "Retry"})}
          </Button>
        )}
      </div>
    );
  }

  if (!isLoading && processedData.length === 0) {
    return <EmptyState title={t('emptyStates.noEntityDataTitle', { entity: entityName, defaultValue: `No ${entityName} found` })} message={t('emptyStates.noEntityDataMessage', { entity: entityName, defaultValue: `There are no ${entityName} to display.` })} />;
  }

  return (
    <div className="rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Optional: Add table-level filter controls here if needed */}
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
          <TableRow>
            {isSelectionModeActive && (
              <TableHead className="w-[50px] px-3">
                <Checkbox
                  checked={isAllVisibleSelected ? true : (isSomeVisibleSelected ? "indeterminate" : false)}
                  onCheckedChange={onSelectAllRows}
                  aria-label={t('bulkActions.selectAllRows', {defaultValue: "Select all rows"})}
                  disabled={processedData.length === 0}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead 
                key={column.accessorKey || column.id} 
                className={`${column.headerClassName || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50' : ''}`}
                onClick={column.sortable ? () => handleSort(column.accessorKey || column.id) : undefined}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && getSortIndicator(column.accessorKey || column.id)}
                </div>
                {/* TODO: Add column-level filter inputs if needed */}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && processedData.length > 0 && ( // Show spinner overlay if loading new page data
            <TableRow>
              <TableCell colSpan={columns.length + (isSelectionModeActive ? 1 : 0)} className="h-24 text-center">
                <LoadingSpinner message={t('messages.loadingData', { item: entityName })} isOverlay={false}/>
              </TableCell>
            </TableRow>
          )}
          {!isLoading && processedData.map((row) => (
            <TableRow 
              key={row.id} 
              data-state={selectedRowIds.has(row.id) ? "selected" : ""}
              className={`${selectedRowIds.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''} hover:bg-gray-50/50 dark:hover:bg-gray-700/30`}
            >
              {isSelectionModeActive && (
                <TableCell className="px-3">
                  <Checkbox
                    checked={selectedRowIds.has(row.id)}
                    onCheckedChange={() => onRowSelectionChange(row.id)}
                    aria-label={t('bulkActions.selectRowWithId', {id: row.id, defaultValue: `Select row ${row.id}`})}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={column.accessorKey || column.id} className={column.cellClassName || ''}>
                  {column.cell ? column.cell({ row }) : row[column.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-3 px-4 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
             {t('dataTable.paginationSummary', { 
                start: (pagination.currentPage - 1) * pagination.pageSize + 1, 
                end: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems), 
                total: pagination.totalItems,
                entity: entityName.toLowerCase()
             })}
          </div>
          <div className="space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || isLoading}
            >
              {t('buttons.previous', {defaultValue: "Previous"})}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
            >
              {t('buttons.next', {defaultValue: "Next"})}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;