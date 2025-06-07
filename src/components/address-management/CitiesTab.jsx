
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { City } from '@/api/entities'; // Fixed: reverted to correct entity path
import { useLanguageHook } from '@/components/useLanguageHook';
import useEntityModule from '@/components/hooks/useEntityModule';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import CityDialog from './CityDialog';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import BulkSelectionModal from '@/components/shared/BulkSelectionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Edit, Trash2, RefreshCw, Search, Building2, Globe } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

export default function CitiesTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState('table');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });

  const entityConfig = useMemo(() => ({
    entitySDK: City,
    entityName: t('addresses.city.singular', { defaultValue: 'City' }),
    entityNamePlural: t('addresses.city.plural', { defaultValue: 'Cities' }),
    DialogComponent: CityDialog,
    initialSort: [{ id: 'name_en', desc: false }],
    initialFilters: {
      searchTerm: '',
    },
    searchFields: ['name_en', 'name_he', 'code'],
    filterFunction: (item, filters) => {
      const term = filters.searchTerm?.toLowerCase();
      if (term) {
        if (!(
          item.name_en?.toLowerCase().includes(term) ||
          item.name_he?.toLowerCase().includes(term) ||
          item.code?.toLowerCase().includes(term)
        )) return false;
      }
      return true;
    },
    storageKey: 'citiesView',
  }), [t]);

  const {
    items: cities,
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
    handleRefresh: refreshCities,
    handleFilterChange,
    handleSortChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig);

  // Filter cities based on current filters
  const filteredCities = useMemo(() => {
    if (!Array.isArray(cities)) return [];
    return cities.filter(city => entityConfig.filterFunction(city, filters));
  }, [cities, filters, entityConfig.filterFunction]);

  // Columns for table view
  const columns = useMemo(() => [
    {
      accessorKey: 'name_en',
      header: t('addresses.city.nameEn', { defaultValue: 'Name (EN)' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{row.original.name_en}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name_he',
      header: t('addresses.city.nameHe', { defaultValue: 'Name (HE)' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-500" />
          <span className="font-medium">{row.original.name_he}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: t('addresses.city.code', { defaultValue: 'Code' }),
      enableSorting: true,
      cell: ({ row }) => (
        row.original.code ? (
          <Badge variant="outline">{row.original.code}</Badge>
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
  ], [t, handleEdit]);

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
        defaultValue: 'Successfully deleted {{successCount}} cities, failed to delete {{failCount}}.',
        successCount: result.successCount,
        failCount: result.failCount,
        entity: t('addresses.city.plural', { defaultValue: 'cities' })
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
  const CityCard = useCallback(({ city }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">{city.name_en}</CardTitle>
          </div>
          {isSelectionModeActive && (
            <Checkbox
              checked={selectedItems.includes(city.id)}
              onCheckedChange={(checked) => handleToggleSelection(city.id)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('addresses.city.nameHe', { defaultValue: 'Hebrew:' })}</span>
            <span className="font-medium">{city.name_he}</span>
          </div>
          {city.code && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('addresses.city.code', { defaultValue: 'Code:' })}</span>
              <Badge variant="outline">{city.code}</Badge>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(city)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setConfirmDialog({ open: true, item: city })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [t, isSelectionModeActive, selectedItems, handleToggleSelection, handleEdit]);

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={refreshCities} t={t} isRTL={isRTL} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
          <div className="flex items-center gap-2">
            <Input
              placeholder={t('addresses.city.searchPlaceholder', { defaultValue: 'Search cities...' })}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-64"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelectionModeActive ? (
            <BulkSelectionModal
              isOpen={isSelectionModeActive}
              onConfirm={handleBulkAction}
              onCancel={handleCancelSelectionMode}
              selectedItemCount={selectedItems.length}
              itemTypeForActions={t('addresses.city.singular', { defaultValue: 'City' })}
              t={t}
            />
          ) : (
            <GlobalActionButton
              actions={[
                {
                  key: 'add',
                  label: t('buttons.add', { defaultValue: 'Add City' }),
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
          <Button variant="outline" onClick={refreshCities}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message={t('messages.loadingData', { item: t('addresses.city.plural', { defaultValue: 'cities' }) })} />
      ) : filteredCities.length === 0 ? (
        <EmptyState
          title={t('addresses.city.noCitiesTitle', { defaultValue: 'No Cities Found' })}
          description={filters.searchTerm ? 
            t('addresses.city.noCitiesFilterDesc', { defaultValue: 'No cities match your search criteria.' }) :
            t('addresses.city.noCitiesDesc', { defaultValue: 'Start by adding a new city.' })
          }
          icon={MapPin}
          action={{
            label: t('buttons.addCity', { defaultValue: 'Add City' }),
            onClick: handleAddNew
          }}
        />
      ) : currentView === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredCities}
          loading={loading}
          error={error}
          onRetry={refreshCities}
          entityName={t('addresses.city.plural', { defaultValue: 'cities' })}
          emptyMessage={t('addresses.city.noCitiesTitle', { defaultValue: 'No cities found' })}
          onRowClick={!isSelectionModeActive ? ({ original }) => handleEdit(original) : undefined}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={handleToggleSelection}
          onSelectAllRows={(checked) => {
            if (checked) {
              handleSelectAll(filteredCities.map(city => city.id));
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
          {filteredCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {isDialogOpen && (
        <CityDialog
          city={currentItem}
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
            item: t('addresses.city.plural', { defaultValue: 'Cities' }),
            count: selectedItems.length 
          })}
          description={t('common.confirmDeleteDescription', {
            item: `${selectedItems.length} ${t('addresses.city.plural', { defaultValue: 'cities' })}`,
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
          description={t('addresses.city.deleteConfirm', {
            defaultValue: 'Are you sure you want to delete "{{name}}"?',
            name: confirmDialog.item?.name_en
          })}
        />
      )}
    </div>
  );
}
