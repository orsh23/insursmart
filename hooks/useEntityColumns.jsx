import React from 'react';
import { useTranslation } from '../utils/i18n';
import { cn } from '../utils/cn'; // Fixed import path
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDate } from '../utils/date-utils';
import { Edit, Trash, Eye } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

/**
 * Hook to get standardized columns configuration for tables based on entity type
 * @param {string} entityType - Type of entity (doctor, provider, material, etc.)
 * @param {Object} options - Configuration options
 * @returns {Array} Columns configuration for DataTable
 */
export function useEntityColumns(entityType, options = {}) {
  const { t } = useTranslation();
  const {
    onEdit,
    onDelete,
    onView,
    includeSelection = false,
    includeActions = true,
    additionalColumns = [] // Added to support custom columns per entity type
  } = options;

  // Common column definitions
  const commonColumns = {
    // Selection column
    selection: includeSelection ? {
      id: 'select',
      header: (headerProps) => {
        const { table } = headerProps || {};
        if (!table) return null;

        return (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected && table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected && table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected && table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('common.selectAll')}
          />
        );
      },
      cell: (cellProps) => {
        const { row } = cellProps || {};
        if (!row) return null;

        return (
          <Checkbox
            checked={row.getIsSelected && row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected && row.toggleSelected(!!value)}
            aria-label={t('common.selectRow', { rowNum: row.index + 1 })}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    } : null,

    // Status badge for entities with status
    status: {
      accessorKey: 'status',
      header: () => t('common.status'),
      cell: ({ row }) => {
        // FIX: Use row.original instead of row.getValue
        const data = row.original || {};
        const statusValue = data.status;
        if (!statusValue) return null;

        let colorClass;
        // Simplified status coloring, can be expanded
        switch (String(statusValue).toLowerCase()) {
          case 'active':
            colorClass = 'bg-green-100 text-green-800';
            break;
          case 'inactive':
            colorClass = 'bg-gray-100 text-gray-800';
            break;
          case 'pending':
          case 'in_progress':
          case 'in_review':
            colorClass = 'bg-blue-100 text-blue-800';
            break;
          case 'expired':
          case 'rejected':
          case 'terminated':
            colorClass = 'bg-red-100 text-red-800';
            break;
          case 'draft':
            colorClass = 'bg-yellow-100 text-yellow-800';
            break;
          default:
            colorClass = 'bg-slate-100 text-slate-800';
        }

        return (
          <Badge className={cn(colorClass)}>
            {t(`statusOptions.${statusValue}`) || statusValue}
          </Badge>
        );
      },
    },

    // Created/Updated date formatter
    created: {
      accessorKey: 'created_date',
      header: () => t('common.created'),
      cell: ({ row }) => {
        // FIX: Use row.original instead of row.getValue
        const data = row.original || {};
        return formatDate(data.created_date);
      },
    },

    // Updated date formatter
    updated: {
      accessorKey: 'updated_date',
      header: () => t('common.updated'),
      cell: ({ row }) => {
        // FIX: Use row.original instead of row.getValue
        const data = row.original || {};
        return formatDate(data.updated_date);
      },
    },

    // Actions column
    actions: includeActions ? {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        if (!item) return null;

        return (
          <div className="flex justify-end gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onView(item); }}
                aria-label={t('common.view')}
                title={t('common.view')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                aria-label={t('common.edit')}
                title={t('common.edit')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                aria-label={t('common.delete')}
                title={t('common.delete')}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    } : null,
  };

  // Remove null columns (like 'selection' if includeSelection is false)
  const filteredCommonColumns = Object.values(commonColumns).filter(Boolean);

  let entitySpecificColumns = [];
  
  const baseColumns = [];
  if (commonColumns.selection) baseColumns.push(commonColumns.selection);

  switch (entityType) {
    case 'doctor':
      baseColumns.push(
        { accessorKey: 'first_name_en', header: () => t('doctors.firstNameEn') },
        { accessorKey: 'last_name_en', header: () => t('doctors.lastNameEn') },
        { accessorKey: 'first_name_he', header: () => t('doctors.firstNameHe') },
        { accessorKey: 'last_name_he', header: () => t('doctors.lastNameHe') },
        { accessorKey: 'license_number', header: () => t('doctors.licenseNumber') },
        { accessorKey: 'specialty', header: () => t('doctors.specialty') },
        { accessorKey: 'phone', header: () => t('doctors.phone') },
        { accessorKey: 'email', header: () => t('doctors.email') },
        commonColumns.status,
        // Add more doctor-specific columns if needed
      );
      break;
    case 'provider':
      baseColumns.push(
        { 
          accessorKey: 'name.en', 
          header: () => t('providers.nameEn'), 
          cell: ({ row }) => row.original?.name?.en 
        },
        { 
          accessorKey: 'name.he', 
          header: () => t('providers.nameHe'), 
          cell: ({ row }) => row.original?.name?.he 
        },
        { accessorKey: 'provider_type', header: () => t('providers.type') },
        { 
          accessorKey: 'legal.identifier', 
          header: () => t('providers.legalIdentifier'),
          cell: ({ row }) => row.original?.legal?.identifier
        },
        commonColumns.status
      );
      break;
    case 'material':
        baseColumns.push(
            { accessorKey: 'name_en', header: () => t('materials.nameEn')},
            { accessorKey: 'name_he', header: () => t('materials.nameHe')},
            { accessorKey: 'unit_of_measure', header: () => t('materials.unitOfMeasure')},
            { accessorKey: 'base_price', header: () => t('materials.basePrice'), cell: ({row}) => `${row.original?.base_price || 0} ${row.original?.currency || ''}` },
            { accessorKey: 'is_active', header: () => t('materials.isActive'), cell: ({row}) => row.original?.is_active ? t('common.yes') : t('common.no')},
        );
        break;
    case 'task':
        baseColumns.push(
            { accessorKey: 'title', header: () => t('tasks.title')},
            { accessorKey: 'status', header: () => t('tasks.status'),
              cell: ({row}) => {
                const statusValue = row.original?.status;
                if (!statusValue) return '';
                
                let colorClass;
                switch (statusValue) {
                  case 'todo': 
                    colorClass = 'bg-gray-100 text-gray-800';
                    break;
                  case 'in_progress':
                    colorClass = 'bg-blue-100 text-blue-800';
                    break;
                  case 'done':
                    colorClass = 'bg-green-100 text-green-800';
                    break;
                  default:
                    colorClass = 'bg-slate-100 text-slate-800';
                }
                
                return (
                  <Badge className={cn(colorClass)}>
                    {t(`tasks.statusOptions.${statusValue}`) || statusValue}
                  </Badge>
                );
              }
            },
            { accessorKey: 'priority', header: () => t('tasks.priority'),
              cell: ({row}) => {
                const priorityValue = row.original?.priority;
                if (!priorityValue) return '';
                
                let colorClass;
                switch (priorityValue) {
                  case 'low': 
                    colorClass = 'bg-blue-100 text-blue-800';
                    break;
                  case 'medium':
                    colorClass = 'bg-yellow-100 text-yellow-800';
                    break;
                  case 'high':
                    colorClass = 'bg-red-100 text-red-800';
                    break;
                  default:
                    colorClass = 'bg-slate-100 text-slate-800';
                }
                
                return (
                  <Badge className={cn(colorClass)}>
                    {t(`tasks.priorityOptions.${priorityValue}`) || priorityValue}
                  </Badge>
                );
              }
            },
            { accessorKey: 'category', header: () => t('tasks.category'),
              cell: ({row}) => {
                const categoryValue = row.original?.category;
                return categoryValue || '';
              }
            },
            { accessorKey: 'due_date', header: () => t('tasks.dueDate'),
              cell: ({row}) => formatDate(row.original?.due_date)
            },
        );
        break;
    // Add cases for other entities (medical_code, contract, task, etc.)
    default:
      // Generic columns if no specific type, or a warning
      baseColumns.push({ accessorKey: 'id', header: 'ID' }); // Fallback
  }

  // Add any additional columns passed in options
  baseColumns.push(...additionalColumns);


  if (includeActions && (onEdit || onDelete || onView)) {
    baseColumns.push(commonColumns.actions);
  }

  return baseColumns.filter(Boolean); // Filter out nulls (e.g., if selection is false)
}