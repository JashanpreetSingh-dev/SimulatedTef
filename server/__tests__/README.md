# Backend Testing

This directory contains comprehensive tests for the backend server.

## Test Structure

- `helpers/` - Test utilities, mocks, and fixtures
- `fixtures/` - Test data fixtures
- `unit/` - Unit tests for services, controllers, middleware
- `integration/` - Integration tests for API routes
- `workers/` - Tests for background workers and queues
- `db/` - Database connection tests

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Test Environment

Tests use an in-memory MongoDB server (mongodb-memory-server) for database operations. External services (Clerk, S3, Gemini, Redis) are mocked.

## Environment Variables

Create a `.env.test` file (or set environment variables) with test configuration:

```
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=tef_master_test
CLERK_SECRET_KEY=test_secret_key
```

Note: The actual `.env.test` file is gitignored. Use the values above as a reference.

## Test Coverage

Aim for 80%+ code coverage. Focus on:
- Business logic
- Error handling
- Edge cases
- Validation

## Writing Tests

### Unit Tests
- Mock external dependencies
- Test in isolation
- Fast execution

### Integration Tests
- Use real database (in-memory)
- Test full request/response cycle
- Use supertest for HTTP testing

### Worker Tests
- Mock queue infrastructure
- Test processing logic
- Test error handling and retries
