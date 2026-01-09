import type { Meta, StoryObj } from '@storybook/react';
import { ResultHeader } from './ResultHeader';

const meta: Meta<typeof ResultHeader> = {
  title: 'Results/ResultHeader',
  component: ResultHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Header showing overall score and level achieved.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResultHeader>;

export const Default: Story = {
  args: {
    title: 'Expression Orale',
    totalScore: 285,
    maxScore: 450,
    levelAchieved: 'B2',
  },
};

export const HighScore: Story = {
  args: {
    title: 'Compréhension écrite',
    totalScore: 420,
    maxScore: 450,
    levelAchieved: 'C1',
  },
};

export const LowScore: Story = {
  args: {
    title: 'Compréhension orale',
    totalScore: 150,
    maxScore: 450,
    levelAchieved: 'A2',
  },
};
