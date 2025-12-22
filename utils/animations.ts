import { useEffect, useRef, useState } from 'react';

/**
 * Hook for scroll-triggered animations using Intersection Observer
 * @param options - Intersection Observer options
 * @returns [ref, isVisible] - Ref to attach to element and visibility state
 */
export function useScrollAnimation(
  options: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optionally disconnect after first trigger
          observer.disconnect();
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible] as const;
}

/**
 * Hook for staggered animations on a list of elements
 * @param itemCount - Number of items to animate
 * @param staggerDelay - Delay between each item (in ms)
 * @returns Array of refs and visibility states
 */
export function useStaggeredAnimation(itemCount: number, staggerDelay: number = 100) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleItems(new Array(itemCount).fill(true));
      return;
    }

    const observers: IntersectionObserver[] = [];

    refs.current.forEach((element, index) => {
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, index * staggerDelay);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [itemCount, staggerDelay]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { setRef, visibleItems };
}

/**
 * Utility to get animation class based on visibility
 */
export function getAnimationClass(
  isVisible: boolean,
  baseClass: string = 'animate-on-scroll',
  hiddenClass: string = 'opacity-0 translate-y-4'
): string {
  if (isVisible) {
    return baseClass;
  }
  return `${baseClass} ${hiddenClass}`;
}

