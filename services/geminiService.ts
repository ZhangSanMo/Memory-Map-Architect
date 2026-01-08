
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async suggestDescriptions(blockName: string, type: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional, technical one-sentence description for a memory region named "${blockName}" of type "${type}" in an embedded system memory map.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text?.trim() || "No description generated.";
    } catch (error) {
      console.error("AI Error:", error);
      return "Error generating description.";
    }
  }
}
