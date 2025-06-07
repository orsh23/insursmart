import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { ImportHistory } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileUp, Download, RefreshCw } from 'lucide-react';
import ImportHistoryFilterBar from './ImportHistoryFilterBar';
import ImportDetailsDialog from './ImportDetailsDialog';
import { format } from 'date-fns';

// A reusable card component for displaying import history items
const ImportCard = ({ item, onViewDetails }) => {
  const { t } = useLanguageHook();
  
  // Get status badge variant based on import status
  const getStatusVariant = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'partial': return 'warning';
      case 'failed': return 'destructive';
      default: return 'default';
    }
  };
  
  // Format the created date
  const formattedDate = item.created_date ? format(new Date(item.created_date), 'PPP p') : t('common.unknownDate', {defaultValue: 'Unknown Date'});
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={item.file_name}>
          {item.file_name || t('common.unknownFile', {defaultValue: 'Unknown File'})}
        </h3>
        <Badge variant={getStatusVariant(item.status)}>
          {t(`importHistory.status.${item.status}`, { defaultValue: item.status || 'N/A' })}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 space-y-1">
        <p>{t('importHistory.module')}: <span className="font-medium">{item.module || 'N/A'}</span></p>
        <p>
          {item.status === 'success' ? (
            t('importHistory.allRecordsImported', { count: item.total_records || 0 })
          ) : (
            t('importHistory.recordsStats', { 
              inserted: item.inserted_records || 0, 
              total: item.total_records || 0,
              failed: item.failed_records || 0
            })
          )}
        </p>
        <p>{formattedDate}</p>
      </div>
      
      <div className="flex justify-end gap-2">
        {(item.status === 'partial' || item.status === 'failed') && item.error_details && item.error_details.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => onViewDetails(item)}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {t('common.viewDetails', { defaultValue: 'View Details' })}
          </Button>
        )}
        <Button 
          asChild
          size="sm" 
          variant="outline" 
          title={item.file_url ? t('common.download') : t('common.fileUnavailable', {defaultValue: 'File Unavailable'})}
          disabled={!item.file_url}
        >
          <a href={item.file_url} target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {t('common.download', { defaultValue: 'Download' })}
          </a>
        </Button>
      </div>
    </div>
  );
};

export default function ImportHistoryContent() {
  const { t } = useLanguageHook();
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    module: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  
  const fetchImportHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ImportHistory.list('-created_date'); // Sort by newest first
      setImports(Array.isArray(data) ? data : []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Failed to fetch import history:', err);
      if (err.response?.status === 429) {
        setError(t('errors.rateLimitExceeded', { defaultValue: 'Too many requests. Please wait a moment and try again.' }));
        setRetryCount(prev => prev + 1);
      } else {
        setError(t('importHistory.fetchError', { defaultValue: 'Failed to load import history. Please try again.' }));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);
  
  useEffect(() => {
    fetchImportHistory();
  }, []); // Initial fetch only, manual retries thereafter

  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) { // Limit to 3 auto retries
      const timeout = Math.min(1000 * Math.pow(2, retryCount -1), 8000); // Exponential backoff up to 8s
      const timer = setTimeout(() => {
        fetchImportHistory();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [retryCount, fetchImportHistory]);
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      module: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    });
  };
  
  const handleViewDetails = (importItem) => {
    setSelectedImport(importItem);
    setIsDetailsDialogOpen(true);
  };
  
  const moduleOptions = React.useMemo(() => {
    if (!Array.isArray(imports)) return [];
    const uniqueModules = [...new Set(imports.map(item => item.module).filter(Boolean))];
    return uniqueModules.map(module => ({
      value: module,
      label: module
    }));
  }, [imports]);
  
  const filteredImports = React.useMemo(() => {
    if (!Array.isArray(imports)) return [];
    return imports.filter(item => {
      const searchMatch = !filters.searchTerm || 
        (item.file_name || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (item.module || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const moduleMatch = filters.module === 'all' || item.module === filters.module;
      const statusMatch = filters.status === 'all' || item.status === filters.status;
      
      let dateMatch = true;
      if (item.created_date) {
        try {
          const importDate = new Date(item.created_date);
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            dateMatch = dateMatch && importDate >= startDate;
          }
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            dateMatch = dateMatch && importDate <= endDate;
          }
        } catch (e) {
          // Invalid date in data, don't crash
          dateMatch = false; 
        }
      } else if (filters.startDate || filters.endDate) {
        // If filtering by date but item has no date, it shouldn't match
        dateMatch = false;
      }
      
      return searchMatch && moduleMatch && statusMatch && dateMatch;
    });
  }, [imports, filters]);
  
  if (loading && imports.length === 0 && retryCount === 0) { // Show loader only on initial load
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ImportHistoryFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        moduleOptions={moduleOptions}
        disabled={loading}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
          <p>{error}</p>
          <Button 
            onClick={() => { setRetryCount(0); fetchImportHistory(); }} 
            className="ml-2" 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.tryAgain', { defaultValue: 'Try Again' })}
          </Button>
        </div>
      )}
      
      {filteredImports.length === 0 && !loading && !error ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <FileUp className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('importHistory.noImportsFound', { defaultValue: 'No import history found' })}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {filters.searchTerm || filters.module !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate
              ? t('importHistory.tryAdjustingFilters', { defaultValue: 'Try adjusting your filters or import some data' })
              : t('importHistory.emptyPrompt', {defaultValue: 'No data imports have been recorded yet.'})
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImports.map(importItem => (
            <ImportCard 
              key={importItem.id} 
              item={importItem}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
      
      <ImportDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        importItem={selectedImport}
      />
    </div>
  );
}