import React from 'react';
import { User } from '@/components/ui/user';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskCard from './TaskCard';

export default function AssigneeView({ 
  tasks = [], 
  language = "en",
  onEdit,
  onDelete,
  onStatusChange 
}) {
  const isRTL = language === "he";
  
  // Group tasks by assignee
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assignee = task.assignee || 'unassigned';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(task);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(tasksByAssignee).map(([assignee, assigneeTasks]) => (
        <Card key={assignee} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User 
                className="h-8 w-8" 
                email={assignee === 'unassigned' ? null : assignee} 
              />
              <div>
                <h3 className="font-medium">
                  {assignee === 'unassigned' 
                    ? (isRTL ? 'לא הוקצה' : 'Unassigned')
                    : assignee.split('@')[0]
                  }
                </h3>
                <p className="text-sm text-gray-500">
                  {assigneeTasks.length} {isRTL ? 'משימות' : 'tasks'}
                </p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {assigneeTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  language={language}
                  onEdit={() => onEdit(task)}
                  onDelete={() => onDelete(task.id)}
                  onStatusChange={(status) => onStatusChange(task.id, status)}
                  compact
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      ))}
    </div>
  );
}