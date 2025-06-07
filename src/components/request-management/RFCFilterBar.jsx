import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, Building2, User, CalendarDays, CheckCircle2, FileCode2, CreditCard } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';
import FilterTitle from '@/components/common/FilterTitle';

export default function RFCFilterBar({
  filters,
  onFilterChange,
  onReset,
  providerOptions = [],
  doctorOptions = [],
  insuredOptions = []
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const statusOptions = [
    { value: "draft", label: t('requestManagement.status.draft', { defaultValue: "Draft" }) },
    { value: "submitted", label: t('requestManagement.status.submitted', { defaultValue: "Submitted" }) },
    { value: "in_review", label: t('requestManagement.status.inReview', { defaultValue: "In Review" }) },
    { value: "approved", label: t('requestManagement.status.approved', { defaultValue: "Approved" }) },
    { value: "partially_approved", label: t('requestManagement.status.partiallyApproved', { defaultValue: "Partially Approved" }) },
    { value: "rejected", label: t('requestManagement.status.rejected', { defaultValue: "Rejected" }) },
    { value: "cancelled", label: t('requestManagement.status.cancelled', { defaultValue: "Cancelled" }) }
  ];

  return (
    <FilterBarCard>
      <FilterTitle>{t('requestManagement.rfc.filtersTitle', { defaultValue: 'Request for Commitment Filters' })}</FilterTitle>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={t('requestManagement.rfc.searchPlaceholder', { defaultValue: "Search requests..." })}
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
          id="status-filter"
          name="status"
          labelKey="common.statusLabel"
          label="Status"
          defaultValueLabel={t('common.allStatuses', { defaultValue: 'All Statuses' })}
          value={filters.status}
          onChange={handleInputChange}
          options={statusOptions}
          icon={CheckCircle2}
        />
        
        <FilterSelect
          id="provider-filter"
          name="provider_id"
          labelKey="requestManagement.providerLabel"
          label="Provider"
          defaultValueLabel={t('common.allProviders', { defaultValue: 'All Providers' })}
          value={filters.provider_id}
          onChange={handleInputChange}
          options={providerOptions}
          icon={Building2}
        />
        
        <FilterSelect
          id="doctor-filter"
          name="doctor_id"
          labelKey="requestManagement.doctorLabel"
          label="Doctor"
          defaultValueLabel={t('common.allDoctors', { defaultValue: 'All Doctors' })}
          value={filters.doctor_id}
          onChange={handleInputChange}
          options={doctorOptions}
          icon={User}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <FilterSelect
          id="insured-filter" 
          name="insured_id"
          labelKey="requestManagement.insuredPersonLabel"
          label="Insured Person"
          defaultValueLabel={t('common.allInsured', { defaultValue: 'All Insured Persons' })}
          value={filters.insured_id}
          onChange={handleInputChange}
          options={insuredOptions}
          icon={User}
        />
        
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <FileCode2 className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.procedureCodeLabel', { defaultValue: 'Procedure Code' })}
          </label>
          <Input
            name="procedure_code"
            value={filters.procedure_code || ''}
            onChange={handleInputChange}
            placeholder={t('requestManagement.procedureCodePlaceholder', { defaultValue: "Filter by procedure code..." })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.policyNumberLabel', { defaultValue: 'Policy Number' })}
          </label>
          <Input
            name="policy_number"
            value={filters.policy_number || ''}
            onChange={handleInputChange}
            placeholder={t('requestManagement.policyNumberPlaceholder', { defaultValue: "Filter by policy #..." })}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.procedureDateRange', { defaultValue: 'Procedure Date Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              name="procedure_date_from"
              value={filters.procedure_date_from || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <Input
              type="date"
              name="procedure_date_to"
              value={filters.procedure_date_to || ''}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.submittedDateRange', { defaultValue: 'Submitted Date Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              name="submitted_from"
              value={filters.submitted_from || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <Input
              type="date"
              name="submitted_to"
              value={filters.submitted_to || ''}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </FilterBarCard>
  );
}