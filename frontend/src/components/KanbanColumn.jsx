import { useState } from 'react';
import TaskCard from './TaskCard';

const KanbanColumn = ({ title, status, tasks, onEdit, onDelete, onDrop, accentClass }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    onDrop(taskId, status);
  };
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-2xl border p-3 pt-4 backdrop-blur-sm transition-all duration-200 ${
        isDragOver
          ? 'border-brand-400/70 bg-brand-50/70 shadow-[0_0_0_3px_rgba(124,92,252,0.15)] dark:border-brand-400/50 dark:bg-brand-500/10'
          : 'border-white/50 bg-white/40 dark:border-white/5 dark:bg-white/[0.03]'
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${accentClass} ${isDragOver ? 'motion-safe:animate-glow-pulse' : ''}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="stat-figure ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.length === 0 && (
          <p
            className={`rounded-xl border border-dashed p-4 text-center text-xs transition-colors ${
              isDragOver
                ? 'border-brand-400 text-brand-500'
                : 'border-slate-300 text-slate-400 dark:border-slate-700'
            }`}
          >
            Drop tasks here
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            draggable
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;
