
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import FormField from '@/components/shared/forms/FormField'; // Corrected import path
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { DOCTOR_PROVIDER_AFFILIATION_STATUS_OPTIONS } from '@/components/utils/options';
import { DoctorProviderAffiliation } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { formatISO } from 'date-fns';

// Zod schema removed

export default function LinkageDialog({ open, onOpenChange, affiliationData, onSubmit, isLoading }) {
  const { t } = useLanguageHook();
  const [doctors, setDoctors] = useState([]);
  const [providers, setProviders] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    // resolver: zodResolver(affiliationSchema), // Removed
    defaultValues: affiliationData ? {
        ...affiliationData,
        start_date: affiliationData.start_date ? new Date(affiliationData.start_date) : new Date(),
        end_date: affiliationData.end_date ? new Date(affiliationData.end_date) : null,
    } : {
      doctor_id: '', provider_id: '', affiliation_status: 'active', start_date: new Date(),
      is_primary_location: false, special_notes: '',
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docData, provData] = await Promise.all([Doctor.list(), Provider.list()]);
        setDoctors(Array.isArray(docData) ? docData : []);
        setProviders(Array.isArray(provData) ? provData : []);
      } catch (err) { console.error("Error fetching data for Linkage Dialog:", err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (affiliationData) {
      reset({
        ...affiliationData,
        start_date: affiliationData.start_date ? new Date(affiliationData.start_date) : new Date(),
        end_date: affiliationData.end_date ? new Date(affiliationData.end_date) : null,
      });
    } else {
       reset({
        doctor_id: '', provider_id: '', affiliation_status: 'active', start_date: new Date(),
        is_primary_location: false, special_notes: '',
      });
    }
  }, [affiliationData, reset]);

  const handleFormSubmit = (data) => {
    const dataToSubmit = {
        ...data,
        // Note: formatISO imported, but existing toISOString().split('T')[0] kept as per instructions to only apply import changes.
        start_date: data.start_date ? data.start_date.toISOString().split('T')[0] : null,
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{affiliationData ? t('linkage.editTitle', {defaultValue: 'Edit Affiliation'}) : t('linkage.addTitle', {defaultValue: 'Add Affiliation'})}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <FormField name="doctor_id" label={t('fields.doctor', {defaultValue: 'Doctor'})} control={control} errors={errors} 
            rules={{ required: t('errors.fieldRequired', {fieldName: 'Doctor'})}}
            render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Doctor'})}/></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.first_name_en} {d.last_name_en}</SelectItem>)}</SelectContent></Select>} />
          <FormField name="provider_id" label={t('fields.provider', {defaultValue: 'Provider'})} control={control} errors={errors} 
            rules={{ required: t('errors.fieldRequired', {fieldName: 'Provider'})}}
            render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Provider'})}/></SelectTrigger><SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name?.en || p.id}</SelectItem>)}</SelectContent></Select>} />
          <FormField name="affiliation_status" label={t('fields.status', {defaultValue: 'Status'})} control={control} errors={errors} render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["active", "inactive", "pending_approval"].map(s => <SelectItem key={s} value={s}>{t(`status.${s}`, {defaultValue: s})}</SelectItem>)}</SelectContent></Select>} />
          <FormField name="start_date" label={t('fields.startDate', {defaultValue: 'Start Date'})} control={control} errors={errors} 
            rules={{ required: t('errors.fieldRequired', {fieldName: 'Start Date'})}}
            render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
          <FormField name="end_date" label={t('fields.endDateOptional', {defaultValue: 'End Date (Optional)'})} control={control} errors={errors} render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
          <Controller name="is_primary_location" control={control} render={({ field }) => (<div className="flex items-center space-x-2 pt-2"><Checkbox id="is_primary_location" checked={field.value} onCheckedChange={field.onChange} /><Label htmlFor="is_primary_location">{t('fields.isPrimaryLocation', {defaultValue: 'Primary Location'})}</Label></div>)} />
          <FormField name="special_notes" label={t('fields.specialNotes', {defaultValue: 'Special Notes'})} control={control} errors={errors} 
            rules={{maxLength: {value: 1000, message: t('errors.maxLength', {max:1000})}}}
            render={(field) => <Textarea {...field} />} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">{t('buttons.cancel', {defaultValue: 'Cancel'})}</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>{isLoading ? t('buttons.saving', {defaultValue: 'Saving...'}) : t('buttons.save', {defaultValue: 'Save'})}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
