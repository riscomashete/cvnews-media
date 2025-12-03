import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// NOTE: in a real app, never expose keys on client side without proxies. 
// This is structured to use the env var if available.

export const generateSummary = async (content: string): Promise<string> => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini. Returning mock summary.");
    return "This is a simulated AI summary because no API key was configured. In a production environment, Gemini would analyze the full article content and produce a concise, engaging excerpt automatically.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";
    
    const prompt = `Summarize the following article content into a catchy 2-sentence excerpt for a magazine homepage:\n\n${content}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary.";
  }
};