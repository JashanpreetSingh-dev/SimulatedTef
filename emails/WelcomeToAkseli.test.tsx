import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WelcomeToAkseliEmail } from './WelcomeToAkseli';

describe('WelcomeToAkseliEmail', () => {
  it('renders without crashing with preview props', () => {
    const html = renderToStaticMarkup(
      <WelcomeToAkseliEmail {...(WelcomeToAkseliEmail as any).PreviewProps} />
    );

    expect(html).toContain('Bienvenue sur Akseli');
    expect(html).toContain('Commencer votre première session');
  });

  it('uses logoUrl when provided', () => {
    const props = {
      ...(WelcomeToAkseliEmail as any).PreviewProps,
      logoUrl: 'https://akseli.ca/logo-test.png',
    };
    const html = renderToStaticMarkup(<WelcomeToAkseliEmail {...props} />);

    expect(html).toContain('https://akseli.ca/logo-test.png');
  });
});

