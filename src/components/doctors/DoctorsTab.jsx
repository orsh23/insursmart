
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doctor } from '@/api/entities';
import { City } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, UploadCloud, RefreshCw, DownloadCloud, UserPlus, Users, SearchX } from 'lucide-react';
import DoctorDialog from './DoctorDialog';
import DoctorCard from './DoctorCard';
import DoctorFilterBar from './DoctorFilterBar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import StatusBadge from '@/components/common/StatusBadge';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import ImportDialog from '@/components/common/ImportDialog';
import DataTable from '@/components/ui/data-table'; 
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { getLocalizedValue } from '@/lib/utils';
import { useEntityModule } from '@/components/hooks/useEntityModule';

export default function DoctorsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [cities, setCities] = useState([]); // For filter options

  // Fetch cities for filter dropdown with aggressive rate limiting protection
  useEffect(() => {
    const fetchCities = async () => {
      try {
        // Add significant delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        const cityData = await City.list(undefined, 100, undefined, ['name_en', 'name_he']); // Reduced limit
        if (Array.isArray(cityData)) {
          const cityOptions = cityData.map(c => ({
            value: language === 'he' ? (c.name_he || c.name_en) : (c.name_en || c.name_he),
            label: language === 'he' ? (c.name_he || c.name_en) : (c.name_en || c.name_he)
          })).filter(c => c.value).sort((a,b) => a.label.localeCompare(b.label));
          setCities([...new Set(cityOptions.map(c => c.label))]);
        }
      } catch (error) {
        console.error("Error fetching cities for doctor filters:", error);
        // Silently fail for cities to not disrupt main functionality
      }
    };
    
    // Delay the fetch significantly to avoid conflicts with main data loading  
    const timeoutId = setTimeout(fetchCities, 4000); // Wait 4 seconds
    return () => clearTimeout(timeoutId);
  }, [language]);


  const entityConfig = useMemo(() => ({
    entitySDK: Doctor,
    entityName: t('doctors.entityNameSingular', { defaultValue: 'Doctor' }),
    entityNamePlural: t('doctors.titleMultiple', { defaultValue: 'Doctors' }),
    DialogComponent: DoctorDialog,
    initialSort: [{ id: 'last_name_en', desc: false }],
    initialFilters: {
      searchTerm: '',
      specialty: 'all',
      status: 'all',
      city: 'all', // Legacy city field, not address_id. Filtering by address_id is complex client-side
    },
    searchFields: ['first_name_en', 'last_name_en', 'first_name_he', 'last_name_he', 'license_number', 'email', 'specialties', 'sub_specialties', 'city'], // Include city for legacy search
    filterFunction: (item, filters) => {
        const term = filters.searchTerm?.toLowerCase();
        if (term) {
            const nameEn = `${item.first_name_en || ''} ${item.last_name_en || ''}`.toLowerCase();
            const nameHe = `${item.first_name_he || ''} ${item.last_name_he || ''}`.toLowerCase();
            if (!(nameEn.includes(term) || nameHe.includes(term) ||
                  item.license_number?.toLowerCase().includes(term) ||
                  item.email?.toLowerCase().includes(term) ||
                  (Array.isArray(item.specialties) && item.specialties.some(s => s?.toLowerCase().includes(term))) ||
                  (Array.isArray(item.sub_specialties) && item.sub_specialties.some(s => s?.toLowerCase().includes(term))) ||
                   item.city?.toLowerCase().includes(term) // Legacy city check
                 )) return false;
        }
        if (filters.specialty !== 'all' && (!Array.isArray(item.specialties) || !item.specialties.includes(filters.specialty))) {
             if (!Array.isArray(item.sub_specialties) || !item.sub_specialties.includes(filters.specialty)) return false;
        }
        if (filters.status !== 'all' && item.status !== filters.status) return false;
        // Filtering by item.address_id (structured address) would require fetching address details,
        // which is complex for client-side filtering. For now, we filter by legacy `city`.
        if (filters.city !== 'all' && item.city?.toLowerCase() !== filters.city?.toLowerCase()) return false;
        
        return true;
    },
    storageKey: 'doctors', // Use a specific key for this entity's storage
  }), [t]);

  const {
    items: doctors,
    loading, error, filters, sortConfig, pagination, selectedItems, setSelectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshDoctors,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // All items after filtering and sorting
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentView] = useState(() => {
    try {
      return loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card');
    } catch (e) {
      return 'card';
    }
  });
  
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
      try {
        saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
      } catch (e) {
        console.warn('Failed to save view preference:', e);
      }
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const itemToEdit = filteredAndSortedItems.find(it => it.id === selectedItems[0]);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle', {defaultValue: "Item Not Found"}), description: t('errors.itemNotFoundToEditDesc', {defaultValue: "The item selected for editing could not be found."}), variant: "warning" });
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.edit', {defaultValue: 'Edit'})}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.edit', {defaultValue: 'Edit'})}), variant: "info" });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', {defaultValue: "Select One Item"}), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName, defaultValue: `Please select exactly one ${entityConfig.entityName} to edit.` }), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural, defaultValue: `Are you sure you want to delete ${selectedItems.length} ${entityConfig.entityNamePlural}? This action cannot be undone.` }))) {
        handleBulkDelete(selectedItems);
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeActiveTitle', {mode: t('common.delete', {defaultValue: 'Delete'})}), description: t('bulkActions.selectItemsPromptShort', {mode: t('common.delete', {defaultValue: 'Delete'})}), variant: "info" });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]);
  
  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]); // from useEntityModule
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    try {
      saveToStorage(entityConfig.storageKey + '_viewPreference', view);
    } catch (e) {
      console.warn('Failed to save view preference:', e);
    }
    handleCancelSelectionMode();
  }, [entityConfig.storageKey, handleCancelSelectionMode]);


  const memoizedGlobalActionsConfig = useMemo(() => {
    const baseActions = [
      { labelKey: 'doctors.addNewDoctor', defaultLabel: 'Add New Doctor', icon: UserPlus, action: handleAddNew, type: 'add' },
      { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
      { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
      { isSeparator: true },
      { labelKey: 'buttons.import', defaultLabel: 'Import Doctors', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import', { defaultValue: 'Import'}) }) }), disabled: true, type: 'import' },
      { labelKey: 'buttons.export', defaultLabel: 'Export Doctors', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export', { defaultValue: 'Export'}) }) }), disabled: true, type: 'export' },
    ];
    return [...baseActions, ...(externalActionsConfig || [])];
  }, [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const doctorTableColumns = useMemo(() => [
    { 
      accessorKey: language === 'he' ? 'last_name_he' : 'last_name_en', // For display, sorting might need specific handling
      header: t('doctors.fields.lastName', {defaultValue: 'Last Name'}), 
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'last_name', language, 'en', t('common.notSet', { defaultValue: 'N/A' }))
    },
    { 
      accessorKey: language === 'he' ? 'first_name_he' : 'first_name_en', 
      header: t('doctors.fields.firstName', {defaultValue: 'First Name'}), 
      enableSorting: true,
      cell: ({ row }) => getLocalizedValue(row.original, 'first_name', language, 'en', t('common.notSet', { defaultValue: 'N/A' }))
    },
    { accessorKey: 'license_number', header: t('doctors.fields.licenseNumber', {defaultValue: 'License No.'}), enableSorting: true, cell: ({row}) => row.original.license_number || t('common.notSet', {defaultValue: 'N/A'}) },
    { 
      accessorKey: 'specialties', 
      header: t('doctors.fields.specialties', {defaultValue: 'Specialties'}), 
      cell: ({ row }) => Array.isArray(row.original.specialties) && row.original.specialties.length > 0 
                        ? row.original.specialties.map(s => <Badge key={s} variant="secondary" className="mr-1 mb-1">{t(`doctorSpecialties.${s.replace(/\s+/g, '_')}`, {defaultValue: s})}</Badge>) 
                        : t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: false // Sorting arrays is complex
    },
    { 
      accessorKey: 'status', 
      header: t('doctors.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
      enableSorting: true
    },
    { 
      accessorKey: 'email', 
      header: t('doctors.fields.email', {defaultValue: 'Email'}), 
      enableSorting: true,
      cell: ({row}) => row.original.email || t('common.notSet', {defaultValue: 'N/A'})
    },
    { 
      accessorKey: 'phone', 
      header: t('doctors.fields.phone', {defaultValue: 'Phone'}), 
      enableSorting: false, // Phone numbers can be tricky to sort meaningfully
      cell: ({row}) => row.original.phone || t('common.notSet', {defaultValue: 'N/A'})
    },
  ], [t, language]);

  const renderContent = () => {
    // If loading and no data available yet (not even cached), show full spinner.
    // If error and no data available, show error display.
    if (loading && doctors.length === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
    }
    // If there's a critical error and no data to display, show error display.
    if (error && doctors.length === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshDoctors} t={t} isRTL={isRTL} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => !val || val === 'all' || key === 'page' || key === 'pageSize');

    if (currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={Users}
              title={t('doctors.emptyState.noDoctorsTitle', {defaultValue: "No Doctors Found"})}
              message={t('doctors.emptyState.noDoctorsDesc', {defaultValue: "Start by adding a new doctor to manage their details."})}
              actionButton={<Button onClick={handleAddNew} className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"><UserPlus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />{t('doctors.addNewDoctor')}</Button>}
              t={t} isRTL={isRTL}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={SearchX}
              title={t('doctors.emptyState.noDoctorsMatchTitle', {defaultValue: "No Doctors Match Filters"})}
              message={t('doctors.emptyState.noDoctorsMatchDesc', {defaultValue: "Try adjusting your search or filter criteria."})}
              t={t} isRTL={isRTL}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {doctors.map(doctor => (
                <DoctorCard 
                  key={doctor.id} 
                  doctor={doctor} 
                  onEdit={() => !isSelectionModeActive && handleEdit(doctor)} // Prevent edit if in selection mode from card click
                  onCardClick={() => !isSelectionModeActive && handleEdit(doctor)}
                  language={language}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(doctor.id)}
                  onToggleSelection={() => handleToggleSelection(doctor.id)}
                  t={t} isRTL={isRTL}
                />
              ))}
            </div>
          )}
          {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                {t('buttons.previous', { defaultValue: 'Previous'})}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1 })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                {t('buttons.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          )}
        </>
      );
    }
    
    if (currentView === 'table') {
        return (
            <DataTable
                columns={doctorTableColumns}
                data={doctors} // paginatedItems
                loading={loading}
                error={null} // Error handled by top-level ErrorDisplay/Toast
                onRetry={refreshDoctors}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('doctors.emptyState.noDoctorsDesc') : t('doctors.emptyState.noDoctorsMatchDesc')}
                onRowClick={({original: item}) => !isSelectionModeActive && item?.id && handleEdit(item)} // Or open details drawer
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={new Set(selectedItems)}
                onRowSelectionChange={handleToggleSelection}
                onSelectAllRows={() => handleSelectAll(doctors.map(d => d.id))}
                currentSort={sortConfig.length > 0 ? [{ id: sortConfig[0].id, desc: sortConfig[0].desc }] : []}
                onSortChange={(newSortState) => {
                  if (newSortState && newSortState.length > 0) {
                    const { id, desc } = newSortState[0];
                    handleSortChange([{ id, desc }]);
                  } else {
                    handleSortChange(entityConfig.initialSort);
                  }
                }}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    itemsPerPageOptions: [10, 20, 50, 100],
                }}
                t={t} language={language} isRTL={isRTL}
            />
        );
    }
    return null;
  };

  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Users className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5 text-gray-600 dark:text-gray-400`} />
          {t('doctors.titleMultiple', {defaultValue: "Doctors"})} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis', {defaultValue: 'Loading...'}) : pagination.totalCount || 0})
        </h3>
        <div className="flex items-center gap-2">
          <GlobalActionButton
            actionsConfig={memoizedGlobalActionsConfig}
            isSelectionModeActive={isSelectionModeActive}
            onCancelSelectionMode={handleCancelSelectionMode}
            selectedItemCount={selectedItems.length}
            itemTypeForActions={entityConfig.entityName}
            t={t} isRTL={isRTL}
          />
          <Button onClick={refreshDoctors} variant="outline" size="sm" disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
            {t('buttons.refresh', {defaultValue: 'Refresh'})}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={handleViewChange}
            availableViews={['card', 'table']}
            entityName={t('pageTitles.doctors', {defaultValue: 'Doctors'})}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>
      
      <DoctorFilterBar 
        filters={filters} 
        onFiltersChange={handleFilterChange}
        onResetFilters={() => {
            handleFilterChange(null, entityConfig.initialFilters);
            handleSortChange(entityConfig.initialSort);
            handleCancelSelectionMode();
        }}
        sortConfig={sortConfig.length > 0 ? { key: sortConfig[0].id, direction: sortConfig[0].desc ? 'descending' : 'ascending' } : {key: entityConfig.initialSort[0].id, direction: entityConfig.initialSort[0].desc ? 'descending' : 'ascending' }}
        onSortChange={(newSortKey) => {
            const currentSortField = sortConfig[0]?.id;
            const currentDesc = sortConfig[0]?.desc;
            handleSortChange([{ id: newSortKey, desc: currentSortField === newSortKey ? !currentDesc : false }]);
        }}
        cityOptions={cities} // Pass fetched city options
        t={t} language={language} isRTL={isRTL}
      />

      {error && doctors.length > 0 && (
        <div className="p-3 mb-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
           <SearchX className="h-4 w-4" />
           <span>{t('errors.partialLoadWarning', { entity: t('pageTitles.doctors', {defaultValue: 'Doctors'}), message: String(error.message || error)})}</span>
        </div>
      )}
      {loading && doctors.length > 0 && <LoadingSpinner message={t('messages.updatingData', {item: entityConfig.entityNamePlural})} isFullScreen={false} />}

      {renderContent()}

      {isDialogOpen && (
        <DoctorDialog
          isOpen={isDialogOpen}
          onCloseDialog={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          doctor={currentItem}
          // Pass all specialties and cities from the full data for filter/dialog dropdowns
          allSpecialties={Array.from(new Set(filteredAndSortedItems.flatMap(d => (d.specialties || []).concat(d.sub_specialties || [])).filter(Boolean)))}
          allCities={cities}
          t={t} language={language} isRTL={isRTL}
        />
      )}
    </div>
  );
}
