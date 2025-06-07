import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FilterX, FileText, RefreshCw, AlertTriangle, Briefcase, Calendar, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContractDialog from './ContractDialog';
import { useToast } from '@/components/ui/use-toast';
import useEntityModule from '@/components/hooks/useEntityModule';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import { getLocalizedValue } from '@/components/utils/i18n-utils';
import { DataTable } from '@/components/ui/data-table';

// Sample data for fallback
const sampleContracts = [
  { 
    id: "contract-1", 
    provider_id: "provider-1", 
    contract_number: "CTR-2023-001", 
    name_en: "General Services Agreement", 
    name_he: "הסכם שירותים כללי",
    valid_from: "2023-01-01",
    valid_to: "2023-12-31",
    status: "active",
    created_date: "2023-01-01T10:00:00Z",
    updated_date: "2023-01-15T14:30:00Z"
  },
  { 
    id: "contract-2", 
    provider_id: "provider-2", 
    contract_number: "CTR-2024-SPECIAL-A", 
    name_en: "Special Cardiology Services", 
    name_he: "שירותי קרדיולוגיה מיוחדים",
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    status: "draft",
    created_date: "2024-01-01T09:00:00Z",
    updated_date: "2024-01-10T11:15:00Z"
  },
];

const sampleProviders = [
  { id: "provider-1", name: { en: "General Hospital", he: "בית חולים כללי" } },
  { id: "provider-2", name: { en: "Cardiology Center", he: "מרכז קרדיולוגיה" } },
];

export default function ContractsTab({ globalActionsConfig: externalActionsConfig }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [allProviders, setAllProviders] = useState([]);

  // Safe date formatter
  const formatCellDate = useCallback((dateValue) => {
    if (!dateValue) return t('common.notSet', { defaultValue: 'N/A' });
    
    try {
      let dateObj;
      if (dateValue instanceof Date) {
        dateObj = dateValue;
      } else if (typeof dateValue === 'string') {
        dateObj = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      } else {
        return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      }

      if (isNaN(dateObj.getTime())) {
        return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      }

      return dateObj.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date in cell:', error, dateValue);
      return t('common.invalidDate', { defaultValue: 'Invalid Date' });
    }
  }, [language, t]);

  // Fetch providers for filter dropdown
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      let providers;
      try { 
        providers = await Provider.list(); 
      } catch (apiError) {
        console.warn('API call failed for providers, using sample data:', apiError);
        providers = sampleProviders; 
      }
      const validProviders = Array.isArray(providers) ? providers : [];
      setAllProviders(validProviders);
    } catch (err) { 
      console.error('Error fetching providers:', err);
      setAllProviders(sampleProviders); 
    }
  }, []);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  const entityConfig = useMemo(() => ({
    entitySDK: Contract,
    entityName: t('contracts.itemTitleSingular', { defaultValue: 'Contract' }),
    entityNamePlural: t('contracts.itemTitlePlural', { defaultValue: 'Contracts' }),
    DialogComponent: ContractDialog,
    FormComponent: null, 
    initialFilters: {
      searchTerm: '',
      providerId: 'all',
      status: 'all',
      page: 1,
      pageSize: 10,
    },
    filterFunction: (contract, filters) => {
        const searchTermLower = filters.searchTerm?.toLowerCase() || '';
        const provider = (allProviders || []).find(p => p.id === contract.provider_id);

        const matchesSearch = !filters.searchTerm ||
            (contract.contract_number?.toLowerCase().includes(searchTermLower)) ||
            (getLocalizedValue(contract, 'name', language, 'en')?.toLowerCase().includes(searchTermLower)) ||
            (provider && getLocalizedValue(provider, 'name', language, 'en')?.toLowerCase().includes(searchTermLower));

        const matchesProvider = filters.providerId === 'all' || contract.provider_id === filters.providerId;
        const matchesStatus = filters.status === 'all' || contract.status === filters.status;

        return matchesSearch && matchesProvider && matchesStatus;
    },
    storageKey: 'contractsView',
    defaultSort: { key: 'contract_number', direction: 'asc' }, 
  }), [t, allProviders, language]);

  const {
    items: filteredAndSortedItems = [],
    loading = false, 
    error = null, 
    filters = {}, 
    setFilters,
    selectedItems = [], 
    setSelectedItems, 
    isDialogOpen = false, 
    setIsDialogOpen, 
    currentItem = null, 
    setCurrentItem,
    handleRefresh: refreshContractsInternal, 
    handleFilterChange,
    handleAddNew, 
    handleEdit, 
    handleDelete, 
    handleBulkDelete, 
    isSelectionModeActive = false, 
    setIsSelectionModeActive,
    handleToggleSelection, 
    handleSelectAll, 
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig) || {};

  const refreshContracts = useCallback((force = false) => {
    fetchAuxiliaryData(); 
    if (refreshContractsInternal) refreshContractsInternal(); 
  }, [fetchAuxiliaryData, refreshContractsInternal]);

  const providerOptions = useMemo(() => {
    const providers = allProviders || [];
    return [
      { value: 'all', label: t('filters.allProviders', {defaultValue: 'All Providers'}) }, 
      ...providers.map(p => ({ 
        value: p.id, 
        label: getLocalizedValue(p, 'name', language, 'en') || p.id
      }))
    ];
  }, [allProviders, t, language]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'draft', label: t('status.draft', { defaultValue: 'Draft' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'expired', label: t('status.expired', { defaultValue: 'Expired' }) },
    { value: 'terminated', label: t('status.terminated', { defaultValue: 'Terminated' }) },
  ], [t]);

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'contracts.addContract', defaultLabel: 'Add Contract', icon: Plus, action: handleAddNew, type: 'add'},
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig]);

  const handleEditWithSelectionCheck = useCallback(() => {
    const selectedItemsArray = selectedItems || [];
    const filteredItems = filteredAndSortedItems || [];
    
    if (selectedItemsArray.length === 1) {
      const itemToEdit = filteredItems.find(item => item.id === selectedItemsArray[0]);
      if (itemToEdit && handleEdit) {
        handleEdit(itemToEdit); 
      } else {
        toast({ 
          title: t('common.error'), 
          description: t('errors.itemNotFoundToEditDesc', {item: t('contracts.itemTitleSingular')}), 
          variant: 'destructive' 
        });
      }
      if (setIsSelectionModeActive) setIsSelectionModeActive(false);
      if (setSelectedItems) setSelectedItems([]);
    } else if (selectedItemsArray.length > 1) {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectOneToEditDesc', { entity: t('contracts.itemTitleSingular') }),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectItemsPromptShort', { mode: t('common.edit').toLowerCase() }),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, setSelectedItems, t, toast, filteredAndSortedItems]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    const selectedItemsArray = selectedItems || [];
    if (selectedItemsArray.length > 0 && handleBulkDelete) {
      handleBulkDelete(); 
    } else {
      toast({
        title: t('common.error'),
        description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete').toLowerCase()}),
        variant: 'destructive',
      });
    }
  }, [selectedItems, handleBulkDelete, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    if (setIsSelectionModeActive) setIsSelectionModeActive(false);
    if (setSelectedItems) setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);
  
  const currentLoading = loading;
  const currentError = error;

  const columns = useMemo(() => [
    {
      accessorKey: 'contract_number',
      header: t('contracts.fields.contractNumber', { defaultValue: 'Contract Number' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original?.contract_number || t('common.notSet', { defaultValue: 'N/A' })}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('contracts.fields.name', { defaultValue: 'Contract Name' }),
      enableSorting: true,
      cell: ({ row }) => {
        const name = getLocalizedValue(row.original, 'name', language, 'en');
        return (
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="truncate" title={name}>
              {name || t('common.notSet', { defaultValue: 'N/A' })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'provider_id',
      header: t('contracts.fields.provider', { defaultValue: 'Provider' }),
      enableSorting: true,
      cell: ({ row }) => {
        const providerId = row.original?.provider_id;
        if (!providerId) return t('common.notSet', { defaultValue: 'N/A' });
        
        const provider = allProviders?.find(p => p.id === providerId);
        const providerName = provider ? getLocalizedValue(provider, 'name', language, 'en') : providerId;
        
        return (
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span className="truncate" title={providerName}>
              {providerName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('contracts.fields.status', { defaultValue: 'Status' }),
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original?.status;
        if (!status) return t('common.notSet', { defaultValue: 'N/A' });
        
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          draft: 'bg-yellow-100 text-yellow-800',
          expired: 'bg-red-100 text-red-800',
          terminated: 'bg-gray-100 text-gray-800',
        };
        
        return (
          <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
            {t(`status.${status}`, { defaultValue: status })}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'valid_from',
      header: t('contracts.fields.validFrom', { defaultValue: 'Valid From' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{formatCellDate(row.original?.valid_from)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'valid_to',
      header: t('contracts.fields.validTo', { defaultValue: 'Valid To' }),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{formatCellDate(row.original?.valid_to)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'created_date',
      header: t('common.created', { defaultValue: 'Created' }),
      enableSorting: true,
      cell: ({ row }) => formatCellDate(row.original?.created_date),
    },
  ], [t, language, allProviders, formatCellDate, isRTL]);

  if (currentLoading && (!filteredAndSortedItems || filteredAndSortedItems.length === 0)) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('contracts.itemTitlePlural', { defaultValue: 'Contracts'}) })} />;
  }

  if (currentError && (!filteredAndSortedItems || filteredAndSortedItems.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">{t('errors.dataLoadErrorTitle', { defaultValue: 'Error Loading Data' })}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{currentError}</p>
        <Button onClick={() => refreshContracts(true)} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> {t('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Briefcase className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('contracts.titleMultiple', { defaultValue: 'Contracts' })} ({(filteredAndSortedItems && filteredAndSortedItems.length) || 0})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={(selectedItems && selectedItems.length) || 0}
                itemTypeForActions={t('contracts.itemTitleSingular', { defaultValue: 'Contract' })}
                t={t}
              />
            <Button onClick={() => refreshContracts(true)} variant="outline" disabled={currentLoading}>
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${currentLoading ? 'animate-spin' : ''}`} />{t('buttons.refresh')}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('contracts.filtersTitle', {defaultValue: 'Filter Contracts'})}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              placeholder={t('search.placeholderContracts', {defaultValue: 'Search contracts...'})}
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange && handleFilterChange('searchTerm', e.target.value)}
            />
            <Select value={filters.providerId || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('providerId', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectProvider')}/></SelectTrigger>
              <SelectContent>
                {providerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange && handleFilterChange('status', value)}>
              <SelectTrigger><SelectValue placeholder={t('filters.selectStatus')}/></SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <Button variant="outline" onClick={() => setFilters && setFilters(entityConfig.initialFilters)}>
              <FilterX className="h-4 w-4 mr-2 rtl:ml-2" />{t('buttons.resetFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentLoading && filteredAndSortedItems && filteredAndSortedItems.length > 0 && (
        <LoadingSpinner message={t('messages.updatingData', { item: t('contracts.itemTitlePlural') })} />
      )}

      {!currentLoading && (!filteredAndSortedItems || filteredAndSortedItems.length === 0) ? (
        <EmptyState 
          icon={FileText} 
          title={t('contracts.noContractsMatchFilters', {defaultValue: 'No Contracts Match Filters'})} 
          description={t('contracts.tryAdjustingFiltersOrAdd', {defaultValue:'Try adjusting filters or add a new contract.'})} 
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredAndSortedItems} 
          loading={currentLoading}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItems)}
          onRowSelectionChange={handleToggleSelection}
          onSelectAllRows={handleSelectAll}
          onRowClick={handleEdit}
          t={t}
        />
      )}

      {isDialogOpen && ContractDialog && handleSelfSubmittingDialogClose && (
        <ContractDialog
          isOpen={isDialogOpen}
          onClose={(refreshNeeded, actionType) => {
            handleSelfSubmittingDialogClose(refreshNeeded, actionType, t('contracts.itemTitleSingular'));
          }}
          contract={currentItem}
          t={t}
          allProviders={allProviders}
        />
      )}
    </div>
  );
}