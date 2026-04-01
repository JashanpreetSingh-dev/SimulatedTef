/**
 * Mongo persistence: cached deck per user/day/options and weak-card queue.
 */

import { createHash } from 'crypto';
import { connectDB } from '../db/connection';
import type { DailyRitualCard } from '../../types';
import type { DailyRitualFocus, DailyRitualCefrHint } from './dailyRitualService';

const DECK_CACHE = 'daily_ritual_deck_cache';
const WEAK_CARDS = 'daily_ritual_weak_cards';
const MAX_WEAK = 25;

/** Bump when deck shape/prompt changes so Mongo cache does not serve stale cards */
const DECK_FORMAT_VERSION = 'bilingual-oneline-v2';

export function optionsHash(focus: DailyRitualFocus, cefrHint: DailyRitualCefrHint, cardCount: number): string {
  const payload = JSON.stringify({ focus, cefrHint, cardCount, v: DECK_FORMAT_VERSION });
  return createHash('sha256').update(payload).digest('hex').slice(0, 24);
}

function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getCachedDeck(
  userId: string,
  focus: DailyRitualFocus,
  cefrHint: DailyRitualCefrHint,
  cardCount: number
): Promise<DailyRitualCard[] | null> {
  const db = await connectDB();
  const hash = optionsHash(focus, cefrHint, cardCount);
  const doc = await db.collection(DECK_CACHE).findOne({
    userId,
    dateKey: utcDateKey(),
    optionsHash: hash,
  });
  if (!doc || !Array.isArray(doc.cards)) return null;
  return doc.cards as DailyRitualCard[];
}

export async function saveCachedDeck(
  userId: string,
  focus: DailyRitualFocus,
  cefrHint: DailyRitualCefrHint,
  cardCount: number,
  cards: DailyRitualCard[]
): Promise<void> {
  const db = await connectDB();
  const hash = optionsHash(focus, cefrHint, cardCount);
  const now = new Date().toISOString();
  await db.collection(DECK_CACHE).updateOne(
    { userId, dateKey: utcDateKey(), optionsHash: hash },
    {
      $set: {
        userId,
        dateKey: utcDateKey(),
        optionsHash: hash,
        focus,
        cefrHint,
        cardCount,
        cards,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

export async function getWeakCardsSummary(userId: string): Promise<string | null> {
  const db = await connectDB();
  const doc = await db.collection(WEAK_CARDS).findOne({ userId });
  if (!doc || !Array.isArray(doc.cards) || doc.cards.length === 0) return null;
  const slice = (doc.cards as Record<string, unknown>[]).slice(0, 8);
  return JSON.stringify(slice, null, 0).slice(0, 6000);
}

export async function appendWeakCard(userId: string, card: DailyRitualCard): Promise<void> {
  const db = await connectDB();
  const now = new Date().toISOString();
  const { id: _id, ...rest } = card;
  const stored = { ...rest, savedAt: now };

  const updateDoc = {
    $push: {
      cards: {
        $each: [stored],
        $slice: -MAX_WEAK,
      },
    },
    $set: { updatedAt: now },
    $setOnInsert: { userId, createdAt: now },
  } as Record<string, unknown>;

  await db.collection(WEAK_CARDS).updateOne({ userId }, updateDoc, { upsert: true });
}
