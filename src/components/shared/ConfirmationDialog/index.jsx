import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  titleHe,
  description,
  descriptionHe,
  confirmLabel,
  confirmLabelHe,
  cancelLabel,
  cancelLabelHe,
  variant = "default",
  language = "en"
}) {
  const isRTL = language === "he";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRTL ? titleHe : title}
          </DialogTitle>
          {(description || descriptionHe) && (
            <p className="text-sm text-gray-500">
              {isRTL ? descriptionHe : description}
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {isRTL 
              ? cancelLabelHe || "ביטול"
              : cancelLabel || "Cancel"
            }
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {isRTL 
              ? confirmLabelHe || "אישור"
              : confirmLabel || "Confirm"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}