
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Edit, Trash2, UserCircle, CheckCircle, XCircle, Stethoscope, MoreVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatSafeDateDistance } from '@/components/utils/i18n-utils';
import { parseISO, isValid } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DoctorCard({
  doctor,
  onEdit = () => {}, // Add default fallback for robustness
  onDelete = () => {}, // Add default fallback for robustness
  onCardClick = () => {}, // New prop, add default fallback
  isSelectionModeActive = false,
  isSelected = false,
  onToggleSelection = () => {}, // Add default fallback for robustness
  t, // Passed as prop from parent context/hook
  language, // Passed as prop
  isRTL // Passed as prop
}) {

  // If doctor object is not available, return null
  if (!doctor) {
    return null;
  }

  // Helper function to get localized doctor name
  const getDoctorName = () => {
    // Uses outline's proposed localization pattern for names
    const firstName = doctor[`first_name_${language}`] || doctor.first_name_en || '';
    const lastName = doctor[`last_name_${language}`] || doctor.last_name_en || '';
    return `${firstName} ${lastName}`.trim() || doctor.id || t('common.unknownDoctor', { defaultValue: 'Unknown Doctor' });
  };

  // Helper function to format the last updated date
  const formatLastUpdated = () => {
    try {
      if (!doctor?.updated_date) return t('common.notSet', { defaultValue: 'Not set' });
      const date = parseISO(doctor.updated_date);
      if (!isValid(date)) return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      return formatSafeDateDistance(date, language);
    } catch (error) {
      // console.warn('Date formatting error in DoctorCard:', error); // uncomment for debugging
      return t('common.notSet', { defaultValue: 'Not set' });
    }
  };

  // Event handlers for actions, preventing card click propagation
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click when editing
    onEdit(doctor);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click when deleting
    onDelete(doctor.id);
  };

  // Status and specialties display logic
  const statusDisplay = doctor.status ? t(`status.${doctor.status}`, { defaultValue: doctor.status }) : t('common.notSet');
  const specialtiesDisplay = doctor.specialties?.map(s => t(`medicalSpecialties.${s.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: s })).join(', ') || t('common.notSet');

  return (
    <Card
      className={`flex flex-col h-full transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 ${isSelectionModeActive ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
      onClick={() => {
        // If in selection mode, toggle selection; otherwise, trigger general card click
        if (isSelectionModeActive) {
          onToggleSelection(doctor.id);
        } else {
          onCardClick(doctor);
        }
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400 truncate" title={getDoctorName()}>
            <UserCircle className="inline-block h-5 w-5 mr-1.5 rtl:ml-1.5 text-blue-700 dark:text-blue-400" />
            {getDoctorName()}
          </CardTitle>
          {isSelectionModeActive ? (
            // Use Checkbox component for selection mode, ensuring it doesn't trigger card click
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(doctor.id)}
              className="mt-1" // Adjust margin as needed
              aria-label={t('common.selectDoctor')}
              onClick={(e) => e.stopPropagation()} // Prevent card click when checkbox is clicked
            />
          ) : (
            // Original status badge when not in selection mode
            <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className="whitespace-nowrap">
              {statusDisplay}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 truncate" title={specialtiesDisplay}>
          <Stethoscope className="inline-block h-3.5 w-3.5 mr-1 rtl:ml-1 text-gray-500 dark:text-gray-400" />
          {specialtiesDisplay}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
        {doctor.license_number && (
          <div className="flex items-center" title={t('doctors.fields.licenseNumber')}>
            <Edit className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.license_number}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center" title={t('common.phone')}>
            <Phone className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.phone}</span>
          </div>
        )}
        {doctor.email && (
          <div className="flex items-center" title={t('common.email')}>
            <Mail className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {(doctor.city || doctor.address) && (
          <div className="flex items-start" title={t('common.address')}>
            <MapPin className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {doctor.address ? `${doctor.address}, ` : ''}
              {doctor.city || ''}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t dark:border-gray-700 pt-3 pb-3 flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('common.lastUpdated')}: {formatLastUpdated()}
        </p>
        {!isSelectionModeActive && (
          <DropdownMenu dir={isRTL ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t('common.openMenu')}</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "end" : "start"} className="w-40">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2 rtl:ml-2" /> {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-700 focus:bg-red-50/50 dark:text-red-400 dark:focus:bg-red-900/50">
                <Trash2 className="h-4 w-4 mr-2 rtl:ml-2" /> {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
}
