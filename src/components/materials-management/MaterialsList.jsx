import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package, Tag, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

export default function MaterialsList({ materials, onEdit, onDelete }) {
  const { t, isRTL } = useLanguageHook();

  if (!materials || materials.length === 0) {
    return (
      <Card className="text-center py-12 shadow-none border-dashed">
        <CardHeader>
          <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
          <CardTitle className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            {t('materials.noMaterialsFound', { defaultValue: "No Materials Found" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('materials.tryAdjustingFiltersOrAdding', { defaultValue: "Try adjusting your filters or add new materials." })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLocalizedValue = (obj, field) => {
    if (!obj) return '';
    return isRTL ? obj[`${field}_he`] || obj[`${field}_en`] : obj[`${field}_en`] || obj[`${field}_he`];
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return t('common.notSet', { defaultValue: 'N/A' });
    try {
      return format(new Date(dateString), 'PP');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {materials.map((material) => (
        <Card key={material.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                {getLocalizedValue(material, 'name')}
              </CardTitle>
              <Badge variant={material.is_active ? "default" : "secondary"} 
                     className={material.is_active ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}>
                {material.is_active ? t('common.status.active', { defaultValue: "Active"}) : t('common.status.inactive', { defaultValue: "Inactive"})}
              </Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400 truncate" title={getLocalizedValue(material, 'description')}>
              {getLocalizedValue(material, 'description') || t('common.noDescription', {defaultValue: 'No description provided.'})}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 text-sm">
            <div>
              <strong>{t('materials.unit', { defaultValue: 'Unit' })}:</strong> {material.unit_of_measure ? t(`materials.units.${material.unit_of_measure}`, { defaultValue: material.unit_of_measure.toUpperCase() }) : 'N/A'}
            </div>
            <div>
              <strong>{t('materials.basePrice', { defaultValue: 'Base Price' })}:</strong> {material.base_price !== undefined ? `${material.base_price} ${material.currency || 'ILS'}` : t('common.notSet', {defaultValue: 'N/A'})}
            </div>
            {material.catalog_path && (
              <div>
                <strong>{t('materials.catalogPath', { defaultValue: 'Catalog Path' })}:</strong> {material.catalog_path}
              </div>
            )}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-1">
              <CalendarDays className={`h-3.5 w-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('common.lastUpdated', { defaultValue: 'Updated' })}: {formatDate(material.updated_date)}
            </div>
            {Array.isArray(material.tags) && material.tags.length > 0 && (
              <div className="mt-2">
                <strong className="block mb-1">{t('common.tags', { defaultValue: 'Tags' })}:</strong>
                <div className="flex flex-wrap gap-1">
                  {material.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
                <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('common.edit')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(material.id)}>
                <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('common.delete')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}