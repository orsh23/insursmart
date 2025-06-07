import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Provider } from '@/api/entities';
import ProviderForm from './ProviderForm';
import { useProviderForm } from '../hooks/useProviderForm';
import { useTranslation } from '@/components/utils/i18n';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProviderDrawer({ open, onClose, provider, onSave, language: propLanguage }) {
  const { t, isRTL, currentLanguage: contextLanguage } = useTranslation();
  const language = propLanguage || contextLanguage;

  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit, // This comes from useProviderForm -> useDialogForm
    resetForm
  } = useProviderForm({
    initialData: provider,
    onSubmit: async (dataToSave) => { // This is the specific submit logic
      if (provider && provider.id) {
        await Provider.update(provider.id, dataToSave);
      } else {
        await Provider.create(dataToSave);
      }
      if (onSave) onSave(); // Trigger re-fetch in parent & close drawer via parent state
    },
    onClose: () => { // This onClose is for the useDialogForm hook
      resetForm();
      onClose(); // This onClose is the prop from the parent component
    },
    language: language
  });
  
  const handleDrawerClose = () => {
    resetForm(); // Reset form data when drawer is closed externally
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleDrawerClose} dir={isRTL ? 'rtl' : 'ltr'}>
      <SheetContent className="sm:max-w-lg w-[90vw] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>
            {provider ? t('providers.editProvider') : t('providers.newProvider')}
          </SheetTitle>
          {provider && (
             <SheetDescription>
                {t('providers.editingProviderDetailsFor', { providerName: isRTL ? provider.name?.he : provider.name?.en })}
             </SheetDescription>
          )}
        </SheetHeader>
        
        <ScrollArea className="flex-grow p-6">
            <ProviderForm
                formData={formData}
                errors={errors}
                isSubmitting={isSubmitting}
                updateField={updateField}
                handleSubmit={handleSubmit} // Pass the hook's handleSubmit
                onCancel={handleDrawerClose} // Drawer's close, which also resets form
            />
        </ScrollArea>
        {/* Footer is now part of ProviderForm using DialogFooter */}
      </SheetContent>
    </Sheet>
  );
}