# Causeway research basis

Causeway is a new, self-contained local application. Its method choices were informed by the project portfolio and the references below. It does not reproduce any one paper's algorithm, establish a new scientific result, or use the trained model weights from the portfolio.

## Paired interventions and event-keyed randomness

Each policy and model-sensitivity arm starts from the same replicate seed. Exogenous draws are deterministic functions of `(seed, week, actor, channel)`, so an intervention that changes the world does not shift later weather or agent draws by consuming a shared sequential random stream. This gives a clear common-event pairing for the comparisons in this toy model.

The design is related to the simulation method discussed in the [2026 preprint “Realizing Common Random Numbers: Event-Keyed Hashing for Causally Valid Stochastic Models”](https://arxiv.org/abs/2603.11084). Causeway uses a compact string-keyed 32-bit hash for a small browser model; it has not implemented the paper's full framework or independently established its theoretical guarantees. The [EvoSim](https://github.com/kai9987kai/3d-animal-simulator-Hybrid-Agent), [MOLT](https://github.com/kai9987kai/MOLT), [GenesisEngine](https://github.com/kai9987kai/GenesisEngine) and [FLY-DIAMOND-NEXUS](https://github.com/kai9987kai/FLY-DIAMOND-NEXUS) work informed the emphasis on seeded worlds, matched interventions, exact receipts and local reproducibility.

## Sensitivity under model misspecification

Every policy is also run in three one-change sensitivity lenses: slower practice uptake, weaker restoration response and a narrower synthetic allocation-entitlement gap. They are not assigned probabilities. Their purpose is to reveal whether the direction or size of a comparison depends on a selected mechanism.

This cautious approach is informed by Tang, Sloman and Kaski's [2026 AISTATS paper on robust Bayesian active learning under model misspecification](https://proceedings.mlr.press/v300/tang26d.html). The paper develops R-IDeA; Causeway does **not** implement R-IDeA, Bayesian experimental design or an active-learning acquisition function. The sensitivity table is a transparent scenario screen, not a recommended experiment or a calibrated uncertainty estimate.

## Provenance

Causeway links a source note to the model mechanism it may inform and includes the model version, settings, event key method and per-seed outcomes in each run receipt. This follows the general traceability idea in the W3C [PROV-O recommendation](https://www.w3.org/TR/prov-o/), which represents entities, activities and agents. Causeway's JSON receipt is not PROV-O serialization and the app does not verify sources.

## Portfolio connections

See [design lineage](design-lineage.md) for how the thirteen supplied repositories shaped the product. References marked as project lineage describe engineering ideas, not evidence about watershed outcomes.
