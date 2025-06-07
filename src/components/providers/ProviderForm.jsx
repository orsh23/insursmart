
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, User, MapPin, Phone, Mail, FileText, Info } from 'lucide-react';
import FormField from '@/components/forms/FormField';
import { Label } from '@/components/ui/label';

export default function ProviderForm({ initialData, onSubmit, isSubmitting = false, viewOnly = false }) {
  const { t, language, isRTL } = useLanguageHook();
  
  const defaultFormData = {
    name: { en: "", he: "" },
    provider_type: "clinic",
    legal: { type: "company", identifier: "" },
    contact: {
      contact_person_name: "",
      street_name: "",
      street_number: "",
      address: "",
      city: "",
      postal_code: "",
      phone: "",
      email: ""
    },
    status: "active",
    notes: "",
    tags: []
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        name: initialData.name || { en: "", he: "" },
        legal: initialData.legal || { type: "company", identifier: "" },
        contact: initialData.contact || { ...defaultFormData.contact },
        tags: Array.isArray(initialData.tags) ? [...initialData.tags] : []
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties (using dot notation in names)
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the correct nested object
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          current = current[key] = { ...current[key] };
        }
        
        // Set the value at the final nested property
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleStatusChange = (checked) => {
    setFormData(prev => ({ ...prev, status: checked ? "active" : "inactive" }));
  };

  const handleTagsChange = (tags) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.name.en.trim()) newErrors['name.en'] = t('validation.required', { field: t('providers.form.nameEn') });
    if (!formData.name.he.trim()) newErrors['name.he'] = t('validation.required', { field: t('providers.form.nameHe') });
    if (!formData.provider_type) newErrors.provider_type = t('validation.required', { field: t('providers.form.providerType') });
    if (!formData.legal.type) newErrors['legal.type'] = t('validation.required', { field: t('providers.form.legalType') });
    
    // Legal identifier validation - must be 9 digits
    if (!formData.legal.identifier.trim()) {
      newErrors['legal.identifier'] = t('validation.required', { field: t('providers.form.legalIdentifier') });
    } else if (!/^\d{9}$/.test(formData.legal.identifier.trim())) {
      newErrors['legal.identifier'] = t('validation.pattern', { 
        field: t('providers.form.legalIdentifier'), 
        pattern: t('validation.9digits') 
      });
    }
    
    // Contact validation
    if (!formData.contact.city.trim()) newErrors['contact.city'] = t('validation.required', { field: t('providers.form.city') });
    
    // Email validation if provided
    if (formData.contact.email && !/\S+@\S+\.\S+/.test(formData.contact.email)) {
      newErrors['contact.email'] = t('validation.email');
    }
    
    // Phone validation if provided
    if (formData.contact.phone && !/^[\d\s\-\+\(\)]{6,}$/.test(formData.contact.phone)) {
      newErrors['contact.phone'] = t('validation.phone');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return;
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const providerTypes = [
    { value: "hospital", label: t('providers.typeOptions.hospital', { defaultValue: "Hospital" }) },
    { value: "clinic", label: t('providers.typeOptions.clinic', { defaultValue: "Clinic" }) },
    { value: "imaging_center", label: t('providers.typeOptions.imaging_center', { defaultValue: "Imaging Center" }) },
    { value: "laboratory", label: t('providers.typeOptions.laboratory', { defaultValue: "Laboratory" }) },
    { value: "other", label: t('providers.typeOptions.other', { defaultValue: "Other" }) }
  ];

  const legalTypes = [
    { value: "company", label: t('providers.legalOptions.company', { defaultValue: "Company" }) },
    { value: "licensed_dealer", label: t('providers.legalOptions.licensed_dealer', { defaultValue: "Licensed Dealer" }) },
    { value: "registered_association", label: t('providers.legalOptions.registered_association', { defaultValue: "Registered Association" }) }
  ];

  // Cities could be fetched or provided via props. For now, we'll use a textfield.

  const getFieldError = (name) => {
    return errors[name] ? (
      <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors[name]}</p>
    ) : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {viewOnly ? (
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('providers.form.basicInfo')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="font-medium">{t('providers.form.nameEn')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.name.en || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.nameHe')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200" dir="rtl">{formData.name.he || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.providerType')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {providerTypes.find(type => type.value === formData.provider_type)?.label || t('common.unknown')}
                </p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.status')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {formData.status === 'active' ? 
                    t('common.active') : 
                    t('common.inactive')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Legal Information */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('providers.form.legalInfo')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="font-medium">{t('providers.form.legalType')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {legalTypes.find(type => type.value === formData.legal.type)?.label || t('common.unknown')}
                </p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.legalIdentifier')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.legal.identifier || t('common.notProvided')}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('providers.form.contactInfo')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="font-medium">{t('providers.form.contactPerson')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.contact.contact_person_name || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.phone')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.contact.phone || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.email')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {formData.contact.email ? (
                    <a href={`mailto:${formData.contact.email}`} className="text-blue-600 hover:underline">
                      {formData.contact.email}
                    </a>
                  ) : t('common.notProvided')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('providers.form.addressInfo')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="font-medium">{t('providers.form.street')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {formData.contact.street_name ? `${formData.contact.street_name} ${formData.contact.street_number || ''}` : t('common.notProvided')}
                </p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.city')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.contact.city || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.postalCode')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.contact.postal_code || t('common.notProvided')}</p>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.addressDetails')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{formData.contact.address || t('common.notProvided')}</p>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          {formData.notes && (
            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('providers.form.additionalInfo')}</h3>
              </div>
              
              <div>
                <Label className="font-medium">{t('providers.form.notes')}</Label>
                <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-line">{formData.notes}</p>
              </div>
            </div>
          )}
          
          {/* Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('common.tags')}</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic" className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              {t('providers.form.basicInfo', {defaultValue: 'Basic Information'})}
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {t('providers.form.legalInfo', {defaultValue: 'Legal Information'})}
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {t('providers.form.contactInfo', {defaultValue: 'Contact Information'})}
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {t('providers.form.addressInfo', {defaultValue: 'Address Information'})}
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              {t('providers.form.additionalInfo', {defaultValue: 'Additional Information'})}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="name.en"
                label={t('providers.form.nameEn', {defaultValue: 'Name (English)'})}
                error={errors['name.en']}
                required={true}
              >
                <Input
                  id="name.en"
                  name="name.en"
                  value={formData.name.en}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  required
                  aria-invalid={errors['name.en'] ? 'true' : 'false'}
                />
              </FormField>
              
              <FormField
                id="name.he"
                label={t('providers.form.nameHe', {defaultValue: 'Name (Hebrew)'})}
                error={errors['name.he']}
                required={true}
              >
                <Input
                  id="name.he"
                  name="name.he"
                  value={formData.name.he}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  required
                  dir="rtl"
                  aria-invalid={errors['name.he'] ? 'true' : 'false'}
                />
              </FormField>
              
              <FormField
                id="provider_type"
                label={t('providers.form.providerType', {defaultValue: 'Provider Type'})}
                error={errors['provider_type']}
                required={true}
              >
                <Select
                  id="provider_type"
                  name="provider_type"
                  value={formData.provider_type}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                >
                  {providerTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </Select>
              </FormField>

              <div>
                <Label htmlFor="status_switch">{t('providers.form.status')}</Label>
                <div className="flex items-center mt-2">
                  <Switch
                    id="status_switch"
                    checked={formData.status === 'active'}
                    onCheckedChange={handleStatusChange}
                    disabled={viewOnly || isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {formData.status === 'active' ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              </div>
              
            </div>
          </TabsContent>
          
          <TabsContent value="legal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="legal.type"
                label={t('providers.form.legalType', {defaultValue: 'Legal Type'})}
                error={errors['legal.type']}
                required={true}
              >
                <Select
                  id="legal.type"
                  name="legal.type"
                  value={formData.legal.type}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                >
                  {legalTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </Select>
              </FormField>
              
              <FormField
                id="legal.identifier"
                label={t('providers.form.legalIdentifier', {defaultValue: 'Legal Identifier'})}
                error={errors['legal.identifier']}
                required={true}
              >
                <Input
                  id="legal.identifier"
                  name="legal.identifier"
                  value={formData.legal.identifier}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  placeholder="e.g., 123456789"
                  aria-invalid={errors['legal.identifier'] ? 'true' : 'false'}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('providers.form.identifierHelp')}</p>
              </FormField>
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="contact.contact_person_name"
                label={t('providers.form.contactPerson', {defaultValue: 'Contact Person'})}
                error={errors['contact.contact_person_name']}
              >
                <Input
                  id="contact.contact_person_name"
                  name="contact.contact_person_name"
                  value={formData.contact.contact_person_name}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                />
              </FormField>
              
              <FormField
                id="contact.phone"
                label={t('providers.form.phone', {defaultValue: 'Phone'})}
                error={errors['contact.phone']}
              >
                <Input
                  id="contact.phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  aria-invalid={errors['contact.phone'] ? 'true' : 'false'}
                />
              </FormField>
              
              <FormField
                id="contact.email"
                label={t('providers.form.email', {defaultValue: 'Email'})}
                error={errors['contact.email']}
              >
                <Input
                  id="contact.email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  type="email"
                  placeholder="example@domain.com"
                  aria-invalid={errors['contact.email'] ? 'true' : 'false'}
                />
              </FormField>
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="contact.street_name"
                label={t('providers.form.streetName', {defaultValue: 'Street Name'})}
                error={errors['contact.street_name']}
              >
                <Input
                  id="contact.street_name"
                  name="contact.street_name"
                  value={formData.contact.street_name}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                />
              </FormField>
              
              <FormField
                id="contact.street_number"
                label={t('providers.form.streetNumber', {defaultValue: 'Street Number'})}
                error={errors['contact.street_number']}
              >
                <Input
                  id="contact.street_number"
                  name="contact.street_number"
                  value={formData.contact.street_number}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                />
              </FormField>
              
              <FormField
                id="contact.city"
                label={t('providers.form.city', {defaultValue: 'City'})}
                error={errors['contact.city']}
                required={true}
              >
                <Input
                  id="contact.city"
                  name="contact.city"
                  value={formData.contact.city}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  required
                  aria-invalid={errors['contact.city'] ? 'true' : 'false'}
                />
              </FormField>
              
              <FormField
                id="contact.postal_code"
                label={t('providers.form.postalCode', {defaultValue: 'Postal Code'})}
                error={errors['contact.postal_code']}
              >
                <Input
                  id="contact.postal_code"
                  name="contact.postal_code"
                  value={formData.contact.postal_code}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                />
              </FormField>
              
              <div className="md:col-span-2">
                <FormField
                  id="contact.address"
                  label={t('providers.form.addressDetails', {defaultValue: 'Address Details'})}
                  error={errors['contact.address']}
                >
                  <Textarea
                    id="contact.address"
                    name="contact.address"
                    value={formData.contact.address}
                    onChange={handleChange}
                    disabled={viewOnly || isSubmitting}
                    placeholder={t('providers.form.addressDetailsPlaceholder')}
                    rows={3}
                  />
                </FormField>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="space-y-6">
            <div>
              <FormField
                id="notes"
                label={t('providers.form.notes', {defaultValue: 'Notes'})}
                error={errors['notes']}
              >
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={viewOnly || isSubmitting}
                  placeholder={t('providers.form.notesPlaceholder')}
                  rows={5}
                />
              </FormField>
            </div>
            
          </TabsContent>
        </Tabs>
      )}

      {!viewOnly && (
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => onSubmit(null)} // Cancel
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.saving') : (initialData ? t('common.update') : t('common.create'))}
          </button>
        </div>
      )}
    </form>
  );
}
