// components/languageState.js
// This is a simplified, reactive store for language settings.

// Using the more comprehensive translations from useLanguageHook.js
const MOCK_TRANSLATIONS = {
    'en': {
        'common.error': 'Error',
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
        'messages.loadingData': 'Loading {{item}}...',
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
        'common.loading': 'Loading...', // Added from previous state
        'pageTitles.codeManagement': 'Code Management', // Added from previous state
        'codeManagement.pageDescription': 'Manage medical, internal, provider codes, and their mappings.', // Added
        // Add other relevant keys as needed from useLanguageHook's MOCK_TRANSLATIONS
    },
    'he': {
        'common.error': 'שגיאה',
        'search.placeholderInsuredPerson': 'חפש לפי שם, אימייל או ת.ז...',
        'buttons.refresh': 'רענן',
        'common.loading': 'טוען...', // Added from previous state
        'pageTitles.codeManagement': 'ניהול קודים', // Added from previous state
        'codeManagement.pageDescription': 'ניהול קודים רפואיים, פנימיים, קודי ספקים והמיפויים ביניהם.', // Added
        // Add other relevant keys as needed from useLanguageHook's MOCK_TRANSLATIONS
    }
};


let currentLanguage = 'he'; // Default language
let subscribers = [];

const languageState = {
    getLanguage: () => currentLanguage,
    setLanguage: (lang) => {
        if (['en', 'he'].includes(lang)) {
            currentLanguage = lang;
            // document.documentElement.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
            subscribers.forEach(cb => cb(currentLanguage));
        }
    },
    isRTL: () => currentLanguage === 'he',
    subscribe: (cb) => {
        if (typeof cb === 'function') {
            subscribers.push(cb);
            return () => {
                subscribers = subscribers.filter(s => s !== cb);
            };
        }
        return () => {};
    },
    t: (key, options) => {
        if (typeof key !== 'string') {
            console.warn('[languageState] t() called with non-string key:', key);
            return 'INVALID_KEY';
        }

        // Robustly initialize S_options
        let S_options = {};
        if (options !== null && typeof options === 'object') {
            S_options = options;
        }

        const langToUse = MOCK_TRANSLATIONS[currentLanguage] ? currentLanguage : 'en';
        const translationsForCurrentLang = MOCK_TRANSLATIONS[langToUse] || MOCK_TRANSLATIONS['en'];

        let translatedString = translationsForCurrentLang ? translationsForCurrentLang[key] : undefined;
        
        if (typeof translatedString === 'string') {
            return translatedString;
        }

        // Use S_options to safely access defaultValue
        if (typeof S_options.defaultValue === 'string') {
            return S_options.defaultValue;
        }
        
        // console.warn(`[languageState] Key "${key}" not found for lang "${currentLanguage}", no valid defaultValue. Returning key.`);
        return key;
    }
};

export { languageState };