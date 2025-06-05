import React, { useEffect, useState } from 'react';
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
    import { MedicalCode } from '@/api/entities';

    // Zod schema removed

    export default function DiagnosisProcedureMappingDialog({ open, onOpenChange, mappingData, onSubmit, isLoading }) {
      const { t } = useLanguageHook();
      const [medicalCodes, setMedicalCodes] = useState([]);

      const { control, handleSubmit, reset, formState: { errors } } = useForm({
        // resolver: zodResolver(mappingSchema), // Removed
        defaultValues: mappingData || {
          diagnosis_code: '',
          procedure_code: '',
          mapping_type: 'primary',
          notes: '',
          is_active: true,
        }
      });

      useEffect(() => {
        const fetchMedicalCodes = async () => {
          try {
            const codes = await MedicalCode.list();
            setMedicalCodes(Array.isArray(codes) ? codes.filter(c => c.status === 'active') : []);
          } catch (err) {
            console.error("Failed to fetch medical codes for DxPx mapping dialog", err);
          }
        };
        fetchMedicalCodes();
      }, []);

      useEffect(() => {
        if (mappingData) {
          reset(mappingData);
        } else {
          reset({ diagnosis_code: '', procedure_code: '', mapping_type: 'primary', notes: '', is_active: true });
        }
      }, [mappingData, reset]);

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{mappingData ? t('dxPxMapping.editTitle', {defaultValue: 'Edit Dx/Px Mapping'}) : t('dxPxMapping.addTitle', {defaultValue: 'Add Dx/Px Mapping'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                name="diagnosis_code"
                label={t('fields.diagnosisCode', {defaultValue: 'Diagnosis Code'})}
                control={control}
                errors={errors}
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Diagnosis Code'})}}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Diagnosis Code'})} /></SelectTrigger>
                    <SelectContent>
                      {medicalCodes.filter(mc => mc.code_system?.includes('ICD')).map(mc => <SelectItem key={mc.id} value={mc.code}>{mc.code} - {mc.description_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                name="procedure_code"
                label={t('fields.procedureCode', {defaultValue: 'Procedure Code'})}
                control={control}
                errors={errors}
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Procedure Code'})}}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Procedure Code'})} /></SelectTrigger>
                    <SelectContent>
                      {medicalCodes.filter(mc => mc.code_system?.includes('CPT') || mc.code_system?.includes('HCPCS') || mc.code_system?.includes('PCS')).map(mc => <SelectItem key={mc.id} value={mc.code}>{mc.code} - {mc.description_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                name="mapping_type"
                label={t('fields.mappingType', {defaultValue: 'Mapping Type'})}
                control={control}
                errors={errors}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">{t('mappingTypes.primary', {defaultValue: 'Primary'})}</SelectItem>
                      <SelectItem value="secondary">{t('mappingTypes.secondary', {defaultValue: 'Secondary'})}</SelectItem>
                      <SelectItem value="conditional">{t('mappingTypes.conditional', {defaultValue: 'Conditional'})}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField name="notes" label={t('fields.notes', {defaultValue: 'Notes'})} control={control} errors={errors} render={(field) => <Textarea {...field} />} />
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="is_active_dxpx" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="is_active_dxpx">{t('fields.isActive', {defaultValue: 'Active'})}</Label>
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