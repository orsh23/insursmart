import React, { useEffect, useState } from 'react';
    import { useForm, Controller } from 'react-hook-form';
    // import { zodResolver } from '@hookform/resolvers/zod'; // Removed
    // import * as z from 'zod'; // Removed
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import FormField from '@/components/shared/FormField';

    // Zod schema removed

    export default function MaterialDialog({ open, onOpenChange, materialData, onSubmit, isLoading }) {
      const { t } = useLanguageHook();
      const { control, handleSubmit, reset, formState: { errors } } = useForm({
        // resolver: zodResolver(materialSchema), // Removed
        defaultValues: materialData || {
          name_en: '', name_he: '', description_en: '', description_he: '',
          unit_of_measure: 'unit', catalog_path: '', base_price: 0, currency: 'ILS', is_active: true,
        }
      });

      useEffect(() => {
        if (materialData) {
          reset(materialData);
        } else {
          reset({
            name_en: '', name_he: '', description_en: '', description_he: '',
            unit_of_measure: 'unit', catalog_path: '', base_price: 0, currency: 'ILS', is_active: true,
          });
        }
      }, [materialData, reset]);

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{materialData ? t('materials.editTitle', {defaultValue: 'Edit Material'}) : t('materials.addTitle', {defaultValue: 'Add Material'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField name="name_en" label={t('fields.nameEn', {defaultValue: 'Name (EN)'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'English Name'})}}
                render={(field) => <Input {...field} />} />
              <FormField name="name_he" label={t('fields.nameHe', {defaultValue: 'Name (HE)'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Hebrew Name'})}}
                render={(field) => <Input {...field} />} />
              <FormField name="description_en" label={t('fields.descriptionEn', {defaultValue: 'Description (EN)'})} control={control} errors={errors} render={(field) => <Textarea {...field} />} />
              <FormField name="description_he" label={t('fields.descriptionHe', {defaultValue: 'Description (HE)'})} control={control} errors={errors} render={(field) => <Textarea {...field} />} />
              <FormField
                name="unit_of_measure"
                label={t('fields.unitOfMeasure', {defaultValue: 'Unit of Measure'})}
                control={control}
                errors={errors}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["unit", "mg", "ml", "g", "kg", "box", "pack"].map(unit => <SelectItem key={unit} value={unit}>{t(`units.${unit}`, {defaultValue: unit})}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField name="catalog_path" label={t('fields.catalogPath', {defaultValue: 'Catalog Path'})} control={control} errors={errors} render={(field) => <Input {...field} />} />
              <FormField name="base_price" label={t('fields.basePrice', {defaultValue: 'Base Price'})} control={control} errors={errors} type="number" rules={{ min: 0 }} render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />} />
              <FormField name="currency" label={t('fields.currency', {defaultValue: 'Currency'})} control={control} errors={errors} render={(field) => <Input {...field} />} />
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="material_is_active" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="material_is_active">{t('fields.isActive', {defaultValue: 'Active'})}</Label>
                  </div>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{t('buttons.cancel', {defaultValue: 'Cancel'})}</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? t('buttons.saving', {defaultValue: 'Saving...'}) : t('buttons.save', {defaultValue: 'Save'})}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    }