/**
 * Service for submitting and polling evaluation jobs
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
    authToken: string | null
  ): Promise<{ jobId: string }> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit job: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { jobId: data.jobId };
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, authToken: string | null): Promise<JobStatus> {
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/evaluations/${jobId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Get job result when completed
   */
  async getJobResult(jobId: string, authToken: string | null): Promise<any> {
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/evaluations/${jobId}/result`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get job result: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    authToken: string | null,
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

          const status = await this.getJobStatus(jobId, authToken);

          if (onProgress && status.progress !== undefined) {
            onProgress(status.progress);
          }

          if (status.status === 'completed') {
            // Get the result
            const result = await this.getJobResult(jobId, authToken);
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

