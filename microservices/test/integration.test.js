import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ports = {
  orbit: 5311,
  power: 5312,
  queue: 5313,
  router: 5314,
  gateway: 8091,
};

function spawnService(script, env) {
  return spawn(process.execPath, [path.join(root, script)], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'ignore',
  });
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${ports.gateway}/api/health`);
      if (res.ok) {
        const body = await res.json();
        if (body.status === 'ok') return body;
      }
    } catch {
      // Gateway is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('gateway did not become healthy');
}

test('gateway aggregates the four spacecraft services', async () => {
  const children = [
    spawnService('services/orbit/server.js', { PORT: String(ports.orbit) }),
    spawnService('services/power/server.js', { PORT: String(ports.power) }),
    spawnService('services/queue/server.js', { PORT: String(ports.queue) }),
    spawnService('services/router/server.js', { PORT: String(ports.router) }),
    spawnService('services/gateway/server.js', {
      PORT: String(ports.gateway),
      ORBIT_URL: `http://127.0.0.1:${ports.orbit}`,
      POWER_URL: `http://127.0.0.1:${ports.power}`,
      QUEUE_URL: `http://127.0.0.1:${ports.queue}`,
      ROUTER_URL: `http://127.0.0.1:${ports.router}`,
    }),
  ];

  try {
    const health = await waitForHealth();
    assert.equal(health.services.orbit, 'ok');
    assert.equal(health.services.power, 'ok');
    assert.equal(health.services.queue, 'ok');
    assert.equal(health.services.router, 'ok');

    const policy = await fetch(`http://127.0.0.1:${ports.gateway}/api/policy`).then((res) => res.json());
    assert.equal(policy.policy.weights.priority, 0.4);
    assert.ok(policy.modes.ttc);

    const forced = await fetch(`http://127.0.0.1:${ports.gateway}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'force-mode', mode: 'codec2' }),
    }).then((res) => res.json());
    assert.equal(forced.ok, true);
    assert.equal(forced.state.override.mode, 'codec2');

    const unknown = await fetch(`http://127.0.0.1:${ports.gateway}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'launch' }),
    });
    assert.equal(unknown.status, 400);

    let state = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      state = await fetch(`http://127.0.0.1:${ports.gateway}/api/state`).then((res) => res.json());
      if (state.t >= 1) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(state.t >= 1);
    assert.equal(state.phase, 'deployment');
    assert.ok(Array.isArray(state.deploySequence));
    assert.equal(typeof state.power.soc, 'number');

    const reset = await fetch(`http://127.0.0.1:${ports.gateway}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    }).then((res) => res.json());
    assert.equal(reset.ok, true);
    assert.equal(reset.state.phase, 'deployment');
    assert.equal(reset.state.override, null);
  } finally {
    for (const child of children) child.kill('SIGTERM');
  }
});
