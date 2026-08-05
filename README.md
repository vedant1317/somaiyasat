# SomaiyaSat & SomaiyaPod — mission site

Website for use case **KJS-SRS-01**: a PocketQube mission featuring autonomous AI-based
data routing and multi-mode amateur radio payloads (M17, Codec2, SSTV, TT&C).

Two parts:

- **Mission site** — the use case as a public project site: problem, objectives, solution
  approach, system architecture, payload modes, workflow phases, AI governance and the
  program/domain mapping across KJSIT and KJSSE.
- **Ground station** — a live simulation of deployment and orbital operations. The onboard
  AI scheduler runs server-side and streams its state, so the routing decisions on screen
  are actually computed, not scripted.

## Running it

Two terminals, from the repo root.

```bash
npm install --prefix backend && npm start --prefix backend
```

```bash
npm install --prefix frontend && npm run dev --prefix frontend
```

Then open <http://localhost:5180>. The frontend proxies `/api` to the backend on port 5175.

## Layout

```
backend/
  server.js            Express app: SSE stream, state snapshot, command uplink
  src/config.js        Mission constants — modes, policy weights, orbit timing
  src/simulation.js    Orbit, power, data queue and the AI router
frontend/
  src/data/mission.js  All site content, sourced from the use case document
  src/pages/           Home, Mission, Architecture, Program, Dashboard
  src/components/      Layout, diagrams, and the dashboard panels
  src/hooks/           useTelemetry — EventSource subscription + command sender
```

## The simulated router

Once per second the router scores every item in the onboard queue:

```
score = 0.40·priority + 0.25·urgency + 0.25·link_margin + 0.10·power_efficiency
```

Items whose mode is below its SNR demodulation floor are filtered out before scoring, so
the policy can never pick a waveform the link cannot carry. Four guard rails are evaluated
*before* the learned policy, matching the governance requirements in the use case:

| Guard rail | Behaviour |
| --- | --- |
| Link floor | No usable link → hold, nothing transmitted |
| Operator override | An uplinked command wins for 25 s, then autonomy resumes |
| Safe mode | Below 25% SoC, only TT&C; clears above 38% |
| Watchdog | No housekeeping in 30 s of usable link → TT&C forced |

Every decision is logged with its rationale and score breakdown — the "explainable to the
ground team" requirement from the AI governance table.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Liveness, tick count, connected clients |
| `GET /api/state` | Current state snapshot |
| `GET /api/stream` | Server-sent events, one frame per simulated second |
| `GET /api/policy` | Policy weights and mode definitions |
| `POST /api/command` | `force-mode`, `safe-mode`, `resume-autonomy`, `capture-sstv`, `reset` |

## Notes

Orbit geometry, link budget and battery behaviour are compressed in time so a deployment
and several passes are watchable in a few minutes. This is a demonstration of the mission
concept — not a live spacecraft feed, and not a link-budget-accurate model.
