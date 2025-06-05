
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Claim } from '@/api/entities';
import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
// Removed useEntityModule import, it's now defined inline
import ClaimDialog from './ClaimDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, he } from 'date-fns/locale'; // For date formatting locale
import { Plus, DollarSign, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'; // Added RefreshCw, ArrowUpDown, ArrowUp, ArrowDown for refresh button and table sorting
import GlobalActionButton from '@/components/common/GlobalActionButton'; // Fixed import path
// Create inline components for missing shared components

// Inline RefreshButton component
const RefreshButton = ({ onClick, isLoading, tooltipContent }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={isLoading}
    title={tooltipContent}
    className="flex items-center gap-2"
  >
    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
    <span className="hidden sm:inline">Refresh</span>
  </Button>
);

// Inline ViewSwitcher component
const ViewSwitcher = ({ currentView, onViewChange, t }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">{t('views.view', { defaultValue: 'View' })}:</span>
    <Button
      variant={currentView === 'table' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onViewChange('table')}
    >
      {t('views.table', { defaultValue: 'Table' })}
    </Button>
    <Button
      variant={currentView === 'card' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onViewChange('card')}
    >
      {t('views.cards', { defaultValue: 'Cards' })}
    </Button>
  </div>
);

// Inline FilterBar component
const FilterBar = ({ filters, onFilterChange, onSearch, searchPlaceholder, filterFields, t }) => (
  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
    <div className="flex-1">
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={filters.searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
    </div>
    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
      {filterFields.map(field => (
        <select
          key={field.name}
          value={filters[field.name] || 'all'}
          onChange={(e) => onFilterChange(field.name, e.target.value)}
          className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  </div>
);

// Inline ErrorDisplay component
const ErrorDisplay = ({ error, onRetry, t }) => (
  error ? (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center dark:bg-red-950 dark:border-red-900">
      <p className="text-red-600 dark:text-red-200">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
          {t('common.retry', { defaultValue: 'Retry' })}
        </Button>
      )}
    </div>
  ) : null
);

// Inline LoadingSpinner component
const LoadingSpinner = ({ isLoading, t }) => (
  isLoading ? (
    <div className="flex items-center justify-center py-8 text-gray-700 dark:text-gray-300">
      <RefreshCw className="h-6 w-6 animate-spin" />
      <span className="ml-2">{t('common.loading', { defaultValue: 'Loading...' })}</span>
    </div>
  ) : null
);

// Inline Table component
const Table = ({
  data,
  columns,
  sortConfig,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  isSelectionModeActive, // Not directly used in this simplified table, but kept for interface consistency
  totalItems,
  entityNamePlural,
  t
}) => (
  <div className="bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.id || column.accessorKey || index}
                className={`px-4 py-2 text-left text-gray-700 dark:text-gray-200 font-semibold ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={column.sortable ? () => onSortChange(column.accessorKey || column.id) : undefined}
              >
                <div className="flex items-center gap-1">
                  {column.header && typeof column.header === 'function'
                    ? column.header({
                        table: {
                          getIsAllPageRowsSelected: () => selectedItems.length === data.length && data.length > 0,
                          getIsSomePageRowsSelected: () => selectedItems.length > 0 && selectedItems.length < data.length,
                          toggleAllPageRowsSelected: (value) => onSelectAll(value)
                        }
                      })
                    : column.header}
                  {column.sortable && sortConfig.key === (column.accessorKey || column.id) ? (
                    sortConfig.direction === 'ascending' ? (
                      <ArrowUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ArrowDown className="ml-1 h-3 w-3" />
                    )
                  ) : column.sortable ? (
                    <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-100">
              {columns.map((column, colIndex) => (
                <td key={column.id || column.accessorKey || colIndex} className="px-4 py-2">
                  {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Simple pagination */}
    <div className="flex items-center justify-between px-4 py-2 border-t dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {t('table.paginationSummary', {
          defaultValue: `Showing {{start}} to {{end}} of {{total}} {{entityNamePlural}}`,
          start: ((pagination.currentPage - 1) * pagination.pageSize) + 1,
          end: Math.min(pagination.currentPage * pagination.pageSize, totalItems),
          total: totalItems,
          entityNamePlural: entityNamePlural,
        })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage <= 1}
        >
          {t('table.previous', { defaultValue: 'Previous' })}
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {t('table.pageOf', { defaultValue: 'Page {{currentPage}} of {{totalPages}}', currentPage: pagination.currentPage, totalPages: pagination.totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage >= pagination.totalPages}
        >
          {t('table.next', { defaultValue: 'Next' })}
        </Button>
      </div>
    </div>
  </div>
);

// Inline ConfirmationDialog component
const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmButtonText,
  cancelButtonText
}) => (
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 dark:bg-gray-800 dark:text-gray-100">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelButtonText || 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmButtonText || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  ) : null
);


// Simple useEntityModule implementation for Claims
const useEntityModule = (config) => {
    const {
        entitySDK,
        entityName,
        entityNamePlural,
        DialogComponent,
        FormComponent,
        initialFilters,
        filterFunction,
        storageKey,
        defaultSort,
    } = config;

    const { t: i18n_t } = useLanguageHook();
    const { toast } = useToast();

    // State management for data
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State management for filtering, sorting, pagination
    const [filters, setFilters] = useState(() => {
        if (storageKey) {
            try {
                const storedFilters = localStorage.getItem(`${storageKey}-filters`);
                if (storedFilters) return JSON.parse(storedFilters);
            } catch (e) {
                console.error("Failed to parse filters from localStorage", e);
            }
        }
        return initialFilters;
    });

    const [sortConfig, setSortConfig] = useState(() => {
        if (storageKey) {
            try {
                const storedSort = localStorage.getItem(`${storageKey}-sort`);
                if (storedSort) return JSON.parse(storedSort);
            } catch (e) {
                console.error("Failed to parse sort config from localStorage", e);
            }
        }
        return defaultSort ? { key: defaultSort.replace(/^-/, ''), direction: defaultSort.startsWith('-') ? 'descending' : 'ascending' } : { key: '', direction: 'ascending' };
    });

    const [pagination, setPagination] = useState(() => {
        if (storageKey) {
            try {
                const storedPagination = localStorage.getItem(`${storageKey}-pagination`);
                if (storedPagination) return JSON.parse(storedPagination);
            } catch (e) {
                console.error("Failed to parse pagination from localStorage", e);
            }
        }
        return { currentPage: initialFilters.page || 1, pageSize: initialFilters.pageSize || 10, totalItems: 0, totalPages: 0 };
    });

    // State management for dialogs and current item
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // State management for selection
    const [selectedItems, setSelectedItems] = useState([]); // This should hold item IDs
    const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

    // State management for confirmation dialog
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
    const [confirmationDialogDetails, setConfirmationDialogDetails] = useState({
        itemIds: null,
        itemName: '',
        message: '',
        onConfirm: null,
        confirmButtonText: '',
        cancelButtonText: '',
        title: '',
    });


    // Save state to localStorage on changes
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(`${storageKey}-filters`, JSON.stringify(filters));
        }
    }, [filters, storageKey]);

    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(`${storageKey}-sort`, JSON.stringify(sortConfig));
        }
    }, [sortConfig, storageKey]);

    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(`${storageKey}-pagination`, JSON.stringify(pagination));
        }
    }, [pagination, storageKey]);


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
            let errorMessage = i18n_t('errors.fetchFailedGeneral', { item: entityNamePlural, defaultValue: `Failed to fetch ${entityNamePlural}.` });
            setError(errorMessage);
            toast({
                title: i18n_t('errors.fetchFailedTitle', { defaultValue: 'Error' }),
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [entitySDK, entityNamePlural, i18n_t, toast]);


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
                if (['submitted_at', 'service_date_from', 'invoice_date', 'updated_date', 'created_date'].includes(sortConfig.key)) {
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

        // Update total items and total pages for pagination
        setPagination(prev => ({
            ...prev,
            totalItems: processedItems.length,
            totalPages: Math.ceil(processedItems.length / prev.pageSize) || 1
        }));

        // Apply pagination
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        return processedItems.slice(startIndex, endIndex);

    }, [items, filters, sortConfig, filterFunction, pagination.currentPage, pagination.pageSize]);


    const handleSearch = useCallback((searchTerm) => {
        setFilters(prev => ({ ...prev, searchTerm, page: 1 }));
    }, []);

    const handleFilterChange = useCallback((name, value) => {
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    }, []);

    const handleSortChange = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    }, []);

    const handlePageChange = useCallback((page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    const handlePageSizeChange = useCallback((size) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    }, []);

    const handleAddNew = useCallback(() => {
        setCurrentItem(null);
        setIsDialogOpen(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    }, []);

    const handleDelete = useCallback(async (id) => {
        setConfirmationDialogDetails({
            itemIds: [id],
            itemName: entityName,
            message: i18n_t('confirmations.deleteSingleItem', { item: entityName, defaultValue: `Are you sure you want to delete this ${entityName}?` }),
            onConfirm: async () => {
                setLoading(true);
                try {
                    await entitySDK.delete(id);
                    toast({
                        title: i18n_t('success.deleteItem', { item: entityName, defaultValue: `${entityName} deleted successfully.` }),
                        variant: 'success',
                    });
                    handleRefresh();
                } catch (err) {
                    console.error(`Error deleting ${entityName}:`, err);
                    toast({
                        title: i18n_t('errors.deleteFailedTitle', { defaultValue: 'Error' }),
                        description: i18n_t('errors.deleteFailed', { item: entityName, defaultValue: `Failed to delete ${entityName}.` }),
                        variant: 'destructive',
                    });
                } finally {
                    setLoading(false);
                    setIsConfirmationDialogOpen(false);
                }
            },
            title: i18n_t('confirmations.deleteTitle', { defaultValue: 'Confirm Deletion' }),
            confirmButtonText: i18n_t('buttons.delete', { defaultValue: 'Delete' }),
            cancelButtonText: i18n_t('buttons.cancel', { defaultValue: 'Cancel' }),
        });
        setIsConfirmationDialogOpen(true);
    }, [entitySDK, entityName, i18n_t, toast, handleRefresh]);


    const handleBulkDelete = useCallback(async (ids) => {
        setConfirmationDialogDetails({
            itemIds: ids,
            itemName: entityNamePlural,
            message: i18n_t('confirmations.deleteMultipleItems', { count: ids.length, item: entityNamePlural, defaultValue: `Are you sure you want to delete ${ids.length} ${entityNamePlural}?` }),
            onConfirm: async () => {
                setLoading(true);
                try {
                    await entitySDK.bulkDelete(ids);
                    toast({
                        title: i18n_t('success.bulkDeleteItems', { count: ids.length, item: entityNamePlural, defaultValue: `${ids.length} ${entityNamePlural} deleted successfully.` }),
                        variant: 'success',
                    });
                    setSelectedItems([]);
                    setIsSelectionModeActive(false);
                    handleRefresh();
                } catch (err) {
                    console.error(`Error bulk deleting ${entityNamePlural}:`, err);
                    toast({
                        title: i18n_t('errors.bulkDeleteFailedTitle', { defaultValue: 'Error' }),
                        description: i18n_t('errors.bulkDeleteFailed', { item: entityNamePlural, defaultValue: `Failed to delete ${entityNamePlural}.` }),
                        variant: 'destructive',
                    });
                } finally {
                    setLoading(false);
                    setIsConfirmationDialogOpen(false);
                }
            },
            title: i18n_t('confirmations.deleteTitle', { defaultValue: 'Confirm Deletion' }),
            confirmButtonText: i18n_t('buttons.delete', { defaultValue: 'Delete' }),
            cancelButtonText: i18n_t('buttons.cancel', { defaultValue: 'Cancel' }),
        });
        setIsConfirmationDialogOpen(true);
    }, [entitySDK, entityNamePlural, i18n_t, toast, handleRefresh]);


    const handleToggleSelection = useCallback((itemId) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(itemId)) {
                newSelected.delete(itemId);
            } else {
                newSelected.add(itemId);
            }
            const updatedSelection = Array.from(newSelected);
            setIsSelectionModeActive(updatedSelection.length > 0);
            return updatedSelection;
        });
    }, []);

    const handleSelectAll = useCallback((isAllSelected) => {
        if (isAllSelected) {
            setSelectedItems(filteredAndSortedItems.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
        setIsSelectionModeActive(isAllSelected);
    }, [filteredAndSortedItems]);


    return {
        items: filteredAndSortedItems, // Return paginated, filtered, sorted items
        loading,
        error,
        filters,
        setFilters,
        sortConfig,
        setSortConfig,
        pagination,
        setPagination,
        selectedItems,
        setSelectedItems,
        isDialogOpen,
        setIsDialogOpen,
        currentItem,
        setCurrentItem,
        handleRefresh,
        handleSearch,
        handleFilterChange,
        handleSortChange,
        handlePageChange,
        handlePageSizeChange,
        handleAddNew,
        handleEdit,
        handleDelete,
        handleBulkDelete,
        isSelectionModeActive,
        setIsSelectionModeActive,
        handleToggleSelection,
        handleSelectAll,
        isConfirmationDialogOpen,
        setIsConfirmationDialogOpen,
        confirmationDialogDetails,
        setConfirmationDialogDetails,
    };
};

export default function ClaimsTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
    const { t, language, isRTL } = useLanguageHook();
    const { toast } = useToast();

    const currentLocale = useMemo(() => language === 'he' ? he : enUS, [language]);

    const [allProviders, setAllProviders] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [allInsuredPersons, setAllInsuredPersons] = useState([]);

    // Helper functions for names, memoized for stability
    const getProviderName = useCallback((id) => {
        const provider = allProviders.find(p => p.id === id);
        return provider?.name?.en || provider?.name?.he || String(id);
    }, [allProviders]);

    const getDoctorName = useCallback((id) => {
        const doctor = doctors.find(d => d.id === id);
        return doctor ? `${doctor.first_name_en} ${doctor.last_name_en}` : String(id);
    }, [doctors]);

    const getInsuredName = useCallback((id) => {
        const insured = allInsuredPersons.find(i => i.id === id);
        return insured?.full_name || String(id);
    }, [allInsuredPersons]);

    // This function's logic is now primarily handled directly in the columns definition's cell renderer
    // However, keeping it for potential other uses or if Badge component needs strict variants.
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'paid_in_full':
            case 'approved_for_payment':
                return 'default';
            case 'in_review':
            case 'pending_information':
                return 'secondary';
            case 'rejected':
            case 'denied':
                return 'destructive';
            case 'draft':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const entityConfig = useMemo(() => ({
        entitySDK: Claim,
        entityName: t('claims.itemTitleSingular', { defaultValue: 'Claim' }),
        entityNamePlural: t('claims.itemTitlePlural', { defaultValue: 'Claims' }),
        DialogComponent: ClaimDialog,
        FormComponent: null, // ClaimsTab uses ClaimDialog directly for add/edit
        initialFilters: {
            searchTerm: '', // For invoice number, insured name, provider name
            status: 'all',
            provider_id: 'all',
            insured_id: 'all',
            service_date_range: { from: null, to: null },
            page: 1,
            pageSize: 10,
        },
        filterFunction: (item, filters) => {
            // Search term (invoice number, insured name, provider name)
            if (filters.searchTerm) {
                const lowerCaseSearchTerm = filters.searchTerm.toLowerCase();
                const invoiceNumberMatch = item.invoice_number?.toLowerCase().includes(lowerCaseSearchTerm);
                const providerNameMatch = getProviderName(item.provider_id).toLowerCase().includes(lowerCaseSearchTerm);
                const insuredNameMatch = getInsuredName(item.insured_id).toLowerCase().includes(lowerCaseSearchTerm);

                if (!invoiceNumberMatch && !providerNameMatch && !insuredNameMatch) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
                return false;
            }

            // Provider filter
            if (filters.provider_id && filters.provider_id !== 'all' && item.provider_id !== filters.provider_id) {
                return false;
            }

            // Insured filter
            if (filters.insured_id && filters.insured_id !== 'all' && item.insured_id !== filters.insured_id) {
                return false;
            }

            // Service date range filter
            if (filters.service_date_range && (filters.service_date_range.from || filters.service_date_range.to)) {
                const serviceDate = item.service_date_from ? new Date(item.service_date_from) : null;
                const fromDate = filters.service_date_range.from ? new Date(filters.service_date_range.from) : null;
                const toDate = filters.service_date_range.to ? new Date(filters.service_date_range.to) : null;

                if (!serviceDate) return false;

                // Normalize dates to start of day for comparison
                const normalizeDate = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
                const normalizedServiceDate = normalizeDate(serviceDate);
                const normalizedFromDate = normalizeDate(fromDate);
                const normalizedToDate = normalizeDate(toDate);

                if (normalizedFromDate && normalizedServiceDate < normalizedFromDate) return false;
                if (normalizedToDate && normalizedServiceDate > normalizedToDate) return false;
            }

            return true;
        },
        storageKey: 'claimsView',
        defaultSort: '-created_date',
    }), [t, getProviderName, getInsuredName]); // Dependencies for entityConfig

    const {
        items: claims,
        loading,
        error,
        filters, setFilters,
        sortConfig, setSortConfig,
        pagination, setPagination,
        selectedItems, setSelectedItems,
        isDialogOpen, setIsDialogOpen,
        currentItem, setCurrentItem,
        handleRefresh: refreshClaims,
        handleSearch,
        handleFilterChange,
        handleSortChange,
        handlePageChange,
        handlePageSizeChange,
        handleAddNew,
        handleEdit,
        handleDelete,
        handleBulkDelete,
        isSelectionModeActive, setIsSelectionModeActive,
        handleToggleSelection, handleSelectAll,
        isConfirmationDialogOpen, setIsConfirmationDialogOpen,
        confirmationDialogDetails, setConfirmationDialogDetails,
    } = useEntityModule(entityConfig);

    useEffect(() => {
        const fetchRelatedData = async () => {
            try {
                const [fetchedProviders, fetchedDoctors, fetchedInsured] = await Promise.all([
                    Provider.list(),
                    Doctor.list(),
                    InsuredPerson.list()
                ]);
                setAllProviders(Array.isArray(fetchedProviders) ? fetchedProviders : []);
                setDoctors(Array.isArray(fetchedDoctors) ? fetchedDoctors : []);
                setAllInsuredPersons(Array.isArray(fetchedInsured) ? fetchedInsured : []);
            } catch (err) {
                console.error("Failed to fetch related data for Claims tab", err);
                toast({
                    title: t('errors.fetchDropdownError', { defaultValue: 'Failed to load options' }),
                    description: err.message,
                    variant: 'destructive'
                });
            }
        };
        fetchRelatedData();
    }, [t, toast]);

    const columns = useMemo(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={selectedItems.length === claims.length && claims.length > 0}
                    onChange={(e) => {
                        if (e.target.checked) {
                            handleSelectAll(true);
                        } else {
                            handleSelectAll(false);
                        }
                    }}
                    aria-label={t('bulkActions.selectAllVisible', { defaultValue: "Select all visible" })}
                    className="rounded border-gray-300"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedItems.includes(row.original.id)}
                    onChange={(e) => {
                        handleToggleSelection(row.original.id);
                    }}
                    aria-label={t('bulkActions.selectRow', { defaultValue: "Select row" })}
                    className="rounded border-gray-300"
                />
            ),
            enableSorting: false,
        },
        {
            header: t('fields.invoiceNumber', { defaultValue: 'Invoice #' }),
            accessorKey: 'invoice_number',
            sortable: true
        },
        {
            header: t('fields.insured', { defaultValue: "Insured" }),
            accessorKey: 'insured_name',
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div>
                        <div>{getInsuredName(item.insured_id) || t('common.notSet', { defaultValue: 'N/A' })}</div>
                        {item.policy_number && <div className="text-xs text-gray-500">{t('fields.policyNumberShort', { defaultValue: 'Policy:' })} {item.policy_number}</div>}
                    </div>
                );
            }
        },
        {
            header: t('fields.provider', { defaultValue: "Provider" }),
            accessorKey: 'provider_name',
            cell: ({ row }) => getProviderName(row.original.provider_id) || t('common.unknownProvider', { defaultValue: "Unknown Provider" })
        },
        {
            header: t('fields.serviceDate', { defaultValue: "Service Date" }),
            accessorKey: 'service_date_from',
            cell: ({ row }) => {
                const date = row.original.service_date_from;
                return date && isValid(parseISO(date)) ? format(parseISO(date), 'PP', { locale: currentLocale }) : t('common.notSet', { defaultValue: 'N/A' });
            },
            sortable: true
        },
        {
            header: t('fields.status', { defaultValue: "Status" }),
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.original.status;
                const statusText = t(`claimStatus.${status}`, { defaultValue: status });
                let badgeVariant = 'outline';
                if (['approved_for_payment', 'paid_in_full', 'partially_paid'].includes(status)) badgeVariant = 'default';
                else if (['rejected', 'denied'].includes(status)) badgeVariant = 'destructive';
                else if (['submitted', 'in_review', 'pending_information'].includes(status)) badgeVariant = 'secondary';
                return <Badge variant={badgeVariant}>{statusText}</Badge>;
            }
        },
        {
            header: t('fields.totalSubmittedAmountShort', { defaultValue: "Submitted" }),
            accessorKey: 'total_submitted_amount',
            cell: ({ row }) => {
                const item = row.original;
                return item.total_submitted_amount != null ? `${item.total_submitted_amount.toFixed(2)} ${item.currency || 'ILS'}` : t('common.notSet', { defaultValue: 'N/A' });
            }
        },
        {
            header: t('fields.totalPaidAmountShort', { defaultValue: "Paid" }),
            accessorKey: 'total_paid_amount',
            cell: ({ row }) => {
                const item = row.original;
                return item.total_paid_amount != null ? `${item.total_paid_amount.toFixed(2)} ${item.currency || 'ILS'}` : t('common.notSet', { defaultValue: 'N/A' });
            }
        },
        {
            header: t('fields.created', { defaultValue: "Created" }),
            accessorKey: 'created_date',
            cell: ({ row }) => {
                const date = row.original.created_date;
                return date && isValid(parseISO(date)) ? format(parseISO(date), 'PP', { locale: currentLocale }) : t('common.notSet', { defaultValue: 'N/A' });
            },
            sortable: true
        },
        {
            id: 'actions',
            header: () => <div className={isRTL ? "text-right" : "text-left"}>{t('common.actions', { defaultValue: 'Actions' })}</div>,
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
                    {t('common.edit', { defaultValue: 'Edit' })}
                </Button>
            ),
        },
    ], [t, isRTL, currentLocale, selectedItems, handleToggleSelection, handleSelectAll, getInsuredName, getProviderName, handleEdit, claims]);

    const memoizedGlobalActionsConfig = useMemo(() => [
        { labelKey: 'claims.addNewClaim', defaultLabel: 'Add New Claim', icon: Plus, action: handleAddNew, type: 'add' },
        ...(externalActionsConfig || [])
    ], [handleAddNew, externalActionsConfig, t]);

    const handleEditWithSelectionCheck = useCallback(() => {
        if (selectedItems.length === 1) {
            // Find the full item object from the current claims list using the selected ID
            const itemToEdit = claims.find(claim => claim.id === selectedItems[0]);
            if (itemToEdit) {
                handleEdit(itemToEdit);
                setIsSelectionModeActive(false);
                setSelectedItems([]);
            } else {
                toast({
                    title: t('common.itemNotFound', { defaultValue: 'Selected item not found.' }),
                    variant: 'destructive',
                });
            }
        } else if (selectedItems.length > 1) {
            toast({
                title: t('common.selectOneItemToEdit', { defaultValue: 'Please select only one item to edit.' }),
                variant: 'warning',
            });
        } else {
            toast({
                title: t('common.noItemsSelected', { defaultValue: 'No items selected for editing.' }),
                variant: 'warning',
            });
        }
    }, [selectedItems, claims, handleEdit, setIsSelectionModeActive, setSelectedItems, t, toast]);

    const handleDeleteWithSelectionCheck = useCallback(() => {
        if (selectedItems.length > 0) {
            handleBulkDelete(selectedItems); // selectedItems already contains IDs
            setIsSelectionModeActive(false);
            setSelectedItems([]);
        } else {
            toast({
                title: t('common.noItemsSelected', { defaultValue: 'No items selected for deletion.' }),
                variant: 'warning',
            });
        }
    }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, setSelectedItems, t, toast]);

    const handleCancelSelectionMode = useCallback(() => {
        setIsSelectionModeActive(false);
        setSelectedItems([]);
    }, [setIsSelectionModeActive, setSelectedItems]);

    const filterFields = useMemo(() => [
        {
            name: 'provider_id',
            label: t('fields.provider', { defaultValue: 'Provider' }),
            type: 'select',
            options: [
                { value: 'all', label: t('filters.allProviders', { defaultValue: 'All Providers' }) },
                ...allProviders.map(p => ({
                    label: p.name?.en || p.name?.he || p.id,
                    value: p.id
                }))
            ]
        },
        {
            name: 'status',
            label: t('fields.status', { defaultValue: 'Status' }),
            type: 'select',
            options: [
                { value: 'all', label: t('filters.allStatuses', { defaultValue: 'All Statuses' }) },
                { value: 'draft', label: t('claimStatus.draft', { defaultValue: 'Draft' }) },
                { value: 'submitted', label: t('claimStatus.submitted', { defaultValue: 'Submitted' }) },
                { value: 'in_review', label: t('claimStatus.in_review', { defaultValue: 'In Review' }) },
                { value: 'approved_for_payment', label: t('claimStatus.approved_for_payment', { defaultValue: 'Approved for Payment' }) },
                { value: 'paid_in_full', label: t('claimStatus.paid_in_full', { defaultValue: 'Paid in Full' }) },
                { value: 'rejected', label: t('claimStatus.rejected', { defaultValue: 'Rejected' }) },
                { value: 'denied', label: t('claimStatus.denied', { defaultValue: 'Denied' }) },
                { value: 'partially_paid', label: t('claimStatus.partially_paid', { defaultValue: 'Partially Paid' }) } // Added from new column logic
            ]
        },
        {
            name: 'insured_id',
            label: t('fields.insured', { defaultValue: 'Insured Person' }),
            type: 'select',
            options: [
                { value: 'all', label: t('filters.allInsuredPersons', { defaultValue: 'All Insured Persons' }) },
                ...allInsuredPersons.map(i => ({
                    label: i.full_name || i.id,
                    value: i.id
                }))
            ]
        },
        {
            name: 'service_date_range',
            label: t('fields.serviceDateRange', { defaultValue: 'Service Date Range' }),
            type: 'date_range'
        },
    ], [t, allProviders, allInsuredPersons]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[var(--subheader-height,0px)] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <DollarSign className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
                    {t('claims.titleMultiple', { defaultValue: 'Claims' })} ({pagination.totalItems || 0})
                </h3>
                <div className="flex items-center gap-2">
                    <GlobalActionButton
                        actionsConfig={memoizedGlobalActionsConfig}
                        onEditItems={handleEditWithSelectionCheck}
                        onDeleteItems={handleDeleteWithSelectionCheck}
                        isSelectionModeActive={isSelectionModeActive}
                        onCancelSelectionMode={handleCancelSelectionMode}
                        selectedItemCount={selectedItems.length}
                        itemTypeForActions={t('claims.itemTitleSingular', { defaultValue: 'Claim' })}
                        t={t}
                    />
                    <RefreshButton
                        onClick={refreshClaims}
                        isLoading={loading}
                        tooltipContent={t('common.refresh', { defaultValue: 'Refresh' })}
                    />
                    <ViewSwitcher currentView={passedView} onViewChange={() => { /* Implement view change logic */ }} t={t} />
                </div>
            </div>

            <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                searchPlaceholder={t('search.placeholderClaims', { defaultValue: 'Search claims by invoice #, provider, or insured' })}
                filterFields={filterFields}
                t={t}
            />

            <ErrorDisplay error={error} onRetry={refreshClaims} t={t} />
            <LoadingSpinner isLoading={loading} t={t} />

            {!(loading || error) && (
                <Table
                    data={claims}
                    columns={columns}
                    sortConfig={sortConfig}
                    onSortChange={setSortConfig}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    selectedItems={selectedItems}
                    onToggleSelection={handleToggleSelection}
                    onSelectAll={handleSelectAll}
                    isSelectionModeActive={isSelectionModeActive}
                    totalItems={pagination.totalItems}
                    entityNamePlural={entityConfig.entityNamePlural}
                    t={t}
                />
            )}

            {isDialogOpen && (
                <ClaimDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    claimData={currentItem}
                    providers={allProviders}
                    doctors={doctors}
                    insuredPersons={allInsuredPersons}
                />
            )}

            {isConfirmationDialogOpen && (
                <ConfirmationDialog
                    open={isConfirmationDialogOpen}
                    onOpenChange={setIsConfirmationDialogOpen}
                    title={confirmationDialogDetails.title}
                    message={confirmationDialogDetails.message}
                    onConfirm={confirmationDialogDetails.onConfirm}
                    confirmButtonText={confirmationDialogDetails.confirmButtonText}
                    cancelButtonText={confirmationDialogDetails.cancelButtonText}
                />
            )}
        </div>
    );
}
