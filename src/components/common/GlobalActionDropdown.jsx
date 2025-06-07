
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Plus, Edit, Trash2, Upload, Download, UserPlus, KeyRound, Eye, Settings } from 'lucide-react';
import { buildEntityActionsConfig, getDefaultPermissionsForRole } from '@/components/configs/globalActionConfigs';

export default function GlobalActionDropdown({
  entity = 'item', // e.g., 'tasks', 'users', 'providers', etc.
  permissions = {},
  isSelectionModeActive = false,
  selectedItemsCount = 0,
  t = (key, options) => options?.defaultValue || key,
  isRTL = false,
  showAllActionsInDev = false, // Debug flag to show all actions
  
  // Parent-level overrides
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
  
  // Additional props
  currentUserRole = 'user',
  debugMode = false,
  className = '',
  size = 'default',
  variant = 'outline'
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get default permissions based on role if not provided
  const effectivePermissions = useMemo(() => {
    const defaultPerms = getDefaultPermissionsForRole(currentUserRole);
    return { ...defaultPerms, ...permissions };
  }, [currentUserRole, permissions]);

  // Build actions configuration for this entity
  const actionsConfig = useMemo(() => {
    const handlers = {
      onAdd: onAdd || (() => console.log(`Add ${entity}`)),
      onEdit: onEdit || (() => console.log(`Edit ${entity}`)),
      onDelete: onDelete || onDeleteItems || (() => console.log(`Delete ${entity}`)),
      onImport: onImport || (() => console.log(`Import ${entity}`)),
      onExport: onExport || (() => console.log(`Export ${entity}`)),
      onInviteUsers: onInviteUsers || (() => console.log('Invite users')),
      onResetPassword: onResetPassword || (() => console.log('Reset password')),
      onViewDetails: onViewDetails || (() => console.log(`View ${entity} details`)),
      onSettings: onSettings || (() => console.log(`${entity} settings`)),
    };

    return buildEntityActionsConfig({
      entity,
      t,
      permissions: effectivePermissions,
      handlers,
      isSelectionModeActive,
      selectedItemsCount,
    });
  }, [
    entity, t, effectivePermissions, isSelectionModeActive, selectedItemsCount,
    onAdd, onEdit, onDelete, onDeleteItems, onImport, onExport, 
    onInviteUsers, onResetPassword, onViewDetails, onSettings
  ]);

  // Filter actions based on visibility and permissions
  const availableActions = useMemo(() => {
    const isDev = (typeof window !== 'undefined' && window.location.hostname === 'localhost') || showAllActionsInDev;
    
    return actionsConfig.filter(action => {
      if (action.isSeparator) return true;
      
      // In dev mode, show all actions if requested
      if (isDev && showAllActionsInDev) return true;
      
      // Check if action is visible
      if (action.visible === false) return false;
      
      // Check permissions
      if (action.requiresPermission && !effectivePermissions[action.requiresPermission]) {
        return false;
      }
      
      // Check selection requirements
      if (action.selectionSensitive) {
        if (action.requiresSelection && selectedItemsCount === 0) return false;
        if (action.requiresNoSelection && selectedItemsCount > 0) return false;
        if (action.requiresSingleSelection && selectedItemsCount !== 1) return false;
        if (action.requiresMultipleSelection && selectedItemsCount < 2) return false;
      }
      
      return true;
    });
  }, [actionsConfig, effectivePermissions, selectedItemsCount, showAllActionsInDev]);

  // Debug logging
  React.useEffect(() => {
    if (debugMode || showAllActionsInDev) {
      console.log(`=== GlobalActionDropdown Debug - Entity: ${entity} ===`);
      console.log('Effective Permissions:', effectivePermissions);
      console.log('Selection State:', { isSelectionModeActive, selectedItemsCount });
      console.log('All Actions Config:', actionsConfig);
      console.log('Available Actions:', availableActions);
      console.log('Handlers:', {
        onAdd, onEdit, onDelete, onDeleteItems, onImport, onExport,
        onInviteUsers, onResetPassword, onViewDetails, onSettings
      });
      console.log('=== End GlobalActionDropdown Debug ===');
    }
  }, [
    entity, effectivePermissions, isSelectionModeActive, selectedItemsCount,
    actionsConfig, availableActions, debugMode, showAllActionsInDev,
    onAdd, onEdit, onDelete, onDeleteItems, onImport, onExport,
    onInviteUsers, onResetPassword, onViewDetails, onSettings
  ]);

  const handleActionClick = (action) => {
    setIsOpen(false);
    
    if (debugMode) {
      console.log('Action clicked:', action);
    }
    
    if (action.onClick && typeof action.onClick === 'function') {
      action.onClick();
    } else {
      console.warn('No onClick handler for action:', action);
    }
  };

  // If no actions are available, don't render anything
  if (availableActions.length === 0) {
    return debugMode ? (
      <div className="text-xs text-red-500 p-2 border border-red-300 rounded">
        No actions available for {entity}
      </div>
    ) : null;
  }

  // If only one primary action (usually Add), show it as a standalone button
  const primaryActions = availableActions.filter(action => 
    !action.isSeparator && (action.type === 'add' || action.primary)
  );
  
  if (primaryActions.length === 1 && availableActions.length <= 3 && !isSelectionModeActive) {
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
          {primaryAction.label}
        </Button>
        
        {availableActions.length > 1 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {debugMode && (
                <>
                  <DropdownMenuItem disabled className="text-xs text-gray-500">
                    Debug: {entity} ({availableActions.length} actions)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {availableActions.slice(1).map((action, index) => {
                if (action.isSeparator) {
                  return <DropdownMenuSeparator key={`sep-${index}`} />;
                }
                
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.id || `action-${index}`}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className="flex items-center gap-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{action.label}</span>
                    {debugMode && action.requiresPermission && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {effectivePermissions[action.requiresPermission] ? '✓' : '✗'}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // For multiple actions or selection mode, show dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MoreVertical className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.actions', { defaultValue: 'Actions' })}
          {selectedItemsCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedItemsCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {debugMode && (
          <>
            <DropdownMenuItem disabled className="text-xs text-gray-500">
              Debug: {entity} ({availableActions.length} actions)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-gray-500">
              Selection: {selectedItemsCount} items
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {availableActions.map((action, index) => {
          if (action.isSeparator) {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }
          
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id || `action-${index}`}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className="flex items-center gap-2"
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{action.label}</span>
              {debugMode && action.requiresPermission && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {effectivePermissions[action.requiresPermission] ? '✓' : '✗'}
                </Badge>
              )}
              {showAllActionsInDev && action.visible === false && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  Hidden
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
