
import React, { useMemo } from 'react';
import { Task, NonBuyer, ProductImage, ImageMap } from '../types';

interface PerformanceViewProps {
  tasks: Task[];
  nonBuyers: NonBuyer[];
  productImages?: ProductImage[]; 
  imageMap?: ImageMap;
  onSkuClick?: (skuName: string) => void; // Added callback prop
}

const getDistribution = (tasks: Task[], key: keyof Task) => {
  const counts: Record<string, number> = {};
  tasks.forEach(t => {
    const val = String(t[key] || 'Outros').trim();
    if (val) {
        counts[val] = (counts[val] || 0) + 1;
    }
  });
  
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return Object.entries(counts)
    .map(([label, value]) => ({ 
      label, 
      value, 
      percent: total > 0 ? (value / total) * 100 : 0 
    }))
    .sort((a, b) => b.value - a.value);
};

const BarChartSection: React.FC<{ title: string; data: { label: string; value: number; percent: number }[] }> = ({ title, data }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
      <div className="w-1 h-3 bg-primary rounded-full"></div>
      {title}
    </h3>
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="group">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-700 truncate pr-4">{item.label}</span>
                <span className="text-[10px] font-black text-slate-400">{item.value}</span>
            </div>
            <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden">
                <div 
                    className="h-full bg-black rounded-full transition-all duration-1000 ease-out group-hover:bg-primary"
                    style={{ width: `${item.percent}%` }}
                ></div>
            </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-xs text-slate-400 italic">Sem dados disponíveis.</p>}
    </div>
  </div>
);

const PerformanceView: React.FC<PerformanceViewProps> = ({ tasks, nonBuyers, productImages = [], imageMap = {}, onSkuClick }) => {
  const totalPotential = tasks.reduce((a, b) => a + b.coins, 0);
  const nonBuyerCount = nonBuyers.length;
  
  const clusterData = useMemo(() => getDistribution(tasks, 'cluster'), [tasks]);
  const categoryData = useMemo(() => getDistribution(tasks, 'category'), [tasks]);
  const subjectData = useMemo(() => getDistribution(tasks, 'subject'), [tasks]);

  const topSkus = useMemo(() => {
    const skuMap = new Map<string, { count: number; totalCoins: number }>();

    tasks.forEach(task => {
        if (task.associatedSkus && task.associatedSkus.length > 0) {
            task.associatedSkus.forEach(skuName => {
                const existing = skuMap.get(skuName) || { count: 0, totalCoins: 0 };
                skuMap.set(skuName, { 
                    count: existing.count + 1, 
                    totalCoins: existing.totalCoins + task.coins 
                });
            });
        }
    });

    const sorted = Array.from(skuMap.entries())
        .map(([name, data]) => ({
            name,
            count: data.count,
            avgCoins: Math.round(data.totalCoins / data.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return sorted;
  }, [tasks]);

  const maxSkuCount = topSkus.length > 0 ? topSkus[0].count : 1;

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

    // Fallback logic
    if (productImages.length > 0) {
        const tokens = target.split(/\s+/).filter(t => t.length > 2);
        if (tokens.length > 0) {
            const match = productImages.find(img => tokens.every(token => img.normalizedName.includes(token)));
            if (match) return match.imageUrl;
        }
    }
    return null;
  };

  const radius = 84; 
  const circumference = 2 * Math.PI * radius; 

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background-light">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-slate-100 text-center shadow-sm pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="w-10"></div>
        <h1 className="text-base font-black tracking-tight uppercase text-slate-900">Performance</h1>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-md mx-auto w-full">
        <header className="px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Insights em Tempo Real</p>
          </div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900">Analytics</h2>
        </header>

        <div className="px-6 space-y-6">
          <div className="bg-white rounded-[32px] p-8 flex flex-col items-center border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-black to-primary"></div>
            
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 192 192">
                <circle className="text-slate-100" cx="96" cy="96" fill="transparent" r={radius} stroke="currentColor" strokeWidth="12" />
                <circle className="text-black drop-shadow-xl" cx="96" cy="96" fill="transparent" r={radius} stroke="currentColor" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
                <span className="text-5xl font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm">{totalPotential}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 bg-white/90 px-3 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-slate-100">Total Coins</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 w-full text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-xl font-black text-slate-900">{tasks.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasks</p>
                </div>
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-xl font-black text-slate-900">{clusterData.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clusters</p>
                </div>
            </div>
          </div>

          <div className="py-2">
             <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase mb-4 px-1 flex items-center gap-2">
                <span className="material-icons-round text-primary">emoji_events</span>
                Top 10 Itens
             </h2>
             <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                {topSkus.length === 0 ? (
                    <div className="p-8 text-center">
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum dado de SKU encontrado</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {topSkus.map((sku, index) => {
                            const imgUrl = getProductImage(sku.name);
                            const percent = (sku.count / maxSkuCount) * 100;
                            const isTop3 = index < 3;
                            
                            return (
                                <div 
                                    key={index} 
                                    onClick={() => onSkuClick && onSkuClick(sku.name)}
                                    className="p-4 flex items-center gap-3 relative group active:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-black rounded-lg text-sm ${isTop3 ? 'bg-primary text-black shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 p-1 flex items-center justify-center flex-shrink-0">
                                        {imgUrl ? (
                                            <img 
                                                src={imgUrl} 
                                                alt="Prod" 
                                                loading="lazy"
                                                className="w-full h-full object-contain mix-blend-multiply" 
                                            />
                                        ) : (
                                            <span className="material-icons-round text-slate-200 text-sm">image</span>
                                        )}
                                    </div>

                                    <div className="flex-grow min-w-0 z-10">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-xs font-bold text-slate-900 truncate pr-2 group-hover:text-primary transition-colors">{sku.name}</p>
                                            <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                                <span className="material-icons-round text-[10px] text-slate-500">monetization_on</span>
                                                <span className="text-[9px] font-black text-slate-600">Avg {sku.avgCoins}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div style={{ width: `${percent}%` }} className="h-full bg-slate-900 rounded-full"></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 min-w-[30px] text-right">{sku.count} Tks</span>
                                        </div>
                                    </div>
                                    
                                    <span className="material-icons-round text-slate-300 opacity-0 group-hover:opacity-100 -mr-2 transition-all">chevron_right</span>
                                </div>
                            );
                        })}
                    </div>
                )}
             </div>
          </div>

          <div className="bg-red-50 rounded-[24px] p-6 border border-red-100 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Base de Risco</p>
                <p className="text-2xl font-black text-slate-900">Não Compradores</p>
                <p className="text-xs font-bold text-red-600/70 mt-1">Oportunidade de Recuperação</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white w-16 h-16 rounded-2xl shadow-sm border border-red-100 z-10">
                <span className="text-xl font-black text-red-500">{nonBuyerCount}</span>
                <span className="material-icons-round text-[10px] text-red-300">store_mall_directory</span>
            </div>
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          </div>

          <div className="py-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase mb-4 px-1">Distribuição</h2>
            
            <BarChartSection title="Por Cluster" data={clusterData} />
            <BarChartSection title="Por Categoria" data={categoryData} />
            <BarChartSection title="Por Assunto" data={subjectData} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default PerformanceView;
