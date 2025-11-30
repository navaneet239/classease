import { GoogleGenAI, Type, Modality, Chat, Content } from "@google/genai";
import { ChapterReport } from "../types";

// Helper to encode file to base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- API Client ---

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Generation Logic ---

export const generateExplainerReport = async (
  subject: string,
  chapter: string,
  file: File | null
): Promise<ChapterReport> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash"; // Efficient for text processing

  const systemInstruction = `
   You are an expert CBSE Class 12 academic tutor specializing in helping students understand chapters clearly.
   
   Your task is to:
   1. Read and understand the provided material (or recall official CBSE syllabus context if no document is provided).
   2. Explain the chapter in clear, concise language suitable for a 17-18-year-old CBSE student.
   3. Preserve all key technical and syllabus-related terms exactly as they appear.
   4. Structure the explanation into logical sections.
   5. End with a short 100-word "Smart Summary" (teacherRecap) written as if a teacher is explaining aloud to the student.
   6. Provide a list of standard academic references or textbooks (e.g. NCERT) relevant to this chapter as citations.
   7. Use Markdown formatting for the content (bolding key terms, bullet points, etc.).
  `;

  // Define the JSON schema for the response
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      chapterTitle: { type: Type.STRING, description: "The title of the chapter being explained." },
      overview: { type: Type.STRING, description: "A high-level overview of the chapter." },
      keyTerms: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
        },
        description: "List of important definitions.",
      },
      conceptBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
        },
        description: "Detailed breakdown of key concepts.",
      },
      formulaeOrSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Important formulae, reaction equations, or procedural steps.",
      },
      realWorldApplications: { type: Type.STRING, description: "How this topic applies to real life." },
      summary: { type: Type.STRING, description: "A concise academic summary." },
      teacherRecap: { type: Type.STRING, description: "A conversational 100-word summary for audio narration." },
      citations: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 3-5 standard academic references, textbooks, or sources relevant to this topic (e.g., NCERT, Standard Reference Books)." 
      },
    },
    required: ["chapterTitle", "overview", "keyTerms", "conceptBreakdown", "formulaeOrSteps", "realWorldApplications", "summary", "teacherRecap", "citations"],
  };

  const promptText = `
    Subject: ${subject}
    Chapter: ${chapter}
    
    ${file ? "Please analyze the attached document." : "Please generate an explanation based on your knowledge of the CBSE syllabus."}
    
    Generate a comprehensive study report following the schema. Ensure all explanations are formatted in Markdown.
  `;

  const parts: any[] = [{ text: promptText }];
  
  if (file) {
    try {
      const filePart = await fileToPart(file);
      parts.unshift(filePart);
    } catch (e) {
      console.error("Error reading file", e);
      throw new Error("Failed to process the uploaded file.");
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");

    return JSON.parse(text) as ChapterReport;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

// --- TTS Logic ---

// Helper to decode base64 string to byte array
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to decode raw PCM to AudioBuffer
const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 PCM to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const generateAudioForText = async (text: string): Promise<AudioBuffer> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // Friendly, neutral voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const pcmBytes = decode(base64Audio);
    
    // Gemini TTS uses 24kHz sample rate for generated audio
    return await decodeAudioData(pcmBytes, audioContext, 24000);

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// --- Chat Logic ---

export interface ChatSession {
  sendMessage: (message: string) => Promise<string>;
}

export const createChatSession = (report: ChapterReport, history: Content[] = []): ChatSession => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash";

  const systemInstruction = `
    You are an intelligent tutor assistant. The student has just read a generated report on the chapter "${report.chapterTitle}".
    
    Here is the content of the report they received:
    ${JSON.stringify(report)}
    
    Your goal is to answer any follow-up questions, clarify doubts, or provide quiz questions if asked.
    Keep answers concise, encouraging, and academic.
    Use Markdown for formatting your responses.
  `;

  const chat: Chat = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction,
    },
    history: history,
  });

  return {
    sendMessage: async (message: string): Promise<string> => {
      try {
        const response = await chat.sendMessage({ message });
        return response.text || "I'm sorry, I couldn't generate a response.";
      } catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, I encountered an error while processing your request.";
      }
    }
  };
};