import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MaterialsBoM } from '@/api/entities'; 
import { MedicalCode } from '@/api/entities';
import { Material } from '@/api/entities'; 
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
import DataTable from '@/components/shared/DataTable';
import MaterialsBoMDialog from './bom-dialog'; 
import SearchFilterBar from '@/components/shared/SearchFilterBar';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, Boxes, RefreshCcw } from 'lucide-react';

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

export default function MaterialsBoMsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [procedureCodesMap, setProcedureCodesMap] = useState({});
  const [materialsMap, setMaterialsMap] = useState({});

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [codes, fetchedMaterials] = await Promise.all([
            MedicalCode.list(),
            Material.list()
        ]);
        
        const pCodesMap = {};
        (Array.isArray(codes) ? codes : []).forEach(code => {
          pCodesMap[code.code] = `${code.code} (${code.description_en?.substring(0,30) || 'N/A'}...)`;
        });
        setProcedureCodesMap(pCodesMap);

        const matsMap = {};
        (Array.isArray(fetchedMaterials) ? fetchedMaterials : []).forEach(mat => {
          matsMap[mat.id] = mat.name_en || mat.name_he || mat.id;
        });
        setMaterialsMap(matsMap);

      } catch (err) {
        console.error("Failed to fetch related data for Materials BoM tab", err);
        toast({ 
          title: t('errors.fetchDropdownError', {defaultValue: 'Failed to load options'}), 
          description: err.message, 
          variant: 'destructive'
        });
      }
    };
    fetchRelatedData();
  }, [t, toast]);
  
  const getProcedureCodeDisplay = (code) => procedureCodesMap[code] || code;
  const getMaterialDisplay = (materialId) => materialsMap[materialId] || materialId;

  const entityConfig = useMemo(() => ({
    entitySDK: MaterialsBoM, 
    entityName: t('materialsBoMs.itemTitleSingular', {defaultValue: "Material BoM"}),
    entityNamePlural: t('materialsBoMs.itemTitlePlural', {defaultValue: "Material BoMs"}),
    initialFilters: {
      searchTerm: '', 
      page: 1,
      pageSize: 10,
      procedure_code_filter: '',
      status: '',
    },
    filterFunction: (item, filters) => {
        const { searchTerm, procedure_code_filter, status } = filters;

        // Search term logic (case-insensitive)
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const matchesProcedureCode = item.procedure_code?.toLowerCase().includes(lowerCaseSearchTerm);
            const matchesVersion = item.version?.toLowerCase().includes(lowerCaseSearchTerm);
            const matchesMaterials = item.materials?.some(mat => {
                const materialName = materialsMap[mat.material_id]?.toLowerCase() || ''; 
                return materialName.includes(lowerCaseSearchTerm) || String(mat.quantity).includes(lowerCaseSearchTerm);
            });
            if (!matchesProcedureCode && !matchesVersion && !matchesMaterials) {
                return false;
            }
        }

        // Filter by procedure_code_filter
        if (procedure_code_filter && item.procedure_code !== procedure_code_filter) {
            return false;
        }

        // Filter by status
        if (status && item.status !== status) {
            return false;
        }

        return true;
    },
    storageKey: 'materialsBoMsView',
  }), [t, materialsMap]);

  const {
    items: boms,
    loading, 
    error, 
    filters, 
    setFilters, 
    sortConfig, 
    setSortConfig, 
    pagination,
    handleRefresh: refreshBoMs, 
    handleSearch, 
    handleFilterChange, 
    handleSortChange,
    handlePageChange, 
    handlePageSizeChange,
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('materialsBoMsView_viewPreference', 'table'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  useEffect(() => {
    saveToStorage('materialsBoMsView_viewPreference', currentView);
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
      await MaterialsBoM.delete(itemId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('materialsBoMs.deleteSuccess', { defaultValue: 'Material BoM deleted successfully.' }),
      });
      refreshBoMs();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('materialsBoMs.deleteError', { defaultValue: 'Failed to delete material BoM.' }),
        variant: 'destructive',
      });
    }
  }, [t, toast, refreshBoMs]);

  const handleBulkDelete = useCallback(async (itemIds) => {
    try {
      await Promise.all(itemIds.map(id => MaterialsBoM.delete(id)));
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('materialsBoMs.bulkDeleteSuccess', { 
          count: itemIds.length,
          defaultValue: `Successfully deleted ${itemIds.length} material BoMs.`
        }),
      });
      refreshBoMs();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('materialsBoMs.bulkDeleteError', { defaultValue: 'Failed to delete some material BoMs.' }),
        variant: 'destructive',
      });
    }
  }, [t, toast, refreshBoMs]);

  const handleDialogClose = useCallback(async (result) => {
    if (result) {
      try {
        if (currentItem) {
          await MaterialsBoM.update(currentItem.id, result);
          toast({
            title: t('common.success', { defaultValue: 'Success' }),
            description: t('materialsBoMs.updateSuccess', { defaultValue: 'Material BoM updated successfully.' }),
          });
        } else {
          await MaterialsBoM.create(result);
          toast({
            title: t('common.success', { defaultValue: 'Success' }),
            description: t('materialsBoMs.createSuccess', { defaultValue: 'Material BoM created successfully.' }),
          });
        }
        refreshBoMs();
      } catch (error) {
        console.error('Save error:', error);
        toast({
          title: t('common.error', { defaultValue: 'Error' }),
          description: t('common.saveError', { defaultValue: 'Failed to save material BoM.' }),
          variant: 'destructive',
        });
      }
    }
    setIsDialogOpen(false);
    setCurrentItem(null);
  }, [currentItem, t, toast, refreshBoMs]);

  const handleToggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allVisibleIds = boms.map(item => item.id);
    setSelectedItems(allVisibleIds);
  }, [boms]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'materialsBoMs.addBoM', defaultLabel: 'Add Material BoM', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const item = boms.find(b => b.id === selectedItems[0]);
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
  }, [selectedItems, boms, handleEdit, setIsSelectionModeActive, t, toast]);

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
      accessorKey: 'procedure_code', 
      header: t('fields.procedureCode', {defaultValue: 'Procedure Code'}), 
      cell: ({row}) => getProcedureCodeDisplay(row.original.procedure_code), 
      enableSorting: true 
    },
    { 
        accessorKey: 'materials', 
        header: t('fields.numMaterials', {defaultValue: '# Materials'}), 
        cell: ({row}) => {
            if (!row.original.materials || !Array.isArray(row.original.materials)) return 0;
            const materialNames = row.original.materials.slice(0, 2).map(m => `${getMaterialDisplay(m.material_id)} (Qty: ${m.quantity})`).join(', ');
            return row.original.materials.length > 2 ? `${materialNames}... (+${row.original.materials.length - 2})` : materialNames || 'None';
        },
        enableSorting: false,
    },
    { 
      accessorKey: 'version', 
      header: t('fields.version', {defaultValue: 'Version'}), 
      enableSorting: true 
    },
    { 
      accessorKey: 'effective_date', 
      header: t('fields.effectiveDate', {defaultValue: 'Effective Date'}), 
      cell: ({ row }) => row.original.effective_date ? format(new Date(row.original.effective_date), 'PP') : 'N/A',
      enableSorting: true 
    },
    { 
      accessorKey: 'status', 
      header: t('fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => t(`status.${row.original.status}`, {defaultValue: row.original.status}),
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
  ], [t, handleEdit, handleDelete, language, procedureCodesMap, materialsMap, getProcedureCodeDisplay, getMaterialDisplay]);

  const filterContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium">{t('fields.procedureCode', {defaultValue: 'Procedure Code'})}</label>
        <select 
          value={filters.procedure_code_filter || ''} 
          onChange={(e) => handleFilterChange({procedure_code_filter: e.target.value})}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">{t('filters.allProcedureCodes', {defaultValue: 'All Procedure Codes'})}</option>
          {Object.entries(procedureCodesMap).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t('fields.status', {defaultValue: 'Status'})}</label>
        <select 
          value={filters.status || ''} 
          onChange={(e) => handleFilterChange({status: e.target.value})}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">{t('filters.allStatuses', {defaultValue: 'All Statuses'})}</option>
          <option value="draft">{t('status.draft', {defaultValue: 'Draft'})}</option>
          <option value="active">{t('status.active', {defaultValue: 'Active'})}</option>
          <option value="deprecated">{t('status.deprecated', {defaultValue: 'Deprecated'})}</option>
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
    if (!boms || boms.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('common.noItemsFound', {defaultValue: 'No items found.'})}</div>;
    }

    switch (currentView) {
      case 'table':
      default:
        return (
          <DataTable
            columns={columns}
            data={boms}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            currentSort={sortConfig}
            entityName={t('materialsBoMs.titlePlural', {defaultValue: 'Materials Bills of Material'})}
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
          <Boxes className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('materialsBoMs.title', {defaultValue: 'Material Bills of Material'})} ({boms?.length || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('materialsBoMs.itemTitleSingular', {defaultValue: "Material BoM"})}
                t={t}
              />
            <Button variant="outline" size="sm" onClick={refreshBoMs} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh', {defaultValue: 'Refresh'})}
            </Button>
            <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} availableViews={['table']} entityName="materialsBoMs" />
        </div>
      </div>

      <SearchFilterBar
        searchQuery={filters.searchTerm}
        onSearch={handleSearch}
        searchPlaceholder={t('materialsBoMs.searchPlaceholder', {defaultValue: 'Search material BoMs...'})}
        filterContent={filterContent}
        onReset={() => setFilters({
          searchTerm: '', procedure_code_filter: '', status: '', page: 1, pageSize: 10,
        })}
        isRTL={isRTL}
      />

      {renderContent()}

      {isDialogOpen && (
        <MaterialsBoMDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          bomData={currentItem}
          onSubmit={handleDialogClose}
          isLoading={loading} 
          materials={Object.entries(materialsMap).map(([id, name_en])=>({id, name_en}))} 
          procedureCodes={Object.entries(procedureCodesMap).map(([code, name])=>({code, name}))}
        />
      )}
    </div>
  );
}