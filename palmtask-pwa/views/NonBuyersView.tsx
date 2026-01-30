
import React, { useState, useMemo } from 'react';
import { NonBuyer } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NonBuyersViewProps {
  nonBuyers: NonBuyer[];
  userSector: string;
}

const NonBuyersView: React.FC<NonBuyersViewProps> = ({ nonBuyers, userSector }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Normalize search helper
  const clean = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '');

  const filtered = useMemo(() => {
    return nonBuyers.filter(nb => {
      // 1. Filter by Sector if applicable (using flexible matching)
      if (userSector && nb.sector !== userSector) {
         // Optional: decide if you want to be strict about sector matching. 
         // For now, let's show all if userSector doesn't match perfectly, or filter strictly.
         // Let's filter strictly:
         if (nb.sector.trim() !== userSector.trim()) return false;
      }
      
      // 2. Filter by Search
      const s = clean(searchTerm);
      return clean(nb.fantasyName).includes(s) || clean(nb.pdvCode).includes(s);
    });
  }, [nonBuyers, searchTerm, userSector]);

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    
    // Pequeno timeout para permitir que o estado atualize e mostre feedback visual se necessário
    setTimeout(() => {
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString('pt-BR');

            // Header
            doc.setFillColor(0, 0, 0); // Black Header
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setFontSize(22);
            doc.setTextColor(255, 212, 0); // Primary Yellow
            doc.setFont('helvetica', 'bold');
            doc.text('PalmTask', 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            doc.text('Relatório de Não Compradores', 14, 30);

            doc.setFontSize(10);
            doc.text(`Setor: ${userSector || 'Geral'} | Data: ${date}`, 14, 36);

            // Table
            const tableBody = filtered.map(item => [
                item.pdvCode,
                item.fantasyName,
                item.lastVisit,
                item.sector
            ]);

            autoTable(doc, {
                startY: 45,
                head: [['Código', 'Nome Fantasia', 'Última Visita', 'Setor']],
                body: tableBody,
                theme: 'grid',
                headStyles: { 
                    fillColor: [20, 20, 20], 
                    textColor: [255, 212, 0],
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 4
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                }
            });

            doc.save(`NaoCompradores_Setor${userSector}_${Date.now()}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar PDF');
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col pb-32 relative">
       {/* Header */}
       <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-red-100 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <span className="material-icons-round text-red-500">money_off</span>
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recuperação</h1>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Base de Não Compradores</p>
                </div>
            </div>

            <div className="relative mt-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400">search</span>
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou código..." 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-200 focus:ring-4 focus:ring-red-50 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </header>

      <main className="flex-grow px-4 py-6 space-y-3">
        {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <span className="material-icons-round text-6xl text-slate-300 mb-4">check_circle</span>
                <p className="font-bold text-slate-500">Nenhum PDV pendente encontrado.</p>
                <p className="text-xs text-slate-400 mt-1">Ótimo trabalho!</p>
            </div>
        ) : (
            filtered.map((item, idx) => (
                <div key={`${item.pdvCode}-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Risco</span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">#{item.pdvCode}</span>
                        </div>
                        <h3 className="font-black text-slate-900 leading-tight">{item.fantasyName}</h3>
                        <div className="flex items-center gap-1 mt-2 text-slate-500">
                             <span className="material-icons-round text-[14px]">event</span>
                             <span className="text-xs font-medium">Visita: {item.lastVisit}</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 transition-all">
                        <span className="material-icons-round">priority_high</span>
                    </div>
                </div>
            ))
        )}
      </main>

      {/* Floating Action Button (FAB) for PDF */}
      {filtered.length > 0 && (
          <button 
            onClick={handleGeneratePDF}
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
    </div>
  );
};

export default NonBuyersView;
