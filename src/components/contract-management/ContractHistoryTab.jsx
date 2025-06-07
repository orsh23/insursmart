import React, { useState, useEffect, useCallback } from 'react';
// Assuming ContractHistory is a separate entity or derived from Contract audit logs
// For now, let's mock some history or use a placeholder.
// import { ContractHistory } from '@/api/entities/ContractHistory'; 
import { Contract } from '@/api/entities'; // Use Contract for now to show something
import { Provider } from '@/api/entities';
import { User } from '@/api/entities'; // For "Modified By"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, History, Building2, User as UserIcon, CalendarDays, RepeatIcon, FileEdit, FilePlus, FileX, FileCheck2, PenTool } from 'lucide-react'; // Removed Trash2, PlusCircle, Edit as they seem unused
import ContractHistoryFilterBar from './ContractHistoryFilterBar'; // Import filter bar
// import HistoryDetailsDialog from './HistoryDetailsDialog'; // Assuming a dialog
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input"
// Import the simplified Select and SelectItem
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Updated import


const SimpleCard = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className} border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow`}>
    {children}
  </div>
);

// Helper to safely capitalize strings
const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function ContractHistoryTab() {
  // const { t, isRTL, language } = useLanguageHook(); // Removed, using hardcoded text
  const language = 'en'; // Assuming English for now for provider name logic
  const [historyItems, setHistoryItems] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]); // For Modified By filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    provider_id: 'all',
    changeType: 'all', // e.g., 'creation', 'update'
    user_id: 'all', // User who made the change
    startDate: '',
    endDate: '',
    contractNumber: '',
    sortDirection: 'desc',
    sortField: 'timestamp',
    fieldChanged: 'all'
  });

  // const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  // const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Extended change types for more granular filtering
  const changeTypeOptions = [
    { value: "all", label: "All Change Types"},
    { value: "creation", label: "Creation" },
    { value: "update", label: "Update" },
    { value: "status_change", label: "Status Change" },
    { value: "renewal", label: "Renewal" },
    { value: "termination", label: "Termination" },
    { value: "scope_change", label: "Scope Change" },
    { value: "term_change", label: "Terms Change" },
    { value: "amendment", label: "Amendment" }
  ];

  // Field change options
  const fieldChangeOptions = [
    { value: "all", label: "All Fields"},
    { value: "validity", label: "Validity Dates"},
    { value: "status", label: "Status"},
    { value: "payment_terms", label: "Payment Terms"},
    { value: "scope", label: "Scope Rules"},
    { value: "special_conditions", label: "Special Conditions"}
  ];

  const getChangeDescription = (changeType, contractNumber, fieldChanged) => {
    const cn = contractNumber || 'N/A';
    const fc = fieldChanged || 'N/A';
    const fieldLabel = fieldChangeOptions.find(f => f.value === fc)?.label || capitalize(fc);
    
    switch(changeType) {
        case 'creation': return `Contract ${cn} created.`;
        case 'update': return `Contract ${cn} updated. Field: ${fieldLabel}.`;
        case 'status_change': return `Status changed for contract ${cn}. Field: ${fieldLabel}.`;
        case 'renewal': return `Contract ${cn} renewed.`;
        case 'termination': return `Contract ${cn} terminated.`;
        case 'scope_change': return `Scope changed for contract ${cn}. Field: ${fieldLabel}.`;
        case 'term_change': return `Terms changed for contract ${cn}. Field: ${fieldLabel}.`;
        case 'amendment': return `Amendment made to contract ${cn}. Field: ${fieldLabel}.`;
        default: return `Change recorded for contract ${cn}.`;
    }
  };


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contracts = await Contract.list('-updated_date'); 
      const fetchedProviders = await Provider.list();
      const fetchedUsers = await User.list(); 

      const simulatedHistory = [];
      
      (contracts || []).forEach(contract => {
        simulatedHistory.push({
          id: `${contract.id}_creation`,
          contract_id: contract.id,
          contract_number: contract.contract_number,
          name_en: contract.name_en,
          name_he: contract.name_he,
          provider_id: contract.provider_id,
          change_type: 'creation',
          modified_by_email: contract.created_by,
          timestamp: contract.created_date,
          field_changed: 'all',
          description: getChangeDescription('creation', contract.contract_number, 'all'),
          old_value: null,
          new_value: 'Contract created'
        });
        
        if (contract.created_date !== contract.updated_date) {
          const changeTypesForUpdate = ['update', 'status_change', 'scope_change', 'term_change', 'amendment'];
          const randomChangeType = changeTypesForUpdate[Math.floor(Math.random() * changeTypesForUpdate.length)];
          const randomFieldChanged = randomChangeType === 'status_change' ? 'status' :
                                   randomChangeType === 'scope_change' ? 'scope' :
                                   randomChangeType === 'term_change' ? 'payment_terms' : 'all';
          const randomUser = fetchedUsers && fetchedUsers.length > 0 ? fetchedUsers[Math.floor(Math.random() * fetchedUsers.length)] : null;
          
          simulatedHistory.push({
            id: `${contract.id}_${randomChangeType}`,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            name_en: contract.name_en,
            name_he: contract.name_he,
            provider_id: contract.provider_id,
            change_type: randomChangeType,
            modified_by_email: randomUser?.email || contract.created_by,
            timestamp: contract.updated_date,
            field_changed: randomFieldChanged,
            description: getChangeDescription(randomChangeType, contract.contract_number, randomFieldChanged),
            old_value: randomChangeType === 'status_change' ? 'draft' : 'Previous value',
            new_value: randomChangeType === 'status_change' ? 'active' : 'New value'
          });
          
          const laterDate = new Date(contract.updated_date);
          laterDate.setDate(laterDate.getDate() + Math.floor(Math.random() * 30)); 
          
          const anotherChangeType = changeTypesForUpdate[Math.floor(Math.random() * changeTypesForUpdate.length)];
          const anotherFieldChanged = anotherChangeType === 'status_change' ? 'status' :
                                    anotherChangeType === 'scope_change' ? 'scope' :
                                    anotherChangeType === 'term_change' ? 'payment_terms' : 'special_conditions';
          const anotherUser = fetchedUsers && fetchedUsers.length > 0 ? fetchedUsers[Math.floor(Math.random() * fetchedUsers.length)] : null;
          
          simulatedHistory.push({
            id: `${contract.id}_${anotherChangeType}_later`,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            name_en: contract.name_en,
            name_he: contract.name_he,
            provider_id: contract.provider_id,
            change_type: anotherChangeType,
            modified_by_email: anotherUser?.email || contract.created_by,
            timestamp: laterDate.toISOString(),
            field_changed: anotherFieldChanged,
            description: getChangeDescription(anotherChangeType, contract.contract_number, anotherFieldChanged),
            old_value: anotherChangeType === 'status_change' ? 'active' : 'Previous value',
            new_value: anotherChangeType === 'status_change' ? 'terminated' : 'New value'
          });
        }
      });

      setHistoryItems(Array.isArray(simulatedHistory) ? simulatedHistory : []);
      setProviders(Array.isArray(fetchedProviders) ? fetchedProviders : []);
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);

    } catch (err) {
      console.error("Error fetching contract history:", err);
      setError('Failed to fetch Contract History');
    } finally {
      setLoading(false);
    }
  }, []); // Removed t from dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      provider_id: 'all',
      changeType: 'all',
      user_id: 'all',
      startDate: '',
      endDate: '',
      contractNumber: '',
      sortDirection: 'desc',
      sortField: 'timestamp',
      fieldChanged: 'all'
    });
  };
  
  const providerOptions = (providers || []).map(p => ({
      value: p.id,
      label: language === 'he' ? (p.name?.he || p.name?.en) : (p.name?.en || p.name?.he)
  }));

  const userOptions = (users || []).map(u => ({
      value: u.email, 
      label: u.full_name || u.email 
  }));

  const filteredHistoryItems = React.useMemo(() => {
    let filtered = (historyItems || []).filter(item => {
      const searchLower = (filters.searchTerm || '').toLowerCase();
      const provider = (providers || []).find(p => p.id === item.provider_id);
      const user = (users || []).find(u => u.email === item.modified_by_email); 

      const contractNumberMatch = item.contract_number?.toLowerCase().includes(searchLower);
      const contractNameMatch = item.name_en?.toLowerCase().includes(searchLower) || item.name_he?.toLowerCase().includes(searchLower);
      const providerNameMatch = provider && (provider.name?.en?.toLowerCase().includes(searchLower) || provider.name?.he?.toLowerCase().includes(searchLower));
      const userNameMatch = user && (user.full_name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower));
      
      const matchesSearch = !filters.searchTerm || contractNumberMatch || contractNameMatch || providerNameMatch || userNameMatch || item.description?.toLowerCase().includes(searchLower);
      
      const matchesProvider = filters.provider_id === 'all' || item.provider_id === filters.provider_id;
      const matchesChangeType = filters.changeType === 'all' || item.change_type === filters.changeType;
      const matchesUser = filters.user_id === 'all' || item.modified_by_email === filters.user_id;
      const matchesFieldChanged = filters.fieldChanged === 'all' || item.field_changed === filters.fieldChanged;
      const matchesContractNumber = !filters.contractNumber || item.contract_number?.includes(filters.contractNumber);

      let dateMatch = true;
      if (item.timestamp) {
        const itemDate = new Date(item.timestamp);
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          dateMatch = dateMatch && itemDate >= startDate;
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23,59,59,999);
          dateMatch = dateMatch && itemDate <= endDate;
        }
      }
      
      return matchesSearch && matchesProvider && matchesChangeType && matchesUser && 
             dateMatch && matchesContractNumber && matchesFieldChanged;
    });
    
    filtered.sort((a, b) => {
      const sortMultiplier = filters.sortDirection === 'asc' ? 1 : -1;
      
      if (filters.sortField === 'timestamp') {
        return sortMultiplier * (new Date(a.timestamp) - new Date(b.timestamp));
      } else if (filters.sortField === 'contract_number') {
        return sortMultiplier * ((a.contract_number || '').localeCompare(b.contract_number || ''));
      } else if (filters.sortField === 'change_type') {
        return sortMultiplier * ((a.change_type || '').localeCompare(b.change_type || ''));
      }
      
      return 0;
    });
    
    return filtered;
  }, [historyItems, filters, providers, users, language]);

  const handleViewDetails = (item) => {
    alert('View Details: Coming Soon'); // Placeholder
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  const changeSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
  };

  const getChangeTypeIcon = (changeType) => {
    switch(changeType) {
      case 'creation': return <FilePlus className="h-4 w-4 text-green-500" />;
      case 'update': return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'status_change': return <RepeatIcon className="h-4 w-4 text-orange-500" />;
      case 'renewal': return <FileCheck2 className="h-4 w-4 text-emerald-500" />;
      case 'termination': return <FileX className="h-4 w-4 text-red-500" />;
      case 'scope_change': return <FileEdit className="h-4 w-4 text-indigo-500" />; // Changed icon
      case 'term_change': return <PenTool className="h-4 w-4 text-purple-500" />;
      case 'amendment': return <FileEdit className="h-4 w-4 text-amber-500" />; // Changed icon
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSortIcon = (field) => {
    if (filters.sortField !== field) return null;
    
    return (
      <span className="ml-1 inline-block">
        {filters.sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };


  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <ContractHistoryFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        providerOptions={providerOptions}
        userOptions={userOptions}
        changeTypeOptions={changeTypeOptions.filter(opt => opt.value !== 'all')} // Remove "All" for filter bar
      />

      {/* Additional filters row */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                Contract Number
              </label>
              <Input
                name="contractNumber"
                value={filters.contractNumber || ''}
                onChange={(e) => handleFilterChange("contractNumber", e.target.value)}
                placeholder={"Filter by contract #"}
                className="w-48"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">
                Field Changed
              </label>
              <Select
                value={filters.fieldChanged || 'all'}
                onValueChange={(value) => handleFilterChange("fieldChanged", value)} // Simplified select
              >
                <SelectTrigger className="w-48"> {/* Added SelectTrigger */}
                   <SelectValue placeholder="All Fields" /> {/* Added SelectValue */}
                </SelectTrigger>
                <SelectContent> {/* Added SelectContent */}
                  {fieldChangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => changeSort('timestamp')}
              className={filters.sortField === 'timestamp' ? 'border-blue-500' : ''}
            >
              Sort by Date
              {getSortIcon('timestamp')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => changeSort('contract_number')}
              className={filters.sortField === 'contract_number' ? 'border-blue-500' : ''}
            >
              Sort by Contract
              {getSortIcon('contract_number')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => changeSort('change_type')}
              className={filters.sortField === 'change_type' ? 'border-blue-500' : ''}
            >
              Sort by Change Type
              {getSortIcon('change_type')}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 dark:border-red-700 p-4 mb-6 rounded-md">
           <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {filteredHistoryItems.length === 0 && !loading ? (
         <EmptyState
          icon={History}
          title={'No Contract History Found'}
          message={'Try adjusting your filters'}
        />
      ) : (
        <div className="space-y-4">
          {filteredHistoryItems.map(item => (
            <SimpleCard key={item.id}>
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h3 className="font-semibold text-md text-blue-600 dark:text-blue-400 flex items-center">
                    {getChangeTypeIcon(item.change_type)}
                    <span className="ml-2">Contract: {item.contract_number || 'N/A'}</span>
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.description || (language === 'he' ? (item.name_he || item.name_en) : (item.name_en || item.name_he)) || 'No description'}
                  </p>
                </div>
                <Badge variant="outline" className={`mt-2 sm:mt-0 ${
                  item.change_type === 'creation' ? 'bg-green-100 text-green-800' :
                  item.change_type === 'update' ? 'bg-blue-100 text-blue-800' :
                  item.change_type === 'status_change' ? 'bg-orange-100 text-orange-800' :
                  item.change_type === 'renewal' ? 'bg-emerald-100 text-emerald-800' :
                  item.change_type === 'termination' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(changeTypeOptions.find(opt => opt.value === item.change_type)?.label || capitalize(item.change_type || ''))}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex items-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> {formatDate(item.timestamp)}
                </div>
                {item.provider_id && (
                  <div className="flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    {(providers.find(p => p.id === item.provider_id)?.name?.[language] || providers.find(p => p.id === item.provider_id)?.name?.[language === 'en' ? 'he' : 'en'] || 'Unknown Provider')}
                  </div>
                )}
                {item.modified_by_email && (
                  <div className="flex items-center">
                    <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                     {(users.find(u => u.email === item.modified_by_email)?.full_name || item.modified_by_email)}
                  </div>
                )}
                {item.field_changed && item.field_changed !== 'all' && (
                  <div className="flex items-center">
                    <FileEdit className="h-3.5 w-3.5 mr-1.5" /> {/* Changed icon for consistency */}
                    {(fieldChangeOptions.find(opt => opt.value === item.field_changed)?.label || capitalize(item.field_changed || ''))}
                    {item.old_value && item.new_value && (
                      <span className="ml-1">
                        ({item.old_value || 'N/A'} → {item.new_value || 'N/A'})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)} title={"View Details"}>
                  <Eye className="h-4 w-4 mr-1" /> Details
                </Button>
              </div>
            </SimpleCard>
          ))}
        </div>
      )}
    </div>
  );
}