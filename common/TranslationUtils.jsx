/**
 * Utility functions for consistent translations throughout the application
 */

/**
 * Get translated text for provider types
 * @param {string} type - Provider type
 * @param {boolean} isRTL - Whether to return Hebrew or English text
 * @returns {string} - Translated provider type text
 */
export function getProviderTypeText(type, isRTL = false) {
  const typeMapping = {
    hospital: isRTL ? "בית חולים" : "Hospital",
    clinic: isRTL ? "מרפאה" : "Clinic",
    imaging_center: isRTL ? "מכון דימות" : "Imaging Center",
    laboratory: isRTL ? "מעבדה" : "Laboratory",
    other: isRTL ? "אחר" : "Other"
  };
  
  return typeMapping[type] || type;
}

/**
 * Get translated text for affiliation types
 * @param {string} type - Affiliation type
 * @param {boolean} isRTL - Whether to return Hebrew or English text
 * @returns {string} - Translated affiliation type text
 */
export function getAffiliationTypeText(type, isRTL = false) {
  const affiliationTypes = {
    employed: isRTL ? "מועסק" : "Employed",
    visiting: isRTL ? "מבקר" : "Visiting",
    consultant: isRTL ? "יועץ" : "Consultant",
    resident: isRTL ? "מתמחה" : "Resident",
    independent: isRTL ? "עצמאי" : "Independent"
  };
  
  return affiliationTypes[type] || type;
}

/**
 * Get translated text for legal entity types
 * @param {string} type - Legal entity type
 * @param {boolean} isRTL - Whether to return Hebrew or English text
 * @returns {string} - Translated legal entity type text
 */
export function getLegalEntityTypeText(type, isRTL = false) {
  const legalTypes = {
    company: isRTL ? "חברה" : "Company",
    licensed_dealer: isRTL ? "עוסק מורשה" : "Licensed Dealer",
    association: isRTL ? "עמותה" : "Association",
    government: isRTL ? "ממשלתי" : "Government",
    other: isRTL ? "אחר" : "Other"
  };
  
  return legalTypes[type] || type;
}