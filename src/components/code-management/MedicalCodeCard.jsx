import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, FileText, AlertTriangle, Layers, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

export default function MedicalCodeCard({
  codeItem, // Changed from medicalCode to codeItem to match usage
  t,
  isRTL,
  language,
  currentLocale, // Expect this to be passed now
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onEdit // Changed from onCardClick to onEdit to match usage
}) {

  if (!codeItem) {
    return (
      <Card className="border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
            <AlertTriangle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t ? t('errors.invalidDataTitle', { defaultValue: 'Invalid Medical Code Data' }) : 'Invalid Medical Code Data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {t ? t('errors.medicalCodeDataMissing', { defaultValue: 'Medical code data could not be loaded or is incomplete.' }) : 'Medical code data could not be loaded or is incomplete.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCardInteraction = (e) => {
    if (e.target.closest('[role="checkbox"]') || e.target.type === 'checkbox') {
      return;
    }
    if (isSelectionModeActive && onToggleSelection) {
      onToggleSelection(codeItem.id);
    } else if (onEdit) {
      onEdit(codeItem); // Pass the whole object for dialog
    }
  };

  const handleCheckboxChange = (checked) => {
    if (onToggleSelection) {
      onToggleSelection(codeItem.id);
    }
  };
  
  const description = language === 'he' 
    ? (codeItem.description_he || codeItem.description_en) 
    : (codeItem.description_en || codeItem.description_he);

  const lastUpdated = codeItem.updated_date && isValid(parseISO(codeItem.updated_date))
    ? formatDistanceToNow(parseISO(codeItem.updated_date), { addSuffix: true, locale: currentLocale })
    : (t ? t('common.unknown', {defaultValue: 'Unknown'}) : 'Unknown');

  const statusColor = codeItem.status === 'active' 
    ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200' 
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300';

  // Fix tags handling - ensure it's always an array
  const safeTags = Array.isArray(codeItem.tags) ? codeItem.tags : [];
  const hasValidTags = safeTags.length > 0 && safeTags.some(tag => tag && typeof tag === 'string' && tag.trim() !== '');

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
              aria-label={t ? t('bulkActions.selectItem', {item: 'Medical Code'}) : 'Select Medical Code'}
              className="mt-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking checkbox
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {codeItem.code}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={codeItem.code_system}>
              <Layers className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom`} />
              {codeItem.code_system}
            </p>
          </div>
           <Badge className={`${statusColor} flex-shrink-0 ml-auto`}>
              <Activity className={`inline-block h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t ? t(`status.${codeItem.status}`, {defaultValue: codeItem.status}) : codeItem.status}
            </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" title={description}>
          <FileText className={`inline-block h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'} align-text-bottom text-gray-500 dark:text-gray-400`} />
          {description || (t ? t('common.noDescription', {defaultValue: 'No description available.'}) : 'No description available.')}
        </p>
        
        {hasValidTags && (
          <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-600 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            {safeTags
              .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
              .slice(0, 3)
              .map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="outline" className="font-normal text-xs py-0.5 px-1.5">
                  {tag}
                </Badge>
              ))
            }
            {safeTags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '').length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{safeTags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '').length - 3} more
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            {t ? t('common.lastUpdated', {defaultValue: 'Last Updated'}) : 'Last Updated'}: {lastUpdated}
        </p>
      </CardContent>
    </Card>
  );
}