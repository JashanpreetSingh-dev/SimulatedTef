import type { Meta, StoryObj } from '@storybook/react';
import { StrengthsWeaknesses } from './StrengthsWeaknesses';

const meta: Meta<typeof StrengthsWeaknesses> = {
  title: 'Results/StrengthsWeaknesses',
  component: StrengthsWeaknesses,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Lists of strengths and areas for improvement.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StrengthsWeaknesses>;

export const Default: Story = {
  args: {
    strengths: [
      'Vocabulaire riche et varié',
      'Bonne structure argumentative',
      'Prononciation claire',
    ],
    weaknesses: [
      'Quelques hésitations',
      'Erreurs de genre occasionnelles',
      'Temps verbaux à réviser',
    ],
  },
};

export const MostlyStrengths: Story = {
  args: {
    strengths: [
      'Expression fluide et naturelle',
      'Vocabulaire sophistiqué',
      'Excellente grammaire',
      'Arguments bien développés',
      'Prononciation quasi-native',
    ],
    weaknesses: [
      'Légères hésitations sur termes techniques',
    ],
  },
};
