import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle, InfoIcon, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ImportDetailsDialog({ isOpen, onClose, importItem }) {
  const { t } = useLanguageHook();
  
  if (!importItem) {
    return null;
  }
  
  // Format the created date
  const formattedDate = importItem.created_date 
    ? format(new Date(importItem.created_date), 'PPP p')
    : '';
  
  // Determine status icon and color
  let StatusIcon = InfoIcon;
  let statusColor = 'text-blue-500';
  
  if (importItem.status === 'failed') {
    StatusIcon = XCircle;
    statusColor = 'text-red-500';
  } else if (importItem.status === 'partial') {
    StatusIcon = AlertTriangle;
    statusColor = 'text-amber-500';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <StatusIcon className={`h-5 w-5 ${statusColor} mr-2`} />
            {t('importHistory.importDetails', { defaultValue: 'Import Details' })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="font-medium mb-2">{importItem.file_name}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-gray-500">{t('importHistory.module')}:</div>
              <div>{importItem.module}</div>
              
              <div className="text-gray-500">{t('importHistory.date')}:</div>
              <div>{formattedDate}</div>
              
              <div className="text-gray-500">{t('importHistory.status')}:</div>
              <div>
                <Badge 
                  variant={
                    importItem.status === 'success' ? 'success' : 
                    importItem.status === 'partial' ? 'warning' : 
                    'destructive'
                  }
                >
                  {t(`importHistory.status.${importItem.status}`, { defaultValue: importItem.status })}
                </Badge>
              </div>
              
              <div className="text-gray-500">{t('importHistory.records')}:</div>
              <div>
                {t('importHistory.recordsStats', {
                  inserted: importItem.inserted_records,
                  total: importItem.total_records,
                  failed: importItem.failed_records
                })}
              </div>
            </div>
          </div>
          
          {/* Error Details */}
          {importItem.error_details && importItem.error_details.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-red-600">
                {t('importHistory.errorDetails', { defaultValue: 'Error Details' })}
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="text-left py-1 px-2">{t('importHistory.lineNumber')}</th>
                      <th className="text-left py-1 px-2">{t('importHistory.errorMessage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importItem.error_details.map((error, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-red-100 bg-opacity-50' : ''}>
                        <td className="py-1 px-2">
                          {error.line_number !== undefined ? error.line_number : '-'}
                        </td>
                        <td className="py-1 px-2">{error.error_message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {importItem.file_url && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1.5" />
              {t('common.download', { defaultValue: 'Download File' })}
            </Button>
          )}
          <Button onClick={onClose}>
            {t('common.close', { defaultValue: 'Close' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}