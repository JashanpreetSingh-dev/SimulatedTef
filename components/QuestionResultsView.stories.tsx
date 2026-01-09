import type { Meta, StoryObj } from '@storybook/react';
import { QuestionResultsView } from './QuestionResultsView';
import { sampleQuestionSet, answeredCorrectQuestion, answeredIncorrectQuestion } from '../__fixtures__/mcqQuestions';

const meta: Meta<typeof QuestionResultsView> = {
  title: 'Results/QuestionResultsView',
  component: QuestionResultsView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Shows the results of MCQ questions with correct/incorrect indicators.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuestionResultsView>;

const answeredQuestions = sampleQuestionSet.map((q, idx) => ({
  ...q,
  userAnswer: idx % 2 === 0 ? q.correctAnswer : (q.correctAnswer! + 1) % 4,
  explanation: `Explication pour la question ${idx + 1}.`,
}));

export const Default: Story = {
  args: {
    questions: answeredQuestions,
    title: 'Résultats - Compréhension écrite',
  },
};

export const AllCorrect: Story = {
  args: {
    questions: sampleQuestionSet.map(q => ({
      ...q,
      userAnswer: q.correctAnswer,
      explanation: 'Bonne réponse!',
    })),
    title: 'Résultats - Tous corrects',
  },
};

export const AllIncorrect: Story = {
  args: {
    questions: sampleQuestionSet.map(q => ({
      ...q,
      userAnswer: (q.correctAnswer! + 1) % 4,
      explanation: 'Réponse incorrecte.',
    })),
    title: 'Résultats - Tous incorrects',
  },
};
