# Demo script

Use this while the microservice stack is running. Slide beats that match it are in [presentation.md](presentation.md).

## Before the room

From `microservices/`:

```bash
npm install
npm start
```

Second terminal:

```bash
npm install --prefix web
npm run dev --prefix web
```

Or, if Docker is what you want to show:

```bash
docker compose up --build
```

Open http://localhost:5181. Confirm the ground station says the stream is live. If you also have the monolith running, it stays on http://localhost:5180 and does not share this simulation.

Optional second window for the architecture slide:

```bash
curl -s http://localhost:8080/api/health | jq
curl -s http://localhost:8080/api/policy | jq '.policy.weights, (.modes | keys)'
```

`jq` is only for the terminal shot. The browser does not need it.

Reset from the dashboard, or:

```bash
curl -s -X POST http://localhost:8080/api/command \
  -H 'Content-Type: application/json' \
  -d '{"action":"reset"}'
```

Reset when you are ready to narrate deployment from T+0. If you reset mid-talk, say so. The clock jumps back on purpose.

## Path through the site

Spend most of the time on the ground station. The other pages are context.

1. **Home.** One sentence: PocketQube, deployer, four modes, decisions made onboard. The amber button opens the ground station.
2. **Mission.** Objectives only if someone asks what “success” means. Otherwise skip.
3. **Architecture.** The block diagram on this page is the spacecraft (pod, bus, router, ground), not the process map. Say that explicitly, then show the service diagram from the slides. The two diagrams should agree: sensors and frames into a queue, one router, one radio.
4. **Program.** Only if the audience cares about the KJSIT / KJSSE mapping. Software, RF, and mechanical each line up with a service: router, the mode table, power and structure.
5. **Ground station.** Stay here.

## Narrating deployment (first 30 seconds)

After a reset the phase reads deploy. The checklist ticks on its own:

| Mission time | Line you can read aloud |
| --- | --- |
| 4 s | Burn-wire, door open |
| 7 s | Separation switches, satellite clear of the rails |
| 10 s | Deployer beacon heard by SomaiyaSat |
| 13 s | Flight computer up, watchdog armed |
| 17 s | Antennas out |
| 21 s | Detumble |
| 25 s | AI router online |
| 30 s | Commissioning complete |

No SNR and no queue yet. That is the orbit service in the deployment phase. The other services are idle until the gateway sees `operational: true`.

## Narrating the first pass

About eight seconds after commissioning the log says AOS and a pass number. Then:

- **SNR under about 1 dB.** Mode idle, governor link. “The radio is up but nothing we fly can demodulate this.”
- **SNR just above 1 dB.** TT&C, governor policy, often “only feasible payload”.
- **A few dB higher.** Codec2 can close (floor 4 dB). It appears when it outscores housekeeping or when TT&C is caught up.
- **Above 6 dB.** M17 becomes legal. It still loses to higher priority traffic a lot of the time.
- **Above 9 dB, near max elevation.** SSTV can move. Large frames take many seconds; the queue row shows remaining size. A finished image shows up on the SSTV strip and in the log.

Point at three widgets together: the pass elevation, the SNR number, and the governor badge. The story is that geometry drives the link term, and the link term decides which modes are even allowed.

Battery should sit near the high 70s or 80s in sunlight and sag if you hit eclipse or transmit SSTV for a while. You do not need to wait for a natural safe-mode entry.

## Buttons, in this order

Do these after AOS, while a pass is in view. Below the horizon every force command still “takes” the uplink, but the radio stays idle until SNR clears 1 dB.

1. **Force SSTV** (or M17). The header should show an override. On the next transmitting second the badge should read operator, even if the score would have preferred TT&C. If the queue has no SSTV frame, click **Capture SSTV** first and say that the uplink cannot send what was never stored.
2. **Safe mode.** Badge becomes safe mode. Only TT&C, or idle if no housekeeping is waiting. Say that this latch lives in the power service and will not auto-clear at 38%.
3. **Resume autonomy.** Override disappears. Policy is allowed again.
4. **Capture SSTV** during a high-elevation pass if you want a second image. During a low pass, the new row sits unscored until the floor is met.
5. **Reset** only when you are done or when you want to replay deployment. It clears all four services and the gateway log together.

## If something looks wrong

| What you see | What it usually means |
| --- | --- |
| Stream stuck on connecting or error | Gateway is down, or the Vite proxy is not aimed at port 8080. `curl localhost:8080/api/health`. |
| Health `degraded` and one service `down` | That process exited. `npm start` should still be in the first terminal; restart it. |
| Mode idle for a long stretch | You are in the 70 s gap, or SNR is under the floor. Read “LOS” versus “AOS” in the log. |
| Forced mode does nothing on the air | No frame of that type, or no usable link. The event log should still say the uplink was accepted. |
| Two Codec2 rows with `+0.00` | Same score. The policy still picks one; the gap is honest. |
| Queue stuck near 40 | Storage cap. The log will mention an overwritten payload frame. TT&C is kept. |

## What not to claim

- This is not a link-budget-accurate model and not a live satellite.
- The “AI” on screen is the weighted policy plus guard rails, not a neural net. The slide that says a small model could replace `POST /decide` is a next step, not the current binary.
- Stopping the UI does not pause the clone. The gateway keeps ticking so the services stay in step.
- The monolith on port 5180 is a different simulation. Do not compare their clocks.
