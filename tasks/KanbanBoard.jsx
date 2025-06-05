// components/tasks/KanbanBoard.jsx
import React, { useMemo } from 'react';
import { Card } from "../ui/card";
import { PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';

/**
 * Kanban board view for task management
 */
export default function KanbanBoard({
  tasks = [],
  language = "en",
  onEdit,
  onDelete,
  onCreateTask
}) {
  const isRTL = language === "he";

  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const group = acc[task.status] || [];
      group.push(task);
      acc[task.status] = group;
      return acc;
    }, {});
  }, [tasks]);

  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: groupedTasks["todo"] || [],
    },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: groupedTasks["in_progress"] || [],
    },
    {
      id: "review",
      title: "In Review",
      tasks: groupedTasks["review"] || [],
    },
    {
      id: "done",
      title: "Done",
      tasks: groupedTasks["done"] || [],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(column => (
        <div
          key={column.id}
          className={`rounded-lg p-3 h-full flex flex-col bg-muted`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">{column.title}</h3>
            <div className="text-xs bg-white rounded-full px-2 py-0.5">
              {column.tasks.length}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto max-h-[650px] space-y-2 pb-2">
            {column.tasks.map(task => (
              <Card
                key={task.id}
                className="p-3 bg-white hover:shadow-md cursor-pointer"
                onClick={() => onEdit(task)}
              >
                <div className="mb-2">
                  <h4 className="font-medium line-clamp-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2">
                  <TaskPriorityBadge priority={task.priority} language={language} />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
            {column.tasks.length === 0 && (
              <div className="text-xs text-muted-foreground">No tasks</div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-gray-600"
            onClick={() => onCreateTask(column.id)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            {isRTL ? "הוסף משימה" : "Add Task"}
          </Button>
        </div>
      ))}
    </div>
  );
}
