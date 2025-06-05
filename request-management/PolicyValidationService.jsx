/**
 * Policy Validation Service
 * This service contains logic for validating insurance policy coverage
 * for different procedures and scenarios.
 */

/**
 * Validates if a procedure is covered by a policy
 * @param {Object} policy - Insurance policy object
 * @param {Array} procedureCodes - Array of procedure codes
 * @param {Array} diagnosisCodes - Array of diagnosis codes
 * @param {Object} requestDetails - Additional request details
 * @param {string} language - Current UI language
 * @returns {Object} Validation results
 */
export const validatePolicyCoverage = (policy, procedureCodes = [], diagnosisCodes = [], requestDetails = {}, language = "en") => {
  const isRTL = language === "he";
  
  if (!policy) {
    return {
      overallStatus: 'error',
      statusText: 'No Policy Found',
      statusTextHe: 'לא נמצאה פוליסה',
      results: [{
        status: 'error',
        title: 'Policy Not Found',
        titleHe: 'לא נמצאה פוליסה',
        message: 'No active insurance policy found for this patient',
        messageHe: 'לא נמצאה פוליסה פעילה עבור מטופל זה'
      }]
    };
  }

  // Initialize validation results
  const validationResults = [];
  let overallStatus = 'valid';

  // Check if the policy is active
  const isPolicyActive = !!policy.is_active;
  if (!isPolicyActive) {
    validationResults.push({
      status: 'error',
      title: 'Inactive Policy',
      titleHe: 'פוליסה לא פעילה',
      message: 'The insurance policy is not active',
      messageHe: 'הפוליסה אינה פעילה'
    });
    overallStatus = 'error';
  } else {
    validationResults.push({
      status: 'valid',
      title: 'Active Policy',
      titleHe: 'פוליסה פעילה',
      message: `Policy ${policy.policy_number} is active and valid`,
      messageHe: `פוליסה ${policy.policy_number} פעילה ותקפה`
    });
  }

  // Check for excluded procedures
  const excludedProcedures = policy.excluded_procedures || [];
  const hasExcludedProcedures = procedureCodes.some(code => 
    excludedProcedures.includes(code)
  );
  
  if (hasExcludedProcedures) {
    const excludedCodes = procedureCodes.filter(code => 
      excludedProcedures.includes(code)
    ).join(', ');
    
    validationResults.push({
      status: 'error',
      title: 'Procedure Not Covered',
      titleHe: 'הליך לא מכוסה',
      message: `Procedure(s) ${excludedCodes} are excluded from coverage`,
      messageHe: `הליכים ${excludedCodes} אינם מכוסים בפוליסה`
    });
    overallStatus = 'error';
  } else if (procedureCodes.length > 0) {
    validationResults.push({
      status: 'valid',
      title: 'Procedures Covered',
      titleHe: 'הליכים מכוסים',
      message: 'All requested procedures are covered by the policy',
      messageHe: 'כל ההליכים המבוקשים מכוסים בפוליסה'
    });
  }

  // Check for excluded diagnoses
  const excludedDiagnoses = policy.excluded_diagnoses || [];
  const hasExcludedDiagnoses = diagnosisCodes.some(code => 
    excludedDiagnoses.includes(code)
  );
  
  if (hasExcludedDiagnoses) {
    const excludedCodes = diagnosisCodes.filter(code => 
      excludedDiagnoses.includes(code)
    ).join(', ');
    
    validationResults.push({
      status: 'error',
      title: 'Diagnosis Not Covered',
      titleHe: 'אבחנה לא מכוסה',
      message: `Diagnosis code(s) ${excludedCodes} are excluded from coverage`,
      messageHe: `קודי אבחנה ${excludedCodes} אינם מכוסים בפוליסה`
    });
    overallStatus = 'error';
  }

  // Check for implantable coverage
  if (requestDetails.hasImplantables) {
    if (!policy.allows_implantables) {
      validationResults.push({
        status: 'error',
        title: 'Implantables Not Covered',
        titleHe: 'שתלים לא מכוסים',
        message: 'This policy does not cover implantable devices',
        messageHe: 'הפוליסה אינה מכסה שתלים'
      });
      overallStatus = 'error';
    } else {
      validationResults.push({
        status: 'valid',
        title: 'Implantables Covered',
        titleHe: 'שתלים מכוסים',
        message: 'Implantable devices are covered by this policy',
        messageHe: 'שתלים מכוסים בפוליסה'
      });
    }
  }

  // Check for private doctor selection
  if (requestDetails.hasPrivateDoctor) {
    if (!policy.allows_private_doctor) {
      validationResults.push({
        status: 'error',
        title: 'Private Doctor Not Covered',
        titleHe: 'רופא פרטי לא מכוסה',
        message: 'This policy does not cover selection of private doctors',
        messageHe: 'הפוליסה אינה מכסה בחירת רופא פרטי'
      });
      overallStatus = 'error';
    } else {
      validationResults.push({
        status: 'valid',
        title: 'Private Doctor Covered',
        titleHe: 'רופא פרטי מכוסה',
        message: 'Selection of private doctor is covered by this policy',
        messageHe: 'בחירת רופא פרטי מכוסה בפוליסה'
      });
    }
  }

  // Check hospitalization days limit
  if (requestDetails.hospitalizationDays) {
    const daysLimit = policy.hospital_days_limit || 0;
    
    if (daysLimit > 0 && requestDetails.hospitalizationDays > daysLimit) {
      validationResults.push({
        status: 'warning',
        title: 'Hospitalization Days Limit Exceeded',
        titleHe: 'חריגה ממגבלת ימי אשפוז',
        message: `Requested ${requestDetails.hospitalizationDays} days exceeds policy limit of ${daysLimit} days`,
        messageHe: `בקשה ל-${requestDetails.hospitalizationDays} ימים חורגת ממגבלת הפוליסה של ${daysLimit} ימים`
      });
      
      if (overallStatus === 'valid') {
        overallStatus = 'warning';
      }
    } else if (daysLimit > 0) {
      const remainingDays = daysLimit - requestDetails.hospitalizationDays;
      validationResults.push({
        status: 'valid',
        title: 'Hospitalization Days Within Limit',
        titleHe: 'ימי אשפוז בתוך המגבלה',
        message: `${requestDetails.hospitalizationDays} days requested (${remainingDays} days remaining of ${daysLimit})`,
        messageHe: `בקשה ל-${requestDetails.hospitalizationDays} ימים (נותרו ${remainingDays} ימים מתוך ${daysLimit})`
      });
    }
  }

  // Check coverage amounts for specific services
  if (requestDetails.estimatedCost && requestDetails.serviceType) {
    let coverageLimit = 0;
    let coverageType = '';
    let coverageTypeHe = '';

    switch (requestDetails.serviceType) {
      case 'hospital':
        coverageLimit = policy.hospital_coverage_amount || 0;
        coverageType = 'Hospital Coverage';
        coverageTypeHe = 'כיסוי אשפוז';
        break;
      case 'surgery':
        coverageLimit = policy.surgery_coverage_amount || 0;
        coverageType = 'Surgery Coverage';
        coverageTypeHe = 'כיסוי ניתוחים';
        break;
      case 'outpatient':
        coverageLimit = policy.outpatient_coverage_amount || 0;
        coverageType = 'Outpatient Coverage';
        coverageTypeHe = 'כיסוי אמבולטורי';
        break;
    }

    if (coverageLimit > 0 && requestDetails.estimatedCost > coverageLimit) {
      validationResults.push({
        status: 'warning',
        title: `${coverageType} Limit Exceeded`,
        titleHe: `חריגה ממגבלת ${coverageTypeHe}`,
        message: `Estimated cost ${requestDetails.estimatedCost} exceeds coverage limit of ${coverageLimit}`,
        messageHe: `עלות מוערכת ${requestDetails.estimatedCost} חורגת ממגבלת הכיסוי של ${coverageLimit}`
      });
      
      if (overallStatus === 'valid') {
        overallStatus = 'warning';
      }
    }
  }

  // Calculate final validation status
  const statusText = getStatusText(overallStatus, language);
  
  return {
    overallStatus,
    statusText: isRTL ? statusText.he : statusText.en,
    statusTextHe: statusText.he,
    results: validationResults,
    warnings: validationResults.filter(r => r.status === 'warning'),
    errors: validationResults.filter(r => r.status === 'error'),
    valid: validationResults.filter(r => r.status === 'valid')
  };
};

/**
 * Get readable status text based on status code
 */
const getStatusText = (status, language) => {
  const statusTexts = {
    'valid': { en: 'Covered', he: 'מכוסה' },
    'warning': { en: 'Partially Covered', he: 'מכוסה חלקית' },
    'error': { en: 'Not Covered', he: 'לא מכוסה' }
  };
  
  return statusTexts[status] || { en: 'Unknown', he: 'לא ידוע' };
};