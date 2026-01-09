import type { Preview, Decorator } from '@storybook/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';
import { StorybookThemeProvider, ClerkMockProvider } from './decorators';

// Combined decorator with Theme, Router, and Auth
const withProviders: Decorator = (Story, context) => {
  const theme = (context.globals.theme || 'light') as 'light' | 'dark';
  const isSignedIn = context.globals.auth !== 'signed-out';
  
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/'] },
    React.createElement(
      StorybookThemeProvider,
      { theme },
      React.createElement(
        ClerkMockProvider,
        { isSignedIn },
        React.createElement(
          'div',
          { 
            className: theme === 'dark' 
              ? 'bg-slate-900 text-slate-100 min-h-screen p-4' 
              : 'bg-slate-50 text-slate-900 min-h-screen p-4' 
          },
          React.createElement(Story)
        )
      )
    )
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // We handle backgrounds via theme
    },
    layout: 'fullscreen',
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    auth: {
      description: 'Authentication state',
      toolbar: {
        title: 'Auth',
        icon: 'user',
        items: [
          { value: 'signed-in', icon: 'useralt', title: 'Signed In' },
          { value: 'signed-out', icon: 'user', title: 'Signed Out' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    auth: 'signed-in',
  },
  decorators: [withProviders],
};

export default preview;
