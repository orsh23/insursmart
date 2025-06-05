
import React, { useMemo } from 'react';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Make sure to import ViewSwitcher correctly if it's used
import ViewSwitcherDropdown from '@/components/common/ViewSwitcher';

// TaskList for Card View
export default function TaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  pagination, // { currentPage, totalPages, onPageChange }
  sortConfig, // { key, direction }
  onSortChange, // (newSortConfig) => void
  t, language, isRTL,
  isSelectionModeActive,
  selectedTaskIds,
  onToggleTaskSelection,
  onStartSelectionMode
}) {

  const sortableFields = useMemo(() => [
    { key: 'title', label: t('tasks.fields.title', {defaultValue: 'Title'}) },
    { key: 'due_date', label: t('tasks.fields.dueDate', {defaultValue: 'Due Date'}) },
    { key: 'priority', label: t('tasks.fields.priority', {defaultValue: 'Priority'}) },
    { key: 'status', label: t('tasks.fields.status', {defaultValue: 'Status'}) },
    { key: 'updated_date', label: t('common.lastUpdated', {defaultValue: 'Last Updated'}) },
    { key: 'created_date', label: t('common.createdDate', {defaultValue: 'Created Date'}) },
  ], [t]);

  const handleSortFieldChange = (newKey) => {
    if (sortConfig.key === newKey) {
      onSortChange({ key: newKey, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' });
    } else {
      onSortChange({ key: newKey, direction: 'ascending' });
    }
  };
  
  const CurrentSortIcon = sortConfig.direction === 'ascending' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {/* Basic pagination info, can be enhanced */}
          {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: pagination.totalPages, defaultValue: `Page ${pagination.currentPage} of ${pagination.totalPages}`})}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.sortBy', {defaultValue: "Sort by"})}:</span>
          <Select value={sortConfig.key} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder={t('common.selectField', {defaultValue:"Select Field"})} />
            </SelectTrigger>
            <SelectContent>
              {sortableFields.map(field => (
                <SelectItem key={field.key} value={field.key} className="text-sm">
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => handleSortFieldChange(sortConfig.key)} className="h-9 px-3">
            <CurrentSortIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task.id)}
            onStatusChange={(newStatus) => onStatusChange(task, newStatus)}
            t={t} language={language} isRTL={isRTL}
            isSelectionModeActive={isSelectionModeActive}
            isSelected={selectedTaskIds.has(task.id)}
            onToggleSelection={() => onToggleTaskSelection(task.id)}
            onCardClick={() => {
              if (isSelectionModeActive) {
                onToggleTaskSelection(task.id);
              } else {
                onEditTask(task); // Or a dedicated view details action
              }
            }}
            onStartSelectionMode={onStartSelectionMode} // Pass this down for context menu actions
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            aria-label={t('buttons.previous', {defaultValue: 'Previous'})}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="hidden sm:inline mx-1">{t('buttons.previous', {defaultValue: 'Previous'})}</span>
          </Button>
          {/* Simple page number display, can be expanded to show more page numbers */}
          {[...Array(pagination.totalPages).keys()].map((page) => {
            const pageNum = page + 1;
            if (
              pageNum === 1 ||
              pageNum === pagination.totalPages ||
              (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9"
                  onClick={() => pagination.onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            } else if (
              (pageNum === pagination.currentPage - 2 && pagination.currentPage > 3) ||
              (pageNum === pagination.currentPage + 2 && pagination.currentPage < pagination.totalPages - 2)
            ) {
              return <span key={pageNum} className="text-gray-500 dark:text-gray-400">...</span>;
            }
            return null;
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            aria-label={t('buttons.next', {defaultValue: 'Next'})}
          >
            <span className="hidden sm:inline mx-1">{t('buttons.next', {defaultValue: 'Next'})}</span>
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
