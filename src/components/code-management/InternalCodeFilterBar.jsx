import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select'; // Simplified Select
import { Search, FilterX } from 'lucide-react';

export default function InternalCodeFilterBar({
  filters = {},
  onFilterChange = () => {},
  onResetFilters = () => {},
  categoryOptions = []
}) {

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];
  
  const billableOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const handleInputChange = (name, value) => {
    onFilterChange(name, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="searchTerm"
            value={filters.searchTerm || ""}
            onChange={(e) => handleInputChange("searchTerm", e.target.value)}
            placeholder="Search codes..."
            className="pl-10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Select
            value={filters.category_id || "all"}
            onChange={(e) => handleInputChange("category_id", e.target.value)}
          >
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={filters.status || "all"}
            onChange={(e) => handleInputChange("status", e.target.value)}
          >
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Billable</label>
          <Select
            value={filters.is_billable || "all"}
            onChange={(e) => handleInputChange("is_billable", e.target.value)}
          >
            <SelectItem value="all">All</SelectItem>
             {billableOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onResetFilters}>
          <FilterX className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}