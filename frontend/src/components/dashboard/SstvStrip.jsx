import { met } from './shared.js';

/**
 * Decoded SSTV frames. The thumbnails are synthesised from the frame id — the
 * mission is a simulation, so there is no real imagery to show.
 */
function Thumb({ seed }) {
  const hue = (seed * 47) % 360;
  const horizon = 34 + ((seed * 13) % 30);
  return (
    <svg viewBox="0 0 100 75" className="h-full w-full">
      <defs>
        <linearGradient id={`sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 55% 22%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue + 30) % 360} 60% 38%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="75" fill={`url(#sky-${seed})`} />
      <path
        d={`M0 ${horizon} Q 25 ${horizon - 6}, 50 ${horizon} T 100 ${horizon - 3} L100 75 L0 75 Z`}
        fill={`hsl(${(hue + 180) % 360} 45% 16%)`}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="0" x2="100" y1={i * 6.4} y2={i * 6.4} stroke="#000" strokeOpacity="0.14" strokeWidth="1" />
      ))}
      <rect x="0" y="0" width="100" height="75" fill="none" stroke="#26334d" />
    </svg>
  );
}

export default function SstvStrip({ images }) {
  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between">
        <p className="label">Decoded SSTV frames</p>
        <p className="font-mono text-xs text-slate-400">{images.length}</p>
      </div>

      {images.length ? (
        <div className="scroll-thin mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img) => (
            <figure key={img.id} className="w-28 shrink-0 animate-fadeUp">
              <div className="h-[75px] w-full overflow-hidden rounded">
                <Thumb seed={img.id} />
              </div>
              <figcaption className="mt-1 font-mono text-[10px] text-slate-600">
                #{img.id} · pass {img.pass}
                <br />
                {met(img.t)}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-600">
          No complete frames yet — SSTV needs ≥ 9 dB, so images come down near peak elevation.
        </p>
      )}
    </div>
  );
}
