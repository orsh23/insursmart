import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function StatusBadge({
  status,
  size = 'md',
  statusTypes = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'warning' },
    pending: { label: 'Pending', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    in_progress: { label: 'In Progress', color: 'info' },
    canceled: { label: 'Canceled', color: 'danger' },
    draft: { label: 'Draft', color: 'secondary' },
    published: { label: 'Published', color: 'success' },
    archived: { label: 'Archived', color: 'warning' }
  }
}) {
  const { t } = useLanguageHook();
  
  // If status is undefined/null or not in statusTypes, return nothing
  if (!status || !statusTypes[status]) return null;
  
  const { label, color } = statusTypes[status];
  
  // Translate the label if available
  const translatedLabel = t(`common.status.${status}`, { defaultValue: label });
  
  // Color classes based on the color prop
  const colorClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    primary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5'
  };
  
  const badgeClasses = `
    inline-flex items-center
    rounded-full
    border
    font-medium
    ${colorClasses[color] || colorClasses.secondary}
    ${sizeClasses[size] || sizeClasses.md}
  `;
  
  return (
    <span className={badgeClasses}>
      {translatedLabel}
    </span>
  );
}