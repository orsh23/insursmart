
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BillOfMaterial } from '@/api/entities';
import { InsuranceCode } from '@/api/entities';
import { Material } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { useEntityModule } from '@/components/hooks/useEntityModule'; // Changed from default to named import
import DataTable from '@/components/shared/DataTable';
import BoMDialog from './bom-dialog';
import SearchFilterBar from '@/components/shared/SearchFilterBar';
import { Button } from '@/components/ui/button';
import GlobalActionButton from '@/components/common/GlobalActionButton'; // Corrected import path
import ViewSwitcher from '@/components/common/ViewSwitcher'; // Corrected import path
import { Plus, ListTree } from 'lucide-react';

// Utility functions for local storage
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Failed to load from storage", error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to storage", error);
  }
};


export default function BoMsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Fetch insurance codes and materials if needed for select options or display
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [fetchedICs, fetchedMaterials] = await Promise.all([
          InsuranceCode.list(),
          Material.list()
        ]);
        setInsuranceCodes(Array.isArray(fetchedICs) ? fetchedICs : []);
        setMaterials(Array.isArray(fetchedMaterials) ? fetchedMaterials : []);
      } catch (e) {
        console.error("Failed to fetch related data for BoM tab (Code Mgt)", e);
        toast({ title: t('errors.fetchDropdownError', {defaultValue: 'Failed to load options'}), description: e.message, variant: 'destructive'});
      }
    };
    fetchRelatedData();
  }, [t, toast]);

  const entityConfig = useMemo(() => ({
    entitySDK: BillOfMaterial,
    entityName: t('boms.entityNameSingular', {defaultValue: 'Bill of Material Line'}),
    entityNamePlural: t('boms.titlePlural', {defaultValue: 'Bills of Material (Code Mgt)'}),
    DialogComponent: BoMDialog,
    FormComponent: null, // Assuming BoMDialog handles the form directly
    initialFilters: {
      searchTerm: '', // For insurance_code_id or material_id perhaps
      page: 1,
      pageSize: 10,
    },
    filterFunction: (item, filters) => {
        if (filters.insurance_code_id_filter && item.insurance_code_id !== filters.insurance_code_id_filter) return false;
        if (filters.material_id_filter && item.material_id !== filters.material_id_filter) return false;
        // Search term filtering logic (example: searching notes or variant_label)
        if (filters.searchTerm) {
            const searchTermLower = filters.searchTerm.toLowerCase();
            const notesMatch = item.notes?.toLowerCase().includes(searchTermLower);
            const variantLabelMatch = item.variant_label?.toLowerCase().includes(searchTermLower);
            if (!notesMatch && !variantLabelMatch) return false;
        }
        return true;
    },
    defaultSort: '-created_date', // From original useCrudPage
    storageKey: 'bomsView', // Key for useEntityModule to store view preferences/filters
  }), [t]);

  const {
    items: boms,
    loading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    pagination,
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshBoMs,
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
    handleSubmit: handleFormSubmit,
    filteredAndSortedItems // Added this from useEntityModule
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('bomsView_viewPreference', 'table'));

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage('bomsView_viewPreference', passedView);
    }
  }, [passedView, currentView]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'boms.addNewLine', defaultLabel: 'Add BoM Line', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      // Assuming selectedItems are IDs here based on the outline's logic
      const itemToEdit = filteredAndSortedItems.find(it => it.id === selectedItems[0]);
      if(itemToEdit) handleEdit(itemToEdit);
      setIsSelectionModeActive(false);
      setSelectedItems([]);
    } else {
      toast({
        title: t('common.selectionErrorTitle', { defaultValue: 'Selection Error' }),
        description: t('common.selectionErrorEdit', { defaultValue: 'Please select exactly one item to edit.' }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, setSelectedItems, t, toast, filteredAndSortedItems]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteItems', { defaultValue: 'Are you sure you want to delete the selected items?' }))) {
        // Assuming selectedItems are IDs based on the outline's logic
        handleBulkDelete(selectedItems);
        setIsSelectionModeActive(false);
        setSelectedItems([]);
      }
    } else {
      toast({
        title: t('common.selectionErrorTitle', { defaultValue: 'Selection Error' }),
        description: t('common.selectionErrorDelete', { defaultValue: 'Please select at least one item to delete.' }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, setSelectedItems, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const getInsuranceCodeName = (id) => insuranceCodes.find(ic => ic.id === id)?.code || String(id);
  const getMaterialName = (id) => materials.find(m => m.id === id)?.name_en || String(id);


  const columns = React.useMemo(() => [
    { accessorKey: 'insurance_code_id', header: t('fields.insuranceCode', {defaultValue: 'Insurance Code'}), cell: ({ row }) => getInsuranceCodeName(row.original.insurance_code_id), sortable: true },
    { accessorKey: 'material_id', header: t('fields.material', {defaultValue: 'Material'}), cell: ({ row }) => getMaterialName(row.original.material_id), sortable: true },
    { accessorKey: 'variant_label', header: t('fields.variantLabel', {defaultValue: 'Variant'}) },
    { accessorKey: 'quantity_fixed', header: t('fields.quantity', {defaultValue: 'Qty'}) },
    { accessorKey: 'quantity_unit', header: t('fields.unit', {defaultValue: 'Unit'}) },
    {
      accessorKey: 'reimbursable_flag',
      header: t('fields.reimbursableShort', {defaultValue: 'Reimb?'}),
      cell: ({ row }) => row.original.reimbursable_flag ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'})
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>{t('buttons.edit', {defaultValue: 'Edit'})}</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>{t('buttons.delete', {defaultValue: 'Delete'})}</Button>
        </div>
      ),
    },
  ], [t, handleEdit, handleDelete, insuranceCodes, materials, getInsuranceCodeName, getMaterialName]);

  const filterFields = [
    { name: 'insurance_code_id_filter', label: t('fields.insuranceCode', {defaultValue: 'Insurance Code'}), type: 'select', options: insuranceCodes.map(ic => ({label: `${ic.code} - ${ic.name_en}`, value: ic.id})), valueKey: 'id'},
    { name: 'material_id_filter', label: t('fields.material', {defaultValue: 'Material'}), type: 'select', options: materials.map(m => ({label: m.name_en, value: m.id})), valueKey: 'id'},
  ];

  const renderContent = () => {
    return (
      <DataTable
        columns={columns}
        data={boms}
        isLoading={loading}
        error={error}
        onRetry={refreshBoMs}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        sortConfig={sortConfig}
        entityName={t('boms.titlePlural', {defaultValue: 'Bills of Material Lines'})}
        selectedItems={selectedItems}
        onToggleSelection={handleToggleSelection}
        onSelectAll={handleSelectAll}
        isSelectionModeActive={isSelectionModeActive}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <ListTree className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('boms.titlePlural', {defaultValue: 'Bills of Material (Code Mgt)'})} ({pagination.totalCount || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('boms.entityNameSingular', {defaultValue: 'Bill of Material Line'})}
                t={t}
              />
            <Button variant="outline" size="sm" onClick={refreshBoMs} disabled={loading}>
              <ListTree className="h-4 w-4 mr-2" />
              {t('common.refresh', {defaultValue: 'Refresh'})}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => {
                setCurrentView(view);
                saveToStorage('bomsView_viewPreference', view);
              }}
            />
        </div>
      </div>
      <SearchFilterBar
        filterFields={filterFields}
        currentFilters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchTerm={filters.searchTerm || ''}
        onAddNew={handleAddNew}
        addNewLabel={t('boms.addNewLine', {defaultValue: 'Add BoM Line'})}
        isLoading={loading}
      />
      {error && <div className="text-red-500">{error.message || t('errors.generic', {defaultValue: 'An error occurred'})}</div>}
      {loading && <div className="text-gray-500">{t('common.loading', {defaultValue: 'Loading...'})}</div>}

      {renderContent()}

      {isDialogOpen && (
        <BoMDialog
          open={isDialogOpen}
          onOpenChange={(open) => { // Combined open/close logic
              if (!open) { // If dialog is being closed
                handleSelfSubmittingDialogClose(false); // Call with false, as submission is handled by dialog
              } else {
                setIsDialogOpen(true); // Explicitly set to true if opened programmatically
              }
          }}
          bomData={currentItem}
          onSubmit={(formData, isNew) => { // Assuming dialog calls this
            handleFormSubmit(formData, isNew); // Call useEntityModule's submit
          }}
          isLoading={loading}
          insuranceCodes={insuranceCodes}
          materials={materials}
        />
      )}
    </div>
  );
}
