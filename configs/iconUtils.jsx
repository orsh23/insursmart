// components/config/iconUtils.js

import {
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  DownloadCloud,
  UserPlus,
  KeyRound,
  MoreVertical,
  Search,
  ClipboardCopy,
} from 'lucide-react';

import { useState } from 'react';

export const ICON_CATEGORIES = {
  crud: {
    add: { icon: Plus, label: 'Add', description: 'Create or add new items' },
    edit: { icon: Edit, label: 'Edit', description: 'Modify or update an item' },
    delete: { icon: Trash2, label: 'Delete', description: 'Remove or archive an item' },
  },
  file: {
    import: { icon: UploadCloud, label: 'Import', description: 'Upload or ingest data from a file' },
    export: { icon: DownloadCloud, label: 'Export', description: 'Download or extract data to a file' },
  },
  user: {
    invite: { icon: UserPlus, label: 'Invite', description: 'Send an invite to new users' },
    resetPassword: { icon: KeyRound, label: 'Reset Password', description: 'Initiate user password reset' },
  },
  misc: {
    default: { icon: MoreVertical, label: 'More', description: 'Default icon for uncategorized actions' },
  },
};

export const DEFAULT_ACTION_ICONS = Object.fromEntries(
  Object.entries(ICON_CATEGORIES).flatMap(([_, group]) =>
    Object.entries(group).map(([key, { icon }]) => [key, icon])
  )
);

export function resolveIconForAction(type, customIcons = {}) {
  if (customIcons && typeof customIcons[type] === 'function') {
    return customIcons[type];
  }
  if (!DEFAULT_ACTION_ICONS[type]) {
    console.warn(`resolveIconForAction: No icon found for action type "${type}". Falling back to default.`);
  }
  return DEFAULT_ACTION_ICONS[type] || DEFAULT_ACTION_ICONS.default;
}

export function renderIconTooltips(category, filter = '', onCopy = () => {}) {
  if (!ICON_CATEGORIES[category]) return null;
  return Object.entries(ICON_CATEGORIES[category])
    .filter(([type, { label }]) => label.toLowerCase().includes(filter.toLowerCase()))
    .map(([type, { icon: Icon, label, description }]) => (
      <div key={type} className="flex flex-col items-center m-2" title={`${label}: ${description}`}>        
        <button
          className="group relative flex flex-col items-center focus:outline-none"
          onClick={() => onCopy(type)}
        >
          <Icon className="w-6 h-6 mb-1 group-hover:text-blue-600" />
          <span className="text-xs text-center">{label}</span>
          <ClipboardCopy className="absolute top-0 right-0 w-3 h-3 text-gray-400 group-hover:text-blue-600" />
        </button>
      </div>
    ));
}

export function IconPreviewGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(() => Object.keys(ICON_CATEGORIES).reduce((acc, cat) => ({ ...acc, [cat]: true }), {}));
  const [copied, setCopied] = useState(null);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleCopy = (iconKey) => {
    navigator.clipboard.writeText(`import { ${DEFAULT_ACTION_ICONS[iconKey].name} } from 'lucide-react';`).then(() => {
      setCopied(iconKey);
      setTimeout(() => setCopied(null), 1000);
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-2 py-1 rounded w-full max-w-xs"
        />
      </div>
      {Object.keys(ICON_CATEGORIES).map((category) => (
        <div key={category} className="mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-300 capitalize">
              {category}
            </h4>
            <span className="text-xs text-blue-500">{expandedCategories[category] ? 'Hide' : 'Show'}</span>
          </div>
          {expandedCategories[category] && (
            <div className="flex flex-wrap gap-4 mt-2">
              {renderIconTooltips(category, searchTerm, handleCopy)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('resolveIconForAction', () => {
    it('returns default icon for unknown type', () => {
      const icon = resolveIconForAction('unknown');
      expect(icon).toBe(MoreVertical);
    });

    it('returns correct default icon for known type', () => {
      expect(resolveIconForAction('edit')).toBe(Edit);
      expect(resolveIconForAction('delete')).toBe(Trash2);
      expect(resolveIconForAction('add')).toBe(Plus);
      expect(resolveIconForAction('import')).toBe(UploadCloud);
      expect(resolveIconForAction('export')).toBe(DownloadCloud);
      expect(resolveIconForAction('invite')).toBe(UserPlus);
      expect(resolveIconForAction('resetPassword')).toBe(KeyRound);
    });

    it('returns custom icon when provided', () => {
      const CustomIcon = () => 'Custom';
      const customIcons = { edit: CustomIcon };
      const icon = resolveIconForAction('edit', customIcons);
      expect(icon).toBe(CustomIcon);
    });
  });
}
