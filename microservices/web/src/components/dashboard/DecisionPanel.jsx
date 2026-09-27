import { GOVERNOR_META, MODE_META } from './shared.js';

const TERM_LABEL = { priority: 'Priority', urgency: 'Urgency', link: 'Link margin', power: 'Power cost' };
const TERM_COLOR = { priority: '#f59e0b', urgency: '#a78bfa', link: '#34d399', power: '#38bdf8' };

/**
 * The router's current choice, with the weighted score broken into its terms —
 * the "logged rationale" the governance section asks for.
 */
export default function DecisionPanel({ decision, mode }) {
  const governor = GOVERNOR_META[decision?.governor] ?? GOVERNOR_META.link;
  const terms = decision?.scored?.terms;
  const modeMeta = mode ? MODE_META[mode] : null;

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">Router decision</p>
          <p className="mt-2 text-2xl font-medium tracking-tight" style={{ color: modeMeta?.hex ?? '#64748b' }}>
            {modeMeta ? modeMeta.short : 'IDLE'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{modeMeta ? modeMeta.name : 'No transmission this tick'}</p>
        </div>
        <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] tracking-widest ${governor.className}`}>
          {governor.label}
        </span>
      </div>

      <p className="mt-4 min-h-[2.5rem] text-sm leading-relaxed text-slate-400">
        {decision?.reason ?? 'Awaiting telemetry…'}
      </p>

      {terms ? (
        <div className="mt-4 border-t border-space-700 pt-4">
          <div className="flex items-baseline justify-between">
            <p className="label">Score breakdown</p>
            <p className="font-mono text-sm text-slate-200">{decision.scored.total}</p>
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(terms).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-slate-500">{TERM_LABEL[k]}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-space-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (v / 0.4) * 100)}%`, background: TERM_COLOR[k] }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-400">{v.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-slate-600">
            SNR {decision.snr} dB · margin {decision.scored.margin} dB · queued {decision.scored.age}s
          </p>
        </div>
      ) : (
        <div className="mt-4 border-t border-space-700 pt-4">
          <p className="font-mono text-[10px] text-slate-600">
            No score computed — a guard rail or the link floor decided this tick.
          </p>
        </div>
      )}
    </div>
  );
}
