// The app's "living theme": three soft, blurred color fields that drift
// slowly and endlessly behind every screen. It's fixed and pointer-events
// disabled so it never interferes with the UI — it just makes the app feel
// like it's breathing. Colors follow the flow of a kanban board itself:
// iris (To Do) -> tide (In Progress) -> emerald (Done).
//
// Respects prefers-reduced-motion by simply not animating (the blobs still
// render, just static) via the `motion-safe:` variants below.
const AuroraBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper dark:bg-midnight"
    >
      <div className="absolute -left-1/4 -top-1/4 h-[60vmax] w-[60vmax] rounded-full bg-brand-400/25 blur-[110px] motion-safe:animate-aurora-1 dark:bg-brand-500/25" />
      <div className="absolute -right-1/4 top-1/3 h-[55vmax] w-[55vmax] rounded-full bg-tide-400/20 blur-[110px] motion-safe:animate-aurora-2 dark:bg-tide-500/20" />
      <div className="absolute bottom-[-20%] left-1/4 h-[50vmax] w-[50vmax] rounded-full bg-ember-400/15 blur-[110px] motion-safe:animate-aurora-3 dark:bg-ember-500/15" />
      {/* Faint grain-like overlay keeps the gradient from looking too glassy/plasticky */}
      <div className="absolute inset-0 bg-paper/40 dark:bg-midnight/50" />
    </div>
  );
};

export default AuroraBackground;
