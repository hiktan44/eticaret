
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MODELS, SYSTEM_PROMPTS } from "../constants";
import { ProductContent, AspectRatio, ImageSize } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze product using thinking model and search grounding
export const analyzeProductWithThinking = async (
  images: { data: string; mimeType: string }[], 
  catalogs: { data: string; mimeType: string }[] = [],
  lang: string = 'tr',
  additionalContext?: string
): Promise<ProductContent> => {
  const ai = getAI();
  
  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  const catalogParts = catalogs.map(cat => ({
    inlineData: { data: cat.data, mimeType: cat.mimeType }
  }));

  const response = await ai.models.generateContent({
    model: MODELS.COMPLEX_TEXT,
    contents: {
      parts: [
        ...imageParts,
        ...catalogParts,
        { text: `Bu ürünü derinlemesine analiz et. Pazar araştırması yap, benzer ürünlerin fiyatlarını bul. Teknik detayları çıkar. Özellikle eklenen katalog belgelerini (varsa) referans alarak teknik özellikler (barkod, boyutlar, ağırlık vb.) bölümlerini doldur. ${additionalContext || ""}` }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPTS.PRODUCT_ANALYZER(lang),
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedPrice: { type: Type.STRING },
          category: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          barcode: { type: Type.STRING },
          productCode: { type: Type.STRING },
          brand: { type: Type.STRING },
          production: { type: Type.STRING },
          weight: { type: Type.STRING },
          productDimensions: { type: Type.STRING },
          boxDimensions: { type: Type.STRING },
          ageRange: { type: Type.STRING },
          gender: { type: Type.STRING },
          marketTrends: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "features", "suggestedPrice", "category", "tags", "barcode", "productCode", "brand", "production", "weight", "productDimensions", "boxDimensions", "ageRange", "gender"]
      }
    }
  });

  const productData: ProductContent = JSON.parse(response.text.replace(/```json/g, "").replace(/```/g, "").trim());
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    productData.groundingUrls = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri);
  }

  return productData;
};

export const generateProfessionalImage = async (
  prompt: string, 
  aspectRatio: AspectRatio = '1:1',
  imageSize: ImageSize = '1K'
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE_GEN,
    contents: {
      parts: [{ text: `High-end professional e-commerce studio photography: ${prompt}. Clean minimalist background, 8k resolution, cinematic lighting.` }]
    },
    config: {
      imageConfig: { aspectRatio, imageSize },
      tools: [{ googleSearch: {} }]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Resim oluşturulamadı.");
};

export const editImagePrompt = async (
  imageBase64: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE_EDIT,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: `Modify this product image: ${prompt}. Keep product details intact but change surroundings/style.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Düzenleme başarısız.");
};

export const generateVeoVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  image?: { data: string; mimeType: string }
): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: MODELS.VIDEO_GEN,
    prompt: `Professional cinematic product reveal video: ${prompt}. Slow motion, high production value.`,
    image: image ? { imageBytes: image.data, mimeType: image.mimeType } : undefined,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob as any);
};
