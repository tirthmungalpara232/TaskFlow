import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // A plain <Link to="/"> is a no-op (by design) when you're already on "/",
  // which can look broken. Using navigate() explicitly here, and only when
  // we're not already on the dashboard, makes the logo behave predictably
  // as a "go home" action from anywhere in the app.
  const goHome = () => {
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <nav className="glass-nav sticky top-0 z-20 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={goHome}
          className="group flex items-center gap-2 font-display text-lg font-bold transition-opacity hover:opacity-90"
          aria-label="Go to dashboard"
        >
          <span className="glow-ring flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-tide-400 text-white transition-transform group-hover:scale-105">
            <LayoutGrid size={17} strokeWidth={2.5} />
          </span>
          <span className="gradient-text">TaskFlow</span>
        </button>

        {/* Theme toggle and sign-out live on the Profile page only — this
            keeps the dashboard/board header focused on the work itself. */}
        {user && (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open profile"
          >
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
              {user.name.split(' ')[0]}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
