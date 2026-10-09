import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Users, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';
import InviteModal from '../components/InviteModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ChatPanel from '../components/chat/ChatPanel';
import { TaskCardSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const COLUMNS = [
  { status: 'Todo', title: 'Todo', accentClass: 'bg-brand-500' },
  { status: 'In Progress', title: 'In Progress', accentClass: 'bg-tide-500' },
  { status: 'Done', title: 'Done', accentClass: 'bg-emerald-500' },
];

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { project: id } }),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError('Could not load this project. It may have been deleted, or you may no longer have access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  const tasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);

  const openCreateModal = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (form) => {
    try {
      if (editingTask) {
        const { data } = await api.put(`/tasks/${editingTask._id}`, form);
        setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
        showToast('Task updated');
      } else {
        const { data } = await api.post('/tasks', { ...form, project: id });
        setTasks((prev) => [data, ...prev]);
        showToast('Task created');
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the task.');
      showToast('Could not save the task', 'error');
    }
  };

  const handleDeleteTask = (taskId) => {
    setPendingDeleteTaskId(taskId);
  };

  const confirmDeleteTask = async () => {
    const taskId = pendingDeleteTaskId;
    setPendingDeleteTaskId(null);
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast('Task deleted');
    } catch (err) {
      setError('Could not delete the task.');
      showToast('Could not delete the task', 'error');
    }
  };

  const handleDrop = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // optimistic UI update
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      // roll back on failure
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t)));
      setError('Could not move the task. Please try again.');
      showToast('Could not move the task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mobile-nav-spacer">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col gap-4 md:flex-row">
            {[0, 1, 2].map((col) => (
              <div key={col} className="flex-1 space-y-2.5 rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900/50">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            ))}
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen mobile-nav-spacer">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error || 'Project not found.'}</p>
          <Link to="/" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline dark:text-brand-400">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </div>
        <MobileNav />
      </div>
    );
  }

  const teamCount = 1 + (project.members?.length || 0);

  return (
    <div className="min-h-screen mobile-nav-spacer">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="font-display text-2xl font-bold">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-secondary flex items-center gap-1.5"
              title="Manage team members"
            >
              <Users size={16} /> {teamCount}
            </button>
            <button
              onClick={() => setShowChatPanel(true)}
              className="btn-secondary flex items-center gap-1.5"
              title="Open project chat"
            >
              <MessageCircle size={16} /> Chat
            </button>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-1.5">
              <Plus size={16} /> New task
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9"
              placeholder="Search tasks by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              accentClass={col.accentClass}
              tasks={tasksByStatus(col.status)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </main>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
        initialTask={editingTask}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        project={project}
        isOwner={project.isOwner ?? project.user?._id === user?._id}
        onProjectUpdate={(updated) => setProject((prev) => ({ ...prev, ...updated }))}
      />

      <ConfirmDialog
        isOpen={!!pendingDeleteTaskId}
        title="Delete this task?"
        message="This task will be permanently removed from the board. This can't be undone."
        confirmLabel="Delete task"
        onConfirm={confirmDeleteTask}
        onCancel={() => setPendingDeleteTaskId(null)}
      />

      <ChatPanel isOpen={showChatPanel} onClose={() => setShowChatPanel(false)} projectId={id} />

      <MobileNav />
    </div>
  );
};

export default ProjectDetails;
