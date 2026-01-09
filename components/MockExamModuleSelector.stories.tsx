import type { Meta, StoryObj } from '@storybook/react';
import { MockExamModuleSelector } from './MockExamModuleSelector';

const meta: Meta<typeof MockExamModuleSelector> = {
  title: 'Exam/MockExamModuleSelector',
  component: MockExamModuleSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Module selector for choosing which part of the mock exam to take.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSelectModule: { action: 'module selected' },
    onBack: { action: 'back clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof MockExamModuleSelector>;

export const Default: Story = {
  args: {
    mockExamId: 'mock_exam_1',
    mockExamTitle: 'TEF Canada - Examen Blanc 1',
  },
};

export const WithCompletedModules: Story = {
  args: {
    mockExamId: 'mock_exam_1',
    mockExamTitle: 'TEF Canada - Examen Blanc 1',
    completedModules: ['reading', 'listening'],
  },
};

export const AllComplete: Story = {
  args: {
    mockExamId: 'mock_exam_1',
    mockExamTitle: 'TEF Canada - Examen Blanc 1',
    completedModules: ['reading', 'listening', 'oralExpression', 'writtenExpression'],
  },
};
