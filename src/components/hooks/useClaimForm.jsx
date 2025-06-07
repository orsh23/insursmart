// Content of components/hooks/useClaimForm.js
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Claim } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getClaimItemSchema = (t) => z.object({
  id: z.string().optional(), // For existing items
  procedure_code: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Procedure Code'}) }),
  diagnosis_codes: z.array(z.string()).min(1, { message: t('validation.atLeastOne', {fieldName: 'Diagnosis Code'}) }),
  quantity: z.coerce.number().min(1, { message: t('validation.positiveNumber', {fieldName: 'Quantity'}) }),
  unit_price: z.coerce.number().min(0, { message: t('validation.nonNegativeNumber', {fieldName: 'Unit Price'}) }),
  total_price: z.coerce.number().min(0, { message: t('validation.nonNegativeNumber', {fieldName: 'Total Price'}) }),
  allowed_amount: z.coerce.number().optional().nullable(),
  paid_amount: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const getClaimSchema = (t) => z.object({
  rfc_id: z.string().optional().nullable(),
  provider_id: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Provider'}) }),
  provider_name: z.string().optional().nullable(), // Denormalized
  doctor_id: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Doctor'}) }),
  doctor_name: z.string().optional().nullable(), // Denormalized
  insured_id: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Insured Person'}) }),
  insured_name: z.string().optional().nullable(), // Denormalized
  policy_id: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Policy'}) }),
  policy_number: z.string().optional().nullable(), // Denormalized
  service_date_from: z.date({ required_error: t('validation.requiredField', {fieldName: 'Service Date From'}) }),
  service_date_to: z.date().optional().nullable(),
  invoice_number: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Invoice Number'}) }),
  invoice_date: z.date({ required_error: t('validation.requiredField', {fieldName: 'Invoice Date'}) }),
  claim_items: z.array(getClaimItemSchema(t)).min(1, { message: t('validation.atLeastOne', {fieldName: 'Claim Item'}) }),
  total_submitted_amount: z.coerce.number().min(0, { message: t('validation.nonNegativeNumber', {fieldName: 'Total Submitted Amount'}) }),
  total_allowed_amount: z.coerce.number().optional().nullable(),
  total_paid_amount: z.coerce.number().optional().nullable(),
  currency: z.string().default('ILS'),
  status: z.enum(['draft', 'submitted', 'in_review', 'pending_information', 'approved_for_payment', 'partially_paid', 'paid_in_full', 'rejected', 'denied']).default('draft'),
  rejection_reason: z.string().optional().nullable(),
  denial_reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // submitted_at, processed_at, payment_date handled by backend or triggers
  attachments: z.array(z.object({
    file_name: z.string(),
    file_url: z.string(),
    // uploaded_at: z.string().datetime().optional(), // Backend handles this
  })).optional().default([]),
}).refine(data => { // Ensure total_submitted_amount matches sum of item total_prices
  const sumOfItems = data.claim_items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  return Math.abs(sumOfItems - (data.total_submitted_amount || 0)) < 0.01; // Allow for floating point inaccuracies
}, {
  message: t('claims.validation.totalMismatch', {defaultValue: 'Total submitted amount must match the sum of claim item totals.'}),
  path: ['total_submitted_amount'],
});


export function useClaimForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const claimSchema = getClaimSchema(t);
  const claimItemSchema = getClaimItemSchema(t); // For individual item validation if needed

  const form = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      service_date_from: defaultValues.service_date_from ? new Date(defaultValues.service_date_from) : null,
      service_date_to: defaultValues.service_date_to ? new Date(defaultValues.service_date_to) : null,
      invoice_date: defaultValues.invoice_date ? new Date(defaultValues.invoice_date) : null,
      claim_items: defaultValues.claim_items || [{ procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 }]
    } : {
      currency: 'ILS',
      status: 'draft',
      claim_items: [{ procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 }],
      attachments: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "claim_items",
  });

  const calculateItemTotal = (index) => {
    const quantity = form.getValues(`claim_items.${index}.quantity`);
    const unitPrice = form.getValues(`claim_items.${index}.unit_price`);
    if (typeof quantity === 'number' && typeof unitPrice === 'number') {
      form.setValue(`claim_items.${index}.total_price`, quantity * unitPrice, { shouldValidate: true });
    }
    calculateGrandTotal();
  };

  const calculateGrandTotal = () => {
    const items = form.getValues('claim_items');
    const total = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    form.setValue('total_submitted_amount', total, { shouldValidate: true });
  };


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        service_date_from: data.service_date_from?.toISOString().split('T')[0], // Format to YYYY-MM-DD
        service_date_to: data.service_date_to?.toISOString().split('T')[0],
        invoice_date: data.invoice_date?.toISOString().split('T')[0],
      };

      let result;
      if (defaultValues?.id) {
        result = await Claim.update(defaultValues.id, dataToSave);
        toast({ title: t('claims.updateSuccessTitle'), description: t('claims.updateSuccessDetail', { id: defaultValues.id }) });
      } else {
        result = await Claim.create(dataToSave);
        toast({ title: t('claims.createSuccessTitle'), description: t('claims.createSuccessDetail', { id: result.id }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving claim:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('claims.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error;
    }
  });

  return {
    form,
    handleSubmit,
    isLoading: form.formState.isSubmitting,
    claimItemsFields: fields,
    addClaimItem: (item) => append(item || { procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 }),
    removeClaimItem: remove,
    updateClaimItem: update,
    calculateItemTotal,
    calculateGrandTotal,
    claimItemSchema, // Expose for inline validation if needed
  };
}