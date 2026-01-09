import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { AudioPlayer } from './AudioPlayer';
import { sampleAudioSources } from '../__fixtures__/audioSources';

const meta: Meta<typeof AudioPlayer> = {
  title: 'Core/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Audio player component with play/pause, progress bar, volume control, and playback speed.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onEnded: { action: 'audio ended' },
    onError: { action: 'audio error' },
    autoPlay: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AudioPlayer>;

export const Default: Story = {
  args: {
    src: sampleAudioSources.localSample,
    autoPlay: false,
  },
};

export const WithAutoPlay: Story = {
  args: {
    src: sampleAudioSources.localSample,
    autoPlay: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player that starts playing automatically when loaded.',
      },
    },
  },
};

export const CustomClassName: Story = {
  args: {
    src: sampleAudioSources.localSample,
    className: 'max-w-md mx-auto',
  },
};

export const InCard: Story = {
  render: (args) => (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
        Écoutez l'audio suivant
      </h3>
      <AudioPlayer {...args} />
    </div>
  ),
  args: {
    src: sampleAudioSources.localSample,
  },
};

// Interaction test: play button
export const PlayInteraction: Story = {
  args: {
    src: sampleAudioSources.localSample,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the play button
    const playButton = canvas.getByRole('button', { name: /play/i });
    await expect(playButton).toBeInTheDocument();
    
    // Click play
    await userEvent.click(playButton);
  },
};
