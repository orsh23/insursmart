import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContractHistoryFilterBar({ 
  filters, 
  onFilterChange, 
  onReset, 
  providerOptions, 
  userOptions, 
  changeTypeOptions 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        {/* Search */}
        <div className="w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search history..."
            className="pl-10 w-full md:w-[300px]"
            value={filters.searchTerm || ''}
            onChange={(e) => onFilterChange("searchTerm", e.target.value)}
          />
        </div>
        
        {/* Reset button */}
        <Button variant="outline" onClick={onReset}>
          <FilterX className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Provider filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Provider</label>
          <Select
            value={filters.provider_id || 'all'}
            onValueChange={(value) => onFilterChange("provider_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providerOptions?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Change type filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Change Type</label>
          <Select
            value={filters.changeType || 'all'}
            onValueChange={(value) => onFilterChange("changeType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Changes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Change Types</SelectItem>
              {changeTypeOptions?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* User filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Modified By</label>
          <Select
            value={filters.user_id || 'all'}
            onValueChange={(value) => onFilterChange("user_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {userOptions?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium block mb-2">From Date</label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2">To Date</label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}