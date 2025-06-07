
import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
// Corrected Entity Imports - each entity must be imported individually
import { Claim } from '@/api/entities';
import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities';
import { RequestForCommitment } from '@/api/entities';
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
import { X, PlusCircle } from 'lucide-react';
import { getLocalizedValue } from '@/components/utils/i18n-utils';
import { CLAIM_STATUSES, CURRENCIES } from '@/components/utils/constants';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ClaimDialog({ isOpen, onClose, claimData: initialClaimData, rfcId: initialRfcId }) {
  const { t, language } = useLanguageHook();
  const { toast } = useToast();
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      rfc_id: '', provider_id: '', doctor_id: '', insured_id: '', policy_id: '',
      service_date_from: null, service_date_to: null, invoice_number: '', invoice_date: null,
      claim_items: [{ procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 }],
      total_submitted_amount: 0, currency: 'ILS', status: 'draft', notes: '',
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "claim_items" });

  const [providers, setProviders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [insuredPersons, setInsuredPersons] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

  const claimItemsWatcher = watch("claim_items");
  const watchedInsuredId = watch("insured_id");

  useEffect(() => {
    const total = claimItemsWatcher.reduce((acc, item) => acc + (parseFloat(item.total_price) || 0), 0);
    setValue("total_submitted_amount", total);
  }, [claimItemsWatcher, setValue]);

  const fetchAuxiliaryData = useCallback(async () => {
    setIsLoadingInitialData(true);
    try {
      const [provData, docData, insData, polData, codeData] = await Promise.all([
        Provider.list(), Doctor.list(), InsuredPerson.list(), InsurancePolicy.list(), InsuranceCode.list()
      ]);
      setProviders(Array.isArray(provData) ? provData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
      setInsuredPersons(Array.isArray(insData) ? insData : []);
      setPolicies(Array.isArray(polData) ? polData : []);
      setInsuranceCodes(Array.isArray(codeData) ? codeData : []);
    } catch (error) {
      toast({ title: t('errors.fetchAuxDataErrorTitle'), description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [t, toast]);

  useEffect(() => {
    if (isOpen) fetchAuxiliaryData();
  }, [isOpen, fetchAuxiliaryData]);
  
  useEffect(() => {
    const loadData = async () => {
      let rfcData = null;
      if (initialRfcId) {
        rfcData = await RequestForCommitment.get(initialRfcId);
      }
      
      const defaultVals = {
        rfc_id: initialRfcId || initialClaimData?.rfc_id || '',
        provider_id: initialClaimData?.provider_id || rfcData?.provider_id || '',
        doctor_id: initialClaimData?.doctor_id || rfcData?.doctor_id || '',
        insured_id: initialClaimData?.insured_id || rfcData?.insured_id || '',
        policy_id: initialClaimData?.policy_id || rfcData?.policy_id || '',
        service_date_from: initialClaimData?.service_date_from || rfcData?.procedure_date || null,
        invoice_number: initialClaimData?.invoice_number || '',
        invoice_date: initialClaimData?.invoice_date || null,
        notes: initialClaimData?.notes || rfcData?.notes || '',
        status: initialClaimData?.status || 'draft',
        claim_items: initialClaimData?.claim_items || (rfcData?.procedure_codes || []).map(pc => ({
            procedure_code: pc, diagnosis_codes: rfcData.diagnosis_codes || [], quantity: 1, unit_price: 0, total_price: 0
        })) || [{ procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 }],
      };
      reset(defaultVals);
    };

    if (isOpen) {
      loadData();
    }
  }, [initialClaimData, initialRfcId, isOpen, reset]);


  const onSubmit = async (data) => {
    try {
      const dataToSubmit = {
        ...data,
        total_submitted_amount: parseFloat(data.total_submitted_amount) || 0,
        claim_items: data.claim_items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity, 10) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: parseFloat(item.total_price) || 0,
        })),
      };
      if (initialClaimData?.id) {
        await Claim.update(initialClaimData.id, dataToSubmit);
        toast({ title: t('messages.success.update', { item: t('claims.itemTitleSingular') }) });
      } else {
        await Claim.create(dataToSubmit);
        toast({ title: t('messages.success.create', { item: t('claims.itemTitleSingular') }) });
      }
      onClose(true);
    } catch (error) {
      toast({ title: t('errors.submissionErrorTitle'), description: error.message, variant: 'destructive' });
    }
  };

  const commonSelectOptions = (items, nameKey) => items.map(item => ({
    value: item.id, label: getLocalizedValue(item, nameKey, language) || item.id
  }));

  const insuranceCodeOptions = insuranceCodes.map(c => ({
    value: c.code, label: `${c.code} - ${getLocalizedValue(c, 'name', language)}`
  }));
  
  const providerOptions = commonSelectOptions(providers, 'name');
  const doctorOptions = doctors.map(d => ({ value: d.id, label: `${getLocalizedValue(d, 'first_name', language)} ${getLocalizedValue(d, 'last_name', language)}` }));
  const insuredOptions = commonSelectOptions(insuredPersons, 'full_name');
  const policyOptions = policies.map(p => ({ value: p.id, label: p.policy_number }));


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }}>
      <DialogContent className="max-w-6xl">
        <DialogHeader><DialogTitle>{initialClaimData ? t('claims.editTitle') : t('claims.createTitle')}</DialogTitle></DialogHeader>
        {isLoadingInitialData ? <LoadingSpinner /> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
            {/* Top section: Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField name="insured_id" control={control} label={t('claims.insuredPerson')} rules={{ required: t('errors.fieldRequired')}}>
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('claims.selectInsured')} /></SelectTrigger>
                    <SelectContent>{insuredOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
              {/* Other select fields similarly refactored */}
              <FormField name="provider_id" control={control} label={t('claims.provider')} rules={{ required: t('errors.fieldRequired') }}>
                  {({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder={t('claims.selectProvider')} /></SelectTrigger>
                          <SelectContent>{providerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                  )}
              </FormField>
              <FormField name="service_date_from" control={control} label={t('claims.serviceDateFrom')} rules={{ required: t('errors.fieldRequired') }}>
                  {({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />}
              </FormField>
              <FormField name="status" control={control} label={t('common.status')}>
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('claims.selectStatus')} /></SelectTrigger>
                    <SelectContent>{CLAIM_STATUSES.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, {defaultValue: opt.defaultValue})}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </FormField>
            </div>
            
            {/* Middle Section: Claim Items */}
            <div className="space-y-3 rounded-md border p-4">
              <h3 className="text-lg font-medium">{t('claims.claimItems')}</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start border-b pb-3">
                  <div className="col-span-12 md:col-span-3">
                    <FormField name={`claim_items.${index}.procedure_code`} control={control} label={t('claims.procedureCode')}>
                      {({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger><SelectValue placeholder={t('claims.selectProcedure')} /></SelectTrigger>
                              <SelectContent>{insuranceCodeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                          </Select>
                      )}
                    </FormField>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <FormField name={`claim_items.${index}.diagnosis_codes`} control={control} label={t('claims.diagnosisCodes')}>
                      {({ field }) => <MultiSelect options={insuranceCodeOptions} selected={field.value} onChange={field.onChange} placeholder={t('claims.selectDiagnoses')} />}
                    </FormField>
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <FormField name={`claim_items.${index}.quantity`} control={control} label={t('claims.quantity')}>
                      {({ field }) => <Input type="number" {...field} />}
                    </FormField>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                     <FormField name={`claim_items.${index}.unit_price`} control={control} label={t('claims.unitPrice')}>
                      {({ field }) => <Input type="number" {...field} onChange={(e) => {
                          const unitPrice = parseFloat(e.target.value) || 0;
                          const quantity = parseInt(watch(`claim_items.${index}.quantity`), 10) || 0;
                          setValue(`claim_items.${index}.unit_price`, unitPrice);
                          setValue(`claim_items.${index}.total_price`, unitPrice * quantity);
                      }} />}
                    </FormField>
                  </div>
                   <div className="col-span-4 md:col-span-1">
                    <FormField name={`claim_items.${index}.total_price`} control={control} label={t('claims.total')}>
                      {({ field }) => <Input type="number" {...field} readOnly className="bg-gray-100" />}
                    </FormField>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex items-end">
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ procedure_code: '', diagnosis_codes: [], quantity: 1, unit_price: 0, total_price: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" />{t('claims.addClaimItem')}
              </Button>
            </div>
            {/* Bottom section: Totals and Notes */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <FormField name="total_submitted_amount" control={control} label={t('claims.totalSubmittedAmount')}>
                    {({ field }) => <Input type="number" {...field} readOnly className="bg-gray-100 font-bold" />}
                </FormField>
                <FormField name="currency" control={control} label={t('claims.currency')}>
                  {({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField name="notes" control={control} label={t('common.notes')} className="col-span-full">
                    {({ field }) => <Textarea {...field} placeholder={t('claims.notesPlaceholder')} />}
                </FormField>
             </div>
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
