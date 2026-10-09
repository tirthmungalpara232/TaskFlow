const StatsCard = ({ label, value, icon: Icon, accent }) => {
  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      <div className={`glow-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="stat-figure text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
