import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added Label import
import FilterBarCard from '@/components/common/FilterBarCard';
import SearchInput from '@/components/common/SearchInput';
import SimpleSelect from '@/components/common/SimpleSelect';

export default function LinkageFilterBar({ 
  onFilterChange, 
  currentFilters, 
  doctors, 
  providers,
  onSearch, // Removed onAddNew as it's handled by GlobalActionButton
  t, isRTL, language
}) {

  const providerOptions = useMemo(() => {
    const options = Array.isArray(providers) ? providers.map(p => ({ value: p.id, label: p.name })) : [];
    return [{ value: 'all', label: t('filters.allProviders', {defaultValue: 'All Providers'}) }, ...options];
  }, [providers, t]);

  const doctorOptions = useMemo(() => {
    const options = Array.isArray(doctors) ? doctors.map(d => ({ value: d.id, label: d.name })) : [];
    return [{ value: 'all', label: t('filters.allDoctors', {defaultValue: 'All Doctors'}) }, ...options];
  }, [doctors, t]);
  
  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.allStatuses', {defaultValue: 'All Statuses'}) },
    { value: 'active', label: t('status.active', {defaultValue: 'Active'}) },
    { value: 'inactive', label: t('status.inactive', {defaultValue: 'Inactive'}) },
    { value: 'pending_approval', label: t('status.pending_approval', {defaultValue: 'Pending Approval'}) },
  ], [t]);

  const handleResetFilters = () => {
    onFilterChange({ searchTerm: '', provider_id: 'all', doctor_id: 'all', affiliation_status: 'all' });
  };

  return (
    <FilterBarCard
      title={t('common.filters', {defaultValue: 'Filters'})}
      onResetFilters={handleResetFilters}
      t={t} isRTL={isRTL}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="linkageSearchTerm" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('common.search', {defaultValue: "Search"})}:
          </Label>
          <SearchInput
            id="linkageSearchTerm"
            value={currentFilters.searchTerm || ''}
            onChange={(e) => onFilterChange({ ...currentFilters, searchTerm: e.target.value })}
            placeholder={t('linkage.searchPlaceholder', {defaultValue: "Search by Doctor or Provider name..."})}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="linkageProviderFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('fields.provider', {defaultValue: "Provider"})}:
          </Label>
          <SimpleSelect
            id="linkageProviderFilter"
            value={currentFilters.provider_id || 'all'}
            onValueChange={(value) => onFilterChange({ ...currentFilters, provider_id: value })}
            options={providerOptions}
            placeholder={t('linkage.filters.selectProvider', {defaultValue: "Select Provider"})}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="linkageDoctorFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('fields.doctor', {defaultValue: "Doctor"})}:
          </Label>
          <SimpleSelect
            id="linkageDoctorFilter"
            value={currentFilters.doctor_id || 'all'}
            onValueChange={(value) => onFilterChange({ ...currentFilters, doctor_id: value })}
            options={doctorOptions}
            placeholder={t('linkage.filters.selectDoctor', {defaultValue: "Select Doctor"})}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="linkageStatusFilter" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('fields.affiliationStatus', {defaultValue: "Affiliation Status"})}:
          </Label>
          <SimpleSelect
            id="linkageStatusFilter"
            value={currentFilters.affiliation_status || 'all'}
            onValueChange={(value) => onFilterChange({ ...currentFilters, affiliation_status: value })}
            options={statusOptions}
            placeholder={t('linkage.filters.selectAffiliationStatus', {defaultValue: "Select Affiliation Status"})}
            className="mt-1 w-full"
          />
        </div>
      </div>
    </FilterBarCard>
  );
}