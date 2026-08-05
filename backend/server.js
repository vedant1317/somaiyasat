import cors from 'cors';
import express from 'express';

import { MODES, POLICY, TICK_MS } from './src/config.js';
import { MissionSimulation } from './src/simulation.js';

const PORT = process.env.PORT || 5175;

const app = express();
app.use(cors());
app.use(express.json());

const sim = new MissionSimulation();
const clients = new Set();

setInterval(() => {
  sim.tick();
  const frame = `data: ${JSON.stringify(sim.state())}\n\n`;
  for (const res of clients) res.write(frame);
}, TICK_MS);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptimeTicks: sim.t, clients: clients.size });
});

// Static description of the router policy — used by the UI to explain scoring.
app.get('/api/policy', (req, res) => {
  res.json({ policy: POLICY, modes: MODES });
});

app.get('/api/state', (req, res) => {
  res.json(sim.state());
});

// Server-sent events: one frame per simulated second.
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify(sim.state())}\n\n`);

  clients.add(res);
  req.on('close', () => {
    clients.delete(res);
    res.end();
  });
});

app.post('/api/command', (req, res) => {
  const { action, ...payload } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'action is required' });

  const result = sim.command(action, payload);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ...result, state: sim.state() });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`SomaiyaSat telemetry simulator listening on http://localhost:${PORT}`);
});
