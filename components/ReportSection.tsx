import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AudioButton from './AudioButton';
import { KeyTerm } from '../types';
import { renderMarkdownWithTooltips } from '../utils/textUtils';

interface ReportSectionProps {
  title: string;
  content: string | React.ReactNode;
  rawTextForAudio?: string; 
  defaultOpen?: boolean;
  keyTerms?: KeyTerm[];
}

const ReportSection: React.FC<ReportSectionProps> = ({ 
  title, 
  content, 
  rawTextForAudio, 
  defaultOpen = true,
  keyTerms = []
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Helper to render content with tooltips if it's a string
  const renderContent = (text: string) => {
    // New utility handles Markdown -> HTML + Tooltip Injection in DOM
    const htmlContent = renderMarkdownWithTooltips(text, keyTerms);
    return (
      <div 
        className="prose prose-stone dark:prose-invert max-w-none prose-p:text-stone-600 dark:prose-p:text-stone-300 prose-headings:text-stone-800 dark:prose-headings:text-stone-100 prose-strong:text-stone-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-4 prose-a:text-accent"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    );
  };

  // If title is empty (used for nested markdown rendering), just render content
  if (!title) {
     if (typeof content === 'string') {
      return renderContent(content);
    }
    return <>{content}</>;
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 mb-6 transition-all duration-300 hover:shadow-premium dark:hover:shadow-none relative z-10 group">
      <div 
        className={`flex items-center justify-between p-6 cursor-pointer transition-colors rounded-t-xl ${isOpen ? 'bg-white dark:bg-stone-900' : 'bg-surface-highlight/50 dark:bg-stone-800/50 rounded-b-xl'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-serif font-medium text-xl text-primary dark:text-stone-100 tracking-tight">{title}</h3>
        <div className="flex items-center gap-4">
          {isOpen && rawTextForAudio && (
            <div onClick={(e) => e.stopPropagation()}>
              <AudioButton text={rawTextForAudio} />
            </div>
          )}
          <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-stone-100 dark:bg-stone-800 rotate-180' : 'bg-transparent'}`}>
             <ChevronDown className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-2 text-stone-600 dark:text-stone-300 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 border-t border-stone-50 dark:border-stone-800 rounded-b-xl">
           {typeof content === 'string' ? renderContent(content) : content}
        </div>
      )}
    </div>
  );
};

export default ReportSection;
