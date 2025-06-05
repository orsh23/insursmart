import React from 'react';
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

export default function TariffFormFields({ formData, formErrors, updateField }) {
  const { t, isRTL } = useTranslation();

  const currencyOptions = [
    { value: 'ILS', label: 'ILS (₪)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' }
  ];

  const finalizationOptions = [
    { value: 'RFC', label: t('tariffs.finalizationTypes.rfc', { defaultValue: 'RFC' }) },
    { value: 'Claim', label: t('tariffs.finalizationTypes.claim', { defaultValue: 'Claim' }) },
    { value: 'Hybrid', label: t('tariffs.finalizationTypes.hybrid', { defaultValue: 'Hybrid' }) }
  ];

  const componentTypes = [
    { value: 'Base', label: t('tariffs.componentTypes.base', { defaultValue: 'Base' }) },
    { value: 'DoctorFee', label: t('tariffs.componentTypes.doctorFee', { defaultValue: 'Doctor Fee' }) },
    { value: 'Implantables', label: t('tariffs.componentTypes.implantables', { defaultValue: 'Implantables' }) },
    { value: 'Hospitalization', label: t('tariffs.componentTypes.hospitalization', { defaultValue: 'Hospitalization' }) },
    { value: 'Drugs', label: t('tariffs.componentTypes.drugs', { defaultValue: 'Drugs' }) },
    { value: 'Other', label: t('tariffs.componentTypes.other', { defaultValue: 'Other' }) }
  ];

  const pricingModels = [
    { value: 'Fixed', label: t('tariffs.pricingModels.fixed', { defaultValue: 'Fixed' }) },
    { value: 'BoMActual', label: t('tariffs.pricingModels.bomActual', { defaultValue: 'BoM Actual' }) },
    { value: 'PerDay', label: t('tariffs.pricingModels.perDay', { defaultValue: 'Per Day' }) },
    { value: 'Capped', label: t('tariffs.pricingModels.capped', { defaultValue: 'Capped' }) },
    { value: 'PerUnit', label: t('tariffs.pricingModels.perUnit', { defaultValue: 'Per Unit' }) }
  ];

  const recipientTypes = [
    { value: 'Provider', label: t('tariffs.recipientTypes.provider', { defaultValue: 'Provider' }) },
    { value: 'Doctor', label: t('tariffs.recipientTypes.doctor', { defaultValue: 'Doctor' }) },
    { value: 'Supplier', label: t('tariffs.recipientTypes.supplier', { defaultValue: 'Supplier' }) },
    { value: 'Patient', label: t('tariffs.recipientTypes.patient', { defaultValue: 'Patient' }) }
  ];

  const updateComposition = (index, field, value) => {
    const newComposition = [...(Array.isArray(formData.composition) ? formData.composition : [])];
    
    if (!newComposition[index]) {
      newComposition[index] = {};
    }
    
    newComposition[index][field] = value;
    updateField('composition', newComposition);
  };
  
  const addCompositionItem = () => {
    const newComposition = [...(Array.isArray(formData.composition) ? formData.composition : [])];
    newComposition.push({
      component_type: 'Base',
      pricing_model: 'Fixed',
      recipient_type: 'Provider',
      amount: 0,
      finalized_at: 'Claim',
      copay_applies: true
    });
    updateField('composition', newComposition);
  };
  
  const removeCompositionItem = (index) => {
    const newComposition = [...(Array.isArray(formData.composition) ? formData.composition : [])];
    newComposition.splice(index, 1);
    updateField('composition', newComposition);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="contract_id"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.contractId', { defaultValue: 'Contract' })}</FormLabel>
              <FormControl>
                <Input
                  value={formData.contract_id || ''}
                  onChange={(e) => updateField('contract_id', e.target.value)}
                  error={!!formErrors.contract_id}
                />
              </FormControl>
              {formErrors.contract_id && <FormMessage>{formErrors.contract_id}</FormMessage>}
            </FormItem>
          )}
        />
        
        <FormField
          name="insurance_code"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.insuranceCode', { defaultValue: 'Insurance Code' })}</FormLabel>
              <FormControl>
                <Input
                  value={formData.insurance_code || ''}
                  onChange={(e) => updateField('insurance_code', e.target.value)}
                  error={!!formErrors.insurance_code}
                />
              </FormControl>
              {formErrors.insurance_code && <FormMessage>{formErrors.insurance_code}</FormMessage>}
            </FormItem>
          )}
        />
        
        <FormField
          name="doctor_id"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.doctorId', { defaultValue: 'Doctor (Optional)' })}</FormLabel>
              <FormControl>
                <Input
                  value={formData.doctor_id || ''}
                  onChange={(e) => updateField('doctor_id', e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          name="base_price"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.basePrice', { defaultValue: 'Base Price' })}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price || 0}
                  onChange={(e) => updateField('base_price', parseFloat(e.target.value) || 0)}
                  error={!!formErrors.base_price}
                />
              </FormControl>
              {formErrors.base_price && <FormMessage>{formErrors.base_price}</FormMessage>}
            </FormItem>
          )}
        />
        
        <FormField
          name="currency"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.currency', { defaultValue: 'Currency' })}</FormLabel>
              <Select 
                value={formData.currency || 'ILS'} 
                onValueChange={(value) => updateField('currency', value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tariffs.selectCurrency', { defaultValue: 'Select currency' })} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          name="finalization_type"
          control={null}
          render={() => (
            <FormItem>
              <FormLabel>{t('tariffs.finalizationType', { defaultValue: 'Finalization Type' })}</FormLabel>
              <Select 
                value={formData.finalization_type || 'Claim'} 
                onValueChange={(value) => updateField('finalization_type', value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tariffs.selectFinalization', { defaultValue: 'Select type' })} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {finalizationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {t('tariffs.composition', { defaultValue: 'Tariff Composition' })}
          </h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addCompositionItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('tariffs.addComponent', { defaultValue: 'Add Component' })}
          </Button>
        </div>
        
        {Array.isArray(formData.composition) && formData.composition.length > 0 ? (
          <div className="space-y-4">
            {formData.composition.map((item, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      <FormField
                        name={`composition.${index}.component_type`}
                        control={null}
                        render={() => (
                          <FormItem>
                            <FormLabel>{t('tariffs.componentType', { defaultValue: 'Component Type' })}</FormLabel>
                            <Select 
                              value={item.component_type || 'Base'} 
                              onValueChange={(value) => updateComposition(index, 'component_type', value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('tariffs.selectComponentType', { defaultValue: 'Select component' })} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {componentTypes.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        name={`composition.${index}.pricing_model`}
                        control={null}
                        render={() => (
                          <FormItem>
                            <FormLabel>{t('tariffs.pricingModel', { defaultValue: 'Pricing Model' })}</FormLabel>
                            <Select 
                              value={item.pricing_model || 'Fixed'} 
                              onValueChange={(value) => updateComposition(index, 'pricing_model', value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('tariffs.selectPricingModel', { defaultValue: 'Select model' })} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {pricingModels.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        name={`composition.${index}.recipient_type`}
                        control={null}
                        render={() => (
                          <FormItem>
                            <FormLabel>{t('tariffs.recipientType', { defaultValue: 'Recipient' })}</FormLabel>
                            <Select 
                              value={item.recipient_type || 'Provider'} 
                              onValueChange={(value) => updateComposition(index, 'recipient_type', value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('tariffs.selectRecipient', { defaultValue: 'Select recipient' })} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {recipientTypes.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompositionItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-md p-6 text-center text-muted-foreground">
            {t('tariffs.noComponents', { defaultValue: 'No composition components added. Click "Add Component" to add one.' })}
          </div>
        )}
      </div>
    </div>
  );
}