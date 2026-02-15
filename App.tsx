
import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  analyzeProductWithThinking,
  generateProfessionalImage,
  editImagePrompt,
  generateVeoVideo
} from './services/geminiService';
import { ProductContent, ImageAsset, VideoAsset, AspectRatio, ImageSize } from './types';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'visuals' | 'video'>('content');
  
  // Data State
  const [product, setProduct] = useState<ProductContent | null>(null);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Inputs
  const [imageSlots, setImageSlots] = useState<{data: string, file: File, id: string}[]>([]);
  const [catalogSlots, setCatalogSlots] = useState<{data: string, file: File, id: string}[]>([]);
  
  const [extraNote, setExtraNote] = useState('');
  const [genPrompt, setGenPrompt] = useState('');
  const [genAR, setGenAR] = useState<AspectRatio>('1:1');
  const [genSize, setGenSize] = useState<ImageSize>('1K');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAR, setVideoAR] = useState<'16:9' | '9:16'>('16:9');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const catalogInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey as boolean);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSlots(prev => [...prev, { data: ev.target?.result as string, file, id: Math.random().toString() }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const onCatalogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCatalogSlots(prev => [...prev, { data: ev.target?.result as string, file, id: Math.random().toString() }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const startDeepAnalysis = async () => {
    if (imageSlots.length === 0) return alert("Lütfen en az bir ürün fotoğrafı yükleyin.");
    setLoading("Ürün ve belgeler yapay zeka tarafından inceleniyor...");
    try {
      const imgs = imageSlots.map(s => ({ data: s.data.split(',')[1], mimeType: s.file.type }));
      const cats = catalogSlots.map(s => ({ data: s.data.split(',')[1], mimeType: s.file.type }));
      const data = await analyzeProductWithThinking(imgs, cats, 'tr', extraNote);
      setProduct(data);
      setImages(imageSlots.map((s, i) => ({ id: `orig-${i}`, url: s.data, type: 'original' })));
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  const doImageGen = async () => {
    setLoading("Gemini 3 Pro Image ile görsel oluşturuluyor...");
    try {
      const url = await generateProfessionalImage(genPrompt, genAR, genSize);
      const newImg: ImageAsset = { id: `gen-${Date.now()}`, url, type: 'generated', prompt: genPrompt, aspectRatio: genAR, size: genSize };
      setImages(prev => [...prev, newImg]);
      setSelectedImgIdx(images.length);
      setGenPrompt('');
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  const doVideoGen = async () => {
    setLoading("Veo 3.1 ile video oluşturuluyor...");
    try {
      const currentImg = images[selectedImgIdx];
      const imgData = currentImg ? { data: currentImg.url.split(',')[1], mimeType: 'image/png' } : undefined;
      const url = await generateVeoVideo(videoPrompt, videoAR, imgData);
      setVideos(prev => [...prev, { id: `vid-${Date.now()}`, url, type: 'veo-generation', prompt: videoPrompt }]);
      setVideoPrompt('');
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    setLoading("PDF Rapor Hazırlanıyor...");
    const canvas = await html2canvas(resultRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`${product?.title || 'urun-analiz'}.pdf`);
    setLoading(null);
  };

  if (apiKeySelected === false) {
    return (
      <div className="min-h-screen flex items-center justify-center home-gradient p-6">
        <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl max-w-lg space-y-6">
          <h1 className="text-4xl font-black text-slate-900">Profesyonel AI Erişimi</h1>
          <p className="text-slate-500 font-medium italic">Bu stüdyo Veo video üretimi ve Gemini 3 Pro yeteneklerini kullanır.</p>
          <button onClick={handleSelectKey} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl">BAŞLAT</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${product ? 'bg-slate-50 text-slate-900' : 'home-gradient text-white'}`}>
      {loading && <LoadingOverlay message={loading} />}

      <header className={`fixed top-0 w-full z-50 px-8 py-4 flex justify-between items-center transition-all ${product ? 'bg-white/95 backdrop-blur-md border-b border-slate-200' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg animate-pulse">S</div>
          <div>
            <h1 className={`text-lg font-black leading-none ${product ? 'text-slate-900' : 'text-white'}`}>VİTRİN STÜDYO</h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Professional Suite</p>
          </div>
        </div>
        {product && (
          <div className="flex gap-4">
             <button onClick={() => { setProduct(null); setImageSlots([]); setCatalogSlots([]); }} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-full font-black text-xs hover:bg-slate-200 transition-all">YENİ ÜRÜN</button>
             <button onClick={downloadPDF} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-xs shadow-md hover:bg-indigo-700 transition-all">PDF RAPOR</button>
          </div>
        )}
      </header>

      <main className="pt-24 px-8 max-w-7xl mx-auto pb-24">
        {!product ? (
          <div className="max-w-4xl mx-auto py-10 space-y-16">
            <div className="text-center space-y-6">
              <h2 className="text-7xl font-black tracking-tighter leading-none">E-Ticaret <br/><span className="text-indigo-500 underline underline-offset-8 decoration-indigo-600/30">Ürün Hazırlama</span> Merkezi</h2>
              <p className="text-xl text-white/60 font-medium">Fotoğrafları yükleyin, katalogları ekleyin; biz profesyonel vitrininizi kuralım.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div className="glass-card rounded-[3rem] p-10 space-y-6 flex flex-col h-full border-indigo-500/20 shadow-2xl relative group">
                <div className="flex items-center gap-3 mb-2">
                   <span className="material-symbols-outlined text-indigo-400">add_a_photo</span>
                   <h3 className="text-lg font-black tracking-tight uppercase">Ürün Fotoğrafları</h3>
                </div>
                <div 
                  onClick={() => imageInputRef.current?.click()}
                  className="flex-grow border-4 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center min-h-[250px]"
                >
                  <input type="file" ref={imageInputRef} multiple className="hidden" onChange={onImageUpload} accept="image/*" />
                  <span className="material-symbols-outlined text-5xl text-indigo-400/50 mb-4 group-hover:scale-110 transition-transform">upload</span>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">En az 1 adet ürün görseli yükleyin</p>
                </div>
                {imageSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {imageSlots.map((s) => (
                      <div key={s.id} className="relative group/thumb">
                        <img src={s.data} className="w-14 h-14 object-cover rounded-lg border border-white/20" />
                        <button onClick={() => setImageSlots(p => p.filter(i => i.id !== s.id))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/thumb:opacity-100 transition-opacity">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catalog Upload */}
              <div className="glass-card rounded-[3rem] p-10 space-y-6 flex flex-col h-full border-emerald-500/20 shadow-2xl relative group">
                <div className="flex items-center gap-3 mb-2">
                   <span className="material-symbols-outlined text-emerald-400">description</span>
                   <h3 className="text-lg font-black tracking-tight uppercase">Teknik Katalog / Belgeler</h3>
                </div>
                <div 
                  onClick={() => catalogInputRef.current?.click()}
                  className="flex-grow border-4 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center min-h-[250px]"
                >
                  <input type="file" ref={catalogInputRef} multiple className="hidden" onChange={onCatalogUpload} accept="image/*,application/pdf" />
                  <span className="material-symbols-outlined text-5xl text-emerald-400/50 mb-4 group-hover:scale-110 transition-transform">sticky_note_2</span>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Katalog, broşür veya teknik şema yükleyin</p>
                </div>
                {catalogSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {catalogSlots.map((s) => (
                      <div key={s.id} className="relative group/thumb flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-400 text-xl">docs</span>
                        <button onClick={() => setCatalogSlots(p => p.filter(i => i.id !== s.id))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/thumb:opacity-100 transition-opacity">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-[3rem] p-10 space-y-6">
              <label className="text-xs font-black text-white/40 uppercase tracking-[0.3em] px-4 block">Ek Bilgiler & Yapay Zeka Komutları</label>
              <textarea 
                value={extraNote} 
                onChange={(e) => setExtraNote(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 h-40 focus:border-indigo-500 outline-none transition-all placeholder:text-white/20 font-medium"
                placeholder="Örn: Barkod: 868000..., Ürünün 'el yapımı' olduğu vurgulansın, rakiplerden %10 daha ucuz listelensin..."
              />
              <button 
                onClick={startDeepAnalysis}
                disabled={imageSlots.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-[2rem] text-3xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-6 disabled:opacity-30 disabled:grayscale"
              >
                <span>PROFESYONEL ANALİZİ BAŞLAT</span>
                <span className="material-symbols-outlined text-4xl">magic_exchange</span>
              </button>
            </div>
          </div>
        ) : (
          <div ref={resultRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
            {/* Sidebar / Stats */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-slate-200">
                <div className="aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden mb-8 relative group cursor-zoom-in">
                  <img src={images[selectedImgIdx]?.url} className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/95 px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-sm border border-slate-100">
                    {images[selectedImgIdx]?.type === 'original' ? 'Asıl Görsel' : 'Yapay Zeka'}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <button key={img.id} onClick={() => setSelectedImgIdx(idx)} className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all ${selectedImgIdx === idx ? 'border-indigo-600 scale-105 shadow-lg' : 'border-slate-100 opacity-60 hover:opacity-100'}`}>
                      <img src={img.url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-200 space-y-8">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-indigo-600">settings_suggest</span>
                   <h3 className="font-black uppercase text-xs tracking-[0.2em] text-slate-400">Teknik Özet</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Marka</span>
                    <p className="font-black text-sm">{product.brand}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Barkod</span>
                    <p className="font-black text-sm">{product.barcode}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Ürün Kodu</span>
                    <p className="font-black text-sm">{product.productCode}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Ağırlık</span>
                    <p className="font-black text-sm">{product.weight}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Ebatlar</span>
                    <p className="font-black text-[11px]">{product.productDimensions}</p>
                  </div>
                </div>
              </div>

              {product.marketTrends && (
                <div className="bg-indigo-600 rounded-[3.5rem] p-10 text-white shadow-xl shadow-indigo-200">
                  <h3 className="font-black uppercase text-xs tracking-[0.2em] text-white/50 mb-6">Pazar Analizi</h3>
                  <ul className="space-y-4">
                    {product.marketTrends.map((t, i) => (
                      <li key={i} className="flex gap-3 text-sm font-bold leading-tight">
                        <span className="text-white/30 shrink-0 mt-1">✦</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.groundingUrls && product.groundingUrls.length > 0 && (
                <div className="bg-slate-100 rounded-[3rem] p-10 border border-slate-200">
                  <h3 className="font-black uppercase text-xs tracking-widest text-slate-500 mb-6">İnternet Kaynakları</h3>
                  <div className="space-y-3">
                    {product.groundingUrls.map((url, i) => (
                      <a key={i} href={url.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:underline">
                        <span className="material-symbols-outlined text-sm">link</span>
                        <span className="truncate">{url.title || 'Kaynak'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 space-y-8">
              <nav className="flex gap-4 p-2 bg-slate-200/50 rounded-[2rem] w-fit shadow-inner">
                {[
                  { id: 'content', label: 'ÜRÜN SAYFASI', icon: 'storefront' },
                  { id: 'visuals', label: 'GÖRSEL STÜDYO', icon: 'camera' },
                  { id: 'video', label: 'VEO VİDEO', icon: 'movie' }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black text-xs tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="min-h-[800px]">
                {activeTab === 'content' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">STOCK: ACTIVE</span>
                        <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-slate-200">{product.category}</span>
                      </div>
                      <h2 className="text-6xl font-black leading-[1.1] tracking-tighter text-slate-900">{product.title}</h2>
                      <div className="flex items-baseline gap-4 pt-4">
                        <span className="text-7xl font-black text-slate-900 tracking-tighter">{product.suggestedPrice}</span>
                        <span className="text-3xl font-black text-slate-400">TRY</span>
                        <span className="ml-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">Gemini Pazar Analizi Uyumlu</span>
                      </div>
                    </div>

                    <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-slate-200 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">ÜRÜN HİKAYESİ & TANITIM</h3>
                      <p className="text-2xl font-medium leading-relaxed text-slate-700 italic">"{product.description}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">TEMEL ÖZELLİKLER</h3>
                        <ul className="space-y-6">
                          {product.features.map((f, i) => (
                            <li key={i} className="flex gap-4 text-lg font-black items-start group">
                              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xs mt-0.5 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">✓</span>
                              <span className="text-slate-800">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">SEO & PAZARLAMA</h3>
                        <div className="flex flex-wrap gap-3">
                          {product.tags.map((t, i) => (
                            <span key={i} className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl text-[11px] font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition-all shadow-sm">#{t.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'visuals' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white p-14 rounded-[4rem] shadow-2xl border border-slate-200 space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-2xl">auto_fix</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">AI Görsel Stüdyosu <br/><span className="text-indigo-500 text-sm font-black uppercase tracking-widest">Gemini 3 Pro Powered</span></h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Kadro (En-Boy)</label>
                          <select value={genAR} onChange={(e) => setGenAR(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer">
                            {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(ar => <option key={ar} value={ar}>{ar}</option>)}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Çözünürlük</label>
                          <select value={genSize} onChange={(e) => setGenSize(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer">
                            {['1K', '2K', '4K'].map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Sahne Komutu</label>
                         <div className="flex gap-4">
                          <input 
                            value={genPrompt} 
                            onChange={e => setGenPrompt(e.target.value)}
                            className="flex-grow bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 font-black outline-none focus:border-indigo-600 transition-all shadow-inner text-lg"
                            placeholder="Ürünü nerede hayal ediyorsunuz?"
                          />
                          <button onClick={doImageGen} disabled={!genPrompt} className="bg-indigo-600 text-white px-12 rounded-[2rem] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all disabled:opacity-30 flex items-center gap-3">
                             ÜRET <span className="material-symbols-outlined">bolt</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {images.filter(i => i.type === 'generated').map(img => (
                        <div key={img.id} className="bg-white rounded-[3.5rem] p-8 shadow-sm border border-slate-200 space-y-6 group hover:shadow-2xl transition-all duration-500">
                          <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden relative">
                             <img src={img.url} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                             <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">{img.size} • {img.aspectRatio}</div>
                          </div>
                          <div className="px-2">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">KOMUT</p>
                             <p className="text-sm font-bold text-slate-700 italic">"{img.prompt}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-slate-900 text-white p-14 rounded-[4rem] shadow-2xl space-y-10 relative overflow-hidden border border-white/5">
                      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                      <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20">
                             <span className="material-symbols-outlined text-2xl">movie</span>
                           </div>
                           <h2 className="text-3xl font-black tracking-tight">Veo 3.1 Sinematik Reklam Stüdyosu</h2>
                        </div>
                        
                        <div className="flex gap-4">
                          {['16:9', '9:16'].map(ar => (
                            <button key={ar} onClick={() => setVideoAR(ar as any)} className={`px-10 py-5 rounded-[1.5rem] font-black text-xs tracking-[0.2em] border-2 transition-all ${videoAR === ar ? 'bg-white text-slate-900 border-white shadow-xl scale-105' : 'border-white/10 text-white/40 hover:border-white/20'}`}>{ar === '16:9' ? 'YATAY REKLAM' : 'DIKEY REELS'}</button>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] px-4">Senaryo Komutu</label>
                          <div className="flex gap-4">
                            <input 
                              value={videoPrompt} 
                              onChange={e => setVideoPrompt(e.target.value)}
                              className="flex-grow bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 font-bold outline-none focus:border-indigo-400 transition-all text-white shadow-inner text-lg"
                              placeholder="Ürün videoda nasıl hareket etmeli? (Örn: Sinematik ışıklar altında yavaş dönüş)"
                            />
                            <button onClick={doVideoGen} disabled={!videoPrompt} className="bg-indigo-600 text-white px-12 rounded-[2rem] font-black shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-30 flex items-center gap-3">
                               ÜRET <span className="material-symbols-outlined">play_circle</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {videos.map(vid => (
                        <div key={vid.id} className="bg-white rounded-[4rem] p-8 shadow-sm border border-slate-200 space-y-8 hover:shadow-2xl transition-all duration-500">
                          <video src={vid.url} controls className="w-full rounded-[2.5rem] shadow-2xl aspect-video object-cover border-8 border-slate-50" />
                          <div className="space-y-4 px-4 pb-4">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">REKLAM SENARYOSU</div>
                             <p className="font-black text-lg leading-snug text-slate-800">"{vid.prompt}"</p>
                             <div className="flex gap-4 pt-4">
                               <a href={vid.url} download={`${vid.id}.mp4`} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all">
                                 <span className="material-symbols-outlined text-sm">download</span> MP4 İNDİR
                               </a>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-32 border-t border-slate-200 mt-20 relative overflow-hidden bg-white">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-12 text-center relative z-10">
          <div className="flex items-center gap-3 grayscale opacity-30">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">VİTRİN STÜDYO</h1>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">DERİN ANALİZ</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">4K STÜDYO</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">VEO VİDEO</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 tracking-[0.5em]">&copy; 2024 DESIGNED BY AI FOR GLOBAL E-COMMERCE</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
