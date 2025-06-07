
import { format, formatDistanceToNow, parseISO, isValid, formatDistance } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

/**
 * Get date-fns locale object based on language code
 * @param {string} languageCode - Language code ('en', 'he', etc.)
 * @returns {object} - date-fns locale object
 */
export const getLocaleObject = (languageCode) => {
  const locales = { en: enUS, he: he };
  return locales[languageCode?.toLowerCase()] || enUS;
};

/**
 * Format a date string or Date object
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: 'PPP')
 * @param {string} locale - Language code for locale
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, formatStr = 'PPP', locale = 'en') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatStr, { locale: getLocaleObject(locale) });
};

/**
 * Format a date with time
 * @param {string|Date} date - Date to format
 * @param {string} locale - Language code for locale
 * @returns {string} - Formatted date with time
 */
export const formatDateTime = (date, locale = 'en') => {
  return formatDate(date, 'PPp', locale);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @param {string} locale - Language code for locale
 * @param {boolean} addSuffix - Whether to add "ago" suffix
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date, locale = 'en', addSuffix = true) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  return formatDistanceToNow(dateObj, { 
    addSuffix, 
    locale: getLocaleObject(locale) 
  });
};

/**
 * Format distance between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {string} locale - Language code for locale
 * @returns {string} - Distance between dates
 */
export const formatDateDistance = (startDate, endDate, locale = 'en') => {
  if (!startDate || !endDate) return '';
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return '';
  
  return formatDistance(start, end, { locale: getLocaleObject(locale) });
};

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether the date is valid
 */
export const isValidDateString = (dateString) => {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isValid(date);
};

/**
 * Parse a date string safely
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
};
