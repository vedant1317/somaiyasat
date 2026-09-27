import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

const services = [
  { name: 'orbit', script: 'services/orbit/server.js', env: { PORT: '5211' } },
  { name: 'power', script: 'services/power/server.js', env: { PORT: '5212' } },
  { name: 'queue', script: 'services/queue/server.js', env: { PORT: '5213' } },
  { name: 'router', script: 'services/router/server.js', env: { PORT: '5214' } },
  {
    name: 'gateway',
    script: 'services/gateway/server.js',
    env: {
      PORT: '8080',
      ORBIT_URL: 'http://127.0.0.1:5211',
      POWER_URL: 'http://127.0.0.1:5212',
      QUEUE_URL: 'http://127.0.0.1:5213',
      ROUTER_URL: 'http://127.0.0.1:5214',
    },
  },
];

const children = services.map((service) => {
  const child = spawn(process.execPath, [path.join(root, service.script)], {
    cwd: root,
    env: { ...process.env, ...service.env },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    if (signal || code === 0 || code === null) return;
    console.error(`${service.name} exited with code ${code}`);
    shutdown(code || 1);
  });
  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 50).unref?.();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
