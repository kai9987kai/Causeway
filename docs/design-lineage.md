# Design lineage from the supplied portfolio

Causeway is a new implementation in this workspace. It uses no code, model checkpoints, biological data, screenshots or other assets copied from the linked repositories. The connections below describe design lessons and research habits that informed its structure.

| Portfolio project | Design lesson carried into Causeway |
| --- | --- |
| [NexusSearch](https://github.com/kai9987kai/NexusSearch) | Keep source notes and run receipts searchable, local and explicit about the active query/model path. |
| [prometheus-alpha](https://github.com/kai9987kai/prometheus-alpha) | Label synthetic mechanisms as simulation variables and keep their scientific scope explicit. |
| [3d-animal-simulator-Hybrid-Agent / EvoSim](https://github.com/kai9987kai/3d-animal-simulator-Hybrid-Agent) | Seeded worlds, paired interventions, inspectable agent populations and reproducible experiments. |
| [Morpheus](https://github.com/kai9987kai/morpheus) | Expose internal assumptions and add an auditor's view of what the simulation does and does not establish. |
| [Supermix-Expanse-v2](https://github.com/kai9987kai/Supermix-Expanse-v2) | Combine specialist roles carefully and disclose when newly added capabilities remain weak or experimental. Causeway uses rule-based agents, not model weights. |
| [GhostInTheMachine](https://github.com/kai9987kai/GhostInTheMachine) | Keep hypotheses, evidence status and run results distinct; allow null or assumption-sensitive results to remain visible. |
| [Supermix-expanse](https://github.com/kai9987kai/Supermix-expanse) | Preserve distinct subsystem boundaries and diagnostics rather than hiding a mixture behind one score. No checkpoint or connectome is included. |
| [GenesisEngine](https://github.com/kai9987kai/GenesisEngine) | Separate deterministic simulation state from presentation and preserve enough run state for replay and audit. |
| [supermix-archimedes](https://github.com/kai9987kai/supermix-archimedes) | Inspect specialist outputs by role. Causeway separates grower, basin-authority and landscape mechanisms. |
| [Supermix](https://github.com/kai9987kai/Supermix) | Make the default workflow local-first and keep runtime, evaluation and capability claims separate. |
| [FLY-DIAMOND-NEXUS](https://github.com/kai9987kai/FLY-DIAMOND-NEXUS) | Put multiple agents in one shared world and make seed, state and decision traces inspectable. Its fly-brain structures are not used here. |
| [QuantumBot](https://github.com/kai9987kai/QuantumBot) | Prefer matched baselines and parameterized comparisons; do not claim a special capability without evidence. |
| [MOLT](https://github.com/kai9987kai/MOLT) | Save per-seed outcomes, experiment settings and portable raw exports. |

## What is new in this workspace

The main product idea is a joined workflow: a user can attach a source record to a specific model mechanism, set a question, run several policies over matched exogenous events, inspect results across one-at-a-time sensitivity lenses, and export per-seed receipts from the same local app. The pieces draw on established research and prior portfolio methods. This repository makes no “first ever” claim; the originality here is the particular combination and implementation, not a verified priority claim over the field.

