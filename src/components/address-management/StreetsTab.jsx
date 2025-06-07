
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Street } from '@/api/entities';
import { City } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import useEntityModule from '@/components/hooks/useEntityModule';
import { DataTable } from '@/components/ui/data-table';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import StreetDialog from './StreetDialog';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import BulkSelectionModal from '@/components/shared/BulkSelectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Replaced 'Road' with 'Milestone' as it is a valid icon
import { MapPin, Plus, Edit, Trash2, RefreshCw, Search, Building2, Milestone, Filter } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

export default function StreetsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState('table');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch cities for filter dropdown
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const cityData = await City.list(undefined, 1000);
        setCities(Array.isArray(cityData) ? cityData : []);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, []);

  const entityConfig = useMemo(() => ({
    entitySDK: Street,
    entityName: t('addresses.street.singular', { defaultValue: 'Street' }),
    entityNamePlural: t('addresses.street.plural', { defaultValue: 'Streets' }),
    DialogComponent: StreetDialog,
    initialSort: [{ id: 'name_en', desc: false }],
    initialFilters: {
      searchTerm: '',
      cityId: 'all',
    },
    searchFields: ['name_en', 'name_he'],
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        if (!(
          item.name_en?.toLowerCase().includes(term) ||
          item.name_he?.toLowerCase().includes(term)
        )) return false;
      }
      if (filters.cityId !== 'all' && item.city_id !== filters.cityId) return false;
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
    selectedItems,
    setSelectedItems,
    isSelectionModeActive,
    setIsSelectionModeActive,
    isDialogOpen,
    currentItem,
    handleRefresh: refreshStreets,
    handleFilterChange,
    handleSortChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  // Filter streets based on current filters
  const filteredStreets = useMemo(() => {
    if (!Array.isArray(streets)) return [];
    return streets.filter(street => entityConfig.filterFunction(street, filters));
  }, [streets, filters, entityConfig.filterFunction]);

  // Get city name by ID
  const getCityName = useCallback((cityId) => {
    const city = cities.find(c => c.id === cityId);
    if (!city) return t('common.unknownCity', { defaultValue: 'Unknown City' });
    return language === 'he' ? (city.name_he || city.name_en) : (city.name_en || city.name_he);
  }, [cities, language, t]);

  // Columns for table view
  const columns = useMemo(() => [
    {
      accessorKey: 'name_en',
      header: t('addresses.street.nameEn', { defaultValue: 'Name (EN)' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Milestone className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{row.original.name_en}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name_he',
      header: t('addresses.street.nameHe', { defaultValue: 'Name (HE)' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Milestone className="w-4 h-4 text-green-500" />
          <span className="font-medium">{row.original.name_he}</span>
        </div>
      ),
    },
    {
      accessorKey: 'city_id',
      header: t('addresses.street.city', { defaultValue: 'City' }),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span>{getCityName(row.original.city_id)}</span>
        </div>
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
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDialog({ open: true, item: row.original })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [t, handleEdit, getCityName]);

  // Handle selection mode
  const handleStartSelectionMode = useCallback((action) => {
    setBulkAction(action);
    setIsSelectionModeActive(true);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
    setBulkAction('');
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleBulkAction = useCallback(async () => {
    if (selectedItems.length === 0) return;

    if (bulkAction === 'delete') {
      setShowBulkModal(true);
    }
  }, [selectedItems, bulkAction]);

  const handleConfirmBulkDelete = useCallback(async () => {
    const result = await handleBulkDelete(selectedItems);
    
    toast({
      title: t('bulkActions.deleteResultTitle', { defaultValue: 'Deletion Summary' }),
      description: t('bulkActions.deleteResultDesc', {
        defaultValue: 'Successfully deleted {{successCount}} streets, failed to delete {{failCount}}.',
        successCount: result.successCount,
        failCount: result.failCount,
        entity: t('addresses.street.plural', { defaultValue: 'streets' })
      }),
      variant: result.failCount > 0 ? 'warning' : 'default'
    });

    setShowBulkModal(false);
    handleCancelSelectionMode();
  }, [handleBulkDelete, selectedItems, toast, t, handleCancelSelectionMode]);

  const handleSingleDelete = useCallback(async () => {
    if (!confirmDialog.item) return;
    
    const result = await handleBulkDelete([confirmDialog.item.id]);
    
    if (result.successCount > 0) {
      toast({
        title: t('common.deleteSuccess', { defaultValue: 'Item deleted successfully.' }),
        variant: 'default'
      });
    } else {
      toast({
        title: t('common.deleteError', { defaultValue: 'Failed to delete item.' }),
        variant: 'destructive'
      });
    }
    
    setConfirmDialog({ open: false, item: null });
  }, [confirmDialog.item, handleBulkDelete, toast, t]);

  // Card view component
  const StreetCard = useCallback(({ street }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Milestone className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">{street.name_en}</CardTitle>
          </div>
          {isSelectionModeActive && (
            <Checkbox
              checked={selectedItems.includes(street.id)}
              onCheckedChange={(checked) => handleToggleSelection(street.id)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('addresses.street.nameHe', { defaultValue: 'Hebrew:' })}</span>
            <span className="font-medium">{street.name_he}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">{t('addresses.street.city', { defaultValue: 'City:' })}</span>
            <span>{getCityName(street.city_id)}</span>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(street)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setConfirmDialog({ open: true, item: street })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [t, isSelectionModeActive, selectedItems, handleToggleSelection, handleEdit, getCityName]);

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={refreshStreets} t={t} isRTL={isRTL} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
          <div className="flex items-center gap-2">
            <Input
              placeholder={t('addresses.street.searchPlaceholder', { defaultValue: 'Search streets...' })}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-64"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <Select 
            value={filters.cityId} 
            onValueChange={(value) => handleFilterChange('cityId', value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('addresses.street.selectCity', { defaultValue: 'Select City' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('addresses.street.allCities', { defaultValue: 'All Cities' })}</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {language === 'he' ? (city.name_he || city.name_en) : (city.name_en || city.name_he)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isSelectionModeActive ? (
            <BulkSelectionModal
              isOpen={isSelectionModeActive}
              onConfirm={handleBulkAction}
              onCancel={handleCancelSelectionMode}
              selectedItemCount={selectedItems.length}
              itemTypeForActions={t('addresses.street.singular', { defaultValue: 'Street' })}
              t={t}
            />
          ) : (
            <GlobalActionButton
              actions={[
                {
                  key: 'add',
                  label: t('buttons.add', { defaultValue: 'Add Street' }),
                  icon: Plus,
                  onClick: handleAddNew,
                  variant: 'default'
                },
                {
                  key: 'bulk_delete',
                  label: t('buttons.bulkDelete', { defaultValue: 'Bulk Delete' }),
                  icon: Trash2,
                  onClick: () => handleStartSelectionMode('delete'),
                  variant: 'destructive'
                }
              ]}
              t={t}
            />
          )}
          <Button variant="outline" onClick={refreshStreets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message={t('messages.loadingData', { item: t('addresses.street.plural', { defaultValue: 'streets' }) })} />
      ) : filteredStreets.length === 0 ? (
        <EmptyState
          title={t('addresses.street.noStreetsTitle', { defaultValue: 'No Streets Found' })}
          description={filters.searchTerm || filters.cityId !== 'all' ? 
            t('addresses.street.noStreetsFilterDesc', { defaultValue: 'No streets match your search criteria.' }) :
            t('addresses.street.noStreetsDesc', { defaultValue: 'Start by adding a new street.' })
          }
          icon={Milestone}
          action={{
            label: t('buttons.addStreet', { defaultValue: 'Add Street' }),
            onClick: handleAddNew
          }}
        />
      ) : currentView === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredStreets}
          loading={loading}
          error={error}
          onRetry={refreshStreets}
          entityName={t('addresses.street.plural', { defaultValue: 'streets' })}
          emptyMessage={t('addresses.street.noStreetsTitle', { defaultValue: 'No streets found' })}
          onRowClick={!isSelectionModeActive ? ({ original }) => handleEdit(original) : undefined}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={handleToggleSelection}
          onSelectAllRows={(checked) => {
            if (checked) {
              handleSelectAll(filteredStreets.map(street => street.id));
            } else {
              handleSelectAll([]);
            }
          }}
          currentSort={sortConfig}
          onSortChange={handleSortChange}
          t={t}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStreets.map((street) => (
            <StreetCard key={street.id} street={street} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {isDialogOpen && (
        <StreetDialog
          street={currentItem}
          cities={cities}
          open={isDialogOpen}
          onClose={handleSelfSubmittingDialogClose}
        />
      )}

      {showBulkModal && (
        <ConfirmationDialog
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onConfirm={handleConfirmBulkDelete}
          title={t('common.confirmDeleteTitle', { 
            item: t('addresses.street.plural', { defaultValue: 'Streets' }),
            count: selectedItems.length 
          })}
          description={t('common.confirmDeleteDescription', {
            item: `${selectedItems.length} ${t('addresses.street.plural', { defaultValue: 'streets' })}`,
            count: selectedItems.length
          })}
        />
      )}

      {confirmDialog.open && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, item: null })}
          onConfirm={handleSingleDelete}
          title={t('common.confirmDelete', { defaultValue: 'Confirm Delete' })}
          description={t('addresses.street.deleteConfirm', {
            defaultValue: 'Are you sure you want to delete "{{name}}"?',
            name: confirmDialog.item?.name_en
          })}
        />
      )}
    </div>
  );
}
