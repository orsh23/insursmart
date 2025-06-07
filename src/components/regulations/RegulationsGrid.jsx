import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Tag, Eye, Edit, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function RegulationsGrid({ 
  regulations = [], 
  loading = false, 
  onView, 
  onEdit, 
  onDelete 
}) {
  const { t, language, isRTL } = useLanguageHook();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!regulations.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <FileText className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium">{t('regulations.noRegulations')}</h3>
        <p className="mt-2 text-sm text-gray-500">
          {t('regulations.startByAdding')}
        </p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRegulationType = (type) => {
    return t(`regulations.type.${type.toLowerCase()}`, { defaultValue: type });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {regulations.map(regulation => (
        <Card key={regulation.id} className={`border-l-4 ${regulation.is_active ? 'border-l-green-500' : 'border-l-gray-400'} hover:shadow-md transition-shadow`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">
                {language === 'he' ? regulation.title_he : regulation.title_en}
              </CardTitle>
              <Badge className={regulation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {regulation.is_active ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> {t('common.active')}</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> {t('common.inactive')}</>
                )}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Badge variant="outline" className="mr-2">
                {getRegulationType(regulation.regulation_type)}
              </Badge>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(regulation.effective_date)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {regulation.description_en || regulation.description_he ? (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {language === 'he' ? regulation.description_he : regulation.description_en}
              </p>
            ) : null}

            {regulation.tags && regulation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {regulation.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    <Tag className="h-2 w-2 mr-1" /> {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => onView(regulation)}>
                <Eye className="h-4 w-4 mr-1" /> {t('common.view')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(regulation)}>
                <Edit className="h-4 w-4 mr-1" /> {t('common.edit')}
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(regulation.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}