import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, FileCode2, Tag, Link2, Power, Info, FolderTree } from 'lucide-react'; // Added FolderTree
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

const ProviderCodeCard = ({
  code,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick,
  providerName, // Added to display provider name
}) => {
  if (!code || !code.id) {
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
    code_number,
    description_en,
    description_he,
    category_path, // Assuming this exists
    provider_id, // Will be used to fetch/display provider name
    // provider_name, // Denormalized provider_name is not assumed; pass it via prop
    status, // Assuming 'status' is a boolean (true for active, false for inactive)
    tags,
    updated_date,
  } = code;

  const getLocalizedDescription = () => {
    const lang = t('common.langCode', { defaultValue: 'en' });
    return lang === 'he' ? (description_he || description_en) : (description_en || description_he);
  };

  const safeIsSelected = Boolean(isSelected);
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const handleCardClickInternal = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button')) {
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection();
    } else if (onCardClick) {
      onCardClick(code);
    }
  };
  
  // Assuming `status` is a boolean in ProviderInternalCode entity.
  // If it's a string like "active"/"inactive", adjust accordingly.
  const isActive = status === true || status === 'active'; // Handle boolean or string "active"
  const activeStatusText = isActive ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'});
  const activeStatusBadgeVariant = isActive ? 'success' : 'secondary';


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
            aria-label={t('bulkActions.selectItem', {item: code_number || t('providerCodes.itemTitleSingular', {defaultValue: 'Provider Code'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <FileCode2 className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={code_number}>{code_number || t('common.unknown')}</span>
            </CardTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={activeStatusBadgeVariant} className="text-xs">{activeStatusText}</Badge>
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4 space-y-1.5">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Building className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
             <span className="font-medium text-gray-700 dark:text-gray-300">{t('providerCodes.fields.providerName')}:&nbsp;</span>
            <span className="truncate" title={providerName || t('common.unknown')}>{providerName || t('common.notSet')}</span>
        </div>
        <div className="flex items-start text-xs text-gray-600 dark:text-gray-400">
            <Info className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0 mt-0.5`} />
            <p className="line-clamp-2" title={getLocalizedDescription() || t('common.noDescription')}>{getLocalizedDescription() || t('common.noDescription')}</p>
        </div>
         {category_path && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <FolderTree className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
                <span className="truncate" title={category_path}>{category_path}</span>
            </div>
        )}
        {Array.isArray(tags) && tags.length > 0 && (
            <div className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                <Tag className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0 mt-0.5`} />
                <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tag, index) => (
                        <Badge key={`${id}-tag-${index}`} variant="secondary_outline" className="text-xs px-1.5 py-0.5">
                            {tag}
                        </Badge>
                    ))}
                    {tags.length > 3 && (
                        <Badge variant="secondary_outline" className="text-xs px-1.5 py-0.5">
                            +{tags.length - 3} {t('common.more', {defaultValue: 'more'})}
                        </Badge>
                    )}
                </div>
            </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 pt-2 pb-3 px-4">
        {updated_date && isValid(parseISO(updated_date)) ? (
          <span>
            {t('common.updated')}{' '}
            {formatDistanceToNow(parseISO(updated_date), { addSuffix: true, locale: currentLocale })}
          </span>
        ) : (
          <span>{t('common.updated')}: {t('common.unknown')}</span>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProviderCodeCard;