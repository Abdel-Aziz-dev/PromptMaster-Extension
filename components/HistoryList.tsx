
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PromptTemplate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import RichTextEditor from './RichTextEditor';

interface HistoryListProps {
  items: PromptTemplate[];
  onUpdate: (id: string, updates: Partial<PromptTemplate>) => void;
  onDelete: (id: string) => void;
  onLoadToRefiner: (content: string) => void;
}

type SortOption = 'date' | 'name' | 'category';
type SortOrder = 'asc' | 'desc';

// Helper for boolean logic (AND, OR, NOT)
const evaluateBooleanSearch = (itemText: string, query: string): boolean => {
  const text = itemText.toLowerCase();
  const orSegments = query.split(/\s+OR\s+/i).filter(s => s.trim().length > 0);
  if (orSegments.length === 0) return false;

  return orSegments.some(segment => {
    const tokens = segment.trim().split(/\s+/);
    let segmentMatch = true;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.toUpperCase() === 'AND') continue;
      if (token.toUpperCase() === 'NOT') {
        i++; 
        if (i < tokens.length) {
          const nextToken = tokens[i].toLowerCase();
          if (text.includes(nextToken)) {
            segmentMatch = false;
            break;
          }
        }
        continue;
      }
      if (token.startsWith('-') && token.length > 1) {
         if (text.includes(token.substring(1).toLowerCase())) {
           segmentMatch = false;
           break;
         }
      } else {
         if (!text.includes(token.toLowerCase())) {
           segmentMatch = false;
           break;
         }
      }
    }
    return segmentMatch;
  });
};

const HistoryList: React.FC<HistoryListProps> = ({ items, onUpdate, onDelete, onLoadToRefiner }) => {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive States
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scroll & Pagination States
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize edit textarea
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [editingId, editContent]);

  const processedItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim()) {
      result = result.filter(item => {
        const text = `${item.name} ${item.content}`;
        return evaluateBooleanSearch(text, searchQuery);
      });
    }
    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'date':
        default:
          comparison = a.timestamp - b.timestamp;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortBy, sortOrder, searchQuery]);

  // Handle Scroll (Infinite Load + Scroll Top Button)
  const handleScroll = () => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    
    // Show/Hide Scroll to Top
    setShowScrollTop(scrollTop > 200);

    // Infinite Scroll: Load more when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (visibleCount < processedItems.length) {
        setVisibleCount(prev => Math.min(prev + 20, processedItems.length));
      }
    }
  };

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(20);
    listRef.current?.scrollTo({ top: 0 });
  }, [searchQuery, sortBy, sortOrder]);

  const scrollToTop = () => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = async (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (item: PromptTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditName(item.name);
    setEditContent(item.content);
    setExpandedId(item.id); // Ensure expanded
  };

  const saveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(id, { name: editName, content: editContent });
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    if (editingId === id) return; // Prevent collapse while editing
    setExpandedId(prev => prev === id ? null : id);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <p>{t('common.noSaved')}</p>
        <p className="text-sm">Generated prompts will appear here.</p>
      </div>
    );
  }

  const visibleItems = processedItems.slice(0, visibleCount);

  return (
    <div className="flex flex-col h-full relative group">
      {/* Search & Sort Controls */}
      <div className="mb-3 px-1 relative z-10 shrink-0">
         <div id="hist-search-bar" className="relative mb-2">
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
         </div>

         <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {searchQuery ? `${t('common.found')} ${processedItems.length}` : `${t('common.savedPrompts')} (${items.length})`}
            </h3>
            <div className="flex space-x-2 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 py-1 pl-1 pr-6 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
              >
                <option value="date">{t('common.sortDate')}</option>
                <option value="name">{t('common.sortName')}</option>
                <option value="category">{t('common.sortCategory')}</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                )}
              </button>
            </div>
         </div>
      </div>

      <div 
        ref={listRef}
        onScroll={handleScroll}
        className="space-y-3 overflow-y-auto pr-1 pb-4 flex-1 scroll-smooth"
      >
        {processedItems.length === 0 ? (
           <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-xs">
             <p>{t('common.noMatching')}</p>
           </div>
        ) : (
          visibleItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;

            return (
              <div 
                key={item.id} 
                className={`bg-white dark:bg-slate-800 rounded-lg border transition-all duration-200 overflow-hidden
                  ${isExpanded ? 'border-brand-300 dark:border-brand-700 shadow-md ring-1 ring-brand-100 dark:ring-brand-900/30' : 'border-gray-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-slate-600'}
                `}
              >
                {/* Card Header (Always Visible) */}
                <div 
                  className="p-3 cursor-pointer select-none"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-2">
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        item.category === 'generated' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
                        item.category === 'refined' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                        'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {isExpanded ? (
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m18 15-6-6-6 6"/></svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm font-semibold mb-1 bg-gray-50 dark:bg-slate-900 border border-brand-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 truncate">
                      {item.name}
                    </h4>
                  )}
                  
                  {!isExpanded && !isEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* Expanded Content & Actions */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>
                    
                    {isEditing ? (
                      <textarea
                        ref={editRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-700 dark:text-gray-300 resize-none overflow-hidden min-h-[100px]"
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono border border-gray-100 dark:border-slate-700/50 max-h-[300px] overflow-y-auto">
                        {item.content}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                       {/* Left Side: Main Actions */}
                       <div className="flex space-x-2">
                         {isEditing ? (
                           <>
                             <button
                               onClick={(e) => saveEdit(item.id, e)}
                               className="flex items-center space-x-1 px-3 py-1.5 bg-brand-600 text-white text-xs rounded hover:bg-brand-700 transition-colors shadow-sm"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                               <span>Save</span>
                             </button>
                             <button
                               onClick={cancelEdit}
                               className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                             >
                               Cancel
                             </button>
                           </>
                         ) : (
                           <>
                              <button 
                                onClick={(e) => handleCopy(item.id, item.content, e)}
                                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${
                                  copiedId === item.id 
                                  ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' 
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                                }`}
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>{t('common.copied')}</span>
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    <span>{t('common.copy')}</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); onLoadToRefiner(item.content); }}
                                className="flex items-center space-x-1 px-2.5 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900/30 text-xs rounded hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 12v5h16a2 2 0 0 0 0-4H5v4"/></svg>
                                <span>Refine</span>
                              </button>
                           </>
                         )}
                       </div>

                       {/* Right Side: Edit/Delete */}
                       {!isEditing && (
                         <div className="flex space-x-1">
                            <button
                              onClick={(e) => startEdit(item, e)}
                              className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                              title={t('common.delete')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Loading Indicator for Infinite Scroll */}
        {visibleCount < processedItems.length && (
           <div className="py-2 text-center text-[10px] text-gray-400">
             Scroll to load more...
           </div>
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`absolute bottom-4 right-4 p-2 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all duration-300 z-50 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Scroll to Top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </div>
  );
};

export default HistoryList;
