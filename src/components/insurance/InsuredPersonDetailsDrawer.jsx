import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InsuredPerson } from '@/api/entities';
import { Address } from '@/api/entities';
import { City } from '@/api/entities';
import { Street } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Phone, MapPin, CalendarDays, Tag, Info, Edit, AlertTriangle, Briefcase } from 'lucide-react'; // Assuming Briefcase for ID type
import LoadingSpinner from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

const DetailItem = ({ icon: Icon, label, value, isRtl = false, children }) => {
  if (!value && value !== 0 && !children) return null;
  return (
    <div className={`flex items-start space-x-3 rtl:space-x-reverse mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
      <Icon className="h-4 w-4 mt-1 text-gray-500 dark:text-gray-400 shrink-0" />
      <div className="text-sm w-full">
        <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {children ? children : <p className="text-gray-600 dark:text-gray-400 break-words">{value}</p>}
      </div>
    </div>
  );
};

const InsuredPersonDetailsDrawer = ({ personId, isOpen, onClose, onEditPerson }) => {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [person, setPerson] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersonDetails = useCallback(async () => {
    if (!personId) return;
    setLoading(true);
    setError(null);
    setPerson(null);
    setAddressDetails(null);
    try {
      const personData = await InsuredPerson.get(personId);
      setPerson(personData);
      if (personData && personData.address_id) {
        try {
          const addrData = await Address.get(personData.address_id);
          if (addrData) {
            const [cityData, streetData] = await Promise.all([
              addrData.city_id ? City.get(addrData.city_id) : Promise.resolve(null),
              addrData.street_id ? Street.get(addrData.street_id) : Promise.resolve(null),
            ]);
            setAddressDetails({ ...addrData, cityName: cityData, streetName: streetData });
          }
        } catch (addrErr) {
          console.warn("Could not load address details for insured person:", addrErr);
        }
      }
    } catch (err) {
      console.error("Error fetching insured person details:", err);
      setError(t('insuredPersons.errorFetchingDetails', { defaultValue: "Failed to fetch insured person details." }));
      toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [personId, t, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchPersonDetails();
    }
  }, [isOpen, fetchPersonDetails]);

  const formatFullAddress = () => {
    if (!addressDetails) {
        // Fallback to legacy address if present
        if(person?.address?.city || person?.address?.street_name) {
            const legacyParts = [
                person.address.street_name,
                person.address.street_number,
                person.address.additional_info,
                person.address.city,
                person.address.postal_code,
            ].filter(Boolean);
            if (language === 'he') legacyParts.reverse();
            return legacyParts.join(', ') || t('common.notSet', {defaultValue: 'N/A'});
        }
        return t('common.notSet', {defaultValue: 'N/A'});
    }
    
    const city = addressDetails.cityName;
    const street = addressDetails.streetName;

    const cityName = city ? (language === 'he' ? city.name_he : city.name_en) : t('common.unknown', {defaultValue: 'Unknown City'});
    const streetName = street ? (language === 'he' ? street.name_he : street.name_en) : t('common.unknown', {defaultValue: 'Unknown Street'});

    let parts = [
      streetName,
      addressDetails.house_number,
      addressDetails.apartment_number ? `${t('fields.aptShort', {defaultValue: 'Apt.'})} ${addressDetails.apartment_number}` : null,
      cityName,
      addressDetails.zip_code,
    ].filter(Boolean);
    
    if (language === 'he') parts.reverse();
    return parts.join(', ');
  };
  
  const identificationTypeLabel = (typeKey) => {
     return t(`idType.${typeKey}`, {defaultValue: typeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())});
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] max-w-[500px] sm:w-full sm:max-w-lg overflow-y-auto dark:bg-gray-800">
        <SheetHeader className="pb-4 mb-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <div>
                <SheetTitle className="dark:text-gray-100">{person ? person.full_name : t('common.loading', {defaultValue: "Loading..."})}</SheetTitle>
                {person && person.identification && <SheetDescription className="dark:text-gray-400">
                    {identificationTypeLabel(person.identification.type)}: {person.identification.number || t('common.notSet', {defaultValue: 'N/A'})}
                </SheetDescription>}
            </div>
          </div>
          <SheetClose onClick={onClose} />
        </SheetHeader>

        {loading && <div className="flex justify-center items-center h-40"><LoadingSpinner message={t('common.loadingDetails', {defaultValue: "Loading details..."})}/></div>}
        {error && <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/30 rounded-md flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/> {error}</div>}
        
        {!loading && !error && person && (
          <div className="space-y-4 px-1">
            <DetailItem icon={CalendarDays} label={t('common.dateOfBirth', {defaultValue: "Date of Birth"})} value={person.date_of_birth ? format(new Date(person.date_of_birth), 'PP') : t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={User} label={t('common.gender', {defaultValue: "Gender"})} value={person.gender ? t(`gender.${person.gender}`, {defaultValue: person.gender}) : t('common.notSet')} isRtl={isRTL} />
            
            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('insuredPersons.contactInformation', {defaultValue: "Contact Information"})}</h3>
            <DetailItem icon={Phone} label={t('common.phone', {defaultValue: "Phone"})} value={person.contact?.phone || t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={Mail} label={t('common.email', {defaultValue: "Email"})} value={person.contact?.email || t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={MapPin} label={t('fields.address', {defaultValue: "Address"})} value={formatFullAddress()} isRtl={isRTL} />
            {addressDetails?.notes_en && <DetailItem icon={Info} label={t('fields.addressNotesEn', {defaultValue: "Address Notes (EN)"})} value={addressDetails.notes_en} isRtl={isRTL} /> }
            {addressDetails?.notes_he && <DetailItem icon={Info} label={t('fields.addressNotesHe', {defaultValue: "Address Notes (HE)"})} value={addressDetails.notes_he} isRtl={isRTL} /> }

            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('insuredPersons.identification', {defaultValue: "Identification"})}</h3>
            <DetailItem icon={Briefcase} label={t('identification.type', {defaultValue: "ID Type"})} value={person.identification?.type ? identificationTypeLabel(person.identification.type) : t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={Briefcase} label={t('identification.number', {defaultValue: "ID Number"})} value={person.identification?.number || t('common.notSet')} isRtl={isRTL} />
          </div>
        )}
        
        {!loading && person && onEditPerson && (
            <SheetFooter className="mt-6 pt-4 border-t dark:border-gray-700">
                 <Button variant="outline" onClick={() => {
                     onClose(); // Close drawer first
                     onEditPerson(person); // Then open dialog
                 }}>
                    <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />{t('buttons.edit', {defaultValue: "Edit Person"})}
                </Button>
                <Button variant="secondary" onClick={onClose}>{t('buttons.close', {defaultValue: "Close"})}</Button>
            </SheetFooter>
        )}
         {!loading && !person && !error && (
             <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.noDataFound', {defaultValue: "No insured person data found."})}</p>
         )}
      </SheetContent>
    </Sheet>
  );
};

export default InsuredPersonDetailsDrawer;