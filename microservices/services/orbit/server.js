import express from 'express';

import {
  DEPLOY_DURATION,
  DEPLOY_SEQUENCE,
  GAP_DURATION,
  PASS_DURATION,
  PHASES,
} from '../../shared/config.js';

const PORT = Number(process.env.PORT || 5211);
const clampNoise = (lo, hi) => lo + Math.random() * (hi - lo);

function createOrbit() {
  const orbit = {
    t: 0,
    phase: PHASES.DEPLOY,
    passIndex: 0,
    passClock: 0,
    inPass: false,
    maxElevation: clampNoise(22, 78),
    passesCompleted: 0,
  };

  function reset() {
    orbit.t = 0;
    orbit.phase = PHASES.DEPLOY;
    orbit.passIndex = 0;
    orbit.passClock = 0;
    orbit.inPass = false;
    orbit.maxElevation = clampNoise(22, 78);
    orbit.passesCompleted = 0;
  }

  function elevation() {
    if (!orbit.inPass) return -1 * clampNoise(2, 30);
    const frac = orbit.passClock / PASS_DURATION;
    return orbit.maxElevation * Math.sin(Math.PI * frac);
  }

  function snr(elevation) {
    if (elevation <= 0) return -99;
    const rad = (elevation * Math.PI) / 180;
    const base = -6 + 30 * Math.pow(Math.sin(rad), 0.7);
    return base + clampNoise(-1.8, 1.8);
  }

  function linkView(elevation, snrValue) {
    return {
      inPass: orbit.inPass,
      passIndex: orbit.passIndex,
      elevation: Number(elevation.toFixed(1)),
      snr: snrValue < -50 ? null : Number(snrValue.toFixed(1)),
      maxElevation: Number(orbit.maxElevation.toFixed(0)),
      passProgress: orbit.inPass ? Number((orbit.passClock / PASS_DURATION).toFixed(3)) : 0,
      secondsToEvent: orbit.inPass ? PASS_DURATION - orbit.passClock : GAP_DURATION - orbit.passClock,
    };
  }

  function snapshot(elevationValue, snrValue, extra = {}) {
    return {
      t: orbit.t,
      phase: orbit.phase,
      passesCompleted: orbit.passesCompleted,
      deploySequence: DEPLOY_SEQUENCE.map((step) => ({ ...step, done: orbit.t >= step.t })),
      link: linkView(elevationValue, snrValue),
      operational: false,
      events: [],
      ...extra,
    };
  }

  function tickDeployment() {
    const events = [];
    const step = DEPLOY_SEQUENCE.find((item) => item.t === orbit.t);
    if (step) {
      events.push({ level: 'ok', message: `${step.label} — ${step.detail}`, step: step.id });
    }
    if (orbit.t >= DEPLOY_DURATION) {
      orbit.phase = PHASES.OPS;
      orbit.passClock = GAP_DURATION - 8;
      events.push({ level: 'ok', message: 'Commissioning complete — autonomous operations enabled' });
    }
    return snapshot(-1, -99, { operational: false, events });
  }

  function tickPass() {
    const events = [];
    if (orbit.inPass) {
      orbit.passClock += 1;
      if (orbit.passClock >= PASS_DURATION) {
        orbit.inPass = false;
        orbit.passClock = 0;
        orbit.passesCompleted += 1;
        events.push({
          level: 'info',
          message: `LOS — pass ${orbit.passIndex} complete`,
          passEnded: true,
        });
      }
    } else {
      orbit.passClock += 1;
      if (orbit.passClock >= GAP_DURATION) {
        orbit.inPass = true;
        orbit.passClock = 0;
        orbit.passIndex += 1;
        orbit.maxElevation = clampNoise(18, 82);
        events.push({
          level: 'info',
          message: `AOS — pass ${orbit.passIndex} acquired, max elevation ${orbit.maxElevation.toFixed(0)}°`,
        });
      }
    }
    const elevationValue = elevation();
    return snapshot(elevationValue, snr(elevationValue), { operational: true, events });
  }

  function tick() {
    orbit.t += 1;
    if (orbit.phase === PHASES.DEPLOY) return tickDeployment();
    return tickPass();
  }

  return { reset, tick, snapshot: () => snapshot(orbit.inPass ? elevation() : -1, orbit.inPass ? 0 : -99) };
}

const model = createOrbit();
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orbit', t: model.snapshot().t });
});

app.get('/state', (_req, res) => {
  res.json(model.snapshot());
});

app.post('/tick', (_req, res) => {
  res.json(model.tick());
});

app.post('/reset', (_req, res) => {
  model.reset();
  res.json({ ok: true, ...model.snapshot() });
});

app.listen(PORT, () => {
  console.log(`orbit-service listening on ${PORT}`);
});
