// components/common/GlobalActionDropdown.jsx

import React, { useMemo, useCallback } from 'react';
import GlobalActionButton from './GlobalActionButton';
import {
  buildGlobalActionsConfig,
  filterVisibleActions,
  getDefaultPermissionsForRole,
} from '@/components/config/globalActionConfigs';
import { CustomIconOverrides } from '@/components/config/iconTypes';
import { resolveIconForAction } from '@/components/config/iconUtils';

export default function GlobalActionDropdown({
  entityType,
  t,
  toast,
  isSelectionModeActive,
  selectedItems,
  handleOpenEntityDialog,
  setIsImportDialogOpen,
  userRole = 'viewer',
  isRTL = false,
  onStartSelectionMode = () => {},
  onEditItems,
  onDeleteItems,
  onInviteUser,
  onResetPassword,
  customIcons = {},
}) {
  const permissions = useMemo(() => {
    const basePermissions = getDefaultPermissionsForRole(userRole);
    if (userRole === 'admin' || userRole === 'manager') {
      return {
        ...basePermissions,
        canInvite: true,
        canResetPassword: true,
      };
    }
    return basePermissions;
  }, [userRole]);

  const actionsConfig = useMemo(() => {
    return filterVisibleActions(
      buildGlobalActionsConfig({
        entityType,
        t,
        toast,
        isSelectionModeActive,
        selectedItems,
        handleOpenTaskDialog: handleOpenEntityDialog,
        handleOpenProjectDialog: handleOpenEntityDialog,
        handleOpenUserDialog: handleOpenEntityDialog,
        setIsImportDialogOpen,
        permissions,
        onInviteUser,
        onResetPassword,
        customIcons,
        resolveIcon: resolveIconForAction,
      })
    );
  }, [
    entityType,
    t,
    toast,
    isSelectionModeActive,
    selectedItems,
    handleOpenEntityDialog,
    setIsImportDialogOpen,
    permissions,
    onInviteUser,
    onResetPassword,
    customIcons,
  ]);

  const memoizedEditItems = useCallback(() => {
    onEditItems && onEditItems();
  }, [onEditItems]);

  const memoizedDeleteItems = useCallback(() => {
    onDeleteItems && onDeleteItems();
  }, [onDeleteItems]);

  const memoizedStartSelectionMode = useCallback((mode) => {
    onStartSelectionMode && onStartSelectionMode(mode);
  }, [onStartSelectionMode]);

  const memoizedInviteUser = useCallback(() => {
    onInviteUser && onInviteUser();
  }, [onInviteUser]);

  const memoizedResetPassword = useCallback(() => {
    onResetPassword && onResetPassword();
  }, [onResetPassword]);

  const itemTypeForActions = t(`pageTitles.${entityType}Singular`, { defaultValue: entityType });

  return (
    <GlobalActionButton
      actionsConfig={actionsConfig}
      isSelectionModeActive={isSelectionModeActive}
      onStartSelectionMode={memoizedStartSelectionMode}
      onEditItems={memoizedEditItems}
      onDeleteItems={memoizedDeleteItems}
      onInviteUser={memoizedInviteUser}
      onResetPassword={memoizedResetPassword}
      itemTypeForActions={itemTypeForActions}
      t={t}
      isRTL={isRTL}
    />
  );
}
