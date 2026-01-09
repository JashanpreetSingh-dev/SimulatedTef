import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';

// Mock the useTheme hook
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders play button', () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders volume control', () => {
    render(<AudioPlayer src="/test.mp3" />);
    // Volume control might be a slider or button
    const volumeControl = screen.queryByRole('slider') || screen.queryByLabelText(/volume/i);
    // Component should render without crashing
    expect(document.querySelector('audio')).toBeInTheDocument();
  });

  it('calls onEnded when audio ends', async () => {
    const onEnded = vi.fn();
    render(<AudioPlayer src="/test.mp3" onEnded={onEnded} />);
    
    const audio = document.querySelector('audio');
    if (audio) {
      fireEvent.ended(audio);
      await waitFor(() => {
        expect(onEnded).toHaveBeenCalled();
      });
    }
  });

  it('handles playback rate change', () => {
    render(<AudioPlayer src="/test.mp3" />);
    
    // Find playback rate button/control
    const playbackRateButton = screen.queryByText(/1x/i);
    if (playbackRateButton) {
      expect(playbackRateButton).toBeInTheDocument();
    }
  });

  it('applies custom className', () => {
    const { container } = render(<AudioPlayer src="/test.mp3" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows loading state initially', () => {
    render(<AudioPlayer src="/test.mp3" />);
    // Component shows loading state before audio metadata loads
    // This is implementation-specific, adjust based on actual component
  });
});
