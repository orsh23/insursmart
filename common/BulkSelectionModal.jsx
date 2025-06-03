
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import DataTable from '@/components/shared/DataTable';
import { Search, AlertTriangle } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast'; // Assuming this path for useToast

// Simplified FilterBar for the modal - can be expanded later
const ModalFilterBar = ({ searchTerm, onSearchTermChange, t, isRTL }) => (
  <div className="relative mb-4">
    <Search className={`absolute top-1/2 left-3 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'hidden' : '' }`} />
    <Search className={`absolute top-1/2 right-3 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${!isRTL ? 'hidden' : '' }`} />
    <Input
      type="text"
      placeholder={t('bulkActions.searchInModalPlaceholder', { defaultValue: 'Search items...' })}
      value={searchTerm}
      onChange={(e) => onSearchTermChange(e.target.value)}
      className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600`}
    />
  </div>
);


export default function BulkSelectionModal({
  isOpen,
  onClose,
  mode, // 'edit' | 'delete'
  items, // All items to be displayed and filtered in the modal
  columns, // Columns config for the DataTable
  onConfirmSelection, // (selectedIds: string[], mode: string) => void
  itemEntityName, // e.g., "Provider"
  isLoading = false, // For external loading state if items are fetched specifically for modal
  baseFilters = {}, // Optional base filters applied to items before local search
  customFilterFunction, // Optional: (item, searchTerm, localFilters) => boolean
}) {
  const { t, isRTL } = useLanguageHook();
  const [localSelectedIds, setLocalSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Reset local selection and search term when modal opens or items change
    setLocalSelectedIds(new Set());
    setSearchTerm('');
  }, [isOpen, items]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    let displayItems = items;

    // Apply base filters if any
    if (Object.keys(baseFilters).length > 0) {
        displayItems = displayItems.filter(item => 
            Object.entries(baseFilters).every(([key, value]) => item[key] === value)
        );
    }
    
    // Apply local search term
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      displayItems = displayItems.filter(item => {
        if (customFilterFunction) {
            return customFilterFunction(item, termLower, {}); // Pass empty localFilters for now
        }
        // Default search through all string properties or specific columns if defined
        // This is a more generalized search than the original, adapting to the new outline.
        // It covers typical fields like name, policy_number, full_name as suggested.
        return Object.values(item).some(val => 
            (typeof val === 'string' && val.toLowerCase().includes(termLower)) ||
            (val && typeof val === 'object' && val.en && typeof val.en === 'string' && val.en.toLowerCase().includes(termLower)) ||
            (val && typeof val === 'object' && val.he && typeof val.he === 'string' && val.he.toLowerCase().includes(termLower))
        );
      });
    }
    return displayItems;
  }, [items, searchTerm, baseFilters, customFilterFunction]);

  const handleToggleSelection = (itemId, isSelected) => {
    setLocalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        if (mode === 'edit') { // For edit mode, only allow one selection
          newSet.clear(); 
        }
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAllVisible = () => {
     const allVisibleItemIds = filteredItems.map(item => item.id).filter(Boolean);
     const allCurrentlySelected = allVisibleItemIds.length > 0 && allVisibleItemIds.every(id => localSelectedIds.has(id));

     if (allCurrentlySelected) {
         setLocalSelectedIds(new Set());
     } else {
        if (mode === 'edit' && allVisibleItemIds.length > 1) {
            toast({
                title: t('bulkActions.editSingleItemTitle', {defaultValue: "Single Selection for Edit"}),
                description: t('bulkActions.editSingleItemDesc', {defaultValue: "Please select only one item to edit."}),
                variant: 'info'
            });
            return;
        }
         setLocalSelectedIds(new Set(allVisibleItemIds));
     }
  };
  
  const handleConfirm = () => {
    const selectedArray = Array.from(localSelectedIds);
    if (mode === 'edit' && selectedArray.length !== 1) {
      toast({
        title: t('bulkActions.selectOneToEditTitle', {defaultValue: 'Select One Item'}),
        description: t('bulkActions.selectExactlyOneItemToEditDesc', {entity: itemEntityName || t('common.item', {defaultValue: 'item'})}),
        variant: 'warning',
      });
      return;
    }
    if (selectedArray.length === 0) {
      toast({
        title: t('bulkActions.noItemsSelectedTitle', {defaultValue: 'No Items Selected'}),
        description: t('bulkActions.selectAtLeastOneItemDesc', {mode: mode, entity: itemEntityName || t('common.item', {count: 2, defaultValue: 'items'})}),
        variant: 'warning',
      });
      return;
    }
    onConfirmSelection(selectedArray, mode);
    onClose();
  };

  const title = mode === 'edit' 
    ? t('bulkActions.selectItemToEditTitle', { entity: itemEntityName || t('common.item', {defaultValue: 'item'}) })
    : t('bulkActions.selectItemsToDeleteTitle', { entity: itemEntityName || t('common.item', {count:2, defaultValue: 'items'}) });

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl h-[80vh] flex flex-col p-0 dark:bg-gray-800">
        <DialogHeader className="p-6 pb-4 border-b dark:border-gray-700">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 flex-grow overflow-hidden flex flex-col">
            <ModalFilterBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} t={t} isRTL={isRTL} />
            {isLoading ? (
                <LoadingSpinner message={t('messages.loadingData', {item: itemEntityName || t('common.items', {count:2, defaultValue: 'items'})})} />
            ) : filteredItems.length === 0 ? (
                 <div className="flex-grow flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm 
                            ? t('bulkActions.noItemsMatchSearchInModal', { defaultValue: 'No items match your search.'})
                            : t('bulkActions.noItemsAvailableInModal', {defaultValue: 'No items available for selection.'})
                        }
                    </p>
                 </div>
            ) : (
                <ScrollArea className="flex-grow rounded-md border dark:border-gray-700">
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        isSelectionModeActive={true} // Always in selection mode inside this modal
                        selectedRowIds={localSelectedIds}
                        onRowSelectionChange={handleToggleSelection}
                        onSelectAllRows={handleSelectAllVisible}
                        entityName={itemEntityName || t('common.item', {count:2, defaultValue: 'items'})}
                        t={t} 
                        isRTL={isRTL}
                    />
                </ScrollArea>
            )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t dark:border-gray-700 sm:justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('bulkActions.selectedCount', { count: localSelectedIds.size, defaultValue: `${localSelectedIds.size} selected`})}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button 
                onClick={handleConfirm} 
                disabled={localSelectedIds.size === 0} // Disable confirm button if no items selected
                className={`${mode === 'delete' && localSelectedIds.size > 0 ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'}`}>
              {mode === 'edit' ? t('bulkActions.confirmEditSelection', { defaultValue: 'Confirm Edit' }) : t('bulkActions.confirmDeleteSelection', { defaultValue: 'Confirm Delete' })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
