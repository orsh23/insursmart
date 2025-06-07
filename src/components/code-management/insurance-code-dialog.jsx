
import React, { useEffect } from 'react';
    import { useForm, Controller } from 'react-hook-form';
    // import { zodResolver } from '@hookform/resolvers/zod'; // Removed
    // import * as z from 'zod'; // Removed
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
// Corrected FormField import path
    import FormField from '@/components/shared/forms/FormField';

    // Zod schema removed. Basic validation can be done via react-hook-form's built-in validation if needed.

    export default function InsuranceCodeDialog({ open, onOpenChange, codeData, onSubmit, isLoading }) {
      const { t } = useLanguageHook();
      const { control, handleSubmit, reset, formState: { errors } } = useForm({
        // resolver: zodResolver(insuranceCodeSchema), // Removed
        defaultValues: codeData || {
          code: '',
          name_en: '',
          name_he: '',
          category_path: '',
          requires_preauthorization: false,
          is_active: true,
        }
      });

      useEffect(() => {
        if (codeData) {
          reset(codeData);
        } else {
          reset({
            code: '',
            name_en: '',
            name_he: '',
            category_path: '',
            requires_preauthorization: false,
            is_active: true,
          });
        }
      }, [codeData, reset]);

      const handleFormSubmit = (data) => {
        // Add basic manual validation if needed before calling onSubmit
        // Example: if (!data.code) { /* set error or toast */ return; }
        onSubmit(data);
      };

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{codeData ? t('insuranceCodes.editTitle', {defaultValue: 'Edit Insurance Code'}) : t('insuranceCodes.addTitle', {defaultValue: 'Add Insurance Code'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              {/* For required fields, you can add react-hook-form's 'required' rule */}
              <FormField name="code" label={t('fields.code', {defaultValue: 'Code'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Code'})}} // Example basic validation
                render={(field) => <Input {...field} />} 
              />
              <FormField name="name_en" label={t('fields.nameEn', {defaultValue: 'Name (English)'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'English Name'})}}
                render={(field) => <Input {...field} />} 
              />
              <FormField name="name_he" label={t('fields.nameHe', {defaultValue: 'Name (Hebrew)'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Hebrew Name'})}}
                render={(field) => <Input {...field} />} 
              />
              <FormField name="category_path" label={t('fields.categoryPath', {defaultValue: 'Category Path'})} control={control} errors={errors} render={(field) => <Input {...field} />} />
              
              <Controller
                name="requires_preauthorization"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="requires_preauthorization" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="requires_preauthorization">{t('fields.requiresPreauthorization', {defaultValue: 'Requires Preauthorization'})}</Label>
                  </div>
                )}
              />
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="is_active">{t('fields.isActive', {defaultValue: 'Active'})}</Label>
                  </div>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t('buttons.cancel', {defaultValue: 'Cancel'})}</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('buttons.saving', {defaultValue: 'Saving...'}) : t('buttons.save', {defaultValue: 'Save'})}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    }
