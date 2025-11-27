
import React, { useState, useEffect, useRef, useCallback } from 'react';
import GeneratorTab from './components/GeneratorTab';
import RefinerTab from './components/RefinerTab';
import HistoryList from './components/HistoryList';
import SettingsTab from './components/SettingsTab';
import TutorialOverlay from './components/TutorialOverlay';
import Mascot from './components/Mascot';
import { PromptTemplate, AppSettings } from './types';
import { useLanguage, Language } from './contexts/LanguageContext';
import { useTutorial } from './contexts/TutorialContext';
import { Tab } from './data/tutorialSteps';

// Tab Enum Mapping
// We need to map the string from tutorial steps to the Enum used internally
// Or simply update the App to use string literals if possible.
// For safety, let's keep the internal Enum but cast where needed.

enum TabEnum {
  GENERATOR = 'generator',
  REFINER = 'refiner',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

const DEFAULT_SETTINGS: AppSettings = {
  privacyMode: false,
  saveHistoryToLocal: true,
  theme: 'light'
};

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef} id="header-lang">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-brand-100 hover:text-white transition-colors p-1.5 rounded hover:bg-brand-700/50"
        title="Change Language"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="text-xs uppercase font-bold">{currentLang.code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50 animate-fade-slide origin-top-right">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                language === lang.code ? 'text-brand-600 dark:text-brand-400 font-semibold bg-gray-50 dark:bg-slate-700/50' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const { startTutorial, activeTabRequest, isActive: isTutorialActive } = useTutorial();
  const [activeTab, setActiveTab] = useState<TabEnum>(TabEnum.GENERATOR);
  const [history, setHistory] = useState<PromptTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Sync Tab with Tutorial Context
  useEffect(() => {
    if (activeTabRequest) {
      // Cast the string from context to our internal Enum
      const tabKey = activeTabRequest as unknown as TabEnum;
      if (Object.values(TabEnum).includes(tabKey)) {
        setActiveTab(tabKey);
      }
    }
  }, [activeTabRequest]);

  // Load data from local storage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('prompt_master_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      
      const storedSettings = localStorage.getItem('prompt_master_settings');
      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } else {
        // Detect system preference if no stored setting
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setSettings(s => ({ ...s, theme: 'dark' }));
        }
      }
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  // Keyboard shortcuts for tab switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused, OR if using Alt modifiers which rarely conflict with typing
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab(TabEnum.GENERATOR);
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab(TabEnum.REFINER);
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab(TabEnum.HISTORY);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save settings whenever they change & Apply Theme
  useEffect(() => {
    localStorage.setItem('prompt_master_settings', JSON.stringify(settings));
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Update saveHistoryItem to respect settings
  const saveHistoryItem = (content: string, name: string, category: 'generated' | 'refined') => {
    const finalName = name.trim() || "Untitled Prompt";
    
    const newItem: PromptTemplate = {
      id: Date.now().toString(),
      name: finalName,
      content,
      category,
      timestamp: Date.now()
    };
    
    const updated = [newItem, ...history];
    setHistory(updated);
    
    if (settings.saveHistoryToLocal) {
      localStorage.setItem('prompt_master_history', JSON.stringify(updated));
    }
    
    setActiveTab(TabEnum.HISTORY);
  };

  const updateHistoryItem = (id: string, updates: Partial<PromptTemplate>) => {
    const updated = history.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setHistory(updated);
    if (settings.saveHistoryToLocal) {
      localStorage.setItem('prompt_master_history', JSON.stringify(updated));
    }
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    if (settings.saveHistoryToLocal) {
      localStorage.setItem('prompt_master_history', JSON.stringify(updated));
    }
  };

  const handleDeleteAllData = () => {
    setHistory([]);
    localStorage.removeItem('prompt_master_history');
  };

  // Loads a prompt into the Refiner tab and switches to it
  const handleLoadToRefiner = (content: string) => {
    // We inject the content into the refiner's draft storage
    // The RefinerTab component reads this on mount
    const currentDraft = localStorage.getItem('prompt_master_refiner_draft');
    let draft = {};
    if (currentDraft) {
      try { draft = JSON.parse(currentDraft); } catch(e) {}
    }
    
    // Convert newlines to HTML breaks if needed, as Refiner uses contentEditable
    // But simple text is usually fine, RichTextEditor handles it.
    const formattedContent = content.replace(/\n/g, '<br>');

    localStorage.setItem('prompt_master_refiner_draft', JSON.stringify({
      ...draft,
      inputPrompt: formattedContent,
      result: '' // Clear result when loading new input
    }));

    setActiveTab(TabEnum.REFINER);
  };

  return (
    <div className="w-[400px] min-h-[550px] bg-white dark:bg-slate-900 mx-auto shadow-xl border border-gray-200 dark:border-slate-700 flex flex-col transition-colors duration-200">
      <TutorialOverlay />
      
      {/* Hide the default mascot when tutorial is active, so the TutorialOverlay mascot can take over seamlessly */}
      {!isTutorialActive && <Mascot customImage={settings.mascotUrl} />}
      
      {/* Header */}
      <header id="app-header" className="bg-brand-600 dark:bg-brand-800 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 transition-colors duration-200 z-10">
        <div className="flex items-center space-x-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 1.5.4 3 1.1 4.2l-.7 2.2a1 1 0 0 0 1.3 1.2l2.3-.7C9 18.2 10.4 18.7 12 18.7a8.7 8.7 0 1 0 0-17.4V2z"></path><path d="m16 9-4 4-2-2"></path></svg>
          <h1 className="font-bold text-lg tracking-wide">{t('appName')}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* Tutorial Trigger Button */}
          <button
             onClick={startTutorial}
             className="text-brand-100 hover:text-white transition-colors p-1.5 rounded hover:bg-brand-700/50 flex items-center justify-center"
             title="Start Tutorial"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>

          {/* Donate / Support Button (Coin Icon) */}
          <button 
             id="header-support-btn"
             onClick={() => setActiveTab(TabEnum.SETTINGS)}
             className="text-brand-100 hover:text-yellow-300 transition-colors p-1.5 rounded hover:bg-brand-700/50 flex items-center"
             title={t('common.support')}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          <button 
            id="nav-settings"
            onClick={() => setActiveTab(TabEnum.SETTINGS)}
            className={`text-brand-100 hover:text-white transition-colors p-1 rounded ${activeTab === TabEnum.SETTINGS ? 'bg-brand-700 text-white' : ''}`}
            title={t('tabs.settings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shrink-0 transition-colors duration-200">
        <button
          onClick={() => setActiveTab(TabEnum.GENERATOR)}
          title="Alt + 1"
          className={`flex-1 py-3 text-xs font-semibold text-center uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === TabEnum.GENERATOR 
              ? 'border-brand-600 text-brand-700 dark:text-brand-400 bg-white dark:bg-slate-900' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          {t('tabs.generator')}
        </button>
        <button
          id="nav-refiner"
          onClick={() => setActiveTab(TabEnum.REFINER)}
          title="Alt + 2"
          className={`flex-1 py-3 text-xs font-semibold text-center uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === TabEnum.REFINER 
              ? 'border-brand-600 text-brand-700 dark:text-brand-400 bg-white dark:bg-slate-900' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          {t('tabs.refiner')}
        </button>
        <button
          id="nav-history"
          onClick={() => setActiveTab(TabEnum.HISTORY)}
          title="Alt + 3"
          className={`flex-1 py-3 text-xs font-semibold text-center uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === TabEnum.HISTORY 
              ? 'border-brand-600 text-brand-700 dark:text-brand-400 bg-white dark:bg-slate-900' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          {t('tabs.history')}
        </button>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900 relative transition-colors duration-200">
        <div key={activeTab} className="animate-fade-slide">
          {activeTab === TabEnum.GENERATOR && (
            <GeneratorTab onSavePrompt={saveHistoryItem} />
          )}
          {activeTab === TabEnum.REFINER && (
            <RefinerTab onSavePrompt={saveHistoryItem} />
          )}
          {activeTab === TabEnum.HISTORY && (
            <HistoryList 
              items={history} 
              onUpdate={updateHistoryItem}
              onDelete={deleteHistoryItem}
              onLoadToRefiner={handleLoadToRefiner}
            />
          )}
          {activeTab === TabEnum.SETTINGS && (
            <SettingsTab 
              settings={settings}
              onUpdateSettings={setSettings}
              history={history}
              onDeleteAllData={handleDeleteAllData}
            />
          )}
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-2 text-[10px] text-gray-400 dark:text-gray-500 flex justify-between shrink-0 transition-colors duration-200">
        <div className="flex items-center space-x-1">
          <div className={`w-1.5 h-1.5 rounded-full ${settings.privacyMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          <span>{settings.privacyMode ? t('common.privacyMode') : t('common.online')}</span>
        </div>
        <span>v1.0.4</span>
      </footer>
    </div>
  );
};

export default App;
