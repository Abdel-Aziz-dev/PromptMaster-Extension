import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CustomInstructionInputProps {
  onRun: (instruction: string) => void;
  loading: boolean;
  disabled?: boolean;
}

const HISTORY_KEY = 'prompt_master_custom_history';

const CustomInstructionInput: React.FC<CustomInstructionInputProps> = ({ onRun, loading, disabled }) => {
  const { t } = useLanguage();
  const [instruction, setInstruction] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load custom instruction history", e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    
    onRun(trimmed);
    
    // Update History (uniq, max 5)
    const newHistory = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    
    // Clear input to indicate consumption, or keep? 
    // Usually clearing is better for "Run" actions.
    setInstruction('');
    setShowHistory(false);
  };

  const handleSelectHistory = (item: string) => {
    setInstruction(item);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between items-center">
         <span>{t('refiner.customInstruction')}</span>
         {history.length > 0 && (
           <button 
             onClick={() => setShowHistory(!showHistory)}
             className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 cursor-pointer flex items-center text-[10px] transition-colors"
             type="button"
           >
             <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Recent
           </button>
         )}
       </label>
       <div className="flex gap-2">
         <div className="relative flex-1 group">
            <input 
              ref={inputRef}
              type="text" 
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={t('refiner.placeholders.custom')}
              className="w-full text-xs border border-gray-300 dark:border-slate-600 rounded-md pl-2 pr-7 py-1.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-500 outline-none transition-shadow shadow-sm placeholder-gray-400 dark:placeholder-gray-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && !disabled) {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === 'ArrowDown' && history.length > 0) {
                    setShowHistory(true);
                }
              }}
              onFocus={() => {
                if (history.length > 0 && !instruction) setShowHistory(true);
              }}
              disabled={disabled || loading}
            />
            {instruction && (
              <button
                onClick={() => setInstruction('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
            
            {/* History Dropdown */}
            {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg z-20 max-h-40 overflow-y-auto animate-fade-slide origin-top">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectHistory(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-slate-700/50 last:border-0 truncate transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
         </div>

         <button
            onClick={handleSubmit}
            disabled={loading || disabled || !instruction.trim()}
            className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center shrink-0 active:scale-95"
            type="button"
          >
            {loading ? (
               <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
               <>
                 <span className="mr-1">{t('refiner.run')}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </>
            )}
          </button>
       </div>
    </div>
  );
};

export default CustomInstructionInput;