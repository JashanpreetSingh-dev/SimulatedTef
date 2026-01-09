import type { Meta, StoryObj } from '@storybook/react';
import { PracticeCard } from './PracticeCard';

const meta: Meta<typeof PracticeCard> = {
  title: 'Dashboard/PracticeCard',
  component: PracticeCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Dashboard card for accessing practice modules.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PracticeCard>;

export const Default: Story = {};
