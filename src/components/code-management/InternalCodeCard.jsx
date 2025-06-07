
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, FileText, AlertTriangle, Code2, Activity, DollarSign, FolderTree } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

export default function InternalCodeCard({
  internalCode,
  t,
  isRTL,
  language,
  currentLocale,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick
}) {

  if (!internalCode) {
    return (
      <Card className="border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
            <AlertTriangle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('errors.invalidDataTitle', { defaultValue: 'Invalid Internal Code Data' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('errors.internalCodeDataMissing', { defaultValue: 'Internal code data could not be loaded or is incomplete.' })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCardInteraction = (e) => {
    if (e.target.closest('[role="checkbox"]') || e.target.type === 'checkbox') {
      return;
    }
    if (isSelectionModeActive) {
      onToggleSelection(internalCode.id);
    } else {
      onCardClick(internalCode);
    }
  };

  const handleCheckboxChange = (checked) => {
    onToggleSelection(internalCode.id);
  };
  
  const description = language === 'he' 
    ? (internalCode.description_he || internalCode.description_en) 
    : (internalCode.description_en || internalCode.description_he);

  const lastUpdated = internalCode.updated_date && isValid(parseISO(internalCode.updated_date))
    ? formatDistanceToNow(parseISO(internalCode.updated_date), { addSuffix: true, locale: currentLocale })
    : t('common.unknown', {defaultValue: 'Unknown'});

  const activeStatusColor = internalCode.is_active 
    ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200' 
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300';
  
  const billableStatusColor = internalCode.is_billable
    ? 'bg-sky-100 text-sky-800 dark:bg-sky-700/30 dark:text-sky-200'
    : 'bg-orange-100 text-orange-800 dark:bg-orange-700/30 dark:text-orange-200';


  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        isSelectionModeActive 
          ? `cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}` 
          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={handleCardInteraction}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {isSelectionModeActive && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              aria-label={t('bulkActions.selectItem', {item: t('internalCodes.itemTitleSingular')})}
              className="mt-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()} 
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {internalCode.code_number}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={internalCode.category_path}>
              <FolderTree className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom`} />
              {internalCode.category_path || t('common.notSet', {defaultValue: 'N/A'})}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-auto">
             <Badge className={`${activeStatusColor}`}>
                <Activity className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {internalCode.is_active ? t('status.active') : t('status.inactive')}
              </Badge>
              <Badge className={`${billableStatusColor}`}>
                <DollarSign className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {internalCode.is_billable ? t('internalCodes.fields.isBillableShort.true') : t('internalCodes.fields.isBillableShort.false')}
              </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" title={description}>
          <FileText className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom text-gray-500 dark:text-gray-400`} />
          {description || t('common.noDescription', {defaultValue: 'No description available.'})}
        </p>
        
        {Array.isArray(internalCode.tags) && internalCode.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-600 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            {internalCode.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="font-normal text-xs py-0.5 px-1.5">{tag}</Badge>
            ))}
            {internalCode.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">+{internalCode.tags.length - 3} more</span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            {t('common.lastUpdated', {defaultValue: 'Last Updated'})}: {lastUpdated}
        </p>
      </CardContent>
    </Card>
  );
}
