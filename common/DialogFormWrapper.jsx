import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

/**
 * Wrapper component for dialog-based forms
 */
export default function DialogFormWrapper({
  open,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  cancelLabel,
  footerActions,
  showCloseButton = true,
  className = '',
  disabled = false,
}) {
  const { t } = useLanguageHook();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md md:max-w-lg ${className}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
              type="button"
              aria-label={t('common.close', { defaultValue: 'Close' })}
              disabled={isSubmitting || disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {children}

          <DialogFooter className="flex flex-row justify-end gap-2 mt-6 pt-4 border-t">
            {footerActions || (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting || disabled}
                >
                  {cancelLabel || t('common.cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || disabled}
                  className="relative"
                >
                  {isSubmitting && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  )}
                  <span className={isSubmitting ? 'invisible' : ''}>
                    {submitLabel || t('common.save', { defaultValue: 'Save' })}
                  </span>
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}