
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BillOfMaterial } from '@/api/entities';
import { Material } from '@/api/entities'; // Added from outline
import { InsuranceCode } from '@/api/entities'; // Added from outline
import BoMDialog from './bom-dialog';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import useEntityModule from '@/components/hooks/useEntityModule'; // Changed from original
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Search, RefreshCw, FilterX, AlertTriangle, Pencil, ListChecks, Wrench, CheckCircle2, Edit, Trash2, UploadCloud, DownloadCloud, SearchX, Package } from 'lucide-react'; // Added Package from outline
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import StatusBadge from '@/components/common/StatusBadge';
// Corrected DataTable import path
import DataTable from '@/components/ui/data-table'; // Fixed import path as per outline
import BomFilterBar from './BomFilterBar';
import ViewSwitcher from '@/components/common/ViewSwitcher'; // Retained, although not used for BoMs explicitly, it's part of the original structure.
import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';


const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Re-using existing option structures
const quantityTypeOptions = (t) => [
  { value: 'all', label: t('filters.allQuantityTypes', { defaultValue: 'All Quantity Types' }) },
  { value: 'fixed', label: t('boms.quantityTypes.fixed', { defaultValue: 'Fixed' }) },
  { value: 'range', label: t('boms.quantityTypes.range', { defaultValue: 'Range' }) },
  { value: 'average', label: t('boms.quantityTypes.average', { defaultValue: 'Average' }) },
];

const usageTypeOptions = (t) => [
  { value: 'all', label: t('filters.allUsageTypes', { defaultValue: 'All Usage Types' }) },
  { value: 'required', label: t('boms.usageTypes.required', { defaultValue: 'Required' }) },
  { value: 'optional', label: t('boms.usageTypes.optional', { defaultValue: 'Optional' }) },
  { value: 'rare', label: t('boms.usageTypes.rare', { defaultValue: 'Rare' }) },
  { value: 'conditional', label: t('boms.usageTypes.conditional', { defaultValue: 'Conditional' }) },
];

const booleanFilterOptions = (t, fieldNameKey, trueLabelKey, falseLabelKey) => [
  { value: 'all', label: t(`filters.all${fieldNameKey.charAt(0).toUpperCase() + fieldNameKey.slice(1)}`, { defaultValue: `All (${t(fieldNameKey)})` }) },
  { value: 'true', label: t(trueLabelKey, { defaultValue: `${t(fieldNameKey)}: Yes` }) },
  { value: 'false', label: t(falseLabelKey, { defaultValue: `${t(fieldNameKey)}: No` }) },
];

const sortOptionsConfig = (t) => [
  { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
  { value: 'insurance_code_id', label: t('sortOptions.insuranceCode', { defaultValue: 'Insurance Code' }) },
  { value: 'material_id', label: t('sortOptions.material', { defaultValue: 'Material' }) },
  { value: 'quantity_type', label: t('sortOptions.quantityType', { defaultValue: 'Quantity Type' }) },
  { value: 'usage_type', label: t('sortOptions.usageType', { defaultValue: 'Usage Type' }) },
  { value: 'reimbursable_flag', label: t('sortOptions.reimbursable', { defaultValue: 'Reimbursable' }) },
];

const ErrorDisplay = ({ errorMessage, onRetry }) => (
  <div className="text-center py-8 text-red-500 dark:text-red-400">
    <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
    <h3 className="mt-2 text-lg font-medium">{errorMessage || "An unexpected error occurred."}</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please try again.</p>
    {onRetry && (
      <Button onClick={onRetry} className="mt-4" variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" /> Retry
      </Button>
    )}
  </div>
);


export default function BoMsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  // State for dynamic dropdown options - fetched from Material and InsuranceCode entities
  const [allInsuranceCodes, setAllInsuranceCodes] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);

  // Memoized options for filter dropdowns, based on fetched data
  const insuranceCodeOptions = useMemo(() => 
    allInsuranceCodes.map(ic => ({ value: ic.id, label: `${ic.code ? `${ic.code} - ` : ''}${getLocalizedValue(ic, 'name', language)}` }))
  , [allInsuranceCodes, language]);

  const materialOptions = useMemo(() => 
    allMaterials.map(m => ({ value: m.id, label: getLocalizedValue(m, 'name', language) }))
  , [allMaterials, language]);

  // Fetch auxiliary data (Materials, Insurance Codes)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [materialsData, insuranceCodesData] = await Promise.all([
        Material.list(),
        InsuranceCode.list()
      ]);
      setAllMaterials(Array.isArray(materialsData) ? materialsData : []);
      setAllInsuranceCodes(Array.isArray(insuranceCodesData) ? insuranceCodesData : []);
    } catch (error) {
      console.error('Error fetching auxiliary data:', error);
      toast({
        title: t('errors.fetchFailedTitle', { defaultValue: 'Loading Error' }),
        description: t('errors.fetchAuxiliaryData', { defaultValue: 'Could not load materials and insurance codes for filters.' }),
        variant: "warning"
      });
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);


  const entityConfig = useMemo(() => ({
    entitySDK: BillOfMaterial,
    entityName: t('boms.entityNameSingular', { defaultValue: 'Bill of Material' }),
    entityNamePlural: t('boms.titleMultiple', { defaultValue: 'Bills of Material' }),
    DialogComponent: BoMDialog,
    initialSort: [{ id: 'insurance_code_id', desc: false }], // Changed initial sort as per outline
    initialFilters: {
      searchTerm: '', // General search for insurance code or material variant label/code
      insuranceCodeId: 'all',
      materialId: 'all',
      quantityType: 'all',
      usageType: 'all',
      reimbursableFlag: 'all',
    },
    searchFields: ['insurance_code_id', 'material_id', 'variant_label', 'variant_code', 'notes'], // Example fields for basic search
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        const insuranceCodeMatch = insuranceCodeOptions.find(opt => opt.value === item.insurance_code_id)?.label.toLowerCase().includes(term);
        const materialMatch = materialOptions.find(opt => opt.value === item.material_id)?.label.toLowerCase().includes(term);
        const variantLabelMatch = item.variant_label?.toLowerCase().includes(term);
        const variantCodeMatch = item.variant_code?.toLowerCase().includes(term);
        const notesMatch = item.notes?.toLowerCase().includes(term);
        if (!(insuranceCodeMatch || materialMatch || variantLabelMatch || variantCodeMatch || notesMatch)) return false;
      }
      if (filters.insuranceCodeId !== 'all' && item.insurance_code_id !== filters.insuranceCodeId) return false;
      if (filters.materialId !== 'all' && item.material_id !== filters.materialId) return false;
      if (filters.quantityType !== 'all' && item.quantity_type !== filters.quantityType) return false;
      if (filters.usageType !== 'all' && item.usage_type !== filters.usageType) return false;
      if (filters.reimbursableFlag !== 'all' && String(item.reimbursable_flag) !== filters.reimbursableFlag) return false;
      return true;
    },
    storageKey: 'bomsView',
  }), [t, language, insuranceCodeOptions, materialOptions]);

  const {
    items: boms, // paginated items
    loading, error, filters,
    sortConfig = [], // Ensure this is always an array
    pagination,
    selectedItems, setSelectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshBoMsInternal, // Renamed to avoid collision with custom refresh
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // All items after filtering and sorting
  } = useEntityModule(entityConfig) || {}; // Added || {} for safer destructuring

  // Ensure sortConfig is always an array for DataTable
  const safeSortConfig = useMemo(() => {
    return Array.isArray(sortConfig) ? sortConfig : [];
  }, [sortConfig]);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'table')); // Default to table for BoMs

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const refreshBoMs = useCallback((forceRefreshAuxiliary = false) => {
    if (forceRefreshAuxiliary) {
      fetchAuxiliaryData();
    }
    refreshBoMsInternal();
  }, [fetchAuxiliaryData, refreshBoMsInternal]);

  const resetFiltersAndSort = useCallback(() => {
    handleFilterChange(null, entityConfig.initialFilters);
    handleSortChange(entityConfig.initialSort);
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, setIsSelectionModeActive, setSelectedItems]);


  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(item => item.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle', { defaultValue: 'Item Not Found' }), description: t('errors.itemNotFoundToEditDesc', { defaultValue: 'The selected item could not be found for editing.' }), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.edit', { defaultValue: 'Edit' }), defaultValue: 'Selection Mode Active for Edit' }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.edit', { defaultValue: 'Edit' }), defaultValue: 'Please select items to edit.' }), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', { defaultValue: 'Select Only One Item' }), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName, defaultValue: `Please select only one ${entityConfig.entityName} to edit.` }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural, defaultValue: `Are you sure you want to delete ${selectedItems.length} ${entityConfig.entityNamePlural}?` }))) {
        handleBulkDelete(selectedItems);
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.delete', { defaultValue: 'Delete' }), defaultValue: 'Selection Mode Active for Delete' }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.delete', { defaultValue: 'Delete' }), defaultValue: 'Please select items to delete.' }), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'boms.addNewBoM', defaultLabel: 'Add New BoM', icon: Plus, action: handleAddNew, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import BoMs', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon!' }), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import', { defaultValue: 'Import' }), defaultValue: `The ${t('buttons.import', { defaultValue: 'Import' })} feature is coming soon.` }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export BoMs', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon!' }), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export', { defaultValue: 'Export' }), defaultValue: `The ${t('buttons.export', { defaultValue: 'Export' })} feature is coming soon.` }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const handleDialogCloseWrapper = useCallback((refreshNeeded, actionType = null, entityName = '') => {
    handleSelfSubmittingDialogClose(refreshNeeded, actionType, entityName);
  }, [handleSelfSubmittingDialogClose]);

  const getQuantityDisplay = (item) => {
    switch (item.quantity_type) {
      case 'fixed': return `${item.quantity_fixed || 1} ${item.quantity_unit || t('common.item', { defaultValue: 'item' })}`;
      case 'range': return `${item.quantity_min || t('common.notSet', { defaultValue: 'N/A' })} - ${item.quantity_max || t('common.notSet', { defaultValue: 'N/A' })} ${item.quantity_unit || t('common.item', { defaultValue: 'item' })}`;
      case 'average': return `~${item.quantity_avg || t('common.notSet', { defaultValue: 'N/A' })} ${item.quantity_unit || t('common.item', { defaultValue: 'item' })}`;
      default: return t('common.notSet', { defaultValue: 'Not Set' });
    }
  };

  const bomTableColumns = useMemo(() => [
    {
      accessorKey: 'insurance_code_id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('boms.fields.insuranceCode', { defaultValue: 'Insurance Code' })}
          {column.getIsSorted() === "asc" ? <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↑</span> : column.getIsSorted() === "desc" ? <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↓</span> : <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↕</span>}
        </Button>
      ),
      cell: ({ row }) => {
        const codeId = row.original?.insurance_code_id;
        if (!codeId) return t('common.notSet', { defaultValue: 'N/A' });
        
        const insuranceCode = allInsuranceCodes?.find(ic => ic.id === codeId);
        return insuranceCode ? getLocalizedValue(insuranceCode, 'name', language, 'en', codeId) : codeId;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'material_id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('boms.fields.material', { defaultValue: 'Material' })}
          {column.getIsSorted() === "asc" ? <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↑</span> : column.getIsSorted() === "desc" ? <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↓</span> : <span className={`ml-1 ${isRTL ? 'rtl' : ''}`}>↕</span>}
        </Button>
      ),
      cell: ({ row }) => {
        const materialId = row.original?.material_id;
        if (!materialId) return t('common.notSet', { defaultValue: 'N/A' });
        
        const material = allMaterials?.find(m => m.id === materialId);
        return material ? getLocalizedValue(material, 'name', language, 'en', materialId) : materialId;
      },
      enableSorting: true,
    },
    { accessorKey: 'variant_label', header: t('boms.fields.variant', { defaultValue: 'Variant' }), enableSorting: true, cell: ({ row }) => row.original.variant_label || t('common.notSet', { defaultValue: 'N/A' }) },
    {
      accessorKey: 'quantity_fixed', // Base for sorting, cell displays formatted quantity
      header: t('boms.fields.quantity', { defaultValue: 'Quantity' }),
      cell: ({ row }) => getQuantityDisplay(row.original),
      enableSorting: true // Sorting might be on fixed quantity or needs custom logic based on type
    },
    {
      accessorKey: 'usage_type',
      header: t('boms.fields.usageType', { defaultValue: 'Usage Type' }),
      enableSorting: true,
      cell: ({ row }) => t(`boms.usageTypes.${row.original.usage_type}`, { defaultValue: row.original.usage_type })
    },
    {
      accessorKey: 'reimbursable_flag',
      header: t('boms.fields.reimbursable', { defaultValue: 'Reimbursable' }),
      cell: ({ row }) => <StatusBadge status={row.original.reimbursable_flag ? 'active' : 'inactive'} t={t} statusTypes={{ active: { label: t('common.yes', { defaultValue: 'Yes' }), color: 'success' }, inactive: { label: t('common.no', { defaultValue: 'No' }), color: 'outline' } }} />,
      enableSorting: true
    },
    {
      accessorKey: 'updated_date',
      header: t('fields.lastUpdated', { defaultValue: 'Last Updated' }),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true
    },
  ], [t, language, allInsuranceCodes, allMaterials, isRTL]);

  const currentSortOptionValue = useMemo(() => {
    if (!safeSortConfig || safeSortConfig.length === 0) return `-${entityConfig.initialSort[0].id}`;
    const currentSort = safeSortConfig[0];
    return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
  }, [safeSortConfig, entityConfig.initialSort]);

  const handleSortFilterChange = (value) => {
    const isDesc = value.startsWith('-');
    const field = isDesc ? value.substring(1) : value;
    handleSortChange([{ id: field, desc: isDesc }]);
  };


  // The renderContent logic has been inlined and adjusted based on the outline's implied structure.
  // The original renderContent function is removed.

  const noItems = pagination.totalCount === 0;
  const hasFiltersApplied = useMemo(() => Object.entries(filters || {}).some(([key, val]) => {
    if (key === 'searchTerm') return !!val;
    return val !== 'all' && val !== undefined && val !== null;
  }), [filters]);


  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <ListChecks className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('boms.listTitle', { defaultValue: "Bills of Material" })}{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({loading && boms.length === 0 ? t('common.loadingEllipsis', { defaultValue: 'Loading...' }) : pagination.totalCount || 0})
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
          <Button onClick={() => refreshBoMs(true)} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', { defaultValue: "Refresh" })}
          </Button>
          {/* No ViewSwitcher for BoMs for now, table is primary view */}
        </div>
      </div>

      <BomFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={resetFiltersAndSort}
        sortOptionValue={currentSortOptionValue}
        onSortOptionChange={handleSortFilterChange}
        sortOptions={sortOptionsConfig(t)}
        insuranceCodeOptions={insuranceCodeOptions}
        materialOptions={materialOptions}
        quantityTypeOptions={quantityTypeOptions(t)}
        usageTypeOptions={usageTypeOptions(t)}
        reimbursableOptions={booleanFilterOptions(t, 'reimbursable', 'filters.reimbursableTrue', 'filters.reimbursableFalse')}
        t={t} language={language} isRTL={isRTL}
        loading={loading}
      />

      {error && boms.length > 0 && (
        <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error), defaultValue: `Failed to load all ${entityConfig.entityNamePlural}. Some data might be missing: ${String(error.message || error)}` })}</span>
        </div>
      )}

      {loading && boms.length === 0 && !error ? (
        <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural, defaultValue: `Loading ${entityConfig.entityNamePlural}...` })} isFullScreen={false} />
      ) : error && boms.length === 0 ? (
        <ErrorDisplay errorMessage={error.message || String(error)} onRetry={() => refreshBoMs(true)} />
      ) : noItems && !hasFiltersApplied ? (
        <EmptyState
          icon={ListChecks}
          title={t('boms.emptyState.noBoMsTitle', { defaultValue: 'No Bills of Material Found' })}
          description={t('boms.emptyState.noBoMsDesc', { defaultValue: 'Get started by adding a new Bill of Material.' })}
          actionButton={<Button onClick={() => handleAddNew()} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"><Plus className="mr-2 h-4 w-4" />{t('boms.addNewBoM', { defaultValue: 'Add New BoM' })}</Button>}
        />
      ) : noItems && hasFiltersApplied ? (
        <EmptyState
          icon={SearchX}
          title={t('boms.emptyState.noBoMsMatchTitle', { defaultValue: 'No Bills of Material Match Your Filters' })}
          description={t('boms.emptyState.noBoMsMatchDesc', { defaultValue: 'Try adjusting your search or filters.' })}
        />
      ) : (
        <DataTable
          columns={bomTableColumns} // Uses the memoized columns
          data={boms} // paginatedItems
          loading={loading}
          error={error} // Pass error to DataTable for potential internal error display
          onRetry={() => refreshBoMs(true)}
          entityName={entityConfig.entityNamePlural}
          emptyMessage={hasFiltersApplied ? t('boms.emptyState.noBoMsMatchDesc', { defaultValue: 'No Bills of Material match your filters.' }) : t('boms.emptyState.noBoMsDesc', { defaultValue: 'No items found.' })}
          onRowClick={(row) => handleEdit(row.original)}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={handleToggleSelection}
          onSelectAllRows={() => handleSelectAll(boms.map(b => b.id))}
          currentSort={safeSortConfig} // Pass the safeSortConfig array
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
      )}

      {isDialogOpen && (
        <BoMDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleDialogCloseWrapper(refresh, actionType, itemName)}
          bomItem={currentItem} // currentItem from useEntityModule
          // Pass fetched options for dropdowns in the dialog
          insuranceCodes={allInsuranceCodes} // Pass full objects, assuming dialog needs them
          materials={allMaterials} // Pass full objects
          t={t}
        />
      )}
    </div>
  );
}
