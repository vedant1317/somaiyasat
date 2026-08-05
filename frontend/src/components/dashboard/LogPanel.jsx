import { GOVERNOR_META, MODE_META, met } from './shared.js';

const LEVEL_COLOR = {
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  info: 'text-slate-500',
  cmd: 'text-sky-400',
};

export function DecisionLog({ decisions }) {
  return (
    <div className="panel flex h-full flex-col p-5">
      <p className="label">Decision log</p>
      <ul className="scroll-thin mt-3 max-h-64 flex-1 space-y-1.5 overflow-y-auto font-mono text-[11px]">
        {decisions.map((d, i) => {
          const g = GOVERNOR_META[d.governor] ?? GOVERNOR_META.link;
          return (
            <li key={`${d.t}-${i}`} className="flex gap-2 border-b border-space-800/70 pb-1.5">
              <span className="shrink-0 text-slate-600">{met(d.t).slice(3)}</span>
              <span className={`w-[68px] shrink-0 ${g.className.split(' ')[0]}`}>{g.label}</span>
              <span className="shrink-0" style={{ color: d.mode ? MODE_META[d.mode].hex : '#475569' }}>
                {d.mode ? MODE_META[d.mode].short : '—'}
              </span>
              <span className="truncate text-slate-500" title={d.reason}>
                {d.reason}
              </span>
            </li>
          );
        })}
        {!decisions.length && <li className="text-slate-600">Awaiting first decision…</li>}
      </ul>
      <p className="mt-3 border-t border-space-700 pt-3 text-[10px] text-slate-600">
        Every prioritization choice is logged with its rationale so the ground team can audit onboard autonomy.
      </p>
    </div>
  );
}

export function EventLog({ events }) {
  return (
    <div className="panel flex h-full flex-col p-5">
      <p className="label">Mission events</p>
      <ul className="scroll-thin mt-3 max-h-64 flex-1 space-y-1.5 overflow-y-auto font-mono text-[11px]">
        {events.map((e, i) => (
          <li key={`${e.t}-${i}`} className="flex gap-2 border-b border-space-800/70 pb-1.5">
            <span className="shrink-0 text-slate-600">{met(e.t).slice(3)}</span>
            <span className={`${LEVEL_COLOR[e.level] ?? 'text-slate-500'}`}>{e.message}</span>
          </li>
        ))}
        {!events.length && <li className="text-slate-600">No events yet.</li>}
      </ul>
    </div>
  );
}
