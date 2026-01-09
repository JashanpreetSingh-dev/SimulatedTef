import type { Meta, StoryObj } from '@storybook/react';
import { ListeningExamHeader } from './ListeningExamHeader';

const meta: Meta<typeof ListeningExamHeader> = {
  title: 'Listening/ListeningExamHeader',
  component: ListeningExamHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Header showing timer and progress for listening exam.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ListeningExamHeader>;

export const Default: Story = {
  args: {
    timeRemaining: 2400, // 40 minutes
    currentQuestion: 5,
    totalQuestions: 40,
  },
};

export const LowTime: Story = {
  args: {
    timeRemaining: 300, // 5 minutes
    currentQuestion: 35,
    totalQuestions: 40,
  },
};
