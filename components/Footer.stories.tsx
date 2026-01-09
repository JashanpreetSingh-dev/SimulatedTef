import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'Core/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Site footer with navigation links, social media, and copyright.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

export const InPage: Story = {
  render: () => (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow p-8 bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Page content goes here...</p>
      </div>
      <Footer />
    </div>
  ),
};
