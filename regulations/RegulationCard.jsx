import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, CalendarDays, FileText, Tag } from 'lucide-react'; // Removed MoreVertical, Eye, Edit, Trash2
import { format, parseISO, isValid } from 'date-fns';

const RegulationCard = ({
  regulation,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick, // For opening details or edit when not in selection mode
}) => {
  if (!regulation || !regulation.id) {
    return (
      <Card className="animate-pulse bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </Card>
    );
  }

  const {
    id,
    title_en,
    title_he,
    regulation_type,
    effective_date,
    is_active,
    tags,
    updated_date,
    document_url,
  } = regulation;

  const getLocalizedTitle = () => {
    const lang = t('common.langCode', { defaultValue: 'en' });
    return lang === 'he' ? (title_he || title_en) : (title_en || title_he);
  };

  const safeIsSelected = Boolean(isSelected);
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const handleCardClickInternal = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button') || e.target.closest('a[href]')) { // Also ignore clicks on links
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection();
    } else if (onCardClick) {
      onCardClick(regulation);
    }
  };

  const formatDate = (dateString, fallback = t('common.notSet', {defaultValue: 'N/A'})) => {
    if (!dateString) return fallback;
    const date = parseISO(dateString);
    if (!isValid(date)) return t('common.invalidDate', {defaultValue: 'Invalid Date'});
    return format(date, 'PP', { locale: currentLocale });
  };

  const statusText = is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'});
  const statusBadgeVariant = is_active ? 'success' : 'secondary';
  
  const regulationTypeDisplay = regulation_type ? t(`regulationTypes.${regulation_type.toLowerCase()}`, {defaultValue: regulation_type}) : t('common.notSet');


  return (
    <Card
      className={`flex flex-col justify-between hover:shadow-lg transition-shadow duration-150 group relative bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700/60 ${isSelectionModeActive || onCardClick ? 'cursor-pointer' : ''} ${safeIsSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400 shadow-md' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
      onClick={handleCardClickInternal}
    >
      {isSelectionModeActive && (
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
          <Checkbox
            checked={safeIsSelected}
            onCheckedChange={safeOnToggleSelection}
            aria-label={t('bulkActions.selectItem', {item: getLocalizedTitle() || t('regulations.itemTitleSingular', {defaultValue: 'Regulation'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <ListChecks className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={getLocalizedTitle()}>{getLocalizedTitle()}</span>
            </CardTitle>
        </div>
         <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={statusBadgeVariant} className="text-xs">{statusText}</Badge>
            <Badge variant="outline" className="text-xs">{regulationTypeDisplay}</Badge>
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4 space-y-1.5">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('regulations.fields.effectiveDate')}:&nbsp;</span>
            <span>{formatDate(effective_date)}</span>
        </div>

        {document_url && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <FileText className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <a 
              href={document_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 truncate"
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking the link
              title={document_url}
            >
              {t('regulations.viewDocument', {defaultValue: 'View Document'})}
            </a>
          </div>
        )}

        {Array.isArray(tags) && tags.length > 0 && (
            <div className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                <Tag className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0 mt-0.5`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('regulations.fields.tags')}:&nbsp;</span>
                <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                    ))}
                    {tags.length > 3 && <Badge variant="secondary" className="text-xs px-1.5 py-0.5">+{tags.length - 3}</Badge>}
                </div>
            </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700/60 pt-2 pb-2 px-4">
        <div className="flex justify-between items-center w-full">
          <span>
            {t('common.lastUpdated')}: {updated_date && isValid(parseISO(updated_date)) ? format(parseISO(updated_date), 'PP', { locale: currentLocale }) : t('common.unknown')}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegulationCard;