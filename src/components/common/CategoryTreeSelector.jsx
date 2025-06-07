import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { useLanguage } from '../context/LanguageContext';

/**
 * Tree selector component for hierarchical categories
 * 
 * @param {Object} props Component props
 * @param {Array} props.items Array of tree items
 * @param {string} props.selectedId Currently selected item ID
 * @param {Function} props.onSelect Selection change handler
 * @param {string} props.nameKey Key to use for item name ('name_en', 'name_he', etc)
 * @param {Array} props.expandedIds Array of expanded node IDs
 */
export default function CategoryTreeSelector({ 
  items = [],
  selectedId,
  onSelect,
  nameKey = 'name_en',
  expandedIds: initialExpandedIds = []
}) {
  const { isRTL } = useLanguage();
  const [expandedIds, setExpandedIds] = useState(new Set(initialExpandedIds));
  
  // Build tree structure from flat items
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => {
        // Root nodes have null or undefined parentId
        if (parentId === null) {
          return !item.parent_id;
        }
        // Child nodes match the parent's ID
        return item.parent_id === parentId;
      })
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  const tree = buildTree(items);
  
  // Toggle node expansion
  const toggleExpand = (itemId, event) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedIds);
    
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    
    setExpandedIds(newExpanded);
  };
  
  // Recursively render tree nodes
  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const nodeName = node[nameKey] || node.name || node.id;
    
    // Chevron icon based on expansion state and direction
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
    
    return (
      <div key={node.id} className="w-full">
        <div 
          className={cn(
            "flex items-center py-1 px-2 rounded-md cursor-pointer",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
            isRTL ? "flex-row-reverse text-right" : "text-left"
          )}
          style={{ paddingLeft: isRTL ? 8 : (level * 16) + 8, paddingRight: isRTL ? (level * 16) + 8 : 8 }}
          onClick={() => onSelect(node.id, node)}
        >
          {hasChildren && (
            <div 
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-sm hover:bg-muted-foreground/20",
                isRTL ? "ml-1" : "mr-1"
              )}
              onClick={(e) => toggleExpand(node.id, e)}
            >
              <ChevronIcon className="h-4 w-4" />
            </div>
          )}
          
          {!hasChildren && (
            <div className={cn("w-5 h-5", isRTL ? "ml-1" : "mr-1")} />
          )}
          
          <Folder className={cn("h-4 w-4 text-muted-foreground", isRTL ? "ml-2" : "mr-2")} />
          <span className="truncate">{nodeName}</span>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="w-full">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md max-h-[400px] overflow-y-auto">
      {tree.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">No categories available</div>
      ) : (
        tree.map(node => renderNode(node))
      )}
    </div>
  );
}