
import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select'; // Assuming SelectItem is used this way
import { FilterX, Search } from 'lucide-react';
import { MultiSelect } from '@/components/common/MultiSelect'; // Changed import from default to named

// Debounce utility (optional, but good for search terms)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

export default function MedicalCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  // sortConfig, // Not directly used for filtering UI elements but could be
  // onSortChange, // Not directly used for filtering UI elements but could be
  allMedicalCodes = [], // Default to empty array
  t,
  isRTL,
  language, // Added for consistency if MultiSelect needs it
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFiltersChange({ [name]: value });
  };

  const debouncedSearchChange = useMemo(
    () => debounce((value) => onFiltersChange({ searchTerm: value }), 300),
    [onFiltersChange]
  );

  const handleSearchTermChange = (e) => {
    debouncedSearchChange(e.target.value);
  };

  const handleSelectChange = (name, value) => {
    onFiltersChange({ [name]: value });
  };
  
  const handleTagsChange = (selectedTags) => {
    onFiltersChange({ tags: selectedTags });
  };

  const codeSystemOptions = useMemo(() => {
    const systems = Array.isArray(allMedicalCodes)
      ? [...new Set(allMedicalCodes.map(code => code.code_system).filter(Boolean))]
      : [];
    return [
      { value: 'all', label: t('filters.allCodeSystems', { defaultValue: 'All Code Systems' }) },
      ...systems.sort().map(system => ({ value: system, label: system })),
    ];
  }, [allMedicalCodes, t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'deprecated', label: t('status.deprecated', { defaultValue: 'Deprecated' }) },
  ], [t]);

  const availableTags = useMemo(() => {
    if (!Array.isArray(allMedicalCodes)) return [];
    const allTags = allMedicalCodes.reduce((acc, code) => {
      if (Array.isArray(code.tags)) {
        code.tags.forEach(tag => acc.add(tag));
      }
      return acc;
    }, new Set());
    return Array.from(allTags).sort().map(tag => ({ value: tag, label: tag }));
  }, [allMedicalCodes]);

  return (
    <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700/60 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
        {/* Search Term */}
        <div className="relative">
          <label htmlFor="searchTerm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('common.search', { defaultValue: 'Search' })}
          </label>
          <Search className={`absolute top-7 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400 dark:text-gray-500`} />
          <Input
            id="searchTerm"
            name="searchTerm"
            type="text"
            placeholder={t('medicalCodes.searchPlaceholder', { defaultValue: 'Code, description...' })}
            defaultValue={filters.searchTerm} // Use defaultValue for debounced input
            onChange={handleSearchTermChange}
            className={`w-full h-10 ${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>

        {/* Code System */}
        <div>
          <label htmlFor="codeSystem" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('medicalCodes.fields.codeSystem', { defaultValue: 'Code System' })}
          </label>
          <Select
            value={filters.codeSystem || 'all'}
            onValueChange={(value) => handleSelectChange('codeSystem', value)}
            className="w-full h-10"
          >
            {(codeSystemOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('common.status', { defaultValue: 'Status' })}
          </label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleSelectChange('status', value)}
            className="w-full h-10"
          >
            {(statusOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        {/* Tags (MultiSelect) */}
        <div className="md:col-span-1 lg:col-span-1"> {/* Adjust span as needed */}
          <label htmlFor="tags" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('medicalCodes.fields.tags', { defaultValue: 'Tags' })}
          </label>
          <MultiSelect
            options={availableTags || []}
            selectedValues={filters.tags || []}
            onChange={handleTagsChange}
            placeholder={t('filters.selectTagsPlaceholder', {defaultValue: 'Select tags...'})}
            className="w-full"
            triggerClassName="h-10"
            language={language} // Pass language if MultiSelect uses it
            t={t} // Pass t if MultiSelect uses it
          />
        </div>

        {/* Reset Button - Placed on the next row on smaller screens or end of line */}
        <div className="sm:col-start-2 md:col-start-3 lg:col-start-4 flex justify-end items-end">
          <Button variant="ghost" onClick={onResetFilters} size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <FilterX className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
            {t('filters.resetFilters', { defaultValue: 'Reset Filters' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
