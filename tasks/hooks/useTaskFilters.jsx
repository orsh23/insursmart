import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/context/LanguageContext';
import { useAppStore } from '@/components/store/useAppStore';

export const useTaskFilters = (initialFilters = {}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { taskFilters, setTaskFilters } = useAppStore();
  
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    ...initialFilters
  });

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      setTaskFilters?.(newFilters); // Update global store if available
      return newFilters;
    });
  }, [setTaskFilters]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      status: 'all',
      priority: 'all',
      category: 'all'
    };
    setFilters(defaultFilters);
    setTaskFilters?.(defaultFilters);
  }, [setTaskFilters]);

  return {
    filters,
    handleFilterChange,
    resetFilters
  };
};