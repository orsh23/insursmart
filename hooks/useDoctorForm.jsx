import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Doctor } from '@/api/entities';
import { useLanguage } from '../context/LanguageContext';
import { getDoctorSpecialtyOptions } from '../utils/options'; // Assuming this utility exists

export function useDoctorForm(initialDoctor = null, allExistingDoctors = []) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const baseState = {
    first_name_en: '',
    first_name_he: '',
    last_name_en: '',
    last_name_he: '',
    license_number: '',
    specialty: '', // Default to empty, let user select
    sub_specialties: [],
    phone: '',
    email: '',
    city: '',
    address: '',
    status: 'active',
    tags: [],
    notes: ''
  };

  const [formData, setFormData] = useState(baseState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed allDoctors local state, expect it via prop allExistingDoctors
  const [subSpecialtySuggestions, setSubSpecialtySuggestions] = useState([]);
  
  const specialtyOptions = getDoctorSpecialtyOptions(t);


  useEffect(() => {
    if (initialDoctor && typeof initialDoctor === 'object') {
      setFormData({
        ...baseState,
        ...initialDoctor,
        sub_specialties: Array.isArray(initialDoctor.sub_specialties) ? initialDoctor.sub_specialties : [],
        tags: Array.isArray(initialDoctor.tags) ? initialDoctor.tags : [],
        specialty: initialDoctor.specialty || '',
        status: initialDoctor.status || 'active'
      });
    } else {
      setFormData(baseState);
    }
    setErrors({});
  }, [initialDoctor]);

  useEffect(() => {
    // Generate sub-specialty suggestions from allExistingDoctors passed as prop
    if (Array.isArray(allExistingDoctors) && allExistingDoctors.length > 0) {
      const subspecialtySet = new Set();
      allExistingDoctors.forEach(doctor => {
        if (doctor && Array.isArray(doctor.sub_specialties)) {
          doctor.sub_specialties.forEach(subspecialty => {
            if (subspecialty) subspecialtySet.add(subspecialty);
          });
        }
      });
      setSubSpecialtySuggestions(Array.from(subspecialtySet).sort());
    } else {
      setSubSpecialtySuggestions([]);
    }
  }, [allExistingDoctors]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.first_name_en?.trim() && !formData.first_name_he?.trim()) {
      newErrors.first_name_en = t('validation.nameRequired', { field: t('doctors.firstName')});
    }
    if (!formData.last_name_en?.trim() && !formData.last_name_he?.trim()) {
      newErrors.last_name_en = t('validation.nameRequired', { field: t('doctors.lastName')});
    }
    if (!formData.license_number?.trim()) {
      newErrors.license_number = t('validation.required', { field: t('doctors.licenseNumber')});
    }
    if (!formData.specialty) {
      newErrors.specialty = t('validation.required', { field: t('doctors.specialty')});
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    if (formData.phone && !/^\+?[0-9\-\s()]{7,20}$/.test(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      // Ensure empty arrays are sent if no tags/sub-specialties
      dataToSave.sub_specialties = Array.isArray(dataToSave.sub_specialties) ? dataToSave.sub_specialties : [];
      dataToSave.tags = Array.isArray(dataToSave.tags) ? dataToSave.tags : [];
      
      if (initialDoctor?.id) {
        await Doctor.update(initialDoctor.id, dataToSave);
        toast({ title: t('doctors.updateSuccess') });
      } else {
        await Doctor.create(dataToSave);
        toast({ title: t('doctors.createSuccess') });
      }
      return true; // Indicate success
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast({
        variant: 'destructive',
        title: t('doctors.saveError'),
        description: error.message
      });
      return false; // Indicate failure
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialDoctor, toast, t, validate]);
  
  const resetForm = useCallback((data = null) => {
    if (data && typeof data === 'object') {
      setFormData({
        ...baseState,
        ...data,
        sub_specialties: Array.isArray(data.sub_specialties) ? data.sub_specialties : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    } else {
      setFormData(baseState);
    }
    setErrors({});
  }, [baseState]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit, // Renamed from handleFormSubmit for clarity with useCrudPage
    validateForm: validate, // Renamed for clarity
    resetForm,
    setFormData, // Expose setFormData for direct manipulation if needed by useCrudPage
    subSpecialtySuggestions,
    specialtyOptions, // Provide options for select fields
    // allDoctorsDataForCities: allExistingDoctors, // Pass through for city options if DoctorFormFields uses it
  };
}