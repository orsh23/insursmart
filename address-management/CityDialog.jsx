import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BilingualInput from '@/components/forms/BilingualInput'; // Assuming this component exists
import FormField from '@/components/forms/FormField'; // Assuming this component exists

const CityDialog = ({ isOpen, onClose, onSubmit, city, t }) => {
  const [formData, setFormData] = useState({
    name_en: '',
    name_he: '',
    code: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (city) {
      setFormData({
        name_en: city.name_en || '',
        name_he: city.name_he || '',
        code: city.code || '',
      });
    } else {
      setFormData({ name_en: '', name_he: '', code: '' });
    }
    setErrors({}); // Clear errors when dialog opens or city changes
  }, [city, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name_en) newErrors.name_en = t('validation.requiredField', { field: t('fields.nameEn', {defaultValue: 'Name (English)'})});
    if (!formData.name_he) newErrors.name_he = t('validation.requiredField', { field: t('fields.nameHe', {defaultValue: 'Name (Hebrew)'})});
    // Add more validation if needed (e.g., code format)
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {city ? t('cities.editTitle', { defaultValue: 'Edit City' }) : t('cities.addTitle', { defaultValue: 'Add New City' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <BilingualInput
            labelEn={t('fields.nameEn', { defaultValue: 'Name (English)' })}
            labelHe={t('fields.nameHe', { defaultValue: 'Name (Hebrew)' })}
            valueEn={formData.name_en}
            valueHe={formData.name_he}
            onChangeEn={(value) => handleBilingualChange('en', 'name_en', value)}
            onChangeHe={(value) => handleBilingualChange('he', 'name_he', value)}
            fieldId="cityName"
            errorEn={errors.name_en}
            errorHe={errors.name_he}
            dir={'ltr'} // BilingualInput might handle internal RTL for Hebrew field
          />
          
          <FormField label={t('fields.code', { defaultValue: 'Code' })} error={errors.code} htmlFor="code">
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder={t('cities.codePlaceholder', { defaultValue: 'e.g., IL-POST-123' })}
            />
          </FormField>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit">
              {city ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CityDialog;