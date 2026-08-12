import { MODES, POLICY, TICK_MS } from './config.js';
import { MissionSimulation } from './simulation.js';

const sim = new MissionSimulation();
const clients = new Set();

let ticker = null;
let lastSyncAt = Date.now();

function frame() {
  return `data: ${JSON.stringify(sim.state())}\n\n`;
}

function broadcast() {
  const payload = frame();
  for (const res of clients) res.write(payload);
}

function advanceTicks(tickCount) {
  for (let index = 0; index < tickCount; index += 1) sim.tick();
}

function syncSimulation({ broadcastIfChanged = true } = {}) {
  const now = Date.now();
  const elapsed = now - lastSyncAt;
  const tickCount = Math.floor(elapsed / TICK_MS);

  if (tickCount <= 0) return sim;

  advanceTicks(tickCount);
  lastSyncAt += tickCount * TICK_MS;

  if (broadcastIfChanged && clients.size > 0) broadcast();
  return sim;
}

function startTicker() {
  if (ticker) return;

  ticker = setInterval(() => {
    sim.tick();
    lastSyncAt = Date.now();
    broadcast();
  }, TICK_MS);

  ticker.unref?.();
}

function stopTicker() {
  if (ticker && clients.size === 0) {
    clearInterval(ticker);
    ticker = null;
  }
}

export function getHealth() {
  syncSimulation({ broadcastIfChanged: false });
  return { status: 'ok', uptimeTicks: sim.t, clients: clients.size };
}

export function getPolicy() {
  return { policy: POLICY, modes: MODES };
}

export function getState() {
  syncSimulation();
  return sim.state();
}

export function sendCommand(action, payload = {}) {
  syncSimulation();
  const result = sim.command(action, payload);
  if (!result.ok) return result;

  const state = sim.state();
  if (clients.size > 0) broadcast();
  return { ...result, state };
}

export function openStream(res) {
  syncSimulation({ broadcastIfChanged: false });
  clients.add(res);
  startTicker();
  res.write(frame());

  return () => {
    clients.delete(res);
    stopTicker();
    res.end();
  };
}