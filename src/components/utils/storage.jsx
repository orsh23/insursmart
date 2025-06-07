/**
 * Utility functions for browser localStorage operations
 */

/**
 * Load data from localStorage with error handling and type conversion
 * 
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found or on error
 * @param {Function} [transform] - Optional transform function for the parsed data
 * @returns {any} Parsed data or default value
 */
export const loadFromStorage = (key, defaultValue = null, transform = null) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;
    
    const parsedValue = JSON.parse(storedValue);
    return transform ? transform(parsedValue) : parsedValue;
  } catch (error) {
    console.warn(`Error loading data from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be JSON serialized)
 * @param {Function} [prepare] - Optional preparation function before serialization
 * @returns {boolean} Success status
 */
export const saveToStorage = (key, data, prepare = null) => {
  try {
    const preparedData = prepare ? prepare(data) : data;
    localStorage.setItem(key, JSON.stringify(preparedData));
    return true;
  } catch (error) {
    console.warn(`Error saving data to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove data from localStorage with error handling
 * 
 * @param {string} key - Storage key to remove
 * @returns {boolean} Success status
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Check if storage is available
 * 
 * @returns {boolean} True if localStorage is available
 */
export const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
};