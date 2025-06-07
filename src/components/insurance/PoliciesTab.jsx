
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { InsurancePolicy } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { Button } from '@/components/ui/button';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import PolicyDialog from './PolicyDialog';
import PolicyCard from './PolicyCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { DataTable } from '@/components/ui/data-table'; // Corrected path
import PolicyFilterBar from './PolicyFilterBar';
import ImportDialog from '@/components/common/ImportDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Corrected import path (already correct in current, just ensuring consistency with outline's intention)
import { useEntityModule } from '@/components/hooks/useEntityModule';

// New imports for storage and utility functions
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import StatusBadge from '@/components/common/StatusBadge';
import { formatSafeDate, formatSafeDateDistance } from '@/components/utils/i18n-utils';

import {
    Plus, UploadCloud, FilterX, RefreshCw, AlertTriangle, Pencil, FileArchive, Trash2, SearchX, Shield
} from 'lucide-react'; // Expanded icons from outline

import { parseISO, isValid } from 'date-fns'; // format and formatDistanceToNow replaced by safeDate utils
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const statusFilterOptions = (t) => [
  { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
  { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
  { value: 'suspended', label: t('status.suspended', { defaultValue: 'Suspended' }) },
  { value: 'terminated', label: t('status.terminated', { defaultValue: 'Terminated' }) },
];

const sortOptionsConfig = (t) => [
    { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
    { value: 'policy_number', label: t('sortOptions.policyNumber', { defaultValue: 'Policy Number' }) },
    { value: 'insured_id', label: t('sortOptions.insuredPerson', { defaultValue: 'Insured Person' }) }, // Sorting by ID, display name
    { value: 'valid_from', label: t('sortOptions.validFrom', { defaultValue: 'Valid From' }) },
    { value: 'valid_to', label: t('sortOptions.validTo', { defaultValue: 'Valid To' }) },
    { value: 'status', label: t('sortOptions.status', { defaultValue: 'Status' }) },
];

export default function PoliciesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  // Changed from map to array for easier filtering/mapping
  const [insuredPersons, setInsuredPersons] = useState([]);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '', message: '' });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Fetch auxiliary data (insured persons)
  useEffect(() => {
    const fetchInsuredPersons = async () => {
      try {
        const persons = await InsuredPerson.list();
        setInsuredPersons(Array.isArray(persons) ? persons : []);
      } catch (err) {
        console.error("Failed to fetch insured persons for Policies tab:", err);
        toast({ title: t('errors.fetchFailed', { entity: t('insuredPersons.titleMultiple') }), description: err.message, variant: "destructive" });
      }
    };
    fetchInsuredPersons();
  }, [t, toast]);

  const insuredPersonOptions = useMemo(() => [
    { value: 'all', label: t('filters.allInsuredPersons', {defaultValue: 'All Insured Persons'}) },
    ...insuredPersons.map(ip => ({ value: ip.id, label: ip.full_name || ip.id }))
  ], [insuredPersons, t]);

  const entityConfig = useMemo(() => ({
    entitySDK: InsurancePolicy,
    entityName: t('policies.itemTitleSingular', { defaultValue: 'Policy' }),
    entityNamePlural: t('policies.titleMultiple', { defaultValue: 'Policies' }),
    DialogComponent: PolicyDialog,
    FormComponent: null, // If you have a separate form component for creation/editing, specify it here
    initialSort: [{ id: 'policy_number', desc: false }], // Consistent with DataTable
    initialFilters: {
      searchTerm: '',
      insured_id: 'all',
      status: 'all',
      validityDateRange: { from: null, to: null },
    },
    searchFields: ['policy_number'], // Fields to search directly in SDK if applicable
    // The filterFunction now receives item and filters for client-side filtering
    filterFunction: (item, filters) => {
      if (!item) return false;
      const { searchTerm, insured_id, status, validityDateRange } = filters;
      let matches = true;

      // Search term
      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        const insured = insuredPersons.find(p => p.id === item.insured_id);
        const insuredName = insured ? (insured.full_name || '').toLowerCase() : '';
        matches = matches && (
          (item.policy_number && item.policy_number.toLowerCase().includes(termLower)) ||
          insuredName.includes(termLower)
        );
      }
      // Insured person filter
      if (insured_id !== 'all') {
        matches = matches && (item.insured_id === insured_id);
      }
      // Status filter
      if (status !== 'all') {
        matches = matches && (item.status === status);
      }
      // Validity date range filter
      if (validityDateRange && (validityDateRange.from || validityDateRange.to)) {
        const validFrom = item.valid_from && isValid(parseISO(item.valid_from)) ? parseISO(item.valid_from) : null;
        const validTo = item.valid_to && isValid(parseISO(item.valid_to)) ? parseISO(item.valid_to) : null;

        if (validityDateRange.from) {
          const filterFrom = new Date(validityDateRange.from);
          filterFrom.setHours(0, 0, 0, 0); // Start of the day
          if (!validFrom || validFrom < filterFrom) {
            matches = false;
          }
        }
        if (validityDateRange.to) {
          const filterTo = new Date(validityDateRange.to);
          filterTo.setHours(23, 59, 59, 999); // End of the day
          if (!validTo || validTo > filterTo) {
            matches = false;
          }
        }
      }
      return matches;
    },
    storageKey: 'policies', // Using 'policies' as the general storage key prefix
    toast: toast, // Pass toast instance for internal messages
    languageHook: { t, language, isRTL }, // Pass language hook directly
  }), [t, language, isRTL, toast, insuredPersons]); // Add insuredPersons to dependencies for filterFunction

  const {
    items: policies = [], // Paginated items (for current view)
    loading,
    error,
    filters,
    sortConfig, // Now an array of objects e.g., [{ id: 'policy_number', desc: false }]
    pagination,
    selectedItems = [],
    setSelectedItems, // Added for resetFiltersAndSort
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh,
    handleFilterChange,
    handleSortChange, // Expects [{ id: key, desc: boolean }]
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
    filteredAndSortedItems = [], // All items after filtering and sorting (before pagination)
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(() => {
    if (passedView) return passedView;
    return loadFromStorage(entityConfig.storageKey + '_view_preference', 'card');
  });

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_view_preference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]); // Clear selected items
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    saveToStorage(entityConfig.storageKey + '_view_preference', newView);
    handleCancelSelectionMode();
  };

  const resetFiltersAndSort = useCallback(() => {
    handleFilterChange(null, entityConfig.initialFilters); // Pass null for event, then initial filters
    handleSortChange(entityConfig.initialSort);
    handleCancelSelectionMode();
    toast({
      title: t('filters.clearedTitle'),
      description: t('filters.filtersReset', { item: t('policies.titleMultiple') }),
    });
  }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, handleCancelSelectionMode, t, toast]);

  const handleEditWithSelectionCheck = useCallback(() => {
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
    
    if (safeSelectedItems.length === 1) {
      const policyIdToEdit = safeSelectedItems[0];
      const policyToEdit = filteredAndSortedItems.find(p => p.id === policyIdToEdit); // Use filteredAndSortedItems for full list
      if (policyToEdit) {
        handleEdit(policyToEdit);
      } else {
        toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
      }
    } else if (safeSelectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('policies.itemTitleSingular') }), variant: 'info' });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: t('policies.titleMultiple') }), variant: 'info' });
    }
  }, [selectedItems, filteredAndSortedItems, handleEdit, setIsSelectionModeActive, t, toast]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
    const safeFilteredAndSortedItems = Array.isArray(filteredAndSortedItems) ? filteredAndSortedItems : [];
    
    if (safeSelectedItems.length > 0) {
      const idsToDelete = safeSelectedItems;
      const firstItemName = idsToDelete.length > 0 ?
        (safeFilteredAndSortedItems.find(p => p.id === idsToDelete[0])?.policy_number || t('policies.itemTitleSingular')) : t('policies.itemTitleSingular');
      const itemName = idsToDelete.length === 1 ? firstItemName : t('policies.titleMultiple');
      setDeleteDialogState({
        isOpen: true,
        itemIds: idsToDelete,
        itemName: itemName,
        message: t('policies.bulkDeleteConfirmMessage', { count: idsToDelete.length, itemName: itemName?.toLowerCase() || t('policies.itemTitleSingular') })
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('policies.titleMultiple') }), variant: 'info' });
    }
  }, [selectedItems, filteredAndSortedItems, setIsSelectionModeActive, t, toast]);

  const handleConfirmDelete = async () => {
    const safeItemIds = Array.isArray(deleteDialogState.itemIds) ? deleteDialogState.itemIds : [];
    if (safeItemIds.length === 0) return;
    
    setDeleteDialogState(prev => ({ ...prev, isOpen: false })); 

    const { successCount, errorCount } = await handleBulkDelete(safeItemIds);

    if (successCount > 0) {
      toast({
        title: t('messages.success'),
        description: t('policies.bulkDeleteSuccess', { count: successCount }),
      });
    }
    if (errorCount > 0) {
      toast({
        title: t('errors.deleteFailedTitle'),
        description: t('policies.bulkDeleteError', { count: errorCount }),
        variant: "destructive",
      });
    }
    handleRefresh();
    handleCancelSelectionMode();
  };

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'buttons.addNewPolicy', defaultLabel: 'New Policy', icon: Plus, action: handleAddNew, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Pencil, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Policies', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    ...(Array.isArray(externalActionsConfig) ? externalActionsConfig : [])
  ], [handleAddNew, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck, externalActionsConfig, setIsImportDialogOpen, t]);

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    const safeRecords = Array.isArray(records) ? records : [];
    if (safeRecords.length === 0) {
        toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
        return;
    }
    const policiesToCreate = safeRecords.map(rec => ({
        policy_number: rec['Policy Number'] || rec['policy_number'],
        insured_id: rec['Insured ID'] || rec['insured_id'],
        valid_from: rec['Valid From'] || rec['valid_from'],
        valid_to: rec['Valid To'] || rec['valid_to'],
        status: (rec['Status'] || rec['status'])?.toLowerCase() || 'active',
    })).filter(p => p.policy_number && p.insured_id && p.valid_from);

    if (policiesToCreate.length === 0) {
        toast({ title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', { entity: t('policies.titleMultiple') }), variant: 'warning' });
        return;
    }

    let successCount = 0; let errorCount = 0;
    for (const policyData of policiesToCreate) {
        try { await InsurancePolicy.create(policyData); successCount++; }
        catch (err) { console.error("Error creating Policy from import:", err, policyData); errorCount++; }
    }
    
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', { successCount, errorCount, entity: t('policies.titleMultiple') }),
    });
    if (successCount > 0) handleRefresh();
  };
  
  const policyTableColumns = useMemo(() => [
    {
      accessorKey: "policy_number",
      header: t('policies.fields.policyNumber'),
      cell: ({ row }) => row.original.policy_number || t('common.notSet'),
      enableSorting: true,
    },
    {
      accessorKey: "insured_id",
      header: t('policies.fields.insuredPerson'),
      cell: ({ row }) => {
          const insured = insuredPersons.find(ip => ip.id === row.original.insured_id);
          return insured ? insured.full_name : row.original.insured_id || t('common.unknown');
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: t('common.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
      enableSorting: true,
    },
    {
      accessorKey: "valid_from",
      header: t('policies.fields.validFrom'),
      cell: ({ row }) => formatSafeDate(row.original.valid_from, language),
      enableSorting: true,
    },
    {
      accessorKey: "valid_to",
      header: t('policies.fields.validTo'),
      cell: ({ row }) => formatSafeDate(row.original.valid_to, language),
      enableSorting: true,
    },
    {
      accessorKey: "updated_date",
      header: t('common.lastUpdated'),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true,
    },
  ], [t, insuredPersons, language]);

  // Derive sort option value for the filter bar from useEntityModule's sortConfig
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
  
  const totalItems = pagination?.totalItems || filteredAndSortedItems.length || 0;

  // Render content based on view and data state
  const renderContent = () => {
    const noItems = pagination.totalItems === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => {
        if (key === 'validityDateRange') return !val?.from && !val?.to;
        return !val || val === 'all' || (key === 'pageSize' && val === entityConfig.initialFilters.pageSize);
    });

    if (!loading && noItems && noFiltersApplied) {
        return (
            <EmptyState
                icon={FileArchive} // Using FileArchive as per outline
                title={t('policies.emptyState.noPoliciesTitle', { defaultValue: 'No Policies Yet' })}
                description={t('policies.emptyState.noPoliciesDesc', { defaultValue: 'Start by adding a new policy.' })}
                actionButton={
                    <Button onClick={handleAddNew}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                        {t('buttons.addNewPolicy')}
                    </Button>
                }
                t={t} isRTL={isRTL}
            />
        );
    }

    if (!loading && noItems && !noFiltersApplied) {
        return (
            <EmptyState
                icon={SearchX}
                title={t('policies.emptyState.noPoliciesMatchTitle', { defaultValue: 'No Policies Found' })}
                description={t('policies.emptyState.noPoliciesMatchDesc', { defaultValue: 'Try adjusting your filters.' })}
                t={t} isRTL={isRTL}
            />
        );
    }

    if (currentView === 'card') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {policies.map(policy => ( // policies here are paginated items
              <PolicyCard
                key={policy.id}
                policy={policy}
                insuredPersonName={insuredPersons.find(ip => ip.id === policy.insured_id)?.full_name || policy.insured_id}
                currentLocale={currentLocale}
                t={t} isRTL={isRTL}
                isSelectionModeActive={isSelectionModeActive}
                isSelected={selectedItems.includes(policy.id)}
                onToggleSelection={() => handleToggleSelection(policy.id)}
                onCardClick={() => !isSelectionModeActive && handleEdit(policy)}
              />
            ))}
          </div>
          {/* Pagination for Card View */}
          {Math.ceil(pagination.totalItems / pagination.pageSize) > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalItems / pagination.pageSize) || 1 })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= (Math.ceil(pagination.totalItems / pagination.pageSize) || 1) || loading}>
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      );
    }
    
    if (currentView === 'table') {
        return (
            <DataTable
              columns={policyTableColumns}
              data={policies} // policies here are paginated items
              loading={loading}
              error={null} // Error handled by a separate Card component above
              entityName={t('policies.titleMultiple')}
              pagination={{
                  currentPage: pagination.currentPage,
                  pageSize: pagination.pageSize,
                  totalItems: pagination.totalItems,
                  totalPages: Math.ceil(pagination.totalItems / pagination.pageSize) || 1,
              }}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange} // Pass handleSortChange from useEntityModule
              currentSort={sortConfig} // Pass sortConfig from useEntityModule
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={new Set(selectedItems)}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={() => handleSelectAll(policies.map(p => p.id))} // Selects items on current page
              onRowClick={({ original: item }) => !isSelectionModeActive && item?.id && handleEdit(item)}
              t={t} language={language} isRTL={isRTL}
            />
        );
    }
    return null;
  };

  if (loading && policies.length === 0 && !error) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('policies.titleMultiple')})} /></div>;
  }

  // Primary error display (when no items loaded at all)
  if (error && policies.length === 0) {
    return (
        <Card className="border-destructive bg-destructive/10 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error.message || t('errors.fetchFailedDesc')}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow')}
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <FileArchive className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
              {t('policies.titleMultiple')}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({loading ? t('common.loadingEllipsis') : totalItems})
              </span>
          </h3>
          <div className="flex items-center gap-2">
              <GlobalActionButton
                  actionsConfig={memoizedGlobalActionsConfig}
                  isSelectionModeActive={isSelectionModeActive}
                  onCancelSelectionMode={handleCancelSelectionMode}
                  selectedItemCount={selectedItems.length}
                  itemTypeForActions={t('policies.itemTitleSingular')}
                  t={t} isRTL={isRTL}
              />
              <Button variant="outline" size="sm" onClick={() => { handleRefresh(); toast({ title: t('common.refreshingData'), description: t('messages.fetchingLatest', { item: t('policies.titleMultiple') })});}} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('buttons.refresh')}
              </Button>
              <ViewSwitcher
                  currentView={currentView}
                  onViewChange={handleViewChange}
                  availableViews={['card', 'table']}
                  entityName={t('policies.titleMultiple')}
                  t={t} isRTL={isRTL}
              />
          </div>
      </div>

      <PolicyFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort}
        sortOptionValue={currentSortOptionValue}
        onSortOptionChange={handleSortFilterChange}
        sortOptions={sortOptionsConfig(t)}
        insuredPersonOptions={insuredPersonOptions}
        statusOptions={statusFilterOptions(t)}
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      />

      {error && policies.length > 0 && ( // Partial load warning
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <PolicyDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setCurrentItem(null); }}
          policy={currentItem} // Use policy for existing item, null for new
          insuredPersons={insuredPersons} // Pass as array of objects
          t={t} language={language} isRTL={isRTL}
          onSave={() => handleSelfSubmittingDialogClose(true)} // True to indicate refresh needed
        />
      )}
      
      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('policies.itemTitleSingular'), count: Array.isArray(deleteDialogState.itemIds) ? deleteDialogState.itemIds.length : 1})}
        description={deleteDialogState.message}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={loading} // Use module loading for deletion
        t={t} isRTL={isRTL}
      />
      
      <ImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        entityName={t('policies.titleMultiple')}
        onImport={handleImportSubmit}
        sampleHeaders={['Insured ID', 'Policy Number', 'Valid From (YYYY-MM-DD)', 'Valid To (YYYY-MM-DD)', 'Status (active/suspended/terminated)']}
        language={language}
        expectedHeaders={[
            { key: 'Insured ID', label: t('policies.fields.insuredPerson') + " (ID)" },
            { key: 'Policy Number', label: t('policies.fields.policyNumber') },
            { key: 'Valid From', label: t('policies.fields.validFrom') + " (YYYY-MM-DD)" },
            { key: 'Valid To', label: t('policies.fields.validTo') + " (YYYY-MM-DD)" },
            { key: 'Status', label: t('common.status') + " (active/suspended/terminated)" },
        ]}
        sampleData={[
            ['insured_person_id_1', 'POL-001-2023', '2023-01-01', '2024-12-31', 'active'],
            ['insured_person_id_2', 'POL-002-2023', '2022-06-15', '2023-06-14', 'terminated'],
        ]}
        t={t}
      />
    </div>
  );
}
