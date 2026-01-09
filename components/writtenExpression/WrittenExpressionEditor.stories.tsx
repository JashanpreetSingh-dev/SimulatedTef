import type { Meta, StoryObj } from '@storybook/react';
import { WrittenExpressionEditor } from './WrittenExpressionEditor';

const meta: Meta<typeof WrittenExpressionEditor> = {
  title: 'WrittenExpression/WrittenExpressionEditor',
  component: WrittenExpressionEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Text editor for written expression with character count and French accent bar.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'text changed' },
  },
};

export default meta;
type Story = StoryObj<typeof WrittenExpressionEditor>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Commencez à écrire votre réponse ici...',
    minWords: 80,
    maxWords: 120,
  },
};

export const WithContent: Story = {
  args: {
    value: 'Cher Monsieur,\n\nJe vous écris pour vous informer de ma situation actuelle. Suite à notre conversation téléphonique, je souhaite confirmer ma participation à la réunion prévue le 15 janvier prochain.\n\nCordialement,\nMarie Dupont',
    minWords: 80,
    maxWords: 200,
  },
};

export const AtWordLimit: Story = {
  args: {
    value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. '.repeat(3),
    minWords: 50,
    maxWords: 100,
  },
};
