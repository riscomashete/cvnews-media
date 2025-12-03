import React, { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue = '', onChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content
  useEffect(() => {
    if (contentRef.current && initialValue) {
      // Only set initial HTML if it's empty to prevent cursor jumping on re-renders
      if (contentRef.current.innerHTML === '') {
        contentRef.current.innerHTML = initialValue;
      }
    }
  }, [initialValue]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    // Ensure focus remains or returns to editor
    contentRef.current?.focus();
    handleInput();
  };

  const ToolbarButton: React.FC<{ 
    cmd: string; 
    arg?: string; 
    label: string; 
    icon?: React.ReactNode 
  }> = ({ cmd, arg, label, icon }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        execCmd(cmd, arg);
      }}
      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
      title={label}
    >
      {icon || label}
    </button>
  );

  return (
    <div className={`border rounded-md overflow-hidden bg-white dark:bg-gray-800 transition-colors ${isFocused ? 'border-brand-red ring-1 ring-brand-red' : 'border-gray-300 dark:border-gray-600'}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <ToolbarButton cmd="formatBlock" arg="H2" label="Heading" icon={<span className="font-serif font-bold text-lg">H</span>} />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <ToolbarButton cmd="bold" label="Bold" icon={<span className="font-bold">B</span>} />
        <ToolbarButton cmd="italic" label="Italic" icon={<span className="italic">I</span>} />
        <ToolbarButton cmd="underline" label="Underline" icon={<span className="underline">U</span>} />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <ToolbarButton cmd="insertUnorderedList" label="Bullet List" icon={<span>• List</span>} />
        <ToolbarButton cmd="insertOrderedList" label="Numbered List" icon={<span>1. List</span>} />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <ToolbarButton cmd="justifyLeft" label="Left" icon={<span>←</span>} />
        <ToolbarButton cmd="justifyCenter" label="Center" icon={<span>↔</span>} />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <button 
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if(url) execCmd('createLink', url);
          }}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
        >
          Link
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={contentRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-[400px] p-4 outline-none prose prose-lg dark:prose-invert max-w-none overflow-y-auto"
        style={{ fontFamily: 'Merriweather, serif' }}
      />
    </div>
  );
};

export default RichTextEditor;