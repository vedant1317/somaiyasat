import {
  BATTERY,
  DEPLOY_DURATION,
  DEPLOY_SEQUENCE,
  GAP_DURATION,
  MODES,
  PASS_DURATION,
  PHASES,
  POLICY,
} from './config.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

let nextItemId = 1;

/**
 * Single in-process mission simulation. One instance is shared by every
 * connected client so all ground-station views see the same spacecraft.
 */
export class MissionSimulation {
  constructor() {
    this.reset();
  }

  reset() {
    this.t = 0; // mission elapsed time, seconds
    this.phase = PHASES.DEPLOY;
    this.events = [];
    this.decisions = [];
    this.queue = [];
    this.history = [];
    this.images = [];
    this.passIndex = 0;
    this.passClock = 0;
    this.inPass = false;
    this.maxElevation = rand(22, 78);
    this.soc = BATTERY.initialSoc;
    this.eclipse = false;
    this.safeMode = false;
    this.safeModeCommanded = false; // operator-latched, does not auto-clear
    this.override = null; // { mode, until } — ground operator command
    this.lastTtcAt = 0;
    // Staleness is counted in seconds of *usable link*, not wall clock: the
    // watchdog must not fire for time the spacecraft spent below the horizon.
    this.linkSinceTtc = 0;
    this.watchdogActive = false;
    this.currentMode = null;
    this.lastDecision = null;
    this.delivered = { ttc: 0, sstv: 0, m17: 0, codec2: 0 };
    this.stats = { framesDown: 0, bitsDown: 0, passesCompleted: 0, watchdogTrips: 0 };
    this.log('info', 'Simulation reset — SomaiyaSat stowed in SomaiyaPod, awaiting release');
  }

  log(level, message, meta = {}) {
    this.events.unshift({ t: this.t, level, message, ...meta });
    if (this.events.length > 120) this.events.length = 120;
  }

  // ---------------------------------------------------------------- geometry

  /** Elevation angle of SomaiyaSat above the ground-station horizon. */
  elevation() {
    if (!this.inPass) return -1 * rand(2, 30);
    const frac = this.passClock / PASS_DURATION; // 0 -> 1 across the pass
    return this.maxElevation * Math.sin(Math.PI * frac);
  }

  /** Link SNR in dB, derived from elevation with fading noise. */
  snr(elevation) {
    if (elevation <= 0) return -99;
    const rad = (elevation * Math.PI) / 180;
    const base = -6 + 30 * Math.pow(Math.sin(rad), 0.7);
    const fading = rand(-1.8, 1.8);
    return base + fading;
  }

  // ------------------------------------------------------------------- queue

  // Generation rates are set below the aggregate downlink capacity so the queue
  // drains over a full orbit but still backs up during LOS and low elevation.
  generateData() {
    // Housekeeping frames are produced on a fixed cadence.
    if (this.t % 10 === 0) this.enqueue('ttc', rand(0.3, 0.6));
    // Camera captures an SSTV frame a few times per orbit.
    if (this.t % 75 === 0) this.enqueue('sstv', rand(50, 80));
    // Amateur traffic arrives in bursts.
    if (Math.random() < 0.02) this.enqueue('m17', rand(6, 14));
    if (Math.random() < 0.02) this.enqueue('codec2', rand(3, 7));
  }

  enqueue(type, sizeKb) {
    // Onboard storage is finite. When it fills, the oldest *payload* frame is
    // overwritten — housekeeping is never dropped to make room.
    if (this.queue.length >= 40) {
      const idx = this.queue.findIndex((i) => i.type !== 'ttc');
      if (idx === -1) return;
      const dropped = this.queue.splice(idx, 1)[0];
      this.log('warn', `Onboard storage full — oldest ${MODES[dropped.type].short} frame overwritten`);
    }
    this.queue.push({
      id: nextItemId++,
      type,
      sizeKb: Number(sizeKb.toFixed(1)),
      remainingKb: Number(sizeKb.toFixed(1)),
      createdAt: this.t,
    });
  }

  // ------------------------------------------------------------------ router

  /**
   * The onboard AI scheduler/router. Scores every queued item against the
   * current link and power state and returns the winner plus the full score
   * breakdown, so the ground team can audit why a choice was made.
   */
  score(item, snr) {
    const mode = MODES[item.type];
    const w = POLICY.weights;

    const priority = POLICY.classWeight[item.type];
    const age = this.t - item.createdAt;
    const urgency = clamp(age / 60, 0, 1);
    const margin = snr - mode.minSnr;
    const link = clamp((margin + 2) / 10, 0, 1);
    const energyPerKb = mode.powerW / mode.rateKbps;
    const power = clamp(1 - energyPerKb / 0.35, 0, 1);

    const total =
      w.priority * priority + w.urgency * urgency + w.link * link + w.power * power;

    return {
      total: Number(total.toFixed(3)),
      terms: {
        priority: Number((w.priority * priority).toFixed(3)),
        urgency: Number((w.urgency * urgency).toFixed(3)),
        link: Number((w.link * link).toFixed(3)),
        power: Number((w.power * power).toFixed(3)),
      },
      feasible: margin >= 0,
      margin: Number(margin.toFixed(1)),
      age,
    };
  }

  decide(snr) {
    const ttcStale = this.linkSinceTtc > POLICY.ttcStaleLimit;

    // --- Guard rails evaluated before the learned policy is consulted. ---
    if (snr <= MODES.ttc.minSnr) {
      return { item: null, reason: 'No usable link — SNR below TT&C demodulation floor', governor: 'link' };
    }

    if (this.override) {
      const item = this.queue.find((i) => i.type === this.override.mode);
      if (item) {
        return {
          item,
          scored: this.score(item, snr),
          reason: `Ground override active — operator commanded ${MODES[this.override.mode].short}`,
          governor: 'operator',
        };
      }
    }

    if (this.safeMode) {
      const item = this.queue.find((i) => i.type === 'ttc');
      const reason = this.safeModeCommanded
        ? 'Safe mode — commanded by ground operator, housekeeping only'
        : `Safe mode — SoC ${this.soc.toFixed(0)}% below ${POLICY.safeModeSoc}%, housekeeping only`;
      return item
        ? { item, scored: this.score(item, snr), reason, governor: 'safe-mode' }
        : { item: null, reason: 'Safe mode — no housekeeping frame pending', governor: 'safe-mode' };
    }

    if (ttcStale) {
      const item = this.queue.find((i) => i.type === 'ttc');
      if (item) {
        if (!this.watchdogActive) {
          this.watchdogActive = true;
          this.stats.watchdogTrips++;
        }
        return {
          item,
          scored: this.score(item, snr),
          reason: `Watchdog — no TT&C in ${this.linkSinceTtc}s of usable link, policy output pre-empted`,
          governor: 'watchdog',
        };
      }
    }

    // --- Learned policy: score every feasible item, take the maximum. ---
    const candidates = this.queue
      .map((item) => ({ item, scored: this.score(item, snr) }))
      .filter((c) => c.scored.feasible)
      .sort((a, b) => b.scored.total - a.scored.total);

    if (!candidates.length) {
      return {
        item: null,
        reason: `Link too weak (${snr.toFixed(1)} dB) for any queued payload — holding`,
        governor: 'link',
      };
    }

    const best = candidates[0];
    const runnerUp = candidates[1];
    const gap = runnerUp ? (best.scored.total - runnerUp.scored.total).toFixed(2) : null;
    return {
      item: best.item,
      scored: best.scored,
      reason: runnerUp
        ? `Policy: ${MODES[best.item.type].short} scored ${best.scored.total} (+${gap} over ${MODES[runnerUp.item.type].short}) at ${snr.toFixed(1)} dB`
        : `Policy: ${MODES[best.item.type].short} is the only feasible payload at ${snr.toFixed(1)} dB`,
      governor: 'policy',
      candidates: candidates.slice(0, 5).map((c) => ({
        id: c.item.id,
        type: c.item.type,
        sizeKb: c.item.sizeKb,
        remainingKb: c.item.remainingKb,
        age: c.scored.age,
        margin: c.scored.margin,
        score: c.scored.total,
        terms: c.scored.terms,
      })),
    };
  }

  // -------------------------------------------------------------------- tick

  tick() {
    this.t++;

    if (this.phase === PHASES.DEPLOY) return this.tickDeployment();

    this.tickOrbit();
    this.generateData();

    const elevation = this.elevation();
    const snr = this.snr(elevation);
    if (snr > MODES.ttc.minSnr) this.linkSinceTtc++;
    const decision = this.decide(snr);

    let txPower = 0;
    if (decision.item) {
      const mode = MODES[decision.item.type];
      this.currentMode = mode.id;
      txPower = mode.powerW;

      const deliveredKb = mode.rateKbps / 8; // one second of downlink
      decision.item.remainingKb = Number(
        Math.max(0, decision.item.remainingKb - deliveredKb).toFixed(2),
      );
      this.stats.bitsDown += mode.rateKbps * 1000;

      if (decision.item.remainingKb <= 0) {
        this.queue = this.queue.filter((i) => i.id !== decision.item.id);
        this.delivered[decision.item.type]++;
        this.stats.framesDown++;
        if (decision.item.type === 'ttc') {
          this.lastTtcAt = this.t;
          this.linkSinceTtc = 0;
          this.watchdogActive = false;
        }
        if (decision.item.type === 'sstv') {
          this.images.unshift({ id: decision.item.id, t: this.t, pass: this.passIndex });
          if (this.images.length > 8) this.images.length = 8;
          this.log('ok', `SSTV frame #${decision.item.id} complete — image decoded on ground`);
        }
      }
    } else {
      this.currentMode = null;
    }

    if (decision.governor === 'watchdog') {
      this.log('warn', decision.reason);
    }

    this.lastDecision = { t: this.t, snr: Number(snr.toFixed(1)), ...decision };
    this.decisions.unshift({
      t: this.t,
      mode: decision.item ? decision.item.type : null,
      governor: decision.governor,
      reason: decision.reason,
      score: decision.scored ? decision.scored.total : null,
    });
    if (this.decisions.length > 60) this.decisions.length = 60;

    this.tickPower(txPower);
    this.recordHistory(elevation, snr);
  }

  tickDeployment() {
    const step = DEPLOY_SEQUENCE.find((s) => s.t === this.t);
    if (step) this.log('ok', `${step.label} — ${step.detail}`, { step: step.id });
    if (this.t >= DEPLOY_DURATION) {
      this.phase = PHASES.OPS;
      this.lastTtcAt = this.t;
      // Start the orbit clock close to AOS so the first pass follows shortly
      // after commissioning rather than after a full LOS gap.
      this.passClock = GAP_DURATION - 8;
      this.log('ok', 'Commissioning complete — autonomous operations enabled');
    }
    this.recordHistory(-1, -99);
  }

  tickOrbit() {
    if (this.inPass) {
      this.passClock++;
      if (this.passClock >= PASS_DURATION) {
        this.inPass = false;
        this.passClock = 0;
        this.stats.passesCompleted++;
        this.log('info', `LOS — pass ${this.passIndex} complete, ${this.queue.length} items still queued`);
      }
    } else {
      this.passClock++;
      if (this.passClock >= GAP_DURATION) {
        this.inPass = true;
        this.passClock = 0;
        this.passIndex++;
        this.maxElevation = rand(18, 82);
        this.log('info', `AOS — pass ${this.passIndex} acquired, max elevation ${this.maxElevation.toFixed(0)}°`);
      }
    }
    // Eclipse cycles independently of ground-station visibility.
    this.eclipse = Math.sin((this.t / 240) * Math.PI * 2) < -1 + 2 * BATTERY.eclipseFraction;
  }

  tickPower(txPower) {
    const load = BATTERY.houseKeepingW + txPower;
    const input = this.eclipse ? 0 : BATTERY.chargeW;
    const deltaWh = ((input - load) * 1) / 3600;
    this.soc = clamp(this.soc + (deltaWh / BATTERY.capacityWh) * 100 * 12, 5, 100);

    if (!this.safeMode && this.soc < POLICY.safeModeSoc) {
      this.safeMode = true;
      this.log('warn', `Safe mode entered — SoC ${this.soc.toFixed(0)}%, non-essential payloads inhibited`);
    } else if (this.safeMode && !this.safeModeCommanded && this.soc > POLICY.recoverSoc) {
      this.safeMode = false;
      this.log('ok', `Safe mode cleared — SoC recovered to ${this.soc.toFixed(0)}%`);
    }

    if (this.override && this.t > this.override.until) {
      this.log('info', `Ground override on ${MODES[this.override.mode].short} expired — autonomy restored`);
      this.override = null;
    }
  }

  recordHistory(elevation, snr) {
    this.history.push({
      t: this.t,
      elevation: Number(elevation.toFixed(1)),
      snr: snr < -50 ? null : Number(snr.toFixed(1)),
      soc: Number(this.soc.toFixed(1)),
      mode: this.currentMode,
      queue: this.queue.length,
    });
    if (this.history.length > 240) this.history.shift();
  }

  // -------------------------------------------------------------- operator

  command(action, payload = {}) {
    switch (action) {
      case 'force-mode': {
        if (!MODES[payload.mode]) return { ok: false, error: 'Unknown mode' };
        this.override = { mode: payload.mode, until: this.t + 25 };
        this.log('cmd', `Uplink accepted — force ${MODES[payload.mode].short} for 25 s`);
        return { ok: true };
      }
      case 'safe-mode': {
        this.safeMode = true;
        this.safeModeCommanded = true;
        this.log('cmd', 'Uplink accepted — safe mode commanded by ground operator');
        return { ok: true };
      }
      case 'resume-autonomy': {
        this.override = null;
        this.safeMode = false;
        this.safeModeCommanded = false;
        this.log('cmd', 'Uplink accepted — autonomy restored, AI router in control');
        return { ok: true };
      }
      case 'capture-sstv': {
        this.enqueue('sstv', rand(90, 140));
        this.log('cmd', 'Uplink accepted — SSTV capture scheduled, frame queued for downlink');
        return { ok: true };
      }
      case 'reset': {
        this.reset();
        return { ok: true };
      }
      default:
        return { ok: false, error: 'Unknown command' };
    }
  }

  // ---------------------------------------------------------------- snapshot

  state() {
    const elevation = this.history.length ? this.history[this.history.length - 1].elevation : -1;
    const snr = this.history.length ? this.history[this.history.length - 1].snr : null;
    return {
      t: this.t,
      phase: this.phase,
      deploySequence: DEPLOY_SEQUENCE.map((s) => ({ ...s, done: this.t >= s.t })),
      link: {
        inPass: this.inPass,
        passIndex: this.passIndex,
        elevation,
        snr,
        maxElevation: Number(this.maxElevation.toFixed(0)),
        passProgress: this.inPass ? Number((this.passClock / PASS_DURATION).toFixed(3)) : 0,
        secondsToEvent: this.inPass ? PASS_DURATION - this.passClock : GAP_DURATION - this.passClock,
      },
      power: {
        soc: Number(this.soc.toFixed(1)),
        eclipse: this.eclipse,
        safeMode: this.safeMode,
      },
      mode: this.currentMode,
      override: this.override,
      queue: this.queue.map((i) => ({ ...i, age: this.t - i.createdAt })),
      decision: this.lastDecision,
      decisions: this.decisions.slice(0, 12),
      events: this.events.slice(0, 12),
      history: this.history.slice(-120),
      images: this.images,
      delivered: this.delivered,
      stats: this.stats,
    };
  }
}
