import { isRequired, isEmail, minLength, maxLength, isILSPhoneNumber, isInEnum } from '@/components/utils/validation-rules';
// You might import regex directly if a rule needs it and isn't covered by a generic rule function
// import { SOME_SPECIFIC_REGEX } from '@/components/constants/validation-regex';

// Schema definition function to allow passing `t` for dynamic labels/messages
export const getDoctorSchema = (t) => ({
  first_name_en: {
    label: t('doctors.fields.first_name_en', { defaultValue: 'First Name (EN)' }),
    rules: [
      { type: 'isRequired' },
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 100 },
    ],
  },
  last_name_en: {
    label: t('doctors.fields.last_name_en', { defaultValue: 'Last Name (EN)' }),
    rules: [
      { type: 'isRequired' },
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 100 },
    ],
  },
  first_name_he: {
    label: t('doctors.fields.first_name_he', { defaultValue: 'First Name (HE)' }),
    rules: [
      { type: 'isRequired' },
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 100 },
    ],
  },
  last_name_he: {
    label: t('doctors.fields.last_name_he', { defaultValue: 'Last Name (HE)' }),
    rules: [
      { type: 'isRequired' },
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 100 },
    ],
  },
  license_number: {
    label: t('doctors.fields.license_number', { defaultValue: 'License Number' }),
    rules: [
      { type: 'isRequired' },
      { type: 'maxLength', value: 50 },
      // Example: { type: 'matchesRegex', value: /^[A-Z0-9-]+$/, messageKey: 'validation.invalidLicenseFormat' }
    ],
  },
  email: {
    label: t('doctors.fields.email', { defaultValue: 'Email' }),
    rules: [
      { type: 'isRequired' },
      { type: 'isEmail' },
    ],
  },
  phone: {
    label: t('doctors.fields.phone', { defaultValue: 'Phone' }),
    rules: [
      { type: 'isRequired' },
      { type: 'isILSPhoneNumber' }, // Using the specific rule
    ],
  },
  specialties: { // Assuming specialties is an array of strings and at least one is required
    label: t('doctors.fields.specialties', { defaultValue: 'Specialties' }),
    rules: [
      { 
        type: 'custom', 
        validate: (value, data, fieldLabel, t) => 
          (!Array.isArray(value) || value.length === 0) 
            ? t('validation.required', { field: fieldLabel }) 
            : null 
      }
    ]
  },
  // sub_specialties can be optional or have conditional rules
  city: {
    label: t('doctors.fields.city', { defaultValue: 'City' }),
    rules: [
       // { type: 'isRequired' }, // Make it optional if needed
      { type: 'maxLength', value: 100 },
    ],
  },
  address: {
    label: t('doctors.fields.address', { defaultValue: 'Address' }),
    rules: [
      { type: 'maxLength', value: 250 },
    ],
  },
  status: {
    label: t('doctors.fields.status', { defaultValue: 'Status' }),
    rules: [
      { type: 'isRequired' },
      { type: 'isInEnum', value: ['active', 'inactive'] }
    ],
  },
  notes: {
    label: t('doctors.fields.notes', { defaultValue: 'Notes' }),
    rules: [
      { type: 'maxLength', value: 2000 },
    ],
  },
  tags: {
      label: t('doctors.fields.tags', { defaultValue: 'Tags' }),
      rules: [
          // Example custom validation for array of strings, each tag having max length
          {
              type: 'custom',
              validate: (value, data, fieldLabel, t) => {
                  if (value && Array.isArray(value)) {
                      for (const tag of value) {
                          if (typeof tag !== 'string' || tag.length > 50) {
                              return t('validation.tagMaxLength', { field: fieldLabel, maxLength: 50, defaultValue: `Each tag in ${fieldLabel} must be a string and no more than 50 characters.` });
                          }
                      }
                  }
                  return null;
              }
          }
      ]
  }
  // Add more fields and nested structures as needed, e.g.
  // 'contact.secondary_phone': { ... }
});