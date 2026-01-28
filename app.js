const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "corticalNpcHelperState_v3";
const clamp100 = (n) => Math.max(1, Math.min(100, n));

/* ------------------ Basic roll helper (your existing) ------------------ */
const exampleTable = [
  { from: 1, to: 20, text: "Example outcome A" },
  { from: 21, to: 65, text: "Example outcome B" },
  { from: 66, to: 80, text: "Example outcome C" },
  { from: 81, to: 100, text: "Example outcome D" },
];

function lookupByRange(table, roll) {
  const row = table.find((r) => roll >= r.from && roll <= r.to);
  if (!row) return "No matching range.";
  return row.text;
}

function computeRollHelper(state) {
  const raw = Number($("rawRoll").value || 0);
  const flat = Number($("flatMod").value || 0);

  const rawClamped = clamp100(raw);
  const final = clamp100(rawClamped + flat);

  $("finalRoll").textContent = String(final);

  const outcome = lookupByRange(exampleTable, final);

  $("resultBox").textContent =
    `Raw roll: ${raw} (clamped → ${rawClamped})\n` +
    `Modifier: ${flat >= 0 ? "+" : ""}${flat}\n` +
    `Final: ${final}\n\n` +
    `Outcome: ${outcome}`;

  state.rollHelper = { rawRoll: raw, flatMod: flat };
}

/* ------------------ State / persistence (your existing) ------------------ */
function defaultCompanion() {
  return {
    comp_name: "",
    comp_rel_npc_to_comp: "",
    comp_rel_comp_to_npc: "",
    npc_mod_6_2: "", npc_mod_12_1: "", npc_mod_12_2: "", npc_mod_12_3: "",
    npc_mod_13_1: "", npc_mod_13_3: "", npc_mod_13_5: "",
    npc_mod_14_1: "", npc_mod_14_4: "",
    npc_mod_17_1: "", npc_mod_17_2: "", npc_mod_17_3: "",
    comp_mod_6_2: "", comp_mod_12_1: "", comp_mod_12_2: "", comp_mod_12_3: "",
    comp_mod_13_1: "", comp_mod_13_3: "", comp_mod_13_5: "",
    comp_mod_14_1: "", comp_mod_14_4: "",
    comp_mod_17_1: "", comp_mod_17_2: "", comp_mod_17_3: "",
    comp_notes: "",
  };
}

function defaultState() {
  return {
    rollHelper: { rawRoll: 50, flatMod: 0 },
    profile: {
      name: "",
      sexualCharacteristics: "",
      apparentAge: "",
      actualAge: "",
      education: "",
      occupation: "",
      jobLevel: "",
      skillLevel: "",

      impMobSeverity: "", impMobEffect: "",
      impIntSeverity: "", impIntEffect: "",
      impHearSeverity: "", impHearEffect: "",
      impVisSeverity: "", impVisEffect: "",

      a_9_1: "", a_9_2: "", a_9_3: "", a_9_4: "", a_9_5: "", a_9_6: "", a_9_7: "", a_9_8: "", a_9_9: "",
      a_9_10: "", a_9_11: "", a_9_12: "", a_9_13: "", a_9_14: "", a_9_15: "", a_9_16: "", a_9_17: "", a_9_18: "",

      vocalPitch: "", vocalVolume: "",

      lang1Comp: "", lang1Clar: "",
      lang2Comp: "", lang2Clar: "",
      lang3Comp: "", lang3Clar: "",
      lang4Comp: "", lang4Clar: "",

      tears: "", tearsToDamage: "",
      relationshipType: "",
      links: "", linksToAdvance: "",

      m_6_1: "", m_6_2: "", m_10_2: "",
      m_12_1: "", m_12_2: "", m_12_3: "",
      m_13_pas: "", m_13_2: "", m_13_4: "", m_13_6: "",
      m_14_2: "", m_14_4: "",
      m_17_1: "", combatRole: "", combatTendency: "",

      notes: "",

      companions: [defaultCompanion()],
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      rollHelper: { ...base.rollHelper, ...(parsed.rollHelper || {}) },
      profile: {
        ...base.profile,
        ...(parsed.profile || {}),
        companions: Array.isArray(parsed?.profile?.companions) && parsed.profile.companions.length
          ? parsed.profile.companions
          : base.profile.companions,
      },
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindProfileFields(state) {
  const profile = state.profile;
  document.querySelectorAll("[data-k]").forEach((el) => {
    if (el.closest(".companion")) return;
    const k = el.getAttribute("data-k");
    const v = profile[k] ?? "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") el.value = v;
  });
}

function readProfileFieldsIntoState(state) {
  const profile = state.profile;
  document.querySelectorAll("[data-k]").forEach((el) => {
    if (el.closest(".companion")) return;
    const k = el.getAttribute("data-k");
    if (!k) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") profile[k] = el.value ?? "";
  });
}

function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cortical-npc-profile.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importJson() {
  return new Promise((resolve, reject) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = async () => {
      try {
        const file = inp.files?.[0];
        if (!file) return reject(new Error("No file selected"));
        const txt = await file.text();
        resolve(JSON.parse(txt));
      } catch (e) {
        reject(e);
      }
    };
    inp.click();
  });
}

/* ------------------ Tabs ------------------ */
function setTab(which) {
  const isRoll = which === "roll";
  $("panelRoll")?.classList.toggle("hidden", !isRoll);
  $("panelProfile")?.classList.toggle("hidden", isRoll);
  $("tabRoll")?.classList.toggle("active", isRoll);
  $("tabProfile")?.classList.toggle("active", !isRoll);
  $("tabRoll")?.setAttribute("aria-selected", String(isRoll));
  $("tabProfile")?.setAttribute("aria-selected", String(!isRoll));
}

/* ------------------ Table-driven FULL roller ------------------ */
/**
 * We load ALL tables from tables.json so the app can populate everything
 * without hardcoding copyrighted table text here.
 */
let TABLEPACK = null;

async function loadTablesJson() {
  const res = await fetch("tables.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load tables.json (${res.status})`);
  const json = await res.json();
  validateTablePack(json);
  TABLEPACK = json;
  return TABLEPACK;
}

function validateTablePack(pack) {
  if (!pack || typeof pack !== "object") throw new Error("tables.json must be an object");
  if (!pack.order || !Array.isArray(pack.order) || pack.order.length === 0) {
    throw new Error("tables.json must include an 'order' array");
  }
  if (!pack.tables || typeof pack.tables !== "object") {
    throw new Error("tables.json must include a 'tables' object");
  }
}

function d100() {
  return Math.floor(Math.random() * 100) + 1;
}

function pickRangeRow(table, roll) {
  const row = table.find(r => roll >= r.from && roll <= r.to);
  if (!row) throw new Error(`No range matched roll=${roll}`);
  return row;
}

function setK(key, value) {
  const el = document.querySelector(`[data-k="${key}"]`);
  if (el) el.value = value;
}

function applySideEffects(modsByTable, row) {
  for (const m of (row.mods || [])) {
    modsByTable[m.t] = Number(modsByTable[m.t] || 0) + Number(m.d);
  }
}

function rollOne(tableId, modsByTable) {
  const def = TABLEPACK.tables[tableId];
  if (!def) throw new Error(`Missing table '${tableId}' in tables.json`);

  const raw = d100();
  const mod = Number(modsByTable[tableId] || 0);
  const final = clamp100(raw + mod);

  const row = pickRangeRow(def.ranges, final);

  // Write outputs
  // outputs is a map of { dataKey: "value" } OR { dataKey: { pick: ["a","b"] } }
  if (def.outputs) {
    for (const [k, v] of Object.entries(def.outputs)) {
      if (typeof v === "string") setK(k, v);
      else if (v && typeof v === "object" && Array.isArray(v.pick)) {
        const choice = v.pick[Math.floor(Math.random() * v.pick.length)];
        setK(k, choice);
      }
    }
  }

  // Also allow each row to override/set outputs (useful when the table result text differs by row)
  if (row.set) {
    for (const [k, v] of Object.entries(row.set)) setK(k, v);
  }

  applySideEffects(modsByTable, row);

  return { tableId, raw, mod, final, label: row.label || "(no label)", applied: row.mods || [] };
}

function rollFullProfile() {
  if (!TABLEPACK) {
    $("rollLog").textContent = "tables.json not loaded yet. Click Reload tables.json.";
    return;
  }

  setTab("profile");

  const mods = {};
  const lines = [];
  lines.push("FULL PROFILE ROLL");
  lines.push("");

  for (const tableId of TABLEPACK.order) {
    const r = rollOne(tableId, mods);

    const appliedStr = r.applied.length
      ? " | applies: " + r.applied.map(x => `${x.t} ${x.d >= 0 ? "+" : ""}${x.d}`).join(", ")
      : "";

    lines.push(`${tableId}: ${r.raw} ${r.mod ? (r.mod >= 0 ? "+ " + r.mod : "- " + Math.abs(r.mod)) : "+ 0"} = ${r.final} → ${r.label}${appliedStr}`);
  }

  lines.push("");
  lines.push("Final modifier totals:");
  const modKeys = Object.keys(mods).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
  if (modKeys.length === 0) lines.push("(none)");
  for (const k of modKeys) lines.push(`${k}: ${mods[k] >= 0 ? "+" : ""}${mods[k]}`);

  $("rollLog").textContent = lines.join("\n");

  // Persist
  readProfileFieldsIntoState(state);
  saveState(state);
}

/* ------------------ App init + wiring ------------------ */
let state = loadState();

$("rawRoll").value = state.rollHelper.rawRoll ?? 50;
$("flatMod").value = state.rollHelper.flatMod ?? 0;
bindProfileFields(state);
computeRollHelper(state);

$("tabRoll").addEventListener("click", () => setTab("roll"));
$("tabProfile").addEventListener("click", () => setTab("profile"));

$("applyBtn").addEventListener("click", () => { computeRollHelper(state); saveState(state); });
$("saveBtn").addEventListener("click", () => { readProfileFieldsIntoState(state); computeRollHelper(state); saveState(state); });

$("loadBtn").addEventListener("click", () => {
  state = loadState();
  $("rawRoll").value = state.rollHelper.rawRoll ?? 50;
  $("flatMod").value = state.rollHelper.flatMod ?? 0;
  bindProfileFields(state);
  computeRollHelper(state);
});

$("exportBtn").addEventListener("click", () => { readProfileFieldsIntoState(state); exportJson(state); });

$("importBtn").addEventListener("click", async () => {
  try {
    const imported = await importJson();
    state = { ...defaultState(), ...imported };
    $("rawRoll").value = state.rollHelper?.rawRoll ?? 50;
    $("flatMod").value = state.rollHelper?.flatMod ?? 0;
    bindProfileFields(state);
    computeRollHelper(state);
    saveState(state);
  } catch (e) {
    alert("Import failed: " + (e?.message || String(e)));
  }
});

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset everything (roll helper + profile)?")) return;
  state = defaultState();
  saveState(state);
  $("rawRoll").value = 50;
  $("flatMod").value = 0;
  bindProfileFields(state);
  computeRollHelper(state);
  $("rollLog").textContent = "—";
});

$("panelProfile").addEventListener("input", () => {
  readProfileFieldsIntoState(state);
  saveState(state);
});

// Tables loading + buttons
$("reloadTablesBtn")?.addEventListener("click", async () => {
  try {
    await loadTablesJson();
    $("rollLog").textContent = "tables.json loaded. Ready to roll full profile.";
  } catch (e) {
    $("rollLog").textContent = "tables.json load failed: " + (e?.message || String(e));
  }
});

$("rollFullProfileBtn")?.addEventListener("click", rollFullProfile);

// Try load automatically on startup
loadTablesJson().catch(() => {});
