import React from 'react';
import { useTranslation } from '@/components/utils/i18n';
import FormField from '@/components/shared/FormField';
import SelectField from '@/components/common/SelectField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/common/TagInput';
import { format } from 'date-fns';

/**
 * Form fields for Claim entity
 * 
 * @param {Object} props Component props
 * @param {Object} props.formData Current form data
 * @param {Function} props.updateField Function to update a field
 * @param {Object} props.formErrors Validation errors
 * @param {boolean} props.isRTL Whether the UI is in RTL mode
 * @param {Array} props.providerOptions Provider options for dropdown
 * @param {Array} props.doctorOptions Doctor options for dropdown
 * @param {Array} props.insuredOptions Insured person options for dropdown
 * @param {Array} props.rfcOptions Request for commitment options for dropdown
 */
export default function ClaimFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false,
  providerOptions = [],
  doctorOptions = [],
  insuredOptions = [],
  rfcOptions = []
}) {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'submitted', label: t('claims.statuses.submitted', 'Submitted') },
    { value: 'in_review', label: t('claims.statuses.inReview', 'In Review') },
    { value: 'approved', label: t('claims.statuses.approved', 'Approved') },
    { value: 'partially_approved', label: t('claims.statuses.partiallyApproved', 'Partially Approved') },
    { value: 'rejected', label: t('claims.statuses.rejected', 'Rejected') }
  ];

  // Format date for input field
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
    } catch (error) {
      return '';
    }
  };

  // Helper to add/remove procedure codes
  const handleProcedureCodeChange = (index, value) => {
    const newCodes = [...(formData.procedure_codes || [])];
    newCodes[index] = value;
    updateField('procedure_codes', newCodes);
  };

  const addProcedureCode = () => {
    updateField('procedure_codes', [...(formData.procedure_codes || []), '']);
  };

  const removeProcedureCode = (index) => {
    const newCodes = [...(formData.procedure_codes || [])];
    newCodes.splice(index, 1);
    updateField('procedure_codes', newCodes);
  };

  // Helper to add/remove diagnosis codes
  const handleDiagnosisCodeChange = (index, value) => {
    const newCodes = [...(formData.diagnosis_codes || [])];
    newCodes[index] = value;
    updateField('diagnosis_codes', newCodes);
  };

  const addDiagnosisCode = () => {
    updateField('diagnosis_codes', [...(formData.diagnosis_codes || []), '']);
  };

  const removeDiagnosisCode = (index) => {
    const newCodes = [...(formData.diagnosis_codes || [])];
    newCodes.splice(index, 1);
    updateField('diagnosis_codes', newCodes);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
      <SelectField
        id="rfc_id"
        label={t('claims.rfc', 'Request for Commitment')}
        value={formData.rfc_id || ''}
        onChange={(val) => updateField('rfc_id', val)}
        options={rfcOptions}
        error={formErrors.rfc_id}
        isRTL={isRTL}
      />

      <SelectField
        id="provider_id"
        label={t('claims.provider', 'Provider')}
        value={formData.provider_id || ''}
        onChange={(val) => updateField('provider_id', val)}
        options={providerOptions}
        error={formErrors.provider_id}
        required
        isRTL={isRTL}
      />

      <SelectField
        id="doctor_id"
        label={t('claims.doctor', 'Doctor')}
        value={formData.doctor_id || ''}
        onChange={(val) => updateField('doctor_id', val)}
        options={doctorOptions}
        error={formErrors.doctor_id}
        isRTL={isRTL}
      />

      <SelectField
        id="insured_id"
        label={t('claims.insured', 'Insured Person')}
        value={formData.insured_id || ''}
        onChange={(val) => updateField('insured_id', val)}
        options={insuredOptions}
        error={formErrors.insured_id}
        required
        isRTL={isRTL}
      />

      <FormField label={t('claims.policyNumber', 'Policy Number')} error={formErrors.policy_number}>
        <Input
          value={formData.policy_number || ''}
          onChange={(e) => updateField('policy_number', e.target.value)}
        />
      </FormField>

      <FormField label={t('claims.procedureDate', 'Procedure Date')} error={formErrors.procedure_date} required>
        <Input
          type="date"
          value={formatDate(formData.procedure_date)}
          onChange={(e) => updateField('procedure_date', e.target.value)}
        />
      </FormField>

      <div className="md:col-span-2">
        <FormField label={t('claims.procedureCodes', 'Procedure Codes')} error={formErrors.procedure_codes} required>
          <div className="space-y-2">
            {(formData.procedure_codes || []).map((code, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => handleProcedureCodeChange(index, e.target.value)}
                  placeholder={t('claims.procedureCodePlaceholder', 'Enter procedure code')}
                />
                <button
                  type="button"
                  onClick={() => removeProcedureCode(index)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  {t('common.remove', 'Remove')}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProcedureCode}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {t('claims.addProcedureCode', 'Add Procedure Code')}
            </button>
          </div>
        </FormField>
      </div>

      <div className="md:col-span-2">
        <FormField label={t('claims.diagnosisCodes', 'Diagnosis Codes')} error={formErrors.diagnosis_codes}>
          <div className="space-y-2">
            {(formData.diagnosis_codes || []).map((code, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => handleDiagnosisCodeChange(index, e.target.value)}
                  placeholder={t('claims.diagnosisCodePlaceholder', 'Enter diagnosis code')}
                />
                <button
                  type="button"
                  onClick={() => removeDiagnosisCode(index)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  {t('common.remove', 'Remove')}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDiagnosisCode}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {t('claims.addDiagnosisCode', 'Add Diagnosis Code')}
            </button>
          </div>
        </FormField>
      </div>

      <FormField label={t('claims.totalSubmitted', 'Total Submitted Amount')} error={formErrors.total_submitted} required>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={formData.total_submitted || ''}
          onChange={(e) => updateField('total_submitted', parseFloat(e.target.value))}
        />
      </FormField>

      <FormField label={t('claims.currency', 'Currency')} error={formErrors.currency}>
        <Input
          value={formData.currency || 'ILS'}
          onChange={(e) => updateField('currency', e.target.value)}
        />
      </FormField>

      <SelectField
        id="status"
        label={t('common.status', 'Status')}
        value={formData.status || 'submitted'}
        onChange={(val) => updateField('status', val)}
        options={statusOptions}
        error={formErrors.status}
        required
        isRTL={isRTL}
      />

      <FormField 
        label={t('claims.notes', 'Notes')} 
        error={formErrors.notes}
        className="md:col-span-2"
      >
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />
      </FormField>
    </div>
  );
}