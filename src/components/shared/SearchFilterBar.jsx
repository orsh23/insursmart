
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../utils/cn';

/**
 * Reusable search and filter bar component
 * 
 * @param {Object} props Component props
 * @param {string} props.searchQuery Current search query
 * @param {Function} props.onSearch Search change handler
 * @param {string} props.searchPlaceholder Placeholder text for search input
 * @param {React.ReactNode} props.filterContent Content for the filter dropdown
 * @param {Function} props.onReset Reset filters handler
 * @param {boolean} props.isRTL Whether UI is in RTL mode
 */
export default function SearchFilterBar({
  searchQuery = '',
  onSearch,
  searchPlaceholder = 'Search...',
  filterContent,
  onReset,
  isRTL = false
}) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    // Don't automatically close filters - user might want to select new ones
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="relative flex-grow max-w-md">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", 
            isRTL ? "right-3" : "left-3")} 
            size={18} 
          />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className={cn("pl-10", isRTL && "pr-10 pl-4")}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
        
        {filterContent && (
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={toggleFilters}
            className="gap-2"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
        )}
        
        {onReset && (searchQuery || showFilters) && (
          <Button variant="ghost" onClick={handleReset} size="sm">
            <X size={16} className="mr-2" />
            Reset
          </Button>
        )}
      </div>
      
      {showFilters && filterContent && (
        <div className="bg-muted/30 border rounded-md p-4 mt-2">
          {filterContent}
        </div>
      )}
    </div>
  );
}
