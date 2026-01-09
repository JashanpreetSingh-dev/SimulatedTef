import type { Meta, StoryObj } from '@storybook/react';
import { PricingSection } from './PricingSection';

const meta: Meta<typeof PricingSection> = {
  title: 'Marketing/PricingSection',
  component: PricingSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Pricing cards section showing subscription tiers.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PricingSection>;

export const Default: Story = {};
