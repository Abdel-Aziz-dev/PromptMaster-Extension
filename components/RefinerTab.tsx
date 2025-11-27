
import React, { useState, useEffect, useRef } from 'react';
import { refineExistingPrompt } from '../services/geminiService';
import ResultArea from './ResultArea';
import useUndoRedo from '../hooks/useUndoRedo';
import { useLanguage } from '../contexts/LanguageContext';
import RichTextEditor from './RichTextEditor';
import CustomInstructionInput from './CustomInstructionInput';

interface RefinerTabProps {
  onSavePrompt: (content: string, name: string, category: 'refined') => void;
}

interface RefinerState {
  inputPrompt: string;
  result: string;
  selectedTone: string;
  selectedPersona: string;
  model: string;
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: '⚡ Flash', description: 'Fastest' },
  { id: 'gemini-3-pro-preview', name: '🧠 Pro', description: 'Smartest' }
];

const RefinerTab: React.FC<RefinerTabProps> = ({ onSavePrompt }) => {
  const { t } = useLanguage();
  const { 
    state, 
    update: updateState, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    init 
  } = useUndoRedo<RefinerState>({
    inputPrompt: '',
    result: '',
    selectedTone: '',
    selectedPersona: '',
    model: 'gemini-2.5-flash'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Focus save input when modal opens
  useEffect(() => {
    if (isSaveModalOpen && saveInputRef.current) {
      setTimeout(() => saveInputRef.current?.focus(), 50);
    }
  }, [isSaveModalOpen]);

  // Load draft from local storage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('prompt_master_refiner_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        init({
          inputPrompt: parsed.inputPrompt || '',
          result: parsed.result || '',
          selectedTone: parsed.selectedTone || '',
          selectedPersona: parsed.selectedPersona || '',
          model: parsed.model || 'gemini-2.5-flash'
        });
      }
    } catch (e) {
      console.error("Failed to load refiner draft", e);
    }
  }, [init]);

  // Auto-save draft on changes (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('prompt_master_refiner_draft', JSON.stringify(state));
    }, 1000);

    return () => clearTimeout(timer);
  }, [state]);

  // Helper to extract text from HTML for the API
  const getPlainText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.innerText || tempDiv.textContent || '';
  };

  const handleRefine = async (instruction: string, tone?: string, persona?: string) => {
    const plainTextPrompt = getPlainText(state.inputPrompt);

    if (!plainTextPrompt.trim()) {
      setError('Please paste a prompt to refine.');
      return;
    }
    setError('');
    setLoading(true);
    setCopied(false);
    
    try {
      // Send plain text to Gemini, but keep HTML in the input state
      const refined = await refineExistingPrompt(plainTextPrompt, instruction, state.model);
      
      updateState({ 
        ...state, 
        result: refined,
        selectedTone: tone !== undefined ? tone : state.selectedTone,
        selectedPersona: persona !== undefined ? persona : state.selectedPersona
      }, true);
      
    } catch (e) {
      setError('Failed to refine prompt. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToneChange = (tone: string) => {
    const plainText = getPlainText(state.inputPrompt);
    if (tone && plainText.trim()) {
      handleRefine(`Rewrite this prompt in a ${tone} tone. Keep the core intent but shift the style.`, tone, undefined);
    } else {
      updateState({ ...state, selectedTone: tone }, true);
    }
  };

  const handlePersonaChange = (persona: string) => {
    const plainText = getPlainText(state.inputPrompt);
    if (persona && plainText.trim()) {
      handleRefine(`Adopt the persona of a ${persona}. Rewrite the prompt to reflect this persona's expertise, perspective, and voice.`, undefined, persona);
    } else {
      updateState({ ...state, selectedPersona: persona }, true);
    }
  };

  const useResultAsInput = () => {
    if (state.result) {
      const htmlResult = state.result.replace(/\n/g, '<br>');

      updateState({
        inputPrompt: htmlResult,
        result: '', // Clear result as it moved to input
        selectedTone: '', // Reset attributes for fresh start
        selectedPersona: '',
        model: state.model
      }, true); 
    }
  };

  const handleCopyResult = async () => {
    if (!state.result) return;
    try {
      await navigator.clipboard.writeText(state.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleClearInput = () => {
     updateState({
       ...state,
       inputPrompt: '',
       result: '', 
     }, true);
  };

  const handleInitiateSave = () => {
    if (!state.result) return;
    setSaveName(`Refined Prompt ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (state.result && saveName.trim()) {
        onSavePrompt(state.result, saveName.trim(), 'refined');
        setIsSaveModalOpen(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if modal is open
      if (isSaveModalOpen) return;

      // Refine: Ctrl+Enter or Cmd+Enter (Global Action)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // Default action for global shortcut
        handleRefine("Optimize for clarity, coherence, and effectiveness.");
      }
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (state.result && !loading) {
          handleInitiateSave();
        }
      }
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, loading, undo, redo, isSaveModalOpen]);

  return (
    <div className="flex flex-col h-full relative space-y-3 pb-4">
        
        {/* TOP CONTROL BAR */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-1 rounded-lg border border-gray-100 dark:border-slate-800">
            <div className="flex items-center space-x-0.5">
               <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors rounded hover:bg-white dark:hover:bg-slate-700">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
               </button>
               <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors rounded hover:bg-white dark:hover:bg-slate-700">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
               </button>
            </div>

            <div className="flex bg-gray-200 dark:bg-slate-700/50 p-0.5 rounded-md">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => updateState({ ...state, model: m.id })}
                  title={m.description}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                    state.model === m.id
                      ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <button 
                onClick={handleClearInput}
                className="px-2 py-1 rounded-md text-[10px] font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Clear Input"
            >
                {t('refiner.clear')}
            </button>
        </div>

        {/* INPUT CARD */}
        <div id="ref-input-area" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden group focus-within:ring-1 focus-within:ring-brand-500/50 transition-all">
          <div className="p-2 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                {t('refiner.originalPrompt')}
             </label>
             {error && <span className="text-[10px] text-red-500 font-medium animate-pulse">{error}</span>}
          </div>
          
          <RichTextEditor
            value={state.inputPrompt}
            onChange={(html) => updateState({ ...state, inputPrompt: html })}
            placeholder={t('refiner.placeholders.input')}
            className="w-full border-none rounded-none focus:ring-0"
            disabled={loading}
          />
        </div>

        {/* ACTION STUDIO CARD */}
        <div id="ref-actions-bar" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-3 space-y-3">
          
          {/* Section 1: Quick Actions */}
          <div>
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('refiner.refinementActions')}</label>
             <div className="grid grid-cols-2 gap-2">
                <ActionButton 
                  icon="✨" 
                  label={t('refiner.actions.optimize')} 
                  onClick={() => handleRefine("Optimize for clarity, coherence, and model adherence. Use clear delimiters and structure.")} 
                  disabled={loading} 
                  primary
                  className="col-span-2"
                />
                <ActionButton 
                  icon="📝" 
                  label={t('refiner.actions.grammar')} 
                  onClick={() => handleRefine("Fix all grammar, spelling, and punctuation errors without changing the tone.")} 
                  disabled={loading} 
                />
                <ActionButton 
                  icon="🧩" 
                  label={t('refiner.actions.simplify')} 
                  onClick={() => handleRefine("Simplify language to be concise and easy to understand (8th-grade level).")} 
                  disabled={loading} 
                />
                <ActionButton
                   icon="✂️"
                   label={t('refiner.actions.shorten')}
                   onClick={() => handleRefine("Shorten this prompt significantly while keeping core instructions.")}
                   disabled={loading}
                />
                <ActionButton
                   icon="➕"
                   label={t('refiner.actions.expand')}
                   onClick={() => handleRefine("Expand with more context, edge cases, and detailed examples.")}
                   disabled={loading}
                />
             </div>
          </div>
          
          <div className="h-px bg-gray-100 dark:bg-slate-700"></div>

          {/* Section 2: Format Output */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('refiner.formatOutput')}</label>
            <div className="flex gap-2">
              <ActionButton
                 icon="{}"
                 label={t('refiner.actions.json')}
                 onClick={() => handleRefine("Ensure the output is strictly valid JSON format.")}
                 disabled={loading}
                 className="flex-1"
              />
              <ActionButton
                 icon="M↓"
                 label={t('refiner.actions.markdown')}
                 onClick={() => handleRefine("Format the output using Markdown (headers, bullets, code blocks).")}
                 disabled={loading}
                 className="flex-1"
              />
              <ActionButton
                 icon="▦"
                 label={t('refiner.actions.table')}
                 onClick={() => handleRefine("Format the output as a comparative table.")}
                 disabled={loading}
                 className="flex-1"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-slate-700"></div>

          {/* Section 3: Fine Tuning */}
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block pl-1">{t('refiner.tone')}</label>
               <div className="relative">
                <select
                    value={state.selectedTone}
                    onChange={(e) => handleToneChange(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none py-2 px-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer hover:border-brand-300 transition-colors shadow-sm"
                >
                  <option value="">Select Tone...</option>
                  <option value="Professional">👔 Professional</option>
                  <option value="Friendly">👋 Friendly</option>
                  <option value="Persuasive">📢 Persuasive</option>
                  <option value="Academic">🎓 Academic</option>
                  <option value="Direct">🎯 Direct / Concise</option>
                  <option value="Creative">🎨 Creative</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block pl-1">{t('refiner.persona')}</label>
               <div className="relative">
                  <select
                      value={state.selectedPersona}
                      onChange={(e) => handlePersonaChange(e.target.value)}
                      disabled={loading}
                      className="w-full appearance-none py-2 px-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer hover:border-brand-300 transition-colors shadow-sm"
                  >
                    <option value="">Select Persona...</option>
                    <option value="World-Class Expert">🧠 Subject Expert</option>
                    <option value="Skeptical Critic">🧐 Critic</option>
                    <option value="Patient Teacher">🧑‍🏫 Teacher</option>
                    <option value="Creative Storyteller">🎭 Storyteller</option>
                    <option value="Senior Engineer">💻 Engineer</option>
                    <option value="Product Manager">🚀 PM</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
               </div>
             </div>
          </div>

          {/* Section 4: Custom */}
          <CustomInstructionInput 
            onRun={handleRefine}
            loading={loading}
            disabled={loading}
          />
        </div>

        {/* RESULT SECTION */}
        <div className="relative">
           {state.result && (
             <div className="absolute top-0 right-0 -mt-10 flex items-center space-x-2 z-10">
                <button
                  onClick={useResultAsInput}
                  className="flex items-center space-x-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-900/50 px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all shadow-sm"
                  title="Move this result to original prompt to refine further"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 12v5h16a2 2 0 0 0 0-4H5v4"></path></svg>
                  <span>{t('refiner.loopToInput')}</span>
                </button>
             </div>
           )}
           
           <ResultArea 
            content={state.result} 
            loading={loading} 
            onSave={handleInitiateSave} 
          />
        </div>
      
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

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
}> = ({ icon, label, onClick, disabled, primary, className = '' }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all active:scale-95 border
      ${primary 
        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white border-transparent shadow-brand-200 dark:shadow-none shadow-sm hover:shadow-md' 
        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-slate-700'
      }
      disabled:opacity-50 disabled:cursor-not-allowed ${className}
    `}
  >
    <span className="text-sm leading-none">{icon}</span>
    <span>{label}</span>
  </button>
);

export default RefinerTab;
