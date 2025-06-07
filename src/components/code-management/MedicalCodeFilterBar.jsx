import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { Search, FilterX } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function MedicalCodeFilterBar({
  searchTerm,
  onSearchTermChange,
  filters,
  onFilterChange,
  onResetFilters,
  codeSystems = [],
  tags = []
}) {
  const { t } = useLanguageHook();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="relative lg:col-span-2">
          <Label htmlFor="search-codes">{t('common.search', {defaultValue: 'Search'})}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              id="search-codes"
              placeholder={t('medicalCodes.searchPlaceholder', {defaultValue: "Search by code, description..."})}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="filter-code-system">{t('medicalCodes.filters.codeSystem', {defaultValue: 'Code System'})}</Label>
          <Select
            id="filter-code-system"
            value={filters.code_system}
            onChange={(e) => onFilterChange("code_system", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.systems', {defaultValue: 'All Systems'})}</SelectItem>
            {codeSystems.map(system => (
              <SelectItem key={system} value={system}>{system}</SelectItem>
            ))}
          </Select>
        </div>
          
        <div>
          <Label htmlFor="filter-status">{t('medicalCodes.filters.status', {defaultValue: 'Status'})}</Label>
          <Select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.status', {defaultValue: 'All Status'})}</SelectItem>
            <SelectItem value="active">{t('common.active', {defaultValue: 'Active'})}</SelectItem>
            <SelectItem value="deprecated">{t('common.deprecated', {defaultValue: 'Deprecated'})}</SelectItem>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-tag">{t('medicalCodes.filters.tag', {defaultValue: 'Tag'})}</Label>
          <Select
            id="filter-tag"
            value={filters.tag}
            onChange={(e) => onFilterChange("tag", e.target.value)}
          >
            <SelectItem value="all">{t('common.allOptions.tags', {defaultValue: 'All Tags'})}</SelectItem>
            {tags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
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