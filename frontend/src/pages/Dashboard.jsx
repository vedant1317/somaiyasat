import CommandPanel from '../components/dashboard/CommandPanel.jsx';
import DecisionPanel from '../components/dashboard/DecisionPanel.jsx';
import DeploymentPanel from '../components/dashboard/DeploymentPanel.jsx';
import LinkChart from '../components/dashboard/LinkChart.jsx';
import { DecisionLog, EventLog } from '../components/dashboard/LogPanel.jsx';
import PassView from '../components/dashboard/PassView.jsx';
import QueuePanel from '../components/dashboard/QueuePanel.jsx';
import { MODE_META, met } from '../components/dashboard/shared.js';
import SstvStrip from '../components/dashboard/SstvStrip.jsx';
import useTelemetry from '../hooks/useTelemetry.js';

function Tile({ label, value, sub, tone = 'text-slate-100' }) {
  return (
    <div className="panel px-4 py-3">
      <p className="label">{label}</p>
      <p className={`mt-1 font-mono text-lg ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, unit, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="font-mono text-xs text-slate-300">
          {value === null || value === undefined ? '—' : `${value.toFixed(1)} ${unit}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-space-800">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, status, sendCommand } = useTelemetry();

  if (!state) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24">
        <p className="label">Ground station</p>
        <h1 className="mt-3 text-2xl font-semibold">
          {status === 'error' ? 'Telemetry service unreachable' : 'Acquiring telemetry…'}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-slate-400">
          {status === 'error' ? (
            <>
              The simulator backend is not responding. Start it with <code className="text-amber-400">npm run dev</code>{' '}
              in <code className="text-amber-400">backend/</code>, then reload this page.
            </>
          ) : (
            'Connecting to the mission simulator stream.'
          )}
        </p>
      </div>
    );
  }

  const deploying = state.phase === 'deployment';
  const modeMeta = state.mode ? MODE_META[state.mode] : null;
  const totalFrames = Object.values(state.delivered).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* ------------------------------------------------------------- header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Ground station · simulated</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">SomaiyaSat mission operations</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip">
            <span
              className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'bg-emerald-400' : 'bg-red-400'}`}
            />
            {status === 'live' ? 'stream live' : status}
          </span>
          <span className="font-mono text-sm text-slate-300">{met(state.t)}</span>
        </div>
      </div>

      {/* -------------------------------------------------------------- tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile
          label="Phase"
          value={deploying ? 'DEPLOY' : state.power.safeMode ? 'SAFE' : 'NOMINAL'}
          tone={state.power.safeMode ? 'text-amber-400' : 'text-emerald-400'}
          sub={state.power.eclipse ? 'in eclipse' : 'in sunlight'}
        />
        <Tile
          label="Downlink mode"
          value={modeMeta ? modeMeta.short : 'IDLE'}
          tone={modeMeta ? modeMeta.text : 'text-slate-500'}
          sub={state.link.inPass ? `pass ${state.link.passIndex}` : 'no visibility'}
        />
        <Tile label="Battery SoC" value={`${state.power.soc}%`} tone={state.power.soc < 30 ? 'text-amber-400' : 'text-slate-100'} sub="3.2 Wh cell" />
        <Tile label="Queue depth" value={state.queue.length} sub={`${totalFrames} items delivered`} />
        <Tile
          label="Watchdog trips"
          value={state.stats.watchdogTrips}
          tone={state.stats.watchdogTrips ? 'text-red-400' : 'text-slate-100'}
          sub={`${state.stats.passesCompleted} passes complete`}
        />
      </div>

      {deploying ? (
        /* --------------------------------------------------- deployment view */
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DeploymentPanel sequence={state.deploySequence} t={state.t} active />
          <div className="space-y-4">
            <div className="panel p-5">
              <p className="label">Status</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                SomaiyaSat is still executing its release and commissioning sequence from SomaiyaPod. Autonomous
                operations begin at T+30, when the AI router takes control of the downlink.
              </p>
            </div>
            <EventLog events={state.events} />
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------- operations view */
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
            <PassView link={state.link} />

            <div className="panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="label">Link & power · last 120 s</p>
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-amber-400">SNR dB</span>
                  <span className="text-sky-400">SoC %</span>
                </div>
              </div>
              <div className="mt-2">
                <LinkChart history={state.history} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Bar label="SNR" value={state.link.snr} max={30} unit="dB" color="#f59e0b" />
                <Bar label="State of charge" value={state.power.soc} max={100} unit="%" color="#38bdf8" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <DecisionPanel decision={state.decision} mode={state.mode} />
            <QueuePanel queue={state.queue} decision={state.decision} />
            <CommandPanel sendCommand={sendCommand} override={state.override} safeMode={state.power.safeMode} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <DecisionLog decisions={state.decisions} />
            <EventLog events={state.events} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <SstvStrip images={state.images} />
            <div className="panel p-5">
              <p className="label">Delivered by class</p>
              <ul className="mt-3 space-y-2.5">
                {Object.entries(state.delivered).map(([k, v]) => {
                  const m = MODE_META[k];
                  const pct = totalFrames ? (v / totalFrames) * 100 : 0;
                  return (
                    <li key={k}>
                      <div className="flex items-baseline justify-between font-mono text-[11px]">
                        <span style={{ color: m.hex }}>{m.short}</span>
                        <span className="text-slate-400">{v}</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-space-800">
                        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: m.hex }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-space-700 pt-3 text-[10px] leading-relaxed text-slate-600">
                Data prioritization accuracy is one of the mission’s documented performance results. Housekeeping
                should dominate this distribution across a full orbit.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <DeploymentPanel sequence={state.deploySequence} t={state.t} active={false} />
          </div>
        </>
      )}

      <p className="mt-8 text-xs leading-relaxed text-slate-600">
        This is a simulation of the mission concept described in KJS-SRS-01, not a live spacecraft. Orbit geometry,
        link budget and battery behaviour are compressed in time so a deployment and several passes are watchable
        in a few minutes.
      </p>
    </div>
  );
}
