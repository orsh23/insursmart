// Content of components/hooks/useRFCForm.js
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RequestForCommitment } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getAttachmentSchema = (t) => z.object({
  // id: z.string().optional(), // If attachments are entities themselves
  file_name: z.string().min(1, { message: t('validation.requiredField', { fieldName: 'File Name' }) }),
  file_url: z.string().url({ message: t('validation.invalidUrl', { fieldName: 'File URL' }) }),
  // uploaded_at will be set by backend
});

const getRFCSchema = (t) => z.object({
  provider_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.provider') }) }),
  provider_name: z.string().optional(), // Denormalized
  doctor_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.doctor') }) }),
  doctor_name: z.string().optional(), // Denormalized
  insured_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.insured') }) }),
  insured_name: z.string().optional(), // Denormalized
  policy_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.policyId') }) }),
  policy_number: z.string().optional(), // Denormalized
  
  diagnosis_codes: z.array(z.string()).min(1, { message: t('validation.atLeastOne', { fieldName: t('fields.diagnosisCodes') }) }),
  procedure_codes: z.array(z.string()).min(1, { message: t('validation.atLeastOne', { fieldName: t('fields.procedureCodes') }) }),
  procedure_date: z.date({ required_error: t('validation.requiredField', { fieldName: t('fields.procedureDate') }) }),
  
  notes: z.string().max(2000, { message: t('validation.maxLength', { fieldName: t('fields.notes'), maxLength: 2000 }) }).optional().nullable(),
  status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'partially_approved', 'rejected', 'cancelled']).default('draft'),
  
  rejection_reason: z.string().optional().nullable(),
  partial_approval_reason: z.string().optional().nullable(),
  approved_amount: z.coerce.number().optional().nullable(),
  currency: z.string().default('ILS'),
  
  validity_start_date: z.date().optional().nullable(),
  validity_end_date: z.date().optional().nullable(),
  
  attachments: z.array(getAttachmentSchema(t)).optional().default([]),
  
  // Fields like validation_errors, reviewer_id, timestamps are typically backend-managed
}).refine(data => {
  if (data.validity_start_date && data.validity_end_date) {
    return data.validity_start_date <= data.validity_end_date;
  }
  return true;
}, {
  message: t('rfc.validation.validityEndDateAfterStart', {defaultValue: "Validity End Date must be after or same as Start Date."}),
  path: ['validity_end_date'],
}).refine(data => {
  if ((data.status === 'rejected' || data.status === 'cancelled') && !data.rejection_reason && data.status !== 'draft' && data.status !== 'submitted') { // Allow empty reason for draft/submitted
    return false; // Rejection reason required for rejected/cancelled status (unless it's an early state)
  }
  return true;
}, {
  message: t('rfc.validation.rejectionReasonRequired', {defaultValue: "Rejection reason is required for this status."}),
  path: ['rejection_reason'],
}).refine(data => {
    if (data.status === 'partially_approved' && !data.partial_approval_reason) {
        return false;
    }
    return true;
}, {
    message: t('rfc.validation.partialApprovalReasonRequired', {defaultValue: "Partial approval reason is required."}),
    path: ['partial_approval_reason'],
});

export function useRFCForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const rfcSchema = getRFCSchema(t);

  const form = useForm({
    resolver: zodResolver(rfcSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      procedure_date: defaultValues.procedure_date ? new Date(defaultValues.procedure_date) : null,
      validity_start_date: defaultValues.validity_start_date ? new Date(defaultValues.validity_start_date) : null,
      validity_end_date: defaultValues.validity_end_date ? new Date(defaultValues.validity_end_date) : null,
      diagnosis_codes: defaultValues.diagnosis_codes || [],
      procedure_codes: defaultValues.procedure_codes || [],
      attachments: defaultValues.attachments || [],
    } : {
      status: 'draft',
      currency: 'ILS',
      diagnosis_codes: [],
      procedure_codes: [],
      attachments: [],
    },
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments"
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        procedure_date: data.procedure_date?.toISOString().split('T')[0],
        validity_start_date: data.validity_start_date?.toISOString().split('T')[0],
        validity_end_date: data.validity_end_date?.toISOString().split('T')[0],
        // Backend should fill provider_name, doctor_name, insured_name, policy_number based on IDs
      };

      let result;
      if (defaultValues?.id) {
        result = await RequestForCommitment.update(defaultValues.id, dataToSave);
        toast({ title: t('rfc.updateSuccessTitle'), description: t('rfc.updateSuccessDetail', { id: defaultValues.id }) });
      } else {
        result = await RequestForCommitment.create(dataToSave);
        toast({ title: t('rfc.createSuccessTitle'), description: t('rfc.createSuccessDetail', { id: result.id }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving RFC:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('rfc.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error;
    }
  });

  return {
    form,
    handleSubmit,
    isLoading: form.formState.isSubmitting,
    attachmentFields,
    appendAttachment,
    removeAttachment,
  };
}