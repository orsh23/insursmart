
/**
 * Translations for the application
 */

export const translations = {
  // Status translations
  task_statuses: {
    "to_do": "לביצוע",
    "in_progress": "בתהליך",
    "review": "בבדיקה",
    "done": "הושלם"
  },

  // Priority translations
  priorities: {
    "low": "נמוכה",
    "medium": "בינונית",
    "high": "גבוהה",
    "urgent": "דחופה"
  },

  // Code mapping translations
  mapping_types: {
    "Single": "יחיד",
    "Alternative": "חלופי", 
    "Combination": "שילוב",
    "No Map": "אין מיפוי"
  },
  
  accuracy_types: {
    "Exact": "מדויק",
    "Approximate": "מקורב",
    "Partial": "חלקי"
  },

  // Provider names
  provider_names: {
    "Central Hospital": "בית חולים מרכזי",
    "Heart Clinic": "מרפאת לב",
    "Pediatric Center": "מרכז לרפואת ילדים"
  },

  // Patient names
  patient_names: {
    "John Doe": "ג'ון דו",
    "Jane Smith": "ג'יין סמית'"
  },

  // Request statuses
  request_statuses: {
    "draft": "טיוטה",
    "submitted": "הוגש",
    "reviewed": "נבדק",
    "approved": "אושר",
    "rejected": "נדחה"
  },

  // Claim statuses
  claim_statuses: {
    "submitted": "הוגש",
    "in_review": "בבדיקה",
    "approved": "אושר",
    "partially_approved": "אושר חלקית",
    "rejected": "נדחה"
  },

  // Price rules
  price_rules: {
    "Global Discount": "הנחה גלובלית",
    "Provider Discount": "הנחת ספק",
    "Volume Discount": "הנחת כמות",
    "Premium Package": "חבילה פרימיום",
    "Standard Package": "חבילה סטנדרטית"
  },

  // Price rule descriptions
  price_rule_descriptions: {
    "Applies a fixed percentage discount to all services": "מחיל הנחת אחוזים קבועה על כל השירותים",
    "Provider-specific discount agreement": "הסכם הנחה ספציפי לספק",
    "Discount based on service volume": "הנחה על בסיס נפח השירות",
    "All-inclusive premium service package": "חבילת שירות פרימיום הכל כלול",
    "Standard service package with basic coverage": "חבילת שירות סטנדרטית עם כיסוי בסיסי"
  },

  // Categories and tags
  categories: {
    "cardiac": "לבבי",
    "respiratory": "נשימתי",
    "orthopedic": "אורתופדי",
    "neurological": "נוירולוגי",
    "chronic": "כרוני",
    "emergency": "חירום",
    "outpatient": "אמבולטורי"
  },

  tag_combinations: {
    "heart": "לב",
    "office visit": "ביקור משרד",
    "follow-up": "ביקור מעקב",
    "emergency": "חירום"
  },
  // Common translations
  common: {
    "add": "הוסף",
    "edit": "ערוך",
    "delete": "מחק",
    "save": "שמור",
    "cancel": "בטל",
    "back": "חזור",
    "next": "הבא",
    "search": "חיפוש",
    "filter": "סינון",
    "all": "הכל",
    "none": "אין",
    "loading": "טוען...",
    "error": "שגיאה",
    "success": "הצלחה",
    "required": "שדה חובה",
    "optional": "אופציונלי",
    "details": "פרטים",
    "actions": "פעולות",
    "status": "סטטוס",
    "date": "תאריך",
    "type": "סוג",
    "name": "שם",
    "description": "תיאור",
    "notes": "הערות",
    "active": "פעיל",
    "inactive": "לא פעיל",
    "unassigned": "לא משויך",
    "no_tasks": "אין משימות",
    "no_data": "אין נתונים להצגה"
  },

  specialties: {
    "Cardiology": "קרדיולוגיה",
    "Neurology": "נוירולוגיה",
    "Orthopedics": "אורתופדיה",
    "Internal Medicine": "רפואה פנימית",
    "Pediatrics": "רפואת ילדים",
    "Surgery": "כירורגיה",
    "Ophthalmology": "אופתלמולוגיה",
    "Dermatology": "דרמטולוגיה",
    "Gynecology": "גינקולוגיה",
    "Urology": "אורולוגיה",
    "Psychiatry": "פסיכיאטריה",
    "ENT": "אף אוזן גרון",
    "Endocrinology": "אנדוקרינולוגיה",
    "Gastroenterology": "גסטרואנטרולוגיה",
    "Oncology": "אונקולוגיה",
    "Sports Medicine": "רפואת ספורט",
    "Allergy": "אלרגיה",
    "Radiology": "רדיולוגיה",
    "Pediatric Medicine": "רפואת ילדים",
    "Family Medicine": "רפואת משפחה"
  },
  
  contact_persons: {
    "Tel Aviv": "תל אביב",
    "Jerusalem": "ירושלים",
    "Haifa": "חיפה",
    "David Cohen": "דוד כהן",
    "Sarah Levy": "שרה לוי",
    "Rebecca Mizrachi": "רבקה מזרחי",
    "Michael Rubin": "מיכאל רובין",
    "Laboratory": "מעבדה",
    "Central Hospital": "בית חולים מרכזי",
    "Northern Hospital": "בית חולים צפוני",
    "Medical Center": "מרכז רפואי",
    "City Clinic": "מרפאת העיר",
    "Imaging Center": "מכון דימות",
    "Advanced Diagnostics": "אבחון מתקדם",
    "Wellness Clinic": "מרפאת ובנס"
  },

  contact_roles: {
    "Contact Person": "איש קשר",
    "Medical Director": "מנהל רפואי",
    "Administrative Manager": "מנהל אדמיניסטרטיבי",
    "Billing Contact": "איש קשר לחיובים"
  },

  units: {
    "piece": "יחידה",
    "box": "קופסה",
    "package": "חבילה",
    "set": "סט",
    "kit": "ערכה",
    "pack": "מארז",
    "unit": "יחידה",
    "dozen": "תריסר",
    "pair": "זוג",
    "ml": "מ\"ל",
    "mg": "מ\"ג",
    "g": "גרם",
    "kg": "ק\"ג",
    "Gram": "גרם",
    "Piece": "יחידה"
  },

  task_descriptions: {
    "Onboard new doctor at Heart Clinic": "קליטת רופא חדש במרפאת הלב",
    "Fix broken material inventory tracking": "תיקון מעקב מלאי חומרים שבור",
    "Update ICD-10 codes with 2023 changes": "עדכון קודי ICD-10 עם שינויי 2023",
    "Review provider contract for Central Hospital": "סקירת חוזה ספק עבור בית חולים מרכזי",
    "Complete paperwork and system setup for Dr. Sarah Johnson": "השלמת מסמכים והגדרת מערכת עבור ד\"ר שרה ג'ונסון",
    "Debug and repair issues with material inventory tracking system": "איתור וטיפול בבעיות במערכת מעקב מלאי חומרים",
    "Import and verify the 2023 updates to ICD-10 code catalog": "ייבוא ואימות עדכוני 2023 לקטלוג קודי ICD-10",
    "Review new terms and pricing models for the upcoming contract renewal": "סקירת תנאים חדשים ומודלים של תמחור לקראת חידוש החוזה הקרוב",
    "Standard annual service agreement": "הסכם שירות שנתי סטנדרטי",
    "Special pricing for outpatient services": "תמחור מיוחד לשירותי מרפאות חוץ",
    "Special rates agreement": "הסכם תעריפים מיוחדים", 
    "Specialized pediatric care services": "שירותי טיפול פדיאטרי מתמחה",
    "Annual service agreement": "הסכם שירות שנתי",
    "Contract initially created": "החוזה נוצר לראשונה",
    "Updated contract terms and expiration date": "עודכנו תנאי החוזה ותאריך התפוגה",
    "Contract terminated due to provider request": "החוזה בוטל לבקשת הספק"
  },

  modules: {
    "hospital": "בית חולים",
    "hospitals": "בתי חולים",
    "devices": "מכשירים",
    "contracts": "חוזים",
    "claims": "תביעות",
    "medical": "רפואי",
    "provider": "ספק",
    "providers": "ספקים",
    "privacy": "פרטיות",
    "onboarding": "קליטה",
    "data": "נתונים",
    "EMR": "תיק רפואי",
    "Licensing": "רישוי",
    "Coding": "קידוד",
    "Materials": "חומרים",
    "insurance": "ביטוח",
    "medical devices": "מכשירים רפואיים",
    "patient": "מטופל",
    "patients": "מטופלים",
    "doctor": "רופא",
    "doctors": "רופאים",
    "billing": "חיובים",
    "reports": "דוחות",
    "settings": "הגדרות",
    "admin": "ניהול",
    "dashboard": "לוח בקרה"
  },

  descriptions: {
    "Manage medical device inventory": "ניהול מלאי מכשירים רפואיים",
    "Contract management and renewal": "ניהול וחידוש חוזים",
    "Claims processing and tracking": "עיבוד ומעקב אחר תביעות",
    "Medical records management": "ניהול רשומות רפואיות",
    "Provider management and relations": "ניהול וקשרי ספקים",
    "Privacy and data protection": "פרטיות והגנת מידע",
    "Staff onboarding and training": "קליטת והדרכת עובדים",
    "Data analytics and reporting": "ניתוח נתונים ודיווח",
    "EMR integration and access": "אינטגרציה וגישה לתיק רפואי",
    "License management and renewal": "ניהול וחידוש רישיונות",
    "Medical coding and compliance": "קידוד רפואי ותאימות",
    "Materials management and tracking": "ניהול ומעקב אחר חומרים",
    "Hospital operations and management": "תפעול וניהול בית חולים",
    "Insurance claims and policies": "תביעות ופוליסות ביטוח",
    "Medical device tracking and maintenance": "מעקב ותחזוקת מכשירים רפואיים"
  },

  task_titles: {
    "Onboard new doctor at Heart Clinic": "קליטת רופא חדש במרפאת הלב",
    "Fix broken material inventory tracking": "תיקון מעקב מלאי חומרים",
    "Update ICD-10 codes with 2023 changes": "עדכון קודי ICD-10 עם שינויי 2023",
    "Review provider contract for Central Hospital": "סקירת חוזה ספק עבור בית חולים מרכזי",
    "Complete paperwork and system setup": "השלמת ניירת והגדרת מערכת",
    "Debug and repair issues": "איתור ותיקון תקלות",
    "Import and verify": "ייבוא ואימות",
    "Review new terms": "סקירת תנאים חדשים"
  },

  activity_types: {
    "Review": "סקירה",
    "Update": "עדכון",
    "Create": "יצירה",
    "Delete": "מחיקה",
    "Import": "ייבוא",
    "Export": "ייצוא",
    "Approve": "אישור",
    "Reject": "דחייה",
    "Complete": "השלמה",
    "Cancel": "ביטול"
  },
   // Module descriptions
   module_descriptions: {
    "hospital_management": "ניהול בית החולים ומתקניו",
    "device_management": "ניהול ומעקב אחר מכשירים רפואיים",
    "contract_management": "ניהול חוזים והסכמים",
    "claims_processing": "טיפול ומעקב אחר תביעות",
    "medical_records": "ניהול רשומות רפואיות",
    "provider_management": "ניהול ספקים ושירותים",
    "privacy_management": "ניהול פרטיות ואבטחת מידע",
    "staff_onboarding": "תהליכי קליטת עובדים",
    "data_analytics": "ניתוח נתונים ודוחות",
    "emr_integration": "ממשק עם מערכות תיק רפואי",
    "license_management": "ניהול רישיונות ואישורים",
    "coding_compliance": "קידוד ותאימות לתקנים",
    "materials_management": "ניהול מלאי וחומרים",
    "insurance_management": "ניהול ביטוחים ופוליסות"
  },

  // Status translations
  status: {
    "active": "פעיל",
    "inactive": "לא פעיל",
    "pending": "ממתין",
    "approved": "מאושר",
    "rejected": "נדחה",
    "completed": "הושלם",
    "in_progress": "בתהליך",
    "cancelled": "בוטל",
    "expired": "פג תוקף"
  },

  device_types: {
    "diagnostic": "אבחון",
    "therapeutic": "טיפולי",
    "monitoring": "ניטור",
    "surgical": "כירורגי",
    "imaging": "דימות",
    "laboratory": "מעבדה"
  },

  contract_types: {
    "service": "שירות",
    "maintenance": "תחזוקה",
    "supply": "אספקה",
    "lease": "חכירה",
    "licensing": "רישוי"
  },

  claim_types: {
    "medical": "רפואי",
    "dental": "דנטלי",
    "vision": "ראייה",
    "prescription": "מרשמים",
    "equipment": "ציוד"
  },

  privacy_categories: {
    "patient_data": "נתוני מטופלים",
    "staff_records": "רשומות צוות",
    "medical_records": "רשומות רפואיות",
    "billing_info": "מידע חיובים",
    "research_data": "נתוני מחקר"
  },

  onboarding_stages: {
    "initial": "התחלתי",
    "documentation": "תיעוד",
    "training": "הדרכה",
    "evaluation": "הערכה",
    "completion": "השלמה"
  },

  data_categories: {
    "clinical": "קליני",
    "administrative": "מנהלי",
    "financial": "פיננסי",
    "operational": "תפעולי",
    "research": "מחקרי"
  },

  emr_sections: {
    "demographics": "דמוגרפיה",
    "medical_history": "היסטוריה רפואית",
    "medications": "תרופות",
    "allergies": "אלרגיות",
    "immunizations": "חיסונים",
    "lab_results": "תוצאות מעבדה"
  },

  license_types: {
    "facility": "מתקן",
    "professional": "מקצועי",
    "equipment": "ציוד",
    "operation": "תפעול",
    "research": "מחקר"
  },

  coding_systems: {
    "icd": "ICD",
    "cpt": "CPT",
    "snomed": "SNOMED",
    "loinc": "LOINC",
    "drg": "DRG"
  },

  material_categories: {
    "medical_supplies": "ציוד רפואי",
    "medications": "תרופות",
    "surgical_supplies": "ציוד כירורגי",
    "laboratory_supplies": "ציוד מעבדה",
    "office_supplies": "ציוד משרדי"
  },

  insurance_types: {
    "health": "בריאות",
    "life": "חיים",
    "disability": "נכות",
    "dental": "דנטלי",
    "vision": "ראייה"
  },

  approval_statuses: {
    "pending": "ממתין",
    "in_review": "בבדיקה",
    "approved": "מאושר",
    "rejected": "נדחה",
    "partially_approved": "מאושר חלקית"
  }
};
