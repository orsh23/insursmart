import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function InsuranceCodeForm({ initialData, onSubmit, isSubmitting }) {
  const { t, isRTL } = useLanguageHook();

  const defaultFormData = {
    code: "",
    name_en: "",
    name_he: "",
    category_path: "",
    requires_preauthorization: false,
    default_composition: [],
    bom_template: [],
    standard_hospitalization_days: 0,
    is_active: true
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name_en: initialData.name_en || "",
        name_he: initialData.name_he || "",
        category_path: initialData.category_path || "",
        requires_preauthorization: initialData.requires_preauthorization !== undefined ? initialData.requires_preauthorization : false,
        default_composition: initialData.default_composition || [],
        bom_template: initialData.bom_template || [],
        standard_hospitalization_days: initialData.standard_hospitalization_days || 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.code || !formData.name_en || !formData.name_he) {
      alert(t('common.fillRequiredFields', {defaultValue: "Please fill all required fields."}));
      return;
    }
    
    // Validate code format
    const codePattern = /^INS-\d{4}-[A-Z-]+$/;
    if (!codePattern.test(formData.code)) {
      alert(t('insuranceCodes.invalidCodeFormat', {defaultValue: "Code must follow format: INS-XXXX-YYY (X=numbers, Y=uppercase letters)"}));
      return;
    }

    onSubmit(formData);
  };

  return (
    <form id="insuranceCodeForm" onSubmit={handleSubmit} className="space-y-4">
      {/* Insurance Code */}
      <div className="space-y-1">
        <Label htmlFor="code">{t('insuranceCodes.fields.code', {defaultValue: 'Insurance Code'})} *</Label>
        <Input 
          id="code" 
          name="code" 
          value={formData.code} 
          onChange={handleChange} 
          placeholder="INS-0001-SURGERY" 
          pattern="^INS-\d{4}-[A-Z-]+$"
          title={t('insuranceCodes.codePattern', {defaultValue: "Format: INS-XXXX-YYY (X=numbers, Y=uppercase letters)"})}
          required 
          disabled={isSubmitting || initialData?.id} 
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('insuranceCodes.codeFormat', {defaultValue: "Format: INS-XXXX-YYY (e.g., INS-0001-KNEE)"})}
        </p>
      </div>

      {/* Name Fields */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('insuranceCodes.fields.name', {defaultValue: 'Code Name'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name_en">{t('common.nameEn', {defaultValue: 'Name (English)'})} *</Label>
            <Input id="name_en" name="name_en" value={formData.name_en} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name_he">{t('common.nameHe', {defaultValue: 'Name (Hebrew)'})} *</Label>
            <Input id="name_he" name="name_he" value={formData.name_he} onChange={handleChange} required dir="rtl" disabled={isSubmitting} />
          </div>
        </div>
      </fieldset>

      {/* Category Path */}
      <div className="space-y-1">
        <Label htmlFor="category_path">{t('insuranceCodes.fields.categoryPath', {defaultValue: 'Category Path'})}</Label>
        <Input 
          id="category_path" 
          name="category_path" 
          value={formData.category_path} 
          onChange={handleChange} 
          placeholder={t('insuranceCodes.categoryPathPlaceholder', {defaultValue: "e.g., Orthopedics/Knee/Surgery"})}
          disabled={isSubmitting} 
        />
      </div>

      {/* Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="standard_hospitalization_days">{t('insuranceCodes.fields.stdHospDays', {defaultValue: 'Standard Hospitalization Days'})}</Label>
          <Input 
            type="number" 
            id="standard_hospitalization_days" 
            name="standard_hospitalization_days" 
            value={formData.standard_hospitalization_days || 0} 
            onChange={handleNumberChange} 
            min="0"
            disabled={isSubmitting} 
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch 
              id="requires_preauthorization" 
              checked={formData.requires_preauthorization} 
              onCheckedChange={(checked) => handleSwitchChange('requires_preauthorization', checked)} 
              disabled={isSubmitting} 
            />
            <Label htmlFor="requires_preauthorization" className="cursor-pointer">
              {t('insuranceCodes.fields.requiresPreauth', {defaultValue: 'Requires Pre-authorization'})}
            </Label>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch 
              id="is_active" 
              checked={formData.is_active} 
              onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} 
              disabled={isSubmitting} 
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              {t('common.active', {defaultValue: 'Active'})}
            </Label>
          </div>
        </div>
      </div>

      {/* Advanced components for default_composition and bom_template could be added here */}
      {/* For now, we'll use a simplified form and provide instructions */}

      <div className="border p-4 rounded-md bg-blue-50 text-blue-800 text-sm">
        <p>{t('insuranceCodes.advancedFeatures', {defaultValue: 'Advanced features like default composition and bill of materials templates can be configured in the detailed view after creating the code.'})}</p>
      </div>
    </form>
  );
}