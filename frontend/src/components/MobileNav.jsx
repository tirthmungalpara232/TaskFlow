import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';

// A bottom tab bar shown only on small screens (sm:hidden) — puts primary
// navigation within thumb reach on a phone, which a top navbar alone doesn't.
// Includes safe-area padding so it doesn't collide with the iOS home indicator.
const MobileNav = () => {
  const linkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
      isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
    }`;

  return (
    <nav
      className="glass-nav fixed inset-x-0 bottom-0 z-20 flex border-t sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <NavLink to="/" end className={linkClass}>
        <Home size={20} />
        Dashboard
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User size={20} />
        Profile
      </NavLink>
    </nav>
  );
};

export default MobileNav;
