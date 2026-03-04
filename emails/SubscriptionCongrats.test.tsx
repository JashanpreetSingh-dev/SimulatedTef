import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SubscriptionCongratsEmail } from './SubscriptionCongrats';

describe('SubscriptionCongratsEmail', () => {
  it('renders without crashing with preview props', () => {
    const html = renderToStaticMarkup(
      <SubscriptionCongratsEmail
        {...(SubscriptionCongratsEmail as any).PreviewProps}
      />
    );

    expect(html).toContain('Merci pour votre abonnement');
    expect(html).toContain('Premium');
  });

  it('includes the promo image when URL is provided', () => {
    const props = {
      ...(SubscriptionCongratsEmail as any).PreviewProps,
      thanksForSubImageUrl: 'http://localhost:3000/thanks_for_sub.png',
    };
    const html = renderToStaticMarkup(<SubscriptionCongratsEmail {...props} />);

    expect(html).toContain('http://localhost:3000/thanks_for_sub.png');
  });
});

