
import React, { useEffect, useState } from 'react';
    import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
    import FormField from '@/components/shared/forms/FormField';
    import { DatePicker } from '@/components/ui/date-picker';
    import { PlusCircle, Trash2 } from 'lucide-react';
    import { MedicalCode } from '@/api/entities';
    import { Material } from '@/api/entities';

    // Zod schemas removed

    export default function MaterialsBoMDialog({ open, onOpenChange, bomData, onSubmit, isLoading }) {
      const { t } = useLanguageHook();
      const [procedureCodes, setProcedureCodes] = useState([]);
      const [materialsList, setMaterialsList] = useState([]);

      const { control, handleSubmit, reset, formState: { errors } } = useForm({
        // resolver: zodResolver(materialsBoMSchema), // Removed
        defaultValues: bomData ? {
          ...bomData,
          effective_date: bomData.effective_date ? new Date(bomData.effective_date) : null,
          expiry_date: bomData.expiry_date ? new Date(bomData.expiry_date) : null,
        } : {
          procedure_code: '', materials: [{ material_id: '', quantity: 1, is_mandatory: true }],
          version: '1.0', effective_date: new Date(), status: 'draft', notes: '',
        }
      });

      const { fields, append, remove } = useFieldArray({ control, name: "materials" });

      useEffect(() => {
        const fetchData = async () => {
          try {
            const [fetchedProcedures, fetchedMaterials] = await Promise.all([
              MedicalCode.list({ filter: { code_system_in: ['CPT', 'HCPCS', 'INTERNAL'] } }),
              Material.list({ filter: { is_active: true } })
            ]);
            setProcedureCodes(Array.isArray(fetchedProcedures) ? fetchedProcedures : []);
            setMaterialsList(Array.isArray(fetchedMaterials) ? fetchedMaterials : []);
          } catch (err) {
            console.error("Failed to fetch data for Materials BoM Dialog", err);
          }
        };
        fetchData();
      }, []);

      useEffect(() => {
        if (bomData) {
          reset({
            ...bomData,
            effective_date: bomData.effective_date ? new Date(bomData.effective_date) : null,
            expiry_date: bomData.expiry_date ? new Date(bomData.expiry_date) : null,
          });
        } else {
          reset({
            procedure_code: '', materials: [{ material_id: '', quantity: 1, is_mandatory: true }],
            version: '1.0', effective_date: new Date(), status: 'draft', notes: '',
          });
        }
      }, [bomData, reset]);
      
      const handleFormSubmit = (data) => {
        const dataToSubmit = {
            ...data,
            effective_date: data.effective_date ? data.effective_date.toISOString().split('T')[0] : null,
            expiry_date: data.expiry_date ? data.expiry_date.toISOString().split('T')[0] : null,
        };
        onSubmit(dataToSubmit);
      };


      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{bomData ? t('materialsBoM.editTitle', {defaultValue: 'Edit Materials BoM'}) : t('materialsBoM.addTitle', {defaultValue: 'Add Materials BoM'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                      {procedureCodes.map(pc => <SelectItem key={pc.id} value={pc.code}>{pc.code} - {pc.description_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField name="version" label={t('fields.version', {defaultValue: 'Version'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Version'})}}
                render={(field) => <Input {...field} />} />
              <FormField name="effective_date" label={t('fields.effectiveDate', {defaultValue: 'Effective Date'})} control={control} errors={errors} 
                rules={{ required: t('errors.fieldRequired', {fieldName: 'Effective Date'})}}
                render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
              <FormField name="expiry_date" label={t('fields.expiryDate', {defaultValue: 'Expiry Date (Optional)'})} control={control} errors={errors} render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
              <FormField
                name="status"
                label={t('fields.status', {defaultValue: 'Status'})}
                control={control}
                errors={errors}
                render={(field) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["draft", "active", "deprecated"].map(s => <SelectItem key={s} value={s}>{t(`status.${s}`, {defaultValue: s})}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              
              <Label>{t('materialsBoM.materialsList', {defaultValue: 'Materials List'})}</Label>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr_100px_auto_auto] gap-2 items-end border p-2 rounded-md">
                  <FormField
                    name={`materials.${index}.material_id`}
                    label={`${t('fields.material', {defaultValue: 'Material'})} ${index + 1}`}
                    control={control}
                    errors={errors.materials?.[index]}
                    noLabel 
                    rules={{ required: t('errors.fieldRequired', {fieldName: `Material ${index + 1}`})}}
                    render={(field) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Material'})} /></SelectTrigger>
                        <SelectContent>
                          {materialsList.map(m => <SelectItem key={m.id} value={m.id}>{m.name_en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name={`materials.${index}.quantity`}
                    label={t('fields.quantity', {defaultValue: 'Qty'})}
                    control={control}
                    errors={errors.materials?.[index]}
                    noLabel
                    rules={{ required: t('errors.fieldRequired', {fieldName: `Quantity ${index + 1}`}), min: {value: 0.01, message: 'Must be positive'} }}
                    render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} placeholder={t('fields.quantity', {defaultValue: 'Qty'})} />}
                  />
                  <Controller
                    name={`materials.${index}.is_mandatory`}
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-1 pt-2 whitespace-nowrap">
                        <Checkbox id={`is_mandatory_${index}`} checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor={`is_mandatory_${index}`}>{t('fields.mandatoryShort', {defaultValue: 'Mand.'})}</Label>
                      </div>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.materials && <p className="text-sm text-red-500">{errors.materials.message || t('errors.materialsListError', {defaultValue: 'Please ensure all materials have required fields and quantities.'})}</p>}


              <Button type="button" variant="outline" size="sm" onClick={() => append({ material_id: '', quantity: 1, is_mandatory: true })} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />{t('materialsBoM.addMaterial', {defaultValue: 'Add Material to BoM'})}
              </Button>
              
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
