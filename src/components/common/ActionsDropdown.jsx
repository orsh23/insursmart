import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, Trash2, Copy } from "lucide-react";

export default function ActionsDropdown({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  language = "en",
  disableDelete = false,
  disableEdit = false
}) {
  const isRTL = language === "he";

  return (
    <DropdownMenu align={isRTL ? "right" : "left"} trigger={
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreVertical className="h-4 w-4" />
      </Button>
    }>
      <DropdownMenuContent>
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            <span>{isRTL ? "צפה" : "View"}</span>
          </DropdownMenuItem>
        )}
        
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} disabled={disableEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{isRTL ? "ערוך" : "Edit"}</span>
          </DropdownMenuItem>
        )}
        
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>{isRTL ? "שכפל" : "Duplicate"}</span>
          </DropdownMenuItem>
        )}
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              disabled={disableDelete}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>{isRTL ? "מחק" : "Delete"}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}