import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, ArrowDownUp, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';
import { Label } from '@/components/ui/label';

export default function DoctorFilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allDoctors,
  t, language, isRTL,
  currentView // Ensure this prop is explicitly listed and used
}) {

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'inactive', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);

  const specialtyOptions = useMemo(() => {
    const uniqueSpecialties = Array.isArray(allDoctors)
      ? [...new Set(allDoctors.flatMap(d => d.specialties || []).filter(Boolean))].sort()
      : [];
    const options = uniqueSpecialties.map(spec => ({ value: spec, label: t(`doctorSpecialties.${spec.replace(/\s+/g, '_')}`, {defaultValue: spec}) }));
    return [{ value: 'all', label: t('filters.allSpecialties', { defaultValue: 'All Specialties' }) }, ...options];
  }, [allDoctors, t]);

  const cityOptions = useMemo(() => {
    const uniqueCities = Array.isArray(allDoctors)
      ? [...new Set(allDoctors.map(p => p.city).filter(Boolean))].sort()
      : [];
    const options = uniqueCities.map(city => ({ value: city, label: city }));
    return [{ value: 'all', label: t('filters.allCities', { defaultValue: 'All Cities' }) }, ...options];
  }, [allDoctors, t]);

  const sortableFields = useMemo(() => [
    { key: 'name', label: t('doctors.fields.name', {defaultValue: 'Name'}) },
    { key: 'license_number', label: t('doctors.fields.licenseNumber', {defaultValue: 'License Number'}) },
    { key: 'status', label: t('common.status', {defaultValue: 'Status'}) },
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
  ], [t]);

  // const currentSortField = sortableFields.find(f => f.key === sortConfig.key); // Not used directly in rendering
  const SortIcon = sortConfig.direction === 'ascending' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <FilterBarCard
      title={t('common.filtersAndSort', {defaultValue: 'Filters & Sort'})}
      onResetFilters={onResetFilters}
      t={t} isRTL={isRTL}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="doctorSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', {defaultValue: "Search"})}:
          </Label>
          <SearchInput
            id="doctorSearchTerm"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({searchTerm: e.target.value})}
            placeholder={t('doctors.searchPlaceholder', {defaultValue: "Name, license, email..."})}
            aria-label={t('doctors.searchPlaceholder', {defaultValue: "Search Doctors by Name, license, email, phone, or specialty"})}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="doctorStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.status', {defaultValue: "Status"})}:
          </Label>
          <SimpleSelect
            id="doctorStatusFilter"
            value={filters.status}
            onValueChange={(value) => onFiltersChange({status: value})}
            options={statusOptions}
            placeholder={t('filters.selectStatus', {defaultValue: "Select Status"})}
            aria-label={t('filters.selectStatus', {defaultValue: "Filter by status"})}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="doctorSpecialtyFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('doctors.fields.specialties', {defaultValue: "Specialty"})}:
          </Label>
          <SimpleSelect
            id="doctorSpecialtyFilter"
            value={filters.specialty}
            onValueChange={(value) => onFiltersChange({specialty: value})}
            options={specialtyOptions}
            placeholder={t('filters.selectSpecialty', {defaultValue: "Select Specialty"})}
            aria-label={t('filters.selectSpecialty', {defaultValue: "Filter by specialty"})}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="doctorCityFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('doctors.fields.city', {defaultValue: "City"})}:
          </Label>
          <SimpleSelect
            id="doctorCityFilter"
            value={filters.city}
            onValueChange={(value) => onFiltersChange({city: value})}
            options={cityOptions}
            placeholder={t('filters.selectCity', {defaultValue: "Select City"})}
            aria-label={t('filters.selectCity', {defaultValue: "Filter by city"})}
            className="mt-1 w-full"
          />
        </div>
      </div>
      
      {typeof currentView !== 'undefined' && currentView !== 'table' && (
        <div className="mt-4 pt-3 border-t dark:border-gray-700">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {t('common.sortBy', { defaultValue: "Sort By" })}:
          </Label>
          <div className="flex flex-wrap gap-2">
            {sortableFields.map(field => (
              <Button
                key={field.key}
                variant={sortConfig.key === field.key ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSortChange(field.key)}
                className={`flex items-center gap-1.5 text-xs dark:border-gray-600 ${sortConfig.key === field.key ? 'dark:bg-gray-600 dark:text-white' : 'dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                {field.label}
                {sortConfig.key === field.key && <SortIcon className="h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>
        </div>
      )}
    </FilterBarCard>
  );
}