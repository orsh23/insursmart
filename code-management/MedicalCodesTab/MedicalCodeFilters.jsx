import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';
import { Label } from '@/components/ui/label'; // Added Label import

export default function MedicalCodeFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allMedicalCodes, // Assuming this prop exists or can be passed
  t, language, isRTL,
  currentView // To conditionally show sort for card view
}) {

  const codeSystemOptions = useMemo(() => {
    const systems = ["ICD9-DX", "ICD10-CM", "ICD10-PCS", "CPT", "HCPCS", "ICD9-PROC"];
    const options = systems.map(sys => ({ value: sys, label: sys }));
    return [{ value: 'all', label: t('filters.allCodeSystems', { defaultValue: 'All Code Systems' }) }, ...options];
  }, [t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
    { value: 'active', label: t('status.active', { defaultValue: 'Active' }) },
    { value: 'deprecated', label: t('status.deprecated', { defaultValue: 'Deprecated' }) },
  ], [t]);

  const sortableFields = useMemo(() => [
    { key: 'code', label: t('medicalCodes.fields.code', {defaultValue: 'Code'}) },
    { key: 'description_en', label: t('medicalCodes.fields.descriptionEn', {defaultValue: 'Description (EN)'}) },
    { key: 'code_system', label: t('medicalCodes.fields.codeSystem', {defaultValue: 'Code System'}) },
    { key: 'status', label: t('medicalCodes.fields.status', {defaultValue: 'Status'}) },
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
          <Label htmlFor="medicalCodeSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', { defaultValue: "Search" })}:
          </Label>
          <SearchInput
            id="medicalCodeSearchTerm"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder={t('medicalCodes.searchPlaceholder', { defaultValue: "Search by code or description..." })}
            aria-label={t('medicalCodes.searchPlaceholder', { defaultValue: "Search medical codes by code or description" })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="medicalCodeSystemFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('medicalCodes.fields.codeSystem', { defaultValue: "Code System" })}:
          </Label>
          <SimpleSelect
            id="medicalCodeSystemFilter"
            value={filters.codeSystem}
            onValueChange={(value) => onFiltersChange({ codeSystem: value })}
            options={codeSystemOptions}
            placeholder={t('filters.selectCodeSystem', { defaultValue: "Select Code System" })}
            aria-label={t('filters.selectCodeSystem', { defaultValue: "Filter by code system" })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="medicalCodeStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.status', { defaultValue: "Status" })}:
          </Label>
          <SimpleSelect
            id="medicalCodeStatusFilter"
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value })}
            options={statusOptions}
            placeholder={t('filters.selectStatus', { defaultValue: "Select Status" })}
            aria-label={t('filters.selectStatus', { defaultValue: "Filter by status" })}
            className="mt-1 w-full"
          />
        </div>

        {/* Sort controls - only show in card view or if table doesn't handle its own sort */}
        {currentView !== 'table' && (
          <div>
            <Label htmlFor="medicalCodeSortSelect" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('common.sortBy', { defaultValue: "Sort By" })}:
            </Label>
            <div className="flex items-center gap-1 mt-1">
              <SimpleSelect
                id="medicalCodeSortSelect"
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