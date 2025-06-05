import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, Building2, User, CalendarDays, CheckCircle2, FileText, Receipt, DollarSign } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';
import FilterTitle from '@/components/common/FilterTitle';

export default function ClaimFilterBar({
  filters,
  onFilterChange,
  onReset,
  providerOptions = [],
  insuredOptions = [],
  doctorOptions = []
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const statusOptions = [
    { value: "draft", label: t('requestManagement.claimStatus.draft', { defaultValue: "Draft" }) },
    { value: "submitted", label: t('requestManagement.claimStatus.submitted', { defaultValue: "Submitted" }) },
    { value: "in_review", label: t('requestManagement.claimStatus.inReview', { defaultValue: "In Review" }) },
    { value: "pending_information", label: t('requestManagement.claimStatus.pendingInfo', { defaultValue: "Pending Information" }) },
    { value: "approved_for_payment", label: t('requestManagement.claimStatus.approvedForPayment', { defaultValue: "Approved for Payment" }) },
    { value: "partially_paid", label: t('requestManagement.claimStatus.partiallyPaid', { defaultValue: "Partially Paid" }) },
    { value: "paid_in_full", label: t('requestManagement.claimStatus.paidInFull', { defaultValue: "Paid in Full" }) },
    { value: "rejected", label: t('requestManagement.claimStatus.rejected', { defaultValue: "Rejected" }) },
    { value: "denied", label: t('requestManagement.claimStatus.denied', { defaultValue: "Denied" }) }
  ];

  return (
    <FilterBarCard>
      <FilterTitle>{t('requestManagement.claims.filtersTitle', { defaultValue: 'Claims Filters' })}</FilterTitle>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={t('requestManagement.claims.searchPlaceholder', { defaultValue: "Search claims..." })}
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
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
        
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <Receipt className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.invoiceNumberLabel', { defaultValue: 'Invoice Number' })}
          </label>
          <Input
            name="invoice_number"
            value={filters.invoice_number || ''}
            onChange={handleInputChange}
            placeholder={t('requestManagement.invoiceNumberPlaceholder', { defaultValue: "Filter by invoice #..." })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.rfcIdLabel', { defaultValue: 'RFC ID' })}
          </label>
          <Input
            name="rfc_id"
            value={filters.rfc_id || ''}
            onChange={handleInputChange}
            placeholder={t('requestManagement.rfcIdPlaceholder', { defaultValue: "Filter by RFC ID..." })}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.serviceDateRange', { defaultValue: 'Service Date Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              name="service_date_from_start"
              value={filters.service_date_from_start || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <Input
              type="date"
              name="service_date_from_end"
              value={filters.service_date_from_end || ''}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.invoiceDateRange', { defaultValue: 'Invoice Date Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              name="invoice_date_start"
              value={filters.invoice_date_start || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <Input
              type="date"
              name="invoice_date_end"
              value={filters.invoice_date_end || ''}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium flex items-center mb-1">
            <DollarSign className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('requestManagement.amountRange', { defaultValue: 'Amount Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              name="min_amount"
              value={filters.min_amount || ''}
              onChange={handleInputChange}
              placeholder={t('common.min', { defaultValue: 'Min' })}
              className="w-full"
            />
            <Input
              type="number"
              name="max_amount"
              value={filters.max_amount || ''}
              onChange={handleInputChange}
              placeholder={t('common.max', { defaultValue: 'Max' })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </FilterBarCard>
  );
}