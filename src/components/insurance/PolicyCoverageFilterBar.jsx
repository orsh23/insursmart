import React from 'react';
// import { useLanguageHook } from '@/components/useLanguageHook'; // Removed
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from "@/components/ui/select";
import { Search, FilterX, FileText, DollarSign, ShieldCheck, CheckSquare } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';

export default function PolicyCoverageFilterBar({
  filters,
  onFilterChange,
  onReset,
  policyOptions = [],
  featureOptions = [] // e.g., { value: 'has_dental', label: 'Has Dental' }
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
      {/* No general search term for coverage, direct filters are more effective */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="filter-cov-policy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileText className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Policy'}
          </label>
          <Select
            name="policy_id"
            value={filters.policy_id}
            onChange={(e) => handleSelectChange('policy_id', e.target.value)}
            id="filter-cov-policy"
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
          <label htmlFor="filter-cov-feature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <CheckSquare className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Includes Feature'}
          </label>
          <Select
            name="includes_feature"
            value={filters.includes_feature}
            onChange={(e) => handleSelectChange('includes_feature', e.target.value)}
            id="filter-cov-feature"
          >
            <SelectItem value="all">{'Any Feature'}</SelectItem>
            {featureOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label htmlFor="filter-min-deductible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <DollarSign className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Min. Deductible'}
          </label>
          <Input
            id="filter-min-deductible"
            name="min_deductible"
            type="number"
            value={filters.min_deductible}
            onChange={handleInputChange}
            placeholder={'e.g., 100'}
          />
        </div>
        <div>
          <label htmlFor="filter-max-deductible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <DollarSign className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Max. Deductible'}
          </label>
          <Input
            id="filter-max-deductible"
            name="max_deductible"
            type="number"
            value={filters.max_deductible}
            onChange={handleInputChange}
            placeholder={'e.g., 1000'}
          />
        </div>
        <div>
          <label htmlFor="filter-min-oop" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <ShieldCheck className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Min. OOP Max'}
          </label>
          <Input
            id="filter-min-oop"
            name="min_oop_max"
            type="number"
            value={filters.min_oop_max}
            onChange={handleInputChange}
            placeholder={'e.g., 2000'}
          />
        </div>
        <div>
          <label htmlFor="filter-max-oop" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <ShieldCheck className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Max. OOP Max'}
          </label>
          <Input
            id="filter-max-oop"
            name="max_oop_max"
            type="number"
            value={filters.max_oop_max}
            onChange={handleInputChange}
            placeholder={'e.g., 10000'}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onReset}>
          <FilterX className="w-4 h-4 mr-2" />
          {'Reset Filters'}
        </Button>
      </div>
    </FilterBarCard>
  );
}