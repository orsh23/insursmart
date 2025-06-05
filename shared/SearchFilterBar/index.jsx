import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X as XIcon, Filter as FilterIcon, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/context/LanguageContext';
import { cn } from '@/components/utils/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * SearchFilterBar component for search input and collapsible filter section.
 * 
 * Props:
 *  - searchQuery: string (current search query)
 *  - onSearch: function (query: string) => void (callback for search query changes)
 *  - searchPlaceholder: string (optional placeholder for search input)
 *  - filterContent: JSX.Element (content for the collapsible filter section)
 *  - onReset: function () => void (callback when reset button is clicked)
 *  - isRTL: boolean (optional, for RTL layout adjustments, often from useLanguage)
 *  - initialFiltersOpen: boolean (optional, whether filters section is open by default)
 */
export default function SearchFilterBar({
  searchQuery,
  onSearch,
  searchPlaceholder,
  filterContent,
  onReset,
  isRTL: propIsRTL, // Allow prop override
  initialFiltersOpen = false,
}) {
  const { t, isRTL: contextIsRTL } = useLanguage();
  const isRTL = propIsRTL !== undefined ? propIsRTL : contextIsRTL;
  const [isFiltersOpen, setIsFiltersOpen] = useState(initialFiltersOpen);

  const defaultSearchPlaceholder = t('common.searchPlaceholder', { defaultValue: 'Search...' });

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className={cn("absolute h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} />
          <Input
            type="text"
            placeholder={searchPlaceholder || defaultSearchPlaceholder}
            value={searchQuery || ''}
            onChange={(e) => onSearch(e.target.value)}
            className={cn("w-full", isRTL ? "pr-10" : "pl-10")}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearch('')}
              className={cn("absolute h-7 w-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", isRTL ? "left-1.5" : "right-1.5")}
              aria-label={t('common.clearSearch', { defaultValue: 'Clear search' })}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {filterContent && (
           <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full sm:w-auto">
            <FilterIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('common.filters', { defaultValue: 'Filters' })}
            <span className={cn("h-2 w-2 rounded-full ml-2", isFiltersOpen ? 'bg-primary' : 'bg-muted-foreground/50')}></span>
          </Button>
        )}

        {onReset && (
          <Button variant="ghost" onClick={onReset} className="w-full sm:w-auto">
            <RotateCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('common.resetFilters', { defaultValue: 'Reset' })}
          </Button>
        )}
      </div>

      {filterContent && (
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="mt-4 pt-4 border-t">
            {filterContent}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}