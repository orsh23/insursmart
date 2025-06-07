
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InsuredPolicy } from '@/api/entities'; // Entity for linkage
import { InsuredPerson } from '@/api/entities'; // For insured person names
import { InsurancePolicy } from '@/api/entities'; // For policy numbers/details
import PolicyLinkDialog from './PolicyLinkDialog'; // Dialog for Add/Edit
import PolicyLinkageCard from './PolicyLinkageCard'; // Card view
// import PolicyLinkFilterBar from './PolicyLinkFilterBar'; // Specific filter bar (if needed)
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { useEntityModule } from '@/components/hooks/useEntityModule';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import { DataTable } from '@/components/ui/data-table'; // Corrected path
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, Users, ShieldCheck, Plus, Edit, Trash2, UploadCloud, DownloadCloud, RefreshCw, AlertTriangle, SearchX } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ImportDialog from '@/components/common/ImportDialog';

const activeFlagOptions = (t) => [
  { value: 'all', label: t('filters.allStatuses', {defaultValue: 'All Statuses'}) }, // Re-use common status filter
  { value: 'true', label: t('status.active', {defaultValue: 'Active'}) },
  { value: 'false', label: t('status.inactive', {defaultValue: 'Inactive'}) },
];

const coverageTypeOptions = (t) => [
  { value: 'primary', label: t('coverageTypes.primary', {defaultValue: 'Primary'}) },
  { value: 'secondary', label: t('coverageTypes.secondary', {defaultValue: 'Secondary'}) },
  { value: 'supplemental', label: t('coverageTypes.supplemental', {defaultValue: 'Supplemental'}) },
  { value: 'addon', label: t('coverageTypes.addon', {defaultValue: 'Add-on'}) },
];


export default function PolicyLinkageTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  
  const [insuredPersons, setInsuredPersons] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personsData, policiesData] = await Promise.all([
          InsuredPerson.list(undefined, 1000, undefined, ['id', 'full_name']), // Fetch enough for mapping
          InsurancePolicy.list(undefined, 1000, undefined, ['id', 'policy_number']) // Fetch enough for mapping
        ]);
        setInsuredPersons(Array.isArray(personsData) ? personsData : []);
        setInsurancePolicies(Array.isArray(policiesData) ? policiesData : []);
      } catch (err) {
        console.error("Failed to fetch related data for Policy Linkage:", err);
        toast({ title: t('errors.fetchRelatedDataError'), description: err.message, variant: 'warning' });
      }
    };
    fetchData();
  }, [toast, t]);

  const getInsuredName = useCallback((id) => insuredPersons.find(p => p.id === id)?.full_name || id, [insuredPersons]);
  const getPolicyNumber = useCallback((id) => insurancePolicies.find(p => p.id === id)?.policy_number || id, [insurancePolicies]);

  const entityConfig = useMemo(() => ({
    entitySDK: InsuredPolicy,
    entityName: t('insurance.policyLinkage.entityNameSingular', { defaultValue: 'Policy Linkage' }),
    entityNamePlural: t('insurance.tabs.policyLinkage', { defaultValue: 'Policy Linkages' }),
    DialogComponent: PolicyLinkDialog,
    initialSort: [{ id: 'updated_date', desc: true }],
    initialFilters: {
      searchTerm: '', // Search by insured name or policy number
      active_flag: 'all',
      coverage_type: 'all',
    },
    searchFields: ['policy_number', 'group_number'], // Fields directly on InsuredPolicy
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        const insuredName = getInsuredName(item.insured_id)?.toLowerCase();
        const policyNum = getPolicyNumber(item.policy_id)?.toLowerCase();
        const externalPolicyNum = item.policy_number?.toLowerCase(); // Search direct field too

        if (!(
          insuredName?.includes(term) ||
          policyNum?.includes(term) ||
          externalPolicyNum?.includes(term) ||
          item.group_number?.toLowerCase().includes(term)
        )) return false;
      }
      if (filters.active_flag !== 'all' && String(item.active_flag) !== filters.active_flag) return false;
      if (filters.coverage_type !== 'all' && item.coverage_type !== filters.coverage_type) return false;
      return true;
    },
    storageKey: 'policyLinkagesView',
  }), [t, getInsuredName, getPolicyNumber]);

  const {
    items: policyLinkages,
    loading, error, filters, sortConfig, pagination, selectedItems, setSelectedItems,
    isDialogOpen, currentItem,
    handleRefresh, handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', loading: false });

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
      const itemToEdit = policyLinkages.find(p => p.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit')}), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
    }
  }, [selectedItems, policyLinkages, handleEdit, setIsSelectionModeActive, t, toast, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
     if (selectedItems.length > 0) {
      const firstItem = policyLinkages.find(p => p.id === selectedItems[0]);
      // Construct a meaningful name for the dialog, e.g., "Linkage for John Doe - Policy P123"
      const itemNameForDialog = firstItem 
        ? `${t('insurance.policyLinkage.linkFor', {defaultValue: 'Link for'})} ${getInsuredName(firstItem.insured_id)} - ${t('fields.policyShort', {defaultValue: 'Pol.'})} ${getPolicyNumber(firstItem.policy_id)}`
        : entityConfig.entityName;
      
      const finalItemName = selectedItems.length === 1 ? itemNameForDialog : t('common.multipleItems', { count: selectedItems.length });

      setDeleteDialogState({
        isOpen: true,
        itemIds: selectedItems,
        itemName: finalItemName,
        message: t('common.confirmDeleteMessage', { count: selectedItems.length, itemName: finalItemName }),
        loading: false,
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete')}), variant: "info" });
    }
  }, [selectedItems, policyLinkages, setIsSelectionModeActive, t, toast, entityConfig.entityName, getInsuredName, getPolicyNumber]);
  
  const handleConfirmDelete = useCallback(async () => {
    setDeleteDialogState(prev => ({ ...prev, loading: true }));
    const result = await handleBulkDelete(deleteDialogState.itemIds);
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', loading: false });
     if (result.successCount > 0) {
       toast({
        title: t('bulkActions.deleteResultTitle'),
        description: t('bulkActions.deleteResultDesc', { successCount: result.successCount, failCount: result.failCount, entity: entityConfig.entityNamePlural }),
      });
    }
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [deleteDialogState.itemIds, handleBulkDelete, toast, t, entityConfig.entityNamePlural, setIsSelectionModeActive, setSelectedItems]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'insurance.policyLinkage.addNewLink', defaultLabel: 'Add New Linkage', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: [0,1] },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'any' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Linkages', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export Linkages', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const policyLinkageTableColumns = useMemo(() => [
    { 
      accessorKey: 'insured_id', 
      header: t('fields.insured', {defaultValue: 'Insured Person'}), 
      cell: ({row}) => getInsuredName(row.original.insured_id),
      enableSorting: true // Enable if you can sort by name via resolved value (complex)
    },
    { 
      accessorKey: 'policy_id', 
      header: t('fields.policyNumber', {defaultValue: 'Policy Number'}), 
      cell: ({row}) => getPolicyNumber(row.original.policy_id),
      enableSorting: true // Enable if you can sort by number via resolved value (complex)
    },
    { 
      accessorKey: 'policy_number', // Direct field for external policy number
      header: t('fields.externalPolicyNum', {defaultValue: 'External Policy No.'}), 
      enableSorting: true,
    },
    { 
      accessorKey: 'coverage_type', 
      header: t('fields.coverageType', {defaultValue: 'Coverage Type'}),
      cell: ({row}) => t(`coverageTypes.${row.original.coverage_type}`, {defaultValue: row.original.coverage_type || t('common.notSet')}),
      enableSorting: true 
    },
    { 
      accessorKey: 'active_flag', 
      header: t('fields.status', {defaultValue: 'Status'}),
      cell: ({row}) => <StatusBadge status={row.original.active_flag ? 'active' : 'inactive'} t={t} />,
      enableSorting: true 
    },
    { 
      accessorKey: 'start_date', 
      header: t('fields.startDate', {defaultValue: 'Start Date'}),
      cell: ({row}) => formatSafeDateDistance(row.original.start_date, language, { format: 'toLocaleDateString' }),
      enableSorting: true 
    },
    { 
      accessorKey: 'end_date', 
      header: t('fields.endDate', {defaultValue: 'End Date'}),
      cell: ({row}) => row.original.end_date ? formatSafeDateDistance(row.original.end_date, language, { format: 'toLocaleDateString' }) : t('common.notSet'),
      enableSorting: true 
    },
     { 
      accessorKey: 'updated_date', 
      header: t('fields.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({row}) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true 
    },
  ], [t, language, getInsuredName, getPolicyNumber]);

  const handleImportSubmit = useCallback(async (file) => {
    setIsImportDialogOpen(false);
    if (!file) {
      toast({ title: t('import.noFileTitle'), description: t('import.noFileDesc'), variant: "warning" });
      return;
    }
    toast({ title: t('import.comingSoonTitle'), description: t('import.featureNotImplemented', {entity: entityConfig.entityNamePlural }), variant: "info" });
  }, [toast, t, entityConfig.entityNamePlural]);

  const renderContent = () => {
    if (loading && policyLinkages.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    if (error && policyLinkages.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={handleRefresh} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.values(filters || {}).every(val =>
      !val || (typeof val === 'string' && (val === '' || val === 'all')) || (Array.isArray(val) && val.length === 0)
    );

    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={Link2}
              title={t('insurance.policyLinkage.noLinkages', {defaultValue: "No Policy Linkages Found"})}
              description={t('insurance.policyLinkage.noLinkagesDesc', {defaultValue: "Start by linking an insured person to a policy."})}
              actionButton={<Button onClick={() => handleAddNew()}><Plus className="mr-2 h-4 w-4" />{t('insurance.policyLinkage.addNewLink', {defaultValue: "Add New Link"})}</Button>}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('insurance.policyLinkage.noLinkagesFilterTitle', {defaultValue: "No Linkages Match Filters"})}
              description={t('insurance.policyLinkage.noLinkagesFilterDesc', {defaultValue: "Try adjusting your search or filter criteria."})}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {policyLinkages.map(link => (
                <PolicyLinkageCard 
                  key={link.id} 
                  linkage={link} 
                  getInsuredName={getInsuredName}
                  getPolicyNumber={getPolicyNumber}
                  onEdit={() => handleEdit(link)}
                  isSelected={selectedItems.includes(link.id)}
                  onToggleSelection={() => handleToggleSelection(link.id)}
                  isSelectionModeActive={isSelectionModeActive}
                  language={language}
                  t={t}
                />
              ))}
            </div>
          )}
           {pagination.totalPages > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: pagination.totalPages })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loading}>
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
                columns={policyLinkageTableColumns}
                data={policyLinkages}
                loading={loading}
                error={error}
                onRetry={handleRefresh}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('insurance.policyLinkage.noLinkagesDesc') : t('insurance.policyLinkage.noLinkagesFilterDesc')}
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => handleSelectAll(policyLinkages.map(l => l.id))}
                currentSort={sortConfig}
                onSortChange={handleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: pagination.totalPages,
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
          <Link2 className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('insurance.tabs.policyLinkage', { defaultValue: "Policy Linkages" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
             ({loading && pagination.totalCount === undefined ? t('common.loadingEllipsis') : pagination.totalCount || 0})
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
          <Button onClick={handleRefresh} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh')}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['card', 'table']}
            entityName={entityConfig.entityNamePlural}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>

      {isSelectionModeActive && (
         <div className="sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          {/* Selection mode UI */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="selectAllVisibleLinks"
                checked={selectedItems.length > 0 && policyLinkages.every(item => selectedItems.includes(item.id))}
                onCheckedChange={() => handleSelectAll(policyLinkages.map(item => item.id))}
                aria-label={t('bulkActions.selectAllVisible')}
                disabled={policyLinkages.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleLinks" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItems.length > 0
                    ? t('bulkActions.selectedCount', { count: selectedItems.length })
                    : t('bulkActions.selectItemsPromptShort', { mode: t('common.action') })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelSelectionMode} className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">
                 {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleEditWithSelectionCheck}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItems.length === 0 || selectedItems.length > 1}
              >
                {t('common.edit')}
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteWithSelectionCheck}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                disabled={selectedItems.length === 0}
              >
                {t('common.delete')} {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Bar Component could be used here if it existed:
      <PolicyLinkFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort}
        statusOptions={activeFlagOptions(t)}
        coverageTypeOptions={coverageTypeOptions(t).map(opt => ({value: opt.value, label: opt.label}))}
        // Pass other options like insured persons, policies if dropdowns are needed
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      /> */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text"
            placeholder={t('search.placeholderPolicyLink', {defaultValue: "Search by Insured Name or Policy No..."})}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <select
            value={filters.active_flag}
            onChange={(e) => handleFilterChange('active_flag', e.target.value)}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            {activeFlagOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={filters.coverage_type}
            onChange={(e) => handleFilterChange('coverage_type', e.target.value)}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="all">{t('filters.allCoverageTypes', {defaultValue: "All Coverage Types"})}</option>
            {coverageTypeOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <Button onClick={resetFiltersAndSort} variant="ghost" className="mt-2 text-sm text-blue-600 dark:text-blue-400">
          {t('buttons.resetFilters')}
        </Button>
      </div>


      {error && policyLinkages.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <PolicyLinkDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          linkage={currentItem}
          insuredPersonsData={insuredPersons} // Pass full data for dropdown
          insurancePoliciesData={insurancePolicies} // Pass full data for dropdown
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds.length})}
          description={deleteDialogState.message}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          loading={deleteDialogState.loading}
          t={t} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImportSubmit}
          entityName={entityConfig.entityNamePlural}
          sampleHeaders={['Insured Person ID', 'Policy ID', 'External Policy Number', 'Coverage Type (primary, secondary)', 'Start Date (YYYY-MM-DD)', 'End Date (YYYY-MM-DD)', 'Active (true/false)']}
          language={language} isRTL={isRTL}
          t={t}
        />
      )}
    </div>
  );
}
