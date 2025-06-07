// Content of components/hooks/useFilteredProviders.js
import { useMemo } from 'react';

/**
 * Filters a list of providers based on various criteria.
 * @param {Array<Object>} providers - The array of provider objects to filter.
 * @param {Object} filters - An object containing filter criteria.
 *   @param {string} [filters.searchTerm] - Text to search in name, legal ID, contact info.
 *   @param {string} [filters.providerType] - Specific provider type to filter by ('all' for no filter).
 *   @param {string} [filters.city] - Specific city to filter by ('all' for no filter). This uses legacy contact.city.
 *   @param {string} [filters.status] - Specific status ('active', 'inactive', 'all').
 * @param {string} language - Current language ('en' or 'he') for localized name search.
 * @returns {Array<Object>} The filtered array of provider objects.
 */
export function useFilteredProviders(providers, filters, language = 'en') {
  return useMemo(() => {
    if (!Array.isArray(providers)) return [];
    if (!filters) return providers;

    const { searchTerm, providerType, city, status } = filters;
    const lowerSearchTerm = searchTerm?.toLowerCase() || '';

    return providers.filter(provider => {
      if (!provider) return false;

      // Search term matching
      if (lowerSearchTerm) {
        const nameEn = provider.name?.en?.toLowerCase() || '';
        const nameHe = provider.name?.he?.toLowerCase() || '';
        const nameMatches = (language === 'he' ? nameHe.includes(lowerSearchTerm) : nameEn.includes(lowerSearchTerm)) || nameEn.includes(lowerSearchTerm) || nameHe.includes(lowerSearchTerm);
        
        const legalIdMatches = provider.legal?.identifier?.toLowerCase().includes(lowerSearchTerm);
        const contactPersonMatches = provider.contact?.contact_person_name?.toLowerCase().includes(lowerSearchTerm);
        const contactEmailMatches = provider.contact?.email?.toLowerCase().includes(lowerSearchTerm);
        const contactPhoneMatches = provider.contact?.phone?.includes(lowerSearchTerm); // Phone search is typically direct contains
        const contactCityMatches = provider.contact?.city?.toLowerCase().includes(lowerSearchTerm);
        // Note: address_id would require fetching address details for search, not done here.

        if (!(nameMatches || legalIdMatches || contactPersonMatches || contactEmailMatches || contactPhoneMatches || contactCityMatches)) {
          return false;
        }
      }

      // Provider Type filter
      if (providerType && providerType !== 'all' && provider.provider_type !== providerType) {
        return false;
      }
      
      // City filter (uses legacy contact.city)
      // For address_id, filtering would happen based on fetched & joined address data, or server-side.
      if (city && city !== 'all' && provider.contact?.city?.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      // Status filter
      if (status && status !== 'all' && provider.status !== status) {
        return false;
      }

      return true;
    });
  }, [providers, filters, language]);
}