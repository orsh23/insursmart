// Content of components/hooks/useSelection.js
import { useState, useCallback } from 'react';

/**
 * Hook to manage selection state for a list of items.
 * @param {Array<string|number>} initialSelectedIds - Array of initially selected item IDs.
 * @param {string} idField - The field name that represents the unique ID of an item (default: 'id').
 * @returns {{
 *  selectedIds: Set<string|number>,
 *  isItemSelected: (id: string|number) => boolean,
 *  toggleSelection: (id: string|number) => void,
 *  selectAll: (itemIds: Array<string|number>) => void,
 *  deselectAll: () => void,
 *  setSelectedIds: (ids: Set<string|number> | Array<string|number>) => void,
 *  toggleSelectAll: (itemIds: Array<string|number>, allCurrentlySelected?: boolean) => void
 * }}
 */
export default function useSelection(initialSelectedIds = [], idField = 'id') {
  const [selectedIds, setSelectedIdsState] = useState(new Set(initialSelectedIds));

  const isItemSelected = useCallback(
    (id) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelection = useCallback((id) => {
    setSelectedIdsState(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return newSelectedIds;
    });
  }, []);

  const selectAll = useCallback((itemIds = []) => {
    setSelectedIdsState(new Set(itemIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIdsState(new Set());
  }, []);

  // Allow direct setting of selected IDs, converting array to Set if necessary
  const setSelectedIds = useCallback((ids) => {
    if (Array.isArray(ids)) {
      setSelectedIdsState(new Set(ids));
    } else if (ids instanceof Set) {
      setSelectedIdsState(ids);
    } else {
      console.warn('setSelectedIds expects an array or a Set.');
      setSelectedIdsState(new Set()); // Default to empty set on invalid input
    }
  }, []);
  
  /**
   * Toggles selection for all provided item IDs.
   * If allCurrentlySelected is true (or all itemIds are already in selectedIds), deselects all.
   * Otherwise, selects all provided itemIds.
   * @param {Array<string|number>} itemIds - The list of all item IDs to consider for "select all".
   * @param {boolean} [allCurrentlySelected] - Optional: explicitly state if all itemIds are currently selected.
   *                                          If not provided, it will be derived.
   */
  const toggleSelectAll = useCallback((itemIds, allCurrentlySelected) => {
    let _allSelected = allCurrentlySelected;
    if (typeof _allSelected === 'undefined') {
        _allSelected = itemIds.length > 0 && itemIds.every(id => selectedIds.has(id));
    }

    if (_allSelected) {
        deselectAll();
    } else {
        selectAll(itemIds);
    }
  }, [selectedIds, selectAll, deselectAll]);


  return {
    selectedIds,
    isItemSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    setSelectedIds, // Expose the direct setter
    toggleSelectAll,
  };
}