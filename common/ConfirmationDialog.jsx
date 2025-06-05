import React from 'react';
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
import { Button } from "@/components/ui/button";
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default", // "default" or "destructive"
}) {
  const { t, isRTL } = useLanguageHook();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose} dir={isRTL ? 'rtl' : 'ltr'}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || t('common.confirmActionTitle', { defaultValue: "Are you sure?" })}</AlertDialogTitle>
          {description && <AlertDialogDescription className="py-4">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              {cancelText || t('common.cancel', { defaultValue: "Cancel" })}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => { e.preventDefault(); onConfirm(); }} // Prevent default form submission if inside form
              className={`${variant === "destructive" ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              {confirmText || t('common.confirm', { defaultValue: "Confirm" })}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}