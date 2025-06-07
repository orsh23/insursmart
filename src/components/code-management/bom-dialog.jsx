import React, { useEffect } from 'react';
    import { useForm, Controller } from 'react-hook-form';
    // import { zodResolver } from '@hookform/resolvers/zod'; // Removed
    // import * as z from 'zod'; // Removed
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Textarea } from '@/components/ui/textarea';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import FormField from '@/components/shared/FormField';

    // Zod schema removed

    export default function BoMDialog({ open, onOpenChange, bomData, onSubmit, isLoading, insuranceCodes = [], materials = [] }) {
      const { t } = useLanguageHook();
      const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        // resolver: zodResolver(bomSchema), // Removed
        defaultValues: bomData || {
          insurance_code_id: '',
          material_id: '',
          variant_id: '',
          variant_label: '',
          quantity_type: 'fixed',
          quantity_fixed: 1,
          quantity_unit: 'item',
          reimbursable_flag: true,
          notes: '',
        }
      });

      const watchedQuantityType = watch("quantity_type");

      useEffect(() => {
        if (bomData) {
          reset(bomData);
        } else {
           reset({
            insurance_code_id: '', material_id: '', variant_id: '', variant_label: '',
            quantity_type: 'fixed', quantity_fixed: 1, quantity_unit: 'item',
            reimbursable_flag: true, notes: '',
          });
        }
      }, [bomData, reset]);

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{bomData ? t('boms.editTitle', {defaultValue: 'Edit Bill of Material Line'}) : t('boms.addTitle', {defaultValue: 'Add Bill of Material Line'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                name="insurance_code_id"
                label={t('fields.insuranceCode', {defaultValue: 'Insurance Code'})}
                control={control}
                errors={errors}
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Insurance Code'})}}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Insurance Code'})} /></SelectTrigger>
                    <SelectContent>
                      {insuranceCodes.map(ic => <SelectItem key={ic.id} value={ic.id}>{ic.code} - {ic.name_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                name="material_id"
                label={t('fields.material', {defaultValue: 'Material'})}
                control={control}
                errors={errors}
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Material'})}}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Material'})} /></SelectTrigger>
                    <SelectContent>
                      {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField name="variant_id" label={t('fields.variantId', {defaultValue: 'Variant ID (Optional)'})} control={control} errors={errors} render={(field) => <Input {...field} />} />
              <FormField name="variant_label" label={t('fields.variantLabel', {defaultValue: 'Variant Label (Optional)'})} control={control} errors={errors} render={(field) => <Input {...field} />} />

              <FormField
                name="quantity_type"
                label={t('fields.quantityType', {defaultValue: 'Quantity Type'})}
                control={control}
                errors={errors}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{t('quantityTypes.fixed', {defaultValue: 'Fixed'})}</SelectItem>
                      <SelectItem value="range">{t('quantityTypes.range', {defaultValue: 'Range'})}</SelectItem>
                      <SelectItem value="average">{t('quantityTypes.average', {defaultValue: 'Average'})}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {watchedQuantityType === 'fixed' && <FormField name="quantity_fixed" label={t('fields.quantityFixed', {defaultValue: 'Quantity'})} control={control} errors={errors} type="number" rules={{ min: { value:0, message: 'Must be positive' } }} render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />} />}
              {watchedQuantityType === 'range' && (
                <>
                  <FormField name="quantity_min" label={t('fields.quantityMin', {defaultValue: 'Min Quantity'})} control={control} errors={errors} type="number" rules={{ min: { value:0, message: 'Must be positive' } }} render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
                  <FormField name="quantity_max" label={t('fields.quantityMax', {defaultValue: 'Max Quantity'})} control={control} errors={errors} type="number" rules={{ min: { value:0, message: 'Must be positive' } }} render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
                </>
              )}
              {watchedQuantityType === 'average' && <FormField name="quantity_avg" label={t('fields.quantityAvg', {defaultValue: 'Avg Quantity'})} control={control} errors={errors} type="number" rules={{ min: { value:0, message: 'Must be positive' } }} render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} /> }
              
              <FormField
                name="quantity_unit"
                label={t('fields.quantityUnit', {defaultValue: 'Quantity Unit'})}
                control={control}
                errors={errors}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {["item", "mg", "ml", "g", "kg", "box", "pack"].map(unit => <SelectItem key={unit} value={unit}>{t(`units.${unit}`, {defaultValue: unit})}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name="reimbursable_flag"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="reimbursable_flag" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="reimbursable_flag">{t('fields.reimbursable', {defaultValue: 'Reimbursable'})}</Label>
                  </div>
                )}
              />
              <FormField name="notes" label={t('fields.notes', {defaultValue: 'Notes'})} control={control} errors={errors} render={(field) => <Textarea {...field} />} />

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{t('buttons.cancel', {defaultValue: 'Cancel'})}</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? t('buttons.saving', {defaultValue: 'Saving...'}) : t('buttons.save', {defaultValue: 'Save'})}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    }