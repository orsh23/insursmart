import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select'; // Simplified Select
import { Search, FilterX, CalendarDays } from 'lucide-react';

export default function ContractFilterBar({
  filters = {},
  onFilterChange = () => {},
  onReset = () => {},
  providerOptions = []
}) {

  const contractStatusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' }
  ];

  const scopeTypeOptions = [
    { value: "all_codes", label: "All Codes"},
    { value: "category", label: "Category"},
    { value: "specific_codes", label: "Specific Codes"}
  ];

  const handleInputChange = (name, value) => {
    onFilterChange(name, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Term */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="searchTerm"
            value={filters.searchTerm || ""}
            onChange={(e) => handleInputChange("searchTerm", e.target.value)}
            placeholder="Search contracts..."
            className="pl-10"
          />
        </div>

        {/* Provider Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <Select
            value={filters.provider_id || "all"}
            onChange={(e) => handleInputChange("provider_id", e.target.value)}
          >
            <SelectItem value="all">All Providers</SelectItem>
            {providerOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={filters.status || "all"}
            onChange={(e) => handleInputChange("status", e.target.value)}
          >
            <SelectItem value="all">All Statuses</SelectItem>
            {contractStatusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Scope Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Scope Type</label>
          <Select
            value={filters.scope_type || "all"}
            onChange={(e) => handleInputChange("scope_type", e.target.value)}
          >
            <SelectItem value="all">All Scope Types</SelectItem>
            {scopeTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        {/* Date Filters */}
        <div>
            <label className="block text-sm font-medium mb-1">Valid From Date</label>
            <div className="relative">
                 <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                    type="date"
                    name="valid_from"
                    value={filters.valid_from || ""}
                    onChange={(e) => handleInputChange("valid_from", e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium mb-1">Valid To Date</label>
             <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                    type="date"
                    name="valid_to"
                    value={filters.valid_to || ""}
                    onChange={(e) => handleInputChange("valid_to", e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>

      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onReset}>
          <FilterX className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}