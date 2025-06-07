// utils/csvExport.js

/**
 * Converts an array of objects to a CSV string
 * @param {Array<Object>} data - Array of flat objects
 * @returns {string} - CSV formatted string
 */
export function convertToCSV(data) {
  if (!data || !data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers download of CSV data as a file
 * @param {string} csv - CSV string
 * @param {string} filename - File name
 */
export function downloadCSV(csv, filename = 'export.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}