/**
 * Global Vitest setup for both backend and frontend tests
 */
import { vi } from 'vitest';

// Only run MongoDB setup for server tests
const isServerTest = process.env.VITEST_POOL_ID !== undefined || 
  typeof window === 'undefined';

if (isServerTest && !process.env.VITEST_BROWSER) {
  // Import server setup dynamically to avoid issues with frontend tests
  import('./server/__tests__/helpers/setup.ts').catch(() => {
    // Ignore errors if running in jsdom environment
  });
}

// Frontend test setup - only when in jsdom environment
if (typeof window !== 'undefined') {
  // Import jest-dom matchers
  import('@testing-library/jest-dom').catch(() => {});
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock IntersectionObserver
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;

  // Mock ResizeObserver
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;

  // Mock AudioContext
  class MockAudioContext {
    createGain() {
      return { connect: vi.fn(), gain: { value: 1 } };
    }
    createMediaElementSource() {
      return { connect: vi.fn() };
    }
    close() {
      return Promise.resolve();
    }
  }
  window.AudioContext = MockAudioContext as any;

  // Mock HTMLMediaElement
  window.HTMLMediaElement.prototype.load = vi.fn();
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
}
