// emails/GoodFridayPromo.tsx
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

type GoodFridayPromoProps = {
  firstName: string;
  pricingUrl: string;
  discountCode?: string;
  logoUrl?: string;
  instagramIconUrl?: string;
  instagramUrl?: string;
};

const BRAND_GRADIENT = 'linear-gradient(90deg, #6366F1, #818CF8, #06B6D4)';

export const GoodFridayPromoEmail = ({
  firstName,
  pricingUrl,
  discountCode = 'GOODFRIDAY40',
  logoUrl,
  instagramIconUrl = DEFAULT_INSTAGRAM_ICON_URL,
  instagramUrl = 'https://www.instagram.com/akseli.ca/',
}: GoodFridayPromoProps) => {
  return (
    <Html lang="fr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media only screen and (max-width: 620px) {
            .email-card { width: 100% !important; max-width: 100% !important; }
            .email-header, .email-hero, .email-cta, .email-code, .email-highlight, .email-features, .email-footer {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .email-hero { padding-top: 24px !important; padding-bottom: 16px !important; }
            .email-hero-title { font-size: 24px !important; }
            .email-cta a { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
            .email-feature-col { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
            .email-footer { padding: 16px 20px 24px !important; }
          }
        `}</style>
      </Head>
      <Preview>Vendredi Saint : -40 % sur votre abonnement Akseli — code {discountCode}</Preview>
      <Body style={body}>
        <Container style={card} className="email-card">
          {/* Header */}
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

          {/* Hero */}
          <Section style={heroSection} className="email-hero">
            <Heading as="h1" style={heroTitle} className="email-hero-title">
              Ce Vendredi Saint, préparez votre TEF Canada à -40 %, {firstName}
            </Heading>
            <Text style={heroText}>
              Pour célébrer le Vendredi Saint, nous offrons <strong>40 % de réduction</strong> sur
              tous nos abonnements. C&apos;est le moment idéal pour passer à la vitesse supérieure
              dans votre préparation au TEF Canada.
            </Text>
          </Section>

          {/* Discount code block */}
          <Section style={codeSection} className="email-code">
            <Row>
              <Column style={codeWrapper}>
                <Text style={codeLabel}>Votre code de réduction</Text>
                <Text style={codeValue}>{discountCode}</Text>
                <Text style={codeHint}>Entrez ce code lors du paiement pour obtenir -40 %.</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection} className="email-cta">
            <Button href={pricingUrl} style={primaryButton}>
              Obtenir mon rabais de 40 %
            </Button>
          </Section>

          {/* Highlight pill */}
          <Section style={highlightSection} className="email-highlight">
            <Row>
              <Column style={highlightPill}>
                <Text style={highlightText}>
                  <span style={{ fontWeight: 600 }}>⏳ Offre limitée</span>
                  <span style={{ color: '#6b7280' }}>
                    {' '}
                    · Valable ce Vendredi Saint seulement. Ne manquez pas cette occasion.
                  </span>
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Feature cards */}
          <Section style={featuresSection} className="email-features">
            <Row>
              <Column>
                <Text style={featuresTitle}>Ce que vous débloquez avec un abonnement</Text>
              </Column>
            </Row>
            <Row>
              <Column style={featureColLeft} className="email-feature-col">
                <Container style={featureCard}>
                  <Text style={featureIcon}>🎙️</Text>
                  <Text style={featureHeading}>Expression orale</Text>
                  <Text style={featureBody}>
                    Simulations sections A &amp; B avec feedback détaillé sur la fluidité, la
                    grammaire et le lexique.
                  </Text>
                </Container>
              </Column>
              <Column style={featureColCenter} className="email-feature-col">
                <Container style={featureCard}>
                  <Text style={featureIcon}>✍️</Text>
                  <Text style={featureHeading}>Expression écrite</Text>
                  <Text style={featureBody}>
                    Entraînez-vous aux deux parties de l&apos;écrit avec corrections automatiques
                    guidées par l&apos;IA.
                  </Text>
                </Container>
              </Column>
              <Column style={featureColRight} className="email-feature-col">
                <Container style={featureCard}>
                  <Text style={featureIcon}>📋</Text>
                  <Text style={featureHeading}>Examens blancs</Text>
                  <Text style={featureBody}>
                    Passez des examens complets chronométrés pour vous préparer dans les conditions
                    réelles.
                  </Text>
                </Container>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
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
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default GoodFridayPromoEmail;

GoodFridayPromoEmail.PreviewProps = {
  firstName: 'Jean',
  pricingUrl: 'http://localhost:3000/pricing',
  discountCode: 'GOODFRIDAY40',
  logoUrl: 'https://akseli.ca/logo.png',
  instagramIconUrl: DEFAULT_INSTAGRAM_ICON_URL,
} as GoodFridayPromoProps;

// Styles

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

const codeSection: React.CSSProperties = {
  padding: '0 32px 20px 32px',
};

const codeWrapper: React.CSSProperties = {
  backgroundColor: '#fdf4ff',
  border: '2px dashed #a855f7',
  borderRadius: 10,
  padding: 0,
  textAlign: 'center' as const,
};

const codeLabel: React.CSSProperties = {
  margin: 0,
  padding: '16px 0 4px 0',
  fontSize: 12,
  fontWeight: 600,
  color: '#7c3aed',
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
};

const codeValue: React.CSSProperties = {
  margin: 0,
  padding: '0 0 4px 0',
  fontSize: 32,
  fontWeight: 800,
  color: '#6d28d9',
  letterSpacing: 4,
};

const codeHint: React.CSSProperties = {
  margin: 0,
  padding: '0 0 16px 0',
  fontSize: 12,
  color: '#9333ea',
};

const ctaSection: React.CSSProperties = {
  padding: '0 32px 24px 32px',
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

const featuresSection: React.CSSProperties = {
  padding: '0 32px 28px 32px',
};

const featuresTitle: React.CSSProperties = {
  margin: 0,
  padding: '0 0 14px 0',
  fontSize: 18,
  fontWeight: 600,
  color: '#1e293b',
};

const featureColLeft: React.CSSProperties = {
  paddingRight: 6,
  verticalAlign: 'top',
};

const featureColCenter: React.CSSProperties = {
  padding: '0 3px',
  verticalAlign: 'top',
};

const featureColRight: React.CSSProperties = {
  paddingLeft: 6,
  verticalAlign: 'top',
};

const featureCard: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: '12px 14px',
};

const featureIcon: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1,
  margin: '0 0 6px 0',
};

const featureHeading: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  paddingBottom: 4,
};

const featureBody: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: '#6b7280',
  lineHeight: 1.5,
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
