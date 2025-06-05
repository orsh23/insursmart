import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageHook } from '@/components/useLanguageHook';
import LoadingSpinner from '@/components/ui/loading-spinner'; // Assuming this exists
import { Search } from 'lucide-react';

const BulkSelectionModal = ({
  isOpen,
  onClose,
  items = [], // All items available for selection
  itemDisplayFn = (item) => item.name || item.id, // Function to get display name
  onConfirmSelection, // Callback with array of selected item IDs or single item for edit
  actionType, // 'edit' or 'delete'
  entityNamePlural, // e.g., "Providers"
  loadingItems = false, // If items are being loaded asynchronously
}) => {
  const { t } = useLanguageHook();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set()); // Reset selection when modal opens
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      itemDisplayFn(item).toLowerCase().includes(lowerSearchTerm) ||
      (item.id && String(item.id).toLowerCase().includes(lowerSearchTerm))
    );
  }, [items, searchTerm, itemDisplayFn]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (itemId, checked) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      if (actionType === 'edit') { // For edit, only allow one selection
        newSelectedIds.clear();
      }
      newSelectedIds.add(itemId);
    } else {
      newSelectedIds.delete(itemId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleConfirm = () => {
    onConfirmSelection(Array.from(selectedIds));
    onClose();
  };
  
  const title = actionType === 'edit' 
    ? t('bulkActions.selectToEditTitle', { entity: entityNamePlural, defaultValue: `Select ${entityNamePlural} to Edit` })
    : t('bulkActions.selectToDeleteTitle', { entity: entityNamePlural, defaultValue: `Select ${entityNamePlural} to Delete` });

  const confirmButtonText = actionType === 'edit'
    ? t('buttons.editSelected', {defaultValue: 'Edit Selected'})
    : t('buttons.deleteSelected', {defaultValue: 'Delete Selected'});

  const isAllFilteredSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const isSomeFilteredSelected = selectedIds.size > 0 && selectedIds.size < filteredItems.length;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder={t('bulkActions.searchPlaceholder', { entity: entityNamePlural, defaultValue: `Search ${entityNamePlural}...` })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
        </div>

        {loadingItems ? (
            <div className="flex-grow flex items-center justify-center">
                <LoadingSpinner message={t('bulkActions.loadingItems', {entity: entityNamePlural, defaultValue: `Loading ${entityNamePlural}...`})} />
            </div>
        ) : (
        <ScrollArea className="flex-grow border rounded-md dark:border-gray-700">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllFilteredSelected}
                    indeterminate={isSomeFilteredSelected && !isAllFilteredSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={actionType === 'edit' && filteredItems.length > 1} // Disable select all for edit if multiple items shown
                    aria-label={t('bulkActions.selectAll', {defaultValue: "Select all"})}
                  />
                </TableHead>
                <TableHead className="dark:text-gray-300">{t('fields.name', {defaultValue: 'Name'})}</TableHead>
                <TableHead className="dark:text-gray-300">{t('fields.id', {defaultValue: 'ID'})}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <TableRow key={item.id} data-state={selectedIds.has(item.id) && "selected"} className="dark:hover:bg-gray-700/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => handleSelectRow(item.id, checked)}
                      aria-label={`${t('bulkActions.selectItem', {defaultValue: 'Select item'})} ${itemDisplayFn(item)}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium dark:text-gray-300">{itemDisplayFn(item)}</TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{item.id}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-gray-500 dark:text-gray-400">
                        {t('bulkActions.noItemsFound', {entity: entityNamePlural, defaultValue: `No ${entityNamePlural} found.`})}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        )}

        <DialogFooter className="mt-4 pt-4 border-t dark:border-gray-600">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
              {t('buttons.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0 || (actionType==='edit' && selectedIds.size > 1)}>
            {confirmButtonText} ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSelectionModal;