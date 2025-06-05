import { useMemo } from 'react';
import { textFilter, enumFilter, arrayContainsFilter } from '../utils/filters'; // Assuming arrayContainsFilter exists or we add it

// Helper for array fields like sub_specialties or tags
// Checks if at least one of the item's array values matches the filter value (if filter is not 'all')
const arrayFieldFilter = (itemArray, filterValue) => {
  if (!filterValue || filterValue === 'all') return true;
  if (!itemArray || !Array.isArray(itemArray)) return false;
  return itemArray.includes(filterValue);
};


export function useFilteredDoctors(doctors, filters) {
  return useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    
    return doctors.filter(doctor => {
      // Search term filter: Checks multiple fields
      const searchFields = [
        'first_name_en', 'last_name_en',
        'first_name_he', 'last_name_he',
        'license_number',
        'specialty',
        'email',
        'phone',
        'city',
        'notes'
      ];
      // Additionally search within array fields
      const searchTerm = filters.searchTerm?.toLowerCase().trim();
      let searchTermMatch = textFilter(doctor, filters.searchTerm, searchFields);
      if (searchTerm && !searchTermMatch) { // if basic fields don't match, check array fields
         if (doctor.sub_specialties?.some(sub => sub.toLowerCase().includes(searchTerm))) {
            searchTermMatch = true;
         }
         if (!searchTermMatch && doctor.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
            searchTermMatch = true;
         }
      }
      if (!searchTermMatch) return false;


      // Status filter
      if (!enumFilter(doctor.status, filters.status)) return false;

      // Specialty filter
      if (!enumFilter(doctor.specialty, filters.specialty)) return false;
      
      // City filter
      if (!enumFilter(doctor.city, filters.city)) return false;

      // Sub-specialty filter (single select for now)
      if (!arrayFieldFilter(doctor.sub_specialties, filters.subSpecialty)) return false;
      
      // Tag filter (single select for now)
      if (!arrayFieldFilter(doctor.tags, filters.tag)) return false;

      return true;
    });
  }, [doctors, filters]);
}