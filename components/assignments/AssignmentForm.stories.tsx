import type { Meta, StoryObj } from '@storybook/react';
import { AssignmentForm } from './AssignmentForm';

const meta: Meta<typeof AssignmentForm> = {
  title: 'Assignments/AssignmentForm',
  component: AssignmentForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form for creating and editing assignments (professor view).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof AssignmentForm>;

export const CreateNew: Story = {
  args: {
    mode: 'create',
  },
};

export const EditExisting: Story = {
  args: {
    mode: 'edit',
    initialData: {
      title: 'La culture québécoise',
      type: 'reading',
      prompt: 'Lisez le texte suivant et répondez aux questions.',
      settings: {
        numberOfQuestions: 10,
        timeLimitMinutes: 30,
      },
    },
  },
};

export const ListeningType: Story = {
  args: {
    mode: 'create',
    defaultType: 'listening',
  },
};
