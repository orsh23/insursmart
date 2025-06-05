import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';
import { FilterX, Search, FolderTree } from 'lucide-react';
import { MultiSelect } from '@/components/common/MultiSelect'; // Assuming named import

// Debounce utility
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

export default function InternalCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  // sortConfig, // Not directly used in UI
  // onSortChange, // Not directly used in UI
  allInternalCodes = [], // Default to empty array
  allCategories = [], // Default to empty array
  t,
  isRTL,
  language, // For MultiSelect if needed
}) {
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
    onFiltersChange({ tags: selectedTags || [] }); // Ensure tags is always an array
  };

  // Memoized options for select dropdowns
  const categoryOptions = useMemo(() => {
    const categories = Array.isArray(allCategories)
      ? allCategories.map(cat => ({
          value: cat.path || cat.id, // Assuming categories have a 'path' or 'id'
          label: (language === 'he' ? cat.name_he : cat.name_en) || cat.name_en || cat.name_he || cat.id,
        })).sort((a, b) => a.label.localeCompare(b.label))
      : [];
    return [
      { value: '', label: t('filters.allCategories', { defaultValue: 'All Categories' }) },
      ...categories,
    ];
  }, [allCategories, t, language]);

  const billableOptions = useMemo(() => [
    { value: 'all', label: t('filters.allBillable', { defaultValue: 'All Billable Statuses' }) },
    { value: 'true', label: t('common.yes', { defaultValue: 'Yes' }) },
    { value: 'false', label: t('common.no', { defaultValue: 'No' }) },
  ], [t]);

  const activeOptions = useMemo(() => [
    { value: 'all', label: t('filters.allActive', { defaultValue: 'All Active Statuses' }) },
    { value: 'true', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'false', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);
  
  const availableTags = useMemo(() => {
    if (!Array.isArray(allInternalCodes)) return [];
    const allTagsSet = allInternalCodes.reduce((acc, code) => {
      if (Array.isArray(code.tags)) {
        code.tags.forEach(tag => acc.add(tag));
      }
      return acc;
    }, new Set());
    return Array.from(allTagsSet).sort().map(tag => ({ value: tag, label: tag }));
  }, [allInternalCodes]);

  return (
    <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700/60 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
        {/* Search Term */}
        <div className="relative">
          <label htmlFor="internalCodeSearchTerm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('common.search', { defaultValue: 'Search' })}
          </label>
          <Search className={`absolute top-7 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400 dark:text-gray-500`} />
          <Input
            id="internalCodeSearchTerm"
            name="searchTerm"
            type="text"
            placeholder={t('internalCodes.searchPlaceholder', { defaultValue: 'Code, description...' })}
            defaultValue={filters.searchTerm}
            onChange={handleSearchTermChange}
            className={`w-full h-10 ${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>

        {/* Category Path */}
        <div>
          <label htmlFor="categoryPath" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('internalCodes.fields.categoryPath', { defaultValue: 'Category' })}
          </label>
          <Select
            value={filters.categoryPath || ''}
            onValueChange={(value) => handleSelectChange('categoryPath', value)}
            className="w-full h-10"
          >
            {(categoryOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Tags */}
        <div className="md:col-span-1 xl:col-span-1"> {/* Allow tags to take more space if available */}
          <label htmlFor="internalCodeTags" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('internalCodes.fields.tags', { defaultValue: 'Tags' })}
          </label>
          <MultiSelect
            id="internalCodeTags"
            options={availableTags || []}
            selected={Array.isArray(filters.tags) ? filters.tags : []}
            onChange={handleTagsChange}
            placeholder={t('filters.selectTags', { defaultValue: 'Select Tags...' })}
            className="w-full"
            triggerClassName="h-10"
            // Pass t, language, isRTL if MultiSelect needs them for its internal localization
            t={t} language={language} isRTL={isRTL}
          />
        </div>

        {/* Is Billable */}
        <div>
          <label htmlFor="isBillable" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('internalCodes.fields.billable', { defaultValue: 'Billable' })}
          </label>
          <Select
            value={filters.isBillable || 'all'}
            onValueChange={(value) => handleSelectChange('isBillable', value)}
            className="w-full h-10"
          >
            {(billableOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Is Active */}
        <div>
          <label htmlFor="isActive" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('internalCodes.fields.status', { defaultValue: 'Status' })}
          </label>
          <Select
            value={filters.isActive || 'all'}
            onValueChange={(value) => handleSelectChange('isActive', value)}
            className="w-full h-10"
          >
            {(activeOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        {/* Reset Button */}
        <div className="flex items-end h-full">
            <Button
              variant="outline"
              onClick={onResetFilters}
              className="w-full h-10 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              title={t('buttons.resetFiltersTooltip', { defaultValue: 'Clear all filters and sorting' })}
            >
              <FilterX className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {/* {t('buttons.resetFilters')} */}
            </Button>
        </div>
      </div>
    </div>
  );
}