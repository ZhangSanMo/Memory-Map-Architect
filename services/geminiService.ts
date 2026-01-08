
import { GoogleGenAI } from "@google/genai";

/**
 * Robust handling of the process global for browser-based compilation environments.
 */
declare global {
  interface Window {
    process: {
      env: {
        [key: string]: string | undefined;
      };
    };
  }
}

const getApiKey = (): string => {
  try {
    // Attempt to access process.env.API_KEY safely
    return (globalThis as any).process?.env?.API_KEY || '';
  } catch {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export class GeminiService {
  async suggestDescriptions(blockName: string, type: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional, technical one-sentence description for a memory region named "${blockName}" of type "${type}" in an embedded system memory map.`,
      });
      return response.text || "No description generated.";
    } catch (error) {
      console.error("AI Error:", error);
      return "Error generating description.";
    }
  }
}
