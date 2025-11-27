
import { GoogleGenAI } from "@google/genai";

// Initialize the client strictly on the server side
// Ensure process.env.API_KEY is set in your server environment
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

export const generateSmartPrompt = async (
  task: string,
  context: string,
  tone: string,
  format: string,
  modelName: string = 'gemini-3-pro-preview'
) => {
  const userPrompt = `
    Please construct a high-quality prompt for the following request:
    
    **Core Task:** ${task}
    **Context/Background:** ${context || "None provided"}
    **Desired Tone:** ${tone}
    **Output Format:** ${format}
    
    The resulting prompt should be ready to copy-paste into an LLM.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction: PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
};

export const refineExistingPrompt = async (
  prompt: string,
  actionInstruction: string,
  modelName: string = 'gemini-2.5-flash'
) => {
  const userContent = `
    **Action:** ${actionInstruction}
    
    **Input Prompt:**
    ${prompt}
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: userContent,
    config: {
      systemInstruction: PROMPT_REFINER_SYSTEM_INSTRUCTION,
      temperature: 0.3,
    },
  });

  return response.text;
};

export const generateImage = async () => {
  // Using gemini-2.5-flash-image ("nano banana") per guidelines for general image tasks
  const prompt = "A cute, friendly, 3D-rendered robot mascot for an AI writing app. The robot is small, round, floating, and holds a glowing digital pen. The style is minimalist, clean, vibrant, Pixar-like. White background.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      // responseMimeType is NOT supported for image generation models
    }
  });

  // Extract base64 image data
  // The SDK might return parts with inlineData
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data; // Base64 string
    }
  }
  
  throw new Error("No image data returned from model");
};
