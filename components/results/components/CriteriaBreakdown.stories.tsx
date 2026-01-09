import type { Meta, StoryObj } from '@storybook/react';
import { CriteriaBreakdown } from './CriteriaBreakdown';

const meta: Meta<typeof CriteriaBreakdown> = {
  title: 'Results/CriteriaBreakdown',
  component: CriteriaBreakdown,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Breakdown of scores by evaluation criteria.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CriteriaBreakdown>;

export const Default: Story = {
  args: {
    criteria: {
      pronunciation: { score: 4, maxScore: 5, comment: 'Clear pronunciation' },
      vocabulary: { score: 4, maxScore: 5, comment: 'Rich vocabulary' },
      grammar: { score: 3, maxScore: 5, comment: 'Minor errors' },
      fluency: { score: 4, maxScore: 5, comment: 'Natural flow' },
      coherence: { score: 4, maxScore: 5, comment: 'Well organized' },
    },
  },
};

export const LowScores: Story = {
  args: {
    criteria: {
      pronunciation: { score: 2, maxScore: 5, comment: 'Needs improvement' },
      vocabulary: { score: 2, maxScore: 5, comment: 'Limited vocabulary' },
      grammar: { score: 2, maxScore: 5, comment: 'Frequent errors' },
      fluency: { score: 2, maxScore: 5, comment: 'Many hesitations' },
      coherence: { score: 2, maxScore: 5, comment: 'Disorganized' },
    },
  },
};
