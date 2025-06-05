import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * A hook for managing CRUD operations in data tables
 * @param {string} entityName - Name of the entity being managed
 * @param {string} language - Current language (en/he)
 * @returns {Object} Table state and operations
 */
export function useCrudTable(entityName, language = "en") {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const isRTL = language === "he";

  /**
   * Handles the deletion of selected items
   * @param {Function} deleteFunction - Function to delete an item by ID
   * @returns {Promise<boolean>} Success status
   */
  const handleDeleteSelected = useCallback(async (deleteFunction) => {
    try {
      setLoading(true);
      
      // Delete all selected items
      await Promise.all(selectedIds.map(id => deleteFunction(id)));
      
      // Show success message
      toast({
        title: isRTL 
          ? `${selectedIds.length} פריטים נמחקו בהצלחה` 
          : `${selectedIds.length} items deleted successfully`
      });
      
      // Reset selection state
      setSelectedIds([]);
      setEditMode(false);
      
      return true;
    } catch (error) {
      console.error("Deletion error:", error);
      
      // Show error message
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה במחיקת פריטים" : "Error deleting items",
        description: error.message
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedIds, isRTL, toast]);

  /**
   * Clears the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setEditMode(false);
  }, []);

  return {
    editMode,
    setEditMode,
    selectedIds,
    setSelectedIds,
    loading,
    setLoading,
    handleDeleteSelected,
    clearSelection
  };
}