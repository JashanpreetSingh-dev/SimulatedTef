// emails/WelcomeToAkseliEmail.tsx
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

/** Public Instagram favicon (small icon for email footer). */
const DEFAULT_INSTAGRAM_ICON_URL = 'https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png';

type WelcomeToAkseliProps = {
  firstName: string;
  dashboardUrl: string;
  /** Full URL to the Akseli logo image. */
  logoUrl?: string;
  /** Full URL to Instagram icon image for the footer. */
  instagramIconUrl?: string;
  /** Instagram profile URL. Defaults to https://www.instagram.com/akseli.ca/ */
  instagramUrl?: string;
};

const BRAND_GRADIENT = 'linear-gradient(90deg, #6366F1, #818CF8, #06B6D4)';

export const WelcomeToAkseliEmail = ({
  firstName,
  dashboardUrl,
  logoUrl,
  instagramIconUrl = DEFAULT_INSTAGRAM_ICON_URL,
  instagramUrl = 'https://www.instagram.com/akseli.ca/',
}: WelcomeToAkseliProps) => {
  return (
  <Html lang="fr">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>{`
        @media only screen and (max-width: 620px) {
          .email-card { width: 100% !important; max-width: 100% !important; }
          .email-header, .email-hero, .email-cta, .email-highlight, .email-features, .email-twocol, .email-footer {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          .email-hero { padding-top: 24px !important; padding-bottom: 16px !important; }
          .email-hero-title { font-size: 24px !important; }
          .email-cta { padding-bottom: 20px !important; }
          .email-cta a { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .email-highlight { padding-bottom: 16px !important; }
          .email-features { padding-bottom: 20px !important; }
          .email-feature-col { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
          .email-feature-col .email-feature-card { margin-bottom: 0 !important; }
          .email-twocol { padding-bottom: 24px !important; }
          .email-steps-col, .email-tips-col { display: block !important; width: 100% !important; padding: 0 0 20px 0 !important; }
          .email-footer { padding: 16px 20px 24px !important; }
        }
      `}</style>
    </Head>
    <Preview>Bienvenue sur Akseli – entraînement TEF Canada guidé par l’IA</Preview>
    <Body style={body}>
      <Container style={card} className="email-card">
        {/* Header / brand bar */}
        <Section style={header} className="email-header">
          <Row>
            <Column style={headerLogoCol}>
              {logoUrl ? (
                <Img
                  src={logoUrl}
                  alt="Akseli Logo"
                  width={128}
                  height={32}
                  style={logo}
                />
              ) : (
                <Text style={headerLogoText}>Akseli</Text>
              )}
            </Column>
          </Row>
        </Section>

        {/* Hero */}
        <Section style={heroSection} className="email-hero">
          <Heading as="h1" style={heroTitle} className="email-hero-title">
            Bienvenue sur Akseli, {firstName}
          </Heading>
          <Text style={heroText}>
            Vous êtes prêt·e à préparer l’épreuve d&apos;expression orale du TEF Canada avec des
            simulations réalistes et un feedback détaillé.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={ctaSection} className="email-cta">
          <Button href={dashboardUrl} style={primaryButton}>
            Commencer votre première session
          </Button>
        </Section>

        {/* Highlight strip */}
        <Section style={highlightSection} className="email-highlight">
          <Row>
            <Column style={highlightPill}>
              <Text style={highlightText}>
                <span style={{ fontWeight: 600 }}>✨ Entraînement TEF Canada guidé par l’IA</span>
                <span style={{ color: '#6b7280' }}>
                  {' '}
                  · séances courtes, feedback immédiat, progrès mesurables.
                </span>
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Feature cards */}
        <Section style={featuresSection} className="email-features">
          <Row>
            <Column>
              <Text style={featuresTitle}>Ce que vous débloquez avec Akseli</Text>
            </Column>
          </Row>
          <Row>
            <Column style={featureColLeft} className="email-feature-col">
              <Container style={featureCard} className="email-feature-card">
                <Text style={featureIcon}>🎙️</Text>
                <Text style={featureHeading}>Scénarios réels</Text>
                <Text style={featureBody}>
                  Simulez les sections A &amp; B avec des situations proches de l&apos;examen
                  officiel.
                </Text>
              </Container>
            </Column>
            <Column style={featureColCenter} className="email-feature-col">
              <Container style={featureCard} className="email-feature-card">
                <Text style={featureIcon}>📊</Text>
                <Text style={featureHeading}>Feedback détaillé</Text>
                <Text style={featureBody}>
                  Comprenez vos forces et vos axes d&apos;amélioration sur la fluidité, la grammaire
                  et le lexique.
                </Text>
              </Container>
            </Column>
            <Column style={featureColRight} className="email-feature-col">
              <Container style={featureCard} className="email-feature-card">
                <Text style={featureIcon}>📈</Text>
                <Text style={featureHeading}>Progression visible</Text>
                <Text style={featureBody}>
                  Suivez l&apos;évolution de vos scores et revenez sur vos anciennes réponses quand
                  vous le souhaitez.
                </Text>
              </Container>
            </Column>
          </Row>
        </Section>

        {/* Two-column: steps & tips */}
        <Section style={twoColumnSection} className="email-twocol">
          <Row>
            {/* Steps */}
            <Column style={stepsCol} className="email-steps-col">
              <Text style={stepsTitle}>Démarrer en 3 étapes</Text>
              <Section style={stepsListSection}>
                <Row>
                  <Column>
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>
                      <li style={{ paddingBottom: 6 }}>
                        Connectez-vous à votre tableau de bord sur{' '}
                        <a href={dashboardUrl} style={link}>
                          Akseli
                        </a>
                        .
                      </li>
                      <li style={{ paddingBottom: 6 }}>
                        Choisissez un mode (Section A, Section B ou examen complet).
                      </li>
                      <li>Parlez comme à l&apos;examen réel, puis lisez votre feedback détaillé juste après.</li>
                    </ol>
                  </Column>
                </Row>
              </Section>
            </Column>

            {/* Tips */}
            <Column style={tipsCol} className="email-tips-col">
              <Container style={tipsCard}>
                <Text style={tipsTitle}>Astuces pour tirer le maximum d’Akseli</Text>
                <Section style={tipsListSection}>
                  <Row>
                    <Column>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                        <li style={{ paddingBottom: 4 }}>
                          Utilisez un casque avec micro pour une meilleure qualité audio.
                        </li>
                        <li style={{ paddingBottom: 4 }}>
                          Installez-vous dans un endroit calme pour rester concentré·e.
                        </li>
                        <li>Refaites régulièrement les mêmes scénarios pour voir vos progrès.</li>
                      </ul>
                    </Column>
                  </Row>
                </Section>
              </Container>
            </Column>
          </Row>
        </Section>

        {/* Footer */}
        <Section style={footerSection} className="email-footer">
          <Text style={footerText}>
            Besoin d’aide ? Répondez simplement à cet email ou contactez-nous depuis votre tableau
            de bord.
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

export default WelcomeToAkseliEmail;

// Preview props (use same URLs as production)
WelcomeToAkseliEmail.PreviewProps = {
  firstName: 'Jean',
  dashboardUrl: 'http://localhost:3000',
  logoUrl: 'https://akseli.ca/logo.png',
  instagramIconUrl: DEFAULT_INSTAGRAM_ICON_URL,
} as WelcomeToAkseliProps;

// Styles

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: '#f8fafc',
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

const headerLogoCol: React.CSSProperties = {
  verticalAlign: 'middle',
};

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
  padding: '0 32px 24px 32px',
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

const twoColumnSection: React.CSSProperties = {
  padding: '0 32px 28px 32px',
};

const stepsCol: React.CSSProperties = {
  paddingRight: 16,
  verticalAlign: 'top',
  width: '52%',
};

const tipsCol: React.CSSProperties = {
  paddingLeft: 16,
  verticalAlign: 'top',
  width: '48%',
};

const stepsTitle: React.CSSProperties = {
  margin: 0,
  padding: '0 0 10px 0',
  fontSize: 18,
  fontWeight: 600,
  color: '#1e293b',
};

const stepsListSection: React.CSSProperties = {
  padding: 0,
  margin: 0,
};

const stepsList: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontSize: 14,
  color: '#4b5563',
  lineHeight: 1.65,
};

const tipsListSection: React.CSSProperties = {
  padding: 0,
  margin: 0,
};

const tipsCard: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  padding: '12px 14px',
};

const tipsTitle: React.CSSProperties = {
  margin: 0,
  padding: '0 0 6px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#0f172a',
};

const tipsList: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontSize: 13,
  color: '#64748b',
  lineHeight: 1.6,
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
