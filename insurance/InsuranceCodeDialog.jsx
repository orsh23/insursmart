import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import InsuranceCodeForm from './InsuranceCodeForm'; // We'll create this next

export default function InsuranceCodeDialog({
  isOpen,
  onClose,
  currentItem,
  onSave
}) {
  const { t } = useLanguageHook();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Error saving insurance code:", err);
      setError(t('errors.saveFailed', { 
        defaultValue: 'Failed to save insurance code. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = currentItem
    ? t('insuranceCodes.editCode', { defaultValue: 'Edit Insurance Code' })
    : t('insuranceCodes.addCode', { defaultValue: 'Add New Insurance Code' });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <InsuranceCodeForm 
          initialData={currentItem} 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <DialogFooter className="mt-6">
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
            form="insuranceCodeForm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {t('common.saving', { defaultValue: 'Saving...' })}
              </>
            ) : (
              t('common.save', { defaultValue: 'Save' })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}