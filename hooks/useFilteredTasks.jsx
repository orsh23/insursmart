import { useMemo } from 'react';

function matchSearch(task, term) {
  if (!term) return true;
  const lower = term.toLowerCase();
  return (task.title?.toLowerCase().includes(lower) ||
          task.description?.toLowerCase().includes(lower));
}

function matchExact(field, value) {
  return value === 'all' || field === value;
}

function matchDueDate(taskDate, filterDate) {
  if (!filterDate) return true;
  if (!taskDate) return false;
  return new Date(taskDate) <= new Date(filterDate);
}

export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter(task =>
      matchSearch(task, filters.searchTerm) &&
      matchExact(task.status, filters.status) &&
      matchExact(task.priority, filters.priority) &&
      matchExact(task.category, filters.category) &&
      matchDueDate(task.due_date, filters.dueDate)
    );
  }, [tasks, filters]);
}
