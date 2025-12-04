import { GoogleGenAI, Chat, Type } from "@google/genai";

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

export const createChatSession = (siteContext: string = ''): Chat | null => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini Chat.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct a context-aware system instruction
    const baseInstruction = `You are the CVNEWS AI Assistant. Your role is to help users with news summaries, site navigation, and information about Namibian SMEs and business.
    
    OPERATIONAL GUIDELINES:
    1. Use the "SITE CONTEXT" provided below to answer user questions accurately.
    2. If a user asks about a specific topic (e.g., "agriculture"), look through the article list in the context and recommend relevant stories.
    3. When recommending an article, ALWAYS include the title and the direct link in this format: '/article/{id}'.
    4. If the user asks about CVNEWS (the company), use the "COMPANY PROFILE" section.
    5. Keep responses concise, professional, and friendly.
    6. If you don't know the answer based on the context, politely admit it and offer to help with something else.`;

    const fullInstruction = siteContext 
      ? `${baseInstruction}\n\n=== SITE CONTEXT ===\n${siteContext}` 
      : baseInstruction;

    return ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: fullInstruction,
      }
    });
  } catch (error) {
    console.error("Gemini Chat Init Error:", error);
    return null;
  }
};

export const generateSEO = async (content: string): Promise<{ seoTitle: string; metaDescription: string; keywords: string } | null> => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini SEO.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use Flash for fast analysis
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Analyze this article content and generate optimized SEO metadata.
      Content: ${content.substring(0, 8000)}`, 
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING, description: "Catchy title under 60 chars" },
            metaDescription: { type: Type.STRING, description: "Engaging summary under 160 chars" },
            keywords: { type: Type.STRING, description: "Comma separated list of 5-8 relevant keywords" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini SEO Error:", error);
    return null;
  }
};

export const proofreadContent = async (content: string): Promise<string> => {
  if (!apiKey) return content;
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use Pro for complex editing and nuance
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `You are a senior newspaper editor. Proofread and polish the following HTML article content. 
      - Fix grammar, spelling, and punctuation errors.
      - Improve flow, clarity, and readability without changing the original meaning.
      - IMPORTANT: Maintain the existing HTML structure and tags absolutely intact. Do not strip tags.
      - Do not wrap the output in markdown code blocks.
      
      Content:
      ${content}`
    });
    
    return response.text || content;
  } catch (error) {
    console.error("Gemini Proofread Error:", error);
    throw error;
  }
};

export const generateHeadlines = async (content: string): Promise<string[]> => {
  if (!apiKey) return [];
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 catchy, professional, SEO-friendly news headlines for the following article content. Return them as a JSON array of strings.
      Content: ${content.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Headline Error:", error);
    return [];
  }
};

export const generateCoverImage = async (prompt: string): Promise<string | null> => {
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We use gemini-2.5-flash-image for generation per instructions
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { text: `Create a professional, high-quality, photorealistic news header image (16:9 aspect ratio) representing: ${prompt}` },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      },
    });

    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};