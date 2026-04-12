// emails/SubscriptionCongrats.tsx
import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Img,
} from '@react-email/components';

const DEFAULT_INSTAGRAM_ICON_URL =
  'https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png';

type SubscriptionCongratsProps = {
  firstName: string;
  tierName: string;
  /** e.g. "Jan 15, 2025 – Feb 15, 2025" or null */
  billingPeriod?: string | null;
  dashboardUrl: string;
  logoUrl?: string;
  /** Promotional image (e.g. "Practice & Review" tip graphic) */
  thanksForSubImageUrl?: string;
  instagramIconUrl?: string;
  instagramUrl?: string;
  unsubscribeUrl?: string;
};

const BRAND_GRADIENT = 'linear-gradient(90deg, #6366F1, #818CF8, #06B6D4)';

const DEFAULT_THANKS_FOR_SUB_IMAGE_URL = 'https://akseli.ca/thanks_for_sub.png';

export const SubscriptionCongratsEmail = ({
  firstName,
  tierName,
  billingPeriod,
  dashboardUrl,
  logoUrl,
  thanksForSubImageUrl = DEFAULT_THANKS_FOR_SUB_IMAGE_URL,
  instagramIconUrl = DEFAULT_INSTAGRAM_ICON_URL,
  instagramUrl = 'https://www.instagram.com/akseli.ca/',
  unsubscribeUrl,
}: SubscriptionCongratsProps) => {
  return (
    <Html lang="fr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media only screen and (max-width: 620px) {
            .email-card { width: 100% !important; max-width: 100% !important; }
            .email-header, .email-hero, .email-cta, .email-highlight, .email-footer {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .email-hero { padding-top: 24px !important; padding-bottom: 16px !important; }
            .email-hero-title { font-size: 24px !important; }
            .email-cta a { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
            .email-footer { padding: 16px 20px 24px !important; }
            .email-promo-image img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>
      <Preview>Merci pour votre abonnement Akseli – {tierName}</Preview>
      <Body style={body}>
        <Container style={card} className="email-card">
          <Section style={header} className="email-header">
            <Row>
              <Column style={headerLogoCol}>
                {logoUrl ? (
                  <Img src={logoUrl} alt="Akseli Logo" width={128} height={32} style={logo} />
                ) : (
                  <Text style={headerLogoText}>Akseli</Text>
                )}
              </Column>
            </Row>
          </Section>

          <Section style={heroSection} className="email-hero">
            <Heading as="h1" style={heroTitle} className="email-hero-title">
              Merci pour votre abonnement, {firstName}
            </Heading>
            <Text style={heroText}>
              Votre abonnement <strong>{tierName}</strong> est actif. Vous avez maintenant accès à
              l&apos;ensemble des fonctionnalités pour préparer le TEF Canada.
            </Text>
          </Section>

          <Section style={ctaSection} className="email-cta">
            <Button href={dashboardUrl} style={primaryButton}>
              Accéder à mon tableau de bord
            </Button>
          </Section>

          {thanksForSubImageUrl && (
            <Section style={promoImageSection} className="email-promo-image">
              <a href={dashboardUrl}>
                <Img
                  src={thanksForSubImageUrl}
                  alt="Practice smarter, not harder – Akseli TEF AI Master Simulator"
                  width={560}
                  style={promoImage}
                />
              </a>
            </Section>
          )}

          <Section style={highlightSection} className="email-highlight">
            <Row>
              <Column style={highlightPill}>
                <Text style={highlightText}>
                  <span style={{ fontWeight: 600 }}>✨ Entraînement illimité</span>
                  <span style={{ color: '#6b7280' }}>
                    {' '}
                    · simulations, feedback détaillé et suivi de vos progrès.
                  </span>
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={footerSection} className="email-footer">
            <Text style={footerText}>
              Besoin d&apos;aide ? Répondez à cet email ou contactez-nous depuis votre tableau de
              bord.
            </Text>
            <Text style={footerText}>
              Vous pouvez aussi nous écrire à{' '}
              <a href="mailto:support@akseli.ca" style={link}>
                support@akseli.ca
              </a>
              .
            </Text>
            <Text style={footerText}>
              Suivez-nous sur{' '}
              <a href={instagramUrl} style={link} title="Instagram">
                <Img
                  src={instagramIconUrl}
                  alt="Instagram"
                  width={16}
                  height={16}
                  style={socialIcon}
                />
              </a>
              .
            </Text>
            <Text style={footerSmall}>© Akseli. Tous droits réservés.</Text>
            {unsubscribeUrl && (
              <Text style={footerSmall}>
                <a href={unsubscribeUrl} style={{ color: '#9ca3af' }}>Se désabonner</a>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionCongratsEmail;

SubscriptionCongratsEmail.PreviewProps = {
  firstName: 'Jean',
  tierName: 'Premium',
  billingPeriod: 'Jan 15, 2025 – Feb 15, 2025',
  dashboardUrl: 'http://localhost:3000',
  logoUrl: 'https://akseli.ca/logo.png',
  thanksForSubImageUrl: DEFAULT_THANKS_FOR_SUB_IMAGE_URL,
  instagramIconUrl: DEFAULT_INSTAGRAM_ICON_URL,
} as SubscriptionCongratsProps;

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: '#f8fafc',
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  overflow: 'hidden',
  color: '#111827',
  boxShadow: '0 18px 45px rgba(15,23,42,0.18)',
  maxWidth: 600,
  width: '100%',
  boxSizing: 'border-box',
};

const header: React.CSSProperties = {
  backgroundImage: BRAND_GRADIENT,
  padding: '20px 32px',
  textAlign: 'left',
};

const headerLogoCol: React.CSSProperties = { verticalAlign: 'middle' };

const headerLogoText: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontWeight: 700,
  fontSize: 20,
  color: '#e5e7eb',
};

const logo: React.CSSProperties = {
  display: 'block',
  height: 32,
  width: 'auto',
};

const heroSection: React.CSSProperties = {
  padding: '28px 32px 20px 32px',
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  padding: '0 0 10px 0',
  fontSize: 28,
  lineHeight: 1.25,
  color: '#1e293b',
  fontWeight: 700,
};

const heroText: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontSize: 15,
  lineHeight: 1.6,
  color: '#4b5563',
};

const periodText: React.CSSProperties = {
  margin: '12px 0 0 0',
  padding: 0,
  fontSize: 14,
  color: '#6b7280',
};

const ctaSection: React.CSSProperties = {
  padding: '0 32px 24px 32px',
};

const promoImageSection: React.CSSProperties = {
  padding: '0 32px 20px 32px',
};

const promoImage: React.CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  borderRadius: 8,
};

const primaryButton: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  backgroundImage: BRAND_GRADIENT,
  color: '#f9fafb',
  borderRadius: 999,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: 'none',
  boxSizing: 'border-box',
};

const highlightSection: React.CSSProperties = {
  padding: '0 32px 20px 32px',
};

const highlightPill: React.CSSProperties = {
  backgroundColor: '#eef2ff',
  borderRadius: 8,
  padding: 0,
};

const highlightText: React.CSSProperties = {
  margin: 0,
  padding: '12px 18px',
  fontSize: 13,
  color: '#4f46e5',
};

const footerSection: React.CSSProperties = {
  padding: '20px 32px 28px 32px',
  borderTop: '1px solid #e5e7eb',
};

const footerText: React.CSSProperties = {
  margin: 0,
  padding: '0 0 6px 0',
  fontSize: 12,
  color: '#9ca3af',
};

const footerSmall: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontSize: 12,
  color: '#9ca3af',
};

const link: React.CSSProperties = {
  color: '#6366F1',
  textDecoration: 'none',
};

const socialIcon: React.CSSProperties = {
  display: 'inline-block',
  height: 16,
  width: 16,
  margin: '0 4px 0 6px',
  verticalAlign: 'text-bottom',
  border: 0,
  outline: 'none',
};
