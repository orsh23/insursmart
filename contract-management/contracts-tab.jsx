import React, { useState, useMemo } from 'react';
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities';
import { useEntityModule } from '@/components/hooks/useEntityModule';
import { useLanguageHook } from '@/components/useLanguageHook';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText, Calendar, Building2 } from 'lucide-react';
import ContractDialog from './ContractDialog';
import { formatDate } from '@/components/utils/date-utils';
import { getLocalizedValue } from '@/components/utils/i18n-utils'; // Import the utility

export default function ContractsTab() {
  const { t, language } = useLanguageHook(); // Added language
  const [showDialog, setShowDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [providers, setProviders] = useState([]);

  // Fetch providers for dropdown
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providerData = await Provider.list();
        setProviders(Array.isArray(providerData) ? providerData : []);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        setProviders([]);
      }
    };
    fetchProviders();
  }, []);

  // Filter function for contracts
  const contractFilterFunction = (contract, filters) => {
    const searchTerm = filters.searchTerm?.toLowerCase() || '';
    const statusFilter = filters.status || 'all';
    const providerFilter = filters.provider_id || 'all';

    // Search in contract number, name
    const matchesSearch = !searchTerm || 
      contract.contract_number?.toLowerCase().includes(searchTerm) ||
      getLocalizedValue(contract, 'name', language, 'en')?.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    // Provider filter
    const matchesProvider = providerFilter === 'all' || contract.provider_id === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  };

  const {
    items: contracts,
    loading,
    error,
    filters,
    handleFilterChange,
    handleRefresh,
    pagination,
    handlePageChange
  } = useEntityModule({
    entitySDK: Contract,
    entityName: 'Contract',
    entityNamePlural: 'Contracts',
    initialFilters: { searchTerm: '', status: 'all', provider_id: 'all' },
    filterFunction: contractFilterFunction,
    storageKey: 'contracts',
    defaultSort: { key: 'updated_date', direction: 'descending' }
  });

  const handleSearch = (value) => {
    handleFilterChange({ searchTerm: value });
  };

  const handleStatusFilter = (value) => {
    handleFilterChange({ status: value });
  };

  const handleProviderFilter = (value) => {
    handleFilterChange({ provider_id: value });
  };

  const handleCreateContract = () => {
    setSelectedContract(null);
    setShowDialog(true);
  };

  const handleEditContract = (contract) => {
    setSelectedContract(contract);
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setSelectedContract(null);
    handleRefresh();
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? getLocalizedValue(provider, 'name', language, 'en', t('common.unknownProvider', {defaultValue: 'Unknown Provider'})) : t('common.unknownProvider', {defaultValue: 'Unknown Provider'});
  };
  
  const getContractName = (contract) => {
     return getLocalizedValue(contract, 'name', language, 'en', contract.contract_number || '');
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', labelKey: 'status.draft', defaultLabel: 'Draft' },
      active: { variant: 'default', labelKey: 'status.active', defaultLabel: 'Active' },
      expired: { variant: 'destructive', labelKey: 'status.expired', defaultLabel: 'Expired' },
      terminated: { variant: 'outline', labelKey: 'status.terminated', defaultLabel: 'Terminated' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{t(config.labelKey, {defaultValue: config.defaultLabel})}</Badge>;
  };

  const columns = [
    {
      accessorKey: 'contract_number',
      header: () => t('contracts.fields.contractNumber', { defaultValue: 'Contract Number' }),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.contract_number}</div>
      )
    },
    {
      accessorKey: 'name_en', // Keep accessorKey for sorting if needed, cell handles display
      header: () => t('contracts.fields.name', { defaultValue: 'Name' }),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{getContractName(row.original)}</div>
          {/* Display other language if different and exists */}
          {language === 'en' && row.original.name_he && <div className="text-sm text-muted-foreground">{row.original.name_he}</div>}
          {language === 'he' && row.original.name_en && row.original.name_he !== row.original.name_en && <div className="text-sm text-muted-foreground">{row.original.name_en}</div>}
        </div>
      )
    },
    {
      accessorKey: 'provider_id',
      header: () => t('contracts.fields.provider', { defaultValue: 'Provider' }),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {getProviderName(row.original.provider_id)}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: () => t('contracts.fields.status', { defaultValue: 'Status' }),
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      accessorKey: 'valid_from',
      header: () => t('contracts.fields.validFrom', { defaultValue: 'Valid From' }),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.original.valid_from, language)}
        </div>
      )
    },
    {
      accessorKey: 'valid_to',
      header: () => t('contracts.fields.validTo', { defaultValue: 'Valid To' }),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.original.valid_to, language)}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('contracts.titleMultiple', { defaultValue: 'Contracts' })}</h2>
          <p className="text-muted-foreground">
            {t('contracts.description', { defaultValue: 'Manage provider contracts and agreements.' })}
          </p>
        </div>
        <Button onClick={handleCreateContract} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('contracts.addNew', { defaultValue: 'Add Contract' })}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('common.filtersAndSort', { defaultValue: 'Filters & Search' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('contracts.searchPlaceholder', { defaultValue: 'Search contracts...' })}
                value={filters.searchTerm || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectStatus', { defaultValue: 'Select Status' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses', { defaultValue: 'All Statuses' })}</SelectItem>
                <SelectItem value="draft">{t('status.draft', { defaultValue: 'Draft' })}</SelectItem>
                <SelectItem value="active">{t('status.active', { defaultValue: 'Active' })}</SelectItem>
                <SelectItem value="expired">{t('status.expired', { defaultValue: 'Expired' })}</SelectItem>
                <SelectItem value="terminated">{t('status.terminated', { defaultValue: 'Terminated' })}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.provider_id || 'all'} onValueChange={handleProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectProvider', { defaultValue: 'Select Provider' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allProviders', { defaultValue: 'All Providers' })}</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {getLocalizedValue(provider, 'name', language, 'en', `Provider ${provider.id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={contracts}
        loading={loading}
        error={error}
        emptyMessage={t('contracts.noContractsFound', { defaultValue: 'No contracts found.' })}
        onRowClick={(row) => handleEditContract(row.original)}
        entityName={t('contracts.itemTitleSingular', { defaultValue: 'contract' })}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRetry={handleRefresh}
      />

      {/* Contract Dialog */}
      {showDialog && (
        <ContractDialog
          contract={selectedContract}
          open={showDialog}
          onClose={handleDialogClose}
          providers={providers}
        />
      )}
    </div>
  );
}