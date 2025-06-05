import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Building2, UserCircle, CalendarDays, DollarSign, AlertCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

const RFCCard = ({
  rfc,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onCardClick,
}) => {
  if (!rfc || !rfc.id) {
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
    provider_name,
    doctor_name,
    insured_name,
    policy_number,
    procedure_date,
    status,
    approved_amount,
    currency,
    procedure_codes,
    diagnosis_codes,
    submitted_at,
    updated_date,
  } = rfc;

  const safeIsSelected = Boolean(isSelected);
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const handleCardClickInternal = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button')) {
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection();
    } else if (onCardClick) {
      onCardClick(rfc);
    }
  };

  const formatDate = (dateString, fallback = t('common.notSet', {defaultValue: 'N/A'})) => {
    if (!dateString) return fallback;
    const date = parseISO(dateString);
    if (!isValid(date)) return t('common.invalidDate', {defaultValue: 'Invalid Date'});
    return format(date, 'PP', { locale: currentLocale });
  };

  const formatCurrency = (amount, curr = currency || 'ILS') => {
    if (!amount && amount !== 0) return t('common.notSet', {defaultValue: 'N/A'});
    return `${amount.toLocaleString()} ${curr}`;
  };

  const statusText = status ? t(`rfcStatus.${status.toLowerCase()}`, {defaultValue: status}) : t('common.notSet');
  let statusBadgeVariant = 'secondary';
  if (status === 'approved') statusBadgeVariant = 'success';
  else if (status === 'rejected') statusBadgeVariant = 'destructive';
  else if (status === 'in_review') statusBadgeVariant = 'warning';
  else if (status === 'submitted') statusBadgeVariant = 'info';
  else if (status === 'draft') statusBadgeVariant = 'outline';

  const displayTitle = `RFC #${id?.slice(-6) || 'N/A'}` + (insured_name ? ` - ${insured_name}` : '');
  const procedureCodesDisplay = Array.isArray(procedure_codes) && procedure_codes.length > 0 ? procedure_codes.slice(0, 2).join(', ') + (procedure_codes.length > 2 ? '...' : '') : t('common.notSet');

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
            aria-label={t('bulkActions.selectItem', {item: displayTitle || t('rfc.itemTitleSingular', {defaultValue: 'RFC'})})}
            className="h-5 w-5 rounded bg-white/80 dark:bg-gray-700/80 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <CardHeader className={`pb-2 ${isSelectionModeActive ? (isRTL ? 'pr-10' : 'pl-10') : ''}`}>
        <div className="flex justify-between items-start">
            <CardTitle className="text-md font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors flex items-center">
                <FileText className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                <span className="truncate" title={displayTitle}>{displayTitle}</span>
            </CardTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={statusBadgeVariant} className="text-xs">{statusText}</Badge>
            {policy_number && <Badge variant="outline" className="text-xs truncate" title={policy_number}>Policy: {policy_number}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="text-sm flex-grow py-2 px-4 space-y-1">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Building2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('rfc.fields.provider')}:&nbsp;</span>
            <span className="truncate" title={provider_name || t('common.unknown')}>{provider_name || t('common.unknown')}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <UserCircle className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('rfc.fields.doctor')}:&nbsp;</span>
            <span className="truncate" title={doctor_name || t('common.unknown')}>{doctor_name || t('common.unknown')}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('rfc.fields.procedureDate')}:&nbsp;</span>
            <span className="truncate">{formatDate(procedure_date)}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <FileText className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('rfc.fields.procedures')}:&nbsp;</span>
            <span className="truncate" title={Array.isArray(procedure_codes) ? procedure_codes.join(', ') : ''}>{procedureCodesDisplay}</span>
        </div>
        {approved_amount && approved_amount > 0 && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <DollarSign className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-gray-400 dark:text-gray-500 shrink-0`} />
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('rfc.fields.approvedAmount')}:&nbsp;</span>
              <span className="truncate text-green-600 dark:text-green-400 font-medium">{formatCurrency(approved_amount)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700/60 pt-2 pb-2 px-4">
        <div className="flex justify-between items-center w-full">
          <span>
            {t('common.submitted')}: {submitted_at ? formatDate(submitted_at, t('common.notSubmitted')) : t('common.notSubmitted')}
          </span>
          {(status === 'rejected' || status === 'cancelled') && (
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" title={t('rfc.statusAlert', {status: statusText})} />
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default RFCCard;