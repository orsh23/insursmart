// Content of components/hooks/useContractForm.js
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contract } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

const getScopeRuleSchema = (t) => z.object({
  scope_type: z.enum(['all_codes', 'category', 'specific_codes']),
  category_path: z.string().optional().nullable(),
  codes: z.array(z.string()).optional().default([]),
});

const getContractSchema = (t) => z.object({
  provider_id: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.provider', { defaultValue: 'Provider' }) }) }),
  contract_number: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.contractNumber', { defaultValue: 'Contract Number' }) }) }),
  name_en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.nameEn', { defaultValue: 'Name (EN)' }) }) }),
  name_he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.nameHe', { defaultValue: 'Name (HE)' }) }) }),
  valid_from: z.date({ required_error: t('validation.requiredField', { fieldName: t('fields.validFrom', { defaultValue: 'Valid From' }) }) }),
  valid_to: z.date({ required_error: t('validation.requiredField', { fieldName: t('fields.validTo', { defaultValue: 'Valid To' }) }) }),
  status: z.enum(['draft', 'active', 'expired', 'terminated']).default('draft'),
  scope_rules: z.array(getScopeRuleSchema(t)).optional().default([]),
  payment_terms: z.object({
    payment_days: z.coerce.number().int().min(0).optional().nullable(),
    requires_invoice: z.boolean().default(true).optional(),
    payment_method: z.enum(['direct_deposit', 'check', 'credit']).optional().nullable(),
  }).optional(),
  special_conditions: z.array(z.string()).optional().default([]),
}).refine(data => data.valid_from <= data.valid_to, {
  message: t('contracts.validation.validToAfterFrom', { defaultValue: "Valid To date must be after or same as Valid From date." }),
  path: ['valid_to'],
});

export function useContractForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const contractSchema = getContractSchema(t);

  const form = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      valid_from: defaultValues.valid_from ? new Date(defaultValues.valid_from) : null,
      valid_to: defaultValues.valid_to ? new Date(defaultValues.valid_to) : null,
      scope_rules: defaultValues.scope_rules || [],
      payment_terms: defaultValues.payment_terms || { requires_invoice: true },
      special_conditions: defaultValues.special_conditions || [],
    } : {
      status: 'draft',
      scope_rules: [],
      payment_terms: { requires_invoice: true },
      special_conditions: [],
    },
  });

  const { fields: scopeRulesFields, append: appendScopeRule, remove: removeScopeRule } = useFieldArray({
    control: form.control,
    name: "scope_rules",
  });

  const { fields: specialConditionsFields, append: appendSpecialCondition, remove: removeSpecialCondition } = useFieldArray({
    control: form.control,
    name: "special_conditions",
  });


  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const dataToSave = {
        ...data,
        valid_from: data.valid_from?.toISOString().split('T')[0], // Format YYYY-MM-DD
        valid_to: data.valid_to?.toISOString().split('T')[0],
      };

      let result;
      if (defaultValues?.id) {
        result = await Contract.update(defaultValues.id, dataToSave);
        toast({ title: t('contracts.updateSuccessTitle'), description: t('contracts.updateSuccessDetail', { name: data.name_en || data.contract_number }) });
      } else {
        result = await Contract.create(dataToSave);
        toast({ title: t('contracts.createSuccessTitle'), description: t('contracts.createSuccessDetail', { name: data.name_en || data.contract_number }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving contract:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('contracts.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to indicate submission failure
    }
  });

  return {
    form,
    handleSubmit,
    isLoading: form.formState.isSubmitting,
    scopeRulesFields,
    appendScopeRule,
    removeScopeRule,
    specialConditionsFields,
    appendSpecialCondition,
    removeSpecialCondition,
  };
}