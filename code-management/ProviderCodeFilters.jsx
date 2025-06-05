import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';
import { FilterX, Search, FolderTree, Building } from 'lucide-react';
import { MultiSelect } from '@/components/common/MultiSelect';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

export default function ProviderCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  allProviders = [], // Expects an array of Provider objects
  allProviderCodes = [], // For deriving tags and categories
  // allCategories = [], // For category dropdown if distinct from provider codes' categories
  t,
  isRTL,
  language,
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
    onFiltersChange({ tags: selectedTags || [] });
  };

  const providerOptions = useMemo(() => {
    const providers = Array.isArray(allProviders)
      ? allProviders.map(p => ({
          value: p.id,
          label: (language === 'he' ? p.name?.he : p.name?.en) || p.name?.en || p.name?.he || p.id,
        })).sort((a, b) => a.label.localeCompare(b.label))
      : [];
    return [
      { value: 'all', label: t('filters.allProviders', { defaultValue: 'All Providers' }) },
      ...providers,
    ];
  }, [allProviders, t, language]);
  
  const categoryOptions = useMemo(() => {
     if (!Array.isArray(allProviderCodes)) return [{ value: 'all', label: t('filters.allCategories', { defaultValue: 'All Categories' }) }];
     const uniqueCategories = new Set(allProviderCodes.map(code => code.category_path).filter(Boolean));
     const categories = Array.from(uniqueCategories).sort().map(path => ({
         value: path,
         label: path, // Assuming category_path is user-friendly enough
     }));
    return [
      { value: 'all', label: t('filters.allCategories', { defaultValue: 'All Categories' }) },
      ...categories,
    ];
  }, [allProviderCodes, t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'inactive', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);
  
  const availableTags = useMemo(() => {
    if (!Array.isArray(allProviderCodes)) return [];
    const allTagsSet = allProviderCodes.reduce((acc, code) => {
      if (Array.isArray(code.tags)) {
        code.tags.forEach(tag => acc.add(tag));
      }
      return acc;
    }, new Set());
    return Array.from(allTagsSet).sort().map(tag => ({ value: tag, label: tag }));
  }, [allProviderCodes]);

  return (
    <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700/60 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
        {/* Search Term */}
        <div className="relative">
          <label htmlFor="providerCodeSearchTerm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('common.search', { defaultValue: 'Search' })}
          </label>
          <Search className={`absolute top-7 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400 dark:text-gray-500`} />
          <Input
            id="providerCodeSearchTerm"
            name="searchTerm"
            type="text"
            placeholder={t('providerCodes.searchPlaceholder', { defaultValue: 'Code, description, provider...' })}
            defaultValue={filters.searchTerm}
            onChange={handleSearchTermChange}
            className={`w-full h-10 ${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>

        {/* Provider */}
        <div>
          <label htmlFor="providerId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('providerCodes.fields.providerName', { defaultValue: 'Provider' })}
          </label>
          <Select
            value={filters.providerId || 'all'}
            onValueChange={(value) => handleSelectChange('providerId', value)}
            className="w-full h-10"
            triggerIcon={<Building className="h-4 w-4 text-gray-400" />}
          >
            {(providerOptions || []).map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        {/* Category Path */}
        <div>
          <label htmlFor="categoryPath" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('providerCodes.fields.categoryPath', { defaultValue: 'Category' })}
          </label>
          <Select
            value={filters.categoryPath || 'all'}
            onValueChange={(value) => handleSelectChange('categoryPath', value)}
            className="w-full h-10"
            triggerIcon={<FolderTree className="h-4 w-4 text-gray-400" />}
          >
            {(categoryOptions || []).map(option => (
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

        {/* Tags */}
        <div className="lg:col-span-1"> {/* Allow it to span more on larger screens if needed */}
          <label htmlFor="tags" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('common.tags', { defaultValue: 'Tags' })}
          </label>
          <MultiSelect
            options={availableTags}
            selectedValues={filters.tags || []}
            onChange={handleTagsChange}
            placeholder={t('filters.selectTags', { defaultValue: 'Select Tags...' })}
            className="h-10"
            triggerClassName="h-10"
            // Pass language if MultiSelect supports it for internal text like "No results"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="w-full h-10 text-xs"
            title={t('buttons.resetFilters', { defaultValue: 'Reset Filters' })}
          >
            <FilterX className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
            {t('buttons.resetShort', { defaultValue: 'Reset' })}
          </Button>
        </div>
      </div>
    </div>
  );
}