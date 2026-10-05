# Model boundaries and intended use

## What this is

Causeway 0.2.0 contains an illustrative, stochastic, rules-based agent simulation. It is a local workbench for comparing modelled policy paths and tracing which assumptions and sources belong to a study. Its starter world contains twelve synthetic grower agents, one abstract basin authority and one abstract river-restoration mechanism. A run advances fifty-two weekly steps.

## What it is not

The starter world is not a digital twin, hydrology model, ecological forecast, calibrated farm model, policy appraisal, environmental impact assessment or advice about a real river basin. It contains no real climate series, measured water levels, farm surveys, species data, legal rules, economic estimates or external evidence. Its equations, initial values, behaviour rules and scenario presets are invented for software demonstration.

The output labels “livelihood”, “basin health” and “small-grower equity” are indexes of this model's variables. They are not measurements of real livelihoods, ecosystems or fairness. A positive policy delta only means that one code path generated a higher index than another under the selected toy model and seeds.

## Current state variables and rules

- **Shared water:** weekly rainfall adds water to a bounded reservoir; evaporation and farm withdrawals reduce it.
- **Grower agents:** twelve synthetic agents have one of three demand/adoption profiles. Practice uptake responds to neighbour uptake, grants, forecast reach and agent-specific keyed choice draws.
- **Allocation:** requested water is capped by available water and the selected quota reduction. The fairness rule changes allocation weights for the four synthetic smallholders.
- **Starting allocation weights:** the reference world assumes a small per-unit allocation advantage for larger farms. This invented entitlement gap is editable; the policy equity rule moves the weights toward parity. The assumption exists so the equity mechanism can be inspected, not because it describes a real basin.
- **River response:** buffer coverage changes the toy habitat and water-quality update; habitat also has a small independent regrowth term.
- **Crop output:** weekly index depends on soil moisture, rainfall, allocation satisfaction, practice status and buffer coverage.
- **Small-grower equity:** compares average cumulative smallholder output with other growers' average output, and lowers its index as the two groups diverge. It is an invented parity score, not a validated fairness measure.
- **Sensitivity lenses:** “slower practice uptake”, “weaker restoration response” and “narrower allocation gap” alter one corresponding assumption. They are chosen stress cases; they are not fitted distributions or assigned likelihoods.

## Reproducibility and intervals

The 32-bit event hash is deterministic for the same seed, week, actor and channel. The same replicate seed is used for all policy arms and sensitivity lenses. Different treatment paths therefore share keyed rainfall, heat, market-pulse and choice events while state-dependent decisions can diverge.

Reported intervals are paired mean differences plus or minus 1.96 standard errors across simulated seed pairs. They describe Monte Carlo variation under this implementation. They do not account for model error, missing mechanisms, parameter estimation, measurement error, the representativeness of any real basin or uncertainty in the source material.

## Safe interpretation

Use Causeway to ask questions such as “Which toy-model assumption is driving this comparison?” and “Would this policy ordering survive a specified sensitivity case?” Do not use it to select a real water policy or infer a field effect. A real application would first require a defined decision context, local governance and legal rules, provenance-controlled observations, domain review, calibration, validation against held-out observations, alternative structural models and a documented uncertainty and stakeholder process.
