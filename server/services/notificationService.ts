/**
 * Notification Service - transactional emails via Resend
 */

import React from 'react';
import { randomUUID } from 'crypto';
import { createClerkClient } from '@clerk/backend';
import { connectDB } from '../db/connection';
import { sendReactEmail } from '../utils/emailClient';
import { createUnsubscribeToken } from '../routes/unsubscribe';
import { WelcomeToAkseliEmail } from '../../emails/WelcomeToAkseli';
import { SubscriptionCongratsEmail } from '../../emails/SubscriptionCongrats';
import { GoodFridayPromoEmail } from '../../emails/GoodFridayPromo';
import { Day3NudgeEmail } from '../../emails/Day3Nudge';
import { WeeklyDigestEmail } from '../../emails/WeeklyDigest';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

type NotificationType = 'welcome' | 'subscription_congrats' | 'good_friday_promo' | 'day3_nudge' | 'weekly_digest';

export type WelcomeEmailPayload = {
  userId: string;
  email?: string;
  firstName?: string;
};

export type SubscriptionCongratsPayload = {
  userId: string;
  email?: string;
  firstName?: string;
  tierId: string;
  tierName?: string;
  periodStart?: string;
  periodEnd?: string;
};

async function isUnsubscribed(userId: string): Promise<boolean> {
  try {
    const db = await connectDB();
    const pref = await db.collection('emailPreferences').findOne({ userId });
    return !!pref?.unsubscribedAt;
  } catch (error) {
    console.error('Failed to check unsubscribe status:', error);
    return false; // fail open — better to send than to silently drop
  }
}

function buildUnsubscribeUrl(userId: string, baseUrl: string): string {
  try {
    const token = createUnsubscribeToken(userId);
    return `${baseUrl}/api/unsubscribe?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  } catch {
    return ''; // EMAIL_UNSUBSCRIBE_SECRET not set in dev
  }
}

function getDashboardUrl(): string {
  const envUrl = process.env.FRONTEND_URL || process.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }
  // Sensible local default
  return 'http://localhost:3000';
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  try {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function resolveUserIdentity(
  userId: string,
  fallback: { email?: string; firstName?: string }
): Promise<{ email: string; firstName: string } | null> {
  let { email, firstName } = fallback;

  if ((!email || !firstName) && clerkClient && clerkSecretKey) {
    try {
      const user = await clerkClient.users.getUser(userId);
      if (!email) {
        email = user.emailAddresses[0]?.emailAddress;
      }
      if (!firstName) {
        firstName = user.firstName || undefined;
      }
    } catch (error) {
      console.error('Failed to fetch user from Clerk for notifications:', error);
    }
  }

  if (!email) {
    console.warn(`Notification email skipped for user ${userId}: no email address available.`);
    return null;
  }

  if (!firstName) {
    // Derive a soft first name fallback from email local-part
    const localPart = email.split('@')[0];
    firstName = toTitleCase(localPart.replace(/[._-]/g, ' '));
  }

  return { email, firstName };
}

async function hasNotificationBeenSent(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const db = await connectDB();
    const existing = await db.collection('userNotifications').findOne({ userId, type });
    return !!existing;
  } catch (error) {
    console.error('Failed to check notification idempotency:', error);
    return false;
  }
}

async function recordNotificationSent(
  userId: string,
  type: NotificationType,
  extra?: Record<string, unknown>
): Promise<void> {
  try {
    const db = await connectDB();
    await db.collection('userNotifications').insertOne({
      userId,
      type,
      sentAt: new Date().toISOString(),
      ...(extra || {}),
    });
  } catch (error) {
    console.error('Failed to record sent notification:', error);
  }
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  const { userId } = payload;

  if (await isUnsubscribed(userId)) return;

  // Idempotency: only send welcome email once per user
  if (await hasNotificationBeenSent(userId, 'welcome')) {
    return;
  }

  const identity = await resolveUserIdentity(userId, {
    email: payload.email,
    firstName: payload.firstName,
  });
  if (!identity) {
    return;
  }

  const dashboardUrl = getDashboardUrl();
  const unsubscribeUrl = buildUnsubscribeUrl(userId, dashboardUrl);
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  await sendReactEmail({
    to: identity.email,
    subject: 'Bienvenue sur Akseli',
    tags: [{ name: 'template', value: 'welcome' }],
    react: React.createElement(WelcomeToAkseliEmail, {
      firstName: identity.firstName,
      dashboardUrl: `${dashboardUrl}?utm_source=email&utm_medium=transactional&utm_campaign=welcome`,
      logoUrl,
      unsubscribeUrl,
      ...(instagramIconUrl && { instagramIconUrl }),
      instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
    }),
  });

  await recordNotificationSent(userId, 'welcome', { email: identity.email });
}

export type GoodFridayPromoPayload = {
  userId: string;
  email?: string;
  firstName?: string;
};

export async function sendGoodFridayPromoEmail(payload: GoodFridayPromoPayload): Promise<void> {
  const { userId } = payload;

  if (await isUnsubscribed(userId)) return;

  if (await hasNotificationBeenSent(userId, 'good_friday_promo')) {
    return;
  }

  const identity = await resolveUserIdentity(userId, {
    email: payload.email,
    firstName: payload.firstName,
  });
  if (!identity) {
    return;
  }

  const dashboardUrl = getDashboardUrl();
  const pricingUrl = `${dashboardUrl}/pricing?utm_source=email&utm_medium=promo&utm_campaign=good_friday`;
  const unsubscribeUrl = buildUnsubscribeUrl(userId, dashboardUrl);
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  const senderName = process.env.EMAIL_SENDER_NAME || 'Akseli';
  const fromAddress = process.env.RESEND_FROM_EMAIL || '';

  await sendReactEmail({
    to: identity.email,
    subject: 'Vendredi Saint : -40 % sur votre abonnement Akseli',
    from: `${senderName} <${fromAddress}>`,
    tags: [{ name: 'template', value: 'good_friday_promo' }],
    headers: {
      'X-Entity-Ref-ID': randomUUID(),
    },
    react: React.createElement(GoodFridayPromoEmail, {
      firstName: identity.firstName,
      pricingUrl,
      unsubscribeUrl,
      logoUrl,
      ...(instagramIconUrl && { instagramIconUrl }),
      instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
    }),
  });

  await recordNotificationSent(userId, 'good_friday_promo', { email: identity.email });
}

/** Idempotency: only send subscription congrats once per user. */
export async function hasSubscriptionCongratsBeenSent(userId: string): Promise<boolean> {
  return hasNotificationBeenSent(userId, 'subscription_congrats');
}

export async function sendSubscriptionCongratsEmail(
  payload: SubscriptionCongratsPayload
): Promise<void> {
  const { userId, tierId, periodStart, periodEnd } = payload;

  // Atomic claim: only one job can "win" when both webhooks enqueue. Prevents duplicate emails.
  const db = await connectDB();
  const notificationsCol = db.collection('userNotifications');
  try {
    await notificationsCol.insertOne({
      userId,
      type: 'subscription_congrats',
      claimedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (e.code !== 11000) throw e;
    return; // Another job claimed; it will send. (Retries: we release claim on throw below.)
  }

  const identity = await resolveUserIdentity(userId, {
    email: payload.email,
    firstName: payload.firstName,
  });
  if (!identity) {
    console.warn(`Subscription congrats skipped: could not resolve identity for userId ${userId}`);
    await notificationsCol.deleteOne({ userId, type: 'subscription_congrats' }); // release claim for retry
    throw new Error(`Subscription congrats: no identity for user ${userId}`);
  }

  const niceTierName = payload.tierName || toTitleCase(tierId);
  const periodStartFormatted = formatDate(periodStart);
  const periodEndFormatted = formatDate(periodEnd);
  const billingPeriodLabel =
    periodStartFormatted && periodEndFormatted
      ? `${periodStartFormatted} – ${periodEndFormatted}`
      : undefined;

  const dashboardUrl = getDashboardUrl();
  const unsubscribeUrl = buildUnsubscribeUrl(userId, dashboardUrl);
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const thanksForSubImageUrl = process.env.EMAIL_THANKS_FOR_SUB_IMAGE_URL || 'https://akseli.ca/thanks_for_sub.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  try {
    await sendReactEmail({
      to: identity.email,
      subject: 'Merci pour votre abonnement Akseli',
      tags: [{ name: 'template', value: 'subscription_congrats' }],
      react: React.createElement(SubscriptionCongratsEmail, {
        firstName: identity.firstName,
        tierName: niceTierName,
        billingPeriod: billingPeriodLabel ?? undefined,
        dashboardUrl: `${dashboardUrl}?utm_source=email&utm_medium=transactional&utm_campaign=subscription_congrats`,
        unsubscribeUrl,
        logoUrl,
        thanksForSubImageUrl,
        ...(instagramIconUrl && { instagramIconUrl }),
        instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
      }),
    });
  } catch (err) {
    await notificationsCol.deleteOne({ userId, type: 'subscription_congrats' }); // release claim for retry
    throw err;
  }

  await notificationsCol.updateOne(
    { userId, type: 'subscription_congrats' },
    { $set: { sentAt: new Date().toISOString(), email: identity.email } }
  );
}

export type Day3NudgePayload = {
  userId: string;
  email?: string;
  firstName?: string;
};

/**
 * Send the day-3 nudge email to a user who has not yet completed any practice session.
 * Skips if: unsubscribed, already sent, or user has results in the last 90 days.
 * Deletes the pendingNudges sentinel on successful send.
 */
export async function sendDay3NudgeEmail(payload: Day3NudgePayload): Promise<void> {
  const { userId } = payload;

  if (await isUnsubscribed(userId)) return;

  if (await hasNotificationBeenSent(userId, 'day3_nudge')) return;

  // Skip if user has already done at least one session in the last 90 days
  try {
    const db = await connectDB();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const resultCount = await db.collection('results').countDocuments({
      userId,
      $or: [{ timestamp: { $gte: cutoff } }, { createdAt: { $gte: cutoff } }],
    });
    if (resultCount > 0) {
      // User already practiced — delete sentinel and skip
      await db.collection('pendingNudges').deleteOne({ userId });
      return;
    }
  } catch (error) {
    console.error('Day3 nudge: failed to check results, sending anyway:', error);
  }

  const identity = await resolveUserIdentity(userId, {
    email: payload.email,
    firstName: payload.firstName,
  });
  if (!identity) return;

  const dashboardUrl = getDashboardUrl();
  const practiceUrl = `${dashboardUrl}/practice?utm_source=email&utm_medium=lifecycle&utm_campaign=day3_nudge`;
  const unsubscribeUrl = buildUnsubscribeUrl(userId, dashboardUrl);
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  await sendReactEmail({
    to: identity.email,
    subject: 'Votre première session TEF vous attend — 15 minutes suffisent',
    tags: [{ name: 'template', value: 'day3_nudge' }],
    react: React.createElement(Day3NudgeEmail, {
      firstName: identity.firstName,
      practiceUrl,
      logoUrl,
      unsubscribeUrl,
      ...(instagramIconUrl && { instagramIconUrl }),
      instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
    }),
  });

  await recordNotificationSent(userId, 'day3_nudge', { email: identity.email });

  // Clean up the sentinel
  try {
    const db = await connectDB();
    await db.collection('pendingNudges').deleteOne({ userId });
  } catch (error) {
    console.error('Day3 nudge: failed to delete pendingNudges sentinel:', error);
  }
}

/**
 * Fan-out weekly digest to all non-unsubscribed users who have been active in the last 14 days.
 * Looks up user emails from the userNotifications welcome record (stored at signup).
 * Skips users with 0 results in the last 14 days.
 */
export async function sendWeeklyDigestBroadcast(): Promise<{ sent: number; skipped: number }> {
  const db = await connectDB();
  const dashboardUrl = getDashboardUrl();
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  // Find all users we have an email for (stored when welcome email was sent)
  const welcomeRecords = await db
    .collection('userNotifications')
    .find({ type: 'welcome', email: { $exists: true, $ne: '' } })
    .toArray();

  const cutoff14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let sent = 0;
  let skipped = 0;

  for (const record of welcomeRecords) {
    const userId: string = record.userId;
    const email: string = record.email;

    try {
      // Skip unsubscribed users
      if (await isUnsubscribed(userId)) {
        skipped++;
        continue;
      }

      // Skip users with no activity in the last 14 days
      const recentCount = await db.collection('results').countDocuments({
        userId,
        $or: [{ timestamp: { $gte: cutoff14d } }, { createdAt: { $gte: cutoff14d } }],
      });
      if (recentCount === 0) {
        skipped++;
        continue;
      }

      // Count sessions this week (last 7 days) for personalisation
      const weekCount = await db.collection('results').countDocuments({
        userId,
        $or: [{ timestamp: { $gte: cutoff7d } }, { createdAt: { $gte: cutoff7d } }],
      });

      // Resolve first name (stored on welcome record or derive from email)
      let firstName: string = record.firstName || '';
      if (!firstName) {
        const localPart = email.split('@')[0];
        firstName = toTitleCase(localPart.replace(/[._-]/g, ' '));
      }

      const practiceUrl = `${dashboardUrl}/practice?utm_source=email&utm_medium=lifecycle&utm_campaign=weekly_digest`;
      const unsubscribeUrl = buildUnsubscribeUrl(userId, dashboardUrl);

      await sendReactEmail({
        to: email,
        subject: weekCount > 0
          ? `Votre semaine Akseli — ${weekCount} session${weekCount > 1 ? 's' : ''} ✅`
          : 'Une nouvelle semaine pour votre TEF Canada',
        tags: [{ name: 'template', value: 'weekly_digest' }],
        react: React.createElement(WeeklyDigestEmail, {
          firstName,
          dashboardUrl: practiceUrl,
          sessionCount: weekCount,
          logoUrl,
          unsubscribeUrl,
          ...(instagramIconUrl && { instagramIconUrl }),
          instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
        }),
      });

      sent++;
    } catch (error) {
      console.error(`Weekly digest failed for user ${userId}:`, error);
      skipped++;
    }
  }

  console.log(`Weekly digest broadcast complete: sent=${sent}, skipped=${skipped}`);
  return { sent, skipped };
}

export const notificationService = {
  sendWelcomeEmail,
  sendSubscriptionCongratsEmail,
  hasSubscriptionCongratsBeenSent,
  sendGoodFridayPromoEmail,
  sendDay3NudgeEmail,
  sendWeeklyDigestBroadcast,
};

