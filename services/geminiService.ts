import { GoogleGenAI } from "@google/genai";
import { Tone, OutputFormat } from "../types";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT_ENGINEER_SYSTEM_INSTRUCTION = `
You are PromptMaster, an elite prompt engineering assistant. 
Your goal is to take user intent and transform it into a highly effective, structured prompt optimized for Large Language Models (LLMs).
Use techniques like Chain-of-Thought, Delimiters, and Persona adoption where appropriate.
Return ONLY the optimized prompt text. Do not add conversational filler.
`;

const PROMPT_REFINER_SYSTEM_INSTRUCTION = `
You are an expert editor and logic refiner for AI prompts.
Your task is to rewrite the given prompt based on a specific transformation goal.
Maintain the original intent but improve clarity, structure, and effectiveness.
Return ONLY the refined prompt text.
`;

export interface GenerationResult {
  text: string;
  groundingChunks?: any[];
}

export const generateSmartPrompt = async (
  task: string,
  context: string,
  tone: Tone,
  format: OutputFormat,
  modelName: string = 'gemini-3-pro-preview',
  useSearch: boolean = false
): Promise<GenerationResult> => {
  const userPrompt = `
    Please construct a high-quality prompt for the following request:
    
    **Core Task:** ${task}
    **Context/Background:** ${context || "None provided"}
    **Desired Tone:** ${tone}
    **Output Format:** ${format}
    
    The resulting prompt should be ready to copy-paste into an LLM.
  `;

  try {
    const config: any = {
      systemInstruction: PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    };

    // Apply Thinking Config for Gemini 3 Pro
    if (modelName === 'gemini-3-pro-preview') {
      config.thinkingConfig = { thinkingBudget: 32768 };
      // Temperature is often incompatible or less relevant with thinking models
      delete config.temperature; 
    }

    // Apply Search Grounding
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
      // Search often requires a slightly lower temp for factual accuracy, 
      // but if we are in thinking mode (Pro), we might skip this override.
      // However, typical search usage is with Flash 2.5 per guidelines.
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config,
    });

    if (response.text) {
      return {
        text: response.text,
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    }
    throw new Error("No text returned from model.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate prompt. Please check your connection.");
  }
};

/**
 * Refines an existing prompt based on a specific instruction.
 */
export const refineExistingPrompt = async (
  prompt: string,
  instruction: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> => {
  const userContent = `
    **Transformation Goal:** ${instruction}
    
    **Input Prompt:**
    ${prompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userContent,
      config: {
        systemInstruction: PROMPT_REFINER_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    if (response.text) {
      return response.text;
    }
    throw new Error("No text returned from model.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to refine prompt. Please check your connection.");
  }
};

/**
 * Generates a cute mascot image using Gemini 2.5 Flash Image
 */
export const generateMascotImage = async (): Promise<string> => {
  try {
    // We delegate this to the server route to handle the API key and request safely
    // The server/adapters/geminiAdapter.ts will handle the actual generateContent call with image model
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-image',
        data: {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate mascot');
    }

    const data = await response.json();
    return data.result; // Expecting base64 string
  } catch (error) {
    console.error("Mascot Generation Error:", error);
    throw error;
  }
};