import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, DollarSign, Building2, Factory } from 'lucide-react'; // Removed MoreVertical, Eye, Edit, Trash2, Copy
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

const MaterialCard = ({
  material,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick, // For opening details or edit when not in selection mode
}) => {
  if (!material || !material.id) {
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
    unit_of_measure,
    base_price,
    currency,
    has_variants,
    is_active,
    manufacturers,
    suppliers,
    updated_date,
  } = material;

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
      onCardClick(material);
    }
  };

  const statusText = is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'});
  const statusBadgeVariant = is_active ? 'success' : 'secondary';

  const formatPrice = (price, curr = currency || 'ILS') => {
    if (!price && price !== 0) return t('common.notSet', {defaultValue: 'N/A'});
    return `${price.toLocaleString()} ${curr}`;
  };

  const renderField = (IconComponent, labelKey, value, defaultValue = t('common.notSet', {defaultValue: 'N/A'})) => {
    const displayValue = value || defaultValue;
    return (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1.5">
            <IconComponent className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t(labelKey, {defaultValue: labelKey.split('.').pop()})}:&nbsp;</span>
            <span className="truncate" title={String(displayValue)}>{String(displayValue)}</span>
        </div>
    );
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
            aria-label={t('bulkActions.selectItem', {item: getLocalizedName() || t('materials.itemTitleSingular', {defaultValue: 'Material'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <Package className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={getLocalizedName()}>{getLocalizedName()}</span>
            </CardTitle>
        </div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={statusBadgeVariant} className="text-xs">{statusText}</Badge>
            {has_variants && <Badge variant="outline" className="text-xs">{t('materials.hasVariants', {defaultValue: 'Has Variants'})}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4">
        {renderField(DollarSign, 'materials.fields.basePrice', formatPrice(base_price))}
        {unit_of_measure && renderField(Package, 'materials.fields.unitOfMeasure', t(`materialUnits.${unit_of_measure.toLowerCase()}`, {defaultValue: unit_of_measure}))}
        
        {Array.isArray(manufacturers) && manufacturers.length > 0 && (
          renderField(Factory, 'materials.fields.manufacturers', manufacturers.map(m => m.name).join(', ') || t('common.notSet'))
        )}
        {Array.isArray(suppliers) && suppliers.length > 0 && (
          renderField(Building2, 'materials.fields.suppliers', suppliers.map(s => s.name).join(', ') || t('common.notSet'))
        )}
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700/60 pt-2 pb-2 px-4">
        <div className="flex justify-between items-center w-full">
          <span>
            {t('common.lastUpdated')}: {updated_date && isValid(parseISO(updated_date)) ? formatDistanceToNow(parseISO(updated_date), { addSuffix: true, locale: currentLocale }) : t('common.unknown')}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MaterialCard;