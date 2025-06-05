import { useMemo } from 'react';

// Helper for nested object fields
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((previous, current) => 
    previous && previous[current] !== undefined ? previous[current] : null, obj);
};

export function useFilteredProviders(providers, filters) {
  return useMemo(() => {
    if (!Array.isArray(providers)) return [];
    
    return providers.filter(provider => {
      // Search term filter: Checks multiple fields including nested objects
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase().trim();
        
        // Check provider name
        const nameEn = provider.name?.en?.toLowerCase() || '';
        const nameHe = provider.name?.he?.toLowerCase() || '';
        const legalIdentifier = provider.legal?.identifier?.toLowerCase() || '';
        const contactPerson = provider.contact?.contact_person_name?.toLowerCase() || '';
        const email = provider.contact?.email?.toLowerCase() || '';
        const phone = provider.contact?.phone?.toLowerCase() || '';
        
        if (!nameEn.includes(term) && 
            !nameHe.includes(term) && 
            !legalIdentifier.includes(term) && 
            !contactPerson.includes(term) && 
            !email.includes(term) && 
            !phone.includes(term)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && provider.status !== filters.status) {
        return false;
      }

      // Provider type filter
      if (filters.providerType !== 'all' && provider.provider_type !== filters.providerType) {
        return false;
      }
      
      // City filter - note this is nested in contact.city
      if (filters.city !== 'all') {
        const providerCity = getNestedValue(provider, 'contact.city');
        if (providerCity !== filters.city) {
          return false;
        }
      }

      return true;
    });
  }, [providers, filters]);
}