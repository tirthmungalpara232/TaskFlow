const initials = (name) => (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

// Shows the user's uploaded profile picture if they have one, otherwise falls
// back to a colored circle with their initials. Used anywhere a person shows up:
// navbar, team member lists, profile page.
const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizeClass = SIZES[size] || SIZES.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={`shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300 ${sizeClass} ${className}`}
    >
      {initials(name)}
    </span>
  );
};

export default Avatar;
