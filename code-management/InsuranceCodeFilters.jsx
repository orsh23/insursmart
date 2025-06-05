import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';
import { Label } from '@/components/ui/label';

export default function InsuranceCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allInsuranceCodes,
  t, language, isRTL,
  currentView
}) {

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'inactive', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);

  const preAuthOptions = useMemo(() => [
    { value: 'all', label: t('filters.allPreAuth', { defaultValue: 'All Pre-Auth' }) },
    { value: 'required', label: t('common.required', { defaultValue: 'Required' }) },
    { value: 'not_required', label: t('common.notRequired', { defaultValue: 'Not Required' }) },
  ], [t]);

  const sortableFields = useMemo(() => [
    { key: 'code', label: t('insuranceCodes.fields.code', {defaultValue: 'Code'}) },
    { key: 'name_en', label: t('insuranceCodes.fields.nameEn', {defaultValue: 'Name (EN)'}) },
    { key: 'category_path', label: t('insuranceCodes.fields.categoryPath', {defaultValue: 'Category Path'}) },
    { key: 'is_active', label: t('insuranceCodes.fields.isActive', {defaultValue: 'Status'}) },
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
  ], [t]);

  const SortIcon = sortConfig.direction === 'ascending' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <FilterBarCard
      title={t('common.filtersAndSort', {defaultValue: 'Filters & Sort'})}
      onResetFilters={onResetFilters}
      t={t} isRTL={isRTL}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        <div>
          <Label htmlFor="insuranceCodeSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', { defaultValue: "Search" })}:
          </Label>
          <SearchInput
            id="insuranceCodeSearchTerm"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder={t('insuranceCodes.searchPlaceholder', { defaultValue: "Search codes, names..." })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodeStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.isActive', { defaultValue: "Status" })}:
          </Label>
          <SimpleSelect
            id="insuranceCodeStatusFilter"
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value })}
            options={statusOptions}
            placeholder={t('filters.selectStatus', { defaultValue: "Select Status" })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodePreAuthFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.requiresPreAuth', { defaultValue: "Pre-Auth" })}:
          </Label>
          <SimpleSelect
            id="insuranceCodePreAuthFilter"
            value={filters.requiresPreAuth}
            onValueChange={(value) => onFiltersChange({ requiresPreAuth: value })}
            options={preAuthOptions}
            placeholder={t('insuranceCodes.filters.selectPreAuth', { defaultValue: "Select Pre-Auth" })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodeCategoryFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.categoryPath', { defaultValue: "Category" })}:
          </Label>
          <SearchInput
            id="insuranceCodeCategoryFilter"
            value={filters.categoryPath}
            onChange={(e) => onFiltersChange({ categoryPath: e.target.value })}
            placeholder={t('insuranceCodes.filterByCategory', { defaultValue: "Filter by category..." })}
            className="mt-1"
          />
        </div>
        {currentView === 'card' && (
          <div>
            <Label htmlFor="insuranceCodeSortField" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('common.sortBy', { defaultValue: "Sort By" })}:
            </Label>
            <div className="flex mt-1">
              <SimpleSelect
                id="insuranceCodeSortField"
                value={sortConfig.key}
                onValueChange={(value) => onSortChange({ key: value, direction: sortConfig.direction })}
                options={sortableFields}
                placeholder={t('common.selectSortField', { defaultValue: "Select Field" })}
                className="flex-1 rounded-r-none"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSortChange({ key: sortConfig.key, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}
                className="rounded-l-none border-l-0 px-2"
                title={t('common.toggleSortDirection', { defaultValue: "Toggle sort direction" })}
              >
                <SortIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </FilterBarCard>
  );
}