import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { FrenchAccentBar } from './FrenchAccentBar';

const meta: Meta<typeof FrenchAccentBar> = {
  title: 'WrittenExpression/FrenchAccentBar',
  component: FrenchAccentBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toolbar with French special characters (accents, cedilla, etc.) for easy input.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onCharacterClick: { action: 'character clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof FrenchAccentBar>;

export const Default: Story = {};

export const InEditor: Story = {
  render: (args) => (
    <div className="w-full max-w-2xl">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <FrenchAccentBar {...args} />
        <textarea 
          className="w-full h-32 mt-2 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          placeholder="Écrivez votre texte ici..."
        />
      </div>
    </div>
  ),
};

// Interaction test: clicking accent characters
export const ClickingAccent: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Find and click the é character button
    const accentButton = canvas.getByText('é');
    await userEvent.click(accentButton);
    
    // Verify callback was called
    await expect(args.onCharacterClick).toHaveBeenCalledWith('é');
  },
};
