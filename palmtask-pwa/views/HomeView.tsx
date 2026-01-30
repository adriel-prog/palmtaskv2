
import React from 'react';
import { Task, Consultant } from '../types';

interface HomeViewProps {
  tasks: Task[];
  userSector: string;
  onRefresh: () => void;
  onTaskClick: (taskId: string) => void;
  consultant?: Consultant; // New prop
}

const HomeView: React.FC<HomeViewProps> = ({ tasks, userSector, onRefresh, onTaskClick, consultant }) => {
  const totalCoins = tasks.reduce((acc, curr) => acc + curr.coins, 0);
  const taskCount = tasks.length;
  // Differentiated treatment for 100+ coins
  const highValueTasks = tasks.filter(t => t.coins >= 100).sort((a, b) => b.coins - a.coins).slice(0, 3);

  // Default display name if no consultant data found
  const displayName = consultant?.name ? consultant.name.split(' ')[0] : `Setor ${userSector}`;

  // Prioritize Base64 image for offline support, fallback to URL
  const avatarSrc = consultant?.avatarBase64 || consultant?.avatarUrl;

  return (
    <div className="px-6 pt-12 pb-32 bg-background-light min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          {avatarSrc ? (
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 shadow-md overflow-hidden relative bg-slate-200">
               <img 
                 src={avatarSrc} 
                 alt={displayName}
                 className="w-full h-full object-cover object-center"
                 onError={(e) => (e.currentTarget.style.display = 'none')}
               />
            </div>
          ) : (
             <div className="bg-black p-2 rounded-lg">
                <span className="material-icons-round text-primary">analytics</span>
             </div>
          )}
          
          <div className="flex flex-col">
              {consultant ? (
                  <>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Bem-vindo,</span>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-none">{displayName}</h2>
                  </>
              ) : (
                  <h2 className="text-xl font-extrabold text-slate-900">PalmTask</h2>
              )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="p-2 rounded-full bg-slate-200 flex items-center justify-center active:rotate-180 transition-transform duration-500"
          >
            <span className="material-icons-round text-xl text-slate-700">refresh</span>
          </button>
          {!consultant && (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md overflow-hidden text-black font-bold text-sm uppercase border-2 border-white">
                {userSector ? `S${userSector.slice(-2)}` : '??'}
            </div>
          )}
        </div>
      </header>

      <section className="mb-8">
        <p className="text-sm font-bold opacity-60 uppercase tracking-widest mb-1 text-slate-500">
           {consultant ? `Setor ${userSector} • Performance` : `Setor ${userSector}`}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Resumo de Hoje</h1>
      </section>

      {/* Primary Highlight Card for Coins >= 100 */}
      {highValueTasks.length > 0 && (
        <section className="mb-6">
          <div 
            onClick={() => onTaskClick(highValueTasks[0].id)}
            className="bg-black p-6 rounded-[24px] shadow-2xl shadow-primary/30 relative overflow-hidden border-4 border-primary cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">MISSÃO DIAMANTE</span>
                <span className="material-icons-round text-primary text-2xl animate-pulse">star</span>
              </div>
              <h2 className="text-white font-black text-2xl leading-tight mb-2">Top: {highValueTasks[0].pdvName}</h2>
              <p className="text-white/60 text-sm font-bold mb-6 line-clamp-2">{highValueTasks[0].description}</p>
              <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                   <span className="material-icons-round text-primary">monetization_on</span>
                   <span className="text-2xl font-black text-primary">{highValueTasks[0].coins} COINS</span>
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase">Prioridade Máxima</div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <span className="material-icons text-[180px] text-primary">emoji_events</span>
            </div>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-icons-round text-primary-dark text-[18px]">monetization_on</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-slate-600">Total Coins</span>
          </div>
          <div className="text-2xl font-black mb-1 text-slate-900">{totalCoins}</div>
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Potencial</p>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="material-icons-round text-blue-500 text-[18px]">assignment</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-slate-600">Tasks</span>
          </div>
          <div className="text-2xl font-black mb-1 text-slate-900">{taskCount}</div>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider text-slate-500">No Setor</p>
        </div>
      </div>

      {/* Recommended List */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Sugestões</h3>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="material-icons-round text-5xl mb-2 text-slate-200">search_off</span>
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Sem tarefas para o setor {userSector}</p>
            </div>
          ) : (
            tasks.slice(0, 8).map((task) => {
              const isHigh = task.coins >= 100;
              return (
                <div 
                  key={task.id} 
                  onClick={() => onTaskClick(task.id)}
                  className={`flex items-center gap-4 p-4 rounded-[20px] border shadow-sm transition-all cursor-pointer active:scale-[0.98] ${isHigh ? 'bg-black border-transparent scale-[1.01]' : 'bg-white border-slate-100'}`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${isHigh ? 'bg-primary text-black' : 'bg-slate-50 text-primary'}`}>
                    <span className="material-icons-round">
                      {task.category.includes('NAB') ? 'local_drink' : 'storefront'}
                    </span>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isHigh ? 'text-white' : 'text-slate-900'}`}>{task.pdvName}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isHigh ? 'bg-primary text-black uppercase' : 'bg-slate-100 text-slate-600'}`}>{task.category}</span>
                      <span className={`text-[10px] font-bold ${isHigh ? 'text-primary' : 'text-slate-400'}`}>+{task.coins} coins</span>
                    </div>
                  </div>
                  <span className={`material-icons-round ${isHigh ? 'text-primary' : 'text-slate-300'}`}>chevron_right</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default HomeView;
