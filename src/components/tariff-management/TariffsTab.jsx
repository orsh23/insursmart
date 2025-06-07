import React, { useState, useEffect } from 'react';
import { Tariff } from '@/api/entities';
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import useCrudPage from '@/components/hooks/useCrudPage';
import DataTable from '@/components/shared/DataTable';
import TariffDialog from '@/components/finance/TariffDialog';
import TariffFilterBar from '@/components/finance/TariffFilterBar';
import { Button } from '@/components/ui/button';

const TariffsTab = () => {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const [contractsMap, setContractsMap] = useState({});
  const [providersMap, setProvidersMap] = useState({});

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [contracts, providers] = await Promise.all([
          Contract.list(),
          Provider.list()
        ]);
        
        const contractMap = {};
        (Array.isArray(contracts) ? contracts : []).forEach(c => {
          contractMap[c.id] = c.name_en || c.contract_number || c.id;
        });
        setContractsMap(contractMap);

        const providerMap = {};
        (Array.isArray(providers) ? providers : []).forEach(p => {
          providerMap[p.id] = p.name?.en || p.name?.he || p.id;
        });
        setProvidersMap(providerMap);
      } catch (err) {
        console.error("Failed to fetch related data for Tariffs tab", err);
        toast({ 
          title: t('errors.fetchDropdownError', {defaultValue: 'Failed to load options'}), 
          description: err.message, 
          variant: 'destructive'
        });
      }
    };
    fetchRelatedData();
  }, [t, toast]);

  const {
    allItems: tariffs, // Changed from items
    loading, // Changed from isLoading
    error,
    isDialogOpen, // Changed from dialogState.isOpen
    currentEntity, // Changed from dialogState.data
    openCreateDialog, // Changed from handleCreate
    openEditDialog, // Changed from handleEdit
    handleDelete,
    handleFormSubmit, // Changed from handleSubmit
    closeDialog, // Changed from handleCloseDialog
    fetchItems, // Changed from handleRetry
    filters,
    handleSingleFilterChange,
  } = useCrudPage({
    entitySDK: Tariff,
    entityNameSingular: t('tariffs.entityNameSingular', {defaultValue: 'Tariff'}),
    entityNamePlural: t('tariffs.titlePlural', {defaultValue: 'Tariffs'}),
    defaultSort: '-created_date',
  });

  const getContractName = (id) => contractsMap[id] || id;
  const getProviderName = (id) => providersMap[id] || id;

  const columns = React.useMemo(() => [
    { 
      accessorKey: 'contract_id', 
      header: t('fields.contract', {defaultValue: 'Contract'}), 
      cell: ({row}) => getContractName(row.original.contract_id),
      sortable: true 
    },
    { 
      accessorKey: 'insurance_code', 
      header: t('fields.insuranceCode', {defaultValue: 'Insurance Code'}), 
      sortable: true 
    },
    { 
      accessorKey: 'base_price', 
      header: t('fields.basePrice', {defaultValue: 'Base Price'}), 
      cell: ({row}) => `${row.original.base_price || 0} ${row.original.currency || 'ILS'}`,
      sortable: true 
    },
    { 
      accessorKey: 'finalization_type', 
      header: t('fields.finalizationType', {defaultValue: 'Finalization'}), 
      cell: ({row}) => t(`finalizationTypes.${row.original.finalization_type}`, {defaultValue: row.original.finalization_type})
    },
    {
      id: 'actions',
      header: t('common.actions', {defaultValue: 'Actions'}),
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}>
            {t('buttons.edit', {defaultValue: 'Edit'})}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            {t('buttons.delete', {defaultValue: 'Delete'})}
          </Button>
        </div>
      ),
    },
  ], [t, openEditDialog, handleDelete, contractsMap, providersMap]);

  const handleTariffFilterChange = (newFilters) => {
    for (const key in newFilters) {
      handleSingleFilterChange(key, newFilters[key]);
    }
  };

  return (
    <div className="space-y-4">
      <TariffFilterBar 
        onFilterChange={handleTariffFilterChange}
        onAddNew={openCreateDialog}
        currentFilters={filters.customFilters || {}}
      />
      <DataTable
        columns={columns}
        data={tariffs}
        loading={loading}
        error={error}
        onRetry={fetchItems}
        entityName={t('tariffs.titlePlural', {defaultValue: 'Tariffs'})}
      />
      {isDialogOpen && (
        <TariffDialog
          open={isDialogOpen}
          onOpenChange={closeDialog}
          tariffData={currentEntity}
          onSubmit={handleFormSubmit}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default TariffsTab;