import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, FilterX, FileUp, Book, Check, AlertTriangle } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';

export default function ImportHistoryFilterBar({
  filters = {}, // Add default empty object
  onFilterChange = () => {}, // Add default no-op function
  onReset = () => {}, // Add default no-op function
  moduleOptions = [],
}) {
  const { t, isRTL } = useLanguageHook();

  // Ensure filters has all expected properties with defaults
  const safeFilters = {
    searchTerm: '',
    module: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    ...filters // Spread actual filters to override defaults
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (typeof onFilterChange === 'function') {
      onFilterChange(name, value);
    }
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  const statusOptions = [
    { value: "success", label: t('importHistory.status.success', { defaultValue: "Success" }) },
    { value: "partial", label: t('importHistory.status.partial', { defaultValue: "Partial" }) },
    { value: "failed", label: t('importHistory.status.failed', { defaultValue: "Failed" }) },
  ];

  return (
    <FilterBarCard>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={safeFilters.searchTerm}
            onChange={handleInputChange}
            placeholder={t("importHistory.searchPlaceholder", { defaultValue: "Search imports by filename..." })}
            className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
          />
        </div>
        <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
          <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <FilterSelect
          id="import-module-filter"
          name="module"
          labelKey="importHistory.moduleLabel"
          label="Module"
          defaultValueLabel={t('importHistory.allModules', { defaultValue: 'All Modules' })}
          value={safeFilters.module}
          onChange={handleInputChange}
          options={moduleOptions}
          icon={Book}
        />
        <FilterSelect
          id="import-status-filter"
          name="status"
          labelKey="importHistory.statusLabel"
          label="Status"
          defaultValueLabel={t('common.allStatuses', { defaultValue: 'All Statuses' })}
          value={safeFilters.status}
          onChange={handleInputChange}
          options={statusOptions}
          icon={Check}
        />
        <div className="flex flex-col">
          <Label className="flex items-center mb-1 text-sm font-medium">
            <FileUp className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            {t('importHistory.dateRangeLabel', { defaultValue: 'Date Range' })}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              name="startDate"
              value={safeFilters.startDate || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="date"
              name="endDate"
              value={safeFilters.endDate || ''}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </FilterBarCard>
  );
}