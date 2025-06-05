import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, FileText, Building, Code, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageHook } from '@/components/useLanguageHook';
import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

const TariffCard = ({
  tariff,
  contractInfo, // { contract_number, provider_name }
  insuranceCodeInfo, // { code, name }
  onViewDetails,
  currentLocale,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
}) => {
  const { t, language, isRTL } = useLanguageHook();

  if (!tariff) {
    return null;
  }

  const handleCardClick = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button')) {
      return;
    }
    if (isSelectionModeActive) {
      onToggleSelection(tariff.id);
    } else {
      onViewDetails(tariff.id);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return t('common.notSet', {defaultValue: 'N/A'});
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { 
      style: 'currency', 
      currency: tariff.currency || 'ILS',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const finalizationTypeLabel = tariff.finalization_type ? t(`finalizationType.${tariff.finalization_type}`, {defaultValue: tariff.finalization_type}) : t('common.notSet');
  const finalizationVariant = {
    RFC: 'outline',
    Claim: 'secondary',
    Hybrid: 'default',
  }[tariff.finalization_type] || 'default';

  const lastUpdated = tariff.updated_date && isValid(parseISO(tariff.updated_date))
    ? formatDistanceToNow(parseISO(tariff.updated_date), { addSuffix: true, locale: currentLocale })
    : t('common.unknown', {defaultValue: 'Unknown'});

  const tariffDisplayName = `${contractInfo?.contract_number || t('common.unknown')} - ${insuranceCodeInfo?.code || t('common.unknown')}`;

  return (
    <Card
      key={tariff.id}
      className={`flex flex-col justify-between hover:shadow-lg transition-shadow group relative bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400' : ''} ${isSelectionModeActive ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {isSelectionModeActive && (
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(tariff.id)}
            aria-label={t('bulkActions.selectItem', { item: tariffDisplayName })}
            className="h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <CardHeader className={`pb-3 ${isSelectionModeActive ? 'pt-8' : ''}`}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <DollarSign className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-green-500 dark:text-green-400`} />
            <span className="truncate" title={tariffDisplayName}>{tariffDisplayName}</span>
          </CardTitle>
          <Badge variant={finalizationVariant} className="text-xs shrink-0">{finalizationTypeLabel}</Badge>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
          {t('fields.basePrice', {defaultValue: 'Base Price'})}: {formatCurrency(tariff.base_price)}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <FileText className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500 dark:text-gray-400 shrink-0`} />
          <span className="font-medium">{t('fields.contract', {defaultValue: 'Contract'})}:</span>
          <span className={`${isRTL ? 'mr-1.5' : 'ml-1.5'} truncate`} title={contractInfo?.contract_number || t('common.unknown')}>{contractInfo?.contract_number || t('common.unknown')}</span>
        </div>
        <div className="flex items-center">
          <Building className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500 dark:text-gray-400 shrink-0`} />
          <span className="font-medium">{t('fields.provider', {defaultValue: 'Provider'})}:</span>
          <span className={`${isRTL ? 'mr-1.5' : 'ml-1.5'} truncate`} title={contractInfo?.provider_name || t('common.unknown')}>{contractInfo?.provider_name || t('common.unknown')}</span>
        </div>
        <div className="flex items-center">
          <Code className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-500 dark:text-gray-400 shrink-0`} />
          <span className="font-medium">{t('fields.insuranceCode', {defaultValue: 'Code'})}:</span>
          <span className={`${isRTL ? 'mr-1.5' : 'ml-1.5'} truncate`} title={insuranceCodeInfo?.code || t('common.unknown')}>{insuranceCodeInfo?.code || t('common.unknown')}</span>
        </div>
        {insuranceCodeInfo?.name && (
          <div className="flex items-center text-xs pt-1">
            <Info className={`h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="text-gray-500 dark:text-gray-400 truncate" title={insuranceCodeInfo.name}>{insuranceCodeInfo.name}</span>
          </div>
        )}
        {tariff.composition && tariff.composition.length > 0 && (
          <div className="flex items-center text-xs pt-1">
            <Info className={`h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="text-gray-500 dark:text-gray-400">{t('fields.components', {defaultValue: 'Components'})}: {tariff.composition.length}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <span className="text-2xs text-gray-500 dark:text-gray-400">
         {t('common.updated')}: {lastUpdated}
        </span>
        {!isSelectionModeActive && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewDetails(tariff.id); }} title={t('buttons.edit', {defaultValue: 'Edit Tariff'})} className="h-7 w-7 text-gray-500 hover:text-blue-600">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TariffCard;