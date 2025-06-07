
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Address } from '@/api/entities';
import { City } from '@/api/entities';
import { Street } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import useEntityModule from '@/components/hooks/useEntityModule';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import AddressDialog from './AddressDialog';
import GlobalActionButton from '@/components/common/GlobalActionButton'; // Fixed import path
import ViewSwitcher from '@/components/common/ViewSwitcher';
import BulkSelectionModal from '@/components/shared/BulkSelectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Edit, Trash2, RefreshCw, Search, Home, Building } from 'lucide-react'; // Building2 changed to Building
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

export default function AddressesTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState('table');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);

  // Fetch cities and streets for dropdowns
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [citiesData, streetsData] = await Promise.all([
          City.list(),
          Street.list()
        ]);
        setCities(Array.isArray(citiesData) ? citiesData : []);
        setStreets(Array.isArray(streetsData) ? streetsData : []);
      } catch (error) {
        console.error('Error fetching related data:', error);
      }
    };
    fetchRelatedData();
  }, []);

  const entityConfig = useMemo(() => ({
    entitySDK: Address,
    entityName: t('addresses.address.singular', { defaultValue: 'Address' }),
    entityNamePlural: t('addresses.address.plural', { defaultValue: 'Addresses' }),
    DialogComponent: AddressDialog,
    initialSort: [{ id: 'house_number', desc: false }],
    initialFilters: {
      searchTerm: '',
      cityId: 'all',
      streetId: 'all',
    },
    searchFields: ['house_number', 'apartment_number', 'zip_code', 'notes_en', 'notes_he'],
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        if (!(
          item.house_number?.toLowerCase().includes(term) ||
          item.apartment_number?.toLowerCase().includes(term) ||
          item.zip_code?.toLowerCase().includes(term) ||
          item.notes_en?.toLowerCase().includes(term) ||
          item.notes_he?.toLowerCase().includes(term)
        )) return false;
      }
      if (filters.cityId !== 'all' && item.city_id !== filters.cityId) return false;
      if (filters.streetId !== 'all' && item.street_id !== filters.streetId) return false;
      return true;
    },
    storageKey: 'addressesView',
  }), [t]);

  const {
    items: addresses,
    loading,
    error,
    filters,
    sortConfig,
    selectedItems,
    setSelectedItems,
    isSelectionModeActive,
    setIsSelectionModeActive,
    isDialogOpen,
    currentItem,
    handleRefresh: refreshAddresses,
    handleFilterChange,
    handleSortChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  // Filter addresses based on current filters
  const filteredAddresses = useMemo(() => {
    if (!Array.isArray(addresses)) return [];
    return addresses.filter(address => entityConfig.filterFunction(address, filters));
  }, [addresses, filters, entityConfig.filterFunction]);

  // Helper functions to get city and street names
  const getCityName = useCallback((cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? (language === 'he' ? (city.name_he || city.name_en) : (city.name_en || city.name_he)) : cityId;
  }, [cities, language]);

  const getStreetName = useCallback((streetId) => {
    const street = streets.find(s => s.id === streetId);
    return street ? (language === 'he' ? (street.name_he || street.name_en) : (street.name_en || street.name_he)) : streetId;
  }, [streets, language]);

  // Columns for table view
  const columns = useMemo(() => [
    {
      accessorKey: 'city_id',
      header: t('addresses.address.city', { defaultValue: 'City' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-500" />
          <span>{getCityName(row.original.city_id)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'street_id',
      header: t('addresses.address.street', { defaultValue: 'Street' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-500" />
          <span>{getStreetName(row.original.street_id)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'house_number',
      header: t('addresses.address.houseNumber', { defaultValue: 'House #' }),
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.house_number}</Badge>
      ),
    },
    {
      accessorKey: 'apartment_number',
      header: t('addresses.address.apartmentNumber', { defaultValue: 'Apt #' }),
      enableSorting: true,
      cell: ({ row }) => (
        row.original.apartment_number ? (
          <Badge variant="secondary">{row.original.apartment_number}</Badge>
        ) : (
          <span className="text-gray-400">{t('common.notSet', { defaultValue: 'N/A' })}</span>
        )
      ),
    },
    {
      accessorKey: 'zip_code',
      header: t('addresses.address.zipCode', { defaultValue: 'ZIP' }),
      enableSorting: true,
      cell: ({ row }) => (
        row.original.zip_code ? (
          <span className="font-mono">{row.original.zip_code}</span>
        ) : (
          <span className="text-gray-400">{t('common.notSet', { defaultValue: 'N/A' })}</span>
        )
      ),
    },
    {
      accessorKey: 'actions',
      header: t('common.actions', { defaultValue: 'Actions' }),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDialog({ open: true, item: row.original });
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [t, getCityName, getStreetName, handleEdit]);

  // Card view component
  const AddressCard = useCallback(({ address }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">
              {getStreetName(address.street_id)} {address.house_number}
              {address.apartment_number && `/${address.apartment_number}`}
            </CardTitle>
          </div>
          {isSelectionModeActive && (
            <Checkbox
              checked={selectedItems.includes(address.id)}
              onCheckedChange={(checked) => handleToggleSelection(address.id)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          <span>{getCityName(address.city_id)}</span>
        </div>
        {address.zip_code && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="font-mono">{address.zip_code}</span>
          </div>
        )}
        {(address.notes_en || address.notes_he) && (
          <div className="text-sm text-gray-500 mt-2">
            {language === 'he' ? (address.notes_he || address.notes_en) : (address.notes_en || address.notes_he)}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(address)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {t('common.edit', { defaultValue: 'Edit' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [selectedItems, isSelectionModeActive, getCityName, getStreetName, language, handleToggleSelection, handleEdit, t]);

  // Global actions configuration
  const globalActionsConfig = useMemo(() => [
    {
      labelKey: 'buttons.addAddress',
      defaultLabel: 'Add Address',
      icon: Plus,
      action: handleAddNew,
      type: 'add'
    },
    {
      labelKey: 'common.edit',
      defaultLabel: 'Edit',
      icon: Edit,
      action: () => {
        if (selectedItems.length === 1) {
          const item = filteredAddresses.find(a => a.id === selectedItems[0]);
          if (item) handleEdit(item);
        }
      },
      type: 'edit',
      selectionSensitive: true,
      requiredSelectionCount: 1
    },
    {
      labelKey: 'common.delete',
      defaultLabel: 'Delete',
      icon: Trash2,
      action: () => {
        if (selectedItems.length > 0) {
          setBulkAction('delete');
          setShowBulkModal(true);
        }
      },
      type: 'delete',
      selectionSensitive: true,
      requiredSelectionCount: 'any'
    }
  ], [handleAddNew, selectedItems, filteredAddresses, handleEdit]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const renderContent = () => {
    if (loading && filteredAddresses.length === 0) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} />;
    }

    if (error && filteredAddresses.length === 0) {
      return <ErrorDisplay errorMessage={error} onRetry={refreshAddresses} t={t} isRTL={isRTL} />;
    }

    if (filteredAddresses.length === 0) {
      const hasFilters = filters.searchTerm || filters.cityId !== 'all' || filters.streetId !== 'all';
      return (
        <EmptyState
          title={t('addresses.address.noAddressesTitle', { defaultValue: 'No Addresses Found' })}
          description={hasFilters ? 
            t('addresses.address.noAddressesFilterDesc', { defaultValue: 'No addresses match your search criteria.' }) :
            t('addresses.address.noAddressesDesc', { defaultValue: 'Start by adding a new address.' })
          }
          icon={Home}
          action={{
            label: t('buttons.addAddress', { defaultValue: 'Add Address' }),
            onClick: handleAddNew
          }}
        />
      );
    }

    if (currentView === 'card') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddresses.map(address => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      );
    }

    return (
      <DataTable
        columns={columns}
        data={filteredAddresses}
        loading={loading}
        onRowClick={(row) => !isSelectionModeActive && handleEdit(row.original)}
        isSelectionModeActive={isSelectionModeActive}
        selectedRowIds={new Set(selectedItems)}
        onRowSelectionChange={handleToggleSelection}
        onSelectAllRows={() => handleSelectAll(filteredAddresses.map(a => a.id))}
        currentSort={sortConfig}
        onSortChange={handleSortChange}
        t={t}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-500" />
          {t('addresses.address.plural', { defaultValue: 'Addresses' })} ({filteredAddresses.length})
        </h3>
        <div className="flex items-center gap-2">
          <GlobalActionButton
            actionsConfig={globalActionsConfig}
            isSelectionModeActive={isSelectionModeActive}
            onCancelSelectionMode={handleCancelSelectionMode}
            selectedItemCount={selectedItems.length}
            itemTypeForActions={t('addresses.address.singular', { defaultValue: 'Address' })}
            t={t}
          />
          <Button variant="outline" onClick={refreshAddresses}>
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={setCurrentView}
            availableViews={['table', 'card']}
            entityName={t('addresses.address.plural', { defaultValue: 'Addresses' })}
            t={t}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('addresses.address.searchPlaceholder', { defaultValue: 'Search addresses...' })}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filters.cityId} onValueChange={(value) => handleFilterChange('cityId', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('addresses.address.selectCity', { defaultValue: 'Select City' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCities', { defaultValue: 'All Cities' })}</SelectItem>
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id}>
                {language === 'he' ? (city.name_he || city.name_en) : (city.name_en || city.name_he)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.streetId} onValueChange={(value) => handleFilterChange('streetId', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('addresses.address.selectStreet', { defaultValue: 'Select Street' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStreets', { defaultValue: 'All Streets' })}</SelectItem>
            {streets
              .filter(street => filters.cityId === 'all' || street.city_id === filters.cityId)
              .map(street => (
                <SelectItem key={street.id} value={street.id}>
                  {language === 'he' ? (street.name_he || street.name_en) : (street.name_en || street.name_he)}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            handleFilterChange(null, entityConfig.initialFilters);
            handleSortChange(entityConfig.initialSort);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('buttons.resetFilters', { defaultValue: 'Reset' })}
        </Button>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Dialogs */}
      {isDialogOpen && (
        <AddressDialog
          isOpen={isDialogOpen}
          onClose={handleSelfSubmittingDialogClose}
          address={currentItem}
          cities={cities}
          streets={streets}
          t={t}
          language={language}
          isRTL={isRTL}
        />
      )}

      {showBulkModal && (
        <BulkSelectionModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          action={bulkAction}
          selectedCount={selectedItems.length}
          entityName={entityConfig.entityNamePlural}
          onConfirm={async () => {
            if (bulkAction === 'delete') {
              await handleBulkDelete(selectedItems);
            }
            setShowBulkModal(false);
            setSelectedItems([]);
            setIsSelectionModeActive(false);
          }}
          t={t}
        />
      )}

      {confirmDialog.open && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ open, item: null })}
          onConfirm={async () => {
            if (confirmDialog.item) {
              await handleBulkDelete([confirmDialog.item.id]);
            }
            setConfirmDialog({ open: false, item: null });
          }}
          title={t('common.confirmDeleteTitle', { defaultValue: 'Confirm Delete' })}
          description={t('common.confirmDeleteDescription', { defaultValue: 'Are you sure you want to delete this item?' })}
          confirmText={t('common.delete', { defaultValue: 'Delete' })}
          cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
          t={t}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}
