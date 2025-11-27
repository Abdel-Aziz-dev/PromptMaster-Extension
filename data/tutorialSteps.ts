
export type Tab = 'generator' | 'refiner' | 'history' | 'settings';

export interface TutorialStep {
  id: string;
  targetId: string;
  translationKey: string; // Key under 'tutorial.steps' in LanguageContext
  tab: Tab;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    targetId: 'app-header', // We will add this ID to App.tsx header
    translationKey: 'welcome',
    tab: 'generator', // Start on generator
    position: 'bottom'
  },
  {
    id: 'support-icon',
    targetId: 'header-support-btn',
    translationKey: 'support',
    tab: 'generator',
    position: 'bottom'
  },
  {
    id: 'model-selector',
    targetId: 'gen-model-selector',
    translationKey: 'model',
    tab: 'generator',
    position: 'bottom'
  },
  {
    id: 'core-task',
    targetId: 'gen-task-input',
    translationKey: 'task',
    tab: 'generator',
    position: 'bottom'
  },
  {
    id: 'context',
    targetId: 'gen-context-input',
    translationKey: 'context',
    tab: 'generator',
    position: 'top'
  },
  {
    id: 'templates',
    targetId: 'gen-templates',
    translationKey: 'templates',
    tab: 'generator',
    position: 'top'
  },
  {
    id: 'generate',
    targetId: 'gen-generate-btn',
    translationKey: 'generate',
    tab: 'generator',
    position: 'top'
  },
  {
    id: 'refiner-nav',
    targetId: 'nav-refiner',
    translationKey: 'refinerNav',
    tab: 'refiner',
    position: 'bottom'
  },
  {
    id: 'refiner-input',
    targetId: 'ref-input-area',
    translationKey: 'refinerInput',
    tab: 'refiner',
    position: 'bottom'
  },
  {
    id: 'refiner-actions',
    targetId: 'ref-actions-bar',
    translationKey: 'refinerActions',
    tab: 'refiner',
    position: 'top'
  },
  {
    id: 'history-nav',
    targetId: 'nav-history',
    translationKey: 'historyNav',
    tab: 'history',
    position: 'bottom'
  },
  {
    id: 'history-search',
    targetId: 'hist-search-bar',
    translationKey: 'historySearch',
    tab: 'history',
    position: 'bottom'
  },
  {
    id: 'settings-nav',
    targetId: 'nav-settings',
    translationKey: 'settingsNav',
    tab: 'settings',
    position: 'bottom'
  }
];
