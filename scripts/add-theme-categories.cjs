/**
 * Adds themeCategory to all 4 speaking/writing JSON data files.
 * Run once: node scripts/add-theme-categories.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── Speaking A ─────────────────────────────────────────────────────────────
const speakingAMap = {
  1:'sports-outdoor', 2:'culture-arts', 3:'food-cooking', 4:'technology-digital',
  5:'education-learning', 6:'work-career', 7:'sports-outdoor', 8:'community-volunteering',
  9:'travel-tourism', 10:'sports-outdoor', 11:'culture-arts', 12:'culture-arts',
  13:'work-career', 14:'education-learning', 15:'environment-animals', 16:'food-cooking',
  17:'culture-arts', 18:'culture-arts', 19:'sports-outdoor', 20:'sports-outdoor',
  21:'sports-outdoor', 22:'culture-arts', 23:'culture-arts', 24:'work-career',
  25:'sports-outdoor', 26:'sports-outdoor', 27:'culture-arts', 28:'sports-outdoor',
  29:'environment-animals', 30:'sports-outdoor', 31:'environment-animals', 32:'work-career',
  33:'sports-outdoor', 34:'environment-animals', 35:'health-wellbeing', 36:'work-career',
  37:'travel-tourism', 38:'travel-tourism', 39:'food-cooking', 40:'culture-arts',
  41:'travel-tourism', 42:'culture-arts', 43:'work-career', 44:'environment-animals',
  45:'culture-arts', 46:'travel-tourism', 47:'work-career', 48:'education-learning',
  49:'sports-outdoor', 50:'work-career', 51:'culture-arts', 52:'travel-tourism',
  53:'culture-arts', 54:'sports-outdoor', 55:'culture-arts', 56:'culture-arts',
  57:'technology-digital', 58:'sports-outdoor', 59:'sports-outdoor', 60:'sports-outdoor',
  61:'sports-outdoor', 63:'sports-outdoor', 64:'travel-tourism', 65:'culture-arts',
  66:'sports-outdoor', 67:'sports-outdoor', 68:'environment-animals', 69:'environment-animals',
  70:'sports-outdoor', 71:'sports-outdoor', 72:'food-cooking', 73:'food-cooking',
  74:'travel-tourism', 75:'environment-animals', 76:'community-volunteering',
  77:'culture-arts', 78:'culture-arts',
};

// ── Speaking B ─────────────────────────────────────────────────────────────
const speakingBMap = {
  1:'sports-outdoor', 2:'community-volunteering', 3:'food-cooking', 4:'culture-arts',
  5:'health-wellbeing', 6:'community-volunteering', 7:'food-cooking', 8:'environment-animals',
  9:'community-volunteering', 10:'culture-arts', 11:'community-volunteering',
  12:'community-volunteering', 13:'community-volunteering', 14:'community-volunteering',
  15:'work-career', 16:'culture-arts', 17:'work-career', 18:'environment-animals',
  19:'health-wellbeing', 20:'work-career', 21:'community-volunteering', 22:'work-career',
  23:'food-cooking', 24:'culture-arts', 25:'technology-digital', 26:'sports-outdoor',
  27:'culture-arts', 28:'work-career', 29:'education-learning', 30:'health-wellbeing',
  31:'sports-outdoor', 32:'environment-animals', 33:'environment-animals', 34:'culture-arts',
  35:'culture-arts', 36:'travel-tourism', 37:'travel-tourism', 38:'travel-tourism',
  39:'community-volunteering', 40:'community-volunteering', 41:'food-cooking',
  42:'travel-tourism', 43:'culture-arts', 44:'culture-arts', 45:'education-learning',
  46:'travel-tourism', 47:'culture-arts', 48:'education-learning', 49:'environment-animals',
  50:'food-cooking', 51:'culture-arts', 52:'sports-outdoor', 53:'community-volunteering',
  54:'education-learning', 55:'environment-animals', 56:'food-cooking',
  57:'community-volunteering', 58:'culture-arts', 59:'culture-arts', 60:'sports-outdoor',
  61:'sports-outdoor', 62:'sports-outdoor', 63:'travel-tourism', 64:'health-wellbeing',
  65:'work-career', 66:'community-volunteering', 67:'culture-arts', 68:'travel-tourism',
  69:'community-volunteering', 70:'health-wellbeing', 71:'community-volunteering',
  72:'health-wellbeing', 73:'environment-animals', 74:'community-volunteering',
  75:'travel-tourism', 76:'community-volunteering', 77:'education-learning',
  78:'culture-arts', 79:'community-volunteering', 80:'culture-arts',
  81:'travel-tourism', 82:'environment-animals',
};

// ── Writing A ──────────────────────────────────────────────────────────────
const writingAMap = {
  A001:'family-relationships', A002:'work-career', A003:'culture-arts',
  A004:'work-career', A005:'family-relationships', A006:'technology-digital',
  A007:'work-career', A008:'culture-arts', A009:'environment-animals',
  A010:'education-learning', A011:'family-relationships', A012:'family-relationships',
  A013:'sports-outdoor', A014:'culture-arts', A015:'community-volunteering',
  A016:'environment-animals', A017:'family-relationships', A018:'family-relationships',
  A019:'family-relationships', A020:'family-relationships', A021:'work-career',
  A022:'community-volunteering', A023:'family-relationships', A024:'family-relationships',
  A025:'community-volunteering', A026:'work-career', A027:'community-volunteering',
  A028:'travel-tourism', A029:'travel-tourism', A030:'family-relationships',
  A031:'work-career', A032:'work-career', A033:'family-relationships',
  A034:'health-wellbeing', A035:'travel-tourism', A036:'work-career',
  A037:'work-career', A038:'community-volunteering', A039:'family-relationships',
  A040:'work-career', A041:'work-career', A042:'work-career',
  A043:'education-learning', A044:'culture-arts', A045:'community-volunteering',
  A046:'family-relationships', A047:'environment-animals', A048:'culture-arts',
  A049:'travel-tourism', A050:'family-relationships', A051:'culture-arts',
  A052:'family-relationships', A053:'family-relationships', A054:'environment-animals',
  A055:'technology-digital', A056:'travel-tourism', A057:'family-relationships',
  A058:'family-relationships', A059:'education-learning', A060:'travel-tourism',
  A061:'work-career', A062:'food-cooking',
};

// ── Writing B ──────────────────────────────────────────────────────────────
const writingBMap = {
  B001:'family-relationships', B002:'education-learning', B003:'family-relationships',
  B004:'family-relationships', B005:'health-wellbeing', B006:'health-wellbeing',
  B007:'technology-digital', B008:'education-learning', B009:'family-relationships',
  B010:'technology-digital', B011:'education-learning', B012:'education-learning',
  B013:'family-relationships', B014:'health-wellbeing', B015:'work-career',
  B016:'education-learning', B017:'environment-animals', B018:'health-wellbeing',
  B019:'family-relationships', B020:'work-career', B021:'work-career',
  B022:'education-learning', B023:'family-relationships', B024:'technology-digital',
  B025:'technology-digital', B026:'education-learning', B027:'environment-animals',
  B028:'education-learning', B029:'education-learning', B030:'sports-outdoor',
  B031:'education-learning', B032:'education-learning', B033:'family-relationships',
  B034:'technology-digital', B035:'family-relationships', B036:'family-relationships',
  B037:'technology-digital', B038:'culture-arts', B039:'technology-digital',
  B040:'culture-arts', B041:'environment-animals', B042:'health-wellbeing',
  B043:'work-career', B044:'work-career', B045:'environment-animals',
  B046:'technology-digital', B047:'education-learning', B048:'health-wellbeing',
  B049:'environment-animals', B050:'community-volunteering', B051:'environment-animals',
  B052:'family-relationships', B053:'technology-digital', B054:'family-relationships',
  B055:'work-career', B056:'education-learning', B057:'education-learning',
  B058:'work-career', B059:'education-learning', B060:'education-learning',
  B061:'health-wellbeing', B062:'environment-animals', B063:'education-learning',
  B064:'family-relationships',
};

function patchArray(arr, mapById) {
  return arr.map(item => {
    const cat = mapById[item.id];
    if (!cat) {
      console.warn(`No mapping for id=${item.id}`);
      return item;
    }
    return { ...item, themeCategory: cat };
  });
}

// ── Speaking A ─────────────────────────────────────────────────────────────
{
  const file = path.join(ROOT, 'data/section_a_knowledge_base.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const patched = patchArray(data, speakingAMap);
  fs.writeFileSync(file, JSON.stringify(patched, null, 2));
  console.log(`✓ section_a_knowledge_base.json — ${patched.length} topics tagged`);
}

// ── Speaking B ─────────────────────────────────────────────────────────────
{
  const file = path.join(ROOT, 'data/section_b_knowledge_base.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const patched = patchArray(data, speakingBMap);
  fs.writeFileSync(file, JSON.stringify(patched, null, 2));
  console.log(`✓ section_b_knowledge_base.json — ${patched.length} topics tagged`);
}

// ── Writing A ──────────────────────────────────────────────────────────────
{
  const file = path.join(ROOT, 'data/written_section_a_knowledge_base.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.topics = patchArray(data.topics, writingAMap);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`✓ written_section_a_knowledge_base.json — ${data.topics.length} topics tagged`);
}

// ── Writing B ──────────────────────────────────────────────────────────────
{
  const file = path.join(ROOT, 'data/written_section_b_knowledge_base.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.topics = patchArray(data.topics, writingBMap);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`✓ written_section_b_knowledge_base.json — ${data.topics.length} topics tagged`);
}

console.log('\nDone. All topics tagged with themeCategory.');
