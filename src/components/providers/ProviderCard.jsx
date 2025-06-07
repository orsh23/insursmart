
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Building2, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { formatSafeDateDistance } from '@/components/utils/i18n-utils';
import { parseISO, isValid } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onCardClick,
  isSelectionModeActive = false,
  isSelected = false,
  onToggleSelection,
  t, language, isRTL
}) {
  if (!provider) {
    return null;
  }

  const getProviderName = () => {
    if (!provider?.name) return t('common.unknownProvider', { defaultValue: 'Unknown Provider' });
    if (typeof provider.name === 'string') return provider.name;
    return provider.name[language] || provider.name.en || provider.name.he || t('common.unknownProvider', { defaultValue: 'Unknown Provider' });
  };

  const formatLastUpdated = () => {
    try {
      if (!provider?.updated_date) return t('common.unknown', { defaultValue: 'Unknown' });
      const date = parseISO(provider.updated_date);
      if (!isValid(date)) return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      return formatSafeDateDistance(date, language);
    } catch (error) {
      console.warn('Date formatting error in ProviderCard:', error);
      return t('common.unknown', { defaultValue: 'Unknown' });
    }
  };

  const providerTypeDisplay = provider.provider_type ? t(`providerTypes.${provider.provider_type}`, { defaultValue: provider.provider_type }) : t('common.notSet');
  const statusDisplay = provider.status ? t(`status.${provider.status}`, { defaultValue: provider.status }) : t('common.notSet');

  const handleCardClick = () => {
    if (!isSelectionModeActive && onCardClick) {
      onCardClick(provider.id);
    }
  };

  const handleToggleSelection = (e) => {
    e.stopPropagation();
    if (onToggleSelection) {
      onToggleSelection(provider.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (typeof onEdit === 'function') {
      onEdit(provider);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (typeof onDelete === 'function') {
      onDelete(provider.id);
    }
  };

  return (
    <Card
      className={`flex flex-col h-full transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 ${isSelectionModeActive ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
      onClick={handleCardClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400 truncate" title={getProviderName()}>
            {getProviderName()}
          </CardTitle>
          {isSelectionModeActive && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleToggleSelection}
              className="w-5 h-5 border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
            />
          )}
          {!isSelectionModeActive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2 rtl:ml-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-2 rtl:ml-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {!isSelectionModeActive && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={provider.status === 'active' ? 'default' : 'destructive'} className="whitespace-nowrap">
              {statusDisplay}
            </Badge>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('providers.lastUpdated')}: {formatLastUpdated()}
            </p>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
          {t('providers.fields.provider_type')}: {providerTypeDisplay}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
        {provider.contact?.contact_person_name && (
          <div className="flex items-center" title={t('providers.fields.contactPerson')}>
            <Building2 className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{provider.contact.contact_person_name}</span>
          </div>
        )}
        {provider.contact?.phone && (
          <div className="flex items-center" title={t('common.phone')}>
            <Phone className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{provider.contact.phone}</span>
          </div>
        )}
        {provider.contact?.email && (
          <div className="flex items-center" title={t('common.email')}>
            <Mail className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{provider.contact.email}</span>
          </div>
        )}
         {(provider.contact?.city || provider.contact?.address) && (
          <div className="flex items-start" title={t('common.address')}>
            <MapPin className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {provider.contact.address ? `${provider.contact.address}, ` : ''}
              {provider.contact.city || ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
