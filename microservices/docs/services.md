# Services

Internal routes are what the gateway calls. The browser only uses the gateway routes at the bottom of this page.

Shared constants live in `shared/config.js`: mode table, policy weights, deployment timeline, pass length, and battery model.

## Orbit — port 5211

`services/orbit/server.js`

Owns the mission clock and the geometry the router treats as the radio link.

| State | Meaning |
| --- | --- |
| `t` | Mission elapsed seconds. Incremented only by `POST /tick`. |
| `phase` | `deployment` until `t` reaches 30, then `operations`. |
| `passClock`, `inPass`, `passIndex` | Position inside a 200 s pass or a 70 s gap. |
| `maxElevation` | Peak elevation of the current pass, drawn between 18° and 82°. |
| `passesCompleted` | Incremented at loss of signal. |

Elevation during a pass is `maxElevation * sin(π · passFraction)`. SNR is derived from that angle plus fading noise between −1.8 dB and +1.8 dB. Below the horizon, SNR is reported as “no link” (`null` on the public frame).

Deployment steps fire when `t` equals the step time: burn-wire at 4 s, separation at 7 s, beacon at 10 s, boot at 13 s, antennas at 17 s, detumble at 21 s, router online at 25 s. At 30 s the service logs commissioning complete and parks the pass clock 8 seconds before the first acquisition of signal.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | | `{ status, service: "orbit", t }` |
| GET | `/state` | | Phase, deployment checklist, link snapshot |
| POST | `/tick` | | Same, plus `operational` and log lines for this second |
| POST | `/reset` | | Clock back to stowed-in-the-pod |

`operational: false` tells the gateway to skip queue, power, and router for that second.

## Power — port 5212

`services/power/server.js`

Owns the electrical power system.

| State | Meaning |
| --- | --- |
| `soc` | Battery percent. Starts at 78%. Clamped to 5–100. |
| `eclipse` | True when the orbit sinusoid is in the eclipse fraction (0.36). |
| `safeMode` | Housekeeping-only flag. |
| `safeModeCommanded` | Set when the operator latches safe mode. Blocks automatic recovery. |

`POST /apply` with `{ txPower, t }` runs after a decision:

```
load  = 0.22 W housekeeping + transmitter watts
input = 0 W in eclipse, else 1.15 W solar
soc   += 12 × (input − load) / 3600 / 3.2 Wh × 100
```

The factor of 12 compresses battery time so a pass can move the gauge visibly. Enter safe mode below 25% SoC. Clear it above 38% only when `safeModeCommanded` is false.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health`, `/state` | | `soc`, `eclipse`, `safeMode`, `safeModeCommanded` |
| POST | `/apply` | `{ txPower, t }` | State plus `enteredSafe` / `clearedSafe` |
| POST | `/command` | `{ action: "safe-mode" \| "resume-autonomy" }` | Updated latch |
| POST | `/reset` | | 78%, sunlight, not safe |

The gateway reads `/state` **before** the decision and calls `/apply` **after** transmit. A safe-mode entry therefore affects the next second, matching the monolith.

## Queue — port 5213

`services/queue/server.js`

Owns the onboard store. Frames are `{ id, type, sizeKb, remainingKb, createdAt }`.

Generation on `POST /generate` with `{ t }`, only during operations:

| Condition | Frame |
| --- | --- |
| `t` divisible by 10 | TT&C, about 0.3–0.6 kB |
| `t` divisible by 75 | SSTV, about 50–80 kB |
| 2% chance | M17, about 6–14 kB |
| 2% chance | Codec2, about 3–7 kB |

Capacity is 40 frames. On overflow the oldest frame that is not TT&C is dropped and a warning is returned for the gateway log. Housekeeping is never deleted to make room.

`POST /transmit` subtracts `deliveredKb` from one frame. One second of downlink is `rateKbps / 8` kilobytes (the mode’s kilobit rate for one second, in kilobytes). At `remainingKb <= 0` the frame leaves the store. Completing SSTV returns a log line the gateway turns into an image tile.

`POST /enqueue` is the capture-SSTV uplink: one image between 90 and 140 kB, sized by the gateway.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Reports queue depth |
| GET | `/state` | Full queue |
| POST | `/generate` | May append frames |
| POST | `/enqueue` | `{ type, sizeKb, t }` |
| POST | `/transmit` | `{ id, deliveredKb }` → `completed`, updated item, events |
| POST | `/reset` | Empty store, ids restart at 1 |

## Router — port 5214

`services/router/server.js` and `services/router/policy.js`

The pure decision function is `decide()` in `policy.js`. The HTTP service adds the TT&C staleness counter, which has to survive from one second to the next.

| State | Meaning |
| --- | --- |
| `linkSinceTtc` | How many seconds SNR has been above the 1 dB TT&C floor since the last completed housekeeping frame. |
| `watchdogActive` | True after the watchdog has already been counted for this silence. Cleared when a TT&C frame completes. |

`POST /decide` increments `linkSinceTtc` when SNR is above 1 dB, then runs the guard rails. The body is `{ t, snr, soc, safeMode, safeModeCommanded, override, queue }`. The response is the winning item (or null), the score breakdown, a human-readable `reason`, a `governor` (`link`, `operator`, `safe-mode`, `watchdog`, `policy`), up to five `candidates`, and `watchdogTripped` on the rising edge only.

`POST /ack` with `{ type: "ttc" }` zeros the staleness counter. `GET /policy` returns weights and the mode table for `GET /api/policy`.

Guard-rail order and the score formula are written out in [control-loop.md](control-loop.md).

## Gateway — port 8080

`services/gateway/server.js`

Does not own spacecraft physics. It owns the ground picture and the operator override `{ mode, until }`.

On startup it waits until orbit, power, queue, and router all return `status: "ok"`, resets them together, then starts a 1 s interval. Each tick follows the sequence in [control-loop.md](control-loop.md). Failures are logged and that second is skipped; the process stays up.

Logs kept for the UI:

| Buffer | Kept | Shown |
| --- | --- | --- |
| Events | 120 | 12 |
| Decisions | 60 | 12 |
| History (SNR, SoC, mode, queue depth) | 240 | 120 |
| SSTV images | 8 | 8 |

### Public API

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `/api/health` | `{ status: "ok" \| "degraded", uptimeTicks, clients, services }` |
| GET | `/api/state` | Aggregated snapshot |
| GET | `/api/stream` | SSE. First event is the current snapshot, then one per tick. |
| GET | `/api/policy` | Proxied from the router |
| POST | `/api/command` | Body `{ action, ... }`. 400 on an unknown action. 502 if a downstream call throws. |

### Command routing

| `action` | Gateway | Downstream |
| --- | --- | --- |
| `force-mode` | Sets override until `t + 25`. Requires a known mode. | None |
| `safe-mode` | Logs the uplink, marks the snapshot safe | `POST /command` on power |
| `resume-autonomy` | Clears the override | Power `resume-autonomy` |
| `capture-sstv` | Logs the uplink | `POST /enqueue` on the queue |
| `reset` | Clears logs, images, counters | `POST /reset` on all four services |

`force-mode` still needs a queued frame of that type before the router will transmit it. An override with an empty queue falls through to the later guard rails.

### Snapshot shape

The dashboard reads this object. Field names match the monolith so the same React panels work.

```json
{
  "t": 0,
  "phase": "deployment",
  "deploySequence": [{ "t": 0, "id": "pod-armed", "label": "", "detail": "", "done": true }],
  "link": {
    "inPass": false,
    "passIndex": 0,
    "elevation": -1,
    "snr": null,
    "maxElevation": 0,
    "passProgress": 0,
    "secondsToEvent": 70
  },
  "power": { "soc": 78, "eclipse": false, "safeMode": false },
  "mode": null,
  "override": null,
  "queue": [],
  "decision": null,
  "decisions": [],
  "events": [],
  "history": [],
  "images": [],
  "delivered": { "ttc": 0, "sstv": 0, "m17": 0, "codec2": 0 },
  "stats": { "framesDown": 0, "bitsDown": 0, "passesCompleted": 0, "watchdogTrips": 0 }
}
```

During operations, `decision` includes `governor`, `reason`, `snr`, `scored.total`, `scored.terms`, `scored.margin`, `scored.age`, and `candidates`. `mode` is the waveform actually on the air this second, or `null` when the router holds.
