import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading-spinner";
import EmptyState from "@/components/ui/empty-state";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  pagination,
  onSortChange,
  currentSort = [],
  isSelectionModeActive = false,
  selectedRowIds = new Set(),
  onRowSelectionChange,
  onSelectAllRows,
  onRowClick,
  entityName = "items",
  emptyMessage = "No data available",
  t = (key, options = {}) => options.defaultValue || key,
  language = "en",
  isRTL = false
}) {
  if (loading && (!data || data.length === 0)) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error.message || error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No Data" message={emptyMessage} />;
  }

  const handleSort = (columnId) => {
    if (!onSortChange) return;
    
    const currentSortItem = currentSort.find(s => s.id === columnId);
    const isDesc = currentSortItem?.desc || false;
    
    onSortChange([{ id: columnId, desc: !isDesc }]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectionModeActive && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && data.every(item => selectedRowIds.has(item.id))}
                    onCheckedChange={onSelectAllRows}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.accessorKey}
                  className={column.enableSorting ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.enableSorting && (
                      <span className="text-xs opacity-50">↕</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={row.id || index}
                className={`${onRowClick && !isSelectionModeActive ? 'cursor-pointer hover:bg-muted/50' : ''} ${
                  selectedRowIds.has(row.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (isSelectionModeActive && onRowSelectionChange) {
                    onRowSelectionChange(row.id);
                  } else if (onRowClick && !isSelectionModeActive) {
                    onRowClick({ original: row });
                  }
                }}
              >
                {isSelectionModeActive && (
                  <TableCell>
                    <Checkbox
                      checked={selectedRowIds.has(row.id)}
                      onCheckedChange={() => onRowSelectionChange?.(row.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('dataTable.showing')} {((pagination.currentPage - 1) * pagination.pageSize) + 1} {t('dataTable.to')} {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} {t('dataTable.of')} {pagination.totalItems} {entityName}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {t('dataTable.page')} {pagination.currentPage} {t('dataTable.of')} {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export both named and default
export { DataTable };
export default DataTable;