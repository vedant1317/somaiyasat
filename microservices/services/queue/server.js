import express from 'express';

import { MODES } from '../../shared/config.js';

const PORT = Number(process.env.PORT || 5213);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function createQueue() {
  let nextItemId = 1;
  let items = [];

  function reset() {
    nextItemId = 1;
    items = [];
  }

  function list() {
    return items.map((item) => ({ ...item }));
  }

  function enqueue(type, sizeKb, t) {
    const events = [];
    if (!MODES[type]) return { ok: false, error: 'Unknown mode', queue: list(), events };
    if (items.length >= 40) {
      const idx = items.findIndex((item) => item.type !== 'ttc');
      if (idx === -1) return { ok: true, queue: list(), events, dropped: false };
      const dropped = items.splice(idx, 1)[0];
      events.push({
        level: 'warn',
        message: `Onboard storage full — oldest ${MODES[dropped.type].short} frame overwritten`,
      });
    }
    const size = Number(sizeKb.toFixed(1));
    items.push({
      id: nextItemId,
      type,
      sizeKb: size,
      remainingKb: size,
      createdAt: t,
    });
    nextItemId += 1;
    return { ok: true, queue: list(), events };
  }

  function generate(t) {
    const events = [];
    const accept = (result) => {
      events.push(...result.events);
    };
    if (t % 10 === 0) accept(enqueue('ttc', rand(0.3, 0.6), t));
    if (t % 75 === 0) accept(enqueue('sstv', rand(50, 80), t));
    if (Math.random() < 0.02) accept(enqueue('m17', rand(6, 14), t));
    if (Math.random() < 0.02) accept(enqueue('codec2', rand(3, 7), t));
    return { queue: list(), events };
  }

  function transmit({ id, deliveredKb }) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return { ok: false, error: 'Unknown queue item', queue: list(), events: [] };
    item.remainingKb = Number(Math.max(0, item.remainingKb - deliveredKb).toFixed(2));
    const events = [];
    let completed = false;
    if (item.remainingKb <= 0) {
      items = items.filter((entry) => entry.id !== item.id);
      completed = true;
      if (item.type === 'sstv') {
        events.push({ level: 'ok', message: `SSTV frame #${item.id} complete — image decoded on ground` });
      }
    }
    return { ok: true, completed, item: { ...item }, queue: list(), events };
  }

  return { reset, list, enqueue, generate, transmit };
}

const model = createQueue();
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'queue', depth: model.list().length });
});

app.get('/state', (_req, res) => {
  res.json({ queue: model.list() });
});

app.post('/generate', (req, res) => {
  res.json(model.generate(Number(req.body?.t || 0)));
});

app.post('/enqueue', (req, res) => {
  const { type, sizeKb, t } = req.body || {};
  const result = model.enqueue(type, Number(sizeKb), Number(t || 0));
  res.status(result.ok ? 200 : 400).json(result);
});

app.post('/transmit', (req, res) => {
  const result = model.transmit({
    id: req.body?.id,
    deliveredKb: Number(req.body?.deliveredKb || 0),
  });
  res.status(result.ok ? 200 : 400).json(result);
});

app.post('/reset', (_req, res) => {
  model.reset();
  res.json({ ok: true, queue: [] });
});

app.listen(PORT, () => {
  console.log(`queue-service listening on ${PORT}`);
});
