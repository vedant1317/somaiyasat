import { useState } from 'react';

import { MODE_META } from './shared.js';

/**
 * Human-in-the-loop uplink. Autonomy stays bounded by these commands rather
 * than being replaced by them — a forced mode expires after 25 s.
 */
export default function CommandPanel({ sendCommand, override, safeMode }) {
  const [pending, setPending] = useState(null);

  const send = async (action, payload) => {
    setPending(action);
    await sendCommand(action, payload);
    setPending(null);
  };

  const btn =
    'rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between">
        <p className="label">Command uplink</p>
        {override && (
          <span className="font-mono text-[10px] text-sky-400">
            OVERRIDE · {MODE_META[override.mode].short}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(MODE_META).map(([id, m]) => (
          <button
            key={id}
            type="button"
            disabled={pending !== null}
            onClick={() => send('force-mode', { mode: id })}
            className={`${btn} border-space-600 text-slate-300 hover:border-slate-500 hover:bg-space-800`}
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.hex }} />
              Force {m.short}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => send('capture-sstv')}
          className={`${btn} border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10`}
        >
          Schedule SSTV capture
        </button>
        <button
          type="button"
          disabled={pending !== null || safeMode}
          onClick={() => send('safe-mode')}
          className={`${btn} border-amber-500/40 text-amber-300 hover:bg-amber-500/10`}
        >
          Command safe mode
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => send('resume-autonomy')}
          className={`${btn} border-space-600 text-slate-300 hover:border-slate-500 hover:bg-space-800`}
        >
          Restore full autonomy
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => send('reset')}
          className={`${btn} border-space-700 text-slate-500 hover:text-slate-300`}
        >
          Reset simulation to T+0
        </button>
      </div>

      <p className="mt-3 border-t border-space-700 pt-3 text-[10px] leading-relaxed text-slate-600">
        A forced mode expires after 25 s and control returns to the router. Safe mode clears automatically once
        the battery recovers past 38%.
      </p>
    </div>
  );
}
