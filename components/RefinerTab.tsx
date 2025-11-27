
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

  // UI State
  const [isRefinementActionsOpen, setIsRefinementActionsOpen] = useState(true);

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
    
    // Optimistically update tone/persona selections if provided
    if (tone !== undefined || persona !== undefined) {
      // We don't need to manually update state here as the final updateState will handle it,
      // but if we wanted instant UI feedback before API return, we could.
      // Since we update state with the result, we'll just wait for the result.
    }

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
    <div className="p-1 h-full flex flex-col relative">
      <div className="space-y-4 pb-4">
        
        {/* Top Controls: Undo/Redo/Clear + Model Selector */}
        <div className="flex justify-between items-center">
            {/* Model Selector */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => updateState({ ...state, model: m.id })}
                  title={m.description}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                    state.model === m.id
                      ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                 onClick={undo}
                 disabled={!canUndo}
                 title="Undo (Ctrl+Z)"
                 className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
               </button>
               <button
                 onClick={redo}
                 disabled={!canRedo}
                 title="Redo (Ctrl+Y)"
                 className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
               </button>
               <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              <button 
                onClick={handleClearInput}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                title="Clear Input"
              >
                {t('refiner.clear')}
              </button>
            </div>
        </div>

        {/* Input Section */}
        <div id="ref-input-area" className="relative group">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('refiner.originalPrompt')}
          </label>
          
          <RichTextEditor
            value={state.inputPrompt}
            onChange={(html) => updateState({ ...state, inputPrompt: html })}
            placeholder={t('refiner.placeholders.input')}
            className="w-full"
            disabled={loading}
          />

          {error && <p className="absolute -bottom-5 left-0 text-red-500 text-xs">{error}</p>}
        </div>

        {/* Toolbar / Actions */}
        <div id="ref-actions-bar" className="space-y-3 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
          
          {/* Collapsible Refinement Actions */}
          <div>
            <button 
              onClick={() => setIsRefinementActionsOpen(!isRefinementActionsOpen)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors outline-none focus:text-brand-600"
            >
              <span>{t('refiner.refinementActions')}</span>
              {isRefinementActionsOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              )}
            </button>
            
            {isRefinementActionsOpen && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                <ActionButton 
                  icon="✨" 
                  label={t('refiner.actions.optimize')} 
                  onClick={() => handleRefine("Optimize for clarity, coherence, and model adherence. Use clear delimiters and structure.")} 
                  disabled={loading} 
                  primary
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
            )}
          </div>
          
          <div className="h-px bg-gray-200 dark:bg-slate-700"></div>

          {/* Format Output */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('refiner.formatOutput')}</label>
            <div className="flex gap-2">
              <ActionButton
                 icon="{}"
                 label={t('refiner.actions.json')}
                 onClick={() => handleRefine("Ensure the output is strictly valid JSON format.")}
                 disabled={loading}
              />
              <ActionButton
                 icon="M↓"
                 label={t('refiner.actions.markdown')}
                 onClick={() => handleRefine("Format the output using Markdown (headers, bullets, code blocks).")}
                 disabled={loading}
              />
              <ActionButton
                 icon="▦"
                 label={t('refiner.actions.table')}
                 onClick={() => handleRefine("Format the output as a comparative table.")}
                 disabled={loading}
              />
            </div>
          </div>

          {/* Tone & Persona */}
          <div className="grid grid-cols-2 gap-3">
             {/* Tone */}
             <div>
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('refiner.tone')}</label>
               <select
                  value={state.selectedTone}
                  onChange={(e) => handleToneChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded py-1.5 px-2 text-xs text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-brand-500 outline-none"
               >
                 <option value="">Select Tone...</option>
                 <option value="Professional">👔 Professional</option>
                 <option value="Friendly">👋 Friendly</option>
                 <option value="Persuasive">📢 Persuasive</option>
                 <option value="Academic">🎓 Academic</option>
                 <option value="Direct">🎯 Direct / Concise</option>
                 <option value="Creative">🎨 Creative</option>
               </select>
             </div>

             {/* Persona */}
             <div>
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('refiner.persona')}</label>
               <select
                  value={state.selectedPersona}
                  onChange={(e) => handlePersonaChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded py-1.5 px-2 text-xs text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-brand-500 outline-none"
               >
                 <option value="">Select Persona...</option>
                 <option value="World-Class Expert">🧠 Subject Expert</option>
                 <option value="Skeptical Critic">🧐 Critic</option>
                 <option value="Patient Teacher">🧑‍🏫 Teacher</option>
                 <option value="Creative Storyteller">🎭 Storyteller</option>
                 <option value="Senior Engineer">💻 Engineer</option>
                 <option value="Product Manager">🚀 PM</option>
               </select>
             </div>
          </div>

          {/* Custom Instruction Component */}
          <CustomInstructionInput 
            onRun={handleRefine}
            loading={loading}
            disabled={loading}
          />
        </div>

        {/* Result Section */}
        <div className="relative">
           {state.result && (
             <div className="absolute top-0 right-0 -mt-8 flex items-center space-x-2">
                <button
                  onClick={handleCopyResult}
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                    copied 
                      ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' 
                      : 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40'
                  }`}
                  title="Copy refined prompt to clipboard"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
                <button
                  onClick={useResultAsInput}
                  className="flex items-center space-x-1 text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
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
      </div>
      
      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100 p-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-brand-600"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                 Name your prompt
              </h3>
              <input 
                ref={saveInputRef}
                type="text" 
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
                placeholder="Enter a name..."
                className="w-full text-sm p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 mb-4 text-gray-900 dark:text-gray-100"
              />
              <div className="flex space-x-3">
                 <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleConfirmSave}
                    disabled={!saveName.trim()}
                    className="flex-1 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                 >
                    Save
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
}> = ({ icon, label, onClick, disabled, primary }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all shadow-sm
      ${primary 
        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200 dark:shadow-none col-span-2 sm:col-span-1' 
        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-slate-700'
      }
      disabled:opacity-50 disabled:cursor-not-allowed
    `}
  >
    <span className="text-base leading-none">{icon}</span>
    <span>{label}</span>
  </button>
);

export default RefinerTab;
