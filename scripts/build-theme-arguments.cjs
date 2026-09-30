/**
 * Builds a per-theme Section B argument sheet from hand-made cluster specs.
 *
 * Spec:   docs/section-b-arguments-by-theme/clusters/<themeId>.json
 *         [{ "label": "Cost", "rep": "7.0", "members": ["7.0", "41.6"] }, ...]
 *         ids are "<taskId>.<objectionIndex>" (index into counter_arguments minus the header line)
 * Output: docs/section-b-arguments-by-theme/<themeId>.md
 * Run:    node scripts/build-theme-arguments.cjs <themeId>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs/section-b-arguments-by-theme');
const tasks = require(path.join(ROOT, 'data/section_b_knowledge_base.json'));

const themeId = process.argv[2];
if (!themeId) {
  console.error('Usage: node scripts/build-theme-arguments.cjs <themeId>');
  process.exit(1);
}

const specPath = path.join(OUT_DIR, 'clusters', `${themeId}.json`);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
const themeTasks = tasks.filter((t) => t.themeCategory === themeId);
if (!themeTasks.length) {
  console.error(`No tasks with themeCategory "${themeId}"`);
  process.exit(1);
}

const pairs = new Map();
for (const t of themeTasks) {
  t.suggested_counters.forEach((counter, i) => {
    pairs.set(`${t.id}.${i}`, { task: t, objection: t.counter_arguments[i + 1], counter });
  });
}

const seen = new Map();
for (const c of spec) {
  if (!c.members.includes(c.rep)) throw new Error(`rep ${c.rep} not in members of "${c.label}"`);
  for (const a of c.alts || []) {
    if (!c.members.includes(a) || a === c.rep) throw new Error(`bad alt ${a} in "${c.label}"`);
  }
  for (const m of c.members) {
    if (!pairs.has(m)) throw new Error(`Unknown id ${m} in "${c.label}"`);
    if (seen.has(m)) throw new Error(`${m} assigned twice ("${seen.get(m)}" and "${c.label}")`);
    seen.set(m, c.label);
  }
}
const missing = [...pairs.keys()].filter((k) => !seen.has(k));
if (missing.length) throw new Error(`Unassigned objections: ${missing.join(', ')}`);

const lines = [];
lines.push(`# Section B arguments — ${themeId}`, '');
lines.push(
  `${themeTasks.length} topics, ${pairs.size} examiner objections, ${spec.length} unique objections. ` +
    `Each block is a broad concern: the main examiner objection, the other phrasings/topics grouped under it, then an existing Acknowledge / Defend / Solve response. ` +
      `Responses are written for one topic, so adapt the details to whichever topic you get; an "Alternative" is included where one response can't cover every variant.`,
  ''
);
lines.push('Topics in this theme: ' + themeTasks.map((t) => `#${t.id} ${t.theme}`).join(' · '), '', '---', '');

spec.forEach((c, n) => {
  const rep = pairs.get(c.rep);
  lines.push(`## ${n + 1}. ${c.label}`, '');
  lines.push(`**Examiner:** ${rep.objection}`, '');
  const others = c.members.filter((m) => m !== c.rep);
  if (others.length) {
    lines.push('*Also asked as:*');
    for (const m of others) {
      const p = pairs.get(m);
      lines.push(`- ${p.objection} (#${p.task.id} ${p.task.theme})`);
    }
    lines.push('');
  }
  const rewritten = Boolean(c.acknowledge);
  const ads = rewritten ? c : rep.counter;
  lines.push(`**A:** ${ads.acknowledge}`, '');
  lines.push(`**D:** ${ads.defend}`, '');
  lines.push(`**S:** ${ads.solve}`, '');
  if (rewritten) {
    const words = `${ads.acknowledge} ${ads.defend} ${ads.solve}`.split(/\s+/).length;
    lines.push(`*${words} mots*`, '');
    console.log(`${String(n + 1).padStart(2)}. ${c.label}: ${words} words`);
  } else {
    lines.push(`*Response from #${rep.task.id} ${rep.task.theme}*`, '');
  }
  for (const a of rewritten ? [] : c.alts || []) {
    const p = pairs.get(a);
    lines.push(`**Alternative — if it comes as:** ${p.objection} (#${p.task.id} ${p.task.theme})`, '');
    lines.push(`**A:** ${p.counter.acknowledge}`, '');
    lines.push(`**D:** ${p.counter.defend}`, '');
    lines.push(`**S:** ${p.counter.solve}`, '');
  }
  lines.push('---', '');
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, `${themeId}.md`);
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath} (${spec.length} clusters from ${pairs.size} objections)`);
