// Unified BoM Form using shared form structure
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguageHook } from '@/components/useLanguageHook';
import { BillOfMaterial } from '@/api/entities';
import { Material } from '@/api/entities';
import { InternalCode } from '@/api/entities';
import BaseFormDialog from '@/components/shared/forms/BaseFormDialog';
import FormField from '@/components/shared/forms/FormField';
import { UNITS_OF_MEASURE, createTranslatedOptions } from '@/components/utils/formOptions';
import { getEntitySchema, safeEntityCall, retryWithBackoff } from '@/components/utils/sdk';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const bomSchema = z.object({
  insurance_code_id: z.string().min(1, 'Insurance code is required'),
  material_id: z.string().min(1, 'Material is required'),
  variant_id: z.string().optional(),
  variant_label: z.string().optional(),
  variant_code: z.string().optional(),
  quantity_type: z.enum(['fixed', 'range', 'average']).default('fixed'),
  quantity_fixed: z.number().min(0).default(1),
  quantity_min: z.number().min(0).optional(),
  quantity_max: z.number().min(0).optional(),
  quantity_avg: z.number().min(0).optional(),
  quantity_unit: z.string().default('item'),
  usage_type: z.enum(['required', 'optional', 'rare', 'conditional']).default('required'),
  usage_probability: z.number().min(0).max(100).default(100),
  reimbursable_flag: z.boolean().default(true),
  notes: z.string().optional()
});

export default function BoMForm({ bom, isOpen, onClose }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [internalCodes, setInternalCodes] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      insurance_code_id: '',
      material_id: '',
      quantity_type: 'fixed',
      quantity_fixed: 1,
      quantity_unit: 'item',
      usage_type: 'required',
      usage_probability: 100,
      reimbursable_flag: true,
      ...bom
    }
  });

  const quantityType = watch('quantity_type');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bom) {
      reset(bom);
    } else {
      reset({
        insurance_code_id: '',
        material_id: '',
        quantity_type: 'fixed',
        quantity_fixed: 1,
        quantity_unit: 'item',
        usage_type: 'required',
        usage_probability: 100,
        reimbursable_flag: true
      });
    }
  }, [bom, reset]);

  const loadData = async () => {
    try {
      const [materialsData, codesData] = await Promise.all([
        safeEntityCall(Material, 'list'),
        safeEntityCall(InternalCode, 'list')
      ]);
      setMaterials(materialsData || []);
      setInternalCodes(codesData || []);
    } catch (error) {
      console.error('Error loading BoM form data:', error);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (bom?.id) {
        await retryWithBackoff(() => safeEntityCall(BillOfMaterial, 'update', bom.id, data));
        toast({
          title: t('common.success', { defaultValue: 'Success' }),
          description: t('bom.updateSuccess', { defaultValue: 'Bill of Materials updated successfully.' })
        });
      } else {
        await retryWithBackoff(() => safeEntityCall(BillOfMaterial, 'create', data));
        toast({
          title: t('common.success', { defaultValue: 'Success' }),
          description: t('bom.createSuccess', { defaultValue: 'Bill of Materials created successfully.' })
        });
      }
      onClose(true);
    } catch (error) {
      console.error('Error saving BoM:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('bom.saveError', { defaultValue: 'Failed to save Bill of Materials.' }),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const materialOptions = materials.map(material => ({
    value: material.id,
    label: language === 'he' && material.name_he ? material.name_he : material.name_en
  }));

  const codeOptions = internalCodes.map(code => ({
    value: code.id,
    label: `${code.code_number} - ${language === 'he' && code.description_he ? code.description_he : code.description_en}`
  }));

  const unitOptions = createTranslatedOptions(UNITS_OF_MEASURE, t);
  const quantityTypeOptions = [
    { value: 'fixed', label: t('bom.quantityType.fixed', { defaultValue: 'Fixed' }) },
    { value: 'range', label: t('bom.quantityType.range', { defaultValue: 'Range' }) },
    { value: 'average', label: t('bom.quantityType.average', { defaultValue: 'Average' }) }
  ];

  const usageTypeOptions = [
    { value: 'required', label: t('bom.usageType.required', { defaultValue: 'Required' }) },
    { value: 'optional', label: t('bom.usageType.optional', { defaultValue: 'Optional' }) },
    { value: 'rare', label: t('bom.usageType.rare', { defaultValue: 'Rare' }) },
    { value: 'conditional', label: t('bom.usageType.conditional', { defaultValue: 'Conditional' }) }
  ];

  return (
    <BaseFormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={bom ? t('bom.editBoM', { defaultValue: 'Edit Bill of Materials' }) : t('bom.addBoM', { defaultValue: 'Add Bill of Materials' })}
      onSubmit={handleSubmit(onSubmit)}
      isLoading={isLoading}
      isValid={isValid}
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            name="insurance_code_id"
            label={t('bom.fields.insuranceCode', { defaultValue: 'Insurance Code' })}
            type="select"
            value={watch('insurance_code_id')}
            onChange={(value) => setValue('insurance_code_id', value)}
            error={errors.insurance_code_id?.message}
            options={[{ value: '', label: t('common.pleaseSelect', { defaultValue: 'Please select...' }) }, ...codeOptions]}
            required
          />

          <FormField
            name="material_id"
            label={t('bom.fields.material', { defaultValue: 'Material' })}
            type="select"
            value={watch('material_id')}
            onChange={(value) => setValue('material_id', value)}
            error={errors.material_id?.message}
            options={[{ value: '', label: t('common.pleaseSelect', { defaultValue: 'Please select...' }) }, ...materialOptions]}
            required
          />

          <FormField
            name="variant_label"
            label={t('bom.fields.variantLabel', { defaultValue: 'Variant Label' })}
            type="text"
            value={watch('variant_label')}
            onChange={(value) => setValue('variant_label', value)}
            error={errors.variant_label?.message}
            placeholder={t('bom.placeholders.variantLabel', { defaultValue: 'e.g., 10mm, Size L' })}
          />

          <FormField
            name="quantity_type"
            label={t('bom.fields.quantityType', { defaultValue: 'Quantity Type' })}
            type="select"
            value={watch('quantity_type')}
            onChange={(value) => setValue('quantity_type', value)}
            error={errors.quantity_type?.message}
            options={quantityTypeOptions}
          />

          {quantityType === 'fixed' && (
            <FormField
              name="quantity_fixed"
              label={t('bom.fields.quantityFixed', { defaultValue: 'Fixed Quantity' })}
              type="number"
              value={watch('quantity_fixed')}
              onChange={(value) => setValue('quantity_fixed', parseFloat(value) || 1)}
              error={errors.quantity_fixed?.message}
              min={0}
              step={0.01}
            />
          )}

          {quantityType === 'range' && (
            <>
              <FormField
                name="quantity_min"
                label={t('bom.fields.quantityMin', { defaultValue: 'Minimum Quantity' })}
                type="number"
                value={watch('quantity_min')}
                onChange={(value) => setValue('quantity_min', parseFloat(value) || 0)}
                error={errors.quantity_min?.message}
                min={0}
                step={0.01}
              />
              <FormField
                name="quantity_max"
                label={t('bom.fields.quantityMax', { defaultValue: 'Maximum Quantity' })}
                type="number"
                value={watch('quantity_max')}
                onChange={(value) => setValue('quantity_max', parseFloat(value) || 0)}
                error={errors.quantity_max?.message}
                min={0}
                step={0.01}
              />
            </>
          )}

          {quantityType === 'average' && (
            <FormField
              name="quantity_avg"
              label={t('bom.fields.quantityAverage', { defaultValue: 'Average Quantity' })}
              type="number"
              value={watch('quantity_avg')}
              onChange={(value) => setValue('quantity_avg', parseFloat(value) || 0)}
              error={errors.quantity_avg?.message}
              min={0}
              step={0.01}
            />
          )}
        </div>

        <div className="space-y-4">
          <FormField
            name="quantity_unit"
            label={t('bom.fields.quantityUnit', { defaultValue: 'Quantity Unit' })}
            type="select"
            value={watch('quantity_unit')}
            onChange={(value) => setValue('quantity_unit', value)}
            error={errors.quantity_unit?.message}
            options={unitOptions}
          />

          <FormField
            name="usage_type"
            label={t('bom.fields.usageType', { defaultValue: 'Usage Type' })}
            type="select"
            value={watch('usage_type')}
            onChange={(value) => setValue('usage_type', value)}
            error={errors.usage_type?.message}
            options={usageTypeOptions}
          />

          <FormField
            name="usage_probability"
            label={t('bom.fields.usageProbability', { defaultValue: 'Usage Probability (%)' })}
            type="number"
            value={watch('usage_probability')}
            onChange={(value) => setValue('usage_probability', parseFloat(value) || 100)}
            error={errors.usage_probability?.message}
            min={0}
            max={100}
            step={1}
          />

          <FormField
            name="reimbursable_flag"
            label={t('bom.fields.reimbursable', { defaultValue: 'Reimbursable' })}
            type="switch"
            value={watch('reimbursable_flag')}
            onChange={(value) => setValue('reimbursable_flag', value)}
            error={errors.reimbursable_flag?.message}
          />

          <FormField
            name="notes"
            label={t('bom.fields.notes', { defaultValue: 'Notes' })}
            type="textarea"
            value={watch('notes')}
            onChange={(value) => setValue('notes', value)}
            error={errors.notes?.message}
            placeholder={t('bom.placeholders.notes', { defaultValue: 'Additional notes or conditions' })}
            rows={3}
          />
        </div>
      </div>
    </BaseFormDialog>
  );
}