// Mission constants for the SomaiyaSat simulation.
// Values are representative of a PocketQube-class mission, compressed in time
// so a full deployment + pass cycle is watchable in the browser.

export const TICK_MS = 1000; // one simulated second per tick

export const PHASES = {
  DEPLOY: 'deployment',
  COMMISSION: 'commissioning',
  OPS: 'operations',
};

// Deployment / commissioning sequence, played once at T+0.
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

export const DEPLOY_DURATION = 30; // seconds before nominal operations begin

// Orbit / pass geometry (compressed).
export const PASS_DURATION = 200; // seconds of visibility
export const GAP_DURATION = 70; // seconds between passes (LOS)

// Downlink modes multiplexed under the AI router's control.
export const MODES = {
  ttc: {
    id: 'ttc',
    name: 'TT&C / Housekeeping',
    short: 'TT&C',
    minSnr: 1.0, // dB — most robust waveform
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

// Router policy weights. Exposed to the UI so every decision is explainable.
export const POLICY = {
  weights: {
    priority: 0.40, // mission-defined data class (TT&C highest)
    urgency: 0.25, // age of the item in the queue
    link: 0.25, // SNR margin above the mode's demodulation floor
    power: 0.10, // penalty for energy cost per delivered bit
  },
  classWeight: { ttc: 1.0, sstv: 0.55, m17: 0.4, codec2: 0.35 },
  ttcStaleLimit: 30, // s without a housekeeping frame before the watchdog fires
  safeModeSoc: 25, // % battery state of charge that forces TT&C-only safe mode
  recoverSoc: 38, // % SoC required to leave safe mode
};

export const BATTERY = {
  capacityWh: 3.2,
  initialSoc: 78, // %
  chargeW: 1.15, // solar input while in sunlight
  houseKeepingW: 0.22, // always-on bus load
  eclipseFraction: 0.36, // fraction of the orbit spent in eclipse
};
