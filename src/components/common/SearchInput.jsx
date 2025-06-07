import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Label } from '@/components/ui/label';

export default function SearchInput({ value, onChange, placeholder, label, className = "" }) {
  const { t, isRTL } = useLanguageHook();
  const defaultPlaceholder = placeholder || t('common.search', { defaultValue: 'Search...' });
  const defaultLabel = label || t('common.searchLabel', { defaultValue: 'Search' });

  return (
    <div className={`w-full ${className}`}>
      {label && <Label htmlFor="globalSearchInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{defaultLabel}</Label>}
      <div className="relative">
        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          id="globalSearchInput"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultPlaceholder}
          className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
        />
      </div>
    </div>
  );
}