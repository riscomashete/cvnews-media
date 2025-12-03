import React from 'react';

// This component is deprecated and has been replaced by RichTextEditor.tsx
// to remove external dependencies and improve stability.

const TinyMCEEditor: React.FC<any> = () => {
  return <div className="p-4 bg-red-100 text-red-800">TinyMCE has been removed. Please use RichTextEditor.</div>;
};

export default TinyMCEEditor;