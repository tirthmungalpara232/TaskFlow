import { AlertTriangle, X } from 'lucide-react';

// A reusable "are you sure?" modal — replaces the browser's native confirm()
// so deletions always get a clear, on-brand warning before anything is removed.
const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-pop-in p-6">
        <div className="mb-3 flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-red-100 dark:bg-red-950' : 'bg-amber-100 dark:bg-amber-950'}`}>
            <AlertTriangle size={18} className={danger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
          </div>
          <button onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <h2 className="font-display text-base font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
