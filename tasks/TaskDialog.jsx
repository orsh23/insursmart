import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Tag, User, Users, Layers, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from '@/components/ui/loading-spinner'; // Corrected path
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, TASK_RELATED_ENTITY_TYPES } from '@/components/utils/constants'; // Assuming this file exists and exports these

// Helper function to safely parse date
const safeParseDate = (dateString) => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
};

export default function TaskDialog({ isOpen, onClose, onSubmit, taskData, users = [], currentUserEmail }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const resetForm = useCallback(() => {
    const initialTags = Array.isArray(taskData?.tags) ? taskData.tags : [];
    setFormData({
      title: taskData?.title || '',
      description: taskData?.description || '',
      status: taskData?.status || TASK_STATUSES[0]?.value || 'todo',
      priority: taskData?.priority || TASK_PRIORITIES[0]?.value || 'medium',
      category: taskData?.category || TASK_CATEGORIES[0]?.value || 'general',
      due_date: taskData?.due_date ? format(safeParseDate(taskData.due_date) || new Date(), 'yyyy-MM-dd') : '',
      assigned_to: taskData?.assigned_to || (users.length > 0 ? users[0].value : ''),
      related_entity_type: taskData?.related_entity_type || TASK_RELATED_ENTITY_TYPES[0]?.value || 'none',
      related_entity_id: taskData?.related_entity_id || '',
      estimated_hours: taskData?.estimated_hours || '',
      actual_hours: taskData?.actual_hours || '',
      tags: initialTags,
    });
    setErrors({});
    setTagInput('');
  }, [taskData, users, TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES, TASK_RELATED_ENTITY_TYPES]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTagAdd = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        handleChange('tags', [...formData.tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) {
      newErrors.title = t('tasks.errors.titleRequired', {defaultValue: 'Title is required'});
    }
    if (formData.estimated_hours && (isNaN(parseFloat(formData.estimated_hours)) || parseFloat(formData.estimated_hours) < 0)) {
      newErrors.estimated_hours = t('tasks.errors.invalidHours', {defaultValue: 'Estimated hours must be a non-negative number'});
    }
    if (formData.actual_hours && (isNaN(parseFloat(formData.actual_hours)) || parseFloat(formData.actual_hours) < 0)) {
      newErrors.actual_hours = t('tasks.errors.invalidHours', {defaultValue: 'Actual hours must be a non-negative number'});
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: t('errors.validationErrorTitle', {defaultValue: "Validation Error"}),
        description: t('errors.validationErrorDescription', {defaultValue: "Please check the form for errors."}),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const dataToSubmit = {
      ...formData,
      due_date: formData.due_date || null, // Ensure empty string becomes null
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : null,
    };

    // If it's a new task and no assigned_to is selected, but currentUserEmail is available, assign to current user.
    if (!taskData?.id && !dataToSubmit.assigned_to && currentUserEmail) {
        dataToSubmit.assigned_to = currentUserEmail;
    }
    
    try {
      await onSubmit(dataToSubmit);
      // onClose(true) will be called by parent component after successful submission from there
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: t('errors.submissionErrorTitle', {defaultValue: 'Submission Error'}),
        description: error.message || t('errors.failedToSave', {item: t('tasks.itemTitleSingular', {defaultValue: 'task'})}),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const dir = isRTL ? "rtl" : "ltr";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }} dir={dir}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {taskData?.id ? t('tasks.editTaskTitle', {defaultValue: 'Edit Task'}) : t('tasks.addNewTaskTitle', {defaultValue: 'Add New Task'})}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading && <LoadingSpinner message={t('messages.saving', {item: t('tasks.itemTitleSingular', {defaultValue: 'Task'})})} />}

        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6 p-1 max-h-[70vh] overflow-y-auto">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tasks.title', {defaultValue: 'Title'})} <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('tasks.titlePlaceholder', {defaultValue: 'E.g., Finalize Q3 report'})}
                className={`w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${errors.title ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tasks.description', {defaultValue: 'Description'})}
              </label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('tasks.descriptionPlaceholder', {defaultValue: 'Add more details about the task...'})}
                className="w-full min-h-[100px] dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Field */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.status', {defaultValue: 'Status'})}
                </label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('tasks.selectStatus', {defaultValue: 'Select status'})} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {TASK_STATUSES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">
                        {t(opt.labelKey, {defaultValue: opt.label})}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Field */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tasks.priority', {defaultValue: 'Priority'})}
                </label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('tasks.selectPriority', {defaultValue: 'Select priority'})} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {TASK_PRIORITIES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">
                        {t(opt.labelKey, {defaultValue: opt.label})}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Field */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Layers className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-500 dark:text-gray-400`} />
                  {t('tasks.category', {defaultValue: 'Category'})}
                </label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('tasks.selectCategory', {defaultValue: 'Select category'})} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {TASK_CATEGORIES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">
                        {t(opt.labelKey, {defaultValue: opt.label})}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Field */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   <CalendarIcon className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-500 dark:text-gray-400`} />
                  {t('tasks.dueDate', {defaultValue: 'Due Date'})}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${!formData.due_date && "text-muted-foreground"}`}
                    >
                      {formData.due_date ? format(safeParseDate(formData.due_date) || new Date() , 'PPP') : <span>{t('tasks.pickDate', {defaultValue: 'Pick a date'})}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" align="start">
                    <Calendar
                      mode="single"
                      selected={safeParseDate(formData.due_date)}
                      onSelect={(date) => handleChange('due_date', date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                      className="dark:text-gray-200"
                      dir={dir}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Assigned To Field */}
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-500 dark:text-gray-400`} />
                {t('tasks.assignedTo', {defaultValue: 'Assigned To'})}
              </label>
              {users && users.length > 0 ? (
                <Select value={formData.assigned_to || ''} onValueChange={(value) => handleChange('assigned_to', value)}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('tasks.selectAssignee', {defaultValue: 'Select assignee'})} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    <SelectItem value={null} className="dark:hover:bg-gray-600">{t('common.unassigned', {defaultValue: 'Unassigned'})}</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.value} value={user.value} className="dark:hover:bg-gray-600">
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('tasks.noUsersAvailable', {defaultValue: 'No users available for assignment.'})}</p>
              )}
            </div>
            
            {/* Tags Field */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Tag className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-500 dark:text-gray-400`} />
                {t('tasks.tags', {defaultValue: 'Tags'})}
              </label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:border-gray-600">
                {Array.isArray(formData.tags) && formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 text-sm py-1 px-2 bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                      aria-label={`${t('common.remove', {defaultValue: 'Remove'})} ${tag}`}
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
                <Input
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  placeholder={t('tasks.addTagPlaceholder', {defaultValue: 'Add a tag and press Enter...'})}
                  className="flex-grow border-none focus:ring-0 p-0 h-auto dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('tasks.tagInstruction', {defaultValue: 'Press Enter or comma to add a tag.'})}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Related Entity Type */}
              <div>
                <label htmlFor="related_entity_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-500 dark:text-gray-400`} />
                  {t('tasks.relatedEntityType', {defaultValue: 'Related To'})}
                </label>
                <Select value={formData.related_entity_type || 'none'} onValueChange={(value) => handleChange('related_entity_type', value)}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t('tasks.selectEntityType', {defaultValue: 'Select entity type'})} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {TASK_RELATED_ENTITY_TYPES.map(opt => (
                       <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">
                         {t(opt.labelKey, {defaultValue: opt.label})}
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Related Entity ID */}
              {formData.related_entity_type !== 'none' && (
                <div>
                  <label htmlFor="related_entity_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tasks.relatedEntityId', {defaultValue: 'Related Entity ID'})}
                  </label>
                  <Input
                    id="related_entity_id"
                    value={formData.related_entity_id || ''}
                    onChange={(e) => handleChange('related_entity_id', e.target.value)}
                    placeholder={t('tasks.relatedEntityIdPlaceholder', {defaultValue: 'Enter ID of the related item'})}
                    className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estimated Hours */}
                <div>
                    <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('tasks.estimatedHours', {defaultValue: 'Estimated Hours'})}
                    </label>
                    <Input
                        id="estimated_hours"
                        type="number"
                        value={formData.estimated_hours || ''}
                        onChange={(e) => handleChange('estimated_hours', e.target.value)}
                        placeholder="e.g., 2.5"
                        min="0"
                        step="0.1"
                        className={`w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${errors.estimated_hours ? 'border-red-500' : ''}`}
                        aria-invalid={!!errors.estimated_hours}
                    />
                    {errors.estimated_hours && <p className="text-xs text-red-500 mt-1">{errors.estimated_hours}</p>}
                </div>
                {/* Actual Hours */}
                <div>
                    <label htmlFor="actual_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('tasks.actualHours', {defaultValue: 'Actual Hours'})}
                    </label>
                    <Input
                        id="actual_hours"
                        type="number"
                        value={formData.actual_hours || ''}
                        onChange={(e) => handleChange('actual_hours', e.target.value)}
                        placeholder="e.g., 3"
                        min="0"
                        step="0.1"
                        className={`w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${errors.actual_hours ? 'border-red-500' : ''}`}
                        aria-invalid={!!errors.actual_hours}
                    />
                    {errors.actual_hours && <p className="text-xs text-red-500 mt-1">{errors.actual_hours}</p>}
                </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-200">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">{t('errors.formValidationTitle', {defaultValue: 'Please correct the errors below:'})}</span>
                </div>
                <ul className="list-disc list-inside mt-1">
                  {Object.values(errors).map((err, idx) => err && <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            <DialogFooter className="pt-6 sticky bottom-0 bg-white dark:bg-gray-800 py-4 border-t dark:border-gray-700">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose(false)} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                  {t('common.cancel', {defaultValue: 'Cancel'})}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                {isLoading ? t('common.saving', {defaultValue: 'Saving...'}) : (taskData?.id ? t('common.update', {defaultValue: 'Update'}) : t('common.create', {defaultValue: 'Create'}))}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}