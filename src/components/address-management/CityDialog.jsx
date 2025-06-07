
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Label is imported but not explicitly used in the JSX below
import { useLanguageHook } from '@/components/useLanguageHook';
import { City } from '@/api/entities'; // Assuming this is for type definition elsewhere
import { useToast } from "@/components/ui/use-toast"; // Imported but not used in this snippet
import FormField from '@/components/shared/forms/FormField'; // Corrected path
import BilingualInput from '@/components/forms/BilingualInput'; // Re-added as it's used in the JSX

const CityDialog = ({ isOpen, onClose, onSave, cityData, isSaving }) => {
  const { t } = useLanguageHook();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name_en: '',
      name_he: '',
      code: '',
    },
    mode: 'onTouched', // Validate on blur/change
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form fields when dialog opens or cityData changes
      reset({
        name_en: cityData?.name_en || '',
        name_he: cityData?.name_he || '',
        code: cityData?.code || '',
      });
    }
  }, [cityData, isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {cityData ? t('cities.editTitle', { defaultValue: 'Edit City' }) : t('cities.addTitle', { defaultValue: 'Add New City' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
          {/* Bilingual Input for name_en and name_he */}
          <Controller
            name="name_en"
            control={control}
            rules={{ required: t('validation.requiredField', { field: t('fields.nameEn', {defaultValue: 'Name (English)'}) }) }}
            render={({ field: { onChange: onChangeEn, value: valueEn } }) => (
              <Controller
                name="name_he"
                control={control}
                rules={{ required: t('validation.requiredField', { field: t('fields.nameHe', {defaultValue: 'Name (Hebrew)'}) }) }}
                render={({ field: { onChange: onChangeHe, value: valueHe } }) => (
                  <BilingualInput
                    labelEn={t('fields.nameEn', { defaultValue: 'Name (English)' })}
                    labelHe={t('fields.nameHe', { defaultValue: 'Name (Hebrew)' })}
                    valueEn={valueEn}
                    valueHe={valueHe}
                    onChangeEn={onChangeEn}
                    onChangeHe={onChangeHe}
                    fieldId="cityName"
                    errorEn={errors.name_en?.message}
                    errorHe={errors.name_he?.message}
                    dir={'ltr'}
                  />
                )}
              />
            )}
          />

          {/* Code Input */}
          <Controller
            name="code"
            control={control}
            // Add validation rules for code if necessary (e.g., required)
            // rules={{ required: t('validation.requiredField', { field: t('fields.code', { defaultValue: 'Code' }) }) }}
            render={({ field }) => (
              <FormField label={t('fields.code', { defaultValue: 'Code' })} error={errors.code?.message} htmlFor="code">
                <Input
                  id="code"
                  placeholder={t('cities.codePlaceholder', { defaultValue: 'e.g., IL-POST-123' })}
                  {...field} // Spreads name, value, onChange, onBlur, ref
                />
              </FormField>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving} // Disable cancel button while saving
            >
              {t('buttons.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {cityData ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CityDialog;
