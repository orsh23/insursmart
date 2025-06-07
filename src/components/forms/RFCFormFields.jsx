import React from 'react';
import FormField from '../shared/FormField';
import SelectField from '../common/SelectField';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import TagInput from '../common/TagInput';

export default function RFCFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false,
  providerOptions = [],
  doctorOptions = [],
  insuranceOptions = []
}) {
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
      <SelectField
        id="provider_id"
        label="Provider"
        value={formData.provider_id || ''}
        onChange={(value) => updateField('provider_id', value)}
        options={providerOptions}
        error={formErrors.provider_id}
        required
        isRTL={isRTL}
      />

      <SelectField
        id="doctor_id"
        label="Doctor"
        value={formData.doctor_id || ''}
        onChange={(value) => updateField('doctor_id', value)}
        options={doctorOptions}
        error={formErrors.doctor_id}
        isRTL={isRTL}
      />

      <SelectField
        id="insurance_id"
        label="Insurance"
        value={formData.insurance_id || ''}
        onChange={(value) => updateField('insurance_id', value)}
        options={insuranceOptions}
        error={formErrors.insurance_id}
        required
        isRTL={isRTL}
      />

      <FormField label="Policy Number" error={formErrors.policy_number}>
        <Input
          value={formData.policy_number || ''}
          onChange={(e) => updateField('policy_number', e.target.value)}
        />
      </FormField>

      <FormField label="Procedure Date" error={formErrors.procedure_date} required>
        <Input
          type="date"
          value={formData.procedure_date || ''}
          onChange={(e) => updateField('procedure_date', e.target.value)}
        />
      </FormField>

      <SelectField
        id="status"
        label="Status"
        value={formData.status || 'draft'}
        onChange={(value) => updateField('status', value)}
        options={statusOptions}
        error={formErrors.status}
        isRTL={isRTL}
      />

      <FormField 
        label="Notes" 
        error={formErrors.notes}
        className="md:col-span-2"
      >
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />
      </FormField>

      <FormField 
        label="Diagnosis Codes" 
        error={formErrors.diagnosis_codes}
        className="md:col-span-2"
      >
        <TagInput
          tags={formData.diagnosis_codes || []}
          onTagsChange={(newTags) => updateField('diagnosis_codes', newTags)}
          placeholder="Add diagnosis code..."
        />
      </FormField>

      <FormField 
        label="Procedure Codes" 
        error={formErrors.procedure_codes}
        className="md:col-span-2"
      >
        <TagInput
          tags={formData.procedure_codes || []}
          onTagsChange={(newTags) => updateField('procedure_codes', newTags)}
          placeholder="Add procedure code..."
        />
      </FormField>
    </div>
  );
}