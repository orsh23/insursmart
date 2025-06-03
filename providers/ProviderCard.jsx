import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Button import removed as inline buttons are gone
import { Building2, MapPin, Phone, User, CalendarDays, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox"; // Ensure Checkbox is imported

export default function ProviderCard({
  provider,
  currentLocale,
  t,
  isRTL,
  isSelectionModeActive, // Controls checkbox visibility
  isSelected,
  onToggleSelection, // Function to call when checkbox/card in selection mode is clicked
  onCardClick // Function to call when card is clicked (not in selection mode)
}) {
  if (!provider) {
    return (
      <Card className="border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
            <AlertTriangle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('errors.invalidDataTitle', { defaultValue: 'Invalid Provider Data' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('errors.providerDataMissing', { defaultValue: 'Provider data could not be loaded or is incomplete.' })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const providerName = t('common.langCode') === 'he'
    ? (provider.name?.he || provider.name?.en || t('common.unknownProvider', { defaultValue: 'Unknown Provider' }))
    : (provider.name?.en || provider.name?.he || t('common.unknownProvider', { defaultValue: 'Unknown Provider' }));

  const lastUpdated = provider.updated_date && isValid(parseISO(provider.updated_date))
    ? formatDistanceToNow(parseISO(provider.updated_date), { addSuffix: true, locale: currentLocale })
    : t('common.unknown', { defaultValue: 'Unknown' });

  const providerTypeLabel = provider.provider_type
    ? t(`providerTypes.${provider.provider_type}`, { defaultValue: provider.provider_type.replace(/_/g, ' ') })
    : t('common.notSet', { defaultValue: 'N/A' });

  const statusLabel = provider.status
    ? t(`status.${provider.status}`, { defaultValue: provider.status })
    : t('common.notSet', { defaultValue: 'N/A' });

  const handleCardInteraction = (e) => {
    // Prevent click action if the click target is the checkbox itself or its label
    if (e.target.closest('[data-role="checkbox-container"]')) {
      return;
    }
    if (isSelectionModeActive && onToggleSelection) {
      onToggleSelection(provider.id);
    } else if (!isSelectionModeActive && onCardClick) {
      onCardClick(provider);
    }
  };
  
  const handleCheckboxChange = (checked) => {
    if (onToggleSelection) {
      onToggleSelection(provider.id, checked);
    }
  };

  return (
    <Card 
        className={`relative transition-all duration-200 ease-in-out hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 
        ${isSelected && isSelectionModeActive ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-blue-200 dark:shadow-blue-900/50' : 'border-gray-200 dark:border-gray-700'}
        ${isSelectionModeActive || onCardClick ? 'cursor-pointer' : ''}`}
        onClick={handleCardInteraction}
        aria-selected={isSelected && isSelectionModeActive}
        // Added dir for RTL consistency
        dir={isRTL ? "rtl" : "ltr"}
    >
      {isSelectionModeActive && onToggleSelection && (
          <div 
            data-role="checkbox-container" // To help distinguish checkbox clicks
            className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-10 p-1`}
          >
              <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleCheckboxChange} // Use the specific handler for checkbox state
                  aria-label={t('common.selectItem', { item: providerName, defaultValue: `Select ${providerName}`})}
                  className="h-5 w-5" // Ensure consistent sizing
              />
          </div>
      )}
      <CardHeader className="pt-4 pb-2"> {/* Adjusted padding */}
        <CardTitle className={`text-base font-semibold text-gray-800 dark:text-gray-100 ${isSelectionModeActive && isRTL ? 'mr-10' : ''} ${isSelectionModeActive && !isRTL ? 'ml-10' : ''}`}>
          <Building2 className={`inline-block h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
          {providerName}
        </CardTitle>
        <div className={`flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 ${isSelectionModeActive && isRTL ? 'mr-10' : ''} ${isSelectionModeActive && !isRTL ? 'ml-10' : ''}`}>
            <Badge variant={provider.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                {statusLabel}
            </Badge>
            <span className="mx-1.5">·</span>
            <span>{providerTypeLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="text-sm pb-3"> {/* Adjusted padding */}
        {provider.contact?.city && (
          <div className="flex items-center mb-1 text-gray-600 dark:text-gray-300">
            <MapPin className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400 dark:text-gray-500`} />
            {provider.contact.city}
            {provider.legal?.identifier && <span className="text-gray-400 dark:text-gray-500 text-xs ${isRTL ? 'mr-1' : 'ml-1'}"> (ID: {provider.legal.identifier})</span>}
          </div>
        )}
         {!provider.contact?.city && provider.legal?.identifier && (
           <div className="flex items-center mb-1 text-gray-600 dark:text-gray-300">
             <User className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400 dark:text-gray-500`} />
             {t('providers.fields.legalIdShort', { defaultValue: 'Legal ID' })}: {provider.legal.identifier}
            </div>
        )}
        {provider.contact?.phone && (
          <div className="flex items-center mb-1 text-gray-600 dark:text-gray-300">
            <Phone className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-400 dark:text-gray-500`} />
            {provider.contact.phone}
          </div>
        )}
        <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-2">
          <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
          {t('common.lastUpdated', { defaultValue: 'Updated' })}: {lastUpdated}
        </div>
      </CardContent>
    </Card>
  );
}