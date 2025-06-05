import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';

/**
 * Placeholder RowActionsDropdown component.
 * Implement actual actions as needed.
 */
export default function RowActionsDropdown({ item, onEdit, onDelete }) {
  const { t, isRTL } = useLanguageHook();

  if (!item) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t('common.actions.openMenu', { defaultValue: 'Open menu' })}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.edit', { defaultValue: 'Edit' })}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={() => onDelete(item.id || item)} className="text-red-600 hover:!text-red-600 dark:text-red-400 dark:hover:!text-red-400">
            <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.delete', { defaultValue: 'Delete' })}
          </DropdownMenuItem>
        )}
        {!onEdit && !onDelete && (
            <DropdownMenuItem disabled>
                {t('common.noActionsAvailable', {defaultValue: 'No actions'})}
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}