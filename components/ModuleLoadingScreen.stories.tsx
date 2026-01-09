import type { Meta, StoryObj } from '@storybook/react';
import { ModuleLoadingScreen } from './ModuleLoadingScreen';

const meta: Meta<typeof ModuleLoadingScreen> = {
  title: 'Core/ModuleLoadingScreen',
  component: ModuleLoadingScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-screen loading indicator shown while exam modules are loading.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModuleLoadingScreen>;

export const Default: Story = {
  args: {
    moduleName: 'Compréhension écrite',
  },
};

export const ListeningModule: Story = {
  args: {
    moduleName: 'Compréhension orale',
  },
};

export const OralExpression: Story = {
  args: {
    moduleName: 'Expression orale',
  },
};

export const WrittenExpression: Story = {
  args: {
    moduleName: 'Expression écrite',
  },
};
