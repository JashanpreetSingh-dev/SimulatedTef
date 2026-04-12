// emails/WeeklyDigest.tsx
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

type WeeklyDigestProps = {
  firstName: string;
  dashboardUrl: string;
  sessionCount: number;
  logoUrl?: string;
  instagramIconUrl?: string;
  instagramUrl?: string;
  unsubscribeUrl?: string;
};

const BRAND_GRADIENT = 'linear-gradient(90deg, #6366F1, #818CF8, #06B6D4)';

export const WeeklyDigestEmail = ({
  firstName,
  dashboardUrl,
  sessionCount,
  logoUrl,
  instagramIconUrl = DEFAULT_INSTAGRAM_ICON_URL,
  instagramUrl = 'https://www.instagram.com/akseli.ca/',
  unsubscribeUrl,
}: WeeklyDigestProps) => {
  const hasActivity = sessionCount > 0;
  const sessionLabel = sessionCount === 1 ? 'session' : 'sessions';

  return (
    <Html lang="fr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media only screen and (max-width: 620px) {
            .email-card { width: 100% !important; max-width: 100% !important; }
            .email-header, .email-hero, .email-cta, .email-stats, .email-footer {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .email-hero-title { font-size: 24px !important; }
            .email-cta a { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          }
        `}</style>
      </Head>
      <Preview>
        {hasActivity
          ? `${firstName}, vous avez fait ${sessionCount} ${sessionLabel} cette semaine — continuez !`
          : `${firstName}, une nouvelle semaine pour préparer votre TEF Canada`}
      </Preview>
      <Body style={body}>
        <Container style={card} className="email-card">
          <Section style={header} className="email-header">
            <Row>
              <Column>
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
              {hasActivity
                ? `Bonne semaine, ${firstName} 🎯`
                : `C'est le moment de s'entraîner, ${firstName}`}
            </Heading>
            {hasActivity ? (
              <>
                <Text style={heroText}>
                  Cette semaine, vous avez complété{' '}
                  <strong>{sessionCount} {sessionLabel} de pratique</strong>. C&apos;est exactement
                  comme ça qu&apos;on progresse.
                </Text>
                <Text style={heroText}>
                  Continuez sur cette lancée — votre examen TEF Canada s&apos;approche et chaque
                  session compte.
                </Text>
              </>
            ) : (
              <Text style={heroText}>
                Vous n&apos;avez pas encore pratiqué cette semaine. Une seule session de{' '}
                <strong>15 minutes</strong> suffit pour maintenir votre progression et rester en
                confiance avant l&apos;examen.
              </Text>
            )}
          </Section>

          {hasActivity && (
            <Section style={statsSection} className="email-stats">
              <Row>
                <Column style={statPill}>
                  <Text style={statNumber}>{sessionCount}</Text>
                  <Text style={statLabel}>{sessionLabel} cette semaine</Text>
                </Column>
              </Row>
            </Section>
          )}

          <Section style={ctaSection} className="email-cta">
            <Button href={dashboardUrl} style={primaryButton}>
              {hasActivity ? 'Continuer mon entraînement →' : 'Commencer une session →'}
            </Button>
          </Section>

          <Section style={tipsSection}>
            <Row>
              <Column style={tipPill}>
                <Text style={tipText}>🎙️ <strong>Section A</strong> — Décrivez une image en 2 minutes</Text>
              </Column>
            </Row>
            <Row>
              <Column style={tipPill}>
                <Text style={tipText}>💬 <strong>Section B</strong> — Défendez un point de vue</Text>
              </Column>
            </Row>
            <Row>
              <Column style={tipPill}>
                <Text style={tipText}>📊 <strong>Feedback IA</strong> — Score CLB, grammaire, lexique</Text>
              </Column>
            </Row>
          </Section>

          <Section style={footerSection} className="email-footer">
            <Text style={footerText}>
              Besoin d&apos;aide ? Répondez à cet email ou écrivez-nous à{' '}
              <a href="mailto:support@akseli.ca" style={link}>support@akseli.ca</a>.
            </Text>
            <Text style={footerText}>
              Suivez-nous sur{' '}
              <a href={instagramUrl} style={link} title="Instagram">
                <Img src={instagramIconUrl} alt="Instagram" width={16} height={16} style={socialIcon} />
              </a>
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

export default WeeklyDigestEmail;

WeeklyDigestEmail.PreviewProps = {
  firstName: 'Jean',
  dashboardUrl: 'http://localhost:3000/dashboard',
  sessionCount: 3,
  logoUrl: 'https://akseli.ca/logo.png',
} as WeeklyDigestProps;

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
const header: React.CSSProperties = { backgroundImage: BRAND_GRADIENT, padding: '20px 32px' };
const headerLogoText: React.CSSProperties = { margin: 0, fontWeight: 700, fontSize: 20, color: '#e5e7eb' };
const logo: React.CSSProperties = { display: 'block', height: 32, width: 'auto' };
const heroSection: React.CSSProperties = { padding: '28px 32px 20px' };
const heroTitle: React.CSSProperties = { margin: 0, padding: '0 0 10px', fontSize: 28, lineHeight: 1.25, color: '#1e293b', fontWeight: 700 };
const heroText: React.CSSProperties = { margin: 0, padding: '0 0 12px', fontSize: 15, lineHeight: 1.6, color: '#4b5563' };
const statsSection: React.CSSProperties = { padding: '0 32px 20px' };
const statPill: React.CSSProperties = { backgroundColor: '#eef2ff', borderRadius: 10, textAlign: 'center' as const };
const statNumber: React.CSSProperties = { margin: 0, padding: '16px 0 4px', fontSize: 40, fontWeight: 800, color: '#4f46e5', lineHeight: 1 };
const statLabel: React.CSSProperties = { margin: 0, padding: '0 0 16px', fontSize: 13, color: '#6366f1', fontWeight: 500 };
const ctaSection: React.CSSProperties = { padding: '0 32px 24px' };
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
const tipsSection: React.CSSProperties = { padding: '0 32px 24px' };
const tipPill: React.CSSProperties = { backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 8 };
const tipText: React.CSSProperties = { margin: 0, padding: '10px 14px', fontSize: 14, color: '#334155' };
const footerSection: React.CSSProperties = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb' };
const footerText: React.CSSProperties = { margin: 0, padding: '0 0 6px', fontSize: 12, color: '#9ca3af' };
const footerSmall: React.CSSProperties = { margin: 0, padding: 0, fontSize: 12, color: '#9ca3af' };
const link: React.CSSProperties = { color: '#6366F1', textDecoration: 'none' };
const socialIcon: React.CSSProperties = { display: 'inline-block', height: 16, width: 16, margin: '0 4px 0 6px', verticalAlign: 'text-bottom' };
