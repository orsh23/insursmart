
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Material } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Plus, Edit, Trash2, UploadCloud, DownloadCloud, Eye, Copy, FilterX, RefreshCw, MoreVertical, AlertTriangle, PackagePlus, SearchX } from 'lucide-react';
import { useEntityModule } from '@/components/hooks/useEntityModule'; // Corrected path
import MaterialDialog from './MaterialDialog';
import MaterialCard from './MaterialCard';
import MaterialsFilterBar from './MaterialsFilterBar'; // Changed from MaterialFilterBar
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Helper function to load from localStorage
const loadFromStorage = (key, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

// Helper function to save to localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage for key "${key}":`, error);
  }
};

// Helper function to get localized value
const getLocalizedValue = (obj, fieldPrefix, language, defaultLang, fallback = '') => {
  if (!obj) return fallback;
  const lang = language === 'he' ? 'he' : 'en';
  const specificField = `${fieldPrefix}_${lang}`;
  const defaultField = `${fieldPrefix}_${defaultLang}`;

  return obj[specificField] || obj[defaultField] || fallback;
};

// Status Badge Component
const StatusBadge = ({ status, t }) => {
  let badgeClass = '';
  let badgeText = '';

  switch (status) {
    case 'active':
      badgeClass = 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200';
      badgeText = t('status.active', { defaultValue: 'Active' });
      break;
    case 'inactive':
      badgeClass = 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300';
      badgeText = t('status.inactive', { defaultValue: 'Inactive' });
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300';
      badgeText = t('common.unknown', { defaultValue: 'Unknown' });
  }

  return (
    <Badge className={`text-xs ${badgeClass}`}>
      {badgeText}
    </Badge>
  );
};

// Error Display Component (simplified for this context, can be more robust)
const ErrorDisplay = ({ errorMessage, onRetry, t }) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle', { defaultValue: 'Error Loading Data' })}</h2>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
    <Button onClick={onRetry} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
      <RefreshCw className="mr-2 h-4 w-4" />
      {t('buttons.retry', { defaultValue: 'Retry' })}
    </Button>
  </div>
);

// Format date distance
const formatSafeDateDistance = (dateString, language) => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  if (!isValid(date)) return '';
  const locale = getLocaleObject(language);
  return formatDistanceToNow(date, { addSuffix: true, locale });
};

export default function MaterialsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: Material,
    entityName: t('materials.itemTitleSingular', { defaultValue: 'Material' }),
    entityNamePlural: t('materials.itemTitlePlural', { defaultValue: 'Materials' }),
    DialogComponent: MaterialDialog,
    initialSort: [{ id: 'name_en', desc: false }],
    initialFilters: {
      searchTerm: '',
      unitOfMeasure: 'all',
      status: 'all', // Corresponds to is_active
      hasVariants: 'all',
      tagsQuery: '',
      catalogPathQuery: '',
    },
    searchFields: ['name_en', 'name_he', 'description_en', 'description_he', 'catalog_path'],
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        const nameEn = item.name_en?.toLowerCase() || '';
        const nameHe = item.name_he?.toLowerCase() || '';
        const descriptionEn = item.description_en?.toLowerCase() || '';
        const descriptionHe = item.description_he?.toLowerCase() || '';
        const catalogPath = item.catalog_path?.toLowerCase() || '';

        if (!(nameEn.includes(term) || nameHe.includes(term) ||
              descriptionEn.includes(term) || descriptionHe.includes(term) ||
              catalogPath.includes(term) ||
              (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(term)))
             )) return false;
      }
      if (filters.unitOfMeasure !== 'all' && item.unit_of_measure !== filters.unitOfMeasure) return false;
      if (filters.status !== 'all') {
        const isActiveFilter = filters.status === 'active';
        if (item.is_active !== isActiveFilter) return false;
      }
      if (filters.hasVariants !== 'all') {
        const hasVariantsFilter = filters.hasVariants === 'true';
        if (item.has_variants !== hasVariantsFilter) return false;
      }

      if (filters.tagsQuery) {
        const lowerTagsQuery = filters.tagsQuery.toLowerCase();
        if (!Array.isArray(item.tags) || !item.tags.some(tag => tag?.toLowerCase().includes(lowerTagsQuery))) return false;
      }
      if (filters.catalogPathQuery) {
        const lowerCatalogPathQuery = filters.catalogPathQuery.toLowerCase();
        if (!item.catalog_path?.toLowerCase().includes(lowerCatalogPathQuery)) return false;
      }
      return true;
    },
    storageKey: 'materialsView',
  }), [t]);

  const {
    items: materials,
    loading, error, filters, sortConfig, pagination, selectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshMaterials,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete: bulkDeleteHook,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // This is already the filtered and sorted list based on current filters/sortConfig
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false); // Kept for consistency if future use

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(it => it.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle', { defaultValue: 'Item Not Found' }), description: t('errors.itemNotFoundToEditDesc', { defaultValue: 'The selected item could not be found for editing.' }), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.edit', { defaultValue: 'Edit' }), defaultValue: 'Selection Mode Active' }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.edit', { defaultValue: 'Edit' }), defaultValue: 'Please select items to Edit.' }), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', { defaultValue: 'Select One Item' }), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName, defaultValue: 'Please select only one {{entity}} to edit.' }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural, defaultValue: 'Are you sure you want to delete {{count}} {{item}}?' }))) {
        bulkDeleteHook(selectedItems); // Use the bulk delete from the hook
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.delete', { defaultValue: 'Delete' }), defaultValue: 'Selection Mode Active' }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.delete', { defaultValue: 'Delete' }), defaultValue: 'Please select items to Delete.' }), variant: "info" });
    }
  }, [selectedItems, bulkDeleteHook, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    handleSelectAll([]); // Clear all selections
  }, [setIsSelectionModeActive, handleSelectAll]);

  const handleImportSubmit = useCallback(async (fileToImport) => {
    setIsImportDialogOpen(false);
    if (!fileToImport) {
      toast({ title: t('import.noFileTitle', { defaultValue: 'No File Selected' }), description: t('import.noFileDesc', { defaultValue: 'Please select a file to import.' }), variant: "warning" });
      return;
    }
    // This action is disabled in GlobalActionButton per outline, but if ever enabled, this is the handler.
    toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon' }), description: t('common.featureComingSoonDetailed', { featureName: t('materials.importTitle', { defaultValue: 'Material Import' }), defaultValue: 'The {{featureName}} feature is coming soon!' }) });
  }, [t, toast]);


  const memoizedGlobalActionsConfig = useMemo(() => {
    const baseActions = [
      { labelKey: 'materials.addNew', defaultLabel: 'Add New Material', icon: PackagePlus, action: handleAddNew, type: 'add' },
      { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
      { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
      { isSeparator: true },
      { labelKey: 'buttons.import', defaultLabel: 'Import Materials', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon' }), description: t('common.featureComingSoonDetailed', { featureName: t('buttons.import', { defaultValue: 'Import' }), defaultValue: 'The {{featureName}} feature is coming soon!' }) }), disabled: true, type: 'import' },
      { labelKey: 'buttons.export', defaultLabel: 'Export Materials', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon' }), description: t('common.featureComingSoonDetailed', { featureName: t('materials.exportTitle', { defaultValue: 'Export Materials' }), defaultValue: 'The {{featureName}} feature is coming soon!' }) }), disabled: true, type: 'export' },
    ];
    return [...baseActions, ...(externalActionsConfig || [])];
  }, [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const materialTableColumns = useMemo(() => [
    ...(isSelectionModeActive ? [{
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('bulkActions.selectAllRowsOnPage', { defaultValue: 'Select all rows on page' })}
          className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedItems.includes(row.original.id)}
          onCheckedChange={() => handleToggleSelection(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('bulkActions.selectRow', { defaultValue: 'Select row' })}
          disabled={!row.original || row.original.id == null}
          className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      enableSorting: false, size: 50,
    }] : []),
    {
      accessorKey: 'name',
      header: t('materials.fields.name', { defaultValue: 'Name' }),
      cell: ({ row }) => getLocalizedValue(row.original, 'name', language, 'en', t('common.notSet', { defaultValue: 'N/A' })),
      enableSorting: true,
      id: 'name_en', // For sorting purposes, assuming name_en is the default
    },
    {
      accessorKey: 'unit_of_measure',
      header: t('materials.fields.unitOfMeasure', { defaultValue: 'Unit' }),
      cell: ({ row }) => t(`materials.units.${row.original.unit_of_measure}`, { defaultValue: row.original.unit_of_measure }),
      enableSorting: true,
    },
    {
      accessorKey: 'base_price',
      header: t('materials.fields.basePrice', { defaultValue: 'Base Price' }),
      cell: ({ row }) => {
        const { base_price, currency } = row.original;
        if (base_price === undefined || base_price === null) return t('common.notSet', { defaultValue: 'N/A' });
        return `${base_price.toLocaleString()} ${currency || 'ILS'}`;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'has_variants',
      header: t('materials.fields.hasVariants', { defaultValue: 'Variants' }),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.has_variants ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.has_variants ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'is_active',
      header: t('common.status', { defaultValue: 'Status' }),
      cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} t={t} />,
      enableSorting: true,
    },
    {
      accessorKey: 'catalog_path',
      header: t('materials.fields.catalogPath', { defaultValue: 'Catalog Path' }),
      cell: ({ row }) => row.original.catalog_path || t('common.notSet', { defaultValue: 'N/A' }),
      enableSorting: true,
    },
    {
      accessorKey: 'updated_date',
      header: t('fields.lastUpdated', { defaultValue: 'Last Updated' }),
      cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: () => <div className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-gray-500 dark:text-gray-400`}>{t('common.actions', { defaultValue: 'Actions' })}</div>,
      cell: ({ row }) => {
        const material = row.original;
        if (!material || !material.id) return null;
        return (
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <DropdownMenu dir={isRTL ? 'rtl' : 'ltr'}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('common.actions', { defaultValue: 'Actions' })}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(material); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.viewDetails', { defaultValue: 'View Details' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(material); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.edit', { defaultValue: 'Edit' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon' }), description: t('common.featureComingSoonDetailed', { featureName: t('buttons.duplicate', { defaultValue: 'Duplicate' }), defaultValue: 'The {{featureName}} feature is coming soon!' }) }); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Copy className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.duplicate', { defaultValue: 'Duplicate' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (window.confirm(t('common.confirmDeleteOne', { item: getLocalizedValue(material, 'name', language, 'en', t('materials.itemTitleSingular', { defaultValue: 'Material' })), defaultValue: 'Are you sure you want to delete this {{item}}?' }))) bulkDeleteHook([material.id]); }} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300 dark:hover:bg-red-700/20">
                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.delete', { defaultValue: 'Delete' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [t, language, isRTL, isSelectionModeActive, selectedItems, handleToggleSelection, handleEdit, bulkDeleteHook]);

  const renderContent = () => {
    if (loading && materials.length === 0) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural, defaultValue: 'Loading {{item}}...' })} isFullScreen={false} />;
    }
    if (error && materials.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshMaterials} t={t} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => {
      const initialVal = entityConfig.initialFilters[key];
      // Special handling for searchTerm and tagsQuery as they are initially empty strings
      if (key === 'searchTerm' || key === 'tagsQuery' || key === 'catalogPathQuery') return val === '';
      return val === initialVal;
    });


    if (currentView === 'card') {
      const itemsToDisplay = materials; // materials from hook are already paginated if enabled
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={Package}
              title={t('materials.emptyState.noMaterialsTitle', { defaultValue: 'No Materials Yet' })}
              message={t('materials.emptyState.noMaterialsDesc', { defaultValue: 'Get started by adding your first material.' })}
              actionButton={<Button onClick={handleAddNew}><PackagePlus className="mr-2 h-4 w-4" />{t('materials.addNew', { defaultValue: 'Add New Material' })}</Button>}
            />
          ) : itemsToDisplay.length === 0 && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('emptyStates.noFilterMatchTitle', { item: entityConfig.entityNamePlural, defaultValue: 'No {{item}} Found for Current Filters' })}
              message={t('emptyStates.noFilterMatchMessage', { defaultValue: 'Try adjusting your filters or search terms.' })}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {itemsToDisplay.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onEdit={() => handleEdit(material)}
                  onDelete={() => { if (window.confirm(t('common.confirmDeleteOne', { item: getLocalizedValue(material, 'name', language, 'en', t('materials.itemTitleSingular', { defaultValue: 'Material' })), defaultValue: 'Are you sure you want to delete this {{item}}?' }))) bulkDeleteHook([material.id]); }}
                  onDuplicate={() => toast({ title: t('common.featureComingSoonTitle', { defaultValue: 'Feature Coming Soon' }), description: t('common.featureComingSoonDetailed', { featureName: t('buttons.duplicate', { defaultValue: 'Duplicate' }) }) })}
                  language={language}
                  isRTL={isRTL}
                  t={t}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(material.id)}
                  onToggleSelection={() => handleToggleSelection(material.id)}
                />
              ))}
            </div>
          )}
          {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
            <div className="mt-6 flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1, defaultValue: 'Page {{page}} of {{totalPages}}' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
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
          columns={materialTableColumns}
          data={materials} // materials are already paginated and filtered by the hook
          loading={loading}
          error={error}
          onRetry={refreshMaterials}
          entityName={entityConfig.entityNamePlural}
          emptyMessage={noFiltersApplied ? t('materials.emptyState.noMaterialsDesc', { defaultValue: 'Get started by adding your first material.' }) : t('emptyStates.noFilterMatchMessage', { defaultValue: 'Try adjusting your filters or search terms.' })}
          onRowClick={({ original: item }) => !isSelectionModeActive && item?.id && handleEdit(item)}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={handleToggleSelection}
          onSelectAllRows={() => handleSelectAll(filteredAndSortedItems.map(item => item.id))} // Select all filtered/sorted items
          currentSort={sortConfig}
          onSortChange={handleSortChange}
          pagination={{
            currentPage: pagination.currentPage,
            pageSize: pagination.pageSize,
            totalItems: pagination.totalCount,
            totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
            itemsPerPageOptions: [10, 20, 50, 100],
          }}
          t={t} language={language} isRTL={isRTL}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Package className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('materials.pageTitle', { defaultValue: 'Materials' })} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis', { defaultValue: 'Loading...' }) : pagination.totalCount || 0})
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
          <Button onClick={refreshMaterials} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
            {t('buttons.refresh', { defaultValue: 'Refresh' })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['card', 'table']}
            entityName={t('materials.itemTitlePlural', { defaultValue: 'Materials' })}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>

      <MaterialsFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={() => {
          handleFilterChange(null, entityConfig.initialFilters);
          handleSortChange(entityConfig.initialSort);
          handleCancelSelectionMode();
        }}
        sortConfig={sortConfig.length > 0 ? { key: sortConfig[0].id, direction: sortConfig[0].desc ? 'descending' : 'ascending' } : { key: entityConfig.initialSort[0].id, direction: entityConfig.initialSort[0].desc ? 'descending' : 'ascending' }}
        onSortChange={(newSortKey) => {
          const currentSortField = sortConfig[0]?.id;
          const currentDesc = sortConfig[0]?.desc;
          handleSortChange([{ id: newSortKey, desc: currentSortField === newSortKey ? !currentDesc : false }]);
        }}
        t={t} language={language} isRTL={isRTL}
      />

      {/* Error and loading messages for existing data or initial load */}
      {error && materials.length > 0 && (
        <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: error.message || String(error), defaultValue: 'Warning: Some {{entity}} data could not be loaded. {{message}}' })}</span>
        </div>
      )}
      {loading && materials.length > 0 && <LoadingSpinner message={t('messages.updatingData', { item: entityConfig.entityNamePlural, defaultValue: 'Updating {{item}}...' })} isFullScreen={false} />}

      {renderContent()}

      {isDialogOpen && (
        <MaterialDialog
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          material={currentItem}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImportSubmit}
          entityName={t('materials.itemTitlePlural', { defaultValue: 'Materials' })}
          sampleHeaders={['Name EN', 'Name HE', 'Description EN', 'Description HE', 'Unit of Measure', 'Base Price', 'Currency', 'Has Variants (true/false)', 'Is Active (true/false)', 'Tags (comma-separated)']}
          language={language}
        />
      )}
    </div>
  );
}
