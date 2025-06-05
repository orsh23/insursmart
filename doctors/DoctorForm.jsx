import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/shared/TagInput'; // Assuming this component exists and works
import { useLanguageHook } from '@/components/useLanguageHook';

export default function DoctorForm({ initialData, viewOnly = false }) {
  const { t } = useLanguageHook();
  const defaultFormData = {
    first_name_en: "",
    last_name_en: "",
    first_name_he: "",
    last_name_he: "",
    license_number: "",
    specialties: [], // Changed from specialty to specialties (array)
    sub_specialties: [],
    phone: "",
    email: "",
    city: "",
    address: "",
    status: "active",
    tags: [],
    notes: ""
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        specialties: Array.isArray(initialData.specialties) ? initialData.specialties : (initialData.specialty ? [initialData.specialty] : []), // Handle old single specialty
        sub_specialties: Array.isArray(initialData.sub_specialties) ? initialData.sub_specialties : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : []
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (name, newTags) => {
    setFormData(prev => ({ ...prev, [name]: newTags }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // This component now primarily renders the form fields.
  // The submission logic will be in DoctorDialog.
  // We can pass `formData` and `setFormData` up or pass a submit handler.
  // For now, it's just rendering. The parent dialog will handle form state.

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name_en">{t('doctors.form.firstNameEn', { defaultValue: 'First Name (English)' })}</Label>
          <Input id="first_name_en" name="first_name_en" value={formData.first_name_en} onChange={handleChange} disabled={viewOnly} required />
        </div>
        <div>
          <Label htmlFor="last_name_en">{t('doctors.form.lastNameEn', { defaultValue: 'Last Name (English)' })}</Label>
          <Input id="last_name_en" name="last_name_en" value={formData.last_name_en} onChange={handleChange} disabled={viewOnly} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name_he">{t('doctors.form.firstNameHe', { defaultValue: 'First Name (Hebrew)' })}</Label>
          <Input id="first_name_he" name="first_name_he" value={formData.first_name_he} onChange={handleChange} disabled={viewOnly} dir="rtl" required />
        </div>
        <div>
          <Label htmlFor="last_name_he">{t('doctors.form.lastNameHe', { defaultValue: 'Last Name (Hebrew)' })}</Label>
          <Input id="last_name_he" name="last_name_he" value={formData.last_name_he} onChange={handleChange} disabled={viewOnly} dir="rtl" required />
        </div>
      </div>
      <div>
        <Label htmlFor="license_number">{t('doctors.form.licenseNumber', { defaultValue: 'License Number' })}</Label>
        <Input id="license_number" name="license_number" value={formData.license_number} onChange={handleChange} disabled={viewOnly} required />
      </div>
      <div>
        <Label htmlFor="specialties">{t('doctors.form.specialties', { defaultValue: 'Specialties' })}</Label>
        <TagInput
          value={formData.specialties}
          onChange={(newTags) => handleTagChange('specialties', newTags)}
          placeholder={t('doctors.form.addSpecialty', { defaultValue: 'Add specialty...' })}
          disabled={viewOnly}
        />
         {formData.specialties?.length === 0 && !viewOnly && <p className="text-xs text-red-500 mt-1">{t('doctors.form.specialtyRequired', { defaultValue: 'At least one specialty is required.'})}</p>}
      </div>
      <div>
        <Label htmlFor="sub_specialties">{t('doctors.form.subSpecialties', { defaultValue: 'Sub-specialties' })}</Label>
        <TagInput
          value={formData.sub_specialties}
          onChange={(newTags) => handleTagChange('sub_specialties', newTags)}
          placeholder={t('doctors.form.addSubSpecialty', { defaultValue: 'Add sub-specialty...' })}
          disabled={viewOnly}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">{t('doctors.form.phone', { defaultValue: 'Phone' })}</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={viewOnly} required />
        </div>
        <div>
          <Label htmlFor="email">{t('doctors.form.email', { defaultValue: 'Email' })}</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={viewOnly} required />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">{t('doctors.form.city', { defaultValue: 'City' })}</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={viewOnly} />
        </div>
        <div>
          <Label htmlFor="address">{t('doctors.form.address', { defaultValue: 'Address' })}</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={viewOnly} />
        </div>
      </div>
      <div>
        <Label htmlFor="status">{t('doctors.form.status', { defaultValue: 'Status' })}</Label>
        <Select name="status" value={formData.status} onChange={handleSelectChange} disabled={viewOnly} required>
          <SelectItem value="active">{t('doctors.form.active', { defaultValue: 'Active' })}</SelectItem>
          <SelectItem value="inactive">{t('doctors.form.inactive', { defaultValue: 'Inactive' })}</SelectItem>
        </Select>
      </div>
      <div>
        <Label htmlFor="tags">{t('doctors.form.tags', { defaultValue: 'Tags' })}</Label>
        <TagInput
          value={formData.tags}
          onChange={(newTags) => handleTagChange('tags', newTags)}
          placeholder={t('doctors.form.addTag', { defaultValue: 'Add tag...' })}
          disabled={viewOnly}
        />
      </div>
      <div>
        <Label htmlFor="notes">{t('doctors.form.notes', { defaultValue: 'Notes' })}</Label>
        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={viewOnly} />
      </div>
    </div>
  );
}