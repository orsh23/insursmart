
import React, { useState, useEffect, useCallback } from 'react';
import { CodeCategory } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from '@/components/ui/switch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { 
  ChevronRight, ChevronDown, FolderTree, Plus, Edit, Trash2, FolderPlus, Search, FilterX, AlertCircle
} from 'lucide-react';

const CategoryTreeItem = ({ 
  category, 
  level = 0, 
  onEdit, 
  onDelete, 
  onAddChild,
  expanded,
  onToggleExpand,
  children // Rendered children sub-tree
}) => {
  return (
    <div>
      <div 
        className={`
          flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md
          ${level > 0 ? (isRTL ? 'mr-6' : 'ml-6') : ''} transition-colors duration-150
        `}
      >
        <button 
          onClick={() => children && children.length > 0 && onToggleExpand(category.id)}
          className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md ${children && children.length > 0 ? '' : 'opacity-0 cursor-default'}`}
          aria-label={expanded ? "Collapse" : "Expand"}
          disabled={!children || children.length === 0}
        >
          {children && children.length > 0 ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )
          ) : (
            <div className="w-4 h-4" /> // Placeholder for alignment
          )}
        </button>
        
        <div className="flex-1 flex items-center gap-2 ml-2">
          <FolderTree className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-gray-800 dark:text-gray-200">{category.name_en || "N/A"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{category.name_he || "N/A"}</div>
             {category.specialty && (
              <Badge variant="outline" className="text-xs mt-1 bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-700/30 dark:text-purple-300 dark:border-purple-700">
                {category.specialty}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              Lvl {category.level}
            </Badge>
            {category.applies_to && category.applies_to.length > 0 && (
                 <Badge variant="outline" className="text-xs">
                    {category.applies_to.join(', ').replace(/_/g, ' ')}
                 </Badge>
            )}
            <Badge className={category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}>
              {category.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => onAddChild(category)} title="Add Subcategory">
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)} title="Edit Category">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onDelete(category)} title="Delete Category">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {expanded && children && children.length > 0 && (
        <div className={isRTL ? 'mr-6' : 'ml-6'}> {/* Ensure correct margin for RTL/LTR */}
          {children}
        </div>
      )}
    </div>
  );
};
// Helper: Check if current language context is RTL
const isRTL = document.documentElement.dir === 'rtl';

const CategoryFilterBar = ({ searchTerm, onSearchTermChange, filters, onFilterChange, onResetFilters }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div className="relative lg:col-span-1">
          <Label htmlFor="search-categories" className="sr-only">Search</Label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            id="search-categories"
            placeholder="Search by name, specialty..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div>
          <Label htmlFor="filter-category-status" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</Label>
          <Select
            id="filter-category-status"
            value={filters.is_active}
            onChange={(e) => onFilterChange("is_active", e.target.value)}
          >
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-category-applies-to" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Applies To</Label>
          <Select
            id="filter-category-applies-to"
            value={filters.applies_to}
            onChange={(e) => onFilterChange("applies_to", e.target.value)}
          >
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="medical_code">Medical Code</SelectItem>
            <SelectItem value="internal_code">Internal Code</SelectItem>
            <SelectItem value="provider_code">Provider Code</SelectItem>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onResetFilters}>
          <FilterX className="w-4 h-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};


export default function CodeCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null); // For general page errors
  const [dialogError, setDialogError] = useState(null); // For dialog-specific errors (validation, API)
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ is_active: "all", applies_to: "all" });

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null); // For editing
  const [parentCategoryForNew, setParentCategoryForNew] = useState(null); // For adding subcategory

  const defaultFormData = {
    name_en: "",
    name_he: "",
    parent_id: null,
    level: 0,
    path: "", 
    applies_to: ["medical_code"],
    is_active: true,
    specialty: ""
  };
  const [formData, setFormData] = useState(defaultFormData);
  

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const fetchedCategories = await CodeCategory.list() || [];
      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setPageError('Failed to fetch categories. Please try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchTermChange = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFiltersAndSearch = () => {
    setSearchTerm('');
    setFilters({ is_active: "all", applies_to: "all" });
  };

  const filteredCategories = useCallback(() => {
    let items = [...categories];
    const searchLower = searchTerm.toLowerCase();

    if (searchTerm) {
      items = items.filter(cat => 
        cat.name_en?.toLowerCase().includes(searchLower) ||
        cat.name_he?.toLowerCase().includes(searchLower) ||
        cat.specialty?.toLowerCase().includes(searchLower) ||
        cat.path?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.is_active !== "all") {
      items = items.filter(cat => String(cat.is_active) === filters.is_active);
    }
    if (filters.applies_to !== "all") {
      items = items.filter(cat => cat.applies_to?.includes(filters.applies_to));
    }
    
    return items;
  }, [categories, searchTerm, filters]);

  const buildCategoryTree = (items, parentId = null) => {
    return items
      .filter(category => category.parent_id === parentId)
      .map(category => ({
        ...category,
        children: buildCategoryTree(items, category.id)
      }));
  };

  const renderCategoryTreeRecursive = (treeNodes, currentLevel = 0) => { // Renamed renderCategoryTree for clarity if used elsewhere
    return treeNodes.map(item => (
      <React.Fragment key={item.id}>
        <CategoryTreeItem
          category={item}
          level={currentLevel} // Pass currentLevel
          onEdit={openDialogForEdit}
          onDelete={handleDeleteClick}
          onAddChild={openDialogForNew}
          expanded={expandedCategories.has(item.id) || false}
          onToggleExpand={handleToggleExpand}
        >
          {item.children && item.children.length > 0 && renderCategoryTreeRecursive(item.children, currentLevel + 1)}
        </CategoryTreeItem>
      </React.Fragment>
    ));
  };
  
  const handleToggleExpand = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  };

  // Dialog and form handlers
  const openDialogForNew = (parent = null) => {
    setCurrentCategory(null); 
    setParentCategoryForNew(parent);
    setDialogError(null);
    let newLevel = 0;
    if (parent) {
        newLevel = (typeof parent.level === 'number' ? parent.level : 0) + 1;
    }
    setFormData({
      ...defaultFormData,
      parent_id: parent?.id || null,
      level: newLevel,
      applies_to: parent?.applies_to || ["medical_code"], 
    });
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (category) => {
    setCurrentCategory(category);
    setParentCategoryForNew(null); 
    setDialogError(null);
    setFormData({
      name_en: category.name_en || "",
      name_he: category.name_he || "",
      parent_id: category.parent_id || null, 
      level: typeof category.level === 'number' ? category.level : 0,
      path: category.path || "", 
      applies_to: Array.isArray(category.applies_to) && category.applies_to.length > 0 ? category.applies_to : ["medical_code"],
      is_active: typeof category.is_active === 'boolean' ? category.is_active : true,
      specialty: category.specialty || ""
    });
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (e) => {
    e.preventDefault(); // Ensure form submission is handled here
    setDialogError(null);

    if (!formData.name_en.trim() || !formData.name_he.trim()) {
      setDialogError("Category names (English and Hebrew) are required.");
      return;
    }
    if (!formData.applies_to || formData.applies_to.length === 0) {
      setDialogError("At least one 'Applies To' type must be selected.");
      return;
    }

    const dataToSave = { ...formData };
    
    if(dataToSave.parent_id) {
        const parent = categories.find(c => c.id === dataToSave.parent_id);
        const parentPathForDisplay = parent ? (parent.path || parent.name_en || "") : ""; // Use path field if available
        dataToSave.path = `${parentPathForDisplay}/${dataToSave.name_en}`; 
    } else {
        dataToSave.path = dataToSave.name_en; 
    }
    
    if (parentCategoryForNew) {
        dataToSave.level = (parentCategoryForNew.level || 0) + 1;
    } else if (currentCategory && typeof currentCategory.level === 'number') {
        dataToSave.level = currentCategory.level;
    } else {
        dataToSave.level = 0; 
    }

    try {
      if (currentCategory && currentCategory.id) {
        await CodeCategory.update(currentCategory.id, dataToSave);
      } else {
        await CodeCategory.create(dataToSave);
      }
      fetchCategories(); 
      setIsDialogOpen(false);
      setCurrentCategory(null);
      setParentCategoryForNew(null);
    } catch (err) {
      console.error("Error saving category:", err);
      setDialogError(err.message || 'Failed to save category. Please try again.');
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleDeleteClick = (category) => {
    const hasChildren = categories.some(c => c.parent_id === category.id);
    if (hasChildren) {
        setPageError(`Cannot delete category "${category.name_en}". It has subcategories. Please delete them first.`);
        return;
    }
    setCategoryToDelete(category);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await CodeCategory.delete(categoryToDelete.id); 
      fetchCategories();
      setIsDeleting(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      setPageError(err.message || 'Failed to delete category.');
      setIsDeleting(false);
    }
  };
  
  const categoryTree = buildCategoryTree(filteredCategories());

  if (loading) return <LoadingSpinner text="Loading categories..." />;
      {

  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Manage Code Categories</h2>
        <Button onClick={() => openDialogForNew()} variant="default">
          <FolderPlus className="mr-2 h-4 w-4" /> Add Root Category
        </Button>
      </div>
      
      <CategoryFilterBar
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFiltersAndSearch}
      />

      {dialogError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" /> {dialogError}
        </div>
      )}
      
      {pageError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center mb-4">
          <AlertCircle className="h-4 w-4 mr-2" /> {pageError}
        </div>
      )}

      {categoryTree.length === 0 && !loading && !pageError ? (
        <EmptyState 
          icon={FolderTree}
          title="No categories found"
          message={searchTerm || filters.is_active !== "all" || filters.applies_to !== "all" ? "Try adjusting your search or filters." : "Get started by adding a root category."}
          actionButton={
            <Button onClick={() => openDialogForNew()}>
              <Plus className="mr-2 h-4 w-4" /> Add Root Category
            </Button>
          }
        />
      ) : (
        !pageError && <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {renderCategoryTreeRecursive(categoryTree)}
        </div>
      )}
      
      {isDialogOpen && (
        <CategoryDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setCurrentCategory(null); setParentCategoryForNew(null); setDialogError(null);}}
          currentItem={currentCategory}
          onSave={handleDialogSubmit}
          parentCategories={categories}
          formData={formData} {/* Pass formData state */}
          setFormData={setFormData} {/* Pass setFormData state setter */}
          dialogError={dialogError} // Pass dialogError to be displayed in dialog
        />
      )}
      {isDeleting && (
        <ConfirmationDialog
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
          onConfirm={confirmDelete}
          title="Delete Category"
          description={`Are you sure you want to delete category "${categoryToDelete?.name_en || categoryToDelete?.name_he}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}

const CategoryDialog = ({ 
    isOpen, 
    onClose, 
    currentItem, 
    onSave, 
    // parentCategories, // Not directly used in form, but could be for a parent selector if needed
    formData, 
    setFormData,
    dialogError // Receive dialogError
}) => {
  

  const appliesToOptions = [
    { value: "medical_code", label: "Medical Code" },
    { value: "internal_code", label: "Internal Code" },
    { value: "provider_code", label: "Provider Code" }
  ];
  
  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAppliesToChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentAppliesTo = prev.applies_to || []; // Ensure applies_to is an array
      const newAppliesTo = checked
        ? [...currentAppliesTo, value]
        : currentAppliesTo.filter(item => item !== value);
      return { ...prev, applies_to: newAppliesTo };
    });
  };

  const handleFormSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentItem ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave}> {/* Added form tag and onSubmit */}
            <div className="space-y-4 py-4">
              {dialogError && ( // Display dialog-specific error
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" /> {dialogError}
                </div>
              )}
              <div>
                <Label htmlFor="name_en">Name (English)</Label>
                <Input id="name_en" value={formData?.name_en || ""} onChange={handleFormInputChange} name="name_en" />
              </div>
              <div>
                <Label htmlFor="name_he">Name (Hebrew)</Label>
                <Input id="name_he" value={formData?.name_he || ""} onChange={handleFormInputChange} name="name_he" />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" value={formData?.specialty || ""} onChange={handleFormInputChange} name="specialty" />
              </div>
              <div className="space-y-2">
                <Label>Applies To</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {appliesToOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        id={`applies_to_${option.value}`}
                        value={option.value}
                        checked={(formData?.applies_to || []).includes(option.value)} // Ensure formData.applies_to is an array
                        onChange={handleAppliesToChange}
                        className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor={`applies_to_${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active_category_switch" // Changed ID to avoid conflict if Label's htmlFor was "is_active_category"
                  name="is_active"
                  checked={typeof formData?.is_active === 'boolean' ? formData.is_active : true} // Ensure default
                  onCheckedChange={(checked) => handleFormSwitchChange("is_active", checked)}
                />
                <Label htmlFor="is_active_category_switch">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={onClose}> {/* Ensure type is button if not submitting form directly */}
                Cancel
              </Button>
              <Button type="submit"> {/* Type submit for form */}
                {currentItem ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
};
