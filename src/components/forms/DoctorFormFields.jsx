import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguageHook } from '@/components/useLanguageHook';
import { cn } from '@/components/utils/cn';

export default function DoctorFormFields({ formData, formErrors, updateField, isSubmitting, specialties }) {
  const { t } = useLanguageHook();

  const statusOptions = [
    { value: 'active', labelKey: 'doctors.status.active' },
    { value: 'inactive', labelKey: 'doctors.status.inactive' },
  ];
  
  const fieldClass = "mb-4";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  // Sample specialties - in a real app, these would come from a dynamic source or entity
  const defaultSpecialties = specialties || [
    { value: 'cardiology', label: t('doctors.specialty.cardiology', {defaultValue: 'Cardiology'}) },
    { value: 'dermatology', label: t('doctors.specialty.dermatology', {defaultValue: 'Dermatology'}) },
    { value: 'neurology', label: t('doctors.specialty.neurology', {defaultValue: 'Neurology'}) },
    { value: 'oncology', label: t('doctors.specialty.oncology', {defaultValue: 'Oncology'}) },
    { value: 'pediatrics', label: t('doctors.specialty.pediatrics', {defaultValue: 'Pediatrics'}) },
    { value: 'other', label: t('doctors.specialty.other', {defaultValue: 'Other'}) },
  ];


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name (EN) Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-first-name-en" className={labelClass}>
            {t('doctors.firstNameEn', {defaultValue: "First Name (EN)"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-first-name-en"
            value={formData.first_name_en || ''}
            onChange={(e) => updateField('first_name_en', e.target.value)}
            placeholder={t('doctors.firstNameEnPlaceholder', {defaultValue: "Enter first name (English)"})}
            disabled={isSubmitting}
            className={cn(formErrors.first_name_en ? 'border-red-500' : '')}
          />
          {formErrors.first_name_en && <p className="text-xs text-red-500 mt-1">{formErrors.first_name_en}</p>}
        </div>

        {/* Last Name (EN) Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-last-name-en" className={labelClass}>
            {t('doctors.lastNameEn', {defaultValue: "Last Name (EN)"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-last-name-en"
            value={formData.last_name_en || ''}
            onChange={(e) => updateField('last_name_en', e.target.value)}
            placeholder={t('doctors.lastNameEnPlaceholder', {defaultValue: "Enter last name (English)"})}
            disabled={isSubmitting}
            className={cn(formErrors.last_name_en ? 'border-red-500' : '')}
          />
          {formErrors.last_name_en && <p className="text-xs text-red-500 mt-1">{formErrors.last_name_en}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name (HE) Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-first-name-he" className={labelClass}>
            {t('doctors.firstNameHe', {defaultValue: "First Name (HE)"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-first-name-he"
            value={formData.first_name_he || ''}
            onChange={(e) => updateField('first_name_he', e.target.value)}
            placeholder={t('doctors.firstNameHePlaceholder', {defaultValue: "הכנס שם פרטי (עברית)"})}
            disabled={isSubmitting}
            className={cn(formErrors.first_name_he ? 'border-red-500' : '', 'rtl:text-right')}
            dir="rtl"
          />
          {formErrors.first_name_he && <p className="text-xs text-red-500 mt-1">{formErrors.first_name_he}</p>}
        </div>

        {/* Last Name (HE) Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-last-name-he" className={labelClass}>
            {t('doctors.lastNameHe', {defaultValue: "Last Name (HE)"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-last-name-he"
            value={formData.last_name_he || ''}
            onChange={(e) => updateField('last_name_he', e.target.value)}
            placeholder={t('doctors.lastNameHePlaceholder', {defaultValue: "הכנס שם משפחה (עברית)"})}
            disabled={isSubmitting}
            className={cn(formErrors.last_name_he ? 'border-red-500' : '', 'rtl:text-right')}
            dir="rtl"
          />
          {formErrors.last_name_he && <p className="text-xs text-red-500 mt-1">{formErrors.last_name_he}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* License Number Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-license-number" className={labelClass}>
            {t('doctors.licenseNumber', {defaultValue: "License Number"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-license-number"
            value={formData.license_number || ''}
            onChange={(e) => updateField('license_number', e.target.value)}
            placeholder={t('doctors.licenseNumberPlaceholder', {defaultValue: "Enter license number"})}
            disabled={isSubmitting}
            className={cn(formErrors.license_number ? 'border-red-500' : '')}
          />
          {formErrors.license_number && <p className="text-xs text-red-500 mt-1">{formErrors.license_number}</p>}
        </div>

        {/* Specialty Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-specialty" className={labelClass}>
            {t('doctors.specialty', {defaultValue: "Specialty"})} <span className="text-red-500">*</span>
          </label>
          <Select 
            value={formData.specialty || ''} 
            onValueChange={(value) => updateField('specialty', value)} 
            disabled={isSubmitting}
          >
            <SelectTrigger id="doctor-specialty" className={cn(formErrors.specialty ? 'border-red-500' : '')}>
              <SelectValue placeholder={t('common.selectPlaceholder', {field: t('doctors.specialty')})} />
            </SelectTrigger>
            <SelectContent>
              {defaultSpecialties.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.specialty && <p className="text-xs text-red-500 mt-1">{formErrors.specialty}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-phone" className={labelClass}>
            {t('doctors.phone', {defaultValue: "Phone"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder={t('doctors.phonePlaceholder', {defaultValue: "Enter phone number"})}
            disabled={isSubmitting}
            className={cn(formErrors.phone ? 'border-red-500' : '')}
          />
          {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
        </div>

        {/* Email Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-email" className={labelClass}>
            {t('doctors.email', {defaultValue: "Email"})} <span className="text-red-500">*</span>
          </label>
          <Input
            id="doctor-email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder={t('doctors.emailPlaceholder', {defaultValue: "Enter email address"})}
            disabled={isSubmitting}
            className={cn(formErrors.email ? 'border-red-500' : '')}
          />
          {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* City Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-city" className={labelClass}>
            {t('doctors.city', {defaultValue: "City"})}
          </label>
          <Input
            id="doctor-city"
            value={formData.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder={t('doctors.cityPlaceholder', {defaultValue: "Enter city"})}
            disabled={isSubmitting}
          />
        </div>

        {/* Status Field */}
        <div className={fieldClass}>
          <label htmlFor="doctor-status" className={labelClass}>
            {t('common.status', {defaultValue: "Status"})}
          </label>
          <Select value={formData.status || 'active'} onValueChange={(value) => updateField('status', value)} disabled={isSubmitting}>
            <SelectTrigger id="doctor-status">
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
      </div>
      
      {/* Address Field */}
      <div className={fieldClass}>
        <label htmlFor="doctor-address" className={labelClass}>
          {t('doctors.address', {defaultValue: "Address"})}
        </label>
        <Textarea
          id="doctor-address"
          value={formData.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder={t('doctors.addressPlaceholder', {defaultValue: "Enter full address"})}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {/* Notes Field */}
      <div className={fieldClass}>
        <label htmlFor="doctor-notes" className={labelClass}>
          {t('doctors.notes', {defaultValue: "Notes"})}
        </label>
        <Textarea
          id="doctor-notes"
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder={t('doctors.notesPlaceholder', {defaultValue: "Enter any additional notes"})}
          disabled={isSubmitting}
          rows={3}
        />
      </div>
    </div>
  );
}