// Content of components/hooks/useEntityColumns.js
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge'; 
import { Checkbox } from '@/components/ui/checkbox'; 
import { Button } from '@/components/ui/button'; 
import { ArrowUpDown } from 'lucide-react';
import { formatSafeDate, formatSafeDateDistance } from '@/components/utils/i18n-utils'; 
import { getLocalizedValue } from '@/components/utils/i18n-utils'; 

/**
 * A hook to generate columns for a DataTable based on entity schema and configuration.
 * @param {object} entityConfig - Configuration for the entity.
 *   - {string} idField - The name of the ID field (default: 'id').
 *   - {object} schema - The JSON schema of the entity.
 *   - {object} columnOverrides - Custom configurations for specific columns.
 *   - {Function} t - Translation function.
 *   - {string} language - Current language code.
 *   - {Function} onEdit - Handler for edit action.
 *   - {Function} onDelete - Handler for delete action.
 *   - {Function} onViewDetails - Handler for view details action.
 * @param {object} displayPreferences - User display preferences for columns.
 * @returns {Array} - Array of column definitions for DataTable.
 */
export function useEntityColumns({
  idField = 'id',
  schema,
  columnOverrides = {},
  t,
  language,
  onEdit,
  onDelete,
  onViewDetails,
  actions = ['edit', 'delete'], // Default actions
  enableSelection = false,
  onToggleSelection, // (itemId, isSelected) => void
  isSelected, // (itemId) => boolean
  customRenderers = {}, // { fieldName: (value, item, t, language) => JSX }
  columnOrder = [], // Optional array of field names to set column order
  hiddenColumns = [], // Optional array of field names to hide
  sortableFields = [], // Optional array of field names that are sortable
  onSortChange, // (field) => void
  currentSortConfig, // { field, direction }
}) {

  const defaultColumns = useMemo(() => {
    if (!schema || !schema.properties) return [];

    let properties = Object.entries(schema.properties);

    // Apply custom column order if provided
    if (Array.isArray(columnOrder) && columnOrder.length > 0) {
      properties.sort((a, b) => {
        const indexA = columnOrder.indexOf(a[0]);
        const indexB = columnOrder.indexOf(b[0]);
        if (indexA === -1 && indexB === -1) return 0; // neither in order, keep original
        if (indexA === -1) return 1; // a not in order, b is, so b comes first
        if (indexB === -1) return -1; // b not in order, a is, so a comes first
        return indexA - indexB;
      });
    }
    
    // Filter out hidden columns
    if(Array.isArray(hiddenColumns) && hiddenColumns.length > 0) {
        properties = properties.filter(([key]) => !hiddenColumns.includes(key));
    }


    const generatedColumns = properties.map(([key, propSchema]) => {
      const override = columnOverrides[key] || {};
      const header = override.header || propSchema.title || t(`fields.${key}`, { defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) });
      const isSortable = sortableFields.includes(key);

      return {
        accessorKey: key,
        header: isSortable && onSortChange ? (
            <Button variant="ghost" onClick={() => onSortChange(key)} className="px-1">
                {header}
                {currentSortConfig?.field === key && (
                    currentSortConfig.direction === 'asc' ? <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180" /> : <ArrowUpDown className="ml-2 h-3 w-3" />
                )}
                {currentSortConfig?.field !== key && <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />}
            </Button>
        ) : header,
        cell: ({ row }) => {
          const item = row.original;
          let value = item[key];

          if (customRenderers[key]) {
            return customRenderers[key](value, item, t, language);
          }
          
          // Bilingual object handling (e.g. name.en, name.he)
          if (typeof value === 'object' && value !== null && (value.hasOwnProperty('en') || value.hasOwnProperty('he'))) {
            value = getLocalizedValue(item, key, language);
          }


          if (propSchema.type === 'boolean') {
            return value ? <Badge variant="success">{t('common.yes', {defaultValue: 'Yes'})}</Badge> : <Badge variant="outline">{t('common.no', {defaultValue: 'No'})}</Badge>;
          }
          if (propSchema.format === 'date' || propSchema.format === 'date-time' || key.toLowerCase().includes('date') || key.toLowerCase().includes('_at')) {
            return formatSafeDate(value, language === 'he' ? 'he' : 'en-US', { dateStyle: 'medium' });
          }
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          if (propSchema.enum && Array.isArray(propSchema.enum)) {
             // Try to translate enum value
             return t(`enums.${key}.${value}`, {defaultValue: String(value ?? '') });
          }
          
          return String(value ?? t('common.notSet', {defaultValue: 'N/A'}));
        },
        enableSorting: isSortable,
        ...override, // Spread any other native react-table column options from override
      };
    });
    
    let actionCols = [];
    if (actions && actions.length > 0) {
        actionCols.push({
            id: 'actions',
            header: t('common.actions', { defaultValue: 'Actions' }),
            cell: ({ row }) => (
              <div className="flex space-x-1 rtl:space-x-reverse">
                {actions.includes('view') && onViewDetails && (
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(row.original)}>
                    {t('buttons.viewDetails', {defaultValue: 'View'})}
                  </Button>
                )}
                {actions.includes('edit') && onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
                    {t('buttons.edit', {defaultValue: 'Edit'})}
                  </Button>
                )}
                {actions.includes('delete') && onDelete && (
                  <Button variant="destructive" size="sm" onClick={() => onDelete(row.original[idField])}>
                     {t('buttons.delete', {defaultValue: 'Delete'})}
                  </Button>
                )}
              </div>
            ),
        });
    }

    if (enableSelection) {
        return [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label={t('bulkActions.selectAllOnPage', { defaultValue: "Select all on page"})}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => {
                            row.toggleSelected(!!value);
                            if (onToggleSelection) {
                                onToggleSelection(row.original[idField], !!value);
                            }
                        }}
                        aria-label={t('bulkActions.selectRow', {defaultValue: "Select row"})}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...generatedColumns,
            ...actionCols
        ];
    }


    return [...generatedColumns, ...actionCols];

  }, [schema, columnOverrides, t, language, onEdit, onDelete, onViewDetails, actions, idField, enableSelection, onToggleSelection, customRenderers, columnOrder, hiddenColumns, sortableFields, onSortChange, currentSortConfig]);

  return defaultColumns;
}