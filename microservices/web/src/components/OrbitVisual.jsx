/**
 * Decorative hero graphic: SomaiyaPod releasing SomaiyaSat into a LEO track,
 * with the downlink cone to a ground station.
 */
export default function OrbitVisual() {
  return (
    <svg viewBox="0 0 420 320" className="h-full w-full" role="img" aria-label="SomaiyaPod releasing SomaiyaSat above Earth with a downlink to a ground station">
      <defs>
        <radialGradient id="earth" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="70%" stopColor="#0b1a2e" />
          <stop offset="100%" stopColor="#060b14" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* starfield */}
      {[
        [30, 40], [78, 22], [130, 58], [190, 18], [250, 46], [318, 28], [376, 62],
        [58, 96], [352, 110], [22, 150], [398, 158], [110, 12], [292, 84],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.4 : 0.9} fill="#cbd5e1" opacity={0.55} />
      ))}

      {/* earth limb */}
      <circle cx="210" cy="430" r="220" fill="url(#earth)" />
      <circle cx="210" cy="430" r="220" fill="none" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="1.2" />

      {/* orbit track */}
      <ellipse
        cx="210"
        cy="430"
        rx="285"
        ry="285"
        fill="none"
        stroke="#94a3b8"
        strokeOpacity="0.28"
        strokeDasharray="4 7"
      />

      {/* downlink beam */}
      <path d="M262 150 L232 236 L296 236 Z" fill="url(#beam)" />

      {/* ground station */}
      <g stroke="#f59e0b" strokeWidth="1.6" fill="none">
        <path d="M252 244 l14 -10 l14 10" />
        <path d="M266 234 l0 -12" />
        <path d="M246 250 h40" strokeOpacity="0.6" />
      </g>

      {/* SomaiyaPod deployer */}
      <g transform="translate(120 128) rotate(-14)">
        <rect x="0" y="0" width="52" height="34" rx="4" fill="#0f1729" stroke="#475569" strokeWidth="1.4" />
        <rect x="6" y="7" width="14" height="20" rx="2" fill="#1e293b" stroke="#334155" />
        <path d="M52 6 l12 -6 l0 34 l-12 -6" fill="#0b1120" stroke="#475569" strokeWidth="1.2" />
        <text x="0" y="-8" fill="#64748b" fontSize="8" fontFamily="ui-monospace, monospace">
          SOMAIYAPOD
        </text>
      </g>

      {/* separation trail */}
      <path d="M186 130 C 214 126, 230 132, 248 140" stroke="#f59e0b" strokeOpacity="0.4" strokeDasharray="3 5" fill="none" />

      {/* SomaiyaSat PocketQube */}
      <g transform="translate(248 128) rotate(12)">
        <rect x="0" y="0" width="26" height="26" rx="2.5" fill="#111c2f" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="5" y="5" width="16" height="16" rx="1" fill="#0b1120" stroke="#334155" strokeWidth="0.8" />
        <path d="M26 13 h20" stroke="#94a3b8" strokeWidth="1.2" />
        <path d="M0 13 h-18" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="-4" y="-8" fill="#f59e0b" fontSize="8" fontFamily="ui-monospace, monospace">
          SOMAIYASAT
        </text>
      </g>
    </svg>
  );
}
