import PageHeader from '../components/PageHeader.jsx';
import Section from '../components/Section.jsx';
import { domains, governance, meta, programs, workflow } from '../data/mission.js';

const levelStyle = {
  High: 'text-red-300 border-red-500/40 bg-red-500/10',
  Medium: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  Low: 'text-slate-400 border-space-600 bg-space-800',
};

export default function Program() {
  return (
    <>
      <PageHeader
        eyebrow="Parts A–D · Curriculum integration"
        title="Workflow, governance and program mapping"
        lead="The mission doubles as a teaching platform: each phase of the work maps onto programs and technology domains across KJSIT and KJSSE."
      />

      <Section eyebrow="High-level workflow" title="Six phases, two parallel tracks">
        <ol className="space-y-4">
          {workflow.map((p) => (
            <li key={p.key} className="panel p-6">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-lg text-amber-500/80">{p.key}</span>
                <h3 className="text-lg font-medium text-slate-100">{p.title}</h3>
              </div>
              <ul className="mt-4 space-y-2 pl-9">
                {p.items.map((i) => (
                  <li key={i} className="relative text-sm leading-relaxed text-slate-400 before:absolute before:-left-4 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-slate-600">
                    {i}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="AI governance"
        title="Modern AI governance and paradigms"
        description="Relevance ratings and the consideration each one carries for this mission."
      >
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-space-700">
                <th className="label py-3 pr-4 font-normal">Area</th>
                <th className="label py-3 pr-4 font-normal">Relevance</th>
                <th className="label py-3 font-normal">Recommended consideration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-700/70">
              {governance.map((g) => (
                <tr key={g.area}>
                  <td className="py-4 pr-4 align-top text-slate-200">{g.area}</td>
                  <td className="py-4 pr-4 align-top">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${levelStyle[g.level]}`}>
                      {g.level}
                    </span>
                  </td>
                  <td className="max-w-xl py-4 align-top leading-relaxed text-slate-400">{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        eyebrow="Technology domains"
        title="Who owns which layer"
        description="Every domain has a dependency on at least one other — the interdisciplinary structure is the point."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {domains.map((d) => (
            <article key={d.domain} className="panel p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip">{d.programs}</span>
                <span className="chip">{d.layer}</span>
              </div>
              <h3 className="mt-4 text-base font-medium text-slate-100">{d.domain}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{d.role}</p>
              <p className="mt-3 border-t border-space-700 pt-3 text-xs leading-relaxed text-slate-500">
                <span className="label">Depends on</span>
                <br />
                {d.deps}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Programs mapped" title="KJSIT and KJSSE">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(programs).map(([institute, list]) => (
            <div key={institute} className="panel p-6">
              <h3 className="font-mono text-sm tracking-widest text-amber-400">{institute}</h3>
              <ul className="mt-4 space-y-2">
                {list.map((p) => (
                  <li key={p.name} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 font-mono text-xs ${p.mapped ? 'text-emerald-400' : 'text-slate-600'}`}
                      aria-label={p.mapped ? 'mapped' : 'not mapped'}
                    >
                      {p.mapped ? '✓' : '×'}
                    </span>
                    <span className={p.mapped ? 'text-slate-300' : 'text-slate-600 line-through'}>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Part D" title="Interdisciplinary faculty committee">
        <div className="grid gap-3 sm:grid-cols-2">
          {meta.owners.map((o) => (
            <article key={o.name} className="panel p-6">
              <p className="label">Faculty owner</p>
              <h3 className="mt-2 text-lg font-medium text-slate-100">{o.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{o.role}</p>
              <p className="text-sm text-slate-500">{o.org}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Program-level and course-wise integration coordinators (Parts B and C of the use-case template) are still
          to be named; course-level mapping tables are pending in the source document.
        </p>
      </Section>
    </>
  );
}
