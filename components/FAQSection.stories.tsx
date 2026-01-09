import type { Meta, StoryObj } from '@storybook/react';
import { FAQSection } from './FAQSection';

const meta: Meta<typeof FAQSection> = {
  title: 'Marketing/FAQSection',
  component: FAQSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Frequently asked questions accordion section for the landing page.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FAQSection>;

export const Default: Story = {};
