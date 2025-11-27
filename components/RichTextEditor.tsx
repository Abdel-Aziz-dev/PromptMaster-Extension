
import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value changes (e.g., Undo/Redo) to the DOM
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      // Only update if the content is actually different to avoid cursor jumping
      // Simple check: if empty value, clear. If value provided and div is empty, set.
      // For full sync, we replace if strictly different, but this causes cursor reset if typing.
      // This effect should mostly run when 'value' changes from an external source (Undo/Redo).
      // We assume if the component is focused, the user is typing, so we avoid over-syncing unless it's a drastic change.
      
      const currentHTML = contentRef.current.innerHTML;
      if (value !== currentHTML) {
          // If we are focused, only update if the lengths differ significantly or it's a clear operation
          // This is a heuristic to allow external resets while typing
          if (!isFocused || value === '' || Math.abs(value.length - currentHTML.length) > 5) {
             contentRef.current.innerHTML = value;
          }
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      onChange(html);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
        contentRef.current.focus();
        handleInput(); // Trigger change after formatting
    }
  };

  const ToolbarButton: React.FC<{ 
    cmd: string; 
    arg?: string; 
    icon: React.ReactNode; 
    title: string 
  }> = ({ cmd, arg, icon, title }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor
        execCommand(cmd, arg);
      }}
      disabled={disabled}
      title={title}
      className="p-1.5 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
    >
      {icon}
    </button>
  );

  return (
    <div className={`flex flex-col border rounded-md overflow-hidden transition-all bg-white dark:bg-slate-800 ${
      isFocused 
        ? 'border-brand-500 ring-1 ring-brand-500' 
        : 'border-gray-300 dark:border-slate-600'
    } ${className}`}>
      
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-1 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <ToolbarButton 
          cmd="bold" 
          title="Bold (Ctrl+B)" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>} 
        />
        <ToolbarButton 
          cmd="italic" 
          title="Italic (Ctrl+I)" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="20"></line><line x1="14" y1="4" x2="5" y2="20"></line></svg>} 
        />
        <ToolbarButton 
          cmd="underline" 
          title="Underline (Ctrl+U)" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>} 
        />
        <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
        <ToolbarButton 
          cmd="insertUnorderedList" 
          title="Bullet List" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>} 
        />
        <ToolbarButton 
          cmd="insertOrderedList" 
          title="Numbered List" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>} 
        />
      </div>

      {/* Editable Area */}
      <div 
        ref={contentRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 p-3 overflow-y-auto text-sm text-gray-900 dark:text-gray-100 outline-none min-h-[5rem] max-h-[12rem] prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
        style={{ whiteSpace: 'pre-wrap' }}
        suppressContentEditableWarning={true}
        onPaste={(e) => {
            // Force plain text paste to avoid massive style injection from other sites
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }}
      />
      
      {!value && !isFocused && (
          <div 
            className="absolute top-[3.2rem] left-[13px] text-sm text-gray-400 dark:text-gray-500 pointer-events-none"
            onClick={() => contentRef.current?.focus()}
          >
              {placeholder}
          </div>
      )}
    </div>
  );
};

export default RichTextEditor;
