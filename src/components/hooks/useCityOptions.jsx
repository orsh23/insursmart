import { useMemo } from 'react';

/**
 * Extracts unique city names from a list of items (e.g., providers, doctors)
 * and formats them for a Select component.
 * @param {Array<Object>} data - The array of data objects (e.g., providers).
 * @param {string} cityFieldPath - The path to the city field (e.g., 'contact.city' or 'city').
 * @returns {Array<{value: string, label: string}>} - Sorted array of unique city options.
 */
export function useCityOptions(data, cityFieldPath = 'contact.city') {
  const cityOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const citySet = new Set();
    data.forEach(item => {
      // Safely access nested property
      const pathParts = cityFieldPath.split('.');
      let city = item;
      for (const part of pathParts) {
        if (city && typeof city === 'object' && part in city) {
          city = city[part];
        } else {
          city = null;
          break;
        }
      }
      
      if (city && typeof city === 'string' && city.trim() !== '') {
        citySet.add(city.trim());
      }
    });
    return Array.from(citySet)
      .sort((a, b) => a.localeCompare(b))
      .map(city => ({ value: city, label: city }));
  }, [data, cityFieldPath]);

  return cityOptions;
}