export const MODE_META = {
  ttc: { short: 'TT&C', name: 'TT&C / Housekeeping', hex: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-400' },
  sstv: { short: 'SSTV', name: 'SSTV Image', hex: '#34d399', text: 'text-emerald-400', bg: 'bg-emerald-400' },
  m17: { short: 'M17', name: 'M17 Voice / Data', hex: '#a78bfa', text: 'text-violet-400', bg: 'bg-violet-400' },
  codec2: { short: 'CODEC2', name: 'Codec2 Voice', hex: '#38bdf8', text: 'text-sky-400', bg: 'bg-sky-400' },
};

export const GOVERNOR_META = {
  policy: { label: 'AI POLICY', className: 'text-emerald-400 border-emerald-500/40' },
  watchdog: { label: 'WATCHDOG', className: 'text-red-400 border-red-500/40' },
  'safe-mode': { label: 'SAFE MODE', className: 'text-amber-400 border-amber-500/40' },
  operator: { label: 'OPERATOR', className: 'text-sky-400 border-sky-500/40' },
  link: { label: 'NO LINK', className: 'text-slate-500 border-space-600' },
};

export const clock = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const met = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `T+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
