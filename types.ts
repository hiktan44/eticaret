
export interface ProductContent {
  title: string;
  description: string;
  features: string[];
  suggestedPrice: string;
  category: string;
  tags: string[];
  // Technical Specifications
  barcode: string;
  productCode: string;
  brand: string;
  production: string;
  weight: string;
  productDimensions: string;
  boxDimensions: string;
  ageRange: string;
  gender: string;
  // Market Info
  marketTrends?: string[];
  competitorPrices?: { source: string; price: string; url: string }[];
  // Grounding
  groundingUrls?: { title?: string; uri?: string }[];
}

export interface ImageAsset {
  id: string;
  url: string;
  type: 'original' | 'generated' | 'edited';
  prompt?: string;
  aspectRatio?: string;
  size?: string;
}

export interface VideoAsset {
  id: string;
  url: string;
  type: 'veo-generation';
  prompt: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
