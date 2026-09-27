/**
 * Block diagram of the SomaiyaSat data path: sensors and payload sources feed a
 * prioritized queue, the AI router picks a mode each second, and everything is
 * multiplexed through one shared RF front-end down to the ground segment.
 */

const box = {
  fill: '#0d1524',
  stroke: '#26334d',
};

function Block({ x, y, w, h, title, sub, accent = '#64748b' }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={box.fill} stroke={box.stroke} />
      <rect x={x} y={y} width="3" height={h} rx="1.5" fill={accent} />
      <text x={x + 14} y={y + (sub ? 22 : h / 2 + 4)} fill="#e2e8f0" fontSize="12.5" fontWeight="500">
        {title}
      </text>
      {sub && (
        <text x={x + 14} y={y + 39} fill="#64748b" fontSize="10.5" fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ d, dashed = false, color = '#475569' }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeDasharray={dashed ? '4 5' : undefined}
      markerEnd={color === '#f59e0b' ? 'url(#arrowhead-amber)' : 'url(#arrowhead)'}
    />
  );
}

export default function ArchitectureDiagram() {
  return (
    <div className="overflow-x-auto scroll-thin">
      <svg viewBox="0 0 920 520" className="h-auto w-full min-w-[820px]" role="img" aria-label="SomaiyaSat system architecture block diagram">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 z" fill="#475569" />
          </marker>
          <marker id="arrowhead-amber" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* ---------------------------------------------------- SomaiyaPod */}
        <rect x="16" y="16" width="210" height="150" rx="10" fill="#080d18" stroke="#334155" strokeDasharray="5 5" />
        <text x="30" y="38" fill="#94a3b8" fontSize="11" fontFamily="ui-monospace, monospace" letterSpacing="1.5">
          SOMAIYAPOD · DEPLOYER
        </text>
        <Block x={30} y={50} w={182} h={34} title="Release mechanism" accent="#f59e0b" />
        <Block x={30} y={90} w={182} h={34} title="Separation switches" accent="#f59e0b" />
        <Block x={30} y={130} w={182} h={26} title="Timer / confirmation beacon" accent="#f59e0b" />

        {/* ---------------------------------------------------- SomaiyaSat */}
        <rect x="268" y="16" width="392" height="420" rx="10" fill="#080d18" stroke="#334155" strokeDasharray="5 5" />
        <text x="284" y="38" fill="#94a3b8" fontSize="11" fontFamily="ui-monospace, monospace" letterSpacing="1.5">
          SOMAIYASAT · POCKETQUBE
        </text>

        {/* sources */}
        <Block x={284} y={52} w={168} h={50} title="Housekeeping sensors" sub="V / I / TEMP / MODE" accent="#f59e0b" />
        <Block x={284} y={112} w={168} h={50} title="Camera module" sub="SSTV FRAME CAPTURE" accent="#34d399" />
        <Block x={284} y={172} w={168} h={50} title="Amateur uplink traffic" sub="M17 / CODEC2 PAYLOAD" accent="#a78bfa" />
        <Block x={284} y={232} w={168} h={50} title="EPS / battery" sub="SOC · ECLIPSE STATE" accent="#38bdf8" />

        {/* queue */}
        <Block x={478} y={52} w={162} h={50} title="Prioritized queue" sub="TT&C > SSTV > VOICE" accent="#94a3b8" />
        <Arrow d="M452 77 H 474" />
        <Arrow d="M452 137 C 465 137, 465 100, 474 92" />
        <Arrow d="M452 197 C 468 197, 468 104, 474 100" />

        {/* router */}
        <rect x="478" y="122" width="162" height="110" rx="8" fill="#111c2f" stroke="#f59e0b" strokeOpacity="0.55" />
        <text x="492" y="146" fill="#fbbf24" fontSize="12.5" fontWeight="600">
          AI scheduler / router
        </text>
        <text x="492" y="164" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">
          LOW-POWER MCU / SoC
        </text>
        <text x="492" y="186" fill="#94a3b8" fontSize="10">
          score = priority + urgency
        </text>
        <text x="492" y="200" fill="#94a3b8" fontSize="10">
          + link margin − power cost
        </text>
        <text x="492" y="220" fill="#f87171" fontSize="9.5" fontFamily="ui-monospace, monospace">
          WATCHDOG · RULE FALLBACK
        </text>
        <Arrow d="M559 102 V 118" />
        <Arrow d="M452 257 C 466 257, 466 200, 474 190" dashed />

        {/* modes */}
        <Block x={478} y={252} w={162} h={30} title="TT&C / housekeeping" accent="#f59e0b" />
        <Block x={478} y={288} w={162} h={30} title="SSTV encoder" accent="#34d399" />
        <Block x={478} y={324} w={162} h={30} title="M17 modem" accent="#a78bfa" />
        <Block x={478} y={360} w={162} h={30} title="Codec2 vocoder" accent="#38bdf8" />
        <Arrow d="M559 232 V 248" />

        {/* shared RF */}
        <Block x={284} y={300} w={168} h={50} title="Shared RF front-end" sub="TIME-SLICED TX CHAIN" accent="#e2e8f0" />
        <Arrow d="M474 267 C 462 267, 462 320, 456 322" />
        <Arrow d="M474 303 C 464 303, 464 322, 456 324" />
        <Arrow d="M474 339 C 464 339, 464 328, 456 326" />
        <Arrow d="M474 375 C 462 375, 462 330, 456 328" />

        <Block x={284} y={366} w={168} h={44} title="Deployable antennas" sub="UHF / VHF MONOPOLES" accent="#e2e8f0" />
        <Arrow d="M368 350 V 362" />

        {/* ---------------------------------------------------- downlink */}
        <Arrow d="M368 410 C 368 452, 500 460, 690 420" color="#f59e0b" />
        <text x="430" y="452" fill="#f59e0b" fontSize="10" fontFamily="ui-monospace, monospace">
          DOWNLINK · SHORT LEO PASS
        </text>

        {/* ---------------------------------------------------- ground */}
        <rect x="676" y="16" width="228" height="420" rx="10" fill="#080d18" stroke="#334155" strokeDasharray="5 5" />
        <text x="692" y="38" fill="#94a3b8" fontSize="11" fontFamily="ui-monospace, monospace" letterSpacing="1.5">
          GROUND SEGMENT
        </text>
        <Block x={692} y={52} w={196} h={50} title="Tracking antenna + SDR" sub="DOPPLER-CORRECTED RX" accent="#38bdf8" />
        <Block x={692} y={112} w={196} h={50} title="Multi-mode decoder" sub="M17 · CODEC2 · SSTV · TT&C" accent="#38bdf8" />
        <Block x={692} y={172} w={196} h={50} title="Telemetry database" sub="FRAME + DECISION LOG" accent="#38bdf8" />
        <Block x={692} y={232} w={196} h={50} title="Operator dashboard" sub="HEALTH · IMAGES · QUEUE" accent="#38bdf8" />
        <Block x={692} y={292} w={196} h={50} title="Command uplink" sub="OVERRIDE · SAFE MODE" accent="#f59e0b" />
        <Block x={692} y={352} w={196} h={58} title="Model refinement" sub="RETRAIN ON REAL PASSES" accent="#a78bfa" />

        <Arrow d="M790 102 V 108" />
        <Arrow d="M790 162 V 168" />
        <Arrow d="M790 222 V 228" />
        <Arrow d="M790 282 V 288" />
        <Arrow d="M790 342 V 348" />

        {/* deployment confirmation — drawn last so it sits above the group boxes */}
        <Arrow d="M226 96 H 282" color="#f59e0b" />
        <text x="224" y="86" fill="#f59e0b" fontSize="9" fontFamily="ui-monospace, monospace">
          DEPLOY OK
        </text>

        {/* uplink back to spacecraft */}
        <Arrow d="M692 318 C 640 318, 660 240, 645 200" dashed color="#f59e0b" />
        <text x="600" y="252" fill="#f59e0b" fontSize="9.5" fontFamily="ui-monospace, monospace" opacity="0.85">
          UPLINK
        </text>
      </svg>
    </div>
  );
}
