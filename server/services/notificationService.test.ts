import { describe, it, expect, vi, beforeEach } from 'vitest';

let userNotifications: any[] = [];
let sendReactEmailMock: ReturnType<typeof vi.fn>;

vi.mock('../db/connection', () => {
  return {
    connectDB: vi.fn(async () => ({
      collection: (name: string) => {
        if (name !== 'userNotifications') {
          throw new Error(`Unexpected collection: ${name}`);
        }

        return {
          findOne: async (query: any) =>
            userNotifications.find(
              (d) => d.userId === query.userId && d.type === query.type
            ) || null,
          insertOne: async (doc: any) => {
            const exists = userNotifications.some(
              (d) => d.userId === doc.userId && d.type === doc.type
            );
            if (exists) {
              const err: any = new Error('Duplicate key');
              err.code = 11000;
              throw err;
            }
            userNotifications.push({ ...doc });
            return { insertedId: 'fake' };
          },
          updateOne: async (filter: any, update: any) => {
            const doc = userNotifications.find(
              (d) => d.userId === filter.userId && d.type === filter.type
            );
            if (doc && update?.$set) {
              Object.assign(doc, update.$set);
            }
          },
          deleteOne: async (filter: any) => {
            userNotifications = userNotifications.filter(
              (d) => !(d.userId === filter.userId && d.type === filter.type)
            );
          },
        };
      },
    })),
  };
});

// Avoid real Clerk client calls in tests
vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(),
    },
  })),
}));

import * as emailClient from '../utils/emailClient';
import {
  sendWelcomeEmail,
  sendSubscriptionCongratsEmail,
  hasSubscriptionCongratsBeenSent,
} from './notificationService';

beforeEach(() => {
  userNotifications = [];
  sendReactEmailMock = vi
    .spyOn(emailClient, 'sendReactEmail')
    .mockResolvedValue(undefined as any);
});

describe('notificationService.sendWelcomeEmail', () => {
  it('sends welcome email only once per user', async () => {
    const payload = {
      userId: 'user-welcome-1',
      email: 'welcome@example.com',
      firstName: 'Welcome',
    };

    await sendWelcomeEmail(payload);
    await sendWelcomeEmail(payload);

    expect(sendReactEmailMock).toHaveBeenCalledTimes(1);
  });
});

describe('notificationService.sendSubscriptionCongratsEmail', () => {
  it('marks subscription congrats as sent for the user', async () => {
    const payload = {
      userId: 'user-sub-1',
      email: 'sub@example.com',
      firstName: 'Subscriber',
      tierId: 'premium',
    };

    await sendSubscriptionCongratsEmail(payload);
    expect(await hasSubscriptionCongratsBeenSent('user-sub-1')).toBe(true);
  });
});

