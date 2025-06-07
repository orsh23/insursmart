import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BulkSelectionModal({
  isOpen = false,
  onClose,
  onConfirm,
  title,
  description,
  items = [],
  selectedItemIds = [],
  onToggleItem,
  onSelectAll,
  actionType = 'action', // 'edit', 'delete', 'assign', etc.
  confirmText,
  cancelText,
  isLoading = false,
  maxHeight = '60vh',
  t = (key, options) => options?.defaultValue || key,
  isRTL = false,
  renderItem = null, // Custom render function for items
}) {
  const allSelected = items.length > 0 && items.every(item => selectedItemIds.includes(item.id));
  const someSelected = selectedItemIds.length > 0 && selectedItemIds.length < items.length;

  const handleSelectAllChange = (checked) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleItemToggle = (itemId) => {
    if (onToggleItem) {
      onToggleItem(itemId);
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case 'delete':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'edit':
      case 'assign':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
    }
  };

  const defaultRenderItem = (item) => (
    <div className="flex items-center space-x-3 rtl:space-x-reverse p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
      <Checkbox
        checked={selectedItemIds.includes(item.id)}
        onCheckedChange={() => handleItemToggle(item.id)}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.name || item.title || item.label || `Item ${item.id}`}
        </p>
        {item.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {item.description}
          </p>
        )}
      </div>
      {item.status && (
        <Badge variant="outline" className="text-xs">
          {item.status}
        </Badge>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            {title || t('bulkActions.bulkSelection', { defaultValue: 'Bulk Selection' })}
          </DialogTitle>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Checkbox
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onCheckedChange={handleSelectAllChange}
              />
              <span className="text-sm font-medium">
                {t('bulkActions.selectAll', { defaultValue: 'Select All' })}
              </span>
            </div>
            <Badge variant="secondary">
              {selectedItemIds.length} / {items.length} {t('common.selected', { defaultValue: 'selected' })}
            </Badge>
          </div>

          {/* Items List */}
          <div 
            className="flex-1 overflow-y-auto border rounded-lg"
            style={{ maxHeight }}
          >
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>{t('common.noItemsAvailable', { defaultValue: 'No items available' })}</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {items.map((item) => (
                  <div key={item.id}>
                    {renderItem ? renderItem(item) : defaultRenderItem(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {cancelText || t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={selectedItemIds.length === 0 || isLoading}
            className={`${
              actionType === 'delete' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              getActionIcon()
            )}
            <span className={isRTL ? 'mr-2' : 'ml-2'}>
              {confirmText || t(`common.${actionType}`, { defaultValue: actionType })} 
              {selectedItemIds.length > 0 && ` (${selectedItemIds.length})`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}