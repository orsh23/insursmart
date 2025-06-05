import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { InsuranceCode } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Edit, Trash2, UploadCloud, DownloadCloud, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import InsuranceCodeDialog from './insurance-code-dialog';
import InsuranceCodeCard from './InsuranceCodeCard';
import InsuranceCodeFilters from './InsuranceCodeFilters';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import DataTable from '@/components/shared/DataTable';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Helper functions for local storage
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

export default function InsuranceCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  // State management
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and pagination states
  const [filters, setFilters] = useState(
    loadFromStorage('insuranceCodesView_filters', {
      searchTerm: '',
      status: 'all',
      requiresPreAuth: 'all',
      categoryPath: '',
    })
  );

  const [sortConfig, setSortConfig] = useState({ key: 'updated_date', direction: 'descending' });
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 12, totalCount: 0, totalPages: 1 });

  // Selection mode states
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'edit' or 'delete'
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // View state
  const [currentView, setCurrentView] = useState(passedView || loadFromStorage('insuranceCodesView_viewPreference', 'card'));

  useEffect(() => {
    if (passedView) {
      setCurrentView(passedView);
      saveToStorage('insuranceCodesView_viewPreference', passedView);
    }
  }, [passedView]);

  // Save filters to localStorage
  useEffect(() => {
    saveToStorage('insuranceCodesView_filters', filters);
  }, [filters]);

  // Fetch insurance codes
  const fetchInsuranceCodes = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && insuranceCodes.length > 0) return; // Don't refetch if we already have data

    setLoading(true);
    setError(null);
    try {
      const sortParam = `${sortConfig.direction === 'descending' ? '-' : ''}${sortConfig.key}`;
      const fetchedItems = await InsuranceCode.list(sortParam);
      setInsuranceCodes(Array.isArray(fetchedItems) ? fetchedItems : []);
    } catch (err) {
      console.error('Error fetching insurance codes:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: t('errors.fetchFailedSingular', { entity: t('insuranceCodes.itemTitlePlural', { defaultValue: 'Insurance Codes' }) }),
        description: err.message
      });
      setInsuranceCodes([]);
    } finally {
      setLoading(false);
    }
  }, [sortConfig, t, toast, insuranceCodes.length]);

  useEffect(() => {
    fetchInsuranceCodes();
  }, []);

  // Filter and sort insurance codes
  const filteredAndSortedCodes = useMemo(() => {
    let filtered = insuranceCodes.filter(code => {
      const searchMatch = !filters.searchTerm ||
        (code.code && code.code.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (code.name_en && code.name_en.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (code.name_he && code.name_he.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (code.category_path && code.category_path.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const statusMatch = filters.status === 'all' ||
        (filters.status === 'active' && code.is_active) ||
        (filters.status === 'inactive' && !code.is_active);

      const preAuthMatch = filters.requiresPreAuth === 'all' ||
        (filters.requiresPreAuth === 'required' && code.requires_preauthorization) ||
        (filters.requiresPreAuth === 'not_required' && !code.requires_preauthorization);

      const categoryMatch = !filters.categoryPath ||
        (code.category_path && code.category_path.toLowerCase().includes(filters.categoryPath.toLowerCase()));

      return searchMatch && statusMatch && preAuthMatch && categoryMatch;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];

        if (valueA === null || valueA === undefined) return sortConfig.direction === 'descending' ? -1 : 1;
        if (valueB === null || valueB === undefined) return sortConfig.direction === 'descending' ? 1 : -1;

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortConfig.direction === 'descending' ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
        } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
          return sortConfig.direction === 'descending' ? Number(valueB) - Number(valueA) : Number(valueA) - Number(valueB);
        } else {
          const strA = String(valueA).toLowerCase();
          const strB = String(valueB).toLowerCase();
          return sortConfig.direction === 'descending' ? strB.localeCompare(strA) : strA.localeCompare(strB);
        }
      });
    }

    return filtered;
  }, [insuranceCodes, filters, sortConfig]);

  // Paginate filtered results
  const paginatedCodes = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    const totalFiltered = filteredAndSortedCodes.length;
    
    // Update pagination info
    setPagination(prev => ({
      ...prev,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / prev.pageSize) || 1
    }));

    return filteredAndSortedCodes.slice(start, end);
  }, [filteredAndSortedCodes, pagination.currentPage, pagination.pageSize]);

  // Actions config
  const insuranceCodeGlobalActionsConfig = useMemo(() => [
    { labelKey: 'insuranceCodes.addNew', defaultLabel: 'Add Insurance Code', icon: Plus, action: () => openInsuranceCodeDialogForAdd(), type: 'add' },
    { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, type: 'edit' },
    { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, type: 'delete' },
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: 'Import' }) }), disabled: true, type: 'import' },
    { labelKey: 'buttons.export', defaultLabel: 'Export', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: 'Export' }) }), disabled: true, type: 'export' },
    ...(externalActionsConfig || [])
  ], [t, toast, externalActionsConfig]);

  // Dialog handlers
  const openInsuranceCodeDialogForAdd = useCallback(() => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  }, []);

  const openInsuranceCodeDialogForEdit = useCallback((code) => {
    setCurrentItem(code);
    setIsDialogOpen(true);
  }, []);

  const closeInsuranceCodeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setCurrentItem(null);
  }, []);

  const handleInsuranceCodeDialogClose = useCallback((refresh) => {
    if (refresh) {
      fetchInsuranceCodes(true);
    }
    closeInsuranceCodeDialog();
  }, [fetchInsuranceCodes, closeInsuranceCodeDialog]);

  // Selection mode handlers
  const handleStartSelectionMode = useCallback((mode) => {
    setSelectionMode(mode);
    setIsSelectionModeActive(true);
    setSelectedItemIds([]);
    toast({
      title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode}`, { defaultValue: mode }) }),
      description: t('bulkActions.selectionModeActiveDesc', { entity: t('insuranceCodes.itemTitlePlural', { defaultValue: 'insurance codes' }), mode: t(`common.${mode}`, { defaultValue: mode }) }),
      variant: 'info'
    });
  }, [t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItemIds([]);
  }, []);

  const handleToggleSelection = useCallback((codeId) => {
    setSelectedItemIds(prev => {
      if (prev.includes(codeId)) {
        return prev.filter(id => id !== codeId);
      } else {
        return [...prev, codeId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItemIds.length === paginatedCodes.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(paginatedCodes.map(code => code.id));
    }
  }, [paginatedCodes, selectedItemIds]);

  const handleConfirmAction = useCallback(async () => {
    if (selectedItemIds.length === 0) {
      toast({
        title: t('bulkActions.noItemsSelectedTitle'),
        description: t('bulkActions.selectItemsPrompt', { mode: t(`common.${selectionMode}`, { defaultValue: selectionMode }) }),
        variant: 'warning'
      });
      return;
    }

    if (selectionMode === 'edit') {
      if (selectedItemIds.length === 1) {
        const codeToEdit = filteredAndSortedCodes.find(c => c.id === selectedItemIds[0]);
        if (codeToEdit) {
          openInsuranceCodeDialogForEdit(codeToEdit);
          handleCancelSelectionMode();
        }
      } else {
        toast({
          title: t('bulkActions.selectOneToEditTitle'),
          description: t('bulkActions.selectOneToEditDesc', { entity: t('insuranceCodes.itemTitleSingular', { defaultValue: 'insurance code' }) }),
          variant: 'warning'
        });
      }
    } else if (selectionMode === 'delete') {
      if (confirm(t('insuranceCodes.bulkDeleteConfirmMessage', { count: selectedItemIds.length, itemName: selectedItemIds.length === 1 ? t('insuranceCodes.itemTitleSingular', { defaultValue: 'insurance code' }) : t('insuranceCodes.itemTitlePlural', { defaultValue: 'insurance codes' }) }))) {
        try {
          setLoading(true);
          await Promise.all(selectedItemIds.map(id => InsuranceCode.delete(id)));
          toast({
            title: t('insuranceCodes.bulkDeleteSuccess', { count: selectedItemIds.length }),
            variant: 'success'
          });
          handleCancelSelectionMode();
          await fetchInsuranceCodes(true);
        } catch (err) {
          toast({
            title: t('common.deleteError', { entity: t('insuranceCodes.itemTitlePlural', { defaultValue: 'Insurance Codes' }) }),
            description: err.message,
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      }
    }
  }, [selectedItemIds, selectionMode, t, toast, filteredAndSortedCodes, openInsuranceCodeDialogForEdit, handleCancelSelectionMode, fetchInsuranceCodes]);

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when filters change
    handleCancelSelectionMode();
  }, [handleCancelSelectionMode]);

  const handleResetFilters = useCallback(() => {
    const defaultFilters = { searchTerm: '', status: 'all', requiresPreAuth: 'all', categoryPath: '' };
    setFilters(defaultFilters);
    setSortConfig({ key: 'updated_date', direction: 'descending' });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    handleCancelSelectionMode();
    saveToStorage('insuranceCodesView_filters', defaultFilters);
  }, [handleCancelSelectionMode]);

  const handleSortChange = useCallback((newSortConfig) => {
    setSortConfig(newSortConfig);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    handleCancelSelectionMode();
  }, [handleCancelSelectionMode]);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    handleCancelSelectionMode();
  }, [handleCancelSelectionMode]);

  // Table columns
  const insuranceCodeColumnsForTable = useMemo(() => [
    { 
      accessorKey: 'code', 
      header: t('insuranceCodes.fields.code', {defaultValue: 'Code'}),
      cell: ({ row }) => row.original.code || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'name_en', 
      header: t('insuranceCodes.fields.nameEn', {defaultValue: 'Name (EN)'}),
      cell: ({ row }) => row.original.name_en || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'category_path', 
      header: t('insuranceCodes.fields.categoryPath', {defaultValue: 'Category Path'}),
      cell: ({ row }) => row.original.category_path || t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'requires_preauthorization', 
      header: t('insuranceCodes.fields.requiresPreAuth', {defaultValue: 'Pre-Auth'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.requires_preauthorization ? 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.requires_preauthorization ? t('common.required', {defaultValue: 'Required'}) : t('common.notRequired', {defaultValue: 'Not Required'})}
        </Badge>
      ),
      enableSorting: true,
    },
    { 
      accessorKey: 'is_active', 
      header: t('insuranceCodes.fields.isActive', {defaultValue: 'Status'}),
      cell: ({ row }) => (
        <Badge className={`text-xs ${row.original.is_active ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-300'}`}>
          {row.original.is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})}
        </Badge>
      ),
      enableSorting: true,
    },
  ], [t]);

  if (loading && insuranceCodes.length === 0 && !error) {
    return <LoadingSpinner message={t('messages.loadingData', { item: t('insuranceCodes.itemTitlePlural', { defaultValue: 'insurance codes' }) })} isFullScreen={false} />;
  }

  if (error && insuranceCodes.length === 0) {
    return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={() => fetchInsuranceCodes(true)} />;
  }

  const noItems = pagination.totalCount === 0;
  const noFiltersApplied = Object.values(filters || {}).every(val =>
    !val || (typeof val === 'string' && (val === '' || val === 'all')) || (Array.isArray(val) && val.length === 0)
  );

  return (
    <div className="space-y-4">
      {/* Header with conditional action bar */}
      {isSelectionModeActive ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('bulkActions.selectedCount', { count: selectedItemIds.length })} • {t(`common.${selectionMode}Mode`, { defaultValue: `${selectionMode} Mode` })}
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {selectedItemIds.length === 0 
                    ? t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode}`, { defaultValue: selectionMode }) })
                    : t('bulkActions.itemsSelectedDesc', { count: selectedItemIds.length, entity: t('insuranceCodes.itemTitlePlural', { defaultValue: 'insurance codes' }) })
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={paginatedCodes.length === 0}>
                {selectedItemIds.length === paginatedCodes.length ? t('bulkActions.deselectAll', { defaultValue: 'Deselect All' }) : t('bulkActions.selectAllVisible', { defaultValue: 'Select All Visible' })}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelSelectionMode}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirmAction} 
                disabled={selectedItemIds.length === 0}
                className={selectionMode === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
              >
                {t(`common.${selectionMode}`, { defaultValue: selectionMode })} ({selectedItemIds.length})
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <Shield className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
            {t('insuranceCodes.titleMultiple', { defaultValue: 'Insurance Codes' })} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis', { defaultValue: "..." }) : pagination.totalCount || 0})
          </h3>
          <div className="flex items-center gap-2">
            <GlobalActionButton
              actionsConfig={insuranceCodeGlobalActionsConfig}
              onStartSelectionMode={handleStartSelectionMode}
              itemTypeForActions={t('insuranceCodes.itemTitleSingular', { defaultValue: 'Insurance Code' })}
              t={t} isRTL={isRTL}
            />
            <Button onClick={() => fetchInsuranceCodes(true)} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.refresh', { defaultValue: 'Refresh' })}
            </Button>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); saveToStorage('insuranceCodesView_viewPreference', view); }}
              availableViews={['card', 'table']}
              entityName="insuranceCodes"
              t={t}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <InsuranceCodeFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        allInsuranceCodes={filteredAndSortedCodes || []}
        t={t} language={language} isRTL={isRTL}
        currentView={currentView}
      />

      {/* Error display for partial errors */}
      {error && insuranceCodes.length > 0 && <ErrorDisplay errorMessage={error.message || String(error)} onRetry={() => fetchInsuranceCodes(true)} />}

      {/* Loading indicator for additional data */}
      {loading && insuranceCodes.length > 0 && (
        <LoadingSpinner message={t('messages.loadingMoreData', { defaultValue: 'Loading more data...' })} isFullScreen={false} />
      )}

      {/* Main content based on view */}
      {currentView === 'card' && (
        <>
          {noItems ? (
            <EmptyState
              icon={Shield}
              title={noFiltersApplied
                ? t('insuranceCodes.noCodesYetTitle', { defaultValue: 'No Insurance Codes Yet' })
                : t('insuranceCodes.noCodesMatchTitle', { defaultValue: 'No Insurance Codes Match Filters' })}
              description={noFiltersApplied
                ? t('insuranceCodes.noCodesYetDesc', { defaultValue: 'Get started by adding a new insurance code.' })
                : t('insuranceCodes.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })}
              actionButton={
                noFiltersApplied && (
                  <Button onClick={openInsuranceCodeDialogForAdd} variant="default" size="sm">
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('insuranceCodes.addNew', { defaultValue: 'Add Insurance Code' })}
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedCodes.map(code => (
                <InsuranceCodeCard
                  key={code.id}
                  code={code}
                  currentLocale={getLocaleObject(language)}
                  t={t}
                  isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItemIds.includes(code.id)}
                  onToggleSelection={() => handleToggleSelection(code.id)}
                  onCardClick={openInsuranceCodeDialogForEdit}
                />
              ))}
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
              >
                {t('buttons.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.pageIndicator', { currentPage: pagination.currentPage, totalPages: pagination.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
              >
                {t('buttons.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          )}
        </>
      )}

      {currentView === 'table' && (
        <DataTable
          columns={insuranceCodeColumnsForTable}
          data={paginatedCodes}
          loading={loading}
          error={error}
          onRetry={() => fetchInsuranceCodes(true)}
          entityName={t('insuranceCodes.itemTitlePlural', { defaultValue: 'Insurance Codes' })}
          emptyMessage={noFiltersApplied 
            ? t('insuranceCodes.noCodesYetDesc', { defaultValue: 'Get started by adding a new insurance code.' })
            : t('insuranceCodes.noCodesMatchDesc', { defaultValue: 'Try adjusting your search or filter criteria.' })
          }
          onRowClick={(row) => openInsuranceCodeDialogForEdit(row.original)}
          isSelectionModeActive={isSelectionModeActive}
          selectedRowIds={new Set(selectedItemIds)}
          onRowSelectionChange={(itemId, isSelected) => {
            if (isSelected) {
              setSelectedItemIds(prev => [...prev, itemId]);
            } else {
              setSelectedItemIds(prev => prev.filter(id => id !== itemId));
            }
          }}
          onSelectAllRows={handleSelectAll}
          currentSort={[{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }]}
          onSortChange={(newSortConfig) => {
            if (newSortConfig.length > 0) {
              handleSortChange({
                key: newSortConfig[0].id,
                direction: newSortConfig[0].desc ? 'descending' : 'ascending'
              });
            }
          }}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalCount,
            pageSize: pagination.pageSize
          }}
          onPageChange={handlePageChange}
        />
      )}

      {/* Dialog */}
      {isDialogOpen && (
        <InsuranceCodeDialog
          isOpen={isDialogOpen}
          onClose={handleInsuranceCodeDialogClose}
          insuranceCode={currentItem}
        />
      )}
    </div>
  );
}