import { handleApiError, safeEntityCall, retryWithBackoff } from './api-utils';

/**
 * Centralized SDK utilities for entity operations
 */

// Entity schema cache
const schemaCache = new Map();

/**
 * Get entity schema with caching
 */
export async function getEntitySchema(EntityClass) {
  const entityName = EntityClass.name;
  
  if (schemaCache.has(entityName)) {
    return schemaCache.get(entityName);
  }
  
  try {
    const schema = await EntityClass.schema();
    schemaCache.set(entityName, schema);
    return schema;
  } catch (error) {
    console.warn(`Failed to get schema for ${entityName}:`, error);
    return null;
  }
}

/**
 * Standard entity operations with error handling
 */
export async function createEntity(EntityClass, data, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'create', data),
    `${context}-Create`
  );
}

export async function updateEntity(EntityClass, id, data, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'update', id, data),
    `${context}-Update`
  );
}

export async function deleteEntity(EntityClass, id, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'delete', id),
    `${context}-Delete`
  );
}

export async function listEntities(EntityClass, sortBy = '-updated_date', limit = null, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'list', sortBy, limit),
    `${context}-List`
  );
}

export async function filterEntities(EntityClass, filters, sortBy = '-updated_date', limit = null, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'filter', filters, sortBy, limit),
    `${context}-Filter`
  );
}

/**
 * Bulk operations
 */
export async function bulkCreateEntities(EntityClass, dataArray, context = 'Unknown') {
  return retryWithBackoff(
    () => safeEntityCall(EntityClass, 'bulkCreate', dataArray),
    `${context}-BulkCreate`
  );
}

/**
 * Entity validation helpers
 */
export function validateEntityData(schema, data) {
  if (!schema || !schema.properties) {
    return { isValid: true, errors: [] };
  }

  const errors = [];
  const required = schema.required || [];

  // Check required fields
  required.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  // Type validation
  Object.entries(schema.properties).forEach(([field, fieldSchema]) => {
    if (data[field] !== undefined && data[field] !== null) {
      const value = data[field];
      
      switch (fieldSchema.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string`);
          } else if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(`${field} must be ${fieldSchema.maxLength} characters or less`);
          } else if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(`${field} must be at least ${fieldSchema.minLength} characters`);
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${field} must be a valid number`);
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${field} must be true or false`);
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${field} must be an array`);
          }
          break;
      }

      // Enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`${field} must be one of: ${fieldSchema.enum.join(', ')}`);
      }

      // Format validation
      if (fieldSchema.format === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Re-export utilities for backwards compatibility
export { handleApiError, safeEntityCall, retryWithBackoff };