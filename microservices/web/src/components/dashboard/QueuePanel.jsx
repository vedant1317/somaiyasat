import { MODE_META } from './shared.js';

/**
 * Onboard data queue, ranked by the router's current score. Items below their
 * mode's SNR floor are shown greyed out — they exist, but cannot be sent now.
 */
export default function QueuePanel({ queue, decision }) {
  const scored = new Map((decision?.candidates ?? []).map((c) => [c.id, c]));
  const selectedId = decision?.item?.id;

  const rows = [...queue].sort((a, b) => {
    const sa = scored.get(a.id)?.score ?? -1;
    const sb = scored.get(b.id)?.score ?? -1;
    if (sb !== sa) return sb - sa;
    return b.age - a.age;
  });

  return (
    <div className="panel flex h-full flex-col p-5">
      <div className="flex items-baseline justify-between">
        <p className="label">Onboard queue</p>
        <p className="font-mono text-xs text-slate-400">{queue.length} items</p>
      </div>

      <div className="scroll-thin mt-3 max-h-72 flex-1 overflow-y-auto">
        <table className="w-full text-left font-mono text-[11px]">
          <thead className="sticky top-0 bg-space-850">
            <tr className="text-slate-600">
              <th className="pb-2 font-normal">MODE</th>
              <th className="pb-2 font-normal">SIZE</th>
              <th className="pb-2 font-normal">AGE</th>
              <th className="pb-2 text-right font-normal">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const meta = MODE_META[item.type];
              const s = scored.get(item.id);
              const feasible = Boolean(s);
              const selected = item.id === selectedId;
              const progress = 1 - item.remainingKb / item.sizeKb;

              return (
                <tr
                  key={item.id}
                  className={`border-t border-space-800 ${selected ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${feasible ? '' : 'opacity-30'}`}
                        style={{ background: meta.hex }}
                      />
                      <span className={feasible ? 'text-slate-300' : 'text-slate-600'}>{meta.short}</span>
                      {selected && <span className="text-[9px] text-amber-400">TX</span>}
                    </span>
                  </td>
                  <td className={`py-1.5 ${feasible ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.sizeKb} kB
                    {progress > 0 && progress < 1 && (
                      <span className="ml-1 text-[9px] text-amber-500/80">{Math.round(progress * 100)}%</span>
                    )}
                  </td>
                  <td className={`py-1.5 ${item.age > 45 ? 'text-amber-400' : 'text-slate-500'}`}>{item.age}s</td>
                  <td className="py-1.5 text-right">
                    {feasible ? (
                      <span className="text-slate-300">{s.score.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-600" title="Below SNR floor">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-600">
                  Queue empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-t border-space-700 pt-3 text-[10px] leading-relaxed text-slate-600">
        Items with no score are below their mode’s demodulation floor at the current SNR and are filtered out
        before the policy runs.
      </p>
    </div>
  );
}
