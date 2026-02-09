/**
 * Utility for making authenticated fetch requests with automatic token refresh on 401 errors
 */

// Check if we're in a Vite environment (client-side) or Node.js (server-side)
const isDev = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.DEV 
  : process.env.NODE_ENV !== 'production';

export interface AuthenticatedFetchOptions extends RequestInit {
  /**
   * Function to get the current token
   */
  getToken: () => Promise<string | null>;
  /**
   * Maximum number of retries on 401 errors (default: 1)
   */
  maxRetries?: number;
  /**
   * Maximum number of retries on 429 rate limit errors (default: 2)
   */
  maxRateLimitRetries?: number;
  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number,
    public statusCode: number = 429
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Makes an authenticated fetch request with automatic token refresh on 401 errors
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options including getToken function
 * @returns The fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions
): Promise<Response> {
  const { getToken, maxRetries = 1, maxRateLimitRetries = 2, timeout = 30000, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  let rateLimitAttempt = 0;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Always get a fresh token for each request attempt
      // This ensures we have a valid token even for long-running polling operations
      let token: string | null;
      try {
        // Add timeout protection for token fetch (5 seconds max)
        const tokenPromise = getToken();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Token fetch timeout')), 5000)
        );
        
        token = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (tokenError) {
        // If token fetch fails, throw a clear error
        throw new Error(`Failed to get authentication token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
      }
      
      // Prepare headers
      const headers = new Headers(fetchOptions.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      // Prevent caching for admin endpoints (org switching needs fresh data)
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        // Make the request
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // If successful, return response immediately
        if (response.ok) {
          return response;
        }
        
        // Handle 429 Rate Limit errors with retry logic
        if (response.status === 429) {
          // Get retry-after header if available (in seconds)
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
          
          // Calculate wait time: use retry-after header if available, otherwise exponential backoff
          const waitTime = retryAfter 
            ? retryAfter * 1000 // Convert seconds to milliseconds
            : Math.min(Math.pow(2, rateLimitAttempt) * 1000, 60000); // Max 60 seconds
          
          if (rateLimitAttempt < maxRateLimitRetries) {
            if (isDev) {
              console.log(`⏳ Rate limit hit (429), retrying in ${waitTime}ms... (attempt ${rateLimitAttempt + 1}/${maxRateLimitRetries})`);
            }
            
            rateLimitAttempt++;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Continue to retry - reset attempt counter for 401 retries
            continue;
          } else {
            // Out of retries, throw rate limit error
            const errorText = await response.text().catch(() => 'Too many requests');
            throw new RateLimitError(
              errorText || 'Too many requests. Please wait a moment and try again.',
              retryAfter,
              429
            );
          }
        }
        
        // If 401 and we have retries left, wait a bit and retry with fresh token
        if (response.status === 401 && attempt < maxRetries) {
          if (isDev) {
            console.log(`🔄 Token expired (401), refreshing and retrying... (attempt ${attempt + 1}/${maxRetries})`);
          }
          
          // Wait a bit to allow Clerk to refresh the token
          // Clerk automatically refreshes expired tokens when getToken() is called
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Continue to retry - next iteration will get a fresh token
          continue;
        }
        
        // For other errors or no retries left, return the response
        return response;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Re-throw RateLimitError as-is
        if (fetchError instanceof RateLimitError) {
          throw fetchError;
        }
        
        // Handle abort (timeout)
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        throw fetchError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Re-throw RateLimitError as-is
      if (lastError instanceof RateLimitError) {
        throw lastError;
      }
      
      // Don't retry on token fetch errors or non-network errors
      if (lastError.message.includes('authentication token') || lastError.message.includes('timeout')) {
        throw lastError;
      }
      
      // Only retry on network errors if we have retries left
      if (attempt < maxRetries) {
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      
      throw lastError;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed after retries');
}

/**
 * Convenience wrapper for authenticated JSON fetch requests
 */
export async function authenticatedFetchJSON<T = any>(
  url: string,
  options: AuthenticatedFetchOptions
): Promise<T> {
  try {
    const response = await authenticatedFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      
      // Handle 429 with better error message
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          errorText || 'Too many requests. Please wait a moment and try again.',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          429
        );
      }
      
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    // Re-throw RateLimitError as-is
    if (error instanceof RateLimitError) {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Convenience wrapper for authenticated fetch with FormData
 */
export async function authenticatedFetchFormData<T = any>(
  url: string,
  formData: FormData,
  options: Omit<AuthenticatedFetchOptions, 'body'> & { getToken: () => Promise<string | null> }
): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for FormData
    headers: {
      ...Object.fromEntries(
        Object.entries(options.headers || {}).filter(([key]) => 
          key.toLowerCase() !== 'content-type'
        )
      ),
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

