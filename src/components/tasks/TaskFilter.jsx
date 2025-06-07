// components/tasks/TaskFilters.jsx
import React from 'react';

export default function TaskFilters({
  search, setSearch,
  status, setStatus,
  priority, setPriority,
  category, setCategory,
  assignee, setAssignee,
  due, setDue,
  tasks,
  onClear
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <input
        className="border rounded px-3 py-2"
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="border rounded px-3 py-2"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">All Statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        className="border rounded px-3 py-2"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="all">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select
        className="border rounded px-3 py-2"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        {[...new Set(tasks.map(t => t.category).filter(Boolean))].map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        className="border rounded px-3 py-2"
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
      >
        <option value="all">All Assignees</option>
        {[...new Set(tasks.map(t => t.assignee).filter(Boolean))].map(user => (
          <option key={user} value={user}>{user}</option>
        ))}
      </select>

      <select
        className="border rounded px-3 py-2"
        value={due}
        onChange={(e) => setDue(e.target.value)}
      >
        <option value="all">All Due Dates</option>
        {[...new Set(tasks.map(t => t.due_date).filter(Boolean))].map(date => (
          <option key={date} value={date}>{date}</option>
        ))}
      </select>

      <button
        className="border rounded px-3 py-2 col-span-1 md:col-span-3 lg:col-span-4 text-sm text-muted-foreground hover:text-foreground"
        onClick={onClear}
      >
        Clear All Filters
      </button>
    </div>
  );
}
