
import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Doctor } from '@/api/entities';
import { Address } from '@/api/entities'; // To fetch address details
import { City } from '@/api/entities'; // To fetch city name
import { Street } from '@/api/entities'; // To fetch street name
import { DoctorProviderAffiliation } from '@/api/entities';
import { Provider } from '@/api/entities'; // To fetch provider names for affiliations
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, Phone, MapPin, Stethoscope, Tag, Info, Edit, AlertTriangle, ExternalLink, ListChecks, Award } from 'lucide-react';
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

const DoctorDetailsDrawer = ({ doctorId, isOpen, onClose, onEditDoctor }) => {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [affiliatedProviders, setAffiliatedProviders] = useState([]); // New state for affiliated providers
  const [loading, setLoading] = useState(false);
  const [loadingAffiliations, setLoadingAffiliations] = useState(false); // Separate loading for affiliations
  const [error, setError] = useState(null);

  const fetchDoctorDetails = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setLoadingAffiliations(true); // Start loading affiliations too
    setError(null);
    setDoctor(null);
    setAddressDetails(null);
    setAffiliatedProviders([]); // Reset affiliations

    try {
      const docData = await Doctor.get(doctorId);
      setDoctor(docData);

      // Fetch address if exists
      if (docData && docData.address_id) {
        try {
          const addrData = await Address.get(docData.address_id);
          if (addrData) {
            const [cityData, streetData] = await Promise.all([
              addrData.city_id ? City.get(addrData.city_id) : Promise.resolve(null),
              addrData.street_id ? Street.get(addrData.street_id) : Promise.resolve(null),
            ]);
            setAddressDetails({ ...addrData, cityName: cityData, streetName: streetData });
          }
        } catch (addrErr) {
          console.warn("Could not load address details for doctor:", addrErr);
           // Set to an empty object or specific error state if needed
        }
      }

      // Fetch affiliations
      if (docData) {
        try {
          const affiliationsData = await DoctorProviderAffiliation.filter({ doctor_id: docData.id, affiliation_status: 'active' });
          if (Array.isArray(affiliationsData) && affiliationsData.length > 0) {
            // Fetch provider details for each affiliation
            const providerIds = affiliationsData.map(aff => aff.provider_id);
            const uniqueProviderIds = [...new Set(providerIds)];
            const providersData = await Provider.filter({ id_in: uniqueProviderIds });
            const providersMap = providersData.reduce((acc, prov) => {
                acc[prov.id] = prov;
                return acc;
            }, {});

            setAffiliatedProviders(affiliationsData.map(aff => ({
                ...aff,
                providerDetails: providersMap[aff.provider_id]
            })));
          }
        } catch (affErr) {
            console.warn("Could not load affiliations for doctor:", affErr);
            toast({title: t('errors.fetchAffiliationsError', {defaultValue: "Failed to load affiliations"}), description: affErr.message, variant: "warning"})
        } finally {
            setLoadingAffiliations(false);
        }
      } else {
         setLoadingAffiliations(false);
      }

    } catch (err) {
      console.error("Error fetching doctor details:", err);
      setError(t('doctors.errorFetchingDetails', { defaultValue: "Failed to fetch doctor details." }));
      toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: err.message, variant: "destructive" });
      setLoadingAffiliations(false); // Ensure this is also set to false on error
    } finally {
      setLoading(false);
    }
  }, [doctorId, t, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchDoctorDetails();
    }
  }, [isOpen, fetchDoctorDetails]);

  const getDoctorName = (doc) => {
    if (!doc) return t('common.unknownDoctor', { defaultValue: 'Unknown Doctor' });
    const first = language === 'he' ? (doc.first_name_he || doc.first_name_en) : (doc.first_name_en || doc.first_name_he);
    const last = language === 'he' ? (doc.last_name_he || doc.last_name_en) : (doc.last_name_en || doc.last_name_he);
    return `${first || ''} ${last || ''}`.trim() || t('common.nameNotSet', {defaultValue: "Name Not Set"});
  };

  const getProviderName = (prov) => {
    if (!prov || !prov.name) return t('common.unknownProvider', {defaultValue: "Unknown Provider"});
    return language === 'he' ? (prov.name.he || prov.name.en) : (prov.name.en || prov.name.he);
  };

  const formatFullAddress = () => {
    if (!addressDetails) return doctor?.address || t('common.notSet', {defaultValue: 'N/A'}); // Fallback to legacy or N/A
    
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

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] max-w-[500px] sm:w-full sm:max-w-lg overflow-y-auto dark:bg-gray-800">
        <SheetHeader className="pb-4 mb-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <UserCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <div>
                <SheetTitle className="dark:text-gray-100">{doctor ? getDoctorName(doctor) : t('common.loading', {defaultValue: "Loading..."})}</SheetTitle>
                {doctor && <SheetDescription className="dark:text-gray-400">
                    {t('fields.licenseNumberShort', {defaultValue: 'Lic.'})}: {doctor.license_number || t('common.notSet', {defaultValue: 'N/A'})}
                </SheetDescription>}
            </div>
          </div>
          <SheetClose onClick={onClose} />
        </SheetHeader>

        {loading && <div className="flex justify-center items-center h-40"><LoadingSpinner message={t('common.loadingDetails', {defaultValue: "Loading details..."})}/></div>}
        {error && <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/30 rounded-md flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/> {error}</div>}
        
        {!loading && !error && doctor && (
          <div className="space-y-4 px-1">
            <DetailItem icon={Award} label={t('fields.status', {defaultValue: "Status"})} value={t(`status.${doctor.status}`, {defaultValue: doctor.status})} isRtl={isRTL} />
            
            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('doctors.contactInformation', {defaultValue: "Contact Information"})}</h3>
            <DetailItem icon={Phone} label={t('fields.phone', {defaultValue: "Phone"})} value={doctor.phone} isRtl={isRTL} />
            <DetailItem icon={Mail} label={t('fields.email', {defaultValue: "Email"})} value={doctor.email} isRtl={isRTL} />
            <DetailItem icon={MapPin} label={t('fields.address', {defaultValue: "Address"})} value={formatFullAddress()} isRtl={isRTL} />
            {addressDetails?.notes_en && <DetailItem icon={Info} label={t('fields.addressNotesEn', {defaultValue: "Address Notes (EN)"})} value={addressDetails.notes_en} isRtl={isRTL} /> }
            {addressDetails?.notes_he && <DetailItem icon={Info} label={t('fields.addressNotesHe', {defaultValue: "Address Notes (HE)"})} value={addressDetails.notes_he} isRtl={isRTL} /> }
             {/* Fallback to legacy city if no structured address and legacy city exists */}
            {!doctor.address_id && doctor.city &&
                <DetailItem icon={MapPin} label={t('fields.cityLegacy', {defaultValue: "City (Legacy)"})} value={doctor.city} isRTL={isRTL} />
            }


            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('doctors.professionalInformation', {defaultValue: "Professional Information"})}</h3>
            <DetailItem icon={Stethoscope} label={t('fields.specialties', {defaultValue: "Specialties"})} isRtl={isRTL}>
              {doctor.specialties && doctor.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {doctor.specialties.map(spec => <Badge key={spec} variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{spec}</Badge>)}
                </div>
              ) : t('common.notSet', {defaultValue: 'N/A'})}
            </DetailItem>
            <DetailItem icon={ListChecks} label={t('fields.subSpecialties', {defaultValue: "Sub-Specialties"})} isRtl={isRTL}>
              {doctor.sub_specialties && doctor.sub_specialties.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {doctor.sub_specialties.map(subSpec => <Badge key={subSpec} variant="outline" className="dark:border-gray-600 dark:text-gray-400">{subSpec}</Badge>)}
                </div>
              ) : t('common.notSet', {defaultValue: 'N/A'})}
            </DetailItem>
             <DetailItem icon={Tag} label={t('fields.tags', {defaultValue: "Tags"})} isRtl={isRTL}>
              {doctor.tags && doctor.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {doctor.tags.map(tag => <Badge key={tag} variant="outline" className="dark:border-gray-600 dark:text-gray-400">{tag}</Badge>)}
                </div>
              ) : t('common.notSet', {defaultValue: 'N/A'})}
            </DetailItem>
            

            {/* Affiliated Providers Section */}
            <h3 className="text-md font-semibold border-b pb-1 mb-2 mt-4 dark:text-gray-200 dark:border-gray-700">{t('doctors.affiliatedProvidersTitle', {defaultValue: "Affiliated Providers"})}</h3>
            {loadingAffiliations && <LoadingSpinner size="sm" message={t('common.loadingAffiliations', {defaultValue: "Loading affiliations..."})}/>}
            {!loadingAffiliations && affiliatedProviders.length > 0 && (
                <ul className="space-y-2 max-h-60 overflow-y-auto pl-2">
                    {affiliatedProviders.map(aff => (
                        <li key={aff.id} className="text-sm text-gray-600 dark:text-gray-400 border-l-2 pl-3 dark:border-gray-600">
                            <span className="font-medium dark:text-gray-300">{getProviderName(aff.providerDetails)}</span>
                            {aff.providerDetails?.provider_type && ` (${t(`providerTypes.${aff.providerDetails.provider_type}`, {defaultValue: aff.providerDetails.provider_type.replace('_',' ')})})`}
                            <br/>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                {t('linkage.activeSince', {defaultValue: "Active since"})} {aff.start_date ? format(new Date(aff.start_date), 'PP') : 'N/A'}
                                {aff.is_primary_location && <Badge variant="outline" className="ml-2 text-xs px-1 py-0 dark:border-green-700 dark:text-green-400">{t('linkage.primaryLocationShort', {defaultValue: "Primary"})}</Badge>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {!loadingAffiliations && affiliatedProviders.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('doctors.noAffiliatedProviders', {defaultValue: "No active affiliated providers found."})}</p>
            )}

            {doctor.notes && (
                <>
                    <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('fields.notes', {defaultValue: "Notes"}) }</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{doctor.notes}</p>
                </>
            )}
          </div>
        )}
        
        {!loading && doctor && onEditDoctor && (
            <SheetFooter className="mt-6 pt-4 border-t dark:border-gray-700">
                 <Button variant="outline" onClick={() => {
                     onClose();
                     onEditDoctor(doctor);
                 }}>
                    <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />{t('buttons.edit', {defaultValue: "Edit Doctor"})}
                </Button>
                <Button variant="secondary" onClick={onClose}>{t('buttons.close', {defaultValue: "Close"})}</Button>
            </SheetFooter>
        )}
         {!loading && !doctor && !error && (
             <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.noDataFound', {defaultValue: "No doctor data found."})}</p>
         )}
      </SheetContent>
    </Sheet>
  );
};

export default DoctorDetailsDrawer;
