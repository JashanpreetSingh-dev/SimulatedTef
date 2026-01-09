import type { Meta, StoryObj } from '@storybook/react';
import { ExamCard } from './ExamCard';

const meta: Meta<typeof ExamCard> = {
  title: 'Practice/ExamCard',
  component: ExamCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Card component for displaying exam module options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ExamCard>;

export const Reading: Story = {
  args: {
    title: 'Compréhension écrite',
    description: 'Testez votre compréhension de textes en français.',
    icon: '📖',
    duration: '60 minutes',
  },
};

export const Listening: Story = {
  args: {
    title: 'Compréhension orale',
    description: 'Écoutez des enregistrements et répondez aux questions.',
    icon: '🎧',
    duration: '40 minutes',
  },
};

export const OralExpression: Story = {
  args: {
    title: 'Expression orale',
    description: 'Pratiquez votre expression orale avec l\'IA.',
    icon: '🎤',
    duration: '15 minutes',
  },
};

export const WrittenExpression: Story = {
  args: {
    title: 'Expression écrite',
    description: 'Rédigez des textes et recevez des évaluations.',
    icon: '✍️',
    duration: '60 minutes',
  },
};

export const Disabled: Story = {
  args: {
    title: 'Module verrouillé',
    description: 'Ce module n\'est pas encore disponible.',
    icon: '🔒',
    disabled: true,
  },
};
