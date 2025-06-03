import React, { useState, useEffect } from "react";
import { 
  FolderPlus, 
  Folder, 
  FolderEdit, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash 
} from "lucide-react";
import { CodeCatalog } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "../common/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";

export default function CategoryTreeManager({ language = "en" }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name_en: "",
    name_he: "",
    parent_id: null
  });

  const isRTL = language === "he";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await CodeCatalog.list();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בטעינת קטגוריות" : "Error loading categories",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = (parentId = null) => {
    setSelectedCategory(null);
    setFormData({
      name_en: "",
      name_he: "",
      parent_id: parentId
    });
    setShowDialog(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name_en: category.name_en,
      name_he: category.name_he,
      parent_id: category.parent_id
    });
    setShowDialog(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm(isRTL ? "האם למחוק קטגוריה זו?" : "Delete this category?")) return;

    try {
      await CodeCatalog.delete(categoryId);
      toast({
        title: isRTL ? "קטגוריה נמחקה" : "Category deleted",
        description: isRTL ? "הקטגוריה נמחקה בהצלחה" : "Category was successfully deleted"
      });
      fetchCategories();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה במחיקת קטגוריה" : "Error deleting category",
        description: error.message
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedCategory) {
        await CodeCatalog.update(selectedCategory.id, formData);
        toast({
          title: isRTL ? "קטגוריה עודכנה" : "Category updated",
          description: isRTL ? "הקטגוריה עודכנה בהצלחה" : "Category was successfully updated"
        });
      } else {
        await CodeCatalog.create(formData);
        toast({
          title: isRTL ? "קטגוריה נוספה" : "Category added",
          description: isRTL ? "הקטגוריה נוספה בהצלחה" : "Category was successfully added"
        });
      }
      setShowDialog(false);
      fetchCategories();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בשמירת קטגוריה" : "Error saving category",
        description: error.message
      });
    }
  };

  const toggleNode = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildCategoryTree = (parentId = null, level = 0) => {
    const children = categories.filter(cat => cat.parent_id === parentId);
    if (children.length === 0) return null;

    return (
      <ul className={`${level > 0 ? 'ml-6' : ''} space-y-2`}>
        {children.map(category => {
          const hasChildren = categories.some(cat => cat.parent_id === category.id);
          const isExpanded = expandedNodes.has(category.id);

          return (
            <li key={category.id} className="relative">
              <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100">
                {hasChildren && (
                  <button 
                    onClick={() => toggleNode(category.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="flex-1">
                  {isRTL ? category.name_he : category.name_en}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCategory(category.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isExpanded && buildCategoryTree(category.id, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          {isRTL ? "עץ קטגוריות" : "Category Tree"}
        </h2>
        <Button onClick={() => handleAddCategory()}>
          <FolderPlus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {isRTL ? "הוסף קטגוריה" : "Add Category"}
        </Button>
      </div>

      <Card className="p-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isRTL ? "אין קטגוריות להצגה" : "No categories to display"}
          </div>
        ) : (
          buildCategoryTree()
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 
                (isRTL ? "ערוך קטגוריה" : "Edit Category") : 
                (isRTL ? "הוסף קטגוריה" : "Add Category")
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRTL ? "שם באנגלית" : "Name in English"}
              </label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                placeholder={isRTL ? "הזן שם באנגלית..." : "Enter name in English..."}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRTL ? "שם בעברית" : "Name in Hebrew"}
              </label>
              <Input
                value={formData.name_he}
                onChange={(e) => setFormData({...formData, name_he: e.target.value})}
                placeholder={isRTL ? "הזן שם בעברית..." : "Enter name in Hebrew..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {isRTL ? "ביטול" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit}>
              {isRTL ? "שמור" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}