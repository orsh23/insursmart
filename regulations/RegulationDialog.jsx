
import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import FormDialog from "@/components/ui/form-dialog"; // Replaced Dialog components with FormDialog
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker'; // Replaced Calendar/Popover with DatePicker
import { Switch } from '@/components/ui/switch';
import { X, Link as LinkIcon, Tag } from 'lucide-react'; // AlertCircle removed as FormDialog handles error display
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Regulation } from "@/api/entities"; // New import

export default function RegulationDialog({
  // Prop names standardized for consistency
  isOpen, // Renamed from 'open'
  onClose,
  currentItem, // Renamed from 'regulation'
  onSave,
  viewOnly = false // New prop, though not fully implemented in form disabling yet
}) {
  const { t, isRTL, language } = useLanguageHook();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState(null); // Renamed from 'error'

  const defaultFormData = {
    title_en: '',
    title_he: '',
    description_en: '',
    description_he: '',
    regulation_type: 'Insurance',
    is_active: true,
    effective_date: '',
    end_date: '',
    document_url: '',
    tags: []
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setDialogError(null);
      setTagInput('');

      if (currentItem) {
        setFormData({
          title_en: currentItem.title_en || '',
          title_he: currentItem.title_he || '',
          description_en: currentItem.description_en || '',
          description_he: currentItem.description_he || '',
          regulation_type: currentItem.regulation_type || 'Insurance',
          is_active: currentItem.is_active !== undefined ? currentItem.is_active : true,
          effective_date: currentItem.effective_date ? format(parseISO(currentItem.effective_date), 'yyyy-MM-dd') : '',
          end_date: currentItem.end_date ? format(parseISO(currentItem.end_date), 'yyyy-MM-dd') : '',
          document_url: currentItem.document_url || '',
          tags: Array.isArray(currentItem.tags) ? [...currentItem.tags] : []
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, currentItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Updated for simplified Select: it directly gives the value in e.target.value
  const handleSelectChange = (e) => {
    const { name, value } = e.target; // name is on the select, value is from the option
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDateSelect = (name, date) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
    } else {
      setFormData(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const titleField = language === 'he' ? 'title_he' : 'title_en';
    const titleValue = formData[titleField];

    if (!titleValue || titleValue.trim() === '') {
      setDialogError(t('regulations.errors.titleRequired', { defaultValue: 'Title is required' }));
      return false;
    }

    if (!formData.effective_date) {
      setDialogError(t('regulations.errors.effectiveDateRequired', { defaultValue: 'Effective date is required' }));
      return false;
    }

    if (formData.document_url && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(formData.document_url)) {
      setDialogError(t('regulations.errors.invalidUrl', { defaultValue: 'Document URL is invalid' }));
      return false;
    }
    setDialogError(null); // Clear error if validation passes
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ensure form submission is handled here
    if (viewOnly) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setDialogError(null);

    try {
      await onSave(formData); // onSave prop will handle actual API call
      // No need to call onClose() here, parent (RegulationsTab) will do it on successful save
    } catch (err) {
      console.error("Error saving regulation:", err);
      setDialogError(err.message || t('errors.saveFailed', { defaultValue: "Failed to save. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const regulationTypes = [
    { value: "Insurance", label: t('regulations.type.Insurance', { defaultValue: 'Insurance' }) },
    { value: "Healthcare", label: t('regulations.type.Healthcare', { defaultValue: 'Healthcare' }) },
    { value: "Internal", label: t('regulations.type.Internal', { defaultValue: 'Internal' }) },
    { value: "Legal", label: t('regulations.type.Legal', { defaultValue: 'Legal' }) },
    { value: "Other", label: t('regulations.type.Other', { defaultValue: 'Other' }) }
  ];

  const dialogTitle = viewOnly
    ? t('regulations.viewTitle', { defaultValue: 'View Regulation' })
    : currentItem
      ? t('regulations.editTitle', { defaultValue: 'Edit Regulation' })
      : t('regulations.addTitle', { defaultValue: 'Add Regulation' });

  const footerButtons = (
    <>
      <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
        {t('common.cancel', { defaultValue: 'Cancel' })}
      </Button>
      {!viewOnly && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('common.saving', { defaultValue: 'Saving...' })
            : currentItem
              ? t('common.update', { defaultValue: 'Update' })
              : t('common.save', { defaultValue: 'Save' })}
        </Button>
      )}
    </>
  );

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      isSubmitting={isSubmitting}
      error={dialogError}
      onSubmit={handleSubmit}
      footerButtons={footerButtons}
      viewOnly={viewOnly}
      isRTL={isRTL}
    >
      <div className="space-y-4 py-4">
        {/* Title EN/HE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title_en">{t('regulations.titleEn', { defaultValue: 'Title (English)' })}</Label>
            <Input
              id="title_en"
              name="title_en"
              value={formData.title_en}
              onChange={handleInputChange}
              disabled={viewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title_he">{t('regulations.titleHe', { defaultValue: 'Title (Hebrew)' })}</Label>
            <Input
              id="title_he"
              name="title_he"
              value={formData.title_he}
              onChange={handleInputChange}
              disabled={viewOnly}
              dir="rtl"
            />
          </div>
        </div>

        {/* Description EN/HE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description_en">{t('regulations.descriptionEn', { defaultValue: 'Description (English)' })}</Label>
            <Textarea
              id="description_en"
              name="description_en"
              rows={3}
              value={formData.description_en}
              onChange={handleInputChange}
              disabled={viewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description_he">{t('regulations.descriptionHe', { defaultValue: 'Description (Hebrew)' })}</Label>
            <Textarea
              id="description_he"
              name="description_he"
              rows={3}
              value={formData.description_he}
              onChange={handleInputChange}
              disabled={viewOnly}
              dir="rtl"
            />
          </div>
        </div>

        {/* Regulation Type & Active Switch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="regulation_type">{t('regulations.type.label', { defaultValue: 'Regulation Type' })}</Label>
            <Select
              id="regulation_type"
              name="regulation_type" // Added name prop
              value={formData.regulation_type}
              onChange={handleSelectChange} // Use the simplified handler
              disabled={viewOnly}
              className="w-full"
            >
              {regulationTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_active" className="block mb-1">
              {t('common.isActive', { defaultValue: 'Active' })}
            </Label>
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                disabled={viewOnly}
              />
              <span>{formData.is_active ? t('common.yes') : t('common.no')}</span>
            </div>
          </div>
        </div>

        {/* Dates - Using DatePicker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="effective_date">{t('regulations.effectiveDate', { defaultValue: 'Effective Date' })}</Label>
            <DatePicker
              selected={formData.effective_date ? parseISO(formData.effective_date) : undefined}
              onSelect={(date) => handleDateSelect('effective_date', date)}
              disabled={viewOnly}
              placeholder={t('common.selectDate', { defaultValue: 'Select date' })}
              isRTL={isRTL} // Pass RTL direction to DatePicker
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">{t('regulations.endDate', { defaultValue: 'End Date (Optional)' })}</Label>
            <DatePicker
              selected={formData.end_date ? parseISO(formData.end_date) : undefined}
              onSelect={(date) => handleDateSelect('end_date', date)}
              disabled={viewOnly}
              placeholder={t('common.selectDate', { defaultValue: 'Select date (optional)' })}
              isRTL={isRTL} // Pass RTL direction to DatePicker
            />
          </div>
        </div>

        {/* Document URL */}
        <div className="space-y-2">
          <Label htmlFor="document_url" className="flex items-center">
            <LinkIcon className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
            {t('regulations.documentUrl', { defaultValue: 'Document URL (Optional)' })}
          </Label>
          <Input
            id="document_url"
            name="document_url"
            type="url"
            value={formData.document_url}
            onChange={handleInputChange}
            disabled={viewOnly}
            placeholder={t('regulations.documentUrlPlaceholder', { defaultValue: 'https://...' })}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="flex items-center">
            <Tag className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
            {t('regulations.tags', { defaultValue: 'Tags' })}
          </Label>

          {!viewOnly && (
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t('regulations.tagsPlaceholder', { defaultValue: 'Add a tag...' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1"
                disabled={viewOnly}
              />
              <Button type="button" onClick={addTag} variant="outline" disabled={viewOnly}>
                {t('common.add', { defaultValue: 'Add' })}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.length === 0 ? (
              <span className="text-sm text-gray-500">
                {t('regulations.noTags', { defaultValue: 'No tags added' })}
              </span>
            ) : (
              formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1">
                  {tag}
                  {!viewOnly && (
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700 rtl:mr-1 rtl:ml-0"
                      aria-label={t('common.remove', { defaultValue: 'Remove' })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
