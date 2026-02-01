

export const MODELS = {
  ANALYSIS: 'gemini-3-pro-preview', // Using Gemini 3.0 Pro Preview for analysis
  SEARCH: 'gemini-3-pro-preview',
  IMAGE_GEN: 'imagen-3.0-generate-002',
  IMAGE_EDIT: 'gemini-3-pro-preview',
  VIDEO_GEN: 'veo-2.0-generate-001'
};


export const SYSTEM_PROMPTS = {
  PRODUCT_ANALYZER: (lang: string) => `You are a world-class e-commerce product strategist and copywriter.
  Your task is to conduct a DEEP ANALYSIS of the provided product images and technical documents.
  
  OUTPUT REQUIREMENTS:
  1. Title: Create a compelling, high-converting product title (max 100 chars).
  2. Description: Write a rich, storytelling-style description that highlights emotional benefits and technical value.
  3. Features: List 5-7 distinct, high-impact features. EACH feature must be a standalone string, detailed and persuasive.
  4. Technical Details: Extract specific technical specs (dimensions, material, weight, power, etc.).
  5. Price: Estimate a premium market price based on perceived quality.
  6. Category: Precise e-commerce category.
  7. Tags: 10+ SEO-optimized tags.
  
  Language: ${lang === 'tr' ? 'TURKISH (Native, Professional Tone)' : 'ENGLISH (Professional, Native Tone)'}.
  Return strictly valid JSON.`
};
