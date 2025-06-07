
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/api/entities';
import { User } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, UploadCloud, DownloadCloud, ListTodo, RefreshCw, AlertTriangle, XCircle, CheckCircle2, Eye, Filter } from 'lucide-react';

// Import working components
import TaskFilterBar from '@/components/tasks/TaskFilterBar';
import TaskDialog from '@/components/tasks/TaskDialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
// Replaced GlobalActionButton with GlobalActionDropdown
import GlobalActionDropdown from '@/components/common/GlobalActionDropdown';
import ImportDialog from '@/components/common/ImportDialog';
import ViewSwitcher from '@/components/common/ViewSwitcher';
import TaskList from '@/components/tasks/TaskList';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import DataTable from '@/components/ui/data-table'; // Corrected import path


import { parseISO, isValid } from 'date-fns';
import { getLocale, formatSafeDate, formatSafeDateDistance } from '@/components/utils/i18n-utils';
import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
import { useFilteredTasks } from '@/components/hooks/useFilteredTasks';
import useDebounce from '@/components/hooks/useDebounce';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { ListChecks as PageIcon } from 'lucide-react';

// buildTaskActionsConfig and ActionTypes are no longer needed here as logic is handled by GlobalActionDropdown props
// import { buildTaskActionsConfig, getDefaultPermissionsForRole, ActionTypes } from '@/components/configs/globalActionConfigs'; 

// Fallback components are not needed if direct imports work
// const FallbackTaskCard = (...)
// const FallbackTaskList = (...)
// const FallbackKanbanBoard = (...)
// const FallbackDataTable = (...)

export default function TasksPage() {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const currentLocale = useMemo(() => getLocale(language), [language]);

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const initialFilters = useMemo(() => ({
    searchTerm: '', status: 'all', priority: 'all', category: 'all', dueDate: null, assignee: 'all'
  }), []);

  const [filters, setFilters] = useState(() => loadFromStorage('tasksPage_filters', initialFilters));
  const [sortConfig, setSortConfig] = useState(() => loadFromStorage('tasksPage_sortConfig', { key: 'created_date', direction: 'descending' }));
  const [cardPagination, setCardPagination] = useState({ currentPage: 1, pageSize: 12 });

  // Fix view state management with proper localStorage persistence
  const [currentView, setCurrentView] = useState(() => {
    try {
      return loadFromStorage('tasks_view_preference', 'card');
    } catch (e) {
      console.warn('Failed to load view preference from storage, defaulting to "card":', e);
      return 'card';
    }
  });

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentTaskForDialog, setCurrentTaskForDialog] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, itemIds: [], itemName: '', message: '' });
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // e.g., 'edit', 'delete'
  const [selectedItems, setSelectedItems] = useState([]); // Array of task IDs

  // DEFINE handleCancelSelectionMode EARLIER
  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectionMode(null);
    setSelectedItems([]);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await Task.list(); 
      setAllTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err.message || t('errors.genericFetchError', { defaultValue: "Could not load tasks." }));
      setAllTasks([]);
      toast({ variant: "destructive", title: t('common.error', { defaultValue: "Error" }), description: err.message });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    setCardPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [setFilters, setCardPagination]);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setCardPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [initialFilters, setFilters, setCardPagination]);

  const filteredTasks = useFilteredTasks(allTasks, filters);
  
  const filteredAndSortedTasks = useMemo(() => {
    if (!Array.isArray(filteredTasks)) return [];
    
    const sorted = [...filteredTasks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      let comparison = 0;
      if (aValue && bValue) {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (isValid(parseISO(String(aValue))) && isValid(parseISO(String(bValue)))) { // Handle date strings robustly
            comparison = parseISO(String(aValue)).getTime() - parseISO(String(bValue)).getTime();
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      } else if (aValue && !bValue) {
        comparison = -1;
      } else if (!aValue && bValue) {
        comparison = 1;
      }
      
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredTasks, sortConfig]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return value && value.trim() !== '';
      if (key === 'dueDate') return value !== null;
      return value !== 'all';
    });
  }, [filters]);
  
  useEffect(() => {
    saveToStorage('tasksPage_filters', filters);
  }, [filters]);

  useEffect(() => {
    saveToStorage('tasksPage_sortConfig', sortConfig);
  }, [sortConfig]);

  // Removed useEffect for currentView as persistence is now handled directly in handleViewChange

  const handleOpenTaskDialog = useCallback((task = null) => {
    setCurrentTaskForDialog(task);
    setIsTaskDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsTaskDialogOpen(false);
    setCurrentTaskForDialog(null);
  }, []);

  const handleDialogSave = useCallback(async (taskData) => {
    try {
      let savedTask;
      if (currentTaskForDialog && currentTaskForDialog.id) {
        savedTask = await Task.update(currentTaskForDialog.id, taskData);
        toast({ title: t('messages.success'), description: t('tasks.updateSuccess', { name: taskData.title || t('common.item') }) });
      } else {
        savedTask = await Task.create(taskData);
        toast({ title: t('messages.success'), description: t('tasks.createSuccess', { name: taskData.title || t('common.item') }) });
      }
      fetchTasks(); // Refresh list
      handleDialogClose();
      if (isSelectionModeActive) { // Ensure this is called after successful save & dialog close
        handleCancelSelectionMode();
      }
      return savedTask;
    } catch (error) {
      console.error("Failed to save task:", error);
      toast({ variant: "destructive", title: t('common.error', { defaultValue: "Error" }), description: t('common.saveError', { defaultValue: "Failed to save task." }) + ` ${error.message}` });
      throw error; // Re-throw to indicate failure to caller if needed
    }
  }, [currentTaskForDialog, fetchTasks, handleDialogClose, t, toast, isSelectionModeActive, handleCancelSelectionMode]);


  const handleDeleteTasks = useCallback(async (taskIds) => {
    if (!taskIds || taskIds.length === 0) return;
    
    const itemsToDelete = allTasks.filter(task => taskIds.includes(task.id));
    const firstItemName = itemsToDelete.length > 0 ? itemsToDelete[0].title : t('common.unknownTask');

    const itemName = itemsToDelete.length === 1 
        ? firstItemName 
        : t('pageTitles.tasksMultipleItems', { count: taskIds.length, defaultValue: `${taskIds.length} tasks`});
    
    const message = itemsToDelete.length === 1
        ? t('tasks.deleteConfirmMessage', {name: firstItemName})
        : t('tasks.bulkDeleteConfirmMessage', { count: taskIds.length }); // Removed itemName from here as it's in title

    setDeleteDialogState({ isOpen: true, itemIds: taskIds, itemName, message });
  }, [allTasks, t]);

  const confirmDelete = useCallback(async () => {
    if (!deleteDialogState.itemIds || deleteDialogState.itemIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let failedCount = 0;
    const errorsEncountered = [];

    for (const id of deleteDialogState.itemIds) {
      try { await Task.delete(id); successCount++; } 
      catch (err) { 
        console.error(`Error deleting task ${id}:`, err);
        failedCount++;
        errorsEncountered.push(t('tasks.deleteError', { name: allTasks.find(t => t.id === id)?.title || id, error: err.message }));
      }
    }
    setLoading(false);

    if (successCount > 0) {
      toast({ title: t('messages.success'), description: t('tasks.bulkDeleteSuccess', { count: successCount }) });
    }
    if (failedCount > 0) {
      toast({ 
        title: t('errors.deleteFailedTitle'), 
        description: errorsEncountered.join('. '), 
        variant: "destructive" 
      });
    }

    fetchTasks();
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '', message: '' });
    if (isSelectionModeActive) { // Ensure this is called after successful delete
      handleCancelSelectionMode();
    }
  }, [deleteDialogState, fetchTasks, t, toast, allTasks, isSelectionModeActive, handleCancelSelectionMode]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState({ isOpen: false, itemIds: [], itemName: '' });
  }, []);
  
  const handleStartSelectionMode = useCallback((mode, task = null) => {
    setIsSelectionModeActive(true);
    setSelectionMode(mode); // e.g., ActionTypes.EDIT, ActionTypes.DELETE
    if (task && task.id) {
      setSelectedItems([task.id]);
    } else {
      setSelectedItems([]);
    }
    toast({
        title: t('bulkActions.selectionModeActiveTitle', { mode: t(`common.${mode.toLowerCase()}`, {defaultValue: mode}) }),
        description: t('bulkActions.selectionModeActiveDesc', { mode: t(`common.${mode.toLowerCase()}`, {defaultValue: mode}), entity: t('pageTitles.tasksPlural')}),
        variant: 'info'
    });
  }, [t, toast]);

  const handleToggleTaskSelection = useCallback((taskId) => {
    setSelectedItems(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const paginatedTasks = useMemo(() => {
    if (!Array.isArray(filteredAndSortedTasks)) return [];
    const startIndex = (cardPagination.currentPage - 1) * cardPagination.pageSize;
    const endIndex = startIndex + cardPagination.pageSize;
    return filteredAndSortedTasks.slice(startIndex, endIndex);
  }, [filteredAndSortedTasks, cardPagination]);

  const handleSelectAllVisible = useCallback((checked) => {
    if (checked) {
      const visibleTaskIds = paginatedTasks.map(task => task.id);
      setSelectedItems(prev => {
        const newSelected = [...new Set([...prev, ...visibleTaskIds])];
        return newSelected;
      });
    } else {
      const visibleTaskIds = paginatedTasks.map(task => task.id);
      setSelectedItems(prev => prev.filter(id => !visibleTaskIds.includes(id)));
    }
  }, [paginatedTasks]);


  const totalCardPages = Math.ceil((filteredAndSortedTasks?.length || 0) / cardPagination.pageSize);


  const handleCardPageChange = useCallback((newPage) => {
    setCardPagination(prev => ({ ...prev, currentPage: newPage }));
  }, []);
  
  // Removed taskPageActionsConfig and handleExecuteGlobalAction as GlobalActionDropdown uses direct handlers

  const handleImportSubmit = async (records) => {
    setIsImportDialogOpen(false);
    if (!records || records.length === 0) {
      toast({ title: t('import.noRecordsTitle'), description: t('import.noRecordsDesc'), variant: "warning" }); 
      return;
    }
    
    const tasksToCreate = records.map(rec => ({
        title: rec['Title'] || rec['title'],
        description: rec['Description'] || rec['description'],
        status: (rec['Status']?.toLowerCase() || rec['status']?.toLowerCase() || 'todo').replace(/\s/g, '_'),
        priority: (rec['Priority']?.toLowerCase() || rec['priority']?.toLowerCase() || 'medium').replace(/\s/g, '_'),
        category: (rec['Category']?.toLowerCase() || rec['category']?.toLowerCase() || 'general').replace(/\s/g, '_'),
        due_date: rec['Due Date'] || rec['due_date'], // Ensure this is properly formatted or parsed later
        assigned_to: rec['Assigned To'] || rec['assigned_to'],
    })).filter(t => t.title);

    if(tasksToCreate.length === 0) {
        toast({title: t('import.noValidRecordsTitle'), description: t('import.noValidRecordsDesc', {entity: t('pageTitles.tasks')}), variant: 'warning'}); 
        return;
    }
    
    setLoading(true);
    let successCount = 0;
    for (const taskData of tasksToCreate) {
        try { 
          await Task.create(taskData); 
          successCount++; 
        }
        catch (err) { 
          console.error("Error creating task from import:", err); 
          toast({
            title: t('errors.importTaskFailedTitle'),
            description: t('errors.importTaskFailedDesc', { title: taskData.title, error: err.message }),
            variant: "destructive",
          });
        }
    }
    setLoading(false);
    toast({ title: t('import.completedTitle'), description: t('import.completedDesc', {successCount, errorCount: tasksToCreate.length - successCount, entity: t('pageTitles.tasks')})});
    if (successCount > 0) fetchTasks();
  };

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    if(isSelectionModeActive) {
      handleCancelSelectionMode();
    }
    // Persist to localStorage
    try {
      saveToStorage('tasks_view_preference', view);
    } catch (e) {
      console.warn('Failed to save view preference:', e);
    }
  }, [isSelectionModeActive, handleCancelSelectionMode]);

  const allVisibleSelected = useMemo(() => {
    if (currentView === 'card') {
        return paginatedTasks.length > 0 && paginatedTasks.every(task => selectedItems.includes(task.id));
    }
    return false; // For other views, this specific logic might not apply or be handled differently
  }, [paginatedTasks, selectedItems, currentView]);

  const allTableSelected = useMemo(() => {
     return (filteredAndSortedTasks?.length || 0) > 0 && filteredAndSortedTasks.every(task => selectedItems.includes(task.id));
  }, [filteredAndSortedTasks, selectedItems]);
  
  const handleSelectAllTable = useCallback((checked) => {
    if (checked) {
      const allTaskIds = filteredAndSortedTasks.map(task => task.id);
      setSelectedItems(allTaskIds);
    } else {
      setSelectedItems([]);
    }
  }, [filteredAndSortedTasks]);


  if (error && (!allTasks || allTasks.length === 0)) { // Adjusted condition
    return (
      <PageLayout>
        <PageHeader 
          title={t('pageTitles.tasks', {defaultValue: 'Tasks'})} 
          description={t('tasks.pageDescription', {defaultValue: "Manage your team's tasks and projects."})}
          icon={PageIcon} 
        />
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-red-600">{t('common.error', {defaultValue: 'An Error Occurred'})}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTasks}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t('buttons.retry', {defaultValue: 'Retry'})}
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  const noTasksAfterFiltering = !loading && (!filteredAndSortedTasks || filteredAndSortedTasks.length === 0) && hasActiveFilters;
  const noTasksAtAll = !loading && (!allTasks || allTasks.length === 0) && !hasActiveFilters;


  return (
    <PageLayout>
      <PageHeader 
        title={t('pageTitles.tasks', {defaultValue: "Tasks"})} 
        description={t('tasks.pageDescription', {defaultValue: "Manage your team's tasks and projects."})}
        icon={PageIcon} 
      />
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex-grow">
          {isSelectionModeActive && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
              <span className="text-sm font-medium text-blue-700">
                {selectedItems.length > 0 
                  ? t('bulkActions.selectedCount', { count: selectedItems.length, defaultValue: `${selectedItems.length} selected`})
                  : t('bulkActions.selectItemsPromptShort', { mode: t(`common.${selectionMode?.toLowerCase() || 'action'}`) } )
                }
              </span>
              <Button onClick={handleCancelSelectionMode} size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-100">
                <XCircle className="h-4 w-4 mr-1" /> {t('common.cancel', {defaultValue: 'Cancel'})}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Use the new GlobalActionDropdown with entity-based configuration */}
          <GlobalActionDropdown
            entity="tasks"
            permissions={{ 
              canAdd: true, 
              canEdit: true, 
              canDelete: true, 
              canImport: true, 
              canExport: true,
              canAssign: true // Added as per new handler
            }}
            isSelectionModeActive={isSelectionModeActive}
            selectedItemsCount={selectedItems.length}
            currentUserRole="admin" // This should come from user context
            debugMode={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
            showAllActionsInDev={true}
            
            // Action handlers
            onAdd={() => handleOpenTaskDialog()}
            onEdit={() => {
              if (selectedItems.length === 1) {
                const taskToEdit = allTasks.find(t => t.id === selectedItems[0]);
                if (taskToEdit) handleOpenTaskDialog(taskToEdit);
              } else {
                toast({ title: t('bulkActions.selectOneToEditTitle', {entity: t('pageTitles.task')}), description: t('bulkActions.selectOneToEditDesc', { entity: t('pageTitles.task') }), variant: 'info'});
              }
            }}
            onDeleteItems={() => {
              if (selectedItems.length > 0) {
                handleDeleteTasks(selectedItems);
              } else {
                toast({ title: t('bulkActions.noItemsSelectedTitle'), description: t('bulkActions.selectItemsPrompt', {mode: t('common.delete')}), variant: 'info'});
              }
            }}
            onImport={() => setIsImportDialogOpen(true)}
            onExport={() => {
              toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('common.export') }) });
            }}
            onAssign={() => {
              toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('common.assignTasks') }) });
            }}
            onStartSelectionMode={handleStartSelectionMode}
            t={t}
            isRTL={isRTL}
          />
          
          <Button onClick={fetchTasks} variant="outline" size="sm" disabled={loading}>
            {loading ? <LoadingSpinner size={16} message={null}/> : <RefreshCw className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">{t('buttons.refresh', {defaultValue: 'Refresh'})}</span>
          </Button>
          <ViewSwitcher
            currentView={currentView} // Changed from 'view' to 'currentView'
            onViewChange={handleViewChange} // Changed from 'onChange' to 'onViewChange'
            availableViews={['card', 'table', 'kanban']}
            entityName="tasks"
            t={t}
            isRTL={isRTL}
          />
        </div>
      </div>

      <TaskFilterBar 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        allTasks={allTasks || []} // Ensure allTasks is an array
        t={t} language={language} isRTL={isRTL} 
        currentView={currentView}
      />
      
      {loading && (!filteredAndSortedTasks || filteredAndSortedTasks.length === 0) && ( // Adjusted condition
        <LoadingSpinner className="mt-20" message={t('messages.loadingData', {item: t('pageTitles.tasksPlural', {defaultValue: 'Tasks'})})} />
      )}

      {error && allTasks && allTasks.length > 0 && ( // Show error even if some tasks loaded
         <div className="p-3 mb-3 bg-yellow-50 border border-yellow-400 text-yellow-700 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('errors.partialLoadWarning', { entity: t('pageTitles.tasksPlural'), message: error})}</span>
        </div>
      )}
      {!loading && (noTasksAtAll || noTasksAfterFiltering) ? (
        <>
          {noTasksAtAll && (
            <EmptyState
              icon={ListTodo}
              title={t('emptyStates.noTasksTitle', {defaultValue: 'No Tasks Yet'})}
              description={t('emptyStates.noTasksMessage', {defaultValue: 'Get started by creating a new task.'})}
              actionButton={
                 <Button onClick={() => handleOpenTaskDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> {t('tasks.addNewTask', {defaultValue: 'Add New Task'})}
                 </Button>
              }
            />
          )}
          {noTasksAfterFiltering && (
             <EmptyState
              icon={Filter}
              title={t('emptyStates.noTasksFilterTitle', {defaultValue: 'No Tasks Match Filters'})}
              description={t('emptyStates.noTasksFilterMessage', {defaultValue: 'Try adjusting your search or filter criteria.'})}
              actionButton={
                <Button onClick={handleResetFilters} variant="outline">
                    <XCircle className="mr-2 h-4 w-4" /> {t('buttons.resetFilters')}
                </Button>
              }
            />
          )}
        </>
      ) : (
        <div className="space-y-4"> {/* Added wrapper div as per outline */}
          {/* Conditionally render based on currentView */}
          {currentView === 'card' && TaskList && (
            <TaskList
              tasks={paginatedTasks || []} // Ensure tasks is an array
              onEditTask={(task) => handleOpenTaskDialog(task)}
              onDeleteTask={(taskId) => handleDeleteTasks([taskId])}
              onStatusChange={async (task, newStatus) => { // Adding onStatusChange handler for TaskList
                try {
                  await Task.update(task.id, { ...task, status: newStatus });
                  toast({ title: t('messages.success'), description: t('tasks.statusUpdateSuccess', { name: task.title, status: t(`status.${newStatus}`)})});
                  fetchTasks(); // Refresh list
                } catch (err) {
                  toast({ variant: "destructive", title: t('common.error'), description: t('tasks.statusUpdateError', { name: task.title, error: err.message})});
                }
              }}
              pagination={{
                currentPage: cardPagination.currentPage,
                totalPages: totalCardPages,
                onPageChange: handleCardPageChange,
                pageSize: cardPagination.pageSize, // Added for TaskList if it needs it
                totalItems: filteredAndSortedTasks?.length || 0, // Added for TaskList
              }}
              sortConfig={sortConfig} // Pass sortConfig
              onSortChange={setSortConfig} // Pass onSortChange
              t={t}
              language={language} // Pass language
              isRTL={isRTL} // Pass isRTL
              isSelectionModeActive={isSelectionModeActive}
              selectedTaskIds={new Set(selectedItems)} // Pass as Set
              onToggleTaskSelection={handleToggleTaskSelection}
              onSelectAllVisible={handleSelectAllVisible} // This was missing, needed by TaskList
              allVisibleSelected={allVisibleSelected} // This was missing
              onStartSelectionMode={handleStartSelectionMode} // Pass down for context menu
            />
          )}
          
          {currentView === 'table' && DataTable && (
            <DataTable
              columns={[ 
                  { accessorKey: 'title', header: t('tasks.fields.title', { defaultValue: 'Title' }), enableSorting: true },
                  { accessorKey: 'status', header: t('tasks.fields.status', { defaultValue: 'Status' }), cell: ({row}) => <Badge variant={row.original.status === 'done' ? 'default' : 'outline'}>{t(`status.${row.original.status}`, {defaultValue: row.original.status})}</Badge>, enableSorting: true },
                  { accessorKey: 'priority', header: t('tasks.fields.priority', { defaultValue: 'Priority' }), cell: ({row}) => <Badge variant={row.original.priority === 'high' || row.original.priority === 'urgent' ? 'destructive' : row.original.priority === 'medium' ? 'secondary' : 'outline'}>{t(`priority.${row.original.priority}`, {defaultValue: row.original.priority})}</Badge>, enableSorting: true },
                  { accessorKey: 'category', header: t('tasks.fields.category', { defaultValue: 'Category' }), cell: ({row}) => row.original.category ? <Badge variant="outline">{t(`category.${row.original.category}`, {defaultValue: row.original.category})}</Badge> : '-', enableSorting: true },
                  { accessorKey: 'due_date', header: t('tasks.fields.dueDate', {defaultValue: 'Due Date'}), cell: ({row}) => row.original.due_date ? formatSafeDate(row.original.due_date, currentLocale, { dateStyle: 'medium' }) : '-', enableSorting: true },
                  { accessorKey: 'assigned_to', header: t('tasks.fields.assignedToShort', {defaultValue: 'Assignee'}), cell: ({row}) => row.original.assigned_to || '-', enableSorting: true},
                  { accessorKey: 'created_date', header: t('common.createdDate', { defaultValue: 'Created' }), cell: ({ row }) => row.original.created_date ? formatSafeDate(row.original.created_date, currentLocale, { dateStyle: 'medium' }) : '-', enableSorting: true },
                  { id: 'actions', cell: ({row}) => (
                      <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenTaskDialog(row.original);}}><Edit className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteTasks([row.original.id]);}}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                  )}
              ]}
              data={filteredAndSortedTasks || []} // Ensure data is an array
              onRowClick={({original: task}) => { // Handle row click for details or edit
                  if (isSelectionModeActive) {
                    handleToggleTaskSelection(task.id);
                  } else {
                    handleOpenTaskDialog(task);
                  }
              }}
              isSelectionModeActive={isSelectionModeActive}
              selectedRowIds={new Set(selectedItems)} // Pass as Set
              onRowSelectionChange={(itemId, isSelected) => { // Handle individual row selection
                // This needs to correctly update selectedItems array
                setSelectedItems(prev => {
                  const newSet = new Set(prev);
                  if (isSelected) newSet.add(itemId);
                  else newSet.delete(itemId);
                  return Array.from(newSet);
                });
              }}
              onSelectAllRows={() => { // Handle select all rows for DataTable
                  if (allTableSelected) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(filteredAndSortedTasks.map(t => t.id));
                  }
              }}
              currentSort={[{id: sortConfig.key, desc: sortConfig.direction === 'descending'}]}
              onSortChange={(newSort) => {
                  if (newSort && newSort.length > 0) {
                      setSortConfig({ key: newSort[0].id, direction: newSort[0].desc ? 'descending' : 'ascending' });
                  } else {
                      // Reset to default sort if newSort is empty (e.g., all sorts cleared)
                      setSortConfig({ key: 'created_date', direction: 'descending' });
                  }
              }}
              entityName={t('pageTitles.tasksPlural')}
              t={t}
            />
          )}
          
          {currentView === 'kanban' && KanbanBoard && (
            <KanbanBoard 
              tasks={filteredAndSortedTasks || []} // Ensure tasks is an array
              onTaskUpdate={handleDialogSave} 
              onTaskClick={(task) => handleOpenTaskDialog(task)}
              onAddTask={(status) => handleOpenTaskDialog({ status: status || 'todo' })}
              t={t}
              language={language}
              isRTL={isRTL}
            />
          )}
        </div>
      )}

      {isTaskDialogOpen && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={handleDialogClose} // Renamed from onClose to onDialogClose to avoid conflict
          onSubmit={handleDialogSave} // Renamed from onSave to onDialogSave
          taskData={currentTaskForDialog} // Renamed from task to taskData
          // Pass users and currentUserEmail if TaskDialog needs them
          // users={usersListForDialog} 
          // currentUserEmail={currentUser?.email}
          t={t} language={language} isRTL={isRTL}
        />
      )}

      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSubmit={handleImportSubmit} 
          entityName={t('pageTitles.tasksPlural', {defaultValue: 'Tasks'})}
          sampleHeaders={['Title', 'Description', 'Status (todo/in_progress/done/cancelled)', 'Priority (low/medium/high/urgent)', 'Category', 'Due Date (YYYY-MM-DD)', 'Assigned To (email)']}
          language={language} isRTL={isRTL} 
          t={t}
        />
      )}

      <ConfirmationDialog
        isOpen={deleteDialogState.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={t('common.confirmDeleteTitleShort', {item: deleteDialogState.itemName, defaultValue:`Delete ${deleteDialogState.itemName}`})}
        description={deleteDialogState.message}
        confirmText={t('common.delete', {defaultValue: 'Delete'})}
        cancelText={t('common.cancel', {defaultValue: 'Cancel'})}
        t={t} isRTL={isRTL}
      />
    </PageLayout>
  );
}
