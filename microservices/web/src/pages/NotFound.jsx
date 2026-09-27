import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-5 py-28">
      <p className="label">Signal lost</p>
      <h1 className="mt-3 text-3xl font-semibold">404 — no carrier on this frequency</h1>
      <p className="mt-3 text-slate-400">That page is not part of the mission.</p>
      <Link to="/" className="mt-6 rounded-md border border-space-600 px-4 py-2 text-sm text-slate-300 hover:text-white">
        Return to base
      </Link>
    </div>
  );
}
