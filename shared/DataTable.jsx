
import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { cn } from '../utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import EmptyState from '@/components/ui/empty-state';
import LoadingSpinner from '../ui/loading-spinner';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ArrowUpDown } from 'lucide-react';

// Utility function to ensure we always have a valid Set
const ensureSet = (value) => {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set();
};

// Utility function to safely check if an item is selected
const isItemSelected = (selectedIds, itemId) => {
  if (!itemId) return false;
  const safeSet = ensureSet(selectedIds);
  try {
    return safeSet.has(itemId);
  } catch (error) {
    console.warn('Error checking selection:', error);
    return false;
  }
};

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRowClick,
  className = '',
  emptyMessage = '',
  pagination,
  onPageChange,
  onSortChange,
  currentSort,
  entityName,
  onRetry,
  isSelectionModeActive = false,
  selectedRowIds,
  onRowSelectionChange,
  onSelectAllRows,
  customFilterLogic,
  currentFilters = {},
}) {
  const { t, isRTL, language } = useLanguageHook(); // Added language for date formatting

  const defaultEmptyMessage = emptyMessage || t('common.noResultsFound', { item: entityName || t('common.items', { defaultValue: 'items' }), defaultValue: `No ${entityName || 'items'} found.` });
  const errorLoadingMessage = t('common.errorLoading', { item: entityName || t('common.items', { defaultValue: 'items' }), defaultValue: `Error loading ${entityName || 'items'}.` });

  if (loading) {
    return <LoadingSpinner message={t('messages.loadingData', { item: entityName || t('common.data', { defaultValue: 'data' }) })} />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>{typeof error === 'string' ? error : errorLoadingMessage}</p>
        {onRetry && <Button onClick={onRetry} variant="outline" className="mt-2">{t('buttons.retry', { defaultValue: 'Retry' })}</Button>}
      </div>
    );
  }

  // Apply custom client-side filtering if provided
  let filteredData = Array.isArray(data) ? data.filter(Boolean) : [];
  if (customFilterLogic && typeof customFilterLogic === 'function') {
    filteredData = filteredData.filter(item => customFilterLogic(item, currentFilters));
  }

  if (filteredData.length === 0 && !loading && !error) { // Ensure not to show empty state during loading or on error
    return <EmptyState title={defaultEmptyMessage} description={t('common.tryAdjustingFilters', { defaultValue: 'Try adjusting your search or filter criteria.' })} />;
  }
  
  // Always ensure we have a valid Set for selected row IDs
  const safeSelectedRowIds = ensureSet(selectedRowIds);

  const renderCell = (column, item, rowIndex) => {
    try {
      if (!item) return '';

      if (column.cell) {
        // Create a safe row object
        const rowObject = { 
          original: item, 
          index: rowIndex, 
          getIsSelected: () => isItemSelected(safeSelectedRowIds, item?.id)
        };
        return column.cell({ row: rowObject });
      }

      if (column.accessorKey) {
        if (typeof column.accessorKey !== 'string') {
          console.error('Invalid accessorKey:', column.accessorKey);
          return '';
        }

        const keys = column.accessorKey.split('.');
        let value = item;
        for (const key of keys) {
          value = value?.[key];
        }
        
        // Handle date values safely
        if (value && (column.accessorKey.toLowerCase().includes('date') || column.accessorKey.toLowerCase().includes('at'))) {
          try {
            let dateObj;
            if (value instanceof Date) {
                dateObj = value;
            } else if (typeof value === 'string') {
                dateObj = new Date(value); // Basic parsing, consider parseISO if ISO strings are guaranteed
            } else if (typeof value === 'number') {
                dateObj = new Date(value); // Assume timestamp
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
              // Use a simple, robust toLocaleDateString, respecting the app's language
              return dateObj.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } else {
              // console.warn('Invalid date value for accessorKey:', column.accessorKey, value);
            }
          } catch (dateError) {
            console.warn('Date parsing/formatting error in DataTable:', dateError, { value, accessorKey: column.accessorKey });
            return t('common.invalidDate', { defaultValue: 'Invalid Date' });
          }
        }
        
        return value ?? '';
      }

      return '';
    } catch (err) {
      console.error('Error rendering cell:', err, { column, item });
      return `⚠️ ${err.message || 'Render Error'}`; // Provide more error info in the cell
    }
  };

  const handleRowClickInternal = (item) => {
    if (!item) {
      console.warn('Attempted to click null row');
      return;
    }
    if (onRowClick) {
      onRowClick({ original: item });
    }
  };

  const handleHeaderClick = (column) => {
    if (column.enableSorting && onSortChange) {
      const sortField = column.accessorKey || column.id;
      if (!sortField) return;

      const currentSortFieldConfig = currentSort && currentSort.length > 0 ? currentSort[0] : null;
      let newDesc = false;

      if (currentSortFieldConfig && currentSortFieldConfig.id === sortField) {
        newDesc = !currentSortFieldConfig.desc;
      }
      onSortChange([{ id: sortField, desc: newDesc }]);
    }
  };

  const getSortDirectionIndicator = (columnId) => {
    const sortConfig = currentSort && currentSort.find && currentSort.find(s => s.id === columnId);
    if (sortConfig) {
      return sortConfig.desc ? '▼' : '▲';
    }
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  };
  
  // Safe check for all visible items being selected
  const validFilteredData = filteredData.filter(item => item && item.id);
  const isAllVisibleSelected = validFilteredData.length > 0 && validFilteredData.every(item => isItemSelected(safeSelectedRowIds, item.id));

  // Safe handler for row selection
  const handleRowSelection = (itemId, isSelected) => {
    if (!itemId || !onRowSelectionChange) return;
    try {
      onRowSelectionChange(itemId, isSelected);
    } catch (error) {
      console.error('Error in row selection:', error);
    }
  };

  // Safe handler for select all
  const handleSelectAll = () => {
    if (!onSelectAllRows) return;
    try {
      onSelectAllRows();
    } catch (error) {
      console.error('Error in select all:', error);
    }
  };

  // Filter out any potentially undefined columns
  const safeColumns = Array.isArray(columns) ? columns.filter(Boolean) : [];

  return (
    <div className={cn("w-full overflow-auto border rounded-lg dark:border-gray-700", className)}>
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
          <TableRow>
            {isSelectionModeActive && (
              <TableHead className="w-[50px] px-3">
                <Checkbox
                  checked={isAllVisibleSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label={t('bulkActions.selectAllRows', {defaultValue: "Select all rows"})}
                  disabled={validFilteredData.length === 0}
                  className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </TableHead>
            )}
            {safeColumns.map((column, i) => (
              <TableHead
                key={column.id || column.accessorKey || i}
                className={cn(
                  "py-2.5 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  column.headerClassName,
                  column.enableSorting && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50'
                )}
                style={column.style}
                onClick={() => handleHeaderClick(column)}
              >
                <div className="flex items-center gap-1.5">
                  {typeof column.header === 'function' ? column.header() : (column.header || column.accessorKey || '')}
                  {column.enableSorting && getSortDirectionIndicator(column.accessorKey || column.id)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredData.map((item, rowIndex) => {
            const isSelected = isItemSelected(safeSelectedRowIds, item?.id);
            
            return (
              <TableRow
                key={item?.id || rowIndex}
                onClick={() => handleRowClickInternal(item)}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-gray-700/30",
                  onRowClick && "cursor-pointer",
                  isSelected && "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                )}
                data-state={isSelected ? 'selected' : ''}
              >
                {isSelectionModeActive && item?.id && (
                  <TableCell className="px-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelection(item.id, Boolean(checked))}
                      aria-label={t('bulkActions.selectRow', {defaultValue: "Select row"})}
                      className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                )}
                {safeColumns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={cn("py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200", column.cellClassName)}
                  >
                    {renderCell(column, item, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t('dataTable.paginationSummary', {
              start: Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems),
              end: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems),
              total: pagination.totalItems,
              entity: entityName || t('common.items', {defaultValue: 'items'})
            })}
          </span>
          <div className="space-x-1.5 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="text-xs px-2 py-1 h-7"
            >
              {t('buttons.previous', { defaultValue: 'Previous' })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="text-xs px-2 py-1 h-7"
            >
              {t('buttons.next', { defaultValue: 'Next' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
