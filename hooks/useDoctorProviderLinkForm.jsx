import { useState, useEffect, useCallback } from 'react';
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { parseISO, isValid } from 'date-fns';

    // This hook can encapsulate the form logic for the LinkageDialog
    // For now, much of this logic is directly in LinkageDialog.jsx
    // This can be a future refactor to centralize form state and validation if needed.

    export default function useDoctorProviderLinkForm(initialLinkageData) {
        const { t } = useLanguageHook();
        const [formData, setFormData] = useState({
            doctor_id: '',
            provider_id: '',
            affiliation_status: 'active',
            start_date: new Date(),
            end_date: null,
            is_primary_location: false,
            special_notes: '',
        });
        const [errors, setErrors] = useState({});

        const resetForm = useCallback(() => {
            setFormData({
                doctor_id: initialLinkageData?.doctor_id || '',
                provider_id: initialLinkageData?.provider_id || '',
                affiliation_status: initialLinkageData?.affiliation_status || 'active',
                start_date: initialLinkageData?.start_date ? (isValid(parseISO(initialLinkageData.start_date)) ? parseISO(initialLinkageData.start_date) : new Date()) : new Date(),
                end_date: initialLinkageData?.end_date ? (isValid(parseISO(initialLinkageData.end_date)) ? parseISO(initialLinkageData.end_date) : null) : null,
                is_primary_location: initialLinkageData?.is_primary_location || false,
                special_notes: initialLinkageData?.special_notes || '',
            });
            setErrors({});
        }, [initialLinkageData]);

        useEffect(() => {
            resetForm();
        }, [initialLinkageData, resetForm]);

        const handleChange = (field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: null }));
            }
        };

        const validate = () => {
            const newErrors = {};
            if (!formData.doctor_id) newErrors.doctor_id = t('validation.required', { field: 'Doctor' });
            if (!formData.provider_id) newErrors.provider_id = t('validation.required', { field: 'Provider' });
            if (!formData.start_date) newErrors.start_date = t('validation.required', { field: 'Start Date' });
            if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
                newErrors.end_date = t('validation.endDateAfterStartSimple');
            }
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        return {
            formData,
            setFormData, // Expose if direct setting is needed
            handleChange,
            errors,
            validate,
            resetForm,
        };
    }