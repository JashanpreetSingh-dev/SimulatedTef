import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingResult } from './LoadingResult';

// Mock the useTheme hook
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

// Mock the useLanguage hook
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key, // Return the key as the translated text
    language: 'en',
    setLanguage: vi.fn(),
  }),
}));

describe('LoadingResult', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingResult />);
    // Component should render
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has loading content', () => {
    const { container } = render(<LoadingResult />);
    // Should have some visual indicator (spinner, text, or animation)
    const hasContent = container.textContent || container.querySelector('svg') || container.querySelector('[class*="animate"]');
    expect(hasContent).toBeTruthy();
  });
});
