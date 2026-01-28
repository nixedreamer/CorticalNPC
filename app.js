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
