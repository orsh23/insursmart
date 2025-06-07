import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, Building2, FileCode2, User, DollarSign, Coins } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';
import FilterTitle from '@/components/common/FilterTitle';

export default function TariffFilterBar({
  filters,
  onFilterChange,
  onReset,
  contractOptions = [],
  insuranceCodeOptions = [],
  doctorOptions = []
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const finalizationTypeOptions = [
    { value: "all", label: t('common.all', { defaultValue: "All" }) },
    { value: "RFC", label: t('tariffManagement.finalizationType.rfc', { defaultValue: "RFC" }) },
    { value: "Claim", label: t('tariffManagement.finalizationType.claim', { defaultValue: "Claim" }) },
    { value: "Hybrid", label: t('tariffManagement.finalizationType.hybrid', { defaultValue: "Hybrid" }) }
  ];

  return (
    <FilterBarCard>
      <FilterTitle>{t('tariffManagement.tariffs.filtersTitle', { defaultValue: 'Tariffs Filters' })}</FilterTitle>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={t('tariffManagement.tariffs.searchPlaceholder', { defaultValue: "Search tariffs..." })}
            className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
          />
        </div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
          <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <FilterSelect
          id="contract-filter"
          name="contract_id"
          labelKey="tariffManagement.contractLabel"
          label="Contract"
          defaultValueLabel={t('tariffManagement.allContracts', { defaultValue: 'All Contracts' })}
          value={filters.contract_id}
          onChange={handleInputChange}
          options={contractOptions}
          icon={FileCode2}
        />
        
        <FilterSelect
          id="insurance-code-filter"
          name="insurance_code_id"
          labelKey="tariffManagement.insuranceCodeLabel"
          label="Insurance Code"
          defaultValueLabel={t('tariffManagement.allInsuranceCodes', { defaultValue: 'All Insurance Codes' })}
          value={filters.insurance_code_id}
          onChange={handleInputChange}
          options={insuranceCodeOptions}
          icon={FileCode2}
        />
        
        <FilterSelect
          id="doctor-filter"
          name="doctor_id"
          labelKey="tariffManagement.doctorLabel"
          label="Doctor"
          defaultValueLabel={t('common.allDoctors', { defaultValue: 'All Doctors' })}
          value={filters.doctor_id}
          onChange={handleInputChange}
          options={doctorOptions}
          icon={User}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium flex items-center mb-1">
            <DollarSign className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('tariffManagement.basePriceRange', { defaultValue: 'Base Price Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              name="minBasePrice"
              value={filters.minBasePrice || ''}
              onChange={handleInputChange}
              placeholder={t('common.min', { defaultValue: 'Min' })}
              className="w-full"
            />
            <Input
              type="number"
              name="maxBasePrice"
              value={filters.maxBasePrice || ''}
              onChange={handleInputChange}
              placeholder={t('common.max', { defaultValue: 'Max' })}
              className="w-full"
            />
          </div>
        </div>
        
        <FilterSelect
          id="finalization-type-filter"
          name="finalizationType"
          labelKey="tariffManagement.finalizationTypeLabel"
          label="Finalization Type"
          defaultValueLabel={t('tariffManagement.allFinalizationTypes', { defaultValue: 'All Types' })}
          value={filters.finalizationType}
          onChange={handleInputChange}
          options={finalizationTypeOptions}
          icon={Coins}
        />
        
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <Coins className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('tariffManagement.currencyLabel', { defaultValue: 'Currency' })}
          </label>
          <Input
            name="currency"
            value={filters.currency || ''}
            onChange={handleInputChange}
            placeholder={t('tariffManagement.currencyPlaceholder', { defaultValue: "Filter by currency code..." })}
            className="w-full"
          />
        </div>
      </div>
    </FilterBarCard>
  );
}