import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatDay = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// Bar chart of tasks completed vs. created per day, for the last N days.
const ProgressChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No activity to show yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-slate-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,92,252,0.08)' }} />
        <Bar dataKey="completed" name="Completed" fill="#7C5CFC" radius={[4, 4, 0, 0]} />
        <Bar dataKey="created" name="Created" fill="#22D3C7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProgressChart;
