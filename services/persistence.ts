
import { EvaluationResult, SavedResult } from '../types';

const STORAGE_KEY = 'tef_master_results';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const persistenceService = {
  /**
   * Uploads audio recording to backend and returns recordingId
   * @param audioBlob - The audio file to upload
   * @param userId - User ID (will be overridden by backend from token)
   * @param authToken - Optional Clerk session token for authentication
   */
  async uploadRecording(audioBlob: Blob, userId: string, authToken?: string | null): Promise<string | null> {
    try {
      const formData = new FormData();
      const filename = `${userId}_${Date.now()}.wav`;
      formData.append('audio', audioBlob, filename);
      // Don't send userId in body - backend will get it from token
      
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/recordings/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Audio recording uploaded:', data.recordingId);
        return data.recordingId;
      } else {
        const errorText = await response.text();
        console.error('⚠️ Recording upload failed:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Recording upload error:', error);
      return null;
    }
  },

  /**
   * Saves an evaluation result with MongoDB via backend API.
   * @param authToken - Optional Clerk session token for authentication
   */
  async saveResult(
    result: EvaluationResult, 
    mode: string, 
    title: string, 
    userId: string = 'guest',
    recordingId?: string,
    taskPartA?: any, // TEFTask for Section A
    taskPartB?: any,  // TEFTask for Section B
    transcript?: string,  // Transcript of the exam
    authToken?: string | null  // Clerk session token
  ): Promise<SavedResult> {
    
    // 1. Prepare the document with a temporary ID (will be replaced by MongoDB _id if save succeeds)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntry: SavedResult = {
      ...result,
      _id: tempId,
      userId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode,
      title,
      recordingId, // Add recordingId if provided
      transcript, // Add transcript if provided
      taskPartA, // Add task data for Section A
      taskPartB, // Add task data for Section B
    };

    // 2. Save to LocalStorage (Always do this for offline resilience)
    const existing = this.getResultsSync();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
    console.log('✅ Saved to localStorage');

    // 3. Sync to MongoDB via backend API
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
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
   */
  async getAllResults(userId: string = 'guest'): Promise<SavedResult[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/results/${userId}`);
      if (response.ok) {
        const results = await response.json();
        // Update local storage with fresh data from MongoDB
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        console.log(`✅ Loaded ${results.length} results from MongoDB`);
        return results;
      }
    } catch (error) {
      console.log('⚠️ Backend not available, using localStorage:', error);
    }
    
    // Fallback to local storage
    const localResults = this.getResultsSync().filter(r => r.userId === userId);
    console.log(`📦 Loaded ${localResults.length} results from localStorage`);
    return localResults;
  },

  async clearHistory(userId: string = 'guest'): Promise<void> {
    if (mongoDBService.isConfigured()) {
      // In production, you'd likely soft-delete or batch delete
      console.warn('Remote deletion not implemented in this proxy for safety.');
    }
    localStorage.removeItem(STORAGE_KEY);
  }
};
