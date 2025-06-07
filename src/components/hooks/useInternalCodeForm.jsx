// Content of components/hooks/useInternalCodeForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InternalCode } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getInternalCodeSchema = (t) => z.object({
  code_number: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('internalCodes.fields.codeNumber') }) }),
  description_en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('internalCodes.fields.descriptionEn') }) }),
  description_he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('internalCodes.fields.descriptionHe') }) }),
  category_id: z.string().optional().nullable(),
  category_path: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  is_billable: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export function useInternalCodeForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const internalCodeSchema = getInternalCodeSchema(t);

  const form = useForm({
    resolver: zodResolver(internalCodeSchema),
    defaultValues: defaultValues || {
      is_billable: true,
      is_active: true,
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
        result = await InternalCode.update(defaultValues.id, dataToSave);
        toast({ title: t('internalCodes.updateSuccessTitle'), description: t('internalCodes.updateSuccessDetail', { name: data.code_number }) });
      } else {
        result = await InternalCode.create(dataToSave);
        toast({ title: t('internalCodes.createSuccessTitle'), description: t('internalCodes.createSuccessDetail', { name: data.code_number }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving internal code:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('internalCodes.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}