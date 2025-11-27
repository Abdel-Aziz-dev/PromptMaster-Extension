
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ClearHistoryButtonProps {
  onClear: () => void | Promise<void>;
  itemCount: number;
  disabled?: boolean;
}

type ClearStatus = 'idle' | 'confirming' | 'clearing' | 'cleared';

const ClearHistoryButton: React.FC<ClearHistoryButtonProps> = ({ onClear, itemCount, disabled }) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<ClearStatus>('idle');

  const handleConfirm = async () => {
    setStatus('clearing');
    
    // Artificial delay for better UX (so the user sees the spinner)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    await onClear();
    
    setStatus('cleared');
    
    // Reset to idle after showing success message
    setTimeout(() => {
      setStatus('idle');
    }, 2000);
  };

  if (status === 'cleared') {
    return (
      <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium animate-in fade-in duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>History Cleared!</span>
      </div>
    );
  }

  if (status === 'clearing') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-400 dark:text-red-500 rounded-lg text-sm font-medium opacity-75 cursor-wait"
      >
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Clearing...</span>
      </button>
    );
  }

  if (status === 'confirming') {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex items-start space-x-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div className="flex-1">
             <p className="text-xs text-red-800 dark:text-red-300 font-bold leading-tight">
               {t('common.confirmClear')}
             </p>
             <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
               This will permanently delete <b>{itemCount}</b> saved prompts.
             </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setStatus('idle')}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded-md font-bold hover:bg-red-700 shadow-sm transition-colors"
          >
            {t('common.confirmYes')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStatus('confirming')}
      disabled={disabled || itemCount === 0}
      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      <span>{t('common.clearHistory')}</span>
    </button>
  );
};

export default ClearHistoryButton;
