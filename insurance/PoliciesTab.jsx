
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { InsurancePolicy } from '@/api/entities';
import { InsuredPerson } from '@/api/entities'; // For fetching names
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

import PolicyDialog from './PolicyDialog';
import PolicyCard from './PolicyCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import PolicyFilterBar from './PolicyFilterBar';
import ImportDialog from '@/components/common/ImportDialog';
import { Badge } from '@/components/ui/badge';

// New import for useEntityModule
import { useEntityModule } from '@/components/hooks/useEntityModule';

import {
    Shield, Plus, UploadCloud, FilterX, RefreshCw, AlertTriangle, FileText
} from 'lucide-react';

import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Removed the local loadFromStorage as it's not appropriate for simple strings here.
// We'll use localStorage.getItem directly for view preference.

export default function PoliciesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [insuredPersonsMap, setInsuredPersonsMap] = useState({});
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '', message: '' });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Fetch auxiliary data (insured persons)
  useEffect(() => {
    const fetchInsuredPersons = async () => {
      try {
        const persons = await InsuredPerson.list();
        const map = {};
        if (Array.isArray(persons)) {
          persons.forEach(p => { map[p.id] = p.full_name || p.id; });
        }
        setInsuredPersonsMap(map);
      } catch (err) {
        console.error("Failed to fetch insured persons for Policies tab:", err);
      }
    };
    fetchInsuredPersons();
  }, []);

  const entityConfig = useMemo(() => ({
    entitySDK: InsurancePolicy,
    entityName: t('policies.itemTitleSingular', { defaultValue: 'Policy' }),
    entityNamePlural: t('policies.titleMultiple', { defaultValue: 'Policies' }),
    DialogComponent: PolicyDialog,
    FormComponent: null, // If you have a separate form component for creation/editing, specify it here
    initialFilters: {
      searchTerm: '',
      insured_id: 'all',
      status: 'all', // Changed default to 'all' to show all by default
      page: 1,
      pageSize: 10,
    },
    // The filterFunction now receives sourceItems and filters directly from useEntityModule
    filterFunction: (sourceItems, filters) => {
      if (!Array.isArray(sourceItems)) return [];
      return sourceItems.filter(policy => {
        const { searchTerm, insured_id, status } = filters;
        let matches = true;

        if (searchTerm) {
          const termLower = searchTerm.toLowerCase();
          const insuredName = insuredPersonsMap[policy.insured_id]?.toLowerCase() || '';
          matches = matches && (
            (policy.policy_number && policy.policy_number.toLowerCase().includes(termLower)) ||
            insuredName.includes(termLower)
          );
        }
        if (insured_id !== 'all') {
          matches = matches && (policy.insured_id === insured_id);
        }
        if (status !== 'all') {
          matches = matches && (policy.status === status);
        }
        return matches;
      });
    },
    // sortFunction is usually handled internally by useEntityModule if sortConfig is provided
    sortFunction: (items, sortConfig) => {
        if (!sortConfig || !sortConfig.key) return items;
        return [...items].sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'policy_number') {
                valA = a.policy_number?.toLowerCase() || '';
                valB = b.policy_number?.toLowerCase() || '';
            } else if (['valid_from', 'valid_to', 'updated_date'].includes(sortConfig.key)) {
              valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
              valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            } else if (sortConfig.key === 'insured_id') { 
                valA = insuredPersonsMap[a.insured_id]?.toLowerCase() || '';
                valB = insuredPersonsMap[b.insured_id]?.toLowerCase() || '';
            } else {
              valA = a[sortConfig.key];
              valB = b[sortConfig.key];
            }
            
            if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
            if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    },
    storageKey: 'policiesView', // This key in useEntityModule might use the generic loadFromStorage. Need to check that too.
    sortConfig: { key: 'policy_number', direction: 'ascending' },
    toast: toast, // Pass toast instance for internal messages
    languageHook: { t, language, isRTL }, // Pass language hook directly
    // Ensure the toast messages from useEntityModule match the ones here for consistency
    // Success/Error messages for CRUD operations are handled by useEntityModule
  }), [t, language, isRTL, toast, insuredPersonsMap]); // Add insuredPersonsMap to dependencies for filterFunction

  const {
    items: policies = [], // Provide default empty array
    loading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    pagination,
    selectedItems = [], // Provide default empty array
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh,
    // handleSearch, // Assuming handleFilterChange covers search
    handleFilterChange, // Centralized filter change handler
    handleSortChange: handleDataTableSortChange, // Renamed to avoid clash
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection, // Toggles selection for a single item (array push/pull)
    handleSelectAll, // Selects/deselects all filtered items
    handleSelfSubmittingDialogClose, // Combined close and refresh handler for dialogs
    filteredAndSortedItems = [], // Provide default empty array
  } = useEntityModule(entityConfig) || {}; // Provide default object fallback
  const [currentView, setCurrentView] = useState(() => {
    if (passedView) return passedView;
    // Directly get item for view preference, provide default if null.
    const storedView = typeof window !== 'undefined' ? localStorage.getItem('policies_view_preference') : null;
    return storedView || 'card'; 
  });
  
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      if (typeof window !== 'undefined') {
        localStorage.setItem('policies_view_preference', passedView);
      }
    }
  }, [passedView, currentView]);

  // When currentView changes internally (not via prop), update localStorage
  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]); // Clear selected items
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    if (typeof window !== 'undefined') {
      localStorage.setItem('policies_view_preference', newView);
    }
    handleCancelSelectionMode();
  };

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'buttons.addNewPolicy', defaultLabel: 'New Policy', icon: Plus, action: handleAddNew, type: 'add' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Policies', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    ...(Array.isArray(externalActionsConfig) ? externalActionsConfig : []) // Safe access
  ], [handleAddNew, externalActionsConfig, setIsImportDialogOpen]);

  const handleEditWithSelectionCheck = useCallback(() => {
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
    const safeFilteredAndSortedItems = Array.isArray(filteredAndSortedItems) ? filteredAndSortedItems : [];
    
    if (safeSelectedItems.length === 1) {
      const policyIdToEdit = safeSelectedItems[0];
      // Ensure filteredAndSortedItems is an array before using .find()
      const policyToEdit = safeFilteredAndSortedItems.find(p => p.id === policyIdToEdit);
      if (policyToEdit) {
        handleEdit(policyToEdit);
      }
    } else if (safeSelectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('policies.itemTitleSingular') }) });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: t('policies.titleMultiple') }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
    const safeFilteredAndSortedItems = Array.isArray(filteredAndSortedItems) ? filteredAndSortedItems : [];
    
    if (safeSelectedItems.length > 0) {
      const idsToDelete = safeSelectedItems; // selectedItems is already an array
      // Ensure filteredAndSortedItems is an array
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
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('policies.titleMultiple') }) });
    }
  }, [selectedItems, filteredAndSortedItems, setIsSelectionModeActive, t, toast]);

  const handleConfirmDelete = async () => {
    // Ensure deleteDialogState.itemIds is an array
    const safeItemIds = Array.isArray(deleteDialogState.itemIds) ? deleteDialogState.itemIds : [];
    if (safeItemIds.length === 0) return;
    
    // Close dialog before calling handleBulkDelete
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
    // Refresh and cancel selection mode after deletion attempt
    handleRefresh();
    handleCancelSelectionMode();
  };

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    const safeRecords = Array.isArray(records) ? records : [];
    if (safeRecords.length === 0) { // Safe access
        toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
        return;
    }
    // Simplified import logic - adapt fields as needed for InsurancePolicy
    const policiesToCreate = safeRecords.map(rec => ({
        policy_number: rec['Policy Number'] || rec['policy_number'],
        insured_id: rec['Insured ID'] || rec['insured_id'], // You might need to map names to IDs
        valid_from: rec['Valid From'] || rec['valid_from'],
        valid_to: rec['Valid To'] || rec['valid_to'],
        status: (rec['Status'] || rec['status'])?.toLowerCase() || 'active',
        // Add other fields for coverage_rules, special_conditions as needed
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
  
  const policyColumns = useMemo(() => [
    {
      accessorKey: "policy_number",
      header: t('policies.fields.policyNumber'),
      cell: ({ row }) => row.original.policy_number || t('common.notSet'),
      enableSorting: true,
    },
    {
      accessorKey: "insured_id",
      header: t('policies.fields.insuredPerson'),
      cell: ({ row }) => insuredPersonsMap[row.original.insured_id] || row.original.insured_id || t('common.unknown'),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: t('common.status'),
      cell: ({ row }) => {
        const status = row.original.status;
        const statusText = t(`status.${status?.toLowerCase()}`, {defaultValue: status});
        const variant = status === 'active' ? 'success' : status === 'suspended' ? 'warning' : 'destructive';
        return <Badge variant={variant} className="text-xs">{statusText}</Badge>;
      },
      enableSorting: true,
    },
    {
      accessorKey: "valid_from",
      header: t('policies.fields.validFrom'),
      cell: ({ row }) => (row.original.valid_from && isValid(parseISO(row.original.valid_from)) ? format(parseISO(row.original.valid_from), 'PP', { locale: currentLocale }) : t('common.notSet')),
      enableSorting: true,
    },
    {
      accessorKey: "valid_to",
      header: t('policies.fields.validTo'),
      cell: ({ row }) => (row.original.valid_to && isValid(parseISO(row.original.valid_to)) ? format(parseISO(row.original.valid_to), 'PP', { locale: currentLocale }) : t('common.notSet')),
      enableSorting: true,
    },
    {
      accessorKey: "updated_date",
      header: t('common.lastUpdated'),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date)) ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale }) : t('common.notSet')),
      enableSorting: true,
    },
  ], [t, insuredPersonsMap, currentLocale]);

  // Ensure policies and filteredAndSortedItems are arrays before accessing length or using array methods
  const safePolicies = Array.isArray(policies) ? policies : [];
  const safeFilteredAndSortedItems = Array.isArray(filteredAndSortedItems) ? filteredAndSortedItems : [];
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];

  if (loading && safePolicies.length === 0 && !error) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('policies.titleMultiple')})} /></div>;
  }

  const totalItems = pagination?.totalItems || safeFilteredAndSortedItems.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
              {t('policies.titleMultiple')} ({totalItems})
          </h3>
          <div className="flex items-center gap-2">
              <GlobalActionButton
                  actionsConfig={memoizedGlobalActionsConfig}
                  onEditItems={handleEditWithSelectionCheck}
                  onDeleteItems={handleDeleteWithSelectionCheck}
                  isSelectionModeActive={isSelectionModeActive}
                  onCancelSelectionMode={handleCancelSelectionMode}
                  selectedItemCount={safeSelectedItems.length} // Safe access
                  itemTypeForActions={t('policies.itemTitleSingular')}
                  t={t}
              />
              <Button variant="outline" size="sm" onClick={() => { handleRefresh(); toast({ title: t('common.refreshingData'), description: t('messages.fetchingLatest', { item: t('policies.titleMultiple') })});}} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('buttons.refresh')}
              </Button>
              <ViewSwitcher
                  currentView={currentView}
                  onViewChange={handleViewChange} // Use the new handler
                  availableViews={['card', 'table']}
                  entityName={t('policies.titleMultiple')}
                  t={t} isRTL={isRTL}
              />
          </div>
      </div>

      <PolicyFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange} // Uses centralized handleFilterChange
        onResetFilters={() => {
          setFilters(entityConfig.initialFilters);
          setSortConfig(entityConfig.sortConfig); // Reset sort as well
          handleCancelSelectionMode();
           toast({
              title: t('filters.clearedTitle'),
              description: t('filters.filtersReset', { item: t('policies.titleMultiple') }),
          });
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => {
            const currentSort = sortConfig;
            let direction = 'ascending';
            if (currentSort.key === key && currentSort.direction === 'ascending') direction = 'descending';
            else if (currentSort.key === key && currentSort.direction === 'descending') direction = 'ascending';
            setSortConfig({ key, direction });
        }}
        // Pass transformed insured persons data for the filter dropdown
        insuredPersonsOptions={Object.entries(insuredPersonsMap).map(([id, name]) => ({ value: id, label: name }))}
        t={t} language={language} isRTL={isRTL}
      />

      {error && (
        <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
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
      )}

      {!loading && !error && safeFilteredAndSortedItems.length === 0 && (
        <EmptyState
          icon={Shield}
          title={
            Object.values(filters).some(v => v && v !== 'all' && v !== entityConfig.initialFilters.pageSize) // Adjusted check for filters
              ? t('policies.noPoliciesFilterDesc') // Message if filters are applied
              : t('policies.noPoliciesDesc') // Default message if no filters
          }
          message={t('policies.noPoliciesFound')}
          actionButton={
            <Button onClick={handleAddNew}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewPolicy')}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {!loading && !error && safeFilteredAndSortedItems.length > 0 && (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeFilteredAndSortedItems.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  insuredPersonName={insuredPersonsMap[policy.insured_id]} // Adjusted prop name for PolicyCard
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={safeSelectedItems.includes(policy.id)} // Check if ID is in the array
                  onToggleSelection={() => handleToggleSelection(policy.id)}
                  onCardClick={() => !isSelectionModeActive && handleEdit(policy)} // Example: card click opens edit
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
            <DataTable
              columns={policyColumns}
              data={safeFilteredAndSortedItems}
              loading={loading}
              error={null} // Error is handled by a separate Card component
              entityName={t('policies.titleMultiple')}
              pagination={{ // Construct pagination object for DataTable
                  currentPage: pagination.page || 1, // use `page` from pagination
                  pageSize: pagination.pageSize,
                  totalItems: pagination.totalItems,
                  totalPages: pagination.totalPages,
              }}
              onPageChange={handlePageChange} // Direct use of useEntityModule handler
              onPageSizeChange={handlePageSizeChange} // Direct use of useEntityModule handler
              onSortChange={handleDataTableSortChange} // Direct use of useEntityModule handler
              currentSort={sortConfig.key ? [{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }] : []}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={new Set(safeSelectedItems)} // DataTable expects a Set for selected IDs
              onRowSelectionChange={(rowId) => handleToggleSelection(rowId)} // use toggle handler directly
              onSelectAllRows={() => handleSelectAll(safeFilteredAndSortedItems)} // Pass filtered items to select all
              onRowClick={({ original: item }) => !isSelectionModeActive && item?.id && handleEdit(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {/* Custom pagination for card view is removed as useEntityModule manages data */}
        </>
      )}

      {isDialogOpen && (
        <PolicyDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setCurrentItem(null); }}
          policyData={currentItem} // Use policyData for existing item, null for new
          allInsuredPersons={Object.entries(insuredPersonsMap).map(([id, name]) => ({id, full_name: name}))} // Pass as array of objects
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
        onOpenChange={setIsImportDialogOpen} // Directly links to state
        entityName={t('policies.titleMultiple')}
        onImport={handleImportSubmit} // Passes the import handler
        sampleHeaders={['Insured ID', 'Policy Number', 'Valid From (YYYY-MM-DD)', 'Valid To (YYYY-MM-DD)', 'Status (active/suspended/terminated)']}
        language={language}
        expectedHeaders={[ // Adjust as per your CSV structure
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
        t={t} // Pass t for internal translations
      />
    </div>
  );
}
