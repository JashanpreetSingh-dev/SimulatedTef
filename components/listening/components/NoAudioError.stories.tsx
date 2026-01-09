import type { Meta, StoryObj } from '@storybook/react';
import { NoAudioError } from './NoAudioError';

const meta: Meta<typeof NoAudioError> = {
  title: 'Listening/NoAudioError',
  component: NoAudioError,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Error message shown when audio fails to load.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof NoAudioError>;

export const Default: Story = {};

export const WithRetry: Story = {
  args: {
    showRetry: true,
  },
};
