import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Provider } from '@/api/entities';
import { useLanguage } from '../context/LanguageContext';

// Hardcoded provider types - no dependencies on external modules
const PROVIDER_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'imaging_center', label: 'Imaging Center' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'other', label: 'Other' }
];

// Hardcoded legal entity types - no dependencies on external modules
const LEGAL_ENTITY_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'licensed_dealer', label: 'Licensed Dealer' },
  { value: 'registered_association', label: 'Registered Association' }
];

export function useProviderForm(initialProvider = null) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [allProviders, setAllProviders] = useState([]);

  // Fixed base state
  const baseState = {
    name: { en: '', he: '' },
    provider_type: 'hospital',
    legal: { 
      type: 'company',
      identifier: '' 
    },
    contact: { 
      address: '', 
      city: '', 
      postal_code: '', 
      phone: '', 
      email: '' 
    },
    status: 'active',
    notes: ''
  };

  const [formData, setFormData] = useState(baseState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch providers once for city suggestions
  useEffect(() => {
    async function fetchProviders() {
      try {
        const result = await Provider.list();
        setAllProviders(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    }
    fetchProviders();
  }, []);

  // Set initial form data when initialProvider changes
  useEffect(() => {
    if (initialProvider && typeof initialProvider === 'object') {
      // Create a safe copy of initial provider
      const safeProvider = {
        ...baseState,
        ...initialProvider,
        name: {
          en: initialProvider.name?.en || '',
          he: initialProvider.name?.he || ''
        },
        legal: {
          type: initialProvider.legal?.type || 'company',
          identifier: initialProvider.legal?.identifier || ''
        },
        contact: {
          address: initialProvider.contact?.address || '',
          city: initialProvider.contact?.city || '',
          postal_code: initialProvider.contact?.postal_code || '',
          phone: initialProvider.contact?.phone || '',
          email: initialProvider.contact?.email || ''
        },
        status: initialProvider.status || 'active',
        notes: initialProvider.notes || ''
      };
      setFormData(safeProvider);
    } else {
      setFormData(baseState);
    }
    
    // Clear errors when initializing
    setErrors({});
  }, [initialProvider]);

  // Update a field at the root level
  function updateField(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // Update a nested field (for objects like name, legal, contact)
  function updateNestedField(objectField, nestedField, value) {
    setFormData(prev => ({
      ...prev,
      [objectField]: {
        ...(prev[objectField] || {}),
        [nestedField]: value
      }
    }));
    
    // Clear error for this nested field
    if (errors[objectField] && errors[objectField][nestedField]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[objectField]) {
          const newNestedErrors = { ...newErrors[objectField] };
          delete newNestedErrors[nestedField];
          
          // If no more nested errors, remove the parent error object
          if (Object.keys(newNestedErrors).length === 0) {
            delete newErrors[objectField];
          } else {
            newErrors[objectField] = newNestedErrors;
          }
        }
        return newErrors;
      });
    }
  }

  // Validate the form data
  function validate() {
    const newErrors = {};
    
    // Validate name (at least one language required)
    if (!formData.name?.en?.trim() && !formData.name?.he?.trim()) {
      newErrors.name = { en: t('validation.requiredEither', { field: t('providers.name') }) };
    }
    
    // Validate provider type
    if (!formData.provider_type) {
      newErrors.provider_type = t('validation.required', { field: t('providers.providerType') });
    }
    
    // Validate legal identifier if legal type is set
    if (formData.legal?.type && !formData.legal?.identifier?.trim()) {
      newErrors.legal = { 
        identifier: t('validation.required', { field: t('providers.legalIdentifier') })
      };
    } else if (
      formData.legal?.type && 
      formData.legal?.identifier && 
      !/^[0-9]{9}$/.test(formData.legal.identifier)
    ) {
      newErrors.legal = {
        identifier: t('validation.invalidIdPattern', { defaultValue: "Identifier must be 9 digits." })
      };
    }
    
    // Validate contact fields
    const contactErrors = {};
    
    if (!formData.contact?.address?.trim()) {
      contactErrors.address = t('validation.required', { field: t('providers.address') });
    }
    
    if (!formData.contact?.city?.trim()) {
      contactErrors.city = t('validation.required', { field: t('providers.city') });
    }
    
    if (formData.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      contactErrors.email = t('validation.invalidEmail');
    }
    
    if (formData.contact?.phone && !/^\+?[0-9\-\s()]{7,20}$/.test(formData.contact.phone)) {
      contactErrors.phone = t('validation.invalidPhone');
    }
    
    if (Object.keys(contactErrors).length > 0) {
      newErrors.contact = contactErrors;
    }
    
    // Validate status
    if (!formData.status) {
      newErrors.status = t('validation.required', { field: t('common.status') });
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return Object.keys(newErrors).length === 0;
  }

  // Submit the form
  async function handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    if (!validate()) {
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      if (initialProvider?.id) {
        await Provider.update(initialProvider.id, formData);
        toast({ 
          title: t('providers.updateSuccess', { defaultValue: 'Provider updated successfully.' })
        });
      } else {
        await Provider.create(formData);
        toast({ 
          title: t('providers.createSuccess', { defaultValue: 'Provider created successfully.' })
        });
      }
      return true;
    } catch (error) {
      console.error("Error saving provider:", error);
      toast({
        variant: "destructive",
        title: t('providers.saveError', { defaultValue: 'Error saving provider.' }),
        description: error.message
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset the form to initial state
  function resetForm() {
    setFormData(baseState);
    setErrors({});
  }

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateNestedField,
    handleSubmit,
    resetForm,
    validate,
    // Safely return array data
    allProvidersDataForCities: allProviders,
    providerTypeOptions: PROVIDER_TYPES,
    legalEntityTypeOptions: LEGAL_ENTITY_TYPES
  };
}