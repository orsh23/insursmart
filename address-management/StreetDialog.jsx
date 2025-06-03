import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BilingualInput from '@/components/forms/BilingualInput';
import FormField from '@/components/forms/FormField';

const StreetDialog = ({ isOpen, onClose, onSubmit, street, cities, t }) => {
  const [formData, setFormData] = useState({
    city_id: '',
    name_en: '',
    name_he: '',
  });
  const [errors, setErrors] = useState({});

  const cityOptions = useMemo(() => 
    cities.map(city => ({ value: city.id, label: t.language === 'he' ? city.name_he : city.name_en }))
  , [cities, t.language]);

  useEffect(() => {
    if (street) {
      setFormData({
        city_id: street.city_id || (cities.length > 0 ? cities[0].id : ''), // Default to first city if creating under specific context
        name_en: street.name_en || '',
        name_he: street.name_he || '',
      });
       // If street has city_id, ensure it's set; if creating and a city was passed as initial data
       if(street.city_id && !formData.city_id){
         setFormData(prev => ({...prev, city_id: street.city_id}))
       }

    } else {
      setFormData({ city_id: (cities.length > 0 ? cities[0].id : ''), name_en: '', name_he: '' });
    }
    setErrors({});
  }, [street, isOpen, cities]);

  const validate = () => {
    const newErrors = {};
    if (!formData.city_id) newErrors.city_id = t('validation.requiredField', { field: t('fields.city', {defaultValue: 'City'})});
    if (!formData.name_en) newErrors.name_en = t('validation.requiredField', { field: t('fields.nameEn', {defaultValue: 'Name (English)'})});
    if (!formData.name_he) newErrors.name_he = t('validation.requiredField', { field: t('fields.nameHe', {defaultValue: 'Name (Hebrew)'})});
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleBilingualChange = (lang, field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {street?.id ? t('streets.editTitle', { defaultValue: 'Edit Street' }) : t('streets.addTitle', { defaultValue: 'Add New Street' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <FormField label={t('fields.city', { defaultValue: 'City' })} error={errors.city_id} htmlFor="city_id">
            <Select
              value={formData.city_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}
              disabled={!!street?.city_id} // Disable if editing or if city_id was pre-filled
            >
              <SelectTrigger id="city_id">
                <SelectValue placeholder={t('streets.selectCityPlaceholder', {defaultValue: 'Select a city'})} />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <BilingualInput
            labelEn={t('fields.nameEn', { defaultValue: 'Name (English)' })}
            labelHe={t('fields.nameHe', { defaultValue: 'Name (Hebrew)' })}
            valueEn={formData.name_en}
            valueHe={formData.name_he}
            onChangeEn={(value) => handleBilingualChange('en', 'name_en', value)}
            onChangeHe={(value) => handleBilingualChange('he', 'name_he', value)}
            fieldId="streetName"
            errorEn={errors.name_en}
            errorHe={errors.name_he}
            dir={'ltr'}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit">
              {street?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StreetDialog;