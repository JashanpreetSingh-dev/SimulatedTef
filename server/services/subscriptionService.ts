/**
 * Subscription service - handles subscription logic and usage tracking
 */

import { connectDB } from '../db/connection';
import { Subscription, SubscriptionType, createSubscription, validateSubscription } from '../models/subscription';
import { Usage, createUsage, getTodayUTC, validateUsage } from '../models/usage';
import { ExamSession, createExamSession, validateExamSession, ExamType } from '../models/examSession';

export interface SubscriptionStatus {
  subscriptionType: SubscriptionType;
  isActive: boolean;
  trialDaysRemaining?: number;
  // Pack fields
  packType?: 'STARTER_PACK' | 'EXAM_READY_PACK';
  packExpirationDate?: string;
  packCredits?: {
    fullTests: { total: number; used: number; remaining: number };
    sectionA: { total: number; used: number; remaining: number };
    sectionB: { total: number; used: number; remaining: number };
  };
  limits: {
    fullTests: number; // Daily limit from TRIAL
    sectionA: number; // Daily limit from TRIAL
    sectionB: number; // Daily limit from TRIAL
  };
  usage: {
    fullTestsUsed: number; // Daily usage
    sectionAUsed: number; // Daily usage
    sectionBUsed: number; // Daily usage
  };
}

export interface CanStartExamResult {
  canStart: boolean;
  reason?: string;
  sessionId?: string;
}

/**
 * Check if a user is a super user (bypasses all limits)
 */
function isSuperUser(userId: string): boolean {
  const superUserId = process.env.SUPER_USER_ID;
  return superUserId ? userId === superUserId : false;
}

export const subscriptionService = {
  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const db = await connectDB();
    
    // Get subscription
    let subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    // Auto-initialize trial if no subscription exists
    if (!subscription) {
      subscription = await this.initializeTrial(userId);
    }
    
    // Get today's usage
    const today = getTodayUTC();
    const usage = await db.collection('usage').findOne({ userId, date: today }) as unknown as Usage | null;
    
    // Determine active subscription type and limits
    let subscriptionType: SubscriptionType = 'EXPIRED';
    let isActive = false;
    let trialDaysRemaining: number | undefined;
    let packType: 'STARTER_PACK' | 'EXAM_READY_PACK' | undefined;
    let packExpirationDate: string | undefined;
    let packCredits: SubscriptionStatus['packCredits'] | undefined;
    
    const limits = {
      fullTests: 0, // Daily limit from TRIAL
      sectionA: 0, // Daily limit from TRIAL
      sectionB: 0, // Daily limit from TRIAL
    };
    
    if (subscription) {
      subscriptionType = subscription.subscriptionType;
      
      // Check trial
      if (subscription.subscriptionType === 'TRIAL' && subscription.trialStartDate) {
        const trialStart = new Date(subscription.trialStartDate);
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 3);
        const now = new Date();
        
        if (now < trialEnd) {
          isActive = true;
          trialDaysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          limits.fullTests = 1;
          limits.sectionA = 1;
          limits.sectionB = 1;
        }
      }
      
      // Check pack (can work alongside TRIAL)
      if (subscription.packType && subscription.packExpirationDate) {
        const expirationDate = new Date(subscription.packExpirationDate);
        const now = new Date();
        
        if (now < expirationDate) {
          // Pack is active
          packType = subscription.packType;
          packExpirationDate = subscription.packExpirationDate;
          
          // Calculate pack credits
          const fullTotal = subscription.packFullTestsTotal || 0;
          const fullUsed = subscription.packFullTestsUsed || 0;
          const sectionATotal = subscription.packSectionATotal || 0;
          const sectionAUsed = subscription.packSectionAUsed || 0;
          const sectionBTotal = subscription.packSectionBTotal || 0;
          const sectionBUsed = subscription.packSectionBUsed || 0;
          
          packCredits = {
            fullTests: {
              total: fullTotal,
              used: fullUsed,
              remaining: Math.max(0, fullTotal - fullUsed),
            },
            sectionA: {
              total: sectionATotal,
              used: sectionAUsed,
              remaining: Math.max(0, sectionATotal - sectionAUsed),
            },
            sectionB: {
              total: sectionBTotal,
              used: sectionBUsed,
              remaining: Math.max(0, sectionBTotal - sectionBUsed),
            },
          };
        }
      }
    }
    
    return {
      subscriptionType,
      isActive,
      trialDaysRemaining,
      packType,
      packExpirationDate,
      packCredits,
      limits,
      usage: {
        fullTestsUsed: usage?.fullTestsUsed ?? 0,
        sectionAUsed: usage?.sectionAUsed ?? 0,
        sectionBUsed: usage?.sectionBUsed ?? 0,
      },
    };
  },

  /**
   * Validate subscription and usage data to prevent edge cases
   */
  async validateSubscriptionData(userId: string): Promise<void> {
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    if (!subscription) return;
    
    // Prevent negative pack counts
    if (subscription.packFullTestsUsed !== undefined && subscription.packFullTestsUsed < 0) {
      console.warn(`Fixing negative packFullTestsUsed for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packFullTestsUsed: 0, updatedAt: new Date().toISOString() } }
      );
    }
    
    if (subscription.packSectionAUsed !== undefined && subscription.packSectionAUsed < 0) {
      console.warn(`Fixing negative packSectionAUsed for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packSectionAUsed: 0, updatedAt: new Date().toISOString() } }
      );
    }
    
    if (subscription.packSectionBUsed !== undefined && subscription.packSectionBUsed < 0) {
      console.warn(`Fixing negative packSectionBUsed for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packSectionBUsed: 0, updatedAt: new Date().toISOString() } }
      );
    }
    
    // Ensure used doesn't exceed total
    if (subscription.packFullTestsTotal !== undefined && 
        subscription.packFullTestsUsed !== undefined &&
        subscription.packFullTestsUsed > subscription.packFullTestsTotal) {
      console.warn(`Fixing packFullTestsUsed > packFullTestsTotal for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packFullTestsUsed: subscription.packFullTestsTotal, updatedAt: new Date().toISOString() } }
      );
    }
    
    if (subscription.packSectionATotal !== undefined && 
        subscription.packSectionAUsed !== undefined &&
        subscription.packSectionAUsed > subscription.packSectionATotal) {
      console.warn(`Fixing packSectionAUsed > packSectionATotal for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packSectionAUsed: subscription.packSectionATotal, updatedAt: new Date().toISOString() } }
      );
    }
    
    if (subscription.packSectionBTotal !== undefined && 
        subscription.packSectionBUsed !== undefined &&
        subscription.packSectionBUsed > subscription.packSectionBTotal) {
      console.warn(`Fixing packSectionBUsed > packSectionBTotal for user ${userId}`);
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: { packSectionBUsed: subscription.packSectionBTotal, updatedAt: new Date().toISOString() } }
      );
    }
  },

  /**
   * Check if user can start an exam WITHOUT counting usage (read-only check)
   */
  async checkCanStartExam(userId: string, examType: ExamType): Promise<CanStartExamResult> {
    // Super user bypasses all checks
    if (isSuperUser(userId)) {
      return { canStart: true };
    }
    
    const db = await connectDB();
    
    // Validate subscription data first
    await this.validateSubscriptionData(userId);
    
    const status = await this.getSubscriptionStatus(userId);
    const today = getTodayUTC();
    
    // Validate subscription hasn't expired
    if (status.subscriptionType === 'EXPIRED') {
      return { canStart: false, reason: 'Subscription has expired' };
    }
    
    // Check if pack has expired
    if (status.packExpirationDate) {
      const expirationDate = new Date(status.packExpirationDate);
      const now = new Date();
      if (now >= expirationDate) {
        return { canStart: false, reason: 'Pack has expired' };
      }
    }
    
    // Get today's usage (don't create if it doesn't exist - just check)
    const usage = await db.collection('usage').findOne({ userId, date: today }) as unknown as Usage | null;
    
    // Check subscription and limits based on exam type (read-only)
    if (examType === 'full') {
      // Check if user has daily limit available (TRIAL)
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        const fullTestsUsed = usage?.fullTestsUsed || 0;
        if (fullTestsUsed < status.limits.fullTests) {
          return { canStart: true }; // Daily limit available
        }
      }
      
      // Check pack credits
      if (status.packCredits && status.packCredits.fullTests.remaining > 0) {
        return { canStart: true }; // Pack credits available
      }
      
      // No daily limit and no pack credits available
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily full test limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'No active subscription or pack' };
      }
    } else if (examType === 'partA') {
      // Check if user has daily limit available (TRIAL)
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        const sectionAUsed = usage?.sectionAUsed || 0;
        if (sectionAUsed < status.limits.sectionA) {
          return { canStart: true }; // Daily limit available
        }
      }
      
      // Check pack credits
      if (status.packCredits && status.packCredits.sectionA.remaining > 0) {
        return { canStart: true }; // Pack credits available
      }
      
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily Section A limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'No active subscription or pack' };
      }
    } else if (examType === 'partB') {
      // Check if user has daily limit available (TRIAL)
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        const sectionBUsed = usage?.sectionBUsed || 0;
        if (sectionBUsed < status.limits.sectionB) {
          return { canStart: true }; // Daily limit available
        }
      }
      
      // Check pack credits
      if (status.packCredits && status.packCredits.sectionB.remaining > 0) {
        return { canStart: true }; // Pack credits available
      }
      
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily Section B limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'No active subscription or pack' };
      }
    }
    
    return { canStart: false, reason: 'Invalid exam type' };
  },

  /**
   * Check if user can start an exam and create session if yes (COUNTS USAGE)
   */
  async canStartExam(userId: string, examType: ExamType): Promise<CanStartExamResult> {
    // Super user bypasses all checks and limits
    if (isSuperUser(userId)) {
      const db = await connectDB();
      const session = createExamSession(userId, examType);
      const { _id, ...sessionToInsert } = session;
      await db.collection('examSessions').insertOne(sessionToInsert as any);
      return { canStart: true, sessionId: session.sessionId };
    }
    
    const db = await connectDB();
    
    // Validate subscription data first
    await this.validateSubscriptionData(userId);
    
    const status = await this.getSubscriptionStatus(userId);
    const today = getTodayUTC();
    
    // Validate subscription hasn't expired
    if (status.subscriptionType === 'EXPIRED') {
      return { canStart: false, reason: 'Subscription has expired' };
    }
    
    // Check if pack has expired
    if (status.packExpirationDate) {
      const expirationDate = new Date(status.packExpirationDate);
      const now = new Date();
      if (now >= expirationDate) {
        return { canStart: false, reason: 'Pack has expired' };
      }
    }
    
    // Get or create today's usage
    let usage = await db.collection('usage').findOne({ userId, date: today }) as unknown as Usage | null;
    if (!usage) {
      usage = createUsage(userId, today);
      const { _id, ...usageToInsert } = usage;
      await db.collection('usage').insertOne(usageToInsert as any);
    }
    
    // Validate usage counts are non-negative
    if (usage.fullTestsUsed < 0 || usage.sectionAUsed < 0 || usage.sectionBUsed < 0) {
      console.warn(`Fixing negative usage counts for user ${userId}`);
      await db.collection('usage').updateOne(
        { userId, date: today },
        { 
          $set: { 
            fullTestsUsed: Math.max(0, usage.fullTestsUsed),
            sectionAUsed: Math.max(0, usage.sectionAUsed),
            sectionBUsed: Math.max(0, usage.sectionBUsed),
            updatedAt: new Date().toISOString()
          } 
        }
      );
      // Reload usage after fix
      usage = await db.collection('usage').findOne({ userId, date: today }) as unknown as Usage;
    }
    
    // Check subscription and limits based on exam type
    if (examType === 'full') {
      // For full tests: Use daily limit first (TRIAL), then fall back to pack credits
      // This allows users to maximize value - use daily tests first, then pack credits
      
      // Check if user has daily limit available (TRIAL) and hasn't used it today
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        if (usage.fullTestsUsed < status.limits.fullTests) {
          // Daily limit available - use it first
          // Use transaction to prevent race conditions
          const mongoSession = db.client.startSession();
          let sessionId: string | undefined;
          
          try {
            await mongoSession.withTransaction(async () => {
              // Re-check usage within transaction
              const currentUsage = await db.collection('usage').findOne(
                { userId, date: today },
                { session: mongoSession }
              ) as unknown as Usage | null;
              
              if (!currentUsage || currentUsage.fullTestsUsed >= status.limits.fullTests) {
                throw new Error('Daily full test limit reached');
              }
              
              const session = createExamSession(userId, examType);
              sessionId = session.sessionId;
              const { _id, ...sessionToInsert } = session;
              await db.collection('examSessions').insertOne(sessionToInsert as any, { session: mongoSession });
              
              await db.collection('usage').updateOne(
                { userId, date: today },
                { $inc: { fullTestsUsed: 1 }, $set: { updatedAt: new Date().toISOString() } },
                { session: mongoSession }
              );
            });
            
            // Transaction succeeded
            if (sessionId) {
              return { canStart: true, sessionId };
            }
          } catch (error: any) {
            // If transaction failed due to limit reached, fall through to pack check
            if (error.message !== 'Daily full test limit reached') {
              console.error(`Error in canStartExam transaction:`, error);
              throw error;
            }
            // Continue to pack check below
          } finally {
            await mongoSession.endSession();
          }
        }
      }
      
      // Daily limit not available or used - check pack credits
      if (status.packCredits && status.packCredits.fullTests.remaining > 0) {
        // Pack credits available - use them
        // Use MongoDB transaction to ensure atomicity and prevent race conditions
        const mongoSession2 = db.client.startSession();
        let sessionId2: string | undefined;
        
        try {
          await mongoSession2.withTransaction(async () => {
            // Re-check pack availability within transaction (prevent race conditions)
            const currentSub = await db.collection('subscriptions').findOne(
              { userId },
              { session: mongoSession2 }
            ) as unknown as Subscription | null;
            
            if (!currentSub || 
                !currentSub.packFullTestsTotal || 
                (currentSub.packFullTestsUsed || 0) >= currentSub.packFullTestsTotal) {
              throw new Error('Pack full tests no longer available');
            }
            
            const session = createExamSession(userId, examType);
            sessionId2 = session.sessionId;
            const { _id, ...sessionToInsert } = session;
            await db.collection('examSessions').insertOne(sessionToInsert as any, { session: mongoSession2 });
            
            await db.collection('subscriptions').updateOne(
              { userId },
              { $inc: { packFullTestsUsed: 1 }, $set: { updatedAt: new Date().toISOString() } },
              { session: mongoSession2 }
            );
          });
          
          if (sessionId2) {
            return { canStart: true, sessionId: sessionId2 };
          }
        } catch (error: any) {
          console.error(`Error in pack transaction:`, error);
          return { canStart: false, reason: 'Pack full tests no longer available' };
        } finally {
          await mongoSession2.endSession();
        }
      }
      
      // No daily limit and no pack credits available
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily full test limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'No active subscription or pack' };
      }
    } else if (examType === 'partA') {
      // Section A: Use daily limit first (TRIAL), then pack credits
      
      // Check if user has daily limit available (TRIAL) and hasn't used it today
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        if (usage.sectionAUsed < status.limits.sectionA) {
          // Daily limit available - use it first
          const session = createExamSession(userId, examType);
          const { _id, ...sessionToInsert } = session;
          await db.collection('examSessions').insertOne(sessionToInsert as any);
          
          await db.collection('usage').updateOne(
            { userId, date: today },
            { $inc: { sectionAUsed: 1 }, $set: { updatedAt: new Date().toISOString() } }
          );
          
          return { canStart: true, sessionId: session.sessionId };
        }
      }
      
      // Daily limit not available or used - check pack credits
      if (status.packCredits && status.packCredits.sectionA.remaining > 0) {
        // Pack credits available - use them
        const mongoSession = db.client.startSession();
        let sessionId: string | undefined;
        
        try {
          await mongoSession.withTransaction(async () => {
            const currentSub = await db.collection('subscriptions').findOne(
              { userId },
              { session: mongoSession }
            ) as unknown as Subscription | null;
            
            if (!currentSub || 
                !currentSub.packSectionATotal || 
                (currentSub.packSectionAUsed || 0) >= currentSub.packSectionATotal) {
              throw new Error('Pack Section A credits no longer available');
            }
            
            const session = createExamSession(userId, examType);
            sessionId = session.sessionId;
            const { _id, ...sessionToInsert } = session;
            await db.collection('examSessions').insertOne(sessionToInsert as any, { session: mongoSession });
            
            await db.collection('subscriptions').updateOne(
              { userId },
              { $inc: { packSectionAUsed: 1 }, $set: { updatedAt: new Date().toISOString() } },
              { session: mongoSession }
            );
          });
          
          if (sessionId) {
            return { canStart: true, sessionId };
          }
        } catch (error: any) {
          console.error(`Error in pack Section A transaction:`, error);
          return { canStart: false, reason: 'Pack Section A credits no longer available' };
        } finally {
          await mongoSession.endSession();
        }
      }
      
      // No daily limit and no pack credits available
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily Section A limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'Section A not available with current subscription or pack' };
      }
    } else if (examType === 'partB') {
      // Section B: Use daily limit first (TRIAL), then pack credits
      
      // Check if user has daily limit available (TRIAL) and hasn't used it today
      if (status.isActive && status.subscriptionType === 'TRIAL') {
        if (usage.sectionBUsed < status.limits.sectionB) {
          // Daily limit available - use it first
          const session = createExamSession(userId, examType);
          const { _id, ...sessionToInsert } = session;
          await db.collection('examSessions').insertOne(sessionToInsert as any);
          
          await db.collection('usage').updateOne(
            { userId, date: today },
            { $inc: { sectionBUsed: 1 }, $set: { updatedAt: new Date().toISOString() } }
          );
          
          return { canStart: true, sessionId: session.sessionId };
        }
      }
      
      // Daily limit not available or used - check pack credits
      if (status.packCredits && status.packCredits.sectionB.remaining > 0) {
        // Pack credits available - use them
        const mongoSession = db.client.startSession();
        let sessionId: string | undefined;
        
        try {
          await mongoSession.withTransaction(async () => {
            const currentSub = await db.collection('subscriptions').findOne(
              { userId },
              { session: mongoSession }
            ) as unknown as Subscription | null;
            
            if (!currentSub || 
                !currentSub.packSectionBTotal || 
                (currentSub.packSectionBUsed || 0) >= currentSub.packSectionBTotal) {
              throw new Error('Pack Section B credits no longer available');
            }
            
            const session = createExamSession(userId, examType);
            sessionId = session.sessionId;
            const { _id, ...sessionToInsert } = session;
            await db.collection('examSessions').insertOne(sessionToInsert as any, { session: mongoSession });
            
            await db.collection('subscriptions').updateOne(
              { userId },
              { $inc: { packSectionBUsed: 1 }, $set: { updatedAt: new Date().toISOString() } },
              { session: mongoSession }
            );
          });
          
          if (sessionId) {
            return { canStart: true, sessionId };
          }
        } catch (error: any) {
          console.error(`Error in pack Section B transaction:`, error);
          return { canStart: false, reason: 'Pack Section B credits no longer available' };
        } finally {
          await mongoSession.endSession();
        }
      }
      
      // No daily limit and no pack credits available
      if (status.isActive || status.packCredits) {
        return { canStart: false, reason: 'Daily Section B limit reached and no pack credits available' };
      } else {
        return { canStart: false, reason: 'Section B not available with current subscription or pack' };
      }
    }
    
    return { canStart: false, reason: 'Invalid exam type' };
  },

  /**
   * Initialize trial for a new user
   */
  async initializeTrial(userId: string): Promise<Subscription> {
    const db = await connectDB();
    
    // Check if subscription already exists
    const existing = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    if (existing) {
      return existing;
    }
    
    // Create trial subscription
    const trial = createSubscription(userId, 'TRIAL', {
      trialStartDate: new Date().toISOString(),
    });
    
    const { _id, ...trialToInsert } = trial;
    await db.collection('subscriptions').insertOne(trialToInsert as any);
    return trial;
  },

  /**
   * Get daily usage for a specific date
   */
  async getDailyUsage(userId: string, date: string): Promise<Usage | null> {
    const db = await connectDB();
    return await db.collection('usage').findOne({ userId, date }) as unknown as Usage | null;
  },

  /**
   * Validate exam session
   */
  async validateExamSession(userId: string, sessionId: string): Promise<ExamSession | null> {
    const db = await connectDB();
    return await db.collection('examSessions').findOne({ userId, sessionId }) as unknown as ExamSession | null;
  },

  /**
   * Mark exam session as completed
   */
  async completeExamSession(userId: string, sessionId: string, resultId?: string, status: 'completed' | 'failed' = 'completed'): Promise<void> {
    const db = await connectDB();
    await db.collection('examSessions').updateOne(
      { userId, sessionId },
      { 
        $set: { 
          completed: true, 
          resultId, 
          status,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        } 
      }
    );
  },

  /**
   * Check if user can purchase a pack
   * Returns info about active pack if one exists
   */
  async canPurchasePack(userId: string): Promise<{
    canPurchase: boolean;
    reason?: string;
    hasActivePack: boolean;
    activePackType?: 'STARTER_PACK' | 'EXAM_READY_PACK';
    activePackExpiration?: string;
    activePackCredits?: {
      fullTests: { remaining: number };
      sectionA: { remaining: number };
      sectionB: { remaining: number };
    };
  }> {
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    if (!subscription || !subscription.packType || !subscription.packExpirationDate) {
      return { canPurchase: true, hasActivePack: false };
    }
    
    // Check if pack is expired
    const expirationDate = new Date(subscription.packExpirationDate);
    const now = new Date();
    
    if (now >= expirationDate) {
      // Pack is expired, can purchase new one
      return { canPurchase: true, hasActivePack: false };
    }
    
    // Pack is active - user can upgrade (replace)
    const fullRemaining = Math.max(0, (subscription.packFullTestsTotal || 0) - (subscription.packFullTestsUsed || 0));
    const sectionARemaining = Math.max(0, (subscription.packSectionATotal || 0) - (subscription.packSectionAUsed || 0));
    const sectionBRemaining = Math.max(0, (subscription.packSectionBTotal || 0) - (subscription.packSectionBUsed || 0));
    
    return {
      canPurchase: true, // Can upgrade (replace)
      hasActivePack: true,
      activePackType: subscription.packType,
      activePackExpiration: subscription.packExpirationDate,
      activePackCredits: {
        fullTests: { remaining: fullRemaining },
        sectionA: { remaining: sectionARemaining },
        sectionB: { remaining: sectionBRemaining },
      },
    };
  },

  /**
   * Initialize pack for a user
   */
  async initializePack(
    userId: string,
    packType: 'STARTER_PACK' | 'EXAM_READY_PACK'
  ): Promise<Subscription> {
    const db = await connectDB();
    
    // Pack credits based on type
    const packCredits = {
      STARTER_PACK: {
        fullTests: 5,
        sectionA: 10,
        sectionB: 10,
      },
      EXAM_READY_PACK: {
        fullTests: 20,
        sectionA: 20,
        sectionB: 20,
      },
    };
    
    const credits = packCredits[packType];
    const purchaseDate = new Date();
    const expirationDate = new Date(purchaseDate);
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from purchase
    
    // Get or create subscription
    let subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    if (!subscription) {
      // Create new subscription with TRIAL + pack
      subscription = createSubscription(userId, 'TRIAL', {
        trialStartDate: new Date().toISOString(),
        packType,
        packPurchasedDate: purchaseDate.toISOString(),
        packExpirationDate: expirationDate.toISOString(),
        packFullTestsTotal: credits.fullTests,
        packFullTestsUsed: 0,
        packSectionATotal: credits.sectionA,
        packSectionAUsed: 0,
        packSectionBTotal: credits.sectionB,
        packSectionBUsed: 0,
      });
      const { _id, ...subToInsert } = subscription;
      await db.collection('subscriptions').insertOne(subToInsert as any);
    } else {
      // Update existing subscription with pack (replace if upgrading)
      const update: any = {
        packType,
        packPurchasedDate: purchaseDate.toISOString(),
        packExpirationDate: expirationDate.toISOString(),
        packFullTestsTotal: credits.fullTests,
        packFullTestsUsed: 0, // Reset on upgrade
        packSectionATotal: credits.sectionA,
        packSectionAUsed: 0, // Reset on upgrade
        packSectionBTotal: credits.sectionB,
        packSectionBUsed: 0, // Reset on upgrade
        updatedAt: new Date().toISOString(),
      };
      
      // If upgrading, log warning
      if (subscription.packType && subscription.packExpirationDate) {
        const oldExpiration = new Date(subscription.packExpirationDate);
        if (oldExpiration > new Date()) {
          console.warn(`User ${userId} is upgrading pack: ${subscription.packType} -> ${packType}. Old credits will be lost.`);
        }
      }
      
      await db.collection('subscriptions').updateOne(
        { userId },
        { $set: update }
      );
      
      subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription;
    }
    
    return subscription!;
  },

  /**
   * Expire cancelled subscriptions that have passed their end date
   * This is called by the scheduled job, but can also be called manually
   */
  async expireCancelledSubscriptions(): Promise<number> {
    const { expireCancelledSubscriptions } = await import('../jobs/subscriptionExpiry');
    return await expireCancelledSubscriptions();
  },

  /**
   * Check if user can start a mock exam (uses fullTests credit)
   */
  async canStartMockExam(userId: string): Promise<CanStartExamResult> {
    // Mock exam uses same credit as full exam
    return this.canStartExam(userId, 'full');
  },

  /**
   * Get user's active incomplete mock exam
   */
  async getActiveMockExam(userId: string): Promise<any> {
    const db = await connectDB();
    
    const usage = await db.collection('usage').findOne({ userId });
    const activeMockExamId = usage?.activeMockExamId as string | undefined;
    
    if (!activeMockExamId) {
      return null;
    }
    
    // Find session - don't filter by completed=false because we want to show resumable exams
    // Even if completed=true is set, if not all 4 modules are done, it should still be resumable
    const session = await db.collection('examSessions').findOne({
      userId,
      mockExamId: activeMockExamId,
      examType: 'mock',
    });
    
    if (!session) {
      return null;
    }
    
    // Check if all 4 modules are completed - if so, don't return as active
    const completedModules = (session.completedModules as string[]) || [];
    if (completedModules.length === 4) {
      return null; // Fully completed, not active
    }
    
    return session;
  },

  /**
   * Check if user has completed a specific mock exam
   */
  async hasCompletedMockExam(userId: string, mockExamId: string): Promise<boolean> {
    const db = await connectDB();

    const usage = await db.collection('usage').findOne({ userId });
    const completedMockExamIds = (usage?.completedMockExamIds as string[]) || [];

    return completedMockExamIds.includes(mockExamId);
  },

  /**
   * Get all completed mock exam IDs for a user
   */
  async getCompletedMockExamIds(userId: string): Promise<string[]> {
    const db = await connectDB();

    const usage = await db.collection('usage').findOne({ userId });
    const completedMockExamIds = (usage?.completedMockExamIds as string[]) || [];

    return completedMockExamIds;
  },

  /**
   * Mark mock exam as completed
   */
  async markMockExamCompleted(userId: string, mockExamId: string): Promise<void> {
    const db = await connectDB();
    
    await db.collection('usage').updateOne(
      { userId },
      {
        $addToSet: { completedMockExamIds: mockExamId },
        $unset: {
          activeMockExamId: '',
          activeMockExamSessionId: '',
        },
        $set: {
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
  },
};

