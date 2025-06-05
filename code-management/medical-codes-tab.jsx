import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MedicalCode } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, PackageSearch, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import MedicalCodeCard from './MedicalCodeCard';
import MedicalCodeFilters from './MedicalCodesTab/MedicalCodeFilters'; // Corrected path if needed
import MedicalCodeDialog from './medical-code-dialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import { formatDistanceToNow, parseISO, isValid, format } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

export default function MedicalCodesTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [medicalCodes, setMedicalCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: '', codeSystem: 'all', status: 'all', page: 1, pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'updated_date', direction: 'descending' });

  const [isMedicalCodeDialogOpen, setIsMedicalCodeDialogOpen] = useState(false);
  const [currentMedicalCodeForDialog, setCurrentMedicalCodeForDialog] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', message: '' });

  const [currentView, setCurrentView] = useState(() => loadFromStorage('medicalCodes_view_preference', 'card'));
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const fetchMedicalCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCodes = await MedicalCode.list('-updated_date'); // Default sort
      setMedicalCodes(Array.isArray(fetchedCodes) ? fetchedCodes : []);
    } catch (err) {
      console.error("Error fetching medical codes:", err);
      const errorMessage = err.message || t('errors.fetchFailedGeneral', { item: t('medicalCodes.titleMultiple')});
      setError(errorMessage);
      toast({ title: t('errors.dataLoadErrorTitle'), description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchMedicalCodes(); }, [fetchMedicalCodes]);

  const handleRefresh = () => {
    fetchMedicalCodes();
    toast({
      title: t('common.refreshingData'),
      description: t('messages.fetchingLatest', { item: t('medicalCodes.titleMultiple') }),
    });
  };

  const filteredAndSortedMedicalCodes = useMemo(() => {
    let items = Array.isArray(medicalCodes) ? medicalCodes.filter(Boolean) : [];
    const { searchTerm, codeSystem, status } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(code =>
        (code.code && code.code.toLowerCase().includes(termLower)) ||
        (code.description_en && code.description_en.toLowerCase().includes(termLower)) ||
        (code.description_he && code.description_he.toLowerCase().includes(termLower))
      );
    }
    if (codeSystem !== 'all') items = items.filter(code => code.code_system === codeSystem);
    if (status !== 'all') items = items.filter(code => code.status === status);

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'updated_date' || sortConfig.key === 'created_date') {
          valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
          valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
        }
        if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [medicalCodes, filters, sortConfig]);

  const paginatedMedicalCodes = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedMedicalCodes.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedMedicalCodes, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedMedicalCodes.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize) || 1;

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  
  const openMedicalCodeDialogForEdit = (codeToEdit) => {
    setCurrentMedicalCodeForDialog(codeToEdit);
    setIsMedicalCodeDialogOpen(true);
  };
  
  const openMedicalCodeDialogForAdd = () => {
    setCurrentMedicalCodeForDialog(null);
    setIsMedicalCodeDialogOpen(true);
  };

  const openMedicalCodeDetails = (codeToView) => { // Can be an ID or the object
    if (isSelectionModeActive) return; 
    const codeObject = typeof codeToView === 'string' ? medicalCodes.find(c => c.id === codeToView) : codeToView;

    if (codeObject) {
        openMedicalCodeDialogForEdit(codeObject); // Re-use dialog for viewing/editing details
    } else {
        toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundMessage', {item: t('medicalCodes.itemTitleSingular')}), variant: "warning"});
    }
  };

  const handleDialogClose = (refreshNeeded, operationType = null, codeIdentifier = '') => {
    setIsMedicalCodeDialogOpen(false);
    setCurrentMedicalCodeForDialog(null);
    if (refreshNeeded) {
      fetchMedicalCodes();
      const nameToDisplay = codeIdentifier || t('common.item');
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('medicalCodes.createSuccess', { name: nameToDisplay }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('medicalCodes.updateSuccess', { name: nameToDisplay }) });
      }
    }
  };

  const handleStartSelectionMode = (mode) => { 
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set()); 
    toast({
        title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode}`) }),
        description: t('bulkActions.selectionModeActiveDesc', { mode: t(`common.${mode}`), entity: t('medicalCodes.titleMultiple')}),
        variant: 'info'
    });
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItemIds(new Set());
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
    const itemsToConsider = currentView === 'table' ? filteredAndSortedMedicalCodes : paginatedMedicalCodes;
    const allVisibleValidItemIds = itemsToConsider.filter(item => item && item.id != null).map(item => item.id);
    
    const allCurrentlySelectedOnPage = allVisibleValidItemIds.length > 0 && allVisibleValidItemIds.every(id => selectedItemIds.has(id));

    if (allCurrentlySelectedOnPage) {
      setSelectedItemIds(prevIds => {
        const newIds = new Set(prevIds);
        allVisibleValidItemIds.forEach(id => newIds.delete(id));
        return newIds;
      });
    } else {
      setSelectedItemIds(prevIds => new Set([...prevIds, ...allVisibleValidItemIds]));
    }
  }, [paginatedMedicalCodes, filteredAndSortedMedicalCodes, currentView, selectedItemIds]);

  const handleConfirmSelectionAction = () => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ title: t('bulkActions.noItemsSelectedTitle'), description: t('bulkActions.selectItemsPrompt', { mode: selectionMode }), variant: "warning" });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const codeToEdit = medicalCodes.find(d => d.id === idsArray[0]);
        if (codeToEdit) {
          openMedicalCodeDialogForEdit(codeToEdit);
        } else {
          toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
        }
      } else {
        toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('medicalCodes.itemTitleSingular')}), variant: "info" });
        return; 
      }
    } else if (selectionMode === 'delete') {
        const firstItemIdentifier = medicalCodes.find(d => d.id === idsArray[0])?.code || t('common.unknownCode');
        const itemName = idsArray.length === 1 ? firstItemIdentifier : t('medicalCodes.itemTitlePluralItems', { count: idsArray.length });
        setDeleteDialogState({
            isOpen: true,
            itemIds: idsArray,
            itemName: itemName,
            message: t('medicalCodes.bulkDeleteConfirmMessage', {count: idsArray.length, itemName: itemName })
        });
    }
    
    if (!(selectionMode === 'edit' && idsArray.length > 1)) { 
        handleCancelSelectionMode();
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true); 
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await MedicalCode.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting medical code ${id}:`, err);
        const codeIdentifier = medicalCodes.find(d => d.id === id)?.code || id;
        toast({
            title: t('errors.deleteFailedTitle'),
            description: t('medicalCodes.deleteError', { name: codeIdentifier, error: err.message }),
            variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({
        title: t('messages.success'),
        description: t('medicalCodes.bulkDeleteSuccess', { count: successCount }),
      });
      fetchMedicalCodes(); 
    }
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  };

  const handleImportSubmit = async (records) => { // Simplified for now
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
      return;
    }
     const codesToCreate = records.map(rec => ({
        code: rec['Code'] || rec['code'],
        code_system: rec['Code System'] || rec['code_system'],
        description_en: rec['Description EN'] || rec['description_en'],
        description_he: rec['Description HE'] || rec['description_he'],
        tags: (rec['Tags'] || rec['tags'])?.split(',').map(s => s.trim()).filter(Boolean) || [],
        catalog_path: rec['Catalog Path'] || rec['catalog_path'],
        status: rec['Status']?.toLowerCase() || rec['status']?.toLowerCase() || 'active',
    })).filter(c => c.code && c.code_system && c.description_en && c.description_he);

    if(codesToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('medicalCodes.titleMultiple')}), variant: 'warning'});
        return;
    }
    setLoading(true);
    let successImpCount = 0; let errorImpCount = 0;
    for (const codeData of codesToCreate) {
        try { await MedicalCode.create(codeData); successImpCount++; }
        catch (err) { console.error("Error creating medical code from import:", err, codeData); errorImpCount++; }
    }
    setLoading(false);
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount: successImpCount, errorCount: errorImpCount, entity: t('medicalCodes.titleMultiple')}),
    });
    if (successImpCount > 0) fetchMedicalCodes();
  };

  const medicalCodeGlobalActionsConfig = useMemo(() => [
    { labelKey: 'medicalCodes.addNew', defaultLabel: 'Add New Code', icon: Plus, action: openMedicalCodeDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' }, 
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: 'Export' }) }), disabled: true, type: 'export' },
  ], [t, openMedicalCodeDialogForAdd, setIsImportDialogOpen, toast]);

  const medicalCodeColumnsForTable = useMemo(() => [
    { 
      accessorKey: 'code', 
      header: t('medicalCodes.fields.code'),
      cell: ({ row }) => row.original.code || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'description_en', 
      header: t('medicalCodes.fields.descriptionEn'),
      cell: ({ row }) => row.original.description_en || t('common.notSet'),
      enableSorting: true,
    },
     { 
      accessorKey: 'description_he', 
      header: t('medicalCodes.fields.descriptionHe'),
      cell: ({ row }) => row.original.description_he || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'code_system', 
      header: t('medicalCodes.fields.codeSystem'),
      cell: ({ row }) => row.original.code_system || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'status', 
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {t(`status.${row.original.status}`, {defaultValue: row.original.status})}
        </Badge>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'updated_date', 
      header: t('common.lastUpdated'),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date))
        ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale })
        : t('common.unknown')
      ),
      enableSorting: true,
    },
  ], [t, currentLocale]);

  if (loading && medicalCodes.length === 0 && !error) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('medicalCodes.titleMultiple') })} />;
  }

  if (error && medicalCodes.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry')}
        </Button>
      </div>
    );
  }
  
  const itemsForSelectAllCheckbox = currentView === 'table' ? filteredAndSortedMedicalCodes : paginatedMedicalCodes;
  const allVisibleSelected = Array.isArray(itemsForSelectAllCheckbox) && itemsForSelectAllCheckbox.length > 0 && itemsForSelectAllCheckbox.every(item => selectedItemIds.has(item.id));

  return (
    <div className="space-y-4">
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <PackageSearch className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                {t('medicalCodes.titleMultiple')} ({totalItems})
            </h2>
            <div className="flex items-center gap-2">
                <GlobalActionButton
                    actionsConfig={medicalCodeGlobalActionsConfig}
                    onStartSelectionMode={handleStartSelectionMode} 
                    itemTypeForActions={t('medicalCodes.itemTitleSingular')}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('buttons.refresh')}
                </Button>
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); saveToStorage('medicalCodes_view_preference', view);}}
                    availableViews={['card', 'table']}
                    entityName={t('medicalCodes.titleMultiple')}
                    t={t} isRTL={isRTL}
                />
            </div>
        </div>
      )}

      {isSelectionModeActive && (
        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="selectAllVisibleMedicalCodes"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible')}
                disabled={itemsForSelectAllCheckbox.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleMedicalCodes" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItemIds.size > 0 
                    ? t('bulkActions.selectedCount', { count: selectedItemIds.size })
                    : t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode}`) })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelSelectionMode} className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleConfirmSelectionAction} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white" disabled={selectedItemIds.size === 0 || (selectionMode === 'edit' && selectedItemIds.size !== 1)}>
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {selectionMode === 'edit' ? t('common.edit') : t('common.delete')} {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {!isSelectionModeActive && (
        <MedicalCodeFilters
            filters={filters}
            onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
            onResetFilters={() => {
              setFilters({ searchTerm: '', codeSystem: 'all', status: 'all', page: 1, pageSize: filters.pageSize });
              setSortConfig({ key: 'updated_date', direction: 'descending' });
            }}
            sortConfig={sortConfig}
            onSortChange={(key) => {
                let direction = 'ascending';
                if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
                else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending'; 
                setSortConfig({ key, direction });
            }}
            allMedicalCodes={medicalCodes}
            t={t} language={language} isRTL={isRTL}
            currentView={currentView} 
        />
      )}
      
      {error && !loading && medicalCodes.length > 0 && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('medicalCodes.titleMultiple'), message: error})}</span>
        </div>
      )}

      {(loading && medicalCodes.length > 0) && <LoadingSpinner message={t('messages.updatingData', { item: t('medicalCodes.titleMultiple') })} />}
      
      {!loading && filteredAndSortedMedicalCodes.length === 0 && (filters.searchTerm || filters.codeSystem !== 'all' || filters.status !== 'all') && medicalCodes.length > 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t('emptyStates.noMedicalCodesFilterTitle')}
          message={t('emptyStates.noMedicalCodesFilterMessage')}
        />
      ) : !loading && medicalCodes.length === 0 && !error ? (
        <EmptyState
          icon={PackageSearch}
          title={t('emptyStates.noMedicalCodesTitle')}
          message={t('emptyStates.noMedicalCodesMessage')}
           actionButton={
             !isSelectionModeActive && <Button onClick={openMedicalCodeDialogForAdd}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('medicalCodes.addNew')}</Button>
          }
        />
      ) : (filteredAndSortedMedicalCodes.length > 0 || (loading && medicalCodes.length > 0)) && (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedMedicalCodes.map((code) => (
                <MedicalCodeCard
                  key={code.id}
                  medicalCode={code}
                  onCardClick={openMedicalCodeDetails}
                  t={t} isRTL={isRTL} language={language} currentLocale={currentLocale}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIds.has(code.id)}
                  onToggleSelection={handleToggleSelection}
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
            <DataTable
              columns={medicalCodeColumnsForTable}
              data={filteredAndSortedMedicalCodes} 
              loading={loading && medicalCodes.length > 0}
              error={null} 
              pagination={{
                currentPage: filters.page,
                pageSize: filters.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [10, 20, 50, 100],
              }}
              onSortChange={(newSortState) => { 
                  if (newSortState && newSortState.length > 0) {
                      const { id, desc } = newSortState[0];
                      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
                  } else { 
                      setSortConfig({ key: 'updated_date', direction: 'descending' });
                  }
              }}
              currentSort={sortConfig.key ? [{id: sortConfig.key, desc: sortConfig.direction === 'descending'}] : []}
              entityName={t('medicalCodes.titleMultiple')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection} 
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openMedicalCodeDetails(item)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {currentView === 'card' && totalPages > 1 && (
            <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1 || loading} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: filters.page, totalPages: totalPages})}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= totalPages || loading} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isMedicalCodeDialogOpen && (
        <MedicalCodeDialog
          isOpen={isMedicalCodeDialogOpen}
          onClose={handleDialogClose} 
          medicalCode={currentMedicalCodeForDialog}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.length || 1})}
          description={deleteDialogState.message || t('common.confirmDeleteDescription', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.length || 1})}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          loading={loading && deleteDialogState.isOpen}
          t={t} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSubmit={handleImportSubmit} 
          entityName={t('medicalCodes.titleMultiple')}
          sampleHeaders={['Code', 'Code System (ICD9-DX, ICD10-CM, CPT, etc.)', 'Description EN', 'Description HE', 'Tags (comma-separated)', 'Catalog Path', 'Status (active/deprecated)']}
          language={language} isRTL={isRTL} 
        />
      )}
    </div>
  );
}