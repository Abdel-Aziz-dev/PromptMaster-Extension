import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultAreaProps {
  content: string;
  onSave: () => void;
  loading: boolean;
  groundingChunks?: any[];
}

const ResultArea: React.FC<ResultAreaProps> = ({ content, onSave, loading, groundingChunks }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.result')}</label>
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            title="Ctrl + S"
            className="text-xs flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            {t('common.save')}
          </button>
          <button
            onClick={handleCopy}
            className={`text-xs flex items-center transition-colors ${copied ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {t('common.copied')}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                {t('common.copy')}
              </>
            )}
          </button>
        </div>
      </div>
      <textarea
        readOnly
        className="w-full h-40 p-3 bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 text-slate-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-mono"
        value={content}
      />
      
      {/* Grounding Sources */}
      {groundingChunks && groundingChunks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            Sources (Google Search)
          </h4>
          <div className="flex flex-wrap gap-2">
            {groundingChunks.map((chunk, idx) => {
               if (chunk.web) {
                 return (
                   <a 
                     key={idx} 
                     href={chunk.web.uri} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-xs bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 truncate max-w-[200px]"
                     title={chunk.web.title}
                   >
                     {chunk.web.title || chunk.web.uri}
                   </a>
                 );
               }
               return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultArea;
