// Content of components/hooks/useFilteredDoctors.js
import { useMemo } from 'react';

/**
 * Filters a list of doctors based on various criteria.
 * @param {Array<Object>} doctors - The array of doctor objects to filter.
 * @param {Object} filters - An object containing filter criteria.
 *   @param {string} [filters.searchTerm] - Text to search in name, license, email, specialties.
 *   @param {string} [filters.specialty] - Specific specialty to filter by ('all' for no filter).
 *   @param {string} [filters.city] - Specific city to filter by ('all' for no filter).
 *   @param {string} [filters.status] - Specific status ('active', 'inactive', 'all').
 * @param {string} language - Current language ('en' or 'he') for localized name search.
 * @returns {Array<Object>} The filtered array of doctor objects.
 */
export function useFilteredDoctors(doctors, filters, language = 'en') {
  return useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    if (!filters) return doctors;

    const { searchTerm, specialty, city, status } = filters;
    const lowerSearchTerm = searchTerm?.toLowerCase() || '';

    return doctors.filter(doctor => {
      if (!doctor) return false;

      // Search term matching
      if (lowerSearchTerm) {
        const nameEn = `${doctor.first_name_en || ''} ${doctor.last_name_en || ''}`.toLowerCase();
        const nameHe = `${doctor.first_name_he || ''} ${doctor.last_name_he || ''}`.toLowerCase();
        const nameMatches = (language === 'he' ? nameHe.includes(lowerSearchTerm) : nameEn.includes(lowerSearchTerm)) || nameEn.includes(lowerSearchTerm) || nameHe.includes(lowerSearchTerm);
        
        const licenseMatches = doctor.license_number?.toLowerCase().includes(lowerSearchTerm);
        const emailMatches = doctor.email?.toLowerCase().includes(lowerSearchTerm);
        const specialtiesMatch = Array.isArray(doctor.specialties) && doctor.specialties.some(s => s?.toLowerCase().includes(lowerSearchTerm));
        const subSpecialtiesMatch = Array.isArray(doctor.sub_specialties) && doctor.sub_specialties.some(s => s?.toLowerCase().includes(lowerSearchTerm));
        const cityMatch = doctor.city?.toLowerCase().includes(lowerSearchTerm); // Legacy city field
        const addressMatch = doctor.address?.toLowerCase().includes(lowerSearchTerm); // Legacy address field
        // Note: address_id would require fetching address details for search, not done here.

        if (!(nameMatches || licenseMatches || emailMatches || specialtiesMatch || subSpecialtiesMatch || cityMatch || addressMatch)) {
          return false;
        }
      }

      // Specialty filter
      if (specialty && specialty !== 'all') {
        if (!Array.isArray(doctor.specialties) || !doctor.specialties.includes(specialty)) {
          // Also check sub-specialties if primary doesn't match
          if (!Array.isArray(doctor.sub_specialties) || !doctor.sub_specialties.includes(specialty)) {
            return false;
          }
        }
      }
      
      // City filter (for legacy city field)
      // For address_id, filtering would happen based on fetched & joined address data, or server-side.
      if (city && city !== 'all' && doctor.city?.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      // Status filter
      if (status && status !== 'all' && doctor.status !== status) {
        return false;
      }

      return true;
    });
  }, [doctors, filters, language]);
}