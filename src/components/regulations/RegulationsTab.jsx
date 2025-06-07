
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Regulation } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

import RegulationDialog from './RegulationDialog'; // Assuming this exists
import RegulationCard from './RegulationCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
// Corrected DataTable import path
import { DataTable } from '@/components/ui/data-table';
import RegulationFilterBar from './RegulationFilterBar'; // Assuming this exists
import ImportDialog from '@/components/common/ImportDialog';
import { Badge } from '@/components/ui/badge';

import {
    ListChecks, Plus, UploadCloud, FilterX, RefreshCw, AlertTriangle, FileText
} from 'lucide-react';

import { format, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Simplified cache for this example
const regulationsApiCache = {
  regulations: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 2 * 60 * 1000, // 2 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = regulationsApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < regulationsApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (regulationsApiCache[cacheKey]) {
    regulationsApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (regulationsApiCache[cacheKey]) {
    regulationsApiCache[cacheKey].loading = isLoading;
    if(isLoading) regulationsApiCache[cacheKey].error = null;
  }
};

export default function RegulationsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all', // 'active', 'inactive'
    type: 'all', // Based on regulation_type enum
    page: 1,
    pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'title_en', direction: 'ascending' });

  const [isRegulationDialogOpen, setIsRegulationDialogOpen] = useState(false);
  const [currentRegulation, setCurrentRegulation] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' });

  const [currentView, setCurrentView] = useState(localStorage.getItem('regulations_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const getLocalizedRegulationTitle = useCallback((reg) => {
    if (!reg) return t('common.unknownRegulation', {defaultValue: 'Unknown Regulation'});
    const lang = t('common.langCode', {defaultValue: 'en'});
    return lang === 'he' ? (reg.title_he || reg.title_en) : (reg.title_en || reg.title_he);
  }, [t]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'regulations';
    setLoading(true);
    setError(null);

    if (!forceRefresh && isCacheValid(cacheKey) && regulationsApiCache[cacheKey].data) {
      setRegulations(regulationsApiCache[cacheKey].data);
      if (regulationsApiCache[cacheKey].error) setError(regulationsApiCache[cacheKey].error);
      setLoading(false);
      return;
    }
    if (regulationsApiCache[cacheKey]?.loading && !forceRefresh) {
      await new Promise(resolve => {
        const checkCompletion = () => {
          if (!regulationsApiCache[cacheKey].loading) resolve();
          else setTimeout(checkCompletion, 100);
        };
        checkCompletion();
      });
      if (isCacheValid(cacheKey) && regulationsApiCache[cacheKey].data) {
        setRegulations(regulationsApiCache[cacheKey].data);
        if (regulationsApiCache[cacheKey].error) setError(regulationsApiCache[cacheKey].error);
      } else if (!regulationsApiCache[cacheKey].loading && regulationsApiCache[cacheKey].error) {
        setError(regulationsApiCache[cacheKey].error);
      }
      setLoading(false);
      return;
    }

    setCacheLoading(cacheKey, true);
    try {
      const fetchedRegulations = await Regulation.list('-updated_date');
      const validData = Array.isArray(fetchedRegulations) ? fetchedRegulations : [];
      setRegulations(validData);
      updateCache(cacheKey, validData);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching regulations:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { item: t('pageTitles.regulations')});
      if (err.response?.status === 429 || err.message?.includes("429")) {
        errorMessage = t('errors.rateLimitExceededShort');
        if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else if (err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed to fetch')) {
        errorMessage = t('errors.networkErrorGeneral');
        if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      if (isCacheValid(cacheKey) && regulationsApiCache[cacheKey].data) {
        updateCache(cacheKey, regulationsApiCache[cacheKey].data, errorMessage);
      } else {
        updateCache(cacheKey, [], errorMessage);
      }
    } finally {
      setCacheLoading(cacheKey, false);
      setLoading(false);
    }
  }, [t, retryCount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3 && (error?.includes(t('errors.rateLimitExceededShort')) || error?.includes(t('errors.networkErrorGeneral')))) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
      const timer = setTimeout(() => fetchData(true), delay);
      return () => clearTimeout(timer);
    }
  }, [retryCount, error, fetchData, t]);

  const handleRefresh = () => {
    setRetryCount(0);
    fetchData(true);
    toast({
      title: t('common.refreshingData'),
      description: t('messages.fetchingLatest', { item: t('pageTitles.regulations') }),
    });
  };

  const filteredAndSortedRegulations = useMemo(() => {
    let items = Array.isArray(regulations) ? regulations.filter(Boolean) : [];
    const { searchTerm, status, type } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(reg =>
        (getLocalizedRegulationTitle(reg) && getLocalizedRegulationTitle(reg).toLowerCase().includes(termLower)) ||
        (reg.description_en && reg.description_en.toLowerCase().includes(termLower)) ||
        (reg.description_he && reg.description_he.toLowerCase().includes(termLower)) ||
        (Array.isArray(reg.tags) && reg.tags.some(tag => tag.toLowerCase().includes(termLower)))
      );
    }
    if (status !== 'all') items = items.filter(reg => (status === 'active' ? reg.is_active : !reg.is_active));
    if (type !== 'all') items = items.filter(reg => reg.regulation_type === type);

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA, valB;
         if (sortConfig.key === 'title_en' || sortConfig.key === 'title_he') {
            valA = a[sortConfig.key]?.toLowerCase() || '';
            valB = b[sortConfig.key]?.toLowerCase() || '';
        } else if (sortConfig.key === 'effective_date' || sortConfig.key === 'updated_date') {
          valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
          valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
        }
        
        if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [regulations, filters, sortConfig, getLocalizedRegulationTitle]);

  const paginatedRegulations = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedRegulations.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedRegulations, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedRegulations.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));

  const handleDataTableSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      const { id, desc } = newSortState[0];
      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
    } else {
      setSortConfig({ key: 'title_en', direction: 'ascending' });
    }
  }, []);

  const openRegulationDialog = (regulation = null) => {
    setCurrentRegulation(regulation);
    setIsRegulationDialogOpen(true);
  };

  const handleRegulationDialogClose = (refreshNeeded, operationType = null, regulationTitleParam = '') => {
    setIsRegulationDialogOpen(false);
    setCurrentRegulation(null);
    if (refreshNeeded) {
      fetchData(true);
      const nameToDisplay = regulationTitleParam || t('common.item');
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('regulations.createSuccess', { name: nameToDisplay }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('regulations.updateSuccess', { name: nameToDisplay }) });
      }
    }
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedItemIds(new Set());
  };

  const handleEditAction = () => {
    if (selectedItemIds.size === 1) {
      const regulationIdToEdit = selectedItemIds.values().next().value;
      const regulationToEdit = regulations.find(r => r.id === regulationIdToEdit);
      if (regulationToEdit) {
        openRegulationDialog(regulationToEdit);
      }
    } else if (selectedItemIds.size === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('regulations.itemTitleSingular', {defaultValue: 'Regulation'}) }) });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('pageTitles.regulations')}), variant: 'info' });
    }
  };

  const handleDeleteAction = () => {
    if (selectedItemIds.size > 0) {
      const idsToDelete = Array.from(selectedItemIds);
      const firstItemName = idsToDelete.length > 0 ? getLocalizedRegulationTitle(regulations.find(r => r.id === idsToDelete[0])) : t('regulations.itemTitleSingular', {defaultValue: 'Regulation'});
      const itemName = idsToDelete.length === 1 ? firstItemName : t('pageTitles.regulations');

      setDeleteDialogState({
          isOpen: true,
          itemIds: idsToDelete,
          itemName: itemName,
          message: t('regulations.bulkDeleteConfirmMessage', { count: idsToDelete.length, itemName: itemName.toLowerCase() })
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('pageTitles.regulations') }) });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await Regulation.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting regulation ${id}:`, err);
        const regulationName = getLocalizedRegulationTitle(regulations.find(r => r.id === id)) || t('regulations.itemTitleSingular', {defaultValue: 'Regulation'});
        toast({
            title: t('errors.deleteFailedTitle'),
            description: t('regulations.deleteError', { name: regulationName, error: err.message }),
            variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({
        title: t('messages.success'),
        description: t('regulations.bulkDeleteSuccess', { count: successCount }),
      });
      fetchData(true);
    }
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '', message: '' });
    handleCancelSelectionMode();
  };

  const handleToggleSelection = useCallback((itemId) => {
    if (itemId === undefined || itemId === null) return;
    setSelectedItemIds(prevIds => {
      const newSelectedIds = new Set(prevIds);
      if (newSelectedIds.has(itemId)) newSelectedIds.delete(itemId);
      else newSelectedIds.add(itemId);
      return newSelectedIds;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const itemsToConsider = currentView === 'table' ? filteredAndSortedRegulations : paginatedRegulations;
    const allVisibleValidItems = itemsToConsider.filter(item => item && item.id != null);
    setSelectedItemIds(prevIds => {
      const currentIds = new Set(prevIds);
      const allCurrentlySelectedOnPage = allVisibleValidItems.length > 0 && allVisibleValidItems.every(item => currentIds.has(item.id));
      if (allCurrentlySelectedOnPage) {
        allVisibleValidItems.forEach(item => currentIds.delete(item.id));
      } else {
        allVisibleValidItems.forEach(item => currentIds.add(item.id));
      }
      return currentIds;
    });
  }, [paginatedRegulations, filteredAndSortedRegulations, currentView]);

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    // Basic mapping, adjust based on actual CSV headers and Regulation entity structure
    const regulationsToCreate = records.map(rec => ({
        title_en: rec['Title EN'] || rec['title_en'],
        title_he: rec['Title HE'] || rec['title_he'],
        description_en: rec['Description EN'] || rec['description_en'],
        description_he: rec['Description HE'] || rec['description_he'],
        regulation_type: rec['Type']?.toLowerCase() || rec['regulation_type']?.toLowerCase() || 'other',
        effective_date: rec['Effective Date'] || rec['effective_date'],
        document_url: rec['Document URL'] || rec['document_url'],
        tags: (rec['Tags'] || rec['tags'])?.split(',').map(s => s.trim()).filter(Boolean) || [],
        is_active: (rec['Active'] || rec['is_active'])?.toLowerCase() !== 'false', // Default to true
    })).filter(r => (r.title_en || r.title_he) && r.effective_date);

    if(regulationsToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('pageTitles.regulations')}), variant: 'warning'});
        return;
    }
    // setLoading(true); // Loading state should ideally be managed within the dialog or specific import function
    let successCount = 0; let errorCount = 0;
    for (const regData of regulationsToCreate) {
        try { await Regulation.create(regData); successCount++; }
        catch (err) { console.error("Error creating regulation from import:", err, regData); errorCount++; }
    }
    // setLoading(false);
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount, errorCount, entity: t('pageTitles.regulations')}),
    });
    if (successCount > 0) fetchData(true);
  };

  const globalActionsConfig = useMemo(() => [
    { labelKey: 'regulations.addNewRegulation', defaultLabel: 'Add New Regulation', icon: Plus, action: () => openRegulationDialog() },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true) },
  ], [t, openRegulationDialog, setIsImportDialogOpen]);

  const regulationColumns = useMemo(() => [
    { 
      accessorKey: 'title', // Combined title for sorting/filtering
      header: t('regulations.fields.title'),
      cell: ({ row }) => getLocalizedRegulationTitle(row.original) || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'regulation_type', 
      header: t('regulations.fields.type'),
      cell: ({ row }) => row.original.regulation_type ? t(`regulationTypes.${row.original.regulation_type.toLowerCase()}`, {defaultValue: row.original.regulation_type}) : t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'effective_date', 
      header: t('regulations.fields.effectiveDate'),
      cell: ({ row }) => (row.original.effective_date && isValid(parseISO(row.original.effective_date))
        ? format(parseISO(row.original.effective_date), 'PP', { locale: currentLocale })
        : t('common.notSet')
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'is_active', 
      header: t('regulations.fields.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "secondary"} className="text-xs">
          {row.original.is_active ? t('status.active') : t('status.inactive')}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'document_url',
      header: t('regulations.fields.document'),
      cell: ({ row }) => row.original.document_url ? (
        <a href={row.original.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400" onClick={(e)=> e.stopPropagation()}>
          <FileText className="inline h-4 w-4" /> {t('common.view', {defaultValue: 'View'})}
        </a>
      ) : t('common.notSet'),
      enableSorting: false,
    },
    { 
      accessorKey: 'updated_date', 
      header: t('common.lastUpdated'),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date))
        ? format(parseISO(row.original.updated_date), 'PP', { locale: currentLocale })
        : t('common.unknown')
      ),
      enableSorting: true,
    },
  ], [t, currentLocale, getLocalizedRegulationTitle]);

  if (loading && !regulations.length && !error) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('pageTitles.regulations')})} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <ListChecks className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('pageTitles.regulations')} ({totalItems})
        </h2>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={globalActionsConfig}
                onEditItems={handleEditAction}
                onDeleteItems={handleDeleteAction}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItemIds.size}
                itemTypeForActions={t('regulations.itemTitleSingular', {defaultValue: 'Regulation'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading && regulationsApiCache.regulations.loading}>
                <RefreshCw className={`h-4 w-4 ${loading && regulationsApiCache.regulations.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh')}
            </Button>
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); localStorage.setItem('regulations_view_preference', view);}}
                availableViews={['card', 'table']}
                entityName={t('pageTitles.regulations')}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <RegulationFilterBar
        filters={filters}
        onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
        onResetFilters={() => {
          setFilters({ searchTerm: '', status: 'all', type: 'all', page: 1, pageSize: filters.pageSize });
          setSortConfig({ key: 'title_en', direction: 'ascending' });
          handleCancelSelectionMode();
           toast({
              title: t('filters.clearedTitle'),
              description: t('filters.filtersReset', { item: t('pageTitles.regulations') }),
          });
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => {
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending'; // Corrected logic
            setSortConfig({ key, direction });
        }}
        t={t} language={language} isRTL={isRTL}
        // Pass allRegulations if filter bar needs to derive options from existing data
        // allRegulations={regulations} 
      />
      
      {error && (regulations.length === 0 || retryCount > 0) && (
         <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
                { (error.includes(t('errors.networkErrorGeneral')) || error.includes(t('errors.rateLimitExceededShort'))) && retryCount < 3 &&
                    <p className="text-sm text-destructive dark:text-red-300 mt-1">{t('errors.retryingSoon')}</p>
                }
                <Button variant="outline" size="sm" onClick={() => { setRetryCount(0); handleRefresh();}} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow')}
                </Button>
            </CardContent>
        </Card>
      )}

      {!loading && !error && filteredAndSortedRegulations.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={t('regulations.noRegulationsFilterDesc')}
          message={t('regulations.noRegulationsDesc')}
          actionButton={
            <Button onClick={() => openRegulationDialog()}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewRegulation', {defaultValue: 'Add New Regulation'})}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {(!error || regulations.length > 0) && (filteredAndSortedRegulations.length > 0 || loading && regulations.length > 0) && (
        <>
          {currentView === 'card' && paginatedRegulations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedRegulations.map((regulation) => (
                <RegulationCard
                  key={regulation.id}
                  regulation={regulation}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIds.has(regulation.id)}
                  onToggleSelection={() => handleToggleSelection(regulation.id)}
                  onCardClick={() => !isSelectionModeActive && openRegulationDialog(regulation)}
                />
              ))}
            </div>
          )}

          {currentView === 'table' && (
            <DataTable
              columns={regulationColumns}
              data={filteredAndSortedRegulations}
              loading={loading && regulations.length > 0}
              error={null}
              entityName={t('pageTitles.regulations')}
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
              onSortChange={handleDataTableSortChange}
              currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection}
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openRegulationDialog(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}

          {currentView === 'card' && totalPages > 1 && (
            <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: filters.page, totalPages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isRegulationDialogOpen && (
        <RegulationDialog
          isOpen={isRegulationDialogOpen}
          onClose={handleRegulationDialogClose}
          // onSubmit={handleRegulationSubmit} // Assuming Dialog handles its own submit
          regulationData={currentRegulation}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          entityName={t('pageTitles.regulations')}
          onImport={handleImportSubmit}
          language={language}
          // Provide example CSV headers if needed
        />
      )}

      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('regulations.itemTitleSingular', {defaultValue:'Regulation'}), count: deleteDialogState.itemIds?.length || 1})}
        description={deleteDialogState.message}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={loading && deleteDialogState.isOpen} // Consider a specific loading state for delete op
        t={t} isRTL={isRTL}
      />
    </div>
  );
}
