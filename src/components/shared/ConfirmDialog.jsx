// components/shared/ConfirmDialog.jsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";

/**
 * A reusable confirmation dialog for destructive or important actions
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onCancel - Called when user cancels
 * @param {Function} onConfirm - Called when user confirms
 * @param {string} title - Dialog title
 * @param {string} description - Optional description
 * @param {boolean} [isLoading] - Show loading state on confirm button
 */
export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  isLoading = false
}) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}