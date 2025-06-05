import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { Task } from '@/api/entities';
import { useTranslation } from '../utils/i18n';

// Define default options if not available from constants
const DEFAULT_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
];

const DEFAULT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const DEFAULT_CATEGORY_OPTIONS = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' }
];

export function useTaskForm(initialTask = null, onSuccess) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getInitialState = useCallback(() => ({
    title: '',
    description: '',
    status: DEFAULT_STATUS_OPTIONS[0]?.value || 'todo',
    priority: DEFAULT_PRIORITY_OPTIONS[1]?.value || 'medium',
    category: DEFAULT_CATEGORY_OPTIONS[0]?.value || 'personal',
    due_date: '',
    ...(initialTask || {})
  }), [initialTask]);

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialState());
    setErrors({});
  }, [initialTask, getInitialState]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = t('validation.required', { field: t('tasks.title') });
    }

    // Other validations if needed (due_date format etc.)
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setErrors({});
  }, [getInitialState]);

  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      let savedTask;
      if (initialTask?.id) {
        savedTask = await Task.update(initialTask.id, formData);
        toast({ title: t('tasks.updateSuccess') });
      } else {
        savedTask = await Task.create(formData);
        toast({ title: t('tasks.createSuccess') });
      }
      if (onSuccess) onSuccess(savedTask);
      return true;
    } catch (error) {
      console.error("Error saving task:", error);
      const errorMessage = error.response?.data?.detail || error.message || t('tasks.saveError');
      toast({ variant: "destructive", title: t('tasks.saveError'), description: errorMessage });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialTask, onSuccess, t, toast, validate]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    statusOptions: DEFAULT_STATUS_OPTIONS,
    priorityOptions: DEFAULT_PRIORITY_OPTIONS,
    categoryOptions: DEFAULT_CATEGORY_OPTIONS
  };
}