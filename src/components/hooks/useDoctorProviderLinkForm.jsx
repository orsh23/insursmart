// Content of components/hooks/useDoctorProviderLinkForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DoctorProviderAffiliation } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getLinkageSchema = (t) => z.object({
  doctor_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.doctor', { defaultValue: 'Doctor' }) }) }),
  provider_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.provider', { defaultValue: 'Provider' }) }) }),
  affiliation_status: z.enum(['active', 'inactive', 'pending_approval']).default('active'),
  start_date: z.date({ required_error: t('validation.requiredField', { fieldName: t('fields.startDate', { defaultValue: 'Start Date' }) }) }),
  end_date: z.date().optional().nullable(),
  is_primary_location: z.boolean().default(false),
  special_notes: z.string().max(1000, { message: t('validation.maxLength', { fieldName: t('fields.specialNotes'), maxLength: 1000 }) }).optional().nullable(),
}).refine(data => !data.end_date || data.start_date <= data.end_date, {
  message: t('linkage.validation.endDateAfterStart', { defaultValue: "End date must be after or same as start date." }),
  path: ['end_date'],
});

export function useDoctorProviderLinkForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const linkageSchema = getLinkageSchema(t);

  const form = useForm({
    resolver: zodResolver(linkageSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      start_date: defaultValues.start_date ? new Date(defaultValues.start_date) : null,
      end_date: defaultValues.end_date ? new Date(defaultValues.end_date) : null,
      is_primary_location: defaultValues.is_primary_location || false,
    } : {
      affiliation_status: 'active',
      is_primary_location: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        start_date: data.start_date?.toISOString().split('T')[0], // Format YYYY-MM-DD
        end_date: data.end_date?.toISOString().split('T')[0],
      };

      let result;
      if (defaultValues?.id) {
        result = await DoctorProviderAffiliation.update(defaultValues.id, dataToSave);
        toast({ title: t('linkage.updateSuccessTitle'), description: t('linkage.updateSuccessDetail', { id: defaultValues.id }) });
      } else {
        result = await DoctorProviderAffiliation.create(dataToSave);
        toast({ title: t('linkage.createSuccessTitle'), description: t('linkage.createSuccessDetail', { id: result.id }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving linkage:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('linkage.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error;
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}