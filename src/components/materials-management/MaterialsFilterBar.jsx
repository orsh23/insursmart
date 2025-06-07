import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { Search, FilterX } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function MaterialsFilterBar({
  searchTerm,
  onSearchTermChange,
  filters,
  onFilterChange,
  onResetFilters,
  unitTypes = [],
  manufacturers = [],
  suppliers = []
}) {
  const { t } = useLanguageHook();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="relative lg:col-span-2">
          <Label htmlFor="search-materials">{t('common.search', {defaultValue: 'Search'})}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              id="search-materials"
              placeholder={t('materials.searchPlaceholder', {defaultValue: "Search by name, description..."})}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="filter-unit-of-measure">{t('materials.filters.unitOfMeasure', {defaultValue: 'Unit Type'})}</Label>
          <Select
            id="filter-unit-of-measure"
            value={filters.unit_of_measure}
            onChange={(e) => onFilterChange("unit_of_measure", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.units', {defaultValue: 'All Units'})}</SelectItem>
            {unitTypes.map(unit => (
              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
            ))}
          </Select>
        </div>
          
        <div>
          <Label htmlFor="filter-is-active">{t('materials.filters.status', {defaultValue: 'Status'})}</Label>
          <Select
            id="filter-is-active"
            value={filters.is_active}
            onChange={(e) => onFilterChange("is_active", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.status', {defaultValue: 'All Status'})}</SelectItem>
            <SelectItem value="active">{t('common.active', {defaultValue: 'Active'})}</SelectItem>
            <SelectItem value="inactive">{t('common.inactive', {defaultValue: 'Inactive'})}</SelectItem>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-has-variants">{t('materials.filters.variants', {defaultValue: 'Variants'})}</Label>
          <Select
            id="filter-has-variants"
            value={filters.has_variants}
            onChange={(e) => onFilterChange("has_variants", e.target.value)}
          >
            <SelectItem value="all">{t('common.all', {defaultValue: 'All'})}</SelectItem>
            <SelectItem value="yes">{t('materials.filters.withVariants', {defaultValue: 'With Variants'})}</SelectItem>
            <SelectItem value="no">{t('materials.filters.withoutVariants', {defaultValue: 'Without Variants'})}</SelectItem>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="filter-manufacturer">{t('materials.filters.manufacturer', {defaultValue: 'Manufacturer'})}</Label>
          <Select
            id="filter-manufacturer"
            value={filters.manufacturer}
            onChange={(e) => onFilterChange("manufacturer", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.manufacturers', {defaultValue: 'All Manufacturers'})}</SelectItem>
            {manufacturers.map(manufacturer => (
              <SelectItem key={manufacturer.id || manufacturer} value={manufacturer.id || manufacturer}>
                {manufacturer.name_en || manufacturer}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <div>
          <Label htmlFor="filter-supplier">{t('materials.filters.supplier', {defaultValue: 'Supplier'})}</Label>
          <Select
            id="filter-supplier"
            value={filters.supplier}
            onChange={(e) => onFilterChange("supplier", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.suppliers', {defaultValue: 'All Suppliers'})}</SelectItem>
            {suppliers.map(supplier => (
              <SelectItem key={supplier.id || supplier} value={supplier.id || supplier}>
                {supplier.name_en || supplier}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onResetFilters}>
          <FilterX className="w-4 h-4 mr-2" />
          {t('common.resetFilters', {defaultValue: 'Reset Filters'})}
        </Button>
      </div>
    </div>
  );
}