
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ImportHistory } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
import DataTable from '@/components/shared/DataTable';
import ImportHistoryFilterBar from './ImportHistoryFilterBar';
import ImportDetailsDialog from './ImportDetailsDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import GlobalActionButton from '@/components/shared/GlobalActionButton';
import ViewSwitcher from '@/components/shared/ViewSwitcher';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { loadFromStorage, saveToStorage } from '@/lib/utils';

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
    setFilters, // Keep for direct manipulation if needed, but prefer handlers
    sortConfig,
    setSortConfig, // Keep for direct manipulation if needed, but prefer handlers
    pagination,
    setPagination, // Keep for direct manipulation if needed, but prefer handlers
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshImportHistory,
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('importHistoryView_viewPreference', 'table'));

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage('importHistoryView_viewPreference', passedView);
    }
  }, [passedView, currentView]);

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
      sortable: true
    },
    {
      accessorKey: 'module',
      header: t('fields.module', {defaultValue: 'Module'}),
      sortable: true
    },
    {
      accessorKey: 'total_records',
      header: t('fields.totalRecords', {defaultValue: 'Total Records'}),
      sortable: true
    },
    {
      accessorKey: 'inserted_records',
      header: t('fields.insertedRecords', {defaultValue: 'Inserted'}),
      sortable: true
    },
    {
      accessorKey: 'failed_records',
      header: t('fields.failedRecords', {defaultValue: 'Failed'}),
      sortable: true
    },
    {
      accessorKey: 'status',
      header: t('fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status)}>
          {t(`importStatus.${row.original.status}`, {defaultValue: row.original.status})}
        </Badge>
      ),
      sortable: true
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
      sortable: true
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(row.original)}>
            {t('buttons.viewDetails', {defaultValue: 'View Details'})}
          </Button>
          {/* Delete button removed as module is configured as read-only */}
        </div>
      ),
    },
  ], [t, handleViewDetails]);

  const renderContent = useCallback(() => {
    if (error) {
      return <ErrorDisplay message={error.message || t('common.errorLoadingData')} onRetry={refreshImportHistory} />;
    }

    if (loading) {
      return <LoadingSpinner />;
    }

    // Currently only table view is supported for ImportHistory
    return (
      <DataTable
        columns={columns}
        data={importHistory}
        loading={loading}
        error={error}
        onRetry={refreshImportHistory}
        entityName={t('importHistory.titlePlural', {defaultValue: 'Import History'})}
        filters={filters}
        onFilterChange={handleFilterChange} // For filter changes originating from DataTable itself
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearch={handleSearch} // For a search bar within DataTable
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems} // For selection management within DataTable
        isSelectionModeActive={isSelectionModeActive}
        handleToggleSelection={handleToggleSelection}
        handleSelectAll={handleSelectAll}
      />
    );
  }, [
    columns, importHistory, loading, error, refreshImportHistory, t,
    filters, handleFilterChange, sortConfig, handleSortChange, pagination,
    handlePageChange, handlePageSizeChange, handleSearch,
    selectedItems, setSelectedItems, isSelectionModeActive, handleToggleSelection, handleSelectAll
  ]);


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <History className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('pageTitles.importHistory')} ({importHistory.length || 0})
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
                {t('buttons.refresh', {defaultValue: 'Refresh'})}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => { setCurrentView(view); saveToStorage('importHistoryView_viewPreference', view); }}
              showCards={false} // Assuming no card view for import history
            />
        </div>
      </div>
      <ImportHistoryFilterBar
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />
      {renderContent()}
      {isDialogOpen && (
        <ImportDetailsDialog
          open={isDialogOpen}
          onOpenChange={handleSelfSubmittingDialogClose}
          importData={currentItem}
        />
      )}
    </div>
  );
}
