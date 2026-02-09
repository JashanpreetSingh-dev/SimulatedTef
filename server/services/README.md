# Server Services

Backend service layer for TEF Master. All services live in this directory and are re-exported from `index.ts`.

## Service list

| Service | File | Purpose |
|---------|------|---------|
| assignmentService | assignmentService.ts | Assignments CRUD, question generation, counter-based IDs |
| batchAssignmentService | batchAssignmentService.ts | Link assignments to batches, batch fetch assignments |
| batchService | batchService.ts | Batches CRUD, students in org |
| conversationLogService | conversationLogService.ts | Conversation logs for exams |
| d2cConfigService | d2cConfigService.ts | D2C default config (usage limits) |
| listeningTaskService | listeningTaskService.ts | Listening tasks from DB |
| mcqScoring | mcqScoring.ts | calculateMCQScore, validateAnswers (no DB) |
| mockExamService | mockExamService.ts | Mock exams, modules, status |
| organizationConfigService | organizationConfigService.ts | Org-level config |
| questionService | questionService.ts | Questions by task/assignment |
| readingTaskService | readingTaskService.ts | Reading tasks from DB |
| recordingsService | recordingsService.ts | Recording metadata (S3 keys, etc.) |
| resultsService | resultsService.ts | Results CRUD, votes, pagination |
| s3Service | s3Service.ts | S3 upload/download for audio |
| stripeService | stripeService.ts | Stripe customers, checkout, subscriptions |
| subscriptionService | subscriptionService.ts | Subscriptions in DB + Stripe sync |
| taskService | taskService.ts | Generic task fetching (reading/listening) |
| userUsageService | userUsageService.ts | Usage limits, can-start checks |
| voteAnalyticsService | voteAnalyticsService.ts | Vote analytics for admin |
| writtenTaskService | writtenTaskService.ts | Written-expression tasks |

## Who uses what

### Routes

- **results** – resultsService
- **recordings** – (controller) recordingsService, s3Service
- **evaluations** – (controller) resultsService, userUsageService
- **usage** – userUsageService
- **exam** – userUsageService, mockExamService
- **tasks** – readingTaskService, listeningTaskService, questionService, taskService
- **audio** – s3Service
- **assignments** – assignmentService
- **batches** – batchService
- **batch-assignments** – batchAssignmentService
- **conversation-logs** – conversationLogService
- **admin** – conversationLogService, voteAnalyticsService, organizationConfigService, d2cConfigService
- **subscriptions** – subscriptionService, stripeService, userUsageService, d2cConfigService
- **stripeWebhooks** – subscriptionService

### Controllers

- **resultsController** – resultsService
- **evaluationController** – resultsService, userUsageService
- **recordingsController** – recordingsService, s3Service
- **mcqController** – mcqScoring, questionService, resultsService, taskService, readingTaskService, listeningTaskService
- **assignmentMCQController** – mcqScoring, questionService, taskService, readingTaskService, listeningTaskService, assignmentService

### Workers

- **evaluationWorker** – resultsService, taskService (and client gemini for AI)
- **questionGenerationWorker** – assignmentService

### Startup (server.ts)

- subscriptionService (initialize tiers), d2cConfigService (ensure default config)

### Internal (service-to-service)

- **batchAssignmentService** – batchService, assignmentService
- **mockExamService** – writtenTaskService

Update this doc when adding or retiring services.
