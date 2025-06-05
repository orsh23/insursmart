
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doctor } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, UploadCloud, Eye, FilterX, RefreshCw, UserCircle, AlertTriangle, MoreVertical, XCircle, CheckCircle2, DownloadCloud } from 'lucide-react';
import DoctorDialog from './DoctorDialog';
import DoctorCard from './DoctorCard';
import DoctorDetailsDrawer from './DoctorDetailsDrawer';
import DoctorFilterBar from './DoctorFilterBar';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Simplified cache for this refactor, can be enhanced later
const doctorsApiCache = {
  doctors: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (cacheKey) => {
  const entry = doctorsApiCache[cacheKey];
  return entry?.data && entry.timestamp && (Date.now() - entry.timestamp) < doctorsApiCache.expirationTime;
};
const updateCache = (cacheKey, data, error = null) => {
  doctorsApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
};
const setCacheLoading = (cacheKey, isLoading) => {
  if (doctorsApiCache[cacheKey]) doctorsApiCache[cacheKey].loading = isLoading;
};

export default function DoctorsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = getLocaleObject(language);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: '', status: 'all', specialty: 'all', city: 'all', page: 1, pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [currentDoctorForDialog, setCurrentDoctorForDialog] = useState(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedDoctorIdForDrawer, setSelectedDoctorIdForDrawer] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', message: '' });

  const [currentView, setCurrentView] = useState(() => loadFromStorage('doctors_view_preference', 'card'));
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const getLocalizedDoctorName = useCallback((doc) => {
    if (!doc) return t('common.unknownDoctor', { defaultValue: 'Unknown Doctor' });
    const lang = language || t('common.langCode', {defaultValue: 'en'});
    const fName = lang === 'he' ? doc.first_name_he : doc.first_name_en;
    const lName = lang === 'he' ? doc.last_name_he : doc.last_name_en;
    const altFName = lang === 'he' ? doc.first_name_en : doc.first_name_he;
    const altLName = lang === 'he' ? doc.last_name_en : doc.last_name_he;
    return `${fName || altFName || ''} ${lName || altLName || ''}`.trim() || t('common.unknownDoctor');
  }, [t, language]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'doctors';
    if (!forceRefresh && isCacheValid(cacheKey) && doctorsApiCache[cacheKey].data) {
      setDoctors(doctorsApiCache[cacheKey].data);
      setError(doctorsApiCache[cacheKey].error);
      setLoading(false);
      return;
    }
    setLoading(true); 
    setCacheLoading(cacheKey, true);
    try {
      const fetchedDoctors = await Doctor.list('-updated_date'); // Default sort
      const validData = Array.isArray(fetchedDoctors) ? fetchedDoctors : [];
      setDoctors(validData);
      updateCache(cacheKey, validData);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      const errorMessage = err.message || t('errors.fetchFailedGeneral', { item: t('pageTitles.doctors')});
      setError(errorMessage);
      updateCache(cacheKey, doctorsApiCache[cacheKey].data || [], errorMessage);
    } finally {
      setCacheLoading(cacheKey, false);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
    toast({
      title: t('common.refreshingData', {defaultValue: "Refreshing Data"}),
      description: t('messages.fetchingLatest', { item: t('pageTitles.doctors') }),
    });
  };

  const filteredAndSortedDoctors = useMemo(() => {
    let items = Array.isArray(doctors) ? doctors.filter(Boolean) : [];
    const { searchTerm, status, specialty, city } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(doc =>
        getLocalizedDoctorName(doc).toLowerCase().includes(termLower) ||
        (doc.license_number && doc.license_number.includes(termLower)) ||
        (doc.email && doc.email.toLowerCase().includes(termLower)) ||
        (doc.phone && doc.phone.includes(termLower)) ||
        (Array.isArray(doc.specialties) && doc.specialties.some(s => t(`doctorSpecialties.${s.replace(/\s+/g, '_')}`, {defaultValue: s}).toLowerCase().includes(termLower)))
      );
    }
    if (status !== 'all') items = items.filter(doc => doc.status === status);
    if (specialty !== 'all') items = items.filter(doc => Array.isArray(doc.specialties) && doc.specialties.includes(specialty));
    if (city !== 'all' && city !== '') items = items.filter(doc => doc.city === city);

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'name') {
          valA = getLocalizedDoctorName(a).toLowerCase();
          valB = getLocalizedDoctorName(b).toLowerCase();
        } else if (sortConfig.key === 'updated_date') {
            valA = a.updated_date && isValid(parseISO(a.updated_date)) ? parseISO(a.updated_date).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            valB = b.updated_date && isValid(parseISO(b.updated_date)) ? parseISO(b.updated_date).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        } else {
          const keys = sortConfig.key.split('.');
          valA = keys.reduce((obj, key) => obj?.[key], a);
          valB = keys.reduce((obj, key) => obj?.[key], b);
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
  }, [doctors, filters, sortConfig, getLocalizedDoctorName, t]);

  const paginatedDoctors = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedDoctors.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedDoctors, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedDoctors.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  
  const handleDataTableSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      const { id, desc } = newSortState[0];
      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
    } else {
      setSortConfig({ key: 'name', direction: 'ascending' }); // Default sort for table
    }
  }, []);
  
  const openDoctorDialogForEdit = (doctorToEdit) => {
    setCurrentDoctorForDialog(doctorToEdit);
    setIsDoctorDialogOpen(true);
  };
  
  const openDoctorDialogForAdd = () => {
    setCurrentDoctorForDialog(null);
    setIsDoctorDialogOpen(true);
  };

  const openDetailsDrawer = (doctorId) => {
    if (isSelectionModeActive) return; 
    const doctorToView = doctors.find(d => d.id === doctorId);
    if (doctorToView) {
        setSelectedDoctorIdForDrawer(doctorId);
        setIsDetailsDrawerOpen(true);
    } else {
        toast({ title: t('errors.itemNotFoundTitle', {defaultValue: 'Item Not Found'}), description: t('errors.itemNotFoundMessage', {item: t('pageTitles.doctorsSingular')}), variant: "warning"});
    }
  };

  const handleDialogClose = (refreshNeeded, operationType = null, doctorNameParam = '') => {
    setIsDoctorDialogOpen(false);
    setCurrentDoctorForDialog(null);
    if (refreshNeeded) {
      fetchData(true);
      const nameToDisplay = doctorNameParam || t('common.item', {defaultValue: "item"});
      if (operationType === 'create') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('doctors.createSuccess', { name: nameToDisplay }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success', {defaultValue: "Success!"}), description: t('doctors.updateSuccess', { name: nameToDisplay }) });
      }
    }
  };

  const handleStartSelectionMode = (mode) => { 
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds(new Set()); 
    toast({
        title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode}`, {defaultValue: mode}) }),
        description: t('bulkActions.selectionModeActiveDesc', { mode: t(`common.${mode}`, {defaultValue: mode}), entity: t('pageTitles.doctorsPlural', {defaultValue: "doctors"})}),
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
    const itemsToConsider = currentView === 'table' ? filteredAndSortedDoctors : paginatedDoctors;
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
  }, [paginatedDoctors, filteredAndSortedDoctors, currentView, selectedItemIds]);

  const handleConfirmSelectionAction = () => {
    const idsArray = Array.from(selectedItemIds);
    if (idsArray.length === 0) {
      toast({ title: t('bulkActions.noItemsSelectedTitle', {defaultValue: "No Items Selected"}), description: t('bulkActions.selectItemsPrompt', { mode: selectionMode, defaultValue: `Please select items to ${selectionMode}.` }), variant: "warning" });
      return;
    }

    if (selectionMode === 'edit') {
      if (idsArray.length === 1) {
        const doctorToEdit = doctors.find(d => d.id === idsArray[0]);
        if (doctorToEdit) {
          openDoctorDialogForEdit(doctorToEdit);
        } else {
          toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
        }
      } else {
        toast({ title: t('bulkActions.selectOneToEditTitle', {defaultValue: "Select One Item"}), description: t('bulkActions.selectOneToEditDesc', {entity: t('pageTitles.doctorsSingular')}), variant: "info" });
        return; 
      }
    } else if (selectionMode === 'delete') {
        const firstItemName = getLocalizedDoctorName(doctors.find(d => d.id === idsArray[0]));
        const itemName = idsArray.length === 1 ? firstItemName : t('pageTitles.doctorsMultipleItems', { count: idsArray.length, defaultValue: `${idsArray.length} doctors` });
        setDeleteDialogState({
            isOpen: true,
            itemIds: idsArray,
            itemName: itemName,
            message: t('doctors.bulkDeleteConfirmMessage', {count: idsArray.length, itemName: itemName, defaultValue: `Are you sure you want to delete ${itemName}? This action cannot be undone.`})
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
        await Doctor.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting doctor ${id}:`, err);
        const doctorName = getLocalizedDoctorName(doctors.find(d => d.id === id) || {id});
        toast({
            title: t('errors.deleteFailedTitle', {defaultValue: "Deletion Failed"}),
            description: t('doctors.deleteError', { name: doctorName, error: err.message }),
            variant: "destructive",
        });
        errorCount++;
      }
    }
    setLoading(false);
    if (successCount > 0) {
      toast({
        title: t('messages.success', {defaultValue: "Success!"}),
        description: t('doctors.bulkDeleteSuccess', { count: successCount }),
      });
      fetchData(true); 
    }
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  };

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
      return;
    }
     const doctorsToCreate = records.map(rec => ({
        first_name_en: rec['First Name EN'] || rec['first_name_en'],
        last_name_en: rec['Last Name EN'] || rec['last_name_en'],
        first_name_he: rec['First Name HE'] || rec['first_name_he'],
        last_name_he: rec['Last Name HE'] || rec['last_name_he'],
        license_number: rec['License Number'] || rec['license_number'],
        specialties: (rec['Specialties'] || rec['specialties'])?.split(',').map(s => s.trim()).filter(Boolean) || [],
        phone: rec['Phone'] || rec['phone'],
        email: rec['Email'] || rec['email'],
        city: rec['City'] || rec['city'],
        status: rec['Status']?.toLowerCase() || rec['status']?.toLowerCase() || 'active',
    })).filter(d => (d.first_name_en || d.first_name_he) && (d.last_name_en || d.last_name_he) && d.license_number && d.specialties?.length > 0);

    if(doctorsToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('pageTitles.doctors')}), variant: 'warning'});
        return;
    }
    setLoading(true);
    let successImpCount = 0; let errorImpCount = 0;
    for (const doctorData of doctorsToCreate) {
        try { await Doctor.create(doctorData); successImpCount++; }
        catch (err) { console.error("Error creating doctor from import:", err, doctorData); errorImpCount++; }
    }
    setLoading(false);
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount: successImpCount, errorCount: errorImpCount, entity: t('pageTitles.doctors')}),
    });
    if (successImpCount > 0) fetchData(true);
  };

  const doctorGlobalActionsConfig = useMemo(() => [
    { labelKey: 'doctors.addNewDoctor', defaultLabel: 'Add New Doctor', icon: Plus, action: openDoctorDialogForAdd, type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' }, 
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true), type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: 'Export' }) }), disabled: true, type: 'export' },
  ], [t, openDoctorDialogForAdd, setIsImportDialogOpen, toast]);

  const doctorColumnsForTable = useMemo(() => [
    { 
      accessorKey: 'name', 
      header: t('doctors.fields.name', {defaultValue: 'Name'}),
      cell: ({ row }) => getLocalizedDoctorName(row.original),
      enableSorting: true,
    },
    { 
      accessorKey: 'license_number', 
      header: t('doctors.fields.licenseNumber', {defaultValue: 'License No.'}),
      cell: ({ row }) => row.original.license_number || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'specialties', 
      header: t('doctors.fields.specialties', {defaultValue: 'Specialties'}),
      cell: ({ row }) => (Array.isArray(row.original.specialties) && row.original.specialties.length > 0
        ? row.original.specialties.map(s => t(`doctorSpecialties.${s.replace(/\s+/g, '_')}`, {defaultValue: s})).join(', ')
        : t('common.notSet', {defaultValue: 'N/A'})
      ),
      enableSorting: false, 
    },
    { 
      accessorKey: 'status', 
      header: t('common.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {t(`status.${row.original.status}`, {defaultValue: row.original.status})}
        </Badge>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'updated_date', 
      header: t('common.lastUpdated', {defaultValue: 'Last Updated'}),
      cell: ({ row }) => (row.original.updated_date && isValid(parseISO(row.original.updated_date))
        ? formatDistanceToNow(parseISO(row.original.updated_date), { addSuffix: true, locale: currentLocale })
        : t('common.unknown', {defaultValue: 'Unknown'})
      ),
      enableSorting: true,
    },
  ], [t, getLocalizedDoctorName, currentLocale, isRTL]);

  if (loading && doctors.length === 0 && !isCacheValid('doctors')) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('pageTitles.doctors') })} />;
  }

  if (error && doctors.length === 0 && (!doctorsApiCache.doctors?.error || doctorsApiCache.doctors.error === error)) {
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
  
  const itemsForSelectAllCheckbox = currentView === 'table' ? filteredAndSortedDoctors : paginatedDoctors;
  const allVisibleSelected = Array.isArray(itemsForSelectAllCheckbox) && itemsForSelectAllCheckbox.length > 0 && itemsForSelectAllCheckbox.every(item => selectedItemIds.has(item.id));

  return (
    <div className="space-y-4">
      {!isSelectionModeActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <UserCircle className={`h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
                {t('pageTitles.doctors')} ({totalItems})
            </h2>
            <div className="flex items-center gap-2">
                <GlobalActionButton
                    actionsConfig={doctorGlobalActionsConfig}
                    onStartSelectionMode={handleStartSelectionMode} 
                    itemTypeForActions={t('pageTitles.doctorsSingular')}
                    t={t} isRTL={isRTL}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading && doctorsApiCache.doctors.loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    <RefreshCw className={`h-4 w-4 ${loading && doctorsApiCache.doctors.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('buttons.refresh')}
                </Button>
                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); saveToStorage('doctors_view_preference', view);}}
                    availableViews={['card', 'table']}
                    entityName={t('pageTitles.doctors')}
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
                id="selectAllVisibleDoctors"
                checked={allVisibleSelected}
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllVisible', { defaultValue: 'Select all visible' })}
                disabled={itemsForSelectAllCheckbox.length === 0}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="selectAllVisibleDoctors" className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedItemIds.size > 0 
                    ? t('bulkActions.selectedCount', { count: selectedItemIds.size, defaultValue: `${selectedItemIds.size} selected`})
                    : t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode}`, {defaultValue: selectionMode}), defaultValue: `Select items to ${selectionMode}` })
                }
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSelectionMode}
                className="text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.cancel', {defaultValue: 'Cancel'})}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSelectionAction}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                disabled={selectedItemIds.size === 0 || (selectionMode === 'edit' && selectedItemIds.size !== 1)}
              >
                <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {selectionMode === 'edit' ? t('common.edit', {defaultValue: 'Edit'}) : t('common.delete', {defaultValue: 'Delete'})} {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {!isSelectionModeActive && (
        <DoctorFilterBar
            filters={filters}
            onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
            onResetFilters={() => {
            setFilters({ searchTerm: '', status: 'all', specialty: 'all', city: 'all', page: 1, pageSize: filters.pageSize });
            setSortConfig({ key: 'name', direction: 'ascending' });
            }}
            sortConfig={sortConfig}
            onSortChange={(key) => {
                let direction = 'ascending';
                if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
                else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending'; 
                setSortConfig({ key, direction });
            }}
            allDoctors={doctors}
            t={t} language={language} isRTL={isRTL}
            currentView={currentView} 
        />
      )}
      
      {doctorsApiCache.doctors?.error && !error && (doctors.length > 0 || !loading) && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('pageTitles.doctors'), message: doctorsApiCache.doctors.error})}</span>
        </div>
      )}

      {(loading && doctors.length > 0) && <LoadingSpinner message={t('messages.updatingData', { item: t('pageTitles.doctors') })} />}
      
      {!loading && filteredAndSortedDoctors.length === 0 && (filters.searchTerm || filters.status !== 'all' || filters.specialty !== 'all' || filters.city !== 'all') && doctors.length > 0 ? (
        <EmptyState
          icon={UserCircle}
          title={t('emptyStates.noDoctorsFilterTitle', {defaultValue: "No Doctors Match Filters"})}
          message={t('emptyStates.noDoctorsFilterMessage', {defaultValue: "Try adjusting your search or filter criteria."})}
        />
      ) : !loading && doctors.length === 0 && !error ? (
        <EmptyState
          icon={UserCircle}
          title={t('emptyStates.noDoctorsTitle', {defaultValue: "No Doctors Found"})}
          message={t('emptyStates.noDoctorsMessage', {defaultValue: "Start by adding a new doctor to manage their details."})}
           actionButton={
             !isSelectionModeActive && <Button onClick={openDoctorDialogForAdd}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('doctors.addNewDoctor')}</Button>
          }
        />
      ) : (filteredAndSortedDoctors.length > 0 || (loading && doctors.length > 0)) && (
        <>
          {currentView === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onCardClick={openDetailsDrawer}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL} language={language}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIds.has(doc.id)}
                  onToggleSelection={handleToggleSelection}
                />
              ))}
            </div>
          )}
          {currentView === 'table' && (
            <DataTable
              columns={doctorColumnsForTable}
              data={filteredAndSortedDoctors} 
              loading={loading && doctors.length > 0}
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
              onSortChange={handleDataTableSortChange}
              currentSort={sortConfig.key ? [{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }] : []}
              entityName={t('pageTitles.doctors')}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={selectedItemIds}
              onRowSelectionChange={handleToggleSelection} 
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openDetailsDrawer(item.id)}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          {currentView === 'card' && totalPages > 1 && (
            <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1 || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: filters.page, totalPages: totalPages})}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isDoctorDialogOpen && (
        <DoctorDialog
          isOpen={isDoctorDialogOpen}
          onCloseDialog={handleDialogClose} 
          doctor={currentDoctorForDialog}
          allSpecialties={Array.from(new Set(doctors.flatMap(d => d.specialties || []).filter(Boolean)))}
          allCities={Array.from(new Set(doctors.map(p => p.city).filter(Boolean)))}
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
      {isDetailsDrawerOpen && selectedDoctorIdForDrawer && (
        <DoctorDetailsDrawer
          doctorId={selectedDoctorIdForDrawer}
          isOpen={isDetailsDrawerOpen}
          onClose={() => { setIsDetailsDrawerOpen(false); setSelectedDoctorIdForDrawer(null); }}
          onEditDoctor={(doctorToEdit) => {
            setIsDetailsDrawerOpen(false); 
            openDoctorDialogForEdit(doctorToEdit);
          }}
          onDeleteDoctor={(doctorToDelete) => {
             setIsDetailsDrawerOpen(false);
             const doctorName = getLocalizedDoctorName(doctorToDelete);
             setDeleteDialogState({
                isOpen: true,
                itemIds: [doctorToDelete.id],
                itemName: doctorName,
                message: t('doctors.deleteConfirmMessage', { name: doctorName, defaultValue: `Are you sure you want to delete ${doctorName}? This action cannot be undone.` })
            });
          }}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSubmit={handleImportSubmit} 
          entityName={t('pageTitles.doctors')}
          sampleHeaders={['First Name EN', 'Last Name EN', 'First Name HE', 'Last Name HE', 'License Number', 'Specialties (comma-separated)', 'Phone', 'Email', 'City', 'Status (active/inactive)']}
          language={language} isRTL={isRTL} 
        />
      )}
    </div>
  );
}
