import React, { useState } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Plus, Copy, Edit, Trash2, FilterX, CalendarDays, Building2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';

// Simple Card for displaying individual items
const SimpleCard = ({ children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className} border border-gray-200 dark:border-gray-700`}>
      {children}
    </div>
  );
};

// Helper to safely capitalize strings
const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function ContractTemplatesTab() {
  const { t, isRTL, language } = useLanguageHook();
  const [filters, setFilters] = useState({
    searchTerm: "",
    categoryFilter: "all",
    statusFilter: "all",
    providerTypeFilter: "all",
    usageCountFilter: "all", 
    createdDateFrom: "",
    createdDateTo: "",
    sortBy: "newest"
  });

  // Define the category options
  const categoryOptions = [
    { value: "hospital", label: t('contractManagement.templates.categories.hospital', { defaultValue: "Hospital" }) },
    { value: "clinic", label: t('contractManagement.templates.categories.clinic', { defaultValue: "Clinic" }) },
    { value: "laboratory", label: t('contractManagement.templates.categories.laboratory', { defaultValue: "Laboratory" }) },
    { value: "imaging", label: t('contractManagement.templates.categories.imaging', { defaultValue: "Imaging" }) },
    { value: "pharmacy", label: t('contractManagement.templates.categories.pharmacy', { defaultValue: "Pharmacy" }) },
    { value: "dental", label: t('contractManagement.templates.categories.dental', { defaultValue: "Dental" }) },
    { value: "rehabilitation", label: t('contractManagement.templates.categories.rehabilitation', { defaultValue: "Rehabilitation" }) }
  ];

  // Status options
  const statusOptions = [
    { value: "active", label: t('common.status.active', { defaultValue: "Active" }) },
    { value: "draft", label: t('common.status.draft', { defaultValue: "Draft" }) },
    { value: "archived", label: t('common.status.archived', { defaultValue: "Archived" }) },
    { value: "deprecated", label: t('common.status.deprecated', { defaultValue: "Deprecated" }) }
  ];

  // Provider type options
  const providerTypeOptions = [
    { value: "hospital", label: t('providers.types.hospital', { defaultValue: "Hospital" }) },
    { value: "clinic", label: t('providers.types.clinic', { defaultValue: "Clinic" }) },
    { value: "imaging_center", label: t('providers.types.imaging_center', { defaultValue: "Imaging Center" }) },
    { value: "laboratory", label: t('providers.types.laboratory', { defaultValue: "Laboratory" }) },
    { value: "other", label: t('providers.types.other', { defaultValue: "Other" }) }
  ];

  // Usage count options
  const usageCountOptions = [
    { value: "never_used", label: t('contractManagement.templates.usageCount.never', { defaultValue: "Never Used" }) },
    { value: "rarely_used", label: t('contractManagement.templates.usageCount.rarely', { defaultValue: "Rarely Used (1-5)" }) },
    { value: "moderately_used", label: t('contractManagement.templates.usageCount.moderately', { defaultValue: "Moderately Used (6-15)" }) },
    { value: "frequently_used", label: t('contractManagement.templates.usageCount.frequently', { defaultValue: "Frequently Used (16+)" }) }
  ];

  // Sort options
  const sortOptions = [
    { value: "newest", label: t('common.sort.newest', { defaultValue: "Newest First" }) },
    { value: "oldest", label: t('common.sort.oldest', { defaultValue: "Oldest First" }) },
    { value: "name_asc", label: t('common.sort.nameAsc', { defaultValue: "Name (A-Z)" }) },
    { value: "name_desc", label: t('common.sort.nameDesc', { defaultValue: "Name (Z-A)" }) },
    { value: "most_used", label: t('common.sort.mostUsed', { defaultValue: "Most Used" }) },
    { value: "least_used", label: t('common.sort.leastUsed', { defaultValue: "Least Used" }) }
  ];

  // Mock templates data
  const templates = [
    {
      id: 1,
      name_en: "Standard Hospital Agreement",
      name_he: "הסכם בית חולים סטנדרטי",
      category: "hospital",
      providerType: "hospital",
      status: "active",
      description: "Standard template for hospital contracts including basic terms and conditions",
      usage_count: 15,
      created_date: "2023-01-15T10:30:00Z"
    },
    {
      id: 2,
      name_en: "Clinic Service Agreement",
      name_he: "הסכם שירות מרפאה",
      category: "clinic",
      providerType: "clinic",
      status: "active",
      description: "Template for outpatient clinic service agreements",
      usage_count: 8,
      created_date: "2023-02-20T14:15:00Z"
    },
    {
      id: 3,
      name_en: "Laboratory Testing Agreement",
      name_he: "הסכם בדיקות מעבדה",
      category: "laboratory",
      providerType: "laboratory",
      status: "draft",
      description: "Template for laboratory testing service providers",
      usage_count: 5,
      created_date: "2023-03-10T09:45:00Z"
    },
    {
      id: 4,
      name_en: "Imaging Center Agreement",
      name_he: "הסכם מרכז דימות",
      category: "imaging",
      providerType: "imaging_center",
      status: "active",
      description: "Template for imaging centers providing MRI, CT, X-ray services",
      usage_count: 3,
      created_date: "2023-04-05T16:20:00Z"
    },
    {
      id: 5,
      name_en: "Dental Clinic Template",
      name_he: "תבנית מרפאת שיניים",
      category: "dental",
      providerType: "clinic",
      status: "archived",
      description: "Specialized template for dental clinics and providers",
      usage_count: 0,
      created_date: "2023-05-12T11:10:00Z"
    },
    {
      id: 6,
      name_en: "Pharmacy Services Contract",
      name_he: "חוזה שירותי בית מרקחת",
      category: "pharmacy",
      providerType: "other",
      status: "deprecated",
      description: "Template for pharmaceutical services providers",
      usage_count: 20,
      created_date: "2022-12-01T08:30:00Z"
    },
    {
      id: 7,
      name_en: "Rehabilitation Center Agreement",
      name_he: "הסכם מרכז שיקום",
      category: "rehabilitation",
      providerType: "other",
      status: "active",
      description: "Template for rehabilitation centers providing physical therapy and recovery services",
      usage_count: 12,
      created_date: "2023-06-18T13:25:00Z"
    }
  ];

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      categoryFilter: "all",
      statusFilter: "all",
      providerTypeFilter: "all",
      usageCountFilter: "all",
      createdDateFrom: "",
      createdDateTo: "",
      sortBy: "newest"
    });
  };

  const getUsageCountRange = (filter) => {
    switch(filter) {
      case 'never_used': return { min: 0, max: 0 };
      case 'rarely_used': return { min: 1, max: 5 };
      case 'moderately_used': return { min: 6, max: 15 };
      case 'frequently_used': return { min: 16, max: Number.MAX_SAFE_INTEGER };
      default: return { min: 0, max: Number.MAX_SAFE_INTEGER };
    }
  };

  const filteredTemplates = templates.filter(template => {
    // Search match
    const searchMatch = !filters.searchTerm ||
      (template.name_en || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (template.name_he || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (template.description || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    // Category match
    const categoryMatch = filters.categoryFilter === "all" || template.category === filters.categoryFilter;
    
    // Status match
    const statusMatch = filters.statusFilter === "all" || template.status === filters.statusFilter;
    
    // Provider type match
    const providerTypeMatch = filters.providerTypeFilter === "all" || template.providerType === filters.providerTypeFilter;
    
    // Usage count match
    const usageCountFilter = filters.usageCountFilter;
    const usageRange = getUsageCountRange(usageCountFilter);
    const usageCountMatch = usageCountFilter === "all" || 
      (template.usage_count >= usageRange.min && template.usage_count <= usageRange.max);
    
    // Date range match
    let dateMatch = true;
    if (filters.createdDateFrom || filters.createdDateTo) {
      const templateDate = new Date(template.created_date);
      if (filters.createdDateFrom) {
        const fromDate = new Date(filters.createdDateFrom);
        dateMatch = dateMatch && templateDate >= fromDate;
      }
      if (filters.createdDateTo) {
        const toDate = new Date(filters.createdDateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        dateMatch = dateMatch && templateDate <= toDate;
      }
    }
    
    return searchMatch && categoryMatch && statusMatch && providerTypeMatch && usageCountMatch && dateMatch;
  }).sort((a, b) => {
    // Sort logic
    switch(filters.sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'oldest':
        return new Date(a.created_date) - new Date(b.created_date);
      case 'name_asc':
        return (a.name_en || '').localeCompare(b.name_en || '');
      case 'name_desc':
        return (b.name_en || '').localeCompare(a.name_en || '');
      case 'most_used':
        return (b.usage_count || 0) - (a.usage_count || 0);
      case 'least_used':
        return (a.usage_count || 0) - (b.usage_count || 0);
      default:
        return 0;
    }
  });

  const handleCreateTemplate = () => {
    // Implement template creation logic
    console.log("Create new template");
  };

  const handleEditTemplate = (templateId) => {
    // Implement template editing logic
    console.log("Edit template:", templateId);
  };

  const handleDeleteTemplate = (templateId) => {
    // Implement template deletion logic
    console.log("Delete template:", templateId);
  };

  const handleUseTemplate = (templateId) => {
    // Implement template usage logic
    console.log("Use template:", templateId);
  };

  // Helper to format dates in a localized way
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statusValue) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.label : capitalize(statusValue || '');
  };

  const getCategoryLabel = (categoryValue) => {
    const option = categoryOptions.find(opt => opt.value === categoryValue);
    return option ? option.label : capitalize(categoryValue || '');
  };
  
  const getProviderTypeLabel = (providerTypeValue) => {
    const option = providerTypeOptions.find(opt => opt.value === providerTypeValue);
    return option ? option.label : capitalize(providerTypeValue || '');
  };


  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <FilterBarCard>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative w-full md:flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              name="searchTerm"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              placeholder={t('contractManagement.templates.searchPlaceholder', { defaultValue: "Search templates..." })}
              className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
            />
          </div>
          <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">
            <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <FilterSelect
            id="template-category-filter"
            name="categoryFilter"
            labelKey="contractManagement.templates.filterByCategory"
            label={t('contractManagement.templates.filterByCategory', { defaultValue: "Category"})}
            defaultValueLabel={t('common.allCategories', { defaultValue: 'All Categories' })}
            value={filters.categoryFilter}
            onChange={(e) => handleFilterChange("categoryFilter", e.target.value)}
            options={categoryOptions}
            icon={FileText}
          />
          
          <FilterSelect
            id="template-status-filter"
            name="statusFilter"
            labelKey="common.statusLabel"
            label={t('common.statusLabel', { defaultValue: "Status"})}
            defaultValueLabel={t('common.allStatuses', { defaultValue: 'All Statuses' })}
            value={filters.statusFilter}
            onChange={(e) => handleFilterChange("statusFilter", e.target.value)}
            options={statusOptions}
            icon={CheckCircle2}
          />
          
          <FilterSelect
            id="template-provider-type-filter"
            name="providerTypeFilter"
            labelKey="providers.typeLabel"
            label={t('providers.typeLabel', { defaultValue: "Provider Type"})}
            defaultValueLabel={t('providers.allTypes', { defaultValue: 'All Provider Types' })}
            value={filters.providerTypeFilter}
            onChange={(e) => handleFilterChange("providerTypeFilter", e.target.value)}
            options={providerTypeOptions}
            icon={Building2}
          />
          
          <FilterSelect
            id="template-usage-filter"
            name="usageCountFilter"
            labelKey="contractManagement.templates.usageLabel"
            label={t('contractManagement.templates.usageLabel', { defaultValue: "Usage"})}
            defaultValueLabel={t('contractManagement.templates.allUsage', { defaultValue: 'All Usage Levels' })}
            value={filters.usageCountFilter}
            onChange={(e) => handleFilterChange("usageCountFilter", e.target.value)}
            options={usageCountOptions}
            icon={CheckCircle2}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium flex items-center">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              {t('common.createdDateRange', { defaultValue: 'Created Date Range' })}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                name="createdDateFrom"
                value={filters.createdDateFrom}
                onChange={(e) => handleFilterChange("createdDateFrom", e.target.value)}
                placeholder={t('common.fromDate', { defaultValue: 'From' })}
              />
              <Input
                type="date"
                name="createdDateTo"
                value={filters.createdDateTo}
                onChange={(e) => handleFilterChange("createdDateTo", e.target.value)}
                placeholder={t('common.toDate', { defaultValue: 'To' })}
              />
            </div>
          </div>
          
          <FilterSelect
            id="template-sort-filter"
            name="sortBy"
            labelKey="common.sortBy"
            label={t('common.sortBy', { defaultValue: "Sort By"})}
            defaultValueLabel={null} // No "All" option for sort
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            options={sortOptions}
            icon={FileText} // Re-using FileText, consider a sort-specific icon if available
          />
        </div>
      </FilterBarCard>

      {/* Add New Template Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreateTemplate}>
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('contractManagement.templates.createNew', { defaultValue: 'New Template' })}
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <SimpleCard className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {Object.values(filters).some(val => val !== "all" && val !== "" && val !== "newest")
              ? t('contractManagement.templates.noResults', { defaultValue: 'No templates match your filters' })
              : t('contractManagement.templates.noTemplates', { defaultValue: 'No templates yet' })}
          </h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).some(val => val !== "all" && val !== "" && val !== "newest")
              ? t('common.tryAdjustingFilters', { defaultValue: 'Try adjusting your search or filters' })
              : t('contractManagement.templates.createFirst', { defaultValue: 'Create your first contract template to get started' })}
          </p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contractManagement.templates.createNew', { defaultValue: 'Create Template' })}
          </Button>
        </SimpleCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <SimpleCard key={template.id} className="flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">
                    {isRTL ? (template.name_he || template.name_en) : (template.name_en || template.name_he)}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className={getStatusBadgeClass(template.status)}>
                      {getStatusLabel(template.status)}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">
                {template.description || 'No description provided.'}
              </p>
              
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap justify-between mb-4">
                <span className="flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {getProviderTypeLabel(template.providerType)}
                </span>
                <span className="flex items-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  {formatDate(template.created_date)}
                </span>
              </div>
              
              <div className="border-t pt-4 mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('contractManagement.templates.usedTimes', { count: template.usage_count || 0, defaultValue: `Used ${template.usage_count || 0} times` })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleUseTemplate(template.id)}>
                      <Copy className="h-4 w-4 mr-1" />
                      {t('common.use', { defaultValue: 'Use' })}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template.id)}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit', { defaultValue: 'Edit' })}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </SimpleCard>
          ))}
        </div>
      )}
    </div>
  );
}