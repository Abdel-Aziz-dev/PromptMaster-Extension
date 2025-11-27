
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { useLanguage } from '../contexts/LanguageContext';
import Mascot from './Mascot';

const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep, nextStep, prevStep, stopTutorial, currentStepIndex } = useTutorial();
  const { t } = useLanguage();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [appSettings, setAppSettings] = useState<{ mascotUrl?: string }>({});
  
  // Use a ref to track if we've attempted to scroll to the element
  const hasScrolledRef = useRef(false);

  // Load app settings to check for custom mascot
  useEffect(() => {
    try {
      const stored = localStorage.getItem('prompt_master_settings');
      if (stored) {
        setAppSettings(JSON.parse(stored));
      }
    } catch(e) {}
  }, [isActive]);

  // Re-calculate target position when step changes or window resizes
  const updateRect = () => {
    if (currentStep) {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        
        // Only scroll if we haven't for this step yet
        if (!hasScrolledRef.current) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          hasScrolledRef.current = true;
        }
      } else {
        setTargetRect(null);
      }
    }
  };

  // Reset scroll tracker when step changes
  useLayoutEffect(() => {
    hasScrolledRef.current = false;
    updateRect();
    // Add a small delay to allow for tab switching animations/mounting
    const timer = setTimeout(updateRect, 350); 
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); // Capture scroll events
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive]);

  if (!isActive || !currentStep) return null;

  // Calculate Mascot Position relative to target
  let mascotStyle: React.CSSProperties = {};
  
  if (targetRect) {
    const spacing = 20; // Space between target and mascot bubble
    
    // Default: Position mascot below and to the right of the target center
    // Adjustments are needed because the Mascot component renders bottom-right aligned internally (flex-col items-end)
    // The visual "Mascot" is at the bottom right of the wrapper. The Bubble is above it.
    
    // We want the Mascot (the robot) to "point" at the element.
    // The Mascot component renders a wrapper. 
    // Let's position the wrapper such that the Bubble is near the element.

    // Base calculation:
    let top = targetRect.bottom + spacing; 
    let left = targetRect.left + (targetRect.width / 2) + 120; // Shift right so bubble aligns

    // Adjust based on specified position preference in step
    if (currentStep.position === 'top') {
      top = targetRect.top - 200; // Shift up (approx height of mascot + bubble)
      left = targetRect.left + (targetRect.width / 2) + 100;
    } else if (currentStep.position === 'bottom') {
       top = targetRect.bottom + 20;
       left = targetRect.left + (targetRect.width / 2) + 120;
    }

    // Boundary checks to keep mascot on screen
    if (left > window.innerWidth - 20) left = window.innerWidth - 20;
    if (top > window.innerHeight - 120) top = window.innerHeight - 120;
    if (top < 10) top = 10;

    mascotStyle = {
      top: `${top}px`,
      left: `${left}px`,
      position: 'fixed',
      transform: 'translate(-100%, 0)' // Adjust to center the alignment better since we are positioning the right edge
    };
  } else {
    // Fallback center
    mascotStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed'
    };
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      
      {/* Spotlight Mask */}
      <div 
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          boxShadow: targetRect 
            ? `0 0 0 9999px rgba(0, 0, 0, 0.7)` 
            : `0 0 0 0 rgba(0,0,0,0)`,
          top: targetRect ? targetRect.top - 8 : 0,
          left: targetRect ? targetRect.left - 8 : 0,
          width: targetRect ? targetRect.width + 16 : '100%',
          height: targetRect ? targetRect.height + 16 : '100%',
          borderRadius: '8px',
          pointerEvents: 'auto', 
        }}
        onClick={(e) => {
           // Block clicks on background
        }}
      ></div>

      {/* Interactive Mascot Guide */}
      <Mascot 
        customImage={appSettings.mascotUrl}
        tutorialProps={{
          isActive,
          title: t(`tutorial.steps.${currentStep.translationKey}.title`),
          content: t(`tutorial.steps.${currentStep.translationKey}.content`),
          currentStep: currentStepIndex,
          totalSteps: 13, // Total steps in tutorialSteps.ts
          onNext: nextStep,
          onPrev: prevStep,
          onSkip: stopTutorial,
          style: mascotStyle
        }}
      />
    </div>
  );
};

export default TutorialOverlay;
