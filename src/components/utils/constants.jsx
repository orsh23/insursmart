

// Provider-related constants
export const PROVIDER_TYPES = [
  { value: 'hospital', label: 'Hospital', labelKey: 'providerTypes.hospital' },
  { value: 'clinic', label: 'Clinic', labelKey: 'providerTypes.clinic' },
  { value: 'imaging_center', label: 'Imaging Center', labelKey: 'providerTypes.imaging_center' },
  { value: 'laboratory', label: 'Laboratory', labelKey: 'providerTypes.laboratory' },
  { value: 'other', label: 'Other', labelKey: 'providerTypes.other' }
];

export const PROVIDER_LEGAL_TYPES = [
  { value: 'company', label: 'Company', labelKey: 'legalTypes.company' },
  { value: 'licensed_dealer', label: 'Licensed Dealer', labelKey: 'legalTypes.licensed_dealer' },
  { value: 'registered_association', label: 'Registered Association', labelKey: 'legalTypes.registered_association' }
];

export const PROVIDER_STATUSES = [
  { value: 'active', label: 'Active', labelKey: 'status.active' },
  { value: 'inactive', label: 'Inactive', labelKey: 'status.inactive' }
];

// Doctor-related constants
export const DOCTOR_STATUSES = [
  { value: 'active', label: 'Active', labelKey: 'status.active' },
  { value: 'inactive', label: 'Inactive', labelKey: 'status.inactive' }
];

export const MEDICAL_SPECIALTIES = [
  { value: 'cardiology', label: 'Cardiology', labelKey: 'specialties.cardiology' },
  { value: 'orthopedics', label: 'Orthopedics', labelKey: 'specialties.orthopedics' },
  { value: 'neurology', label: 'Neurology', labelKey: 'specialties.neurology' },
  { value: 'general_medicine', label: 'General Medicine', labelKey: 'specialties.general_medicine' },
  { value: 'surgery', label: 'Surgery', labelKey: 'specialties.surgery' },
  { value: 'pediatrics', label: 'Pediatrics', labelKey: 'specialties.pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry', labelKey: 'specialties.psychiatry' },
  { value: 'dermatology', label: 'Dermatology', labelKey: 'specialties.dermatology' },
  { value: 'ophthalmology', label: 'Ophthalmology', labelKey: 'specialties.ophthalmology' },
  { value: 'other', label: 'Other', labelKey: 'specialties.other' }
];

// Common constants
export const CITIES = [
    { value: 'tel_aviv', labelKey: 'cities.tel_aviv', defaultValue: 'Tel Aviv' },
    { value: 'jerusalem', labelKey: 'cities.jerusalem', defaultValue: 'Jerusalem' },
    { value: 'haifa', labelKey: 'cities.haifa', defaultValue: 'Haifa' },
    { value: 'beer_sheva', labelKey: 'cities.beer_sheva', defaultValue: 'Beer Sheva' },
    { value: 'ashdod', labelKey: 'cities.ashdod', defaultValue: 'Ashdod' },
    { value: 'netanya', labelKey: 'cities.netanya', defaultValue: 'Netanya' },
    { value: 'other', labelKey: 'cities.other', defaultValue: 'Other' }
];

export const LANGUAGES = [
    { value: 'en', labelKey: 'languages.en', defaultValue: 'English' },
    { value: 'he', labelKey: 'languages.he', defaultValue: 'Hebrew' },
    { value: 'ar', labelKey: 'languages.ar', defaultValue: 'Arabic' },
    { value: 'ru', labelKey: 'languages.ru', defaultValue: 'Russian' },
    { value: 'fr', labelKey: 'languages.fr', defaultValue: 'French' }
];

// Common status options
export const COMMON_STATUSES = [
  { value: 'active', label: 'Active', labelKey: 'status.active' },
  { value: 'inactive', label: 'Inactive', labelKey: 'status.inactive' },
  { value: 'pending', label: 'Pending', labelKey: 'status.pending' },
  { value: 'suspended', label: 'Suspended', labelKey: 'status.suspended' },
  { value: 'terminated', label: 'Terminated', labelKey: 'status.terminated' }
];

// Experience Years (used in dialogs and can be used for filters)
export const EXPERIENCE_YEARS = [
    { value: 'less_than_5', labelKey: 'doctors.experienceYears.lessThan5', defaultLabel: 'Less than 5 years' },
    { value: '5_to_10', labelKey: 'doctors.experienceYears.5to10', defaultLabel: '5-10 years' },
    { value: '10_to_20', labelKey: 'doctors.experienceYears.10to20', defaultLabel: '10-20 years' },
    { value: 'more_than_20', labelKey: 'doctors.experienceYears.moreThan20', defaultLabel: 'More than 20 years' }
];

// Code Systems
export const CODE_SYSTEMS = [
    { value: 'ICD9-DX', labelKey: 'codeSystems.icd9dx', defaultValue: 'ICD-9-DX (Diagnosis)' },
    { value: 'ICD9-PROC', labelKey: 'codeSystems.icd9proc', defaultValue: 'ICD-9-PROC (Procedure)' },
    { value: 'ICD10-CM', labelKey: 'codeSystems.icd10cm', defaultValue: 'ICD-10-CM (Diagnosis)' },
    { value: 'ICD10-PCS', labelKey: 'codeSystems.icd10pcs', defaultValue: 'ICD-10-PCS (Procedure)' },
    { value: 'CPT', labelKey: 'codeSystems.cpt', defaultValue: 'CPT (Current Procedural Terminology)' },
    { value: 'HCPCS', labelKey: 'codeSystems.hcpcs', defaultValue: 'HCPCS (Healthcare Common Procedure Coding System)' },
    { value: 'LOINC', labelKey: 'codeSystems.loinc', defaultValue: 'LOINC (Logical Observation Identifiers Names and Codes)' },
    { value: 'SNOMED-CT', labelKey: 'codeSystems.snomed_ct', defaultValue: 'SNOMED CT' },
    { value: 'RXNORM', labelKey: 'codeSystems.rxnorm', defaultValue: 'RxNorm' },
    { value: 'INTERNAL', labelKey: 'codeSystems.internal', defaultValue: 'Internal Codes' },
    { value: 'PROVIDER_INTERNAL', labelKey: 'codeSystems.provider_internal', defaultValue: 'Provider Internal Codes' },
    { value: 'OTHER', labelKey: 'codeSystems.other', defaultValue: 'Other' },
];

// Material Units of Measure
export const MATERIAL_UNITS = [
    { value: 'unit', labelKey: 'materials.units.unit', defaultValue: 'Unit' },
    { value: 'item', labelKey: 'materials.units.item', defaultValue: 'Item' },
    { value: 'mg', labelKey: 'materials.units.mg', defaultValue: 'Milligram (mg)' },
    { value: 'ml', labelKey: 'materials.units.ml', defaultValue: 'Milliliter (ml)' },
    { value: 'g', labelKey: 'materials.units.g', defaultValue: 'Gram (g)' },
    { value: 'kg', labelKey: 'materials.units.kg', defaultValue: 'Kilogram (kg)' },
    { value: 'l', labelKey: 'materials.units.l', defaultValue: 'Liter (l)' },
    { value: 'box', labelKey: 'materials.units.box', defaultValue: 'Box' },
    { value: 'pack', labelKey: 'materials.units.pack', defaultValue: 'Pack' },
    { value: 'kit', labelKey: 'materials.units.kit', defaultValue: 'Kit' },
    { value: 'set', labelKey: 'materials.units.set', defaultValue: 'Set' },
    { value: 'each', labelKey: 'materials.units.each', defaultValue: 'Each' },
    { value: 'pair', labelKey: 'materials.units.pair', defaultValue: 'Pair' },
    { value: 'package', labelKey: 'materials.units.package', defaultValue: 'Package' },
    { value: 'roll', labelKey: 'materials.units.roll', defaultValue: 'Roll' },
    { value: 'cm', labelKey: 'materials.units.cm', defaultValue: 'Centimeter (cm)' },
    { value: 'm', labelKey: 'materials.units.m', defaultValue: 'Meter (m)' },
];

// Currencies
export const CURRENCIES = [
    { value: 'ILS', labelKey: 'currencies.ils', defaultValue: 'ILS (₪)' },
    { value: 'USD', labelKey: 'currencies.usd', defaultValue: 'USD ($)' },
    { value: 'EUR', labelKey: 'currencies.eur', defaultValue: 'EUR (€)' },
    { value: 'GBP', labelKey: 'currencies.gbp', defaultValue: 'GBP (£)' },
];

// Task-related constants
export const TASK_STATUSES = [
  { value: 'todo', label: 'Todo', labelKey: 'status.todo' },
  { value: 'in_progress', label: 'In Progress', labelKey: 'status.in_progress' },
  { value: 'done', label: 'Done', labelKey: 'status.done' },
  { value: 'cancelled', label: 'Cancelled', labelKey: 'status.cancelled' }
];

// Adding this constant specifically for the Kanban view (kept as it was not in the outline to change)
export const TASK_STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', labelKey: 'priority.low' },
  { value: 'medium', label: 'Medium', labelKey: 'priority.medium' },
  { value: 'high', label: 'High', labelKey: 'priority.high' },
  { value: 'urgent', label: 'Urgent', labelKey: 'priority.urgent' }
];

export const TASK_CATEGORIES = [
  { value: 'claim_review', label: 'Claim Review', labelKey: 'category.claim_review' },
  { value: 'provider_onboarding', label: 'Provider Onboarding', labelKey: 'category.provider_onboarding' },
  { value: 'contract_negotiation', label: 'Contract Negotiation', labelKey: 'category.contract_negotiation' },
  { value: 'compliance_check', label: 'Compliance Check', labelKey: 'category.compliance_check' },
  { value: 'data_validation', label: 'Data Validation', labelKey: 'category.data_validation' },
  { value: 'system_maintenance', label: 'System Maintenance', labelKey: 'category.system_maintenance' },
  { value: 'training', label: 'Training', labelKey: 'category.training' },
  { value: 'general', label: 'General', labelKey: 'category.general' }
];

export const TASK_RELATED_ENTITY_TYPES = [
  { value: 'none', label: 'None', labelKey: 'common.none' },
  { value: 'provider', label: 'Provider', labelKey: 'providers.itemTitleSingular' },
  { value: 'doctor', label: 'Doctor', labelKey: 'pageTitles.doctorsSingular' },
  { value: 'claim', label: 'Claim', labelKey: 'claims.itemTitleSingular' },
  { value: 'rfc', label: 'RFC', labelKey: 'rfc.itemTitleSingular' },
  { value: 'contract', label: 'Contract', labelKey: 'contracts.itemTitleSingular' },
  { value: 'policy', label: 'Policy', labelKey: 'policies.itemTitleSingular' }
];

// Affiliation Statuses (Doctor-Provider Linkage)
export const AFFILIATION_STATUSES = [
    { value: 'active', labelKey: 'affiliations.status.active', defaultValue: 'Active' },
    { value: 'inactive', labelKey: 'affiliations.status.inactive', defaultValue: 'Inactive' },
    { value: 'pending_approval', labelKey: 'affiliations.status.pending_approval', defaultValue: 'Pending Approval' },
    { value: 'expired', labelKey: 'affiliations.status.expired', defaultValue: 'Expired' },
];

// Contract Statuses
export const CONTRACT_STATUSES = [
    { value: 'draft', labelKey: 'contracts.status.draft', defaultValue: 'Draft' },
    { value: 'active', labelKey: 'contracts.status.active', defaultValue: 'Active' },
    { value: 'expired', labelKey: 'contracts.status.expired', defaultValue: 'Expired' },
    { value: 'terminated', labelKey: 'contracts.status.terminated', defaultValue: 'Terminated' },
    { value: 'pending_review', labelKey: 'contracts.status.pending_review', defaultValue: 'Pending Review' },
    { value: 'archived', labelKey: 'contracts.status.archived', defaultValue: 'Archived' },
];

// Request For Commitment (RFC) Statuses
export const RFC_STATUSES = [
    { value: 'draft', labelKey: 'rfc.status.draft', defaultValue: 'Draft' },
    { value: 'submitted', labelKey: 'rfc.status.submitted', defaultValue: 'Submitted' },
    { value: 'in_review', labelKey: 'rfc.status.in_review', defaultValue: 'In Review' },
    { value: 'approved', labelKey: 'rfc.status.approved', defaultValue: 'Approved' },
    { value: 'partially_approved', labelKey: 'rfc.status.partially_approved', defaultValue: 'Partially Approved' },
    { value: 'rejected', labelKey: 'rfc.status.rejected', defaultValue: 'Rejected' },
    { value: 'cancelled', labelKey: 'rfc.status.cancelled', defaultValue: 'Cancelled' },
    { value: 'pending_information', labelKey: 'rfc.status.pending_information', defaultValue: 'Pending Information' },
];

// Claim Statuses
export const CLAIM_STATUSES = [
    { value: 'draft', labelKey: 'claims.status.draft', defaultValue: 'Draft' },
    { value: 'submitted', labelKey: 'claims.status.submitted', defaultValue: 'Submitted' },
    { value: 'in_review', labelKey: 'claims.status.in_review', defaultValue: 'In Review' },
    { value: 'pending_information', labelKey: 'claims.status.pending_information', defaultValue: 'Pending Information' },
    { value: 'approved_for_payment', labelKey: 'claims.status.approved_for_payment', defaultValue: 'Approved for Payment' },
    { value: 'partially_paid', labelKey: 'claims.status.partially_paid', defaultValue: 'Partially Paid' },
    { value: 'paid_in_full', labelKey: 'claims.status.paid_in_full', defaultValue: 'Paid in Full' },
    { value: 'rejected', labelKey: 'claims.status.rejected', defaultValue: 'Rejected' },
    { value: 'denied', labelKey: 'claims.status.denied', defaultValue: 'Denied' }, // Often similar to rejected but can have specific legal/policy implications
    { value: 'appealed', labelKey: 'claims.status.appealed', defaultValue: 'Appealed' },
];

// Regulation Types
export const REGULATION_TYPES = [
    { value: 'insurance', labelKey: 'regulations.type.insurance', defaultValue: 'Insurance Regulation' },
    { value: 'healthcare', labelKey: 'regulations.type.healthcare', defaultValue: 'Healthcare Standard/Guideline' },
    { value: 'internal_policy', labelKey: 'regulations.type.internal_policy', defaultValue: 'Internal Company Policy' },
    { value: 'legal_compliance', labelKey: 'regulations.type.legal_compliance', defaultValue: 'Legal & Compliance' },
    { value: 'financial', labelKey: 'regulations.type.financial', defaultValue: 'Financial Regulation' },
    { value: 'data_privacy', labelKey: 'regulations.type.data_privacy', defaultValue: 'Data Privacy (e.g., GDPR, HIPAA-like)' },
    { value: 'other', labelKey: 'regulations.type.other', defaultValue: 'Other' },
];

// Import Modules (for Import History)
export const IMPORT_MODULES = [
    { value: 'doctors', labelKey: 'importModules.doctors', defaultValue: 'Doctors' },
    { value: 'providers', labelKey: 'importModules.providers', defaultValue: 'Providers' },
    { value: 'medical_codes', labelKey: 'importModules.medical_codes', defaultValue: 'Medical Codes' },
    { value: 'internal_codes', labelKey: 'importModules.internal_codes', defaultValue: 'Internal Codes' },
    { value: 'materials', labelKey: 'importModules.materials', defaultValue: 'Materials' },
    { value: 'boms', labelKey: 'importModules.boms', defaultValue: 'Bills of Material' },
    { value: 'contracts', labelKey: 'importModules.contracts', defaultValue: 'Contracts' },
    { value: 'tariffs', labelKey: 'importModules.tariffs', defaultValue: 'Tariffs' },
    { value: 'insured_persons', labelKey: 'importModules.insured_persons', defaultValue: 'Insured Persons' },
    { value: 'policies', labelKey: 'importModules.policies', defaultValue: 'Policies' },
];

// Insurance Policy Statuses
export const POLICY_STATUSES = [
    { value: 'active', labelKey: 'policies.status.active', defaultValue: 'Active' },
    { value: 'inactive', labelKey: 'policies.status.inactive', defaultValue: 'Inactive' }, // General inactive state
    { value: 'pending_activation', labelKey: 'policies.status.pending_activation', defaultValue: 'Pending Activation' },
    { value: 'suspended', labelKey: 'policies.status.suspended', defaultValue: 'Suspended' },
    { value: 'terminated', labelKey: 'policies.status.terminated', defaultValue: 'Terminated' },
    { value: 'expired', labelKey: 'policies.status.expired', defaultValue: 'Expired' },
    { value: 'lapsed', labelKey: 'policies.status.lapsed', defaultValue: 'Lapsed (e.g. non-payment)' },
];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', labelKey: 'gender.male' },
  { value: 'female', label: 'Female', labelKey: 'gender.female' },
  { value: 'other', label: 'Other', labelKey: 'gender.other' }
];

// ID Type options
export const ID_TYPES = [
  { value: 'national_id', label: 'National ID', labelKey: 'idType.national_id' },
  { value: 'insurance_number', label: 'Insurance Number', labelKey: 'idType.insurance_number' },
  { value: 'passport', label: 'Passport', labelKey: 'idType.passport' }
];
