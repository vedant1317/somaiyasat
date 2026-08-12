import cors from 'cors';
import express from 'express';

import { getHealth, getPolicy, getState, openStream, sendCommand } from './src/runtime.js';

const PORT = process.env.PORT || 5175;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json(getHealth());
});

// Static description of the router policy — used by the UI to explain scoring.
app.get('/api/policy', (req, res) => {
  res.json(getPolicy());
});

app.get('/api/state', (req, res) => {
  res.json(getState());
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
  const closeStream = openStream(res);
  req.on('close', closeStream);
});

app.post('/api/command', (req, res) => {
  const { action, ...payload } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'action is required' });

  const result = sendCommand(action, payload);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`SomaiyaSat telemetry simulator listening on http://localhost:${PORT}`);
});
