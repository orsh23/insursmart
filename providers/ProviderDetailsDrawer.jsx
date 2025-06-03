
import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added for affiliated doctors section
import { Provider } from '@/api/entities';
import { Address } from '@/api/entities';
import { City } from '@/api/entities';
import { Street } from '@/api/entities';
import { DoctorProviderAffiliation } from '@/api/entities'; // New import
import { Doctor } from '@/api/entities'; // New import
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Mail, Phone, User, Globe, Edit, Info, AlertTriangle, MapPin, FileText, Award } from 'lucide-react'; // Added Award icon
import LoadingSpinner from '@/components/ui/loading-spinner';
import { format } from 'date-fns'; // Added for date formatting

const DetailItem = ({ icon: Icon, label, value, isRtl = false }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start space-x-3 rtl:space-x-reverse mb-2">
      <Icon className={`h-4 w-4 mt-1 text-gray-500 dark:text-gray-400 ${isRtl ? 'ml-2' : 'mr-2'}`} />
      <div className="text-sm">
        <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-gray-600 dark:text-gray-400">{value}</p>
      </div>
    </div>
  );
};

const ProviderDetailsDrawer = ({ providerId, isOpen, onClose, onEditProvider }) => {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [provider, setProvider] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [affiliatedDoctors, setAffiliatedDoctors] = useState([]); // New state for affiliated doctors
  const [loading, setLoading] = useState(false);
  const [loadingAffiliations, setLoadingAffiliations] = useState(false); // Separate loading for affiliations
  const [error, setError] = useState(null);

  const fetchProviderDetails = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setLoadingAffiliations(true); // Start loading affiliations too
    setError(null);
    setProvider(null);
    setAddressDetails(null);
    setAffiliatedDoctors([]); // Reset affiliations

    try {
      const provData = await Provider.get(providerId);
      setProvider(provData);

      // Fetch address if exists
      if (provData && provData.address_id) {
        try {
          const addrData = await Address.get(provData.address_id);
          if (addrData) {
            const [cityData, streetData] = await Promise.all([
              addrData.city_id ? City.get(addrData.city_id) : Promise.resolve(null),
              addrData.street_id ? Street.get(addrData.street_id) : Promise.resolve(null),
            ]);
            setAddressDetails({ ...addrData, cityName: cityData, streetName: streetData });
          } else {
            setAddressDetails(null);
          }
        } catch (addrErr) {
          console.warn("Could not load address details for provider:", addrErr);
          setAddressDetails(null); // Show provider even if address fails
        }
      } else {
        setAddressDetails(null); // No address_id
      }
      
      // Fetch affiliations
      if (provData) {
        try {
          const affiliationsData = await DoctorProviderAffiliation.filter({ provider_id: provData.id, affiliation_status: 'active' });
          if (Array.isArray(affiliationsData) && affiliationsData.length > 0) {
            // Fetch doctor details for each affiliation
            const doctorIds = affiliationsData.map(aff => aff.doctor_id);
            const uniqueDoctorIds = [...new Set(doctorIds)];
            const doctorsData = await Doctor.filter({ id_in: uniqueDoctorIds });
            const doctorsMap = doctorsData.reduce((acc, doc) => {
                acc[doc.id] = doc;
                return acc;
            }, {});

            setAffiliatedDoctors(affiliationsData.map(aff => ({
                ...aff,
                doctorDetails: doctorsMap[aff.doctor_id]
            })));
          }
        } catch (affErr) {
            console.warn("Could not load affiliations for provider:", affErr);
            toast({title: t('errors.fetchAffiliationsError', {defaultValue: "Failed to load affiliations"}), description: affErr.message, variant: "warning"})
        } finally {
            setLoadingAffiliations(false);
        }
      } else {
        setLoadingAffiliations(false);
      }

    } catch (err) {
      console.error("Error fetching provider details:", err);
      setError(t('providers.errorFetchingDetails', { defaultValue: "Failed to fetch provider details." }));
      toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: err.message, variant: "destructive" });
      setLoadingAffiliations(false); // Ensure this is also set to false on error
    } finally {
      setLoading(false);
    }
  }, [providerId, t, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchProviderDetails();
    }
  }, [isOpen, fetchProviderDetails]);

  const getProviderName = (prov) => {
    if (!prov || !prov.name) return t('common.unknownProvider', { defaultValue: 'Unknown Provider' });
    return language === 'he' ? (prov.name.he || prov.name.en) : (prov.name.en || prov.name.he);
  };
  
  const getDoctorName = (doc) => {
    if (!doc) return t('common.unknownDoctor', {defaultValue: "Unknown Doctor"});
    const first = language === 'he' ? (doc.first_name_he || doc.first_name_en) : (doc.first_name_en || doc.first_name_he);
    const last = language === 'he' ? (doc.last_name_he || doc.last_name_en) : (doc.last_name_en || doc.last_name_he);
    return `${first || ''} ${last || ''}`.trim() || t('common.nameNotSet', {defaultValue: "Name Not Set"});
  };

  const formatFullAddress = () => {
    if (!addressDetails) return provider?.contact?.address || t('common.notSet', {defaultValue: 'N/A'}); // Fallback to legacy or N/A
    
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
    
    if (language === 'he') parts.reverse(); // Basic RTL handling
    return parts.join(', ');
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] max-w-[500px] sm:w-full sm:max-w-lg overflow-y-auto dark:bg-gray-800">
        <SheetHeader className="pb-4 mb-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <div>
                <SheetTitle className="dark:text-gray-100">{provider ? getProviderName(provider) : t('common.loading', {defaultValue: "Loading..."})}</SheetTitle>
                {provider && <SheetDescription className="dark:text-gray-400">
                    {t(`providerTypes.${provider.provider_type}`, {defaultValue: provider.provider_type?.replace('_', ' ')})} | {provider.legal?.identifier || t('common.notSet', {defaultValue: 'N/A'})}
                </SheetDescription>}
            </div>
          </div>
           <SheetClose onClick={onClose} />
        </SheetHeader>

        {loading && <div className="flex justify-center items-center h-40"><LoadingSpinner message={t('common.loadingDetails', {defaultValue: "Loading details..."})}/></div>}
        {error && <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/30 rounded-md flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/> {error}</div>}
        
        {!loading && !error && provider && (
          <div className="space-y-4 px-1">
            <DetailItem icon={Award} label={t('fields.status', {defaultValue: "Status"})} value={t(`status.${provider.status}`, {defaultValue: provider.status})} isRtl={isRTL} />
            <DetailItem icon={Building2} label={t('fields.providerType', {defaultValue: "Provider Type"})} value={t(`providerTypes.${provider.provider_type}`, {defaultValue: provider.provider_type?.replace('_', ' ')})} isRtl={isRTL}/>
            
            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('providers.legalInformation', {defaultValue: "Legal Information"})}</h3>
            <DetailItem icon={FileText} label={t('fields.legalType', {defaultValue: "Legal Type"})} value={provider.legal?.type ? t(`legalTypes.${provider.legal.type}`, {defaultValue: provider.legal.type}) : t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={FileText} label={t('fields.legalIdentifier', {defaultValue: "Legal Identifier"})} value={provider.legal?.identifier || t('common.notSet')} isRtl={isRTL} />

            <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('providers.contactInformation', {defaultValue: "Contact Information"})}</h3>
            <DetailItem icon={User} label={t('fields.contactPerson', {defaultValue: "Contact Person"})} value={provider.contact?.contact_person_name || t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={Phone} label={t('fields.phone', {defaultValue: "Phone"})} value={provider.contact?.phone || t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={Mail} label={t('fields.email', {defaultValue: "Email"})} value={provider.contact?.email || t('common.notSet')} isRtl={isRTL} />
            <DetailItem icon={MapPin} label={t('fields.address', {defaultValue: "Address"})} value={formatFullAddress()} isRtl={isRTL} />
            {addressDetails?.notes_en && <DetailItem icon={Info} label={t('fields.addressNotesEn', {defaultValue: "Address Notes (EN)"})} value={addressDetails.notes_en} isRtl={isRTL} /> }
            {addressDetails?.notes_he && <DetailItem icon={Info} label={t('fields.addressNotesHe', {defaultValue: "Address Notes (HE)"})} value={addressDetails.notes_he} isRtl={isRTL} /> }
            {!provider.address_id && provider.contact?.city &&
                <DetailItem icon={MapPin} label={t('fields.cityLegacy', {defaultValue: "City (Legacy)"})} value={provider.contact.city} isRtl={isRTL} />
            }
            {!provider.address_id && provider.contact?.address &&
                 <DetailItem icon={MapPin} label={t('fields.addressLegacy', {defaultValue: "Full Address (Legacy)"})} value={
                     `${provider.contact.street_name || ''} ${provider.contact.street_number || ''}, ${provider.contact.address || ''}`.replace(/^,|,$/g,'').trim() || t('common.notSet')
                 } isRtl={isRTL} />
            }

            {/* Affiliated Doctors Section */}
            <h3 className="text-md font-semibold border-b pb-1 mb-2 mt-4 dark:text-gray-200 dark:border-gray-700">{t('providers.affiliatedDoctorsTitle', {defaultValue: "Affiliated Doctors"})}</h3>
            {loadingAffiliations && <LoadingSpinner size="sm" message={t('common.loadingAffiliations', {defaultValue: "Loading affiliations..."})}/>}
            {!loadingAffiliations && affiliatedDoctors.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto pl-2">
                    {affiliatedDoctors.map(aff => (
                        <li key={aff.id} className="text-sm text-gray-600 dark:text-gray-400 border-l-2 pl-3 dark:border-gray-600">
                            <span className="font-medium dark:text-gray-300">{getDoctorName(aff.doctorDetails)}</span>
                            {aff.doctorDetails?.specialties?.length > 0 && ` (${aff.doctorDetails.specialties[0]})`}
                            <br/>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                {t('linkage.activeSince', {defaultValue: "Active since"})} {aff.start_date ? format(new Date(aff.start_date), 'PP') : 'N/A'}
                                {aff.is_primary_location && <Badge variant="outline" className="ml-2 text-xs px-1 py-0 dark:border-green-700 dark:text-green-400">{t('linkage.primaryLocationShort', {defaultValue: "Primary"})}</Badge>}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                !loadingAffiliations && <p className="text-sm text-gray-500 dark:text-gray-400">{t('providers.noAffiliatedDoctors', {defaultValue: "No active affiliated doctors found."})}</p>
            )}

            {provider.notes && (
                <>
                    <h3 className="text-md font-semibold border-b pb-1 mb-2 dark:text-gray-200 dark:border-gray-700">{t('fields.notes', {defaultValue: "Notes"})}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{provider.notes}</p>
                </>
            )}
          </div>
        )}
        
        {!loading && provider && onEditProvider && (
            <SheetFooter className="mt-6 pt-4 border-t dark:border-gray-700">
                 <Button variant="outline" onClick={() => {
                     onClose(); // Close drawer first
                     onEditProvider(provider); // Then open dialog
                 }}>
                    <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />{t('buttons.edit', {defaultValue: "Edit Provider"})}
                </Button>
                <Button variant="secondary" onClick={onClose}>{t('buttons.close', {defaultValue: "Close"})}</Button>
            </SheetFooter>
        )}
         {!loading && !provider && !error && (
             <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.noDataFound', {defaultValue: "No provider data found."})}</p>
         )}
      </SheetContent>
    </Sheet>
  );
};

export default ProviderDetailsDrawer;
