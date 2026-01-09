import type { Meta, StoryObj } from '@storybook/react';
import { EnterpriseCTA } from './EnterpriseCTA';

const meta: Meta<typeof EnterpriseCTA> = {
  title: 'Marketing/EnterpriseCTA',
  component: EnterpriseCTA,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Call-to-action section for enterprise customers.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EnterpriseCTA>;

export const Default: Story = {};
