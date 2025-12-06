import React, { useRef, useState, useEffect } from 'react';
import { ChapterReport, FormData, KeyTerm } from '../types';
import ReportSection from './ReportSection';
import ChatInterface from './ChatInterface';
import { Download, ArrowLeft, FileText, Loader2, Bookmark, MessageSquare, BookOpen, Book, Sparkles, ExternalLink } from 'lucide-react';
import AudioButton from './AudioButton';
import { renderMarkdownWithTooltips } from '../utils/textUtils';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from './PDFDocument';

interface ReportViewProps {
  report: ChapterReport;
  inputData: FormData;
  onReset: () => void;
}

type Tab = 'report' | 'chat';

const ReportView: React.FC<ReportViewProps> = ({ report, inputData, onReset }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('report');
  
  // Resizable state
  const [chatWidth, setChatWidth] = useState(35); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Text Selection State
  const [selectedText, setSelectedText] = useState('');
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [isPopupVisible, setIsPopupVisible] = useState(false);

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

  // Selection Logic
  const handleMouseUp = () => {
    const selection = window.getSelection();
    
    // Only proceed if selection exists and is not empty
    if (!selection || selection.toString().trim().length === 0) {
      return;
    }

    // Get selection text
    const text = selection.toString().trim();
    if (text.length < 3) {
      setIsPopupVisible(false);
      return; 
    }
    
    // Check range count to be safe
    if (selection.rangeCount === 0) return;

    // Calculate position
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    
    // Use the FIRST line rect for positioning to avoid "middle of paragraph" issues
    if (rects.length > 0) {
      const firstRect = rects[0];
      setPopupPos({ 
        x: firstRect.left + (firstRect.width / 2), 
        y: firstRect.top - 8 
      });
      setSelectedText(text);
      setIsPopupVisible(true);
    } else {
        const rect = range.getBoundingClientRect();
        setPopupPos({ 
            x: rect.left + (rect.width / 2), 
            y: rect.top - 10 
        });
        setSelectedText(text);
        setIsPopupVisible(true);
    }
  };

  // Handle auto-hiding popup when selection is cleared by user
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setIsPopupVisible(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleAskTutor = () => {
    if (!selectedText) return;
    
    const query = `Teach me "${selectedText}"`;
    
    // 1. Store the query in LocalStorage
    localStorage.setItem('classease_pending_query', query);
    
    // 2. Dispatch a custom event to notify ChatInterface
    window.dispatchEvent(new Event('classease-chat-trigger'));
    
    // 3. Switch to chat tab if on mobile
    if (!isDesktop) {
        setActiveTab('chat');
    }
    
    // 4. Clear selection UI
    setIsPopupVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  // Listen to mouse events for resizing
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
    setIsDownloadingPdf(true);
    try {
      // Use @react-pdf/renderer to create a blob
      const blob = await pdf(<PDFDocument report={report} inputData={inputData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.chapterTitle.replace(/\s+/g, '_')}_Explainer.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
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

  // Content for the report
  const ReportContent = () => (
    <div id="report-content" className="space-y-8 pb-10" onMouseUp={handleMouseUp}>
      
      {/* Editorial Title Card */}
      <div className="relative bg-primary dark:bg-stone-900 rounded-2xl shadow-2xl shadow-stone-300 dark:shadow-none print:shadow-none print:break-inside-avoid group">
        
        {/* Isolated Background Container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none no-print">
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-stone-800 dark:bg-black rounded-full blur-3xl opacity-50"></div>
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </div>

        {/* Content Container (Visible Overflow for Tooltips) */}
        <div className="relative z-10 p-6 md:p-10 max-w-3xl">
          <div className="flex items-center gap-3 text-stone-300 mb-4 text-xs font-bold uppercase tracking-[0.2em]">
            <span className="w-8 h-[1px] bg-accent"></span>
            {inputData.subject}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight tracking-tight text-white">{report.chapterTitle}</h1>
          {renderMarkdown(
            report.overview, 
            "text-stone-300 text-base md:text-lg leading-relaxed prose prose-invert prose-p:text-stone-300/90 prose-strong:text-white prose-headings:text-white font-body",
            report.keyTerms
          )}
        </div>
      </div>

      {/* Smart Summary */}
      <div className="bg-white dark:bg-stone-900 border-l-4 border-accent rounded-r-xl p-6 md:p-8 shadow-premium dark:shadow-none print:break-inside-avoid relative z-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl text-primary dark:text-stone-100 flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-accent fill-current" />
            Teacher's Insight
          </h2>
          <div className="no-print">
            <AudioButton text={report.teacherRecap} label="Listen" />
          </div>
        </div>
        {renderMarkdown(
          report.teacherRecap,
          "text-stone-700 dark:text-stone-400 italic text-lg leading-relaxed prose prose-stone dark:prose-invert max-w-none font-serif leading-8",
          report.keyTerms
        )}
      </div>

      <div className="space-y-6 relative z-10">
        {/* Key Terms */}
        <ReportSection 
          title="Lexicon & Definitions" 
          defaultOpen={true}
          content={
            <div className="grid grid-cols-1 gap-4">
              {report.keyTerms.map((term, idx) => (
                <div key={idx} className="bg-surface-highlight dark:bg-stone-800/50 p-5 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-colors print:break-inside-avoid relative hover:z-20">
                  <span className="block font-serif font-bold text-lg text-primary dark:text-stone-100 mb-2 border-b border-stone-200 dark:border-stone-700 pb-2 inline-block">{term.term}</span>
                  <div 
                    className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm prose prose-sm dark:prose-invert max-w-none font-body"
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
                    <div className="no-print">
                      <AudioButton text={`${concept.title}. ${concept.explanation}`} label="Read" />
                    </div>
                  </div>
                  <div className="text-stone-600 dark:text-stone-400 leading-relaxed pl-10 border-l border-stone-200 dark:border-stone-700 group-hover:border-accent transition-colors duration-500">
                    <ReportSection 
                        title="" 
                        content={concept.explanation} 
                        defaultOpen={true} 
                        keyTerms={report.keyTerms}
                        contentClassName="leading-[1.75] dark:text-stone-400 font-body"
                    />
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
                    className="bg-stone-900 dark:bg-stone-950 text-stone-300 rounded-lg font-mono text-sm md:text-base print:break-inside-avoid shadow-inner relative border border-stone-800 group hover:z-30 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent z-10"></div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="font-mono whitespace-pre-wrap leading-relaxed">
                        <span 
                           className="inline-block relative"
                           dangerouslySetInnerHTML={{ __html: renderMarkdownWithTooltips(item, report.keyTerms) }} 
                        />
                      </pre>
                    </div>
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
          contentClassName="font-body"
        />

        {/* Summary */}
        <ReportSection 
          title="Chapter Synopsis" 
          defaultOpen={true}
          rawTextForAudio={report.summary}
          content={report.summary} 
          keyTerms={report.keyTerms}
          contentClassName="font-body"
        />

        {/* Citations - Overhauled */}
        {report.citations && report.citations.length > 0 && (
          <div className="mt-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 print:break-inside-avoid">
             {/* Header */}
             <div className="bg-stone-50 dark:bg-stone-800/50 px-8 py-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
               <h3 className="font-serif font-bold text-xl text-primary dark:text-stone-100 flex items-center gap-3">
                 <BookOpen className="w-5 h-5 text-accent" />
                 References & Sources
               </h3>
               <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  {report.citations.length} Citations
               </span>
             </div>
             
             {/* List */}
             <div className="p-8">
               <ul className="space-y-6">
                 {report.citations.map((cite, idx) => (
                   <li key={idx} className="flex gap-4 group">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center font-serif font-bold text-sm group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                       {idx + 1}
                     </div>
                     <div className="flex-1 pt-1 border-b border-stone-100 dark:border-stone-800 pb-6 group-last:border-none group-last:pb-0">
                       <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm md:text-base group-hover:text-primary dark:group-hover:text-white transition-colors mb-2">
                         {cite}
                       </p>
                       <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(cite)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                       >
                         <span>View Source</span>
                         <ExternalLink className="w-3 h-3" />
                       </a>
                     </div>
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-background dark:bg-primary animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors duration-300">
      
      {/* Ask AI Tutor Popup */}
      {isPopupVisible && (
        <button
          onClick={handleAskTutor}
          onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus
          style={{
            position: 'fixed',
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-[9999] flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full shadow-xl hover:scale-105 transition-transform animate-in fade-in zoom-in duration-200 border border-stone-700 dark:border-stone-200"
        >
          <Sparkles className="w-4 h-4 fill-current text-accent" />
          <span className="text-xs font-bold tracking-wide">Ask AI Tutor</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-stone-900 dark:border-t-white"></div>
        </button>
      )}

      {/* Header */}
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

      {/* Mobile Tabs */}
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

      {/* Unified Main Content Container */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-row" ref={containerRef}>
        
        {/* REPORT PANE */}
        <div 
          className={`
            h-full overflow-y-auto custom-scrollbar px-6 py-6 md:px-10 transition-all duration-75
            ${activeTab === 'report' ? 'block' : 'hidden'} md:block
            overflow-x-hidden
          `}
          style={{ width: isDesktop ? `${100 - chatWidth}%` : '100%' }}
        >
            <div className="max-w-4xl mx-auto">
              <ReportContent />
            </div>
        </div>

        {/* RESIZER (Desktop) */}
        <div 
            className="hidden md:flex w-1 bg-stone-200 dark:bg-stone-800 hover:bg-accent cursor-col-resize items-center justify-center transition-colors group relative z-50"
            onMouseDown={startResizing}
        >
            <div className="absolute w-4 h-full bg-transparent"></div>
            <div className="h-8 w-1 rounded-full bg-stone-400 dark:bg-stone-600 group-hover:bg-white transition-colors"></div>
        </div>

        {/* CHAT PANE */}
        <div 
            className={`
                h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-xl dark:shadow-none z-40 relative
                ${activeTab === 'chat' ? 'block' : 'hidden'} md:block
            `}
            style={{ width: isDesktop ? `${chatWidth}%` : '100%' }}
        >
            {isResizing && <div className="absolute inset-0 z-50 bg-transparent cursor-col-resize" />}
            {/* SINGLE INSTANCE - No ref needed for sending now */}
            <ChatInterface report={report} />
        </div>

      </div>
      
    </div>
  );
};

export default ReportView;