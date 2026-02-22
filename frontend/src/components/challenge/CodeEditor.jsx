import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

const CodeEditor = ({ 
  language = 'sql', 
  defaultValue = '', 
  value,
  onChange, 
  onRun,
  readOnly = false 
}) => {
  const editorRef = useRef(null);
  const monaco = useMonaco();

  // Define custom theme when monaco instance is available
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('databricks-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.lineHighlightBackground': '#2d2d2d',
          'editorCursor.foreground': '#aeafad',
          'editor.selectionBackground': '#264f78',
        }
      });
      monaco.editor.setTheme('databricks-dark');
    }
  }, [monaco]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add keyboard shortcut for Run (Ctrl+Enter or Cmd+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) onRun();
    });
  };

  const options = {
    readOnly,
    minimap: { enabled: window.innerWidth > 768 }, // Disable minimap on mobile
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    lineNumbers: 'on',
    roundedSelection: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    tabSize: 2,
    wordWrap: 'on'
  };

  return (
    <div className="h-full w-full relative group">
      <Editor
        height="100%"
        language={language}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={options}
        theme="databricks-dark"
        loading={<div className="text-slate-500 p-4">Loading Editor...</div>}
      />
      
      {/* Overlay info */}
      <div className="absolute bottom-2 right-4 text-xs text-slate-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {language.toUpperCase()} • Ctrl+Enter to Run
      </div>
    </div>
  );
};

export default CodeEditor;
