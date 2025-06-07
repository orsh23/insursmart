// Content of components/hooks/useFilteredTasks.js
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
  if (!filterDate) return true; // No date filter applied
  if (!taskDate) return false; // Task has no due date, but filter is set
  
  // Ensure comparison is date-only, ignoring time, if filterDate is just a date string
  const tDate = new Date(taskDate);
  tDate.setHours(0,0,0,0); // Normalize task due date
  
  let fDate = new Date(filterDate);
  // If filterDate is a string like "YYYY-MM-DD", JS new Date() interprets it as UTC midnight.
  // To ensure it's treated as local day for comparison:
  if (typeof filterDate === 'string' && filterDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = filterDate.split('-').map(Number);
      fDate = new Date(year, month - 1, day); // Creates local date
  }
  fDate.setHours(0,0,0,0); // Normalize filter date if it had time
  
  return tDate <= fDate; // Task due date is on or before the filter date
}

export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter(task =>
      matchSearch(task, filters.searchTerm) &&
      matchExact(task.status, filters.status) &&
      matchExact(task.priority, filters.priority) &&
      matchExact(task.category, filters.category) &&
      matchDueDate(task.due_date, filters.dueDate) //dueDate from filter can be null
    );
  }, [tasks, filters]);
}