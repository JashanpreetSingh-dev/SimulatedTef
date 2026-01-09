import type { Meta, StoryObj } from '@storybook/react';
import { ListeningExamNavigation } from './ListeningExamNavigation';

const meta: Meta<typeof ListeningExamNavigation> = {
  title: 'Listening/ListeningExamNavigation',
  component: ListeningExamNavigation,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Navigation controls for moving between listening exam questions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onPrevious: { action: 'previous clicked' },
    onNext: { action: 'next clicked' },
    onSubmit: { action: 'submit clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ListeningExamNavigation>;

export const Default: Story = {
  args: {
    currentQuestion: 5,
    totalQuestions: 40,
    canGoBack: true,
  },
};

export const FirstQuestion: Story = {
  args: {
    currentQuestion: 1,
    totalQuestions: 40,
    canGoBack: false,
  },
};

export const LastQuestion: Story = {
  args: {
    currentQuestion: 40,
    totalQuestions: 40,
    canGoBack: true,
    isLast: true,
  },
};
