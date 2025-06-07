// Centralized translation data
export const TRANSLATIONS = {
  'en': {
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.loading': 'Loading',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.retry': 'Retry',
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.view': 'View',
    'common.details': 'Details',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.datetime': 'Date & Time',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.city': 'City',
    'common.country': 'Country',
    'common.langCode': 'en',
    'common.loading': 'Loading...',
    'common.loadingData': 'Loading {{item}}...',
    'common.noData': 'No data available',
    'common.noResults': 'No results found',
    'common.notFound': 'Not found',
    'common.invalidDate': 'Invalid Date',
    'common.unknownDate': 'Unknown Date',
    'common.unknown': 'Unknown',
    'common.notSet': 'N/A',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.all': 'All',
    'common.none': 'None',
    'common.other': 'Other',
    'common.selected': 'selected',
    'common.item': 'item',
    'common.items': 'items',
    
    // Buttons
    'buttons.add': 'Add',
    'buttons.edit': 'Edit',
    'buttons.delete': 'Delete',
    'buttons.save': 'Save',
    'buttons.cancel': 'Cancel',
    'buttons.close': 'Close',
    'buttons.submit': 'Submit',
    'buttons.reset': 'Reset',
    'buttons.clear': 'Clear',
    'buttons.apply': 'Apply',
    'buttons.previous': 'Previous',
    'buttons.next': 'Next',
    'buttons.back': 'Back',
    'buttons.forward': 'Forward',
    'buttons.continue': 'Continue',
    'buttons.finish': 'Finish',
    'buttons.done': 'Done',
    'buttons.retry': 'Retry',
    'buttons.refresh': 'Refresh',
    'buttons.reload': 'Reload',
    'buttons.import': 'Import',
    'buttons.export': 'Export',
    'buttons.download': 'Download',
    'buttons.upload': 'Upload',
    'buttons.viewDetails': 'View Details',
    'buttons.learnMore': 'Learn More',
    'buttons.configure': 'Configure',
    'buttons.manage': 'Manage',
    'buttons.enable': 'Enable',
    'buttons.disable': 'Disable',
    'buttons.activate': 'Activate',
    'buttons.deactivate': 'Deactivate',
    'buttons.resetFilters': 'Reset Filters',
    
    // Navigation and Pages
    'pageTitles.dashboard': 'Dashboard',
    'pageTitles.tasks': 'Tasks',
    'pageTitles.tasksSingular': 'Task',
    'pageTitles.tasksPlural': 'Tasks',
    'pageTitles.tasksMultipleItems': '{{count}} tasks',
    'pageTitles.networkManagement': 'Network Management',
    'pageTitles.codeManagement': 'Code Management',
    'pageTitles.materialsManagement': 'Materials Management',
    'pageTitles.contracts': 'Contracts',
    'pageTitles.tariffManagement': 'Tariff Management',
    'pageTitles.requestManagement': 'Request Management',
    'pageTitles.insurance': 'Insurance',
    'pageTitles.regulations': 'Regulations',
    'pageTitles.importHistory': 'Import History',
    'pageTitles.adminSettings': 'Admin Settings',
    'pageTitles.addressManagement': 'Address Management',
    
    // Tasks
    'tasks.title': 'Tasks',
    'tasks.pageDescription': 'Manage your team\'s tasks and projects.',
    'tasks.addNewTask': 'Add New Task',
    'tasks.editTask': 'Edit Task',
    'tasks.deleteTask': 'Delete Task',
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
    'tasks.createSuccess': 'Task "{{name}}" created successfully.',
    'tasks.updateSuccess': 'Task "{{name}}" updated successfully.',
    'tasks.deleteSuccess': 'Task "{{name}}" deleted successfully.',
    'tasks.bulkDeleteSuccess': 'Successfully deleted {{count}} tasks.',
    'tasks.deleteError': 'Failed to delete task "{{name}}". Error: {{error}}',
    'tasks.deleteConfirmMessage': 'Are you sure you want to delete task "{{name}}"? This action cannot be undone.',
    'tasks.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // Status translations
    'status.todo': 'Todo',
    'status.in_progress': 'In Progress',
    'status.done': 'Done',
    'status.cancelled': 'Cancelled',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.inReview': 'In Review',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.deprecated': 'Deprecated',
    
    // Priority translations
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    
    // Category translations
    'category.claim_review': 'Claim Review',
    'category.provider_onboarding': 'Provider Onboarding',
    'category.contract_negotiation': 'Contract Negotiation',
    'category.compliance_check': 'Compliance Check',
    'category.data_validation': 'Data Validation',
    'category.system_maintenance': 'System Maintenance',
    'category.training': 'Training',
    'category.general': 'General',
    'category.work': 'Work',
    'category.personal': 'Personal',
    'category.shopping': 'Shopping',
    'category.health': 'Health',
    'category.learning': 'Learning',
    
    // Providers
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
    'providers.createSuccess': 'Provider "{{name}}" created successfully.',
    'providers.updateSuccess': 'Provider "{{name}}" updated successfully.',
    'providers.deleteError': 'Could not delete provider "{{name}}". Error: {{error}}',
    'providers.deleteConfirmMessage': 'Are you sure you want to delete provider "{{name}}"? This action cannot be undone.',
    'providers.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // Doctors
    'doctors.fields.name': 'Name',
    'doctors.fields.licenseNumber': 'License No.',
    'doctors.fields.specialties': 'Specialties',
    'doctors.fields.subSpecialties': 'Sub-Specialties',
    'doctors.fields.phone': 'Phone',
    'doctors.fields.email': 'Email',
    'doctors.fields.city': 'City',
    'doctors.fields.address': 'Address',
    'doctors.fields.status': 'Status',
    'doctors.fields.tags': 'Tags',
    'doctors.fields.notes': 'Notes',
    'doctors.searchPlaceholder': 'Search by Name, License, Email...',
    'doctors.addNewDoctor': 'Add New Doctor',
    'doctors.editDoctor': 'Edit Doctor',
    'doctors.deleteDoctor': 'Delete Doctor',
    'doctors.createSuccess': 'Doctor "{{name}}" created successfully.',
    'doctors.updateSuccess': 'Doctor "{{name}}" updated successfully.',
    'doctors.deleteSuccess': 'Doctor "{{name}}" deleted successfully.',
    'doctors.bulkDeleteSuccess': 'Successfully deleted {{count}} doctors.',
    'doctors.deleteError': 'Failed to delete doctor "{{name}}". Error: {{error}}',
    'doctors.deleteConfirmMessage': 'Are you sure you want to delete doctor "{{name}}"? This action cannot be undone.',
    'doctors.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // Gender
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    
    // Medical Codes
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
    'medicalCodes.titleMultiple': 'Medical Codes',
    'medicalCodes.itemTitleSingular': 'Medical Code',
    'medicalCodes.itemTitlePluralItems': '{{count}} medical codes',
    'medicalCodes.createSuccess': 'Medical code "{{name}}" created successfully.',
    'medicalCodes.updateSuccess': 'Medical code "{{name}}" updated successfully.',
    'medicalCodes.deleteSuccess': 'Medical code "{{name}}" deleted successfully.',
    'medicalCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} medical codes.',
    'medicalCodes.deleteError': 'Failed to delete medical code "{{name}}". Error: {{error}}',
    'medicalCodes.deleteConfirmMessage': 'Are you sure you want to delete medical code "{{name}}"? This action cannot be undone.',
    'medicalCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // Insurance Codes
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
    'insuranceCodes.titleMultiple': 'Insurance Codes',
    'insuranceCodes.itemTitleSingular': 'Insurance Code',
    'insuranceCodes.itemTitlePlural': 'Insurance Codes',
    'insuranceCodes.itemTitlePluralItems': '{{count}} insurance codes',
    'insuranceCodes.createSuccess': 'Insurance code "{{name}}" created successfully.',
    'insuranceCodes.updateSuccess': 'Insurance code "{{name}}" updated successfully.',
    'insuranceCodes.deleteSuccess': 'Insurance code "{{name}}" deleted successfully.',
    'insuranceCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} insurance codes.',
    'insuranceCodes.deleteError': 'Failed to delete insurance code "{{name}}". Error: {{error}}',
    'insuranceCodes.deleteConfirmMessage': 'Are you sure you want to delete insurance code "{{name}}"? This action cannot be undone.',
    'insuranceCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // Internal Codes
    'internalCodes.fields.codeNumber': 'Code Number',
    'internalCodes.fields.descriptionEn': 'Description (EN)',
    'internalCodes.fields.descriptionHe': 'Description (HE)',
    'internalCodes.fields.category_id': 'Category ID',
    'internalCodes.fields.categoryPath': 'Category Path',
    'internalCodes.fields.tags': 'Tags',
    'internalCodes.fields.isBillable': 'Billable',
    'internalCodes.fields.isBillableShort.true': 'Billable',
    'internalCodes.fields.isBillableShort.false': 'Not Billable',
    'internalCodes.fields.isActive': 'Active Status',
    'internalCodes.searchPlaceholder': 'Search by code, description, or category...',
    'internalCodes.addNew': 'Add New Internal Code',
    'internalCodes.edit': 'Edit Internal Code',
    'internalCodes.titleMultiple': 'Internal Codes',
    'internalCodes.itemTitleSingular': 'Internal Code',
    'internalCodes.itemTitlePluralItems': '{{count}} internal codes',
    'internalCodes.createSuccess': 'Internal code "{{name}}" created successfully.',
    'internalCodes.updateSuccess': 'Internal code "{{name}}" updated successfully.',
    'internalCodes.deleteSuccess': 'Internal code "{{name}}" deleted successfully.',
    'internalCodes.bulkDeleteSuccess': 'Successfully deleted {{count}} internal codes.',
    'internalCodes.deleteError': 'Failed to delete internal code "{{name}}". Error: {{error}}',
    'internalCodes.deleteConfirmMessage': 'Are you sure you want to delete internal code "{{name}}"? This action cannot be undone.',
    'internalCodes.bulkDeleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}? This action cannot be undone.',
    
    // RFCs
    'rfc.titleMultiple': 'Requests for Commitment',
    'rfc.viewDetailsComingSoon': 'Viewing RFC details will be available soon.',
    'rfc.dialogComingSoon': 'The dialog for RFCs will be implemented soon.',
    'rfc.noRFCsMatchTitle': 'No RFCs Match Filters',
    'rfc.noRFCsMatchFilterDesc': 'Try adjusting filters or create a new RFC.',
    'rfc.noRFCsDesc': 'No RFCs found. Start by creating a new request for commitment.',
    
    // Insured Persons
    'insurance.insuredPersons.title': 'Insured Persons',
    'insurance.insuredPersons.dialogComingSoon': 'The dialog for adding/editing insured persons will be implemented soon.',
    'insurance.insuredPersons.noPersons': 'No Insured Persons Found',
    'insurance.insuredPersons.noPersonsFilterDesc': 'No insured persons match your current filters. Try adjusting your search.',
    'insurance.insuredPersons.noPersonsDesc': 'Start by adding a new insured person to manage their details.',
    
    // Identification
    'identification.type': 'ID Type',
    'identification.number': 'ID Number',
    'idType.national_id': 'National ID',
    'idType.insurance_number': 'Insurance No.',
    'idType.passport': 'Passport',
    
    // Fields
    'fields.procedureDate': 'Procedure Date',
    'fields.insured': 'Insured',
    'fields.provider': 'Provider',
    'fields.doctor': 'Doctor',
    'fields.policyNumber': 'Policy #',
    'fields.procedures': 'Procedures',
    'fields.approvedAmount': 'Approved Amt',
    'fields.created': 'Created',
    'fields.notes': 'Notes',
    'fields.startDate': 'Start Date',
    'fields.endDate': 'End Date',
    'fields.affiliationStatus': 'Affiliation Status',
    
    // Filters
    'filters.allStatuses': 'All Statuses',
    'filters.allProviders': 'All Providers',
    'filters.allGenders': 'All Genders',
    'filters.allTypes': 'All Types',
    'filters.allSpecialties': 'All Specialties',
    'filters.allCities': 'All Cities',
    'filters.allCodeSystems': 'All Code Systems',
    'filters.allBillable': 'All (Billable Status)',
    'filters.allPreAuth': 'All Pre-Auth',
    'filters.allPriorities': 'All Priorities',
    'filters.allCategories': 'All Categories',
    'filters.allLegalTypes': 'All Legal Types',
    'filters.selectStatus': 'Select Status',
    'filters.selectProvider': 'Select Provider',
    'filters.selectGender': 'Select Gender',
    'filters.selectSpecialty': 'Select Specialty',
    'filters.selectCity': 'Select City',
    'filters.selectCodeSystem': 'Select Code System',
    'filters.selectBillable': 'Select Billable Status',
    'filters.selectPreAuth': 'Select Pre-Auth',
    'filters.selectPriority': 'Select Priority',
    'filters.selectCategory': 'Select Category',
    
    // Search
    'search.placeholderRFC': 'Search RFCs...',
    'search.placeholderInsuredPerson': 'Search by name, email, or ID...',
    
    // Empty States
    'emptyStates.noTasksTitle': 'No Tasks Found',
    'emptyStates.noTasksMessage': 'Start by adding a new task to manage your work.',
    'emptyStates.noTasksFilterTitle': 'No Tasks Match Filters',
    'emptyStates.noTasksFilterMessage': 'Try adjusting your search or filter criteria.',
    'emptyStates.noDoctorsTitle': 'No Doctors Found',
    'emptyStates.noDoctorsMessage': 'Start by adding a new doctor to manage their details.',
    'emptyStates.noDoctorsFilterTitle': 'No Doctors Match Filters',
    'emptyStates.noDoctorsFilterMessage': 'Try adjusting your search or filter criteria.',
    'emptyStates.noMedicalCodesTitle': 'No Medical Codes Found',
    'emptyStates.noMedicalCodesMessage': 'Start by adding a new medical code to the system.',
    'emptyStates.noMedicalCodesFilterTitle': 'No Medical Codes Match Filters',
    'emptyStates.noMedicalCodesFilterMessage': 'Try adjusting your search or filter criteria.',
    'emptyStates.noInternalCodesTitle': 'No Internal Codes Found',
    'emptyStates.noInternalCodesMessage': 'Start by adding a new internal code to the system.',
    'emptyStates.noInternalCodesFilterTitle': 'No Internal Codes Match Filters',
    'emptyStates.noInternalCodesFilterMessage': 'Try adjusting your search or filter criteria.',
    
    // Errors
    'errors.genericApiError': 'An error occurred. Please try again.',
    'errors.genericFetchError': 'Could not load data.',
    'errors.fetchDropdownError': 'Failed to load filter options.',
    'errors.partialLoadFailure': 'Some data could not be loaded. Functionality may be limited. Please refresh to try again.',
    'errors.fetchFailedSingular': 'Failed to load {{entity}}.',
    'errors.rateLimitExceeded': 'Service is temporarily busy. Please try again in a few moments.',
    'errors.rateLimitExceededShort': 'Rate limit hit. Please try again in a moment.',
    'errors.rateLimitExceededMaxRetries': 'Max retries reached for rate limit. Please try again later.',
    'errors.invalidDataTitle': 'Invalid Data',
    'errors.providerDataMissing': 'Provider data could not be loaded or is incomplete.',
    'errors.doctorDataMissing': 'Doctor data could not be loaded or is incomplete.',
    'errors.medicalCodeDataMissing': 'Medical code data could not be loaded or is incomplete.',
    'errors.internalCodeDataMissing': 'Internal code data could not be loaded or is incomplete.',
    'errors.itemNotFoundTitle': 'Item Not Found',
    'errors.itemNotFoundMessage': 'The requested {{item}} could not be found.',
    'errors.itemNotFoundToEditDesc': 'The selected item could not be found for editing.',
    'errors.fetchFailedGeneral': 'Failed to fetch {{item}}.',
    'errors.dataLoadErrorTitle': 'Data Load Error',
    'errors.partialLoadWarning': 'Some {{entity}} data might be stale or incomplete due to a recent error: {{message}}. Please refresh for the latest data.',
    'errors.deleteFailedTitle': 'Deletion Failed',
    'errors.saveFailed': 'Failed to save {{item}}.',
    'errors.deleteFailed': 'Failed to delete {{item}}.',
    
    // Messages
    'messages.refreshingData': 'Refreshing Data',
    'messages.fetchingLatest': 'Fetching latest {{item}}...',
    'messages.success': 'Success!',
    'messages.updatingData': 'Updating {{item}}...',
    'messages.loadingData': 'Loading {{item}}...',
    
    // Bulk Actions
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
    'bulkActions.bulkSelection': 'Bulk Selection',
    'bulkActions.selectItem': 'Select {{item}}',
    
    // Import/Export
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
    
    // View Switcher
    'viewSwitcher.cardView': 'Card View',
    'viewSwitcher.tableView': 'Table View',
    'viewSwitcher.kanbanView': 'Kanban View',
    
    // Data Table
    'dataTable.pageInfo': 'Page {{page}} of {{totalPages}}',
    'dataTable.paginationSummary': 'Showing {{start}}-{{end}} of {{total}} {{entity}}',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to InsureSmart',
    'dashboard.overview.title': 'Overview',
    'dashboard.overview.message': 'Key metrics and summaries will appear here.',
    'dashboard.recentActivity.title': 'Recent Activity',
    'dashboard.recentActivity.none': 'No recent activity to display.',
    'dashboard.quickLinks.title': 'Quick Links',
    'dashboard.loadingActivities': 'Loading activities...',
    'dashboard.errors.loadActivities': 'Could not load recent activities.',
    'dashboard.activity.invalidItem': 'Invalid activity item.',
    'dashboard.activity.untitled': 'Untitled Activity',
    
    // Navigation
    'navigation.tasks': 'Tasks',
    'navigation.providers': 'Providers',
    'navigation.requestManagement': 'Request Management',
    
    // Admin Settings
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
    
    // Integration Status
    'integrationStatus.active': 'Active',
    'integrationStatus.inactive': 'Inactive',
    'integrationStatus.pending_configuration': 'Pending Configuration',
    'integrationStatus.error': 'Error',
    
    // Common date/time
    'common.createdDate': 'Created Date',
    'common.updatedDate': 'Updated Date',
    'common.lastUpdated': 'Last Updated',
    'common.createdOn': 'Created',
    'common.dateOfBirth': 'Date of Birth',
    
    // Common actions
    'common.confirmDelete': 'Are you sure you want to delete this item?',
    'common.deleteSuccess': 'Item deleted successfully.',
    'common.deleteError': 'Failed to delete item.',
    'common.updateSuccess': 'Item updated successfully.',
    'common.createSuccess': 'Item created successfully.',
    'common.saveError': 'Failed to save item.',
    'common.confirmDeleteTitle': 'Confirm Delete {{item}} ({{count}})',
    'common.confirmDeleteTitleShort': 'Delete {{item}}',
    'common.confirmDeleteDescription': 'Are you sure you want to delete {{item}} ({{count}})? This action cannot be undone.',
    'common.deleteConfirmMessage': 'Are you sure you want to delete {{count}} {{itemName}}?',
    'common.multipleItems': '{{count}} items',
    
    // Feature status
    'common.featureComingSoonTitle': 'Feature Coming Soon',
    'common.featureComingSoonDesc': '{{featureName}} will be available soon.',
    'common.featureComingSoonDetailed': 'Full {{featureName}} capabilities will be available soon.',
    
    // Form validation
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.phone': 'Please enter a valid phone number',
    'validation.minLength': 'Must be at least {{min}} characters',
    'validation.maxLength': 'Must be no more than {{max}} characters',
    'validation.numeric': 'Must be a number',
    'validation.positiveNumber': 'Must be a positive number',
    'validation.invalidDate': 'Please enter a valid date',
    
    // Generic entity references
    'common.entity.tasks': 'Tasks',
    'common.entity.providers': 'Providers',
    'common.entity.doctors': 'Doctors',
    'common.entity.medicalCodes': 'Medical Codes',
    'common.entity.internalCodes': 'Internal Codes',
    'common.entity.insuranceCodes': 'Insurance Codes',
    'common.entity.contracts': 'Contracts',
    'common.entity.tariffs': 'Tariffs',
    'common.entity.claims': 'Claims',
    'common.entity.rfcs': 'RFCs',
    'common.entity.materials': 'Materials',
    'common.entity.regulations': 'Regulations',
    'common.entity.users': 'Users',
    
    // Misc labels
    'common.unknownProvider': 'Unknown Provider',
    'common.unknownDoctor': 'Unknown Doctor',
    'common.unknownTask': 'Unknown Task',
    'common.unknownCode': 'Unknown Code',
    'common.noDescription': 'No description available.',
    'common.specificDoctor': 'Specific Doctor',
    'common.notApplicableShort': 'N/A',
    'common.loadingEllipsis': '...',
    'common.tryAdjustingFilters': 'Try adjusting your search or filters.',
    'common.errorLoading': 'Error loading {{item}}.',
    'common.noResultsFound': 'No {{item}} found',
    'common.noItemsAvailable': 'No items available',
    'common.data': 'Data',
    'common.filtersAndSort': 'Filters & Sort',
    'common.sortBy': 'Sort By',
    'common.filters': 'Filters & Search'
  },
  
  'he': {
    'common.langCode': 'he',
    'common.cancel': 'ביטול',
    'common.confirm': 'אישור',
    'common.save': 'שמור',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.add': 'הוסף',
    'common.loading': 'טוען...',
    'common.search': 'חפש',
    'common.filter': 'סנן',
    'common.actions': 'פעולות',
    'common.status': 'מצב',
    'common.active': 'פעיל',
    'common.inactive': 'לא פעיל',
    'common.name': 'שם',
    'common.description': 'תיאור',
    'common.date': 'תאריך',
    'common.email': 'דוא"ל',
    'common.phone': 'טלפון',
    'common.address': 'כתובת',
    'common.city': 'עיר',
    'common.unknown': 'לא ידוע',
    'common.required': 'חובה',
    'common.all': 'הכל',
    'common.yes': 'כן',
    'common.no': 'לא',
    'common.retry': 'נסה שוב',
    'common.refresh': 'רענן',
    'common.import': 'יבא',
    'common.export': 'יצא',
    
    // Page titles in Hebrew
    'pageTitles.dashboard': 'לוח מחוונים',
    'pageTitles.tasks': 'משימות',
    'pageTitles.networkManagement': 'ניהול רשת',
    'pageTitles.codeManagement': 'ניהול קודים',
    'pageTitles.materialsManagement': 'ניהול חומרים',
    'pageTitles.contracts': 'חוזים',
    'pageTitles.insurance': 'ביטוח',
    'pageTitles.regulations': 'תקנות',
    'pageTitles.adminSettings': 'הגדרות מנהל',
    
    // Tasks in Hebrew
    'tasks.title': 'משימות',
    'tasks.addNewTask': 'הוסף משימה חדשה',
    'tasks.fields.title': 'כותרת',
    'tasks.fields.description': 'תיאור',
    'tasks.fields.status': 'מצב',
    'tasks.fields.priority': 'עדיפות',
    'tasks.fields.dueDate': 'תאריך יעד',
    
    // Status in Hebrew
    'status.todo': 'לביצוע',
    'status.in_progress': 'בביצוע',
    'status.done': 'הושלם',
    'status.active': 'פעיל',
    'status.inactive': 'לא פעיל',
    'status.draft': 'טיוטה',
    'status.approved': 'מאושר',
    'status.rejected': 'נדחה',
    
    // Priority in Hebrew
    'priority.low': 'נמוכה',
    'priority.medium': 'בינונית',
    'priority.high': 'גבוהה',
    'priority.urgent': 'דחוף',
    
    // Categories in Hebrew
    'category.general': 'כללי',
    'category.work': 'עבודה',
    'category.personal': 'אישי',
    'category.health': 'בריאות',
    
    // Buttons in Hebrew
    'buttons.add': 'הוסף',
    'buttons.edit': 'ערוך',
    'buttons.delete': 'מחק',
    'buttons.save': 'שמור',
    'buttons.cancel': 'ביטול',
    'buttons.close': 'סגור',
    'buttons.refresh': 'רענן',
    'buttons.import': 'יבא',
    'buttons.export': 'יצא',
    'buttons.viewDetails': 'צפה בפרטים',
    'buttons.resetFilters': 'אפס מסננים',
    
    // Gender in Hebrew
    'gender.male': 'זכר',
    'gender.female': 'נקבה',
    'gender.other': 'אחר',
    
    // Common filters in Hebrew
    'filters.allStatuses': 'כל הסטטוסים',
    'filters.allProviders': 'כל הספקים',
    'filters.allCategories': 'כל הקטגוריות',
    'filters.selectStatus': 'בחר סטטוס',
    'filters.selectProvider': 'בחר ספק',
    
    // Empty states in Hebrew
    'emptyStates.noTasksTitle': 'לא נמצאו משימות',
    'emptyStates.noTasksMessage': 'התחל על ידי הוספת משימה חדשה.',
    
    // View switcher in Hebrew
    'viewSwitcher.cardView': 'תצוגת כרטיסים',
    'viewSwitcher.tableView': 'תצוגת טבלה',
    'viewSwitcher.kanbanView': 'תצוגת קנבן',
    
    // Error messages in Hebrew
    'errors.genericFetchError': 'לא ניתן לטעון נתונים.',
    'errors.rateLimitExceeded': 'השירות עמוס זמנית. אנא נסה שוב בעוד כמה רגעים.',
    
    // Success messages in Hebrew
    'messages.success': 'הצלחה!',
    'common.createSuccess': 'הפריט נוצר בהצלחה.',
    'common.updateSuccess': 'הפריט עודכן בהצלחה.',
    'common.deleteSuccess': 'הפריט נמחק בהצלחה.',
    
    // Bulk actions in Hebrew
    'bulkActions.selectedCount': '{{count}} נבחרו',
    'bulkActions.selectAllVisible': 'בחר את כל הגלויים',
    
    // Dashboard in Hebrew
    'dashboard.title': 'לוח מחוונים',
    'dashboard.welcome': 'ברוכים הבאים ל-InsureSmart',
    'dashboard.overview.title': 'סקירה כללית',
    'dashboard.recentActivity.title': 'פעילות אחרונה',
    'dashboard.quickLinks.title': 'קישורים מהירים',
    
    // Providers in Hebrew
    'providers.titleMultiple': 'ספקים',
    'providers.addProvider': 'הוסף ספק',
    'providers.fields.name': 'שם הספק',
    'providers.fields.city': 'עיר',
    'providers.fields.status': 'מצב',
    
    // Doctors in Hebrew
    'doctors.fields.name': 'שם',
    'doctors.fields.licenseNumber': 'מספר רישיון',
    'doctors.fields.specialties': 'התמחויות',
    'doctors.fields.city': 'עיר',
    'doctors.addNewDoctor': 'הוסף רופא חדש',
    
    // Navigation in Hebrew
    'navigation.tasks': 'משימות',
    'navigation.providers': 'ספקים',
    'navigation.requestManagement': 'ניהול בקשות',
    
    // Import/Export in Hebrew
    'import.noFileTitle': 'לא נבחר קובץ',
    'import.noFileDesc': 'אנא בחר קובץ לייבוא.',
    'import.completedTitle': 'הייבוא הושלם',
    
    // Medical codes in Hebrew
    'medicalCodes.titleMultiple': 'קודים רפואיים',
    'medicalCodes.addNew': 'הוסף קוד רפואי חדש',
    'medicalCodes.fields.code': 'קוד',
    'medicalCodes.fields.descriptionHe': 'תיאור (עברית)',
    
    // Admin settings in Hebrew
    'adminSettings.systemHealth.title': 'לוח מחוונים של בריאות המערכת',
    'adminSettings.integrations.title': 'ניהול אינטגרציות',
    
    // Integration status in Hebrew
    'integrationStatus.active': 'פעיל',
    'integrationStatus.inactive': 'לא פעיל',
    'integrationStatus.error': 'שגיאה'
  }
};

// Simple interpolation function
export function interpolate(template, variables = {}) {
  if (!template || typeof template !== 'string') return template;
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables.hasOwnProperty(key) ? String(variables[key]) : match;
  });
}

// Get translation function
export function getTranslation(language, key, options = {}) {
  const translations = TRANSLATIONS[language] || TRANSLATIONS['en'];
  let translation = translations[key];
  
  if (!translation && language !== 'en') {
    // Fallback to English
    translation = TRANSLATIONS['en'][key];
  }
  
  if (!translation) {
    // Final fallback
    if (options.defaultValue) {
      translation = options.defaultValue;
    } else {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
  }
  
  // Interpolate variables
  if (options && typeof options === 'object') {
    const variables = { ...options };
    delete variables.defaultValue; // Remove defaultValue from interpolation
    translation = interpolate(translation, variables);
  }
  
  return translation;
}