const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "corticalNpcHelperState_v2";

const clamp100 = (n) => Math.max(1, Math.min(100, n));

/**
 * Placeholder example table for the roll helper.
 * Later we can swap this for the actual Cortical NPC table data + chained modifiers.
 */
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

/** -------- Profile state + binding -------- **/

function defaultCompanion() {
  return {
    comp_name: "",
    comp_rel_npc_to_comp: "",
    comp_rel_comp_to_npc: "",
    // NPC -> PC modifiers
    npc_mod_6_2: "",
    npc_mod_12_1: "",
    npc_mod_12_2: "",
    npc_mod_12_3: "",
    npc_mod_13_1: "",
    npc_mod_13_3: "",
    npc_mod_13_5: "",
    npc_mod_14_1: "",
    npc_mod_14_4: "",
    npc_mod_17_1: "",
    npc_mod_17_2: "",
    npc_mod_17_3: "",
    // Companion -> PC modifiers
    comp_mod_6_2: "",
    comp_mod_12_1: "",
    comp_mod_12_2: "",
    comp_mod_12_3: "",
    comp_mod_13_1: "",
    comp_mod_13_3: "",
    comp_mod_13_5: "",
    comp_mod_14_1: "",
    comp_mod_14_4: "",
    comp_mod_17_1: "",
    comp_mod_17_2: "",
    comp_mod_17_3: "",
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

      impMobSeverity: "",
      impMobEffect: "",
      impIntSeverity: "",
      impIntEffect: "",
      impHearSeverity: "",
      impHearEffect: "",
      impVisSeverity: "",
      impVisEffect: "",

      a_9_1: "", a_9_2: "", a_9_3: "", a_9_4: "", a_9_5: "", a_9_6: "", a_9_7: "", a_9_8: "", a_9_9: "",
      a_9_10: "", a_9_11: "", a_9_12: "", a_9_13: "", a_9_14: "", a_9_15: "", a_9_16: "", a_9_17: "", a_9_18: "",

      vocalPitch: "",
      vocalVolume: "",

      lang1Comp: "", lang1Clar: "",
      lang2Comp: "", lang2Clar: "",
      lang3Comp: "", lang3Clar: "",
      lang4Comp: "", lang4Clar: "",

      tears: "",
      tearsToDamage: "",
      relationshipType: "",
      links: "",
      linksToAdvance: "",

      m_6_1: "",
      m_6_2: "",
      m_10_2: "",
      m_12_1: "",
      m_12_2: "",
      m_12_3: "",
      m_13_pas: "",
      m_13_2: "",
      m_13_4: "",
      m_13_6: "",
      m_14_2: "",
      m_14_4: "",
      m_17_1: "",
      combatRole: "",
      combatTendency: "",

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

    // merge-ish (simple)
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
    // companions are handled separately because they use repeated template fields
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
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      profile[k] = el.value ?? "";
    }
  });
}

function renderCompanions(state) {
  const wrap = $("companionsWrap");
  wrap.innerHTML = "";

  const tpl = $("companionTemplate");

  state.profile.companions.forEach((comp, idx) => {
    const node = tpl.content.cloneNode(true);

    const root = node.querySelector(".companion");
    root.dataset.idx = String(idx);

    root.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.getAttribute("data-k");
      const v = comp[k] ?? "";
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") el.value = v;
    });

    wrap.appendChild(node);
  });
}

function readCompanionsIntoState(state) {
  const blocks = document.querySelectorAll(".companion");
  state.profile.companions = Array.from(blocks).map((block) => {
    const comp = defaultCompanion();
    block.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.getAttribute("data-k");
      if (!k) return;
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") comp[k] = el.value ?? "";
    });
    return comp;
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
        const parsed = JSON.parse(txt);
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    inp.click();
  });
}

/** -------- Tabs -------- **/
function setTab(which) {
  const isRoll = which === "roll";
  $("panelRoll").classList.toggle("hidden", !isRoll);
  $("panelProfile").classList.toggle("hidden", isRoll);

  $("tabRoll").classList.toggle("active", isRoll);
  $("tabProfile").classList.toggle("active", !isRoll);

  $("tabRoll").setAttribute("aria-selected", String(isRoll));
  $("tabProfile").setAttribute("aria-selected", String(!isRoll));
}

/** -------- App wiring -------- **/
let state = loadState();

// Initialize roll helper inputs
$("rawRoll").value = state.rollHelper.rawRoll ?? 50;
$("flatMod").value = state.rollHelper.flatMod ?? 0;

// Initialize profile inputs
bindProfileFields(state);
renderCompanions(state);

// Compute roll helper once
computeRollHelper(state);

function syncFromUIAndSave() {
  readProfileFieldsIntoState(state);
  readCompanionsIntoState(state);
  computeRollHelper(state);
  saveState(state);
}

// Autosave on any change in profile
$("panelProfile").addEventListener("input", () => {
  // lightweight autosave
  readProfileFieldsIntoState(state);
  readCompanionsIntoState(state);
  saveState(state);
});

$("tabRoll").addEventListener("click", () => setTab("roll"));
$("tabProfile").addEventListener("click", () => setTab("profile"));

$("applyBtn").addEventListener("click", () => {
  computeRollHelper(state);
  saveState(state);
});

$("saveBtn").addEventListener("click", () => {
  syncFromUIAndSave();
});

$("loadBtn").addEventListener("click", () => {
  state = loadState();
  $("rawRoll").value = state.rollHelper.rawRoll ?? 50;
  $("flatMod").value = state.rollHelper.flatMod ?? 0;

  bindProfileFields(state);
  renderCompanions(state);

  computeRollHelper(state);
});

$("exportBtn").addEventListener("click", () => {
  syncFromUIAndSave();
  exportJson(state);
});

$("importBtn").addEventListener("click", async () => {
  try {
    const imported = await importJson();
    // basic guard
    state = { ...defaultState(), ...imported };
    $("rawRoll").value = state.rollHelper?.rawRoll ?? 50;
    $("flatMod").value = state.rollHelper?.flatMod ?? 0;

    bindProfileFields(state);
    renderCompanions(state);

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
  renderCompanions(state);

  computeRollHelper(state);
});

$("addCompanionBtn").addEventListener("click", () => {
  // sync first so we don’t lose edits
  readProfileFieldsIntoState(state);
  readCompanionsIntoState(state);

  state.profile.companions.push(defaultCompanion());
  renderCompanions(state);
  saveState(state);
});

// remove companion via event delegation
$("companionsWrap").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='removeCompanion']");
  if (!btn) return;

  const block = btn.closest(".companion");
  const idx = Number(block?.dataset?.idx);
  if (Number.isNaN(idx)) return;

  readProfileFieldsIntoState(state);
  readCompanionsIntoState(state);

  state.profile.companions.splice(idx, 1);
  if (state.profile.companions.length === 0) state.profile.companions.push(defaultCompanion());

  renderCompanions(state);
  saveState(state);
});

// ----- Rolling engine (percentile + modifiers + side effects) -----

function d100() {
  return Math.floor(Math.random() * 100) + 1;
}

function clamp100(n) {
  return Math.max(1, Math.min(100, n));
}

function pickRangeRow(table, roll) {
  const row = table.find(r => roll >= r.from && roll <= r.to);
  if (!row) throw new Error(`No range matched roll=${roll}`);
  return row;
}

// Tables: 9.1–9.18 (Appearance chain)
const T9 = {
  "9.1": [
    { from: 1,  to: 14, label: "Hypermasculine", mods: [{ t:"9.6", d:-5 }, { t:"9.12", d:+4 }] },
    { from: 15, to: 49, label: "Masculine",      mods: [{ t:"9.6", d:-3 }, { t:"9.12", d:+3 }] },
    { from: 50, to: 51, label: "Neutral",        mods: [] },
    { from: 52, to: 86, label: "Feminine",       mods: [{ t:"9.6", d:+3 }, { t:"9.12", d:-3 }] },
    { from: 87, to: 100,label: "Hyperfeminine",  mods: [{ t:"9.6", d:+5 }, { t:"9.12", d:-4 }] },
  ],

  "9.2": [
    { from: 1,  to: 10, label: "Very poor", mods: [{t:"9.3",d:-5},{t:"9.4",d:-4},{t:"9.7",d:-2}] },
    { from: 11, to: 30, label: "Poor",      mods: [{t:"9.3",d:-3},{t:"9.4",d:-3},{t:"9.7",d:-1}] },
    { from: 31, to: 70, label: "Average",   mods: [] },
    { from: 71, to: 90, label: "Fine",      mods: [{t:"9.3",d:+3},{t:"9.4",d:+3},{t:"9.7",d:+1}] },
    { from: 91, to: 100,label: "Very fine", mods: [{t:"9.3",d:+5},{t:"9.4",d:+4},{t:"9.7",d:+2}] },
  ],

  "9.3": [
    { from: 1,  to: 10, label: "Very poor", mods: [{t:"9.4",d:-5},{t:"9.7",d:-5},{t:"9.8",d:-5},{t:"9.14",d:-2}] },
    { from: 11, to: 30, label: "Poor",      mods: [{t:"9.4",d:-3},{t:"9.7",d:-3},{t:"9.8",d:-3},{t:"9.14",d:-1}] },
    { from: 31, to: 70, label: "Average",   mods: [] },
    { from: 71, to: 90, label: "Fine",      mods: [{t:"9.4",d:+3},{t:"9.7",d:+3},{t:"9.8",d:+10},{t:"9.14",d:+1}] },
    { from: 91, to: 100,label: "Very fine", mods: [{t:"9.4",d:+5},{t:"9.7",d:+5},{t:"9.8",d:+15},{t:"9.14",d:+2}] },
  ],

  "9.4": [
    { from: 1,  to: 10, label: "Poor",         mods: [{t:"9.5",d:-4},{t:"9.7",d:-5},{t:"9.8",d:-5},{t:"9.14",d:-3}] },
    { from: 11, to: 30, label: "Below average",mods: [{t:"9.5",d:-3},{t:"9.7",d:-3},{t:"9.8",d:-3},{t:"9.14",d:-2}] },
    { from: 31, to: 70, label: "Average",      mods: [] },
    { from: 71, to: 90, label: "Above average",mods: [{t:"9.5",d:+3},{t:"9.7",d:+3},{t:"9.8",d:+3},{t:"9.14",d:+2}] },
    { from: 91, to: 100,label: "Perfect",      mods: [{t:"9.5",d:+4},{t:"9.7",d:+5},{t:"9.8",d:+5},{t:"9.14",d:+3}] },
  ],

  "9.5": [
    { from: 1,  to: 5,  label: "Poor",         mods: [{t:"9.8",d:-5},{t:"9.14",d:-3},{t:"9.18",d:+55}] },
    { from: 6,  to: 20, label: "Below average",mods: [{t:"9.8",d:-3},{t:"9.14",d:-2},{t:"9.18",d:+40}] },
    { from: 21, to: 80, label: "Average",      mods: [] },
    { from: 81, to: 95, label: "Above average",mods: [{t:"9.8",d:+3},{t:"9.14",d:+2},{t:"9.18",d:+40}] },
    { from: 96, to: 100,label: "Perfect",      mods: [{t:"9.8",d:+5},{t:"9.14",d:+3},{t:"9.18",d:+55}] },
  ],

  "9.6": [
    { from: 1,  to: 10, label: "Very short", mods: [{t:"9.7",d:-2}] },
    { from: 11, to: 30, label: "Short",      mods: [{t:"9.7",d:-1}] },
    { from: 31, to: 70, label: "Average",    mods: [] },
    { from: 71, to: 90, label: "Long",       mods: [{t:"9.7",d:+1}] },
    { from: 91, to: 100,label: "Very long",  mods: [{t:"9.7",d:+2}] },
  ],

  "9.7": [
    { from: 1,  to: 15, label: "None/messy",        mods: [{t:"9.8",d:-5},{t:"9.14",d:-1}] },
    { from: 16, to: 35, label: "Plain",             mods: [{t:"9.8",d:-3}] },
    { from: 36, to: 65, label: "Average",           mods: [] },
    { from: 66, to: 85, label: "Stylish",           mods: [{t:"9.8",d:+3}] },
    { from: 86, to: 100,label: "Elaborate/fancy",   mods: [{t:"9.8",d:+5},{t:"9.14",d:+1}] },
  ],

  "9.8": [
    { from: 1,  to: 5,  label: "Odorous/repulsive", mods: [{t:"9.14",d:-3}] },
    { from: 6,  to: 20, label: "Slightly unpleasant",mods:[{t:"9.14",d:-2}] },
    { from: 21, to: 80, label: "None",              mods: [] },
    { from: 81, to: 95, label: "Slightly pleasant", mods: [{t:"9.14",d:+2}] },
    { from: 96, to: 100,label: "Fragrant/attractive",mods:[{t:"9.14",d:+3}] },
  ],

  "9.9": [
    { from: 1,  to: 5,  label: "Well below average", mods: [{t:"9.13",d:+4},{t:"9.14",d:-1},{t:"9.15",d:-10}] },
    { from: 6,  to: 20, label: "Below average",      mods: [{t:"9.13",d:+3},{t:"9.15",d:-5}] },
    { from: 21, to: 80, label: "Average",            mods: [] },
    { from: 81, to: 95, label: "Above average",      mods: [{t:"9.13",d:-3},{t:"9.15",d:+5}] },
    { from: 96, to: 100,label: "Well above average", mods: [{t:"9.13",d:-4},{t:"9.14",d:+1},{t:"9.15",d:+10}] },
  ],

  "9.10": [
    { from: 1,  to: 5,  label: "Very thin", mods: [{t:"9.11",d:-5},{t:"9.12",d:-5},{t:"9.16",d:-5},{t:"9.18",d:+5}] },
    { from: 6,  to: 20, label: "Thin",      mods: [{t:"9.11",d:-3},{t:"9.12",d:-3},{t:"9.16",d:-3},{t:"9.18",d:+3}] },
    { from: 21, to: 80, label: "Average",   mods: [] },
    { from: 81, to: 95, label: "Thick",     mods: [{t:"9.11",d:+3},{t:"9.12",d:+3},{t:"9.16",d:+3},{t:"9.18",d:+3}] },
    { from: 96, to: 100,label: "Very thick",mods: [{t:"9.11",d:+5},{t:"9.12",d:+5},{t:"9.16",d:+5},{t:"9.18",d:+5}] },
  ],

  "9.11": [
    { from: 1,  to: 10, label: "Well below average", mods: [{t:"9.13",d:+5},{t:"9.15",d:+10},{t:"9.16",d:+5}] },
    { from: 11, to: 30, label: "Below average",      mods: [{t:"9.13",d:+3},{t:"9.15",d:+5},{t:"9.16",d:+3}] },
    { from: 31, to: 70, label: "Average",            mods: [] },
    { from: 71, to: 90, label: "Above average",      mods: [{t:"9.13",d:-3},{t:"9.15",d:-10}] },
    { from: 91, to: 100,label: "Well above average", mods: [{t:"9.13",d:-5},{t:"9.15",d:-15}] },
  ],

  "9.12": [
    { from: 1,  to: 10, label: "Well below average", mods: [{t:"9.13",d:-5},{t:"9.14",d:-2},{t:"9.15",d:-5}] },
    { from: 11, to: 30, label: "Below average",      mods: [{t:"9.13",d:-3},{t:"9.14",d:-1},{t:"9.15",d:-3}] },
    { from: 31, to: 70, label: "Average",            mods: [] },
    { from: 71, to: 90, label: "Above average",      mods: [{t:"9.13",d:+3},{t:"9.14",d:+1},{t:"9.15",d:+3},{t:"9.16",d:+3}] },
    { from: 91, to: 100,label: "Well above average", mods: [{t:"9.13",d:+5},{t:"9.14",d:+2},{t:"9.15",d:+5},{t:"9.16",d:+5}] },
  ],

  "9.13": [
    { from: 1,  to: 15, label: "Slouched/crooked", mods: [{t:"9.14",d:-2},{t:"9.15",d:-10}] },
    { from: 16, to: 35, label: "Overly relaxed",   mods: [{t:"9.14",d:-1},{t:"9.15",d:-5}] },
    { from: 36, to: 65, label: "Casual/acceptable",mods: [] },
    { from: 66, to: 85, label: "Upright/healthy",  mods: [{t:"9.14",d:+1},{t:"9.15",d:+3}] },
    { from: 86, to: 100,label: "Erect/rigid",      mods: [{t:"9.14",d:+2},{t:"9.15",d:+5}] },
  ],

  "9.14": [
    { from: 1,  to: 20, label: "Very introverted", mods: [{t:"9.15",d:-2}] },
    { from: 21, to: 40, label: "Introverted",      mods: [{t:"9.15",d:-1}] },
    { from: 41, to: 60, label: "Ambiverted",       mods: [] },
    { from: 61, to: 80, label: "Extroverted",      mods: [{t:"9.15",d:+1}] },
    { from: 81, to: 100,label: "Very extroverted", mods: [{t:"9.15",d:+2}] },
  ],

  "9.15": [
    { from: 1,  to: 20, label: "Very slow (SPD 1)", mods: [] },
    { from: 21, to: 40, label: "Slow (SPD 2)",      mods: [] },
    { from: 41, to: 60, label: "Normal (SPD 3)",    mods: [] },
    { from: 61, to: 80, label: "Fast (SPD 4)",      mods: [] },
    { from: 81, to: 100,label: "Very fast (SPD 5)", mods: [] },
  ],

  "9.16": [
    { from: 1,  to: 5,  label: "Very soft", mods: [{t:"9.17",d:+5}] },
    { from: 6,  to: 20, label: "Soft",      mods: [{t:"9.17",d:+3}] },
    { from: 21, to: 80, label: "Average",   mods: [] },
    { from: 81, to: 95, label: "Angular",   mods: [{t:"9.17",d:-3}] },
    { from: 96, to: 100,label: "Very angular",mods:[{t:"9.17",d:-5}] },
  ],

  "9.17": [
    { from: 1,  to: 10, label: "Major asymmetry",      mods: [{t:"9.18",d:+20}] },
    { from: 11, to: 30, label: "Noticeable asymmetry", mods: [{t:"9.18",d:+15}] },
    { from: 31, to: 70, label: "Average symmetry",     mods: [] },
    { from: 71, to: 90, label: "Noticeable symmetry",  mods: [] },
    { from: 91, to: 100,label: "Near-perfect symmetry",mods: [] },
  ],

  "9.18": [
    { from: 1,  to: 55, label: "None",      mods: [] },
    { from: 56, to: 60, label: "Brow",      mods: [] },
    { from: 61, to: 65, label: "Cheeks",    mods: [] },
    { from: 66, to: 70, label: "Chin/jaw",  mods: [] },
    { from: 71, to: 75, label: "Ears",      mods: [] },
    { from: 76, to: 80, label: "Eyes",      mods: [] },
    { from: 81, to: 85, label: "Forehead",  mods: [] },
    { from: 86, to: 90, label: "Mouth",     mods: [] },
    { from: 91, to: 95, label: "Nose",      mods: [] },
    { from: 96, to: 100,label: "Teeth",     mods: [] },
  ],
};

function rollTableWithMods(modsByTable, id) {
  const raw = d100();
  const mod = Number(modsByTable[id] || 0);
  const final = clamp100(raw + mod);

  const row = pickRangeRow(T9[id], final);

  // apply side-effect mods to future tables
  for (const m of (row.mods || [])) {
    modsByTable[m.t] = Number(modsByTable[m.t] || 0) + Number(m.d);
  }

  return { id, raw, mod, final, label: row.label, applied: (row.mods || []) };
}

function setProfileField(key, value) {
  const el = document.querySelector(`[data-k="${key}"]`);
  if (el) el.value = value;
}

function rollAppearanceAndPopulate() {
  const mods = {}; // tableId -> running modifier
  const order = ["9.1","9.2","9.3","9.4","9.5","9.6","9.7","9.8","9.9","9.10","9.11","9.12","9.13","9.14","9.15","9.16","9.17","9.18"];

  const lines = [];
  lines.push("Appearance roll log (raw + modifier = final → result)\n");

  for (const id of order) {
    const r = rollTableWithMods(mods, id);

    // map to your profile keys a_9_1 ... a_9_18
    const key = "a_" + id.replace(".", "_"); // "9.10" -> "a_9_10"
    setProfileField(key, r.label);

    const appliedStr = r.applied.length
      ? " | applies: " + r.applied.map(x => `${x.t} ${x.d >= 0 ? "+" : ""}${x.d}`).join(", ")
      : "";

    lines.push(`${id}: ${r.raw} ${r.mod ? (r.mod >= 0 ? "+ " + r.mod : "- " + Math.abs(r.mod)) : "+ 0"} = ${r.final} → ${r.label}${appliedStr}`);
  }

  // show the final modifier state too (useful for debugging)
  const modKeys = Object.keys(mods).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
  lines.push("\nFinal modifier totals:");
  for (const k of modKeys) lines.push(`${k}: ${mods[k] >= 0 ? "+" : ""}${mods[k]}`);

  const log = document.getElementById("rollLog");
  if (log) log.textContent = lines.join("\n");

  // persist your existing state if you’re using autosave
  // (if your app already saves on input, this is optional)
}

// Wire button
document.getElementById("rollAppearanceBtn")?.addEventListener("click", rollAppearanceAndPopulate);
