
import {
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  DownloadCloud,
  UserPlus,
  KeyRound,
  FileText, // Example for a generic 'view' or 'details'
  Copy,
  Archive,
  Settings,
  Mail,
  Filter,
  ListFilter,
  Eye,
} from 'lucide-react';
import { resolveIconForAction } from './iconUtils'; // Assuming iconUtils.js is in the same folder

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
  // Add more as needed
};

// Function to build a configuration for actions, primarily for GlobalActionButton
// This is a more robust way to manage actions and their properties.
export const buildGlobalActionsConfig = ({
  t, // translation function
  permissions = {}, // { canAdd: true, canEdit: true, ... }
  handlers = {}, // { onAdd: () => {}, onEdit: () => {}, ... }
  itemTypeSingular = 'item', // For generic labels like "Add New Item"
  itemTypePlural = 'items', // For generic labels like "Delete Items"
  customIcons = {}, // Optional map to override default icons { [ActionTypes.ADD]: CustomPlusIcon }
}) => {
  const actions = [];

  if (permissions.canAdd) {
    actions.push({
      type: ActionTypes.ADD,
      labelKey: 'actions.addNew',
      defaultLabel: t('actions.addNew', { item: itemTypeSingular, defaultValue: `Add New ${itemTypeSingular}` }),
      icon: resolveIconForAction(ActionTypes.ADD, customIcons),
      action: handlers.onAdd,
      disabled: handlers.onAdd === undefined,
    });
  }

  if (permissions.canImport) {
    actions.push({
      type: ActionTypes.IMPORT,
      labelKey: 'actions.importData',
      defaultLabel: t('actions.importData', { items: itemTypePlural, defaultValue: `Import ${itemTypePlural}` }),
      icon: resolveIconForAction(ActionTypes.IMPORT, customIcons),
      action: handlers.onImport,
      disabled: handlers.onImport === undefined,
    });
  }
  
  if (permissions.canExport) {
    actions.push({
      type: ActionTypes.EXPORT,
      labelKey: 'actions.exportData',
      defaultLabel: t('actions.exportData', { items: itemTypePlural, defaultValue: `Export ${itemTypePlural}` }),
      icon: resolveIconForAction(ActionTypes.EXPORT, customIcons),
      action: handlers.onExport,
      disabled: handlers.onExport === undefined,
    });
  }

  // Example: User Management specific actions (could be in a separate builder)
  if (permissions.canInviteUser) {
     actions.push({
      type: ActionTypes.INVITE_USER,
      labelKey: 'actions.inviteUser',
      defaultLabel: t('actions.inviteUser', { defaultValue: 'Invite User' }),
      icon: resolveIconForAction(ActionTypes.INVITE_USER, customIcons),
      action: handlers.onInviteUser,
      disabled: handlers.onInviteUser === undefined,
    });
  }

  if (actions.length > 0 && (permissions.canEdit || permissions.canDelete)) {
    actions.push({ isSeparator: true });
  }
  
  // These actions are typically for selection mode or context menus
  if (permissions.canEdit) {
    actions.push({
      type: ActionTypes.EDIT,
      labelKey: 'actions.editSelected',
      defaultLabel: t('actions.editSelected', { defaultValue: 'Edit Selected' }),
      icon: resolveIconForAction(ActionTypes.EDIT, customIcons),
      action: handlers.onEditSelection, // Handler for when items ARE selected
      selectionModeOnly: true, // Indicates this appears/is enabled in selection mode
      disabled: handlers.onEditSelection === undefined,
    });
  }

  if (permissions.canDelete) {
    actions.push({
      type: ActionTypes.DELETE,
      labelKey: 'actions.deleteSelected',
      defaultLabel: t('actions.deleteSelected', { defaultValue: 'Delete Selected' }),
      icon: resolveIconForAction(ActionTypes.DELETE, customIcons),
      action: handlers.onDeleteSelection, // Handler for when items ARE selected
      selectionModeOnly: true,
      disabled: handlers.onDeleteSelection === undefined,
    });
  }
  
  // You can add more generic actions or specific ones based on permissions and handlers
  return actions.filter(action => action !== null);
};


// Specific builder for Task Page actions, demonstrating usage
export const buildTaskActionsConfig = ({
  t,
  toast, // if needed for actions
  isSelectionModeActive, // To enable/disable certain actions
  selectedItems, // To know if items are selected
  handleOpenTaskDialog,
  handleEditTask, // This would be called with a single task object
  handleDeleteTasks, // This would be called with an array of task IDs
  setIsImportDialogOpen,
  permissions = {} // { canAdd: true, canEdit: true, canDelete: true, canImport: true }
}) => {
  const hasSelectedItems = selectedItems && selectedItems.length > 0;

  return [
    permissions.canAdd && {
      type: ActionTypes.ADD,
      labelKey: 'tasks.actions.addNewTask',
      defaultLabel: t('tasks.actions.addNewTask', { defaultValue: 'Add New Task' }),
      icon: Plus,
      action: () => handleOpenTaskDialog(),
    },
    permissions.canImport && {
      type: ActionTypes.IMPORT,
      labelKey: 'tasks.actions.importTasks',
      defaultLabel: t('tasks.actions.importTasks', { defaultValue: 'Import Tasks' }),
      icon: UploadCloud,
      action: () => setIsImportDialogOpen(true),
    },
    permissions.canExport && { // Assuming canExport permission
      type: ActionTypes.EXPORT,
      labelKey: 'tasks.actions.exportTasks',
      defaultLabel: t('tasks.actions.exportTasks', { defaultValue: 'Export Tasks' }),
      icon: DownloadCloud,
      action: () => { /* Implement export logic, e.g., open export dialog or directly export */ 
        toast({ title: t('common.notice', {defaultValue: 'Notice'}), description: t('common.exportNotImplemented', {defaultValue: 'Export functionality not yet implemented.'}) });
      },
    },
    (permissions.canEdit || permissions.canDelete) && { isSeparator: true },
    permissions.canEdit && {
      type: ActionTypes.EDIT,
      labelKey: 'tasks.actions.editTask',
      defaultLabel: t('tasks.actions.editTask', { defaultValue: 'Edit Task' }),
      icon: Edit,
      action: () => {
        if (selectedItems.length === 1) {
          // The actual task object needs to be found from allTasks using selectedItems[0] (ID)
          // This part needs logic in GlobalActionButton or TasksPage to pass the item.
          // For GlobalActionButton, it might call a generic onEditItems prop.
          if (handleEditTask) handleEditTask(selectedItems[0]); // Changed from handlers.onEditSingleItem
          else console.warn("Edit action triggered, but no specific handler for single selected item in GlobalActionButton context.");
        } else if (isSelectionModeActive) { // No specific handler for multiple edits on tasks in this outline
             console.warn("Bulk editing of tasks not implemented through this action.");
        }
      },
      disabled: !isSelectionModeActive || !hasSelectedItems || selectedItems.length !== 1, // Simplified: enable only for single selection
      // If it's not selection mode, this specific "Edit Task" from dropdown implies you select *then* edit.
      // Or, it could be a generic "Start Edit Mode" if that's how your UI works.
    },
    permissions.canDelete && {
      type: ActionTypes.DELETE,
      labelKey: 'tasks.actions.deleteTasks',
      defaultLabel: t('tasks.actions.deleteTasks', { defaultValue: 'Delete Tasks' }),
      icon: Trash2,
      action: () => handleDeleteTasks(selectedItems),
      disabled: !isSelectionModeActive || !hasSelectedItems,
    },
  ].filter(Boolean); // Filter out nulls (actions hidden by permissions)
};

// Helper to get default permissions (can be expanded)
export const getDefaultPermissionsForRole = (role) => {
  if (role === 'admin') {
    return {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      canInviteUser: true,
      canResetPassword: true,
      canViewSettings: true,
    };
  }
  if (role === 'user') {
    return {
      canAdd: true,
      canEdit: true, // Typically users can edit their own items
      canDelete: true, // Typically users can delete their own items
      canImport: false,
      canExport: true,
      canInviteUser: false,
      canResetPassword: false, // Users can reset their own, but not others
      canViewSettings: false,
    };
  }
  // Default for unknown or guest roles
  return {
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canImport: false,
    canExport: false,
    canInviteUser: false,
    canResetPassword: false,
    canViewSettings: false,
  };
};
