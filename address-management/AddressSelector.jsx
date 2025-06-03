import React, { useState, useEffect, useCallback } from 'react';
import { City } from '@/api/entities';
import { Street } from '@/api/entities';
import { Address } from '@/api/entities'; // To save new addresses
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import FormField from '@/components/forms/FormField';
import BilingualInput from '@/components/forms/BilingualInput';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, RotateCcw } from 'lucide-react';

const AddressSelector = ({
  currentAddressId, // ID of the currently linked address for editing
  onAddressSelected, // Callback with the selected/created address ID
  onClearAddress, // Callback to clear the address link
  entityType, // e.g., 'Provider', 'Doctor' - for context in UI/toast
  t, // Passed from parent
}) => {
  const { language } = useLanguageHook(); // Can also get from `t` if passed correctly
  const { toast } = useToast();

  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [existingAddressesOnStreet, setExistingAddressesOnStreet] = useState([]);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedStreetId, setSelectedStreetId] = useState('');
  const [selectedExistingAddressId, setSelectedExistingAddressId] = useState('');

  const [houseNumber, setHouseNumber] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesHe, setNotesHe] = useState('');
  
  const [currentDisplayAddress, setCurrentDisplayAddress] = useState(null); // To show formatted current address
  const [isEditing, setIsEditing] = useState(false); // To switch between display and form
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial cities
  useEffect(() => {
    const fetchCitiesData = async () => {
      try {
        const cityData = await City.list();
        setCities(Array.isArray(cityData) ? cityData : []);
      } catch (err) {
        toast({ title: t('errors.fetchCitiesError', {defaultValue: "Failed to load cities"}), description: err.message, variant: "destructive" });
      }
    };
    fetchCitiesData();
  }, [t, toast]);
  
  // Load full address details if currentAddressId is provided
  useEffect(() => {
    if (currentAddressId) {
      const loadAddressDetails = async () => {
        setIsLoading(true);
        try {
          const addr = await Address.get(currentAddressId);
          if (addr) {
            setSelectedCityId(addr.city_id);
            // Fetch streets for this city, then set street_id and other fields
            await fetchStreetsForCity(addr.city_id, false); // Don't reset street if we have one
            setSelectedStreetId(addr.street_id);
            // await fetchAddressesOnStreet(addr.city_id, addr.street_id); // Potentially for dropdown
            
            setHouseNumber(addr.house_number || '');
            setApartmentNumber(addr.apartment_number || '');
            setZipCode(addr.zip_code || '');
            setNotesEn(addr.notes_en || '');
            setNotesHe(addr.notes_he || '');
            
            // Format for display (can be more sophisticated)
            const city = cities.find(c => c.id === addr.city_id);
            // Street needs to be fetched or available
            // For simplicity now, just showing parts
            setCurrentDisplayAddress(addr); // Store the object to format later or use its parts
            setIsEditing(false); // Start in display mode if an address is linked
          }
        } catch (err) {
          toast({ title: t('addresses.errorLoadingAddress', {defaultValue: "Error loading address"}), description: err.message, variant: "destructive"});
        } finally {
          setIsLoading(false);
        }
      };
      loadAddressDetails();
    } else {
        // No current address ID, reset form fields and prepare for new entry/selection
        resetFormFields();
        setIsEditing(true); // Start in editing mode if no address is linked
        setCurrentDisplayAddress(null);
    }
  }, [currentAddressId, cities]); // Depend on cities to ensure they are loaded for formatting

  const fetchStreetsForCity = useCallback(async (cityId, resetStreetSelection = true) => {
    if (!cityId) {
      setStreets([]);
      if(resetStreetSelection) setSelectedStreetId('');
      setExistingAddressesOnStreet([]);
      if(resetStreetSelection) setSelectedExistingAddressId('');
      return;
    }
    try {
      const streetData = await Street.filter({ city_id: cityId });
      setStreets(Array.isArray(streetData) ? streetData : []);
      if(resetStreetSelection) setSelectedStreetId('');
      setExistingAddressesOnStreet([]);
      if(resetStreetSelection) setSelectedExistingAddressId('');
    } catch (err) {
      toast({ title: t('errors.fetchStreetsError', {defaultValue: "Failed to load streets"}), description: err.message, variant: "destructive" });
    }
  }, [t, toast]);
  
  // Fetch existing addresses for a given street (optional feature for dropdown)
  // const fetchAddressesOnStreet = async (cityId, streetId) => { ... }

  const handleCityChange = (cityId) => {
    setSelectedCityId(cityId);
    fetchStreetsForCity(cityId); // This will reset street and existing address selections
  };
  
  const handleStreetChange = (streetId) => {
    setSelectedStreetId(streetId);
    // fetchAddressesOnStreet(selectedCityId, streetId); // If implementing existing address dropdown
    setSelectedExistingAddressId(''); // Reset if manually selecting street details
    // Maybe auto-fill some fields if an existing address is chosen, or clear them
  };

  // Handle selection from a dropdown of existing addresses on street (if implemented)
  // const handleExistingAddressChange = (addressId) => { ... fill form fields ... }

  const resetFormFields = () => {
    setSelectedCityId('');
    setSelectedStreetId('');
    setSelectedExistingAddressId('');
    setHouseNumber('');
    setApartmentNumber('');
    setZipCode('');
    setNotesEn('');
    setNotesHe('');
    setStreets([]);
    setExistingAddressesOnStreet([]);
  };

  const handleSaveAddress = async () => {
    if (!selectedCityId || !selectedStreetId || !houseNumber) {
      toast({ title: t('validation.incompleteAddressTitle', {defaultValue: "Incomplete Address"}), description: t('validation.addressRequiredFields', {defaultValue: "City, Street, and House Number are required."}), variant: "warning" });
      return;
    }
    setIsLoading(true);
    const addressData = {
      city_id: selectedCityId,
      street_id: selectedStreetId,
      house_number: houseNumber,
      apartment_number: apartmentNumber || null,
      zip_code: zipCode || null,
      notes_en: notesEn || null,
      notes_he: notesHe || null,
    };

    try {
      let savedAddress;
      if (currentAddressId && !selectedExistingAddressId) { // Editing the currently linked address
        savedAddress = await Address.update(currentAddressId, addressData);
         toast({ title: t('addresses.updateSuccessTitle', {defaultValue: "Address Updated"}), description: t('addresses.updateSuccessDescEntity', {entity: entityType, defaultValue: `Address for ${entityType} updated.`}) });
      } else { // Creating a new address (or selected an existing one, but this path is for new/modified)
        // TODO: Add check for existing identical address to avoid duplicates (complex)
        savedAddress = await Address.create(addressData);
        toast({ title: t('addresses.createSuccessTitle', {defaultValue: "Address Created"}), description: t('addresses.createSuccessDescEntity', {entity: entityType, defaultValue: `New address created and linked to ${entityType}.`}) });
      }
      onAddressSelected(savedAddress.id); // Pass back the ID
      setCurrentDisplayAddress(savedAddress); // Update display
      setIsEditing(false);
    } catch (err) {
      toast({ title: t('addresses.errorSavingTitle', {defaultValue: "Error Saving Address"}), description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDisplayAddress = () => {
    if (!currentDisplayAddress || !cities.length) return t('addresses.noAddressSelected', {defaultValue: "No address selected."});
    
    const city = cities.find(c => c.id === currentDisplayAddress.city_id);
    // For street, we might need to fetch it if not already in `streets` state (e.g. on initial load)
    // This part is tricky without having all streets data globally or fetching it on demand.
    // For now, assume street name might be missing if not in current `streets` state.
    const street = streets.find(s => s.id === currentDisplayAddress.street_id) || {name_en: 'Street ID: ' + currentDisplayAddress.street_id, name_he: 'Street ID: ' + currentDisplayAddress.street_id};

    const cityName = city ? (language === 'he' ? city.name_he : city.name_en) : currentDisplayAddress.city_id;
    const streetName = street ? (language === 'he' ? street.name_he : street.name_en) : currentDisplayAddress.street_id;

    let parts = [
      streetName,
      currentDisplayAddress.house_number,
      currentDisplayAddress.apartment_number ? `${t('fields.aptShort', {defaultValue: 'Apt.'})} ${currentDisplayAddress.apartment_number}` : null,
      cityName,
      currentDisplayAddress.zip_code,
    ].filter(Boolean);
    
    return language === 'he' ? parts.reverse().join(', ') : parts.join(', ');
  };

  if (isLoading && !isEditing) { // Show loader only when loading initial address details
      return <p>{t('common.loadingAddress', {defaultValue: "Loading address details..."})}</p>;
  }

  if (!isEditing && currentDisplayAddress) {
    return (
      <div className="space-y-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
        <Label className="font-semibold text-gray-700 dark:text-gray-300">{t('fields.linkedAddress', {defaultValue: "Linked Address"})}</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDisplayAddress()}</p>
        {(currentDisplayAddress.notes_en || currentDisplayAddress.notes_he) && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
                {t('fields.notes')}: {language === 'he' ? currentDisplayAddress.notes_he || currentDisplayAddress.notes_en : currentDisplayAddress.notes_en || currentDisplayAddress.notes_he}
            </p>
        )}
        <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" />{t('buttons.editAddress', {defaultValue: "Edit Address"})}
            </Button>
             <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => {
                if(onClearAddress) onClearAddress();
                resetFormFields();
                setCurrentDisplayAddress(null);
                setIsEditing(true); // Go to edit mode to select/create a new one
                toast({title: t('addresses.addressUnlinked', {defaultValue: "Address Unlinked"})});
            }}>
                {t('buttons.unlinkAddress', {defaultValue: "Unlink"})}
            </Button>
        </div>
      </div>
    );
  }

  // Editing or Creating new mode
  return (
    <div className="space-y-4 p-3 border rounded-md">
        <div className="flex justify-between items-center">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">
                {currentAddressId ? t('addresses.editTitle', {defaultValue: "Edit Address"}) : t('addresses.addNewTitle', {defaultValue: "Add New Address"})}
            </Label>
            {currentAddressId && // Show cancel edit only if there was an existing address
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); /* TODO: Reset form to loaded address if changes were made */ }}>
                    {t('buttons.cancelEdit', {defaultValue: "Cancel Edit"})}
                </Button>
            }
        </div>
      <FormField label={t('fields.city', { defaultValue: 'City' })} htmlFor="addr_city_id">
        <Select value={selectedCityId} onValueChange={handleCityChange}>
          <SelectTrigger id="addr_city_id"><SelectValue placeholder={t('addresses.selectCityPlaceholder', {defaultValue: 'Select City'})} /></SelectTrigger>
          <SelectContent>
            {cities.map(c => <SelectItem key={c.id} value={c.id}>{language === 'he' ? c.name_he : c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t('fields.street', { defaultValue: 'Street' })} htmlFor="addr_street_id">
        <Select value={selectedStreetId} onValueChange={handleStreetChange} disabled={!selectedCityId || streets.length === 0}>
          <SelectTrigger id="addr_street_id"><SelectValue placeholder={streets.length === 0 && selectedCityId ? t('addresses.noStreetsForCity', {defaultValue: "No streets for city"}) : t('addresses.selectStreetPlaceholder', {defaultValue: 'Select Street'})} /></SelectTrigger>
          <SelectContent>
            {streets.map(s => <SelectItem key={s.id} value={s.id}>{language === 'he' ? s.name_he : s.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>
      
      {/* TODO: Optional: Dropdown for existing addresses on street */}

      <FormField label={t('fields.houseNumber', { defaultValue: 'House Number' })} htmlFor="addr_house_number">
        <Input id="addr_house_number" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} />
      </FormField>
      <FormField label={t('fields.apartmentNumberOptional', { defaultValue: 'Apartment (Optional)' })} htmlFor="addr_apartment_number">
        <Input id="addr_apartment_number" value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} />
      </FormField>
      <FormField label={t('fields.zipCodeOptional', { defaultValue: 'ZIP Code (Optional)' })} htmlFor="addr_zip_code">
        <Input id="addr_zip_code" value={zipCode} onChange={e => setZipCode(e.target.value)} />
      </FormField>

      <BilingualInput
        labelEn={t('fields.notesEnOptional', {defaultValue: "Notes (EN, Optional)"})}
        labelHe={t('fields.notesHeOptional', {defaultValue: "Notes (HE, Optional)"})}
        valueEn={notesEn}
        valueHe={notesHe}
        onChangeEn={setNotesEn}
        onChangeHe={setNotesHe}
        fieldId="addressSelectorNotes"
        inputType="textarea"
      />
      
      <div className="flex justify-end gap-2 pt-2">
        {currentAddressId && currentDisplayAddress && // If there's a linked address, give option to just cancel editing this form
            <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false); 
                // TODO: Revert form fields to `currentDisplayAddress` values if changes were made without saving
            }}>
            {t('buttons.cancel', {defaultValue: "Cancel"})}
            </Button>
        }
         {!currentAddressId && onClearAddress && // If creating new but want to clear the intent of adding an address
            <Button type="button" variant="outline" onClick={() => {
                resetFormFields(); // Clear form
                onClearAddress(); // Signal to parent it doesn't want an address now
            }}>
            {t('buttons.cancel', {defaultValue: "Cancel"})}
            </Button>
        }
        <Button onClick={handleSaveAddress} disabled={isLoading}>
          {isLoading ? t('common.saving', {defaultValue: "Saving..."}) : (currentAddressId ? t('buttons.updateAddressLink', {defaultValue: "Update & Link Address"}) : t('buttons.createAndLinkAddress', {defaultValue: "Create & Link Address"}))}
        </Button>
      </div>
    </div>
  );
};

export default AddressSelector;