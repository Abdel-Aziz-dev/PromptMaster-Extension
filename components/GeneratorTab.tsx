
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tone, OutputFormat } from '../types';
import { generateSmartPrompt } from '../services/geminiService';
import ResultArea from './ResultArea';
import useUndoRedo from '../hooks/useUndoRedo';
import { useLanguage } from '../contexts/LanguageContext';

interface GeneratorTabProps {
  onSavePrompt: (content: string, name: string, category: 'generated') => void;
}

interface GeneratorFormState {
  task: string;
  context: string;
  tone: Tone;
  format: OutputFormat;
  result: string;
  model: string;
  useSearch: boolean;
  groundingChunks?: any[];
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: '⚡ Flash', description: 'Fast & Efficient' },
  { id: 'gemini-3-pro-preview', name: '🧠 Pro', description: 'Deep Reasoning' }
];

const EXAMPLES = [
  {
    label: "📧 Cold Email",
    task: "Write a cold outreach email to a potential client",
    context: "Selling a SaaS product for project management. Target audience is CTOs. Keep it under 150 words.",
    tone: Tone.PROFESSIONAL,
    format: OutputFormat.TEXT,
    model: 'gemini-2.5-flash'
  },
  {
    label: "📱 LinkedIn Post",
    task: "Write a viral LinkedIn post about the importance of deep work",
    context: "Target audience is tech professionals. Use short paragraphs, bullet points, and emojis. End with a thought-provoking question.",
    tone: Tone.PROFESSIONAL,
    format: OutputFormat.TEXT,
    model: 'gemini-2.5-flash'
  },
  {
    label: "📸 Insta Caption",
    task: "Write an engaging Instagram caption for a photo of a cozy home office",
    context: "Theme is productivity and comfort. Ask followers what their desk essential is. Use hashtags like #wfh #setup.",
    tone: Tone.FRIENDLY,
    format: OutputFormat.TEXT,
    model: 'gemini-2.5-flash'
  },
  {
    label: "🐛 Debug React",
    task: "Debug a React useEffect hook causing an infinite loop",
    context: "The dependency array includes an object that is recreated on every render. Explain the fix.",
    tone: Tone.DIRECT,
    format: OutputFormat.CODE,
    model: 'gemini-3-pro-preview'
  },
  {
    label: "🐍 Python Script",
    task: "Write a Python script to resize all images in a folder",
    context: "Use the Pillow library. Resize to 800x600 while maintaining aspect ratio. Handle errors gracefully.",
    tone: Tone.DIRECT,
    format: OutputFormat.CODE,
    model: 'gemini-3-pro-preview'
  },
  {
    label: "🎓 Explain Concept",
    task: "Explain Quantum Entanglement to a 10-year-old",
    context: "Use an analogy involving magic socks or dice. Keep it simple and fun.",
    tone: Tone.FRIENDLY,
    format: OutputFormat.TEXT,
    model: 'gemini-2.5-flash'
  },
  {
    label: "📝 Blog Outline",
    task: "Create a blog post outline about 'The Future of AI in Healthcare'",
    context: "Target audience is medical professionals. Include sections on diagnostics, ethics, and personalized medicine.",
    tone: Tone.PROFESSIONAL,
    format: OutputFormat.MARKDOWN,
    model: 'gemini-3-pro-preview'
  },
  {
    label: "📖 Story Starter",
    task: "Write the opening paragraph of a cyberpunk mystery novel",
    context: "Set in Neo-Tokyo, 2084. It's raining neon acid rain. The protagonist is a retired android hunter.",
    tone: Tone.CREATIVE,
    format: OutputFormat.TEXT,
    model: 'gemini-3-pro-preview'
  },
  {
    label: "📊 Excel Formula",
    task: "Create an Excel formula to look up a value based on multiple criteria",
    context: "Use INDEX and MATCH. Criteria are in Column A (Date) and Column B (Region).",
    tone: Tone.DIRECT,
    format: OutputFormat.STEP_BY_STEP,
    model: 'gemini-2.5-flash'
  },
  {
    label: "🥗 Meal Plan",
    task: "Create a 3-day high-protein vegetarian meal plan",
    context: "Include breakfast, lunch, dinner, and macros. Target 2000 calories per day.",
    tone: Tone.DIRECT,
    format: OutputFormat.JSON,
    model: 'gemini-3-pro-preview'
  }
];

const GeneratorTab: React.FC<GeneratorTabProps> = ({ onSavePrompt }) => {
  const { t } = useLanguage();
  const { 
    state: formState, 
    update: updateForm, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    init 
  } = useUndoRedo<GeneratorFormState>({
    task: '',
    context: '',
    tone: Tone.PROFESSIONAL,
    format: OutputFormat.TEXT,
    result: '',
    model: 'gemini-3-pro-preview',
    useSearch: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Auto-save states
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [formState.context]);

  // Focus save input when modal opens
  useEffect(() => {
    if (isSaveModalOpen && saveInputRef.current) {
      setTimeout(() => saveInputRef.current?.focus(), 50);
    }
  }, [isSaveModalOpen]);

  // Load draft from local storage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('prompt_master_generator_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        init({
          task: parsed.task || '',
          context: parsed.context || '',
          tone: parsed.tone || Tone.PROFESSIONAL,
          format: parsed.format || OutputFormat.TEXT,
          result: parsed.result || '',
          model: parsed.model || 'gemini-3-pro-preview',
          useSearch: parsed.useSearch || false
        });
      }
    } catch (e) {
      console.error("Failed to load generator draft", e);
    }
  }, [init]);

  // Auto-save draft on changes (Debounced)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      const { groundingChunks, ...stateToSave } = formState;
      localStorage.setItem('prompt_master_generator_draft', JSON.stringify(stateToSave));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formState]);

  // Calculate Prompt Strength
  const promptStrength = useMemo(() => {
    let score = 0;
    if (formState.task.length > 5) score += 40;
    if (formState.task.length > 20) score += 10;
    if (formState.context.length > 10) score += 30;
    if (formState.context.length > 50) score += 20;
    return Math.min(score, 100);
  }, [formState.task, formState.context]);

  const getStrengthLabel = (score: number) => {
    if (score < 40) return { label: t('generator.promptStrength.weak'), color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
    if (score < 80) return { label: t('generator.promptStrength.good'), color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' };
    return { label: t('generator.promptStrength.strong'), color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' };
  };

  const strengthInfo = getStrengthLabel(promptStrength);

  const handleGenerate = async () => {
    if (!formState.task.trim()) {
      setError('Please enter a core task.');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const generated = await generateSmartPrompt(
        formState.task, 
        formState.context, 
        formState.tone, 
        formState.format,
        formState.model,
        formState.useSearch
      );
      updateForm({ 
        ...formState, 
        result: generated.text,
        groundingChunks: generated.groundingChunks 
      }, true);
    } catch (e) {
      setError('Failed to generate prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyExample = (ex: typeof EXAMPLES[0]) => {
    updateForm({
      task: ex.task,
      context: ex.context,
      tone: ex.tone,
      format: ex.format,
      result: '',
      model: ex.model || 'gemini-2.5-flash',
      useSearch: false
    }, true);
    setError('');
  };

  const handleClear = () => {
    updateForm({
      task: '',
      context: '',
      tone: Tone.PROFESSIONAL,
      format: OutputFormat.TEXT,
      result: '',
      model: 'gemini-3-pro-preview',
      useSearch: false,
      groundingChunks: undefined
    }, true);
    setError('');
  };

  const handleInitiateSave = () => {
    if (!formState.result) return;
    
    let defaultName = formState.task.trim();
    if (defaultName.length > 50) defaultName = defaultName.substring(0, 50) + '...';
    if (!defaultName) defaultName = `Prompt ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    setSaveName(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (formState.result && saveName.trim()) {
        onSavePrompt(formState.result, saveName.trim(), 'generated');
        setIsSaveModalOpen(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSaveModalOpen) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (formState.result && !loading) {
          handleInitiateSave();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formState, loading, undo, redo, isSaveModalOpen]);

  const isThinkingMode = formState.model === 'gemini-3-pro-preview';

  return (
    <div className="flex flex-col h-full relative space-y-3 pb-4">
        
        {/* TOP CONTROL BAR */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-1 rounded-lg border border-gray-100 dark:border-slate-800">
           {/* Undo/Redo Group */}
           <div className="flex items-center space-x-0.5">
              <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors rounded hover:bg-white dark:hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors rounded hover:bg-white dark:hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
           </div>

           {/* Save Status & Clear */}
           <div className="flex items-center space-x-3">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium transition-opacity duration-300">
                {isSaving ? (
                  <span className="flex items-center"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse mr-1"></span> Saving...</span>
                ) : lastSaved ? (
                  <span>Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                ) : null}
              </div>
              <button onClick={handleClear} className="px-2 py-1 rounded-md text-[10px] font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                {t('generator.clear')}
              </button>
           </div>
        </div>
        
        {/* ENGINE SELECTOR & FEATURES */}
        <div id="gen-model-selector" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">AI Engine</span>
             {isThinkingMode ? (
                <div className="flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 1 8 8c0 1.5-.4 3-1.1 4.2l.7 2.2a1 1 0 0 1-1.3 1.2l-2.3-.7C14.8 18.2 13.4 18.7 12 18.7a8.7 8.7 0 1 1 0-17.4z"/></svg>
                  Thinking Mode
                </div>
             ) : (
                <label className="flex items-center cursor-pointer group px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formState.useSearch} 
                    onChange={(e) => updateForm({ ...formState, useSearch: e.target.checked })}
                    className="w-3 h-3 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors cursor-pointer"
                  />
                  <span className="ml-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Search Grounding
                  </span>
                </label>
             )}
           </div>

           <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    const newUseSearch = m.id === 'gemini-3-pro-preview' ? false : formState.useSearch;
                    updateForm({ ...formState, model: m.id, useSearch: newUseSearch });
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-md transition-all duration-200 ${
                    formState.model === m.id
                      ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-slate-600/50'
                  }`}
                >
                  <span className="text-xs font-bold">{m.name}</span>
                  <span className="text-[9px] opacity-70">{m.description}</span>
                </button>
              ))}
           </div>
        </div>

        {/* INPUT CARD */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden group focus-within:ring-1 focus-within:ring-brand-500/50 focus-within:border-brand-500/50 transition-all">
            {/* Task Input */}
            <div id="gen-task-input" className="p-3 border-b border-gray-100 dark:border-slate-700 relative">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {t('generator.coreTask')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full text-sm font-medium text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600 ${error ? 'placeholder-red-300' : ''}`}
                placeholder={t('generator.placeholders.task')}
                value={formState.task}
                onChange={(e) => {
                  updateForm({ ...formState, task: e.target.value });
                  if (error) setError('');
                }}
              />
              {/* Strength Meter Line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-slate-700">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${strengthInfo.color}`} 
                  style={{ width: `${promptStrength}%` }}
                ></div>
              </div>
            </div>

            {/* Context Input */}
            <div id="gen-context-input" className="p-3 bg-gray-50/50 dark:bg-slate-800/50">
               <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {t('generator.context')}
                </label>
                <div className="flex items-center space-x-2">
                   <span className={`text-[9px] font-bold uppercase ${strengthInfo.text} bg-white dark:bg-slate-700 px-1.5 rounded border border-gray-100 dark:border-slate-600 shadow-sm`}>
                      {strengthInfo.label}
                   </span>
                   <span className="text-[9px] text-gray-400">{formState.context.length} chars</span>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full text-xs text-gray-700 dark:text-gray-300 bg-transparent outline-none min-h-[60px] resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed"
                placeholder={t('generator.placeholders.context')}
                value={formState.context}
                onChange={(e) => updateForm({ ...formState, context: e.target.value })}
              />
            </div>
        </div>

        {/* FINE TUNING GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">{t('generator.tone')}</label>
            <div className="relative">
              <select
                className="w-full appearance-none py-2 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer hover:border-brand-300 dark:hover:border-slate-500 transition-colors shadow-sm"
                value={formState.tone}
                onChange={(e) => updateForm({ ...formState, tone: e.target.value as Tone }, true)}
              >
                {Object.values(Tone).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">{t('generator.format')}</label>
            <div className="relative">
              <select
                className="w-full appearance-none py-2 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer hover:border-brand-300 dark:hover:border-slate-500 transition-colors shadow-sm"
                value={formState.format}
                onChange={(e) => updateForm({ ...formState, format: e.target.value as OutputFormat }, true)}
              >
                {Object.values(OutputFormat).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* TEMPLATES (SCROLLABLE) */}
        <div id="gen-templates" className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
            {t('generator.templates')}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
             <button
                onClick={() => {
                   const random = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
                   applyExample(random);
                }}
                className="flex-shrink-0 px-2.5 py-1.5 text-[10px] font-bold bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/50 text-brand-600 dark:text-brand-400 rounded-md hover:bg-brand-100 transition-all shadow-sm active:scale-95"
              >
                🎲 Random
              </button>
            {EXAMPLES.slice(0, 8).map((ex, idx) => (
              <button
                key={idx}
                onClick={() => applyExample(ex)}
                className="flex-shrink-0 px-2.5 py-1.5 text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 rounded-md transition-all text-gray-600 dark:text-gray-300 whitespace-nowrap shadow-sm active:scale-95"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
           <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 flex items-center animate-in fade-in slide-in-from-top-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             {error}
           </div>
        )}

        {/* GENERATE BUTTON */}
        <button
          id="gen-generate-btn"
          onClick={handleGenerate}
          disabled={loading}
          title="Ctrl + Enter"
          className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('generator.crafting')}</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              {t('generator.generate')}
            </>
          )}
        </button>

        <ResultArea 
          content={formState.result} 
          loading={loading} 
          onSave={handleInitiateSave}
          groundingChunks={formState.groundingChunks}
        />

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100 p-5">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-brand-600"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                 Name your prompt
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Give it a memorable name to find it later.</p>
              
              <div className="relative mb-5">
                <input 
                  ref={saveInputRef}
                  type="text" 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
                  placeholder="Enter a name..."
                  className="w-full text-sm p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                />
              </div>

              <div className="flex space-x-3">
                 <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleConfirmSave}
                    disabled={!saveName.trim()}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none"
                 >
                    Save Prompt
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorTab;
