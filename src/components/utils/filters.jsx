export const textFilter = (item, searchTerm, fields) => {
  if (!searchTerm) return true;
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return fields.some(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], item);
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(normalizedSearch);
  });
};

export const dateFilter = (date, startDate, endDate) => {
  if (!date) return false;
  const itemDate = new Date(date);
  if (startDate && new Date(startDate) > itemDate) return false;
  if (endDate && new Date(endDate) < itemDate) return false;
  return true;
};

export const enumFilter = (value, filterValue, includeAll = true) => {
  if (!filterValue || (includeAll && filterValue === 'all')) return true;
  return value === filterValue;
};

export const multiEnumFilter = (values, filterValues, includeAll = true) => {
  if (!filterValues?.length || (includeAll && filterValues.includes('all'))) return true;
  return filterValues.some(filter => values?.includes(filter));
};

export const booleanFilter = (value, filterValue) => {
  if (filterValue === 'all') return true;
  return value === (filterValue === 'true');
};

export const numberRangeFilter = (value, min, max) => {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

export const arrayContainsFilter = (array, filterValue, includeAll = true) => {
  if (!filterValue || (includeAll && filterValue === 'all')) return true;
  if (!array || !Array.isArray(array)) return false;
  return array.includes(filterValue);
};