import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, Building2, CalendarDays, UserCircle, FileSignature } from 'lucide-react'; // Removed MoreVertical, Eye, Edit, Trash2
import { format, parseISO, isValid } from 'date-fns';

const ContractCard = ({
  contract,
  providerName, // Pass provider name for display
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick, // For opening details or edit when not in selection mode
}) => {
  if (!contract || !contract.id) {
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
    name_en,
    name_he,
    contract_number,
    valid_from,
    valid_to,
    status,
    updated_date,
    // created_by, // Assuming you might want to display this
  } = contract;

  const getLocalizedName = () => {
    const lang = t('common.langCode', { defaultValue: 'en' });
    const localizedName = lang === 'he' ? (name_he || name_en) : (name_en || name_he);
    return localizedName || contract_number || t('contracts.unknownContract', {defaultValue: 'Unknown Contract'});
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
      onCardClick(contract);
    }
  };

  const formatDate = (dateString, fallback = t('common.notSet', {defaultValue: 'N/A'})) => {
    if (!dateString) return fallback;
    const date = parseISO(dateString);
    if (!isValid(date)) return t('common.invalidDate', {defaultValue: 'Invalid Date'});
    return format(date, 'PP', { locale: currentLocale });
  };

  const statusText = status ? t(`contractStatus.${status.toLowerCase()}`, {defaultValue: status}) : t('common.notSet');
  let statusBadgeVariant = 'secondary';
  if (status === 'active') statusBadgeVariant = 'success';
  else if (status === 'expired' || status === 'terminated') statusBadgeVariant = 'destructive_outline';
  else if (status === 'draft') statusBadgeVariant = 'outline';


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
            aria-label={t('bulkActions.selectItem', {item: getLocalizedName() || t('contracts.itemTitleSingular', {defaultValue: 'Contract'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <FileSignature className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={getLocalizedName()}>{getLocalizedName()}</span>
            </CardTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={statusBadgeVariant} className="text-xs">{statusText}</Badge>
             {contract_number && <Badge variant="outline" className="text-xs truncate" title={contract_number}>#{contract_number}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4 space-y-1.5">
        {providerName && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Building2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('contracts.fields.provider')}:&nbsp;</span>
                <span className="truncate" title={providerName}>{providerName}</span>
            </div>
        )}
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('contracts.fields.validFrom')}:&nbsp;</span>
            <span>{formatDate(valid_from)}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('contracts.fields.validTo')}:&nbsp;</span>
            <span>{formatDate(valid_to)}</span>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700/60 pt-2 pb-2 px-4">
        <div className="flex justify-between items-center w-full">
          <span>
            {t('common.lastUpdated')}: {updated_date && isValid(parseISO(updated_date)) ? format(parseISO(updated_date), 'PP', { locale: currentLocale }) : t('common.unknown')}
          </span>
          {/* {contract.created_by && (
            <div className="flex items-center" title={t('common.createdBy')}>
                <UserCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'} shrink-0`} />
                <span className="truncate text-xs">{contract.created_by.split('@')[0]}</span>
            </div>
          )} */}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ContractCard;