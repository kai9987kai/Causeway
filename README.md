# Causeway

**Causeway is a local evidence-to-experiment workbench for shared systems.** It connects source notes to model assumptions, compares policy packages in a small agent-based world and exports reproducible run receipts.

The first workspace is a synthetic watershed commons. Twelve grower agents interact with a basin water store, a rule-based water authority and an abstract river-restoration mechanism. Four policy packages are compared across the same keyed weather and agent events. Three one-change sensitivity lenses show where the comparison depends on model assumptions.

> **Scope:** the starter world is an illustrative software model. It is not a calibrated digital twin, ecological forecast or real-world policy recommendation. No field observations or watershed data are bundled.

**Version:** 0.2.0. Causeway is a working local prototype. Its interface and exports support reproducible synthetic demonstrations; the model has not been calibrated or validated against a real watershed.

## Run on Windows

Install Python 3 (no packages required), then double-click **Launch Causeway.cmd**. The launcher starts a standard-library server bound to `127.0.0.1` and opens the app in a browser. Keep the console window open while using it.

Or start it from PowerShell:

```powershell
Set-Location "C:\path\to\Causeway"
python -B tools\serve.py
```

Causeway uses plain HTML, CSS and browser JavaScript modules. It makes no network calls for app data, fonts or model inference. External research links open only when you choose them. Study settings, sources and up to four run receipts are stored in this browser's local storage.

## First study

1. Edit the working question on the overview if needed.
2. Open **Experiments** and choose the number of matched seed pairs, a base seed and shared stress condition.
3. Review the three preset policies and adjust the five controls in **My policy package**.
4. Run the study. Compare the custom policy against current practice, view weekly trajectories and check all four model lenses.
5. Open **Model & assumptions** to inspect or change the rules and parameter values. Updated values apply to the next run; saved runs retain their original settings.
6. Add papers, datasets or field notes in **Evidence library** and map each note to the mechanism it could inform.
7. Export the raw per-seed CSV, individual JSON receipt or complete workspace JSON.

## What a run records

- model version and 52-week horizon;
- working question, stress case, seed count and base seed;
- all policy settings and model parameters;
- four model lenses (reference, slower uptake, weaker restoration, narrower allocation gap);
- 32-bit event-keyed randomization method and per-replicate seeds;
- per-seed outcomes for every policy and model lens;
- paired mean differences with descriptive Monte Carlo intervals.

Common event keys use `(seed, week, actor, channel)` to align rain, heat, market-pulse and agent-choice draws across scenario paths. See [the research basis](docs/research-basis.md) for the connection to a 2026 methods preprint and the implementation limits.

## Project map

- `index.html` and `styles.css` — responsive local interface.
- `src/model.js` — deterministic, event-keyed multi-agent simulator and paired analysis.
- `src/app.js` — experiment controls, evidence notes, local workspace, charts and exports.
- `tools/serve.py` — loopback-only Python server with restrictive response headers.
- `docs/design-lineage.md` — portfolio-to-product design map.
- `docs/research-basis.md` — primary research and method scope.
- `docs/model-boundaries.md` — model rules, intended use and limits.

## Local data and evidence

Workspace settings, user-added source notes and up to four run receipts are stored in the current browser's local storage. Use **Export workspace** to create a portable JSON copy. The application does not upload workspace content to a service. Research and portfolio references preloaded into the evidence library are design references only; they are not observations or validation data for the watershed model.

Each receipt records its model version, policies, parameters, stress condition, replicate seeds, event-key method and per-seed synthetic outcomes. These details make a run inspectable and repeatable within this implementation; they do not establish that the simulated rules describe a real basin.

## System-design paper

Read the [Causeway system-design paper](docs/paper.md) for the design rationale, model description, experiment protocol, research context and limitations. It describes a software prototype and does not present synthetic outcomes as field evidence.

## Research, priority and limits

Causeway combines well-established ingredients—local search, agent-based simulation, provenance, matched-seed experiments and sensitivity analysis. The design lineage and research sources are documented in [`docs/design-lineage.md`](docs/design-lineage.md) and [`docs/research-basis.md`](docs/research-basis.md). No claim is made that this combination has never been attempted elsewhere. The implementation is a new project here; its watershed behavior remains a synthetic demonstration until it is parameterized, reviewed and validated against suitable real data.
