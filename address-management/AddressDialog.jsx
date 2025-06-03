import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from '@/components/forms/FormField';
import BilingualInput from '@/components/forms/BilingualInput'; // Assuming notes can be bilingual
import { Street } from '@/api/entities'; // To fetch streets
import { useToast } from "@/components/ui/use-toast";


const AddressDialog = ({ isOpen, onClose, onSubmit, address, cities, initialStreets = [], t }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    city_id: '',
    street_id: '',
    house_number: '',
    apartment_number: '',
    zip_code: '',
    notes_en: '',
    notes_he: '',
  });
  const [errors, setErrors] = useState({});
  const [currentStreets, setCurrentStreets] = useState(initialStreets);
  const [isLoadingStreets, setIsLoadingStreets] = useState(false);
  
  const { language } = t; // Assuming t object from useLanguageHook contains language

  const cityOptions = useMemo(() => 
    cities.map(city => ({ value: city.id, label: language === 'he' ? city.name_he : city.name_en }))
  , [cities, language]);

  const streetOptions = useMemo(() => 
    currentStreets.map(street => ({ value: street.id, label: language === 'he' ? street.name_he : street.name_en }))
  , [currentStreets, language]);


  useEffect(() => {
    if (address) {
      setFormData({
        city_id: address.city_id || '',
        street_id: address.street_id || '',
        house_number: address.house_number || '',
        apartment_number: address.apartment_number || '',
        zip_code: address.zip_code || '',
        notes_en: address.notes_en || '',
        notes_he: address.notes_he || '',
      });
      if (address.city_id) { // If editing, load streets for that city
        fetchStreetsForCity(address.city_id);
      }
    } else { // Creating new
      const defaultCityId = address?.city_id || (cities.length > 0 ? cities[0].id : '');
      setFormData({ 
        city_id: defaultCityId, 
        street_id: address?.street_id || '', // Pre-fill if passed (e.g. from AddressesTab filter)
        house_number: '', apartment_number: '', zip_code: '', notes_en: '', notes_he: '' 
      });
      if (defaultCityId) {
        fetchStreetsForCity(defaultCityId).then(streetsForDefaultCity => {
            if(address?.street_id && streetsForDefaultCity.some(s => s.id === address.street_id)) {
                // street_id already set and valid for this city
            } else if (streetsForDefaultCity.length > 0 && !address?.street_id) {
                // setFormData(prev => ({...prev, street_id: streetsForDefaultCity[0].id})); // Optionally default street
            }
        });
      }
    }
    setErrors({});
  }, [address, isOpen, cities]);

  const fetchStreetsForCity = async (cityId) => {
    if (!cityId) {
      setCurrentStreets([]);
      return [];
    }
    setIsLoadingStreets(true);
    try {
      const streetData = await Street.filter({ city_id: cityId });
      const fetchedStreets = Array.isArray(streetData) ? streetData : [];
      setCurrentStreets(fetchedStreets);
      setIsLoadingStreets(false);
      return fetchedStreets;
    } catch (error) {
      console.error("Failed to fetch streets for dialog:", error);
      toast({ title: t('errors.fetchStreetsError', { defaultValue: "Could not load streets" }), description: error.message, variant: 'destructive'});
      setCurrentStreets([]);
      setIsLoadingStreets(false);
      return [];
    }
  };

  useEffect(() => {
    if (formData.city_id) {
       // If city_id changes and street_id is not in the new list of streets, reset it
       if (!currentStreets.some(s => s.id === formData.street_id)) {
           // Do not auto-select first street if street_id was explicitly set by editing an existing address
           if (address && address.city_id === formData.city_id && address.street_id) {
               // keep existing street_id if city matches
           } else {
             setFormData(prev => ({ ...prev, street_id: '' }));
           }
       }
    } else {
        setCurrentStreets([]); // Clear streets if no city selected
        setFormData(prev => ({ ...prev, street_id: '' }));
    }
  }, [formData.city_id, currentStreets, address]);


  const handleCityChange = (cityId) => {
    setFormData(prev => ({ ...prev, city_id: cityId, street_id: '' })); // Reset street when city changes
    fetchStreetsForCity(cityId);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.city_id) newErrors.city_id = t('validation.requiredField', { field: t('fields.city', {defaultValue: 'City'})});
    if (!formData.street_id) newErrors.street_id = t('validation.requiredField', { field: t('fields.street', {defaultValue: 'Street'})});
    if (!formData.house_number) newErrors.house_number = t('validation.requiredField', { field: t('fields.houseNumber', {defaultValue: 'House Number'})});
    // Add more specific validations if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBilingualNotesChange = (lang, field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {address?.id ? t('addresses.editTitle', { defaultValue: 'Edit Address' }) : t('addresses.addTitle', { defaultValue: 'Add New Address' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField label={t('fields.city', { defaultValue: 'City' })} error={errors.city_id} htmlFor="city_id">
            <Select
              value={formData.city_id}
              onValueChange={handleCityChange}
              disabled={!!address?.city_id && cities.length <= 1} // Disable if editing or if city_id was pre-filled and only one option
            >
              <SelectTrigger id="city_id">
                <SelectValue placeholder={t('addresses.selectCityPlaceholder', {defaultValue: 'Select a city'})} />
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

          <FormField label={t('fields.street', { defaultValue: 'Street' })} error={errors.street_id} htmlFor="street_id">
            <Select
              value={formData.street_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, street_id: value }))}
              disabled={!formData.city_id || isLoadingStreets || (!!address?.street_id && streetOptions.length <=1)}
            >
              <SelectTrigger id="street_id">
                <SelectValue placeholder={isLoadingStreets ? t('common.loading', {defaultValue: 'Loading...'}) : t('addresses.selectStreetPlaceholder', {defaultValue: 'Select a street'})} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingStreets && <SelectItem value="loading" disabled>{t('common.loading', {defaultValue: 'Loading...'})}</SelectItem>}
                {!isLoadingStreets && streetOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                 {!isLoadingStreets && streetOptions.length === 0 && formData.city_id && <SelectItem value="no_streets" disabled>{t('addresses.noStreetsForCity', {defaultValue: 'No streets found for this city'})}</SelectItem>}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('fields.houseNumber', { defaultValue: 'House Number' })} error={errors.house_number} htmlFor="house_number">
            <Input id="house_number" name="house_number" value={formData.house_number} onChange={handleChange} />
          </FormField>

          <FormField label={t('fields.apartmentNumberOptional', { defaultValue: 'Apartment (Optional)' })} error={errors.apartment_number} htmlFor="apartment_number">
            <Input id="apartment_number" name="apartment_number" value={formData.apartment_number} onChange={handleChange} />
          </FormField>

          <FormField label={t('fields.zipCodeOptional', { defaultValue: 'ZIP Code (Optional)' })} error={errors.zip_code} htmlFor="zip_code">
            <Input id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleChange} />
          </FormField>

          <BilingualInput
            labelEn={t('fields.notesEnOptional', { defaultValue: 'Notes (English, Optional)'})}
            labelHe={t('fields.notesHeOptional', { defaultValue: 'Notes (Hebrew, Optional)'})}
            valueEn={formData.notes_en}
            valueHe={formData.notes_he}
            onChangeEn={(value) => handleBilingualNotesChange('en', 'notes_en', value)}
            onChangeHe={(value) => handleBilingualNotesChange('he', 'notes_he', value)}
            fieldId="addressNotes"
            inputType="textarea"
            dir={'ltr'}
          />
          
        </form>
        <DialogFooter className="mt-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmit}> {/* Changed to type="button" and onClick to call internal handleSubmit */}
              {address?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create' })}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressDialog;