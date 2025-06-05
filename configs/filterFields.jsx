import { 
  STATUS_OPTIONS,
  PROVIDER_TYPES,
  CODE_SYSTEM_OPTIONS,
  CODE_STATUSES,
  MATERIAL_UNITS,
  CURRENCY_OPTIONS,
  CONTRACT_STATUSES,
  PAYMENT_METHODS,
  CLAIM_STATUSES,
  REQUEST_STATUSES,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  REGULATION_TYPES
} from '@/components/utils/constants';

// Safely get options array with .map protection
const safeGetOptions = (options) => Array.isArray(options) ? options : [];

// Doctor filter fields
export const doctorFilterFields = [
  {
    id: 'specialty',
    labelKey: 'doctors.specialty',
    type: 'select',
    options: [], // Filled dynamically from available specialties
    defaultValue: 'all'
  },
  {
    id: 'city',
    labelKey: 'doctors.city',
    type: 'select',
    options: [], // Filled dynamically from available cities
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(STATUS_OPTIONS),
    defaultValue: 'all'
  }
];

// Provider filter fields
export const providerFilterFields = [
  {
    id: 'type',
    labelKey: 'providers.type',
    type: 'select',
    options: safeGetOptions(PROVIDER_TYPES),
    defaultValue: 'all'
  },
  {
    id: 'city',
    labelKey: 'providers.city',
    type: 'select',
    options: [], // Filled dynamically from available cities
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(STATUS_OPTIONS),
    defaultValue: 'all'
  }
];

// Medical code filter fields
export const medicalCodeFilterFields = [
  {
    id: 'codeSystem',
    labelKey: 'medicalCodes.codeSystem',
    type: 'select',
    optionsKey: 'codeSystems', // Will use CODE_SYSTEMS from constants
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    optionsKey: 'codeStatuses', // Will use CODE_STATUSES from constants
    defaultValue: 'all'
  },
  // { // Example if categories were available for filtering
  //   id: 'category',
  //   labelKey: 'medicalCodes.category',
  //   type: 'select',
  //   optionsKey: 'medicalCodeCategories', // Filled dynamically
  //   defaultValue: 'all'
  // }
];

// Material filter fields
export const materialFilterFields = [
  {
    id: 'unitOfMeasure',
    labelKey: 'materials.unitOfMeasure',
    type: 'select',
    optionsKey: 'materialUnits', // Will use MATERIAL_UNITS from constants
    defaultValue: 'all'
  },
  {
    id: 'currency',
    labelKey: 'materials.currency',
    type: 'select',
    optionsKey: 'currencyOptions', // Will use CURRENCY_OPTIONS from constants (transformed for label)
    defaultValue: 'all'
  },
  {
    id: 'hasVariants',
    labelKey: 'materials.hasVariants',
    type: 'boolean', // This usually means a select with Yes/No/All
    options: [ // Explicit options for boolean-like filter
      { value: 'all', labelKey: 'common.all' },
      { value: 'true', labelKey: 'common.yes' },
      { value: 'false', labelKey: 'common.no' }
    ],
    defaultValue: 'all'
  },
  {
    id: 'status', // For materials, this maps to is_active
    labelKey: 'common.status',
    type: 'select',
    options: [ // Explicit options for active/inactive
        { value: 'all', labelKey: 'statusOptions.all' },
        { value: 'active', labelKey: 'statusOptions.active' },
        { value: 'inactive', labelKey: 'statusOptions.inactive' }
    ],
    defaultValue: 'all'
  }
];

// Contract filter fields
export const contractFilterFields = [
  {
    id: 'provider',
    labelKey: 'contracts.provider',
    type: 'select',
    options: [], // Filled dynamically from available providers
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(CONTRACT_STATUSES),
    defaultValue: 'all'
  },
  {
    id: 'paymentMethod',
    labelKey: 'contracts.paymentMethod',
    type: 'select',
    options: safeGetOptions(PAYMENT_METHODS),
    defaultValue: 'all'
  }
];

// Claim filter fields
export const claimFilterFields = [
  {
    id: 'provider',
    labelKey: 'claims.provider',
    type: 'select',
    options: [], // Filled dynamically from available providers
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(CLAIM_STATUSES),
    defaultValue: 'all'
  },
  {
    id: 'date',
    labelKey: 'claims.date',
    type: 'dateRange',
    defaultValue: {
      from: null,
      to: null
    }
  }
];

// Request filter fields
export const requestFilterFields = [
  {
    id: 'provider',
    labelKey: 'requests.provider',
    type: 'select',
    options: [], // Filled dynamically from available providers
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(REQUEST_STATUSES),
    defaultValue: 'all'
  },
  {
    id: 'date',
    labelKey: 'requests.date',
    type: 'dateRange',
    defaultValue: {
      from: null,
      to: null
    }
  }
];

// Task filter fields
export const taskFilterFields = [
  {
    id: 'status',
    labelKey: 'tasks.status', // This is from entity, not common.status
    type: 'select',
    optionsKey: 'taskStatusOptions', // Will use TASK_STATUS_OPTIONS from constants
    defaultValue: 'all'
  },
  {
    id: 'priority',
    labelKey: 'tasks.priority',
    type: 'select',
    optionsKey: 'taskPriorityOptions', // Will use TASK_PRIORITY_OPTIONS from constants
    defaultValue: 'all'
  },
  {
    id: 'category',
    labelKey: 'tasks.category', // Add translation if not present
    type: 'select',
    optionsKey: 'taskCategoryOptions', // Filled dynamically from Task entity enum
    defaultValue: 'all'
  }
  // { // Example for assignee filter
  //   id: 'assignee',
  //   labelKey: 'tasks.assignee',
  //   type: 'select',
  //   optionsKey: 'users', // Filled dynamically from available users
  //   defaultValue: 'all'
  // }
];

// Regulation filter fields
export const regulationFilterFields = [
  {
    id: 'type',
    labelKey: 'regulations.type',
    type: 'select',
    options: safeGetOptions(REGULATION_TYPES),
    defaultValue: 'all'
  },
  {
    id: 'status',
    labelKey: 'common.status',
    type: 'select',
    options: safeGetOptions(STATUS_OPTIONS),
    defaultValue: 'all'
  },
  {
    id: 'effective',
    labelKey: 'regulations.effectiveDate',
    type: 'dateRange',
    defaultValue: {
      from: null,
      to: null
    }
  }
];