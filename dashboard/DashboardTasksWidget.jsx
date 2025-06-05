
import React from 'react';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/cn';
import Badge from '../ui/badge'; // Updated import
import { getTaskStatusIcon, getPriorityStyling, getCategoryStyling } from '../tasks/taskHelpers';

export default function DashboardTasksWidget({ tasks = [], onTaskClick }) {
  const { t, isRTL } = useLanguage();

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (safeTasks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        {t('tasks.noTasksFound', { defaultValue: 'No tasks found' })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(safeTasks || []).map(task => {
        const priorityStyling = getPriorityStyling(task.priority, t);
        const categoryStyling = getCategoryStyling(task.category, t);
        
        return (
          <div 
            key={task.id}
            className={cn(
              "flex items-start p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors",
              isRTL && "flex-row-reverse text-right"
            )}
            onClick={() => onTaskClick(task)}
          >
            <div className={cn("mt-0.5", isRTL ? "ml-3" : "mr-3")}>
                {getTaskStatusIcon(task.status, "h-5 w-5")}
            </div>
            
            <div className="flex-grow min-w-0">
              <h4 className={cn(
                "font-medium truncate",
                task.status === 'done' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              
              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-xs">
                {task.category && (
                  <Badge variant="secondary" className={cn("font-normal", categoryStyling.badgeClass)}>
                    {categoryStyling.label}
                  </Badge>
                )}
                
                {task.priority && (
                  <span className={cn(priorityStyling.textColor, "flex items-center")}>
                    {priorityStyling.icon}
                    {priorityStyling.label}
                  </span>
                )}
                
                {task.due_date && (
                  <span className="text-gray-500">
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
