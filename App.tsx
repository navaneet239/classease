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
              <span className="font-serif font-bold text-xl tracking-tight leading-none text-primary dark:text-white">ClassEase AI</span>
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
             <nav className="hidden md:flex items-center gap-1 text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400">
                <a href="#pricing" className="font-serif relative px-3 py-1.5 rounded-md hover:text-primary dark:hover:text-white transition-colors after:content-[''] after:absolute after:left-1/2 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-primary dark:after:bg-white after:transition-all after:duration-300 hover:after:w-1/2 hover:after:left-1/4">Pricing</a>
                <span className="text-stone-300 dark:text-stone-600 select-none">•</span>
                <a href="#get-started" className="font-serif relative px-3 py-1.5 rounded-md hover:text-primary dark:hover:text-white transition-colors after:content-[''] after:absolute after:left-1/2 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-primary dark:after:bg-white after:transition-all after:duration-300 hover:after:w-1/2 hover:after:left-1/4">Get Started</a>
             </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${status === AppStatus.COMPLETE ? 'overflow-hidden' : 'overflow-y-auto scroll-smooth'}`}>
        
        {/* IDLE STATE: Homepage */}
        {status === AppStatus.IDLE && (
          <div className="w-full max-w-6xl mx-auto px-6 pt-12 md:pt-24 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Hero Section */}
            <div className="text-center mb-16 max-w-4xl mx-auto" id="hero">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold text-stone-500 dark:text-stone-400 mb-8 animate-in fade-in zoom-in delay-150 duration-700">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                    <span>New: Keywords ToolTips</span>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest mb-1">Made By Students • Made for students</p>
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-primary dark:text-white mb-8 leading-[1.1] tracking-tight">
                  Turn textbooks into <br/>
                  <span className="text-stone-400 dark:text-stone-500 italic">interactive insights.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-light max-w-2xl mx-auto leading-relaxed mb-12">
                  Get structured breakdowns, key formulas, and an always-available AI tutor, tailored for the educational curriculum.
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
            <div className="text-center mb-10 pt-12">
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-primary dark:text-white mb-8 leading-[1.1] tracking-tight">
                    Features
                </h2>
                <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-light max-w-2xl mx-auto leading-relaxed">
                    Empower your learning with our suite of tools designed to make understanding complex topics easier than ever.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
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



            {/* Pricing Section */}
            <section id="pricing" className="w-full max-w-6xl mx-auto px-6 pt-20 pb-12 scroll-mt-20">
              <div className="text-center mb-12">
                <p className="text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest mb-2">Transparent & Flexible</p>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-primary dark:text-white mb-4">Choose Your Plan</h2>
                <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">Unlock deeper insights and limitless learning—upgrade when you're ready.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Tier */}
                <div className="relative p-8 flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg hover:shadow-xl dark:hover:shadow-none transition-shadow duration-300">
                  <div className="absolute -top-4 left-8 px-4 py-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">Current</div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-serif text-primary dark:text-white mb-2">Starter</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-primary dark:text-white">Free</span>
                      <span className="text-sm text-stone-400 dark:text-stone-500">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-stone-600 dark:text-stone-400 flex-1">
                    <li className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>5 chapter analyses per month</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Headphones className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Standard AI narration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Community support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Library className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Basic keyword tooltips</span>
                    </li>
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-primary dark:text-white font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors" disabled>
                    Current Plan
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="relative p-8 flex flex-col rounded-3xl bg-gradient-to-br from-primary to-accent text-white shadow-2xl hover:shadow-accent/30 dark:hover:shadow-none transition-shadow duration-300">
                  <div className="absolute border -top-4 left-8 px-4 py-1 bg-accent/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">Popular</div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-serif mb-2">Pro</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">$9</span>
                      <span className="text-sm opacity-80">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm flex-1">
                    <li className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                      <span>Unlimited chapter analyses</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Headphones className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                      <span>Premium neural voices + multi-language</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <BrainCircuit className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                      <span>Advanced concept maps & quizzes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                      <span>Priority chat support + tutor mode</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Library className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                      <span>Export notes to PDF & Anki flashcards</span>
                    </li>
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-white text-primary font-semibold hover:bg-stone-100 transition-colors shadow-lg">
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              <div className="text-center mt-10">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Cancel anytime. Secure payment.
                </p>
              </div>
            </section>

            {/* CTA Section */}
            <section id="get-started" className=" border border-stone-100 dark:border-stone-800 w-full max-w-6xl mx-auto px-6 pt-20 pb-12 scroll-mt-20 bg-primary rounded-3xl">
              <div className="text-center mb-4">
                <p className="text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest mb-2">Ready to Learn Smarter?</p>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-white mb-4">Get Started in Seconds</h2>
                <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">Upload your first chapter and experience the future of studying, free forever on the Starter plan.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative inline-flex items-center justify-center px-10 py-4 text-white font-semibold tracking-wide rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ease-out bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] hover:bg-right hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative z-10">Upload Chapter Now</span>
                  <span className="ml-3 w-0 group-hover:w-5 overflow-hidden transition-all duration-300 ease-out">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
                <p className="text-sm text-stone-400 dark:text-stone-500">No credit card required • Instant results</p>
              </div>
            </section>
            
            {/* Footer */}
            <div className="mt-20 text-center">
            {/* Copyright Notice */}
                <p className="text-xs text-stone-400 dark:text-stone-600 font-medium uppercase tracking-widest text-center">© 2024 ClassEase AI. All rights reserved.</p>
          
                <div className="flex flex-col mt-6">
                  <span className="font-serif font-bold text-xl tracking-tight leading-none text-primary dark:text-white">ClassEase AI</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium hidden md:block mt-1">Academic Intelligence</span>
                </div>
            </div></div>
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