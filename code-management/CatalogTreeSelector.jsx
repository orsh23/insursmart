import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { CodeCatalog } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "../common/LoadingSpinner";

export default function CatalogTreeSelector({
  onSelect,
  selectedPath = "",
  language = "en"
}) {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const isRTL = language === "he";

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const data = await CodeCatalog.list();
      // Convert flat list to tree structure
      const tree = buildCatalogTree(data);
      setCatalog(tree);
      
      // Expand nodes in the selected path
      if (selectedPath) {
        const pathParts = selectedPath.split("/");
        const nodesToExpand = new Set();
        let currentPath = "";
        pathParts.forEach(part => {
          currentPath += (currentPath ? "/" : "") + part;
          nodesToExpand.add(currentPath);
        });
        setExpandedNodes(nodesToExpand);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildCatalogTree = (flatList) => {
    const tree = [];
    const map = {};

    // First pass: create nodes
    flatList.forEach(item => {
      map[item.id] = {
        ...item,
        children: [],
        path: item.parent_id 
          ? (map[item.parent_id]?.path || "") + "/" + item.name_en
          : item.name_en
      };
    });

    // Second pass: build tree
    flatList.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    return tree;
  };

  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const filterTree = (nodes, term) => {
    if (!term) return nodes;

    return nodes.filter(node => {
      const matchesSearch = 
        node.name_en.toLowerCase().includes(term.toLowerCase()) ||
        node.name_he.includes(term);

      const hasMatchingChildren = 
        node.children && filterTree(node.children, term).length > 0;

      return matchesSearch || hasMatchingChildren;
    });
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`
            flex items-center py-1 px-2 rounded-lg cursor-pointer
            ${isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
          `}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.path);
            }
            onSelect(node.path);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <File className="h-4 w-4 shrink-0" />
          )}
          
          <span className="ml-2 rtl:mr-2 rtl:ml-0">
            {isRTL ? node.name_he : node.name_en}
          </span>
          
          {node.level > 0 && (
            <Badge variant="outline" className="ml-2">
              Level {node.level}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 rtl:mr-4 rtl:ml-0">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredCatalog = filterTree(catalog, searchTerm);

  return (
    <div className="border rounded-lg p-4">
      <Input
        placeholder={isRTL ? "חיפוש בקטלוג..." : "Search catalog..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      
      <div className="max-h-96 overflow-y-auto">
        {filteredCatalog.map(node => renderNode(node))}
      </div>
    </div>
  );
}