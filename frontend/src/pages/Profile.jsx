import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, CheckCircle2, Plus, Pencil, Camera } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProgressChart from '../components/ProgressChart';
import Avatar from '../components/Avatar';
import { SkeletonBlock } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

// Resizes/compresses an image file client-side before it's turned into a
// base64 string — keeps the payload small (usually under ~40KB) instead of
// sending a multi-megabyte photo straight into the database.
const fileToCompressedDataUrl = (file, maxSize = 256, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [dateResult, setDateResult] = useState(null);
  const [loadingDate, setLoadingDate] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingChart(true);
      try {
        const [statsRes, progressRes] = await Promise.all([
          api.get('/tasks/stats'),
          api.get('/tasks/progress', { params: { days: 7 } }),
        ]);
        setStats(statsRes.data);
        setChartData(progressRes.data);
      } catch (err) {
        setError('Could not load your progress report. Please try refreshing the page.');
      } finally {
        setLoadingChart(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckDate = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    setLoadingDate(true);
    setError('');
    try {
      const { data } = await api.get('/tasks/progress/day', { params: { date: selectedDate } });
      setDateResult(data);
    } catch (err) {
      setError('Could not load activity for that date.');
    } finally {
      setLoadingDate(false);
    }
  };

  const startEditing = () => {
    setEditName(user?.name || '');
    setEditUsername(user?.username || '');
    setEditAvatar(user?.avatar || '');
    setEditing(true);
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file', 'error');
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setEditAvatar(dataUrl);
    } catch (err) {
      showToast('Could not process that image', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName, username: editUsername, avatar: editAvatar });
      setEditing(false);
      showToast('Profile updated');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update your profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const completionRate = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen mobile-nav-spacer">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-display text-2xl font-bold">Profile</h1>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Account card */}
        <div className="card mb-6 p-5">
          {!editing ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} src={user?.avatar} size="lg" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={startEditing} className="btn-secondary flex items-center gap-1.5">
                  <Pencil size={15} /> Edit profile
                </button>
                <button
                  onClick={toggleTheme}
                  className="btn-secondary flex items-center gap-1.5"
                  aria-label="Toggle dark mode"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative"
                  aria-label="Change profile picture"
                >
                  <Avatar name={editName} src={editAvatar} size="xl" />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/0 text-white opacity-0 transition-opacity group-hover:bg-slate-900/40 group-hover:opacity-100">
                    <Camera size={20} />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
                <div className="flex flex-col gap-1.5">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary w-fit text-xs">
                    Change photo
                  </button>
                  {editAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar('')}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input required className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Username</label>
                <input
                  required
                  className="input-field"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                />
                <p className="mt-1 text-xs text-slate-400">3-20 characters: letters, numbers, underscores, dots</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Overview stats */}
        {loadingChart ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card p-4">
                <SkeletonBlock className="mb-2 h-7 w-10" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          stats && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-4">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total tasks</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold">{stats.done}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completion rate</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          )
        )}

        {/* Last 7 days chart */}
        <div className="card mb-6 p-5">
          <h2 className="mb-1 font-display text-base font-semibold">Last 7 days</h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Tasks completed vs. created, per day</p>
          {loadingChart ? <SkeletonBlock className="h-[220px] w-full" /> : <ProgressChart data={chartData} />}
        </div>

        {/* Specific date lookup */}
        <div className="card p-5">
          <h2 className="mb-1 font-display text-base font-semibold">Look up a specific date</h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            See exactly what was completed or created on any day
          </p>

          <form onSubmit={handleCheckDate} className="mb-4 flex gap-2">
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button type="submit" disabled={loadingDate} className="btn-primary shrink-0">
              {loadingDate ? 'Checking...' : 'Check'}
            </button>
          </form>

          {dateResult && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} /> Completed ({dateResult.completed.length})
                </p>
                {dateResult.completed.length === 0 ? (
                  <p className="text-xs text-slate-400">Nothing completed that day.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {dateResult.completed.map((t) => (
                      <li key={t._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                        {t.title}
                        <span className="ml-2 text-xs text-slate-400">{t.project?.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
                  <Plus size={15} /> Created ({dateResult.created.length})
                </p>
                {dateResult.created.length === 0 ? (
                  <p className="text-xs text-slate-400">Nothing created that day.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {dateResult.created.map((t) => (
                      <li key={t._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                        {t.title}
                        <span className="ml-2 text-xs text-slate-400">{t.project?.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
