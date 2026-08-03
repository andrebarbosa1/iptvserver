import React from 'react';
import { SystemSettings, AdminUser, AdminSession } from '../types';
import { Sun, Moon, Shield, Tv, Plus, Zap, UserCheck, Bell, Sparkles, Database, Lock, LogOut } from 'lucide-react';

interface NavbarProps {
  settings: SystemSettings;
  adminUser: AdminUser;
  session: AdminSession;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onOpenQuickTrialModal: () => void;
  onOpenQuickCustomerModal: () => void;
  onOpenAdminAuth: () => void;
  onLockSession: () => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  adminUser,
  session,
  onUpdateSettings,
  onOpenQuickTrialModal,
  onOpenQuickCustomerModal,
  onOpenAdminAuth,
  onLockSession,
  activeView,
}) => {
  const toggleTheme = () => {
    onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              {settings.brandName}
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                White Label PHP 8.3
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Servidor DNS: <code className="text-indigo-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono text-[11px]">{settings.dnsServerUrl}</code>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Action Buttons */}
        <button
          onClick={onOpenQuickTrialModal}
          className="hidden md:flex items-center gap-2 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          Gerar Teste Grátis
        </button>

        <button
          onClick={onOpenQuickCustomerModal}
          className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>

        {/* Status Security Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-indigo-300">Firestore Cloud DB</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title="Alternar Tema Claro / Escuro"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Admin Profile & Lock Button */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          {session.isAuthenticated && !session.isLocked && (
            <button
              onClick={onLockSession}
              title="Bloquear Painel de Controle"
              className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenAdminAuth}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left"
            title="Acessar Gerenciamento de Administrador"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300 shadow-sm relative">
              ADM
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${session.isAuthenticated && !session.isLocked ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </div>
            <div className="hidden xl:block">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                {adminUser.name || 'Admin Master'}
                {session.isAuthenticated && !session.isLocked ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-extrabold uppercase">JWT OK</span>
                ) : (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-extrabold uppercase">LOCKED</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">{adminUser.email || 'admin@streamflow.com'}</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
