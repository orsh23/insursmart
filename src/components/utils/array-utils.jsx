/**
 * Check if array is empty or null
 * @param {array} arr - Array to check
 * @returns {boolean} - Whether array is empty
 */
export const isEmptyArray = (arr) => {
  return !arr || !Array.isArray(arr) || arr.length === 0;
};

/**
 * Get unique values from array
 * @param {array} arr - Array to process
 * @param {string|function} key - Key to use for uniqueness (for objects) or comparison function
 * @returns {array} - Array with unique values
 */
export const uniqueArray = (arr, key = null) => {
  if (isEmptyArray(arr)) return [];
  
  if (!key) {
    return [...new Set(arr)];
  }
  
  if (typeof key === 'function') {
    const seen = new Set();
    return arr.filter(item => {
      const keyValue = key(item);
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }
  
  // For object arrays with string key
  const seen = new Set();
  return arr.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

/**
 * Chunk array into smaller arrays
 * @param {array} arr - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {array} - Array of chunks
 */
export const chunkArray = (arr, size) => {
  if (isEmptyArray(arr) || size <= 0) return [];
  
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Group array by key
 * @param {array} arr - Array to group
 * @param {string|function} key - Key to group by or grouping function
 * @returns {object} - Grouped object
 */
export const groupBy = (arr, key) => {
  if (isEmptyArray(arr)) return {};
  
  return arr.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

/**
 * Sort array by multiple keys
 * @param {array} arr - Array to sort
 * @param {array} keys - Array of sort configurations [{key: 'name', direction: 'asc'}]
 * @returns {array} - Sorted array
 */
export const sortByMultipleKeys = (arr, keys) => {
  if (isEmptyArray(arr) || isEmptyArray(keys)) return arr;
  
  return [...arr].sort((a, b) => {
    for (const { key, direction = 'asc' } of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Find item in array by key-value pair
 * @param {array} arr - Array to search
 * @param {string} key - Key to search by
 * @param {any} value - Value to match
 * @returns {any} - Found item or undefined
 */
export const findByKey = (arr, key, value) => {
  if (isEmptyArray(arr)) return undefined;
  return arr.find(item => item[key] === value);
};

/**
 * Remove item from array by key-value pair
 * @param {array} arr - Array to modify
 * @param {string} key - Key to search by
 * @param {any} value - Value to match
 * @returns {array} - New array without the item
 */
export const removeByKey = (arr, key, value) => {
  if (isEmptyArray(arr)) return [];
  return arr.filter(item => item[key] !== value);
};

/**
 * Move item in array from one index to another
 * @param {array} arr - Array to modify
 * @param {number} fromIndex - Source index
 * @param {number} toIndex - Target index
 * @returns {array} - New array with item moved
 */
export const moveArrayItem = (arr, fromIndex, toIndex) => {
  if (isEmptyArray(arr) || fromIndex === toIndex) return arr;
  
  const newArr = [...arr];
  const item = newArr.splice(fromIndex, 1)[0];
  newArr.splice(toIndex, 0, item);
  return newArr;
};