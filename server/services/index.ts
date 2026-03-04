/**
 * Service layer exports
 *
 * assignmentService – assignments CRUD, question generation, counter-based IDs
 * batchAssignmentService – link assignments to batches, batch fetch assignments
 * batchService – batches CRUD, students in org
 * conversationLogService – conversation logs for exams
 * d2cConfigService – D2C default config (usage limits)
 * listeningTaskService – listening tasks from DB
 * mcqScoring – calculateMCQScore, validateAnswers (no DB)
 * mockExamService – mock exams, modules, status
 * organizationConfigService – org-level config
 * questionService – questions by task/assignment
 * readingTaskService – reading tasks from DB
 * recordingsService – recording metadata (S3 keys, etc.)
 * resultsService – results CRUD, votes, pagination
 * s3Service – S3 upload/download for audio
 * stripeService – Stripe customers, checkout, subscriptions
 * subscriptionService – subscriptions in DB + Stripe sync
 * notificationService – transactional emails (welcome, subscriptions)
 * taskService – generic task fetching (reading/listening)
 * userUsageService – usage limits, can-start checks
 * voteAnalyticsService – vote analytics for admin
 * writtenTaskService – written-expression tasks
 */

export { assignmentService } from './assignmentService';
export { batchAssignmentService } from './batchAssignmentService';
export { batchService } from './batchService';
export { conversationLogService } from './conversationLogService';
export { d2cConfigService } from './d2cConfigService';
export { listeningTaskService } from './listeningTaskService';
export { calculateMCQScore, validateAnswers } from './mcqScoring';
export { mockExamService } from './mockExamService';
export { organizationConfigService } from './organizationConfigService';
export { questionService } from './questionService';
export { readingTaskService } from './readingTaskService';
export { recordingsService } from './recordingsService';
export { resultsService } from './resultsService';
export { s3Service } from './s3Service';
export { stripeService } from './stripeService';
export { subscriptionService } from './subscriptionService';
export { notificationService } from './notificationService';
export * as taskService from './taskService';
export { userUsageService } from './userUsageService';
export { voteAnalyticsService } from './voteAnalyticsService';
export { writtenTaskService } from './writtenTaskService';
