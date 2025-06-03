
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Address } from '@/api/entities';
import { City } from '@/api/entities';
import { Street } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import useEntityModule from '@/components/hooks/useEntityModule'; // Assuming this new hook exists
import DataTable from '@/components/shared/DataTable';
import AddressDialog from './AddressDialog';
import SearchFilterBar from '@/components/shared/SearchFilterBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { HomeIcon, Plus } from 'lucide-react'; // Added HomeIcon and Plus for new UI elements
import GlobalActionButton from '@/components/shared/GlobalActionButton'; // Assuming this component exists

export default function AddressesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [allCities, setAllCities] = useState([]);
  const [allStreets, setAllStreets] = useState([]); // Can be filtered based on selected city

  const entityConfig = useMemo(() => ({
    entitySDK: Address,
    entityName: t('addresses.address.singular', { defaultValue: "Address" }),
    entityNamePlural: t('addresses.address.plural', { defaultValue: "Addresses" }),
    DialogComponent: AddressDialog,
    FormComponent: null, // If a separate form component was intended for inline use
    initialFilters: {
      searchTerm: '', // For house_number, zip_code, notes
      city_id: 'all',
      street_id: 'all',
      page: 1,
      pageSize: 10,
    },
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase() || '';
        let match = true;
        if (term) {
            const houseNumberMatch = item.house_number?.toLowerCase().includes(term);
            const zipCodeMatch = item.zip_code?.toLowerCase().includes(term);
            const notesEnMatch = item.notes_en?.toLowerCase().includes(term);
            const notesHeMatch = item.notes_he?.toLowerCase().includes(term);
            match = houseNumberMatch || zipCodeMatch || notesEnMatch || notesHeMatch;
        }
        if (!match) return false;

        if (filters.city_id && filters.city_id !== 'all' && item.city_id !== filters.city_id) return false;
        if (filters.street_id && filters.street_id !== 'all' && item.street_id !== filters.street_id) return false;
        
        return true;
    },
    storageKey: 'addressesView',
  }), [t]);

  const {
    items: addresses,
    loading, error, filters, setFilters, sortConfig, setSortConfig, pagination, setPagination,
    selectedItems, setSelectedItems, isDialogOpen, setIsDialogOpen, currentItem, setCurrentItem,
    handleRefresh: refreshAddresses, handleSearch, handleFilterChange, handleSortChange,
    handlePageChange, handlePageSizeChange, handleAddNew, handleEdit, handleDelete,
    handleBulkDelete, isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems // Assuming useEntityModule provides this for count
  } = useEntityModule(entityConfig);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const cityData = await City.list();
        setAllCities(Array.isArray(cityData) ? cityData : []);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        toast({ title: t('errors.fetchCitiesError', { defaultValue: "Could not load cities" }), description: error.message, variant: 'destructive'});
      }
    };
    fetchCities();
  }, [t, toast]);

  // Fetch streets when selectedCityId changes (now filters.city_id)
  useEffect(() => {
    const cityId = filters.city_id;
    if (cityId && cityId !== 'all') {
      const fetchStreets = async () => {
        try {
          const streetData = await Street.filter({ city_id: cityId });
          setAllStreets(Array.isArray(streetData) ? streetData : []);
          // If the current street filter is not in the new list of streets, reset it
          if (filters.street_id !== 'all' && !streetData.some(s => s.id === filters.street_id)) {
            handleFilterChange('street_id', 'all');
          }
        } catch (error) {
          console.error("Failed to fetch streets:", error);
          setAllStreets([]);
          toast({ title: t('errors.fetchStreetsError', { defaultValue: "Could not load streets for selected city" }), description: error.message, variant: 'warning'});
        }
      };
      fetchStreets();
    } else {
      setAllStreets([]); // Clear streets if no city selected or 'all' cities selected
      // If no city selected, ensure street filter is also 'all'
      if (filters.street_id !== 'all') {
         handleFilterChange('street_id', 'all');
      }
    }
  }, [filters.city_id, t, toast, handleFilterChange, filters.street_id]);

  const formatAddress = useCallback((address) => {
    const city = allCities.find(c => c.id === address.city_id);
    const street = allStreets.find(s => s.id === address.street_id); // This relies on allStreets being loaded for the current city
    
    const cityName = city ? (language === 'he' ? city.name_he : city.name_en) : address.city_id;
    const streetName = street ? (language === 'he' ? street.name_he : street.name_en) : address.street_id;

    let parts = [
      streetName,
      address.house_number,
      address.apartment_number ? `${t('fields.aptShort', {defaultValue: 'Apt.'})} ${address.apartment_number}` : null,
      cityName,
      address.zip_code,
    ].filter(Boolean); // Remove null/empty parts

    if (language === 'he') {
       parts = [
         cityName,
         streetName,
         address.house_number,
         address.apartment_number ? `${t('fields.aptShortHe', {defaultValue: 'דירה'})} ${address.apartment_number}` : null,
         address.zip_code,
       ].filter(Boolean);
       return parts.reverse().join(', '); // Reverse for typical Hebrew display, needs checking
    }
    return parts.join(', ');
  }, [t, language, allCities, allStreets]);

  const columns = useMemo(() => [
    { 
      accessorKey: 'full_address', 
      header: t('fields.fullAddress', { defaultValue: 'Full Address' }),
      cell: ({ row }) => formatAddress(row.original),
    },
    { accessorKey: 'notes_en', header: t('fields.notesEn', { defaultValue: 'Notes (EN)' }) },
    { accessorKey: 'notes_he', header: t('fields.notesHe', { defaultValue: 'Notes (HE)' }) },
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
  ], [t, language, allCities, allStreets, handleEdit, handleDelete, formatAddress]);
  
  const barFilterFields = useMemo(() => [
    { 
        name: 'city_id', 
        label: t('fields.city', { defaultValue: 'City' }), 
        type: 'select', 
        options: [{value: 'all', label: t('filters.allCities', {defaultValue: 'All Cities'})}, ...allCities.map(city => ({ value: city.id, label: language === 'he' ? city.name_he : city.name_en }))],
        value: filters.city_id || 'all'
    },
    { 
        name: 'street_id', 
        label: t('fields.street', { defaultValue: 'Street' }), 
        type: 'select', 
        options: [{value: 'all', label: t('filters.allStreets', {defaultValue: 'All Streets'})}, ...allStreets.map(street => ({ value: street.id, label: language === 'he' ? street.name_he : street.name_en }))],
        value: filters.street_id || 'all',
        disabled: filters.city_id === 'all' // Disable if no city is selected
    },
    // house_number and zip_code are now part of `searchTerm` as per entityConfig
  ], [t, language, allCities, allStreets, filters.city_id, filters.street_id]);


  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'addresses.address.add', defaultLabel: 'Add Address', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      handleEdit(selectedItems[0]);
      setIsSelectionModeActive(false);
    } else {
      toast({
        title: t('common.selectOneItem', { defaultValue: "Please select exactly one item to edit." }),
        variant: "warning",
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems);
      setIsSelectionModeActive(false);
    } else {
      toast({
        title: t('common.selectItemsToDelete', { defaultValue: "Please select items to delete." }),
        variant: "warning",
      });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <HomeIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('addresses.address.title')} ({filteredAndSortedItems?.length || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('addresses.address.singular')}
                t={t}
            />
        </div>
      </div>

      <SearchFilterBar
        searchQuery={filters.searchTerm} // General search query (e.g., for notes)
        onSearchChange={handleSearch}
        onFilterChange={(key, value) => handleFilterChange(key, value === '' ? 'all' : value)}
        onSortChange={handleSortChange}
        currentSort={sortConfig.key}
        sortOptions={[
            {value: 'created_date', label: t('sort.newestFirst', {defaultValue: 'Newest First'})},
            {value: '-created_date', label: t('sort.oldestFirst', {defaultValue: 'Oldest First'})},
        ]}
        filterFields={barFilterFields}
        onAddNew={() => {
            if (filters.city_id === 'all' || (filters.street_id === 'all' && allStreets.length > 0)) {
                 toast({title: t('addresses.selectCityStreetFirstTitle', { defaultValue: 'Select City & Street' }), description: t('addresses.selectCityStreetFirstDesc', { defaultValue: 'Please select a city and street from filters before adding a new address.'}), variant: 'warning'});
                 return;
            }
            // Pass initial values based on current filters
            handleAddNew({ 
                city_id: filters.city_id !== 'all' ? filters.city_id : undefined, 
                street_id: filters.street_id !== 'all' ? filters.street_id : undefined 
            });
        }}
        addNewButtonText={t('addresses.addNew', {defaultValue: 'New Address'})}
      />
      <DataTable
        columns={columns}
        data={addresses}
        loading={loading}
        error={error}
        onRetry={refreshAddresses}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        entityName={t('addresses.titlePlural', { defaultValue: 'Addresses' })}
        selectedItems={selectedItems}
        onSelectRow={handleToggleSelection}
        onSelectAll={handleSelectAll}
        isSelectionModeActive={isSelectionModeActive}
        setIsSelectionModeActive={setIsSelectionModeActive}
      />
      {/* AddressDialog is rendered internally by useEntityModule */}
    </div>
  );
};
