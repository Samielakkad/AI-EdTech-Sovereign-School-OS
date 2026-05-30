import React from 'react';

const MarkdownRenderer: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const createMarkup = (rawText: string) => {
    if (!rawText) return { __html: '' };

    let html = rawText
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headings
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-4 text-indigo-300">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-900 text-yellow-300 font-mono px-2 py-1 rounded-md">$1</code>')
      // Lists (simple numbered)
      .replace(/^\d+\.\s(.*$)/gim, '<li class="ml-6">$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-300 hover:underline">$1</a>');
      
    // Wrap list items in ol
    html = html.replace(/(<li>(?!.*<ol>).*<\/li>)/gs, (match) => {
        return `<ol class="list-decimal list-inside space-y-2 my-4">${match}</ol>`;
    });

    html = html.replace(/<\/li>\n<ol>/g, '</li><ol>');


    return { __html: html };
  };

  return <div className={`whitespace-pre-wrap ${className}`} dangerouslySetInnerHTML={createMarkup(text)} />;
};

export default MarkdownRenderer;
