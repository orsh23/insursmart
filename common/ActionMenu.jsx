import React, { useState } from "react";
import { 
  ChevronDown,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActionMenu({
  onImport,
  onExport,
  onEdit,
  onDelete,
  onDuplicate,
  onPrint,
  language = "en",
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const isRTL = language === "he";
  
  const handleAction = (action) => {
    setOpen(false);
    
    if (typeof action === 'function') {
      action();
    }
  };
  
  const handleClickOutside = (e) => {
    if (open) {
      setOpen(false);
    }
  };
  
  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        disabled={disabled}
      >
        {isRTL ? "פעולות" : "Actions"}
        <ChevronDown className={`h-4 w-4 ml-2 ${open ? 'transform rotate-180' : ''}`} />
      </Button>
      
      {open && (
        <div 
          className="absolute right-0 mt-1 bg-white shadow-lg rounded-md border w-48 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ul>
            {onImport && (
              <li>
                <button
                  onClick={() => handleAction(onImport)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isRTL ? "ייבוא" : "Import"}
                </button>
              </li>
            )}
            
            {onExport && (
              <li>
                <button
                  onClick={() => handleAction(onExport)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isRTL ? "ייצוא" : "Export"}
                </button>
              </li>
            )}
            
            {onEdit && (
              <li>
                <button
                  onClick={() => handleAction(onEdit)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isRTL ? "עריכה" : "Edit"}
                </button>
              </li>
            )}
            
            {onDuplicate && (
              <li>
                <button
                  onClick={() => handleAction(onDuplicate)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isRTL ? "שכפל" : "Duplicate"}
                </button>
              </li>
            )}
            
            {onPrint && (
              <li>
                <button
                  onClick={() => handleAction(onPrint)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isRTL ? "הדפסה" : "Print"}
                </button>
              </li>
            )}
            
            {onDelete && (
              <li>
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isRTL ? "מחיקה" : "Delete"}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}