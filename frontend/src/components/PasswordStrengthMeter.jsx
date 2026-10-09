// Scores a password 0-4 based on length and character variety, then renders
// a small segmented bar + label. This is a UX nudge, not real entropy analysis.
const scorePassword = (password) => {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(score, 4);
};

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-slate-300 dark:bg-slate-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];

const PasswordStrengthMeter = ({ password }) => {
  const score = scorePassword(password);
  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? COLORS[score] : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{LABELS[score]}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
