import React, { useState, useRef, useEffect } from 'react';
import { UpgradedSentence } from '../../../types';

interface CorrectionTooltipProps {
  correction: UpgradedSentence;
  children: React.ReactNode;
}

export const CorrectionTooltip: React.FC<CorrectionTooltipProps> = ({ correction, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Calculate position and handle click outside
  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (triggerRef.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Estimate tooltip height (approximately 120-140px for content)
          const estimatedTooltipHeight = 140;
          const spaceBelow = viewportHeight - triggerRect.bottom;
          const spaceAbove = triggerRect.top;
          
          // Position tooltip above if there's not enough space below, but enough above
          if (spaceBelow < estimatedTooltipHeight && spaceAbove > estimatedTooltipHeight) {
            setPosition('top');
          } else {
            setPosition('bottom');
          }
        }
      });

      // Handle click outside to close (for mobile)
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tooltipRef.current &&
          triggerRef.current &&
          !tooltipRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsVisible(false);
        }
      };

      // Add event listener with a small delay to avoid immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // On mobile, toggle on click
    if (window.innerWidth < 768) {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(!isVisible);
    }
  };

  return (
    <span 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-80 max-w-[calc(100vw-2rem)] ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 pointer-events-auto`}
          style={{
            // Ensure tooltip doesn't go off screen horizontally
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'min(20rem, calc(100vw - 2rem))'
          }}
        >
          <div className="bg-slate-900 dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-600 p-4 animate-in fade-in zoom-in duration-200">
            {/* Arrow */}
            <div className={`absolute ${position === 'top' ? 'bottom-0 translate-y-full' : 'top-0 -translate-y-full'} left-1/2 transform -translate-x-1/2`}>
              <div className={`w-0 h-0 border-l-8 border-r-8 ${position === 'top' ? 'border-t-8 border-t-slate-900 dark:border-t-slate-800' : 'border-b-8 border-b-slate-900 dark:border-b-slate-800'} border-transparent`}></div>
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              {/* Better version */}
              <div>
                <div className="text-xs font-black uppercase text-emerald-400 dark:text-emerald-300 mb-1.5 tracking-wider">
                  Suggestion
                </div>
                <p className="text-sm text-white dark:text-slate-100 font-medium leading-relaxed">
                  "{correction.better}"
                </p>
              </div>
              
              {/* Explanation */}
              <div className="pt-2 border-t border-slate-700 dark:border-slate-600">
                <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                  {correction.why}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
