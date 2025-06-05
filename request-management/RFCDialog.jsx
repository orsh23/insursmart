
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
// Zod and zodResolver removed as 'zod' module is not available.
// import { zodResolver } from '@hookform/resolvers/zod'; REMOVED
// import * as z from 'zod'; REMOVED
// Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose are now handled by FormDialog
import { Button } from '@/components/ui/button'; // Keep Button for multi-input add/remove
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useLanguageHook } from '@/components/useLanguageHook';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { AlertCircle, CalendarIcon, User, Briefcase, FileText, ListChecks, CircleDollarSign, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// Import getEntitySchema to get schema definition dynamically
import { getEntitySchema } from '@/components/utils/sdk'; // sdk prop will provide the initialized sdk instance
import FormDialog from "@/components/ui/form-dialog"; // Corrected import
import { RequestForCommitment } from "@/api/entities"; // Added as per outline

// Since Zod is not available, we remove the Zod-based schema validation.
// Validation will rely on react-hook-form's basic capabilities or manual checks.

export default function RFCDialog({ isOpen, onClose, rfcData, providers, doctors, insuredPersons, policies, sdk }) {
  const { t, language, isRTL } = useLanguageHook();
  // const rfcSchema = getRfcSchemaDefinition(t); // REMOVED Zod schema

  const rfcEntitySchema = getEntitySchema('RequestForCommitment'); // For status enum

  const defaultValues = React.useMemo(() => ({
    provider_id: rfcData?.provider_id || '',
    doctor_id: rfcData?.doctor_id || '',
    insured_id: rfcData?.insured_id || '',
    policy_id: rfcData?.policy_id || '',
    diagnosis_codes: rfcData?.diagnosis_codes?.length ? rfcData.diagnosis_codes : [''],
    procedure_codes: rfcData?.procedure_codes?.length ? rfcData.procedure_codes : [''],
    procedure_date: rfcData?.procedure_date ? new Date(rfcData.procedure_date) : undefined,
    notes: rfcData?.notes || '',
    status: rfcData?.status || 'draft',
    rejection_reason: rfcData?.rejection_reason || '',
    partial_approval_reason: rfcData?.partial_approval_reason || '',
    approved_amount: rfcData?.approved_amount === null || rfcData?.approved_amount === undefined ? '' : String(rfcData.approved_amount),
    currency: rfcData?.currency || 'ILS',
  }), [rfcData]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setError: setFormError } = useForm({
    defaultValues,
    // resolver: zodResolver(rfcSchema), // REMOVED Zod resolver
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const watchedStatus = watch("status");

  const onSubmit = async (data) => {
    // Manual validation (simple example, can be expanded)
    let isValidForm = true;
    if (!data.provider_id) {
      setFormError('provider_id', { type: 'manual', message: t('validation.requiredField', { fieldName: t('rfc.provider') }) });
      isValidForm = false;
    }
    if (!data.doctor_id) {
      setFormError('doctor_id', { type: 'manual', message: t('validation.requiredField', { fieldName: t('rfc.doctor') }) });
      isValidForm = false;
    }
    if (!data.insured_id) {
      setFormError('insured_id', { type: 'manual', message: t('validation.requiredField', { fieldName: t('rfc.insured') }) });
      isValidForm = false;
    }
    if (!data.policy_id) {
      setFormError('policy_id', { type: 'manual', message: t('validation.requiredField', { fieldName: t('rfc.policy') }) });
      isValidForm = false;
    }
    if (!data.procedure_date) {
      setFormError('procedure_date', { type: 'manual', message: t('validation.requiredField', { fieldName: t('rfc.procedureDate') }) });
      isValidForm = false;
    }
    if (!data.diagnosis_codes || data.diagnosis_codes.length === 0 || data.diagnosis_codes.some(c => !c.trim())) {
        setFormError('diagnosis_codes', { type: 'manual', message: t('validation.atLeastOne', { item: t('rfc.diagnosisCode') }) });
        isValidForm = false;
    }
    if (!data.procedure_codes || data.procedure_codes.length === 0 || data.procedure_codes.some(c => !c.trim())) {
        setFormError('procedure_codes', { type: 'manual', message: t('validation.atLeastOne', { item: t('rfc.procedureCode') }) });
        isValidForm = false;
    }


    if (!isValidForm) {
      toast({ title: t('errors.validationFailedTitle'), description: t('errors.validationFailedMessage'), variant: 'destructive' });
      return;
    }

    const approvedAmount = data.approved_amount === '' || data.approved_amount === null || data.approved_amount === undefined ? null : parseFloat(String(data.approved_amount));

    const dataToSave = {
      ...data,
      procedure_date: data.procedure_date ? data.procedure_date.toISOString().split('T')[0] : null,
      approved_amount: approvedAmount,
      diagnosis_codes: data.diagnosis_codes.filter(code => code && code.trim() !== ''),
      procedure_codes: data.procedure_codes.filter(code => code && code.trim() !== ''),
    };
    
    if (!sdk || !sdk.RequestForCommitment) {
        toast({ title: t('errors.sdkError'), description: t('errors.sdkNotInitializedRfc'), variant: 'destructive' });
        return;
    }

    try {
      if (rfcData?.id) {
        await sdk.RequestForCommitment.update(rfcData.id, dataToSave);
        toast({ title: t('rfc.updateSuccessTitle'), description: t('rfc.updateSuccessMessage') });
      } else {
        await sdk.RequestForCommitment.create(dataToSave);
        toast({ title: t('rfc.createSuccessTitle'), description: t('rfc.createSuccessMessage') });
      }
      onClose(true);
    } catch (error) {
      console.error("Error saving RFC:", error);
      const errorMessage = error.response?.data?.message || error.message || t('errors.unexpectedError');
      toast({
        title: t('errors.saveFailedTitle'),
        description: `${t('errors.saveFailedMessage')} ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const renderMultiInput = (name, fieldLabel, placeholder) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          {(field.value || ['']).map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2 rtl:space-x-reverse">
              <Input
                value={item}
                onChange={(e) => {
                  const newValue = [...(field.value || [''])];
                  newValue[index] = e.target.value;
                  field.onChange(newValue);
                }}
                placeholder={`${placeholder} #${index + 1}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
              {index > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange((field.value || ['']).filter((_, i) => i !== index))}>
                  {t('buttons.remove', {defaultValue: 'Remove'})}
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange([...(field.value || ['']), ''])}>
            {t('buttons.add', {defaultValue: 'Add'})} {fieldLabel}
          </Button>
          {/* Display error for the array field itself, or for specific items if possible */}
          {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message || (errors[name]?.root && errors[name].root.message) || (Array.isArray(errors[name]) && errors[name][0]?.message)}</p>}
        </div>
      )}
    />
  );
  
  const rfcStatusOptions = rfcEntitySchema?.properties?.status?.enum || ['draft'];

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={rfcData?.id ? t('rfc.editRFCTitle', {defaultValue: 'Edit RFC'}) : t('rfc.addRFCTitle', {defaultValue: 'Add New RFC'})}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitButtonText={rfcData?.id ? t('buttons.updateRFC', {defaultValue: 'Update RFC'}) : t('buttons.createRFC', {defaultValue: 'Create RFC'})}
      cancelButtonText={t('buttons.cancel', {defaultValue: 'Cancel'})}
      dir={isRTL ? "rtl" : "ltr"}
      className="sm:max-w-2xl"
    >
      <ScrollArea className="max-h-[70vh] p-4">
        <div className="space-y-4">
          {/* Provider */}
          <div>
            <Label htmlFor="provider_id">{t('rfc.provider')}</Label>
            <Controller
              name="provider_id"
              control={control}
              rules={{ required: t('validation.requiredField', { fieldName: t('rfc.provider') }) }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectTrigger id="provider_id" className="w-full">
                    <SelectValue placeholder={t('rfc.selectProvider', {defaultValue: 'Select Provider'})} />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{isRTL ? p.name_he : p.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.provider_id && <p className="text-red-500 text-xs mt-1">{errors.provider_id.message}</p>}
          </div>

          {/* Doctor */}
          <div>
            <Label htmlFor="doctor_id">{t('rfc.doctor')}</Label>
            <Controller
              name="doctor_id"
              control={control}
              rules={{ required: t('validation.requiredField', { fieldName: t('rfc.doctor') }) }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectTrigger id="doctor_id" className="w-full">
                    <SelectValue placeholder={t('rfc.selectDoctor', {defaultValue: 'Select Doctor'})} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{isRTL ? `${d.first_name_he || ''} ${d.last_name_he || ''}`.trim() : `${d.first_name_en || ''} ${d.last_name_en || ''}`.trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id.message}</p>}
          </div>

          {/* Insured Person */}
          <div>
            <Label htmlFor="insured_id">{t('rfc.insured')}</Label>
            <Controller
              name="insured_id"
              control={control}
              rules={{ required: t('validation.requiredField', { fieldName: t('rfc.insured') }) }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectTrigger id="insured_id" className="w-full">
                    <SelectValue placeholder={t('rfc.selectInsured', {defaultValue: 'Select Insured Person'})} />
                  </SelectTrigger>
                  <SelectContent>
                    {insuredPersons.map(ip => (
                      <SelectItem key={ip.id} value={ip.id}>{ip.full_name} ({ip.identification?.number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.insured_id && <p className="text-red-500 text-xs mt-1">{errors.insured_id.message}</p>}
          </div>

          {/* Policy */}
          <div>
            <Label htmlFor="policy_id">{t('rfc.policy')}</Label>
            <Controller
              name="policy_id"
              control={control}
              rules={{ required: t('validation.requiredField', { fieldName: t('rfc.policy') }) }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectTrigger id="policy_id" className="w-full">
                    <SelectValue placeholder={t('rfc.selectPolicy', {defaultValue: 'Select Policy'})} />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.policy_number} ({t('rfc.insuredShort', {defaultValue: 'Insured'})}: {insuredPersons.find(ip => ip.id === p.insured_id)?.full_name || t('common.unknown', {defaultValue: 'Unknown'})})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.policy_id && <p className="text-red-500 text-xs mt-1">{errors.policy_id.message}</p>}
          </div>
          
          {/* Procedure Date */}
          <div>
            <Label htmlFor="procedure_date">{t('rfc.procedureDate')}</Label>
            <Controller
                name="procedure_date"
                control={control}
                rules={{ required: t('validation.requiredField', { fieldName: t('rfc.procedureDate') }) }}
                render={({ field }) => (
                    <DatePicker 
                        date={field.value} 
                        onDateChange={field.onChange}
                        placeholderText={t('rfc.selectProcedureDate', {defaultValue: "Select procedure date"})}
                        />
                )}
            />
            {errors.procedure_date && <p className="text-red-500 text-xs mt-1">{errors.procedure_date.message}</p>}
          </div>

          {/* Diagnosis Codes */}
          <div>
            <Label>{t('rfc.diagnosisCodes')}</Label>
            {renderMultiInput('diagnosis_codes', t('rfc.diagnosisCode', {defaultValue: 'Diagnosis Code'}), t('rfc.enterDiagnosisCode', {defaultValue: 'Enter diagnosis code'}))}
          </div>

          {/* Procedure Codes */}
          <div>
            <Label>{t('rfc.procedureCodes')}</Label>
            {renderMultiInput('procedure_codes', t('rfc.procedureCode', {defaultValue: 'Procedure Code'}), t('rfc.enterProcedureCode', {defaultValue: 'Enter procedure code'}))}
          </div>
          
          {/* Status */}
          <div>
            <Label htmlFor="status">{t('rfc.status')}</Label>
            <Controller
              name="status"
              control={control}
              rules={{ required: t('validation.requiredField', { fieldName: t('rfc.status') }) }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder={t('rfc.selectStatus', {defaultValue: 'Select Status'})} />
                  </SelectTrigger>
                  <SelectContent>
                    {rfcStatusOptions.map(s => (
                      <SelectItem key={s} value={s}>{t(`rfcStatus.${s}`, {defaultValue: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t('rfc.notes')}</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea id="notes" {...field} placeholder={t('rfc.enterNotes', {defaultValue: 'Enter notes...'})} className="min-h-[80px]" dir={isRTL ? "rtl" : "ltr"} />}
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
          </div>

           {/* Conditional Fields based on watchedStatus */}
          {(watchedStatus === 'rejected') && (
            <div>
              <Label htmlFor="rejection_reason">{t('rfc.rejectionReason')}</Label>
              <Controller
                name="rejection_reason"
                control={control}
                render={({ field }) => <Textarea id="rejection_reason" {...field} placeholder={t('rfc.enterRejectionReason', {defaultValue: 'Enter rejection reason...'})} className="min-h-[80px]" dir={isRTL ? "rtl" : "ltr"} />}
              />
              {errors.rejection_reason && <p className="text-red-500 text-xs mt-1">{errors.rejection_reason.message}</p>}
            </div>
          )}

          {(watchedStatus === 'partially_approved' || watchedStatus === 'approved') && (
            <>
              {watchedStatus === 'partially_approved' && (
                 <div>
                    <Label htmlFor="partial_approval_reason">{t('rfc.partialApprovalReason')}</Label>
                    <Controller
                      name="partial_approval_reason"
                      control={control}
                      render={({ field }) => <Textarea id="partial_approval_reason" {...field} placeholder={t('rfc.enterPartialApprovalReason', {defaultValue: 'Enter partial approval reason...'})} className="min-h-[80px]" dir={isRTL ? "rtl" : "ltr"}/>}
                    />
                    {errors.partial_approval_reason && <p className="text-red-500 text-xs mt-1">{errors.partial_approval_reason.message}</p>}
                  </div>
              )}
              <div>
                <Label htmlFor="approved_amount">{t('rfc.approvedAmount')}</Label>
                <Controller
                  name="approved_amount"
                  control={control}
                  render={({ field }) => <Input id="approved_amount" type="number" step="any" {...field} placeholder={t('rfc.enterApprovedAmount', {defaultValue: '0.00'})} dir={isRTL ? "rtl" : "ltr"} />}
                />
                {errors.approved_amount && <p className="text-red-500 text-xs mt-1">{errors.approved_amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="currency">{t('rfc.currency')}</Label>
                 <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} dir={isRTL ? "rtl" : "ltr"}>
                            <SelectTrigger id="currency" className="w-full">
                                <SelectValue placeholder={t('rfc.selectCurrency', { defaultValue: 'Select Currency'})} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ILS">ILS</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </FormDialog>
  );
}
