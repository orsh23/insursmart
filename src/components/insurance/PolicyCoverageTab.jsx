
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, RefreshCw, AlertTriangle, CheckCircle2, ShieldHalf, SearchX } from 'lucide-react';
import { PolicyCoverage } from '@/api/entities';
import PolicyCoverageDialog from './PolicyCoverageDialog'; // Dialog for Add/Edit
import PolicyCoverageCard from './PolicyCoverageCard'; // Card view component
// import PolicyCoverageFilterBar from './PolicyCoverageFilterBar'; // Filter bar component (if needed)
import { useToast } from "@/components/ui/use-toast";
import { useEntityModule } from '@/components/hooks/useEntityModule'; // Corrected path
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { InsurancePolicy } from '@/api/entities'; // For policy number
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { DataTable } from '@/components/ui/data-table';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import { formatSafeDateDistance } from '@/components/utils/i18n-utils';
import ErrorDisplay from '@/components/common/ErrorDisplay'; // Assuming ErrorDisplay is in common

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Filters are less common for a typically singleton-per-policy coverage entity.
// Sorting might be by policy ID or update date if multiple coverages were listed (unlikely for this entity structure).
const sortOptionsConfig = (t) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'policy_id', label: t('sortOptions.policy', { defaultValue: 'Policy' }) },
    // Add more if applicable, e.g., by a summary field like 'totalCoverageAmount' if it existed
];

export default function PolicyCoverageTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);
  const [policies, setPolicies] = useState([]); // For policy number mapping

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const policyData = await InsurancePolicy.list();
        setPolicies(Array.isArray(policyData) ? policyData : []);
      } catch (err) {
        console.error("Failed to fetch policies for Coverage tab:", err);
        // Non-critical for display if policy_id is known
      }
    };
    fetchPolicies();
  }, []);


  const entityConfig = useMemo(() => ({
    entitySDK: PolicyCoverage,
    entityName: t('policyCoverage.entityNameSingular', { defaultValue: 'Policy Coverage' }),
    entityNamePlural: t('policyCoverage.titleMultiple', { defaultValue: 'Policy Coverages' }),
    DialogComponent: PolicyCoverageDialog,
    initialSort: [{ id: 'updated_date', desc: true }], // Usually few items, sort by update
    initialFilters: {
      searchTerm: '', // Policy ID or a coverage detail
      // More specific filters can be added if there's a large list of coverages (e.g., filter by has_dental: true)
    },
    searchFields: ['policy_id'], // Primarily search by policy ID
    filterFunction: (item, filters) => { // Basic filter for policy ID
        const term = filters.searchTerm?.toLowerCase();
        if (term && item.policy_id) {
            const policy = policies.find(p => p.id === item.policy_id);
            const policyNumber = policy ? (policy.policy_number || '').toLowerCase() : '';
            if (!((item.policy_id || '').toLowerCase().includes(term) || policyNumber.includes(term))) return false;
        }
        // Add more specific filters here if needed, e.g.
        // if (filters.hasDental !== 'all' && String(item.has_dental) !== String(filters.hasDental)) return false;
        return true;
    },
    storageKey: 'policyCoveragesView',
  }), [t, policies]);

  const {
    items: policyCoverages, // paginated items
    loading, error, filters, 
    sortConfig, pagination, 
    selectedItems, setSelectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshPolicyCoverages,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // All items after filtering and sorting
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));
  
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const resetFiltersAndSort = useCallback(() => {
    handleFilterChange(null, entityConfig.initialFilters);
    handleSortChange(entityConfig.initialSort);
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, setIsSelectionModeActive, setSelectedItems]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(item => item.id === selectedItems[0]) || policyCoverages.find(item => item.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit')}), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, policyCoverages, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural }))) {
        handleBulkDelete(selectedItems);
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete')}), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);
  
  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'policyCoverage.addNewCoverage', defaultLabel: 'Add Policy Coverage', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const handleDialogCloseWrapper = useCallback((refreshNeeded, actionType = null, entityName = '') => {
    handleSelfSubmittingDialogClose(refreshNeeded, actionType, entityName);
  }, [handleSelfSubmittingDialogClose]);

  const policyCoverageTableColumns = useMemo(() => [
    { 
      accessorKey: 'policy_id', 
      header: t('policyCoverage.fields.policy'), 
      enableSorting: true,
      cell: ({row}) => {
          const policy = policies.find(p => p.id === row.original.policy_id);
          return policy ? policy.policy_number : row.original.policy_id || t('common.notSet');
      }
    },
    { 
      accessorKey: 'annual_deductible', 
      header: t('policyCoverage.fields.annualDeductible'), 
      cell: ({ row }) => row.original.annual_deductible != null ? `${row.original.annual_deductible.toLocaleString()}` : t('common.notSet'), // Add currency if applicable
      enableSorting: true 
    },
    { 
      accessorKey: 'copay_percentage', 
      header: t('policyCoverage.fields.copayPercentage'),
      cell: ({ row }) => row.original.copay_percentage != null ? `${row.original.copay_percentage}%` : t('common.notSet'),
      enableSorting: true
    },
    { 
      accessorKey: 'out_of_pocket_max', 
      header: t('policyCoverage.fields.outOfPocketMax'),
      cell: ({ row }) => row.original.out_of_pocket_max != null ? `${row.original.out_of_pocket_max.toLocaleString()}` : t('common.notSet'),
      enableSorting: true
    },
    { 
      accessorKey: 'updated_date', 
      header: t('fields.lastUpdated'),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true
    },
  ], [t, language, policies]);
  
  const currentSortOptionValue = useMemo(() => {
    if (!sortConfig || sortConfig.length === 0) return `-${entityConfig.initialSort[0].id}`;
    const currentSort = sortConfig[0];
    return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
  }, [sortConfig, entityConfig.initialSort]);

  const handleSortFilterChange = (value) => {
    const isDesc = value.startsWith('-');
    const field = isDesc ? value.substring(1) : value;
    handleSortChange([{ id: field, desc: isDesc }]);
  };


  const renderContent = () => {
    if (loading && policyCoverages.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    if (error && policyCoverages.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshPolicyCoverages} t={t} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => !val || val === 'all');

    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={ShieldHalf}
              title={t('policyCoverage.emptyState.noCoveragesTitle', { defaultValue: 'No Policy Coverages Defined' })}
              description={t('policyCoverage.emptyState.noCoveragesDesc', { defaultValue: 'Start by adding a new policy coverage to define rules and conditions.' })}
              actionButton={<Button onClick={() => handleAddNew()} className="bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"><Plus className="mr-2 h-4 w-4" />{t('policyCoverage.addNewCoverage', { defaultValue: 'Add Policy Coverage' })}</Button>}
              t={t} isRTL={isRTL}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX} // Keep SearchX for no results after filter
              title={t('policyCoverage.emptyState.noCoveragesMatchTitle', { defaultValue: 'No Matching Policy Coverages' })}
              description={t('policyCoverage.emptyState.noCoveragesMatchDesc', { defaultValue: 'Try adjusting your filters or search terms.' })}
              t={t} isRTL={isRTL}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policyCoverages.map(coverage => (
                <PolicyCoverageCard 
                  key={coverage.id} 
                  coverage={coverage} 
                  onEdit={() => handleEdit(coverage)} 
                  language={language}
                  policyNumber={(policies.find(p => p.id === coverage.policy_id))?.policy_number || coverage.policy_id}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(coverage.id)}
                  onToggleSelection={() => handleToggleSelection(coverage.id)}
                  t={t} isRTL={isRTL}
                />
              ))}
            </div>
          )}
           {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1 })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}>
                {t('buttons.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          )}
        </>
      );
    }
    
    if (currentView === 'table') {
        return (
            <DataTable
                columns={policyCoverageTableColumns}
                data={policyCoverages} // paginatedItems
                loading={loading}
                error={error ? error.message : null}
                onRetry={refreshPolicyCoverages}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('policyCoverage.emptyState.noCoveragesDesc', { defaultValue: 'No Policy Coverages Defined. Start by adding a new policy coverage.' }) : t('policyCoverage.emptyState.noCoveragesMatchDesc', { defaultValue: 'No matching policy coverages found. Try adjusting your filters or search terms.' })}
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => handleSelectAll(policyCoverages.map(pc => pc.id))}
                currentSort={sortConfig}
                onSortChange={handleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                t={t}
            />
        );
    }
    return null;
  };

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <ShieldHalf className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('policyCoverage.listTitle', { defaultValue: "Policy Coverages" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading ? t('common.loadingEllipsis') : pagination.totalCount || 0})
          </span>
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={entityConfig.entityName}
                t={t} isRTL={isRTL}
              />
          <Button onClick={refreshPolicyCoverages} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['card', 'table']}
            entityName={t('policyCoverage.entityNamePlural')}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>
      
      {/* <PolicyCoverageFilterBar 
        filters={filters} 
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort}
        sortOptionValue={currentSortOptionValue}
        onSortOptionChange={handleSortFilterChange}
        sortOptions={sortOptionsConfig(t)}
        // Add any specific filter options for coverages here
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      /> */}
      
      {error && policyCoverages.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <PolicyCoverageDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          coverage={currentItem}
          policies={policies} // Pass policies for dropdown
        />
      )}
    </div>
  );
}
