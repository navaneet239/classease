import React, { useState, useEffect } from 'react';
import { Sparkles, GraduationCap, FileSearch, BrainCircuit, PenTool, Zap, Headphones, MessageCircle, Library, Sun, Moon } from 'lucide-react';
import InputForm from './components/InputForm';
import ReportView from './components/ReportView';
import { AppStatus, ChapterReport, FormData } from './types';
import { generateExplainerReport } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [inputData, setInputData] = useState<FormData | null>(null);
  const [report, setReport] = useState<ChapterReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark Mode Initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Loading state management
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    { text: "Deconstructing chapter architecture...", icon: FileSearch },
    { text: "Synthesizing key academic concepts...", icon: BrainCircuit },
    { text: "Generating teacher's insights...", icon: Sparkles },
    { text: "Finalizing your study guide...", icon: PenTool },
  ];

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.GENERATING) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2500); 
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleFormSubmit = async (data: FormData) => {
    setInputData(data);
    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      const result = await generateExplainerReport(data.subject, data.chapterName, data.file);
      setReport(result);
      setStatus(AppStatus.COMPLETE);
    } catch (err) {
      console.error(err);
      setError("Unable to generate report. Please verify your connection or try a different file.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setInputData(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="h-screen flex flex-col font-sans text-primary dark:text-stone-100 selection:bg-accent/20 selection:text-primary overflow-hidden bg-background dark:bg-primary transition-colors duration-300">
      {/* Navbar */}
      <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100 dark:border-stone-800 flex-shrink-0 transition-colors duration-300">
        <div className="w-full max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleReset}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary dark:bg-stone-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-stone-200 dark:shadow-none transition-transform group-hover:scale-105">
              <GraduationCap strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl tracking-tight leading-none text-primary dark:text-white">ClassEase</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium hidden md:block mt-1">Academic Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
              aria-label="Toggle Dark Mode"
             >
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Powered by Gemini 2.5</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${status === AppStatus.COMPLETE ? 'overflow-hidden' : 'overflow-y-auto scroll-smooth'}`}>
        
        {/* IDLE STATE: Homepage */}
        {status === AppStatus.IDLE && (
          <div className="w-full max-w-6xl mx-auto px-6 pt-12 md:pt-24 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Hero Section */}
            <div className="text-center mb-16 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold text-stone-500 dark:text-stone-400 mb-8 animate-in fade-in zoom-in delay-150 duration-700">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                    <span>New: Intelligent Audio Summaries</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-primary dark:text-white mb-8 leading-[1.1] tracking-tight">
                  Turn textbooks into <br/>
                  <span className="text-stone-400 dark:text-stone-500 italic">interactive insights.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-light max-w-2xl mx-auto leading-relaxed mb-12">
                  Upload chapters or notes. Get structured breakdowns, key formulas, and an always-available AI tutor—tailored for the CBSE curriculum.
                </p>
                
                {/* Input Form Floating Card */}
                <div className="w-full max-w-xl mx-auto relative z-10">
                    <InputForm onSubmit={handleFormSubmit} isProcessing={false} />
                    {/* Decorative Blurs */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-stone-200/50 dark:bg-stone-800/30 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply dark:mix-blend-normal"></div>
                    <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply dark:mix-blend-normal"></div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-stone-100 dark:border-stone-800">
                <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-premium dark:hover:shadow-none hover:border-stone-200 dark:hover:border-stone-700 transition-all duration-300 group cursor-default">
                    <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 text-primary dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-stone-100 dark:border-stone-700">
                        <Zap className="w-6 h-6 stroke-1" />
                    </div>
                    <h3 className="font-serif text-xl mb-3 text-primary dark:text-stone-100">Instant Analysis</h3>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-sm">
                        Converts complex PDFs into crystal-clear breakdowns with definitions, formulas, and structured notes.
                    </p>
                </div>
                
                <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-premium dark:hover:shadow-none hover:border-stone-200 dark:hover:border-stone-700 transition-all duration-300 group cursor-default">
                    <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 text-primary dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-stone-100 dark:border-stone-700">
                        <Headphones className="w-6 h-6 stroke-1" />
                    </div>
                    <h3 className="font-serif text-xl mb-3 text-primary dark:text-stone-100">Audio Learning</h3>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-sm">
                        Listen to chapter summaries and concepts on the go with natural-sounding, neural AI narration.
                    </p>
                </div>

                <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-premium dark:hover:shadow-none hover:border-stone-200 dark:hover:border-stone-700 transition-all duration-300 group cursor-default">
                    <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 text-primary dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-stone-100 dark:border-stone-700">
                        <MessageCircle className="w-6 h-6 stroke-1" />
                    </div>
                    <h3 className="font-serif text-xl mb-3 text-primary dark:text-stone-100">Personal Tutor</h3>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-sm">
                        Chat directly with your documents. Ask for examples, quiz yourself, or clarify doubts instantly.
                    </p>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-20 text-center">
                <p className="text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest">Made By Students • Made for students</p>
            </div>
          </div>
        )}

        {/* GENERATING STATE */}
        {status === AppStatus.GENERATING && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] w-full animate-in fade-in duration-700">
              <div className="relative mb-16">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
                <div className="w-24 h-24 border-t-2 border-primary dark:border-white border-r-2 border-r-transparent rounded-full animate-spin relative z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  {React.createElement(loadingMessages[loadingStep].icon, { className: "w-8 h-8 text-primary dark:text-white" })}
                </div>
              </div>
              
              <div className="text-center space-y-4 max-w-md mx-auto px-6">
                <h3 className="text-3xl font-serif text-primary dark:text-white transition-all duration-500 min-h-[2.5rem]">
                  {loadingMessages[loadingStep].text}
                </h3>
                <p className="text-stone-400 dark:text-stone-500 text-xs font-bold tracking-[0.2em] uppercase">Processing Chapter</p>
              </div>
              
              <div className="flex gap-3 mt-12">
                {loadingMessages.map((_, idx) => (
                  <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    idx <= loadingStep ? 'w-16 bg-primary dark:bg-white' : 'w-4 bg-stone-200 dark:bg-stone-800'
                  }`} 
                  />
                ))}
              </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === AppStatus.ERROR && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6">
              <div className="bg-white dark:bg-stone-900 border border-red-100 dark:border-red-900/30 rounded-3xl p-12 text-center max-w-lg shadow-premium dark:shadow-none">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-serif">!</span>
                </div>
                <h3 className="text-primary dark:text-white font-serif font-bold text-3xl mb-3">Generation Paused</h3>
                <p className="text-stone-500 dark:text-stone-400 mb-10 leading-relaxed text-lg">{error}</p>
                <button 
                onClick={handleReset}
                className="px-8 py-4 bg-primary dark:bg-stone-800 text-white font-medium rounded-xl hover:bg-black dark:hover:bg-stone-700 transition-all shadow-lg shadow-stone-200 dark:shadow-none hover:shadow-xl hover:-translate-y-1"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
        )}

        {/* REPORT VIEW (COMPLETE) */}
        {status === AppStatus.COMPLETE && report && inputData && (
          <ReportView report={report} inputData={inputData} onReset={handleReset} />
        )}

      </main>
    </div>
  );
};

export default App;