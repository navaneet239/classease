import React, { useRef, useState, useEffect } from 'react';
import { ChapterReport, FormData, KeyTerm } from '../types';
import ReportSection from './ReportSection';
import ChatInterface from './ChatInterface';
import { Download, ArrowLeft, FileText, Loader2, Bookmark, MessageSquare, BookOpen, GripVertical } from 'lucide-react';
import AudioButton from './AudioButton';
import { renderMarkdownWithTooltips } from '../utils/textUtils';

interface ReportViewProps {
  report: ChapterReport;
  inputData: FormData;
  onReset: () => void;
}

type Tab = 'report' | 'chat';

const ReportView: React.FC<ReportViewProps> = ({ report, inputData, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('report');
  
  // Resizable state
  const [chatWidth, setChatWidth] = useState(35); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const newChatWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
      // Clamp between 20% and 60%
      if (newChatWidth > 20 && newChatWidth < 60) {
        setChatWidth(newChatWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const handleJsonDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${report.chapterTitle.replace(/\s+/g, '_')}_Explainer.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePdfDownload = async () => {
    if (!reportRef.current) return;
    setIsDownloadingPdf(true);
    
    // @ts-ignore
    if (typeof window !== 'undefined' && window.html2pdf) {
      const element = reportRef.current;
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `${report.chapterTitle.replace(/\s+/g, '_')}_Explainer.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } catch (e) {
        console.error("PDF generation failed", e);
        alert("Failed to generate PDF. Please try again.");
      }
    } else {
      alert("PDF generator is initializing, please wait a moment and try again.");
    }
    setIsDownloadingPdf(false);
  };

  const renderMarkdown = (text: string, className: string = "", keyTerms: KeyTerm[] = []) => {
    // New DOM-based rendering
    const html = renderMarkdownWithTooltips(text, keyTerms);
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  // Content for the report - abstracted for re-use in both desktop/mobile layouts
  const ReportContent = () => (
    <div ref={reportRef} className="space-y-8 pb-10">
      
      {/* Editorial Title Card */}
      {/* Note: We separate the background (overflow-hidden) from the content (overflow-visible) to let tooltips pop out */}
      <div className="relative bg-primary dark:bg-stone-900 rounded-2xl shadow-2xl shadow-stone-300 dark:shadow-none print:shadow-none print:break-inside-avoid group">
        
        {/* Isolated Background Container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
           {/* Subtle Accent Decoration */}
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-stone-800 dark:bg-black rounded-full blur-3xl opacity-50 print:hidden"></div>
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 print:hidden"></div>
        </div>

        {/* Content Container (Visible Overflow for Tooltips) */}
        <div className="relative z-10 p-6 md:p-10 max-w-3xl">
          <div className="flex items-center gap-3 text-stone-300 mb-4 text-xs font-bold uppercase tracking-[0.2em]">
            <span className="w-8 h-[1px] bg-accent"></span>
            {inputData.subject}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight tracking-tight text-white">{report.chapterTitle}</h1>
          {/* Overview with Markdown & Tooltips */}
          {renderMarkdown(
            report.overview, 
            "text-stone-300 text-base md:text-lg leading-relaxed prose prose-invert prose-p:text-stone-300/90 prose-strong:text-white prose-headings:text-white",
            report.keyTerms
          )}
        </div>
      </div>

      {/* Smart Summary - High Priority */}
      <div className="bg-white dark:bg-stone-900 border-l-4 border-accent rounded-r-xl p-6 md:p-8 shadow-premium dark:shadow-none print:break-inside-avoid relative z-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl text-primary dark:text-stone-100 flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-accent fill-current" />
            Teacher's Insight
          </h2>
          <div data-html2canvas-ignore="true">
            <AudioButton text={report.teacherRecap} label="Listen" />
          </div>
        </div>
        {/* Teacher Recap with Markdown & Tooltips */}
        {renderMarkdown(
          report.teacherRecap,
          "text-stone-700 dark:text-stone-300 italic text-lg leading-relaxed prose prose-stone dark:prose-invert max-w-none font-serif",
          report.keyTerms
        )}
      </div>

      <div className="space-y-6 relative z-10">
        {/* Key Terms - Render definitions as Markdown too */}
        <ReportSection 
          title="Lexicon & Definitions" 
          defaultOpen={true}
          content={
            <div className="grid grid-cols-1 gap-4">
              {report.keyTerms.map((term, idx) => (
                <div key={idx} className="bg-surface-highlight dark:bg-stone-800/50 p-5 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-colors print:break-inside-avoid relative hover:z-20">
                  <span className="block font-serif font-bold text-lg text-primary dark:text-stone-100 mb-2 border-b border-stone-200 dark:border-stone-700 pb-2 inline-block">{term.term}</span>
                  {/* Render Definition as Markdown */}
                  <div 
                    className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownWithTooltips(term.definition, report.keyTerms) }}
                  />
                </div>
              ))}
            </div>
          } 
        />

        {/* Concept Breakdown */}
        <ReportSection 
          title="Core Concepts" 
          defaultOpen={true}
          keyTerms={report.keyTerms}
          content={
            <div className="space-y-8">
              {report.conceptBreakdown.map((concept, idx) => (
                <div key={idx} className="group print:break-inside-avoid">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-serif font-medium text-xl text-primary dark:text-stone-100 flex gap-3">
                      <span className="text-stone-300 dark:text-stone-600 font-sans text-lg font-bold">0{idx + 1}</span>
                      {concept.title}
                    </h4>
                    <div data-html2canvas-ignore="true">
                      <AudioButton text={`${concept.title}. ${concept.explanation}`} label="Read" />
                    </div>
                  </div>
                  <div className="text-stone-600 dark:text-stone-300 leading-relaxed pl-10 border-l border-stone-200 dark:border-stone-700 group-hover:border-accent transition-colors duration-500">
                    <ReportSection title="" content={concept.explanation} defaultOpen={true} keyTerms={report.keyTerms} />
                  </div>
                </div>
              ))}
            </div>
          } 
        />

        {/* Formulae / Steps */}
        {report.formulaeOrSteps.length > 0 && (
          <ReportSection 
            title="Methodology & Formulas" 
            defaultOpen={true}
            keyTerms={report.keyTerms}
            content={
              <ul className="grid grid-cols-1 gap-3">
                {report.formulaeOrSteps.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="bg-stone-900 dark:bg-stone-950 text-stone-300 p-4 rounded-lg font-mono text-sm md:text-base print:break-inside-avoid shadow-inner relative border border-stone-800 group hover:z-30 transition-all"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                    <span 
                       className="inline-block prose prose-invert prose-sm max-w-none prose-p:my-0 relative"
                       dangerouslySetInnerHTML={{ __html: renderMarkdownWithTooltips(item, report.keyTerms) }} 
                    />
                  </li>
                ))}
              </ul>
            } 
          />
        )}

        {/* Real World Applications */}
        <ReportSection 
          title="Real World Context" 
          defaultOpen={true}
          rawTextForAudio={report.realWorldApplications}
          content={report.realWorldApplications}
          keyTerms={report.keyTerms}
        />

        {/* Summary */}
        <ReportSection 
          title="Chapter Synopsis" 
          defaultOpen={true}
          rawTextForAudio={report.summary}
          content={report.summary} 
          keyTerms={report.keyTerms}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-background dark:bg-primary animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors duration-300">
      
      {/* Universal Header Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-b border-stone-200 dark:border-stone-800 flex-shrink-0 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm z-30 relative">
        <button 
          onClick={onReset}
          className="text-stone-500 dark:text-stone-400 hover:text-primary dark:hover:text-white flex items-center gap-2 text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleJsonDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">JSON</span>
          </button>
          <button 
            onClick={handlePdfDownload}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-5 py-2 bg-primary dark:bg-stone-200 text-white dark:text-primary rounded-lg hover:bg-black dark:hover:bg-white text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isDownloadingPdf ? "Processing..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Mobile Tab Controls */}
      <div className="md:hidden flex bg-white dark:bg-stone-900 p-2 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20">
        <div className="flex w-full bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'report' ? 'bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <BookOpen size={16} />
            Report
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'chat' ? 'bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <MessageSquare size={16} />
            Tutor
          </button>
        </div>
      </div>

      {/* Layout Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden" ref={containerRef}>
        
        {/* DESKTOP: Split Pane */}
        <div className="hidden md:flex h-full">
           {/* Report Scroll Area */}
           <div 
             className="h-full overflow-y-auto custom-scrollbar px-6 py-6 md:px-10"
             style={{ width: `${100 - chatWidth}%` }}
           >
              <div className="max-w-4xl mx-auto">
                <ReportContent />
              </div>
           </div>
           
           {/* Resizer Handle */}
           <div 
            className="w-1 bg-stone-200 dark:bg-stone-800 hover:bg-accent cursor-col-resize flex items-center justify-center transition-colors group relative z-50"
            onMouseDown={startResizing}
           >
             <div className="absolute w-4 h-full bg-transparent"></div> {/* Wider hit area */}
             <div className="h-8 w-1 rounded-full bg-stone-400 dark:bg-stone-600 group-hover:bg-white transition-colors"></div>
           </div>

           {/* Chat Fixed Area */}
           <div 
             className="h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-xl dark:shadow-none z-40 relative"
             style={{ width: `${chatWidth}%` }}
           >
             {/* Overlay when resizing to prevent iframe events if there were any */}
             {isResizing && <div className="absolute inset-0 z-50 bg-transparent cursor-col-resize" />}
             <ChatInterface report={report} />
           </div>
        </div>

        {/* MOBILE: Tabbed Views */}
        <div className="md:hidden h-full overflow-y-auto">
           {activeTab === 'report' ? (
             <div className="p-4 pb-20">
                <ReportContent />
             </div>
           ) : (
             <div className="h-full flex flex-col">
               <ChatInterface report={report} />
             </div>
           )}
        </div>

      </div>
      
    </div>
  );
};

export default ReportView;
