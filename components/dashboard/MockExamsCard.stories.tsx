import type { Meta, StoryObj } from '@storybook/react';
import { MockExamsCard } from './MockExamsCard';

const meta: Meta<typeof MockExamsCard> = {
  title: 'Dashboard/MockExamsCard',
  component: MockExamsCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Dashboard card showing available mock exams.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MockExamsCard>;

export const Default: Story = {};
