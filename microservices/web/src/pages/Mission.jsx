import PageHeader from '../components/PageHeader.jsx';
import Section from '../components/Section.jsx';
import { challenges, meta, objectives, outputs, problem, solution } from '../data/mission.js';

export default function Mission() {
  return (
    <>
      <PageHeader
        eyebrow={`${meta.id} · Part A — Use Case Profile`}
        title={meta.subtitle}
        lead={`${meta.vertical}. In collaboration with ${meta.collaborator}. Beneficiaries: ${meta.beneficiaries}.`}
      />

      <Section eyebrow="Problem statement" title="Why manual control does not scale here">
        <div className="grid gap-6 lg:grid-cols-2">
          <p className="text-lg leading-relaxed text-slate-300">{problem.statement}</p>
          <p className="leading-relaxed text-slate-400">{problem.detail}</p>
        </div>
      </Section>

      <Section eyebrow="Background & context" title="PocketQubes, and what happens after release">
        <p className="max-w-4xl leading-relaxed text-slate-400">{problem.background}</p>
      </Section>

      <Section eyebrow="Objectives" title="Five mission objectives">
        <div className="space-y-px overflow-hidden rounded-xl border border-space-700 bg-space-700">
          {objectives.map((o, i) => (
            <div key={o.title} className="grid gap-4 bg-space-850 p-6 sm:grid-cols-[auto_1fr]">
              <span className="font-mono text-sm text-amber-500/80">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-base font-medium text-slate-100">{o.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{o.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Solution approach" title="How the three subsystems cooperate">
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

      <Section eyebrow="Operational challenges" title="The seven hard parts">
        <ul className="grid gap-3 md:grid-cols-2">
          {challenges.map((c, i) => (
            <li key={c} className="panel flex gap-4 p-5">
              <span className="font-mono text-xs text-slate-600">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-sm leading-relaxed text-slate-400">{c}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Expected outputs" title="What the mission delivers">
        <ul className="space-y-3">
          {outputs.map((o) => (
            <li key={o} className="flex gap-3 border-l-2 border-amber-500/40 pl-4">
              <p className="text-slate-400">{o}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
