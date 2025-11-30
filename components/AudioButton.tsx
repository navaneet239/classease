import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Loader2, Volume2 } from 'lucide-react';
import { generateAudioForText } from '../services/geminiService';

interface AudioButtonProps {
  text: string;
  label?: string;
}

const AudioButton: React.FC<AudioButtonProps> = ({ text, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (!audioBufferRef.current) {
        audioBufferRef.current = await generateAudioForText(text);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePlay}
      disabled={isLoading}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border
        ${isPlaying 
          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-primary border-stone-900 dark:border-stone-100' 
          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Read aloud"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPlaying ? (
        <Square className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {label && <span className="text-xs font-medium tracking-wide">{isLoading ? "Loading..." : isPlaying ? "Stop" : label}</span>}
    </button>
  );
};

export default AudioButton;