// Content of components/hooks/useTaskForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';
import { User } from '@/api/entities'; // For fetching user list for assignee

const getTaskSchema = (t) => z.object({
  title: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('tasks.fields.title', {defaultValue: 'Title'}) }) }),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['claim_review', 'provider_onboarding', 'contract_negotiation', 'compliance_check', 'data_validation', 'system_maintenance', 'training', 'general']).default('general'),
  due_date: z.date().optional().nullable(),
  assigned_to: z.string().email({ message: t('validation.invalidEmailFormat') }).optional().nullable(), // Assuming assigned_to is user email
  // created_by is usually set by the backend or context
  tags: z.array(z.string()).optional().default([]),
  related_entity_type: z.enum(['provider', 'doctor', 'claim', 'rfc', 'contract', 'policy', 'none']).default('none').optional().nullable(),
  related_entity_id: z.string().optional().nullable(),
  estimated_hours: z.coerce.number().optional().nullable(),
  actual_hours: z.coerce.number().optional().nullable(),
});

export function useTaskForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const taskSchema = getTaskSchema(t);

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues ? {
        ...defaultValues,
        due_date: defaultValues.due_date ? new Date(defaultValues.due_date) : null,
        tags: defaultValues.tags || [],
    } : {
      status: 'todo',
      priority: 'medium',
      category: 'general',
      related_entity_type: 'none',
      tags: [],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        due_date: data.due_date?.toISOString().split('T')[0], // Format YYYY-MM-DD
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
      };
      
      // If created_by needs to be set on client (e.g. for immediate display, though backend should verify/set this)
      // const currentUser = await User.me(); // This could be fetched higher up
      // if (!dataToSave.id && currentUser) { // Only for new tasks
      //   dataToSave.created_by = currentUser.email;
      // }


      let result;
      if (defaultValues?.id) {
        result = await Task.update(defaultValues.id, dataToSave);
        toast({ title: t('tasks.updateSuccessTitle'), description: t('tasks.updateSuccessDetail', { name: data.title }) });
      } else {
        result = await Task.create(dataToSave);
        toast({ title: t('tasks.createSuccessTitle'), description: t('tasks.createSuccessDetail', { name: data.title }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('tasks.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}