import React from 'react';
// import { useLanguageHook } from '@/components/useLanguageHook'; // Removed
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from "@/components/ui/select";
import { Search, FilterX, User, FileText, Link as LinkIcon, CheckSquare, Square } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';

export default function PolicyLinkFilterBar({
  filters,
  onFilterChange,
  onReset,
  insuredPersonOptions = [],
  policyOptions = [],
  coverageTypeOptions = [],
  activeFlagOptions = []
}) {
  // const { t, isRTL } = useLanguageHook(); // Removed

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const handleSelectChange = (name, value) => {
    onFilterChange(name, value);
  };

  return (
    <FilterBarCard>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 left-3" />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={'Search by insured name or policy number...'}
            className="pl-10 w-full"
          />
        </div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
          <FilterX className="w-4 h-4 mr-2" />
          {'Reset Filters'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="filter-link-insured" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <User className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Insured Person'}
          </label>
          <Select
            name="insured_id"
            value={filters.insured_id}
            onChange={(e) => handleSelectChange('insured_id', e.target.value)}
            id="filter-link-insured"
          >
            <SelectItem value="all">{'All Insured'}</SelectItem>
            {insuredPersonOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <div>
          <label htmlFor="filter-link-policy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileText className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Policy'}
          </label>
          <Select
            name="policy_id"
            value={filters.policy_id}
            onChange={(e) => handleSelectChange('policy_id', e.target.value)}
            id="filter-link-policy"
          >
            <SelectItem value="all">{'All Policies'}</SelectItem>
            {policyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-link-coverage-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <LinkIcon className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Coverage Type'}
          </label>
          <Select
            name="coverage_type"
            value={filters.coverage_type}
            onChange={(e) => handleSelectChange('coverage_type', e.target.value)}
            id="filter-link-coverage-type"
          >
            <SelectItem value="all">{'All Types'}</SelectItem>
            {coverageTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-link-active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <CheckSquare className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Link Status'}
          </label>
          <Select
            name="active_flag"
            value={filters.active_flag}
            onChange={(e) => handleSelectChange('active_flag', e.target.value)}
            id="filter-link-active"
          >
            <SelectItem value="all">{'All (Active & Inactive)'}</SelectItem>
            {activeFlagOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} {/* e.g., "Active Links", "Inactive Links" */}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </FilterBarCard>
  );
}