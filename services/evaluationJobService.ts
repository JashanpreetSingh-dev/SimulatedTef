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
    transcript: string,
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
    authTokenOrGetter: string | null | TokenGetter
  ): Promise<{ jobId: string }> {
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
            transcript,
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
          transcript,
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
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    authTokenOrGetter: string | null | TokenGetter,
    onProgress?: (progress: number) => void,
    intervalMs: number = 2000,
    maxAttempts: number = 150 // 5 minutes max (150 * 2s)
  ): Promise<any> {
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
  },
};

