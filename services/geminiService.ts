
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ProductCategory } from "../types";

const SYSTEM_INSTRUCTION = `You are a product classification expert for "boutique tounis". 
Analyze the provided product image or description and categorize it into EXACTLY ONE of the following categories:
- Maison & Déco (Home and Decoration)
- Cuisine (Kitchenware, food prep, appliances)
- Beauté & Bien-être (Cosmetics, health, personal care)
- Sport & Loisirs (Gym equipment, outdoor hobbies, gaming)
- Bébé (Baby clothes, toys, nursery items)
- Auto & Moto (Car parts, accessories, helmets)
- Bricolage (Tools, home repair, construction)
- Divers (Everything else that doesn't fit clearly)

You must return your response in JSON format. Provide a likely product name, the specific category (from the list above), a confidence score (0-1), a brief reasoning for the choice, and some relevant search tags.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING, description: 'Likely name of the product.' },
    category: { 
      type: Type.STRING, 
      description: 'The category name exactly as defined in the list.',
      enum: Object.values(ProductCategory)
    },
    confidence: { type: Type.NUMBER, description: 'Confidence level from 0 to 1.' },
    reasoning: { type: Type.STRING, description: 'Reasoning for this classification.' },
    suggestedTags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: 'Relevant search or SEO tags.'
    },
  },
  required: ['productName', 'category', 'confidence', 'reasoning', 'suggestedTags']
};

export async function analyzeProduct(
  image?: string,
  description?: string
): Promise<AnalysisResult> {
  // Always initialize with a new GoogleGenAI instance right before the call to ensure up-to-date API keys.
  // Using gemini-3-flash-preview as recommended for basic analysis and multimodal tasks.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  if (image) {
    const base64Data = image.split(',')[1] || image;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    });
  }
  
  if (description) {
    parts.push({ text: `Analyze this product: ${description}` });
  }

  if (parts.length === 0) {
    throw new Error("Veuillez fournir une image ou une description.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    // Extracting text from GenerateContentResponse using the .text property as required.
    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    // Standardize error reporting for authentication or configuration issues.
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes("api_key") || errorMsg.includes("not found") || error?.status === 403) {
      throw new Error("Erreur d'authentification. Veuillez vérifier votre clé API (Clé requise pour le déploiement).");
    }
    throw error;
  }
}
