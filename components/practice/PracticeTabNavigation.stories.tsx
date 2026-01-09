import type { Meta, StoryObj } from '@storybook/react';
import { PracticeTabNavigation } from './PracticeTabNavigation';

const meta: Meta<typeof PracticeTabNavigation> = {
  title: 'Practice/PracticeTabNavigation',
  component: PracticeTabNavigation,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tab navigation for switching between practice modules.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab changed' },
  },
};

export default meta;
type Story = StoryObj<typeof PracticeTabNavigation>;

export const Default: Story = {
  args: {
    activeTab: 'oralExpression',
  },
};

export const WrittenExpression: Story = {
  args: {
    activeTab: 'writtenExpression',
  },
};

export const Reading: Story = {
  args: {
    activeTab: 'reading',
  },
};

export const Listening: Story = {
  args: {
    activeTab: 'listening',
  },
};
