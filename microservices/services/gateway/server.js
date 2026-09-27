import cors from 'cors';
import express from 'express';

import { MODES, SERVICE_URLS, TICK_MS } from '../../shared/config.js';
import { callService } from '../../shared/http.js';

const PORT = Number(process.env.PORT || 8080);

const clients = new Set();

const mission = {
  t: 0,
  phase: 'deployment',
  deploySequence: [],
  link: {
    inPass: false,
    passIndex: 0,
    elevation: -1,
    snr: null,
    maxElevation: 0,
    passProgress: 0,
    secondsToEvent: 70,
  },
  power: { soc: 78, eclipse: false, safeMode: false },
  mode: null,
  queue: [],
  decision: null,
  decisions: [],
  events: [],
  history: [],
  images: [],
  delivered: { ttc: 0, sstv: 0, m17: 0, codec2: 0 },
  stats: { framesDown: 0, bitsDown: 0, passesCompleted: 0, watchdogTrips: 0 },
};

let override = null;
let ticking = false;

function log(level, message, meta = {}) {
  mission.events.unshift({ t: mission.t, level, message, ...meta });
  if (mission.events.length > 120) mission.events.length = 120;
}

function withAge(item) {
  return { ...item, age: mission.t - item.createdAt };
}

function recordHistory(elevation, snr) {
  mission.history.push({
    t: mission.t,
    elevation: Number(elevation.toFixed(1)),
    snr: snr == null || snr < -50 ? null : Number(Number(snr).toFixed(1)),
    soc: Number(mission.power.soc.toFixed(1)),
    mode: mission.mode,
    queue: mission.queue.length,
  });
  if (mission.history.length > 240) mission.history.shift();
}

function publicState() {
  return {
    t: mission.t,
    phase: mission.phase,
    deploySequence: mission.deploySequence,
    link: mission.link,
    power: {
      soc: Number(mission.power.soc.toFixed(1)),
      eclipse: mission.power.eclipse,
      safeMode: mission.power.safeMode,
    },
    mode: mission.mode,
    override,
    queue: mission.queue,
    decision: mission.decision,
    decisions: mission.decisions.slice(0, 12),
    events: mission.events.slice(0, 12),
    history: mission.history.slice(-120),
    images: mission.images,
    delivered: mission.delivered,
    stats: mission.stats,
  };
}

function broadcast() {
  const payload = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const res of clients) res.write(payload);
}

async function serviceHealth() {
  const entries = await Promise.all(
    Object.entries(SERVICE_URLS).map(async ([name, base]) => {
      try {
        const body = await callService(base, '/health');
        return [name, body.status || 'ok'];
      } catch {
        return [name, 'down'];
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function resetAll() {
  await Promise.all(Object.values(SERVICE_URLS).map((base) => callService(base, '/reset', { method: 'POST' })));
  mission.t = 0;
  mission.phase = 'deployment';
  mission.deploySequence = [];
  mission.link = {
    inPass: false,
    passIndex: 0,
    elevation: -1,
    snr: null,
    maxElevation: 0,
    passProgress: 0,
    secondsToEvent: 70,
  };
  mission.power = { soc: 78, eclipse: false, safeMode: false };
  mission.mode = null;
  mission.queue = [];
  mission.decision = null;
  mission.decisions = [];
  mission.events = [];
  mission.history = [];
  mission.images = [];
  mission.delivered = { ttc: 0, sstv: 0, m17: 0, codec2: 0 };
  mission.stats = { framesDown: 0, bitsDown: 0, passesCompleted: 0, watchdogTrips: 0 };
  override = null;
  const orbit = await callService(SERVICE_URLS.orbit, '/state');
  mission.deploySequence = orbit.deploySequence;
  mission.phase = orbit.phase;
  mission.link = orbit.link;
  log('info', 'Simulation reset — SomaiyaSat stowed in SomaiyaPod, awaiting release');
}

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const orbit = await callService(SERVICE_URLS.orbit, '/tick', { method: 'POST' });
    mission.t = orbit.t;
    mission.phase = orbit.phase;
    mission.deploySequence = orbit.deploySequence;
    mission.link = orbit.link;
    mission.stats.passesCompleted = orbit.passesCompleted;

    for (const event of orbit.events) {
      const message = event.passEnded ? `${event.message}, ${mission.queue.length} items still queued` : event.message;
      log(event.level, message, event.step ? { step: event.step } : {});
    }

    if (!orbit.operational) {
      mission.mode = null;
      recordHistory(orbit.link.elevation ?? -1, orbit.link.snr);
      broadcast();
      return;
    }

    const generated = await callService(SERVICE_URLS.queue, '/generate', {
      method: 'POST',
      body: { t: orbit.t },
    });
    for (const event of generated.events) log(event.level, event.message);

    const power = await callService(SERVICE_URLS.power, '/state');
    const snr = orbit.link.snr == null ? -99 : orbit.link.snr;
    const decision = await callService(SERVICE_URLS.router, '/decide', {
      method: 'POST',
      body: {
        t: orbit.t,
        snr,
        soc: power.soc,
        safeMode: power.safeMode,
        safeModeCommanded: power.safeModeCommanded,
        override,
        queue: generated.queue,
      },
    });

    mission.mode = null;
    if (decision.item) {
      const mode = MODES[decision.item.type];
      mission.mode = mode.id;
      const transmitted = await callService(SERVICE_URLS.queue, '/transmit', {
        method: 'POST',
        body: { id: decision.item.id, deliveredKb: mode.rateKbps / 8 },
      });
      decision.item.remainingKb = transmitted.item.remainingKb;
      const selected = decision.candidates?.find((candidate) => candidate.id === decision.item.id);
      if (selected) selected.remainingKb = transmitted.item.remainingKb;
      mission.stats.bitsDown += mode.rateKbps * 1000;
      for (const event of transmitted.events) log(event.level, event.message);
      if (transmitted.completed) {
        mission.delivered[decision.item.type] += 1;
        mission.stats.framesDown += 1;
        if (decision.item.type === 'ttc') {
          await callService(SERVICE_URLS.router, '/ack', { method: 'POST', body: { type: 'ttc' } });
        }
        if (decision.item.type === 'sstv') {
          mission.images.unshift({ id: decision.item.id, t: orbit.t, pass: orbit.link.passIndex });
          if (mission.images.length > 8) mission.images.length = 8;
        }
      }
      mission.queue = transmitted.queue.map(withAge);
    } else {
      mission.queue = generated.queue.map(withAge);
    }

    if (decision.watchdogTripped) mission.stats.watchdogTrips += 1;
    if (decision.governor === 'watchdog') log('warn', decision.reason);

    const powerAfter = await callService(SERVICE_URLS.power, '/apply', {
      method: 'POST',
      body: { txPower: mission.mode ? MODES[mission.mode].powerW : 0, t: orbit.t },
    });
    if (powerAfter.enteredSafe) {
      log('warn', `Safe mode entered — SoC ${Number(powerAfter.soc).toFixed(0)}%, non-essential payloads inhibited`);
    }
    if (powerAfter.clearedSafe) {
      log('ok', `Safe mode cleared — SoC recovered to ${Number(powerAfter.soc).toFixed(0)}%`);
    }
    mission.power = {
      soc: powerAfter.soc,
      eclipse: powerAfter.eclipse,
      safeMode: powerAfter.safeMode,
    };

    if (override && orbit.t > override.until) {
      log('info', `Ground override on ${MODES[override.mode].short} expired — autonomy restored`);
      override = null;
    }

    mission.decision = {
      t: orbit.t,
      snr: Number(Number(snr).toFixed(1)),
      item: decision.item,
      scored: decision.scored,
      reason: decision.reason,
      governor: decision.governor,
      candidates: decision.candidates,
    };
    mission.decisions.unshift({
      t: orbit.t,
      mode: decision.item ? decision.item.type : null,
      governor: decision.governor,
      reason: decision.reason,
      score: decision.scored ? decision.scored.total : null,
    });
    if (mission.decisions.length > 60) mission.decisions.length = 60;

    recordHistory(orbit.link.elevation ?? -1, orbit.link.snr);
    broadcast();
  } catch (error) {
    console.error('mission tick failed', error.message);
  } finally {
    ticking = false;
  }
}

async function sendCommand(action, payload = {}) {
  switch (action) {
    case 'force-mode': {
      if (!MODES[payload.mode]) return { ok: false, error: 'Unknown mode' };
      override = { mode: payload.mode, until: mission.t + 25 };
      log('cmd', `Uplink accepted — force ${MODES[payload.mode].short} for 25 s`);
      broadcast();
      return { ok: true, state: publicState() };
    }
    case 'safe-mode': {
      await callService(SERVICE_URLS.power, '/command', { method: 'POST', body: { action: 'safe-mode' } });
      mission.power.safeMode = true;
      log('cmd', 'Uplink accepted — safe mode commanded by ground operator');
      broadcast();
      return { ok: true, state: publicState() };
    }
    case 'resume-autonomy': {
      await callService(SERVICE_URLS.power, '/command', { method: 'POST', body: { action: 'resume-autonomy' } });
      override = null;
      mission.power.safeMode = false;
      log('cmd', 'Uplink accepted — autonomy restored, AI router in control');
      broadcast();
      return { ok: true, state: publicState() };
    }
    case 'capture-sstv': {
      const sizeKb = 90 + Math.random() * 50;
      const queued = await callService(SERVICE_URLS.queue, '/enqueue', {
        method: 'POST',
        body: { type: 'sstv', sizeKb, t: mission.t },
      });
      for (const event of queued.events) log(event.level, event.message);
      mission.queue = queued.queue.map(withAge);
      log('cmd', 'Uplink accepted — SSTV capture scheduled, frame queued for downlink');
      broadcast();
      return { ok: true, state: publicState() };
    }
    case 'reset': {
      await resetAll();
      broadcast();
      return { ok: true, state: publicState() };
    }
    default:
      return { ok: false, error: 'Unknown command' };
  }
}

async function waitForServices() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const health = await serviceHealth();
    if (Object.values(health).every((status) => status === 'ok')) return health;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Dependent services did not become healthy');
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const services = await serviceHealth();
  const degraded = Object.values(services).some((status) => status !== 'ok');
  res.json({
    status: degraded ? 'degraded' : 'ok',
    uptimeTicks: mission.t,
    clients: clients.size,
    services,
  });
});

app.get('/api/policy', async (_req, res, next) => {
  try {
    res.json(await callService(SERVICE_URLS.router, '/policy'));
  } catch (error) {
    next(error);
  }
});

app.get('/api/state', (_req, res) => {
  res.json(publicState());
});

app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  clients.add(res);
  res.write(`data: ${JSON.stringify(publicState())}\n\n`);
  req.on('close', () => {
    clients.delete(res);
    res.end();
  });
});

app.post('/api/command', async (req, res) => {
  const { action, ...payload } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'action is required' });
  try {
    const result = await sendCommand(action, payload);
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((error, _req, res, _next) => {
  res.status(502).json({ error: error.message });
});

await waitForServices();
await resetAll();
setInterval(() => {
  tick();
}, TICK_MS).unref?.();

app.listen(PORT, () => {
  console.log(`gateway listening on http://localhost:${PORT}`);
});
