# SomaiyaSat microservices clone

Same mission site and ground station as the monolith in `frontend/` and `backend/`. The spacecraft control loop is split into services that own one part of the vehicle. The browser still talks to a single `/api` surface.

Presentation notes, the stack, each service contract, the control loop, and a live demo script are in [docs/](docs/README.md).

## Plan

The monolith kept orbit geometry, battery state, the onboard queue, the AI router, and the SSE ground link in one process. The clone separates those along the same boundaries the mission already describes: deployer/orbit, power, payload queue, and the router. A gateway is the only process the UI knows about. It runs the one-hertz loop, calls the services in order, and publishes one telemetry frame.

```
Browser  -- /api/stream, /api/command -->  gateway :8080
                                            |-- orbit   :5211   pass geometry, SNR, deployment
                                            |-- power   :5212   battery, eclipse, safe mode
                                            |-- queue   :5213   onboard storage and frame generation
                                            \-- router  :5214   scoring policy and guard rails
```

Each service owns its state. The gateway does not reach into another service's memory.

| Service | Owns | Called |
| --- | --- | --- |
| orbit | Mission clock, deployment sequence, AOS/LOS, elevation, SNR | `POST /tick` once per simulated second |
| queue | Frame storage, generation, partial transmission | `POST /generate`, `POST /transmit`, `POST /enqueue` |
| power | State of charge, eclipse, safe-mode latch | `GET /state` before the decision, `POST /apply` after transmit |
| router | Policy weights, link-floor / operator / safe-mode / watchdog order, TT&C staleness | `POST /decide`, `POST /ack` when a housekeeping frame completes |
| gateway | Operator override timer, decision log, event log, SSE clients | The public API below |

Tick order matches the monolith, because safe mode and the watchdog have to see last tick's power and link state:

1. Advance the orbit. Deployment ticks stop here.
2. Generate new queue traffic for this mission second.
3. Read power, then ask the router to decide.
4. Transmit the winning frame and ack the router if TT&C completed.
5. Apply transmitter load to the battery. Safe mode entered now affects the next tick.
6. Expire a ground override whose window has closed, then broadcast the frame.

HTTP is the contract between services. The loop has a single writer (the gateway) and a strict order, so a broker would not change the domain split. `docker-compose.yml` runs one container per service. `npm start` runs the same processes on the host.

The public API is unchanged, so the cloned dashboard does not need a new client:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Gateway liveness plus each downstream service |
| `GET /api/state` | Current aggregated snapshot |
| `GET /api/stream` | Server-sent events, one frame per simulated second |
| `GET /api/policy` | Weights and mode table, served by the router |
| `POST /api/command` | `force-mode`, `safe-mode`, `resume-autonomy`, `capture-sstv`, `reset` |

`force-mode` lives on the gateway for 25 mission seconds. `safe-mode` and `resume-autonomy` are sent to the power service. `capture-sstv` is sent to the queue. `reset` clears every service and the gateway log together.

## Run it locally

From `microservices/`:

```bash
npm install
npm start
```

In a second terminal:

```bash
npm install --prefix web
npm run dev --prefix web
```

Open <http://localhost:5181>. The dev server proxies `/api` to the gateway on port 8080. Leave the original monolith on 5175 / 5180 if you want both running.

`npm test` checks the router guard rails and boots the five processes for one command round-trip.

## Docker Compose

From `microservices/`:

```bash
docker compose up --build
```

The site is on <http://localhost:5181> and the gateway is published on port 8080.
