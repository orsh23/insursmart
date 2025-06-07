import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Material } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table';
import MaterialDialog from './material-dialog';
import SearchFilterBar from '@/components/shared/SearchFilterBar';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, Package, RefreshCcw } from 'lucide-react';

// Utility functions
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from storage for key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to storage for key "${key}":`, error);
  }
};

export default function MaterialsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: Material,
    entityName: t('materials.itemTitleSingular', {defaultValue: "Material"}),
    entityNamePlural: t('materials.itemTitlePlural', {defaultValue: "Materials"}),
    initialFilters: {
      searchTerm: '', 
      page: 1,
      pageSize: 10,
      unit_of_measure: '',
      is_active: '',
      has_variants: '',
    },
    filterFunction: (item, filters) => {
      const { searchTerm, unit_of_measure, is_active, has_variants } = filters;

      // Search term logic (case-insensitive)
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchesNameEn = item.name_en?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesNameHe = item.name_he?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDescEn = item.description_en?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDescHe = item.description_he?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm));
        
        if (!matchesNameEn && !matchesNameHe && !matchesDescEn && !matchesDescHe && !matchesTags) {
          return false;
        }
      }

      // Filter by unit of measure
      if (unit_of_measure && item.unit_of_measure !== unit_of_measure) {
        return false;
      }

      // Filter by active status
      if (is_active !== '' && Boolean(item.is_active) !== Boolean(is_active === 'true')) {
        return false;
      }

      // Filter by has variants
      if (has_variants !== '' && Boolean(item.has_variants) !== Boolean(has_variants === 'true')) {
        return false;
      }

      return true;
    },
    storageKey: 'materialsView',
  }), [t]);

  const {
    items: materials,
    loading, 
    error, 
    filters, 
    setFilters, 
    sortConfig, 
    setSortConfig, 
    pagination,
    handleRefresh: refreshMaterials, 
    handleSearch, 
    handleFilterChange, 
    handleSortChange,
    handlePageChange, 
    handlePageSizeChange,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('materialsView_viewPreference', 'table'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  useEffect(() => {
    saveToStorage('materialsView_viewPreference', currentView);
  }, [currentView]);

  const handleAddNew = useCallback(() => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (itemId) => {
    try {
      await Material.delete(itemId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('materials.deleteSuccess', { defaultValue: 'Material deleted successfully.' }),
      });
      refreshMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('materials.deleteError', { defaultValue: 'Failed to delete material.' }),
        variant: 'destructive',
      });
    }
  }, [t, toast, refreshMaterials]);

  const handleBulkDelete = useCallback(async (itemIds) => {
    try {
      await Promise.all(itemIds.map(id => Material.delete(id)));
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('materials.bulkDeleteSuccess', { 
          count: itemIds.length,
          defaultValue: `Successfully deleted ${itemIds.length} materials.`
        }),
      });
      refreshMaterials();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('materials.bulkDeleteError', { defaultValue: 'Failed to delete some materials.' }),
        variant: 'destructive',
      });
    }
  }, [t, toast, refreshMaterials]);

  const handleDialogClose = useCallback(async (result) => {
    if (result) {
      try {
        if (currentItem) {
          await Material.update(currentItem.id, result);
          toast({
            title: t('common.success', { defaultValue: 'Success' }),
            description: t('materials.updateSuccess', { defaultValue: 'Material updated successfully.' }),
          });
        } else {
          await Material.create(result);
          toast({
            title: t('common.success', { defaultValue: 'Success' }),
            description: t('materials.createSuccess', { defaultValue: 'Material created successfully.' }),
          });
        }
        refreshMaterials();
      } catch (error) {
        console.error('Save error:', error);
        toast({
          title: t('common.error', { defaultValue: 'Error' }),
          description: t('common.saveError', { defaultValue: 'Failed to save material.' }),
          variant: 'destructive',
        });
      }
    }
    setIsDialogOpen(false);
    setCurrentItem(null);
  }, [currentItem, t, toast, refreshMaterials]);

  const handleToggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allVisibleIds = materials.map(item => item.id);
    setSelectedItems(allVisibleIds);
  }, [materials]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'materials.addMaterial', defaultLabel: 'Add Material', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const item = materials.find(m => m.id === selectedItems[0]);
      if (item) {
        handleEdit(item);
        setIsSelectionModeActive(false);
      }
    } else {
      toast({
        title: t('common.editErrorTitle', { defaultValue: 'Edit Error' }),
        description: t('common.selectOneItemEdit', { defaultValue: 'Please select only one item to edit.' }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, materials, handleEdit, setIsSelectionModeActive, t, toast]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems);
      setIsSelectionModeActive(false);
    } else {
      toast({
        title: t('common.deleteErrorTitle', { defaultValue: 'Delete Error' }),
        description: t('common.selectItemDelete', { defaultValue: 'Please select items to delete.' }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, []);

  const columns = useMemo(() => [
    { 
      accessorKey: 'name_en', 
      header: t('fields.nameEn', {defaultValue: 'Name (EN)'}), 
      cell: ({row}) => row.original.name_en || 'N/A',
      enableSorting: true 
    },
    { 
      accessorKey: 'name_he', 
      header: t('fields.nameHe', {defaultValue: 'Name (HE)'}), 
      cell: ({row}) => row.original.name_he || 'N/A',
      enableSorting: true 
    },
    { 
      accessorKey: 'unit_of_measure', 
      header: t('fields.unitOfMeasure', {defaultValue: 'Unit'}), 
      cell: ({row}) => t(`units.${row.original.unit_of_measure}`, {defaultValue: row.original.unit_of_measure}),
      enableSorting: true 
    },
    { 
      accessorKey: 'has_variants', 
      header: t('fields.hasVariants', {defaultValue: 'Variants'}), 
      cell: ({row}) => row.original.has_variants ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'}),
      enableSorting: true 
    },
    { 
      accessorKey: 'is_active', 
      header: t('fields.status', {defaultValue: 'Status'}), 
      cell: ({row}) => row.original.is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'}),
      enableSorting: true 
    },
    { 
      accessorKey: 'updated_date', 
      header: t('fields.updated', {defaultValue: 'Updated'}), 
      cell: ({ row }) => row.original.updated_date ? format(new Date(row.original.updated_date), 'PP') : 'N/A',
      enableSorting: true 
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>
            {t('buttons.edit', {defaultValue: 'Edit'})}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            {t('buttons.delete', {defaultValue: 'Delete'})}
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [t, handleEdit, handleDelete, language]);

  const filterContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium">{t('fields.unitOfMeasure', {defaultValue: 'Unit of Measure'})}</label>
        <select 
          value={filters.unit_of_measure || ''} 
          onChange={(e) => handleFilterChange({unit_of_measure: e.target.value})}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">{t('filters.allUnits', {defaultValue: 'All Units'})}</option>
          <option value="unit">{t('units.unit', {defaultValue: 'Unit'})}</option>
          <option value="mg">{t('units.mg', {defaultValue: 'mg'})}</option>
          <option value="ml">{t('units.ml', {defaultValue: 'ml'})}</option>
          <option value="g">{t('units.g', {defaultValue: 'g'})}</option>
          <option value="kg">{t('units.kg', {defaultValue: 'kg'})}</option>
          <option value="box">{t('units.box', {defaultValue: 'Box'})}</option>
          <option value="pack">{t('units.pack', {defaultValue: 'Pack'})}</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t('fields.status', {defaultValue: 'Status'})}</label>
        <select 
          value={filters.is_active || ''} 
          onChange={(e) => handleFilterChange({is_active: e.target.value})}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">{t('filters.allStatuses', {defaultValue: 'All Statuses'})}</option>
          <option value="true">{t('status.active', {defaultValue: 'Active'})}</option>
          <option value="false">{t('status.inactive', {defaultValue: 'Inactive'})}</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t('fields.hasVariants', {defaultValue: 'Has Variants'})}</label>
        <select 
          value={filters.has_variants || ''} 
          onChange={(e) => handleFilterChange({has_variants: e.target.value})}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">{t('filters.all', {defaultValue: 'All'})}</option>
          <option value="true">{t('common.yes', {defaultValue: 'Yes'})}</option>
          <option value="false">{t('common.no', {defaultValue: 'No'})}</option>
        </select>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <div className="text-center py-8 text-red-500">{error}</div>;
    }
    if (!materials || materials.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('common.noItemsFound', {defaultValue: 'No items found.'})}</div>;
    }

    switch (currentView) {
      case 'table':
      default:
        return (
          <DataTable
            columns={columns}
            data={materials}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            currentSort={sortConfig}
            entityName={t('materials.titlePlural', {defaultValue: 'Materials'})}
            isSelectionModeActive={isSelectionModeActive}
            selectedRowIds={new Set(selectedItems)}
            onRowSelectionChange={handleToggleSelection}
            onSelectAllRows={handleSelectAll}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Package className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('materials.title', {defaultValue: 'Materials'})} ({materials?.length || 0})
        </h3>
        <div className="flex items-center gap-2">
          <GlobalActionButton
            actionsConfig={memoizedGlobalActionsConfig}
            onEditItems={handleEditWithSelectionCheck}
            onDeleteItems={handleDeleteWithSelectionCheck}
            isSelectionModeActive={isSelectionModeActive}
            onCancelSelectionMode={handleCancelSelectionMode}
            selectedItemCount={selectedItems.length}
            itemTypeForActions={t('materials.itemTitleSingular', {defaultValue: "Material"})}
            t={t}
          />
          <Button variant="outline" size="sm" onClick={refreshMaterials} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', {defaultValue: 'Refresh'})}
          </Button>
          <ViewSwitcher 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            availableViews={['table']}
            entityName="materials"
          />
        </div>
      </div>

      <SearchFilterBar
        searchQuery={filters.searchTerm}
        onSearch={handleSearch}
        searchPlaceholder={t('materials.searchPlaceholder', {defaultValue: 'Search materials...'})}
        filterContent={filterContent}
        onReset={() => setFilters({
          searchTerm: '', unit_of_measure: '', is_active: '', has_variants: '', page: 1, pageSize: 10,
        })}
        isRTL={isRTL}
      />

      {renderContent()}

      {isDialogOpen && (
        <MaterialDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          materialData={currentItem}
          onSubmit={handleDialogClose}
          isLoading={loading}
        />
      )}
    </div>
  );
}