import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface QuizNotification {
  _id: string;
  userId: string;
  status: 'unread' | 'read';
  quizGenerated: boolean;
  weaknesses: string[];
  resultIds: string[];
  createdAt: string;
  readAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  weakness: string;
}

export interface WeaknessLabel {
  weakness: string;
  displayLabel: string;
}

export async function getNotificationCount(
  getToken: () => Promise<string | null>
): Promise<number> {
  return authenticatedFetchJSON<number>(`${BACKEND_URL}/api/quiz/notifications/count`, {
    getToken,
  });
}

export async function getNotifications(
  getToken: () => Promise<string | null>
): Promise<QuizNotification[]> {
  return authenticatedFetchJSON<QuizNotification[]>(`${BACKEND_URL}/api/quiz/notifications`, {
    getToken,
  });
}

export async function generateQuiz(
  notificationId: string,
  getToken: () => Promise<string | null>
): Promise<{
  quiz?: { weaknessLabels: WeaknessLabel[]; questions: QuizQuestion[] };
  weaknesses?: string[];
  paywalled?: boolean;
}> {
  return authenticatedFetchJSON(`${BACKEND_URL}/api/quiz/generate`, {
    getToken,
    method: 'POST',
    body: JSON.stringify({ notificationId }),
    timeout: 60000,
  });
}

export async function markNotificationRead(
  notificationId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  await authenticatedFetchJSON(`${BACKEND_URL}/api/quiz/notifications/${notificationId}/read`, {
    getToken,
    method: 'POST',
  });
}
