// Content of components/hooks/useProviderForm.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Provider } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguageHook } from '@/components/useLanguageHook';

// Regex for Israeli Company/Dealer/Association number (9 digits)
const ISRAELI_ID_REGEX = /^[0-9]{9}$/;

const getProviderSchema = (t) => z.object({
  name: z.object({
    en: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.nameEn', {defaultValue: 'Name (EN)'})}) }).max(200),
    he: z.string().min(1, { message: t('validation.requiredField', { fieldName: t('fields.nameHe', {defaultValue: 'Name (HE)'})}) }).max(200),
  }),
  provider_type: z.enum(['hospital', 'clinic', 'imaging_center', 'laboratory', 'other'], {
    required_error: t('validation.requiredField', { fieldName: t('fields.providerType', {defaultValue: 'Provider Type'})}),
  }),
  legal: z.object({
    type: z.enum(['company', 'licensed_dealer', 'registered_association'], {
      required_error: t('validation.requiredField', { fieldName: t('fields.legalType', {defaultValue: 'Legal Type'})}),
    }),
    identifier: z.string()
      .min(1, { message: t('validation.requiredField', { fieldName: t('fields.legalIdentifier', {defaultValue: 'Legal Identifier'})}) })
      .regex(ISRAELI_ID_REGEX, { message: t('providers.validation.invalidLegalId', {defaultValue: 'Invalid Legal ID (must be 9 digits)'}) }),
  }),
  address_id: z.string().optional().nullable(), // For structured address
  // Legacy contact fields (optional now if address_id is primary)
  contact: z.object({
    contact_person_name: z.string().max(200).optional().nullable(),
    street_name: z.string().max(200).optional().nullable(),
    street_number: z.string().max(20).optional().nullable(),
    address: z.string().max(300).optional().nullable(), // Additional legacy address details
    city: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(20).optional().nullable(),
    phone: z.string().optional().nullable().refine(val => !val || /^\+?[0-9\-\s()]+$/.test(val), {
      message: t('validation.invalidPhoneFormat', {defaultValue: 'Invalid phone number format.'}),
    }),
    email: z.string().email({ message: t('validation.invalidEmailFormat', {defaultValue: 'Invalid email address.'}) }).optional().nullable(),
  }).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().max(2000).optional().nullable(),
});

export function useProviderForm(defaultValues, onSubmitSuccess) {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const providerSchema = getProviderSchema(t);

  const form = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: defaultValues || {
      name: { en: '', he: '' },
      provider_type: undefined, // Let placeholder show
      legal: { type: undefined, identifier: '' },
      contact: {},
      status: 'active',
      notes: '',
      address_id: null,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let result;
      if (defaultValues?.id) {
        result = await Provider.update(defaultValues.id, data);
        toast({ title: t('providers.updateSuccessTitle'), description: t('providers.updateSuccessDetail', { name: data.name.en || data.name.he }) });
      } else {
        result = await Provider.create(data);
        toast({ title: t('providers.createSuccessTitle'), description: t('providers.createSuccessDetail', { name: data.name.en || data.name.he }) });
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return result;
    } catch (error) {
      console.error("Error saving provider:", error);
      toast({
        title: t('common.saveErrorTitle'),
        description: error.message || t('common.saveErrorDetail', { entity: t('providers.entityNameSingular') }),
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle its state
    }
  });

  return { form, handleSubmit, isLoading: form.formState.isSubmitting };
}