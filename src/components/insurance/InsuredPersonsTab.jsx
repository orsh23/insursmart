
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InsuredPerson } from '@/api/entities';
import { City } from '@/api/entities';
import InsuredPersonDialog from './InsuredPersonDialog';
import InsuredPersonCard from './InsuredPersonCard';
import InsuredPersonFilterBar from './InsuredPersonFilterBar';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import useEntityModule from '@/components/hooks/useEntityModule'; // Corrected to default import
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import { DataTable } from '@/components/ui/data-table'; // Corrected import path
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users, Plus, Edit, Trash2, UploadCloud, DownloadCloud, RefreshCw, AlertTriangle, SearchX, UserCog } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ImportDialog from '@/components/common/ImportDialog';

const genderOptions = (t) => [
  { value: 'male', label: t('gender.male', { defaultValue: 'Male' }) },
  { value: 'female', label: t('gender.female', { defaultValue: 'Female' }) },
  { value: 'other', label: t('gender.other', { defaultValue: 'Other' }) },
];

const identificationTypeOptions = (t) => [
  { value: 'national_id', label: t('idType.national_id', { defaultValue: 'National ID' }) },
  { value: 'insurance_number', label: t('idType.insurance_number', { defaultValue: 'Insurance No.' }) },
  { value: 'passport', label: t('idType.passport', { defaultValue: 'Passport' }) },
];

export default function InsuredPersonsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  // const [cities, setCities] = useState([]); // Cities might be needed for filtering address if it's structured

  const entityConfig = useMemo(() => ({
    entitySDK: InsuredPerson,
    entityName: t('insurance.insuredPersons.entityNameSingular', { defaultValue: 'Insured Person' }),
    entityNamePlural: t('insurance.insuredPersons.title', { defaultValue: 'Insured Persons' }),
    DialogComponent: InsuredPersonDialog,
    initialSort: [{ id: 'full_name', desc: false }],
    initialFilters: {
      searchTerm: '',
      gender: 'all',
      identificationType: 'all',
      // city: 'all', // If address based filtering is needed
    },
    searchFields: ['full_name', 'contact.email', 'contact.phone', 'identification.number', 'address.city'],
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        if (!(
          item.full_name?.toLowerCase().includes(term) ||
          item.contact?.email?.toLowerCase().includes(term) ||
          item.contact?.phone?.toLowerCase().includes(term) ||
          item.identification?.number?.toLowerCase().includes(term) ||
          item.address?.city?.toLowerCase().includes(term)
        )) return false;
      }
      if (filters.gender !== 'all' && item.gender !== filters.gender) return false;
      if (filters.identificationType !== 'all' && item.identification?.type !== filters.identificationType) return false;
      // if (filters.city !== 'all' && item.address?.city !== filters.city) return false;
      return true;
    },
    storageKey: 'insuredPersonsView',
  }), [t]);

  const {
    items: insuredPersons,
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
      const itemToEdit = insuredPersons.find(p => p.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit')}), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
    }
  }, [selectedItems, insuredPersons, handleEdit, setIsSelectionModeActive, t, toast, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      const firstItem = insuredPersons.find(p => p.id === selectedItems[0]);
      const itemName = selectedItems.length === 1 
        ? (firstItem?.full_name || entityConfig.entityName)
        : t('common.multipleItems', { count: selectedItems.length });
      setDeleteDialogState({
        isOpen: true,
        itemIds: selectedItems,
        itemName: itemName,
        message: t('common.confirmDeleteMessage', { count: selectedItems.length, itemName }),
        loading: false,
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete')}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete')}), variant: "info" });
    }
  }, [selectedItems, insuredPersons, setIsSelectionModeActive, t, toast, entityConfig.entityName]);
  
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
    { labelKey: 'insurance.insuredPersons.addNewPerson', defaultLabel: 'Add New Person', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: [0,1] },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'any' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import Persons', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export Persons', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const insuredPersonTableColumns = useMemo(() => [
    { accessorKey: 'full_name', header: t('fields.fullName', {defaultValue: 'Full Name'}), enableSorting: true },
    { 
      accessorKey: 'identification.number', 
      header: t('identification.number', {defaultValue: 'ID Number'}), 
      enableSorting: true,
      cell: ({row}) => row.original.identification?.number || t('common.notSet')
    },
    { 
      accessorKey: 'identification.type', 
      header: t('identification.type', {defaultValue: 'ID Type'}), 
      enableSorting: true,
      cell: ({row}) => t(`idType.${row.original.identification?.type}`, {defaultValue: row.original.identification?.type || t('common.notSet')})
    },
    { 
      accessorKey: 'gender', 
      header: t('common.gender', {defaultValue: 'Gender'}),
      cell: ({row}) => t(`gender.${row.original.gender}`, {defaultValue: row.original.gender || t('common.notSet')}),
      enableSorting: true 
    },
    { 
      accessorKey: 'contact.email', 
      header: t('common.email', {defaultValue: 'Email'}), 
      enableSorting: true,
      cell: ({row}) => row.original.contact?.email || t('common.notSet')
    },
    { 
      accessorKey: 'contact.phone', 
      header: t('common.phone', {defaultValue: 'Phone'}), 
      enableSorting: false, // Phone numbers often have varied formats
      cell: ({row}) => row.original.contact?.phone || t('common.notSet')
    },
    { 
      accessorKey: 'date_of_birth', 
      header: t('common.dateOfBirth', {defaultValue: 'Date of Birth'}),
      cell: ({row}) => formatSafeDateDistance(row.original.date_of_birth, language, { format: 'toLocaleDateString' }), // Using specific date format
      enableSorting: true 
    },
    { 
      accessorKey: 'updated_date', 
      header: t('fields.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({row}) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true 
    },
  ], [t, language]);
  
  const handleImportSubmit = useCallback(async (file) => {
    setIsImportDialogOpen(false);
    if (!file) {
      toast({ title: t('import.noFileTitle'), description: t('import.noFileDesc'), variant: "warning" });
      return;
    }
    // Placeholder for actual import logic
    toast({ title: t('import.comingSoonTitle'), description: t('import.featureNotImplemented', {entity: entityConfig.entityNamePlural }), variant: "info" });
  }, [toast, t, entityConfig.entityNamePlural]);

  const renderContent = () => {
    if (loading && insuredPersons.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    if (error && insuredPersons.length === 0) {
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
              icon={UserCog} // Changed icon to be more specific
              title={t('insurance.insuredPersons.noPersons', {defaultValue: "No Insured Persons Found"})}
              description={t('insurance.insuredPersons.noPersonsDesc', {defaultValue: "Start by adding a new insured person to manage their details."})}
              actionButton={<Button onClick={() => handleAddNew()}><Plus className="mr-2 h-4 w-4" />{t('insurance.insuredPersons.addNewPerson', {defaultValue: "Add New Person"})}</Button>}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('insurance.insuredPersons.noPersonsFilterTitle', {defaultValue: "No Insured Persons Match Filters"})}
              description={t('insurance.insuredPersons.noPersonsFilterDesc', {defaultValue: "Try adjusting your search or filter criteria."})}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {insuredPersons.map(person => (
                <InsuredPersonCard 
                  key={person.id} 
                  person={person} 
                  onEdit={() => handleEdit(person)}
                  isSelected={selectedItems.includes(person.id)}
                  onToggleSelection={() => handleToggleSelection(person.id)}
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
                columns={insuredPersonTableColumns}
                data={insuredPersons}
                loading={loading}
                error={error}
                onRetry={handleRefresh}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('insurance.insuredPersons.noPersonsDesc') : t('insurance.insuredPersons.noPersonsFilterDesc')}
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => handleSelectAll(insuredPersons.map(p => p.id))}
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
          <Users className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('insurance.insuredPersons.titleMultiple', { defaultValue: "Insured Persons" })}{' '}
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
                id="selectAllVisibleInsured"
                checked={selectedItems.length > 0 && insuredPersons.every(item => selectedItems.includes(item.id))}
                onCheckedChange={() => handleSelectAll(insuredPersons.map(item => item.id))}
                aria-label={t('bulkActions.selectAllVisible')}
                disabled={insuredPersons.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleInsured" className="text-sm font-medium text-blue-700 dark:text-blue-200">
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
      
      <InsuredPersonFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort}
        genderOptions={genderOptions(t)}
        identificationTypeOptions={identificationTypeOptions(t)}
        // cityOptions={cities.map(city => ({value: city, label: city}))} // Assuming cities is an array of strings
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      />

      {error && insuredPersons.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <InsuredPersonDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          person={currentItem}
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
          sampleHeaders={['Full Name', 'Date of Birth (YYYY-MM-DD)', 'Gender (male, female, other)', 'ID Type (national_id, insurance_number, passport)', 'ID Number', 'Email', 'Phone', 'Address Line', 'City']}
          language={language} isRTL={isRTL}
          t={t}
        />
      )}
    </div>
  );
}
