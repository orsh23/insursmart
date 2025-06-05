import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, FileText, AlertTriangle, Layers, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

export default function MedicalCodeCard({
  medicalCode,
  t,
  isRTL,
  language,
  currentLocale, // Expect this to be passed now
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick
}) {

  if (!medicalCode) {
    return (
      <Card className="border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
            <AlertTriangle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('errors.invalidDataTitle', { defaultValue: 'Invalid Medical Code Data' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('errors.medicalCodeDataMissing', { defaultValue: 'Medical code data could not be loaded or is incomplete.' })}
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
      onToggleSelection(medicalCode.id);
    } else {
      onCardClick(medicalCode); // Pass the whole object for dialog
    }
  };

  const handleCheckboxChange = (checked) => {
    onToggleSelection(medicalCode.id);
  };
  
  const description = language === 'he' 
    ? (medicalCode.description_he || medicalCode.description_en) 
    : (medicalCode.description_en || medicalCode.description_he);

  const lastUpdated = medicalCode.updated_date && isValid(parseISO(medicalCode.updated_date))
    ? formatDistanceToNow(parseISO(medicalCode.updated_date), { addSuffix: true, locale: currentLocale })
    : t('common.unknown', {defaultValue: 'Unknown'});

  const statusColor = medicalCode.status === 'active' 
    ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200' 
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300';

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
              aria-label={t('bulkActions.selectItem', {item: t('medicalCodes.itemTitleSingular')})}
              className="mt-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking checkbox
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {medicalCode.code}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={medicalCode.code_system}>
              <Layers className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom`} />
              {medicalCode.code_system}
            </p>
          </div>
           <Badge className={`${statusColor} flex-shrink-0 ml-auto`}>
              <Activity className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t(`status.${medicalCode.status}`, {defaultValue: medicalCode.status})}
            </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" title={description}>
          <FileText className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom text-gray-500 dark:text-gray-400`} />
          {description || t('common.noDescription', {defaultValue: 'No description available.'})}
        </p>
        
        {medicalCode.tags && medicalCode.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-600 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            {medicalCode.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="font-normal text-xs py-0.5 px-1.5">{tag}</Badge>
            ))}
            {medicalCode.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">+{medicalCode.tags.length - 3} more</span>
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