
import React, { useState, useEffect } from 'react';
import { Consultant } from '../types';

interface ProfileViewProps {
  onLogout: () => void;
  sector: string;
  onSync?: () => void; 
  lastSync?: string; 
  consultant?: Consultant; // New prop
}

const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, sector, onSync, lastSync, consultant }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    if (window.deferredPrompt) {
      setInstallPrompt(window.deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      window.deferredPrompt = e as any;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = installPrompt || window.deferredPrompt;

    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        window.deferredPrompt = null;
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("📲 Para instalar no iPhone/iPad:\n\n1. Toque no botão Compartilhar (quadrado com seta)\n2. Role para baixo e toque em 'Adicionar à Tela de Início'");
      } else {
        alert("📲 Para instalar:\n\n1. Abra o menu do navegador (três pontos no canto)\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'");
      }
    }
  };

  const avatarSrc = consultant?.avatarBase64 || consultant?.avatarUrl;

  return (
    <div className="min-h-screen bg-background-light pb-32">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <div className="w-10"></div>
          <h2 className="text-base font-black tracking-tight uppercase text-slate-900">Meu Perfil</h2>
          <div className="w-10 h-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">verified</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 text-center">
        <section className="flex flex-col items-center pt-12 pb-8">
          <div className="relative">
            <div className="rounded-full p-1.5 bg-gradient-to-br from-primary to-primary-dark shadow-xl">
              <div className="bg-slate-200 rounded-full h-32 w-32 border-4 border-white overflow-hidden flex items-center justify-center relative">
                 {avatarSrc ? (
                    <img 
                        src={avatarSrc} 
                        alt="Profile" 
                        className="w-full h-full object-cover object-center"
                    />
                 ) : (
                    <span className="material-icons-round text-6xl text-slate-300">person</span>
                 )}
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-primary text-[10px] font-black px-4 py-1.5 rounded-full border-2 border-white shadow-lg tracking-widest uppercase whitespace-nowrap">
              {consultant ? 'REPRESENTANTE' : 'OPERADOR'}
            </div>
          </div>
          <div className="mt-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                {consultant ? consultant.name : 'Representante'}
            </h1>
            <p className="text-slate-400 text-xs font-black mt-2 uppercase tracking-[0.25em]">Setor {sector || 'Não Identificado'}</p>
          </div>
        </section>

        <div className="mt-12 space-y-4 text-left">
           {/* Install Button - ALWAYS VISIBLE unless installed */}
           {!isInstalled && (
             <button 
               onClick={handleInstallClick}
               className="w-full bg-black text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all"
             >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary animate-pulse">
                     <span className="material-icons-round">download</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">App Disponível</p>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Instalar Aplicativo</p>
                  </div>
                </div>
                <span className="material-icons-round text-slate-500 group-hover:text-white transition-colors">chevron_right</span>
             </button>
           )}

           {/* SYNC BUTTON */}
           <button 
               onClick={onSync}
               className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-all"
           >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                   <span className="material-icons-round">cloud_sync</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados</p>
                  <p className="text-sm font-bold text-slate-900">Sincronizar Agora</p>
                  {lastSync && <p className="text-[10px] font-medium text-slate-400 mt-0.5">Última: {lastSync}</p>}
                </div>
              </div>
              <span className="material-icons-round text-slate-300">chevron_right</span>
           </button>
           
           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                 <span className="material-icons-round">sync</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Sincronização</p>
                <p className="text-sm font-bold text-green-600">Conectado (Apenas Leitura)</p>
              </div>
           </div>

           {/* Version Info */}
           <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100 mt-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versão PWA</span>
              <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">v4.7.1</span>
           </div>
        </div>

        <div className="mt-12 mb-8 px-4">
            <button 
              onClick={onLogout}
              className="w-full py-5 rounded-2xl bg-white border-2 border-red-50 text-red-500 text-xs font-black tracking-[0.3em] uppercase shadow-sm active:scale-[0.98] transition-all hover:bg-red-50"
            >
              Log Out
            </button>
        </div>
      </main>
    </div>
  );
};

export default ProfileView;
