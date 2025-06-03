import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Import Label
import { Filter, X, Search, ArrowUpDown } from 'lucide-react'; // Added ArrowUpDown
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';

export default function ProviderFilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allProviders,
  t, language, isRTL
}) {

  const handleInputChange = (e) => {
    onFiltersChange({ ...filters, searchTerm: e.target.value, page: 1 });
  };

  const handleSelectChange = (name, value) => {
    onFiltersChange({ ...filters, [name]: value, page: 1 });
  };

  const providerTypeOptions = useMemo(() => [
    { value: 'all', label: t('filters.allTypes', { defaultValue: 'All Types' }) },
    { value: 'hospital', label: t('providerTypes.hospital', { defaultValue: 'Hospital' }) },
    { value: 'clinic', label: t('providerTypes.clinic', { defaultValue: 'Clinic' }) },
    { value: 'imaging_center', label: t('providerTypes.imaging_center', { defaultValue: 'Imaging Center' }) },
    { value: 'laboratory', label: t('providerTypes.laboratory', { defaultValue: 'Laboratory' }) },
    { value: 'other', label: t('providerTypes.other', { defaultValue: 'Other' }) },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'inactive', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);

  const legalTypeOptions = useMemo(() => [
    { value: 'all', label: t('filters.allLegalTypes', { defaultValue: 'All Legal Types' }) },
    { value: 'company', label: t('legalTypes.company', { defaultValue: 'Company' }) },
    { value: 'licensed_dealer', label: t('legalTypes.licensed_dealer', { defaultValue: 'Licensed Dealer' }) },
    { value: 'registered_association', label: t('legalTypes.registered_association', { defaultValue: 'Registered Association' }) },
  ], [t]);
  
  const cityOptions = useMemo(() => {
    const uniqueCities = Array.isArray(allProviders)
      ? [...new Set(allProviders.map(p => p.contact?.city).filter(Boolean))].sort()
      : [];
    const options = uniqueCities.map(city => ({ value: city, label: city }));
    return [{ value: 'all', label: t('filters.allCities', { defaultValue: 'All Cities' }) }, ...options];
  }, [allProviders, t]);

  const sortOptions = useMemo(() => [
    // Using provider.name for sorting, actual key might be 'name.en' or 'name.he' based on language
    // but for UI display, 'name' is fine. The onSortChange will handle the specific key.
    { value: 'name', label: t('providers.fields.name', {defaultValue: 'Provider Name'}) },
    { value: 'provider_type', label: t('providers.fields.provider_type', {defaultValue: 'Type'}) },
    { value: 'contact.city', label: t('providers.fields.city', {defaultValue: 'City'}) },
    { value: 'status', label: t('providers.fields.status', {defaultValue: 'Status'}) },
    { value: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
  ], [t]);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortConfig.key)?.label || t('common.select', {defaultValue: "Select..."});


  return (
    <FilterBarCard
      title={t('common.filtersAndSort', {defaultValue: 'Filters & Sort'})}
      onResetFilters={onResetFilters}
      t={t} isRTL={isRTL}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Search Term */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="searchTerm" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filters.search', {defaultValue: 'Search'})}
          </Label>
          <SearchInput
            id="searchTerm"
            placeholder={t('providers.searchPlaceholder', {defaultValue: 'Search by name, ID...'})}
            value={filters.searchTerm || ''}
            onChange={handleInputChange}
            isRTL={isRTL}
          />
        </div>

        {/* Provider Type */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="providerType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('providers.fields.provider_type', {defaultValue: 'Provider Type'})}
          </Label>
          <SimpleSelect
            id="providerType"
            value={filters.providerType || 'all'}
            onValueChange={(value) => handleSelectChange('providerType', value)}
            options={providerTypeOptions}
            placeholder={t('filters.selectType', {defaultValue: 'Select Type'})}
            t={t} isRTL={isRTL}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('providers.fields.status', {defaultValue: 'Status'})}
          </Label>
          <SimpleSelect
            id="status"
            value={filters.status || 'all'}
            onValueChange={(value) => handleSelectChange('status', value)}
            options={statusOptions}
            placeholder={t('filters.selectStatus', {defaultValue: 'Select Status'})}
            t={t} isRTL={isRTL}
          />
        </div>
        
        {/* City */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
             {t('providers.fields.city', {defaultValue: 'City'})}
          </Label>
          <SimpleSelect
            id="city"
            value={filters.city || 'all'}
            onValueChange={(value) => handleSelectChange('city', value)}
            options={cityOptions}
            placeholder={t('filters.selectCity', {defaultValue: 'Select City'})}
            disabled={cityOptions.length <= 1} // Disable if no cities or only "All Cities"
            t={t} isRTL={isRTL}
          />
        </div>

        {/* Sort By */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="sortBy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filters.sortBy', {defaultValue: 'Sort By'})}
          </Label>
          <Select value={sortConfig.key} onValueChange={(value) => onSortChange(value)} dir={isRTL ? "rtl" : "ltr"}>
            <SelectTrigger id="sortBy" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <SelectValue placeholder={t('filters.selectSortField', {defaultValue: 'Select field to sort...'})}>
                {currentSortLabel}
                {sortConfig.direction === 'ascending' ? ' (▲)' : ' (▼)'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-700">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBarCard>
  );
}