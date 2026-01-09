import type { Meta, StoryObj } from '@storybook/react';
import { StepIndicator } from './StepIndicator';

const meta: Meta<typeof StepIndicator> = {
  title: 'WrittenExpression/StepIndicator',
  component: StepIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Progress indicator showing current step in multi-step written expression exam.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

export const Step1: Story = {
  args: {
    currentStep: 1,
    totalSteps: 2,
    stepLabels: ['Section A', 'Section B'],
  },
};

export const Step2: Story = {
  args: {
    currentStep: 2,
    totalSteps: 2,
    stepLabels: ['Section A', 'Section B'],
  },
};

export const ThreeSteps: Story = {
  args: {
    currentStep: 2,
    totalSteps: 3,
    stepLabels: ['Préparation', 'Rédaction', 'Révision'],
  },
};
