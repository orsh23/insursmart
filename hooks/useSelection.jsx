// hooks/useSelection.js
import { useCallback, useState } from 'react';

/**
 * Hook for managing selection of items (e.g. checkboxes)
 * @param {Array<string>} initialIds - Initial selected IDs
 */
export default function useSelection(initialIds = []) {
  const [selectedIds, setSelectedIds] = useState(new Set(initialIds));

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const set = useCallback((ids) => setSelectedIds(new Set(ids)), []);

  const all = Array.from(selectedIds);

  return {
    all,
    isSelected,
    toggle,
    select,
    deselect,
    clear,
    set,
    count: selectedIds.size
  };
}