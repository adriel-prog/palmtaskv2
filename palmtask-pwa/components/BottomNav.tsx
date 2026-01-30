
import React from 'react';
import { ViewType } from '../types';

interface BottomNavProps {
  activeTab: ViewType;
  onTabChange: (tab: ViewType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: ViewType.HOME, icon: 'dashboard', label: 'Home' },
    { id: ViewType.TASKS, icon: 'assignment', label: 'Tasks' },
    { id: ViewType.NON_BUYERS, icon: 'money_off', label: 'Risco' }, // New Tab
    { id: ViewType.STATS, icon: 'insights', label: 'Stats' },
    { id: ViewType.PROFILE, icon: 'person', label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 px-2 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === ViewType.NON_BUYERS;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1.5 transition-all outline-none p-2 active:scale-90 w-full ${isActive ? (isDanger ? 'text-red-500' : 'text-slate-900') : 'text-slate-300'}`}
            >
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                <span className={`material-icons-round text-[24px] ${isActive ? (isDanger ? 'text-red-500' : 'text-primary') : ''}`}>{tab.icon}</span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
