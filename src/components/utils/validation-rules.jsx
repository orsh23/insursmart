import { EMAIL_REGEX, PHONE_REGEX_ILS, URL_REGEX, NUMERIC_REGEX, ISRAELI_ID_REGEX } from '@/components/constants/validation-regex';
import { parseISO, isValid, isFuture, isPast } from 'date-fns';

/**
 * Checks if a value is considered "present" (not null, undefined, or empty string after trim).
 * @param {*} value - The value to check.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isRequired = (value, fieldLabel, t) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return t('validation.required', { field: fieldLabel, defaultValue: `${fieldLabel} is required.` });
  }
  return null;
};

/**
 * Validates an email format.
 * @param {string} value - The email string.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isEmail = (value, fieldLabel, t) => {
  if (value && !EMAIL_REGEX.test(String(value))) {
    return t('validation.invalidEmail', { field: fieldLabel, defaultValue: `Invalid ${fieldLabel} format.` });
  }
  return null;
};

/**
 * Validates minimum length.
 * @param {string} value - The string value.
 * @param {number} min - The minimum length.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const minLength = (value, min, fieldLabel, t) => {
  if (String(value).length < min) {
    return t('validation.minLength', { field: fieldLabel, count: min, defaultValue: `${fieldLabel} must be at least ${min} characters.` });
  }
  return null;
};

/**
 * Validates maximum length.
 * @param {string} value - The string value.
 * @param {number} max - The maximum length.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const maxLength = (value, max, fieldLabel, t) => {
  if (String(value).length > max) {
    return t('validation.maxLength', { field: fieldLabel, count: max, defaultValue: `${fieldLabel} must be no more than ${max} characters.` });
  }
  return null;
};

/**
 * Validates if a value is a number.
 * @param {*} value - The value.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isNumber = (value, fieldLabel, t) => {
  if (value && isNaN(Number(value))) {
    return t('validation.isNumber', { field: fieldLabel, defaultValue: `${fieldLabel} must be a number.` });
  }
  return null;
};

/**
 * Validates against a specific regex pattern.
 * @param {string} value - The string value.
 * @param {RegExp} regex - The regular expression to test against.
 * @param {string} messageKey - The i18n key for the error message.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @param {string} [defaultMessage] - A default message if the key is not found.
 * @returns {string|null} Error message string or null if valid.
 */
export const matchesRegex = (value, regex, messageKey, fieldLabel, t, defaultMessage) => {
  if (value && !regex.test(String(value))) {
    const fallback = defaultMessage || `Invalid ${fieldLabel} format.`;
    return t(messageKey, { field: fieldLabel, defaultValue: fallback });
  }
  return null;
};

/**
 * Validates ILS phone number format.
 */
export const isILSPhoneNumber = (value, fieldLabel, t) => 
  matchesRegex(value, PHONE_REGEX_ILS, 'validation.invalidILSPhone', fieldLabel, t, `${fieldLabel} must be a valid Israeli phone number.`);

/**
 * Validates URL format.
 */
export const isURL = (value, fieldLabel, t) =>
  matchesRegex(value, URL_REGEX, 'validation.invalidURL', fieldLabel, t, `${fieldLabel} must be a valid URL.`);

/**
 * Validates if value is numeric.
 */
export const isNumeric = (value, fieldLabel, t) =>
  matchesRegex(value, NUMERIC_REGEX, 'validation.isNumeric', fieldLabel, t, `${fieldLabel} must contain only numbers.`);
  
/**
 * Validates Israeli ID format (9 digits).
 */
export const isIsraeliID = (value, fieldLabel, t) =>
  matchesRegex(value, ISRAELI_ID_REGEX, 'validation.invalidIsraeliID', fieldLabel, t, `${fieldLabel} must be a 9-digit Israeli ID.`);


/**
 * Validates if a string is a valid ISO date.
 * @param {string} value - The date string.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isValidDateString = (value, fieldLabel, t) => {
  if (value && !isValid(parseISO(String(value)))) {
    return t('validation.invalidDate', { field: fieldLabel, defaultValue: `Invalid ${fieldLabel}.` });
  }
  return null;
};

/**
 * Validates if a date is in the future.
 * @param {string} value - The date string (ISO format).
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isFutureDate = (value, fieldLabel, t) => {
  const dateParseError = isValidDateString(value, fieldLabel, t);
  if (dateParseError) return dateParseError;
  if (value && !isFuture(parseISO(String(value)))) {
    return t('validation.isFutureDate', { field: fieldLabel, defaultValue: `${fieldLabel} must be in the future.` });
  }
  return null;
};

/**
 * Validates if a date is in the past.
 * @param {string} value - The date string (ISO format).
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isPastDate = (value, fieldLabel, t) => {
  const dateParseError = isValidDateString(value, fieldLabel, t);
  if (dateParseError) return dateParseError;
  if (value && !isPast(parseISO(String(value)))) {
    return t('validation.isPastDate', { field: fieldLabel, defaultValue: `${fieldLabel} must be in the past.` });
  }
  return null;
};

/**
 * Validates that a value is one of the allowed enum values.
 * @param {*} value - The value to check.
 * @param {Array<string|number>} allowedValues - Array of allowed values.
 * @param {string} fieldLabel - The display name of the field.
 * @param {function} t - The translation function.
 * @returns {string|null} Error message string or null if valid.
 */
export const isInEnum = (value, allowedValues, fieldLabel, t) => {
  if (value && !allowedValues.includes(value)) {
    return t('validation.invalidEnumValue', { field: fieldLabel, values: allowedValues.join(', '), defaultValue: `${fieldLabel} has an invalid value.` });
  }
  return null;
};

// Add more specific rules like isPositiveNumber, isInteger, dateIsAfter(otherField), etc.