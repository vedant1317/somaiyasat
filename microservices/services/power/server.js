import express from 'express';

import { BATTERY, POLICY } from '../../shared/config.js';

const PORT = Number(process.env.PORT || 5212);
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function createPower() {
  const power = {
    soc: BATTERY.initialSoc,
    eclipse: false,
    safeMode: false,
    safeModeCommanded: false,
  };

  function reset() {
    power.soc = BATTERY.initialSoc;
    power.eclipse = false;
    power.safeMode = false;
    power.safeModeCommanded = false;
  }

  function view() {
    return {
      soc: Number(power.soc.toFixed(1)),
      eclipse: power.eclipse,
      safeMode: power.safeMode,
      safeModeCommanded: power.safeModeCommanded,
    };
  }

  function apply({ txPower = 0, t = 0 } = {}) {
    power.eclipse = Math.sin((t / 240) * Math.PI * 2) < -1 + 2 * BATTERY.eclipseFraction;
    const load = BATTERY.houseKeepingW + txPower;
    const input = power.eclipse ? 0 : BATTERY.chargeW;
    const deltaWh = ((input - load) * 1) / 3600;
    power.soc = clamp(power.soc + (deltaWh / BATTERY.capacityWh) * 100 * 12, 5, 100);

    let enteredSafe = false;
    let clearedSafe = false;
    if (!power.safeMode && power.soc < POLICY.safeModeSoc) {
      power.safeMode = true;
      enteredSafe = true;
    } else if (power.safeMode && !power.safeModeCommanded && power.soc > POLICY.recoverSoc) {
      power.safeMode = false;
      clearedSafe = true;
    }

    return { ...view(), enteredSafe, clearedSafe };
  }

  function command(action) {
    if (action === 'safe-mode') {
      power.safeMode = true;
      power.safeModeCommanded = true;
      return { ok: true, ...view() };
    }
    if (action === 'resume-autonomy') {
      power.safeMode = false;
      power.safeModeCommanded = false;
      return { ok: true, ...view() };
    }
    return { ok: false, error: 'Unknown power command' };
  }

  return { reset, view, apply, command };
}

const model = createPower();
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'power', ...model.view() });
});

app.get('/state', (_req, res) => {
  res.json(model.view());
});

app.post('/apply', (req, res) => {
  res.json(model.apply(req.body || {}));
});

app.post('/command', (req, res) => {
  const result = model.command(req.body?.action);
  res.status(result.ok ? 200 : 400).json(result);
});

app.post('/reset', (_req, res) => {
  model.reset();
  res.json({ ok: true, ...model.view() });
});

app.listen(PORT, () => {
  console.log(`power-service listening on ${PORT}`);
});
