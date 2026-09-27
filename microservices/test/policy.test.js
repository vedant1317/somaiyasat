import assert from 'node:assert/strict';
import test from 'node:test';

import { decide, scoreItem } from '../services/router/policy.js';

const ttc = { id: 1, type: 'ttc', sizeKb: 0.4, remainingKb: 0.4, createdAt: 0 };
const sstv = { id: 2, type: 'sstv', sizeKb: 60, remainingKb: 60, createdAt: 0 };

test('score favours the higher mission class when link and age match', () => {
  const low = scoreItem(ttc, 20, 10);
  const high = scoreItem(sstv, 20, 10);
  assert.ok(low.total > high.total);
  assert.equal(low.feasible, true);
  assert.equal(high.feasible, true);
});

test('a mode below its SNR floor is not feasible', () => {
  const scored = scoreItem(sstv, 5, 10);
  assert.equal(scored.feasible, false);
  assert.ok(scored.margin < 0);
});

test('link floor holds the spacecraft when SNR cannot carry TT&C', () => {
  const decision = decide({ queue: [ttc, sstv], snr: 0.2, t: 40 });
  assert.equal(decision.governor, 'link');
  assert.equal(decision.item, null);
});

test('safe mode selects housekeeping and ignores payload traffic', () => {
  const decision = decide({
    queue: [sstv, ttc],
    snr: 18,
    t: 40,
    safeMode: true,
    soc: 20,
  });
  assert.equal(decision.governor, 'safe-mode');
  assert.equal(decision.item.type, 'ttc');
});

test('watchdog pre-empts the policy after 30 seconds without TT&C', () => {
  const decision = decide({
    queue: [sstv, ttc],
    snr: 18,
    t: 90,
    linkSinceTtc: 31,
  });
  assert.equal(decision.governor, 'watchdog');
  assert.equal(decision.item.type, 'ttc');
  assert.equal(decision.watchdogTripped, true);
});

test('policy picks the highest feasible score and records the runner-up gap', () => {
  const decision = decide({ queue: [ttc, sstv], snr: 16, t: 12, linkSinceTtc: 1 });
  assert.equal(decision.governor, 'policy');
  assert.equal(decision.item.type, 'ttc');
  assert.match(decision.reason, /Policy: TT&C/);
  assert.ok(decision.candidates.length >= 2);
});
