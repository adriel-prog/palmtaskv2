
import React, { useState, useRef, useEffect } from 'react';

interface LoginViewProps {
  onLogin: (sector: string, password?: string) => Promise<boolean>;
  checkPasswordRequired: (sector: string) => boolean;
  isLoading?: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, checkPasswordRequired, isLoading = false }) => {
  const [sector, setSector] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'SECTOR' | 'PASSWORD'>('SECTOR');
  const [error, setError] = useState('');
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (step === 'PASSWORD' && passwordInputRef.current) {
          passwordInputRef.current.focus();
      }
  }, [step]);

  const handleNext = async () => {
    setError('');
    
    if (step === 'SECTOR') {
        if (!sector.trim()) return;

        // Check if password is required for this sector (Offline capability supported via prop)
        const isRequired = checkPasswordRequired(sector);
        
        if (isRequired) {
            setStep('PASSWORD');
        } else {
            // No password needed, login directly
            const success = await onLogin(sector);
            if (!success) setError('Falha no login. Verifique o setor.');
        }
    } else {
        // Password step
        if (!password.trim()) {
            setError('Digite sua senha');
            return;
        }
        
        const success = await onLogin(sector, password);
        if (!success) {
            setError('Senha incorreta.');
            setPassword(''); // Clear password on fail
            passwordInputRef.current?.focus();
        }
    }
  };

  const handleBack = () => {
      setStep('SECTOR');
      setPassword('');
      setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleNext();
      }
  };

  return (
    <div className="min-h-screen bg-background-light text-slate-900 font-display relative overflow-hidden flex flex-col items-center justify-center p-8">
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[140%] h-[350px] bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-50"></div>
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center shadow-xl mb-10 transform -rotate-3 transition-transform duration-500 hover:rotate-3">
          <span className="material-symbols-outlined text-primary text-6xl font-bold">analytics</span>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-[-0.05em] uppercase text-black italic">
            PALM<span className="text-primary-dark">TASK</span>
          </h1>
          <div className="flex items-center gap-3 mt-4 justify-center">
            <div className="h-[2px] w-6 bg-black/10"></div>
            <p className="text-black/40 text-[10px] font-black tracking-[0.4em] uppercase">Vendas & Performance</p>
            <div className="h-[2px] w-6 bg-black/10"></div>
          </div>
        </div>

        <div className="w-full space-y-6 relative">
          {/* SECTOR INPUT */}
          <div className={`transition-all duration-300 ${step === 'PASSWORD' ? 'opacity-50 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="flex flex-col group">
                <label className="text-[10px] font-black text-slate-500 mb-2 ml-6 uppercase tracking-[0.2em]">Seu Setor de Atuação</label>
                <div className="relative">
                <input 
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || step === 'PASSWORD'}
                    className="w-full rounded-full border-2 border-slate-100 bg-white px-8 py-5 text-black font-bold placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm disabled:opacity-50" 
                    placeholder="Ex: 305" 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 material-icons-round text-slate-300">room</span>
                </div>
            </div>
          </div>
          
          {/* PASSWORD INPUT - Reveals with animation */}
          <div className={`transition-all duration-500 overflow-hidden ${step === 'PASSWORD' ? 'max-h-[200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
            <div className="flex flex-col mt-2">
                <div className="flex justify-between items-center mb-2 ml-6 mr-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senha Acesso</label>
                     <button onClick={handleBack} className="text-[10px] font-bold text-primary-dark uppercase hover:underline">Alterar Setor</button>
                </div>
                
                <input 
                ref={passwordInputRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full rounded-full border-2 border-slate-100 bg-white px-8 py-5 text-black font-bold placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm" 
                placeholder="••••••••" 
                type="password" 
                inputMode="text"
                />
            </div>
          </div>

          {error && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 animate-pulse">{error}</p>
          )}

          <button 
            onClick={handleNext}
            disabled={!sector || isLoading}
            className={`w-full bg-black text-primary font-black text-lg tracking-[0.1em] py-5 rounded-full shadow-2xl transition-all uppercase mt-6 transform active:scale-95 flex items-center justify-center gap-3 ${(!sector || isLoading) ? 'opacity-30' : 'hover:scale-[1.02]'}`}
          >
            {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Sincronizando...</span>
                </>
            ) : (
                <>
                    {step === 'SECTOR' ? 'Continuar' : 'Acessar App'}
                    <span className="material-icons-round text-lg">{step === 'SECTOR' ? 'arrow_forward' : 'login'}</span>
                </>
            )}
          </button>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
            Sistema de Auditoria de Vendas <br/>
            <span className="text-primary-dark font-black mt-2 inline-block border-b-2 border-primary">Version 4.7.0</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
