
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../ui/popover';
import { 
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem, 
  CommandList
} from '../ui/command';
import { CodeCatalog } from '../.@/api/entities/CodeCatalog';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../utils/cn';
import { Check, ChevronsUpDown, FolderTree } from 'lucide-react';

export default function CategoryTreeSelector({
  value,
  onChange,
  placeholder = '',
  error,
  readOnly = false,
  className = '',
  inputClassName = '',
  // Allow passing a custom root path for different catalog types
  catalogType = 'code', // 'code', 'material', etc.
  showSelectedPath = true,
  onCategoryIdChange // Optional callback for when only the ID should be updated
}) {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const commandRef = useRef(null);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Use the appropriate entity based on catalogType
      let catalogEntity = CodeCatalog;
      
      // Fetch categories - we'd need to implement the CodeCatalog.list() method
      // For now, let's return a sample structure
      const categoriesList = await catalogEntity.list();
      
      // Convert to tree structure or use as is if already structured
      setCategories(categoriesList || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // This effect fetches categories when the selector is first opened
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories();
    }
  }, [open]);

  // Helper to recursively render category tree
  const renderCategories = (items, level = 0) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    return items.map((category) => {
      const hasChildren = Array.isArray(category.children) && category.children.length > 0;
      const categoryName = isRTL && category.name_he ? category.name_he : category.name_en;
      const fullPath = category.path || categoryName;
      const indentClass = `pl-${Math.min(level * 2 + 2, 8)}`;
      
      return (
        <React.Fragment key={category.id}>
          <CommandItem
            className={cn(indentClass, "flex items-center")}
            value={fullPath}
            onSelect={() => {
              // Handle selection
              if (onCategoryIdChange) {
                onCategoryIdChange(category.id);
              }
              if (onChange) {
                onChange(category.path || categoryName);
              }
              setOpen(false);
            }}
          >
            <div className="flex items-center">
              {hasChildren ? (
                <FolderTree className="mr-2 h-4 w-4 opacity-70" />
              ) : (
                <div className="w-4 mr-2" />
              )}
              <span>{categoryName}</span>
            </div>
            {(value === fullPath || value === category.id) && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </CommandItem>
          
          {hasChildren && renderCategories(category.children, level + 1)}
        </React.Fragment>
      );
    });
  };
  
  // This is for the demo - in a real app, we would populate from the API
  // Mock tree structure
  const mockCategories = [
    {
      id: "cat_1",
      name_en: "Cardiovascular",
      name_he: "לב וכלי דם",
      level: 0,
      path: "Cardiovascular",
      children: [
        {
          id: "cat_1_1",
          name_en: "Heart",
          name_he: "לב",
          level: 1,
          path: "Cardiovascular/Heart",
          children: [
            {
              id: "cat_1_1_1",
              name_en: "Arrhythmia",
              name_he: "הפרעות קצב",
              level: 2,
              path: "Cardiovascular/Heart/Arrhythmia"
            },
            {
              id: "cat_1_1_2",
              name_en: "Valve Disease",
              name_he: "מחלות מסתמים",
              level: 2,
              path: "Cardiovascular/Heart/Valve Disease"
            }
          ]
        },
        {
          id: "cat_1_2",
          name_en: "Vascular",
          name_he: "כלי דם",
          level: 1,
          path: "Cardiovascular/Vascular",
          children: [
            {
              id: "cat_1_2_1",
              name_en: "Arterial",
              name_he: "עורקי",
              level: 2,
              path: "Cardiovascular/Vascular/Arterial"
            }
          ]
        }
      ]
    },
    {
      id: "cat_2",
      name_en: "Orthopedics",
      name_he: "אורתופדיה",
      level: 0,
      path: "Orthopedics",
      children: [
        {
          id: "cat_2_1",
          name_en: "Spine",
          name_he: "עמוד שדרה",
          level: 1,
          path: "Orthopedics/Spine"
        },
        {
          id: "cat_2_2",
          name_en: "Joints",
          name_he: "מפרקים",
          level: 1,
          path: "Orthopedics/Joints",
          children: [
            {
              id: "cat_2_2_1",
              name_en: "Knee",
              name_he: "ברך",
              level: 2,
              path: "Orthopedics/Joints/Knee"
            },
            {
              id: "cat_2_2_2",
              name_en: "Hip",
              name_he: "ירך",
              level: 2,
              path: "Orthopedics/Joints/Hip"
            }
          ]
        }
      ]
    }
  ];
  
  // Filtering function for the search
  const getFilteredCategories = () => {
    if (!search) return categories.length ? categories : mockCategories;
    
    // Simple filtering logic - in a real app this would be more sophisticated
    const searchLower = search.toLowerCase();
    
    const filterCategory = (category) => {
      const nameEn = category.name_en?.toLowerCase() || '';
      const nameHe = category.name_he?.toLowerCase() || '';
      const path = category.path?.toLowerCase() || '';
      
      const matches = 
        nameEn.includes(searchLower) || 
        nameHe.includes(searchLower) ||
        path.includes(searchLower);
      
      if (matches) return true;
      
      if (Array.isArray(category.children)) {
        category.children = category.children.filter(filterCategory);
        return category.children.length > 0;
      }
      
      return false;
    };
    
    // Copy and filter the categories
    const categoriesCopy = JSON.parse(JSON.stringify(categories.length ? categories : mockCategories));
    return categoriesCopy.filter(filterCategory);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={readOnly}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error ? "border-red-500" : "",
              inputClassName
            )}
          >
            {showSelectedPath ? (
              <span className="truncate">{value || placeholder || t('common.selectCategory')}</span>
            ) : (
              <span className="truncate">{value ? t('common.categorySelected') : placeholder || t('common.selectCategory')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-80 max-h-[500px] overflow-y-auto">
          <Command ref={commandRef}>
            <CommandInput
              placeholder={t('common.searchCategories')}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="p-2">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                  <CommandGroup>
                    {renderCategories(getFilteredCategories())}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
