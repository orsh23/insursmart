import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Contract } from '@/api/entities'; 
import { Provider } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, FileText, Archive, Building2, AlertTriangle } from 'lucide-react';
import TemplatesFilterBar from './TemplatesFilterBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

const SimpleCard = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className} border border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow`}>
    {children}
  </div>
);

export default function TemplatesTab() {
  const { t, isRTL, language } = useLanguageHook();
  const [templates, setTemplates] = useState([]); 
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define actual template types and statuses based on your application's logic
  const templateTypeOptions = [
    { value: 'standard_agreement', label: t('contractManagement.templateTypes.standard', {defaultValue: "Standard Agreement"}) },
    { value: 'service_specific', label: t('contractManagement.templateTypes.serviceSpecific', {defaultValue: "Service Specific"}) },
    { value: 'provider_group', label: t('contractManagement.templateTypes.providerGroup', {defaultValue: "Provider Group"}) },
  ];

  const templateStatusOptions = [
    { value: 'draft', label: t('contractManagement.templateStatus.draft', {defaultValue: "Draft"}) },
    { value: 'active_template', label: t('contractManagement.templateStatus.active', {defaultValue: "Active Template"}) },
    { value: 'archived', label: t('contractManagement.templateStatus.archived', {defaultValue: "Archived"}) },
  ];

  const [filters, setFilters] = useState({
    searchTerm: '',
    templateType: 'all',
    provider_id: 'all',
    status: 'all' // This should match values in templateStatusOptions
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allContracts = await Contract.list(); 
      const fetchedProviders = await Provider.list();

      // Placeholder: Identify templates. Adjust this logic based on your data model.
      // For example, if templates have a specific field like 'is_template: true' or a specific 'status'
      const contractTemplates = allContracts.filter(c => 
        c.name_en?.toLowerCase().includes("template") || // Simple name check
        c.is_template === true || // Ideal: a boolean field
        templateStatusOptions.map(s => s.value).includes(c.status) // If status indicates template
      );
      setTemplates(Array.isArray(contractTemplates) ? contractTemplates : []);
      setProviders(Array.isArray(fetchedProviders) ? fetchedProviders : []);
    } catch (err) {
      console.error("Error fetching contract templates:", err);
      setError(t('errors.fetchFailed', { item: t('contractManagement.templates.titlePlural', { defaultValue: 'Contract Templates' }) }));
    } finally {
      setLoading(false);
    }
  }, [t, templateStatusOptions]); // Added templateStatusOptions to dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      templateType: 'all',
      provider_id: 'all',
      status: 'all'
    });
  };
  
  const providerOptionsForFilter = providers.map(p => ({
      value: p.id,
      label: language === 'he' ? (p.name?.he || p.name?.en) : (p.name?.en || p.name?.he)
  }));


  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const searchLower = filters.searchTerm.toLowerCase();
      const provider = providers.find(p => p.id === template.provider_id);

      const nameMatch = template.name_en?.toLowerCase().includes(searchLower) || template.name_he?.toLowerCase().includes(searchLower);
      const contractNumberMatch = template.contract_number?.toLowerCase().includes(searchLower);
      const providerNameMatch = provider && (provider.name?.en?.toLowerCase().includes(searchLower) || provider.name?.he?.toLowerCase().includes(searchLower));
      
      const matchesSearch = !filters.searchTerm || nameMatch || contractNumberMatch || providerNameMatch;
      
      // Adjust these to match your actual template identification logic
      const matchesTemplateType = filters.templateType === 'all'; // || (template.template_type_field === filters.templateType);
      const matchesProvider = filters.provider_id === 'all' || template.provider_id === filters.provider_id;
      const matchesStatus = filters.status === 'all' || template.status === filters.status; // Assuming 'status' field holds template status
      
      return matchesSearch && matchesTemplateType && matchesProvider && matchesStatus;
    });
  }, [templates, filters, providers, language]);

  const handleAddNew = () => alert(t('common.comingSoon'));
  const handleEdit = (item) => alert(t('common.comingSoon'));
  const handleView = (item) => alert(t('common.comingSoon'));
  const handleDelete = async (id) => alert(t('common.comingSoon'));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TemplatesFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        providerOptions={providerOptionsForFilter}
        templateTypeOptions={templateTypeOptions} // Pass defined options
        statusOptions={templateStatusOptions}     // Pass defined options
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 dark:border-red-700 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-600" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleAddNew}>
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('contractManagement.templates.addNew', { defaultValue: 'Add New Template' })}
        </Button>
      </div>

      {filteredTemplates.length === 0 && !loading ? (
        <EmptyState
          icon={Archive}
          title={t('contractManagement.templates.noTemplatesFound', { defaultValue: 'No Contract Templates Found' })}
          message={
            filters.searchTerm || filters.templateType !== 'all' || filters.provider_id !== 'all' || filters.status !== 'all'
              ? t('common.tryAdjustingFilters')
              : t('contractManagement.templates.startAdding', { defaultValue: 'Get started by adding a contract template.'})
          }
           actionButton={
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contractManagement.templates.addNew')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <SimpleCard key={template.id}>
              <div>
                <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 break-words">
                  {language === 'he' ? (template.name_he || template.name_en) : (template.name_en || template.name_he)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('contractManagement.contractNumber')}: {template.contract_number}
                </p>
                {template.provider_id && providers.find(p => p.id === template.provider_id) && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <Building2 className="h-4 w-4 mr-1.5 text-gray-400" />
                    {providers.find(p => p.id === template.provider_id)?.name?.[language] || providers.find(p => p.id === template.provider_id)?.name?.[language === 'en' ? 'he' : 'en']}
                  </div>
                )}
                <div className="mt-2">
                  <Badge variant="outline" className="mr-2 rtl:ml-2 rtl:mr-0">
                    {templateTypeOptions.find(opt => opt.value === template.status )?.label || // Assuming template.status might hold template_type
                     templateTypeOptions[0]?.label /* Fallback to first type */} 
                  </Badge>
                  <Badge 
                    variant={template.status === 'active_template' ? 'success' : (template.status === 'draft' ? 'outline' : 'secondary')}
                  >
                    {templateStatusOptions.find(opt => opt.value === template.status)?.label || template.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end space-x-1 rtl:space-x-reverse">
                <Button variant="ghost" size="sm" onClick={() => handleView(template)} title={t('common.view')}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} title={t('common.edit')}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500" title={t('common.delete')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SimpleCard>
          ))}
        </div>
      )}
    </div>
  );
}