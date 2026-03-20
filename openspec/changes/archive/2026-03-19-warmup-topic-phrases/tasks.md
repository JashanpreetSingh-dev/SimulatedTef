## 1. Topic constant — add phrases field

- [x] 1.1 Add `phrases: string[]` to the `WarmupTopic` interface in `constants/warmupTopics.ts`
- [x] 1.2 Write phrases for all 11 Easy topics (se-presenter, routine-quotidienne, famille, logement, repas-cuisine, loisirs, animaux, amis, achats-commerces, transports, meteo-saisons) — 5–7 sentence starters each
- [x] 1.3 Write phrases for all 19 Medium topics (travail-ambitions, etudes-formation, recherche-emploi, vie-bureau, immigration-integration, logement-canada, systeme-sante-canada, culture-canadienne, environnement-ecologie, vie-ville-campagne, benevolat, medias-reseaux-sociaux, education-enfants, sante-habitudes, sport-activites, bien-etre-stress, voyages-destinations, technologie-quotidien, argent-budget) — 5–7 each

## 2. Server — remove Gemini keyword generation

- [x] 2.1 Add `TOPIC_PHRASES: Record<string, string[]>` static map to `server/services/warmupService.ts` (mirrors the client constant)
- [x] 2.2 Remove the `generateKeywords()` method from `warmupService.ts`
- [x] 2.3 Update the `/api/warmup/config` route in `server/routes/warmup.ts`: accept `topicId` query param, look up `TOPIC_PHRASES[topicId] ?? []`, return `phrases` instead of `keywords`

## 3. Frontend types and plumbing

- [x] 3.1 Rename `keywords` → `phrases` in `WarmupConfigResponse` type in `services/warmupService.ts`
- [x] 3.2 Update `warmupService.getConfig()` return handling: field is now `phrases`
- [x] 3.3 Update `WarmupDashboard` `onStart` prop interface in `components/warmup/WarmupDashboard.tsx`: `keywords` → `phrases`
- [x] 3.4 Update `WarmupDashboard.handleStartClick`: pass `phrases` from config to `onStart`
- [x] 3.5 Update `pages/WarmupView.tsx`: rename `keywords` → `phrases` in `sessionConfig` state type and pass `phrases` to `WarmupSession`

## 4. Session UI — vertical phrase list

- [x] 4.1 Update `WarmupSession` props: `keywords: string[]` → `phrases: string[]`
- [x] 4.2 Replace the horizontal chip `flex flex-wrap gap-2` row with a vertically scrollable "Phrases utiles" list: `max-h-36 overflow-y-auto`, each phrase on its own row with a subtle amber left-border accent, text `text-sm text-slate-700 dark:text-slate-200`
- [x] 4.3 Hide the phrase list entirely when `phrases` is empty or the array has 0 entries
