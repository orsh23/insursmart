import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguageHook } from '@/components/useLanguageHook';
import { cn } from '@/components/utils/cn';

export default function TaskFormFields({ formData, formErrors, updateField, isSubmitting }) {
  const { t, isRTL } = useLanguageHook();

  const statusOptions = [
    { value: 'todo', labelKey: 'tasks.status.todo' },
    { value: 'in_progress', labelKey: 'tasks.status.inprogress' },
    { value: 'done', labelKey: 'tasks.status.done' },
  ];

  const priorityOptions = [
    { value: 'low', labelKey: 'tasks.priority.low' },
    { value: 'medium', labelKey: 'tasks.priority.medium' },
    { value: 'high', labelKey: 'tasks.priority.high' },
  ];

  const categoryOptions = [
    { value: 'work', labelKey: 'tasks.category.work' },
    { value: 'personal', labelKey: 'tasks.category.personal' },
    { value: 'shopping', labelKey: 'tasks.category.shopping' },
    { value: 'health', labelKey: 'tasks.category.health' },
    { value: 'learning', labelKey: 'tasks.category.learning' },
  ];
  
  const fieldClass = "mb-4";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      {/* Title Field */}
      <div className={fieldClass}>
        <label htmlFor="task-title" className={labelClass}>
          {t('tasks.title', {defaultValue: "Title"})} <span className="text-red-500">*</span>
        </label>
        <Input
          id="task-title"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder={t('tasks.titlePlaceholder', {defaultValue: "Enter task title"})}
          disabled={isSubmitting}
          className={cn(formErrors.title ? 'border-red-500' : '')}
        />
        {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
      </div>

      {/* Description Field */}
      <div className={fieldClass}>
        <label htmlFor="task-description" className={labelClass}>
          {t('tasks.description', {defaultValue: "Description"})}
        </label>
        <Textarea
          id="task-description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t('tasks.descriptionPlaceholder', {defaultValue: "Enter task description"})}
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Field */}
        <div className={fieldClass}>
          <label htmlFor="task-status" className={labelClass}>
            {t('common.status', {defaultValue: "Status"})}
          </label>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value)} disabled={isSubmitting}>
            <SelectTrigger id="task-status">
              <SelectValue placeholder={t('common.selectPlaceholder', {field: t('common.status')})} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey, {defaultValue: option.value.charAt(0).toUpperCase() + option.value.slice(1)})}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Field */}
        <div className={fieldClass}>
          <label htmlFor="task-priority" className={labelClass}>
            {t('common.priority', {defaultValue: "Priority"})}
          </label>
          <Select value={formData.priority} onValueChange={(value) => updateField('priority', value)} disabled={isSubmitting}>
            <SelectTrigger id="task-priority">
              <SelectValue placeholder={t('common.selectPlaceholder', {field: t('common.priority')})} />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey, {defaultValue: option.value.charAt(0).toUpperCase() + option.value.slice(1)})}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Field */}
        <div className={fieldClass}>
          <label htmlFor="task-category" className={labelClass}>
            {t('common.category', {defaultValue: "Category"})}
          </label>
          <Select value={formData.category} onValueChange={(value) => updateField('category', value)} disabled={isSubmitting}>
            <SelectTrigger id="task-category">
              <SelectValue placeholder={t('common.selectPlaceholder', {field: t('common.category')})} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey, {defaultValue: option.value.charAt(0).toUpperCase() + option.value.slice(1)})}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date Field */}
        <div className={fieldClass}>
          <label htmlFor="task-due-date" className={labelClass}>
            {t('tasks.dueDate', {defaultValue: "Due Date"})}
          </label>
          <Input
            id="task-due-date"
            type="date"
            value={formData.due_date || ''}
            onChange={(e) => updateField('due_date', e.target.value || null)}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}