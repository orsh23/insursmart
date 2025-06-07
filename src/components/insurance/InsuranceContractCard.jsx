import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CalendarDays, Briefcase, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'; // Standard icons
import { format, parseISO, isValid } from 'date-fns';

const InsuranceContractCard = ({
  contract,
  t, isRTL, language, currentLocale,
  isSelectionModeActive,
  isSelected, // Prop from parent: boolean
  onToggleSelection, // Prop from parent: (id) => void
}) => {
  if (!contract || !contract.id) {
    return null;
  }

  const {
    id,
    contract_number,
    name_en,
    name_he,
    provider_id, // Assuming this is available, could be provider name if denormalized
    status,
    valid_from,
    valid_to,
    updated_date, // Assuming this exists
  } = contract;
  
  // Ensure isSelected is boolean and onToggleSelection is a function
  const safeIsSelected = typeof isSelected === 'boolean' ? isSelected : false;
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const displayName = language === 'he' ? (name_he || name_en) : (name_en || name_he);

  const handleCardClick = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button') || e.target.closest('[data-radix-dropdown-menu-trigger]')) {
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection(id);
    }
    // else if (onViewDetails) { // Example for future view details action
    //   onViewDetails(id);
    // }
  };

  const renderField = (IconComponent, labelKey, value, defaultValue = t('common.notSet', {defaultValue: 'N/A'})) => {
    const displayValue = (value == null || String(value).trim() === '') ? defaultValue : value;
    return (
      <div className="flex items-start text-xs text-gray-600 dark:text-gray-300">
        <IconComponent className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} mt-0.5 text-gray-400 dark:text-gray-500 shrink-0`} />
        <span className="font-medium text-gray-700 dark:text-gray-200">{t(labelKey, {defaultValue: labelKey.split('.').pop()})}:&nbsp;</span>
        <span className="truncate">{displayValue}</span>
      </div>
    );
  };

  const validFromText = valid_from && isValid(parseISO(valid_from))
    ? format(parseISO(valid_from), 'PP', { locale: currentLocale })
    : t('common.notSet', {defaultValue: 'N/A'});

  const validToText = valid_to && isValid(parseISO(valid_to))
    ? format(parseISO(valid_to), 'PP', { locale: currentLocale })
    : t('common.notSet', {defaultValue: 'N/A'});
    
  const lastUpdatedText = updated_date && isValid(parseISO(updated_date))
    ? format(parseISO(updated_date), 'PP', { locale: currentLocale })
    : t('common.unknownDate', {defaultValue: 'Unknown Date'});

  return (
    <Card
      className={`flex flex-col justify-between hover:shadow-lg transition-shadow group relative bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 ${isSelectionModeActive ? 'cursor-pointer' : ''} ${safeIsSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400' : ''}`}
      onClick={handleCardClick}
    >
      {isSelectionModeActive && (
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
          <Checkbox
            checked={safeIsSelected} // Use safeIsSelected
            onCheckedChange={() => safeOnToggleSelection(id)} // Use safeOnToggleSelection
            aria-label={t('bulkActions.selectItem', {item: displayName || contract_number})}
            className="h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <CardHeader className={`pb-2 ${isSelectionModeActive ? 'pt-8' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-500 dark:text-blue-400`} />
            <span className="truncate" title={displayName || contract_number}>
              {displayName || contract_number || t('contracts.unnamedContract', {defaultValue: 'Unnamed Contract'})}
            </span>
          </CardTitle>
          <Badge className={`text-xs shrink-0 ${
            status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 
            status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200' :
            status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-200' :
            'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'
          }`}>
            {t(`status.${status}`, {defaultValue: status})}
          </Badge>
        </div>
        {displayName && contract_number && <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{contract_number}</p>}
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-sm">
        {renderField(Briefcase, 'contracts.fields.providerId', provider_id)}
        {renderField(CalendarDays, 'contracts.fields.validFrom', validFromText)}
        {renderField(CalendarDays, 'contracts.fields.validTo', validToText)}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 pt-2 pb-3 flex justify-between items-center border-t dark:border-gray-600">
        <span>{t('common.lastUpdated', {defaultValue: 'Updated'})}: {lastUpdatedText}</span>
        {/* Dropdown for actions can be added here if needed for non-selection mode */}
      </CardFooter>
    </Card>
  );
};

export default InsuranceContractCard;