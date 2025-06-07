
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ImportHistory } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table'; 
import ImportHistoryFilterBar from './ImportHistoryFilterBar';
import ImportDetailsDialog from './ImportDetailsDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Added missing RefreshCw import
import { History, RefreshCw } from 'lucide-react';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage'; // Corrected import path for storage utils

export default function ImportHistoryTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: ImportHistory,
    entityNameSingular: t('importHistory.entityNameSingular', {defaultValue: 'Import Record'}),
    entityNamePlural: t('importHistory.titlePlural', {defaultValue: 'Import History'}),
    DialogComponent: ImportDetailsDialog, // For viewing details, not editing
    FormComponent: null, // No form for creating/editing history entries directly
    initialFilters: {
      searchTerm: '', // For file_name
      module: 'all',
      status: 'all',
      date_range: { from: null, to: null }, // For created_date
      page: 1,
      pageSize: 10,
    },
    filterFunction: (item, filters) => {
        const { searchTerm, module, status, date_range } = filters;

        // Search term
        if (searchTerm && !item.file_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Module filter
        if (module && module !== 'all' && item.module !== module) {
          return false;
        }

        // Status filter
        if (status && status !== 'all' && item.status !== status) {
          return false;
        }

        // Date range filter
        if (date_range?.from || date_range?.to) {
          const itemDate = new Date(item.created_date);
          // Ensure itemDate is valid before comparison
          if (isNaN(itemDate.getTime())) {
            return false;
          }

          if (date_range.from && itemDate < new Date(date_range.from)) {
            return false;
          }
          if (date_range.to && itemDate > new Date(date_range.to)) {
            return false;
          }
        }
        return true;
    },
    storageKey: 'importHistoryView',
    readOnly: true, // Indicate that this module is read-only
  }), [t]);

  const {
    items: importHistory,
    loading,
    error,
    filters,
    // setFilters, // Not directly used, prefer handlers
    sortConfig,
    // setSortConfig, // Not directly used, prefer handlers
    pagination,
    // setPagination, // Not directly used, prefer handlers
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshImportHistory,
    handleSearch, // Used if DataTable has internal search
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig) || { // Added fallback for destructuring
    items: [], loading: false, error: null, filters: entityConfig.initialFilters,
    sortConfig: entityConfig.initialSort, pagination: { pageIndex: 0, pageSize: 10, totalItems: 0, totalPages: 1},
    selectedItems: [], setSelectedItems: () => {},
    isDialogOpen: false, setIsDialogOpen: () => {},
    currentItem: null, setCurrentItem: () => {},
    handleRefresh: () => {}, handleSearch: () => {}, handleFilterChange: () => {},
    handleSortChange: () => {}, handlePageChange: () => {}, handlePageSizeChange: () => {},
    isSelectionModeActive: false, setIsSelectionModeActive: () => {},
    handleToggleSelection: () => {}, handleSelectAll: () => {}, handleSelfSubmittingDialogClose: () => {}
  };

  const [currentViewLocal, setCurrentViewLocal] = useState(passedView || loadFromStorage('importHistoryView_viewPreference', 'table'));

  useEffect(() => {
    if (passedView && passedView !== currentViewLocal) {
      setCurrentViewLocal(passedView);
      saveToStorage('importHistoryView_viewPreference', passedView);
    }
  }, [passedView, currentViewLocal]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    ...(externalActionsConfig || [])
  ], [externalActionsConfig]);

  const handleViewDetails = useCallback((item) => {
    setCurrentItem(item);
    setIsDialogOpen(true); // This will open the ImportDetailsDialog
  }, [setCurrentItem, setIsDialogOpen]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'file_name',
      header: t('fields.fileName', {defaultValue: 'File Name'}),
      enableSorting: true // Ensure sorting is enabled
    },
    {
      accessorKey: 'module',
      header: t('fields.module', {defaultValue: 'Module'}),
      enableSorting: true
    },
    {
      accessorKey: 'total_records',
      header: t('fields.totalRecords', {defaultValue: 'Total Records'}),
      enableSorting: true
    },
    {
      accessorKey: 'inserted_records',
      header: t('fields.insertedRecords', {defaultValue: 'Inserted'}),
      enableSorting: true
    },
    {
      accessorKey: 'failed_records',
      header: t('fields.failedRecords', {defaultValue: 'Failed'}),
      enableSorting: true
    },
    {
      accessorKey: 'status',
      header: t('fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status)}>
          {t(`importStatus.${row.original.status}`, {defaultValue: row.original.status})}
        </Badge>
      ),
      enableSorting: true
    },
    {
      accessorKey: 'created_date',
      header: t('fields.importDate', {defaultValue: 'Import Date'}),
      cell: ({ row }) => {
        try {
          if (!row.original.created_date) return '-';
          const date = new Date(row.original.created_date);
          if (isNaN(date.getTime())) return 'Invalid Date';
          return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (error) {
          console.warn('Date formatting error:', error);
          return 'Invalid Date';
        }
      },
      enableSorting: true
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(row.original)}>
            {t('buttons.viewDetails', {defaultValue: 'View Details'})}
          </Button>
        </div>
      ),
    },
  ], [t, handleViewDetails]); // Removed language as it's covered by `t`'s context

  const renderContent = useCallback(() => {
    if (error) {
      return <ErrorDisplay message={error.message || t('common.errorLoadingData')} onRetry={refreshImportHistory} />;
    }

    if (loading && (!importHistory || importHistory.length === 0)) { // Show spinner only if no data yet
      return <LoadingSpinner />;
    }

    // Ensure all required DataTable props are valid functions
    const dtSortConfig = Array.isArray(sortConfig) ? sortConfig : [];
    const dtPagination = typeof pagination === 'object' && pagination !== null ? pagination : { pageIndex: 0, pageSize: 10, totalItems: 0, totalPages: 1 };


    return (
      <DataTable
        columns={columns}
        data={importHistory || []} // Ensure data is always an array
        loading={loading}
        error={error} // DataTable handles its own error display if data is empty
        onRetry={typeof refreshImportHistory === 'function' ? refreshImportHistory : () => {}}
        entityName={t('importHistory.titlePlural', {defaultValue: 'Import History'})}
        filters={filters} // This filters object is from useEntityModule, for external filter components
        onFilterChange={typeof handleFilterChange === 'function' ? handleFilterChange : () => {}}
        currentSort={dtSortConfig}
        onSortChange={typeof handleSortChange === 'function' ? handleSortChange : () => {}}
        pagination={{
            currentPage: dtPagination.currentPage || dtPagination.pageIndex + 1,
            pageSize: dtPagination.pageSize,
            totalItems: dtPagination.totalCount || dtPagination.totalItems || 0,
            totalPages: dtPagination.totalPages || 1,
            onPageChange: typeof handlePageChange === 'function' ? handlePageChange : () => {},
            onPageSizeChange: typeof handlePageSizeChange === 'function' ? handlePageSizeChange : () => {},
        }}
        onSearch={typeof handleSearch === 'function' ? handleSearch : undefined} // Pass if DataTable uses it
        selectedRowIds={new Set(selectedItems)} // DataTable might expect selectedRowIds
        onRowSelectionChange={typeof handleToggleSelection === 'function' ? (id, checked) => handleToggleSelection(id) : undefined}
        onSelectAllRows={typeof handleSelectAll === 'function' ? (shouldSelect) => handleSelectAll(null, shouldSelect) : undefined}
        isSelectionModeActive={isSelectionModeActive}
        t={t}
        isRTL={isRTL}
      />
    );
  }, [
    columns, importHistory, loading, error, refreshImportHistory, t, isRTL,
    filters, handleFilterChange, sortConfig, handleSortChange, pagination,
    handlePageChange, handlePageSizeChange, handleSearch,
    selectedItems, isSelectionModeActive, handleToggleSelection, handleSelectAll
  ]);


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <History className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('pageTitles.importHistory')} ({pagination?.totalCount || importHistory?.length || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('importHistory.entityNameSingular', {defaultValue: 'Import Record'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={refreshImportHistory} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1' } ${loading ? 'animate-spin' : ''}`} />
                {t('buttons.refresh', {defaultValue: 'Refresh'})}
            </Button>
            <ViewSwitcher
              currentView={currentViewLocal}
              onViewChange={(view) => { setCurrentViewLocal(view); saveToStorage('importHistoryView_viewPreference', view); }}
              availableViews={['table']} // Only table view for import history
              t={t} isRTL={isRTL}
            />
        </div>
      </div>
      <ImportHistoryFilterBar
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />
      {renderContent()}
      {isDialogOpen && currentItem && ( // Ensure currentItem is not null
        <ImportDetailsDialog
          open={isDialogOpen}
          onOpenChange={handleSelfSubmittingDialogClose} // This already handles setting dialog to false
          importData={currentItem}
          t={t}
          language={language}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}
