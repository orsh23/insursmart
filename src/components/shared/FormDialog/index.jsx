import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Reusable form dialog component
 */
export default function FormDialog({
  open,
  onOpenChange,
  title,
  titleHe,
  description,
  descriptionHe,
  children,
  onSubmit,
  onCancel,
  submitLabel,
  submitLabelHe,
  cancelLabel,
  cancelLabelHe,
  loading = false,
  size = "default",
  language = "en"
}) {
  const isRTL = language === "he";
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit();
  };
  
  const dialogSize = {
    small: "sm:max-w-[425px]",
    default: "sm:max-w-[600px]",
    large: "sm:max-w-[800px]",
    xl: "sm:max-w-[1000px]"
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${dialogSize[size]}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? titleHe || title : title}
            </DialogTitle>
            {(description || descriptionHe) && (
              <p className="text-sm text-gray-500">
                {isRTL ? descriptionHe || description : description}
              </p>
            )}
          </DialogHeader>
          
          <div className="py-4">
            {children}
          </div>
          
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || onOpenChange}
              disabled={loading}
            >
              {isRTL 
                ? cancelLabelHe || "ביטול" 
                : cancelLabel || "Cancel"
              }
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
            >
              {loading 
                ? (isRTL ? "שומר..." : "Saving...") 
                : (isRTL 
                  ? submitLabelHe || "שמור"
                  : submitLabel || "Save"
                )
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}