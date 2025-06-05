
import React, { useEffect, useState } from 'react';
    import { useForm, Controller, useFieldArray } from 'react-hook-form';
    // import { zodResolver } from '@hookform/resolvers/zod'; // Removed
    // import * as z from 'zod'; // Removed
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Textarea } from '@/components/ui/textarea';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import FormField from '@/components/shared/FormField';
    import { DatePicker } from '@/components/ui/date-picker';
    import { PlusCircle, Trash2 } from 'lucide-react';
    import { Provider } from '@/api/entities';
    import { Doctor } from '@/api/entities';
    import { InsuredPerson } from '@/api/entities';
    import { MedicalCode } from '@/api/entities'; // For procedure codes
    import { Label } from '@/components/ui/label'; // Added Label import

    // Zod schemas removed

    export default function ClaimDialog({ open, onOpenChange, claimData, onSubmit, isLoading }) {
      const { t } = useLanguageHook();
      const [providers, setProviders] = useState([]);
      const [doctors, setDoctors] = useState([]);
      const [insuredPersons, setInsuredPersons] = useState([]);
      const [procedureCodes, setProcedureCodes] = useState([]);

      const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        // resolver: zodResolver(claimSchema), // Removed
        defaultValues: claimData ? {
            ...claimData,
            service_date_from: claimData.service_date_from ? new Date(claimData.service_date_from) : null,
            service_date_to: claimData.service_date_to ? new Date(claimData.service_date_to) : null,
            invoice_date: claimData.invoice_date ? new Date(claimData.invoice_date) : null,
        } : {
          provider_id: '', insured_id: '', service_date_from: new Date(),
          claim_items: [{ procedure_code: '', quantity: 1, unit_price: 0 }],
          currency: 'ILS', status: 'draft', notes: '',
        }
      });

      const { fields, append, remove } = useFieldArray({ control, name: "claim_items" });
      const watchedClaimItems = watch("claim_items"); // To recalculate total

      useEffect(() => {
        const fetchData = async () => {
          try {
            const [prov, doc, insured, proc] = await Promise.all([
              Provider.list(), Doctor.list(), InsuredPerson.list(), MedicalCode.list() // Basic lists
            ]);
            setProviders(Array.isArray(prov) ? prov : []);
            setDoctors(Array.isArray(doc) ? doc : []);
            setInsuredPersons(Array.isArray(insured) ? insured : []);
            setProcedureCodes(Array.isArray(proc) ? proc.filter(p => p.code_system?.includes('CPT') || p.code_system?.includes('INTERNAL') || p.code_system?.includes('HCPCS')) : []);
          } catch (err) { console.error("Error fetching data for Claim Dialog:", err); }
        };
        fetchData();
      }, []);

      useEffect(() => {
        if (claimData) {
          reset({
            ...claimData,
            service_date_from: claimData.service_date_from ? new Date(claimData.service_date_from) : null,
            service_date_to: claimData.service_date_to ? new Date(claimData.service_date_to) : null,
            invoice_date: claimData.invoice_date ? new Date(claimData.invoice_date) : null,
          });
        } else {
          reset({
            provider_id: '', insured_id: '', service_date_from: new Date(),
            claim_items: [{ procedure_code: '', quantity: 1, unit_price: 0 }],
            currency: 'ILS', status: 'draft', notes: '',
          });
        }
      }, [claimData, reset]);

      const calculateTotalSubmittedAmount = () => {
        return (watchedClaimItems || []).reduce((total, item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.unit_price) || 0;
          return total + (quantity * unitPrice);
        }, 0);
      };
      
      const handleFormSubmit = (data) => {
        const total_submitted_amount = calculateTotalSubmittedAmount();
        const dataToSubmit = {
            ...data,
            total_submitted_amount,
            service_date_from: data.service_date_from ? data.service_date_from.toISOString().split('T')[0] : null,
            service_date_to: data.service_date_to ? data.service_date_to.toISOString().split('T')[0] : null,
            invoice_date: data.invoice_date ? data.invoice_date.toISOString().split('T')[0] : null,
            claim_items: data.claim_items.map(item => ({
                ...item,
                total_price: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
            }))
        };
        onSubmit(dataToSubmit);
      };


      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{claimData ? t('claims.editTitle', {defaultValue: 'Edit Claim'}) : t('claims.addTitle', {defaultValue: 'Add Claim'})}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="provider_id" label={t('fields.provider', {defaultValue: 'Provider'})} control={control} errors={errors} 
                  rules={{ required: t('errors.fieldRequired', {fieldName: 'Provider'})}}
                  render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Provider'})}/></SelectTrigger><SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name?.en || p.id}</SelectItem>)}</SelectContent></Select>} />
                <FormField name="insured_id" label={t('fields.insured', {defaultValue: 'Insured Person'})} control={control} errors={errors} 
                  rules={{ required: t('errors.fieldRequired', {fieldName: 'Insured Person'})}}
                  render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Insured'})}/></SelectTrigger><SelectContent>{insuredPersons.map(ip => <SelectItem key={ip.id} value={ip.id}>{ip.full_name}</SelectItem>)}</SelectContent></Select>} />
                <FormField name="doctor_id" label={t('fields.doctorOptional', {defaultValue: 'Doctor (Optional)'})} control={control} errors={errors} render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Doctor'})}/></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.first_name_en} {d.last_name_en}</SelectItem>)}</SelectContent></Select>} />
                <FormField name="service_date_from" label={t('fields.serviceDateFrom', {defaultValue: 'Service Date From'})} control={control} errors={errors} 
                  rules={{ required: t('errors.fieldRequired', {fieldName: 'Service Date From'})}}
                  render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
                <FormField name="service_date_to" label={t('fields.serviceDateTo', {defaultValue: 'Service Date To (Optional)'})} control={control} errors={errors} render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
                <FormField name="invoice_number" label={t('fields.invoiceNumber', {defaultValue: 'Invoice Number'})} control={control} errors={errors} render={(field) => <Input {...field} />} />
                <FormField name="invoice_date" label={t('fields.invoiceDate', {defaultValue: 'Invoice Date (Optional)'})} control={control} errors={errors} render={({ field }) => <DatePicker date={field.value} onDateChange={field.onChange} />} />
                 <FormField
                    name="status"
                    label={t('fields.status', {defaultValue: 'Status'})}
                    control={control}
                    errors={errors}
                    render={(field) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        {["draft", "submitted", "in_review", "pending_information", "approved_for_payment", "partially_paid", "paid_in_full", "rejected", "denied"].map(s => <SelectItem key={s} value={s}>{t(`status.${s}`, {defaultValue: s})}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                />
              </div>

              <Label className="block pt-2">{t('claims.claimItems', {defaultValue: 'Claim Items'})}</Label>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-end border p-2 rounded-md">
                  <FormField name={`claim_items.${index}.procedure_code`} control={control} errors={errors.claim_items?.[index]} noLabel
                    rules={{ required: t('errors.fieldRequired', {fieldName: `Procedure ${index + 1}`})}}
                    render={(field) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder={t('common.selectPlaceholder', {item: 'Procedure'})}/></SelectTrigger><SelectContent>{procedureCodes.map(pc => <SelectItem key={pc.id} value={pc.code}>{pc.code} - {pc.description_en}</SelectItem>)}</SelectContent></Select>} />
                  <FormField name={`claim_items.${index}.quantity`} control={control} errors={errors.claim_items?.[index]} noLabel 
                    rules={{ required: t('errors.fieldRequired', {fieldName: `Quantity ${index + 1}`}), min: {value:1, message:"Min 1"} }}
                    render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} placeholder={t('fields.quantity', {defaultValue: 'Qty'})} />} />
                  <FormField name={`claim_items.${index}.unit_price`} control={control} errors={errors.claim_items?.[index]} noLabel 
                    rules={{ required: t('errors.fieldRequired', {fieldName: `Unit Price ${index + 1}`}), min: {value:0, message:"Min 0"} }}
                    render={(field) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} placeholder={t('fields.unitPrice', {defaultValue: 'Unit Price'})} />} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {errors.claim_items && <p className="text-sm text-red-500">{errors.claim_items.message || t('errors.claimItemsError', {defaultValue: 'Please ensure all claim items have required fields.'})}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ procedure_code: '', quantity: 1, unit_price: 0 })} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />{t('claims.addClaimItem', {defaultValue: 'Add Claim Item'})}
              </Button>

              <div className="text-right font-semibold mt-2">
                {t('claims.totalSubmitted', {defaultValue: 'Total Submitted Amount'})}: {calculateTotalSubmittedAmount().toFixed(2)} {watch('currency')}
              </div>

              <FormField name="notes" label={t('fields.notes', {defaultValue: 'Notes'})} control={control} errors={errors} render={(field) => <Textarea {...field} />} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{t('buttons.cancel', {defaultValue: 'Cancel'})}</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? t('buttons.saving', {defaultValue: 'Saving...'}) : t('buttons.save', {defaultValue: 'Save'})}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    }
