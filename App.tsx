
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  History, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Package,
  ChevronLeft,
  Share2,
  Sparkles,
  Zap,
  Key
} from 'lucide-react';
import { ProductCategory, AnalysisResult, ScanHistoryItem } from './types';
import { analyzeProduct } from './services/geminiService';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('product_scan_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (newResult: AnalysisResult, img?: string, desc?: string) => {
    const newItem: ScanHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      image: img,
      description: desc,
      result: newResult
    };
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('product_scan_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm("Voulez-vous vraiment effacer tout l'historique ?")) {
      setHistory([]);
      localStorage.removeItem('product_scan_history');
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Veuillez fournir un fichier image valide (JPG, PNG, WEBP).");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = async () => {
    if (!image && !description.trim()) {
      setError("Veuillez fournir une photo ou une description.");
      return;
    }

    // Check for API key selection state before proceeding as per guidelines.
    // Casting to any to avoid redeclaration errors while utilizing the pre-configured window.aistudio.
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
          // Proceeding after openSelectKey as selection is assumed successful per guidelines.
        }
      } catch (e) {
        console.debug("aistudio check failed", e);
      }
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeProduct(image || undefined, description || undefined);
      setResult(analysis);
      saveToHistory(analysis, image || undefined, description || undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "Échec de l'analyse. Veuillez réessayer.");
      
      // If error indicates auth problems or requested entity not found, prompt for key again.
      const isAuthIssue = err.message?.includes("authentification") || 
                          err.message?.includes("Clé API") || 
                          err.message?.includes("not found");
      
      const aistudio = (window as any).aistudio;
      if (isAuthIssue && aistudio) {
        await aistudio.openSelectKey();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case ProductCategory.MAISON_DECO: return '🏠';
      case ProductCategory.CUISINE: return '🍳';
      case ProductCategory.BEAUTE_BIEN_ETRE: return '💄';
      case ProductCategory.SPORT_LOISIRS: return '⚽';
      case ProductCategory.BEBE: return '🍼';
      case ProductCategory.AUTO_MOTO: return '🚗';
      case ProductCategory.BRICOLAGE: return '🛠️';
      case ProductCategory.DIVERS: return '📦';
      default: return '❓';
    }
  };

  const handleOpenKeyPicker = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setImage(null);
    setDescription('');
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-0">
      {/* Top Banner (Desktop Only) */}
      <div className="hidden md:block bg-emerald-500 py-1.5 px-4 text-center text-[10px] font-bold tracking-[0.2em] text-white uppercase">
        Classification Multimodale Gemini 3 Flash
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[var(--container-width)] mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-inner">
              <Package size={22} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">boutique <span className="text-emerald-500">tounis</span></h1>
          </div>
          
          <nav className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10 mr-4">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`text-sm font-bold tracking-tight transition-all relative py-1 ${activeTab === 'upload' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Analyser
                {activeTab === 'upload' && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-emerald-500 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`text-sm font-bold tracking-tight transition-all relative py-1 ${activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Historique
                {activeTab === 'history' && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-emerald-500 rounded-full" />}
              </button>
            </div>

            {/* Always provide a way to set the key if supported */}
            {(window as any).aistudio && (
              <button 
                onClick={handleOpenKeyPicker}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200 text-xs font-bold"
                title="Configuration de la Clé API"
              >
                <Key size={16} />
                <span className="hidden sm:inline">Clé API</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[var(--container-width)] mx-auto p-4 md:p-10">
        {activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {!result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-2xl font-black text-slate-900">Nouvelle Analyse</h2>
                  <p className="text-sm text-slate-500 font-medium">Capturez ou décrivez pour classer vos produits instantanément.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-10 space-y-8">
                  {/* Photo area */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Source Visuelle</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group relative aspect-[1.4/1] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
                        isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 
                        image ? 'border-emerald-500 bg-emerald-50/30' : 
                        'border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      {image ? (
                        <>
                          <img src={image} alt="Product" className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="bg-white px-5 py-2.5 rounded-full text-xs font-black text-slate-900">Changer l'image</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setImage(null); }}
                            className="absolute top-4 right-4 bg-white text-red-500 p-2.5 rounded-2xl shadow-xl active:scale-90 border border-red-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={`w-20 h-20 rounded-[2rem] bg-white shadow-lg flex items-center justify-center mb-5 text-emerald-500 transition-all ${isDragging ? 'scale-110' : 'group-hover:rotate-12'}`}>
                            <Camera size={36} />
                          </div>
                          <p className="font-extrabold text-slate-800 text-lg">{isDragging ? 'Déposez ici' : 'Appuyez pour Photographier'}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-1">IA Gemini 3 Flash</p>
                        </>
                      )}
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </div>
                  </div>

                  {/* Text area */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1 flex items-center gap-2">
                      <FileText size={14} /> Description de l'article
                    </label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez l'article ici..."
                      className="w-full h-32 p-5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none resize-none text-slate-900 font-medium bg-white"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 animate-in shake">
                      <AlertCircle size={20} />
                      <div className="flex-1">
                        <p>{error}</p>
                        {error.includes("authentification") && (window as any).aistudio && (
                          <button 
                            onClick={handleOpenKeyPicker}
                            className="mt-2 text-[10px] underline uppercase tracking-widest text-red-600 block"
                          >
                            Sélectionner une clé API maintenant
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className={`w-full btn-primary-solid h-16 text-lg ${isAnalyzing ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span className="animate-pulse">Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={22} fill="currentColor" />
                        <span>Analyser maintenant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Analysis Result View */
              <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                <button 
                  onClick={resetAnalysis}
                  className="group flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Retour
                </button>

                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                  <div className="relative aspect-[16/9] bg-slate-900 flex items-center justify-center">
                    {image ? (
                      <img src={image} className="w-full h-full object-contain p-4" alt="Analysis preview" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-white/20">
                        <Package size={80} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Description Textuelle</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                          Score IA: {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      <h3 className="text-3xl font-black tracking-tight">{result.productName}</h3>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 space-y-10">
                    <div className="flex items-center gap-6 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                      <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-5xl transform -rotate-3">
                        {getCategoryIcon(result.category)}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-1">Catégorie</p>
                        <h4 className="text-2xl font-black text-slate-900">{result.category}</h4>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Sparkles size={14} className="text-emerald-500" /> Analyse IA
                      </h4>
                      <p className="text-slate-700 leading-relaxed font-medium text-lg border-l-4 border-emerald-500/20 pl-6 py-1 italic">
                        {result.reasoning}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tags suggérés</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {result.suggestedTags.map((tag, i) => (
                          <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold rounded-2xl hover:border-emerald-200 transition-all">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-sm rounded-2xl transition-all">
                        <Share2 size={18} /> Partager
                      </button>
                      <button 
                        onClick={resetAnalysis}
                        className="flex-1 btn-primary-solid h-14"
                      >
                        <CheckCircle2 size={20} /> Nouveau Scan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* History View */
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Bibliothèque</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{history.length} Scan{history.length !== 1 ? 's' : ''} Archivé{history.length !== 1 ? 's' : ''}</p>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="w-12 h-12 flex items-center justify-center bg-white text-slate-300 hover:text-red-500 rounded-2xl border border-slate-100 shadow-sm transition-all"
                  title="Vider l'historique"
                >
                  <Trash2 size={22} />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mx-auto text-slate-100">
                  <History size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-black text-xl">Aucune archive</p>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="text-emerald-500 font-black uppercase tracking-widest text-xs hover:underline"
                  >
                    Lancer un premier scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setResult(item.result);
                      setImage(item.image || null);
                      setDescription(item.description || '');
                      setActiveTab('upload');
                    }}
                    className="group bg-white rounded-[2rem] border border-slate-100 p-5 flex gap-5 items-center cursor-pointer hover:border-emerald-500/30 hover:shadow-2xl transition-all"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-200 border border-slate-50">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="History preview" />
                      ) : (
                        <FileText size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-xl group-hover:scale-125 transition-transform">{getCategoryIcon(item.result.category)}</span>
                      </div>
                      <h4 className="font-black text-slate-900 truncate leading-tight">{item.result.productName}</h4>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.1em] mt-1">{item.result.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around safe-bottom z-50 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`mobile-nav-item flex-1 py-4 ${activeTab === 'upload' ? 'active' : ''}`}
        >
          <div className={`p-2.5 rounded-2xl transition-all ${activeTab === 'upload' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40' : 'bg-slate-50 text-slate-300'}`}>
            <Upload size={24} />
          </div>
          <span>Analyser</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`mobile-nav-item flex-1 py-4 ${activeTab === 'history' ? 'active' : ''}`}
        >
          <div className={`p-2.5 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40' : 'bg-slate-50 text-slate-300'}`}>
            <History size={24} />
          </div>
          <span>Archives</span>
        </button>
      </nav>

      {/* Footer (Desktop Only) */}
      <footer className="hidden md:block py-12 bg-white border-t border-slate-100 mt-20">
        <div className="max-w-[var(--container-width)] mx-auto px-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 opacity-30 grayscale">
            <Package size={28} />
            <span className="font-black text-lg tracking-tight">boutique tounis</span>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Boutique Tounis • Classification Gemini 3 Flash</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
