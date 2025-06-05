import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Task } from '@/api/entities';
import { User } from '@/api/entities';
import TaskDialog from './TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, Search, FilterX, Edit, RefreshCw, ListChecks, AlertTriangle, Clock, User as UserIcon, Tag as TagIcon, Link as LinkIcon, Briefcase } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Calendar } from '@/components/ui/calendar'; // For date range picker

const statusOptions = [
  { value: 'all', labelKey: 'taskStatus.all', defaultValue: 'All Statuses' },
  { value: 'todo', labelKey: 'taskStatus.todo', defaultValue: 'To Do' },
  { value: 'in_progress', labelKey: 'taskStatus.in_progress', defaultValue: 'In Progress' },
  { value: 'done', labelKey: 'taskStatus.done', defaultValue: 'Done' },
  { value: 'cancelled', labelKey: 'taskStatus.cancelled', defaultValue: 'Cancelled' },
];

const priorityOptions = [
  { value: 'all', labelKey: 'priority.all', defaultValue: 'All Priorities' },
  { value: 'low', labelKey: 'priority.low', defaultValue: 'Low' },
  { value: 'medium', labelKey: 'priority.medium', defaultValue: 'Medium' },
  { value: 'high', labelKey: 'priority.high', defaultValue: 'High' },
  { value: 'urgent', labelKey: 'priority.urgent', defaultValue: 'Urgent' },
];

const categoryOptions = [
  { value: 'all', labelKey: 'taskCategory.all', defaultValue: 'All Categories' },
  { value: 'claim_review', labelKey: 'taskCategory.claim_review', defaultValue: 'Claim Review' },
  { value: 'provider_onboarding', labelKey: 'taskCategory.provider_onboarding', defaultValue: 'Provider Onboarding' },
  { value: 'contract_negotiation', labelKey: 'taskCategory.contract_negotiation', defaultValue: 'Contract Negotiation' },
  { value: 'compliance_check', labelKey: 'taskCategory.compliance_check', defaultValue: 'Compliance Check' },
  { value: 'data_validation', labelKey: 'taskCategory.data_validation', defaultValue: 'Data Validation' },
  { value: 'system_maintenance', labelKey: 'taskCategory.system_maintenance', defaultValue: 'System Maintenance' },
  { value: 'training', labelKey: 'taskCategory.training', defaultValue: 'Training' },
  { value: 'general', labelKey: 'taskCategory.general', defaultValue: 'General' },
];

export default function TasksComponent() {
  const { t, language, isRTL } = useLanguageHook();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const initialFilters = {
    searchTerm: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
    dueDateFrom: null,
    dueDateTo: null,
  };
  const [filters, setFilters] = useState(initialFilters);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, userData] = await Promise.all([
        Task.list('-due_date', 100), // Sort by due date, limit to 100 for now
        User.list()
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error("Error fetching tasks or users:", err);
      setError(err.message || t('errors.fetchFailedGeneral', { item: t('tasks.titlePlural') }));
      setTasks([]); // Ensure tasks is an array on error
      setUsers([]);   // Ensure users is an array on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const openTaskDialog = (task = null) => {
    setCurrentTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = (refreshNeeded) => {
    setIsTaskDialogOpen(false);
    setCurrentTask(null);
    if (refreshNeeded) {
      fetchData(true);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => {
      const searchTermMatch = filters.searchTerm ?
        (task.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         task.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        : true;
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
      const categoryMatch = filters.category === 'all' || task.category === filters.category;
      const assignedToMatch = filters.assignedTo === 'all' || task.assigned_to === filters.assignedTo;
      
      let dueDateMatch = true;
      if (task.due_date) {
        try {
          const taskDueDate = parseISO(task.due_date);
          if (isValid(taskDueDate)) {
            if (filters.dueDateFrom && taskDueDate < filters.dueDateFrom) dueDateMatch = false;
            if (filters.dueDateTo && taskDueDate > new Date(filters.dueDateTo).setHours(23,59,59,999)) dueDateMatch = false;
          }
        } catch (e) { console.warn("Invalid date for task", task.id, task.due_date); }
      } else {
        // If task has no due date, it won't match if a date filter is set
        if (filters.dueDateFrom || filters.dueDateTo) dueDateMatch = false;
      }

      return searchTermMatch && statusMatch && priorityMatch && categoryMatch && assignedToMatch && dueDateMatch;
    });
  }, [tasks, filters]);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'in_progress': return 'bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-100';
      case 'cancelled': return 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-100 line-through';
      case 'todo': 
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-100';
    }
  };
  
  const getUserDisplay = useCallback((email) => {
    if (!email) return t('tasks.unassigned');
    const user = users.find(u => u.email === email);
    return user ? (user.full_name || user.email) : email;
  }, [users, t]);


  if (loading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('filters.title', { defaultValue: 'Filters' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input
                placeholder={t('filters.searchTasks', { defaultValue: 'Search tasks...' })}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {priorityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey, { defaultValue: opt.defaultValue })}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.assignedTo} onValueChange={(value) => handleFilterChange('assignedTo', value)}>
              <SelectTrigger><SelectValue placeholder={t('tasks.filterByAssignee')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.allUsers', { defaultValue: 'All Users' })}</SelectItem>
                {users.map(user => <SelectItem key={user.email} value={user.email}>{user.full_name || user.email}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dueDateFrom ? format(filters.dueDateFrom, 'PPP') : t('filters.dueDateFrom', {defaultValue: "Due Date From"})}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={filters.dueDateFrom} onSelect={(date) => handleFilterChange('dueDateFrom', date)} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dueDateTo ? format(filters.dueDateTo, 'PPP') : t('filters.dueDateTo', {defaultValue: "Due Date To"})}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={filters.dueDateTo} onSelect={(date) => handleFilterChange('dueDateTo', date)} />
              </PopoverContent>
            </Popover>

          </div>
          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <Button variant="ghost" onClick={resetFilters} className="text-sm">
              <FilterX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('filters.reset', { defaultValue: 'Reset Filters' })}
            </Button>
            <Button variant="outline" onClick={() => fetchData(true)} disabled={loading} className="text-sm">
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
              {t('buttons.refresh', { defaultValue: 'Refresh' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-500 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('tasks.listTitle', {defaultValue: "Tasks List"})} ({filteredTasks.length})</h2>
        <Button onClick={() => openTaskDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('tasks.addTask')}
        </Button>
      </div>

      {loading && tasks.length > 0 && (
         <div className="text-center py-4"><LoadingSpinner /> {t('common.updatingList')}</div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={t('tasks.noTasksFoundTitle')}
          message={filters === initialFilters ? t('tasks.noTasksYet') : t('tasks.noTasksMatchFilters')}
          actionButton={
             <Button onClick={() => openTaskDialog()} className="mt-4">
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('tasks.createFirstTask')}
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <Card key={task.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className={`text-lg ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>{task.title}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => openTaskDialog(task)} className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {task.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">{task.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500" />
                <span className="font-medium mr-1 rtl:ml-1">{t('tasks.fields.category')}:</span>
                <Badge variant="secondary">{t(`taskCategory.${task.category}`, {defaultValue: task.category})}</Badge>
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500" />
                <span className="font-medium mr-1 rtl:ml-1">{t('tasks.fields.assigned_to')}:</span>
                {getUserDisplay(task.assigned_to)}
              </div>
              {task.due_date && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500" />
                  <span className="font-medium mr-1 rtl:ml-1">{t('tasks.fields.due_date')}:</span>
                  {isValid(parseISO(task.due_date)) ? format(parseISO(task.due_date), 'PPP') : t('common.invalidDate')}
                </div>
              )}
              {task.related_entity_type && task.related_entity_type !== 'none' && (
                <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500" />
                    <span className="font-medium mr-1 rtl:ml-1">{t('tasks.fields.related_entity_type')}:</span> 
                    {t(`relatedEntity.${task.related_entity_type}`, {defaultValue: task.related_entity_type})}
                    {task.related_entity_id && <span className="ml-1 rtl:mr-1">({task.related_entity_id})</span>}
                </div>
              )}
              {Array.isArray(task.tags) && task.tags.length > 0 && (
                <div className="flex items-start">
                  <TagIcon className="h-4 w-4 mr-2 rtl:ml-2 text-gray-500 mt-0.5" />
                  <div>
                    <span className="font-medium mr-1 rtl:ml-1">{t('tasks.fields.tags')}:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {task.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
              <Badge className={getPriorityBadgeClass(task.priority)}>{t(`priority.${task.priority}`, {defaultValue: task.priority})}</Badge>
              <Badge className={getStatusBadgeClass(task.status)}>{t(`taskStatus.${task.status}`, {defaultValue: task.status})}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isTaskDialogOpen && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={handleTaskDialogClose}
          task={currentTask}
        />
      )}
    </div>
  );
}