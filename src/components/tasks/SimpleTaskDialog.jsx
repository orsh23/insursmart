
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormDialog from "@/components/ui/form-dialog";
import { useLanguageHook } from "@/components/useLanguageHook";
import { Task } from "@/api/entities"; // Assuming Task is an interface or type definition

// Basic dialog with minimal functionality
export default function SimpleTaskDialog({ task, onClose, onSave, isOpen }) {
  const { t } = useLanguageHook(); // Assuming useLanguageHook provides a 't' function for translations

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    category: task?.category || 'work',
    // Ensure due_date is in YYYY-MM-DD format for date input
    due_date: task?.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : ''
  });

  // Handler for text input and textarea changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for Select component changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // This function is called when FormDialog's submit button is clicked
  // FormDialog is expected to handle e.preventDefault() internally.
  const handleSubmit = () => {
    if (onSave) {
      onSave({
        ...task, // Merge with existing task properties (e.g., id)
        ...formData // Apply updated form data
      });
    }
    // FormDialog's onOpenChange should ideally handle closing after submit,
    // or you can call onClose() here if FormDialog doesn't automatically close.
    // For this implementation, we assume FormDialog's onOpenChange covers closing.
  };

  // This function is called when FormDialog's cancel button or close mechanism is used
  const handleCancel = () => {
    onClose();
  };

  const dialogTitle = task ? t('edit_task') : t('add_task');
  const dialogDescription = task ? t('edit_task_description_form') : t('add_task_description_form');

  // Options for the Select components
  const statusOptions = ['todo', 'in_progress', 'done', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];
  const categoryOptions = ['work', 'personal', 'shopping', 'health', 'finance', 'other'];

  return (
    <FormDialog
      open={isOpen} // Controls the visibility of the dialog
      onOpenChange={onClose} // Callback when the dialog's open state changes (e.g., closed by user action)
      title={dialogTitle}
      description={dialogDescription}
      onSubmit={handleSubmit} // Function called when the dialog's save/submit button is clicked
      onCancel={handleCancel} // Function called when the dialog's cancel button is clicked
      submitButtonText={t('save')}
      cancelButtonText={t('cancel')}
    >
      {/* The content within the form dialog */}
      <div className="grid gap-4 py-4">
        {/* Title Input */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="title" className="text-right">
            {t('title')}
          </label>
          <Input
            id="title"
            name="title" // Added name prop for consistent handling
            value={formData.title}
            onChange={handleInputChange}
            className="col-span-3"
            required
          />
        </div>

        {/* Description Textarea */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="description" className="text-right">
            {t('description')}
          </label>
          <Textarea
            id="description"
            name="description" // Added name prop
            value={formData.description}
            onChange={handleInputChange}
            className="col-span-3 h-24"
          />
        </div>

        {/* Status Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="status" className="text-right">
            {t('status')}
          </label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
            <SelectTrigger id="status" className="col-span-3">
              <SelectValue placeholder={t('select_status')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="priority" className="text-right">
            {t('priority')}
          </label>
          <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
            <SelectTrigger id="priority" className="col-span-3">
              <SelectValue placeholder={t('select_priority')} />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="category" className="text-right">
            {t('category')}
          </label>
          <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
            <SelectTrigger id="category" className="col-span-3">
              <SelectValue placeholder={t('select_category')} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date Input */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="due_date" className="text-right">
            {t('due_date')}
          </label>
          <Input
            id="due_date"
            name="due_date" // Added name prop
            type="date"
            value={formData.due_date}
            onChange={handleInputChange}
            className="col-span-3"
          />
        </div>
      </div>
    </FormDialog>
  );
}
