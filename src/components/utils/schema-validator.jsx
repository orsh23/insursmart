import * as rules from './validation-rules'; // Import all rules

/**
 * Gets a value from a nested object using a dot-notation path.
 * @param {object} obj - The object to traverse.
 * @param {string} path - The dot-notation path (e.g., "contact.email").
 * @returns {*} The value at the path, or undefined if not found.
 */
const getNestedValue = (obj, path) => {
  if (!path || typeof path !== 'string') return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Sets a value in a nested errors object using a dot-notation path.
 * @param {object} obj - The errors object.
 * @param {string} path - The dot-notation path.
 * @param {*} value - The error message to set.
 */
const setNestedError = (obj, path, value) => {
  const keys = path.split('.');
  let current = obj;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
  });
};


/**
 * Validates data against a schema.
 *
 * @param {object} data - The data object to validate.
 * @param {object} schema - The validation schema.
 *   Schema structure:
 *   {
 *     fieldNameOrPath: {
 *       label: 'Field Display Name' | (t) => 'Translated Name', // For error messages
 *       rules: [
 *         { type: 'required' }, // Maps to isRequired rule function
 *         { type: 'email', messageKey: 'custom.emailError' }, // Custom i18n message key
 *         { type: 'minLength', value: 5 },
 *         { type: 'maxLength', value: 10, message: (label, val) => `${label} too long by ${val}!`}, // Custom message function
 *         { type: 'matchesRegex', value: SOME_REGEX, messageKey: 'validation.customRegexFail' },
 *         { type: 'custom', validate: (value, data, fieldLabel, t) => value === 'valid' ? null : 'Error' }, // Custom validation function
 *         { type: 'dependent', dependsOn: 'otherField', validate: (value, otherFieldValue, data, fieldLabel, t) => ... } // For cross-field validation
 *       ],
 *       when: (formData) => formData.someField === 'someValue', // Conditional validation for the whole field
 *       // For nested objects:
 *       // 'contact.email': { ... }
 *       // For arrays of objects (not fully implemented here, would need more complex iteration):
 *       // 'items[]': { schema: itemSchema }
 *     }
 *   }
 * @param {object} options - Options object containing:
 * @param {function} options.t - The i18n translation function.
 * @param {string} [options.language] - Current language, if needed by rules.
 * @returns {object} An errors object. Empty if no errors.
 *                   Format: { fieldNameOrPath: 'Error message', 'nested.field': 'Error message' }
 */
export const validateAgainstSchema = (data, schema, { t, language }) => {
  const errors = {};

  for (const fieldPath in schema) {
    const fieldSchema = schema[fieldPath];

    // Conditional validation for the entire field
    if (fieldSchema.when && typeof fieldSchema.when === 'function' && !fieldSchema.when(data)) {
      continue; // Skip validation for this field
    }

    const value = getNestedValue(data, fieldPath);
    const fieldLabel = typeof fieldSchema.label === 'function' ? fieldSchema.label(t) : fieldSchema.label || fieldPath;

    if (fieldSchema.rules && Array.isArray(fieldSchema.rules)) {
      for (const ruleConfig of fieldSchema.rules) {
        let errorMessage = null;
        const ruleFunction = rules[ruleConfig.type]; // e.g., rules['required'] -> isRequired

        if (ruleConfig.type === 'custom' && typeof ruleConfig.validate === 'function') {
          errorMessage = ruleConfig.validate(value, data, fieldLabel, t);
        } else if (ruleConfig.type === 'dependent' && typeof ruleConfig.validate === 'function') {
          const dependentValue = getNestedValue(data, ruleConfig.dependsOn);
          errorMessage = ruleConfig.validate(value, dependentValue, data, fieldLabel, t);
        } else if (ruleFunction) {
          // Pass value, rule argument (e.g., minLength value), fieldLabel, t
          errorMessage = ruleFunction(value, ruleConfig.value, fieldLabel, t);
           // For rules like matchesRegex that take more args
           if (ruleConfig.type === 'matchesRegex') {
             errorMessage = ruleFunction(value, ruleConfig.value, ruleConfig.messageKey || `validation.invalidFormat`, fieldLabel, t, ruleConfig.defaultMessage);
           } else if (ruleConfig.type === 'isInEnum') {
             errorMessage = ruleFunction(value, ruleConfig.value, fieldLabel, t);
           }
           // Add other specific rule argument handling here if needed
        } else {
          console.warn(`Unknown validation rule type: ${ruleConfig.type} for field ${fieldPath}`);
          continue;
        }
        
        // Allow rule to provide a custom message or key
        if (errorMessage) {
            if (typeof ruleConfig.message === 'function') {
                setNestedError(errors, fieldPath, ruleConfig.message(fieldLabel, value, ruleConfig.value));
            } else if (ruleConfig.messageKey) {
                setNestedError(errors, fieldPath, t(ruleConfig.messageKey, {field: fieldLabel, value: ruleConfig.value, defaultValue: errorMessage}));
            } else {
                 setNestedError(errors, fieldPath, errorMessage);
            }
          break; // Stop on first error for this field
        }
      }
    }
  }
  return errors;
};