/**
 * Notification Service - transactional emails via Resend
 */

import React from 'react';
import { createClerkClient } from '@clerk/backend';
import { connectDB } from '../db/connection';
import { sendReactEmail } from '../utils/emailClient';
import { WelcomeToAkseliEmail } from '../../emails/WelcomeToAkseli';
import { SubscriptionCongratsEmail } from '../../emails/SubscriptionCongrats';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

type NotificationType = 'welcome' | 'subscription_congrats';

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

  // Logo and Instagram icon: always use hosted URLs
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL; // undefined = component default

  await sendReactEmail({
    to: identity.email,
    subject: 'Bienvenue sur Akseli',
    react: React.createElement(WelcomeToAkseliEmail, {
      firstName: identity.firstName,
      dashboardUrl,
      logoUrl,
      ...(instagramIconUrl && { instagramIconUrl }),
      instagramUrl: process.env.EMAIL_INSTAGRAM_URL,
    }),
  });

  await recordNotificationSent(userId, 'welcome', { email: identity.email });
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
  const logoUrl = process.env.EMAIL_LOGO_URL || 'https://akseli.ca/logo.png';
  const thanksForSubImageUrl = process.env.EMAIL_THANKS_FOR_SUB_IMAGE_URL || 'https://akseli.ca/thanks_for_sub.png';
  const instagramIconUrl = process.env.EMAIL_INSTAGRAM_ICON_URL;

  try {
    await sendReactEmail({
      to: identity.email,
      subject: 'Merci pour votre abonnement Akseli',
      react: React.createElement(SubscriptionCongratsEmail, {
        firstName: identity.firstName,
        tierName: niceTierName,
        billingPeriod: billingPeriodLabel ?? undefined,
        dashboardUrl,
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

export const notificationService = {
  sendWelcomeEmail,
  sendSubscriptionCongratsEmail,
  hasSubscriptionCongratsBeenSent,
};

