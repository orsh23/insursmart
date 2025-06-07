import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Plus } from 'lucide-react';
import GlobalActionDropdown from './GlobalActionDropdown';

/**
 * GlobalActionButton - Backwards compatible wrapper around GlobalActionDropdown
 * This component maintains the existing API while providing the new functionality
 */
export default function GlobalActionButton({
  actionsConfig = [],
  isSelectionModeActive = false,
  onCancelSelectionMode = null,
  selectedItemCount = 0,
  selectedItemsCount = 0, // Alternative prop name
  itemTypeForActions = 'item',
  entity = null, // New prop for entity-based config
  permissions = {}, // New prop for permissions
  currentUserRole = 'user', // New prop for role-based permissions
  
  t = (key, options) => options?.defaultValue || key,
  isRTL = false,
  
  // Legacy props for backward compatibility
  onAddNew = null,
  onImportData = null,
  onExportData = null,
  onEditSelected = null,
  onDeleteSelected = null,
  onExecuteAction = null,
  
  // New props
  onAdd = null,
  onEdit = null,
  onDelete = null,
  onDeleteItems = null,
  onImport = null,
  onExport = null,
  onInviteUsers = null,
  onResetPassword = null,
  onViewDetails = null,
  onSettings = null,
  
  // Debug props
  debugMode = false,
  showAllActionsInDev = false,
  
  // Styling props
  className = '',
  size = 'default',
  variant = 'outline',
}) {
  const effectiveSelectedCount = selectedItemCount || selectedItemsCount;
  
  // If entity is provided, use the new GlobalActionDropdown
  if (entity) {
    return (
      <GlobalActionDropdown
        entity={entity}
        permissions={permissions}
        isSelectionModeActive={isSelectionModeActive}
        selectedItemsCount={effectiveSelectedCount}
        t={t}
        isRTL={isRTL}
        showAllActionsInDev={showAllActionsInDev}
        currentUserRole={currentUserRole}
        debugMode={debugMode}
        className={className}
        size={size}
        variant={variant}
        
        // Map legacy handlers to new ones
        onAdd={onAdd || onAddNew}
        onEdit={onEdit || onEditSelected}
        onDelete={onDelete || onDeleteSelected || onDeleteItems}
        onImport={onImport || onImportData}
        onExport={onExport || onExportData}
        onInviteUsers={onInviteUsers}
        onResetPassword={onResetPassword}
        onViewDetails={onViewDetails}
        onSettings={onSettings}
      />
    );
  }

  // Legacy implementation for backwards compatibility
  const [isOpen, setIsOpen] = useState(false);

  // Filter actions based on current state
  const availableActions = actionsConfig.filter(action => {
    if (action.isSeparator) return true;
    if (action.disabled) return false;
    
    // Handle selection-sensitive actions
    if (action.selectionSensitive) {
      if (!isSelectionModeActive && effectiveSelectedCount === 0) return true; // Show to activate selection mode
      if (Array.isArray(action.requiredSelectionCount)) {
        return action.requiredSelectionCount.includes(effectiveSelectedCount);
      }
      if (action.requiredSelectionCount === 'any') {
        return effectiveSelectedCount > 0;
      }
      if (typeof action.requiredSelectionCount === 'number') {
        return effectiveSelectedCount === action.requiredSelectionCount;
      }
    }
    
    return true;
  });

  const handleActionClick = (action) => {
    setIsOpen(false);
    
    // Handle legacy props
    if (action.type === 'add' && onAddNew) {
      onAddNew();
      return;
    }
    if (action.type === 'import' && onImportData) {
      onImportData();
      return;
    }
    if (action.type === 'export' && onExportData) {
      onExportData();
      return;
    }
    if (action.type === 'edit' && onEditSelected) {
      onEditSelected();
      return;
    }
    if (action.type === 'delete' && onDeleteSelected) {
      onDeleteSelected();
      return;
    }
    
    // Handle new action system
    if (action.action && typeof action.action === 'function') {
      action.action();
    } else if (onExecuteAction) {
      onExecuteAction(action.type || action.labelKey);
    }
  };

  // If only one primary action (usually Add), show it as a standalone button
  const primaryActions = availableActions.filter(action => !action.isSeparator && (action.type === 'add' || action.primary));
  
  if (primaryActions.length === 1 && availableActions.length <= 3) {
    const primaryAction = primaryActions[0];
    const Icon = primaryAction.icon || Plus;
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={() => handleActionClick(primaryAction)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={primaryAction.disabled}
          size={size}
        >
          <Icon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t(primaryAction.labelKey, { defaultValue: primaryAction.defaultLabel })}
        </Button>
        
        {availableActions.length > 1 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availableActions.slice(1).map((action, index) => {
                if (action.isSeparator) {
                  return <DropdownMenuSeparator key={index} />;
                }
                
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.labelKey || index}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className="flex items-center gap-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {t(action.labelKey, { defaultValue: action.defaultLabel })}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // For multiple actions, show dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MoreVertical className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.actions', { defaultValue: 'Actions' })}
          {effectiveSelectedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {effectiveSelectedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {debugMode && (
          <>
            <DropdownMenuItem disabled className="text-xs text-gray-500">
              Debug: {availableActions.length} actions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {availableActions.map((action, index) => {
          if (action.isSeparator) {
            return <DropdownMenuSeparator key={index} />;
          }
          
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.labelKey || index}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className="flex items-center gap-2"
            >
              {Icon && <Icon className="w-4 h-4" />}
              {t(action.labelKey, { defaultValue: action.defaultLabel })}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}