import React from "react";
import ReactDOM from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

let resolveCallback;

export function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  confirmLabel = "Continue",
  cancelLabel = "Cancel" 
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveCallback(false)}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => resolveCallback(true)}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function confirm(options = {}) {
  const { 
    title = "Are you sure?", 
    description = "This action cannot be undone.",
    confirmLabel,
    cancelLabel
  } = options;

  return new Promise((resolve) => {
    resolveCallback = resolve;
    const root = document.createElement("div");
    root.setAttribute("id", "confirm-dialog");
    document.body.appendChild(root);

    const cleanup = () => {
      document.body.removeChild(root);
    };

    const onOpenChange = (open) => {
      if (!open) {
        cleanup();
        resolve(false);
      }
    };

    const element = (
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
      />
    );

    ReactDOM.render(element, root);
  });
}