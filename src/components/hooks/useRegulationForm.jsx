// Content of components/hooks/useRegulationForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Regulation } from '@/api/entities'; 
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

// Define Zod schema for Regulation
const getRegulationSchema = (t) => z.object({
  title_en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.titleEn', { defaultValue: 'Title (EN)' }) }) }),
  title_he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.titleHe', { defaultValue: 'Title (HE)' }) }) }),
  description_en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.descriptionEn', { defaultValue: 'Description (EN)' }) }) }),
  description_he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.descriptionHe', { defaultValue: 'Description (HE)' }) }) }),
  regulation_type: z.enum(['Insurance', 'Healthcare', 'Internal', 'Legal', 'Other'], {
    required_error: t('validation.requiredField', { fieldName: t('fields.regulationType', { defaultValue: 'Regulation Type' }) }),
  }),
  is_active: z.boolean().default(true),
  effective_date: z.date({ required_error: t('validation.requiredField', { fieldName: t('fields.effectiveDate', { defaultValue: 'Effective Date' }) }) }),
  end_date: z.date().optional().nullable(),
  document_url: z.string().url({ message: t('validation.invalidUrl', { fieldName: t('fields.documentUrl', { defaultValue: 'Document URL' }) }) }).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
}).refine(data => !data.end_date || data.effective_date <= data.end_date, {
  message: t('regulations.validation.endDateAfterEffective', { defaultValue: "End date must be after or same as effective date." }),
  path: ['end_date'],
});


export function useRegulationForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const regulationSchema = getRegulationSchema(t);

  const form = useForm({
    resolver: zodResolver(regulationSchema),
    defaultValues: defaultValues ? {
        ...defaultValues,
        effective_date: defaultValues.effective_date ? new Date(defaultValues.effective_date) : null,
        end_date: defaultValues.end_date ? new Date(defaultValues.end_date) : null,
        tags: defaultValues.tags || [],
    } : {
      is_active: true,
      tags: [],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        effective_date: data.effective_date?.toISOString().split('T')[0], // Format to YYYY-MM-DD
        end_date: data.end_date?.toISOString().split('T')[0],
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(s=>s.trim()).filter(Boolean) : [])
      };

      let result;
      if (defaultValues?.id) {
        result = await Regulation.update(defaultValues.id, dataToSave);
        toast({ title: t('regulations.updateSuccessTitle'), description: t('regulations.updateSuccessDetail', { title: data.title_en }) });
      } else {
        result = await Regulation.create(dataToSave);
        toast({ title: t('regulations.createSuccessTitle'), description: t('regulations.createSuccessDetail', { title: data.title_en }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving regulation:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('regulations.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}