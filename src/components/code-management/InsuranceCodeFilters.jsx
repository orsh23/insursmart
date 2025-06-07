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
  sortConfig, // Expects { key: string, direction: 'ascending' | 'descending' }
  onSortChange, // Expects to be called with { key: string, direction: string }
  currentView, // Added to conditionally show sort field
  sortOptionValue, // For the main sort select
  onSortOptionChange, // For the main sort select
  sortOptions, // Options for the main sort select (value/label pairs)
  preAuthOptions,
  statusOptions,
  t, language, isRTL,
  loading,
}) {

  // Removed statusOptions and preAuthOptions re-derivation as they are passed as props

  const sortableFields = useMemo(() => [
    { key: 'code', label: t('insuranceCodes.fields.code', {defaultValue: 'Code'}) },
    { key: language === 'he' ? 'name_he' : 'name_en', label: t('insuranceCodes.fields.name', {defaultValue: 'Name'}) },
    { key: 'category_path', label: t('insuranceCodes.fields.categoryPath', {defaultValue: 'Category Path'}) },
    { key: 'is_active', label: t('insuranceCodes.fields.isActiveShort', {defaultValue: 'Status'}) }, // Use short version for consistency
    { key: 'requires_preauthorization', label: t('insuranceCodes.fields.requiresPreAuthShort', {defaultValue: 'Pre-Auth'}) }, // Use short version
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
  ], [t, language]);

  // Ensure sortConfig is valid before trying to access its properties
  const currentSortKey = sortConfig?.key || (sortableFields[0]?.key || 'code');
  const currentSortDirection = sortConfig?.direction || 'ascending';
  const SortIcon = currentSortDirection === 'ascending' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  // Handler for the card view specific sort field select
  const handleCardSortFieldChange = (value) => {
    if (onSortChange) {
      onSortChange({ key: value, direction: currentSortDirection });
    }
  };

  // Handler for the card view specific sort direction button
  const handleCardSortDirectionToggle = () => {
    if (onSortChange) {
      onSortChange({ key: currentSortKey, direction: currentSortDirection === 'ascending' ? 'descending' : 'ascending' });
    }
  };


  return (
    <FilterBarCard
      title={t('common.filtersAndSort', {defaultValue: 'Filters & Sort'})}
      onResetFilters={onResetFilters}
      t={t} isRTL={isRTL}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div>
          <Label htmlFor="insuranceCodeSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', { defaultValue: "Search" })}:
          </Label>
          <SearchInput
            id="insuranceCodeSearchTerm"
            value={filters.searchTerm || ''} // Fallback for value
            onChange={(e) => onFiltersChange('searchTerm', e.target.value )} // Pass key and value
            placeholder={t('insuranceCodes.searchPlaceholder', { defaultValue: "Search codes, names..." })}
            className="mt-1"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodeStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.isActiveShort', { defaultValue: "Status" })}:
          </Label>
          <SimpleSelect
            id="insuranceCodeStatusFilter"
            value={filters.isActive || 'all'} // Fallback for value
            onValueChange={(value) => onFiltersChange('isActive', value)} // Pass key and value
            options={statusOptions || []} // Fallback for options
            placeholder={t('filters.selectStatus', { defaultValue: "Select Status" })}
            className="mt-1 w-full"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodePreAuthFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.requiresPreAuthShort', { defaultValue: "Pre-Auth" })}:
          </Label>
          <SimpleSelect
            id="insuranceCodePreAuthFilter"
            value={filters.requiresPreauthorization || 'all'} // Fallback
            onValueChange={(value) => onFiltersChange('requiresPreauthorization', value)} // Pass key and value
            options={preAuthOptions || []} // Fallback
            placeholder={t('insuranceCodes.filters.selectPreAuth', { defaultValue: "Select Pre-Auth" })}
            className="mt-1 w-full"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="insuranceCodeCategoryFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('insuranceCodes.fields.categoryPath', { defaultValue: "Category Path" })}:
          </Label>
          <SearchInput
            id="insuranceCodeCategoryFilter"
            value={filters.categoryPathQuery || ''} // Fallback
            onChange={(e) => onFiltersChange('categoryPathQuery', e.target.value)} // Pass key and value
            placeholder={t('insuranceCodes.filterByCategory', { defaultValue: "Filter by category..." })}
            className="mt-1"
            disabled={loading}
          />
        </div>
        {/* This is the main sort dropdown - available for both views */}
        <div>
           <Label htmlFor="insuranceCodeSortSelect" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('common.sortBy', { defaultValue: "Sort By" })}:
            </Label>
            <SimpleSelect
                id="insuranceCodeSortSelect"
                value={sortOptionValue} // e.g., "-code" or "name_en"
                onValueChange={onSortOptionChange} // Expects to handle value like "-code"
                options={sortOptions || []}
                placeholder={t('common.selectSortField', { defaultValue: "Select Sort Field" })}
                className="mt-1 w-full"
                disabled={loading}
            />
        </div>

        {/* Conditional sort field for card view - THIS IS NOW REDUNDANT as the main sort select handles it.
            Keeping it commented out for now in case the design intent was different.
        */}
        {/* {currentView === 'card' && (
          <div>
            <Label htmlFor="insuranceCodeCardSortField" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('common.sortByField', { defaultValue: "Sort Field (Card)" })}:
            </Label>
            <div className="flex mt-1">
              <SimpleSelect
                id="insuranceCodeCardSortField"
                value={currentSortKey}
                onValueChange={handleCardSortFieldChange}
                options={sortableFields}
                placeholder={t('common.selectSortField', { defaultValue: "Select Field" })}
                className="flex-1 rounded-r-none"
                disabled={loading}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCardSortDirectionToggle}
                className="rounded-l-none border-l-0 px-2"
                title={t('common.toggleSortDirection', { defaultValue: "Toggle sort direction" })}
                disabled={loading}
              >
                <SortIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </FilterBarCard>
  );
}