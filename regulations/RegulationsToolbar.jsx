import React, { useState } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FilterX } from 'lucide-react';
import useRegulationFilters from './hooks/useRegulationFilters';

export default function RegulationsToolbar({ onAdd }) {
  const { t } = useLanguageHook();
  const { 
    searchTerm, 
    setSearchTerm,
    filterType,
    setFilterType,
    filterActive,
    setFilterActive,
    clearFilters 
  } = useRegulationFilters();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('regulations.searchPlaceholder')}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('regulations.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="Insurance">{t('regulations.type.insurance')}</SelectItem>
              <SelectItem value="Healthcare">{t('regulations.type.healthcare')}</SelectItem>
              <SelectItem value="Internal">{t('regulations.type.internal')}</SelectItem>
              <SelectItem value="Legal">{t('regulations.type.legal')}</SelectItem>
              <SelectItem value="Other">{t('regulations.type.other')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('regulations.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters} className="flex items-center">
            <FilterX className="h-4 w-4 mr-2" />
            {t('common.clearFilters')}
          </Button>

          <Button onClick={onAdd} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('regulations.addNew')}
          </Button>
        </div>
      </div>
    </div>
  );
}