import React, { useState } from 'react';
import { Search, FilterX } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Reusable toolbar layout with search and filters
 */
export default function ToolbarLayout({
  searchQuery,
  onSearch,
  searchPlaceholder,
  filterContent,
  onReset,
  className
}) {
  const { t, isRTL } = useLanguageHook();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-500`} />
          <Input
            type="search"
            value={searchQuery || ''}
            onChange={(e) => onSearch?.(e.target.value)}
            className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white`}
            placeholder={searchPlaceholder || t('common.searchPlaceholder', { defaultValue: 'Search...' })}
          />
        </div>

        {/* Filter toggle button (only shown if filters exist) */}
        {filterContent && (
          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={() => setShowFilters(!showFilters)}
          >
            {t('common.filter', { defaultValue: 'Filter' })}
            {showFilters ? ' ▲' : ' ▼'}
          </Button>
        )}
        
        {/* Reset filters button */}
        {onReset && (
          <Button
            variant="ghost"
            className="whitespace-nowrap"
            onClick={onReset}
          >
            <FilterX className="w-4 h-4 mr-2" />
            {t('common.resetFilters', { defaultValue: 'Reset' })}
          </Button>
        )}
      </div>

      {/* Filter content */}
      {showFilters && filterContent && (
        <div className="bg-white p-4 rounded-md border">
          {filterContent}
        </div>
      )}
    </div>
  );
}