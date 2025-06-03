// pages/tasks.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '.@/api/entities/Task';
import { Button } from '../components/ui/button';
import TaskList from '../components/tasks/TaskList';
import KanbanBoard from '../components/tasks/KanbanBoard';
import LoadingSpinner from '../components/ui/loading-spinner';
import ViewSwitcher from '../components/shared/ViewSwitcher';
import { useDebounce } from '../components/hooks/useDebounce';
import TaskFilters from '../components/tasks/TaskFilters';
import Pagination from '../components/shared/Pagination';
import SortDropdown from '../components/shared/SortDropdown';
import { Core } from '.@/api/integrations/Core';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [due, setDue] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [sortField, setSortField] = useState("created_date");
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
    try {
      const stored = localStorage.getItem('selectedTaskIds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [uploadingId, setUploadingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', status: 'todo', priority: 'medium' });

  const [params, setParams] = useSearchParams();
  const debouncedSearch = useDebounce(search, 300);
  const pageSize = 20;

  useEffect(() => {
    localStorage.setItem('selectedTaskIds', JSON.stringify(selectedTaskIds));
  }, [selectedTaskIds]);

  useEffect(() => {
    setPage(parseInt(params.get("page")) || 0);
    setSearch(params.get("search") || "");
    setStatus(params.get("status") || "all");
    setPriority(params.get("priority") || "all");
    setCategory(params.get("category") || "all");
    setAssignee(params.get("assignee") || "all");
    setDue(params.get("due") || "all");
    setViewMode(params.get("view") || "list");
    setSortField(params.get("sort") || "created_date");
  }, []);

  useEffect(() => {
    setParams({ page, search, status, priority, category, assignee, due, view: viewMode, sort: sortField });
  }, [page, search, status, priority, category, assignee, due, viewMode, sortField]);

  const filterObj = useMemo(() => {
    const filters = {};
    if (status !== 'all') filters.status = status;
    if (priority !== 'all') filters.priority = priority;
    if (category !== 'all') filters.category = category;
    if (assignee !== 'all') filters.assignee = assignee;
    if (due !== 'all') filters.due_date = due;
    if (debouncedSearch) {
      filters.$or = [
        { title: { $contains: debouncedSearch } },
        { description: { $contains: debouncedSearch } }
      ];
    }
    return filters;
  }, [status, priority, category, assignee, due, debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    Task.filter(filterObj, sortField, pageSize, page * pageSize)
      .then(setTasks)
      .finally(() => setIsLoading(false));
  }, [filterObj, page, sortField]);

  useEffect(() => {
    Task.filter(filterObj).then(all => setTotalCount(all.length));
  }, [filterObj]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleUploadFile = async (taskId, file) => {
    setUploadingId(taskId);
    const result = await Core.UploadFile({ file });
    if (result?.file_url) {
      await Task.update(taskId, { attachment: result.file_url });
    }
    setUploadingId(null);
  };

  const handleSelect = (taskOrIds) => {
    if (Array.isArray(taskOrIds)) {
      setSelectedTaskIds(taskOrIds);
    } else {
      setSelectedTaskIds(prev =>
        prev.includes(taskOrIds)
          ? prev.filter(id => id !== taskOrIds)
          : [...prev, taskOrIds]
      );
    }
  };

  const exportToCSV = () => {
    const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));
    const csvRows = [
      ["ID", "Title", "Status", "Priority", "Assignee"],
      ...selectedTasks.map(t => [t.id, t.title, t.status, t.priority, t.assignee || ""]).map(row => row.join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateTask = async () => {
    const created = await Task.create(newTask);
    setShowAddModal(false);
    setNewTask({ title: '', status: 'todo', priority: 'medium' });
    const refreshed = await Task.filter(filterObj, sortField, pageSize, page * pageSize);
    setTasks(refreshed);
  };

  return (
    <div className="p-4 relative">
      <h1 className="text-xl font-bold mb-4">Tasks</h1>

      <div className="flex justify-between items-center mb-4">
        <ViewSwitcher value={viewMode} onChange={setViewMode} />
        <SortDropdown value={sortField} onChange={setSortField} />
      </div>

      <TaskFilters
        search={search} setSearch={setSearch}
        status={status} setStatus={setStatus}
        priority={priority} setPriority={setPriority}
        category={category} setCategory={setCategory}
        assignee={assignee} setAssignee={setAssignee}
        due={due} setDue={setDue}
        tasks={tasks}
        onClear={() => {
          setSearch(""); setStatus("all"); setPriority("all");
          setCategory("all"); setAssignee("all"); setDue("all");
        }}
      />

      {selectedTaskIds.length > 0 && (
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{selectedTaskIds.length} selected</span>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm('Delete selected tasks?')) return;
                await Promise.all(selectedTaskIds.map(id => Task.delete(id)));
                setSelectedTaskIds([]);
                const refreshed = await Task.filter(filterObj, sortField, pageSize, page * pageSize);
                setTasks(refreshed);
                const count = await Task.filter(filterObj);
                setTotalCount(count.length);
              }}
            >
              Delete Selected
            </Button>
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              Export CSV
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        viewMode === 'kanban' ? (
          <KanbanBoard tasks={tasks} language="en" />
        ) : (
          <TaskList
            tasks={tasks}
            onStatusChange={() => {}}
            onEdit={() => {}}
            onView={() => {}}
            onDelete={() => {}}
            onSelect={handleSelect}
            selectedIds={selectedTaskIds}
            onFileUpload={handleUploadFile}
            uploadingId={uploadingId}
          />
        )
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNext={tasks.length === pageSize}
        onPrev={() => setPage(p => p - 1)}
        onNext={() => setPage(p => p + 1)}
      />

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-primary text-white px-4 py-2 rounded-full shadow-lg"
      >
        + Add Task
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Task</h2>
            <input
              className="border w-full px-2 py-1 rounded mb-2"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            />
            <div className="flex gap-2 mb-4">
              <select
                className="border px-2 py-1 rounded w-full"
                value={newTask.status}
                onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                className="border px-2 py-1 rounded w-full"
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleCreateTask}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
