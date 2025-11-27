
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TUTORIAL_STEPS, TutorialStep, Tab } from '../data/tutorialSteps';

interface TutorialContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  startTutorial: () => void;
  stopTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  activeTabRequest: Tab | null; // Used to tell App.tsx to switch tabs
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTabRequest, setActiveTabRequest] = useState<Tab | null>(null);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const stopTutorial = () => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setActiveTabRequest(null);
  };

  const nextStep = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopTutorial();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const currentStep = isActive ? TUTORIAL_STEPS[currentStepIndex] : null;

  // Auto-start tutorial on first visit
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('prompt_master_tutorial_seen');
      if (!hasSeen) {
        // Small delay to ensure the app UI is fully mounted and transitioned
        const timer = setTimeout(() => {
          startTutorial();
          // Mark as seen immediately so it doesn't pop up again on refresh
          localStorage.setItem('prompt_master_tutorial_seen', 'true');
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Error checking tutorial status", e);
    }
  }, []);

  // Whenever the step changes, update the tab request
  useEffect(() => {
    if (isActive && currentStep) {
      setActiveTabRequest(currentStep.tab);
    }
  }, [isActive, currentStepIndex, currentStep]);

  return (
    <TutorialContext.Provider value={{ 
      isActive, 
      currentStepIndex, 
      currentStep, 
      startTutorial, 
      stopTutorial, 
      nextStep, 
      prevStep,
      activeTabRequest
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
