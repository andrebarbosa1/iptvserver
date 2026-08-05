import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CreditCard,
  ListVideo,
  PlaySquare,
  Smartphone,
  Code2,
  Terminal,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database,
  Lock,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: {
    clients: number;
    activeClients: number;
    trials: number;
    playlists: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Painel Master',
      icon: LayoutDashboard,
      badge: null,
      section: 'PAINEL'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      badge: counts.clients,
      section: 'GESTÃO'
    },
    {
      id: 'testes',
      label: 'Testes Grátis',
      icon: Clock,
      badge: counts.trials,
      section: 'GESTÃO'
    },
    {
      id: 'assinaturas',
      label: 'Assinaturas & Planos',
      icon: CreditCard,
      badge: null,
      section: 'GESTÃO'
    },
    {
      id: 'playlists',
      label: 'Playlists M3U',
      icon: ListVideo,
      badge: counts.playlists,
      section: 'CONTEÚDO'
    },
    {
      id: 'player',
      label: 'Web Streaming Player',
      icon: PlaySquare,
      badge: '4K',
      section: 'CLIENTES DE STREAMING'
    },
    {
      id: 'android',
      label: 'App Android & TV Box',
      icon: Smartphone,
      badge: 'Kotlin',
      section: 'CLIENTES DE STREAMING'
    },
    {
      id: 'api',
      label: 'API REST & Xtream',
      icon: Code2,
      badge: 'JWT',
      section: 'DESENVOLVIMENTO'
    },
    {
      id: 'admin',
      label: 'Acesso Admin & 2FA',
      icon: Lock,
      badge: '2FA',
      section: 'SISTEMA'
    },
    {
      id: 'settings',
      label: 'Configurações White Label',
      icon: Settings,
      badge: null,
      section: 'SISTEMA'
    },
    {
      id: 'network',
      label: 'Configurações de Rede & DNS',
      icon: Globe,
      badge: 'Firestore',
      section: 'SISTEMA'
    },
    {
      id: 'logs',
      label: 'Logs & Segurança',
      icon: ShieldCheck,
      badge: null,
      section: 'SISTEMA'
    }
  ];

  // Group by sections
  const sections = Array.from(new Set(menuItems.map(item => item.section)));

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 text-slate-300 flex flex-col justify-between p-3 select-none transition-colors shrink-0">
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] pr-1">
        {sections.map(section => (
          <div key={section} className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400/80 mb-2">
              {section}
            </p>
            {menuItems
              .filter(item => item.section === section)
              .map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-800/80 mt-2">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">Versão do Sistema</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
              v2.4.0 PHP 8.3
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            MySQL 8, JWT REST API, ExoPlayer Android TV & HLS Web Player
          </p>
        </div>
      </div>
    </aside>
  );
};
