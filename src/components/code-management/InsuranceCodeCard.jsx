
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, FileCode, Tag, FolderTree, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

const InsuranceCodeCard = ({
  code,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick,
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
    code: insuranceCodeValue, // Renamed 'code' to 'insuranceCodeValue' to avoid conflict
    name_en,
    name_he,
    category_path,
    requires_preauthorization,
    is_active,
    standard_hospitalization_days,
    updated_date,
  } = code; // Destructuring the 'code' prop

  const getLocalizedName = () => {
    const lang = t('common.langCode', { defaultValue: 'en' });
    return lang === 'he' ? (name_he || name_en) : (name_en || name_he);
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
      onCardClick(code); // Pass the original code object
    }
  };

  const activeStatusText = is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'});
  const activeStatusBadgeVariant = is_active ? 'success' : 'secondary';
  
  const preAuthText = requires_preauthorization ? t('insuranceCodes.requiresPreAuth', {defaultValue: 'Pre-Auth Required'}) : t('insuranceCodes.noPreAuth', {defaultValue: 'No Pre-Auth'});
  const preAuthBadgeVariant = requires_preauthorization ? 'warning' : 'info_outline';

  const formatUpdatedDate = (dateStr) => {
    if (!dateStr) return t('common.unknownDate', { defaultValue: 'Unknown' });
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return t('common.invalidDate', { defaultValue: 'Invalid Date' });
    }
  };

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
            aria-label={t('bulkActions.selectItem', {item: insuranceCodeValue || t('insuranceCodes.itemTitleSingular', {defaultValue: 'Insurance Code'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <Shield className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={insuranceCodeValue}>{insuranceCodeValue || t('common.unknown')}</span>
            </CardTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={activeStatusBadgeVariant} className="text-xs">{activeStatusText}</Badge>
            <Badge variant={preAuthBadgeVariant} className="text-xs flex items-center gap-1">
                {requires_preauthorization ? (
                    <AlertTriangle className="h-3 w-3" />
                ) : (
                    <CheckCircle className="h-3 w-3" />
                )}
                {preAuthText}
            </Badge>
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4 space-y-1.5">
        <div className="flex items-start text-xs text-gray-600 dark:text-gray-400">
            <FileCode className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0 mt-0.5`} />
            <p className="line-clamp-2" title={getLocalizedName() || t('common.noName')}>{getLocalizedName() || t('common.noName')}</p>
        </div>
        
        {category_path && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <FolderTree className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
                <span className="truncate" title={category_path}>{category_path}</span>
            </div>
        )}
        
        {standard_hospitalization_days && standard_hospitalization_days > 0 && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Badge variant="info_outline" className="text-xs">
                    {standard_hospitalization_days} {t('insuranceCodes.hospitalizationDays', {defaultValue: 'days hospitalization'})}
                </Badge>
            </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 pt-2 pb-3 px-4">
        <span>{t('common.updated', { defaultValue: 'Updated' })} {formatUpdatedDate(updated_date)}</span>
      </CardFooter>
    </Card>
  );
};

export default InsuranceCodeCard;
