export default function PageHeader({ eyebrow, title, lead }) {
  return (
    <section className="border-b border-space-700/60">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-slate-400">{lead}</p>}
      </div>
    </section>
  );
}
