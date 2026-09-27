import { MODE_META } from './shared.js';

const W = 640;
const H = 160;
const PAD = { top: 10, right: 8, bottom: 28, left: 26 };

/**
 * SNR and state-of-charge over the last two minutes, with the active downlink
 * mode drawn as a colour band along the time axis.
 */
export default function LinkChart({ history }) {
  if (!history?.length) {
    return <div className="h-[150px] animate-pulse rounded-lg bg-space-800/60" />;
  }

  const points = history.slice(-120);
  const n = Math.max(points.length, 2);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i) => PAD.left + (i / (n - 1)) * innerW;
  const ySnr = (v) => PAD.top + innerH - ((Math.max(-5, Math.min(30, v)) + 5) / 35) * innerH;
  const ySoc = (v) => PAD.top + innerH - (v / 100) * innerH;

  // SNR path breaks wherever the link is below the horizon.
  const snrSegments = [];
  let current = [];
  points.forEach((p, i) => {
    if (p.snr === null || p.snr === undefined) {
      if (current.length > 1) snrSegments.push(current);
      current = [];
    } else {
      current.push(`${x(i)},${ySnr(p.snr)}`);
    }
  });
  if (current.length > 1) snrSegments.push(current);

  const socPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${ySoc(p.soc)}`).join(' ');
  const barY = PAD.top + innerH + 4;
  const barW = innerW / n;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Link SNR and battery state of charge over time">
      {/* gridlines at 0, 10, 20 dB */}
      {[0, 10, 20].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={ySnr(v)} y2={ySnr(v)} stroke="#1a2438" strokeWidth="1" />
          <text x={4} y={ySnr(v) + 3} fill="#475569" fontSize="8" fontFamily="ui-monospace, monospace">
            {v}
          </text>
        </g>
      ))}

      {/* state of charge */}
      <path d={socPath} fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* snr */}
      {snrSegments.map((seg, i) => (
        <polyline key={i} points={seg.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1.8" />
      ))}

      {/* active mode band */}
      {points.map((p, i) =>
        p.mode ? (
          <rect
            key={i}
            x={x(i) - barW / 2}
            y={barY}
            width={Math.max(barW, 1.2)}
            height="8"
            fill={MODE_META[p.mode].hex}
            opacity="0.85"
          />
        ) : null,
      )}

      <text x={PAD.left} y={H - 2} fill="#475569" fontSize="8" fontFamily="ui-monospace, monospace">
        −120 s
      </text>
      <text x={W - PAD.right - 14} y={H - 2} fill="#475569" fontSize="8" fontFamily="ui-monospace, monospace">
        now
      </text>
    </svg>
  );
}
