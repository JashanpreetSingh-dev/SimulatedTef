import type { Meta, StoryObj } from '@storybook/react';
import { LoadingResult } from './LoadingResult';

const meta: Meta<typeof LoadingResult> = {
  title: 'Core/LoadingResult',
  component: LoadingResult,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading indicator shown while evaluation results are being processed.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingResult>;

export const Default: Story = {};

export const InCard: Story = {
  render: () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md">
      <LoadingResult />
    </div>
  ),
};
