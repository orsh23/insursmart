
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Task } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { Checkbox } from "@/components/ui/checkbox";

import TaskDialog from './TaskDialog';
import TaskCard from './TaskCard';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import GlobalActionButton from '@/components/common/GlobalActionButton';
import DataTable from '@/components/shared/DataTable';
import TaskFilterBar from './TaskFilterBar';
import ImportDialog from '@/components/common/ImportDialog';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
    ListChecks as ListChecksIcon, Plus, Edit, Trash2, UploadCloud, Eye, FilterX,
    RefreshCw, MoreVertical,
    AlertTriangle
} from 'lucide-react';

import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { enUS, he } from 'date-fns/locale';

// Import the global useEntityModule and storage utilities
import { useEntityModule } from '@/components/hooks/useEntityModule';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';

const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

export default function TasksTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();

  const [usersMap, setUsersMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [appLoading, setAppLoading] = useState(false); // Local loading state for actions not covered by useEntityModule

  const currentLocale = getLocaleObject(language);

  const entityConfig = useMemo(() => ({
    entitySDK: Task,
    entityName: t('tasks.itemTitleSingular', {defaultValue: 'Task'}),
    entityNamePlural: t('tasks.itemTitle', {defaultValue: 'Tasks'}),
    DialogComponent: TaskDialog,
    initialFilters: {
      searchTerm: '',
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      category: 'all',
      dueDateRange: { from: null, to: null },
      page: 1,
      pageSize: 10,
    },
    filterFunction: (item, filters) => {
        const { searchTerm, status, priority, assignedTo, category, dueDateRange } = filters;

        if (searchTerm) {
          const termLower = searchTerm.toLowerCase();
          if (!((item.title && item.title.toLowerCase().includes(termLower)) ||
              (item.description && item.description.toLowerCase().includes(termLower)) ||
              (item.id && item.id.toLowerCase().includes(termLower)) ||
              (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(termLower))))) {
            return false;
          }
        }
        if (status !== 'all' && item.status !== status) return false;
        if (priority !== 'all' && item.priority !== priority) return false;
        if (category !== 'all' && item.category !== category) return false;
        if (assignedTo !== 'all' && item.assigned_to !== assignedTo) return false;
        
        if (dueDateRange.from || dueDateRange.to) {
          if (!item.due_date) return false;
          const taskDate = parseISO(item.due_date);
          if (!isValid(taskDate)) return false;
          
          const fromDate = dueDateRange.from ? parseISO(dueDateRange.from) : null;
          const toDate = dueDateRange.to ? parseISO(dueDateRange.to) : null;

          if (fromDate && taskDate < fromDate) return false;
          if (toDate && taskDate > toDate) return false;
        }
        return true;
    },
    storageKey: 'tasksView',
    sortKey: 'due_date', 
  }), [t]);

  const {
    items: tasks, // aliased from rawItems, it represents all fetched items
    filteredAndSortedItems,
    paginatedItems,
    totalItems,
    totalPages,
    loading, // This is from useEntityModule, for data fetching
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    pagination,
    selectedItems,
    setSelectedItems,
    isDialogOpen,
    setIsDialogOpen,
    currentItem,
    setCurrentItem,
    handleRefresh: refreshTasks,
    handleFilterChange,
    handleSortChange: handleDataTableSortChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit: handleEditItem, // Renamed to avoid conflict with local handleEditAction
    handleBulkDelete,
    isSelectionModeActive,
    setIsSelectionModeActive,
    handleToggleSelection,
    handleSelectAll,
    handleSelfSubmittingDialogClose,
  } = useEntityModule(entityConfig, t);

  const [currentView, setCurrentViewInternal] = useState(passedView || loadFromStorage('tasksView_viewPreference', 'card'));

  const fetchUsersMap = useCallback(async (forceRefresh = false) => {
    // This cache handling for usersMap should eventually be moved to a shared service/hook
    // For now, mirroring the logic from the original file for the usersMap specifically.
    const apiCache = {
      usersMap: { data: null, timestamp: null, loading: false, error: null },
      expirationTime: 2 * 60 * 1000, // 2 minutes
    };

    const isCacheValid = (cacheKey) => {
      const entry = apiCache[cacheKey];
      if (!entry || !entry.data || !entry.timestamp) return false;
      return (Date.now() - entry.timestamp) < apiCache.expirationTime;
    };

    const updateCache = (cacheKey, data, error = null) => {
      if (apiCache[cacheKey]) {
        apiCache[cacheKey] = { data, timestamp: Date.now(), loading: false, error };
      }
    };

    const setCacheLoading = (cacheKey, isLoading) => {
      if (apiCache[cacheKey]) {
        apiCache[cacheKey].loading = isLoading;
        if(isLoading) apiCache[cacheKey].error = null;
      }
    };

    const cacheKey = 'usersMap';
    if (!forceRefresh && isCacheValid(cacheKey) && apiCache[cacheKey].data) {
        setUsersMap(apiCache[cacheKey].data);
        return apiCache[cacheKey].data;
    }
    if (apiCache[cacheKey]?.loading && !forceRefresh) {
        await new Promise(resolve => {
          const checkCompletion = () => {
            if (!apiCache[cacheKey].loading) resolve();
            else setTimeout(checkCompletion, 100);
          };
          checkCompletion();
        });
        if (apiCache[cacheKey]?.data) {
            setUsersMap(apiCache[cacheKey].data);
            return apiCache[cacheKey].data;
        }
    }
    
    setCacheLoading(cacheKey, true);
    try {
        const users = await User.list();
        const map = {};
        (Array.isArray(users) ? users : []).forEach(user => {
            if (user && user.email) map[user.email] = user.full_name || user.email;
        });
        updateCache(cacheKey, map);
        setUsersMap(map);
        return map;
    } catch (err) {
        console.error("Error fetching users for tasks:", err);
        updateCache(cacheKey, {}, err.message);
        return {};
    } finally {
        setCacheLoading(cacheKey, false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchUsersMap(), refreshTasks()]);
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (err) {
        console.log("User not logged in or error fetching current user:", err);
      }
    };
    fetchData();
  }, [fetchUsersMap, refreshTasks]);


  const handleStatusChange = async (taskId, newStatus) => {
    setAppLoading(true); // Use local loading state
    try {
        const taskToUpdate = tasks.find(t => t.id === taskId); // Use 'tasks' which is rawItems from useEntityModule
        if (taskToUpdate) {
            await Task.update(taskId, { ...taskToUpdate, status: newStatus });
            toast({ title: t('messages.success', {defaultValue: 'Success!'}), description: t('tasks.statusUpdateSuccess', { status: t(`taskStatus.${newStatus}`, {defaultValue: newStatus}) })});
            refreshTasks();
        }
    } catch (err) {
        console.error("Error updating task status:", err);
        toast({ title: t('errors.updateErrorTitle', {defaultValue: 'Update Error'}), description: err.message || t('errors.failedToUpdateStatus', { item: t('tasks.itemTitleSingular', {defaultValue: "task"}) }), variant: "destructive" });
    } finally {
        setAppLoading(false); // Reset local loading state
    }
  };

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedItems(new Set());
  }, [setIsSelectionModeActive, setSelectedItems]);

  const handleEditAction = useCallback(() => { // Renamed from handleEdit
    if (selectedItems.length === 1) {
      const taskIdToEdit = selectedItems[0];
      const taskToEdit = tasks.find(t => t.id === taskIdToEdit); // Use 'tasks'
      if (taskToEdit) {
        setCurrentItem(taskToEdit);
        setIsDialogOpen(true);
      }
    } else if (selectedItems.length === 0) {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', {defaultValue: 'Selection Mode Enabled'}), description: t('bulkActions.selectItemToEditDesc', { entity: t('pageTitles.tasksSingular', {defaultValue: 'task'}) }) });
    } else {
      toast({ title: t('bulkActions.selectOneToEditTitle', {defaultValue: 'Select Only One Item'}), description: t('bulkActions.selectOneToEditDesc', {entity: t('pageTitles.tasks', {defaultValue: 'tasks'})}), variant: 'info' });
    }
  }, [selectedItems, tasks, setCurrentItem, setIsDialogOpen, setIsSelectionModeActive, t, toast]);

  const handleDeleteAction = useCallback(() => {
    if (selectedItems.length > 0) {
      const idsToDelete = Array.from(selectedItems);
      const itemName = idsToDelete.length === 1
          ? (tasks.find(t => t.id === idsToDelete[0])?.title || t('pageTitles.tasksSingular', {defaultValue: 'Task'}))
          : t('pageTitles.tasks', {defaultValue: 'Tasks'});
      setDeleteDialogState({
          isOpen: true,
          itemIds: idsToDelete,
          itemName: itemName,
          message: t('tasks.bulkDeleteConfirmMessage', {count: idsToDelete.length, defaultValue: `Are you sure you want to delete ${idsToDelete.length} ${itemName}?`})
      });
    } else {
      setIsSelectionModeActive(true);
      toast({ title: t('bulkActions.selectionModeEnabledTitle', {defaultValue: 'Selection Mode Enabled'}), description: t('bulkActions.selectItemsToDeleteDesc', { entity: t('pageTitles.tasks', {defaultValue: 'tasks'}) }) });
    }
  }, [selectedItems, tasks, setIsSelectionModeActive, t, toast]);

  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: null, itemName: '', message: '' });

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    await handleBulkDelete(deleteDialogState.itemIds, tasks, t('tasks.itemTitleSingular', {defaultValue: 'Task'}));
    setDeleteDialogState({ isOpen: false, itemIds: null, itemName: '', message: '' });
  };

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle', {defaultValue: 'No Records Found'}), description: t('import.noRecordsDesc', {defaultValue: 'No records were found in the file or selected for import.'}), variant: "warning" });
      return;
    }
    
    const tasksToCreate = records.map(rec => ({
        title: rec['Title'] || rec['title'],
        description: rec['Description'] || rec['description'],
        status: rec['Status']?.toLowerCase() || rec['status']?.toLowerCase() || 'todo',
        priority: rec['Priority']?.toLowerCase() || rec['priority']?.toLowerCase() || 'medium',
        category: rec['Category']?.toLowerCase() || rec['category']?.toLowerCase() || 'general',
        due_date: rec['Due Date'] || rec['due_date'],
        assigned_to: rec['Assigned To'] || rec['assigned_to'],
        estimated_hours: parseFloat(rec['Estimated Hours'] || rec['estimated_hours']) || null,
        tags: (rec['Tags'] || rec['tags'])?.split(',').map(s => s.trim()).filter(Boolean) || [],
    })).filter(t => t.title);

    if(tasksToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle', {defaultValue: 'No Valid Records'}), description: t('import.noValidRecordsDesc', {entity: t('pageTitles.tasks', {defaultValue: 'tasks'}), defaultValue: `No valid ${t('pageTitles.tasks', {defaultValue: 'tasks'})} found in the file to import.`}), variant: 'warning'});
        return;
    }
    setAppLoading(true); // Use local loading state
    let successCount = 0; let errorCount = 0;
    for (const taskData of tasksToCreate) {
        try { await Task.create(taskData); successCount++; }
        catch (err) { console.error("Error creating task from import:", err, taskData); errorCount++; }
    }
    setAppLoading(false); // Reset local loading state
    toast({
        title: t('import.completedTitle', {defaultValue: 'Import Completed'}),
        description: t('import.completedDesc', {successCount, errorCount, entity: t('pageTitles.tasks', {defaultValue: 'tasks'}), defaultValue: `Import completed. Successfully imported ${successCount} ${t('pageTitles.tasks', {defaultValue: 'tasks'})} and ${errorCount} failed.`}),
    });
    if (successCount > 0) refreshTasks(); // Use refreshTasks
  };

  const memoizedGlobalActionsConfig = useMemo(() => [
    { labelKey: 'tasks.addNewTask', defaultLabel: 'Add New Task', icon: Plus, action: handleAddNew, type: 'add'},
    { isSeparator: true },
    { labelKey: 'buttons.import', defaultLabel: 'Import', icon: UploadCloud, action: () => setIsImportDialogOpen(true) },
    ...(externalActionsConfig || [])
  ], [handleAddNew, externalActionsConfig, t]);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const taskColumns = useMemo(() => [
    { 
      accessorKey: 'title', 
      header: t('tasks.fields.title', {defaultValue: 'Title'}),
      cell: ({ row }) => <span className={`font-medium text-gray-800 dark:text-gray-100 ${row.original.status === 'done' ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{row.original.title || t('common.notSet', {defaultValue: 'N/A'})}</span>,
      enableSorting: true,
    },
    { 
      accessorKey: 'status', 
      header: t('tasks.fields.status', {defaultValue: 'Status'}),
      cell: ({ row }) => <TaskStatusBadge status={row.original.status} t={t} onStatusChange={(newStatus) => handleStatusChange(row.original.id, newStatus)} />,
      enableSorting: true,
    },
    { 
      accessorKey: 'priority', 
      header: t('tasks.fields.priority', {defaultValue: 'Priority'}),
      cell: ({ row }) => <TaskPriorityBadge priority={row.original.priority} t={t} />,
      enableSorting: true,
    },
    { 
      accessorKey: 'assigned_to', 
      header: t('tasks.fields.assignedTo', {defaultValue: 'Assigned To'}),
      cell: ({ row }) => usersMap[row.original.assigned_to] || row.original.assigned_to || t('tasks.fields.unassigned', {defaultValue: 'Unassigned'}),
      enableSorting: true,
    },
    { 
      accessorKey: 'due_date', 
      header: t('tasks.fields.dueDate', {defaultValue: 'Due Date'}),
      cell: ({ row }) => (row.original.due_date && isValid(parseISO(row.original.due_date))
        ? formatDistanceToNow(parseISO(row.original.due_date), { addSuffix: true, locale: currentLocale })
        : t('common.notSet', {defaultValue: 'N/A'})
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
  ], [t, usersMap, currentLocale, handleStatusChange]);

  if (loading && tasks.length === 0 && !error) { // Use 'tasks' (aliased rawItems) for initial loading check
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message={t('messages.loadingData', {item: t('tasks.itemTitle', {defaultValue: 'Tasks'})})} /></div>;
  }
  
  return (
    <div className="space-y-4 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <ListChecksIcon className={`inline-block h-6 w-6 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600 dark:text-blue-400`} />
            {t('pageTitles.tasks', { defaultValue: 'Tasks' })} ({totalItems})
        </h3>
        <div className="flex items-center gap-2">
            <GlobalActionButton
                actionsConfig={memoizedGlobalActionsConfig}
                onEditItems={handleEditAction}
                onDeleteItems={handleDeleteAction}
                isSelectionModeActive={isSelectionModeActive}
                onCancelSelectionMode={handleCancelSelectionMode}
                selectedItemCount={selectedItems.length}
                itemTypeForActions={t('pageTitles.tasksSingular', {defaultValue: 'Task'})}
                t={t}
            />
            <Button variant="outline" size="sm" onClick={refreshTasks} disabled={loading || appLoading} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <RefreshCw className={`h-4 w-4 ${(loading || appLoading) ? 'animate-spin' : ''} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('buttons.refresh', {defaultValue: 'Refresh'})}
            </Button>
            
            <ViewSwitcher
                currentView={currentView}
                onViewChange={(view) => { setCurrentViewInternal(view); handleCancelSelectionMode(); saveToStorage('tasksView_viewPreference', view);}}
                availableViews={['card', 'table']}
                entityName={t('pageTitles.tasks', {defaultValue: 'Tasks'})}
                t={t} isRTL={isRTL}
            />
        </div>
      </div>

      <TaskFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onResetFilters={() => {
          setFilters(entityConfig.initialFilters); // Reset to initial filters from config
          setSortConfig({ key: entityConfig.sortKey || 'due_date', direction: 'ascending' });
          handleCancelSelectionMode();
          toast({
              title: t('filters.clearedTitle', { defaultValue: "Filters Cleared"}),
              description: t('filters.filtersReset', { item: t('tasks.itemTitle', {defaultValue: 'Tasks'}), defaultValue: `${t('tasks.itemTitle', {defaultValue: 'Tasks'})} filters and sorting have been reset.`}),
          });
        }}
        sortConfig={sortConfig}
        onSortChange={(key) => {
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
            else if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
            setSortConfig({ key, direction });
        }}
        allTasks={tasks} // Pass 'tasks' (aliased rawItems) for filter options
        usersMap={usersMap}
        t={t} language={language} isRTL={isRTL}
      />

      {error && (tasks.length === 0 || totalItems === 0) && ( // Check 'tasks' (aliased rawItems) for initial error display
         <Card className="border-destructive bg-destructive/10 dark:border-red-700 dark:bg-red-900/20">
            <CardHeader>
                <CardTitle className="text-destructive dark:text-red-300 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('common.errorOccurred', {defaultValue: 'An Error Occurred'})}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive dark:text-red-300">{error}</p>
                { (error.includes(t('errors.networkErrorGeneral', {defaultValue: 'Network error'})) || error.includes(t('errors.rateLimitExceededShort', {defaultValue: 'Too many requests'}))) && (tasks.length === 0 && pagination.page === 1) &&
                    <p className="text-sm text-destructive dark:text-red-300 mt-1">{t('errors.retryingSoon', {defaultValue: "Retrying automatically..."})}</p>
                }
                <Button variant="outline" size="sm" onClick={() => { setFilters(prev => ({...prev, page: 1})); refreshTasks();}} className="mt-3 border-destructive text-destructive hover:bg-destructive/20 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700/30">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('buttons.retryNow', {defaultValue: "Retry Now"})}
                </Button>
            </CardContent>
        </Card>
      )}

      {!loading && !error && filteredAndSortedItems.length === 0 && (
        <EmptyState
          icon={ListChecksIcon}
          title={t('tasks.noTasksFilterDesc', {defaultValue: 'No Tasks Found'})}
          message={t('tasks.noTasksDesc', {defaultValue: 'Try adjusting your filters or adding a new task.'})}
          actionButton={
            <Button onClick={handleAddNew}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('buttons.addNewTask', {defaultValue: 'Add New Task'})}
            </Button>
          }
          t={t} isRTL={isRTL}
        />
      )}

      {(!error || totalItems > 0) && (filteredAndSortedItems.length > 0 || (loading && tasks.length > 0)) && ( // Use 'tasks' for totalItems > 0 and loading
        <>
          {currentView === 'card' && paginatedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedItems.map((task) => {
                  if (!task || typeof task.id === 'undefined') return null;
                  return (
                    <TaskCard
                        key={task.id}
                        task={task}
                        usersMap={usersMap}
                        currentLocale={currentLocale}
                        t={t} isRTL={isRTL} language={language}
                        isSelectionModeActive={isSelectionModeActive}
                        isSelected={selectedItems.includes(task.id)} // selectedItems is array from hook
                        onToggleSelection={() => handleToggleSelection(task.id)}
                        onCardClick={() => !isSelectionModeActive && handleEditAction(task)} // Use handleEditAction
                    />
                  );
              })}
            </div>
          )}

          {currentView === 'table' && (
            <DataTable
              columns={taskColumns}
              data={filteredAndSortedItems}
              loading={loading && totalItems > 0} // Adjust loading condition
              error={null}
              entityName={t('tasks.itemTitle', {defaultValue: 'Tasks'})}
              pagination={{
                currentPage: pagination.page,
                pageSize: pagination.pageSize,
                totalItems: totalItems,
                totalPages: totalPages,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
                itemsPerPageOptions: [5, 10, 20, 50, 100],
              }}
              onSortChange={handleDataTableSortChange}
              currentSort={[{id: sortConfig.key, desc: sortConfig.direction === 'descending'}]}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={new Set(selectedItems)} // DataTable expects a Set
              onRowSelectionChange={handleToggleSelection} 
              onSelectAllRows={() => handleSelectAll(filteredAndSortedItems)} // Pass all filtered for select all
              onRowClick={({original: item}) => !isSelectionModeActive && item?.id && handleEditAction(item)} // Use handleEditAction
              t={t} language={language} isRTL={isRTL}
            />
          )}

          {currentView === 'card' && totalPages > 1 && (
            <div className="flex justify-center items-center pt-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.previous', {defaultValue: 'Previous'})}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('dataTable.pageInfo', { page: pagination.page, totalPages: totalPages, defaultValue: `Page ${pagination.page} of ${totalPages}`})}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('buttons.next', {defaultValue: 'Next'})}
              </Button>
            </div>
          )}
        </>
      )}

      {isDialogOpen && ( // Use isDialogOpen from useEntityModule
        <TaskDialog
          isOpen={isDialogOpen}
          onClose={handleSelfSubmittingDialogClose} // Use handleSelfSubmittingDialogClose
          taskData={currentItem} // Use currentItem from useEntityModule
          users={Object.entries(usersMap).map(([email, name]) => ({ value: email, label: name }))}
          currentUserEmail={currentUser?.email}
        />
      )}
      
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          entityName={t('tasks.itemTitle', {defaultValue: 'Tasks'})}
          onImport={handleImportSubmit}
          language={language}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => setDeleteDialogState(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleConfirmDelete}
        title={t('common.confirmDeleteTitle', {item: deleteDialogState.itemName || t('tasks.itemTitleSingular', {defaultValue:'Task'}), count: deleteDialogState.itemIds?.length || 1})}
        description={deleteDialogState.message}
        confirmText={t('common.delete', {defaultValue: 'Delete'})}
        cancelText={t('common.cancel', {defaultValue: 'Cancel'})}
        loading={loading || (appLoading && deleteDialogState.isOpen)} // Use local loading state
        t={t} isRTL={isRTL}
      />
    </div>
  );
}
