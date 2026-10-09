import { Link } from 'react-router-dom';
import { Trash2, ListChecks } from 'lucide-react';

const ProjectCard = ({ project, onDelete }) => {
  const progress = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0;

  return (
    <div className="card card-hover group relative flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <span
          className="h-2.5 w-2.5 rounded-full motion-safe:animate-glow-pulse"
          style={{ backgroundColor: project.color, boxShadow: `0 0 10px 1px ${project.color}80` }}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(project._id);
          }}
          className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950"
          aria-label={`Delete ${project.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Link to={`/projects/${project._id}`} className="flex-1">
        <h3 className="font-display text-lg font-semibold">{project.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {project.description || 'No description yet.'}
        </p>
      </Link>

      <div className="mt-2">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ListChecks size={13} /> {project.doneCount}/{project.taskCount} tasks
          </span>
          <span className="stat-figure">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: project.color, boxShadow: `0 0 8px 0 ${project.color}90` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
