import { toast } from '@/components/ui/use-toast';

/**
 * Helper for form error validation
 * @param {Object} errors Error object
 * @param {string} field Field name to check
 * @returns {string|null} Error message or null
 */
export function getFormError(errors, field) {
  if (!errors) return null;
  return errors[field] || null;
}

/**
 * Format price values for display
 * @param {number} price Price value 
 * @param {string} currency Currency code (default: ILS)
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = 'ILS') {
  if (typeof price !== 'number' || isNaN(price)) return '';
  
  const currencySymbols = {
    ILS: '₪',
    USD: '$',
    EUR: '€'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol} ${price.toLocaleString()}`;
}

/**
 * Parse form string values to appropriate data types
 * @param {Object} formData Raw form data
 * @param {Object} typeMap Map of field names to expected types
 * @returns {Object} Parsed form data
 */
export function parseFormValues(formData, typeMap = {}) {
  const parsed = { ...formData };
  
  Object.entries(typeMap).forEach(([field, type]) => {
    if (Object.prototype.hasOwnProperty.call(parsed, field)) {
      const value = parsed[field];
      
      if (type === 'number') {
        parsed[field] = value === '' || value === null || value === undefined ? null : Number(value);
      } else if (type === 'boolean') {
        parsed[field] = Boolean(value);
      } else if (type === 'array' && !Array.isArray(value)) {
        parsed[field] = value ? [value] : [];
      }
    }
  });
  
  return parsed;
}

/**
 * Returns only the fields that have changed compared to initialData
 * @param {Object} formData Current form data
 * @param {Object} initialData Initial form data
 * @returns {Object} Changed fields only
 */
export function getChangedFields(formData, initialData) {
  const changes = {};
  
  Object.keys(formData).forEach(key => {
    // Skip if the key doesn't exist in initialData
    if (!Object.prototype.hasOwnProperty.call(initialData, key)) {
      changes[key] = formData[key];
      return;
    }
    
    const initialValue = initialData[key];
    const currentValue = formData[key];
    
    // Array comparison
    if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
      if (JSON.stringify(initialValue) !== JSON.stringify(currentValue)) {
        changes[key] = currentValue;
      }
      return;
    }
    
    // Object comparison
    if (
      typeof initialValue === 'object' && initialValue !== null &&
      typeof currentValue === 'object' && currentValue !== null
    ) {
      if (JSON.stringify(initialValue) !== JSON.stringify(currentValue)) {
        changes[key] = currentValue;
      }
      return;
    }
    
    // Simple value comparison
    if (initialValue !== currentValue) {
      changes[key] = currentValue;
    }
  });
  
  return changes;
}

/**
 * Helper function to handle form submission with API calls and notifications
 * @param {Function} apiCall API function to call
 * @param {Object} data Data to send
 * @param {Object} options Options { successMessage, errorMessage, onSuccess }
 * @returns {Promise<boolean>} Success or failure
 */
export async function handleFormSubmit(apiCall, data, options = {}) {
  try {
    await apiCall(data);
    
    if (options.successMessage) {
      toast({
        title: options.successMessage,
        description: undefined,
      });
    }
    
    if (options.onSuccess) {
      options.onSuccess(data);
    }
    
    return true;
  } catch (error) {
    console.error('Form submission error:', error);
    
    toast({
      variant: "destructive",
      title: options.errorMessage || "Error occurred",
      description: error.message,
    });
    
    return false;
  }
}

/**
 * Validates a form field based on common validation rules
 * @param {*} value Field value
 * @param {Object} rules Validation rules { required, email, minLength, maxLength }
 * @returns {string|null} Error message or null if valid
 */
export function validateField(value, rules, fieldName) {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }
  
  if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${fieldName} must be a valid email address`;
  }
  
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }
  
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return `${fieldName} must be at most ${rules.maxLength} characters`;
  }
  
  if (rules.min && typeof value === 'number' && value < rules.min) {
    return `${fieldName} must be at least ${rules.min}`;
  }
  
  if (rules.max && typeof value === 'number' && value > rules.max) {
    return `${fieldName} must be at most ${rules.max}`;
  }
  
  return null;
}