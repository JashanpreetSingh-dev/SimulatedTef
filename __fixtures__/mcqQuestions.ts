import type { MCQQuestionData } from '../components/MCQQuestion';

export const sampleMCQQuestion: MCQQuestionData = {
  questionId: 'q1',
  question: 'Quelle est la capitale du Canada?',
  options: ['Toronto', 'Ottawa', 'Montréal', 'Vancouver'],
  correctAnswer: 1,
};

export const sampleMCQQuestionWithPassage: MCQQuestionData = {
  questionId: 'q2',
  question: "D'après le texte, quelle est la principale raison de la migration des oiseaux?",
  questionText: "Les oiseaux migrent pour plusieurs raisons. La principale est la recherche de nourriture. En hiver, les insectes et les graines deviennent rares dans les régions froides. Les oiseaux doivent donc se déplacer vers des régions plus chaudes où la nourriture est abondante.",
  options: [
    'Le changement de température',
    'La recherche de nourriture',
    'La reproduction',
    'La protection contre les prédateurs'
  ],
  correctAnswer: 1,
};

export const answeredCorrectQuestion: MCQQuestionData = {
  ...sampleMCQQuestion,
  userAnswer: 1,
  explanation: 'Ottawa est la capitale du Canada depuis 1857.',
};

export const answeredIncorrectQuestion: MCQQuestionData = {
  ...sampleMCQQuestion,
  userAnswer: 0,
  explanation: 'Ottawa est la capitale du Canada, pas Toronto.',
};

export const sampleQuestionSet: MCQQuestionData[] = [
  {
    questionId: 'q1',
    question: 'Quel est le plus grand lac entièrement situé au Canada?',
    options: ['Lac Supérieur', 'Grand lac de l\'Ours', 'Lac Huron', 'Lac Ontario'],
    correctAnswer: 1,
  },
  {
    questionId: 'q2',
    question: 'Quelle province canadienne est la plus peuplée?',
    options: ['Québec', 'Colombie-Britannique', 'Ontario', 'Alberta'],
    correctAnswer: 2,
  },
  {
    questionId: 'q3',
    question: 'En quelle année le Canada est-il devenu un pays?',
    options: ['1759', '1867', '1931', '1982'],
    correctAnswer: 1,
  },
];
