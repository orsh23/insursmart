
import React, { useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, CheckCircle, Users, Tag as CategoryIcon, MoreVertical, GripVertical, AlertTriangle, ExternalLink, ArrowRightCircle, Eye } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';
import { formatSafeDate, formatSafeDateDistance } from '@/components/utils/i18n-utils'; // Import safe formatters
import TaskStatusDropdown from './TaskStatusDropdown';
import TaskPriorityBadge from './TaskPriorityBadge';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const TaskCard = React.memo(function TaskCard({
  task,
  onEdit = () => {},
  onDelete = () => {},
  onStatusChange = () => {},
  t, language, isRTL,
  isSelectionModeActive,
  isSelected,
  onToggleSelection = () => {},
  onCardClick = () => {},
  onStartSelectionMode = () => {}
}) {
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (typeof onEdit === 'function') {
      onEdit();
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (typeof onDelete === 'function') {
      onDelete();
    }
  };

  const handleStatusChange = (newStatus) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(newStatus);
    }
  };

  const formatSafeDateLocal = useCallback((dateString) => {
    try {
      if (!dateString) return null;
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return formatSafeDate(date, language);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return null;
    }
  }, [language]);

  const formatSafeDateDistanceLocal = useCallback((dateString) => {
    try {
      if (!dateString) return null;
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return formatSafeDateDistance(date, language);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return null;
    }
  }, [language]);

  const cardBaseClass = "flex flex-col h-full transition-all duration-200 ease-in-out relative";
  const selectedCardClass = isSelectionModeActive && isSelected ? "ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400 shadow-lg" : "border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:border-gray-600";
  const cardClasses = `${cardBaseClass} ${selectedCardClass} ${isSelectionModeActive ? 'cursor-pointer' : ''}`;

  return (
    <Card className={cardClasses} onClick={isSelectionModeActive ? onToggleSelection : onCardClick}>
      {isSelectionModeActive && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          className="absolute top-2 left-2 z-10 h-5 w-5 bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500"
          aria-label={t('bulkActions.selectRow', {defaultValue: "Select task"})}
        />
      )}
      <CardHeader className={`pb-3 ${isSelectionModeActive ? 'pl-10' : ''}`}>
        <div className="flex justify-between items-start">
          <CardTitle
            className={`text-lg font-semibold leading-tight line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 ${isSelectionModeActive ? '' : 'cursor-pointer'}`}
            onClick={(e) => { if (!isSelectionModeActive) { e.stopPropagation(); onCardClick(); }}}
            title={task.title}
          >
            {task.title}
          </CardTitle>
          {!isSelectionModeActive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"}>
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" /> {t('common.edit', {defaultValue: 'Edit'})}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartSelectionMode('edit', task)}>
                  <Eye className="mr-2 h-4 w-4" /> {t('common.viewDetails', {defaultValue: 'View Details'})}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStartSelectionMode('delete', task)}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-500">{t('common.delete', {defaultValue: 'Delete'})}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
          <TaskPriorityBadge priority={task.priority} t={t} language={language} isRTL={isRTL} />
          {task.category && (
            <Badge variant="outline_gray" className="flex items-center gap-1 text-xs">
              <CategoryIcon className="h-3 w-3" /> {t(`category.${task.category}`, {defaultValue: task.category})}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={`flex-grow pb-3 space-y-2 ${isSelectionModeActive ? 'pl-10' : ''}`}>
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" title={task.description}>
            {task.description}
          </p>
        )}
        {!task.description && (
           <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            {t('common.noDescription', {defaultValue: 'No description provided.'})}
          </p>
        )}

        {task.due_date && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5" />
            <span>
              {t('tasks.fields.dueDate', {defaultValue: 'Due'})}:
              {formatSafeDateLocal(task.due_date) || t('common.invalidDate', {defaultValue: 'Invalid Date'})}
            </span>
            {new Date(task.due_date) < new Date() && task.status !== 'done' && (
               <AlertTriangle className="h-3.5 w-3.5 ml-1.5 rtl:mr-1.5 text-red-500" title={t('common.overdue', {defaultValue: 'Overdue'})} />
            )}
          </div>
        )}
        {task.assigned_to && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Users className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5" />
                <span>{t('tasks.fields.assignedTo', {defaultValue: 'Assigned'})}: {task.assigned_to_name || task.assigned_to}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className={`flex justify-between items-center pt-3 border-t dark:border-gray-700 ${isSelectionModeActive ? 'pl-10' : ''}`}>
        <TaskStatusDropdown
            currentStatus={task.status}
            onStatusChange={handleStatusChange}
            t={t} language={language} isRTL={isRTL}
            triggerClassName="text-xs"
        />
        <div className="text-xs text-gray-400 dark:text-gray-500" title={formatSafeDateLocal(task.updated_date) || ''}>
          {formatSafeDateDistanceLocal(task.updated_date) || t('common.invalidDate', {defaultValue: 'Invalid Date'})}
        </div>
      </CardFooter>
    </Card>
  );
});

export default TaskCard;
