export default function Section({ id, eyebrow, title, description, children, className = '' }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-5 py-14 ${className}`}>
      {(eyebrow || title) && (
        <header className="mb-8 max-w-2xl">
          {eyebrow && <p className="label">{eyebrow}</p>}
          {title && <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>}
          {description && <p className="mt-3 text-slate-400">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
