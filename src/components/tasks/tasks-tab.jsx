
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Task } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
// ConfirmationDialog and Checkbox imports are kept, as they are general UI components,
// even if specific logic for them has been removed or replaced in this outline.
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { Checkbox } from "@/components/ui/checkbox";

import TaskDialog from './TaskDialog';
import TaskCard from './TaskCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import TaskFilterBar from './TaskFilterBar';
import TaskKanbanView from './TaskKanbanView'; // New import for Kanban view
// ImportDialog removed as import logic is no longer in the outline
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import ErrorDisplay from '@/components/ui/error-display'; // Assuming a reusable ErrorDisplay component

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
    ListChecks as ListChecksIcon, Plus, Edit, Trash2, UploadCloud, Eye, FilterX,
    RefreshCw, MoreVertical, AlertTriangle, KanbanSquare, Table, LayoutList, CheckSquare, Search
} from 'lucide-react';

import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

import { useEntityModule } from '@/components/hooks/useEntityModule';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

// Helper function for safe date formatting
const formatSafeDate = (dateString, languageCode, options = {}) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    const locale = getLocaleObject(languageCode);
    return format(date, options.format || 'PP', { locale });
};

export default function TasksTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [users, setUsers] = useState([]); // Replaces usersMap

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await User.list();
        setUsers(Array.isArray(userList) ? userList : []);
      } catch (err) {
        console.error("Failed to fetch users for Tasks tab:", err);
        toast({ title: t('errors.fetchFailed', { entity: t('users.titlePlural', {defaultValue: 'users'}) }), description: err.message || t('errors.unknownError', {defaultValue: 'An unknown error occurred'}), variant: "destructive" });
      }
    };
    fetchUsers();
  }, [t, toast]);

  const entityConfig = useMemo(() => ({
    entitySDK: Task,
    entityName: t('tasks.itemTitleSingular', { defaultValue: 'Task' }),
    entityNamePlural: t('tasks.itemTitle', { defaultValue: 'Tasks' }),
    DialogComponent: TaskDialog,
    initialSort: [{ id: 'due_date', desc: false }], // Example: Sort by due date ascending
    initialFilters: {
      searchTerm: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      assignedTo: 'all',
      dueDateRange: { from: null, to: null },
    },
    searchFields: ['title', 'description'],
    filterFunction: (item, filters) => {
        const { searchTerm, status, priority, assignedTo, category, dueDateRange } = filters;

        if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            if (!((item.title && item.title.toLowerCase().includes(termLower)) ||
                (item.description && item.description.toLowerCase().includes(termLower)))) { // Removed id and tags from search, assuming new searchFields handles
                return false;
            }
        }
        if (status !== 'all' && item.status !== status) return false;
        if (priority !== 'all' && item.priority !== priority) return false;
        if (category !== 'all' && item.category !== category) return false;
        if (assignedTo !== 'all' && item.assigned_to !== assignedTo) return false;
        
        if (dueDateRange.from || dueDateRange.to) {
            if (!item.due_date) return false; // Task has no due date but filter is active
            const taskDate = parseISO(item.due_date);
            if (!isValid(taskDate)) return false;
            
            const fromDate = dueDateRange.from ? parseISO(dueDateRange.from) : null;
            const toDate = dueDateRange.to ? parseISO(dueDateRange.to) : null;
            
            if (fromDate && taskDate < fromDate) return false;
            if (toDate) {
                const toDateEndOfDay = new Date(toDate);
                toDateEndOfDay.setHours(23, 59, 59, 999); // Include the whole end day
                if (taskDate > toDateEndOfDay) return false;
            }
        }
        return true;
    },
    storageKey: 'tasksView',
  }), [t]);

  const {
    items: tasks, // This is now assumed to be the currently paginated items for rendering
    loading, error, filters, sortConfig, pagination, selectedItems,
    isDialogOpen, currentItem,
    handleRefresh: refreshTasks,
    handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
    handleAddNew, handleEdit, handleBulkDelete,
    isSelectionModeActive, setIsSelectionModeActive,
    handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
    filteredAndSortedItems, // All items after filtering and sorting, used for Kanban
  } = useEntityModule(entityConfig);

  const [currentView, setCurrentViewInternal] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'list'));
  
  // Effect to handle external view change (e.g., from global state)
  useEffect(() => {
    if (passedView && passedView !== currentView) {
      setCurrentViewInternal(passedView);
      saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
    }
  }, [passedView, currentView, entityConfig.storageKey]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems(new Set()); // Reset selected items
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleEditWithSelectionCheck = useCallback(() => {
    if (selectedItems.size === 1) {
      const taskIdToEdit = Array.from(selectedItems)[0];
      const itemToEdit = filteredAndSortedItems.find(it => it.id === taskIdToEdit);
      if (itemToEdit) handleEdit(itemToEdit);
      else toast({ title: t('errors.itemNotFoundTitle', {defaultValue: 'Item Not Found'}), description: t('errors.itemNotFoundToEditDesc', {defaultValue: 'The selected item could not be found for editing.'}), variant: "warning" });
    } else if (selectedItems.size === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', {defaultValue: 'Selection Mode Enabled'}), description: t('bulkActions.selectItemToEditDesc', {entity: entityConfig.entityName, defaultValue: `Select a ${entityConfig.entityName} to edit.`}) });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', {defaultValue: 'Select Only One Item'}), description: t('bulkActions.selectOneToEditDesc', {entity: entityConfig.entityName, defaultValue: `Please select only one ${entityConfig.entityName} to edit.`}), variant: 'info' });
    }
  }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, entityConfig.entityName]);

  const handleDeleteWithSelectionCheck = useCallback(() => {
    if (selectedItems.size > 0) {
      const idsToDelete = Array.from(selectedItems);
      const itemName = idsToDelete.length === 1
          ? (filteredAndSortedItems.find(t => t.id === idsToDelete[0])?.title || entityConfig.entityName)
          : entityConfig.entityNamePlural;

      const confirmMessage = t('common.confirmDeleteMultiple', {
          count: idsToDelete.length,
          item: itemName,
          defaultValue: `Are you sure you want to delete ${idsToDelete.length} ${itemName}?`
      });

      // Using a simple window.confirm as per outline's implicit change
      if (window.confirm(confirmMessage)) {
        handleBulkDelete(idsToDelete, entityConfig.entityNameSingular);
      }
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', {defaultValue: 'Selection Mode Enabled'}), description: t('bulkActions.selectItemsToDeleteDesc', {entity: entityConfig.entityNamePlural, defaultValue: `Select items to delete from the ${entityConfig.entityNamePlural} list.`}) });
    }
  }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, filteredAndSortedItems, entityConfig.entityName, entityConfig.entityNamePlural]);

  const memoizedGlobalActionsConfig = useMemo(() => {
    const baseActions = [
      { labelKey: 'tasks.addNewTask', defaultLabel: 'Add New Task', icon: Plus, action: handleAddNew, type: 'add' },
      { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
      { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
    ];
    return [...baseActions, ...(externalActionsConfig || [])];
  }, [handleAddNew, externalActionsConfig, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

  const taskTableColumns = useMemo(() => [
    { 
      accessorKey: 'title', 
      header: t('tasks.fields.title', {defaultValue: 'Title'}), 
      cell: ({ row }) => <span className={`font-medium text-gray-800 dark:text-gray-100 ${row.original.status === 'done' ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{row.original.title || t('common.notSet', {defaultValue: 'N/A'})}</span>,
      enableSorting: true 
    },
    { 
      accessorKey: 'status', 
      header: t('tasks.fields.status', {defaultValue: 'Status'}), 
      cell: ({ row }) => <TaskStatusBadge status={row.original.status} t={t} />,
      enableSorting: true 
    },
    { 
      accessorKey: 'priority', 
      header: t('tasks.fields.priority', {defaultValue: 'Priority'}),
      cell: ({ row }) => <TaskPriorityBadge priority={row.original.priority} t={t} />,
      enableSorting: true
    },
    { 
      accessorKey: 'due_date', 
      header: t('tasks.fields.dueDate', {defaultValue: 'Due Date'}),
      cell: ({ row }) => row.original.due_date ? formatSafeDate(row.original.due_date, language, { format: 'P' }) : t('common.notSet', {defaultValue: 'N/A'}),
      enableSorting: true
    },
    { 
      accessorKey: 'assigned_to', 
      header: t('tasks.fields.assignedTo', {defaultValue: 'Assigned To'}),
      cell: ({ row }) => {
        const user = users.find(u => u.email === row.original.assigned_to);
        return user ? user.full_name || user.email : (row.original.assigned_to || t('tasks.fields.unassigned', {defaultValue: 'Unassigned'}));
      },
      enableSorting: true
    },
    { 
      accessorKey: 'category', 
      header: t('tasks.fields.category', {defaultValue: 'Category'}), 
      cell: ({ row }) => t(`tasks.categories.${row.original.category}`, { defaultValue: row.original.category || t('common.notSet', {defaultValue: 'N/A'}) }),
      enableSorting: true 
    },
  ], [t, language, users]);

  const renderContent = () => {
    // Initial loading state (no data yet)
    if (loading && pagination.totalCount === 0 && !error) {
      return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural, defaultValue: `Loading ${entityConfig.entityNamePlural}` })} isFullScreen={false} />;
    }
    // Error state without any data
    if (error && pagination.totalCount === 0) {
      return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshTasks} />;
    }

    const noItems = pagination.totalCount === 0;
    const noFiltersApplied = Object.entries(filters || {}).every(([key, val]) => {
        if (key === 'dueDateRange') return !val?.from && !val?.to; // Special handling for date range
        if (key === 'searchTerm') return !val;
        return val === 'all' || val === '' || val === null;
    });

    if (currentView === 'kanban') {
      return (
        <TaskKanbanView 
          tasks={filteredAndSortedItems} 
          onTaskUpdate={handleEdit} 
          users={users} 
          t={t} language={language} isRTL={isRTL} 
        />
      );
    }
    
    // List/Card View
    if (currentView === 'list' || currentView === 'card') {
      return (
        <>
          {noItems && noFiltersApplied ? (
            <EmptyState
              icon={CheckSquare}
              title={t('tasks.emptyState.noTasksTitle', {defaultValue: 'No Tasks Yet'})}
              message={t('tasks.emptyState.noTasksDesc', {defaultValue: 'Get started by creating your first task.'})}
              actionButton={
                <Button onClick={handleAddNew}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('tasks.addNewTask', {defaultValue: 'Add New Task'})}
                </Button>
              }
              t={t} isRTL={isRTL}
            />
          ) : noItems && !noFiltersApplied ? (
            <EmptyState
              icon={Search}
              title={t('tasks.emptyState.noTasksMatchTitle', {defaultValue: 'No Matching Tasks Found'})}
              message={t('tasks.emptyState.noTasksMatchDesc', {defaultValue: 'Try adjusting your filters.'})}
              t={t} isRTL={isRTL}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tasks.map(task => ( // 'tasks' is assumed to be the paginated items
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={() => handleEdit(task)}
                  users={users}
                  isSelectionModeActive={isSelectionModeActive}
                  isSelected={selectedItems.has(task.id)}
                  onToggleSelection={() => handleToggleSelection(task.id)}
                  t={t} language={language} isRTL={isRTL}
                />
              ))}
            </div>
          )}
           {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
             <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.currentPage - 1)} 
                disabled={pagination.currentPage === 1 || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous', {defaultValue: 'Previous'})}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1, defaultValue: `Page ${pagination.currentPage} of ${Math.ceil(pagination.totalCount / pagination.pageSize) || 1}` })}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.currentPage + 1)} 
                disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next', {defaultValue: 'Next'})}
              </Button>
            </div>
          )}
        </>
      );
    }
    
    if (currentView === 'table') {
        return (
            <DataTable
                columns={taskTableColumns}
                data={tasks} // 'tasks' is assumed to be the paginated items
                loading={loading}
                error={error}
                onRetry={refreshTasks}
                entityName={entityConfig.entityNamePlural}
                emptyMessage={noFiltersApplied ? t('tasks.emptyState.noTasksDesc', {defaultValue: 'No tasks found. Get started by creating your first task.'}) : t('tasks.emptyState.noTasksMatchDesc', {defaultValue: 'No matching tasks found. Try adjusting your filters.'})}
                onRowClick={(row) => handleEdit(row.original)}
                isSelectionModeActive={isSelectionModeActive}
                selectedRowIds={selectedItems} // selectedItems is a Set from useEntityModule
                onRowSelectionChange={handleToggleSelection} 
                onSelectAllRows={() => handleSelectAll(filteredAndSortedItems.map(item => item.id))} // Selects all filtered items
                currentSort={sortConfig}
                onSortChange={handleSortChange}
                pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    itemsPerPageOptions: [5, 10, 20, 50, 100], // Assuming these are desired page sizes
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
          <ListChecksIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
          {t('pageTitles.tasks', { defaultValue: 'Tasks' })} ({loading && typeof pagination.totalCount === 'undefined' ? t('common.loadingEllipsis', {defaultValue: 'Loading...'}) : pagination.totalCount || 0})
        </h3>
        <div className="flex items-center gap-2">
          <GlobalActionButton
            actionsConfig={memoizedGlobalActionsConfig}
            isSelectionModeActive={isSelectionModeActive}
            onCancelSelectionMode={handleCancelSelectionMode}
            selectedItemCount={selectedItems.size}
            itemTypeForActions={entityConfig.entityName}
            t={t} isRTL={isRTL}
          />
          <Button onClick={refreshTasks} variant="outline" size="sm" disabled={loading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
            {t('buttons.refresh', {defaultValue: 'Refresh'})}
          </Button>
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => { setCurrentViewInternal(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
            availableViews={['list', 'kanban', 'table']}
            viewIcons={{ list: LayoutList, kanban: KanbanSquare, table: Table }}
            entityName={t('pageTitles.tasks', {defaultValue: 'tasks'})}
            t={t} isRTL={isRTL}
          />
        </div>
      </div>
      
      <TaskFilterBar 
        filters={filters} 
        onFiltersChange={handleFilterChange}
        onResetFilters={() => {
            handleFilterChange(null, entityConfig.initialFilters); // Reset all filters
            handleSortChange(entityConfig.initialSort); // Reset sort to initial
            handleCancelSelectionMode();
            toast({
                title: t('filters.clearedTitle', { defaultValue: "Filters Cleared"}),
                description: t('filters.filtersReset', { item: t('tasks.itemTitle', {defaultValue: 'Tasks'}), defaultValue: `${t('tasks.itemTitle', {defaultValue: 'Tasks'})} filters and sorting have been reset.`}),
            });
        }}
        // Convert useEntityModule's sortConfig (array of objects) to expected format for TaskFilterBar
        sortConfig={sortConfig.length > 0 ? { key: sortConfig[0].id, direction: sortConfig[0].desc ? 'descending' : 'ascending' } : { key: entityConfig.initialSort[0].id, direction: entityConfig.initialSort[0].desc ? 'descending' : 'ascending' }}
        onSortChange={(newSortKey) => {
            const currentSortField = sortConfig[0]?.id;
            const currentDesc = sortConfig[0]?.desc;
            handleSortChange([{ id: newSortKey, desc: currentSortField === newSortKey ? !currentDesc : false }]);
        }}
        allTasks={filteredAndSortedItems} // Pass all filtered for filter options (e.g. for dynamic categories)
        usersMap={Object.fromEntries(users.map(u => [u.email, u.full_name || u.email]))} // Convert users array to map for filter bar
        t={t} language={language} isRTL={isRTL}
      />

      {/* Display error if present AND there are existing items, or if loading more data */}
      {error && pagination.totalCount > 0 && <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshTasks} />}
      {/* Display loading spinner if loading more data for existing items */}
      {loading && pagination.totalCount > 0 && (
        <div className="my-4 flex justify-center">
            <LoadingSpinner message={t('messages.loadingMoreData', {defaultValue: 'Loading more data...'})} isFullScreen={false} />
        </div>
      )}

      {renderContent()}

      {isDialogOpen && (
        <TaskDialog // Assuming TaskDialog uses TaskForm internally or is the form itself
          isOpen={isDialogOpen}
          onClose={(refresh, actionType, itemName) => handleSelfSubmittingDialogClose(refresh, actionType, itemName)}
          taskData={currentItem} // currentItem from useEntityModule
          users={users}
          t={t} language={language} isRTL={isRTL}
        />
      )}
      
      {/* ImportDialog and ConfirmationDialog removed based on the outline */}
    </div>
  );
}
