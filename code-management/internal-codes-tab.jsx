
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InternalCode } from '@/api/entities'; // Ensure this SDK exists
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, Code2 as InternalCodeIcon, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import InternalCodeCard from './InternalCodeCard'; // Card component for internal codes
import InternalCodeFilters from './InternalCodeFilters'; // Filters specific to internal codes (renamed from InternalCodeFilterBar)
import InternalCodeDialog from './internal-code-dialog'; // Dialog for add/edit
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge'; // Added badge for consistency with outline
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

export default function InternalCodesTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [internalCodes, setInternalCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: '', is_active: 'all', is_billable: 'all', category_path: 'all', page: 1, pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'updated_date', direction: 'descending' });

  const [isInternalCodeDialogOpen, setIsInternalCodeDialogOpen] = useState(false);
  const [currentInternalCodeForDialog, setCurrentInternalCodeForDialog] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', message: '' });

  const [currentView, setCurrentView] = useState(() => loadFromStorage('internalCodes_view_preference', 'card'));
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const fetchInternalCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCodes = await InternalCode.list('-updated_date');
      setInternalCodes(Array.isArray(fetchedCodes) ? fetchedCodes : []);
    } catch (err) {
      console.error("Error fetching internal codes:", err);
      const errorMessage = err.message || t('errors.fetchFailedGeneral', { item: t('internalCodes.titleMultiple')});
      setError(errorMessage);
      toast({ title: t('errors.dataLoadErrorTitle'), description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchInternalCodes(); }, [fetchInternalCodes]);

  const handleRefresh = () => {
    fetchInternalCodes();
    toast({
      title: t('common.refreshingData'),
      description: t('messages.fetchingLatest', { item: t('internalCodes.titleMultiple') }),
    });
  };

  const filteredAndSortedInternalCodes = useMemo(() => {
    let items = Array.isArray(internalCodes) ? internalCodes.filter(Boolean) : [];
    const { searchTerm, is_active, is_billable, category_path } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(code =>
        (code.code_number && code.code_number.toLowerCase().includes(termLower)) ||
        (code.description_en && code.description_en.toLowerCase().includes(termLower)) ||
        (code.description_he && code.description_he.toLowerCase().includes(termLower)) ||
        (code.category_path && code.category_path.toLowerCase().includes(termLower))
      );
    }
    if (is_active !== 'all') items = items.filter(code => String(code.is_active) === String(is_active));
    if (is_billable !== 'all') items = items.filter(code => String(code.is_billable) === String(is_billable));
    if (category_path !== 'all') items = items.filter(code => code.category_path === category_path);


    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'updated_date' || sortConfig.key === 'created_date') {
          valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
          valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else if (typeof valA === 'boolean' || typeof valB === 'boolean') {
           // Handle boolean sort: true before false for ascending
           valA = valA === true ? 1 : (valA === false ? 0 : -1); // true=1, false=0, undefined/null=-1
           valB = valB === true ? 1 : (valB === false ? 0 : -1);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = typeof valB === 'string' ? valB.toLowerCase() : '';
        }
        
        if (valA === undefined || valA === null) valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [internalCodes, filters, sortConfig]);

  const paginatedInternalCodes = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedInternalCodes.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedInternalCodes, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedInternalCodes.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize) || 1;

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  
  const openInternalCodeDialogForEdit = (codeToEdit) => {
    setCurrentInternalCodeForDialog(codeToEdit);
    setIsInternalCodeDialogOpen(true);
  };
  
  const openInternalCodeDialogForAdd = () => {
    setCurrentInternalCodeForDialog(null);
    setIsInternalCodeDialogOpen(true);
  };

  const openInternalCodeDetails = (codeToView) => {
    if (isSelectionModeActive) return; 
    const codeObject = typeof codeToView === 'string' ? internalCodes.find(c => c.id === codeToView) : codeToView;
    if (codeObject) openInternalCodeDialogForEdit(codeObject);
    else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundMessage', {item: t('internalCodes.itemTitleSingular')}), variant: "warning"});
  };

  const handleDialogClose = (refreshNeeded, operationType = null, codeIdentifier = '') => {
    setIsInternalCodeDialogOpen(false);
    setCurrentInternalCodeForDialog(null);
    if (refreshNeeded) {
      fetchInternalCodes();
      const nameToDisplay = codeIdentifier || t('common.item');
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('internalCodes.createSuccess', { name: nameToDisplay }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('internalCodes.updateSuccess', { name: nameToDisplay }) });
      }
    }
  };

  const handleStartSelectionMode = (mode) => { 
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set()); 
    toast({
        title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode}`) }),
        description: t('bulkActions.selectionModeActiveDesc', { mode: t(`common.${mode}`), entity: t('internalCodes.titleMultiple')}),
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
    const itemsToConsider = currentView === 'table' ? filteredAndSortedInternalCodes : paginatedInternalCodes;
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
  }, [paginatedInternalCodes, filteredAndSortedInternalCodes, currentView, selectedItemIds]);

  const handleConfirmSelectionAction = () => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ title: t('bulkActions.noItemsSelectedTitle'), description: t('bulkActions.selectItemsPrompt', { mode: selectionMode }), variant: "warning" });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const codeToEdit = internalCodes.find(d => d.id === idsArray[0]);
        if (codeToEdit) openInternalCodeDialogForEdit(codeToEdit);
        else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
      } else {
        toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('internalCodes.itemTitleSingular')}), variant: "info" });
        return; 
      }
    } else if (selectionMode === 'delete') {
        const firstItemIdentifier = internalCodes.find(d => d.id === idsArray[0])?.code_number || t('common.unknownCode');
        const itemName = idsArray.length === 1 ? firstItemIdentifier : t('internalCodes.itemTitlePluralItems', { count: idsArray.length });
        setDeleteDialogState({
            isOpen: true, itemIds: idsArray, itemName: itemName,
            message: t('internalCodes.bulkDeleteConfirmMessage', {count: idsArray.length, itemName: itemName })
        });
    }
    
    // Only cancel selection mode immediately if action was successful or not blocked by validation
    // If edit mode and multiple selected, we want to keep selection mode active to prompt user
    if (!(selectionMode === 'edit' && idsArray.length > 1)) handleCancelSelectionMode();
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true); 
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await InternalCode.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting internal code ${id}:`, err);
        const codeIdentifier = internalCodes.find(d => d.id === id)?.code_number || id;
        toast({
            title: t('errors.deleteFailedTitle'),
            description: t('internalCodes.deleteError', { name: codeIdentifier, error: err.message }),
            variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({ title: t('messages.success'), description: t('internalCodes.bulkDeleteSuccess', { count: successCount }) });
      fetchInternalCodes(); 
    }
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  };

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
      return;
    }
     const codesToCreate = records.map(rec => ({
        code_number: rec['Code Number'] || rec['code_number'],
        description_en: rec['Description EN'] || rec['description_en'],
        description_he: rec['Description HE'] || rec['description_he'],
        // category_id: rec['Category ID'] || rec['category_id'], // May need lookup - assuming dialog handles this or it's not directly imported
        category_path: rec['Category Path'] || rec['category_path'],
        tags: (rec['Tags'] || rec['tags'])?.split(',').map(s => s.trim()).filter(Boolean) || [],
        is_billable: rec['Is Billable']?.toLowerCase() === 'true' || rec['is_billable'] === true,
        is_active: rec['Is Active']?.toLowerCase() === 'true' || rec['is_active'] === true || true, // Default to true if not specified
    })).filter(c => c.code_number && c.description_en && c.description_he);

    if(codesToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('internalCodes.titleMultiple')}), variant: 'warning'});
        return;
    }
    setLoading(true);
    let successImpCount = 0; let errorImpCount = 0;
    for (const codeData of codesToCreate) {
        try { await InternalCode.create(codeData); successImpCount++; }
        catch (err) { console.error("Error creating internal code from import:", err, codeData); errorImpCount++; }
    }
    setLoading(false);
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount: successImpCount, errorCount: errorImpCount, entity: t('internalCodes.titleMultiple')}),
    });
    if (successImpCount > 0) fetchInternalCodes();
  };

  const internalCodeGlobalActionsConfig = useMemo(() => [
    { labelKey: 'internalCodes.addNew', defaultLabel: 'Add New Internal Code', icon: Plus, action: openInternalCodeDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' }, 
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: 'Export' }) }), disabled: true, type: 'export' },
  ], [t, openInternalCodeDialogForAdd, setIsImportDialogOpen, toast]);

  const internalCodeColumnsForTable = useMemo(() => [
    { 
      accessorKey: 'code_number', 
      header: t('internalCodes.fields.codeNumber'),
      cell: ({ row }) => row.original.code_number || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'description_en', 
      header: t('internalCodes.fields.descriptionEn'),
      cell: ({ row }) => row.original.description_en || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'category_path', 
      header: t('internalCodes.fields.categoryPath'),
      cell: ({ row }) => row.original.category_path || t('common.notSet'),
      enableSorting: true,
    },
    { 
      accessorKey: 'is_billable', 
      header: t('internalCodes.fields.isBillable'),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.is_billable ? 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200'}`}>
          {row.original.is_billable ? t('common.yes') : t('common.no')}
        </Badge>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'is_active', 
      header: t('internalCodes.fields.isActive'),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.is_active ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.is_active ? t('status.active') : t('status.inactive')}
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

  if (loading && internalCodes.length === 0 && !error) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('internalCodes.titleMultiple') })} />;
  }

  if (error && internalCodes.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('buttons.retry')}
        </Button>
      </div>
    );
  }
  
  const itemsForSelectAllCheckbox = currentView === 'table' ? filteredAndSortedInternalCodes : paginatedInternalCodes;
  const allVisibleSelected = Array.isArray(itemsForSelectAllCheckbox) && itemsForSelectAllCheckbox.length > 0 && itemsForSelectAllCheckbox.every(item => selectedItemIds.has(item.id));

  return (
    <div className="space-y-4">
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <InternalCodeIcon className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                {t('internalCodes.titleMultiple')} ({totalItems})
            </h2>
            <div className="flex items-center gap-2">
                <GlobalActionButton
                    actionsConfig={internalCodeGlobalActionsConfig}
                    onStartSelectionMode={handleStartSelectionMode} 
                    itemTypeForActions={t('internalCodes.itemTitleSingular')}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} /> {t('buttons.refresh')}
                </Button>
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); saveToStorage('internalCodes_view_preference', view);}}
                    availableViews={['card', 'table']}
                    entityName={t('internalCodes.titleMultiple')}
                    t={t} isRTL={isRTL}
                />
            </div>
        </div>
      )}

      {isSelectionModeActive && (
        <div className="sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-blue-50 dark:bg-blue-900/30 py-2 px-2 md:px-4 z-10 border-b border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="selectAllVisibleInternalCodes"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible')}
                disabled={itemsForSelectAllCheckbox.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleInternalCodes" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItemIds.size > 0 
                    ? t('bulkActions.selectedCount', { count: selectedItemIds.size })
                    : t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode}`) })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelSelectionMode} className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} /> {t('common.cancel')}
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
        <InternalCodeFilters
            filters={filters}
            onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
            onResetFilters={() => {
              setFilters({ searchTerm: '', is_active: 'all', is_billable: 'all', category_path: 'all', page: 1, pageSize: filters.pageSize });
              setSortConfig({ key: 'updated_date', direction: 'descending' });
            }}
            sortConfig={sortConfig}
            onSortChange={(key) => {
                let direction = 'ascending';
                if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
                else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending'; 
                setSortConfig({ key, direction });
            }}
            allInternalCodes={internalCodes} // Pass raw list for potential filter options derived from data
            t={t} language={language} isRTL={isRTL}
            currentView={currentView} 
        />
      )}
      
      {error && !loading && internalCodes.length > 0 && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('internalCodes.titleMultiple'), message: error})}</span>
        </div>
      )}

      {(loading && internalCodes.length > 0) && <LoadingSpinner message={t('messages.updatingData', { item: t('internalCodes.titleMultiple') })} />}
      
      {!loading && filteredAndSortedInternalCodes.length === 0 && internalCodes.length > 0 && (filters.searchTerm || filters.is_active !== 'all' || filters.is_billable !== 'all' || filters.category_path !== 'all') ? (
        <EmptyState
          icon={InternalCodeIcon}
          title={t('emptyStates.noInternalCodesFilterTitle')}
          message={t('emptyStates.noInternalCodesFilterMessage')}
        />
      ) : !loading && internalCodes.length === 0 && !error ? (
        <EmptyState
          icon={InternalCodeIcon}
          title={t('emptyStates.noInternalCodesTitle')}
          message={t('emptyStates.noInternalCodesMessage')}
           actionButton={
             !isSelectionModeActive && <Button onClick={openInternalCodeDialogForAdd}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('internalCodes.addNew')}</Button>
          }
        />
      ) : (filteredAndSortedInternalCodes.length > 0 || (loading && internalCodes.length > 0)) && (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedInternalCodes.map((code) => (
                <InternalCodeCard
                  key={code.id}
                  internalCode={code}
                  onCardClick={openInternalCodeDetails}
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
              columns={internalCodeColumnsForTable}
              data={filteredAndSortedInternalCodes} 
              loading={loading && internalCodes.length > 0}
              error={null} 
              pagination={{
                currentPage: filters.page, pageSize: filters.pageSize,
                totalItems: totalItems, totalPages: totalPages,
                onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [10, 20, 50, 100],
              }}
              onSortChange={(newSortState) => { 
                  if (newSortState && newSortState.length > 0) {
                      const { id, desc } = newSortState[0];
                      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
                  } else setSortConfig({ key: 'updated_date', direction: 'descending' });
              }}
              currentSort={sortConfig.key ? [{id: sortConfig.key, desc: sortConfig.direction === 'descending'}] : []}
              entityName={t('internalCodes.titleMultiple')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection} 
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openInternalCodeDetails(item)}
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

      {isInternalCodeDialogOpen && (
        <InternalCodeDialog
          isOpen={isInternalCodeDialogOpen}
          onClose={handleDialogClose} 
          internalCode={currentInternalCodeForDialog}
          t={t} language={language} isRTL={isRTL}
          // Note: categories prop removed as per outline, assuming InternalCodeDialog handles its own category fetching/context
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.length || 1})}
          description={deleteDialogState.message || t('common.confirmDeleteDescription', {item: deleteDialogState.itemName, count: deleteDialogState.itemIds?.length || 1})}
          confirmText={t('common.delete')} cancelText={t('common.cancel')}
          loading={loading && deleteDialogState.isOpen} // Only show loading spinner if dialog is open and delete is in progress
          t={t} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSubmit={handleImportSubmit} 
          entityName={t('internalCodes.titleMultiple')}
          sampleHeaders={['Code Number', 'Description EN', 'Description HE', 'Category Path', 'Tags (comma-separated)', 'Is Billable (true/false)', 'Is Active (true/false)']}
          language={language} isRTL={isRTL} 
        />
      )}
    </div>
  );
}
