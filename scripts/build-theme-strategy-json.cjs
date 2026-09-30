/**
 * Builds data/section_b_theme_strategy.json from the hand-made cluster specs.
 * Input:  docs/section-b-arguments-by-theme/clusters/<themeId>.json
 * Output: { [themeId]: [{ id, label, examiner, alsoAskedAs, acknowledge, defend, solve }] }
 * Run:    node scripts/build-theme-strategy-json.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLUSTER_DIR = path.join(ROOT, 'docs/section-b-arguments-by-theme/clusters');
const tasks = require(path.join(ROOT, 'data/section_b_knowledge_base.json'));

const objectionOf = (id) => {
  const [taskId, idx] = id.split('.').map(Number);
  const task = tasks.find((t) => t.id === taskId);
  return task.counter_arguments[idx + 1];
};

const out = {};
for (const file of fs.readdirSync(CLUSTER_DIR).filter((f) => f.endsWith('.json')).sort()) {
  const themeId = file.replace('.json', '');
  const spec = JSON.parse(fs.readFileSync(path.join(CLUSTER_DIR, file), 'utf-8'));
  out[themeId] = spec.map((c, n) => {
    if (!c.acknowledge || !c.defend || !c.solve) throw new Error(`${themeId}: "${c.label}" has no A/D/S`);
    return {
      id: `${themeId}-${n + 1}`,
      label: c.label,
      examiner: objectionOf(c.rep),
      alsoAskedAs: c.members.filter((m) => m !== c.rep).map(objectionOf),
      acknowledge: c.acknowledge,
      defend: c.defend,
      solve: c.solve,
    };
  });
}

const outPath = path.join(ROOT, 'data/section_b_theme_strategy.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
const total = Object.values(out).reduce((n, list) => n + list.length, 0);
console.log(`Wrote ${outPath}: ${Object.keys(out).length} themes, ${total} concerns`);
