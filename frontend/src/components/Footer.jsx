import { meta } from '../data/mission.js';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-space-700/70 bg-space-950/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">
        <div>
          <p className="label">Use case</p>
          <p className="mt-2 text-sm text-slate-300">
            {meta.id} — {meta.vertical}
          </p>
          <p className="mt-1 text-sm text-slate-500">In collaboration with {meta.collaborator}</p>
        </div>
        <div>
          <p className="label">Faculty owners</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            {meta.owners.map((o) => (
              <li key={o.name}>
                <span className="text-slate-300">{o.name}</span>
                <br />
                <span className="text-xs text-slate-500">
                  {o.role}, {o.org}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Beneficiaries</p>
          <p className="mt-2 text-sm text-slate-400">{meta.beneficiaries}</p>
          <p className="mt-4 text-xs text-slate-600">
            Ground-station telemetry on this site is a simulation for demonstration and teaching. It is not a
            live spacecraft feed.
          </p>
        </div>
      </div>
    </footer>
  );
}
