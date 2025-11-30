import React, { useState, useRef } from 'react';
import { Upload, BookOpen, FileText, ArrowRight, X } from 'lucide-react';
import { FormData, InputMode } from '../types';

interface InputFormProps {
  onSubmit: (data: FormData) => void;
  isProcessing: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isProcessing }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.UPLOAD);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === InputMode.MANUAL && (!subject || !chapter)) return;
    if (mode === InputMode.UPLOAD && !file) return;

    const finalSubject = subject || (file ? "Document Analysis" : "General");
    const finalChapter = chapter || (file ? file.name.replace(/\.[^/.]+$/, "") : "Untitled Chapter");

    onSubmit({
      subject: finalSubject,
      chapterName: finalChapter,
      file,
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-surface dark:bg-stone-900 rounded-2xl shadow-premium dark:shadow-2xl border border-stone-100 dark:border-stone-800 p-1 md:p-2 transition-colors duration-300">
      {/* Toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-surface-highlight dark:bg-stone-800 rounded-xl mb-6 transition-colors duration-300">
        <button
          onClick={() => setMode(InputMode.UPLOAD)}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
            mode === InputMode.UPLOAD
              ? 'bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => setMode(InputMode.MANUAL)}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
            mode === InputMode.MANUAL
              ? 'bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === InputMode.UPLOAD ? (
            <div className="space-y-5">
              <div 
                className={`group relative border border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  file 
                    ? 'border-accent/50 bg-accent/5 dark:bg-accent/10' 
                    : 'border-stone-300 dark:border-stone-700 hover:border-primary dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.txt,.md,.docx"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-12 h-12 bg-white dark:bg-stone-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5 text-accent rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-primary dark:text-white font-medium">{file.name}</p>
                    <p className="text-xs text-stone-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 dark:hover:bg-stone-700 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-primary dark:text-stone-200 font-serif text-lg">Drop your chapter notes</p>
                    <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 font-light">Supports PDF, DOCX, Text</p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-stone-500 dark:text-stone-400 mb-2">Subject (Optional)</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 text-primary dark:text-stone-100 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-primary dark:focus:border-stone-500 focus:ring-1 focus:ring-primary dark:focus:ring-stone-500 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-stone-500 dark:text-stone-400 mb-2">Chapter (Optional)</label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="e.g. Optics"
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 text-primary dark:text-stone-100 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-primary dark:focus:border-stone-500 focus:ring-1 focus:ring-primary dark:focus:ring-stone-500 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-stone-500 dark:text-stone-400 mb-2">Subject</label>
                <input
                  type="text"
                  required={mode === InputMode.MANUAL}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Economics"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 text-primary dark:text-stone-100 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-primary dark:focus:border-stone-500 focus:ring-1 focus:ring-primary dark:focus:ring-stone-500 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-stone-500 dark:text-stone-400 mb-2">Chapter</label>
                <input
                  type="text"
                  required={mode === InputMode.MANUAL}
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Consumer Equilibrium"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 text-primary dark:text-stone-100 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-primary dark:focus:border-stone-500 focus:ring-1 focus:ring-primary dark:focus:ring-stone-500 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || (mode === InputMode.UPLOAD && !file) || (mode === InputMode.MANUAL && (!subject || !chapter))}
            className="w-full bg-primary hover:bg-black dark:bg-stone-200 dark:hover:bg-white text-white dark:text-primary py-4 rounded-xl shadow-lg shadow-stone-200 dark:shadow-none transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isProcessing ? (
              <span className="font-medium">Generating...</span>
            ) : (
              <>
                <span className="font-medium tracking-wide">Create Explainer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm;