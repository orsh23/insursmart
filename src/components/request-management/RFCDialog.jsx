
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
// Corrected Entity Imports - each entity must be imported individually
import { RequestForCommitment } from '@/api/entities';
import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities';
import { InsuranceCode } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/date-picker';
import FormField from '@/components/shared/forms/FormField';
import MultiSelect from '@/components/common/MultiSelect';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { getLocalizedValue } from '@/components/utils/i18n-utils';
import { RFC_STATUSES, CURRENCIES } from '@/components/utils/constants';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function RFCDialog({ isOpen, onClose, rfcData: initialRfcData }) {
  const { t, language } = useLanguageHook();
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      provider_id: '', doctor_id: '', insured_id: '', policy_id: '',
      diagnosis_codes: [], procedure_codes: [], procedure_date: null,
      notes: '', status: 'draft', rejection_reason: '', partial_approval_reason: '',
      approved_amount: null, currency: 'ILS', validity_start_date: null, validity_end_date: null,
      attachments: []
    }
  });

  const [providers, setProviders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [insuredPersons, setInsuredPersons] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [isLoadingAuxData, setIsLoadingAuxData] = useState(false);

  const watchedInsuredId = watch("insured_id");

  const fetchAuxiliaryData = useCallback(async () => {
    setIsLoadingAuxData(true);
    try {
      const [provData, docData, insData, codeData] = await Promise.all([
        Provider.list(), Doctor.list(), InsuredPerson.list(), InsuranceCode.list()
      ]);
      setProviders(Array.isArray(provData) ? provData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
      setInsuredPersons(Array.isArray(insData) ? insData : []);
      setInsuranceCodes(Array.isArray(codeData) ? codeData : []);
    } catch (error) {
      toast({ title: t('errors.fetchAuxDataErrorTitle'), description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingAuxData(false);
    }
  }, [t, toast]);

  const fetchPoliciesForInsured = useCallback(async (insuredId) => {
    if (!insuredId) {
      setPolicies([]);
      setValue('policy_id', '');
      return;
    }
    try {
      const policyData = await InsurancePolicy.filter({ insured_id: insuredId });
      setPolicies(Array.isArray(policyData) ? policyData : []);
    } catch (error) {
      toast({ title: t('errors.fetchPoliciesErrorTitle'), description: error.message, variant: 'destructive' });
    }
  }, [setValue, t, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchAuxiliaryData();
    }
  }, [isOpen, fetchAuxiliaryData]);

  useEffect(() => {
    fetchPoliciesForInsured(watchedInsuredId);
  }, [watchedInsuredId, fetchPoliciesForInsured]);
  
  useEffect(() => {
    if (initialRfcData) {
      reset({ ...initialRfcData });
    } else {
      reset({
        provider_id: '', doctor_id: '', insured_id: '', policy_id: '',
        diagnosis_codes: [], procedure_codes: [], procedure_date: null,
        notes: '', status: 'draft', rejection_reason: '', partial_approval_reason: '',
        approved_amount: null, currency: 'ILS', validity_start_date: null, validity_end_date: null,
        attachments: []
      });
    }
  }, [initialRfcData, reset]);

  const onSubmit = async (data) => {
    try {
      const dataToSubmit = { ...data, approved_amount: data.approved_amount ? parseFloat(data.approved_amount) : null };
      if (initialRfcData?.id) {
        await RequestForCommitment.update(initialRfcData.id, dataToSubmit);
        toast({ title: t('messages.success.update', { item: t('rfc.itemTitleSingular') }) });
      } else {
        await RequestForCommitment.create(dataToSubmit);
        toast({ title: t('messages.success.create', { item: t('rfc.itemTitleSingular') }) });
      }
      onClose(true);
    } catch (error) {
      toast({ title: t('errors.submissionErrorTitle'), description: error.message, variant: 'destructive' });
    }
  };

  const commonSelectOptions = (items, nameKey) => items.map(item => ({
    value: item.id,
    label: getLocalizedValue(item, nameKey, language) || item.id
  }));

  const insuranceCodeOptions = insuranceCodes.map(c => ({
    value: c.code,
    label: `${c.code} - ${getLocalizedValue(c, 'name', language)}`
  }));
  
  const providerOptions = commonSelectOptions(providers, 'name');
  const doctorOptions = doctors.map(d => ({ value: d.id, label: `${getLocalizedValue(d, 'first_name', language)} ${getLocalizedValue(d, 'last_name', language)}` }));
  const insuredOptions = commonSelectOptions(insuredPersons, 'full_name');
  const policyOptions = policies.map(p => ({ value: p.id, label: p.policy_number }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialRfcData ? t('rfc.editTitle') : t('rfc.createTitle')}</DialogTitle>
        </DialogHeader>
        {isLoadingAuxData ? <LoadingSpinner /> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField name="insured_id" control={control} label={t('rfc.insuredPerson')} rules={{ required: t('errors.fieldRequired')}}>
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('rfc.selectInsured')} /></SelectTrigger>
                    <SelectContent>{insuredOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField name="policy_id" control={control} label={t('rfc.policyNumber')} rules={{ required: t('errors.fieldRequired')}}>
                 {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchedInsuredId || policies.length === 0}>
                    <SelectTrigger><SelectValue placeholder={t('rfc.selectPolicy')} /></SelectTrigger>
                    <SelectContent>{policyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField name="provider_id" control={control} label={t('rfc.provider')} rules={{ required: t('errors.fieldRequired')}}>
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('rfc.selectProvider')} /></SelectTrigger>
                    <SelectContent>{providerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField name="doctor_id" control={control} label={t('rfc.doctor')}>
                 {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('rfc.selectDoctor')} /></SelectTrigger>
                    <SelectContent>{doctorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField name="procedure_date" control={control} label={t('rfc.procedureDate')} rules={{ required: t('errors.fieldRequired')}}>
                {({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />}
              </FormField>
              <FormField name="status" control={control} label={t('common.status')}>
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('rfc.selectStatus')} /></SelectTrigger>
                    <SelectContent>{RFC_STATUSES.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, {defaultValue: opt.defaultValue})}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
            </div>
            
            <FormField name="diagnosis_codes" control={control} label={t('rfc.diagnosisCodes')}>
              {({ field }) => <MultiSelect options={insuranceCodeOptions} selected={field.value} onChange={field.onChange} placeholder={t('rfc.selectDiagnoses')} />}
            </FormField>
            
            <FormField name="procedure_codes" control={control} label={t('rfc.procedureCodes')} rules={{ required: t('errors.fieldRequired')}}>
              {({ field }) => <MultiSelect options={insuranceCodeOptions} selected={field.value} onChange={field.onChange} placeholder={t('rfc.selectProcedures')} />}
            </FormField>
            
            <FormField name="notes" control={control} label={t('common.notes')}>
              {({ field }) => <Textarea {...field} placeholder={t('rfc.notesPlaceholder')} />}
            </FormField>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">{t('common.cancel')}</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('common.saving') : t('common.save')}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
