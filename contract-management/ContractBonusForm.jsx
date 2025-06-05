import React, { useState } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import FormField from '@/components/common/FormField';
import SelectField from '@/components/common/SelectField';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  BONUS_TRIGGER_TYPES,
  BONUS_SCOPE_TYPES,
  BONUS_PAYMENT_TYPES,
  BONUS_PERIODS
} from '@/components/utils/constants';

export default function ContractBonusForm({
  formData = {},
  updateField,
  onSave,
  onCancel,
  isLoading = false
}) {
  const { t, isRTL } = useLanguage();
  const [localLoading, setLocalLoading] = useState(false);
  
  // Use combined loading state (from props or local)
  const isSaving = isLoading || localLoading;
  
  const handleSave = async () => {
    try {
      setLocalLoading(true);
      
      // Validate form data here
      const isValid = true; // Add real validation
      
      if (isValid && onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error("Error saving bonus:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('contracts.bonus.name')}
          error={null}
        >
          <Input
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </FormField>
        
        <FormField
          label={t('contracts.bonus.isActive')}
          error={null}
        >
          <div className="flex items-center">
            <Switch
              checked={formData.is_active || false}
              onCheckedChange={(checked) => updateField('is_active', checked)}
            />
            <span className="ml-2">{formData.is_active ? t('common.yes') : t('common.no')}</span>
          </div>
        </FormField>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('contracts.bonus.triggerType')}
          error={null}
        >
          <SelectField
            value={formData.trigger_type || ''}
            onChange={(value) => updateField('trigger_type', value)}
            options={BONUS_TRIGGER_TYPES.map(opt => ({
              value: opt.value,
              label: t(opt.labelKey, { defaultValue: opt.label })
            }))}
            placeholder={t('common.select')}
          />
        </FormField>
        
        <FormField
          label={t('contracts.bonus.scopeType')}
          error={null}
        >
          <SelectField
            value={formData.scope_type || ''}
            onChange={(value) => updateField('scope_type', value)}
            options={BONUS_SCOPE_TYPES.map(opt => ({
              value: opt.value,
              label: t(opt.labelKey, { defaultValue: opt.label })
            }))}
            placeholder={t('common.select')}
          />
        </FormField>
      </div>
      
      {formData.scope_type === 'specific_codes' && (
        <FormField
          label={t('contracts.bonus.codes')}
          error={null}
          className="col-span-2"
        >
          <Input 
            value={formData.codes || ''}
            onChange={(e) => updateField('codes', e.target.value)}
            placeholder={t('contracts.bonus.codesPlaceholder')}
          />
        </FormField>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('contracts.bonus.threshold')}
          error={null}
        >
          <Input
            type="number"
            value={formData.threshold || ''}
            onChange={(e) => updateField('threshold', e.target.value)}
            min="0"
          />
        </FormField>
        
        <FormField
          label={t('contracts.bonus.paymentType')}
          error={null}
        >
          <SelectField
            value={formData.payment_type || ''}
            onChange={(value) => updateField('payment_type', value)}
            options={BONUS_PAYMENT_TYPES.map(opt => ({
              value: opt.value,
              label: t(opt.labelKey, { defaultValue: opt.label })
            }))}
            placeholder={t('common.select')}
          />
        </FormField>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={formData.payment_type === 'percentage' 
            ? t('contracts.bonus.percentageValue') 
            : t('contracts.bonus.fixedAmount')}
          error={null}
        >
          <div className="flex items-center">
            <Input
              type="number"
              value={formData.payment_value || ''}
              onChange={(e) => updateField('payment_value', e.target.value)}
              min="0"
              className="flex-1"
            />
            {formData.payment_type === 'percentage' && (
              <span className="ml-2">%</span>
            )}
            {formData.payment_type === 'fixed' && (
              <span className="ml-2">₪</span>
            )}
          </div>
        </FormField>
        
        <FormField
          label={t('contracts.bonus.period')}
          error={null}
        >
          <SelectField
            value={formData.period || ''}
            onChange={(value) => updateField('period', value)}
            options={BONUS_PERIODS.map(opt => ({
              value: opt.value,
              label: t(opt.labelKey, { defaultValue: opt.label })
            }))}
            placeholder={t('common.select')}
          />
        </FormField>
      </div>
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t('common.cancel')}
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              {t('common.saving')}
            </>
          ) : t('common.save')}
        </Button>
      </div>
    </div>
  );
}