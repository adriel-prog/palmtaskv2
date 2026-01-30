
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Task, ProductImage, ImageMap } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TasksViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  productImages?: ProductImage[]; 
  imageMap?: ImageMap; // Fast lookup
}

// --- OPTIMIZED IMAGE FINDER ---
const getImageForSku = (skuName: string, imageMap: ImageMap, productImages: ProductImage[]) => {
    if (!skuName) return null;
    
    // 1. Fast O(1) Lookup
    const simpleKey = skuName.trim();
    if (imageMap && imageMap[simpleKey]) return imageMap[simpleKey];
    
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '')
      .trim();
    const target = normalize(skuName);
    
    if (imageMap && imageMap[target]) return imageMap[target];

    // 2. Slow Fuzzy Search
    if (productImages.length > 0) {
         const tokens = target.split(/\s+/).filter(t => t.length > 2);
         if (tokens.length > 0) {
             const match = productImages.find(img => tokens.every(token => img.normalizedName.includes(token)));
             if (match) return match.imageUrl;
         }
    }
    return null;
};

// --- MEMOIZED CARD COMPONENT ---
const TaskCard = memo(({ task, onClick, imageMap, productImages }: { task: Task, onClick: (id: string) => void, imageMap: ImageMap, productImages: ProductImage[] }) => {
    const isHighValue = task.coins >= 100;
    const isRisk = task.isNonBuyer; 
    
    const boughtCount = task.boughtCount || 0;
    const mixTotal = task.mixTotal || 0;
    const missingCount = task.missingCount || 0;
    const percentBought = mixTotal > 0 ? (boughtCount / mixTotal) * 100 : 0;
    const hasMixData = mixTotal > 0;
    const associatedSkus = task.associatedSkus || [];
    
    // Limit to 4 images
    const thumbnails = useMemo(() => {
        return associatedSkus
            .slice(0, 4)
            .map(sku => ({ name: sku, url: getImageForSku(sku, imageMap, productImages) }))
            .filter(item => item.url);
    }, [associatedSkus, imageMap, productImages]);

    // Strip HTML tags
    const cleanDescription = useMemo(() => {
        const desc = task.description || '';
        if (desc.includes('<')) {
            return desc.replace(/<[^>]*>?/gm, '');
        }
        return desc;
    }, [task.description]);

    return (
        <div 
        onClick={() => onClick(task.id)}
        className={`group relative p-5 rounded-[24px] transition-all duration-300 border active:scale-[0.98] cursor-pointer ${
            isHighValue 
            ? 'bg-black border-primary border-[3px] text-white shadow-[0_15px_30px_-10px_rgba(255,212,0,0.3)] z-10' 
            : isRisk
                ? 'bg-red-50 border-red-200 text-slate-900 shadow-sm'
                : 'bg-white border-slate-100 text-slate-900 shadow-sm hover:shadow-lg'
        }`}
        >
        <div className="absolute top-0 right-5 -translate-y-1/2 flex items-center gap-2">
            {isHighValue && (
                <div className="flex items-center gap-1 bg-primary text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-xl">
                    <span className="material-icons-round text-[10px]">star</span>
                    DIAMANTE
                </div>
            )}
            {isRisk && (
                    <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-white shadow-md">
                    <span className="material-icons-round text-[10px]">warning</span>
                    NÃO COMPRADOR
                </div>
            )}
        </div>

        <div className="flex justify-between items-start mb-4">
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
            isHighValue ? 'bg-white/10 text-primary border border-white/10' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
            {task.category}
            </div>
            <div className={`flex items-center gap-1 font-black ${isHighValue ? 'text-primary' : 'text-slate-900'}`}>
            <span className="material-icons-round text-lg">monetization_on</span>
            <span className="text-xl tracking-tight">{task.coins}</span>
            </div>
        </div>
        
        <h3 className={`text-lg font-black mb-1 leading-snug tracking-tight ${isHighValue ? 'text-white' : 'text-slate-900'}`}>
            {task.pdvName}
        </h3>

        <p className={`text-xs font-medium mb-3 line-clamp-2 leading-relaxed ${isHighValue ? 'text-white/70' : 'text-slate-500'}`}>
            {cleanDescription}
        </p>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4">
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${isHighValue ? 'text-primary' : 'text-slate-500'}`}>
            <span className="material-icons-round text-sm">room</span>
            {task.cluster}
            </div>
            <div className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${isHighValue ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-400'}`}>
            #{task.pdvCode}
            </div>
        </div>
        
        {thumbnails.length > 0 && (
            <div className="flex -space-x-2 mb-4 pl-1">
                {thumbnails.map((thumb, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden z-0 hover:z-10 transition-all flex items-center justify-center">
                        <img 
                        src={thumb.url || ''} 
                        alt="p" 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                ))}
                {associatedSkus.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 z-0">
                        +{associatedSkus.length - 4}
                    </div>
                )}
            </div>
        )}

        {hasMixData && (
            <div className={`mb-5 p-3 rounded-2xl border ${isHighValue ? 'bg-white/10 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-2 px-1">
                    <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full bg-green-500`}></span>
                        <span className={`text-[9px] font-black uppercase tracking-wide ${isHighValue ? 'text-white' : 'text-slate-700'}`}>
                            Comprados ({boughtCount})
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-black uppercase tracking-wide ${isHighValue ? 'text-white' : 'text-slate-700'}`}>
                            Faltantes ({missingCount})
                        </span>
                        <span className={`w-2 h-2 rounded-full bg-red-400`}></span>
                    </div>
                </div>
                
                <div className="flex h-2.5 rounded-full overflow-hidden w-full bg-slate-200/20 shadow-inner">
                    <div style={{ width: `${percentBought}%` }} className="bg-green-500 h-full"></div>
                    <div style={{ width: `${100 - percentBought}%` }} className="bg-red-400 h-full"></div>
                </div>
            </div>
        )}

        <div className="mt-5">
            <button 
            className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isHighValue 
            ? 'bg-primary text-black' 
            : 'bg-slate-900 text-white'
            }`}>
            ABRIR TAREFA
            <span className="material-icons-round text-sm">arrow_forward</span>
            </button>
        </div>
        </div>
    );
}, (prev, next) => prev.task.id === next.task.id && prev.imageMap === next.imageMap);


const TasksView: React.FC<TasksViewProps> = ({ tasks, onTaskClick, productImages = [], imageMap = {} }) => {
  const getStoredVal = (key: string, defaultVal: string) => sessionStorage.getItem(`palmtask_${key}`) || defaultVal;
  const getStoredBool = (key: string, defaultVal: boolean) => {
    const stored = sessionStorage.getItem(`palmtask_${key}`);
    return stored !== null ? stored === 'true' : defaultVal;
  };

  const [isFilterOpen, setIsFilterOpen] = useState(() => getStoredBool('isOpen', false));
  const [searchTerm, setSearchTerm] = useState(() => getStoredVal('search', ''));
  const [sortByScore, setSortByScore] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  
  // PDF Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSortType, setExportSortType] = useState<'PDV' | 'COINS'>('PDV');
  // Export Specific Filters
  const [exportCluster, setExportCluster] = useState('Todos');
  const [exportCategory, setExportCategory] = useState('Todos');
  const [exportSubject, setExportSubject] = useState('Todos');
  const [exportScore, setExportScore] = useState('Todos');

  // Main View Filters
  const [selectedCluster, setSelectedCluster] = useState(() => getStoredVal('cluster', 'Todos'));
  const [selectedCategory, setSelectedCategory] = useState(() => getStoredVal('category', 'Todos'));
  const [selectedSubject, setSelectedSubject] = useState(() => getStoredVal('subject', 'Todos'));
  const [selectedScore, setSelectedScore] = useState(() => getStoredVal('score', 'Todos'));

  // --- INFINITE SCROLL STATE ---
  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef(null);

  useEffect(() => sessionStorage.setItem('palmtask_isOpen', String(isFilterOpen)), [isFilterOpen]);
  useEffect(() => sessionStorage.setItem('palmtask_search', searchTerm), [searchTerm]);
  useEffect(() => sessionStorage.setItem('palmtask_cluster', selectedCluster), [selectedCluster]);
  useEffect(() => sessionStorage.setItem('palmtask_category', selectedCategory), [selectedCategory]);
  useEffect(() => sessionStorage.setItem('palmtask_subject', selectedSubject), [selectedSubject]);
  useEffect(() => sessionStorage.setItem('palmtask_score', selectedScore), [selectedScore]);

  const safeVal = (val: string | undefined) => (val || '').trim();

  const clusters = useMemo(() => ['Todos', ...Array.from(new Set(tasks.map(t => safeVal(t.cluster)).filter(Boolean))).sort()], [tasks]);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(tasks.map(t => safeVal(t.category)).filter(Boolean))).sort()], [tasks]);
  const subjects = useMemo(() => ['Todos', ...Array.from(new Set(tasks.map(t => safeVal(t.subject)).filter(Boolean))).sort()], [tasks]);
  const scores = useMemo(() => ['Todos', ...Array.from(new Set(tasks.map(t => safeVal(t.flagScore)).filter(Boolean))).sort()], [tasks]);

  const filtered = useMemo(() => {
    let result = tasks.filter(t => {
        const tCluster = safeVal(t.cluster);
        const tCategory = safeVal(t.category);
        const tSubject = safeVal(t.subject);
        const tScore = safeVal(t.flagScore);
        
        const searchRaw = searchTerm.trim().toLowerCase();
        
        const matchCluster = selectedCluster === 'Todos' || tCluster === selectedCluster;
        const matchCategory = selectedCategory === 'Todos' || tCategory === selectedCategory;
        const matchSubject = selectedSubject === 'Todos' || tSubject === selectedSubject;
        const matchScore = selectedScore === 'Todos' || tScore === selectedScore;
        
        const matchSearch = !searchRaw || 
                            JSON.stringify(t).toLowerCase().includes(searchRaw);
    
        return matchCluster && matchCategory && matchSubject && matchScore && matchSearch;
    });

    if (sortByScore) {
        result = result.sort((a, b) => b.coins - a.coins);
    }

    return result;
  }, [tasks, searchTerm, selectedCluster, selectedCategory, selectedSubject, selectedScore, sortByScore]);

  useEffect(() => {
      setVisibleCount(20);
  }, [filtered.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, filtered.length));
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [filtered]);

  const handleResetFilters = () => {
    setSelectedCluster('Todos'); 
    setSelectedCategory('Todos'); 
    setSelectedSubject('Todos'); 
    setSelectedScore('Todos'); 
    setSearchTerm('');
    setSortByScore(false);
  };

  const handleOpenExportModal = () => {
      // Sync export filters with current view filters initially
      setExportCluster(selectedCluster);
      setExportCategory(selectedCategory);
      setExportSubject(selectedSubject);
      setExportScore(selectedScore);
      setShowExportModal(true);
  };

  const executePDFExport = () => {
    setShowExportModal(false);
    setIsGenerating(true);

    setTimeout(() => {
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString('pt-BR');
            
            // 1. Filter Data based on EXPORT Modal options (filtering ALL tasks, not just visible)
            let itemsToExport = tasks.filter(t => {
                const tCluster = safeVal(t.cluster);
                const tCategory = safeVal(t.category);
                const tSubject = safeVal(t.subject);
                const tScore = safeVal(t.flagScore);

                const matchCluster = exportCluster === 'Todos' || tCluster === exportCluster;
                const matchCategory = exportCategory === 'Todos' || tCategory === exportCategory;
                const matchSubject = exportSubject === 'Todos' || tSubject === exportSubject;
                const matchScore = exportScore === 'Todos' || tScore === exportScore;
                
                return matchCluster && matchCategory && matchSubject && matchScore;
            });

            // 2. Sort Data
            if (exportSortType === 'PDV') {
                itemsToExport.sort((a, b) => {
                    const pdvCompare = a.pdvName.localeCompare(b.pdvName);
                    if (pdvCompare !== 0) return pdvCompare;
                    return b.coins - a.coins;
                });
            } else {
                itemsToExport.sort((a, b) => b.coins - a.coins);
            }

            const totalItems = itemsToExport.length;
            const totalCoins = itemsToExport.reduce((acc, curr) => acc + curr.coins, 0);

            // Brand Header
            doc.setFillColor(0, 0, 0); 
            doc.rect(0, 0, 210, 45, 'F');
            
            doc.setFontSize(24);
            doc.setTextColor(255, 212, 0); 
            doc.setFont('helvetica', 'bold');
            doc.text('PalmTask', 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            doc.text('Relatório de Tarefas', 14, 30);
            
            doc.setFontSize(9);
            doc.setTextColor(200, 200, 200);
            doc.text(`Gerado em: ${date} | Ordenação: ${exportSortType === 'PDV' ? 'Por PDV' : 'Maior Valor'}`, 14, 38);
            
            doc.setFontSize(10);
            doc.setTextColor(255, 212, 0);
            doc.text(`${totalItems} Itens`, 196, 20, { align: 'right' });
            doc.setTextColor(255, 255, 255);
            doc.text(`${totalCoins} Coins Totais`, 196, 30, { align: 'right' });

            // Table Data Mapping
            const tableBody = itemsToExport.map(t => {
                const cleanDesc = t.description ? t.description.replace(/<[^>]*>?/gm, '').substring(0, 150) : '';
                const missingText = t.missingCount && t.missingCount > 0 ? `${t.missingCount} Itens` : '-';
                
                return [
                    t.pdvCode,
                    `${t.pdvName}\n${cleanDesc}`, // Description below name
                    t.category,
                    missingText, // Faltam column
                    t.coins
                ];
            });

            autoTable(doc, {
                startY: 50,
                head: [['Cód.', 'PDV / Detalhe', 'Categoria', 'Faltam', 'Coins']],
                body: tableBody,
                theme: 'grid',
                headStyles: { 
                    fillColor: [20, 20, 20], 
                    textColor: [255, 212, 0],
                    fontStyle: 'bold',
                    lineWidth: 0
                },
                styles: { 
                    fontSize: 8,
                    cellPadding: 3,
                    textColor: [40, 40, 40],
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 22, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }, // Main content gets most space
                    2: { cellWidth: 25 },
                    3: { cellWidth: 20, halign: 'center', textColor: [220, 38, 38] }, // Red text for missing
                    4: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                didParseCell: (data: any) => {
                    if (data.section === 'body') {
                        // Coins column logic
                        const coins = parseInt(String(data.row.raw[4])); 
                        if (coins >= 100) {
                            if (data.column.index === 4) {
                                data.cell.styles.fillColor = [255, 212, 0];
                                data.cell.styles.textColor = [0, 0, 0];
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.fillColor = [255, 250, 220];
                            }
                        }
                    }
                }
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`PalmTask - Vendas & Performance - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            doc.save(`PalmTask_Lista_${Date.now()}.pdf`);
        } catch (e) {
            console.error("PDF Generation Error", e);
            alert("Erro ao gerar PDF.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  const FilterRow = ({ label, options, selected, onSelect }: any) => (
    <div className="flex flex-col gap-2 py-3 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</span>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 px-1 -mx-1">
        {options.map((opt: string) => {
          const isActive = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border shrink-0 active:scale-95 touch-manipulation ${
                isActive 
                ? 'bg-black text-white border-black shadow-lg scale-100' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const visibleTasks = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col min-h-screen bg-background-light">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300 pt-[env(safe-area-inset-top)]">
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">TASKS</h1>
            <div className="flex items-center gap-2">
               {(filtered.length !== tasks.length || searchTerm || sortByScore) && (
                 <button 
                   onClick={handleResetFilters}
                   className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 active:bg-red-50 active:text-red-500 transition-colors touch-manipulation"
                 >
                   <span className="material-icons-round text-lg">close</span>
                 </button>
               )}
               <div className="h-10 px-4 flex items-center bg-primary text-black text-xs font-black rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                  {filtered.length}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="relative group flex-grow">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="material-icons-round text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                </div>
                <input 
                type="text"
                placeholder="Buscar..."
                className="w-full pl-12 pr-4 h-12 bg-slate-50 border-2 border-transparent rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <button
                onClick={() => setSortByScore(!sortByScore)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 border-2 ${
                    sortByScore
                    ? 'bg-black border-black text-primary shadow-lg'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
            >
                <span className="material-icons-round text-xl">
                    {sortByScore ? 'trending_up' : 'sort'}
                </span>
            </button>
          </div>

          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest active:text-black transition-colors touch-manipulation"
          >
            <span className="flex items-center gap-2">
               <span className="material-icons-round text-lg">tune</span>
               Filtros Avançados
            </span>
            <span className={`material-icons-round transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
        </div>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 ${isFilterOpen ? 'max-h-[600px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-5 pb-6 pt-2 space-y-1">
            <FilterRow label="CLUSTER" options={clusters} selected={selectedCluster} onSelect={setSelectedCluster} />
            <FilterRow label="CATEGORIA" options={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            <FilterRow label="ASSUNTO" options={subjects} selected={selectedSubject} onSelect={setSelectedSubject} />
            <FilterRow label="SCORE 5" options={scores} selected={selectedScore} onSelect={setSelectedScore} />
          </div>
        </div>
      </header>

      <main className="px-4 pb-32 pt-6 space-y-4">
        {visibleTasks.length === 0 && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[32px] mx-2">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <span className="material-icons-round text-4xl text-slate-300">filter_list_off</span>
            </div>
            <p className="font-black text-slate-900 text-lg mb-2">Sem resultados</p>
            <button 
              onClick={handleResetFilters}
              className="mt-8 px-8 py-4 bg-black text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-transform touch-manipulation"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
           <>
            {visibleTasks.map((task, index) => (
                <TaskCard 
                    key={`${task.id}-${index}`} 
                    task={task} 
                    onClick={onTaskClick} 
                    imageMap={imageMap} 
                    productImages={productImages} 
                />
            ))}
            {/* Loading Indicator / Observer Target */}
            {visibleCount < filtered.length && (
                <div ref={observerTarget} className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
            )}
           </>
        )}
      </main>

      {/* Export Button */}
      {filtered.length > 0 && (
        <button 
            onClick={handleOpenExportModal}
            disabled={isGenerating}
            className={`fixed bottom-24 right-5 w-14 h-14 rounded-full bg-black text-primary shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center border-2 border-primary z-50 transition-all active:scale-90 active:rotate-12 ${isGenerating ? 'opacity-80 scale-95' : 'hover:scale-105'}`}
        >
            {isGenerating ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <span className="material-icons-round text-2xl">picture_as_pdf</span>
            )}
        </button>
      )}

      {/* PDF Export Config Modal */}
      {showExportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowExportModal(false)}
              ></div>
              <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col max-h-[90vh] relative z-10 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                  
                  {/* Modal Header */}
                  <div className="p-6 pb-2">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                              <span className="material-icons-round text-red-500">picture_as_pdf</span>
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-slate-900 leading-tight">Exportar PDF</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração do Relatório</p>
                          </div>
                      </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto px-6 pb-4 flex-grow space-y-6">
                      
                      {/* Section: Sorting */}
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Ordenação</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setExportSortType('PDV')}
                                className={`p-4 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${exportSortType === 'PDV' ? 'border-black bg-slate-50' : 'border-slate-100 bg-white'}`}
                            >
                                <span className={`material-icons-round mb-2 ${exportSortType === 'PDV' ? 'text-black' : 'text-slate-300'}`}>storefront</span>
                                <span className={`text-[10px] font-black uppercase tracking-wide ${exportSortType === 'PDV' ? 'text-slate-900' : 'text-slate-400'}`}>Por PDV</span>
                            </button>

                            <button 
                                onClick={() => setExportSortType('COINS')}
                                className={`p-4 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${exportSortType === 'COINS' ? 'border-black bg-slate-50' : 'border-slate-100 bg-white'}`}
                            >
                                <span className={`material-icons-round mb-2 ${exportSortType === 'COINS' ? 'text-black' : 'text-slate-300'}`}>monetization_on</span>
                                <span className={`text-[10px] font-black uppercase tracking-wide ${exportSortType === 'COINS' ? 'text-slate-900' : 'text-slate-400'}`}>Maior Valor</span>
                            </button>
                        </div>
                      </div>

                      {/* Section: Filters */}
                      <div>
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Filtros do Relatório</p>
                          <div className="space-y-1 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                              <FilterRow label="CLUSTER" options={clusters} selected={exportCluster} onSelect={setExportCluster} />
                              <FilterRow label="CATEGORIA" options={categories} selected={exportCategory} onSelect={setExportCategory} />
                              <FilterRow label="ASSUNTO" options={subjects} selected={exportSubject} onSelect={setExportSubject} />
                              <FilterRow label="SCORE 5" options={scores} selected={exportScore} onSelect={setExportScore} />
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-100 flex gap-3 bg-white rounded-b-3xl">
                      <button 
                          onClick={() => setShowExportModal(false)}
                          className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 text-xs uppercase tracking-widest active:scale-95 transition-transform"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={executePDFExport}
                          className="flex-1 py-4 rounded-xl font-black text-primary bg-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                          Gerar
                          <span className="material-icons-round text-sm">download</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TasksView;
