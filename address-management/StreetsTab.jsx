
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Street } from '@/api/entities';
import { City } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import DataTable from '@/components/shared/DataTable';
import StreetDialog from './StreetDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImportDialog from '@/components/common/ImportDialog';
import { UploadCloud, Plus, MapPin } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import useEntityModule from '@/components/hooks/useEntityModule';
import GlobalActionButton from '@/components/shared/GlobalActionButton';
import { Input } from '@/components/ui/input';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function StreetsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [allCities, setAllCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('all'); // Default to 'all' for filter

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const cityData = await City.list();
        setAllCities(Array.isArray(cityData) ? cityData : []);
      } catch (error) { 
        console.error("Failed to fetch cities for Streets tab:", error);
        toast({ title: t('errors.fetchCitiesError', { defaultValue: "Could not load cities" }), description: (error as Error).message, variant: 'destructive'});
      }
    };
    fetchCities();
  }, [t, toast]);
  
  const cityOptions = useMemo(() => {
    const options = allCities.map(city => ({ value: city.id, label: language === 'he' ? city.name_he : city.name_en }));
    return [{ value: 'all', label: t('filters.allCities', { defaultValue: 'All Cities' }) }, ...options];
  }, [allCities, language, t]);

  const entityConfig = useMemo(() => ({
    entitySDK: Street,
    entityName: t('addresses.street.singular', { defaultValue: "Street" }),
    entityNamePlural: t('addresses.street.plural', { defaultValue: "Streets" }),
    DialogComponent: StreetDialog,
    initialFilters: {
      searchTerm: '', // For street name
      city_id: 'all', // Filter by city, will be overridden by selectedCityId in useEffect
      page: 1,
      pageSize: 10,
    },
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase() || '';
        let match = true;
        if (term) {
            const nameEnMatch = item.name_en?.toLowerCase().includes(term);
            const nameHeMatch = item.name_he?.toLowerCase().includes(term);
            match = nameEnMatch || nameHeMatch;
        }
        if (!match) return false;

        if (filters.city_id && filters.city_id !== 'all' && item.city_id !== filters.city_id) {
            return false;
        }
        return true;
    },
    storageKey: 'streetsView',
  }), [t]);

  const {
    items: streets,
    loading,
    error,
    filters,
    sortConfig,
    pagination,
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshStreets,
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew: useEntityModuleHandleAddNew,
    handleEdit: useEntityModuleHandleEdit,
    handleDelete: useEntityModuleHandleDelete,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  // Update useEntityModule's filter when selectedCityId changes
  useEffect(() => {
      handleFilterChange({ city_id: selectedCityId }); // Pass as an object
  }, [selectedCityId, handleFilterChange]);


  const getCityName = (cityIdParam) => {
    const city = allCities.find(c => c.id === cityIdParam);
    return city ? (language === 'he' ? city.name_he : city.name_en) : String(cityIdParam);
  };

  const columns = useMemo(() => [
    { accessorKey: 'name_en', header: t('fields.nameEn', { defaultValue: 'Name (English)' }), sortable: true },
    { accessorKey: 'name_he', header: t('fields.nameHe', { defaultValue: 'Name (Hebrew)' }), sortable: true },
    { 
      accessorKey: 'city_id', 
      header: t('fields.city', { defaultValue: 'City' }), 
      cell: ({ row }) => getCityName(row.original.city_id),
      sortable: true 
    },
    {
      id: 'actions',
      header: t('common.actions', { defaultValue: 'Actions' }),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => useEntityModuleHandleEdit(row.original)}>{t('buttons.edit', { defaultValue: 'Edit' })}</Button>
          <Button variant="destructive" size="sm" onClick={() => useEntityModuleHandleDelete(row.original.id)}>{t('buttons.delete', { defaultValue: 'Delete' })}</Button>
        </div>
      ),
    },
  ], [t, useEntityModuleHandleEdit, useEntityModuleHandleDelete, language, allCities]);

  const handleCityFilterChange = useCallback((value) => {
      setSelectedCityId(value);
  }, []);
  
  const handleAddNew = useCallback(() => {
      if (selectedCityId === 'all') {
           toast({title: t('streets.selectCityFirstTitle', { defaultValue: 'Select City' }), description: t('streets.selectCityFirstDesc', { defaultValue: 'Please select a city from the filter before adding a new street.'}), variant: 'warning'});
           return;
      }
      useEntityModuleHandleAddNew({ city_id: selectedCityId });
  }, [selectedCityId, useEntityModuleHandleAddNew, toast, t]);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const openImportDialog = useCallback(() => setIsImportDialogOpen(true), []);
  const closeImportDialog = useCallback(() => setIsImportDialogOpen(false), []);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'addresses.street.add', defaultLabel: 'Add Street', icon: Plus, action: handleAddNew, type: 'add'},
    { labelKey: 'import.importButton', defaultLabel: 'Import Streets', icon: UploadCloud, action: openImportDialog, type: 'custom'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t, openImportDialog]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length !== 1) {
      toast({
        title: t('common.selectionErrorTitle', { defaultValue: 'Selection Error' }),
        description: t('common.selectOneToEdit', { defaultValue: 'Please select exactly one item to edit.' }),
        variant: 'destructive',
      });
      return;
    }
    useEntityModuleHandleEdit(selectedItems[0]);
    setIsSelectionModeActive(false);
  }, [selectedItems, useEntityModuleHandleEdit, setIsSelectionModeActive, t, toast]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 0) {
      toast({
        title: t('common.selectionErrorTitle', { defaultValue: 'Selection Error' }),
        description: t('common.selectOneOrMoreToDelete', { defaultValue: 'Please select one or more items to delete.' }),
        variant: 'destructive',
      });
      return;
    }
    handleBulkDelete(selectedItems.map(item => item.id));
    setIsSelectionModeActive(false);
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleImportSubmit = async (records) => {
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle', {defaultValue: "No Records to Import"}), description: t('import.noRecordsDesc', {defaultValue: "The file has no records or could not be parsed."}), variant: "warning" });
      return;
    }

    const streetsToCreatePromises = records.map(async record => {
        let cityIdToUse = selectedCityId === 'all' ? null : selectedCityId;
        
        if (!cityIdToUse) {
            const cityNameEn = record['City Name (English)'] || record['city_name_en'];
            const cityCode = record['City Code'] || record['city_code'];
            if (cityNameEn) {
                const foundCity = allCities.find(c => c.name_en.toLowerCase() === cityNameEn.toLowerCase());
                if (foundCity) cityIdToUse = foundCity.id;
            } else if (cityCode) {
                 const foundCity = allCities.find(c => c.code === cityCode);
                if (foundCity) cityIdToUse = foundCity.id;
            }
        }

        if (!cityIdToUse) {
            return null;
        }
        
        return {
          city_id: cityIdToUse,
          name_en: record['Street Name (English)'] || record['name_en'],
          name_he: record['Street Name (Hebrew)'] || record['name_he'],
        };
    });

    const streetsToCreateWithData = await Promise.all(streetsToCreatePromises);
    const streetsToCreate = streetsToCreateWithData.filter(street => street && street.city_id && street.name_en && street.name_he);

    if (streetsToCreate.length === 0) {
        toast({ title: t('import.noValidRecordsTitle', {defaultValue: "No Valid Records"}), description: t('import.streetsNoValidDesc', {defaultValue: "No valid street records found. Ensure City ID/Name and Street Names are present."}), variant: "warning" });
        return;
    }

    try {
      await Street.bulkCreate(streetsToCreate);
      toast({ title: t('import.successTitle', {defaultValue: "Import Successful"}), description: t('import.streetsSuccessDesc', {count: streetsToCreate.length, defaultValue: `${streetsToCreate.length} streets imported successfully.`})});
      refreshStreets();
      closeImportDialog();
    } catch (importError) {
      console.error("Error bulk creating streets:", importError);
      toast({ title: t('import.errorTitle', {defaultValue: "Import Failed"}), description: (importError as Error).message || t('import.genericErrorDesc', {defaultValue: "An unexpected error occurred during import."}), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <MapPin className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('addresses.street.plural', { defaultValue: 'Streets' })} ({pagination.totalCount || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('addresses.street.singular')}
                t={t}
              />
              <Button onClick={refreshStreets} variant="outline" className="h-9">
                {t('common.refresh', { defaultValue: 'Refresh' })}
              </Button>
        </div>
      </div>
      
      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder={t('filters.searchByName', { defaultValue: "Search by name..." })}
          value={filters.searchTerm || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCityId} onValueChange={handleCityFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('fields.city', { defaultValue: 'City' })} />
          </SelectTrigger>
          <SelectContent>
            {cityOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorDisplay message={error.message} onRetry={refreshStreets} />}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={streets}
          loading={loading}
          error={error}
          onRetry={refreshStreets}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          entityName={t('addresses.street.plural', { defaultValue: 'Streets' })}
          isSelectable={true}
          selectedItems={selectedItems}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          isSelectionModeActive={isSelectionModeActive}
        />
      )}
      {isDialogOpen && (
        <StreetDialog
          isOpen={isDialogOpen}
          onClose={handleSelfSubmittingDialogClose}
          onSubmit={handleSelfSubmittingDialogClose}
          street={currentItem}
          cities={allCities}
          t={t}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={closeImportDialog}
            onImportSubmit={handleImportSubmit}
            entityName={t('addresses.street.plural', { defaultValue: 'Streets' })}
            sampleHeaders={['City Name (English)', 'City Code', 'Street Name (English)', 'Street Name (Hebrew)']}
            t={t}
            importNote={selectedCityId !== 'all' ? t('import.streetsForCityNote', { cityName: getCityName(selectedCityId), defaultValue: `Importing streets for city: ${getCityName(selectedCityId)}. CSV can omit city column.` }) : t('import.streetsCityColumnNote', {defaultValue: "CSV should include 'City Name (English)' or 'City Code' if no city filter is active."})}
        />
      )}
    </div>
  );
}
