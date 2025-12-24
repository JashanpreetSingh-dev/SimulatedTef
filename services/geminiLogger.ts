/**
 * Logging middleware for Gemini API calls
 * Intercepts API calls and logs token usage, costs, and metadata
 * 
 * Supports both frontend (via API) and backend (direct service) logging
 */

const BACKEND_URL = typeof window === 'undefined' 
  ? process.env.BACKEND_URL || 'http://localhost:3001'
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

// Check if we're running on the server side
const IS_SERVER = typeof window === 'undefined';

// Lazy import for server-side logging service
let apiLogServicePromise: Promise<typeof import('../server/services/apiLogService').apiLogService> | null = null;
let apiLogService: typeof import('../server/services/apiLogService').apiLogService | null = null;

if (IS_SERVER) {
  // On server, import the service directly
  apiLogServicePromise = import('../server/services/apiLogService').then(module => {
    apiLogService = module.apiLogService;
    return module.apiLogService;
  });
}

/**
 * Extract token usage from Gemini API response
 * The response structure may vary, so we check multiple possible locations
 */
function extractTokenUsage(response: any): {
  inputTokens: number;
  outputTokens: number;
} {
  let inputTokens = 0;
  let outputTokens = 0;

  // Try to extract from usageMetadata (most common location)
  if (response?.usageMetadata) {
    inputTokens = response.usageMetadata.promptTokenCount || 0;
    outputTokens = response.usageMetadata.candidatesTokenCount || 0;
  }

  // Try alternative locations
  if (inputTokens === 0 && outputTokens === 0) {
    if (response?.promptTokenCount !== undefined) {
      inputTokens = response.promptTokenCount;
    }
    if (response?.candidatesTokenCount !== undefined) {
      outputTokens = response.candidatesTokenCount;
    }
  }

  // Try totalTokenCount and estimate split (if only total is available)
  if (inputTokens === 0 && outputTokens === 0 && response?.totalTokenCount) {
    // Rough estimate: assume 70% input, 30% output (typical for evaluation tasks)
    inputTokens = Math.floor(response.totalTokenCount * 0.7);
    outputTokens = Math.floor(response.totalTokenCount * 0.3);
  }

  // Fallback: estimate from text length if available
  if (inputTokens === 0 && outputTokens === 0) {
    // Rough estimate: ~4 characters per token
    if (response?.text) {
      outputTokens = Math.ceil(response.text.length / 4);
    }
  }

  return {
    inputTokens: Math.max(0, inputTokens),
    outputTokens: Math.max(0, outputTokens),
  };
}

/**
 * Log an API call (non-blocking)
 * Uses direct service call on server, HTTP API on client
 */
async function logApiCall(
  functionName: string,
  model: string,
  response: any,
  duration: number,
  status: 'success' | 'error',
  options?: {
    userId?: string;
    sessionId?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
    authToken?: string | (() => Promise<string | null>);
  }
): Promise<void> {
  try {
    const { inputTokens, outputTokens } = extractTokenUsage(response);

    const logData = {
      functionName,
      model,
      inputTokens,
      outputTokens,
      duration,
      status,
      userId: options?.userId,
      sessionId: options?.sessionId,
      errorMessage: options?.errorMessage,
      metadata: {
        ...options?.metadata,
        // Include response metadata if available
        hasUsageMetadata: !!response?.usageMetadata,
        responseTextLength: response?.text?.length,
      },
    };

    if (IS_SERVER) {
      // Server-side: ensure service is loaded, then use it
      if (!apiLogService && apiLogServicePromise) {
        apiLogService = await apiLogServicePromise;
      }
      if (apiLogService) {
        await apiLogService.logApiCall(logData);
      }
    } else {
      // Client-side: make HTTP request to backend
      try {
        let token: string | null = null;
        if (options?.authToken) {
          token = typeof options.authToken === 'function' 
            ? await options.authToken() 
            : options.authToken;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(`${BACKEND_URL}/api/logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify(logData),
        });
      } catch (fetchError: any) {
        // Silently fail on client-side logging errors
        console.debug('Failed to log API call to backend:', fetchError.message);
      }
    }
  } catch (error: any) {
    // Don't throw - logging failures should not break API calls
    console.error('❌ Failed to log API call:', error.message);
  }
}

/**
 * Wrap an async function with logging
 */
export function withLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName: string,
  model: string,
  options?: {
    userId?: string;
    sessionId?: string;
    authToken?: string | (() => Promise<string | null>);
    getMetadata?: (args: Parameters<T>) => Record<string, any>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let response: any = null;
    let error: any = null;

    try {
      response = await fn(...args);
      const duration = Date.now() - startTime;

      // Log successful call (non-blocking)
      logApiCall(
        functionName,
        model,
        response,
        duration,
        'success',
        {
          userId: options?.userId,
          sessionId: options?.sessionId,
          authToken: options?.authToken,
          metadata: options?.getMetadata ? options.getMetadata(args) : undefined,
        }
      );

      return response;
    } catch (err: any) {
      error = err;
      const duration = Date.now() - startTime;

      // Log failed call (non-blocking)
      logApiCall(
        functionName,
        model,
        {}, // No response for errors
        duration,
        'error',
        {
          userId: options?.userId,
          sessionId: options?.sessionId,
          authToken: options?.authToken,
          errorMessage: err?.message || 'Unknown error',
          metadata: {
            ...(options?.getMetadata ? options.getMetadata(args) : {}),
            errorType: err?.name,
            errorCode: err?.code,
          },
        }
      );

      throw err;
    }
  }) as T;
}

/**
 * Log a direct API call (for cases where wrapping is not possible)
 */
export async function logDirectApiCall(
  functionName: string,
  model: string,
  response: any,
  duration: number,
  status: 'success' | 'error',
  options?: {
    userId?: string;
    sessionId?: string;
    authToken?: string | (() => Promise<string | null>);
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await logApiCall(functionName, model, response, duration, status, options);
}

