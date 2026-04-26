import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = (userId: string, page: string) => `page_tour_done_${page}_${userId}`;

/**
 * Fires a driver.js spotlight tour the first time a D2C user visits a page.
 * Pass `userId = undefined` to skip (e.g. for B2B users).
 * Steps are captured once via ref so inline arrays don't cause re-runs.
 */
export function usePageTour(
  userId: string | undefined,
  page: string,
  steps: DriveStep[],
) {
  const stepsRef = useRef(steps);

  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem(TOUR_KEY(userId, page))) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      if (localStorage.getItem(TOUR_KEY(userId, page))) return;

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayOpacity: 0.65,
        smoothScroll: true,
        allowClose: true,
        stagePadding: 8,
        stageRadius: 16,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Got it!',
        steps: stepsRef.current,
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY(userId, page), 'true');
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId, page]);
}
