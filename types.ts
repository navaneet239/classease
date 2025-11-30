export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export enum InputMode {
  UPLOAD = 'UPLOAD',
  MANUAL = 'MANUAL',
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Concept {
  title: string;
  explanation: string;
}

// The structure we expect from Gemini
export interface ChapterReport {
  chapterTitle: string;
  overview: string;
  keyTerms: KeyTerm[];
  conceptBreakdown: Concept[];
  formulaeOrSteps: string[];
  realWorldApplications: string;
  summary: string;
  teacherRecap: string; // The 100-word smart summary
}

export interface FormData {
  subject: string;
  chapterName: string;
  file: File | null;
}
