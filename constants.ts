
export const MODELS = {
  BASIC_TEXT: 'gemini-3-flash-preview',
  COMPLEX_TEXT: 'gemini-3-pro-preview',
  FAST_TEXT: 'gemini-2.5-flash-lite-latest',
  IMAGE_GEN: 'gemini-3-pro-image-preview',
  IMAGE_EDIT: 'gemini-2.5-flash-image',
  VIDEO_GEN: 'veo-3.1-fast-generate-preview'
};

export const SYSTEM_PROMPTS = {
  PRODUCT_ANALYZER: (lang: string) => `Sen profesyonel bir e-ticaret kategori yöneticisi ve içerik stratejistisin. 
  Görselleri ve belgeleri analiz ederek Amazon, Trendyol, Etsy standartlarında ürün detayları oluşturursun.
  Mümkünse Google Search verilerini kullanarak pazar fiyatlarını ve trendleri de kontrol et.
  Dil: ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}.
  Yanıt formatı: JSON.`
};
