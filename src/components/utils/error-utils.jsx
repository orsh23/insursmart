
/**
 * Formats API error responses for display
 * @param {Error} error Error object from API call
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error) {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle standard Error objects with message property
  if (error.message) {
    return error.message;
  }

  // Handle API error response objects (e.g., from Axios)
  if (error.response) {
    const { data, status } = error.response;

    if (data && typeof data === 'object') {
      // Handle structured API error responses
      if (data.message) {
        return data.message;
      }
      if (data.error) {
        // If data.error is an object, fall back to generic API Error
        return typeof data.error === 'string' ? data.error : 'API Error';
      }

      // Handle validation errors (e.g., Laravel, custom formats)
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map(e => e.message || String(e)).join(', ');
      }
    }

    // Return generic message based on HTTP status code
    switch (status) {
      case 401:
        return 'Unauthorized: Please log in again';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 500:
        return 'A server error occurred. Please try again later';
      default:
        // Fallback for other status codes or non-structured data
        return `Error ${status}: ${data?.message || data || 'Unknown error'}`;
    }
  }

  // Handle network errors (request made but no response received)
  if (error.request && !error.response) {
    return 'Network error: Please check your connection';
  }

  // Fallback for any other unhandled error types
  return 'An error occurred';
}

/**
 * Maps API error responses to form field errors
 * @param {Error} error Error from API
 * @returns {Object} Field errors by field name (e.g., { fieldName: 'Error message' })
 */
export function mapApiErrorsToFormFields(error) {
  const fieldErrors = {};

  // Ensure there's a response with data to process
  if (!error || !error.response || !error.response.data) {
    return fieldErrors;
  }

  const { data } = error.response;

  // Standard format: `data.errors` as an array of error objects with 'field' and 'message'
  if (data.errors && Array.isArray(data.errors)) {
    data.errors.forEach(err => {
      if (err.field) {
        fieldErrors[err.field] = err.message || 'Invalid value';
      }
    });
    return fieldErrors;
  }

  // Alternative format: `data.validation_errors` as an object mapping field names to messages
  if (data.validation_errors && typeof data.validation_errors === 'object') {
    return data.validation_errors;
  }

  // Another common format: Field errors directly in the top-level `data` object,
  // excluding general message/error/status properties.
  if (typeof data === 'object') {
    Object.keys(data).forEach(key => {
      // Exclude common non-field properties that might be in the data object
      if (key !== 'message' && key !== 'error' && key !== 'status' && key !== 'statusCode') {
        // Assume the value associated with the key is the error message
        fieldErrors[key] = data[key];
      }
    });
  }

  return fieldErrors;
}

/**
 * Logs errors with a consistent format to the console, including relevant error details.
 * @param {string} context A descriptive string indicating where the error occurred (e.g., "Login component", "User service").
 * @param {Error} error The error object to log. Can be an Error instance, AxiosError, etc.
 * @param {Object} [data={}] Additional arbitrary data to include in the log.
 */
export function logError(context, error, data = {}) {
  console.error(`Error in ${context}:`, {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    // Extract relevant parts of an Axios error response for debugging
    response_data: error?.response?.data,
    response_status: error?.response?.status,
    response_headers: error?.response?.headers,
    request_config: error?.config, // Axios request config
    // Include any additional provided data
    ...data
  });
}

/**
 * Provides user-friendly error messages for common API/application issues based on a simple error code or message.
 * This can be used to display more readable messages to the end-user.
 * @param {string} errorCode A specific error code (e.g., 'network_error', '404', 'validation_failed')
 *                           or a general error message string.
 * @returns {string} A user-friendly message corresponding to the error code, or a generic fallback message.
 */
export function getUserFriendlyError(errorCode) {
  const errorMap = {
    // Network related errors
    'network_error': 'Unable to connect to the server. Please check your internet connection.',
    'ECONNABORTED': 'The request timed out. Please try again.', // Axios timeout code

    // HTTP Status code related messages (can also map directly to status numbers if desired)
    '400': 'Bad request. Please check your input.',
    '401': 'You need to log in to perform this action.',
    '403': 'You do not have permission to perform this action.',
    '404': 'The requested item could not be found.',
    '409': 'Conflict: The resource already exists or there was a data conflict.',
    '422': 'Validation failed. Please check the form for errors.', // Common for unprocessable entity
    '500': 'Something went wrong on our server. Please try again later.',
    '503': 'The server is temporarily unavailable. Please try again later.',

    // Application-specific or logical errors
    'validation_failed': 'Please check the form for errors.',
    'not_found': 'The requested item could not be found.',
    'unauthorized': 'You need to log in to perform this action.',
    'forbidden': 'You do not have permission to perform this action.',
    'server_error': 'Something went wrong on our server. Please try again later.',
    'timeout': 'The request timed out. Please try again.',
    'duplicate_entry': 'This entry already exists. Please provide unique information.',
    'invalid_credentials': 'The username or password you entered is incorrect.',
    'session_expired': 'Your session has expired. Please log in again.'
  };

  // Convert errorCode to string for consistent map lookup, if it's a number
  const key = String(errorCode).toLowerCase();

  // Return the mapped message or a generic fallback
  return errorMap[key] || 'An unexpected error occurred. Please try again.';
}
