
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { RequestForCommitment } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { Checkbox } from '@/components/ui/checkbox';

import RFCDialog from './RFCDialog';
import RFCCard from './RFCCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import RFCFilterBar from './RFCFilterBar';
import ImportDialog from '@/components/common/ImportDialog';

import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';

import {
    Plus, UploadCloud, RefreshCw, AlertTriangle, ClipboardCheck
} from 'lucide-react';

import { format, parseISO, isValid } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Simple useEntityModule implementation for RFCs (defined within this file as per original context)
const useEntityModule = (config) => {
    const {
        entitySDK,
        entityName,
        entityNamePlural,
        initialFilters,
        filterFunction,
        // storageKey, // Not explicitly used in this version of the hook logic
    } = config;

    const { t: i18n_t } = useLanguageHook();
    const { toast } = useToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const [sortConfig, setSortConfig] = useState({ key: 'submitted_at', direction: 'descending' });
    const [pagination, setPagination] = useState({ currentPage: initialFilters.page, pageSize: initialFilters.pageSize, totalItems: 0, totalPages: 0 });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
    const [confirmationDialogDetails, setConfirmationDialogDetails] = useState({
        itemIds: null,
        itemName: '',
        message: '',
        onConfirm: null,
    });

    const handleRefresh = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const fetchedItems = await entitySDK.list('-updated_date');
            const validData = Array.isArray(fetchedItems) ? fetchedItems : [];
            setItems(validData);
            setError(null);
        } catch (err) {
            console.error(`Error fetching ${entityNamePlural}:`, err);
            let errorMessage = i18n_t('errors.fetchFailedGeneral', { item: entityNamePlural});
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [entitySDK, entityNamePlural, i18n_t]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    const filteredAndSortedItems = useMemo(() => {
        let processedItems = Array.isArray(items) ? items.filter(Boolean) : [];

        if (filterFunction) {
            processedItems = processedItems.filter(item => filterFunction(item, filters));
        }

        if (sortConfig.key) {
            processedItems.sort((a, b) => {
                let valA, valB;
                if (['submitted_at', 'procedure_date', 'updated_date', 'created_date', 'validity_start_date', 'validity_end_date'].includes(sortConfig.key)) {
                    valA = a[sortConfig.key] && isValid(parseISO(a[sortConfig.key])) ? parseISO(a[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
                    valB = b[sortConfig.key] && isValid(parseISO(b[sortConfig.key])) ? parseISO(b[sortConfig.key]).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
                } else if (typeof a[sortConfig.key] === 'number') {
                    valA = a[sortConfig.key] || 0;
                    valB = b[sortConfig.key] || 0;
                } else {
                    valA = String(a[sortConfig.key] || '').toLowerCase();
                    valB = String(b[sortConfig.key] || '').toLowerCase();
                }
                
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        setPagination(prev => ({ ...prev, totalItems: processedItems.length, totalPages: Math.ceil(processedItems.length / prev.pageSize) || 1 }));
        return processedItems;
    }, [items, filters, sortConfig, filterFunction, pagination.pageSize]); // Added pagination.pageSize dependency

    const paginatedItems = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        return filteredAndSortedItems.slice(startIndex, startIndex + pagination.pageSize);
    }, [filteredAndSortedItems, pagination.currentPage, pagination.pageSize]);

    const handlePageChange = useCallback((newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    }, []);

    const handlePageSizeChange = useCallback((newPageSize) => {
        setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
        setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
    }, []);

    const handleFilterChange = useCallback((newFiltersObj) => {
        setFilters(prev => ({ ...prev, ...newFiltersObj, page: 1 }));
    }, []);

    const handleSortChange = useCallback((newSortState) => {
        if (newSortState && newSortState.length > 0) {
            const { id, desc } = newSortState[0];
            setSortConfig({ key: id, direction: desc ? 'descending' : 'ascending' });
        } else {
            setSortConfig({ key: 'submitted_at', direction: 'descending' }); // Default sort
        }
    }, []);

    const handleAddNew = useCallback(() => {
        setCurrentItem(null);
        setIsDialogOpen(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    }, []);

    const handleBulkDelete = useCallback(async (idsToDelete) => {
        if (!idsToDelete || idsToDelete.length === 0) return;
        setLoading(true);
        let successCount = 0;
        // let errorCount = 0; // Not used

        for (const id of idsToDelete) {
            try {
                await entitySDK.delete(id);
                successCount++;
            } catch (err) {
                console.error(`Error deleting ${entityName} ${id}:`, err);
                toast({
                    title: i18n_t('errors.deleteFailedTitle'),
                    description: i18n_t('errors.deleteError', { name: `${entityName} #${id?.slice(-6) || 'N/A'}`, error: err.message }),
                    variant: "destructive",
                });
                // errorCount++; // Not used
            }
        }
        setLoading(false);
        if (successCount > 0) {
            toast({
                title: i18n_t('messages.success'),
                description: i18n_t('bulkActions.bulkDeleteSuccess', { count: successCount, entity: entityNamePlural }),
            });
            handleRefresh(true); // force refresh
        }
        setIsConfirmationDialogOpen(false);
        setSelectedItems([]);
        setIsSelectionModeActive(false);
    }, [entitySDK, entityName, entityNamePlural, handleRefresh, toast, i18n_t]);

    const handleDeleteConfirmation = useCallback((itemIds, itemName) => { // Renamed from handleDelete to avoid conflict
        setIsConfirmationDialogOpen(true);
        setConfirmationDialogDetails({
            itemIds: itemIds,
            itemName: itemName,
            message: i18n_t('bulkActions.deleteConfirmMessage', { count: itemIds.length, itemName: itemName.toLowerCase() }),
            onConfirm: () => handleBulkDelete(itemIds),
        });
    }, [handleBulkDelete, i18n_t]);

    const handleToggleSelection = useCallback((itemId) => {
        setSelectedItems(prevIds => {
            const newSelectedIds = new Set(prevIds);
            if (newSelectedIds.has(itemId)) newSelectedIds.delete(itemId);
            else newSelectedIds.add(itemId);
            const currentSelectedArray = Array.from(newSelectedIds);
            // setIsSelectionModeActive(currentSelectedArray.length > 0); // This is now handled by useEffect
            return currentSelectedArray;
        });
    }, []);
    
    const handleSelectAll = useCallback(() => {
        const allVisibleValidItemIds = paginatedItems.filter(item => item && item.id != null).map(item => item.id);
        const allCurrentlySelectedOnPage = allVisibleValidItemIds.length > 0 && allVisibleValidItemIds.every(id => selectedItems.includes(id));
        
        if (allCurrentlySelectedOnPage) {
            // Deselect all on current page
            setSelectedItems(prevSelected => prevSelected.filter(id => !allVisibleValidItemIds.includes(id)));
        } else {
            // Select all on current page, adding to existing selection from other pages
            setSelectedItems(prevSelected => Array.from(new Set([...prevSelected, ...allVisibleValidItemIds])));
        }
        // setIsSelectionModeActive will be updated by useEffect watching selectedItems
    }, [paginatedItems, selectedItems]);


    const handleSelfSubmittingDialogClose = useCallback((refreshNeeded, operationType = null, itemIdParam = '') => {
        setIsDialogOpen(false);
        setCurrentItem(null);
        if (refreshNeeded) {
            handleRefresh(true); // force refresh
            const nameToDisplay = itemIdParam || i18n_t('common.item');
            if (operationType === 'create') {
                toast({ title: i18n_t('messages.success'), description: i18n_t('common.createSuccess', { name: nameToDisplay }) });
            } else if (operationType === 'update') {
                toast({ title: i18n_t('messages.success'), description: i18n_t('common.updateSuccess', { name: nameToDisplay }) });
            }
        }
    }, [handleRefresh, i18n_t, toast]);
    
    // Effect to update selection mode active state based on selectedItems length
    useEffect(() => {
        setIsSelectionModeActive(selectedItems.length > 0);
    }, [selectedItems]);

    return {
        items: paginatedItems, // Use the paginated items
        filteredAndSortedItems, // This contains all filtered/sorted items, not just current page
        loading,
        error,
        filters,
        setFilters, // Not used directly by RFCTab, but part of hook's return
        sortConfig,
        setSortConfig, // Not used directly by RFCTab, but part of hook's return
        pagination,
        // setPagination, // Not used directly by RFCTab
        selectedItems,
        setSelectedItems, 
        isDialogOpen,
        setIsDialogOpen,
        currentItem,
        setCurrentItem,
        handleRefresh,
        handleFilterChange,
        handleSortChange, // This is for DataTable, maps to tanstack table's onSortingChange
        handlePageChange,
        handlePageSizeChange,
        handleAddNew,
        handleEdit,
        handleBulkDelete: (ids) => { // This is the one called by GlobalActionButton
            if (ids.length > 0) {
                // Find one item to display its name if only one, otherwise use plural
                const firstItem = items.find(r => r.id === ids[0]); // items is all fetched items
                const itemName = ids.length === 1 
                    ? `${entityName} #${firstItem?.id?.slice(-6) || 'N/A'}` 
                    : entityNamePlural;
                handleDeleteConfirmation(ids, itemName);
            }
        },
        isSelectionModeActive,
        setIsSelectionModeActive, // Allow direct control if needed
        handleToggleSelection,
        handleSelectAll,
        handleSelfSubmittingDialogClose,
        isConfirmationDialogOpen,
        setIsConfirmationDialogOpen,
        confirmationDialogDetails,
        // setConfirmationDialogDetails, // Not used directly by RFCTab
    };
};

export default function RFCTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  // Move isImportDialogOpen state declaration before it's used in memoizedGlobalActionsConfig
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const entityConfig = useMemo(() => ({
    entitySDK: RequestForCommitment,
    entityName: t('rfc.itemTitleSingular', {defaultValue: 'RFC'}),
    entityNamePlural: t('rfc.titleMultiple', {defaultValue: 'RFCs'}),
    initialFilters: {
      searchTerm: '',
      status: 'all',
      provider_id: 'all', 
      doctor_id: 'all',
      insured_id: 'all',
      procedureDateFrom: '', 
      procedureDateTo: '', 
      page: 1,
      pageSize: 10,
    },
    filterFunction: (rfc, filters) => {
        if (!rfc) return false; // Ensure rfc object exists
        const { searchTerm, status, provider_id, procedureDateFrom, procedureDateTo } = filters;
        let match = true;

        if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            match = match && (
                (rfc.insured_name && String(rfc.insured_name).toLowerCase().includes(termLower)) ||
                (rfc.provider_name && String(rfc.provider_name).toLowerCase().includes(termLower)) ||
                (rfc.doctor_name && String(rfc.doctor_name).toLowerCase().includes(termLower)) ||
                (rfc.policy_number && String(rfc.policy_number).toLowerCase().includes(termLower)) ||
                (Array.isArray(rfc.procedure_codes) && rfc.procedure_codes.some(code => String(code).toLowerCase().includes(termLower)))
            );
        }
        if (status !== 'all') match = match && (rfc.status === status);
        if (provider_id !== 'all') match = match && (rfc.provider_id === provider_id); 
        
        if (procedureDateFrom) {
            match = match && rfc.procedure_date && new Date(rfc.procedure_date) >= new Date(procedureDateFrom);
        }
        if (procedureDateTo) {
            match = match && rfc.procedure_date && new Date(rfc.procedure_date) <= new Date(procedureDateTo);
        }

        return match;
    },
    storageKey: 'rfcs_view_preference', // Used for localStorage
  }), [t]);

  const {
    items: paginatedRFCs, // These are the items for the current page
    // filteredAndSortedItems, // All items after filtering/sorting (not just current page)
    loading,
    error,
    filters,
    setFilters, // used by RFCFilterBar
    sortConfig,
    // setSortConfig, // Used by RFCFilterBar, passed as onSortChange
    pagination,
    selectedItems,
    setSelectedItems, 
    isDialogOpen: isRFCDialogOpen,
    setIsDialogOpen: setIsRFCDialogOpen,
    currentItem: currentRFC,
    // setCurrentItem: setCurrentRFC, // Done via handleEdit
    handleRefresh: refreshRFCs,
    // handleFilterChange, // Done via setFilters from RFCFilterBar
    handleSortChange: handleDataTableSortChange, // For DataTable
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive, // For GlobalActionButton
    handleToggleSelection,
    handleSelectAll: handleSelectAllVisible, // For DataTable select all
    handleSelfSubmittingDialogClose,
    isConfirmationDialogOpen,
    setIsConfirmationDialogOpen,
    confirmationDialogDetails,
  } = useEntityModule(entityConfig);
  
  const [allProviders, setAllProviders] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allInsuredPersons, setAllInsuredPersons] = useState([]);
  
  const currentLocale = getLocaleObject(language);
  const totalItems = pagination.totalItems; // Use totalItems from pagination object
  const totalPages = pagination.totalPages; // Use totalPages from pagination object

  useEffect(() => {
    const fetchRelatedEntities = async () => {
      try {
        const [providersData, doctorsData, insuredPersonsData] = await Promise.all([
          Provider.list(),
          Doctor.list(),
          InsuredPerson.list()
        ]);
        setAllProviders(Array.isArray(providersData) ? providersData : []);
        setAllDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        setAllInsuredPersons(Array.isArray(insuredPersonsData) ? insuredPersonsData : []);
      } catch (err) {
        console.error("Error fetching related entities:", err);
        toast({
          title: t('errors.fetchFailedGeneral', { item: t('common.relatedData') }),
          description: err.message || t('errors.unknown'),
          variant: "destructive"
        });
      }
    };
    fetchRelatedEntities();
  }, [t, toast]);

  const [currentView, setCurrentView] = useState(localStorage.getItem(entityConfig.storageKey) || 'card');

  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentView(passedView);
    }
  }, [passedView, currentView]);

  // Now memoizedGlobalActionsConfig can safely use setIsImportDialogOpen
  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'buttons.addNewRFC', defaultLabel: 'New RFC', icon: Plus, action: handleAddNew, type: 'add'},
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true) },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, setIsImportDialogOpen, t]); // Fixed: setIsImportDialogOpen is now available

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.length === 1) {
      const rfcIdToEdit = selectedItems[0];
      // Need all items to find the one to edit, not just paginated ones
      // This requires 'filteredAndSortedItems' from the hook, or fetching the item by ID
      // For simplicity, assuming paginatedRFCs might contain it if it was just selected
      // A more robust solution fetches by ID or uses the full list.
      // Let's assume useEntityModule's 'items' (which are paginatedRFCs here) are what we need
      // Or, use the `items` from useEntityModule if it represents all items.
      // The current `useEntityModule` returns `paginatedItems` as `items`.
      // So, this might require fetching all items again or storing them.
      // For now, this will find from currently visible items.
      const rfcToEdit = paginatedRFCs.find(r => r.id === rfcIdToEdit); 
      if (rfcToEdit) {
        handleEdit(rfcToEdit);
      } else {
         // If not found in paginated, it might be on another page. This is a limitation here.
         toast({ title: t('bulkActions.itemNotVisibleTitle'), description: t('bulkActions.itemNotVisibleToEditDesc'), variant: 'warning' });
      }
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemToEditDesc', { entity: t('rfc.itemTitleSingular') }) });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', {entity: t('rfc.titleMultiple')}), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, paginatedRFCs]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.length > 0) {
      handleBulkDelete(selectedItems);
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle'), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('rfc.titleMultiple') }) });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems([]);
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleConfirmDelete = useCallback(() => {
      if (confirmationDialogDetails && typeof confirmationDialogDetails.onConfirm === 'function') {
        confirmationDialogDetails.onConfirm(); 
      }
  }, [confirmationDialogDetails]);

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" });
      return;
    }
    
    const rfcsToCreate = records.map(rec => ({
        provider_id: rec['Provider ID'] || rec['provider_id'],
        doctor_id: rec['Doctor ID'] || rec['doctor_id'],
        insured_id: rec['Insured ID'] || rec['insured_id'],
        policy_id: rec['Policy ID'] || rec['policy_id'],
        procedure_date: rec['Procedure Date'] || rec['procedure_date'],
        procedure_codes: (rec['Procedure Codes'] || rec['procedure_codes'])?.split(',').map(s => String(s).trim()).filter(Boolean) || [],
        diagnosis_codes: (rec['Diagnosis Codes'] || rec['diagnosis_codes'])?.split(',').map(s => String(s).trim()).filter(Boolean) || [],
        notes: rec['Notes'] || rec['notes'],
        status: String(rec['Status'] || rec['status'] || 'draft').toLowerCase(),
    })).filter(r => r.provider_id && r.insured_id && r.procedure_date && r.procedure_codes?.length > 0);

    if(rfcsToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('rfc.titleMultiple')}), variant: 'warning'});
        return;
    }

    setLoading(true); // Show loading during import
    let successCount = 0; let errorCount = 0;
    for (const rfcData of rfcsToCreate) {
        try { await RequestForCommitment.create(rfcData); successCount++; }
        catch (err) { console.error("Error creating RFC from import:", err, rfcData); errorCount++; }
    }
    setLoading(false);
    toast({
        title: t('import.completedTitle'),
        description: t('import.completedDesc', {successCount, errorCount, entity: t('rfc.titleMultiple')}),
    });
    if (successCount > 0) refreshRFCs(true);
  };

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value); // Tanstack table internal state
            // This is handled by handleSelectAllVisible which will update selectedItems and trigger the useEffect
            handleSelectAllVisible(); // Updates main selectedItems state via useEntityModule's handleSelectAll
          }}
          aria-label={t('bulkActions.selectAllVisible', {defaultValue: "Select all visible"})}
          className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value); // Tanstack table internal state
            handleToggleSelection(row.original.id); // Updates main selectedItems state
          }}
          aria-label={t('bulkActions.selectRow', {defaultValue: "Select row"})}
          className="border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: t('fields.insured', { defaultValue: "Insured" }),
      accessorKey: 'insured_name', // This might need to be a custom accessor if name is not directly on RFC
      cell: ({ row }) => {
          const item = row.original;
          // Assuming insured_name and policy_number are directly on the RFC item
          return (
              <div>
                  <div>{item.insured_name || t('common.notSet', {defaultValue: 'N/A'})}</div>
                  {item.policy_number && <div className="text-xs text-gray-500">{t('fields.policyNumberShort', {defaultValue: 'Policy:'})} {item.policy_number}</div>}
              </div>
          );
      }
    },
    {
      header: t('fields.provider', { defaultValue: "Provider" }),
      accessorKey: 'provider_name', // Assuming provider_name is directly on the RFC item
       cell: ({ row }) => row.original.provider_name || t('common.unknownProvider', {defaultValue: "Unknown Provider"})
    },
    {
      header: t('fields.doctor', { defaultValue: "Doctor" }),
      accessorKey: 'doctor_name', // Assuming doctor_name is directly on the RFC item
      cell: ({ row }) => row.original.doctor_name || t('common.unknownDoctor', {defaultValue: "Unknown Doctor"})
    },
    {
      header: t('fields.procedureDate', { defaultValue: "Procedure Date" }),
      accessorKey: 'procedure_date',
      cell: ({ row }) => {
        const date = row.original.procedure_date;
        return date && isValid(parseISO(date)) ? format(parseISO(date), 'PP', { locale: currentLocale }) : t('common.notSet', {defaultValue: 'N/A'});
      }
    },
    {
      header: t('fields.status', { defaultValue: "Status" }),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusText = t(`status.${status}`, { defaultValue: status });
        let badgeVariant = 'outline'; 
        if (status === 'approved' || status === 'partially_approved') badgeVariant = 'success';
        else if (status === 'rejected' || status === 'cancelled') badgeVariant = 'destructive';
        else if (status === 'submitted' || status === 'in_review') badgeVariant = 'info';
        else badgeVariant = 'secondary'; // Default for other statuses
        return <Badge variant={badgeVariant}>{statusText}</Badge>;
      }
    },
    {
      header: t('fields.approvedAmount', { defaultValue: "Approved Amt" }),
      accessorKey: 'approved_amount',
      cell: ({ row }) => {
        const item = row.original;
        return item.approved_amount != null ? `${Number(item.approved_amount).toFixed(2)} ${item.currency || 'ILS'}` : t('common.notSet', {defaultValue: 'N/A'});
      }
    },
    {
      header: t('fields.created', { defaultValue: "Created" }),
      accessorKey: 'created_date',
      cell: ({ row }) => {
        const date = row.original.created_date;
        return date && isValid(parseISO(date)) ? format(parseISO(date), 'PP', { locale: currentLocale }) : t('common.notSet', {defaultValue: 'N/A'});
      }
    },
    {
      id: 'actions',
      header: () => <div className={isRTL ? "text-right" : "text-left"}>{t('common.actions', {defaultValue: 'Actions'})}</div>,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
          {t('common.edit', {defaultValue: 'Edit'})}
        </Button>
      ),
    },
  ], [t, isRTL, currentLocale, handleEdit, handleToggleSelection, handleSelectAllVisible]); // Dependencies for columns

  if (loading && paginatedRFCs.length === 0 && !error) { 
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('rfc.titleMultiple')})} /></div>;
  }

  return (
    <div className="space-y-4 pb-8"> {/* Added pb-8 for some bottom padding */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <ClipboardCheck className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
          {t('rfc.titleMultiple')} ({totalItems})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditWithSelectionCheck}
                onDeleteItems={handleDeleteWithSelectionCheck}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('rfc.itemTitleSingular', {defaultValue: 'RFC'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={() => refreshRFCs(true)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh')}
            </Button>
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentView(view); handleCancelSelectionMode(); localStorage.setItem(entityConfig.storageKey, view);}}
                availableViews={['card', 'table']}
                entityName={t('rfc.titleMultiple')}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <RFCFilterBar
        filters={filters}
        onFiltersChange={(newFiltersObj) => setFilters(prev => ({...prev, ...newFiltersObj, page: 1}))}
        onResetFilters={() => {
          setFilters({ searchTerm: '', status: 'all', provider_id: 'all', doctor_id: 'all', insured_id: 'all', procedureDateFrom: '', procedureDateTo: '', page: 1, pageSize: filters.pageSize });
          // setSortConfig({ key: 'submitted_at', direction: 'descending' }); // Reset sort if needed, RFCFilterBar might handle its own sort display
          handleCancelSelectionMode();
          toast({
              title: t('filters.clearedTitle'),
              description: t('filters.filtersReset', { item: t('rfc.titleMultiple') }),
          });
        }}
        sortConfig={sortConfig} // Pass current sortConfig
        onSortChange={(key) => { // Allow RFCFilterBar to change sort
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending'; // Cycle through if same key
            // For card view, if sorting is applied via filter bar, it should update sortConfig.
            // Let's assume RFCFilterBar calls a general onSortChange that updates useEntityModule's sortConfig.
            // The useEntityModule's handleSortChange expects a Tanstack-like object.
            // If RFCFilterBar provides a simple key, we adapt:
            handleDataTableSortChange([{id: key, desc: direction === 'descending'}]);
        }}
        // allRFCs={filteredAndSortedItems} // This was potentially large, remove if not strictly needed for filter options
        allProviders={allProviders}
        allDoctors={allDoctors}
        allInsuredPersons={allInsuredPersons}
        t={t} language={language} isRTL={isRTL}
      />
      
      {error && (paginatedRFCs.length === 0) && ( 
         <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
                <Button variant="outline" size="sm" onClick={() => refreshRFCs(true)} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow')}
                </Button>
            </CardContent>
        </Card>  
      )}

      {!loading && !error && paginatedRFCs.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title={t('rfc.noRFCsMatchTitle')}
          message={t('rfc.noRFCsDesc')}
          actionButton={
            <Button onClick={handleAddNew}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewRFC', {defaultValue: 'New RFC'})}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {(!error || paginatedRFCs.length > 0) && (paginatedRFCs.length > 0 || (loading && totalItems > 0)) && ( /* Adjusted loading check */
        <>
          {currentView === 'card' && paginatedRFCs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedRFCs.map((rfc) => (
                <RFCCard
                  key={rfc.id}
                  rfc={rfc}
                  currentLocale={currentLocale}
                  t={t} isRTL={isRTL}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.includes(rfc.id)}
                  onToggleSelection={() => handleToggleSelection(rfc.id)}
                  onCardClick={() => { if (!isSelectionModeActive) handleEdit(rfc);}} // Make cards editable on click if not selecting
                />
              ))}
            </div>
          )}

          {currentView === 'table' && (
            <DataTable
              columns={columns}
              data={paginatedRFCs}
              loading={loading && paginatedRFCs.length === 0} // Show loading only if no data yet
              error={null} // Error is handled above
              entityName={t('rfc.titleMultiple')}
              pagination={{
                currentPage: pagination.currentPage,
                pageSize: pagination.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
              onSortChange={handleDataTableSortChange} // This is for Tanstack table's onSortingChange
              currentSort={sortConfig.key ? [{ id: sortConfig.key, desc: sortConfig.direction === 'descending' }] : []}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={Object.fromEntries(selectedItems.map(id => [id, true]))} // Tanstack expects an object for row selection state
              onRowSelectionChange={(updater) => { // Tanstack provides an updater function or an object
                if (typeof updater === 'function') {
                    const newSelectedRowIdsObject = updater(Object.fromEntries(selectedItems.map(id => [id, true])));
                    setSelectedItems(Object.keys(newSelectedRowIdsObject).filter(key => newSelectedRowIdsObject[key]));
                } else { // It's an object
                    setSelectedItems(Object.keys(updater).filter(key => updater[key]));
                }
              }}
              onSelectAllRows={handleSelectAllVisible} // This should be handled by table's internal select all
              onRowClick={({original: item}) => {if (!isSelectionModeActive && item?.id) handleEdit(item);}}
              t={t} language={language} isRTL={isRTL}
            />
          )}
          
          {/* Card View Pagination Controls - Ensure this section is syntactically correct */}
          {currentView === 'card' && totalPages > 1 && (
             <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous')}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= totalPages}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {isRFCDialogOpen && (
        <RFCDialog
          isOpen={isRFCDialogOpen}
          onClose={handleSelfSubmittingDialogClose}
          rfcData={currentRFC}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}  
          entityName={t('rfc.titleMultiple')}
          onImport={handleImportSubmit}
          sampleHeaders={['Provider ID', 'Doctor ID', 'Insured ID', 'Policy ID', 'Procedure Date (YYYY-MM-DD)', 'Procedure Codes (comma-separated)', 'Diagnosis Codes (comma-separated)', 'Notes', 'Status (draft/submitted/in_review/approved/rejected)']}
          language={language}
          t={t} // Pass t for internal translations if needed
        />
      )}

      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onOpenChange={setIsConfirmationDialogOpen}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', { item: confirmationDialogDetails.itemName || t('rfc.itemTitleSingular'), count: confirmationDialogDetails.itemIds?.length || 1})}
        description={confirmationDialogDetails.message}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={loading && isConfirmationDialogOpen} // Show loading on dialog if main loading is active for this action
        t={t} isRTL={isRTL}
      />
    </div>
  );
}
