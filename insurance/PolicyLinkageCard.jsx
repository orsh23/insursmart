import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, User, FileText, CalendarDays, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { format, parseISO, isValid } from 'date-fns';

const PolicyLinkageCard = ({
  linkage,
  insuredPersonName, // Optional: display name
  policyNumber,      // Optional: display policy number
  onEdit,
  onDelete,
  onViewDetails,
  t, isRTL, language, currentLocale,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
}) => {
  if (!linkage || !linkage.id) {
    return (
      <Card className="animate-pulse bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </Card>
    );
  }

  const {
    id,
    insured_id,
    policy_id,
    start_date,
    end_date,
    active_flag,
    coverage_type
  } = linkage;

  const safeIsSelected = Boolean(isSelected);
  const safeOnToggleSelection = typeof onToggleSelection === 'function' ? onToggleSelection : () => {};

  const handleCardClick = (e) => {
    if (e.target.closest('[data-radix-checkbox-root]') || e.target.closest('button') || e.target.closest('[data-radix-dropdown-menu-trigger]')) {
      return;
    }
    if (isSelectionModeActive) {
      safeOnToggleSelection();
    }
  };

  const statusText = active_flag ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'});
  const statusVariant = active_flag ? 'success' : 'secondary';

  const renderField = (IconComponent, labelKey, value, defaultValue = t('common.notSet', {defaultValue: 'N/A'})) => (
    <div className="flex items-start text-xs text-gray-600 dark:text-gray-300 mb-1 last:mb-0">
      <IconComponent className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'} mt-0.5 text-gray-400 dark:text-gray-500 shrink-0`} />
      <span className="font-medium text-gray-700 dark:text-gray-200">{t(labelKey, {defaultValue: labelKey.split('.').pop()})}:&nbsp;</span>
      <span className="truncate" title={String(value === null || value === undefined ? defaultValue : value)}>{value === null || value === undefined ? defaultValue : String(value)}</span>
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return t('common.notSet', {defaultValue: 'N/A'});
    return format(parseISO(dateString), 'P', { locale: currentLocale });
  };

  return (
    <Card 
        className={`flex flex-col justify-between hover:shadow-lg transition-shadow group relative bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 ${isSelectionModeActive ? 'cursor-pointer' : ''} ${safeIsSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400' : ''}`}
        onClick={handleCardClick}
    >
      {isSelectionModeActive && (
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
          <Checkbox
            checked={safeIsSelected}
            onCheckedChange={safeOnToggleSelection}
            aria-label={t('bulkActions.selectItem', {item: t('policyLinkage.itemTitle', {defaultValue: 'Policy Linkage'})})}
            className="h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <CardHeader className={`pb-2 ${isSelectionModeActive ? 'pt-8' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <Link2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-500 dark:text-blue-400`} />
            <span className="truncate" title={t('policyLinkage.cardTitle', {insured: insuredPersonName || insured_id, policy: policyNumber || policy_id})}>
              {t('policyLinkage.cardTitleShort', {defaultValue: 'Linkage'})}: {insuredPersonName || insured_id} &harr; {policyNumber || policy_id}
            </span>
          </CardTitle>
        </div>
         <Badge variant={statusVariant} className="text-xs capitalize shrink-0 mt-1 w-fit">
            {statusText}
          </Badge>
      </CardHeader>
      <CardContent className="text-xs space-y-1.5 py-2 flex-grow">
        {renderField(User, 'fields.insuredPerson', insuredPersonName || insured_id)}
        {renderField(FileText, 'fields.policyNumber', policyNumber || policy_id)}
        {renderField(CalendarDays, 'fields.startDate', formatDate(start_date))}
        {renderField(CalendarDays, 'fields.endDate', formatDate(end_date))}
        {coverage_type && renderField(Link2, 'fields.coverageType', t(`coverageTypes.${coverage_type}`, {defaultValue: coverage_type}))}
      </CardContent>
      <CardFooter className="py-2 px-4 border-t dark:border-gray-700/50 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('common.actions', {defaultValue: 'Actions'})}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} onClick={(e) => e.stopPropagation()}>
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(id)}>
                <Eye className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2' } opacity-70`} />
                {t('buttons.viewDetails', {defaultValue: 'View Details'})}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(linkage)}>
              <Edit className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2' } opacity-70`} />
              {t('common.edit', {defaultValue: 'Edit'})}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(id)} className="text-red-600 dark:text-red-500 hover:!text-red-600 dark:hover:!text-red-500 focus:text-red-600 dark:focus:text-red-500">
              <Trash2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2' } opacity-70`} />
              {t('common.delete', {defaultValue: 'Delete'})}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

export default PolicyLinkageCard;