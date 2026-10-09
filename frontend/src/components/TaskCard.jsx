import { Calendar, Trash2, Pencil } from 'lucide-react';

const priorityStyles = {
  High: 'bg-ember-100 text-ember-700 dark:bg-ember-500/15 dark:text-ember-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Low: 'bg-tide-100 text-tide-700 dark:bg-tide-500/15 dark:text-tide-300',
};

const priorityGlow = {
  High: 'hover:shadow-[0_10px_28px_-10px_rgba(232,72,58,0.45)] hover:border-ember-300/60 dark:hover:border-ember-500/40',
  Medium: 'hover:shadow-[0_10px_28px_-10px_rgba(217,119,6,0.4)] hover:border-amber-300/60 dark:hover:border-amber-500/40',
  Low: 'hover:shadow-[0_10px_28px_-10px_rgba(20,184,174,0.4)] hover:border-tide-300/60 dark:hover:border-tide-500/40',
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'Done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
};

const TaskCard = ({ task, onEdit, onDelete, draggable, onDragStart }) => {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, task)}
      className={`group card cursor-grab space-y-2.5 p-3.5 transition-all duration-200 hover:-translate-y-0.5 active:cursor-grabbing active:scale-[0.99] ${priorityGlow[task.priority] || ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 text-xs ${
              overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-400'
            }`}
          >
            <Calendar size={12} />
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {overdue && ' · overdue'}
          </span>
        ) : (
          <span />
        )}

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
            aria-label="Edit task"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            aria-label="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
