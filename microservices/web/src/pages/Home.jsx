import { Link } from 'react-router-dom';

import OrbitVisual from '../components/OrbitVisual.jsx';
import Section from '../components/Section.jsx';
import { meta, modes, objectives, solution, stats } from '../data/mission.js';

export default function Home() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-space-700/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-fadeUp">
            <div className="flex flex-wrap gap-2">
              <span className="chip">{meta.id}</span>
              <span className="chip">{meta.vertical}</span>
              <span className="chip">with {meta.collaborator}</span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              SomaiyaSat <span className="text-slate-600">&</span>{' '}
              <span className="text-amber-400">SomaiyaPod</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              A PocketQube mission that deploys itself, decides for itself what to send home, and serves the
              global amateur radio community across four multiplexed downlink modes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-space-950 transition-colors hover:bg-amber-400"
              >
                Open ground station
              </Link>
              <Link
                to="/mission"
                className="rounded-md border border-space-600 px-5 py-2.5 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Read the mission
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-mono text-xl text-slate-100">{s.value}</dt>
                  <dd className="mt-1 text-xs leading-snug text-slate-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md">
            <OrbitVisual />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- the problem */}
      <Section
        eyebrow="The problem"
        title="Five centimetres, four radios, one very small power budget"
        description="PocketQubes have severe limits on power, size, bandwidth and onboard compute. Traditional manual control cannot keep up with a multi-payload spacecraft that is only in view for a few minutes at a time."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Minutes of visibility',
              b: 'A LEO pass gives a ground station a short, geometry-limited window. Whatever is not sent in that window waits for the next orbit.',
            },
            {
              t: 'Competing data classes',
              b: 'Housekeeping must always get through. SSTV imagery is bandwidth-heavy. Voice traffic is what the HAM community actually tunes in for.',
            },
            {
              t: 'Sub-1 W average',
              b: 'Every transmission costs energy the spacecraft may not have, especially during eclipse. The scheduler has to spend it well.',
            },
          ].map((c) => (
            <article key={c.t} className="panel p-5">
              <h3 className="text-base font-medium">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.b}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ the approach */}
      <Section
        eyebrow="Solution approach"
        title="Three cooperating subsystems"
        description="The mission architecture separates the problem into a deployer, an autonomous onboard router, and a shared multi-mode RF payload stack."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {solution.map((s) => (
            <article key={s.title} className="panel p-6">
              <span className="chip">{s.tag}</span>
              <h3 className="mt-4 text-lg font-medium text-slate-100">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- modes */}
      <Section
        eyebrow="Payload"
        title="Four downlink modes, one radio front-end"
        description="The AI router multiplexes all four across a shared RF chain, choosing per second which one the link and the power budget can actually support."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((m) => (
            <article key={m.id} className={`panel border-l-2 p-5 ${m.ring}`}>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                <span className="label">{m.priority} priority</span>
              </div>
              <h3 className={`mt-3 text-base font-medium ${m.color}`}>{m.name}</h3>
              <dl className="mt-3 flex gap-5 font-mono text-[11px] text-slate-500">
                <div>
                  <dt className="text-slate-600">RATE</dt>
                  <dd className="text-slate-300">{m.rate}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">SNR FLOOR</dt>
                  <dd className="text-slate-300">{m.floor}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/architecture" className="link-underline text-sm text-amber-400">
            See the full architecture →
          </Link>
        </div>
      </Section>

      {/* -------------------------------------------------------- objectives */}
      <Section eyebrow="Objectives" title="What the mission has to prove">
        <ol className="grid gap-px overflow-hidden rounded-xl border border-space-700 bg-space-700 sm:grid-cols-2">
          {objectives.map((o, i) => (
            <li key={o.title} className="bg-space-850 p-6">
              <span className="font-mono text-xs text-amber-500/80">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-base font-medium text-slate-100">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* --------------------------------------------------------------- cta */}
      <Section>
        <div className="panel flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-medium">Watch the router make decisions</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              The ground station page runs a live simulation of deployment, orbital passes and the onboard
              scheduler — including the score breakdown behind every mode switch.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-space-950 hover:bg-amber-400"
          >
            Open ground station
          </Link>
        </div>
      </Section>
    </>
  );
}
