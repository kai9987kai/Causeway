export const MODEL_VERSION = "0.2.0";
export const MODEL_WEEKS = 52;

export const DEFAULT_PARAMETERS = Object.freeze({
  rainfallCapture: 0.74,
  extractionPressure: 0.62,
  restorationEfficacy: 0.58,
  peerLearning: 0.46,
  practiceEfficiency: 0.34,
  habitatRegrowth: 0.24,
  grantEffect: 0.52,
  forecastEffect: 0.38,
  baselineEntitlementGap: 0.16,
});

export const PARAMETER_META = Object.freeze({
  rainfallCapture: { label: "Rainfall captured by basin", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  extractionPressure: { label: "Demand rise during water stress", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  restorationEfficacy: { label: "Buffer effect on habitat and water quality", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  peerLearning: { label: "Influence of neighbouring growers", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  practiceEfficiency: { label: "Water saved by adopted practices", low: 0.05, high: 0.75, step: 0.01, unit: "share" },
  habitatRegrowth: { label: "Natural habitat recovery", low: 0.05, high: 0.6, step: 0.01, unit: "strength" },
  grantEffect: { label: "Grant influence on practice uptake", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  forecastEffect: { label: "Forecast influence on preparation", low: 0.1, high: 1, step: 0.01, unit: "strength" },
  baselineEntitlementGap: { label: "Baseline allocation weight gap", low: 0, high: 0.35, step: 0.01, unit: "share" },
});

export const POLICY_CATALOG = Object.freeze([
  { id: "baseline", name: "Current practice", color: "#77847b", quotaReduction: 0, bufferShare: 0, grant: 0, forecast: 0, fairnessRule: 0.08 },
  { id: "buffers", name: "Riverbank recovery", color: "#32a88a", quotaReduction: 0.05, bufferShare: 0.34, grant: 0.28, forecast: 0.2, fairnessRule: 0.18 },
  { id: "fairshare", name: "Adaptive fair share", color: "#7286e8", quotaReduction: 0.2, bufferShare: 0.12, grant: 0.22, forecast: 0.78, fairnessRule: 0.82 },
  { id: "custom", name: "My policy package", color: "#dc9860", quotaReduction: 0.18, bufferShare: 0.22, grant: 0.42, forecast: 0.56, fairnessRule: 0.56 },
]);

export const STRESSES = Object.freeze({
  seasonal: { label: "Seasonal year", rainScale: 1, heat: 0.25, demandScale: 1 },
  drought: { label: "Prolonged drought", rainScale: 0.67, heat: 0.54, demandScale: 1.08 },
  compound: { label: "Drought + high demand", rainScale: 0.62, heat: 0.72, demandScale: 1.24 },
});

export const MODEL_VARIANTS = Object.freeze([
  { id: "reference", name: "Reference assumptions", note: "As entered", adoptionScale: 1, restorationScale: 1, demandScale: 1, entitlementScale: 1 },
  { id: "slow-uptake", name: "Slower practice uptake", note: "Adoption response × 0.55", adoptionScale: 0.55, restorationScale: 1, demandScale: 1, entitlementScale: 1 },
  { id: "weak-restoration", name: "Weaker restoration response", note: "Restoration response × 0.55", adoptionScale: 1, restorationScale: 0.55, demandScale: 1, entitlementScale: 1 },
  { id: "narrow-entitlement-gap", name: "Narrower allocation gap", note: "Entitlement gap × 0.35", adoptionScale: 1, restorationScale: 1, demandScale: 1, entitlementScale: 0.35 },
]);

const FARMERS = Object.freeze([
  { kind: "smallholder", scale: 0.72, threshold: 0.22, small: true },
  { kind: "smallholder", scale: 0.81, threshold: 0.28, small: true },
  { kind: "smallholder", scale: 0.88, threshold: 0.31, small: true },
  { kind: "smallholder", scale: 0.92, threshold: 0.25, small: true },
  { kind: "mixed", scale: 0.94, threshold: 0.33, small: false },
  { kind: "mixed", scale: 1.00, threshold: 0.41, small: false },
  { kind: "mixed", scale: 1.02, threshold: 0.36, small: false },
  { kind: "mixed", scale: 1.06, threshold: 0.45, small: false },
  { kind: "high-input", scale: 1.16, threshold: 0.52, small: false },
  { kind: "high-input", scale: 1.20, threshold: 0.49, small: false },
  { kind: "high-input", scale: 1.24, threshold: 0.56, small: false },
  { kind: "high-input", scale: 1.28, threshold: 0.53, small: false },
]);

const clamp = (x, low = 0, high = 1) => Math.min(high, Math.max(low, x));

// Event-keyed random values keep each weather, market and agent event aligned
// across policies, even when earlier choices make the simulated paths diverge.
function eventUniform(seed, week, actor, channel) {
  const key = `${seed}|${week}|${actor}|${channel}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function clampPolicy(policy) {
  return {
    quotaReduction: clamp(Number(policy.quotaReduction) || 0, 0, 0.45),
    bufferShare: clamp(Number(policy.bufferShare) || 0, 0, 0.6),
    grant: clamp(Number(policy.grant) || 0, 0, 1),
    forecast: clamp(Number(policy.forecast) || 0, 0, 1),
    fairnessRule: clamp(Number(policy.fairnessRule) || 0, 0, 1),
  };
}

export function simulateWorld({ seed, policy, parameters, stress = "seasonal", variant = "reference" }) {
  const p = { ...DEFAULT_PARAMETERS, ...parameters };
  const selectedStress = STRESSES[stress] || STRESSES.seasonal;
  const selectedVariant = MODEL_VARIANTS.find((item) => item.id === variant) || MODEL_VARIANTS[0];
  const intervention = clampPolicy(policy);
  const farms = FARMERS.map((farm, id) => ({ ...farm, id, adopted: eventUniform(seed, 0, id, "initial-practice") < (farm.small ? 0.08 : 0.13), cumulativeYield: 0 }));

  let reservoir = 58;
  let soilMoisture = 0.58;
  let habitat = 0.57;
  let waterQuality = 0.66;
  let trust = 0.46;
  let totalYield = 0;
  const trace = { livelihood: [], basinHealth: [], smallholderEquity: [], reservoir: [], habitat: [], adoption: [] };

  for (let week = 0; week < MODEL_WEEKS; week += 1) {
    const seasonalCycle = 0.5 + 0.5 * Math.sin((week / 26) * Math.PI * 2 - 0.9);
    const rainNoise = eventUniform(seed, week, "basin", "rainfall");
    const rainfall = clamp((0.44 + seasonalCycle * 0.26 + (rainNoise - 0.5) * 0.3) * selectedStress.rainScale, 0.025, 1.05);
    const heat = clamp(selectedStress.heat + eventUniform(seed, week, "basin", "heat") * 0.2 + seasonalCycle * 0.12, 0, 1);
    const rainCapture = p.rainfallCapture * 8.6;
    const inflow = rainfall * rainCapture * (0.78 + habitat * 0.28);
    const evaporation = 0.55 + heat * 1.55;
    const availableWater = Math.max(0, reservoir + inflow - evaporation);

    const adoptedShare = farms.reduce((sum, farm) => sum + (farm.adopted ? 1 : 0), 0) / farms.length;
    const stressSignal = clamp(0.64 - rainfall + heat * 0.16, 0, 1);
    for (const farm of farms) {
      if (farm.adopted) continue;
      const neighbourSignal = p.peerLearning * adoptedShare;
      const supportSignal = intervention.grant * p.grantEffect * (farm.small ? 1.12 : 0.88);
      const forecastSignal = intervention.forecast * p.forecastEffect * stressSignal * (0.45 + trust * 0.55);
      const adoptionProbability = clamp((neighbourSignal + supportSignal + forecastSignal - farm.threshold) * selectedVariant.adoptionScale * 0.52 + 0.018, 0, 0.28);
      if (eventUniform(seed, week, farm.id, "practice-choice") < adoptionProbability) farm.adopted = true;
    }

    const demandScale = selectedStress.demandScale * selectedVariant.demandScale;
    const wants = farms.map((farm) => {
      const dryPressure = Math.max(0, 0.58 - rainfall) * p.extractionPressure;
      const practiceSaving = farm.adopted ? p.practiceEfficiency * (0.72 + intervention.grant * 0.28) : 0;
      const forecastSaving = intervention.forecast * stressSignal * 0.07;
      const marketPulse = eventUniform(seed, week, farm.id, "market-pulse") * 0.08;
      return Math.max(0.12, farm.scale * demandScale * (0.39 + dryPressure + marketPulse) * (1 - practiceSaving) * (1 - forecastSaving));
    });
    const totalWant = wants.reduce((sum, value) => sum + value, 0);
    const quotaCap = totalWant * (1 - intervention.quotaReduction * 0.42);
    const withdrawalBudget = Math.min(availableWater, quotaCap);
    const entitlementGap = p.baselineEntitlementGap * selectedVariant.entitlementScale * (1 - intervention.fairnessRule);
    const weights = farms.map((farm, index) => wants[index] * (farm.small ? 1 - entitlementGap : 1 + entitlementGap));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
    const allocations = wants.map((want, index) => Math.min(want, withdrawalBudget * (weights[index] / totalWeight)));
    const actualWithdrawal = allocations.reduce((sum, value) => sum + value, 0);
    reservoir = clamp(availableWater - actualWithdrawal, 0, 100);

    const serviceRatios = allocations.map((value, index) => wants[index] > 0 ? clamp(value / wants[index]) : 1);
    const averageService = serviceRatios.reduce((sum, value) => sum + value, 0) / farms.length;
    const smallFarmService = serviceRatios.reduce((sum, value, index) => sum + (farms[index].small ? value : 0), 0) / 4;
    const meanFarmYield = farms.reduce((sum, farm, index) => {
      const waterSatisfaction = 0.42 + 0.58 * serviceRatios[index];
      const crop = clamp((0.54 + soilMoisture * 0.25 + rainfall * 0.18) * waterSatisfaction * (farm.adopted ? 1.035 : 1) * (1 - intervention.bufferShare * 0.06));
      farm.cumulativeYield += crop;
      return sum + crop;
    }, 0) / farms.length;
    totalYield += meanFarmYield;

    const restoration = intervention.bufferShare * p.restorationEfficacy * selectedVariant.restorationScale;
    const landscapePressure = 0.004 + stressSignal * 0.008;
    habitat = clamp(habitat + p.habitatRegrowth * (1 - habitat) * 0.014 + restoration * 0.024 - landscapePressure);
    const pollution = 0.004 + rainfall * totalWant * 0.00016 + stressSignal * 0.003;
    waterQuality = clamp(waterQuality + restoration * 0.018 * (1 - waterQuality) - pollution + p.habitatRegrowth * habitat * 0.001);
    soilMoisture = clamp(soilMoisture * (0.88 - heat * 0.035) + rainfall * 0.21 + averageService * 0.045 - 0.055);
    trust = clamp(trust + (intervention.fairnessRule * (smallFarmService - averageService * 0.74) + averageService * 0.22 - 0.09) * 0.045);

    const basinHealth = 100 * (habitat * 0.38 + waterQuality * 0.34 + (reservoir / 100) * 0.28);
    const smallYield = farms.filter((farm) => farm.small).reduce((sum, farm) => sum + farm.cumulativeYield, 0) / 4 / (week + 1);
    const otherGrowerYield = farms.filter((farm) => !farm.small).reduce((sum, farm) => sum + farm.cumulativeYield, 0) / 8 / (week + 1);
    const parity = otherGrowerYield > 0 ? smallYield / otherGrowerYield : 1;
    const equity = 100 * clamp(1 - Math.abs(1 - parity) * 1.6);
    trace.livelihood.push(meanFarmYield * 100);
    trace.basinHealth.push(basinHealth);
    trace.smallholderEquity.push(equity);
    trace.reservoir.push(reservoir);
    trace.habitat.push(habitat * 100);
    trace.adoption.push(adoptedShare * 100);
  }

  return {
    livelihood: (totalYield / MODEL_WEEKS) * 100,
    basinHealth: trace.basinHealth.at(-1),
    smallholderEquity: trace.smallholderEquity.at(-1),
    reservoir: trace.reservoir.at(-1),
    habitat: trace.habitat.at(-1),
    adoption: trace.adoption.at(-1),
    trace,
  };
}

export function createExperimentAccumulator(policyList, baseSeed, replicates) {
  return {
    baseSeed: Number(baseSeed) >>> 0,
    replicates,
    policies: policyList.map((item) => ({ ...item })),
    records: [],
    traceSums: Object.fromEntries(MODEL_VARIANTS.map((variant) => [variant.id, Object.fromEntries(policyList.map((policy) => [policy.id, Object.fromEntries(["livelihood", "basinHealth", "smallholderEquity"].map((metric) => [metric, Array(MODEL_WEEKS).fill(0)]))]))])),
  };
}

export function runExperimentReplicate(accumulator, replicate, parameters, stress) {
  const seed = (accumulator.baseSeed + Math.imul(replicate + 1, 0x9e3779b1)) >>> 0;
  for (const variant of MODEL_VARIANTS) {
    for (const policy of accumulator.policies) {
      const outcome = simulateWorld({ seed, policy, parameters, stress, variant: variant.id });
      accumulator.records.push({ replicate, seed, variant: variant.id, policy: policy.id, outcomes: { livelihood: outcome.livelihood, basinHealth: outcome.basinHealth, smallholderEquity: outcome.smallholderEquity, reservoir: outcome.reservoir, habitat: outcome.habitat, adoption: outcome.adoption } });
      for (const metric of ["livelihood", "basinHealth", "smallholderEquity"]) {
        const sums = accumulator.traceSums[variant.id][policy.id][metric];
        for (let week = 0; week < MODEL_WEEKS; week += 1) sums[week] += outcome.trace[metric][week];
      }
    }
  }
  return seed;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pairedSummary(values) {
  const avg = mean(values);
  const variance = values.length > 1 ? values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1) : 0;
  const halfWidth = values.length > 1 ? 1.96 * Math.sqrt(variance / values.length) : 0;
  return { mean: avg, low: avg - halfWidth, high: avg + halfWidth, n: values.length };
}

export function finishExperiment(accumulator, config) {
  const metrics = ["livelihood", "basinHealth", "smallholderEquity"];
  const grouped = {};
  for (const variant of MODEL_VARIANTS) {
    grouped[variant.id] = {};
    for (const policy of accumulator.policies) {
      const records = accumulator.records.filter((row) => row.variant === variant.id && row.policy === policy.id);
      grouped[variant.id][policy.id] = Object.fromEntries(metrics.map((metric) => [metric, mean(records.map((row) => row.outcomes[metric]))]));
    }
  }

  const comparisons = {};
  for (const policy of accumulator.policies.filter((item) => item.id !== "baseline")) {
    comparisons[policy.id] = {};
    for (const variant of MODEL_VARIANTS) {
      comparisons[policy.id][variant.id] = {};
      for (const metric of metrics) {
        const bySeed = new Map();
        for (const row of accumulator.records) {
          if (row.variant !== variant.id) continue;
          const pair = bySeed.get(row.seed) || {};
          pair[row.policy] = row.outcomes[metric];
          bySeed.set(row.seed, pair);
        }
        const deltas = [...bySeed.values()].filter((pair) => Number.isFinite(pair[policy.id]) && Number.isFinite(pair.baseline)).map((pair) => pair[policy.id] - pair.baseline);
        comparisons[policy.id][variant.id][metric] = pairedSummary(deltas);
      }
    }
  }

  const trajectories = {};
  for (const variant of MODEL_VARIANTS) {
    trajectories[variant.id] = {};
    for (const policy of accumulator.policies) {
      trajectories[variant.id][policy.id] = Object.fromEntries(metrics.map((metric) => [metric, accumulator.traceSums[variant.id][policy.id][metric].map((sum) => sum / accumulator.replicates)]));
    }
  }

  return {
    schema: "causeway-run-v1",
    modelVersion: MODEL_VERSION,
    createdAt: new Date().toISOString(),
    config,
    policies: accumulator.policies,
    modelVariants: MODEL_VARIANTS,
    referenceMeans: grouped,
    comparisons,
    trajectories,
    records: accumulator.records,
    randomization: { method: "event-keyed hash", baseSeed: accumulator.baseSeed, replicates: accumulator.replicates, pairing: "Every policy/model variant reuses the same seed and event keys within each replicate." },
    intervalMethod: "Paired mean difference ± 1.96 standard errors; descriptive Monte Carlo interval, not a real-world confidence claim.",
  };
}
