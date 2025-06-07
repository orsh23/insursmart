// Toast message templates for consistent messaging across the app

/**
 * Success message templates
 */
export const messages = {
  success: {
    create: (entity) => ({
      title: `${entity} created successfully`,
      variant: 'success'
    }),
    update: (entity) => ({
      title: `${entity} updated successfully`,
      variant: 'success'
    }),
    delete: (entity) => ({
      title: `${entity} deleted successfully`,
      variant: 'success'
    }),
    import: (entity) => ({
      title: `${entity} imported successfully`,
      variant: 'success'
    })
  },
  error: {
    create: (entity, error) => ({
      title: `Failed to create ${entity}`,
      description: error?.message || 'An unexpected error occurred',
      variant: 'destructive'
    }),
    update: (entity, error) => ({
      title: `Failed to update ${entity}`,
      description: error?.message || 'An unexpected error occurred',
      variant: 'destructive'
    }),
    delete: (entity, error) => ({
      title: `Failed to delete ${entity}`,
      description: error?.message || 'An unexpected error occurred',
      variant: 'destructive'
    }),
    import: (entity, error) => ({
      title: `Failed to import ${entity}`,
      description: error?.message || 'An unexpected error occurred',
      variant: 'destructive'
    }),
    load: (entity, error) => ({
      title: `Failed to load ${entity}`,
      description: error?.message || 'An unexpected error occurred',
      variant: 'destructive'
    })
  }
};

/**
 * Get entity name with count support (singular/plural)
 * @param {Function} t Translation function
 * @param {string} entityKey Entity key to translate
 * @param {number} count Count for plural form
 * @returns {string} Translated entity name
 */
export function getEntityName(t, entityKey, count = 1) {
  const translationKey = count === 1 
    ? `entities.${entityKey}` 
    : `entities.${entityKey}Plural`;
  
  return t(translationKey, { defaultValue: entityKey });
}