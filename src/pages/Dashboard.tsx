import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type DashboardStats, type Task } from '../lib/api';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Loader2, 
  Calendar,
  Sparkles
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newStatus, setNewStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [newDueDate, setNewDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsRes = await api.getDashboardStats();
      setData(statsRes);

      try {
        const profileRes = await api.getProfile();
        if (profileRes.fullName) {
          setProfileName(profileRes.fullName);
        }
      } catch (pErr) {
        console.warn('Profile fetch soft error:', pErr);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard statistics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSavingTask(true);
      await api.createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        status: newStatus,
        dueDate: newDueDate || null,
      });

      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewStatus('pending');
      setNewDueDate('');

      // Refresh dashboard stats
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Task creation error:', err);
      alert(err.message || 'Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <Loader2 className="spinner icon-lg" />
        <p>Fetching your workspace dashboard...</p>
      </div>
    );
  }

  const welcomeName = profileName || user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome back, {welcomeName}! <Sparkles className="inline-icon" /></h1>
          <p>Here's an overview of your workspace tasks and activity.</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-indigo">
            <CheckSquare size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{data?.stats.total ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{data?.stats.pending ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-cyan">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{data?.stats.in_progress ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{data?.stats.completed ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Tasks List */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2>Recent Tasks</h2>
            <p className="subtitle">Your 5 most recently updated tasks</p>
          </div>
          <Link to="/tasks" className="link-btn flex-center">
            View All Tasks <ArrowRight size={16} />
          </Link>
        </div>

        {(!data?.recentTasks || data.recentTasks.length === 0) ? (
          <div className="empty-state">
            <CheckSquare size={48} className="empty-icon" />
            <h3>No tasks found</h3>
            <p>You haven't created any tasks yet. Get started by creating your first task!</p>
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary margin-t">
              <Plus size={18} />
              Create First Task
            </button>
          </div>
        ) : (
          <div className="task-list-table">
            <div className="table-header">
              <span>Task</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Due Date</span>
            </div>
            {data.recentTasks.map((task: Task) => (
              <div key={task.id} className="table-row" onClick={() => navigate('/tasks')}>
                <div className="cell-title">
                  <span className="task-name">{task.title}</span>
                  {task.description && (
                    <span className="task-desc">{task.description}</span>
                  )}
                </div>
                <div className="cell-status">
                  <span className={`badge badge-status status-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="cell-priority">
                  <span className={`badge badge-priority priority-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="cell-date">
                  {task.dueDate ? (
                    <span className="date-tag">
                      <Calendar size={14} /> {task.dueDate}
                    </span>
                  ) : (
                    <span className="text-muted">No date</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Create Task Modal */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Quick Create Task</h3>
            <p>Add a new task to your Firestore database via Express API.</p>

            <form onSubmit={handleQuickCreateTask}>
              <div className="form-group margin-v">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Landing Page"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group margin-v">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
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
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
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
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingTask}>
                  {savingTask ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
