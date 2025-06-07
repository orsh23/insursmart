import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Removed Button import as it's not directly used for actions here
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, DollarSign, CalendarDays, Info, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

// Helper function to format currency (assuming ILS for now)
const formatCurrency = (amount, language, t) => {
  if (amount == null || isNaN(Number(amount))) return t('common.notSet', {defaultValue: 'N/A'});
  return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const PolicyCoverageCard = ({
  coverage,
  t, isRTL, language, currentLocale,
  isSelectionModeActive,
  isSelected, // Prop from parent
  onToggleSelection, // Prop from parent
}) => {
  if (!coverage || !coverage.id) {
    return null; 
  }

  const {
    id,
    policy_id,
    allows_doctor_fee,
    allows_implantables,
    annual_deductible,
    copay_percentage,
    out_of_pocket_max,
    hospital_days_limit,
    updated_date, 
    is_active, // Assuming this field exists
  } = coverage;
  
  // Ensure isSelected is boolean and onToggleSelection is a function
  const safeIsSelected = typeof isSelected === 'boolean' ? isSelected : false;
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const handleCardClick = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button') || e.target.closest('[data-radix-dropdown-menu-trigger]')) {
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection(id);
    } 
  };

  const renderField = (IconComponent, labelKey, value, unit = '', defaultValue = t('common.notSet', {defaultValue: 'N/A'})) => {
    let displayValue = value;
    if (typeof value === 'boolean') {
      displayValue = value ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'});
    } else if (value == null || String(value).trim() === '') {
      displayValue = defaultValue;
    } else {
      displayValue = `${value}${unit}`;
    }

    return (
      <div className="flex items-start text-xs text-gray-600 dark:text-gray-300">
        <IconComponent className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} mt-0.5 text-gray-400 dark:text-gray-500 shrink-0`} />
        <span className="font-medium text-gray-700 dark:text-gray-200">{t(labelKey, {defaultValue: labelKey.split('.').pop()})}:&nbsp;</span>
        <span className="truncate">{displayValue}</span>
      </div>
    );
  };

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
            aria-label={t('bulkActions.selectItem', {item: t('policyCoverage.itemTitle', {id: policy_id || id})})}
            className="h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <CardHeader className={`pb-2 ${isSelectionModeActive ? 'pt-8' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <ShieldCheck className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-500 dark:text-blue-400`} />
            <span className="truncate" title={t('policyCoverage.cardTitle', {id: policy_id || id})}>
                 {t('policyCoverage.cardTitle', {id: policy_id || id})}
            </span>
          </CardTitle>
          <Badge className={`text-xs shrink-0 ${is_active === true ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
            {is_active === true ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-sm">
        {renderField(Info, 'policyCoverage.allowsDoctorFee', allows_doctor_fee)}
        {renderField(Info, 'policyCoverage.allowsImplantables', allows_implantables)}
        {renderField(DollarSign, 'policyCoverage.annualDeductible', annual_deductible != null ? formatCurrency(annual_deductible, language, t) : undefined)}
        {renderField(DollarSign, 'policyCoverage.copayPercentage', copay_percentage, '%')}
        {renderField(DollarSign, 'policyCoverage.outOfPocketMax', out_of_pocket_max != null ? formatCurrency(out_of_pocket_max, language, t) : undefined)}
        {renderField(CalendarDays, 'policyCoverage.hospitalDaysLimit', hospital_days_limit, ` ${t('common.days', {defaultValue: 'days'})}`)}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 pt-2 pb-3 flex justify-between items-center border-t dark:border-gray-600">
        <span>{t('common.lastUpdated', {defaultValue: 'Updated'})}: {lastUpdatedText}</span>
      </CardFooter>
    </Card>
  );
};

export default PolicyCoverageCard;