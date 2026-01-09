import type { Meta, StoryObj } from '@storybook/react';
import { ExamWarningModal } from './ExamWarningModal';

const meta: Meta<typeof ExamWarningModal> = {
  title: 'Core/ExamWarningModal',
  component: ExamWarningModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Warning modal shown before starting an exam to confirm user is ready.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof ExamWarningModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Commencer l\'examen',
    message: 'Êtes-vous prêt à commencer? Une fois l\'examen démarré, le chronomètre ne peut pas être arrêté.',
  },
};

export const OralExpression: Story = {
  args: {
    isOpen: true,
    title: 'Expression Orale',
    message: 'Assurez-vous que votre microphone fonctionne correctement. Vous aurez 15 minutes pour compléter cette section.',
  },
};

export const TimedExam: Story = {
  args: {
    isOpen: true,
    title: 'Examen chronométré',
    message: 'Cet examen est chronométré. Vous aurez 60 minutes pour répondre à toutes les questions. Le temps restant sera affiché en haut de l\'écran.',
  },
};
