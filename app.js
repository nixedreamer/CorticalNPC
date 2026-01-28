const $ = (id) => document.getElementById(id);

const clamp100 = (n) => Math.max(1, Math.min(100, n));

/**
 * Replace this with the actual Cortical NPC tables.
 * For now, it's a placeholder mapping.
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

function compute() {
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
}

function saveState() {
  const state = {
    rawRoll: $("rawRoll").value,
    flatMod: $("flatMod").value,
  };
  localStorage.setItem("npcSheetHelperState", JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem("npcSheetHelperState");
  if (!raw) return;
  const state = JSON.parse(raw);
  $("rawRoll").value = state.rawRoll ?? 50;
  $("flatMod").value = state.flatMod ?? 0;
}

function resetState() {
  localStorage.removeItem("npcSheetHelperState");
  $("rawRoll").value = 50;
  $("flatMod").value = 0;
  compute();
}

$("applyBtn").addEventListener("click", compute);
$("saveBtn").addEventListener("click", () => { saveState(); compute(); });
$("loadBtn").addEventListener("click", () => { loadState(); compute(); });
$("resetBtn").addEventListener("click", resetState);

loadState();
compute();
