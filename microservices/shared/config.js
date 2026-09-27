// Mission constants for the SomaiyaSat simulation.
// Values match the monolith in backend/src/config.js so the clone scores,
// powers, and times the spacecraft the same way.

export const TICK_MS = 1000;

export const PHASES = {
  DEPLOY: 'deployment',
  COMMISSION: 'commissioning',
  OPS: 'operations',
};

export const DEPLOY_SEQUENCE = [
  { t: 0, id: 'pod-armed', label: 'SomaiyaPod armed', detail: 'Release timer active, pusher spring loaded' },
  { t: 4, id: 'burnwire', label: 'Burn-wire actuated', detail: 'Non-pyrotechnic release, door open confirmed' },
  { t: 7, id: 'separation', label: 'Separation switches released', detail: 'Both switches open — SomaiyaSat clear of rails' },
  { t: 10, id: 'beacon', label: 'Deployer confirmation beacon', detail: 'Short-duration RF beacon received by SomaiyaSat' },
  { t: 13, id: 'boot', label: 'Flight computer boot', detail: 'OBC up, watchdog armed, safe-mode defaults loaded' },
  { t: 17, id: 'antenna', label: 'Antenna deployment', detail: 'Tape-spring monopoles released, continuity nominal' },
  { t: 21, id: 'detumble', label: 'Detumble complete', detail: 'Tip-off rate below 3 deg/s' },
  { t: 25, id: 'router', label: 'AI router online', detail: 'Policy loaded on OBC, rule-based fallback armed' },
];

export const DEPLOY_DURATION = 30;
export const PASS_DURATION = 200;
export const GAP_DURATION = 70;

export const MODES = {
  ttc: {
    id: 'ttc',
    name: 'TT&C / Housekeeping',
    short: 'TT&C',
    minSnr: 1.0,
    rateKbps: 1.2,
    powerW: 0.35,
    color: '#f59e0b',
  },
  codec2: {
    id: 'codec2',
    name: 'Codec2 Digital Voice',
    short: 'CODEC2',
    minSnr: 4.0,
    rateKbps: 3.2,
    powerW: 0.55,
    color: '#38bdf8',
  },
  m17: {
    id: 'm17',
    name: 'M17 Voice / Data',
    short: 'M17',
    minSnr: 6.0,
    rateKbps: 9.6,
    powerW: 0.8,
    color: '#a78bfa',
  },
  sstv: {
    id: 'sstv',
    name: 'SSTV Image Downlink',
    short: 'SSTV',
    minSnr: 9.0,
    rateKbps: 16.0,
    powerW: 1.1,
    color: '#34d399',
  },
};

export const POLICY = {
  weights: {
    priority: 0.4,
    urgency: 0.25,
    link: 0.25,
    power: 0.1,
  },
  classWeight: { ttc: 1.0, sstv: 0.55, m17: 0.4, codec2: 0.35 },
  ttcStaleLimit: 30,
  safeModeSoc: 25,
  recoverSoc: 38,
};

export const BATTERY = {
  capacityWh: 3.2,
  initialSoc: 78,
  chargeW: 1.15,
  houseKeepingW: 0.22,
  eclipseFraction: 0.36,
};

export const SERVICE_URLS = {
  orbit: process.env.ORBIT_URL || 'http://127.0.0.1:5211',
  power: process.env.POWER_URL || 'http://127.0.0.1:5212',
  queue: process.env.QUEUE_URL || 'http://127.0.0.1:5213',
  router: process.env.ROUTER_URL || 'http://127.0.0.1:5214',
};
