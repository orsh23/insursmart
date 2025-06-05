
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { City } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import useEntityModule from '@/components/hooks/useEntityModule';
import DataTable from '@/components/shared/DataTable';
import CityDialog from './CityDialog';
import SearchFilterBar from '@/components/shared/SearchFilterBar';
import { Button } from '@/components/ui/button';
import ImportDialog from '@/components/common/ImportDialog';
import { UploadCloud, Plus, Building } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import GlobalActionButton from '@/components/shared/GlobalActionButton';
import ViewSwitcher from '@/components/shared/ViewSwitcher';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { loadFromStorage, saveToStorage } from '@/utils/localStorage';

export default function CitiesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const entityConfig = useMemo(() => ({
    entitySDK: City,
    entityName: t('cities.entityNameSingular', { defaultValue: 'City' }),
    entityNamePlural: t('cities.titlePlural', { defaultValue: 'Cities' }),
    DialogComponent: CityDialog,
    FormComponent: null, // DialogComponent handles the form logic
    initialFilters: {
      searchTerm: '', // For general search queries
      customFilters: { // For specific field filters, matching original structure
        name_en_cont: '',
        name_he_cont: '',
        code_cont: '',
      },
      sort: 'name_en', // Default sort as in original component
      page: 1,
      pageSize: 10,
    },
    // The `filterFunction` from the outline might be for client-side filtering.
    // Given the original component used server-side filtering (via `_cont` suffixes),
    // we assume `useEntityModule` is configured to map these filters to API requests.
    storageKey: 'citiesView', // Key for persisting table state (e.g., sort, page size)
  }), [t]);

  const {
    items: cities, // Data items, aliased from 'items'
    loading,
    error,
    filters, // Current filter state (includes searchTerm, customFilters, sort, page, pageSize)
    setFilters, // Function to update filters
    sortConfig, // Current sort configuration
    setSortConfig, // Function to set sort configuration
    pagination, // Pagination details (page, pageSize, totalItems, totalPages)
    setPagination, // Function to set pagination
    selectedItems, // Currently selected items for bulk actions
    setSelectedItems, // Function to update selected items
    isDialogOpen, // State for the entity dialog (e.g., CityDialog)
    setIsDialogOpen, // Function to open/close entity dialog
    currentItem, // The entity object currently being edited/viewed
    setCurrentItem, // Function to set the current entity
    handleRefresh: refreshCities, // Function to re-fetch data (replaces fetchItems)
    handleSearch, // Function to handle general search input
    handleFilterChange, // Generic function to handle changes to filters (e.g., custom filters)
    handleSortChange, // Function to handle sort changes
    handlePageChange, // Function to handle page number changes
    handlePageSizeChange, // Function to handle page size changes
    handleAddNew, // Function to open dialog for creating new item
    handleEdit, // Function to open dialog for editing an item
    handleDelete, // Function to delete a single item
    handleBulkDelete, // Function to delete multiple selected items
    isSelectionModeActive, // State indicating if selection mode is active
    setIsSelectionModeActive, // Function to toggle selection mode
    handleToggleSelection, // Function to toggle selection of a single item
    handleSelectAll, // Function to select all items on current page
    handleSelfSubmittingDialogClose, // Common handler to close dialogs that manage their own submission
    // filteredAndSortedItems, // This would be used if `useEntityModule` performed client-side filtering
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('citiesView_viewPreference', 'table'));

  useEffect(() => {
    if (passedView) {
      setCurrentView(passedView);
      saveToStorage('citiesView_viewPreference', passedView);
    }
  }, [passedView]);

  // Memoized global actions config, includes the `t` prop for translation keys.
  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'addresses.city.add', defaultLabel: 'Add City', icon: Plus, action: handleAddNew, type: 'add', t: t},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      handleEdit(selectedItems[0]); // Pass the single selected item to handleEdit
      setIsSelectionModeActive(false); // Exit selection mode after action
    } else if (selectedItems.length === 0) {
      toast({
        title: t('common.noItemSelected', { defaultValue: "No Item Selected" }),
        description: t('common.selectOneToEdit', { defaultValue: "Please select one item to edit." }),
        variant: "warning",
      });
    } else {
      toast({
        title: t('common.multipleItemsSelected', { defaultValue: "Multiple Items Selected" }),
        description: t('common.selectOneToEdit', { defaultValue: "Please select only one item to edit." }),
        variant: "warning",
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems.map(item => item.id)); // Assuming handleBulkDelete takes an array of IDs
      setIsSelectionModeActive(false); // Exit selection mode after action
    } else {
      toast({
        title: t('common.noItemSelected', { defaultValue: "No Item Selected" }),
        description: t('common.selectItemsToDelete', { defaultValue: "Please select items to delete." }),
        variant: "warning",
      });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]); // Clear selected items
  }, [setIsSelectionModeActive, setSelectedItems]);

  const columns = useMemo(() => [
    { accessorKey: 'name_en', header: t('fields.nameEn', { defaultValue: 'Name (English)' }), sortable: true },
    { accessorKey: 'name_he', header: t('fields.nameHe', { defaultValue: 'Name (Hebrew)' }), sortable: true },
    { accessorKey: 'code', header: t('fields.code', { defaultValue: 'Code' }), sortable: true },
    {
      id: 'actions',
      header: t('common.actions', { defaultValue: 'Actions' }),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>{t('buttons.edit', { defaultValue: 'Edit' })}</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>{t('buttons.delete', { defaultValue: 'Delete' })}</Button>
        </div>
      ),
    },
  ], [t, handleEdit, handleDelete, language]); // 'language' is not directly used but might be part of memoization dependency array for translation changes.

  const filterFields = [
    { name: 'name_en_cont', label: t('fields.nameEn', { defaultValue: 'Name (EN)' }), type: 'text', value: filters.customFilters?.name_en_cont || '' },
    { name: 'name_he_cont', label: t('fields.nameHe', { defaultValue: 'Name (HE)' }), type: 'text', value: filters.customFilters?.name_he_cont || '' },
    { name: 'code_cont', label: t('fields.code', { defaultValue: 'Code' }), type: 'text', value: filters.customFilters?.code_cont || '' },
  ];
  
  // Import dialog state and handlers (these are specific to CitiesTab and not part of useEntityModule)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const openImportDialog = useCallback(() => setIsImportDialogOpen(true), []);
  const closeImportDialog = useCallback(() => setIsImportDialogOpen(false), []);

  const handleImportSubmit = async (records) => {
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle', {defaultValue: "No Records to Import"}), description: t('import.noRecordsDesc', {defaultValue: "The file has no records or could not be parsed."}), variant: "warning" });
      return;
    }

    // Map Excel/CSV headers to entity properties
    const citiesToCreate = records.map(record => ({
      name_en: record['Name (English)'] || record['name_en'] || record['Name EN'],
      name_he: record['Name (Hebrew)'] || record['name_he'] || record['Name HE'],
      code: record['Code'] || record['code'],
    })).filter(city => city.name_en && city.name_he); // Basic validation

    if (citiesToCreate.length === 0) {
        toast({ title: t('import.noValidRecordsTitle', {defaultValue: "No Valid Records"}), description: t('import.noValidRecordsDesc', {defaultValue: "No valid city records found in the file. Ensure 'Name (English)' and 'Name (Hebrew)' are present."}), variant: "warning" });
        return;
    }

    try {
      await City.bulkCreate(citiesToCreate);
      toast({ title: t('import.successTitle', {defaultValue: "Import Successful"}), description: t('import.citiesSuccessDesc', {count: citiesToCreate.length, defaultValue: `${citiesToCreate.length} cities imported successfully.`})});
      refreshCities(); // Refresh list (changed from fetchItems)
      closeImportDialog();
    } catch (importError) {
      console.error("Error bulk creating cities:", importError);
      toast({ title: t('import.errorTitle', {defaultValue: "Import Failed"}), description: importError.message || t('import.genericErrorDesc', {defaultValue: "An unexpected error occurred during import."}), variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorDisplay errorMessage={error.message} onRetry={refreshCities} />;
    }

    return (
      <DataTable
        columns={columns}
        data={cities} // 'cities' comes from useEntityModule's 'items'
        loading={loading}
        error={error} // Passed for potential internal error handling in DataTable
        onRetry={refreshCities}
        pagination={{ // Pass pagination details to DataTable
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalItems: pagination.totalItems,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        entityName={t('cities.titlePlural', { defaultValue: 'Cities' })}
        isSelectionModeActive={isSelectionModeActive}
        selectedItems={selectedItems}
        onToggleSelection={handleToggleSelection}
        onSelectAll={handleSelectAll}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Building className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('cities.titlePlural', { defaultValue: 'Cities' })} ({pagination.totalItems || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('addresses.city.singular', { defaultValue: 'City' })}
                t={t} {/* ADDED t PROP */}
              />
            <Button variant="outline" onClick={refreshCities}>
                {t('common.refresh', { defaultValue: 'Refresh' })}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={setCurrentView}
              storageKey="citiesView_viewPreference"
              t={t}
            />
        </div>
      </div>

      <SearchFilterBar
        searchQuery={filters.searchTerm || ''} // Use searchTerm from filters
        onSearchChange={(value) => handleSearch(value)} // Update searchTerm
        onFilterChange={handleFilterChange} // For custom filters
        onSortChange={handleSortChange} // For sorting
        currentSort={filters.sort} // Current sort from filters
        sortOptions={[
            { value: 'name_en', label: t('fields.nameEn', { defaultValue: 'Name (English)'}) },
            { value: '-name_en', label: t('fields.nameEn', { defaultValue: 'Name (English)'}) + ` (${t('sort.desc', {defaultValue: 'Desc'})})` },
            { value: 'name_he', label: t('fields.nameHe', { defaultValue: 'Name (Hebrew)'}) },
            { value: '-name_he', label: t('fields.nameHe', { defaultValue: 'Name (Hebrew)'}) + ` (${t('sort.desc', {defaultValue: 'Desc'})})` },
        ]}
        filterFields={filterFields} // Uses filters.customFilters values
        onAddNew={handleAddNew} // From useEntityModule
        addNewButtonText={t('cities.addNew', {defaultValue: 'New City'})}
        additionalActions={
          <Button variant="outline" onClick={openImportDialog}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {t('import.importButton', {entity: t('cities.titlePlural', {defaultValue: 'Cities'}), defaultValue: `Import ${t('cities.titlePlural', {defaultValue: 'Cities'})}`})}
          </Button>
        }
      />
      {renderContent()} {/* Renders DataTable, LoadingSpinner, or ErrorDisplay */}

      {isDialogOpen && ( // Controlled by useEntityModule's isDialogOpen
        <CityDialog
          isOpen={isDialogOpen}
          onClose={handleSelfSubmittingDialogClose} // Use useEntityModule's handler for closing
          onSubmit={handleSelfSubmittingDialogClose} // Submitting the form will likely trigger a refresh and then close via this handler
          city={currentItem} // The entity object being edited/created
          t={t}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={closeImportDialog}
            onImportSubmit={handleImportSubmit}
            entityName={t('cities.titlePlural', { defaultValue: 'Cities' })}
            sampleHeaders={['Name (English)', 'Name (Hebrew)', 'Code']}
            t={t}
        />
      )}
    </div>
  );
}
