import { useEffect, useState, type FormEvent } from 'react';
import { api, type Task } from '../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckSquare, 
  Loader2, 
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('pending');
    setPriority('medium');
    setDueDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || null,
      };

      if (editingTask) {
        // Update task
        await api.updateTask(editingTask.id, payload);
      } else {
        // Create task
        await api.createTask(payload);
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err: any) {
      console.error('Save task error:', err);
      alert(err.message || 'Failed to save task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await api.deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      await fetchTasks();
    } catch (err: any) {
      console.error('Delete task error:', err);
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter tasks in memory
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="tasks-container">
      {/* Header section */}
      <div className="page-header">
        <div>
          <h1>Task Management</h1>
          <p className="subtitle">Create, view, update, and manage your Firestore tasks</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {error && (
        <div className="alert alert-error margin-b">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="select-wrapper">
            <Filter size={16} className="select-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="select-wrapper">
            <Filter size={16} className="select-icon" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="page-loader">
          <Loader2 className="spinner icon-lg" />
          <p>Loading tasks from Firestore...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <CheckSquare size={48} className="empty-icon" />
          <h3>No tasks match your filter</h3>
          <p>Try adjusting your search query or filters, or create a new task.</p>
          <button onClick={openCreateModal} className="btn btn-primary margin-t">
            <Plus size={18} />
            Create Task
          </button>
        </div>
      ) : (
        /* Tasks Grid */
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <div className="badges-group">
                  <span className={`badge badge-status status-${task.status}`}>
                    {task.status === 'pending' && <Clock size={12} className="inline-icon-xs" />}
                    {task.status === 'in_progress' && <AlertCircle size={12} className="inline-icon-xs" />}
                    {task.status === 'completed' && <CheckCircle2 size={12} className="inline-icon-xs" />}
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-priority priority-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                
                <div className="task-actions">
                  <button
                    onClick={() => openEditModal(task)}
                    className="action-icon-btn edit"
                    title="Edit Task"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(task)}
                    className="action-icon-btn delete"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="task-card-title">{task.title}</h3>
              
              {task.description && (
                <p className="task-card-desc">{task.description}</p>
              )}

              <div className="task-card-footer">
                {task.dueDate ? (
                  <span className="due-date-tag">
                    <Calendar size={14} /> Due: {task.dueDate}
                  </span>
                ) : (
                  <span className="text-muted text-sm">No due date</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            <p>
              {editingTask
                ? 'Update your existing task properties.'
                : 'Add a new task to your personal task list.'}
            </p>

            <form onSubmit={handleSaveTask}>
              <div className="form-group margin-v">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group margin-v">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Task details or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group margin-v">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-warning-header">
              <AlertTriangle size={32} className="warning-icon" />
              <h3>Delete Task</h3>
            </div>
            <p>
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This operation will remove the Firestore document permanently.
            </p>

            <div className="modal-actions margin-t-lg">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteTask}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
