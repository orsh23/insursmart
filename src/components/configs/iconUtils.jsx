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

import { ActionTypes } from './globalActionConfigs';

// Default icon mapping
const DEFAULT_ICON_MAP = {
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

/**
 * Resolves the appropriate icon for an action type
 * @param {string} actionType - The action type (from ActionTypes)
 * @param {object} customIcons - Optional custom icon overrides
 * @returns {React.Component} The icon component
 */
export const resolveIconForAction = (actionType, customIcons = {}) => {
  // Check for custom icon first
  if (customIcons[actionType]) {
    return customIcons[actionType];
  }
  
  // Return default icon or fallback
  return DEFAULT_ICON_MAP[actionType] || FileText;
};

/**
 * Gets all available icons for debugging/selection purposes
 * @returns {object} Map of action types to icons
 */
export const getAllActionIcons = () => {
  return { ...DEFAULT_ICON_MAP };
};

/**
 * Validates if an icon exists for the given action type
 * @param {string} actionType - The action type to check
 * @returns {boolean} True if icon exists
 */
export const hasIconForAction = (actionType) => {
  return actionType in DEFAULT_ICON_MAP;
};