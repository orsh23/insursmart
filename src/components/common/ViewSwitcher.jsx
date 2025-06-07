import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, Table, Kanban } from 'lucide-react';

export default function ViewSwitcher({
  currentView = 'card',
  onViewChange,
  availableViews = ['card', 'table'],
  entityName = 'items',
  t = (key, options) => options?.defaultValue || key,
  isRTL = false,
  className = ''
}) {
  const viewConfig = {
    card: {
      icon: Grid3X3,
      label: t('viewSwitcher.cardView', { defaultValue: 'Card View' })
    },
    table: {
      icon: Table,
      label: t('viewSwitcher.tableView', { defaultValue: 'Table View' })
    },
    kanban: {
      icon: Kanban,
      label: t('viewSwitcher.kanbanView', { defaultValue: 'Kanban View' })
    }
  };

  const handleViewChange = (view) => {
    if (onViewChange && typeof onViewChange === 'function') {
      onViewChange(view);
    }
  };

  return (
    <div className={`flex items-center gap-1 border rounded-md p-1 bg-white dark:bg-gray-800 ${className}`}>
      {availableViews.map(view => {
        const config = viewConfig[view];
        if (!config) return null;
        
        const Icon = config.icon;
        const isActive = currentView === view;
        
        return (
          <Button
            key={view}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange(view)}
            className={`px-3 py-2 ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`}
            title={config.label}
          >
            <Icon className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            <span className="hidden sm:inline">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}