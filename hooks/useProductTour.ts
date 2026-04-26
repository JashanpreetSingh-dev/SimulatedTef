import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = (userId: string) => `onboarding_done_${userId}`;

export function useProductTour(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem(TOUR_KEY(userId))) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      // Double-check in case Strict Mode ran this twice and first instance already started
      if (localStorage.getItem(TOUR_KEY(userId))) return;

      const isMobile = window.innerWidth < 768;

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
        doneBtnText: 'Done',
        steps: [
          {
            element: '#tour-practice-card',
            popover: {
              title: '🎯 Practice — AI speaking & writing',
              description: "The core of Akseli. Speak or write your response, get scored by AI the same way a real TEF Canada examiner would. This is where your CLB level climbs.",
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-mock-exam-card',
            popover: {
              title: '📚 Mock Exam — pressure-test yourself',
              description: "All 4 TEF Canada sections, fully timed, real exam conditions. Run one when you want to know exactly where you stand.",
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-daily-ritual-card',
            popover: {
              title: '📇 Daily Ritual — your secret weapon',
              description: "15 minutes of targeted vocabulary and grammar every day. Consistency here compounds faster than any cram session — don't skip.",
              side: 'top',
              align: 'start',
            },
          },
          // On mobile the desktop nav is hidden — skip the element anchor so the step
          // shows as a floating popover rather than pointing at nothing.
          {
            ...(isMobile ? {} : { element: '#tour-nav-practice' }),
            popover: {
              title: '⚡ Navigate from anywhere',
              description: isMobile
                ? 'Tap the menu to jump to Practice, Mock Exam, Daily Ritual, or History from any page.'
                : 'Jump straight to any section from the nav — Practice, Mock Exam, Daily Ritual, History — from any page.',
              side: 'bottom',
              align: 'start',
              nextBtnText: "Got it — let's go!",
            },
          },
        ],
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY(userId), 'true');
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId]);
}
