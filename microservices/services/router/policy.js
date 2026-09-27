import { MODES, POLICY } from '../../shared/config.js';

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

export function scoreItem(item, snr, t) {
  const mode = MODES[item.type];
  const weights = POLICY.weights;
  const priority = POLICY.classWeight[item.type];
  const age = t - item.createdAt;
  const urgency = clamp(age / 60, 0, 1);
  const margin = snr - mode.minSnr;
  const link = clamp((margin + 2) / 10, 0, 1);
  const energyPerKb = mode.powerW / mode.rateKbps;
  const power = clamp(1 - energyPerKb / 0.35, 0, 1);
  const total = weights.priority * priority + weights.urgency * urgency + weights.link * link + weights.power * power;

  return {
    total: Number(total.toFixed(3)),
    terms: {
      priority: Number((weights.priority * priority).toFixed(3)),
      urgency: Number((weights.urgency * urgency).toFixed(3)),
      link: Number((weights.link * link).toFixed(3)),
      power: Number((weights.power * power).toFixed(3)),
    },
    feasible: margin >= 0,
    margin: Number(margin.toFixed(1)),
    age,
  };
}

/**
 * Guard rails run before the learned policy. `linkSinceTtc` is seconds of
 * usable link since the last completed housekeeping frame.
 */
export function decide({ queue = [], snr = -99, t = 0, safeMode = false, safeModeCommanded = false, soc = 100, override = null, linkSinceTtc = 0 }) {
  const ttcStale = linkSinceTtc > POLICY.ttcStaleLimit;

  if (snr <= MODES.ttc.minSnr) {
    return {
      item: null,
      reason: 'No usable link — SNR below TT&C demodulation floor',
      governor: 'link',
      watchdogTripped: false,
    };
  }

  if (override) {
    const item = queue.find((entry) => entry.type === override.mode);
    if (item) {
      return {
        item,
        scored: scoreItem(item, snr, t),
        reason: `Ground override active — operator commanded ${MODES[override.mode].short}`,
        governor: 'operator',
        watchdogTripped: false,
      };
    }
  }

  if (safeMode) {
    const item = queue.find((entry) => entry.type === 'ttc');
    const reason = safeModeCommanded
      ? 'Safe mode — commanded by ground operator, housekeeping only'
      : `Safe mode — SoC ${Number(soc).toFixed(0)}% below ${POLICY.safeModeSoc}%, housekeeping only`;
    return item
      ? { item, scored: scoreItem(item, snr, t), reason, governor: 'safe-mode', watchdogTripped: false }
      : { item: null, reason: 'Safe mode — no housekeeping frame pending', governor: 'safe-mode', watchdogTripped: false };
  }

  if (ttcStale) {
    const item = queue.find((entry) => entry.type === 'ttc');
    if (item) {
      return {
        item,
        scored: scoreItem(item, snr, t),
        reason: `Watchdog — no TT&C in ${linkSinceTtc}s of usable link, policy output pre-empted`,
        governor: 'watchdog',
        watchdogTripped: true,
      };
    }
  }

  const candidates = queue
    .map((item) => ({ item, scored: scoreItem(item, snr, t) }))
    .filter((candidate) => candidate.scored.feasible)
    .sort((a, b) => b.scored.total - a.scored.total);

  if (!candidates.length) {
    return {
      item: null,
      reason: `Link too weak (${Number(snr).toFixed(1)} dB) for any queued payload — holding`,
      governor: 'link',
      watchdogTripped: false,
    };
  }

  const best = candidates[0];
  const runnerUp = candidates[1];
  const gap = runnerUp ? (best.scored.total - runnerUp.scored.total).toFixed(2) : null;
  return {
    item: best.item,
    scored: best.scored,
    reason: runnerUp
      ? `Policy: ${MODES[best.item.type].short} scored ${best.scored.total} (+${gap} over ${MODES[runnerUp.item.type].short}) at ${Number(snr).toFixed(1)} dB`
      : `Policy: ${MODES[best.item.type].short} is the only feasible payload at ${Number(snr).toFixed(1)} dB`,
    governor: 'policy',
    watchdogTripped: false,
    candidates: candidates.slice(0, 5).map((candidate) => ({
      id: candidate.item.id,
      type: candidate.item.type,
      sizeKb: candidate.item.sizeKb,
      remainingKb: candidate.item.remainingKb,
      age: candidate.scored.age,
      margin: candidate.scored.margin,
      score: candidate.scored.total,
      terms: candidate.scored.terms,
    })),
  };
}
