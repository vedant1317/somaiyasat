import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const links = [
  { to: '/mission', label: 'Mission' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/program', label: 'Program' },
  { to: '/dashboard', label: 'Ground Station' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-100'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-space-700/70 bg-space-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="absolute inset-0 rounded-md border border-amber-400/30 animate-pulseRing" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide text-slate-100">SomaiyaSat</span>
            <span className="label">KJS-SRS-01</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded-md border border-space-600 px-2.5 py-1.5 text-slate-400 md:hidden"
        >
          <span className="block h-px w-4 bg-current" />
          <span className="mt-1 block h-px w-4 bg-current" />
          <span className="mt-1 block h-px w-4 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-space-700/70 px-5 py-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-2 py-2 text-sm ${isActive ? 'bg-space-800 text-amber-400' : 'text-slate-400'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
