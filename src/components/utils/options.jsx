
import { DAYS_OF_WEEK,
  PROVIDER_TYPES,
  PROVIDER_LEGAL_TYPES,
  PROVIDER_STATUSES,
  DOCTOR_STATUSES,
  MEDICAL_SPECIALTIES,
  CITIES,
  LANGUAGES,
  COMMON_STATUSES,
  EXPERIENCE_YEARS,
  CODE_SYSTEMS,
  MATERIAL_UNITS,
  CURRENCIES,
  TASK_STATUSES,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
  TASK_RELATED_ENTITY_TYPES,
  AFFILIATION_STATUSES,
  CONTRACT_STATUSES,
  RFC_STATUSES,
  CLAIM_STATUSES,
  REGULATION_TYPES,
  IMPORT_MODULES,
  POLICY_STATUSES,
  GENDER_OPTIONS,
  ID_TYPES
} from "./constants";

// Re-export constants from constants file to maintain compatibility
export {
  PROVIDER_TYPES,
  PROVIDER_LEGAL_TYPES as LEGAL_ENTITY_TYPES, // Add alias for LEGAL_ENTITY_TYPES
  PROVIDER_LEGAL_TYPES,
  PROVIDER_STATUSES,
  DOCTOR_STATUSES,
  MEDICAL_SPECIALTIES,
  CITIES,
  LANGUAGES,
  COMMON_STATUSES,
  COMMON_STATUSES as STATUS_OPTIONS, // Add alias for STATUS_OPTIONS
  EXPERIENCE_YEARS,
  CODE_SYSTEMS,
  MATERIAL_UNITS,
  CURRENCIES,
  TASK_STATUSES,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
  TASK_RELATED_ENTITY_TYPES,
  AFFILIATION_STATUSES,
  CONTRACT_STATUSES,
  RFC_STATUSES,
  CLAIM_STATUSES,
  REGULATION_TYPES,
  IMPORT_MODULES,
  POLICY_STATUSES,
  GENDER_OPTIONS,
  ID_TYPES
};

/**
 * Generate status options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Status options for select fields
 */
export function getStatusOptions(t, includeAll = false) {
  const options = [
    { value: "active", label: t('common.statusOptions.active', { defaultValue: 'Active' }) },
    { value: "inactive", label: t('common.statusOptions.inactive', { defaultValue: 'Inactive' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate doctor specialty options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Specialty options
 */
export function getDoctorSpecialtyOptions(t, includeAll = false) {
  const options = [
    { value: "cardiology", label: t('doctors.specialties.cardiology', { defaultValue: 'Cardiology' }) },
    { value: "dermatology", label: t('doctors.specialties.dermatology', { defaultValue: 'Dermatology' }) },
    { value: "endocrinology", label: t('doctors.specialties.endocrinology', { defaultValue: 'Endocrinology' }) },
    { value: "gastroenterology", label: t('doctors.specialties.gastroenterology', { defaultValue: 'Gastroenterology' }) },
    { value: "neurology", label: t('doctors.specialties.neurology', { defaultValue: 'Neurology' }) },
    { value: "ophthalmology", label: t('doctors.specialties.ophthalmology', { defaultValue: 'Ophthalmology' }) },
    { value: "orthopedics", label: t('doctors.specialties.orthopedics', { defaultValue: 'Orthopedics' }) },
    { value: "pediatrics", label: t('doctors.specialties.pediatrics', { defaultValue: 'Pediatrics' }) },
    { value: "psychiatry", label: t('doctors.specialties.psychiatry', { defaultValue: 'Psychiatry' }) },
    { value: "urology", label: t('doctors.specialties.urology', { defaultValue: 'Urology' }) },
    { value: "general", label: t('doctors.specialties.general', { defaultValue: 'General Practice' }) },
    { value: "other", label: t('doctors.specialties.other', { defaultValue: 'Other' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate provider type options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Provider type options
 */
export function getProviderTypeOptions(t, includeAll = false) {
  const options = [
    { value: "hospital", label: t('providers.types.hospital', { defaultValue: 'Hospital' }) },
    { value: "clinic", label: t('providers.types.clinic', { defaultValue: 'Clinic' }) },
    { value: "imaging_center", label: t('providers.types.imaging_center', { defaultValue: 'Imaging Center' }) },
    { value: "laboratory", label: t('providers.types.laboratory', { defaultValue: 'Laboratory' }) },
    { value: "other", label: t('providers.types.other', { defaultValue: 'Other' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate legal entity type options for select fields
 * @param {Function} t - Translation function
 * @returns {Array} Legal entity options
 */
export function getLegalEntityTypeOptions(t) {
  return [
    { value: "company", label: t('providers.legalTypes.company', { defaultValue: 'Company' }) },
    { value: "licensed_dealer", label: t('providers.legalTypes.licensed_dealer', { defaultValue: 'Licensed Dealer' }) },
    { value: "registered_association", label: t('providers.legalTypes.registered_association', { defaultValue: 'Registered Association' }) },
  ];
}

/**
 * Generate task status options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Task status options
 */
export function getTaskStatusOptions(t, includeAll = false) {
  const options = [
    { value: "todo", label: t('tasks.statusOptions.todo', { defaultValue: 'To Do' }) },
    { value: "in_progress", label: t('tasks.statusOptions.in_progress', { defaultValue: 'In Progress' }) },
    { value: "done", label: t('tasks.statusOptions.done', { defaultValue: 'Done' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate task priority options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Task priority options
 */
export function getTaskPriorityOptions(t, includeAll = false) {
  const options = [
    { value: "low", label: t('tasks.priorityOptions.low', { defaultValue: 'Low' }) },
    { value: "medium", label: t('tasks.priorityOptions.medium', { defaultValue: 'Medium' }) },
    { value: "high", label: t('tasks.priorityOptions.high', { defaultValue: 'High' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate task category options for select fields
 * @param {Function} t - Translation function
 * @param {boolean} includeAll - Whether to include an "All" option
 * @returns {Array} Task category options
 */
export function getTaskCategoryOptions(t, includeAll = false) {
  const options = [
    { value: "work", label: t('tasks.categoryOptions.work', { defaultValue: 'Work' }) },
    { value: "personal", label: t('tasks.categoryOptions.personal', { defaultValue: 'Personal' }) },
    { value: "shopping", label: t('tasks.categoryOptions.shopping', { defaultValue: 'Shopping' }) },
    { value: "health", label: t('tasks.categoryOptions.health', { defaultValue: 'Health' }) },
    { value: "learning", label: t('tasks.categoryOptions.learning', { defaultValue: 'Learning' }) },
  ];
  
  if (includeAll) {
    options.unshift({ value: "all", label: t('common.all', { defaultValue: 'All' }) });
  }
  
  return options;
}

/**
 * Generate due date filter options for task lists
 * @param {Function} t - Translation function
 * @returns {Array} Due date filter options
 */
export function getDueDateFilterOptions(t) {
  return [
    { value: "all", label: t('tasks.dueDateOptions.all', { defaultValue: 'All Dates' }) },
    { value: "overdue", label: t('tasks.dueDateOptions.overdue', { defaultValue: 'Overdue' }) },
    { value: "today", label: t('tasks.dueDateOptions.today', { defaultValue: 'Today' }) },
    { value: "week", label: t('tasks.dueDateOptions.week', { defaultValue: 'This Week' }) },
    { value: "month", label: t('tasks.dueDateOptions.month', { defaultValue: 'This Month' }) },
    { value: "none", label: t('tasks.dueDateOptions.none', { defaultValue: 'No Due Date' }) },
  ];
}

/**
 * Generate days of week options
 * @param {Function} t - Translation function
 * @returns {Array} Days of week options
 */
export function getDaysOfWeekOptions(t) {
  return DAYS_OF_WEEK.map(day => ({
    value: day.value,
    label: t(`common.daysOfWeek.${day.value}`, { defaultValue: day.label })
  }));
}

// Helper functions to generate options for select dropdowns, useful for i18n

export const getPriorityOptions = (t) => [
  { value: 'low', label: t('tasks.priority.low', {defaultValue: 'Low'}) },
  { value: 'medium', label: t('tasks.priority.medium', {defaultValue: 'Medium'}) },
  { value: 'high', label: t('tasks.priority.high', {defaultValue: 'High'}) },
];

export const getStatusOptions_v2 = (t) => [
  { value: 'todo', label: t('tasks.status.todo', {defaultValue: 'To Do'}) },
  { value: 'in_progress', label: t('tasks.status.in_progress', {defaultValue: 'In Progress'}) },
  { value: 'done', label: t('tasks.status.done', {defaultValue: 'Done'}) },
];

export const getCategoryOptions = (t) => [
  { value: 'work', label: t('tasks.category.work', {defaultValue: 'Work'}) },
  { value: 'personal', label: t('tasks.category.personal', {defaultValue: 'Personal'}) },
  { value: 'shopping', label: t('tasks.category.shopping', {defaultValue: 'Shopping'}) },
  { value: 'health', label: t('tasks.category.health', {defaultValue: 'Health'}) },
  { value: 'learning', label: t('tasks.category.learning', {defaultValue: 'Learning'}) },
  { value: 'other', label: t('tasks.category.other', {defaultValue: 'Other'}) },
];

export const getDoctorStatusOptions = (t) => [
  { value: 'active', label: t('doctors.status.active', {defaultValue: 'Active'}) },
  { value: 'inactive', label: t('doctors.status.inactive', {defaultValue: 'Inactive'}) },
];

export const getProviderStatusOptions = (t) => [
  { value: 'active', label: t('providers.status.active', {defaultValue: 'Active'}) },
  { value: 'inactive', label: t('providers.status.inactive', {defaultValue: 'Inactive'}) },
];

export const getProviderTypeOptions_v2 = (t) => [
    { value: "hospital", label: t('providers.type.hospital', {defaultValue: "Hospital"}) },
    { value: "clinic", label: t('providers.type.clinic', {defaultValue: "Clinic"}) },
    { value: "imaging_center", label: t('providers.type.imaging_center', {defaultValue: "Imaging Center"}) },
    { value: "laboratory", label: t('providers.type.laboratory', {defaultValue: "Laboratory"}) },
    { value: "other", label: t('providers.type.other', {defaultValue: "Other"}) },
];

export const getProviderLegalTypeOptions_v2 = (t) => [
    { value: "company", label: t('providers.legalType.company', {defaultValue: "Company"}) },
    { value: "licensed_dealer", label: t('providers.legalType.licensed_dealer', {defaultValue: "Licensed Dealer"}) },
    { value: "registered_association", label: t('providers.legalType.registered_association', {defaultValue: "Registered Association"}) },
];

export const getYesNoAllOptions = (t) => [
    { value: "all", label: t('common.all', { defaultValue: "All" }) },
    { value: "yes", label: t('common.yes', { defaultValue: "Yes" }) },
    { value: "no", label: t('common.no', { defaultValue: "No" }) },
];

// Options for various select dropdowns

export const codeStatuses = [
  { value: "active", label: "Active" },
  { value: "deprecated", label: "Deprecated" },
];

export const booleanStatuses = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export const activeInactiveStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// For Crosswalks
export const codeTypes = [
  { value: "ICD9", label: "ICD-9" },
  { value: "ICD10", label: "ICD-10" },
  { value: "CPT", label: "CPT" },
  { value: "HCPCS", label: "HCPCS" },
  { value: "Internal", label: "Internal" },
  // Add other relevant code types here if needed
];

export const mappingTypes = [
  { value: "Single", label: "Single" },
  { value: "Alternative", label: "Alternative" },
  { value: "Combination", label: "Combination" },
  { value: "No Map", label: "No Map" },
];

export const accuracyTypes = [
  { value: "Exact", label: "Exact" },
  { value: "Approximate", label: "Approximate" },
  { value: "Partial", label: "Partial" },
];

// For DiagnosisProcedureRelation
export const relationTypes = [
  { value: "direct", label: "Direct" },
  { value: "catalog", label: "Catalog-based" },
  { value: "tag", label: "Tag-based" },
  { value: "exclusion", label: "Exclusion" },
];

export const ruleTypes = [
  { value: "include", label: "Include" },
  { value: "exclude", label: "Exclude" },
];
