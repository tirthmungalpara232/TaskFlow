import { useEffect, useState } from 'react';
import { Plus, ListTodo, Loader, CheckCircle2, AlertTriangle, Flame, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';
import ProjectCard from '../components/ProjectCard';
import StatsCard from '../components/StatsCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { ProjectCardSkeleton, StatCardSkeleton } from '../components/Skeleton';
import useNotificationReminders from '../hooks/useNotificationReminders';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0] });
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Asks for notification permission (once per session) and reminds the user
  // about anything due tomorrow across all their projects.
  useNotificationReminders(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks/stats'),
      ]);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Could not load your dashboard. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ title: '', description: '', color: COLORS[0] });
      showToast('Project created');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the project.');
      showToast('Could not create the project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProject = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      showToast('Project deleted');
      loadData();
    } catch (err) {
      setError('Could not delete the project.');
      showToast('Could not delete the project', 'error');
    }
  };

  const projectPendingDelete = projects.find((p) => p._id === pendingDeleteId);

  return (
    <div className="min-h-screen mobile-nav-spacer">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {greeting()}{user ? <>, <span className="gradient-text">{user.name.split(' ')[0]}</span></> : ''}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your projects and progress at a glance</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> New project
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          stats && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatsCard label="Total tasks" value={stats.total} icon={ListTodo} accent="bg-brand-500" />
              <StatsCard label="In progress" value={stats.inProgress} icon={Loader} accent="bg-tide-500" />
              <StatsCard label="Completed" value={stats.done} icon={CheckCircle2} accent="bg-emerald-500" />
              <StatsCard label="High priority" value={stats.highPriority} icon={Flame} accent="bg-ember-600" />
              <StatsCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="bg-slate-500" />
            </div>
          )
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900">
              <Sparkles size={22} className="text-brand-600 dark:text-brand-400" />
            </div>
            <p className="font-display text-lg font-semibold">No projects yet</p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Create your first project to start organizing tasks on a Kanban board.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-2">
              Create a project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onDelete={setPendingDeleteId} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md animate-fade-in p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">New project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this project about?"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      style={{ backgroundColor: c }}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        title="Delete this project?"
        message={
          projectPendingDelete
            ? `"${projectPendingDelete.title}" and all ${projectPendingDelete.taskCount || 0} of its tasks will be permanently deleted. This can't be undone. A confirmation email will be sent to your account.`
            : ''
        }
        confirmLabel="Delete project"
        onConfirm={confirmDeleteProject}
        onCancel={() => setPendingDeleteId(null)}
      />

      <MobileNav />
    </div>
  );
};

export default Dashboard;
