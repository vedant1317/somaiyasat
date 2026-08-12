import { getHealth, getPolicy, getState, openStream, sendCommand } from '../backend/src/runtime.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

export function handleHealth(req, res) {
  sendJson(res, 200, getHealth());
}

export function handlePolicy(req, res) {
  sendJson(res, 200, getPolicy());
}

export function handleState(req, res) {
  sendJson(res, 200, getState());
}

export function handleCommand(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    let body = {};

    try {
      body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
      return;
    }

    const { action, ...payload } = body || {};
    if (!action) {
      sendJson(res, 400, { ok: false, error: 'action is required' });
      return;
    }

    const result = sendCommand(action, payload);
    if (!result.ok) {
      sendJson(res, 400, result);
      return;
    }

    sendJson(res, 200, result);
  });
}

export function handleStream(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const closeStream = openStream(res);
  req.on('close', closeStream);
}