export interface WarmupTopic {
  id: string;
  label: string;
  difficulty: 'easy' | 'medium';
  theme: string;
}

export const WARMUP_TOPICS: WarmupTopic[] = [
  // Easy — Vie quotidienne
  { id: 'se-presenter', label: 'Se présenter', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'routine-quotidienne', label: 'Ma routine quotidienne', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'famille', label: 'La famille', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'logement', label: 'Mon logement', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'repas-cuisine', label: 'Les repas et la cuisine', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'loisirs', label: 'Mes loisirs et passions', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'animaux', label: 'Les animaux de compagnie', difficulty: 'easy', theme: 'Vie quotidienne' },
  { id: 'amis', label: 'Les amis et la vie sociale', difficulty: 'easy', theme: 'Vie quotidienne' },

  // Easy — Achats & Transports
  { id: 'achats-commerces', label: 'Les achats et les commerces', difficulty: 'easy', theme: 'Achats & Transports' },
  { id: 'transports', label: 'Les transports en commun', difficulty: 'easy', theme: 'Achats & Transports' },
  { id: 'meteo-saisons', label: 'La météo et les saisons', difficulty: 'easy', theme: 'Achats & Transports' },

  // Medium — Travail & Études
  { id: 'travail-ambitions', label: 'Le travail et les ambitions', difficulty: 'medium', theme: 'Travail & Études' },
  { id: 'etudes-formation', label: 'Les études et la formation', difficulty: 'medium', theme: 'Travail & Études' },
  { id: 'recherche-emploi', label: 'La recherche d\'emploi', difficulty: 'medium', theme: 'Travail & Études' },
  { id: 'vie-bureau', label: 'La vie au bureau', difficulty: 'medium', theme: 'Travail & Études' },

  // Medium — Canada & Immigration
  { id: 'immigration-integration', label: 'L\'immigration et l\'intégration', difficulty: 'medium', theme: 'Canada & Immigration' },
  { id: 'logement-canada', label: 'Se loger au Canada', difficulty: 'medium', theme: 'Canada & Immigration' },
  { id: 'systeme-sante-canada', label: 'Le système de santé canadien', difficulty: 'medium', theme: 'Canada & Immigration' },
  { id: 'culture-canadienne', label: 'La culture et les traditions canadiennes', difficulty: 'medium', theme: 'Canada & Immigration' },

  // Medium — Société & Environnement
  { id: 'environnement-ecologie', label: 'L\'environnement et l\'écologie', difficulty: 'medium', theme: 'Société & Environnement' },
  { id: 'vie-ville-campagne', label: 'Vie en ville vs à la campagne', difficulty: 'medium', theme: 'Société & Environnement' },
  { id: 'benevolat', label: 'Le bénévolat et l\'engagement', difficulty: 'medium', theme: 'Société & Environnement' },
  { id: 'medias-reseaux-sociaux', label: 'Les médias et les réseaux sociaux', difficulty: 'medium', theme: 'Société & Environnement' },
  { id: 'education-enfants', label: 'L\'éducation des enfants', difficulty: 'medium', theme: 'Société & Environnement' },

  // Medium — Santé & Bien-être
  { id: 'sante-habitudes', label: 'La santé et les habitudes de vie', difficulty: 'medium', theme: 'Santé & Bien-être' },
  { id: 'sport-activites', label: 'Le sport et les activités physiques', difficulty: 'medium', theme: 'Santé & Bien-être' },
  { id: 'bien-etre-stress', label: 'Le bien-être et la gestion du stress', difficulty: 'medium', theme: 'Santé & Bien-être' },

  // Medium — Voyages & Culture
  { id: 'voyages-destinations', label: 'Les voyages et les destinations', difficulty: 'medium', theme: 'Voyages & Culture' },
  { id: 'technologie-quotidien', label: 'La technologie au quotidien', difficulty: 'medium', theme: 'Voyages & Culture' },
  { id: 'argent-budget', label: 'L\'argent et le budget', difficulty: 'medium', theme: 'Voyages & Culture' },
];
