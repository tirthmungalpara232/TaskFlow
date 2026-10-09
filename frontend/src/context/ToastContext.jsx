import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

// A small, non-blocking notification system — "Task created", "Could not
// save changes", etc. — so success/failure feedback doesn't require a full
// inline banner every time. Toasts auto-dismiss after 4 seconds.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card pointer-events-auto flex animate-pop-in items-center gap-2 px-4 py-3 text-sm shadow-lg"
          >
            {t.type === 'error' ? (
              <XCircle size={16} className="shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            )}
            <span className="text-slate-700 dark:text-slate-200">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
