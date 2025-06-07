import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, Link2, ArrowDownUp, CheckCircle, FileCode2, Gauge } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function CrosswalkFilters({
  filters,
  onFilterChange,
  onReset
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const nativeSelectClassName = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

  const codeTypes = ["ICD9", "ICD10", "CPT", "HCPCS", "Internal"];
  const mappingTypes = ["Single", "Alternative", "Combination", "No Map"];
  const accuracyTypes = ["Exact", "Approximate", "Partial"];

  return (
    <Card className="shadow-sm dark:border-gray-700 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative w-full md:flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleInputChange}
              placeholder={t("crosswalks.searchPlaceholder", { defaultValue: "Search by code..." })}
              className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
            />
          </div>
          <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
            <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.resetFilters')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="anchor-type" className="text-sm font-medium flex items-center mb-1">
              <FileCode2 className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('crosswalks.anchorType')}
            </Label>
            <select
              id="anchor-type"
              name="anchorType"
              value={filters.anchorType}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="all">{t('crosswalks.allAnchorTypes')}</option>
              {codeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="target-type" className="text-sm font-medium flex items-center mb-1">
              <Link2 className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('crosswalks.targetType')}
            </Label>
            <select
              id="target-type"
              name="targetType"
              value={filters.targetType}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="all">{t('crosswalks.allTargetTypes')}</option>
              {codeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="mapping-type" className="text-sm font-medium flex items-center mb-1">
              <Link2 className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('crosswalks.mappingType')}
            </Label>
            <select
              id="mapping-type"
              name="mappingType"
              value={filters.mappingType}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="all">{t('crosswalks.allMappingTypes')}</option>
              {mappingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="accuracy" className="text-sm font-medium flex items-center mb-1">
              <Gauge className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('crosswalks.accuracy')}
            </Label>
            <select
              id="accuracy"
              name="accuracy"
              value={filters.accuracy}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="all">{t('crosswalks.allAccuracyLevels')}</option>
              {accuracyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium flex items-center mb-1">
              <CheckCircle className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('common.status')}
            </Label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="all">{t('common.allStatuses')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>

          <div>
            <Label htmlFor="sort" className="text-sm font-medium flex items-center mb-1">
              <ArrowDownUp className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500`} />
              {t('common.sortBy')}
            </Label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleInputChange}
              className={nativeSelectClassName}
            >
              <option value="anchorCode">{t('crosswalks.sortByAnchorCode')}</option>
              <option value="mappingType">{t('crosswalks.sortByMappingType')}</option>
              <option value="accuracy">{t('crosswalks.sortByAccuracy')}</option>
              <option value="updated">{t('common.sortByLastUpdated')}</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}