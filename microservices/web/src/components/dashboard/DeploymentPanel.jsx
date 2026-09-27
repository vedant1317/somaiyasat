/**
 * SomaiyaPod release and SomaiyaSat commissioning checklist, played once at the
 * start of the simulation.
 */
export default function DeploymentPanel({ sequence, t, active }) {
  return (
    <div className={`panel p-5 ${active ? 'border-amber-500/40' : ''}`}>
      <div className="flex items-baseline justify-between">
        <p className="label">Deployment & commissioning</p>
        <p className="font-mono text-xs text-slate-500">{active ? 'IN PROGRESS' : 'COMPLETE'}</p>
      </div>

      <ol className="mt-4 space-y-3">
        {sequence.map((s) => {
          const done = t >= s.t;
          const current = active && done && t - s.t < 4;
          return (
            <li key={s.id} className="flex gap-3">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  done ? 'bg-emerald-400' : 'bg-space-600'
                } ${current ? 'ring-4 ring-emerald-400/20' : ''}`}
              />
              <div>
                <p className={`text-sm ${done ? 'text-slate-200' : 'text-slate-600'}`}>
                  <span className="mr-2 font-mono text-[10px] text-slate-600">T+{String(s.t).padStart(2, '0')}</span>
                  {s.label}
                </p>
                <p className={`text-xs ${done ? 'text-slate-500' : 'text-slate-700'}`}>{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
