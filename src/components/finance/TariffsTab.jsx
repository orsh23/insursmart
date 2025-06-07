
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Tariff } from '@/api/entities';
import { Contract } from '@/api/entities';
import { InsuranceCode } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Coins, Search, FilterX, ScrollText, Code2, Stethoscope, AlertTriangle, RefreshCw } from 'lucide-react';
import TariffDialog from './TariffDialog';
import TariffFilterBar from './TariffFilterBar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';

const SimpleCard = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className} border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow`}>
    {children}
  </div>
);

// Simple cache for API responses related to TariffsTab
const tariffApiCache = {
  tariffs: { data: null, timestamp: null, loading: false, error: null },
  contracts: { data: null, timestamp: null, loading: false, error: null },
  insuranceCodes: { data: null, timestamp: null, loading: false, error: null },
  doctors: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const cacheEntry = tariffApiCache[cacheKey];
  if (!cacheEntry || !cacheEntry.data || !cacheEntry.timestamp) return false;
  return (Date.now() - cacheEntry.timestamp) < tariffApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (tariffApiCache[cacheKey]) {
    tariffApiCache[cacheKey].data = data;
    tariffApiCache[cacheKey].timestamp = Date.now();
    tariffApiCache[cacheKey].loading = false;
    tariffApiCache[cacheKey].error = error;
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
    if(tariffApiCache[cacheKey]) tariffApiCache[cacheKey].loading = isLoading;
}

const invalidateCache = (...cacheKeys) => {
  cacheKeys.forEach(key => {
    if (tariffApiCache[key]) {
      tariffApiCache[key].timestamp = null; // Invalidate by clearing timestamp
    }
  });
};


export default function TariffsTab() {
  const { t, isRTL, language } = useLanguageHook();
  const [tariffs, setTariffs] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [globalLoading, setGlobalLoading] = useState(true); // Overall loading state for the tab
  const [pageErrors, setPageErrors] = useState({}); // Store errors by entity
  const [retryAttempt, setRetryAttempt] = useState(0);

  const [filters, setFilters] = useState({
    searchTerm: '',
    contract_id: 'all',
    insurance_code: 'all',
    doctor_id: 'all',
    currency: 'all',
    finalization_type: 'all'
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTariff, setCurrentTariff] = useState(null);
  const [dialogSubmitError, setDialogSubmitError] = useState(null);

  const loadEntityData = useCallback(async (entityKey, entityApi, params = [], forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(entityKey) && tariffApiCache[entityKey].data) {
      return tariffApiCache[entityKey].data;
    }
    if (tariffApiCache[entityKey].loading && !forceRefresh) { // Already loading this, don't stack requests
        return tariffApiCache[entityKey].data || []; // Return existing data if any
    }

    setCacheLoading(entityKey, true);
    setPageErrors(prev => ({ ...prev, [entityKey]: null }));

    try {
      const data = await entityApi.list(...params);
      updateCache(entityKey, Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Error fetching ${entityKey}:`, err);
      const errorMessage = err.message || `Failed to load ${entityKey}`;
      updateCache(entityKey, tariffApiCache[entityKey].data || [], errorMessage); // Keep old data on error
      setPageErrors(prev => ({ ...prev, [entityKey]: errorMessage }));

      if (err.response?.status === 429) {
        throw { isRateLimit: true, entityKey }; // Propagate for retry logic
      }
      return tariffApiCache[entityKey].data || []; // Return old data on non-rate-limit error
    } finally {
       // Small delay after each actual fetch to be nice to the API
       if (!isCacheValid(entityKey) || forceRefresh) { // Only delay if an actual API call was made
            await new Promise(resolve => setTimeout(resolve, 250)); 
       }
    }
  }, []);

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    setGlobalLoading(true);
    
    const entitiesToLoadSequentially = [
      { key: 'tariffs', api: Tariff, params: ['-updated_date'], setter: setTariffs },
      { key: 'contracts', api: Contract, setter: setContracts },
      { key: 'insuranceCodes', api: InsuranceCode, setter: setInsuranceCodes },
      { key: 'doctors', api: Doctor, setter: setDoctors },
    ];

    let rateLimitErrorOccurred = false;

    for (const entityConfig of entitiesToLoadSequentially) {
      try {
        const data = await loadEntityData(entityConfig.key, entityConfig.api, entityConfig.params, forceRefresh);
        entityConfig.setter(data);
      } catch (err) {
        if (err.isRateLimit) {
          rateLimitErrorOccurred = true;
          // Stop further fetches on rate limit to allow recovery
          setPageErrors(prev => ({ ...prev, general: t('errors.rateLimitExceededShort', { defaultValue: 'Rate limit hit. Retrying...' }) }));
          break; 
        }
      }
    }
    
    setGlobalLoading(false);

    if (rateLimitErrorOccurred) {
      setRetryAttempt(prev => prev + 1);
    } else {
      setRetryAttempt(0); // Reset on success
    }

  }, [loadEntityData, t]);

  useEffect(() => {
    // Initial fetch
    fetchAllData();
  }, []); // fetchAllData dependency not needed if it's stable due to useCallback

  useEffect(() => {
    if (retryAttempt > 0 && retryAttempt <= 3) {
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 8000); // Max 8s
      const timer = setTimeout(() => {
        fetchAllData(true); // Force refresh on retry
      }, delay);
      return () => clearTimeout(timer);
    } else if (retryAttempt > 3) {
        setPageErrors(prev => ({...prev, general: t('errors.rateLimitExceededMaxRetries', {
             defaultValue: 'Max retries reached for rate limit. Please try again later.'
        })}));
        setGlobalLoading(false); // Stop loading indicator if max retries reached
    }
  }, [retryAttempt, fetchAllData, t]);


  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      contract_id: 'all',
      insurance_code: 'all',
      doctor_id: 'all',
      currency: 'all',
      finalization_type: 'all'
    });
  };

  const filteredTariffs = React.useMemo(() => {
    return tariffs.filter(tariff => {
      if (!tariff) return false;
      const contract = contracts.find(c => c && c.id === tariff.contract_id);
      const insuranceCodeEntity = insuranceCodes.find(ic => ic && ic.code === tariff.insurance_code);

      const searchLower = filters.searchTerm.toLowerCase();
      let matchesSearch = !filters.searchTerm;
      if (filters.searchTerm) {
        matchesSearch = (tariff.base_price?.toString().includes(searchLower)) ||
        (contract && (contract.name_en?.toLowerCase().includes(searchLower) || contract.name_he?.toLowerCase().includes(searchLower) || contract.contract_number?.toLowerCase().includes(searchLower))) ||
        (insuranceCodeEntity && (insuranceCodeEntity.code?.toLowerCase().includes(searchLower) || insuranceCodeEntity.name_en?.toLowerCase().includes(searchLower) || insuranceCodeEntity.name_he?.toLowerCase().includes(searchLower)));
      }
      
      const matchesContract = filters.contract_id === 'all' || tariff.contract_id === filters.contract_id;
      const matchesInsuranceCode = filters.insurance_code === 'all' || tariff.insurance_code === filters.insurance_code;
      const matchesDoctor = filters.doctor_id === 'all' || tariff.doctor_id === filters.doctor_id;
      const matchesCurrency = filters.currency === 'all' || tariff.currency === filters.currency;
      const matchesFinalization = filters.finalization_type === 'all' || tariff.finalization_type === filters.finalization_type;
      
      return matchesSearch && matchesContract && matchesInsuranceCode && matchesDoctor && matchesCurrency && matchesFinalization;
    });
  }, [tariffs, contracts, insuranceCodes, doctors, filters, language]);

  const handleOpenDialog = (tariff = null) => {
    setCurrentTariff(tariff);
    setDialogSubmitError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentTariff(null);
    setDialogSubmitError(null);
  };

  const handleSaveTariff = async (formData) => {
    setDialogSubmitError(null);
    try {
      const dataToSave = {
        ...formData,
        base_price: parseFloat(formData.base_price) || 0,
        composition: Array.isArray(formData.composition) ? formData.composition.map(comp => ({
          ...comp,
          amount: parseFloat(comp.amount) || 0,
          cap_value: comp.cap_value !== undefined && comp.cap_value !== null && comp.cap_value !== '' ? parseFloat(comp.cap_value) : undefined,
        })) : [],
      };

      if (currentTariff && currentTariff.id) {
        await Tariff.update(currentTariff.id, dataToSave);
      } else {
        await Tariff.create(dataToSave);
      }
      invalidateCache('tariffs');
      fetchAllData(true); // Refetch ALL data, forcing tariff refresh
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving tariff:", err);
      if (err.response?.status === 429) {
         setDialogSubmitError(t('errors.rateLimitExceededShort', {defaultValue: 'Rate limit hit. Please try again in a moment.'}));
      } else {
        setDialogSubmitError(err.message || t('errors.saveFailed', { item: t('tariffManagement.titleSingular') }));
      }
      throw err; 
    }
  };

  const handleDeleteTariff = async (tariffId) => {
    if (window.confirm(t('common.confirmDelete', { item: t('tariffManagement.titleSingular') }))) {
      try {
        setPageErrors(prev => ({ ...prev, general: null })); // Clear general page error
        await Tariff.delete(tariffId);
        invalidateCache('tariffs');
        fetchAllData(true);
      } catch (err) {
        console.error("Error deleting tariff:", err);
        const errorKey = 'general';
        if (err.response?.status === 429) {
          setPageErrors(prev => ({...prev, [errorKey]: t('errors.rateLimitExceededShort', {defaultValue: 'Rate limit hit. Please try again in a moment.'})}));
        } else {
          setPageErrors(prev => ({...prev, [errorKey]: t('errors.deleteFailed', { item: t('tariffManagement.titleSingular') })}));
        }
      }
    }
  };

  const contractOptions = contracts.map(c => ({
    value: c.id,
    label: `${c.contract_number} (${(language === 'he' && c.name_he) ? c.name_he : c.name_en || 'N/A'})`
  }));
  
  const insuranceCodeOptions = insuranceCodes.map(ic => ({
    value: ic.code, 
    label: `${ic.code} (${(language === 'he' && ic.name_he) ? ic.name_he : ic.name_en || 'N/A'})`
  }));

  const doctorOptions = doctors.map(d => ({
    value: d.id,
    label: ((language === 'he' ? `${d.first_name_he || ''} ${d.last_name_he || ''}` : `${d.first_name_en || ''} ${d.last_name_en || ''}`).trim() || d.license_number || 'N/A')
  }));

  const getContractDisplay = (contractId) => {
    const contract = contracts.find(c => c && c.id === contractId);
    if (!contract) return t('common.unknown', {defaultValue: 'Unknown'});
    return `${contract.contract_number || 'N/A'} (${(language === 'he' && contract.name_he) ? contract.name_he : contract.name_en || 'N/A'})`;
  };

  const getInsuranceCodeDisplay = (codeValue) => { 
    const insCode = insuranceCodes.find(ic => ic && ic.code === codeValue);
    if (!insCode) return codeValue || t('common.unknown', {defaultValue: 'Unknown'});
    return `${insCode.code || 'N/A'} (${(language === 'he' && insCode.name_he) ? insCode.name_he : insCode.name_en || 'N/A'})`;
  };

  const getDoctorDisplay = (doctorId) => {
    const doctor = doctors.find(d => d && d.id === doctorId);
    if (!doctor) return doctorId ? t('common.specificDoctor', {defaultValue: 'Specific Doctor'}) : t('common.notApplicableShort', {defaultValue: 'N/A'});
    return ((language === 'he' ? `${doctor.first_name_he || ''} ${doctor.last_name_he || ''}` : `${doctor.first_name_en || ''} ${doctor.last_name_en || ''}`).trim() || doctor.license_number || 'N/A');
  };

  // Display combined error messages
  const getCombinedErrorMessages = () => {
    return Object.entries(pageErrors)
      .filter(([key, value]) => value) // Filter out null/empty errors
      .map(([key, value]) => {
         if(key === 'general') return value; // General messages as is
         return `${t(`common.entity.${key}`, {defaultValue: key.charAt(0).toUpperCase() + key.slice(1)})}: ${value}`;
      })
      .join('; ');
  };
  
  const combinedErrorText = getCombinedErrorMessages();

  if (globalLoading && tariffs.length === 0 && contracts.length === 0 && insuranceCodes.length === 0 && doctors.length === 0 && retryAttempt < 1) {
      return <LoadingSpinner text={t('common.loadingData', {item: t('tariffManagement.titlePlural')})} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('tariffManagement.title', {defaultValue: "Manage Tariffs"})}</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('tariffManagement.addNew', {defaultValue: "New Tariff"})}
        </Button>
      </div>

      <TariffFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        contractOptions={contractOptions}
        insuranceCodeOptions={insuranceCodeOptions}
        doctorOptions={doctorOptions}
      />
      
      {combinedErrorText && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm flex items-center justify-between">
            <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{combinedErrorText}</p>
            </div>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setRetryAttempt(0); fetchAllData(true); }}
                disabled={globalLoading}
                className="ml-4"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${globalLoading ? 'animate-spin' : ''}`} />
                {t('common.retry', {defaultValue: 'Retry'})}
              </Button>
        </div>
      )}

      {filteredTariffs.length === 0 && !globalLoading ? (
        <EmptyState 
          Icon={Coins}
          title={t('tariffManagement.noTariffsFoundTitle', { defaultValue: 'No Tariffs Found' })}
          message={
            Object.values(filters).some(f => f !== "all" && f !== "") ?
            t('tariffManagement.noTariffsFoundFilterMessage', { defaultValue: 'Try adjusting your filters or add a new tariff.' }) :
            t('tariffManagement.noTariffsFoundMessage', { defaultValue: 'Add a new tariff to get started.'})
          }
          actionButton={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('tariffManagement.addNew', {defaultValue: "New Tariff"})}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTariffs.map(tariff => (
            <SimpleCard key={tariff.id}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-md font-semibold text-green-600 dark:text-green-400">
                  {t('tariffManagement.basePrice')}: {tariff.base_price || 0} {tariff.currency || 'N/A'}
                </h3>
                <Badge variant="outline" className="text-xs">{t(`tariffManagement.finalizationType.${tariff.finalization_type?.toLowerCase()}`, {defaultValue: tariff.finalization_type || 'N/A'})}</Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong className="font-medium">{t('tariffManagement.contract')}:</strong> {getContractDisplay(tariff.contract_id)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong className="font-medium">{t('tariffManagement.insuranceCode')}:</strong> {getInsuranceCodeDisplay(tariff.insurance_code)}
              </p>
              {tariff.doctor_id && (
                 <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <strong className="font-medium">{t('tariffManagement.doctorSpecific')}:</strong> {getDoctorDisplay(tariff.doctor_id)}
                </p>
              )}
             
              <div className="mt-4 flex justify-end space-x-2 rtl:space-x-reverse border-t pt-3 dark:border-gray-700">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(tariff)}>
                  <Edit className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" /> {t('common.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTariff(tariff.id)}>
                  <Trash2 className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" /> {t('common.delete')}
                </Button>
              </div>
            </SimpleCard>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <TariffDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveTariff}
          currentTariff={currentTariff}
          contracts={contracts}
          insuranceCodes={insuranceCodes}
          doctors={doctors}
          dialogError={dialogSubmitError}
        />
      )}
    </div>
  );
}
