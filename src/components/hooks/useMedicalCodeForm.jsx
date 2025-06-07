// Content of components/hooks/useMedicalCodeForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MedicalCode } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

export const getMedicalCodeSchema = (t) => z.object({
  code: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('medicalCodes.fields.code') }) }),
  code_system: z.enum(['ICD9-DX', 'ICD10-CM', 'ICD10-PCS', 'CPT', 'HCPCS', 'ICD9-PROC'], {
    required_error: t('validation.requiredField', { fieldName: t('medicalCodes.fields.codeSystem') }),
  }),
  description_en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('medicalCodes.fields.descriptionEn') }) }),
  description_he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('medicalCodes.fields.descriptionHe') }) }),
  tags: z.array(z.string()).optional().default([]),
  catalog_path: z.string().optional().nullable(),
  status: z.enum(['active', 'deprecated']).default('active'),
});


export function useMedicalCodeForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const medicalCodeSchema = getMedicalCodeSchema(t);

  const form = useForm({
    resolver: zodResolver(medicalCodeSchema),
    defaultValues: defaultValues || {
      code_system: 'CPT', // A common default, adjust as needed
      status: 'active',
      tags: [],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(s => s.trim()).filter(Boolean) : []),
      };
      let result;
      if (defaultValues?.id) {
        result = await MedicalCode.update(defaultValues.id, dataToSave);
        toast({ title: t('medicalCodes.updateSuccessTitle'), description: t('medicalCodes.updateSuccessDetail', { name: data.code }) });
      } else {
        result = await MedicalCode.create(dataToSave);
        toast({ title: t('medicalCodes.createSuccessTitle'), description: t('medicalCodes.createSuccessDetail', { name: data.code }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving medical code:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('medicalCodes.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}