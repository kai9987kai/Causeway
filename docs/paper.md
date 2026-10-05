# Causeway: An Evidence-Linked Workbench for Reproducible Policy Experiments

**System-design paper · Causeway 0.2.0 · 5 October 2026**

## Abstract

Policy questions about shared resources combine uncertain evidence, interacting decisions and assumptions about how interventions change system behavior. Those parts are often explored in separate tools, making it difficult to trace a result back to the sources and model choices that produced it. Causeway is a local-first software prototype that joins source records, explicit model mechanisms, paired policy experiments, assumption sensitivity and portable run receipts in one workflow. Its demonstration domain is a synthetic watershed commons with twelve growers, a shared water store, allocation rules and a simple restoration mechanism. Four policy packages are run over the same keyed exogenous events, and comparisons are repeated under three one-at-a-time model variants. The software is informed by work on event-indexed random inputs, robust learning under model misspecification, provenance and agent-based model description. It does not implement those research methods in full. This paper describes the software and its experiment protocol; it reports no empirical watershed finding. All model values and outcomes are illustrative until the model is parameterized, independently reviewed and validated against suitable observations.

**Keywords:** agent-based model; reproducible simulation; policy comparison; provenance; common random numbers; sensitivity analysis; local-first software

## 1. Introduction

Models of shared systems connect evidence to assumptions, translate assumptions into rules, and turn those rules into outcomes under a selected scenario. When source records, model parameters, intervention controls and run outputs are managed separately, it becomes harder to answer a basic question: which evidence and assumptions led to this result?

Causeway explores a software response to that traceability problem. It provides a single local workflow in which a user can formulate a question, inspect a small agent-based model, attach a source note to a mechanism, compare policy packages using matched random events, vary selected assumptions, and export the resulting per-seed records. Its design goal is auditability and exploratory comparison, not automated policy selection.

The contribution is a working integration of five familiar ideas: local source search, inspectable rule-based agents, event-keyed paired runs, explicit one-change sensitivity cases, and portable receipts. The combination is useful as a research workbench, but this paper makes no claim that it is unprecedented. It also makes no claim that a source note validates the mechanism to which it is attached.

The watershed scenario is intentionally synthetic. It contains no measured rainfall, water levels, farm data, ecological observations, legal rules or calibrated economic values. Accordingly, this is a system-design paper, not an empirical study of a real watershed.

## 2. Research and design context

### 2.1 Reproducible agent-based model descriptions

The ODD protocol organizes model descriptions around overview, design concepts and implementation details, including entities, state variables, process scheduling, initialization, inputs and submodels [1]. Causeway's documentation adopts this emphasis on explicit purpose, entities, process order and model boundaries. The project is not a formally reviewed or complete ODD submission; the source code remains the definitive description of the current implementation.

### 2.2 Event-keyed paired randomness

The experiment engine assigns each replicate a deterministic 32-bit seed. Each exogenous draw is computed from a key containing the seed, week, actor and channel. Therefore, the same modeled event receives the same uniform value across policy arms and sensitivity variants even if the arms' internal states diverge. This is intended to avoid shifting later draws merely because an intervention changed the order in which a stateful random-number stream is consumed.

This design is related to research arguing that paired agent-based counterfactuals should align random inputs by modeled event rather than by sequential draw position [2]. Causeway uses a compact JavaScript string-keyed hash. It does not implement the paper's proposed counter-based random number generators, reproduce its full framework, prove causal validity or eliminate hash collisions. It is an engineering choice for a small browser demonstration.

### 2.3 Model misspecification and provenance

Tang, Sloman and Kaski study robust Bayesian active learning under model misspecification and propose an acquisition function that balances representativeness, informativeness and error de-amplification [3]. Causeway does not implement their R-IDeA method, Bayesian experimental design or active learning. The connection motivates showing selected alternative assumptions beside the reference run instead of presenting a single model path as definitive.

Causeway also links source notes to mechanisms and preserves run configuration with results. This follows the general traceability goals represented in W3C PROV-O, which describes entities, activities, agents and their relationships [4]. Causeway's JSON receipts are not PROV-O documents; the application neither verifies source quality nor certifies that a source supports a model equation.

### 2.4 Portfolio design lineage

The supplied project portfolio shaped the engineering choices below. These are design influences, not evidence for the watershed mechanisms or outcomes.

| Project | Design influence |
|---|---|
| [NexusSearch](https://github.com/kai9987kai/NexusSearch) | Local, explicit source discovery and inspectable query paths. |
| [prometheus-alpha](https://github.com/kai9987kai/prometheus-alpha) | Keep synthetic experiments separate from biological claims. |
| [3d-animal-simulator-Hybrid-Agent / EvoSim](https://github.com/kai9987kai/3d-animal-simulator-Hybrid-Agent) | Seeded worlds, paired interventions and limits on ecological interpretation. |
| [Morpheus](https://github.com/kai9987kai/morpheus) | Expose assumptions and provide an audit-oriented view. |
| [Supermix-Expanse-v2](https://github.com/kai9987kai/Supermix-Expanse-v2) | Disclose capability boundaries and distinguish rule-based agents from learned models. |
| [GhostInTheMachine](https://github.com/kai9987kai/GhostInTheMachine) | Separate hypotheses, evidence status and run results. |
| [Supermix-expanse](https://github.com/kai9987kai/Supermix-expanse) | Preserve subsystem boundaries and diagnostics. |
| [GenesisEngine](https://github.com/kai9987kai/GenesisEngine) | Separate deterministic simulation state from its presentation and preserve replay details. |
| [supermix-archimedes](https://github.com/kai9987kai/supermix-archimedes) | Make distinct actor and mechanism roles inspectable. |
| [Supermix](https://github.com/kai9987kai/Supermix) | Use a local-first workflow and keep evaluation claims bounded. |
| [FLY-DIAMOND-NEXUS](https://github.com/kai9987kai/FLY-DIAMOND-NEXUS) | Represent multiple agents in a shared world with visible state and decisions. |
| [QuantumBot](https://github.com/kai9987kai/QuantumBot) | Compare against matched baselines and avoid unsupported capability claims. |
| [MOLT](https://github.com/kai9987kai/MOLT) | Retain matched-seed records and portable raw exports. |

No source code, model checkpoints, biological data or other assets are copied from these projects. The full mapping is also maintained in [design-lineage.md](design-lineage.md).

## 3. System overview

Causeway implements the following sequence:

1. A user states a working question and selects a stress condition.
2. The user reviews a source library and links relevant records to named mechanisms.
3. The user sets the number of replicate seeds and configures a policy package.
4. The model runs each policy under the reference assumptions and three sensitivity variants.
5. The interface presents paired differences, descriptive Monte Carlo intervals, mean trajectories and a one-change sensitivity screen.
6. The user exports an individual receipt, per-seed CSV or complete local workspace.

Seeded portfolio and research entries in the source library provide navigation and design context only. They do not serve as evidence about a watershed. User-added records are stored locally and can include a title, URL, short note, source type and mechanism mapping.

The interface is implemented with HTML, CSS and browser JavaScript modules. A Python standard-library server binds to the loopback address for local use. Model execution is client-side. Workspace settings, source records and up to four run receipts are stored in browser local storage; exporting a workspace produces a JSON file. No remote inference service or remote data store is part of the application.

## 4. Model description

### 4.1 Purpose, entities and extent

The model is designed to make the software's comparison and provenance workflow concrete. It is not intended to reproduce a specified real basin. Its world contains a shared reservoir and twelve synthetic grower agents over a fifty-two-week year. Four agents are labeled smallholders, four mixed growers and four high-input growers. Each has an invented demand scale and practice-adoption threshold. Shared state includes reservoir volume, soil moisture, habitat, water quality and trust.

### 4.2 Initialization and exogenous inputs

The world starts from fixed synthetic state values: reservoir 58, soil moisture 0.58, habitat 0.57, water quality 0.66 and trust 0.46, on the model's internal bounded scales. Initial adoption is assigned from an event-keyed draw with separate thresholds for smallholders and other growers. Seasonal rainfall follows a deterministic cycle with keyed noise. Named scenario presets scale rainfall, heat and demand for a seasonal year, prolonged drought or combined drought and high demand.

There are nine editable model parameters, including rainfall capture, extraction pressure, restoration efficacy, peer learning, practice efficiency, habitat regrowth, grant effect, forecast effect and baseline allocation-weight gap. They are demonstration controls, not estimates from field data.

### 4.3 Process overview

At each weekly step, the model calculates rainfall and heat, updates water inflow and evaporation, evaluates practice adoption, computes farm water demand, allocates the available withdrawal budget, updates the reservoir, and calculates crop output. It then updates habitat, water quality, soil moisture and trust before recording the week's outcomes.

Adoption depends on peer uptake, grant support, forecast support, an agent-specific threshold and a keyed practice-choice draw. Farm water demand depends on its demand profile, stress, adopted water-saving practices, forecast support and a keyed market pulse. Allocation weights are modified by the fairness control and the synthetic entitlement gap. Restoration buffer share affects habitat and water-quality updates. These relationships are intentionally compact, deterministic conditional on keyed inputs and editable through the model interface.

### 4.4 Policy packages

The comparison includes four packages: current practice; riverbank recovery, with restoration and modest adoption support; adaptive fair share, with a tighter withdrawal cap, stronger forecast reach and a stronger equity rule; and a user-adjustable package with quota reduction, buffer share, grants, forecast reach and equity-rule controls.

The policy values are fixed defaults or user controls. They are not optimized recommendations. Current practice is the comparison arm. Positive differences indicate only that the corresponding index is higher in the intervention simulation under the selected model and random inputs.

### 4.5 Replication and event keys

For replicate index r, the implementation derives a 32-bit seed from the configured base seed plus a multiplicative constant applied to r + 1, with arithmetic reduced modulo 2³². A draw is generated by hashing the text key (seed, week, actor, channel) and mapping the unsigned 32-bit result to the interval [0, 1). Channels include rainfall, heat, initial practice, practice choice and market pulse.

Every policy and model variant for a replicate uses the same replicate seed and event keys. Policy decisions may change the simulated state and later decisions, but they do not change the uniform value assigned to a named exogenous event. This is common-event pairing inside this implementation; it is not proof that the model's causal structure matches any external system.

### 4.6 Sensitivity variants

Three one-at-a-time lenses modify the reference assumptions: practice adoption response is multiplied by 0.55; restoration response is multiplied by 0.55; or the synthetic baseline allocation gap is multiplied by 0.35. These are selected stress cases without probability weights. The screen reports how much each selected change shifts a policy contrast. It does not quantify uncertainty over all plausible models, estimate value of information or establish robustness to unmodeled mechanisms.

## 5. Outcomes and comparison statistics

The interface reports three model indexes:

- **Grower livelihood:** average weekly mean crop-output index across the twelve growers, scaled to 0–100.
- **Basin health:** final-week weighted combination of habitat, water quality and reservoir level.
- **Small-grower equity:** final-week parity index derived from the ratio of cumulative average smallholder yield to the other growers' average yield.

These names describe code variables. They are not measurements of livelihoods, ecosystem health or distributive justice.

For each replicate seed, policy and model variant, the engine records the three main outcomes plus reservoir, habitat and adoption values. For each non-baseline policy, it subtracts the current-practice outcome for the same seed and variant. It reports the mean of these paired differences and a descriptive interval computed as the mean ± 1.96 standard errors across replicate differences. Weekly trajectories are means across replicates.

The interval measures simulated seed-to-seed variation conditional on this implementation. It does not include parameter uncertainty, model error, measurement error, source uncertainty or variation across real basins. It must not be read as a confidence interval for a real-world policy effect.

## 6. Demonstration and verification status

A demonstration configuration uses 64 replicate seeds, four policies, four model variants and a fifty-two-week horizon. This corresponds to 1,024 synthetic worlds and 53,248 world-weeks of model execution. The run is useful for inspecting the interface and exercising receipt and comparison behavior. Its values are generated by the synthetic rules and are not empirical findings.

The current software version is 0.2.0. The local preview has been manually exercised. This paper does not claim independent peer review, a formal benchmark, validation against field data, calibration, or a complete automated test campaign. A reproducible code-level verification protocol should be added before the application is used as a research instrument.

## 7. Limitations, ethics and intended use

The simulation is deliberately small and structurally incomplete. It has twelve fixed grower profiles, one abstract water store, a simplified allocation rule and a few invented feedbacks. It does not represent spatial networks, groundwater, river-flow routing, crop varieties, seasonal labor, costs, prices, legal rights, governance negotiations, downstream users, biodiversity, climate ensembles or unequal access to information in a validated way.

The source library is a note-taking and traceability aid. It cannot determine whether a source is credible, relevant, correctly interpreted or sufficient to support an equation. A visible source-to-mechanism link is a user assertion, not an automated citation check.

The event hash is deterministic but is not a cryptographic primitive or a well-tested counter-based random-number generator. Its 32-bit output space admits collisions. It is adequate only as an inspectable mechanism for this small-scale demonstration until stronger PRNG design and statistical checks are performed.

Causeway is suitable for exploring questions such as “which assumption drives a change between these toy policy paths?” It is not suitable for selecting a real allocation rule, evaluating an environmental intervention, advising a community or forecasting watershed conditions. Use in a real decision would require an explicitly scoped decision context, stakeholder and domain review, lawful and provenance-controlled data, defensible parameterization, calibration, independent validation on held-out observations, structural alternatives, uncertainty analysis and an accountable governance process.

## 8. Future work

The next research and engineering steps are to document a complete ODD description tied line-by-line to the current model code; establish unit, replay, import/export and browser workflow checks; and version the receipt schema with a formal hash and parameter manifest. Research use would additionally require a specific watershed and decision context, data agreements, local stakeholder involvement, estimation and validation plans, and analysis of interactions among assumptions rather than only one-at-a-time changes. Provenance export could be mapped to PROV-O in a future version, with a clear distinction between user assertions and verified source metadata.

## 9. Conclusion

Causeway demonstrates a local software workflow that connects evidence notes, model mechanisms, paired policy runs, selected assumption changes and per-seed receipts. Its practical contribution is inspectability: the user can see which synthetic settings generated a comparison and preserve those settings alongside the outputs. Research on common random numbers, misspecification, model reporting and provenance informs the design, but Causeway implements only bounded software approximations of those ideas. The watershed remains illustrative. Its role is to make a research process inspectable and to expose questions that would have to be answered before any real-world model claim could be made.

## References

1. Grimm, V., Railsback, S. F., Vincenot, C. E., et al. (2020). “The ODD Protocol for Describing Agent-Based and Other Simulation Models: A Second Update to Improve Clarity, Replication, and Structural Realism.” *Journal of Artificial Societies and Social Simulation*, 23(2), 7. DOI: 10.18564/jasss.4259. [JASSS article](https://jasss.soc.surrey.ac.uk/23/2/7.html)
2. Buffalo, V., Pearson, C. A. B., & Klein, D. (2026). “Realizing Common Random Numbers: Event-Keyed Hashing for Causally Valid Stochastic Models.” arXiv:2603.11084. [arXiv preprint](https://arxiv.org/abs/2603.11084). DOI: 10.48550/arXiv.2603.11084.
3. Tang, R., Sloman, S. J., & Kaski, S. (2026). “Representative, Informative, and De-Amplifying: Requirements for Robust Bayesian Active Learning under Model Misspecification.” *Proceedings of the 29th International Conference on Artificial Intelligence and Statistics*, PMLR 300, 3016–3024. [Publisher page](https://proceedings.mlr.press/v300/tang26d.html)
4. Lebo, T., Sahoo, S., & McGuinness, D. (eds.). (2013). “PROV-O: The PROV Ontology.” W3C Recommendation. [https://www.w3.org/TR/prov-o/](https://www.w3.org/TR/prov-o/)

## Software and supplementary documentation

- [Causeway README](../README.md)
- [Model boundaries](model-boundaries.md)
- [Research basis](research-basis.md)
- [Portfolio design lineage](design-lineage.md)
