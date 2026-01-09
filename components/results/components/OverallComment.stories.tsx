import type { Meta, StoryObj } from '@storybook/react';
import { OverallComment } from './OverallComment';

const meta: Meta<typeof OverallComment> = {
  title: 'Results/OverallComment',
  component: OverallComment,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Overall feedback comment from the AI evaluator.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OverallComment>;

export const Default: Story = {
  args: {
    comment: 'Excellente performance globale! Votre expression est claire et bien structurée. Continuez à pratiquer pour améliorer la fluidité et réduire les hésitations.',
  },
};

export const LongComment: Story = {
  args: {
    comment: 'Très bonne prestation dans l\'ensemble. Votre vocabulaire est varié et approprié au contexte. La structure de votre réponse est logique et facile à suivre. Quelques points à améliorer: travaillez sur la prononciation de certains sons français comme le "r" et le "u". Essayez également de réduire les pauses de réflexion en préparant mentalement votre réponse avant de commencer à parler. La pratique régulière avec des locuteurs natifs vous aidera à gagner en confiance et en fluidité.',
  },
};
