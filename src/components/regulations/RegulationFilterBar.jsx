import React from 'react';
import { useLanguageHook } from "@/components/useLanguageHook";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

export default function RegulationFilterBar({ filters, onFilterChange, onReset, uniqueTags = [] }) {
  const { t, isRTL } = useLanguageHook();
  
  const hasActiveFilters = () => {
    return filters.searchTerm || 
           filters.regulationType !== "all" || 
           filters.status !== "all" || 
           filters.period !== "all" ||
           filters.tag !== "all";
  };
  
  const regulationTypes = [
    { value: 'Insurance', label: t('regulations.type.insurance', {defaultValue: 'Insurance'}) },
    { value: 'Healthcare', label: t('regulations.type.healthcare', {defaultValue: 'Healthcare'}) },
    { value: 'Internal', label: t('regulations.type.internal', {defaultValue: 'Internal'}) },
    { value: 'Legal', label: t('regulations.type.legal', {defaultValue: 'Legal'}) },
    { value: 'Other', label: t('regulations.type.other', {defaultValue: 'Other'}) }
  ];
  
  const periods = [
    { value: 'all', label: t('regulations.period.all', {defaultValue: 'All'}) },
    { value: 'current', label: t('regulations.period.current', {defaultValue: 'Currently Active'}) },
    { value: 'upcoming', label: t('regulations.period.upcoming', {defaultValue: 'Upcoming'}) },
    { value: 'past', label: t('regulations.period.past', {defaultValue: 'Past'}) },
    { value: 'last30days', label: t('regulations.period.last30days', {defaultValue: 'Last 30 Days'}) },
    { value: 'last90days', label: t('regulations.period.last90days', {defaultValue: 'Last 90 Days'}) }
  ];
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-lg font-medium">{t('common.filters', {defaultValue: 'Filters'})}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.search', {defaultValue: 'Search'})}
            </label>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input
                placeholder={t('regulations.searchPlaceholder', {defaultValue: 'Search regulations...'})}
                value={filters.searchTerm}
                onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
          </div>
          
          {/* Regulation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('regulations.typeLabel', {defaultValue: 'Regulation Type'})}
            </label>
            <Select 
              value={filters.regulationType}
              onValueChange={(value) => onFilterChange('regulationType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.all', {defaultValue: 'All Types'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', {defaultValue: 'All Types'})}</SelectItem>
                {regulationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('regulations.periodLabel', {defaultValue: 'Period'})}
            </label>
            <Select 
              value={filters.period}
              onValueChange={(value) => onFilterChange('period', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('regulations.period.all', {defaultValue: 'All Periods'})} />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.status', {defaultValue: 'Status'})}
            </label>
            <Select 
              value={filters.status}
              onValueChange={(value) => onFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.all', {defaultValue: 'All'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', {defaultValue: 'All'})}</SelectItem>
                <SelectItem value="active">{t('status.active', {defaultValue: 'Active'})}</SelectItem>
                <SelectItem value="inactive">{t('status.inactive', {defaultValue: 'Inactive'})}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('regulations.tagLabel', {defaultValue: 'Tag'})}
            </label>
            <Select 
              value={filters.tag}
              onValueChange={(value) => onFilterChange('tag', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.all', {defaultValue: 'All Tags'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', {defaultValue: 'All Tags'})}</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {hasActiveFilters() && (
          <div className="flex justify-end mt-2">
            <Button variant="ghost" onClick={onReset} className="h-8 px-2 text-sm">
              <X className="w-4 h-4 mr-1" />
              {t('common.clearFilters', {defaultValue: 'Clear Filters'})}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}