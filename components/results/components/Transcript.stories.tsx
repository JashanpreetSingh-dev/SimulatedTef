import type { Meta, StoryObj } from '@storybook/react';
import { Transcript } from './Transcript';

const meta: Meta<typeof Transcript> = {
  title: 'Results/Transcript',
  component: Transcript,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays the transcript of oral expression with annotations.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Transcript>;

export const Default: Story = {
  args: {
    transcript: 'Bonjour, je voudrais parler de l\'importance de l\'éducation dans notre société moderne. Premièrement, l\'éducation permet aux individus de développer leurs compétences et leurs connaissances. Deuxièmement, elle contribue au progrès social et économique de notre pays.',
  },
};

export const WithAnnotations: Story = {
  args: {
    transcript: 'Bonjour, je voudrais parler de l\'importance de l\'éducation dans notre société moderne.',
    annotations: [
      { start: 0, end: 7, type: 'good', comment: 'Bon début' },
      { start: 45, end: 54, type: 'error', comment: 'Prononciation à améliorer' },
    ],
  },
};

export const Long: Story = {
  args: {
    transcript: `Bonjour à tous. Aujourd'hui, je vais vous présenter mon point de vue sur un sujet important: l'impact de la technologie sur notre vie quotidienne.

Tout d'abord, je pense que la technologie a transformé notre façon de communiquer. Grâce aux smartphones et aux réseaux sociaux, nous pouvons rester en contact avec nos proches même à distance.

Cependant, il y a aussi des aspects négatifs. Par exemple, l'utilisation excessive des écrans peut affecter notre santé mentale et physique.

En conclusion, je crois qu'il est important de trouver un équilibre entre l'utilisation de la technologie et les activités traditionnelles.`,
  },
};
