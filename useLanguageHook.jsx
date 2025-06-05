
import { useState, useEffect, useCallback } from 'react'; // Added useCallback

// Hoisted MOCK_TRANSLATIONS to be a constant outside the hook
const MOCK_TRANSLATIONS = {
    'en': {
        'common.error': 'Error',
        'common.featureComingSoonDetailed': 'Full {{featureName}} capabilities will be available soon.',
        'buttons.viewError': 'View Error',
        'buttons.enable': 'Enable',
        'buttons.disable': 'Disable',
        'buttons.configure': 'Configure',
        'buttons.learnMore': 'Learn More',
        'buttons.manage': 'Manage',
        'pageTitles.networkManagement': 'Network Management',
        'networkManagement.pageDescription': 'Manage providers, doctors, and their affiliations.',
        // Short label for the provider-doctor linkage tab
        'pageTitles.providerDoctorLinkageShort': 'Linkages',
        'adminSettings.systemHealth.title': 'System Health Dashboard',
        'adminSettings.systemHealth.pageDescription': 'Overview of system component statuses and performance metrics.',
        'adminSettings.systemHealth.databaseService': 'Database Service',
        'adminSettings.systemHealth.apiGateway': 'API Gateway',
        'adminSettings.systemHealth.backgroundJobs': 'Background Job Processor',
        'adminSettings.systemHealth.securityServices': 'Security Services',
        'adminSettings.systemHealth.systemLoad': 'Overall System Load',
        'adminSettings.systemHealth.loadDescription': 'Current CPU and memory utilization.',
        'adminSettings.systemHealth.status.operational': 'Operational',
        'adminSettings.systemHealth.status.degraded_performance': 'Degraded Performance',
        'adminSettings.systemHealth.status.outage': 'Outage',
        'adminSettings.integrations.title': 'Manage Integrations',
        'adminSettings.integrations.pageDescription': 'Connect and configure third-party services and APIs.',
        'adminSettings.integrations.emailService.name': 'Transactional Email Service',
        'adminSettings.integrations.emailService.desc': 'For sending system notifications and alerts.',
        'adminSettings.integrations.paymentGateway.name': 'Payment Gateway',
        'adminSettings.integrations.paymentGateway.desc': 'To process payments for premium features.',
        'adminSettings.integrations.analytics.name': 'External Analytics Platform',
        'adminSettings.integrations.analytics.desc': 'Sync data with your preferred analytics tool.',
        'adminSettings.integrations.reportingApi.name': 'External Reporting API',
        'adminSettings.integrations.reportingApi.desc': 'Connect to external reporting systems.',
        'integrationStatus.active': 'Active',
        'integrationStatus.inactive': 'Inactive',
        'integrationStatus.pending_configuration': 'Pending Configuration',
        'integrationStatus.error': 'Error',
        'errors.rateLimitExceeded': 'Service is temporarily busy. Please try again in a few moments.',
        'errors.genericApiError': 'An error occurred. Please try again.',
        'errors.genericFetchError': 'Could not load data.',
        'common.success': 'Success',
        'common.warning': 'Warning',
        'errors.fetchDropdownError': 'Failed to load filter options.',
        'common.notSet': 'N/A',
        'common.invalidDate': 'Invalid Date',
        'common.confirmDelete': 'Are you sure you want to delete this item?',
        'common.deleteSuccess': 'Item deleted successfully.',
        'common.deleteError': 'Failed to delete item.',
        'common.updateSuccess': 'Item updated successfully.',
        'common.createSuccess': 'Item created successfully.',
        'common.saveError': 'Failed to save item.',
        'common.featureComingSoonTitle': 'Feature Coming Soon',
        'insurance.insuredPersons.dialogComingSoon': 'The dialog for adding/editing insured persons will be implemented soon.',
        'rfc.dialogComingSoon': 'The dialog for RFCs will be implemented soon.',
        'common.createdOn': 'Created',
        'fields.procedureDate': 'Procedure Date',
        'fields.insured': 'Insured',
        'fields.provider': 'Provider',
        'fields.doctor': 'Doctor',
        'fields.policyNumber': 'Policy #',
        'fields.procedures': 'Procedures',
        'fields.approvedAmount': 'Approved Amt',
        'buttons.viewDetails': 'View Details',
        'rfc.viewDetailsComingSoon': 'Viewing RFC details will be available soon.',
        'rfc.titleMultiple': 'Requests for Commitment',
        'buttons.addNewRFC': 'New RFC',
        'search.placeholderRFC': 'Search RFCs...',
        'filters.allStatuses': 'All Statuses',
        'status.draft': 'Draft',
        'status.submitted': 'Submitted',
        'status.inReview': 'In Review',
        'status.approved': 'Approved',
        'status.rejected': 'Rejected',
        'filters.selectStatus': 'Select Status',
        'filters.selectProvider': 'Select Provider',
        'filters.allProviders': 'All Providers',
        'buttons.resetFilters': 'Reset Filters',
        'buttons.refresh': 'Refresh',
        'buttons.retry': 'Retry',
        'rfc.noRFCsMatchTitle': 'No RFCs Match Filters',
        'rfc.noRFCsMatchFilterDesc': 'Try adjusting filters or create a new RFC.',
        'rfc.noRFCsDesc': 'No RFCs found. Start by creating a new request for commitment.',
        'common.unknown': 'Unknown',
        'fields.created': 'Created',
        'fields.notes': 'Notes',
        'errors.partialLoadFailure': 'Some data could not be loaded. Functionality may be limited. Please refresh to try again.',
        'errors.fetchFailedSingular': 'Failed to load {{entity}}.',
        'insurance.insuredPersons.title': 'Insured Persons',
        'buttons.addNew': 'Add New',
        'common.filters': 'Filters & Search',
        'search.placeholderInsuredPerson': 'Search by name, email, or ID...',
        'filters.selectGender': 'Select Gender',
        'filters.allGenders': 'All Genders',
        'gender.male': 'Male',
        'gender.female': 'Female',
        'gender.other': 'Other',
        'insurance.insuredPersons.noPersons': 'No Insured Persons Found',
        'insurance.insuredPersons.noPersonsFilterDesc': 'No insured persons match your current filters. Try adjusting your search.',
        'insurance.insuredPersons.noPersonsDesc': 'Start by adding a new insured person to manage their details.',
        'buttons.addNewInsuredPerson': 'Add Insured Person',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.email': 'Email',
        'common.phone': 'Phone',
        'common.gender': 'Gender',
        'identification.type': 'ID Type',
        'idType.national_id': 'National ID',
        'idType.insurance_number': 'Insurance No.',
        'idType.passport': 'Passport',
        'identification.number': 'ID Number',
        'common.dateOfBirth': 'Date of Birth',

        // Doctors specific translations
        'doctors.fields.name': 'Name',
        'doctors.fields.licenseNumber': 'License No.',
        'doctors.fields.specialties': 'Specialties',
        'doctors.fields.subSpecialties': 'Sub-Specialties',
        'doctors.fields.phone': 'Phone',
        'doctors.fields.email': 'Email',
        'doctors.fields.city': 'City',
        'doctors.fields.address': 'Address',
        'doctors.fields.status': 'Status', // Already have common.status, but can be specific if needed
        'doctors.fields.tags': 'Tags',
        'doctors.fields.notes': 'Notes',
        'doctors.searchPlaceholder': 'Search by Name, License, Email...',
        'doctors.addNewDoctor': 'Add New Doctor',
        'doctors.editDoctor': 'Edit Doctor',
        'doctors.deleteDoctor': 'Delete Doctor',
        'doctors.deleteConfirmMessage': 'Are you sure you want to delete doctor "{{name}}"? This action cannot be undone.',
        'doctors.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'doctors.createSuccess': 'Doctor "{{name}}" created successfully.',
        'doctors.updateSuccess': 'Doctor "{{name}}" updated successfully.',
        'doctors.deleteSuccess': 'Doctor "{{name}}" deleted successfully.',
        'doctors.bulkDeleteSuccess': 'Successfully deleted {{count}} doctors.',
        'doctors.deleteError': 'Failed to delete doctor "{{name}}". Error: {{error}}',
        'pageTitles.doctorsSingular': 'Doctor', // For consistency
        'pageTitles.doctorsPlural': 'Doctors', // For consistency
        'pageTitles.doctorsMultipleItems': '{{count}} doctors', // For bulk messages
        'emptyStates.noDoctorsTitle': 'No Doctors Found',
        'emptyStates.noDoctorsMessage': 'Start by adding a new doctor to manage their details.',
        'emptyStates.noDoctorsFilterTitle': 'No Doctors Match Filters',
        'emptyStates.noDoctorsFilterMessage': 'Try adjusting your search or filter criteria.',

        // Provider specific (checking existing, adding if necessary)
        'providers.fields.name': 'Provider Name',
        'providers.fields.provider_type': 'Type',
        'providers.fields.city': 'City',
        'providers.fields.status': 'Status',
        'providers.titleMultiple': 'Providers',
        'providers.itemTitleSingular': 'Provider',
        'providers.itemTitlePlural': 'Providers',
        'providers.itemTitlePluralItems': '{{count}} providers',
        'providers.addProvider': 'Add Provider',
        'providers.editProvider': 'Edit Provider',
        'providers.deleteConfirmMessage': 'Are you sure you want to delete provider "{{name}}"? This action cannot be undone.',
        'providers.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'providers.createSuccess': 'Provider "{{name}}" created successfully.',
        'providers.updateSuccess': 'Provider "{{name}}" updated successfully.',
        'providers.deleteError': 'Could not delete provider "{{name}}". Error: {{error}}',
        
        // Linkage specific translations
        'linkage.itemTitleSingular': 'Linkage',
        'linkage.itemTitlePlural': 'Linkages',
        'linkage.addLink': 'Add Linkage',
        'linkage.editLink': 'Edit Linkage',
        'linkage.deleteLink': 'Delete Linkage',
        'linkage.deleteConfirmMessage': 'Are you sure you want to delete this linkage?',
        'linkage.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}?',
        'linkage.createSuccess': 'Linkage created successfully.',
        'linkage.updateSuccess': 'Linkage updated successfully.',
        'linkage.deleteError': 'Failed to delete linkage. Error: {{error}}',
        'fields.startDate': 'Start Date',
        'fields.endDate': 'End Date',
        'fields.affiliationStatus': 'Affiliation Status', // Example, adjust as needed
        'linkage.searchPlaceholder': 'Search by Doctor or Provider name...',
        'linkage.filters.selectProvider': 'Select Provider',
        'linkage.filters.selectDoctor': 'Select Doctor',
        'linkage.filters.selectAffiliationStatus': 'Select Affiliation Status',
        'linkage.noLinkagesFound': 'No Linkages Found',
        'linkage.noLinkagesFilterMessage': 'No linkages match your current filters. Try adjusting your search.',
        'linkage.startAdding': 'Start by adding a new linkage between a doctor and a provider.',

        // Tasks specific translations
        'tasks.fields.title': 'Title',
        'tasks.fields.description': 'Description',
        'tasks.fields.status': 'Status',
        'tasks.fields.priority': 'Priority',
        'tasks.fields.category': 'Category',
        'tasks.fields.dueDate': 'Due Date',
        'tasks.fields.assignedTo': 'Assigned To',
        'tasks.fields.estimatedHours': 'Estimated Hours',
        'tasks.fields.actualHours': 'Actual Hours',
        'tasks.searchPlaceholder': 'Search tasks...',
        'tasks.addNewTask': 'Add New Task',
        'tasks.editTask': 'Edit Task',
        'tasks.deleteTask': 'Delete Task',
        'tasks.deleteConfirmMessage': 'Are you sure you want to delete task "{{name}}"? This action cannot be undone.',
        'tasks.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'tasks.createSuccess': 'Task "{{name}}" created successfully.',
        'tasks.updateSuccess': 'Task "{{name}}" updated successfully.',
        'tasks.deleteSuccess': 'Task "{{name}}" deleted successfully.',
        'tasks.bulkDeleteSuccess': 'Successfully deleted {{count}} tasks.',
        'tasks.deleteError': 'Failed to delete task "{{name}}". Error: {{error}}',
        'pageTitles.tasks': 'Tasks',
        'pageTitles.tasksSingular': 'Task',
        'pageTitles.tasksPlural': 'Tasks',
        'pageTitles.tasksMultipleItems': '{{count}} tasks',
        'emptyStates.noTasksTitle': 'No Tasks Found',
        'emptyStates.noTasksMessage': 'Start by adding a new task to manage your work.',
        'emptyStates.noTasksFilterTitle': 'No Tasks Match Filters',
        'emptyStates.noTasksFilterMessage': 'Try adjusting your search or filter criteria.',

        // Status translations for tasks
        'status.todo': 'Todo',
        'status.in_progress': 'In Progress',
        'status.done': 'Done',
        'status.cancelled': 'Cancelled',

        // Priority translations
        'priority.low': 'Low',
        'priority.medium': 'Medium',
        'priority.high': 'High',
        'priority.urgent': 'Urgent',
        'filters.allPriorities': 'All Priorities',
        'filters.selectPriority': 'Select Priority',

        // Category translations
        'category.claim_review': 'Claim Review',
        'category.provider_onboarding': 'Provider Onboarding',
        'category.contract_negotiation': 'Contract Negotiation',
        'category.compliance_check': 'Compliance Check',
        'category.data_validation': 'Data Validation',
        'category.system_maintenance': 'System Maintenance',
        'category.training': 'Training',
        'category.general': 'General',
        'filters.allCategories': 'All Categories',
        'filters.selectCategory': 'Select Category',
        
        // Medical Codes specific translations
        'medicalCodes.fields.code': 'Code',
        'medicalCodes.fields.codeSystem': 'Code System',
        'medicalCodes.fields.descriptionEn': 'Description (EN)',
        'medicalCodes.fields.descriptionHe': 'Description (HE)',
        'medicalCodes.fields.tags': 'Tags',
        'medicalCodes.fields.catalogPath': 'Catalog Path',
        'medicalCodes.fields.status': 'Status',
        'medicalCodes.searchPlaceholder': 'Search by code or description...',
        'medicalCodes.addNew': 'Add New Medical Code',
        'medicalCodes.edit': 'Edit Medical Code',
        'medicalCodes.delete': 'Delete Medical Code',
        'medicalCodes.deleteConfirmMessage': 'Are you sure you want to delete medical code "{{name}}"? This action cannot be undone.',
        'medicalCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'medicalCodes.createSuccess': 'Medical code "{{name}}" created successfully.',
        'medicalCodes.updateSuccess': 'Medical code "{{name}}" updated successfully.',
        'medicalCodes.deleteSuccess': 'Medical code "{{name}}" deleted successfully.',
        'medicalCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} medical codes.',
        'medicalCodes.deleteError': 'Failed to delete medical code "{{name}}". Error: {{error}}',
        'medicalCodes.titleMultiple': 'Medical Codes',
        'medicalCodes.itemTitleSingular': 'Medical Code',
        'medicalCodes.itemTitlePluralItems': '{{count}} medical codes',
        'emptyStates.noMedicalCodesTitle': 'No Medical Codes Found',
        'emptyStates.noMedicalCodesMessage': 'Start by adding a new medical code to the system.',
        'emptyStates.noMedicalCodesFilterTitle': 'No Medical Codes Match Filters',
        'emptyStates.noMedicalCodesFilterMessage': 'Try adjusting your search or filter criteria.',
        'filters.allCodeSystems': 'All Code Systems',
        'filters.selectCodeSystem': 'Select Code System',
        'status.deprecated': 'Deprecated',
        'errors.medicalCodeDataMissing': 'Medical code data could not be loaded or is incomplete.',
        'common.noDescription': 'No description available.',
        'common.unknownCode': 'Unknown Code',
        
        // Internal Codes specific translations
        'internalCodes.fields.codeNumber': 'Code Number',
        'internalCodes.fields.descriptionEn': 'Description (EN)',
        'internalCodes.fields.descriptionHe': 'Description (HE)',
        'internalCodes.fields.category_id': 'Category ID', // Keep for consistency
        'internalCodes.fields.categoryPath': 'Category Path',
        'internalCodes.fields.tags': 'Tags',
        'internalCodes.fields.isBillable': 'Billable',
        'internalCodes.fields.isBillableShort.true': 'Billable',
        'internalCodes.fields.isBillableShort.false': 'Not Billable',
        'internalCodes.fields.isActive': 'Active Status', // 'Active' or 'Inactive'
        'internalCodes.searchPlaceholder': 'Search by code, description, or category...',
        'internalCodes.addNew': 'Add New Internal Code',
        'internalCodes.edit': 'Edit Internal Code',
        'internalCodes.deleteConfirmMessage': 'Are you sure you want to delete internal code "{{name}}"? This action cannot be undone.',
        'internalCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'internalCodes.createSuccess': 'Internal code "{{name}}" created successfully.',
        'internalCodes.updateSuccess': 'Internal code "{{name}}" updated successfully.',
        'internalCodes.deleteSuccess': 'Internal code "{{name}}" deleted successfully.',
        'internalCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} internal codes.',
        'internalCodes.deleteError': 'Failed to delete internal code "{{name}}". Error: {{error}}',
        'internalCodes.titleMultiple': 'Internal Codes',
        'internalCodes.itemTitleSingular': 'Internal Code',
        'internalCodes.itemTitlePluralItems': '{{count}} internal codes',
        'emptyStates.noInternalCodesTitle': 'No Internal Codes Found',
        'emptyStates.noInternalCodesMessage': 'Start by adding a new internal code to the system.',
        'emptyStates.noInternalCodesFilterTitle': 'No Internal Codes Match Filters',
        'emptyStates.noInternalCodesFilterMessage': 'Try adjusting your search or filter criteria.',
        'filters.allBillable': 'All (Billable Status)',
        'filters.selectBillable': 'Select Billable Status',
        'errors.internalCodeDataMissing': 'Internal code data could not be loaded or is incomplete.',

        // Insurance Codes specific translations  
        'insuranceCodes.fields.code': 'Code',
        'insuranceCodes.fields.nameEn': 'Name (EN)',
        'insuranceCodes.fields.nameHe': 'Name (HE)', 
        'insuranceCodes.fields.categoryPath': 'Category Path',
        'insuranceCodes.fields.requiresPreAuth': 'Pre-Authorization',
        'insuranceCodes.fields.isActive': 'Status',
        'insuranceCodes.searchPlaceholder': 'Search by code or name...',
        'insuranceCodes.addNew': 'Add New Insurance Code',
        'insuranceCodes.edit': 'Edit Insurance Code',
        'insuranceCodes.delete': 'Delete Insurance Code',
        'insuranceCodes.deleteConfirmMessage': 'Are you sure you want to delete insurance code "{{name}}"? This action cannot be undone.',
        'insuranceCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
        'insuranceCodes.createSuccess': 'Insurance code "{{name}}" created successfully.',
        'insuranceCodes.updateSuccess': 'Insurance code "{{name}}" updated successfully.',
        'insuranceCodes.deleteSuccess': 'Insurance code "{{name}}" deleted successfully.',
        'insuranceCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} insurance codes.',
        'insuranceCodes.deleteError': 'Failed to delete insurance code "{{name}}". Error: {{error}}',
        'insuranceCodes.titleMultiple': 'Insurance Codes',
        'insuranceCodes.itemTitleSingular': 'Insurance Code',
        'insuranceCodes.itemTitlePlural': 'Insurance Codes',
        'insuranceCodes.itemTitlePluralItems': '{{count}} insurance codes',
        'insuranceCodes.noCodesYetTitle': 'No Insurance Codes Yet',
        'insuranceCodes.noCodesYetDesc': 'Get started by adding a new insurance code.',
        'insuranceCodes.noCodesMatchTitle': 'No Insurance Codes Match Filters',
        'insuranceCodes.noCodesMatchDesc': 'Try adjusting your search or filter criteria.',
        'insuranceCodes.filterByCategory': 'Filter by category...',
        'insuranceCodes.filters.selectPreAuth': 'Select Pre-Auth',
        'filters.allPreAuth': 'All Pre-Auth',
        'common.required': 'Required',
        'common.notRequired': 'Not Required',
        
        // Common bulk actions
        'bulkActions.selectionModeActiveTitle': 'Selection Mode Activated for {{mode}}',
        'bulkActions.selectionModeActiveDesc': 'Select {{entity}} to {{mode}}.',
        'bulkActions.noItemsSelectedTitle': 'No Items Selected',
        'bulkActions.selectItemsPrompt': 'Please select items to {{mode}}.',
        'bulkActions.selectOneToEditTitle': 'Select One Item',
        'bulkActions.selectOneToEditDesc': 'Please select only one {{entity}} to edit.',
        'bulkActions.selectedCount': '{{count}} selected',
        'bulkActions.selectItemsPromptShort': 'Select items to {{mode}}',
        'bulkActions.selectAllVisible': 'Select all visible',
        'bulkActions.selectAllRows': 'Select all rows',
        'bulkActions.selectRow': 'Select row',
        'bulkActions.deleteResultTitle': 'Deletion Summary',
        'bulkActions.deleteResultDesc': 'Successfully deleted {{successCount}} {{entity}}, failed to delete {{failCount}}.',
        
        // Common buttons & labels already present or slightly adjusted
        'buttons.import': 'Import',
        'buttons.export': 'Export',
        'buttons.previous': 'Previous',
        'buttons.next': 'Next',
        'buttons.apply': 'Apply',
        'buttons.save': 'Save',
        'buttons.create': 'Create',
        'buttons.update': 'Update',
        'buttons.add': 'Add',
        'buttons.close': 'Close',

        // Common error messages
        'errors.invalidDataTitle': 'Invalid Data',
        'errors.providerDataMissing': 'Provider data could not be loaded or is incomplete.',
        'errors.doctorDataMissing': 'Doctor data could not be loaded or is incomplete.',
        'errors.itemNotFoundTitle': 'Item Not Found',
        'errors.itemNotFoundMessage': 'The requested {{item}} could not be found.',
        'errors.itemNotFoundToEditDesc': 'The selected item could not be found for editing.',
        'errors.fetchFailedGeneral': 'Failed to fetch {{item}}.',
        'errors.dataLoadErrorTitle': 'Data Load Error',
        'errors.partialLoadWarning': 'Some {{entity}} data might be stale or incomplete due to a recent error: {{message}}. Please refresh for the latest data.',

        // Common messages
        'messages.refreshingData': 'Refreshing Data',
        'messages.fetchingLatest': 'Fetching latest {{item}}...',
        'messages.success': 'Success!',
        'messages.updatingData': 'Updating {{item}}...',
        'messages.loadingData': 'Loading {{item}}...', // For consistency
        
        // DataTable
        'dataTable.pageInfo': 'Page {{page}} of {{totalPages}}',
        'dataTable.paginationSummary': 'Showing {{start}}-{{end}} of {{total}} {{entity}}',

        // Filters
        'filters.allTypes': 'All Types',
        'filters.allSpecialties': 'All Specialties',
        'filters.allCities': 'All Cities',
        'filters.selectSpecialty': 'Select Specialty',
        'filters.selectCity': 'Select City',
        'filters.allLegalTypes': 'All Legal Types',

        // View Switcher
        'viewSwitcher.cardView': 'Card View',
        'viewSwitcher.tableView': 'Table View',

        // Import Dialog
        'import.noRecordsTitle': 'No Records To Import',
        'import.noRecordsDesc': 'The uploaded file does not contain any records to import.',
        'import.noValidRecordsTitle': 'No Valid Records',
        'import.noValidRecordsDesc': 'No valid records found in the file to import for {{entity}}.',
        'import.completedTitle': 'Import Completed',
        'import.completedDesc': 'Successfully imported {{successCount}} records. {{errorCount}} records failed for {{entity}}.',
        'import.featureNotImplemented': 'Import feature for {{entity}} is not yet implemented.',
        'import.comingSoonTitle': 'Import Coming Soon',
        'import.noFileTitle': 'No File Selected',
        'import.noFileDesc': 'Please select a file to import.',
        
        // General
        'common.actions': 'Actions',
        'common.filtersAndSort': 'Filters & Sort',
        'common.sortBy': 'Sort By',
        'common.search': 'Search',
        'common.unknownProvider': 'Unknown Provider',
        'common.unknownDoctor': 'Unknown Doctor',
        'common.item': 'Item',
        'common.items': 'Items',
        'common.data': 'Data',
        'common.noResultsFound': 'No {{item}} found',
        'common.tryAdjustingFilters': 'Try adjusting your search or filters.',
        'common.errorLoading': 'Error loading {{item}}.',
        'common.confirmDeleteTitle': 'Confirm Delete {{item}} ({{count}})',
        'common.confirmDeleteDescription': 'Are you sure you want to delete {{item}} ({{count}})? This action cannot be undone.',
        'common.langCode': 'en', // For logic based on language
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.featureComingSoonDesc': '{{featureName}} will be available soon.'
    },
    'he': {
        'common.langCode': 'he',
        'common.cancel': 'ביטול',
        'common.confirm': 'אישור'
    }
};

// Simple language hook implementation
export function useLanguageHook() {
  const [language, setLanguage] = useState('en'); // Default to 'en'
  const [isRTL, setIsRTL] = useState(false); // Default RTL status

  useEffect(() => {
    setIsRTL(language === 'he');
    // document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key, options) => {
    // 1. Validate key
    if (typeof key !== 'string') {
      // console.warn('[useLanguageHook] t() called with non-string key:', key);
      return 'INVALID_KEY';
    }

    // 2. Initialize safeOptions robustly
    let S_options = {};
    if (options !== null && typeof options === 'object') {
      S_options = options;
    }
    // S_options is GUARANTEED to be an object.

    // 3. Attempt direct translation (simplified for this example)
    const langToUse = MOCK_TRANSLATIONS[language] ? language : 'en';
    const currentTranslations = MOCK_TRANSLATIONS[langToUse] || MOCK_TRANSLATIONS['en']; // Fallback to 'en' translations if langToUse is invalid
    const translatedString = currentTranslations[key];

    if (typeof translatedString === 'string') {
      // Basic variable replacement (e.g. {{item}})
      if (S_options && typeof S_options === 'object') {
          let resultString = translatedString;
          for (const placeholderKey in S_options) {
              if (Object.prototype.hasOwnProperty.call(S_options, placeholderKey) && placeholderKey !== 'defaultValue') {
                  resultString = resultString.replace(new RegExp(`{{${placeholderKey}}}`, 'g'), S_options[placeholderKey]);
              }
          }
          return resultString;
      }
      return translatedString;
    }
    
    // Fallback logic:
    if (S_options && typeof S_options.defaultValue === 'string') {
      return S_options.defaultValue;
    }
    
    // Final fallback: return the key itself
    // console.warn(`[useLanguageHook] Key "${key}" not found for language "${language}", no valid defaultValue. Returning key.`);
    return key;
  }, [language]); // `t` function now only changes if `language` changes

  return { t, language, setLanguage, isRTL };
}
