import type { Meta, StoryObj } from '@storybook/react';
import { QuestionCount } from './QuestionCount';

const meta: Meta<typeof QuestionCount> = {
  title: 'Results/QuestionCount',
  component: QuestionCount,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Shows correct answers out of total questions.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuestionCount>;

export const Default: Story = {
  args: {
    correct: 42,
    total: 50,
  },
};

export const Perfect: Story = {
  args: {
    correct: 50,
    total: 50,
  },
};

export const Low: Story = {
  args: {
    correct: 15,
    total: 50,
  },
};
