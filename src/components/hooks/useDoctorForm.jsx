// Content of components/hooks/useDoctorForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Doctor } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';
import { getDoctorSchema } from '@/components/schemas/doctor-schema';


export function useDoctorForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const doctorSchema = getDoctorSchema(t);

  const form = useForm({
    resolver: zodResolver(doctorSchema),
    defaultValues: defaultValues || {
      first_name_en: '',
      last_name_en: '',
      first_name_he: '',
      last_name_he: '',
      license_number: '',
      specialties: [],
      sub_specialties: [],
      phone: '',
      email: '',
      city: '', // Legacy
      address: '', // Legacy
      address_id: null, // New structured address
      status: 'active',
      tags: [],
      notes: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let result;
      // Ensure array fields are always arrays, even if empty
      const dataToSave = {
        ...data,
        specialties: Array.isArray(data.specialties) ? data.specialties : [],
        sub_specialties: Array.isArray(data.sub_specialties) ? data.sub_specialties : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      };

      if (defaultValues?.id) {
        result = await Doctor.update(defaultValues.id, dataToSave);
        const doctorName = data.first_name_en && data.last_name_en ? `${data.first_name_en} ${data.last_name_en}` : defaultValues.id;
        toast({ title: t('doctors.updateSuccessTitle'), description: t('doctors.updateSuccessDetail', { name: doctorName }) });
      } else {
        result = await Doctor.create(dataToSave);
        const doctorName = data.first_name_en && data.last_name_en ? `${data.first_name_en} ${data.last_name_en}` : result.id;
        toast({ title: t('doctors.createSuccessTitle'), description: t('doctors.createSuccessDetail', { name: doctorName }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving doctor:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('doctors.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}