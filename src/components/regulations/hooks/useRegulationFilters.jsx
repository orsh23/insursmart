import { useState, useEffect, useCallback } from 'react';

export default function useRegulationFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterType('all');
    setFilterActive('all');
  }, []);

  const applyFilters = useCallback((data) => {
    if (!Array.isArray(data)) return [];

    return data.filter(item => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (item.title_en && item.title_en.toLowerCase().includes(searchLower)) ||
        (item.title_he && item.title_he.toLowerCase().includes(searchLower)) ||
        (item.description_en && item.description_en.toLowerCase().includes(searchLower)) ||
        (item.description_he && item.description_he.toLowerCase().includes(searchLower)) ||
        (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      
      // Type filter
      const matchesType = filterType === 'all' || item.regulation_type === filterType;
      
      // Active status filter
      const matchesActive = filterActive === 'all' || 
        (filterActive === 'active' && item.is_active) || 
        (filterActive === 'inactive' && !item.is_active);
      
      return matchesSearch && matchesType && matchesActive;
    });
  }, [searchTerm, filterType, filterActive]);

  // Update filtered data when filters change
  useEffect(() => {
    setFilteredData(applyFilters(originalData));
  }, [searchTerm, filterType, filterActive, originalData, applyFilters]);

  // Function to update original data
  const setData = useCallback((data) => {
    setOriginalData(data);
    setFilteredData(applyFilters(data));
  }, [applyFilters]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterActive,
    setFilterActive,
    filteredData,
    originalData,
    setData,
    clearFilters,
    applyFilters
  };
}