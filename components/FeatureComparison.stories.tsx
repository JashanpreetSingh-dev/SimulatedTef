import type { Meta, StoryObj } from '@storybook/react';
import { FeatureComparison } from './FeatureComparison';

const meta: Meta<typeof FeatureComparison> = {
  title: 'Marketing/FeatureComparison',
  component: FeatureComparison,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Feature comparison table showing different plan tiers.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FeatureComparison>;

export const Default: Story = {};
