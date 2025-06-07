import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, FileText, Building2, CheckSquare } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';

export default function TemplatesFilterBar({
  filters,
  onFilterChange,
  onReset,
  providerOptions = [],
  templateTypeOptions = [],
  statusOptions = []
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <FilterBarCard>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={t("contractManagement.templates.searchPlaceholder", { defaultValue: "Search templates by name, number..." })}
            className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
          />
        </div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
          <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <FilterSelect
          id="template-type-filter"
          name="templateType"
          labelKey="contractManagement.templates.templateTypeLabel"
          label="Template Type"
          defaultValueLabel={t('common.allTypes', { defaultValue: 'All Types' })}
          value={filters.templateType}
          onChange={handleInputChange}
          options={templateTypeOptions}
          icon={FileText}
        />
        <FilterSelect
          id="template-provider-filter"
          name="provider_id"
          labelKey="common.providerLabel"
          label="Provider"
          defaultValueLabel={t('common.allProviders', { defaultValue: 'All Providers' })}
          value={filters.provider_id}
          onChange={handleInputChange}
          options={providerOptions}
          icon={Building2}
        />
        <FilterSelect
          id="template-status-filter"
          name="status"
          labelKey="common.statusLabel"
          label="Status"
          defaultValueLabel={t('common.allStatuses', { defaultValue: 'All Statuses' })}
          value={filters.status}
          onChange={handleInputChange}
          options={statusOptions}
          icon={CheckSquare}
        />
      </div>
    </FilterBarCard>
  );
}