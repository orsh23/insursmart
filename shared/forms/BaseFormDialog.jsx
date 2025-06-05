import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguageHook } from '@/components/useLanguageHook';
import { X } from 'lucide-react';

export default function BaseFormDialog({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText,
  isSubmitting = false,
  submitDisabled = false,
  size = 'default',
  showCloseButton = true,
  className = ''
}) {
  const { t, isRTL } = useLanguageHook();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !isSubmitting && !submitDisabled) {
      onSubmit(e);
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${sizeClasses[size]} ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto">
            {children}
          </div>
          
          <div className={`flex gap-3 pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting 
                ? t('common.saving', { defaultValue: 'Saving...' })
                : (submitText || t('common.save', { defaultValue: 'Save' }))
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}