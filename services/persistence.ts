
import { EvaluationResult, SavedResult } from '../types';
import { TaskReference, TaskType, generateTaskId, NormalizedTask } from '../types/task';
import { TEFTask, WrittenTask, ReadingTask, ListeningTask } from '../types';
import { mongoDBService } from './mongodb';
import { authenticatedFetchJSON, authenticatedFetchFormData } from './authenticatedFetch';

const STORAGE_KEY = 'tef_master_results';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Helper type for token getter function
type TokenGetter = () => Promise<string | null>;

export const persistenceService = {
  /**
   * Uploads audio recording to backend and returns recordingId
   * @param audioBlob - The audio file to upload
   * @param userId - User ID (will be overridden by backend from token)
   * @param authTokenOrGetter - Optional Clerk session token for authentication, or a function that returns a token
   */
  async uploadRecording(
    audioBlob: Blob, 
    userId: string, 
    authTokenOrGetter?: string | null | TokenGetter
  ): Promise<string | null> {
    try {
      // Validate blob
      if (!audioBlob || audioBlob.size === 0) {
        console.warn('⚠️ Empty audio blob, skipping upload');
        return null;
      }

      if (audioBlob.size < 100) {
        console.warn('⚠️ Audio blob too small, likely invalid:', audioBlob.size);
        return null;
      }

      const formData = new FormData();
      
      // Determine file extension based on blob type
      let extension = 'wav';
      if (audioBlob.type.includes('webm')) {
        extension = 'webm';
      } else if (audioBlob.type.includes('ogg')) {
        extension = 'ogg';
      } else if (audioBlob.type.includes('mp4')) {
        extension = 'm4a';
      }
      
      const filename = `${userId}_${Date.now()}.${extension}`;
      formData.append('audio', audioBlob, filename);
      // Don't send userId in body - backend will get it from token
      
      // Use authenticated fetch if getToken is provided, otherwise use regular fetch
      if (typeof authTokenOrGetter === 'function') {
        try {
          const data = await authenticatedFetchFormData<{ recordingId: string }>(
            `${BACKEND_URL}/api/recordings/upload`,
            formData,
            {
              method: 'POST',
              getToken: authTokenOrGetter,
            }
          );
          console.log('✅ Audio recording uploaded:', data.recordingId, `(${(audioBlob.size / 1024).toFixed(2)} KB)`);
          return data.recordingId;
        } catch (error) {
          console.error('⚠️ Recording upload failed:', error);
          return null;
        }
      } else {
        // Fallback to regular fetch for backward compatibility
        const headers: HeadersInit = {};
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/recordings/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Audio recording uploaded:', data.recordingId, `(${(audioBlob.size / 1024).toFixed(2)} KB)`);
          return data.recordingId;
        } else {
          const errorText = await response.text();
          console.error('⚠️ Recording upload failed:', response.status, errorText);
          return null;
        }
      }
    } catch (error) {
      console.error('❌ Recording upload error:', error);
      return null;
    }
  },

  /**
   * Saves a task to normalized storage
   */
  async saveTask(
    type: TaskType,
    taskData: TEFTask | WrittenTask | ReadingTask | ListeningTask,
    authTokenOrGetter?: string | null | TokenGetter
  ): Promise<NormalizedTask> {
    const url = `${BACKEND_URL}/api/tasks/normalized`;
    
    try {
      if (typeof authTokenOrGetter === 'function') {
        const task = await authenticatedFetchJSON<NormalizedTask>(
          url,
          {
            method: 'POST',
            getToken: authTokenOrGetter,
            body: JSON.stringify({ type, taskData }),
          }
        );
        return task;
      } else {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type, taskData }),
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`Failed to save task: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  },

  /**
   * Get task by taskId
   */
  async getTask(
    taskId: string,
    authTokenOrGetter?: string | null | TokenGetter
  ): Promise<NormalizedTask | null> {
    const url = `${BACKEND_URL}/api/tasks/normalized/${taskId}`;
    
    try {
      if (typeof authTokenOrGetter === 'function') {
        return await authenticatedFetchJSON<NormalizedTask>(url, { getToken: authTokenOrGetter });
      } else {
        const headers: HeadersInit = {};
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        const response = await fetch(url, { headers });
        if (response.ok) {
          return await response.json();
        } else if (response.status === 404) {
          return null;
        } else {
          throw new Error(`Failed to get task: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  },

  /**
   * Get multiple tasks by taskIds
   */
  async getTasks(
    taskIds: string[],
    authTokenOrGetter?: string | null | TokenGetter
  ): Promise<NormalizedTask[]> {
    const url = `${BACKEND_URL}/api/tasks/normalized/batch`;
    
    try {
      if (typeof authTokenOrGetter === 'function') {
        const response = await authenticatedFetchJSON<{ tasks: NormalizedTask[] }>(
          url,
          {
            method: 'POST',
            getToken: authTokenOrGetter,
            body: JSON.stringify({ taskIds }),
          }
        );
        return response.tasks;
      } else {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ taskIds }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.tasks || [];
        } else {
          throw new Error(`Failed to get tasks: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  },

  /**
   * Saves an evaluation result with MongoDB via backend API.
   * Now accepts task references instead of full task objects.
   * @param authTokenOrGetter - Optional Clerk session token for authentication, or a function that returns a token
   */
  async saveResult(
    result: EvaluationResult, 
    mode: 'partA' | 'partB' | 'full',
    title: string,
    resultType: 'practice' | 'mockExam',
    module: 'oralExpression' | 'writtenExpression' | 'reading' | 'listening',
    moduleData: SavedResult['moduleData'],
    userId: string = 'guest',
    recordingId?: string,
    taskReferences?: { taskA?: TaskReference; taskB?: TaskReference },
    transcript?: string,
    mockExamId?: string,
    authTokenOrGetter?: string | null | TokenGetter
  ): Promise<SavedResult> {
    
    // 1. Prepare the document with a temporary ID (will be replaced by MongoDB _id if save succeeds)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntry: SavedResult = {
      _id: tempId,
      userId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resultType,
      mode,
      module,
      title,
      evaluation: result,
      moduleData,
      taskReferences: taskReferences || {},
      recordingId, // Add recordingId if provided
      transcript, // Add transcript if provided
      ...(mockExamId && { mockExamId }), // Only add mockExamId if provided
    };

    // 2. Save to LocalStorage (Always do this for offline resilience)
    const existing = this.getResultsSync();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
    console.log('✅ Saved to localStorage');

    // 3. Sync to MongoDB via backend API
    try {
      // Use authenticated fetch if getToken is provided, otherwise use regular fetch
      if (typeof authTokenOrGetter === 'function') {
        try {
          const data = await authenticatedFetchJSON<{ insertedId?: string; _id?: string }>(
            `${BACKEND_URL}/api/results`,
            {
              method: 'POST',
              getToken: authTokenOrGetter,
              body: JSON.stringify(newEntry),
            }
          );
          
          const mongoId = data.insertedId || data._id;
          if (mongoId) {
            // Update the entry with MongoDB _id
            newEntry._id = mongoId;
            // Update localStorage with the MongoDB _id
            const updatedExisting = this.getResultsSync();
            const index = updatedExisting.findIndex(r => r._id === tempId || (r.timestamp === newEntry.timestamp && r.userId === userId));
            if (index !== -1) {
              updatedExisting[index] = newEntry;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExisting));
            }
            console.log('✅ Successfully saved to MongoDB via backend:', mongoId);
          } else {
            console.log('✅ Saved to MongoDB (no ID returned)');
          }
        } catch (error) {
          console.warn('⚠️ Backend save failed:', error);
          console.log('   Result saved to localStorage as backup');
        }
      } else {
        // Fallback to regular fetch for backward compatibility
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/results`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newEntry),
        });

        if (response.ok) {
          const data = await response.json();
          const mongoId = data.insertedId || data._id;
          if (mongoId) {
            // Update the entry with MongoDB _id
            newEntry._id = mongoId;
            // Update localStorage with the MongoDB _id
            const updatedExisting = this.getResultsSync();
            const index = updatedExisting.findIndex(r => r._id === tempId || (r.timestamp === newEntry.timestamp && r.userId === userId));
            if (index !== -1) {
              updatedExisting[index] = newEntry;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExisting));
            }
            console.log('✅ Successfully saved to MongoDB via backend:', mongoId);
          } else {
            console.log('✅ Saved to MongoDB (no ID returned)');
          }
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Backend save failed:', response.status, errorText);
          console.log('   Result saved to localStorage as backup');
        }
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      console.log('   Result saved to localStorage as backup');
      console.log('   Make sure backend server is running: npm run server');
    }

    return newEntry;
  },

  getResultsSync(): SavedResult[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Fetches results, prioritizing MongoDB via backend if available, otherwise LocalStorage.
   * @param userId - User ID to fetch results for
   * @param authTokenOrGetter - Optional Clerk session token for authentication, or a function that returns a token
   * @param limit - Optional limit for pagination (default: 50)
   * @param skip - Optional skip/offset for pagination (default: 0)
   * @param resultType - Optional filter by resultType ('practice' | 'mockExam' | 'assignment')
   * @param module - Optional filter by module
   * @param mockExamId - Optional filter by mockExamId
   * @param populateTasks - Optional flag to populate task data from references
   */
  async getAllResults(
    userId: string = 'guest', 
    authTokenOrGetter?: string | null | TokenGetter,
    limit?: number,
    skip?: number,
    resultType?: 'practice' | 'mockExam' | 'assignment',
    module?: 'oralExpression' | 'writtenExpression' | 'reading' | 'listening',
    mockExamId?: string,
    populateTasks: boolean = false
  ): Promise<{ results: SavedResult[]; pagination?: { total: number; limit: number; skip: number; hasMore: boolean } }> {
    try {
      // Build query params for pagination and filtering
      const params = new URLSearchParams();
      if (limit !== undefined) params.append('limit', limit.toString());
      if (skip !== undefined) params.append('skip', skip.toString());
      if (resultType) params.append('resultType', resultType);
      if (module) params.append('module', module);
      if (mockExamId) params.append('mockExamId', mockExamId);
      if (populateTasks) params.append('populateTasks', 'true');
      const queryString = params.toString();
      const url = `${BACKEND_URL}/api/results/${userId}${queryString ? `?${queryString}` : ''}`;
      
      // Use authenticated fetch if getToken is provided, otherwise use regular fetch
      if (typeof authTokenOrGetter === 'function') {
        try {
          const response = await authenticatedFetchJSON<{ results: SavedResult[]; pagination?: { total: number; limit: number; skip: number; hasMore: boolean } }>(
            url,
            {
              getToken: authTokenOrGetter,
            }
          );
          
          // Handle response - check if it has the expected structure
          if (response && typeof response === 'object') {
            // Check if response is an error object
            if ('error' in response) {
              console.warn('⚠️ Backend returned error:', response.error);
              // Fall through to localStorage
            } else if ('results' in response) {
              const { results, pagination } = response;
              // Update local storage with fresh data from MongoDB (merge with existing)
              if (skip === 0 || skip === undefined) {
                // First page - replace all
                localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
              } else {
                // Subsequent pages - merge with existing
                const existing = this.getResultsSync();
                const merged = [...existing, ...results];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              }
              console.log(`✅ Loaded ${results.length} results from MongoDB${pagination ? ` (${pagination.skip + results.length}/${pagination.total})` : ''}`);
              return { results, pagination };
            } else {
              console.warn('⚠️ Unexpected response format from backend, falling back to localStorage');
            }
          } else {
            console.warn('⚠️ Invalid response from backend, falling back to localStorage');
          }
        } catch (error) {
          console.log('⚠️ Backend not available, using localStorage:', error);
        }
      } else {
        // Fallback to regular fetch for backward compatibility
        const headers: HeadersInit = {};
        if (authTokenOrGetter) {
          headers['Authorization'] = `Bearer ${authTokenOrGetter}`;
        }
        
        try {
          const response = await fetch(url, {
            headers,
          });
          if (response.ok) {
            const data = await response.json();
            // Check if response is an error object
            if (data && typeof data === 'object' && 'error' in data) {
              console.warn('⚠️ Backend returned error:', data.error);
              // Fall through to localStorage
            } else if (data && typeof data === 'object' && 'results' in data) {
              // Handle response - check if it has the expected structure
              const { results, pagination } = data;
              if (skip === 0 || skip === undefined) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
              } else {
                const existing = this.getResultsSync();
                const merged = [...existing, ...results];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              }
              console.log(`✅ Loaded ${results.length} results from MongoDB${pagination ? ` (${pagination.skip + results.length}/${pagination.total})` : ''}`);
              return { results, pagination };
            } else {
              console.warn('⚠️ Unexpected response format from backend, falling back to localStorage');
            }
          } else {
            console.log(`⚠️ Backend returned ${response.status}, using localStorage`);
          }
        } catch (error) {
          console.log('⚠️ Backend fetch failed, using localStorage:', error);
        }
      }
    } catch (error) {
      console.log('⚠️ Backend not available, using localStorage:', error);
    }
    
    // Always fall back to localStorage if backend fails
    
    // Fallback to local storage - implement pagination for localStorage too
    const localResults = this.getResultsSync()
      .filter(r => r.userId === userId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const effectiveLimit = limit || 50;
    const effectiveSkip = skip || 0;
    const paginatedResults = localResults.slice(effectiveSkip, effectiveSkip + effectiveLimit);
    const totalCount = localResults.length;
    
    console.log(`📦 Loaded ${paginatedResults.length} results from localStorage${limit !== undefined ? ` (${effectiveSkip + paginatedResults.length}/${totalCount})` : ''}`);
    
    return {
      results: paginatedResults,
      pagination: limit !== undefined ? {
        total: totalCount,
        limit: effectiveLimit,
        skip: effectiveSkip,
        hasMore: effectiveSkip + paginatedResults.length < totalCount
      } : undefined
    };
  },

  async clearHistory(userId: string = 'guest'): Promise<void> {
    if (mongoDBService.isConfigured()) {
      // In production, you'd likely soft-delete or batch delete
      console.warn('Remote deletion not implemented in this proxy for safety.');
    }
    localStorage.removeItem(STORAGE_KEY);
  }
};
