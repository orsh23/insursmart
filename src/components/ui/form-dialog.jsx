import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { cn } from '@/components/utils/cn';

/**
 * Unified FormDialog component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when dialog open state changes
 * @param {string} props.title - Dialog title
 * @param {string} [props.description] - Optional dialog description
 * @param {React.ReactNode} props.children - Dialog content (the form fields)
 * @param {function} [props.onSubmit] - Form submit handler
 * @param {function} [props.onClose] - Explicit close handler. If not provided, defaults to onOpenChange(false)
 * @param {string} [props.submitText] - Custom submit button text
 * @param {string} [props.cancelText] - Custom cancel button text
 * @param {boolean} [props.isSubmitting] - Loading/submitting state
 * @param {boolean} [props.disabled] - Disabled state for submit button
 * @param {string} [props.maxWidth] - Custom max width class (e.g., 'sm:max-w-md', 'sm:max-w-xl')
 * @param {React.ReactNode} [props.footer] - Custom footer content (overrides default buttons)
 * @param {string} [props.submitVariant] - Submit button variant ('default', 'destructive', etc.)
 * @param {boolean} [props.showCloseButton] - Show close button in header (defaults to true)
 * @param {string} [props.className] - Additional CSS classes for DialogContent
 * @param {Object} [props.formProps] - Additional props for the form element
 */
export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onClose,
  submitText,
  cancelText,
  isSubmitting = false,
  disabled = false,
  maxWidth = 'sm:max-w-lg',
  footer,
  submitVariant = 'default',
  showCloseButton = true,
  className,
  formProps = {},
  ...dialogProps
}) {
  const { t, isRTL } = useLanguageHook();

  const effectiveSubmitText = submitText || t('buttons.save', { defaultValue: 'Save' });
  const effectiveCancelText = cancelText || t('buttons.cancel', { defaultValue: 'Cancel' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSubmitting && !disabled && onSubmit) {
      onSubmit(e);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing if submitting
    if (onClose) {
      onClose();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (newOpenState) => {
    if (isSubmitting && !newOpenState) return; // Prevent closing if submitting
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange} {...dialogProps}>
      <DialogContent 
        className={cn(
          'p-0 gap-0',
          maxWidth,
          'w-full max-h-[90vh] overflow-hidden',
          isRTL && 'rtl',
          className
        )}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full" {...formProps}>
          <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </DialogDescription>
                )}
              </div>
              {showCloseButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={cn(
                    "h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                    isRTL ? 'ml-4' : 'mr-2'
                  )}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{t('buttons.close', { defaultValue: 'Close' })}</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>

          {footer ? (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          ) : (
            <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className={cn(
                "flex gap-3",
                isRTL ? 'flex-row-reverse' : 'flex-row',
                "w-full sm:w-auto sm:justify-end"
              )}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  {effectiveCancelText}
                </Button>
                <Button
                  type="submit"
                  variant={submitVariant}
                  disabled={disabled || isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  {isSubmitting && (
                    <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? 'ml-2' : 'mr-2')} />
                  )}
                  {effectiveSubmitText}
                </Button>
              </div>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}