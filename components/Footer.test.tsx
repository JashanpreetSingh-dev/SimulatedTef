import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

// Helper to render with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Footer', () => {
  it('renders copyright text', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/Akseli/)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('renders current year', () => {
    renderWithRouter(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('renders Terms link', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByRole('link', { name: /Terms/i })).toBeInTheDocument();
  });

  it('renders Privacy link', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByRole('link', { name: /Privacy/i })).toBeInTheDocument();
  });

  it('renders contact info', () => {
    renderWithRouter(<Footer />);
    // Should have email or support link
    const emailLink = screen.queryByRole('link', { name: /support|email/i }) || 
                      screen.queryByText(/akseli/i);
    expect(emailLink).toBeInTheDocument();
  });

  it('Terms link has correct href', () => {
    renderWithRouter(<Footer />);
    const termsLink = screen.getByRole('link', { name: /Terms/i });
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('Privacy link has correct href', () => {
    renderWithRouter(<Footer />);
    const privacyLink = screen.getByRole('link', { name: /Privacy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});
