/**
 * Unit tests for error handler middleware
 */

import { describe, it, expect, vi } from 'vitest';
import { errorHandler, AppError, asyncHandler } from '../../../middleware/errorHandler';
import { createMockRequest, createMockResponse } from '../../helpers/testAuth';

describe('errorHandler', () => {
  it('should handle AppError with status code', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const error = new AppError('Test error', 400);
    errorHandler(error, req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
      })
    );
  });

  it('should handle generic Error', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const error = new Error('Generic error');
    errorHandler(error, req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Generic error',
      })
    );
  });

  it('should include stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const error = new Error('Test error');
    errorHandler(error, req as any, res as any, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
      })
    );
  });

  it('should not include stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const error = new Error('Test error');
    errorHandler(error, req as any, res as any, next);

    const jsonCall = (res.json as any).mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();
  });
});

describe('asyncHandler', () => {
  it('should call handler function', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await wrapped(req as any, res as any, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch errors and call next', async () => {
    const error = new Error('Handler error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    await wrapped(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('AppError', () => {
  it('should create AppError with default status code', () => {
    const error = new AppError('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should create AppError with custom status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });
});
