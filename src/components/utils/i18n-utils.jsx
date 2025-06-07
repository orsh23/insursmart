
import { format as formatDateFns, isValid as isValidDateFns, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { enUS, he as heLocale } from 'date-fns/locale';

// Helper to get the correct date-fns locale object
export const getLocale = (languageCode) => {
  if (languageCode === 'he') return heLocale;
  return enUS;
};

export const getDirection = (languageCode) => (languageCode === 'he' ? 'rtl' : 'ltr');

export const formatSafeDate = (dateInput, localeParam, options = {}) => {
  try {
    if (dateInput === null || typeof dateInput === 'undefined' || dateInput === '') {
      return '';
    }

    let dateObj;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === 'string') {
      // Try parseISO first for standard ISO strings
      dateObj = parseISO(dateInput);
      // If parseISO fails (returns invalid date), try a more general Date constructor
      // This can help with non-ISO formats but is less reliable
      if (!isValidDateFns(dateObj)) {
        dateObj = new Date(dateInput);
      }
    } else if (typeof dateInput === 'number') {
      dateObj = new Date(dateInput); // Assume timestamp
    } else {
      // console.warn('formatSafeDate received an unexpected dateInput type:', typeof dateInput, dateInput);
      return 'Invalid Input Type';
    }

    if (!isValidDateFns(dateObj) || isNaN(dateObj.getTime())) {
      // console.warn('formatSafeDate: Invalid date object after parsing.', { dateInput, dateObj });
      return 'Invalid Date';
    }

    // Default to a common, safe format like 'yyyy-MM-dd' or 'PP' from date-fns
    let formatString = options.formatString || 'PP'; // 'PP' is like 'MMM d, yyyy'
    
    if (options.dateStyle) {
      switch (options.dateStyle) {
        case 'short': formatString = 'P'; break;      // e.g., 10/26/2023
        case 'medium': formatString = 'PP'; break;     // e.g., Oct 26, 2023
        case 'long': formatString = 'PPP'; break;      // e.g., October 26th, 2023
        case 'full': formatString = 'PPPP'; break;     // e.g., Thursday, October 26th, 2023
        // If a custom formatString is also provided, it takes precedence over dateStyle
        default: formatString = options.formatString || 'PP';
      }
    }
    
    // Ensure the format string does not contain problematic unescaped characters like 'n' for minutes
    // 'mm' is for minutes, 'MM' for month. 'nn' is not a standard date-fns token.
    // This replacement is a basic safeguard; complex custom formats might need more specific handling.
    formatString = String(formatString).replace(/(?<![Hh])n(?!n)/g, 'mm').replace(/N/g, 'MM');


    const validLocale = (localeParam && typeof localeParam === 'object' && localeParam.code) ? localeParam : enUS;

    return formatDateFns(dateObj, formatString, { locale: validLocale });
  } catch (error) {
    // console.error('Error in formatSafeDate:', error, { dateInput, localeParam, options });
    if (error.message && error.message.toLowerCase().includes("unescaped latin alphabet character")) {
        return `Formatting Error (Invalid Format String)`;
    }
    return 'Date Format Error';
  }
};

export const formatSafeDateDistance = (dateInput, languageCode = 'en', options = {}) => {
  try {
    if (dateInput === null || typeof dateInput === 'undefined' || dateInput === '') {
      return '';
    }
    
    let dateObj;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === 'string') {
      try {
        dateObj = parseISO(dateInput);
        if (!isValidDateFns(dateObj)) {
          dateObj = new Date(dateInput);
        }
      } catch {
        dateObj = new Date(dateInput);
      }
    } else if (typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else {
      console.warn('formatSafeDateDistance received an unexpected dateInput type:', typeof dateInput, dateInput);
      return 'Invalid Input Type';
    }

    if (!isValidDateFns(dateObj) || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const localeToUse = getLocale(languageCode);

    return formatDistanceToNowStrict(dateObj, { addSuffix: true, locale: localeToUse, ...options });
  } catch (error) {
    console.error('Error in formatSafeDateDistance:', error, { dateInput, languageCode, options });
    return 'Date Distance Error';
  }
};

export const getLocalizedValue = (item, baseFieldName, currentLang, fallbackLang = 'en', defaultValue = '') => {
  if (!item || typeof item !== 'object') {
    return defaultValue;
  }

  const langKey = `${baseFieldName}_${currentLang}`;
  const fallbackKey = `${baseFieldName}_${fallbackLang}`;
  const genericKey = baseFieldName;

  if (item[langKey] !== undefined && item[langKey] !== null && String(item[langKey]).trim() !== '') {
    return String(item[langKey]);
  }
  if (item[fallbackKey] !== undefined && item[fallbackKey] !== null && String(item[fallbackKey]).trim() !== '') {
    return String(item[fallbackKey]);
  }
  if (item[genericKey] !== undefined && item[genericKey] !== null && typeof item[genericKey] === 'string' && String(item[genericKey]).trim() !== '') {
    return String(item[genericKey]);
  }
  
  if (item[genericKey] && typeof item[genericKey] === 'object') {
    const nestedNameObject = item[genericKey];
    if (nestedNameObject[currentLang] !== undefined && nestedNameObject[currentLang] !== null && String(nestedNameObject[currentLang]).trim() !== '') {
        return String(nestedNameObject[currentLang]);
    }
    if (nestedNameObject[fallbackLang] !== undefined && nestedNameObject[fallbackLang] !== null && String(nestedNameObject[fallbackLang]).trim() !== '') {
        return String(nestedNameObject[fallbackLang]);
    }
  }

  return defaultValue;
};
