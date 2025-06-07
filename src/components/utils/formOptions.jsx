/**
 * Centralized form options and constants
 */

// Status options
export const STATUS_OPTIONS = [
  { value: 'active', labelKey: 'status.active', defaultValue: 'Active' },
  { value: 'inactive', labelKey: 'status.inactive', defaultValue: 'Inactive' }
];

// Provider types
export const PROVIDER_TYPE_OPTIONS = [
  { value: 'hospital', labelKey: 'providerTypes.hospital', defaultValue: 'Hospital' },
  { value: 'clinic', labelKey: 'providerTypes.clinic', defaultValue: 'Clinic' },
  { value: 'imaging_center', labelKey: 'providerTypes.imagingCenter', defaultValue: 'Imaging Center' },
  { value: 'laboratory', labelKey: 'providerTypes.laboratory', defaultValue: 'Laboratory' },
  { value: 'other', labelKey: 'providerTypes.other', defaultValue: 'Other' }
];

// Legal entity types
export const LEGAL_TYPE_OPTIONS = [
  { value: 'company', labelKey: 'legalTypes.company', defaultValue: 'Company' },
  { value: 'licensed_dealer', labelKey: 'legalTypes.licensedDealer', defaultValue: 'Licensed Dealer' },
  { value: 'registered_association', labelKey: 'legalTypes.registeredAssociation', defaultValue: 'Registered Association' }
];

// Priority levels
export const PRIORITY_OPTIONS = [
  { value: 'low', labelKey: 'priority.low', defaultValue: 'Low' },
  { value: 'medium', labelKey: 'priority.medium', defaultValue: 'Medium' },
  { value: 'high', labelKey: 'priority.high', defaultValue: 'High' },
  { value: 'urgent', labelKey: 'priority.urgent', defaultValue: 'Urgent' }
];

// Task categories
export const TASK_CATEGORY_OPTIONS = [
  { value: 'claim_review', labelKey: 'taskCategories.claimReview', defaultValue: 'Claim Review' },
  { value: 'provider_onboarding', labelKey: 'taskCategories.providerOnboarding', defaultValue: 'Provider Onboarding' },
  { value: 'contract_negotiation', labelKey: 'taskCategories.contractNegotiation', defaultValue: 'Contract Negotiation' },
  { value: 'compliance_check', labelKey: 'taskCategories.complianceCheck', defaultValue: 'Compliance Check' },
  { value: 'data_validation', labelKey: 'taskCategories.dataValidation', defaultValue: 'Data Validation' },
  { value: 'system_maintenance', labelKey: 'taskCategories.systemMaintenance', defaultValue: 'System Maintenance' },
  { value: 'training', labelKey: 'taskCategories.training', defaultValue: 'Training' },
  { value: 'general', labelKey: 'taskCategories.general', defaultValue: 'General' }
];

// Task statuses
export const TASK_STATUS_OPTIONS = [
  { value: 'todo', labelKey: 'taskStatus.todo', defaultValue: 'To Do' },
  { value: 'in_progress', labelKey: 'taskStatus.inProgress', defaultValue: 'In Progress' },
  { value: 'done', labelKey: 'taskStatus.done', defaultValue: 'Done' },
  { value: 'cancelled', labelKey: 'taskStatus.cancelled', defaultValue: 'Cancelled' }
];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', labelKey: 'gender.male', defaultValue: 'Male' },
  { value: 'female', labelKey: 'gender.female', defaultValue: 'Female' },
  { value: 'other', labelKey: 'gender.other', defaultValue: 'Other' }
];

// ID types
export const ID_TYPE_OPTIONS = [
  { value: 'national_id', labelKey: 'idType.nationalId', defaultValue: 'National ID' },
  { value: 'insurance_number', labelKey: 'idType.insuranceNumber', defaultValue: 'Insurance Number' },
  { value: 'passport', labelKey: 'idType.passport', defaultValue: 'Passport' }
];

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'ILS', labelKey: 'currency.ils', defaultValue: 'Israeli Shekel (₪)' },
  { value: 'USD', labelKey: 'currency.usd', defaultValue: 'US Dollar ($)' },
  { value: 'EUR', labelKey: 'currency.eur', defaultValue: 'Euro (€)' }
];

// Medical specialties (common ones)
export const MEDICAL_SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology'
];

// Code systems
export const CODE_SYSTEM_OPTIONS = [
  { value: 'ICD9-DX', labelKey: 'codeSystems.icd9dx', defaultValue: 'ICD-9 Diagnosis' },
  { value: 'ICD10-CM', labelKey: 'codeSystems.icd10cm', defaultValue: 'ICD-10 Clinical Modification' },
  { value: 'ICD10-PCS', labelKey: 'codeSystems.icd10pcs', defaultValue: 'ICD-10 Procedure Coding System' },
  { value: 'CPT', labelKey: 'codeSystems.cpt', defaultValue: 'Current Procedural Terminology' },
  { value: 'HCPCS', labelKey: 'codeSystems.hcpcs', defaultValue: 'Healthcare Common Procedure Coding System' },
  { value: 'ICD9-PROC', labelKey: 'codeSystems.icd9proc', defaultValue: 'ICD-9 Procedure' }
];

// Unit of measure options
export const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'unit', labelKey: 'unitOfMeasure.unit', defaultValue: 'Unit' },
  { value: 'mg', labelKey: 'unitOfMeasure.mg', defaultValue: 'Milligram (mg)' },
  { value: 'ml', labelKey: 'unitOfMeasure.ml', defaultValue: 'Milliliter (ml)' },
  { value: 'g', labelKey: 'unitOfMeasure.g', defaultValue: 'Gram (g)' },
  { value: 'kg', labelKey: 'unitOfMeasure.kg', defaultValue: 'Kilogram (kg)' },
  { value: 'box', labelKey: 'unitOfMeasure.box', defaultValue: 'Box' },
  { value: 'pack', labelKey: 'unitOfMeasure.pack', defaultValue: 'Pack' }
];

/**
 * Helper function to create options with translation support
 */
export function createOptions(options, t = null) {
  return options.map(option => ({
    value: option.value,
    label: t ? t(option.labelKey, { defaultValue: option.defaultValue }) : option.defaultValue
  }));
}

/**
 * Helper function to get option label by value
 */
export function getOptionLabel(options, value, t = null) {
  const option = options.find(opt => opt.value === value);
  if (!option) return value;
  return t ? t(option.labelKey, { defaultValue: option.defaultValue }) : option.defaultValue;
}