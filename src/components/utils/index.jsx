// Unified utilities index - consolidating all utility functions
import { format, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

/**
 * Combines class names without external dependencies.
 * Consolidation of cn functions from multiple files.
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        const innerClasses = cn(...input);
        if (innerClasses) {
          classes.push(innerClasses);
        }
      } else {
        for (const key in input) {
          if (input.hasOwnProperty(key) && input[key]) {
            classes.push(key);
          }
        }
      }
    }
  }
  
  return classes.filter(Boolean).join(' ');
}

/**
 * Currency formatting - unified implementation
 */
export function formatCurrency(amount, currency = 'ILS', locale = 'en-US') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    return `${amount} ${currency}`;
  }
}

/**
 * String utilities - consolidated from multiple files
 */
export function truncateString(str, maxLength = 50, suffix = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

export function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Date utilities
 */
export function formatDate(dateString, formatStr = 'PP', language = 'en') {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid Date';
    
    const locale = language === 'he' ? he : enUS;
    return format(date, formatStr, { locale });
  } catch (error) {
    console.warn('Date formatting failed:', error);
    return 'Invalid Date';
  }
}

/**
 * Number utilities
 */
export function formatNumber(num, decimals = 0, locale = 'en-US') {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Validation utilities
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Array utilities
 */
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
}

export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
}

/**
 * Form utilities
 */
export function createFormOptions(items, labelKey = 'name', valueKey = 'id', t = null, language = 'en') {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    let label = item[labelKey];
    
    // Handle multilingual labels
    if (typeof label === 'object' && label !== null) {
      label = label[language] || label.en || item.id;
    }
    
    return {
      value: item[valueKey],
      label: t ? t(label, { defaultValue: label }) : label
    };
  });
}

/**
 * URL utilities
 */
export function createPageUrl(pageName, params = {}) {
  const baseUrl = `/${pageName}`;
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Storage utilities
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
    return defaultValue;
  }
}

export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Error writing to localStorage:', error);
    return false;
  }
}

export default {
  cn,
  formatCurrency,
  truncateString,
  capitalize,
  slugify,
  formatDate,
  formatNumber,
  isValidEmail,
  isValidPhone,
  groupBy,
  sortBy,
  createFormOptions,
  createPageUrl,
  getStorageItem,
  setStorageItem
};