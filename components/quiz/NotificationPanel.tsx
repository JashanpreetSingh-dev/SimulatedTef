import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { getNotificationCount, getNotifications } from '../../services/quizNotification';
import type { QuizNotification } from '../../services/quizNotification';

export function NotificationPanel({ isD2C }: { isD2C: boolean }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<QuizNotification[]>([]);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getNotificationCount(getToken);
      setUnreadCount(count);
    } catch {
      // silently ignore polling errors
    }
  }, [getToken]);

  useEffect(() => {
    if (!isD2C) return;
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isD2C, fetchCount]);

  const handleOpen = async () => {
    setOpen(true);
    try {
      const data = await getNotifications(getToken);
      setNotifications(data);
    } catch {
      // ignore
    }
  };

  if (!isD2C) return null;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      {open && (
        <div className="fixed top-[57px] right-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-40 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Notifications</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No quizzes yet. Keep practising — your first quiz unlocks after 5 sessions!
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${
                    n.status === 'read' ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Your Personalized Quiz is Ready!
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Covers {n.weaknesses.length} weakness{n.weaknesses.length !== 1 ? 'es' : ''}
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate('/quiz/' + n._id);
                    }}
                    className="mt-3 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                  >
                    Start Quiz &rarr;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
