import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';
import { Label } from '@/components/ui/label';

export default function InternalCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allInternalCodes, // Assuming this prop can be passed for category options
  t, language, isRTL,
  currentView
}) {

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'true', label: t('status.active', { defaultValue: 'Active' }) }, // Assuming is_active is boolean
    { value: 'false', label: t('status.inactive', { defaultValue: 'Inactive' }) },
  ], [t]);

  const billableOptions = useMemo(() => [
    { value: 'all', label: t('filters.allBillable', { defaultValue: 'All (Billable)' }) },
    { value: 'true', label: t('common.yes', { defaultValue: 'Yes' }) },
    { value: 'false', label: t('common.no', { defaultValue: 'No' }) },
  ], [t]);
  
  // TODO: Populate category options dynamically if needed, or use a text input for category_path
  const categoryPathOptions = useMemo(() => {
    const uniquePaths = Array.isArray(allInternalCodes)
      ? [...new Set(allInternalCodes.map(c => c.category_path).filter(Boolean))].sort()
      : [];
    const options = uniquePaths.map(path => ({ value: path, label: path })); // Simple label for now
    return [{ value: 'all', label: t('filters.allCategories', { defaultValue: 'All Categories' }) }, ...options];
  }, [allInternalCodes, t]);


  const sortableFields = useMemo(() => [
    { key: 'code_number', label: t('internalCodes.fields.codeNumber', {defaultValue: 'Code Number'}) },
    { key: 'description_en', label: t('internalCodes.fields.descriptionEn', {defaultValue: 'Description (EN)'}) },
    { key: 'category_path', label: t('internalCodes.fields.categoryPath', {defaultValue: 'Category Path'}) },
    { key: 'is_active', label: t('internalCodes.fields.isActive', {defaultValue: 'Active Status'}) },
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
  ], [t]);

  const SortIcon = sortConfig.direction === 'ascending' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <FilterBarCard
      title={t('common.filtersAndSort', {defaultValue: 'Filters & Sort'})}
      onResetFilters={onResetFilters}
      t={t} isRTL={isRTL}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="internalCodeSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', { defaultValue: "Search" })}:
          </Label>
          <SearchInput
            id="internalCodeSearchTerm"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder={t('internalCodes.searchPlaceholder', { defaultValue: "Search by code or description..." })}
            aria-label={t('internalCodes.searchPlaceholder', { defaultValue: "Search internal codes" })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="internalCodeStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('internalCodes.fields.isActive', { defaultValue: "Active Status" })}:
          </Label>
          <SimpleSelect
            id="internalCodeStatusFilter"
            value={String(filters.is_active)} // Ensure value matches string options
            onValueChange={(value) => onFiltersChange({ is_active: value === 'all' ? 'all' : value === 'true' })}
            options={statusOptions}
            placeholder={t('filters.selectStatus', { defaultValue: "Select Status" })}
            aria-label={t('filters.selectStatus', { defaultValue: "Filter by active status" })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="internalCodeBillableFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('internalCodes.fields.isBillable', { defaultValue: "Billable" })}:
          </Label>
          <SimpleSelect
            id="internalCodeBillableFilter"
            value={String(filters.is_billable)} // Ensure value matches string options
            onValueChange={(value) => onFiltersChange({ is_billable: value === 'all' ? 'all' : value === 'true' })}
            options={billableOptions}
            placeholder={t('filters.selectBillable', { defaultValue: "Select Billable Status" })}
            aria-label={t('filters.selectBillable', { defaultValue: "Filter by billable status" })}
            className="mt-1 w-full"
          />
        </div>
        {/* <div>
          <Label htmlFor="internalCodeCategoryFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('internalCodes.fields.categoryPath', { defaultValue: "Category Path" })}:
          </Label>
          <SimpleSelect
            id="internalCodeCategoryFilter"
            value={filters.category_path}
            onValueChange={(value) => onFiltersChange({ category_path: value })}
            options={categoryPathOptions}
            placeholder={t('filters.selectCategory', { defaultValue: "Select Category" })}
            aria-label={t('filters.selectCategory', { defaultValue: "Filter by category path" })}
            className="mt-1 w-full"
            disabled={categoryPathOptions.length <= 1} // Disable if no dynamic paths
          />
        </div> */}

        {currentView !== 'table' && (
          <div>
            <Label htmlFor="internalCodeSortSelect" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('common.sortBy', { defaultValue: "Sort By" })}:
            </Label>
            <div className="flex items-center gap-1 mt-1">
              <SimpleSelect
                id="internalCodeSortSelect"
                value={sortConfig.key}
                onValueChange={(value) => onSortChange(value)}
                options={sortableFields}
                placeholder={t('common.sortBy', { defaultValue: "Sort By" })}
                aria-label={t('common.sortBy', { defaultValue: "Sort by field" })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSortChange(sortConfig.key)} // Toggle direction
                className="p-2"
                aria-label={t('common.toggleSortDirection', { defaultValue: "Toggle sort direction" })}
              >
                <SortIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </FilterBarCard>
  );
}