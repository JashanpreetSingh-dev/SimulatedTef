import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { MCQQuestion } from './MCQQuestion';
import { 
  sampleMCQQuestion, 
  sampleMCQQuestionWithPassage, 
  answeredCorrectQuestion, 
  answeredIncorrectQuestion 
} from '../__fixtures__/mcqQuestions';

const meta: Meta<typeof MCQQuestion> = {
  title: 'Core/MCQQuestion',
  component: MCQQuestion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Multiple choice question component used in reading and listening comprehension exams.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onAnswerSelect: { action: 'answer selected' },
    disabled: { control: 'boolean' },
    showResult: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof MCQQuestion>;

export const Default: Story = {
  args: {
    question: sampleMCQQuestion,
    questionNumber: 1,
    selectedAnswer: null,
  },
};

export const WithPassage: Story = {
  args: {
    question: sampleMCQQuestionWithPassage,
    questionNumber: 2,
    selectedAnswer: null,
  },
};

export const AnswerSelected: Story = {
  args: {
    question: sampleMCQQuestion,
    questionNumber: 1,
    selectedAnswer: 1,
  },
};

export const CorrectResult: Story = {
  args: {
    question: answeredCorrectQuestion,
    questionNumber: 1,
    selectedAnswer: 1,
    showResult: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the result view when the user answered correctly.',
      },
    },
  },
};

export const IncorrectResult: Story = {
  args: {
    question: answeredIncorrectQuestion,
    questionNumber: 1,
    selectedAnswer: 0,
    showResult: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the result view when the user answered incorrectly.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    question: sampleMCQQuestion,
    questionNumber: 1,
    selectedAnswer: null,
    disabled: true,
  },
};

// Interaction test: selecting an answer
export const SelectingAnswer: Story = {
  args: {
    question: sampleMCQQuestion,
    questionNumber: 1,
    selectedAnswer: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Find and click the second option (Ottawa)
    const ottawaOption = canvas.getByText('Ottawa');
    await userEvent.click(ottawaOption);
    
    // Verify onAnswerSelect was called
    await expect(args.onAnswerSelect).toHaveBeenCalledWith(1);
  },
};

// Interaction test: viewing all options
export const ViewingOptions: Story = {
  args: {
    question: sampleMCQQuestion,
    questionNumber: 1,
    selectedAnswer: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify all options are visible
    await expect(canvas.getByText('Toronto')).toBeInTheDocument();
    await expect(canvas.getByText('Ottawa')).toBeInTheDocument();
    await expect(canvas.getByText('Montréal')).toBeInTheDocument();
    await expect(canvas.getByText('Vancouver')).toBeInTheDocument();
  },
};
