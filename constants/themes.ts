export type ThemeId =
  | 'sports-outdoor'
  | 'food-cooking'
  | 'travel-tourism'
  | 'culture-arts'
  | 'technology-digital'
  | 'environment-animals'
  | 'work-career'
  | 'health-wellbeing'
  | 'education-learning'
  | 'community-volunteering'
  | 'family-relationships';

export interface Theme {
  id: ThemeId;
  label: string;
  icon: string;
  color: string; // Tailwind bg class (light)
  darkColor: string; // Tailwind bg class (dark)
  borderColor: string;
  textColor: string;
  coreVocab: string[]; // 4–5 key French words for this theme
}

export const THEMES: Theme[] = [
  {
    id: 'sports-outdoor',
    label: 'Sports & Outdoor Activities',
    icon: '🏅',
    color: 'bg-orange-50',
    darkColor: 'dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300',
    coreVocab: ["s'inscrire", 'le forfait', "l'équipement", 'pratiquer', 'le niveau'],
  },
  {
    id: 'food-cooking',
    label: 'Food & Cooking',
    icon: '🍽️',
    color: 'bg-amber-50',
    darkColor: 'dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    coreVocab: ['cuisiner', 'les recettes', 'déguster', 'les ingrédients', 'un atelier'],
  },
  {
    id: 'travel-tourism',
    label: 'Travel & Tourism',
    icon: '✈️',
    color: 'bg-sky-50',
    darkColor: 'dark:bg-sky-900/20',
    borderColor: 'border-sky-200 dark:border-sky-800',
    textColor: 'text-sky-700 dark:text-sky-300',
    coreVocab: ['réserver', "l'hébergement", 'un séjour', 'une excursion', 'le forfait'],
  },
  {
    id: 'culture-arts',
    label: 'Culture, Arts & Entertainment',
    icon: '🎭',
    color: 'bg-purple-50',
    darkColor: 'dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
    coreVocab: ['assister à', 'le spectacle', 'une exposition', "l'artiste", 'la création'],
  },
  {
    id: 'technology-digital',
    label: 'Technology & Digital Life',
    icon: '💻',
    color: 'bg-blue-50',
    darkColor: 'dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    coreVocab: ['le numérique', 'les réseaux sociaux', 'une application', 'les données', "l'écran"],
  },
  {
    id: 'environment-animals',
    label: 'Environment, Ecology & Animals',
    icon: '🌿',
    color: 'bg-green-50',
    darkColor: 'dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
    coreVocab: ['la pollution', 'le développement durable', 'les espèces', 'recycler', "l'écosystème"],
  },
  {
    id: 'work-career',
    label: 'Work, Career & Economy',
    icon: '💼',
    color: 'bg-slate-50',
    darkColor: 'dark:bg-slate-800/40',
    borderColor: 'border-slate-200 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    coreVocab: ["l'emploi", 'les compétences', "l'expérience", 'le salaire', 'le contrat'],
  },
  {
    id: 'health-wellbeing',
    label: 'Health & Wellbeing',
    icon: '❤️',
    color: 'bg-rose-50',
    darkColor: 'dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
    coreVocab: ['la santé', 'les soins', 'le bien-être', 'le traitement', 'le stress'],
  },
  {
    id: 'education-learning',
    label: 'Education & Learning',
    icon: '📚',
    color: 'bg-indigo-50',
    darkColor: 'dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    coreVocab: ["l'école", 'apprendre', 'le diplôme', 'les élèves', "l'enseignement"],
  },
  {
    id: 'community-volunteering',
    label: 'Community & Volunteering',
    icon: '🤝',
    color: 'bg-teal-50',
    darkColor: 'dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
    coreVocab: ['le bénévolat', "s'engager", "l'association", 'la solidarité', 'aider'],
  },
  {
    id: 'family-relationships',
    label: 'Family, Relationships & Society',
    icon: '👨‍👩‍👧',
    color: 'bg-pink-50',
    darkColor: 'dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    textColor: 'text-pink-700 dark:text-pink-300',
    coreVocab: ['la famille', "l'indépendance", 'les valeurs', 'les générations', 'les relations'],
  },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t])) as Record<ThemeId, Theme>;
