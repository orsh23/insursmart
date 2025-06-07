import {
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  DownloadCloud,
  UserPlus,
  KeyRound,
  FileText,
  Copy,
  Archive,
  Settings,
  Mail,
  Filter,
  ListFilter,
  Eye,
  Users,
  Shield,
  RotateCcw,
} from 'lucide-react';

export const ActionTypes = {
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  VIEW: 'view',
  IMPORT: 'import',
  EXPORT: 'export',
  INVITE_USER: 'invite',
  RESET_PASSWORD: 'resetPassword',
  DUPLICATE: 'duplicate',
  ARCHIVE: 'archive',
  SETTINGS: 'settings',
  SEND_EMAIL: 'sendEmail',
  APPLY_FILTERS: 'applyFilters',
  CLEAR_FILTERS: 'clearFilters',
  TOGGLE_VISIBILITY: 'toggleVisibility',
  MANAGE_PERMISSIONS: 'managePermissions',
  BULK_EDIT: 'bulkEdit',
  ASSIGN: 'assign',
};

// Icon mapping for actions
const ACTION_ICONS = {
  [ActionTypes.ADD]: Plus,
  [ActionTypes.EDIT]: Edit,
  [ActionTypes.DELETE]: Trash2,
  [ActionTypes.VIEW]: Eye,
  [ActionTypes.IMPORT]: UploadCloud,
  [ActionTypes.EXPORT]: DownloadCloud,
  [ActionTypes.INVITE_USER]: UserPlus,
  [ActionTypes.RESET_PASSWORD]: KeyRound,
  [ActionTypes.DUPLICATE]: Copy,
  [ActionTypes.ARCHIVE]: Archive,
  [ActionTypes.SETTINGS]: Settings,
  [ActionTypes.SEND_EMAIL]: Mail,
  [ActionTypes.APPLY_FILTERS]: Filter,
  [ActionTypes.CLEAR_FILTERS]: ListFilter,
  [ActionTypes.TOGGLE_VISIBILITY]: Eye,
  [ActionTypes.MANAGE_PERMISSIONS]: Shield,
  [ActionTypes.BULK_EDIT]: Edit,
  [ActionTypes.ASSIGN]: Users,
};

// Get icon for action type
export const getActionIcon = (actionType, customIcons = {}) => {
  return customIcons[actionType] || ACTION_ICONS[actionType] || FileText;
};

// Default permissions by role
export const getDefaultPermissionsForRole = (role) => {
  const permissions = {
    guest: {
      canView: true,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canImport: false,
      canExport: false,
      canInvite: false,
      canResetPassword: false,
      canManagePermissions: false,
      canViewSettings: false,
    },
    user: {
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canImport: false,
      canExport: true,
      canInvite: false,
      canResetPassword: false,
      canManagePermissions: false,
      canViewSettings: false,
    },
    admin: {
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      canInvite: true,
      canResetPassword: true,
      canManagePermissions: true,
      canViewSettings: true,
    },
  };

  return permissions[role] || permissions.user;
};

// Entity-specific action configurations
const ENTITY_CONFIGS = {
  tasks: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.IMPORT, ActionTypes.EXPORT, ActionTypes.ASSIGN],
    labels: {
      add: 'Add Task',
      edit: 'Edit Task',
      delete: 'Delete Tasks',
      import: 'Import Tasks',
      export: 'Export Tasks',
      assign: 'Assign Tasks',
    },
  },
  users: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.INVITE_USER, ActionTypes.RESET_PASSWORD, ActionTypes.MANAGE_PERMISSIONS, ActionTypes.EXPORT],
    labels: {
      add: 'Add User',
      edit: 'Edit User',
      delete: 'Delete Users',
      invite: 'Invite User',
      resetPassword: 'Reset Password',
      managePermissions: 'Manage Permissions',
      export: 'Export Users',
    },
  },
  providers: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.IMPORT, ActionTypes.EXPORT, ActionTypes.VIEW],
    labels: {
      add: 'Add Provider',
      edit: 'Edit Provider',
      delete: 'Delete Providers',
      import: 'Import Providers',
      export: 'Export Providers',
      view: 'View Details',
    },
  },
  doctors: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.IMPORT, ActionTypes.EXPORT, ActionTypes.VIEW],
    labels: {
      add: 'Add Doctor',
      edit: 'Edit Doctor',
      delete: 'Delete Doctors',
      import: 'Import Doctors',
      export: 'Export Doctors',
      view: 'View Details',
    },
  },
  materials: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.IMPORT, ActionTypes.EXPORT, ActionTypes.DUPLICATE],
    labels: {
      add: 'Add Material',
      edit: 'Edit Material',
      delete: 'Delete Materials',
      import: 'Import Materials',
      export: 'Export Materials',
      duplicate: 'Duplicate Material',
    },
  },
  codes: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.IMPORT, ActionTypes.EXPORT],
    labels: {
      add: 'Add Code',
      edit: 'Edit Code',
      delete: 'Delete Codes',
      import: 'Import Codes',
      export: 'Export Codes',
    },
  },
  contracts: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.VIEW, ActionTypes.DUPLICATE, ActionTypes.ARCHIVE],
    labels: {
      add: 'Add Contract',
      edit: 'Edit Contract',
      delete: 'Delete Contracts',
      view: 'View Contract',
      duplicate: 'Duplicate Contract',
      archive: 'Archive Contract',
    },
  },
  claims: {
    defaultActions: [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.VIEW, ActionTypes.EXPORT],
    labels: {
      add: 'Add Claim',
      edit: 'Edit Claim',
      view: 'View Claim',
      export: 'Export Claims',
    },
  },
  // Add more entities as needed
};

// Build actions configuration for a specific entity
export const buildEntityActionsConfig = ({
  entity = 'item',
  t,
  permissions = {},
  handlers = {},
  isSelectionModeActive = false,
  selectedItemsCount = 0,
  customActions = [],
  overrides = {},
}) => {
  const entityConfig = ENTITY_CONFIGS[entity] || ENTITY_CONFIGS.tasks; // fallback
  const actions = [];

  // Helper to create action
  const createAction = (type, overrideProps = {}) => {
    const baseAction = {
      id: `${entity}-${type}`,
      type,
      icon: getActionIcon(type),
      disabled: false,
      visible: true,
      primary: type === ActionTypes.ADD,
      ...overrideProps,
    };

    // Set label
    const labelKey = entityConfig.labels[type] || `${type} ${entity}`;
    baseAction.label = t ? t(`actions.${entity}.${type}`, { defaultValue: labelKey }) : labelKey;

    // Set onClick handler
    const handlerMap = {
      [ActionTypes.ADD]: handlers.onAdd,
      [ActionTypes.EDIT]: handlers.onEdit,
      [ActionTypes.DELETE]: handlers.onDelete,
      [ActionTypes.VIEW]: handlers.onViewDetails,
      [ActionTypes.IMPORT]: handlers.onImport,
      [ActionTypes.EXPORT]: handlers.onExport,
      [ActionTypes.INVITE_USER]: handlers.onInviteUsers,
      [ActionTypes.RESET_PASSWORD]: handlers.onResetPassword,
      [ActionTypes.DUPLICATE]: handlers.onDuplicate,
      [ActionTypes.ARCHIVE]: handlers.onArchive,
      [ActionTypes.SETTINGS]: handlers.onSettings,
      [ActionTypes.MANAGE_PERMISSIONS]: handlers.onManagePermissions,
      [ActionTypes.ASSIGN]: handlers.onAssign,
    };

    baseAction.onClick = handlerMap[type] || (() => console.warn(`No handler for ${type}`));

    // Set permission requirements
    const permissionMap = {
      [ActionTypes.ADD]: 'canAdd',
      [ActionTypes.EDIT]: 'canEdit',
      [ActionTypes.DELETE]: 'canDelete',
      [ActionTypes.VIEW]: 'canView',
      [ActionTypes.IMPORT]: 'canImport',
      [ActionTypes.EXPORT]: 'canExport',
      [ActionTypes.INVITE_USER]: 'canInvite',
      [ActionTypes.RESET_PASSWORD]: 'canResetPassword',
      [ActionTypes.MANAGE_PERMISSIONS]: 'canManagePermissions',
      [ActionTypes.SETTINGS]: 'canViewSettings',
    };

    if (permissionMap[type]) {
      baseAction.requiresPermission = permissionMap[type];
    }

    // Set selection requirements
    if ([ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.ASSIGN].includes(type)) {
      baseAction.selectionSensitive = true;
      if (type === ActionTypes.EDIT) {
        baseAction.requiresSingleSelection = true;
      } else if ([ActionTypes.DELETE, ActionTypes.ASSIGN].includes(type)) {
        baseAction.requiresSelection = true;
      }
    }

    return baseAction;
  };

  // Add default actions for this entity
  entityConfig.defaultActions.forEach(actionType => {
    if (permissions[getPermissionForAction(actionType)] !== false) {
      actions.push(createAction(actionType, overrides[actionType]));
    }
  });

  // Add separator before secondary actions
  const hasSecondaryActions = actions.some(a => 
    [ActionTypes.IMPORT, ActionTypes.EXPORT, ActionTypes.SETTINGS, ActionTypes.MANAGE_PERMISSIONS].includes(a.type)
  );
  
  if (hasSecondaryActions) {
    const primaryActionsCount = actions.filter(a => 
      [ActionTypes.ADD, ActionTypes.EDIT, ActionTypes.DELETE, ActionTypes.VIEW].includes(a.type)
    ).length;
    
    if (primaryActionsCount > 0) {
      actions.splice(primaryActionsCount, 0, { isSeparator: true });
    }
  }

  // Add custom actions
  customActions.forEach(customAction => {
    actions.push({
      id: `custom-${customAction.type || 'action'}`,
      visible: true,
      disabled: false,
      ...customAction,
    });
  });

  return actions;
};

// Helper function to get permission name for action type
const getPermissionForAction = (actionType) => {
  const map = {
    [ActionTypes.ADD]: 'canAdd',
    [ActionTypes.EDIT]: 'canEdit',
    [ActionTypes.DELETE]: 'canDelete',
    [ActionTypes.VIEW]: 'canView',
    [ActionTypes.IMPORT]: 'canImport',
    [ActionTypes.EXPORT]: 'canExport',
    [ActionTypes.INVITE_USER]: 'canInvite',
    [ActionTypes.RESET_PASSWORD]: 'canResetPassword',
    [ActionTypes.MANAGE_PERMISSIONS]: 'canManagePermissions',
    [ActionTypes.SETTINGS]: 'canViewSettings',
  };
  return map[actionType] || 'canView';
};

// Backwards compatibility - existing function with new implementation
export const buildTaskActionsConfig = (props) => {
  return buildEntityActionsConfig({
    entity: 'tasks',
    ...props,
  });
};

export const buildGlobalActionsConfig = buildEntityActionsConfig; // Alias for backwards compatibility