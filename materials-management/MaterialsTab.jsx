import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Material } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Plus, Edit, Trash2, UploadCloud, DownloadCloud, Eye, Copy, FilterX, RefreshCw, MoreVertical, AlertTriangle } from 'lucide-react';
import MaterialDialog from './MaterialDialog';
import MaterialCard from './MaterialCard';
import MaterialFilterBar from './MaterialFilterBar';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/shared/DataTable';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

const materialsApiCache = {
  items: { data: null, timestamp: null, loading: false, error: null },
  expirationTime: 5 * 60 * 1000,
};

const isCacheValid = (cacheKey) => {
  const entry = materialsApiCache[cacheKey];
  if (!entry || !entry.data || !entry.timestamp) return false;
  return (Date.now() - entry.timestamp) < materialsApiCache.expirationTime;
};

const updateCache = (cacheKey, data, error = null) => {
  if (materialsApiCache[cacheKey]) {
    materialsApiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
  }
};

const setCacheLoading = (cacheKey, isLoading) => {
  if (materialsApiCache[cacheKey]) {
    materialsApiCache[cacheKey].loading = isLoading;
    if (isLoading) materialsApiCache[cacheKey].error = null;
  }
};

export default function MaterialsTab() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentLocale = getLocaleObject(language);

  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    hasVariants: 'all',
    unitOfMeasure: 'all',
    tags: [],
    page: 1,
    pageSize: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name_en', direction: 'ascending' });

  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '' });

  const [currentView, setCurrentView] = useState(localStorage.getItem('materials_view_preference') || 'card');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'items';
    setLoading(true);
    setError(null);

    if (!forceRefresh && isCacheValid(cacheKey) && materialsApiCache[cacheKey].data) {
      setMaterials(materialsApiCache[cacheKey].data);
      if (materialsApiCache[cacheKey].error) setError(materialsApiCache[cacheKey].error);
      setLoading(false);
      return;
    }
    if (materialsApiCache[cacheKey]?.loading && !forceRefresh) {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (isCacheValid(cacheKey) && materialsApiCache[cacheKey].data) {
        setMaterials(materialsApiCache[cacheKey].data);
      }
      if (materialsApiCache[cacheKey].error) setError(materialsApiCache[cacheKey].error);
      setLoading(false);
      return;
    }

    setCacheLoading(cacheKey, true);
    try {
      const fetchedItems = await Material.list('-updated_date');
      const validData = Array.isArray(fetchedItems) ? fetchedItems : [];
      setMaterials(validData);
      updateCache(cacheKey, validData);
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching materials:", err);
      let errorMessage = t('errors.fetchFailedGeneral', { entity: t('materials.itemTitlePlural', {defaultValue: 'Materials'})});
      if (err.response?.status === 429 || err.message?.includes("429")) {
        errorMessage = t('errors.rateLimitExceededShort');
        if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else if (err.message?.toLowerCase().includes('network error') || err.message?.toLowerCase().includes('failed to fetch')) {
        errorMessage = t('errors.networkErrorGeneral');
        if (retryCount < 3) setRetryCount(prev => prev + 1); else setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      updateCache(cacheKey, isCacheValid(cacheKey) ? materialsApiCache[cacheKey].data : [], errorMessage);
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
      description: t('messages.fetchingLatest', { item: t('materials.itemTitlePlural', {defaultValue: 'Materials'}) }),
    });
  };

  const getLocalizedMaterialName = useCallback((material) => {
    if (!material) return t('common.unknown', {item: t('materials.itemTitleSingular', {defaultValue: "Material"})});
    const lang = t('common.langCode', {defaultValue: language});
    return (lang === 'he' ? material.name_he : material.name_en) || material.name_en || material.name_he || t('common.untitled', {item: t('materials.itemTitleSingular', {defaultValue: "Material"})});
  }, [language, t]);

  const filteredAndSortedMaterials = useMemo(() => {
    let items = Array.isArray(materials) ? materials.filter(Boolean) : [];
    const { searchTerm, status, hasVariants, unitOfMeasure, tags: filterTags } = filters;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      items = items.filter(material =>
        getLocalizedMaterialName(material).toLowerCase().includes(termLower) ||
        (material.description_en && material.description_en.toLowerCase().includes(termLower)) ||
        (material.description_he && material.description_he.toLowerCase().includes(termLower)) ||
        (Array.isArray(material.tags) && material.tags.some(tag => tag.toLowerCase().includes(termLower)))
      );
    }
    if (status !== 'all') items = items.filter(material => material.is_active === (status === 'active'));
    if (hasVariants !== 'all') items = items.filter(material => material.has_variants === (hasVariants === 'true'));
    if (unitOfMeasure !== 'all') items = items.filter(material => material.unit_of_measure === unitOfMeasure);
    
    if (Array.isArray(filterTags) && filterTags.length > 0) {
        items = items.filter(material => Array.isArray(material.tags) && filterTags.every(ft => material.tags.includes(ft)));
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'name') {
          valA = getLocalizedMaterialName(a).toLowerCase();
          valB = getLocalizedMaterialName(b).toLowerCase();
        } else if (sortConfig.key === 'updated_date') {
            const dateA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            const dateB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            valA = dateA;
            valB = dateB;
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (typeof valA === 'boolean') valA = Number(valA);
          if (typeof valB === 'boolean') valB = Number(valB);
        }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [materials, filters, sortConfig, getLocalizedMaterialName, t]);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedMaterials.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedMaterials, filters.page, filters.pageSize]);

  const totalItems = filteredAndSortedMaterials.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handlePageSizeChange = (newPageSize) => setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));

  const handleSortChange = useCallback((newSortState) => {
    if (newSortState && newSortState.length > 0) {
      const { id, desc } = newSortState[0];
      setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
    } else {
      setSortConfig({ key: 'name_en', direction: 'ascending' });
    }
  }, []);

  const openMaterialDialog = (material = null) => {
    setCurrentMaterial(material);
    setIsMaterialDialogOpen(true);
  };

  const openDetailsDrawer = (material) => {
    toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: "Material Details View"})});
  };

  const handleDuplicate = (material) => {
    if (!material) return;
    const duplicatedMaterial = { ...material };
    delete duplicatedMaterial.id;
    duplicatedMaterial.name_en = `${duplicatedMaterial.name_en} (Copy)`;
    duplicatedMaterial.name_he = `${duplicatedMaterial.name_he} (עותק)`;
    setCurrentMaterial(duplicatedMaterial);
    setIsMaterialDialogOpen(true);
  };

  const handleDialogClose = (refreshNeeded, operationType = null, itemName = '') => {
    setIsMaterialDialogOpen(false);
    setCurrentMaterial(null);
    if (refreshNeeded) {
      fetchData(true);
      if (operationType === 'create') {
        toast({ title: t('messages.success'), description: t('crud.createSuccess', { item: itemName || t('materials.itemTitleSingular', {defaultValue: "Material"}) }) });
      } else if (operationType === 'update') {
        toast({ title: t('messages.success'), description: t('crud.updateSuccess', { item: itemName || t('materials.itemTitleSingular', {defaultValue: "Material"}) }) });
      }
    }
  };

  const openSingleDeleteConfirmDialog = (material) => {
    if (!material || !material.id) return;
    const itemName = getLocalizedMaterialName(material) || t('materials.itemTitleSingular', {defaultValue: "Material"});
    setDeleteDialogState({ isOpen: true, itemIds: [material.id], itemName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of deleteDialogState.itemIds) {
      try {
        await Material.delete(id);
        successCount++;
      } catch (err) {
        console.error(`Error deleting material ${id}:`, err);
        errorCount++;
      }
    }
    setLoading(false);

    if (successCount > 0) {
      toast({
        title: t('common.success'),
        description: t('common.deleteSuccessMultiple', { count: successCount, item: deleteDialogState.itemName || t('materials.itemTitleSingular', {defaultValue: 'Material'}) }),
      });
      fetchData(true);
      if (isSelectionModeActive) {
        setSelectedItemIds(new Set());
        setIsSelectionModeActive(false);
      }
    }
    if (errorCount > 0) {
       toast({
        title: t('common.error'),
        description: t('common.deleteErrorMultiple', { count: errorCount, item: deleteDialogState.itemName || t('materials.itemTitleSingular', {defaultValue: 'Material'}) }),
        variant: "destructive",
      });
    }
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '' });
  };

  const guaranteedSelectedItemIds = useMemo(() => selectedItemIds instanceof Set ? selectedItemIds : new Set(), [selectedItemIds]);

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
    const itemsToConsider = currentView === 'table' ? filteredAndSortedMaterials : paginatedMaterials;
    const allVisibleValidItems = itemsToConsider.filter(item => item && item.id != null);

    setSelectedItemIds(prevIds => {
      const currentIds = prevIds instanceof Set ? prevIds : new Set();
      const newSelectedIds = new Set(currentIds);
      const allCurrentlySelectedOnPage = allVisibleValidItems.length > 0 && allVisibleValidItems.every(item => newSelectedIds.has(item.id));

      if (allCurrentlySelectedOnPage) {
        allVisibleValidItems.forEach(item => newSelectedIds.delete(item.id));
      } else {
        allVisibleValidItems.forEach(item => newSelectedIds.add(item.id));
      }
      return newSelectedIds;
    });
  }, [paginatedMaterials, filteredAndSortedMaterials, currentView]);

  const handleToggleSelectionMode = () => {
    setIsSelectionModeActive(prev => {
      if (prev) setSelectedItemIds(new Set());
      return !prev;
    });
  };

  const handleBulkDelete = () => {
    if (guaranteedSelectedItemIds.size > 0) {
      const itemName = t('materials.itemTitlePlural', { count: guaranteedSelectedItemIds.size, defaultValue: 'Materials' });
      setDeleteDialogState({ isOpen: true, itemIds: Array.from(guaranteedSelectedItemIds), itemName });
    } else {
      toast({ title: t('bulkActions.noSelectionTitle'), description: t('bulkActions.noSelectionToDeleteDesc', { entity: t('materials.itemTitlePlural', {defaultValue: 'Materials'}) }), variant: "warning" });
    }
  };
  
  const handleImportSubmit = async (fileToImport) => {
    setIsImportDialogOpen(false);
    if (!fileToImport) {
      toast({ title: t('import.noFileTitle'), description: t('import.noFileDesc'), variant: "warning" });
      return;
    }
    toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDetailed', {featureName: t('materials.importTitle', {defaultValue: 'Material Import'})}) });
  };

  const materialColumns = useMemo(() => [
    ...(isSelectionModeActive ? [{
        id: 'select',
        header: () => (
            <Checkbox
                checked={
                  guaranteedSelectedItemIds.size > 0 &&
                  (currentView === 'table' ? filteredAndSortedMaterials : paginatedMaterials)
                    .filter(item => item && item.id != null).length > 0 &&
                  (currentView === 'table' ? filteredAndSortedMaterials : paginatedMaterials)
                    .filter(item => item && item.id != null)
                    .every(item => guaranteedSelectedItemIds.has(item.id))
                }
                onCheckedChange={handleSelectAllVisible}
                aria-label={t('bulkActions.selectAllRowsOnPage')}
                className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
        ),
        cell: ({ row }) => {
            const item = row.original;
            const isSelected = item && item.id != null && guaranteedSelectedItemIds.has(item.id);
            return (
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => item?.id && handleToggleSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('bulkActions.selectRow')}
                    disabled={!item || item.id == null}
                    className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
            );
        },
        enableSorting: false, size: 50,
    }] : []),
    {
      accessorKey: 'name', 
      header: t('materials.fields.name', {defaultValue: 'Name'}),
      cell: ({ row }) => getLocalizedMaterialName(row.original),
      enableSorting: true,
    },
    {
      accessorKey: 'unit_of_measure',
      header: t('materials.fields.unitOfMeasure', {defaultValue: 'Unit'}),
      cell: ({ row }) => t(`materials.units.${row.original.unit_of_measure}`, {defaultValue: row.original.unit_of_measure}),
      enableSorting: true,
    },
    {
      accessorKey: 'base_price',
      header: t('materials.fields.basePrice', {defaultValue: 'Base Price'}),
      cell: ({ row }) => {
        const { base_price, currency } = row.original;
        if (!base_price && base_price !== 0) return t('common.notSet', {defaultValue: 'N/A'});
        return `${base_price.toLocaleString()} ${currency || 'ILS'}`;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'has_variants',
      header: t('materials.fields.hasVariants', {defaultValue: 'Variants'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.has_variants ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.has_variants ? t('common.yes', {defaultValue: 'Yes'}) : t('common.no', {defaultValue: 'No'})}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'is_active',
      header: t('common.status', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.is_active ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: () => <div className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-gray-500 dark:text-gray-400`}>{t('common.actions', {defaultValue: 'Actions'})}</div>,
      cell: ({ row }) => {
        const material = row.original;
        if (!material || !material.id) return null;
        return (
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <DropdownMenu dir={isRTL ? 'rtl' : 'ltr'}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('common.actions', {defaultValue: 'Actions'})}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailsDrawer(material); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.viewDetails', {defaultValue: 'View Details'})}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMaterialDialog(material); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.edit', {defaultValue: 'Edit'})}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(material); }} className="dark:text-gray-200 dark:hover:bg-gray-700">
                  <Copy className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('buttons.duplicate', {defaultValue: 'Duplicate'})}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openSingleDeleteConfirmDialog(material); }} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300 dark:hover:bg-red-700/20">
                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.delete', {defaultValue: 'Delete'})}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [t, language, currentLocale, isRTL, isSelectionModeActive, handleToggleSelection, openSingleDeleteConfirmDialog, openMaterialDialog, openDetailsDrawer, handleDuplicate, guaranteedSelectedItemIds, handleSelectAllVisible, filteredAndSortedMaterials, paginatedMaterials, currentView, getLocalizedMaterialName]);

  if (loading && materials.length === 0 && !isCacheValid('items')) {
    return <LoadingSpinner className="mt-20" message={t('messages.loadingData', { item: t('materials.itemTitlePlural', {defaultValue: 'Materials'}) })} />;
  }

  if (error && materials.length === 0 && (!materialsApiCache.items?.error || materialsApiCache.items.error === error)) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-gray-200 mb-2">{t('errors.dataLoadErrorTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        {(error.includes(t('errors.rateLimitExceededShort')) || error.includes(t('errors.networkErrorGeneral'))) && retryCount < 3 && (
           <p className="text-sm text-gray-500 dark:text-gray-300">{t('errors.retryingSoon')}</p>
        )}
        <Button onClick={() => {setRetryCount(0); handleRefresh();}} variant="outline" className="mt-4 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('buttons.retry')}
        </Button>
      </div>
    );
  }
  
  const displayItems = currentView === 'card' ? paginatedMaterials : filteredAndSortedMaterials;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <Package className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('materials.pageTitle', {defaultValue: 'Materials'})} ({totalItems})
        </h2>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                buttonText={t('materials.addNew', { defaultValue: 'Add New Material' })}
                icon={Plus}
                onClick={() => openMaterialDialog()}
                isSelectionModeActive={isSelectionModeActive}
                selectedItemCount={guaranteedSelectedItemIds.size}
                onToggleSelectionMode={handleToggleSelectionMode}
                onBulkDelete={handleBulkDelete}
                bulkDeleteText={t('buttons.bulkDeleteSelected', {count: guaranteedSelectedItemIds.size, item: t('materials.itemTitlePlural', {defaultValue: 'Materials'})})}
                itemTypeForActions={t('materials.itemTitlePlural', {defaultValue: 'Materials'})}
                additionalActions={[
                  { label: t('buttons.import', {defaultValue: 'Import'}), icon: UploadCloud, action: () => setIsImportDialogOpen(true), disabled: isSelectionModeActive },
                  { label: t('buttons.export', {defaultValue: 'Export'}), icon: DownloadCloud, action: () => alert(t('common.featureComingSoon', {featureName: t('materials.exportTitle', {defaultValue: 'Export Materials'})})), disabled: true },
                ]}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading && materialsApiCache.items.loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <RefreshCw className={`h-4 w-4 ${loading && materialsApiCache.items.loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh')}
            </Button>
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentView(view); setIsSelectionModeActive(false); setSelectedItemIds(new Set()); }}
                availableViews={['card', 'table']}
                entityName={t('materials.itemTitlePlural', {defaultValue: 'Materials'})}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <MaterialFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() => {
          setFilters({ searchTerm: '', status: 'all', hasVariants: 'all', unitOfMeasure: 'all', tags: [], page: 1, pageSize: filters.pageSize });
          setSortConfig({ key: 'name_en', direction: 'ascending' });
          setSelectedItemIds(new Set());
          setIsSelectionModeActive(false);
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => { 
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
                direction = 'ascending';
            }
            setSortConfig({ key, direction });
        }}
        t={t} language={language} isRTL={isRTL}
      />
      
      {materialsApiCache.items?.error && !error && (materials.length > 0 || !loading) && (
         <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('materials.itemTitlePlural', {defaultValue: 'Materials'}), message: materialsApiCache.items.error})}</span>
        </div>
      )}

      {(loading && materials.length > 0) && <LoadingSpinner message={t('messages.updatingData', { item: t('materials.itemTitlePlural', {defaultValue: 'Materials'}) })} />}
      
      {!loading && displayItems.length === 0 && materials.length > 0 ? (
        <EmptyState
          icon={Package}
          title={t('emptyStates.noFilterMatchTitle', {item: t('materials.itemTitlePlural', {defaultValue: 'Materials'})})}
          message={t('emptyStates.noFilterMatchMessage')}
        />
      ) : !loading && materials.length === 0 && !error ? (
        <EmptyState
          icon={Package}
          title={t('emptyStates.noDataTitle', {item: t('materials.itemTitlePlural', {defaultValue: 'Materials'})})}
          message={t('emptyStates.noDataMessage', {item: t('materials.itemTitleSingular', {defaultValue: 'Material'})})}
           actionButton={
             <Button onClick={() => openMaterialDialog()}><Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('materials.addNew', { defaultValue: 'Add New Material' })}</Button>
          }
        />
      ) : (displayItems.length > 0 || (loading && materials.length > 0)) && (
        <>
          {currentView === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onViewDetails={openDetailsDrawer}
                  onEdit={openMaterialDialog}
                  onDelete={openSingleDeleteConfirmDialog}
                  onDuplicate={handleDuplicate}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={guaranteedSelectedItemIds.has(material.id)}
                  onToggleSelection={() => handleToggleSelection(material.id)}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={materialColumns}
              data={filteredAndSortedMaterials}
              loading={loading && materials.length > 0}
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
              onSortChange={handleSortChange}
              currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
              entityName={t('materials.itemTitlePlural', {defaultValue: 'Materials'})}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={guaranteedSelectedItemIds}
              onRowSelectionChange={(rowId) => handleToggleSelection(rowId)}
              onSelectAllRows={handleSelectAllVisible}
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && openDetailsDrawer(item)}
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
                {t('dataTable.pageInfo', { page: filters.page, totalPages: totalPages})}
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

      {isMaterialDialogOpen && (
        <MaterialDialog
          isOpen={isMaterialDialogOpen}
          onClose={handleDialogClose}
          materialData={currentMaterial}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      {deleteDialogState.isOpen && (
        <ConfirmationDialog
          open={deleteDialogState.isOpen}
          onOpenChange={(open) => setDeleteDialogState(prev => ({...prev, isOpen: open}))}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('materials.itemTitleSingular', {defaultValue: 'Material'}), count: deleteDialogState.itemIds?.length || 1})}
          description={t('common.confirmDeleteDescription', {item: deleteDialogState.itemName || t('materials.itemTitleSingular', {defaultValue: 'Material'}), count: deleteDialogState.itemIds?.length || 1})}
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
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImportSubmit}
          entityName={t('materials.itemTitlePlural', {defaultValue: 'Materials'})}
          sampleHeaders={['Name EN', 'Name HE', 'Description EN', 'Description HE', 'Unit of Measure', 'Base Price', 'Currency', 'Has Variants (true/false)', 'Is Active (true/false)', 'Tags (comma-separated)']}
          language={language}
        />
      )}
    </div>
  );
}