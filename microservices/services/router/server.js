import express from 'express';

import { MODES, POLICY } from '../../shared/config.js';
import { decide } from './policy.js';

const PORT = Number(process.env.PORT || 5214);

const routerState = {
  linkSinceTtc: 0,
  watchdogActive: false,
};

function reset() {
  routerState.linkSinceTtc = 0;
  routerState.watchdogActive = false;
}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'router', linkSinceTtc: routerState.linkSinceTtc });
});

app.get('/policy', (_req, res) => {
  res.json({ policy: POLICY, modes: MODES });
});

app.post('/decide', (req, res) => {
  const body = req.body || {};
  const snr = body.snr == null ? -99 : Number(body.snr);
  if (snr > MODES.ttc.minSnr) routerState.linkSinceTtc += 1;

  const decision = decide({
    queue: body.queue || [],
    snr,
    t: Number(body.t || 0),
    safeMode: Boolean(body.safeMode),
    safeModeCommanded: Boolean(body.safeModeCommanded),
    soc: Number(body.soc ?? 100),
    override: body.override || null,
    linkSinceTtc: routerState.linkSinceTtc,
  });

  let watchdogTripped = false;
  if (decision.governor === 'watchdog' && decision.watchdogTripped && !routerState.watchdogActive) {
    routerState.watchdogActive = true;
    watchdogTripped = true;
  }

  res.json({ ...decision, watchdogTripped, linkSinceTtc: routerState.linkSinceTtc });
});

app.post('/ack', (req, res) => {
  if (req.body?.type === 'ttc') {
    routerState.linkSinceTtc = 0;
    routerState.watchdogActive = false;
  }
  res.json({ ok: true, linkSinceTtc: routerState.linkSinceTtc });
});

app.post('/reset', (_req, res) => {
  reset();
  res.json({ ok: true, linkSinceTtc: 0 });
});

app.listen(PORT, () => {
  console.log(`router-service listening on ${PORT}`);
});
