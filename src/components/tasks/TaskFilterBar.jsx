import React, { useState, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar as CalendarIcon, SortAsc, SortDesc, RotateCcw } from 'lucide-react';
import { cn } from '@/components/utils/cn';

export default function TaskFilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  allTasks = [],
  t, language, isRTL,
  currentView
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const uniqueAssignees = [...new Set(allTasks.map(task => task.assigned_to).filter(Boolean))];
    return {
      assignees: uniqueAssignees
    };
  }, [allTasks]);

  const handleFilterChange = useCallback((key, value) => {
    onFiltersChange({ [key]: value });
  }, [onFiltersChange]);

  const handleDueDateSelect = useCallback((date) => {
    handleFilterChange('dueDate', date);
    setDueDateOpen(false);
  }, [handleFilterChange]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return value && value.trim() !== '';
      if (key === 'dueDate') return value !== null;
      return value !== 'all';
    });
  }, [filters]);

  const sortOptions = [
    { key: 'title', label: t('tasks.fields.title', {defaultValue: 'Title'}) },
    { key: 'status', label: t('tasks.fields.status', {defaultValue: 'Status'}) },
    { key: 'priority', label: t('tasks.fields.priority', {defaultValue: 'Priority'}) },
    { key: 'category', label: t('tasks.fields.category', {defaultValue: 'Category'}) },
    { key: 'due_date', label: t('tasks.fields.dueDate', {defaultValue: 'Due Date'}) },
    { key: 'created_date', label: t('common.created', {defaultValue: 'Created'}) },
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search and primary filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('tasks.searchPlaceholder', {defaultValue: 'Search tasks...'})}
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('filters.selectStatus', {defaultValue: 'Status'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses', {defaultValue: 'All Statuses'})}</SelectItem>
                <SelectItem value="todo">{t('status.todo', {defaultValue: 'Todo'})}</SelectItem>
                <SelectItem value="in_progress">{t('status.in_progress', {defaultValue: 'In Progress'})}</SelectItem>
                <SelectItem value="done">{t('status.done', {defaultValue: 'Done'})}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled', {defaultValue: 'Cancelled'})}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority || 'all'} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('filters.selectPriority', {defaultValue: 'Priority'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allPriorities', {defaultValue: 'All Priorities'})}</SelectItem>
                <SelectItem value="low">{t('priority.low', {defaultValue: 'Low'})}</SelectItem>
                <SelectItem value="medium">{t('priority.medium', {defaultValue: 'Medium'})}</SelectItem>
                <SelectItem value="high">{t('priority.high', {defaultValue: 'High'})}</SelectItem>
                <SelectItem value="urgent">{t('priority.urgent', {defaultValue: 'Urgent'})}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('common.filters', {defaultValue: 'Filters'})}
              {hasActiveFilters && <Badge variant="secondary" className="ml-1">{Object.values(filters).filter(v => v && v !== 'all').length}</Badge>}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onResetFilters} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                {t('buttons.resetFilters', {defaultValue: 'Reset'})}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectCategory', {defaultValue: 'Category'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories', {defaultValue: 'All Categories'})}</SelectItem>
                <SelectItem value="claim_review">{t('category.claim_review', {defaultValue: 'Claim Review'})}</SelectItem>
                <SelectItem value="provider_onboarding">{t('category.provider_onboarding', {defaultValue: 'Provider Onboarding'})}</SelectItem>
                <SelectItem value="contract_negotiation">{t('category.contract_negotiation', {defaultValue: 'Contract Negotiation'})}</SelectItem>
                <SelectItem value="compliance_check">{t('category.compliance_check', {defaultValue: 'Compliance Check'})}</SelectItem>
                <SelectItem value="data_validation">{t('category.data_validation', {defaultValue: 'Data Validation'})}</SelectItem>
                <SelectItem value="system_maintenance">{t('category.system_maintenance', {defaultValue: 'System Maintenance'})}</SelectItem>
                <SelectItem value="training">{t('category.training', {defaultValue: 'Training'})}</SelectItem>
                <SelectItem value="general">{t('category.general', {defaultValue: 'General'})}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.assignee || 'all'} onValueChange={(value) => handleFilterChange('assignee', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('tasks.fields.assignedTo', {defaultValue: 'Assigned To'})} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allAssignees', {defaultValue: 'All Assignees'})}</SelectItem>
                {filterOptions.assignees.map(assignee => (
                  <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dueDate ? (
                    new Date(filters.dueDate).toLocaleDateString()
                  ) : (
                    t('tasks.fields.dueDate', {defaultValue: 'Due Date'})
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dueDate}
                  onSelect={handleDueDateSelect}
                  initialFocus
                />
                {filters.dueDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('dueDate', null)}
                      className="w-full"
                    >
                      {t('common.clear', {defaultValue: 'Clear'})}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Sort controls - show for table view */}
            {currentView === 'table' && (
              <Select 
                value={`${sortConfig.key}-${sortConfig.direction}`} 
                onValueChange={(value) => {
                  const [key, direction] = value.split('-');
                  onSortChange({ key, direction });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.sortBy', {defaultValue: 'Sort By'})} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <React.Fragment key={option.key}>
                      <SelectItem value={`${option.key}-ascending`}>
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                      <SelectItem value={`${option.key}-descending`}>
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}