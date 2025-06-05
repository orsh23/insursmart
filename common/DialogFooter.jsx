import React from 'react';
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/utils/i18n";

export default function DialogFooter({ 
  onCancel, 
  isSubmitting = false,
  saveLabel,
  cancelLabel,
  className = ""
}) {
  const { t, isRTL } = useTranslation();
  
  return (
    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 ${className}`}>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="transition-all duration-200"
      >
        {saveLabel || t('common.save')}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel || t('common.cancel')}
      </Button>
    </div>
  );
}