import { clock } from './shared.js';

/**
 * Sky view: the horizon-to-horizon arc of the current pass with the spacecraft
 * plotted at its present elevation.
 */
export default function PassView({ link }) {
  const { inPass, elevation, maxElevation, passIndex, passProgress, secondsToEvent } = link;

  // Side view: the marker's angle above the horizon is the elevation itself,
  // and the half of the sky it sits in follows the pass progress (AOS on the
  // left, LOS on the right).
  const elev = Math.max(0, elevation);
  const theta = (Math.min(90, elev) * Math.PI) / 180;
  const ascending = passProgress < 0.5;
  const r = 78;
  const cx = 110;
  const cy = 96;
  const px = cx + (ascending ? -1 : 1) * r * Math.cos(theta);
  const py = cy - r * Math.sin(theta);

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Pass geometry</p>
          <p className="mt-1 font-mono text-sm text-slate-200">
            {inPass ? `PASS ${passIndex} · IN VIEW` : 'LOS · AWAITING AOS'}
          </p>
        </div>
        <div className="text-right">
          <p className="label">{inPass ? 'LOS in' : 'AOS in'}</p>
          <p className="mt-1 font-mono text-sm text-amber-400">{clock(Math.max(0, secondsToEvent))}</p>
        </div>
      </div>

      <svg viewBox="0 0 220 118" className="mt-3 h-auto w-full" role="img" aria-label="Sky view of the current pass">
        <path d={`M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#1a2438" strokeWidth="1.4" />
        <path d={`M${cx - 52} ${cy} A 52 52 0 0 1 ${cx + 52} ${cy}`} fill="none" stroke="#131c2e" strokeWidth="1" strokeDasharray="3 4" />
        <path d={`M${cx - 26} ${cy} A 26 26 0 0 1 ${cx + 26} ${cy}`} fill="none" stroke="#131c2e" strokeWidth="1" strokeDasharray="3 4" />
        <line x1={cx - 92} x2={cx + 92} y1={cy} y2={cy} stroke="#26334d" strokeWidth="1.2" />

        <text x={cx - 100} y={cy + 12} fill="#475569" fontSize="8" fontFamily="ui-monospace, monospace">0°</text>
        <text x={cx - 8} y={cy - r - 4} fill="#475569" fontSize="8" fontFamily="ui-monospace, monospace">90°</text>

        {inPass && (
          <>
            <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="1" />
            <circle cx={px} cy={py} r="4.5" fill="#f59e0b" />
            <circle
              cx={px}
              cy={py}
              r="9"
              fill="none"
              stroke="#f59e0b"
              strokeOpacity="0.4"
              className="animate-pulseRing"
              // SVG elements scale about the user-space origin by default, which
              // would send the ring drifting away from the marker.
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          </>
        )}
        <path d={`M${cx - 8} ${cy} l8 -7 l8 7`} fill="none" stroke="#94a3b8" strokeWidth="1.4" />
      </svg>

      <dl className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <dt className="label">Elevation</dt>
          <dd className="mt-0.5 text-slate-200">{elevation > 0 ? `${elevation.toFixed(1)}°` : '—'}</dd>
        </div>
        <div>
          <dt className="label">Max elevation</dt>
          <dd className="mt-0.5 text-slate-200">{maxElevation}°</dd>
        </div>
      </dl>
    </div>
  );
}
