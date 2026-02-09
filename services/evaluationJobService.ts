/**
 * Service for submitting and polling evaluation jobs
 */

import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Helper type for token getter function
type TokenGetter = () => Promise<string | null>;

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: number;
  resultId?: string;
  error?: string;
}

export const evaluationJobService = {
  /**
   * Submit an evaluation job
   */
  async submitJob(
    section: 'OralExpression' | 'WrittenExpression',
    prompt: string,
    transcript: string | undefined, // Optional for OralExpression if audioBlob is provided
    scenarioId: number,
    timeLimitSec: number,
    questionCount: number | undefined,
    recordingId: string | undefined,
    mode: string,
    title: string,
    taskPartA: any,
    taskPartB: any,
    eo2RemainingSeconds: number | undefined,
    fluencyAnalysis: any | undefined,
    authTokenOrGetter: string | null | TokenGetter,
    writtenSectionAText?: string,
    writtenSectionBText?: string,
    mockExamId?: string,
    module?: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression',
    audioBlob?: Blob // New: audio blob for OralExpression (worker will transcribe)
  ): Promise<{ jobId: string }> {
    // Convert audio blob to base64 if provided
    let audioBlobBase64: string | undefined;
    if (audioBlob) {
      audioBlobBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result); // Already includes data:audio/wav;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    }

    // Use authenticated fetch if getToken is provided, otherwise use regular fetch
    if (typeof authTokenOrGetter === 'function') {
      const data = await authenticatedFetchJSON<{ jobId: string }>(
        `${BACKEND_URL}/api/evaluations`,
        {
          method: 'POST',
          getToken: authTokenOrGetter,
          body: JSON.stringify({
            section,
            prompt,
            transcript, // Optional for OralExpression if audioBlob is provided
            audioBlob: audioBlobBase64, // Base64 encoded audio for worker to transcribe
            scenarioId,
            timeLimitSec,
            questionCount,
            recordingId,
            mode,
            title,
            taskPartA,
            taskPartB,
            eo2RemainingSeconds,
            fluencyAnalysis,
            writtenSectionAText,
            writtenSectionBText,
            mockExamId,
            module,
          }),
        }
      );
      return { jobId: data.jobId };
    } else {
      // Fallback to regular fetch for backward compatibility
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authTokenOrGetter) {
        headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/evaluations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          section,
          prompt,
          transcript, // Optional for OralExpression if audioBlob is provided
          audioBlob: audioBlobBase64, // Base64 encoded audio for worker to transcribe
          scenarioId,
          timeLimitSec,
          questionCount,
          recordingId,
          mode,
          title,
          taskPartA,
          taskPartB,
          eo2RemainingSeconds,
          fluencyAnalysis,
          writtenSectionAText,
          writtenSectionBText,
          mockExamId,
          module,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit job: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return { jobId: data.jobId };
    }
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, authTokenOrGetter: string | null | TokenGetter): Promise<JobStatus> {
    // Use authenticated fetch if getToken is provided, otherwise use regular fetch
    if (typeof authTokenOrGetter === 'function') {
      return authenticatedFetchJSON<JobStatus>(
        `${BACKEND_URL}/api/evaluations/${jobId}`,
        {
          getToken: authTokenOrGetter,
        }
      );
    } else {
      // Fallback to regular fetch for backward compatibility
      const headers: HeadersInit = {};
      if (authTokenOrGetter) {
        headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/evaluations/${jobId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      return await response.json();
    }
  },

  /**
   * Get job result when completed
   */
  async getJobResult(jobId: string, authTokenOrGetter: string | null | TokenGetter): Promise<any> {
    // Use authenticated fetch if getToken is provided, otherwise use regular fetch
    if (typeof authTokenOrGetter === 'function') {
      return authenticatedFetchJSON(
        `${BACKEND_URL}/api/evaluations/${jobId}/result`,
        {
          getToken: authTokenOrGetter,
        }
      );
    } else {
      // Fallback to regular fetch for backward compatibility
      const headers: HeadersInit = {};
      if (authTokenOrGetter) {
        headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/evaluations/${jobId}/result`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get job result: ${response.status}`);
      }

      return await response.json();
    }
  },

  /**
   * Stream job status using Server-Sent Events (SSE) until completion
   */
  async streamJobStatus(
    jobId: string,
    authTokenOrGetter: string | null | TokenGetter,
    onProgress?: (progress: number) => void,
    timeoutMs: number = 300000 // 5 minutes max
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let eventSource: EventSource | null = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (eventSource) eventSource.close();
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Job streaming timeout'));
      }, timeoutMs);

      // Get token for authentication
      const getAuthHeader = async (): Promise<string | null> => {
        if (typeof authTokenOrGetter === 'function') {
          return await authTokenOrGetter();
        }
        return authTokenOrGetter;
      };

      // Get token and use fetch-based SSE (EventSource doesn't support custom headers)
      getAuthHeader().then((token) => {
        if (!token) {
          cleanup();
          reject(new Error('Authentication token required'));
          return;
        }

        // Use fetch-based SSE implementation (supports custom headers)
        // Pass the token getter so fresh tokens can be fetched when needed
        this.streamJobStatusWithFetch(jobId, token, authTokenOrGetter, onProgress, timeoutMs)
          .then((result) => {
            cleanup();
            resolve(result);
          })
          .catch((error) => {
            cleanup();
            reject(error);
          });
      }).catch((error) => {
        cleanup();
        reject(error);
      });
    });
  },

  /**
   * Stream job status using fetch-based SSE (supports custom headers)
   */
  async streamJobStatusWithFetch(
    jobId: string,
    token: string,
    authTokenOrGetter: string | null | TokenGetter,
    onProgress?: (progress: number) => void,
    timeoutMs: number = 300000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let abortController: AbortController | null = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (abortController) abortController.abort();
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Job streaming timeout'));
      }, timeoutMs);

      abortController = new AbortController();

      fetch(`${BACKEND_URL}/api/evaluations/${jobId}/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`SSE connection failed: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('Response body is not readable');
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              cleanup();
              reject(new Error('SSE stream ended unexpectedly'));
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (onProgress && data.progress !== undefined) {
                    onProgress(data.progress);
                  }

                  if (data.status === 'completed') {
                    cleanup();
                    if (data.result) {
                      resolve(data.result);
                    } else {
                      // Fetch result separately if not included in SSE message
                      // Use authTokenOrGetter to get a FRESH token (original token may be expired)
                      try {
                        const result = await this.getJobResult(jobId, authTokenOrGetter);
                        resolve(result);
                      } catch (fetchError) {
                        // If fetch fails, try polling as fallback
                        console.warn('SSE result fetch failed, falling back to polling:', fetchError);
                        // Fall through to polling fallback
                        throw fetchError;
                      }
                    }
                    return;
                  } else if (data.status === 'failed') {
                    cleanup();
                    reject(new Error(data.error || 'Job failed'));
                    return;
                  } else if (data.status === 'error') {
                    cleanup();
                    reject(new Error(data.error || 'SSE connection error'));
                    return;
                  }
                } catch (error) {
                  // If it's a parsing error, log it but continue
                  // If it's a fetch error from getJobResult, let it propagate
                  if (error instanceof Error && error.message.includes('Failed to fetch')) {
                    throw error; // Re-throw fetch errors to trigger fallback
                  }
                  console.error('Error parsing SSE data:', error);
                }
              }
            }
          }
        })
        .catch((error) => {
          cleanup();
          if (error.name !== 'AbortError') {
            reject(error);
          }
        });
    });
  },

  /**
   * Poll job status until completion (fallback method, kept for backward compatibility)
   */
  async pollJobStatus(
    jobId: string,
    authTokenOrGetter: string | null | TokenGetter,
    onProgress?: (progress: number) => void,
    intervalMs: number = 2000,
    maxAttempts: number = 150 // 5 minutes max (150 * 2s)
  ): Promise<any> {
    // Try SSE first, fallback to polling if SSE fails
    try {
      return await this.streamJobStatus(jobId, authTokenOrGetter, onProgress);
    } catch (sseError) {
      console.warn('SSE streaming failed, falling back to polling:', sseError);
      // Fallback to polling
      let attempts = 0;

      return new Promise((resolve, reject) => {
        const poll = async () => {
          try {
            attempts++;
            
            if (attempts > maxAttempts) {
              reject(new Error('Job polling timeout'));
              return;
            }

            const status = await this.getJobStatus(jobId, authTokenOrGetter);

            if (onProgress && status.progress !== undefined) {
              onProgress(status.progress);
            }

            if (status.status === 'completed') {
              // Get the result
              const result = await this.getJobResult(jobId, authTokenOrGetter);
              resolve(result);
            } else if (status.status === 'failed') {
              reject(new Error(status.error || 'Job failed'));
            } else {
              // Still processing, poll again
              setTimeout(poll, intervalMs);
            }
          } catch (error) {
            reject(error);
          }
        };

        poll();
      });
    }
  },
};

