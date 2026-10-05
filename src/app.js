import {
  DEFAULT_PARAMETERS, MODEL_VERSION, MODEL_WEEKS, MODEL_VARIANTS, PARAMETER_META,
  POLICY_CATALOG, STRESSES, createExperimentAccumulator, finishExperiment,
  runExperimentReplicate,
} from "./model.js";

const STORAGE_KEY = "causeway-workspace-v1";
const MECHANISMS = {
  rainfallCapture: "Rainfall capture",
  extractionPressure: "Water demand under stress",
  restorationEfficacy: "Riverbank restoration response",
  peerLearning: "Neighbour influence on adoption",
  practiceEfficiency: "Water efficiency of adopted practices",
  habitatRegrowth: "Natural habitat recovery",
  grantEffect: "Grant response",
  forecastEffect: "Forecast response",
  baselineEntitlementGap: "Baseline allocation weight gap",
  "agent-design": "Role-based agent design",
  "experiment-method": "Paired experiment method",
  "randomization": "Event-keyed randomness",
  "reproducibility": "Reproducible model and receipts",
  "provenance": "Evidence and run provenance",
  "claim-discipline": "Claim and boundary discipline",
  "evaluation": "Baseline and evaluation discipline",
};

const PROJECT_SOURCES = [
  ["NexusSearch", "https://github.com/kai9987kai/NexusSearch", "Searchable local indexes, deterministic query results and explicit interface contracts informed the local run and source-library approach.", "provenance"],
  ["prometheus-alpha", "https://github.com/kai9987kai/prometheus-alpha", "Its synthetic experiment framing and separation of simulated memory from biological claims informed the model-boundary language.", "claim-discipline"],
  ["EvoSim · 3d-animal-simulator-Hybrid-Agent", "https://github.com/kai9987kai/3d-animal-simulator-Hybrid-Agent", "Seeded worlds, paired interventions and ecological toy-model limits informed the watershed experiment protocol.", "experiment-method"],
  ["Morpheus", "https://github.com/kai9987kai/morpheus", "Inspectable mechanisms and a visible auditor role informed Causeway's assumption inspector and claim boundaries.", "claim-discipline"],
  ["Supermix-Expanse-v2", "https://github.com/kai9987kai/Supermix-Expanse-v2", "Specialist composition plus explicit capability and benchmark limits informed the role-based design and reporting restraint.", "agent-design"],
  ["GhostInTheMachine", "https://github.com/kai9987kai/GhostInTheMachine", "Preregistered questions, claim statuses and null-aware result browsing informed the run and evidence ledger.", "claim-discipline"],
  ["Supermix-expanse", "https://github.com/kai9987kai/Supermix-expanse", "Multi-source specialist wiring and evaluation receipts informed the source-to-mechanism map; no model weights are used here.", "agent-design"],
  ["GenesisEngine", "https://github.com/kai9987kai/GenesisEngine", "A deterministic simulation core, complete snapshots and independent experiment worlds informed the reproducibility model.", "reproducibility"],
  ["supermix-archimedes", "https://github.com/kai9987kai/supermix-archimedes", "Role-specific subsystem diagnostics informed the separation of grower, authority and landscape mechanisms.", "agent-design"],
  ["Supermix", "https://github.com/kai9987kai/Supermix", "Local-first runtime, specialist experiments and evaluation tooling informed the no-cloud-by-default product boundary.", "evaluation"],
  ["FLY-DIAMOND-NEXUS", "https://github.com/kai9987kai/FLY-DIAMOND-NEXUS", "Multiple agents, shared worlds, inspectable beliefs and exact seeded snapshots informed the simulation workflow.", "agent-design"],
  ["QuantumBot", "https://github.com/kai9987kai/QuantumBot", "Matched baselines and explicit no-quantum-advantage claims informed fair comparisons and careful scope statements.", "evaluation"],
  ["MOLT", "https://github.com/kai9987kai/MOLT", "Matched-seed cohorts, intervention ledgers and raw exports informed the experiment receipts.", "experiment-method"],
];

const RESEARCH_SOURCES = [
  ["Realizing Common Random Numbers: Event-Keyed Hashing for Causally Valid Stochastic Models", "https://arxiv.org/abs/2603.11084", "A 2026 preprint on event-indexed random inputs in paired agent-based simulations. It motivates explicit event keys; Causeway's implementation is a compact deterministic hash, not a reproduction of the paper's full method.", "randomization"],
  ["Representative, Informative, and De-Amplifying: Requirements for Robust Bayesian Active Learning under Model Misspecification", "https://proceedings.mlr.press/v300/tang26d.html", "A 2026 AISTATS paper showing why informative experiment selection alone can be fragile under model misspecification. Causeway exposes sensitivity lenses; it does not implement R-IDeA or Bayesian active learning.", "experiment-method"],
  ["PROV-O: The PROV Ontology", "https://www.w3.org/TR/prov-o/", "W3C provenance vocabulary describing entities, activities and agents. Causeway borrows the traceability idea without claiming PROV-O serialization or conformance.", "provenance"],
];

const seedSources = [...PROJECT_SOURCES, ...RESEARCH_SOURCES].map(([title, url, note, mechanism], index) => ({
  id: `seed-${index + 1}`,
  title,
  url,
  note,
  mechanism,
  kind: index < PROJECT_SOURCES.length ? "Project lineage" : "Method reference",
  createdAt: "2026-10-05T00:00:00.000Z",
  seeded: true,
}));

const defaultState = () => ({
  schema: "causeway-workspace-v1",
  question: "How might a watershed partnership protect river health and small growers through a dry year?",
  modelParameters: { ...DEFAULT_PARAMETERS },
  customPolicy: { ...POLICY_CATALOG.find((policy) => policy.id === "custom") },
  sources: seedSources.map((source) => ({ ...source })),
  runs: [],
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.schema === "causeway-workspace-v1" && saved.modelParameters && Array.isArray(saved.sources) && Array.isArray(saved.runs)) {
      return { ...defaultState(), ...saved, modelParameters: { ...DEFAULT_PARAMETERS, ...saved.modelParameters }, customPolicy: { ...defaultState().customPolicy, ...saved.customPolicy } };
    }
  } catch (error) {
    console.warn("Causeway workspace could not be loaded.", error);
  }
  return defaultState();
}

let state = loadState();
let currentView = "overview";
let activeRunId = state.runs[0]?.id || null;
let isRunning = false;
let cancelRequested = false;
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const round = (value, places = 1) => Number(value).toFixed(places);
const formatDelta = (value) => `${value > 0 ? "+" : ""}${round(value, 1)}`;
const formatBound = (value) => `${value > 0 ? "+" : ""}${round(value, 2)}`;
const getActiveRun = () => state.runs.find((run) => run.id === activeRunId) || state.runs[0] || null;
const POLICY_COLORS = Object.fromEntries(POLICY_CATALOG.map((policy) => [policy.id, policy.color]));

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function validateRunReceipt(run) {
  const result = run?.result;
  const config = run?.config;
  const policyIds = POLICY_CATALOG.map((policy) => policy.id);
  if (!run?.id || result?.schema !== "causeway-run-v1" || !config || !Array.isArray(result.records)) return false;
  if (!Number.isInteger(config.replicates) || config.replicates < 1 || config.replicates > 256) return false;
  if (!Number.isInteger(config.baseSeed) || typeof config.stressName !== "string" || !Object.hasOwn(STRESSES, config.stress)) return false;
  if (typeof result.modelVersion !== "string" || !Array.isArray(result.modelVariants) || !Array.isArray(result.policies)) return false;
  const variantIds = result.modelVariants.map((variant) => variant.id);
  const expectedVariants = result.modelVersion === "0.1.0"
    ? ["reference", "slow-uptake", "weak-restoration", "high-demand"]
    : MODEL_VARIANTS.map((variant) => variant.id);
  if (result.modelVersion !== "0.1.0" && result.modelVersion !== MODEL_VERSION) return false;
  if (JSON.stringify(variantIds) !== JSON.stringify(expectedVariants)) return false;
  if (!result.modelVariants.every((variant) => typeof variant.name === "string") || !result.policies.every((policy) => typeof policy.name === "string")) return false;
  if (!result.policies.every((policy) => ["quotaReduction", "bufferShare", "grant", "forecast", "fairnessRule"].every((key) => Number.isFinite(policy[key])))) return false;
  if (!variantIds.every((id) => result.modelVariants?.some((variant) => variant.id === id))) return false;
  if (!policyIds.every((id) => result.policies?.some((policy) => policy.id === id))) return false;
  if (result.records.length !== config.replicates * policyIds.length * variantIds.length) return false;
  const seen = new Set();
  for (const row of result.records) {
    if (!variantIds.includes(row.variant) || !policyIds.includes(row.policy) || !Number.isInteger(row.replicate) || row.replicate < 0 || row.replicate >= config.replicates || !Number.isInteger(row.seed)) return false;
    const outcomes = row.outcomes;
    if (!outcomes || !["livelihood", "basinHealth", "smallholderEquity", "reservoir", "habitat", "adoption"].every((key) => Number.isFinite(outcomes[key]))) return false;
    const key = `${row.replicate}|${row.variant}|${row.policy}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  for (const variant of variantIds) {
    if (!result.trajectories?.[variant]) return false;
    for (const policy of policyIds) {
      const series = result.trajectories[variant][policy];
      if (!series || !["livelihood", "basinHealth", "smallholderEquity"].every((metric) => Array.isArray(series[metric]) && series[metric].length === MODEL_WEEKS && series[metric].every(Number.isFinite))) return false;
    }
  }
  for (const policy of policyIds.filter((id) => id !== "baseline")) {
    for (const variant of variantIds) {
      for (const metric of ["livelihood", "basinHealth", "smallholderEquity"]) {
        const comparison = result.comparisons?.[policy]?.[variant]?.[metric];
        if (!comparison || ![comparison.mean, comparison.low, comparison.high].every(Number.isFinite)) return false;
      }
    }
  }
  return Boolean(result.referenceMeans?.reference?.baseline && result.referenceMeans?.reference?.custom && result.referenceMeans.reference.baseline.livelihood !== undefined);
}

function sanitizeSource(source) {
  if (!source || typeof source.title !== "string" || !source.title.trim()) throw new Error("A source record has no title.");
  const mechanism = Object.hasOwn(MECHANISMS, source.mechanism) ? source.mechanism : "provenance";
  return {
    id: String(source.id || `src-${Date.now().toString(36)}`).slice(0, 100),
    title: source.title.trim().slice(0, 140),
    url: safeHttpUrl(String(source.url || "")),
    note: String(source.note || "").slice(0, 600),
    mechanism,
    kind: String(source.kind || "Research / field note").slice(0, 48),
    createdAt: String(source.createdAt || new Date().toISOString()).slice(0, 40),
    seeded: Boolean(source.seeded),
  };
}

function normalizeParameters(input) {
  return Object.fromEntries(Object.entries(PARAMETER_META).map(([key, meta]) => {
    const value = Number(input?.[key]);
    return [key, Number.isFinite(value) ? Math.min(meta.high, Math.max(meta.low, value)) : DEFAULT_PARAMETERS[key]];
  }));
}

function normalizeCustomPolicy(input) {
  const defaults = POLICY_CATALOG.find((policy) => policy.id === "custom");
  const result = { ...defaults, ...(input || {}) };
  result.quotaReduction = Math.min(0.45, Math.max(0, Number(result.quotaReduction) || 0));
  result.bufferShare = Math.min(0.6, Math.max(0, Number(result.bufferShare) || 0));
  result.grant = Math.min(1, Math.max(0, Number(result.grant) || 0));
  result.forecast = Math.min(1, Math.max(0, Number(result.forecast) || 0));
  result.fairnessRule = Math.min(1, Math.max(0, Number(result.fairnessRule) || 0));
  return result;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    toast("Browser storage is full. Export a workspace, then remove older run receipts.", true);
    console.warn("Causeway workspace could not be saved.", error);
  }
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.toggle("error", error);
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 3200);
}

function navigate(view) {
  const target = $("#view-" + view);
  if (!target) return;
  currentView = view;
  $$(".view").forEach((section) => section.classList.toggle("active", section === target));
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  const label = ({ overview: "Overview", explore: "Experiments", model: "Model & assumptions", evidence: "Evidence library", ledger: "Run ledger" })[view];
  $("#pageCrumb").textContent = label;
  history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "explore") renderResults();
  if (view === "ledger") renderLedger();
}

function renderPolicyCards() {
  const descriptions = {
    baseline: "No additional quota, buffer, grant or forecast package.",
    buffers: "Restores riverbank cover and offers modest adoption support.",
    fairshare: "Tightens withdrawals, shares scarcity and widens forecast reach.",
    custom: "Your editable combination of water, habitat and information levers.",
  };
  $("#policyList").innerHTML = POLICY_CATALOG.map((policy) => `
    <div class="policy-card" style="border-top:2px solid ${policy.color}">
      <div class="policy-card-head"><i class="policy-color" style="background:${policy.color}"></i>${escapeHTML(policy.name)}</div>
      <p>${escapeHTML(descriptions[policy.id])}</p>
      <span class="policy-chip">${policy.id === "baseline" ? "REFERENCE ARM" : policy.id === "custom" ? "EDITABLE ARM" : "PRESET ARM"}</span>
    </div>`).join("");
}

function renderPolicyControls() {
  const controls = [
    ["quotaReduction", "Quota cap", 0, 45, "%", 1],
    ["bufferShare", "Restored buffer", 0, 60, "%", 1],
    ["grant", "Practice grants", 0, 100, "%", 1],
    ["forecast", "Forecast reach", 0, 100, "%", 1],
    ["fairnessRule", "Equity rule", 0, 100, "%", 1],
  ];
  $("#policyControls").innerHTML = controls.map(([key, label, min, max, unit, scale]) => {
    const raw = Number(state.customPolicy[key] || 0);
    const value = Math.round(raw * 100 * scale);
    return `<div class="range-control"><label for="policy-${key}">${label}<output id="output-${key}">${value}${unit}</output></label><input id="policy-${key}" data-policy="${key}" type="range" min="${min}" max="${max}" value="${value}" step="1"><small>Policy lever</small></div>`;
  }).join("");
}

function renderOverview() {
  $("#workingQuestion").value = state.question;
  const latest = getActiveRun();
  if (!latest) {
    $("#labStatus").textContent = "Ready for a first run";
    $("#overviewMetrics").innerHTML = ["Grower livelihood", "Basin health", "Small-grower equity"].map((label) => `<article class="metric-card"><div class="metric-label"><span class="metric-icon">·</span><span>${label}</span><span class="metric-scope">SIMULATED INDEX</span></div><strong class="metric-value">—</strong><div class="metric-foot"><span>No run yet</span><span class="metric-context">Illustrative model output</span></div></article>`).join("");
  } else {
    const fields = [
      ["Grower livelihood", "livelihood", "Relative crop success", "green"],
      ["Basin health", "basinHealth", "Water · habitat · storage", "blue"],
      ["Small-grower equity", "smallholderEquity", "Per-grower outcomes", "amber"],
    ];
    const baseline = latest.result.referenceMeans.reference.baseline;
    const custom = latest.result.referenceMeans.reference.custom;
    $("#labStatus").textContent = `Last run · ${latest.config.replicates} paired seeds`;
    $("#overviewMetrics").innerHTML = fields.map(([label, key, context, color]) => {
      const delta = custom[key] - baseline[key];
      return `<article class="metric-card"><div class="metric-label"><span class="metric-icon ${color}">${key === "basinHealth" ? "⌁" : key === "smallholderEquity" ? "⇌" : "↗"}</span><span>${label}</span><span class="metric-scope">SIMULATED INDEX</span></div><strong class="metric-value">${round(custom[key])}</strong><div class="metric-foot"><span>Δ ${formatDelta(delta)} vs current practice</span><span class="metric-context">${context}</span></div></article>`;
    }).join("");
  }
  $("#runCount").textContent = state.runs.length;
  $("#sourceCount").textContent = state.sources.length;
  $("#ledgerCountLarge").textContent = state.runs.length;
  $("#modelVersion").textContent = `Model ${MODEL_VERSION} · ${MODEL_WEEKS} weeks`;
}

function renderParameterControls() {
  $("#parameterControls").innerHTML = Object.entries(PARAMETER_META).map(([key, meta]) => {
    const value = Number(state.modelParameters[key]);
    const selected = selectedParameter === key;
    return `<div class="parameter-row" data-parameter-row="${key}">
      <div class="parameter-head"><label for="parameter-${key}">${escapeHTML(meta.label)}</label><output class="parameter-value" id="parameter-value-${key}">${round(value * 100, 0)} / 100</output></div>
      <p>${parameterDescription(key)}</p>
      <input id="parameter-${key}" type="range" data-parameter="${key}" min="${meta.low}" max="${meta.high}" step="${meta.step}" value="${value}" aria-label="${escapeHTML(meta.label)}">
      <div class="parameter-range"><span>LOW ${Math.round(meta.low * 100)}</span><span>HIGH ${Math.round(meta.high * 100)}</span></div>
    </div>`;
  }).join("");
  $("#causalMap").innerHTML = causalMapMarkup();
  $$(".causal-node", $("#causalMap")).forEach((node) => node.classList.toggle("selected", node.dataset.parameter === selectedParameter));
}

function parameterDescription(key) {
  return ({
    rainfallCapture: "Share of rainfall that enters the available basin water pool.",
    extractionPressure: "How much desired withdrawals rise as rainfall drops.",
    restorationEfficacy: "How strongly restored buffer share affects habitat and water quality.",
    peerLearning: "How much adopted practices influence undecided neighbours.",
    practiceEfficiency: "Demand reduction for a grower after adopting a practice.",
    habitatRegrowth: "Natural weekly return toward habitat and water-quality capacity.",
    grantEffect: "How strongly grants shift each grower's adoption probability.",
    forecastEffect: "How strongly forecasts affect preparedness and water demand.",
    baselineEntitlementGap: "A synthetic starting allocation advantage for larger farms; the policy equity rule narrows this gap.",
  })[key] || "Model parameter.";
}

let selectedParameter = "rainfallCapture";
function causalMapMarkup() {
  return `<svg viewBox="0 0 700 280" role="img" aria-label="Illustrative causal model of weather, shared water, grower agents and outcomes">
    <defs><marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#aac5ac"/></marker><marker id="arrowGold" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#cbb58c"/></marker></defs>
    <path class="causal-edge external" d="M130 56 C160 56 164 57 196 57"/><path class="causal-edge" d="M282 73 C320 83 333 103 373 131"/><path class="causal-edge" d="M129 145 C177 145 190 151 231 151"/><path class="causal-edge" d="M294 150 C326 150 339 147 373 145"/><path class="causal-edge" d="M282 58 C350 37 387 40 452 53"/><path class="causal-edge" d="M129 235 C155 235 164 232 196 232"/><path class="causal-edge" d="M248 211 C255 190 268 180 279 171"/><path class="causal-edge" d="M297 164 C366 195 395 218 454 231"/><path class="causal-edge" d="M500 72 C501 90 501 102 501 119"/><path class="causal-edge" d="M544 143 C580 142 587 141 619 141"/><path class="causal-edge" d="M544 222 C580 204 591 180 620 159"/>
    <g class="causal-node" data-parameter="rainfallCapture"><rect x="27" y="36" width="103" height="41"/><text x="40" y="54">Weather</text><text class="node-sub" x="40" y="67">keyed external shock</text></g>
    <g class="causal-node" data-parameter="rainfallCapture"><rect x="195" y="36" width="104" height="41"/><text x="208" y="54">Shared water</text><text class="node-sub" x="208" y="67">rain · store · draw</text></g>
    <g class="causal-node" data-parameter="forecastEffect"><rect x="27" y="124" width="103" height="41"/><text x="40" y="142">Basin authority</text><text class="node-sub" x="40" y="155">quota · allocation</text></g>
    <g class="causal-node" data-parameter="peerLearning"><rect x="225" y="130" width="108" height="41"/><text x="238" y="148">Grower agents</text><text class="node-sub" x="238" y="161">demand · adoption</text></g>
    <g class="causal-node" data-parameter="restorationEfficacy"><rect x="450" y="34" width="103" height="41"/><text x="463" y="52">River habitat</text><text class="node-sub" x="463" y="65">buffer · recovery</text></g>
    <g class="causal-node" data-parameter="practiceEfficiency"><rect x="450" y="121" width="103" height="41"/><text x="463" y="139">Crop outcome</text><text class="node-sub" x="463" y="152">water · soil · yield</text></g>
    <g class="causal-node" data-parameter="extractionPressure"><rect x="27" y="214" width="103" height="41"/><text x="40" y="232">Policy package</text><text class="node-sub" x="40" y="245">five editable levers</text></g>
    <g class="causal-node" data-parameter="baselineEntitlementGap"><rect x="195" y="211" width="112" height="41"/><text x="207" y="229">Allocation weights</text><text class="node-sub" x="207" y="242">entitlement gap</text></g>
    <g class="causal-node" data-parameter="grantEffect"><rect x="450" y="211" width="103" height="41"/><text x="463" y="229">Small-farm equity</text><text class="node-sub" x="463" y="242">per-grower index</text></g>
    <g class="causal-node" data-parameter="habitatRegrowth"><rect x="611" y="121" width="70" height="41"/><text x="622" y="139">Basin</text><text class="node-sub" x="622" y="152">health</text></g>
  </svg>`;
}

function renderVariants() {
  $("#modelVariantList").innerHTML = MODEL_VARIANTS.map((variant, index) => `<div class="variant-row"><i class="variant-color" style="background:${["#4d9b70", "#d5a15e", "#7285d7", "#c87d62"][index]}"></i><div><strong>${escapeHTML(variant.name)}</strong><small>${escapeHTML(variant.note)}</small></div><code>${variant.id === "reference" ? "BASE" : "SENSITIVITY"}</code></div>`).join("");
}

function renderEvidenceMechanisms() {
  $("#sourceMechanism").innerHTML = Object.entries(MECHANISMS).map(([key, label]) => `<option value="${escapeHTML(key)}">${escapeHTML(label)}</option>`).join("");
}

function renderSources() {
  const query = $("#sourceSearch").value.trim().toLowerCase();
  const sources = state.sources.filter((source) => `${source.title} ${source.note} ${MECHANISMS[source.mechanism] || ""}`.toLowerCase().includes(query));
  $("#evidenceCount").textContent = `${state.sources.length} records`;
  $("#sourceCount").textContent = state.sources.length;
  if (!sources.length) {
    $("#sourceList").innerHTML = `<div class="no-sources">${state.sources.length ? "No records match that search." : "No sources added yet."}</div>`;
    return;
  }
  $("#sourceList").innerHTML = sources.map((source) => {
    const title = escapeHTML(source.title);
    const safeUrl = safeHttpUrl(source.url);
    const titleMarkup = safeUrl
      ? `<a class="source-card-title" href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`
      : `<span class="source-card-title no-link">${title}</span>`;
    return `<article class="source-card"><div class="source-card-head">${titleMarkup}<span class="source-type">${escapeHTML(source.kind || "Research note")}</span></div><p>${escapeHTML(source.note || "No relevance note recorded.")}</p><div class="source-meta"><span>${escapeHTML(MECHANISMS[source.mechanism] || "Unmapped")}</span><span>${source.seeded ? "PORTFOLIO / METHOD REFERENCE" : "USER ADDED"}${source.seeded ? "" : ` <button class="source-delete" data-delete-source="${escapeHTML(source.id)}" aria-label="Remove ${title}">×</button>`}</span></div></article>`;
  }).join("");
}

function makePolicyList() {
  return POLICY_CATALOG.map((policy) => policy.id === "custom" ? { ...policy, ...state.customPolicy, id: "custom", name: "My policy package", color: "#dc9860" } : { ...policy });
}

function currentConfig() {
  return {
    question: state.question,
    replicates: Number($("#replicates").value),
    baseSeed: Number($("#baseSeed").value) >>> 0,
    stress: $("#stress").value,
    stressName: STRESSES[$("#stress").value]?.label || "Seasonal year",
    parameters: { ...state.modelParameters },
    randomization: "event-keyed hash",
    modelWeeks: MODEL_WEEKS,
    createdAt: new Date().toISOString(),
  };
}

function updateRunHint() {
  const reps = Number($("#replicates").value);
  $("#runHint").textContent = `${reps} matched seeds · ${MODEL_VARIANTS.length} model lenses · ${MODEL_WEEKS} weeks`;
  $("#runExperiment").innerHTML = `Run 4 policy packages <span>→</span>`;
}

function addRunToLedger(result, config) {
  const id = `${config.baseSeed.toString(16)}-${Date.now().toString(36)}`;
  const record = { id, title: state.question.trim() || "Watershed policy comparison", config, result };
  state.runs.unshift(record);
  state.runs = state.runs.slice(0, 4);
  activeRunId = id;
  persist();
  renderOverview();
  renderLedger();
}

function delayFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

async function runStudy() {
  if (isRunning) return;
  isRunning = true;
  cancelRequested = false;
  const config = currentConfig();
  const policies = makePolicyList();
  const accumulator = createExperimentAccumulator(policies, config.baseSeed, config.replicates);
  $("#progressWrap").hidden = false;
    $("#runExperiment").disabled = true;
  $("#runExperiment").textContent = "Running paired worlds…";
  $("#progressBar").style.width = "0%";
  $("#progressLabel").textContent = `0 / ${config.replicates} seed pairs`;
  try {
    const chunkSize = 2;
    for (let start = 0; start < config.replicates; start += chunkSize) {
      if (cancelRequested) break;
      const end = Math.min(start + chunkSize, config.replicates);
      for (let replicate = start; replicate < end; replicate += 1) runExperimentReplicate(accumulator, replicate, config.parameters, config.stress);
      const percent = Math.round((end / config.replicates) * 100);
      $("#progressBar").style.width = `${percent}%`;
      $("#progressLabel").textContent = `${end} / ${config.replicates} seed pairs · ${percent}%`;
      await delayFrame();
    }
    if (cancelRequested) {
      toast("Study cancelled. No partial run was saved.");
      return;
    }
    const result = finishExperiment(accumulator, config);
    addRunToLedger(result, config);
    renderResults(result);
    renderOverview();
    toast(`Study complete: ${config.replicates} matched seed pairs saved to the ledger.`);
  } catch (error) {
    console.error(error);
    toast("The study could not finish. No partial run was saved.", true);
  } finally {
    isRunning = false;
    $("#runExperiment").disabled = false;
    $("#runExperiment").innerHTML = `Run 4 policy packages <span>→</span>`;
    setTimeout(() => { $("#progressWrap").hidden = true; }, 900);
    updateRunHint();
  }
}

function renderResults(result = getActiveRun()?.result) {
  if (!result) {
    $("#emptyResults").hidden = false;
    $("#resultContent").hidden = true;
    $("#downloadCSV").disabled = true;
    $("#downloadRun").disabled = true;
    $("#resultScope").textContent = "NO RUN YET";
    return;
  }
  $("#emptyResults").hidden = true;
  $("#resultContent").hidden = false;
  $("#downloadCSV").disabled = false;
  $("#downloadRun").disabled = false;
  $("#resultScope").textContent = `${result.config.replicates} PAIRED SEEDS · ${escapeHTML(result.config.stressName).toUpperCase()}`;
  const metricMeta = [
    ["Grower livelihood", "livelihood", "Relative crop success"],
    ["Basin health", "basinHealth", "Water · habitat · storage"],
    ["Small-grower equity", "smallholderEquity", "Per-grower outcomes"],
  ];
  const custom = result.comparisons.custom.reference;
  $("#outcomeCards").innerHTML = metricMeta.map(([label, key, hint]) => {
    const summary = custom[key];
    return `<div class="outcome-card"><div class="outcome-top"><span>${label}</span><i></i></div><strong class="outcome-delta ${summary.mean < 0 ? "negative" : ""}">${formatDelta(summary.mean)}</strong><div class="outcome-ci">95% paired interval ${formatBound(summary.low)} to ${formatBound(summary.high)}</div><div class="outcome-policy">My policy vs current practice · ${hint}</div></div>`;
  }).join("");

  const variantSelect = $("#trajectoryVariant");
  const previousVariant = variantSelect.value || "reference";
  variantSelect.innerHTML = result.modelVariants.map((variant) => `<option value="${variant.id}">${escapeHTML(variant.name)}</option>`).join("");
  variantSelect.value = result.modelVariants.some((variant) => variant.id === previousVariant) ? previousVariant : "reference";
  renderTrajectory(result);
  renderVariantTable(result);
  const sourceCount = state.sources.length;
  const savedPolicy = result.policies.find((policy) => policy.id === "custom");
  const savedPolicyText = `cap ${Math.round(savedPolicy.quotaReduction * 100)}% · buffer ${Math.round(savedPolicy.bufferShare * 100)}% · grants ${Math.round(savedPolicy.grant * 100)}% · forecast ${Math.round(savedPolicy.forecast * 100)}% · equity ${Math.round(savedPolicy.fairnessRule * 100)}%`;
  const entitlementGap = result.config.parameters?.baselineEntitlementGap;
  const entitlementText = Number.isFinite(entitlementGap) ? `${Math.round(entitlementGap * 100)} / 100` : "model v0.1 default";
  $("#receiptStrip").innerHTML = `<span>RUN <b>${escapeHTML(getActiveRun()?.id || "unsaved")}</b></span><span>MODEL <b>${escapeHTML(result.modelVersion)}</b></span><span>SAVED POLICY SETTINGS <b>${escapeHTML(savedPolicyText)}</b></span><span>ALLOCATION GAP <b>${escapeHTML(entitlementText)}</b></span><span>EVENT KEYS <b>seed · week · actor · channel</b></span><span>SOURCES IN WORKSPACE <b>${sourceCount}</b></span><span>REAL-WORLD DATA <b>NONE</b></span><span>Controls apply to the next run; this receipt keeps the values shown above.</span>`;
}

function renderTrajectory(result = getActiveRun()?.result) {
  if (!result) return;
  const metric = $("#trajectoryMetric").value || "basinHealth";
  const variant = $("#trajectoryVariant").value || "reference";
  const label = ({ livelihood: "Grower livelihood", basinHealth: "Basin health", smallholderEquity: "Small-grower equity" })[metric];
  $("#chartTitle").textContent = `${label} over ${MODEL_WEEKS} weeks`;
  const svg = $("#trajectoryChart");
  const width = 780; const height = 235; const left = 8; const top = 7; const plotW = 760; const plotH = 205;
  const lines = [100, 75, 50, 25, 0].map((v) => `<line class="chart-gridline" x1="${left}" y1="${top + (100 - v) / 100 * plotH}" x2="${left + plotW}" y2="${top + (100 - v) / 100 * plotH}"/>`).join("");
  const axes = `<line class="chart-axisline" x1="${left}" y1="${top + plotH}" x2="${left + plotW}" y2="${top + plotH}"/><text x="${left}" y="${height - 2}" fill="#9aa69c" font-size="8" font-family="DM Mono, monospace">WEEK 1</text><text x="${left + plotW - 39}" y="${height - 2}" fill="#9aa69c" font-size="8" font-family="DM Mono, monospace">52</text>`;
  const paths = result.policies.map((policy) => {
    const values = result.trajectories[variant][policy.id][metric];
    const points = values.map((value, index) => `${left + (index / (values.length - 1)) * plotW},${top + (100 - value) / 100 * plotH}`).join(" ");
    return `<polyline class="chart-line" points="${points}" stroke="${POLICY_COLORS[policy.id] || "#77847b"}"/>`;
  }).join("");
  svg.innerHTML = `${lines}${axes}${paths}`;
  $("#chartLegend").innerHTML = result.policies.map((policy) => `<span class="legend-item"><i style="background:${POLICY_COLORS[policy.id] || "#77847b"}"></i>${escapeHTML(policy.name)}</span>`).join("");
}

function renderVariantTable(result = getActiveRun()?.result) {
  if (!result) return;
  const metrics = [["Grower Δ", "livelihood"], ["Basin Δ", "basinHealth"], ["Equity Δ", "smallholderEquity"]];
  const variants = result.modelVariants;
  const consensus = Object.fromEntries(metrics.map(([label, key]) => {
    const signs = variants.map((variant) => Math.sign(result.comparisons.custom[variant.id][key].mean));
    const nonzero = signs.filter((sign) => sign !== 0);
    const allSame = nonzero.length === signs.length && nonzero.every((sign) => sign === nonzero[0]);
    return [key, allSame ? `${nonzero.length}/${signs.length} ${nonzero[0] >= 0 ? "↑" : "↓"}` : "Direction shifts"];
  }));
  $("#variantTable").innerHTML = `<table class="variant-table"><thead><tr><th>MODEL LENS</th>${metrics.map(([label]) => `<th>${label}</th>`).join("")}<th>BASIN AGREEMENT</th></tr></thead><tbody>${variants.map((variant) => {
    const cells = metrics.map(([, key]) => {
      const s = result.comparisons.custom[variant.id][key];
      return `<td title="Paired interval ${formatBound(s.low)} to ${formatBound(s.high)}">${formatDelta(s.mean)} <span style="color:#a3ada2;font-size:7px">[${formatBound(s.low)}, ${formatBound(s.high)}]</span></td>`;
    }).join("");
    const basin = result.comparisons.custom[variant.id].basinHealth.mean;
    const matchesRef = Math.sign(basin || 0) === Math.sign(result.comparisons.custom.reference.basinHealth.mean || 0);
    return `<tr><td class="variant-name">${escapeHTML(variant.name)}${variant.id === "reference" ? " · base" : ""}</td>${cells}<td><span class="agreement ${matchesRef ? "agrees" : "mixed"}">${escapeHTML(consensus.basinHealth)}</span></td></tr>`;
  }).join("")}</tbody></table>`;
  renderSensitivityWatch(result);
}

function renderSensitivityWatch(result) {
  const lenses = result.modelVariants.filter((variant) => variant.id !== "reference");
  const metrics = [
    ["Grower livelihood", "livelihood"],
    ["Basin health", "basinHealth"],
    ["Small-grower equity", "smallholderEquity"],
  ];
  const parameterForLens = { "slow-uptake": "peerLearning", "weak-restoration": "restorationEfficacy", "narrow-entitlement-gap": "baselineEntitlementGap", "high-demand": "extractionPressure" };
  const items = lenses.map((variant) => {
    const strongest = metrics.map(([label, metric]) => {
      const central = result.comparisons.custom.reference[metric].mean;
      const altered = result.comparisons.custom[variant.id][metric].mean;
      return { label, metric, central, altered, shift: Math.abs(altered - central), reversal: Math.sign(central) !== 0 && Math.sign(central) !== Math.sign(altered) };
    }).sort((a, b) => b.shift - a.shift)[0];
    return { variant, strongest, mechanism: parameterForLens[variant.id] || "provenance" };
  }).sort((a, b) => b.strongest.shift - a.strongest.shift);
  $("#sensitivityWatch").innerHTML = `<div class="sensitivity-watch-head"><strong>Which mechanism most changes the comparison?</strong><span>ONE-CHANGE SCREEN · NOT VALUE OF INFORMATION</span></div><div class="watch-items">${items.map(({ variant, strongest, mechanism }) => `<div class="watch-item"><strong>${escapeHTML(variant.name)}</strong><p>${escapeHTML(strongest.label)} contrast shifted by ${round(strongest.shift)} index points${strongest.reversal ? "; the direction changed" : ""} relative to the reference lens.</p><button type="button" data-evidence-mech="${mechanism}">Attach a source for this mechanism →</button></div>`).join("")}</div><p class="sensitivity-watch-note">This ranks only the selected one-at-a-time code perturbations. It does not estimate how much a real observation would improve a decision.</p>`;
}

function renderLedger() {
  $("#runCount").textContent = state.runs.length;
  $("#ledgerCountLarge").textContent = state.runs.length;
  $("#emptyLedger").hidden = state.runs.length > 0;
  if (!state.runs.length) {
    $("#ledgerList").innerHTML = "";
    return;
  }
  $("#ledgerList").innerHTML = state.runs.map((run) => `<article class="ledger-card"><div class="ledger-card-head"><h3>${escapeHTML(run.title)}</h3><time>${new Date(run.result.createdAt).toLocaleString()}</time></div><div class="ledger-card-meta"><span>RUN ${escapeHTML(run.id)}</span><span>${run.config.replicates} PAIRED SEEDS</span><span>${escapeHTML(run.config.stressName)}</span><span>MODEL ${escapeHTML(run.result.modelVersion)}</span><span>${run.result.records.length} RAW ROWS</span></div><div class="ledger-card-actions"><button class="text-button" data-open-run="${escapeHTML(run.id)}">Inspect results →</button><button class="text-button" data-export-run="${escapeHTML(run.id)}">Export receipt ↓</button><button class="text-button" data-delete-run="${escapeHTML(run.id)}">Remove ×</button></div></article>`).join("");
}

function downloadFile(filename, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadReceipt(run = getActiveRun()) {
  if (!run) return toast("Run a study first.", true);
  downloadFile(`causeway-receipt-${run.id}.json`, JSON.stringify(run.result, null, 2));
}

function downloadCSV(run = getActiveRun()) {
  if (!run) return toast("Run a study first.", true);
  const header = ["model_version", "replicate", "seed", "model_lens", "policy", "livelihood_index", "basin_health_index", "smallholder_equity_index", "reservoir", "habitat", "adoption"];
  const lines = run.result.records.map((row) => [run.result.modelVersion, row.replicate, row.seed, row.variant, row.policy, row.outcomes.livelihood, row.outcomes.basinHealth, row.outcomes.smallholderEquity, row.outcomes.reservoir, row.outcomes.habitat, row.outcomes.adoption].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  downloadFile(`causeway-outcomes-${run.id}.csv`, [header.join(","), ...lines].join("\r\n"), "text/csv;charset=utf-8");
}

function exportWorkspace() {
  const workspace = { ...state, exportedAt: new Date().toISOString(), exportNote: "Causeway local workspace export. Simulation outputs are synthetic model results, not field evidence." };
  downloadFile(`causeway-workspace-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(workspace, null, 2));
  toast("Workspace export created.");
}

async function importWorkspace(file) {
  try {
    if (file.size > 16 * 1024 * 1024) throw new Error("Workspace exports are limited to 16 MB.");
    const incoming = JSON.parse(await file.text());
    if (incoming.schema !== "causeway-workspace-v1" || !incoming.modelParameters || !Array.isArray(incoming.sources) || incoming.sources.length > 500 || !Array.isArray(incoming.runs) || incoming.runs.length > 4) throw new Error("This file is not a supported Causeway workspace export.");
    const sources = incoming.sources.map(sanitizeSource);
    for (const run of incoming.runs) {
      if (!validateRunReceipt(run)) throw new Error("A run receipt is incomplete or has an unsupported schema.");
    }
    state = { ...defaultState(), ...incoming, modelParameters: normalizeParameters(incoming.modelParameters), customPolicy: normalizeCustomPolicy(incoming.customPolicy), sources, runs: incoming.runs.slice(0, 4) };
    activeRunId = state.runs[0]?.id || null;
    persist();
    renderAll();
    renderResults();
    toast("Workspace imported and validated.");
  } catch (error) {
    toast(error.message || "The workspace could not be imported.", true);
  } finally {
    $("#importFile").value = "";
  }
}

function renderAll() {
  renderPolicyCards();
  renderPolicyControls();
  renderParameterControls();
  renderVariants();
  renderEvidenceMechanisms();
  renderSources();
  renderOverview();
  renderLedger();
  updateRunHint();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) navigate(nav.dataset.view);
  const go = event.target.closest("[data-go]");
  if (go) { event.preventDefault(); navigate(go.dataset.go); }
  const openRun = event.target.closest("[data-open-run]");
  if (openRun) {
    activeRunId = openRun.dataset.openRun;
    navigate("explore");
    renderResults();
  }
  const exportRun = event.target.closest("[data-export-run]");
  if (exportRun) downloadReceipt(state.runs.find((run) => run.id === exportRun.dataset.exportRun));
  const deleteRun = event.target.closest("[data-delete-run]");
  if (deleteRun) {
    state.runs = state.runs.filter((run) => run.id !== deleteRun.dataset.deleteRun);
    if (activeRunId === deleteRun.dataset.deleteRun) activeRunId = state.runs[0]?.id || null;
    persist(); renderAll(); renderResults(); toast("Run receipt removed from this workspace.");
  }
  const deleteSource = event.target.closest("[data-delete-source]");
  if (deleteSource) {
    state.sources = state.sources.filter((source) => source.id !== deleteSource.dataset.deleteSource);
    persist(); renderSources(); renderOverview(); toast("Source record removed.");
  }
  const evidenceMechanism = event.target.closest("[data-evidence-mech]");
  if (evidenceMechanism) {
    navigate("evidence");
    $("#sourceMechanism").value = evidenceMechanism.dataset.evidenceMech;
    $("#sourceTitle").focus();
  }
  const mapNode = event.target.closest(".causal-node");
  if (mapNode?.dataset.parameter) {
    selectedParameter = mapNode.dataset.parameter;
    $$(".causal-node", $("#causalMap")).forEach((node) => node.classList.toggle("selected", node.dataset.parameter === selectedParameter));
    const control = $(`#parameter-${selectedParameter}`);
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
    control?.focus({ preventScroll: true });
  }
});

document.addEventListener("input", (event) => {
  const parameter = event.target.dataset.parameter;
  if (parameter) {
    const value = Number(event.target.value);
    state.modelParameters[parameter] = value;
    $(`#parameter-value-${parameter}`).textContent = `${round(value * 100, 0)} / 100`;
    persist();
  }
  const policyKey = event.target.dataset.policy;
  if (policyKey) {
    const value = Number(event.target.value);
    const actual = value / 100;
    state.customPolicy[policyKey] = actual;
    $(`#output-${policyKey}`).textContent = `${value}%`;
    persist();
  }
  if (event.target.id === "workingQuestion") {
    state.question = event.target.value;
    persist();
  }
  if (event.target.id === "sourceSearch") renderSources();
});

$("#workingQuestion").addEventListener("change", (event) => { state.question = event.target.value.trim(); persist(); });
$("#replicates").addEventListener("change", updateRunHint);
$("#stress").addEventListener("change", updateRunHint);
$("#trajectoryMetric").addEventListener("change", () => renderTrajectory());
$("#trajectoryVariant").addEventListener("change", () => renderTrajectory());
$("#runExperiment").addEventListener("click", runStudy);
$("#cancelRun").addEventListener("click", () => { cancelRequested = true; $("#progressLabel").textContent = "Cancelling after current paired batch…"; });
$("#exportWorkspace").addEventListener("click", exportWorkspace);
$("#importWorkspace").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", (event) => { if (event.target.files?.[0]) importWorkspace(event.target.files[0]); });
$("#downloadRun").addEventListener("click", () => downloadReceipt());
$("#downloadCSV").addEventListener("click", () => downloadCSV());
$("#resetParameters").addEventListener("click", () => {
  state.modelParameters = { ...DEFAULT_PARAMETERS };
  persist(); renderParameterControls(); toast("Model inputs reset to the illustrative defaults.");
});
$("#clearLedger").addEventListener("click", () => {
  if (!state.runs.length) return toast("The ledger is already empty.");
  if (!window.confirm("Remove every saved run receipt from this local workspace? Export any receipts you need first.")) return;
  state.runs = []; activeRunId = null; persist(); renderAll(); renderResults(); toast("Run ledger cleared.");
});

$("#sourceForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#sourceTitle").value.trim();
  const urlText = $("#sourceUrl").value.trim();
  let url = "";
  if (urlText) {
    try {
      const parsed = new URL(urlText);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("Use an http or https link.");
      url = parsed.href;
    } catch (error) {
      toast(error.message || "Enter a valid http or https link.", true);
      return;
    }
  }
  state.sources.unshift({ id: `src-${Date.now().toString(36)}`, title, url, note: $("#sourceNote").value.trim(), mechanism: $("#sourceMechanism").value, kind: "Research / field note", createdAt: new Date().toISOString(), seeded: false });
  persist(); event.target.reset(); renderSources(); renderOverview(); toast("Source record added to this local workspace.");
});

window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (["overview", "explore", "model", "evidence", "ledger"].includes(next)) navigate(next);
});

renderAll();
const firstView = location.hash.slice(1);
if (["overview", "explore", "model", "evidence", "ledger"].includes(firstView)) navigate(firstView);
if (state.runs.length) renderResults();
