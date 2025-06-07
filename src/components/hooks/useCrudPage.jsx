import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../ui/use-toast';
import { messages } from '../utils/messages';

export default function useCrudPage({
  entitySDK,
  formHook,
  entityNameSingular = 'Item',
  entityNamePlural = 'Items',
  filterFunction = null,
  defaultFilters = {},
  defaultSort = '-created_date',
  pageSize = 100
}) {
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);
  
  // Data state
  const [allItems, setAllItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  
  const { toast } = useToast();
  
  // Initialize the form hook
  const formHookResults = formHook ? formHook(currentEntity, allItems) : {};
  
  const {
    formData = {},
    formErrors = {},
    isSubmitting = false,
    updateField = () => {},
    updateNestedField = () => {},
    validateForm = async () => true,
    resetForm = () => {},
    setFormData = () => {},
    ...formHookRest
  } = formHookResults;
  
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await entitySDK.list(defaultSort, pageSize);
      
      const safeData = Array.isArray(data) ? data : [];
      setAllItems(safeData);
    } catch (err) {
      console.error(`Error fetching ${entityNamePlural}:`, err);
      setError(err.message || `Failed to load ${entityNamePlural.toLowerCase()}`);
      toast({
        title: `Failed to load ${entityNamePlural.toLowerCase()}`,
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [entitySDK, defaultSort, pageSize, entityNamePlural, toast]);
  
  // Initial data fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Form submit handler
  const handleFormSubmit = useCallback(async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    try {
      const isValid = await validateForm();
      if (!isValid) return;
      
      if (currentEntity?.id) {
        await entitySDK.update(currentEntity.id, formData);
        toast({
          title: messages.success.update(entityNameSingular)
        });
      } else {
        await entitySDK.create(formData);
        toast({
          title: messages.success.create(entityNameSingular)
        });
      }
      
      setIsDialogOpen(false);
      setCurrentEntity(null);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(`Error saving ${entityNameSingular.toLowerCase()}:`, err);
      toast({
        title: `Failed to save ${entityNameSingular.toLowerCase()}`,
        description: err.message,
        variant: 'destructive'
      });
    }
  }, [currentEntity, entityNameSingular, entitySDK, fetchItems, formData, toast, validateForm, resetForm]);
  
  // Dialog handlers
  const openCreateDialog = useCallback(() => {
    setCurrentEntity(null);
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);
  
  const openEditDialog = useCallback((entity) => {
    if (!entity) {
      console.warn('Attempted to edit null entity');
      toast({
        title: 'Warning',
        description: 'Cannot edit: Invalid item selected',
        variant: 'warning'
      });
      return;
    }
    setCurrentEntity(entity);
    setFormData(entity);
    setIsDialogOpen(true);
  }, [setFormData]);
  
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setCurrentEntity(null);
    resetForm();
  }, [resetForm]);
  
  // Filter handlers
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSingleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilters(defaultFilters);
  }, [defaultFilters]);
  
  // Delete handler
  const handleDelete = useCallback(async (id) => {
    if (!id) {
      console.warn('Attempted to delete item with no ID');
      return;
    }
    
    try {
      await entitySDK.delete(id);
      toast({
        title: messages.success.delete(entityNameSingular)
      });
      fetchItems();
    } catch (err) {
      toast({
        title: `Failed to delete ${entityNameSingular.toLowerCase()}`,
        description: err.message,
        variant: 'destructive'
      });
    }
  }, [entitySDK, entityNameSingular, fetchItems, toast]);
  
  return {
    // Data state
    allItems,
    loading,
    error,
    fetchItems,
    
    // Search and Filter state & handlers
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    handleSingleFilterChange,
    resetAllFilters,
    
    // Dialog state & handlers
    isDialogOpen,
    currentEntity,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    
    // Form state & handlers
    formData,
    formErrors,
    isSubmitting,
    updateField,
    updateNestedField,
    validateForm,
    resetForm,
    setFormData,
    handleFormSubmit,
    handleDelete,
    
    // Pass through any additional properties from the form hook
    ...formHookRest
  };
}