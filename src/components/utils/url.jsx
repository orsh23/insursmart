// Basic utility functions for URLs

/**
 * Creates a URL for a given page name and parameters.
 * @param {string} pageName - The name of the page (e.g., 'dashboard', 'tasks').
 * @param {object} [params={}] - Optional query parameters as key-value pairs.
 * @returns {string} The constructed URL.
 */
export const createPageUrl = (pageName, params = {}) => {
  if (!pageName || typeof pageName !== 'string') {
    console.error('createPageUrl: pageName must be a non-empty string.');
    return '#error-invalid-pageName';
  }
  
  let url = `/${pageName.toLowerCase().trim().replace(/^\//, '')}`; // Ensure no leading slash from input
  
  const queryParams = new URLSearchParams();
  if (params && typeof params === 'object') {
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, String(params[key]));
      }
    }
  }
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};