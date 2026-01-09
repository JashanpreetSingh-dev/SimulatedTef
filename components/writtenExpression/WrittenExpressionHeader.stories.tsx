import type { Meta, StoryObj } from '@storybook/react';
import { WrittenExpressionHeader } from './WrittenExpressionHeader';

const meta: Meta<typeof WrittenExpressionHeader> = {
  title: 'WrittenExpression/WrittenExpressionHeader',
  component: WrittenExpressionHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Header showing timer and instructions for written expression exam.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WrittenExpressionHeader>;

export const Default: Story = {
  args: {
    timeRemaining: 3600, // 60 minutes
    section: 'Section A',
  },
};

export const LowTime: Story = {
  args: {
    timeRemaining: 300, // 5 minutes
    section: 'Section B',
  },
};

export const CriticalTime: Story = {
  args: {
    timeRemaining: 60, // 1 minute
    section: 'Section B',
  },
};
