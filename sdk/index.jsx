
/**
 * SDK Main Entry Point
 * Centralized access to all SDK functionality
 */

// Core SDK utilities
export {
  getEntitySchema,
  createEntity,
  updateEntity,
  deleteEntity,
  listEntities,
  filterEntities,
  bulkCreateEntities,
  validateEntityData
} from '../utils/sdk';

// API utilities
export {
  handleApiError,
  safeEntityCall,
  retryWithBackoff,
  createApiCache,
  isCacheValid,
  updateCache,
  setCacheLoading
} from '../utils/api-utils';

// Form utilities
export {
  STATUS_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  LEGAL_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  TASK_STATUS_OPTIONS,
  GENDER_OPTIONS,
  ID_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  MEDICAL_SPECIALTIES,
  CODE_SYSTEM_OPTIONS,
  UNIT_OF_MEASURE_OPTIONS,
  createOptions,
  getOptionLabel
} from '../utils/formOptions';

// General utilities
export {
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
  setStorageItem,
  removeStorageItem
} from '../utils';

/**
 * Initialize SDK with default configuration
 */
export function initializeSDK(config = {}) {
  const defaultConfig = {
    apiRetries: 3,
    cacheExpiration: 5 * 60 * 1000, // 5 minutes
    defaultLanguage: 'en',
    ...config
  };

  // Store configuration globally if needed
  if (typeof window !== 'undefined') {
    window.SDKConfig = defaultConfig;
  }

  return defaultConfig;
}

/**
 * Get current SDK configuration
 */
export function getSDKConfig() {
  if (typeof window !== 'undefined' && window.SDKConfig) {
    return window.SDKConfig;
  }
  
  return {
    apiRetries: 3,
    cacheExpiration: 5 * 60 * 1000,
    defaultLanguage: 'en'
  };
}
