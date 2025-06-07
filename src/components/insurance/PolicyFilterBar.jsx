import React from 'react';
// import { useLanguageHook } from '@/components/useLanguageHook'; // Removed
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from "@/components/ui/select";
import { Search, FilterX, ShieldCheck, User as UserIcon, DollarSign } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';

export default function PolicyFilterBar({
  filters,
  onFilterChange,
  onReset,
  statusOptions = [], // Expecting { value: '...', label: '...' }
  insuredPersonOptions = [] // Expecting { value: '...', label: '...' }
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
            placeholder={'Search by policy number or insured name...'}
            className="pl-10 w-full"
          />
        </div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
          <FilterX className="w-4 h-4 mr-2" />
          {'Reset Filters'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="filter-policy-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <ShieldCheck className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Policy Status'}
          </label>
          <Select
            name="status"
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            id="filter-policy-status"
          >
            <SelectItem value="all">{'All Statuses'}</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <div>
          <label htmlFor="filter-insured-person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <UserIcon className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Insured Person'}
          </label>
          <Select
            name="insured_id"
            value={filters.insured_id}
            onChange={(e) => handleSelectChange('insured_id', e.target.value)}
            id="filter-insured-person"
          >
            <SelectItem value="all">{'All Insured Persons'}</SelectItem>
            {insuredPersonOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-min-coverage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <DollarSign className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Min. Max Coverage'}
          </label>
          <Input
            id="filter-min-coverage"
            name="min_coverage"
            type="number"
            value={filters.min_coverage}
            onChange={handleInputChange}
            placeholder={'Min amount'}
          />
        </div>

        <div>
          <label htmlFor="filter-max-coverage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             <DollarSign className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Max. Max Coverage'}
          </label>
          <Input
            id="filter-max-coverage"
            name="max_coverage"
            type="number"
            value={filters.max_coverage}
            onChange={handleInputChange}
            placeholder={'Max amount'}
          />
        </div>
      </div>
    </FilterBarCard>
  );
}