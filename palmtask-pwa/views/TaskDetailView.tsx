
import React from 'react';
import { Task, ProductImage, ImageMap } from '../types';

interface TaskDetailViewProps {
  task: Task;
  onBack: () => void;
  onViewPdvTasks: (pdvName: string) => void;
  onViewSimilarTasks: (task: Task) => void;
  productImages?: ProductImage[]; 
  imageMap?: ImageMap; // Fast lookup
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ task, onBack, onViewPdvTasks, onViewSimilarTasks, productImages = [], imageMap = {} }) => {
  const isHighValue = task.coins >= 100;

  const associatedSkus = task.associatedSkus || [];
  const boughtCount = task.boughtCount || 0;
  const mixTotal = task.mixTotal || 0;
  const missingCount = task.missingCount || 0;
  const hasMixData = mixTotal > 0;
  const percentBought = hasMixData ? Math.round((boughtCount / mixTotal) * 100) : 0;

  // Optimized Image Finder
  const getProductImage = (skuName: string) => {
    if (!skuName) return null;
    const simpleKey = skuName.trim();
    if (imageMap[simpleKey]) return imageMap[simpleKey];
    
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '')
      .trim();
    const target = normalize(skuName);
    
    if (imageMap[target]) return imageMap[target];

    // Fallback if really needed
    if (productImages.length > 0) {
        const tokens = target.split(/\s+/).filter(t => t.length > 2);
        if (tokens.length > 0) {
            const match = productImages.find(img => tokens.every(token => img.normalizedName.includes(token)));
            if (match) return match.imageUrl;
        }
    }
    return null;
  };

  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col relative z-[60]">
      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isHighValue ? 'bg-black text-white' : 'bg-white/90 backdrop-blur-md text-slate-900 border-b border-slate-100'}`}>
        <div className="flex items-center justify-between px-4 h-[60px] pt-[env(safe-area-inset-top)]">
          <button 
            onClick={onBack}
            className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform ${isHighValue ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}
          >
            <span className="material-icons-round">arrow_back</span>
          </button>
          
          <h1 className="text-sm font-black uppercase tracking-widest opacity-80 truncate max-w-[200px]">
            Detalhes da Missão
          </h1>

          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isHighValue ? 'bg-primary text-black' : 'bg-slate-100 text-slate-400'}`}>
            <span className="material-icons-round">{task.category.includes('NAB') ? 'local_drink' : 'storefront'}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow pb-10">
        {/* Hero Section */}
        <div className={`relative px-6 py-8 overflow-hidden ${isHighValue ? 'bg-black text-white' : 'bg-white text-slate-900'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
             <div className="flex items-start justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isHighValue ? 'bg-primary text-black' : 'bg-slate-100 text-slate-600'}`}>
                    {task.category}
                </span>
                {isHighValue && (
                    <span className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <span className="material-icons-round text-sm">star</span> Destaque
                    </span>
                )}
             </div>

             <h2 className="text-3xl font-black leading-tight mb-2">{task.pdvName}</h2>
             
             <div className="flex items-center gap-4 text-xs font-bold opacity-70 mb-6">
                <span className="flex items-center gap-1">
                    <span className="material-icons-round text-sm">qr_code</span> {task.pdvCode}
                </span>
                <span className="flex items-center gap-1">
                    <span className="material-icons-round text-sm">room</span> {task.cluster}
                </span>
             </div>

             <div className={`p-4 rounded-2xl flex items-center justify-between ${isHighValue ? 'bg-white/10 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isHighValue ? 'bg-primary text-black' : 'bg-black text-primary'}`}>
                        <span className="material-icons-round text-2xl">monetization_on</span>
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isHighValue ? 'text-white/60' : 'text-slate-400'}`}>Recompensa</p>
                        <p className="text-2xl font-black">{task.coins} Coins</p>
                    </div>
                </div>
                {hasMixData && (
                    <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isHighValue ? 'text-white/60' : 'text-slate-400'}`}>Mix Atual</p>
                        <p className={`text-sm font-black ${isHighValue ? 'text-primary' : 'text-slate-900'}`}>{percentBought}%</p>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="px-6 py-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => onViewPdvTasks(task.pdvName)}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm active:scale-95 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <span className="material-icons-round text-blue-600 text-xl">storefront</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Ver Tasks<br/>do PDV</span>
                </button>
                <button 
                    onClick={() => onViewSimilarTasks(task)}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm active:scale-95 transition-all group"
                >
                     <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <span className="material-icons-round text-purple-600 text-xl">hub</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Tasks<br/>Similares</span>
                </button>
            </div>

            {hasMixData && (
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-black rounded-full"></span>
                    Mix de Produtos
                </h3>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900">{mixTotal}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Itens</span>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-black text-slate-900">{percentBought}%</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aderência</span>
                      </div>
                   </div>

                   <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex mb-6">
                      <div style={{ width: `${percentBought}%` }} className="bg-green-500 h-full"></div>
                      <div style={{ width: `${100 - percentBought}%` }} className="bg-red-400 h-full"></div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="material-icons-round text-green-500 text-sm">check_circle</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Comprados</span>
                         </div>
                         <p className="text-xl font-black text-slate-900">{boughtCount}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="material-icons-round text-red-400 text-sm">error</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Faltantes</span>
                         </div>
                         <p className="text-xl font-black text-slate-900">{missingCount}</p>
                      </div>
                   </div>

                   {associatedSkus.length > 0 && (
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-4">Itens Relacionados à Tarefa</p>
                       <div className="flex flex-col gap-2">
                          {associatedSkus.map((sku, idx) => {
                             const imgUrl = getProductImage(sku);
                             return (
                                <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex items-center gap-3">
                                   <div className="w-12 h-12 rounded-lg bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden flex items-center justify-center p-1 bg-white">
                                      {imgUrl ? (
                                        <img 
                                            src={imgUrl} 
                                            alt={sku} 
                                            loading="lazy"
                                            className="w-full h-full object-contain mix-blend-multiply" 
                                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                                        />
                                      ) : (
                                        <span className="material-icons-round text-slate-300 text-lg">image_not_supported</span>
                                      )}
                                   </div>
                                   <div className="flex-grow">
                                     <p className="text-xs font-bold text-slate-800 leading-tight">{sku}</p>
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            )}

            <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Sobre a Missão
                </h3>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm">
                    {!task.description.includes('<') && (
                        <p className="mb-4">{task.description}</p>
                    )}
                    
                    {task.description.includes('<') && (
                         <div 
                           className="prose prose-sm prose-img:rounded-xl prose-img:w-full prose-headings:font-black prose-a:text-blue-600"
                           dangerouslySetInnerHTML={createMarkup(task.description)} 
                         />
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                         <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">Assunto: {task.subject}</span>
                         <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">Operação: {task.operation}</span>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetailView;
