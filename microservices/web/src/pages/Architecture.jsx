import { Link } from 'react-router-dom';

import ArchitectureDiagram from '../components/ArchitectureDiagram.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Section from '../components/Section.jsx';
import { modes } from '../data/mission.js';

const deployerParts = [
  { t: 'Structure & rails', b: 'Deployer chassis compliant with PocketQube deployer standards and launch-vehicle safety requirements.' },
  { t: 'Release mechanism', b: 'Burn-wire, spring-loaded pusher plate or non-pyrotechnic actuator, tested in isolation for repeatable, jam-free actuation.' },
  { t: 'Separation switches', b: 'Confirm the satellite is clear of the rails and trigger SomaiyaSat’s initialization sequence.' },
  { t: 'Timer / trigger electronics', b: 'Release sequencing plus deployer-side housekeeping — temperature and actuator status — for logging or relay.' },
];

const satParts = [
  { t: 'Flight computer', b: 'Low-power MCU/SoC hosting the unified payload firmware stack and the AI scheduler, with a hardware watchdog.' },
  { t: 'EPS & battery', b: 'Power management ICs, solar input and state-of-charge telemetry feeding the router’s power term.' },
  { t: 'RF transceiver & antennas', b: 'Shared front-end time-sliced between the four modes; deployable tape-spring monopoles.' },
  { t: 'Camera & sensor suite', b: 'Image source for SSTV, plus voltage, current, temperature and mode sensors for housekeeping frames.' },
];

const routerTerms = [
  { k: 'Priority', w: '0.40', b: 'Mission-defined data class. TT&C outranks everything; SSTV outranks voice traffic.' },
  { k: 'Urgency', w: '0.25', b: 'How long the item has waited in the queue, so nothing starves across passes.' },
  { k: 'Link margin', w: '0.25', b: 'SNR above the mode’s demodulation floor. A mode below its floor is never selected.' },
  { k: 'Power cost', w: '0.10', b: 'Energy per delivered bit, penalising expensive modes when the battery is low.' },
];

export default function Architecture() {
  return (
    <>
      <PageHeader
        eyebrow="System architecture"
        title="Deployer, spacecraft, autonomous router, ground segment"
        lead="Data flows from the sensors and payload sources into a prioritized queue. Once per second the onboard router scores that queue against the current link and power state, then multiplexes the winner through one shared RF chain."
      />

      <Section eyebrow="Block diagram" title="End-to-end data path">
        <div className="panel p-4 sm:p-6">
          <ArchitectureDiagram />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Solid arrows carry data; dashed arrows carry state or commands. The deployment-confirmation signal from
          SomaiyaPod is what starts the spacecraft’s commissioning sequence.
        </p>
      </Section>

      <Section eyebrow="SomaiyaPod" title="The deployer">
        <div className="grid gap-3 sm:grid-cols-2">
          {deployerParts.map((p) => (
            <article key={p.t} className="panel p-5">
              <h3 className="text-base font-medium text-slate-100">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.b}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="SomaiyaSat" title="The spacecraft bus">
        <div className="grid gap-3 sm:grid-cols-2">
          {satParts.map((p) => (
            <article key={p.t} className="panel p-5">
              <h3 className="text-base font-medium text-slate-100">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.b}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Payload modes"
        title="What the router is choosing between"
        description="Each mode has a demodulation floor and a data rate. The floor is what makes the choice geometry-dependent: at low elevation only the robust modes close the link."
      >
        <div className="space-y-3">
          {modes.map((m) => (
            <article key={m.id} className={`panel border-l-2 p-6 ${m.ring}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className={`text-lg font-medium ${m.color}`}>{m.name}</h3>
                <div className="flex gap-6 font-mono text-[11px] text-slate-500">
                  <span>
                    RATE <span className="text-slate-300">{m.rate}</span>
                  </span>
                  <span>
                    SNR FLOOR <span className="text-slate-300">{m.floor}</span>
                  </span>
                  <span>
                    PRIORITY <span className="text-slate-300">{m.priority}</span>
                  </span>
                </div>
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400">{m.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="The router"
        title="An explainable scoring policy"
        description="The onboard model is deliberately small — a decision tree, a compact network or an RL policy trained on simulated link and power scenarios. Its output is a weighted score per queued item, logged with its rationale so the ground team can audit every choice."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="panel divide-y divide-space-700">
            {routerTerms.map((t) => (
              <div key={t.k} className="flex gap-4 p-5">
                <span className="w-10 shrink-0 font-mono text-sm text-amber-400">{t.w}</span>
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{t.k}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{t.b}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="panel p-6">
            <h3 className="text-base font-medium text-slate-100">Guard rails evaluated before the policy</h3>
            <ul className="mt-4 space-y-4 text-sm text-slate-400">
              <li>
                <span className="font-mono text-xs text-red-400">WATCHDOG</span>
                <p className="mt-1">
                  If no housekeeping frame has reached the ground in 30 seconds of usable link, the router’s output
                  is pre-empted and TT&C is forced. The spacecraft can never talk itself into silence.
                </p>
              </li>
              <li>
                <span className="font-mono text-xs text-amber-400">SAFE MODE</span>
                <p className="mt-1">
                  Below 25% state of charge, non-essential payloads are inhibited until the battery recovers past
                  38%. Rule-based, not learned.
                </p>
              </li>
              <li>
                <span className="font-mono text-xs text-sky-400">OPERATOR</span>
                <p className="mt-1">
                  An uplinked command bounds autonomy for a fixed window — human-in-the-loop override without
                  disabling the router permanently.
                </p>
              </li>
              <li>
                <span className="font-mono text-xs text-slate-400">LINK FLOOR</span>
                <p className="mt-1">
                  A mode whose SNR floor is not met is filtered out before scoring, so the policy can never select
                  a waveform the link cannot carry.
                </p>
              </li>
            </ul>
            <Link to="/dashboard" className="link-underline mt-6 inline-block text-sm text-amber-400">
              Watch these fire in the simulation →
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
