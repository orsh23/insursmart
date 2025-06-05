import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormField from '@/components/common/FormField'; // Import FormField
import { DatePicker } from '@/components/ui/date-picker'; // Assuming DatePicker exists
import { useTaskForm } from './hooks/useTaskForm'; // Assuming this hook
import { useTranslation } from '@/components/utils/i18n';
import { TASK_STATUS_OPTIONS_FOR_SELECT } from '@/components/utils/constants'; // For status and priority

// Define priority options here or import from constants if they become shared
const TASK_PRIORITY_OPTIONS = [
    { value: 'low', labelKey: 'tasks.priorityLow' },
    { value: 'medium', labelKey: 'tasks.priorityMedium' },
    { value: 'high', labelKey: 'tasks.priorityHigh' },
];
const TASK_CATEGORY_OPTIONS = [ // Assuming these are defined in i18n or constants
    { value: 'work', labelKey: 'tasks.categoryWork' },
    { value: 'personal', labelKey: 'tasks.categoryPersonal' },
    { value: 'shopping', labelKey: 'tasks.categoryShopping' },
    { value: 'health', labelKey: 'tasks.categoryHealth' },
    { value: 'learning', labelKey: 'tasks.categoryLearning' },
];


export default function TaskDialogForm({ open, onOpenChange, task, onSave }) {
  const { t, currentLanguage, isRTL } = useTranslation();
  const { formData, updateField, handleSubmit, errors, isSubmitting, resetForm } = useTaskForm(task);

  const handleDialogStateChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const processSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSubmit(); // handleSubmit from hook should handle toasts
    if (success) {
      onSave(); // This will typically close dialog and refresh list
      handleDialogStateChange(false);
    }
  };
  
  const statusOptions = TASK_STATUS_OPTIONS_FOR_SELECT.map(opt => ({...opt, label: t(opt.labelKey)}));
  const priorityOptions = TASK_PRIORITY_OPTIONS.map(opt => ({...opt, label: t(opt.labelKey)}));
  const categoryOptions = TASK_CATEGORY_OPTIONS.map(opt => ({...opt, label: t(opt.labelKey)}));

  return (
    <Dialog open={open} onOpenChange={handleDialogStateChange}>
      <DialogContent className="sm:max-w-[480px] transition-opacity duration-200 ease-in-out" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t(task ? 'tasks.editTask' : 'tasks.newTask')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={processSubmit} className="space-y-1 pt-4">
          <FormField id="title" label={t('tasks.title')} error={errors.title} isRTL={isRTL}>
            <Input
              id="title"
              autoFocus
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField id="description" label={t('tasks.description')} error={errors.description} isRTL={isRTL}>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField id="status" label={t('common.status')} error={errors.status} isRTL={isRTL}>
              <Select value={formData.status || ''} onValueChange={(value) => updateField('status', value)} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder={t('common.selectStatus')} /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="priority" label={t('tasks.priority')} error={errors.priority} isRTL={isRTL}>
              <Select value={formData.priority || ''} onValueChange={(value) => updateField('priority', value)} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder={t('tasks.selectPriority')} /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField id="category" label={t('common.category')} error={errors.category} isRTL={isRTL}>
                <Select value={formData.category || ''} onValueChange={(value) => updateField('category', value)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder={t('tasks.selectCategory')} /></SelectTrigger>
                    <SelectContent>
                    {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </FormField>
            <FormField id="due_date" label={t('tasks.dueDate')} error={errors.due_date} isRTL={isRTL}>
              <DatePicker
                id="due_date"
                selected={formData.due_date ? new Date(formData.due_date) : null}
                onSelect={(date) => updateField('due_date', date ? date.toISOString().split('T')[0] : '')}
                language={currentLanguage}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={() => handleDialogStateChange(false)} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}