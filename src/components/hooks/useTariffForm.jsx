// Content of components/hooks/useTariffForm.js
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tariff } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getCompositionItemSchema = (t) => z.object({
  component_type: z.enum(['Base', 'DoctorFee', 'Implantables', 'Hospitalization', 'Drugs', 'Other']),
  pricing_model: z.enum(['Fixed', 'BoMActual', 'PerDay', 'Capped', 'PerUnit']),
  recipient_type: z.enum(['Provider', 'Doctor', 'Supplier', 'Patient']),
  recipient_id: z.string().optional().nullable(),
  amount: z.coerce.number().optional().nullable(),
  cap_value: z.coerce.number().optional().nullable(),
  finalized_at: z.enum(['RFC', 'Claim']),
  copay_applies: z.boolean().default(true),
});

const getValidationRuleSchema = (t) => z.object({
  rule_type: z.enum(['age_limit', 'gender_specific', 'requires_approval']),
  rule_value: z.string().min(1, { message: t('validation.requiredField', {fieldName: 'Rule Value'}) }),
});

const getTariffSchema = (t) => z.object({
  contract_id: z.string().min(1, { message: t('validation.requiredField', {fieldName: t('fields.contractId')}) }),
  insurance_code: z.string().min(1, { message: t('validation.requiredField', {fieldName: t('fields.insuranceCode')}) }),
  doctor_id: z.string().optional().nullable(),
  base_price: z.coerce.number().min(0, { message: t('validation.nonNegativeNumber', {fieldName: t('fields.basePrice')}) }),
  currency: z.string().default('ILS'),
  finalization_type: z.enum(['RFC', 'Claim', 'Hybrid']),
  composition: z.array(getCompositionItemSchema(t)).optional().default([]),
  validation_rules: z.array(getValidationRuleSchema(t)).optional().default([]),
});


export function useTariffForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const tariffSchema = getTariffSchema(t);

  const form = useForm({
    resolver: zodResolver(tariffSchema),
    defaultValues: defaultValues || {
      currency: 'ILS',
      finalization_type: 'Hybrid', // A sensible default
      composition: [],
      validation_rules: [],
    },
  });

  const { fields: compositionFields, append: appendComposition, remove: removeComposition } = useFieldArray({
    control: form.control,
    name: "composition"
  });

  const { fields: validationRuleFields, append: appendValidationRule, remove: removeValidationRule } = useFieldArray({
    control: form.control,
    name: "validation_rules"
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let result;
      if (defaultValues?.id) {
        result = await Tariff.update(defaultValues.id, data);
        toast({ title: t('tariffs.updateSuccessTitle'), description: t('tariffs.updateSuccessDetail', { id: defaultValues.id }) });
      } else {
        result = await Tariff.create(data);
        toast({ title: t('tariffs.createSuccessTitle'), description: t('tariffs.createSuccessDetail', { id: result.id }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving tariff:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('tariffs.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error;
    }
  });

  return {
    form,
    handleSubmit,
    isLoading: form.formState.isSubmitting,
    compositionFields,
    appendComposition,
    removeComposition,
    validationRuleFields,
    appendValidationRule,
    removeValidationRule,
  };
}