
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { ActionTypes } from '@/components/configs/globalActionConfigs'; // Corrected import path
import { resolveIconForAction } from '@/components/configs/iconUtils';

export default function GlobalActionButton({
  actionsConfig = [],
  isSelectionModeActive, // boolean: is the parent page in a selection mode?
  selectedItemsCount = 0, // number: how many items are currently selected
  
  // Callbacks to be triggered by this button/menu
  onAddNew,       // () => void : For "Add New Item" type actions
  onImportData,   // () => void : For "Import Data"
  onExportData,   // () => void : For "Export Data"
  onInviteUser,   // () => void : For "Invite User"
  
  // Callbacks for actions that depend on selection
  onEditSelected,    // (selectedIds: string[] | number[]) => void
  onDeleteSelected,  // (selectedIds: string[] | number[]) => void
  onArchiveSelected, // (selectedIds: string[] | number[]) => void
  onDuplicateSelected, // (selectedIds: string[] | number[]) => void

  // Fallback generic handlers if specific ones above aren't used by actionsConfig
  onExecuteAction, // (actionType: string, selectedIds?: string[] | number[]) => void

  itemTypeForActions, // string: e.g., "Task", "User" - for dynamic labels
  t, // translation function
  isRTL, // boolean for layout direction
}) {
  const handleActionClick = (action) => {
    if (!action || !action.type) {
        console.warn("Action or action.type is undefined", action);
        return;
    }

    // Use specific handlers first if provided and action type matches
    if (action.action) { // If action has its own callback, prioritize it
        action.action();
        return;
    }

    // Fallback to generic handlers based on type
    switch (action.type) {
      case ActionTypes.ADD:
        if (onAddNew) onAddNew();
        else if (onExecuteAction) onExecuteAction(action.type);
        break;
      case ActionTypes.IMPORT:
        if (onImportData) onImportData();
        else if (onExecuteAction) onExecuteAction(action.type);
        break;
      case ActionTypes.EXPORT:
        if (onExportData) onExportData();
        else if (onExecuteAction) onExecuteAction(action.type);
        break;
      case ActionTypes.INVITE_USER:
        if (onInviteUser) onInviteUser();
        else if (onExecuteAction) onExecuteAction(action.type);
        break;
      case ActionTypes.EDIT:
        if (onEditSelected && selectedItemsCount > 0) onEditSelected(); // Assumes onEditSelected knows how to get IDs
        else if (onExecuteAction && selectedItemsCount > 0) onExecuteAction(action.type);
        break;
      case ActionTypes.DELETE:
        if (onDeleteSelected && selectedItemsCount > 0) onDeleteSelected();
        else if (onExecuteAction && selectedItemsCount > 0) onExecuteAction(action.type);
        break;
      case ActionTypes.ARCHIVE:
        if (onArchiveSelected && selectedItemsCount > 0) onArchiveSelected();
        else if (onExecuteAction && selectedItemsCount > 0) onExecuteAction(action.type);
        break;
      case ActionTypes.DUPLICATE:
        if (onDuplicateSelected && selectedItemsCount > 0) onDuplicateSelected();
        else if (onExecuteAction && selectedItemsCount > 0) onExecuteAction(action.type);
        break;
      default:
        if (onExecuteAction) {
          onExecuteAction(action.type);
        } else {
          console.warn(`No specific handler or onExecuteAction for type: ${action.type}`);
        }
        break;
    }
  };

  if (!Array.isArray(actionsConfig) || actionsConfig.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu dir={isRTL ? 'rtl' : 'ltr'}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {t('common.actions', { defaultValue: 'Actions' })}
            <ChevronDown className={`h-4 w-4 ${isRTL ? 'mr-1' : 'ml-1'}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {actionsConfig.map((action, index) => {
            if (!action || typeof action !== 'object') {
              console.warn('Malformed action in actionsConfig at index', index, action);
              return null;
            }
            
            if (action.isSeparator) {
              return <DropdownMenuSeparator key={`sep-${index}`} />;
            }

            // Resolve icon using the utility function, allowing action-specific overrides
            const IconComponent = action.icon || resolveIconForAction(action.type);
            const hasValidIcon = IconComponent && (typeof IconComponent === 'function' || typeof IconComponent === 'object'); // Lucide icons are objects/functions

            // Determine if the action should be disabled
            // An action can be intrinsically disabled (action.disabled)
            // Or disabled based on selection mode and item count (e.g., "Edit Selected" needs selection)
            let isDisabled = action.disabled || false;
            if (action.selectionModeOnly && (!isSelectionModeActive || selectedItemsCount === 0)) {
              isDisabled = true;
            }
            if (action.requiresSingleSelection && selectedItemsCount !== 1) {
                isDisabled = true;
            }
             if (action.requiresMultipleSelection && selectedItemsCount < 2) {
                isDisabled = true;
            }

            return (
              <DropdownMenuItem
                key={action.labelKey || action.defaultLabel || `action-${index}`}
                onClick={() => handleActionClick(action)}
                disabled={isDisabled}
                className="flex items-center text-sm"
              >
                {hasValidIcon ? (
                  <IconComponent className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-500`} />
                ) : (
                  <AlertCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-red-500`} /> // Fallback for missing/invalid icon
                )}
                <span>{t(action.labelKey, { defaultValue: action.defaultLabel || 'Unnamed Action' })}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
