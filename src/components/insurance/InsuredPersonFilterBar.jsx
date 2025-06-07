import React from 'react';
// import { useLanguageHook } from '@/components/useLanguageHook'; // Removed
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from "@/components/ui/select"; // Using simplified Select
import { Search, FilterX, User, Phone, MapPin } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';

export default function InsuredPersonFilterBar({
  filters,
  onFilterChange,
  onReset,
  identificationTypes = [] // Expecting { value: '...', label: '...' }
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
            placeholder={"Search by name or ID number..."}
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
          <label htmlFor="filter-id-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {'ID Type'}
          </label>
          <Select
            name="identificationType"
            value={filters.identificationType}
            onChange={(e) => handleSelectChange('identificationType', e.target.value)}
            id="filter-id-type"
          >
            <SelectItem value="all">{'All ID Types'}</SelectItem>
            {identificationTypes.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <div className="w-full">
          <label htmlFor="filter-city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MapPin className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'City'}
          </label>
          <Input
            id="filter-city"
            name="city"
            value={filters.city}
            onChange={handleInputChange}
            placeholder={'Filter by city...'}
          />
        </div>

        <div className="w-full">
          <label htmlFor="filter-contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Phone className="inline-block h-4 w-4 mr-1 text-gray-500" /> {'Contact (Phone/Email)'}
          </label>
          <Input
            id="filter-contact"
            name="contact"
            value={filters.contact}
            onChange={handleInputChange}
            placeholder={'Filter by phone or email...'}
          />
        </div>
      </div>
    </FilterBarCard>
  );
}