import type { Meta, StoryObj } from '@storybook/react';
import { AssignmentList } from './AssignmentList';
import { sampleAssignmentList } from '../../__fixtures__/assignments';

const meta: Meta<typeof AssignmentList> = {
  title: 'Assignments/AssignmentList',
  component: AssignmentList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'List of assignments for professor dashboard.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
    onView: { action: 'view clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof AssignmentList>;

export const Default: Story = {
  args: {
    assignments: sampleAssignmentList,
  },
};

export const Empty: Story = {
  args: {
    assignments: [],
  },
};

export const Loading: Story = {
  args: {
    assignments: [],
    loading: true,
  },
};
