import React from 'react';
import { useTranslation } from '@/components/utils/i18n';
import FormField from '@/components/shared/FormField';
import SelectField from '@/components/common/SelectField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * Bill of Materials form fields component
 * 
 * @param {Object} props Component props
 * @param {Object} props.formData Current form data
 * @param {Function} props.updateField Field update handler
 * @param {Object} props.formErrors Form validation errors
 * @param {boolean} props.isRTL Right-to-left direction flag
 * @param {Array} props.materialOptions Available materials for selection
 * @param {Array} props.insuranceCodeOptions Available insurance codes for selection
 */
export default function BoMFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false,
  materialOptions = [],
  insuranceCodeOptions = []
}) {
  const { t } = useTranslation();

  // Default quantity types
  const quantityTypeOptions = [
    { value: 'fixed', label: t('bom.quantityTypes.fixed', 'Fixed Quantity') },
    { value: 'range', label: t('bom.quantityTypes.range', 'Range') },
    { value: 'average', label: t('bom.quantityTypes.average', 'Average') }
  ];

  // Default usage types
  const usageTypeOptions = [
    { value: 'required', label: t('bom.usageTypes.required', 'Required') },
    { value: 'optional', label: t('bom.usageTypes.optional', 'Optional') },
    { value: 'rare', label: t('bom.usageTypes.rare', 'Rare') },
    { value: 'conditional', label: t('bom.usageTypes.conditional', 'Conditional') }
  ];
  
  // Default price source types
  const priceSourceTypeOptions = [
    { value: 'default', label: t('bom.priceSourceTypes.default', 'Default') },
    { value: 'lowest', label: t('bom.priceSourceTypes.lowest', 'Lowest Available') },
    { value: 'manual', label: t('bom.priceSourceTypes.manual', 'Manual Entry') },
    { value: 'range', label: t('bom.priceSourceTypes.range', 'Range') }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-1">
      <SelectField
        id="insurance_code_id"
        label={t('bom.insuranceCode', 'Insurance Code')}
        value={formData.insurance_code_id || ''}
        onChange={(value) => updateField('insurance_code_id', value)}
        options={insuranceCodeOptions}
        error={formErrors.insurance_code_id}
        required
        isRTL={isRTL}
        className="md:col-span-2"
      />
      
      <SelectField
        id="material_id"
        label={t('bom.material', 'Material')}
        value={formData.material_id || ''}
        onChange={(value) => updateField('material_id', value)}
        options={materialOptions}
        error={formErrors.material_id}
        required
        isRTL={isRTL}
        className="md:col-span-2"
      />
      
      <FormField label={t('bom.variant.id', 'Variant ID')} error={formErrors.variant_id}>
        <Input
          id="variant_id"
          value={formData.variant_id || ''}
          onChange={(e) => updateField('variant_id', e.target.value)}
        />
      </FormField>
      
      <FormField label={t('bom.variant.label', 'Variant Label')} error={formErrors.variant_label}>
        <Input
          id="variant_label"
          value={formData.variant_label || ''}
          onChange={(e) => updateField('variant_label', e.target.value)}
        />
      </FormField>
      
      <FormField label={t('bom.variant.code', 'Variant Code')} error={formErrors.variant_code}>
        <Input
          id="variant_code"
          value={formData.variant_code || ''}
          onChange={(e) => updateField('variant_code', e.target.value)}
        />
      </FormField>
      
      <SelectField
        id="quantity_type"
        label={t('bom.quantityType', 'Quantity Type')}
        value={formData.quantity_type || 'fixed'}
        onChange={(value) => updateField('quantity_type', value)}
        options={quantityTypeOptions}
        error={formErrors.quantity_type}
        isRTL={isRTL}
      />
      
      {formData.quantity_type === 'fixed' && (
        <FormField label={t('bom.quantityFixed', 'Fixed Quantity')} error={formErrors.quantity_fixed}>
          <Input
            id="quantity_fixed"
            type="number"
            min="0"
            step="1"
            value={formData.quantity_fixed || 1}
            onChange={(e) => updateField('quantity_fixed', parseFloat(e.target.value))}
          />
        </FormField>
      )}
      
      {formData.quantity_type === 'range' && (
        <>
          <FormField label={t('bom.quantityMin', 'Minimum Quantity')} error={formErrors.quantity_min}>
            <Input
              id="quantity_min"
              type="number"
              min="0"
              step="1"
              value={formData.quantity_min || 0}
              onChange={(e) => updateField('quantity_min', parseFloat(e.target.value))}
            />
          </FormField>
          
          <FormField label={t('bom.quantityMax', 'Maximum Quantity')} error={formErrors.quantity_max}>
            <Input
              id="quantity_max"
              type="number"
              min="0"
              step="1"
              value={formData.quantity_max || 0}
              onChange={(e) => updateField('quantity_max', parseFloat(e.target.value))}
            />
          </FormField>
        </>
      )}
      
      {formData.quantity_type === 'average' && (
        <FormField label={t('bom.quantityAvg', 'Average Quantity')} error={formErrors.quantity_avg}>
          <Input
            id="quantity_avg"
            type="number"
            min="0"
            step="0.1"
            value={formData.quantity_avg || 0}
            onChange={(e) => updateField('quantity_avg', parseFloat(e.target.value))}
          />
        </FormField>
      )}
      
      <SelectField
        id="quantity_unit"
        label={t('bom.quantityUnit', 'Quantity Unit')}
        value={formData.quantity_unit || 'item'}
        onChange={(value) => updateField('quantity_unit', value)}
        options={[
          { value: 'item', label: t('units.item', 'Item') },
          { value: 'mg', label: t('units.mg', 'Milligram (mg)') },
          { value: 'ml', label: t('units.ml', 'Milliliter (ml)') },
          { value: 'g', label: t('units.g', 'Gram (g)') },
          { value: 'kg', label: t('units.kg', 'Kilogram (kg)') },
          { value: 'box', label: t('units.box', 'Box') },
          { value: 'pack', label: t('units.pack', 'Pack') }
        ]}
        error={formErrors.quantity_unit}
        isRTL={isRTL}
      />
      
      <SelectField
        id="usage_type"
        label={t('bom.usageType', 'Usage Type')}
        value={formData.usage_type || 'required'}
        onChange={(value) => updateField('usage_type', value)}
        options={usageTypeOptions}
        error={formErrors.usage_type}
        isRTL={isRTL}
      />
      
      <FormField label={t('bom.usageProbability', 'Usage Probability (%)')} error={formErrors.usage_probability}>
        <Input
          id="usage_probability"
          type="number"
          min="0"
          max="100"
          value={formData.usage_probability || 100}
          onChange={(e) => updateField('usage_probability', parseFloat(e.target.value))}
        />
      </FormField>
      
      <div className="flex items-center space-x-2 md:col-span-2">
        <Checkbox
          id="reimbursable_flag"
          checked={formData.reimbursable_flag !== false}
          onCheckedChange={(checked) => updateField('reimbursable_flag', checked)}
        />
        <Label htmlFor="reimbursable_flag">{t('bom.reimbursableFlag', 'This material is reimbursable')}</Label>
      </div>
      
      <SelectField
        id="price_source_type"
        label={t('bom.priceSourceType', 'Price Source')}
        value={formData.price_source_type || 'default'}
        onChange={(value) => updateField('price_source_type', value)}
        options={priceSourceTypeOptions}
        error={formErrors.price_source_type}
        isRTL={isRTL}
      />
      
      {formData.price_source_type === 'manual' && (
        <FormField label={t('bom.priceManual', 'Manual Price')} error={formErrors.price_manual}>
          <Input
            id="price_manual"
            type="number"
            min="0"
            step="0.01"
            value={formData.price_manual || 0}
            onChange={(e) => updateField('price_manual', parseFloat(e.target.value))}
          />
        </FormField>
      )}
      
      {formData.price_source_type === 'range' && (
        <>
          <FormField label={t('bom.priceMin', 'Minimum Price')} error={formErrors.price_min}>
            <Input
              id="price_min"
              type="number"
              min="0"
              step="0.01"
              value={formData.price_min || 0}
              onChange={(e) => updateField('price_min', parseFloat(e.target.value))}
            />
          </FormField>
          
          <FormField label={t('bom.priceMax', 'Maximum Price')} error={formErrors.price_max}>
            <Input
              id="price_max"
              type="number"
              min="0"
              step="0.01"
              value={formData.price_max || 0}
              onChange={(e) => updateField('price_max', parseFloat(e.target.value))}
            />
          </FormField>
        </>
      )}
      
      <FormField label={t('bom.currency', 'Currency')} error={formErrors.currency}>
        <Input
          id="currency"
          value={formData.currency || 'ILS'}
          onChange={(e) => updateField('currency', e.target.value)}
        />
      </FormField>
      
      <FormField label={t('bom.maxCoveredPrice', 'Maximum Covered Price')} error={formErrors.max_covered_price} className="md:col-span-2">
        <Input
          id="max_covered_price"
          type="number"
          min="0"
          step="0.01"
          value={formData.max_covered_price || 0}
          onChange={(e) => updateField('max_covered_price', parseFloat(e.target.value))}
        />
      </FormField>
      
      <FormField label={t('bom.defaultSupplierId', 'Default Supplier ID')} error={formErrors.default_supplier_id}>
        <Input
          id="default_supplier_id"
          value={formData.default_supplier_id || ''}
          onChange={(e) => updateField('default_supplier_id', e.target.value)}
        />
      </FormField>
      
      <FormField label={t('bom.defaultManufacturerId', 'Default Manufacturer ID')} error={formErrors.default_manufacturer_id}>
        <Input
          id="default_manufacturer_id"
          value={formData.default_manufacturer_id || ''}
          onChange={(e) => updateField('default_manufacturer_id', e.target.value)}
        />
      </FormField>
      
      <FormField label={t('bom.notes', 'Notes')} error={formErrors.notes} className="md:col-span-2">
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />
      </FormField>
    </div>
  );
}