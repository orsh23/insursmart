import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// A simple TagInput component for handling the tags array
const TagInput = ({ tags = [], onChange }) => {
  const { t, isRTL } = useLanguageHook();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
        setInputValue('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('regulations.tagsPlaceholder', { defaultValue: 'Type and press Enter to add tags' })}
          className="mb-2"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map(tag => (
            <div 
              key={tag} 
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
            >
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)} 
                className={`text-blue-600 hover:text-blue-800 ${isRTL ? 'mr-1' : 'ml-1'}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function RegulationForm({ initialData, onSubmit, isSubmitting }) {
  const { t, language, isRTL } = useLanguageHook();

  const regulationTypeOptions = ["Insurance", "Healthcare", "Internal", "Legal", "Other"];

  const defaultFormData = {
    title_en: "",
    title_he: "",
    description_en: "",
    description_he: "",
    regulation_type: "Insurance",
    is_active: true,
    effective_date: "",
    end_date: "",
    document_url: "",
    tags: []
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title_en: initialData.title_en || "",
        title_he: initialData.title_he || "",
        description_en: initialData.description_en || "",
        description_he: initialData.description_he || "",
        regulation_type: initialData.regulation_type || "Insurance",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        effective_date: initialData.effective_date ? formatDateForInput(initialData.effective_date) : "",
        end_date: initialData.end_date ? formatDateForInput(initialData.end_date) : "",
        document_url: initialData.document_url || "",
        tags: initialData.tags || []
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  // Helper function to format dates for input fields
  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (e) {
      return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.title_en || !formData.title_he || !formData.regulation_type || !formData.effective_date) {
      alert(t('common.fillRequiredFields', {defaultValue: "Please fill all required fields."}));
      return;
    }
    onSubmit(formData);
  };

  return (
    <form id="regulationForm" onSubmit={handleSubmit} className="space-y-4">
      {/* Regulation Titles */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('regulations.fields.title', {defaultValue: 'Regulation Title'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="title_en">{t('regulations.fields.titleEn', {defaultValue: 'Title (English)'})} *</Label>
            <Input id="title_en" name="title_en" value={formData.title_en} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="title_he">{t('regulations.fields.titleHe', {defaultValue: 'Title (Hebrew)'})} *</Label>
            <Input id="title_he" name="title_he" value={formData.title_he} onChange={handleChange} required dir="rtl" disabled={isSubmitting} />
          </div>
        </div>
      </fieldset>

      {/* Regulation Type and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="regulation_type">{t('regulations.fields.type', {defaultValue: 'Regulation Type'})} *</Label>
          <Select value={formData.regulation_type} onValueChange={(value) => handleSelectChange('regulation_type', value)} disabled={isSubmitting} required>
            <SelectTrigger>
              <SelectValue placeholder={t('regulations.placeholders.selectType', {defaultValue: 'Select regulation type'})} />
            </SelectTrigger>
            <SelectContent>
              {regulationTypeOptions.map(type => (
                <SelectItem key={type} value={type}>{t(`regulationTypes.${type}`, {defaultValue: type})}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t('common.status', {defaultValue: 'Status'})}</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
            <Switch id="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} disabled={isSubmitting} />
            <Label htmlFor="is_active" className="cursor-pointer">
              {formData.is_active 
                ? t('common.active', {defaultValue: 'Active'})
                : t('common.inactive', {defaultValue: 'Inactive'})}
            </Label>
          </div>
        </div>
      </div>

      {/* Effective Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="effective_date">{t('regulations.fields.effectiveDate', {defaultValue: 'Effective Date'})} *</Label>
          <Input 
            type="date" 
            id="effective_date" 
            name="effective_date" 
            value={formData.effective_date} 
            onChange={handleChange} 
            required 
            disabled={isSubmitting} 
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date">{t('regulations.fields.endDate', {defaultValue: 'End Date (if applicable)'})}</Label>
          <Input 
            type="date" 
            id="end_date" 
            name="end_date" 
            value={formData.end_date} 
            onChange={handleChange} 
            disabled={isSubmitting} 
          />
        </div>
      </div>

      {/* Descriptions */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('regulations.fields.description', {defaultValue: 'Regulation Description'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="description_en">{t('regulations.fields.descriptionEn', {defaultValue: 'Description (English)'})}</Label>
            <Textarea 
              id="description_en" 
              name="description_en" 
              value={formData.description_en} 
              onChange={handleChange} 
              rows={3} 
              disabled={isSubmitting} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description_he">{t('regulations.fields.descriptionHe', {defaultValue: 'Description (Hebrew)'})}</Label>
            <Textarea 
              id="description_he" 
              name="description_he" 
              value={formData.description_he} 
              onChange={handleChange} 
              rows={3} 
              dir="rtl" 
              disabled={isSubmitting} 
            />
          </div>
        </div>
      </fieldset>

      {/* Document URL */}
      <div className="space-y-1">
        <Label htmlFor="document_url">{t('regulations.fields.documentUrl', {defaultValue: 'Document URL'})}</Label>
        <Input 
          type="url" 
          id="document_url" 
          name="document_url" 
          value={formData.document_url} 
          onChange={handleChange} 
          placeholder="https://" 
          disabled={isSubmitting} 
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label htmlFor="tags">{t('common.tags', {defaultValue: 'Tags'})}</Label>
        <TagInput tags={formData.tags} onChange={handleTagsChange} disabled={isSubmitting} />
      </div>
    </form>
  );
}