import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Send, User, Sparkles, Loader2, Bot, Trash2, Copy, RefreshCw, Pencil } from 'lucide-react';
import { ChapterReport } from '../types';
import { createChatSession, ChatSession } from '../services/geminiService';
import { parse } from 'marked';
import { Content } from '@google/genai';

interface ChatInterfaceProps {
  report: ChapterReport;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface ChatInterfaceHandle {
  setInput: (text: string) => void;
  sendQuery: (text: string) => void;
  focus: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ report }, ref) => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Internal helper to handle the actual sending logic
  const processMessage = async (text: string) => {
    // If we receive a message but session isn't ready, we might need to queue it or retry.
    // However, usually session is ready quickly. 
    if (!text.trim() || !chatSession || isLoading) return;

    const userMsg = text.trim();
    setInputValue(''); // Clear input if it matches
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage(userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setInput: (text: string) => {
      setInputValue(text);
    },
    sendQuery: (text: string) => {
      processMessage(text);
    },
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  // Initialize Chat
  useEffect(() => {
    initChat([]);
  }, [report]);

  const initChat = (history: Message[]) => {
    // Convert local messages to Gemini Content format
    const geminiHistory: Content[] = history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    
    const session = createChatSession(report, geminiHistory);
    setChatSession(session);
    setMessages(history);
  };

  // LISTENER FOR ASK TUTOR POPUP
  useEffect(() => {
    const checkForPendingQuery = () => {
      const pendingQuery = localStorage.getItem('classease_pending_query');
      if (pendingQuery && chatSession && !isLoading) {
        // Clear immediately to prevent double processing
        localStorage.removeItem('classease_pending_query');
        processMessage(pendingQuery);
      }
    };

    // Check immediately (useful if component just mounted due to tab switch)
    checkForPendingQuery();

    // Listen for custom trigger from ReportView
    const handleTrigger = () => checkForPendingQuery();
    window.addEventListener('classease-chat-trigger', handleTrigger);

    return () => {
      window.removeEventListener('classease-chat-trigger', handleTrigger);
    };
  }, [chatSession, isLoading]); // Dependency on chatSession ensures we process it once session is ready

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, editingIndex]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(inputValue);
  };

  // --- Advanced Features ---

  const handleClearChat = () => {
    if (window.confirm("Clear conversation history?")) {
      initChat([]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;
    
    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    
    if (lastUserIndex === -1) return;

    const lastUserMsg = messages[lastUserIndex].content;
    
    // Reconstruct history UP TO the last user message (exclusive)
    const historyToKeep = messages.slice(0, lastUserIndex);
    
    // Reset UI to this state + waiting
    setMessages([...historyToKeep, { role: 'user', content: lastUserMsg }]);
    setIsLoading(true);

    // Re-init session with truncated history
    const geminiHistory: Content[] = historyToKeep.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    const newSession = createChatSession(report, geminiHistory);
    setChatSession(newSession);

    try {
      const response = await newSession.sendMessage(lastUserMsg);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
       console.error("Regenerate failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditValue(content);
  };

  const submitEdit = async () => {
    if (editingIndex === null) return;
    
    const newContent = editValue.trim();
    if (!newContent) return cancelEdit();

    // History is everything BEFORE this message
    const historyToKeep = messages.slice(0, editingIndex);
    
    setEditingIndex(null);
    setEditValue('');
    setMessages([...historyToKeep, { role: 'user', content: newContent }]);
    setIsLoading(true);

    // Re-init session
    const geminiHistory: Content[] = historyToKeep.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    const newSession = createChatSession(report, geminiHistory);
    setChatSession(newSession);

    try {
      const response = await newSession.sendMessage(newContent);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
       console.error("Edit submit failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white/95 dark:bg-stone-900/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-md text-primary dark:text-stone-100">
                <Sparkles size={16} />
            </div>
            <div>
                <h3 className="font-serif font-bold text-primary dark:text-white leading-tight">AI Tutor</h3>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-widest uppercase">Assistant</p>
            </div>
        </div>
        <button 
            onClick={handleClearChat}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Clear Chat"
        >
            <Trash2 size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scroll-smooth custom-scrollbar">
        
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-stone-300 dark:text-stone-600 p-8">
                <Bot size={48} strokeWidth={1} className="mb-4 text-stone-200 dark:text-stone-700" />
                <p className="text-sm font-medium text-stone-400 dark:text-stone-500">Ask me anything about the chapter.</p>
                <p className="text-xs mt-2 text-stone-300 dark:text-stone-600 max-w-xs">I can explain concepts, quiz you, or help you solve problems.</p>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className="group flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 w-full"
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-primary dark:bg-stone-100 text-white dark:text-primary' : 'bg-accent/10 text-accent'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
            </div>
            
            {/* Content Area - Full Width, No Box */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-primary dark:text-white' : 'text-accent'}`}>
                        {msg.role === 'user' ? 'You' : 'ClassEase AI'}
                    </span>
                    
                    {/* Actions Toolbar */}
                    {!isLoading && editingIndex !== idx && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {msg.role === 'model' && (
                                <>
                                    <button onClick={() => handleCopy(msg.content)} className="p-1 text-stone-300 dark:text-stone-600 hover:text-primary dark:hover:text-stone-200 rounded transition-colors" title="Copy">
                                        <Copy size={12} />
                                    </button>
                                    {idx === messages.length - 1 && (
                                        <button onClick={handleRegenerate} className="p-1 text-stone-300 dark:text-stone-600 hover:text-primary dark:hover:text-stone-200 rounded transition-colors" title="Regenerate">
                                            <RefreshCw size={12} />
                                        </button>
                                    )}
                                </>
                            )}
                            {msg.role === 'user' && (
                                <button onClick={() => startEdit(idx, msg.content)} className="p-1 text-stone-300 dark:text-stone-600 hover:text-primary dark:hover:text-stone-200 rounded transition-colors" title="Edit">
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {editingIndex === idx ? (
                    <div className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-3 shadow-sm mt-2">
                        <textarea 
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full text-sm bg-transparent outline-none resize-none mb-2 text-primary dark:text-white"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={cancelEdit} className="px-2 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded">
                                Cancel
                            </button>
                            <button onClick={submitEdit} className="px-3 py-1 text-xs font-medium bg-primary dark:bg-stone-100 text-white dark:text-primary rounded hover:bg-stone-800 dark:hover:bg-white">
                                Save & Submit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-stone-700 dark:text-stone-300 text-[15px] leading-relaxed">
                        <div 
                            className={`prose prose-sm dark:prose-invert max-w-none prose-p:text-stone-700 dark:prose-p:text-stone-300 prose-headings:text-primary dark:prose-headings:text-white prose-strong:text-primary dark:prose-strong:text-white prose-a:text-accent prose-code:text-accent prose-code:bg-stone-50 dark:prose-code:bg-stone-800 prose-code:px-1 prose-code:rounded prose-pre:bg-stone-900 prose-pre:text-stone-50`} 
                            dangerouslySetInnerHTML={{ __html: parse(msg.content) as string }} 
                        />
                    </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
           <div className="flex items-start gap-4 animate-pulse">
             <div className="w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-1">
               <Bot size={16} />
             </div>
             <div className="flex-1">
                 <span className="text-xs font-bold uppercase tracking-wider text-accent mb-1 block">ClassEase AI</span>
                 <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                 </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 z-10 transition-colors duration-300">
        <form onSubmit={handleSendMessage} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isLoading ? "AI is typing..." : "Ask a follow-up question..."}
                className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-5 py-4 pr-14 focus:ring-1 focus:ring-stone-200 dark:focus:ring-stone-700 focus:bg-stone-100 dark:focus:bg-stone-700 transition-all text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                disabled={isLoading}
            />
            <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-primary rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none shadow-sm"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
        <div className="text-center mt-2">
            <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-widest font-medium">AI generated content may be inaccurate</p>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;