
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
// Following the guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  async suggestDescriptions(blockName: string, type: string): Promise<string> {
    try {
      // Using the recommended ai.models.generateContent method to query GenAI.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional, technical one-sentence description for a memory region named "${blockName}" of type "${type}" in an embedded system memory map.`,
      });
      // Extracting text directly from the response object's .text property as per the latest SDK.
      return response.text || "No description generated.";
    } catch (error) {
      console.error("AI Error:", error);
      return "Error generating description.";
    }
  }
}
