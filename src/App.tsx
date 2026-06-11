import React, { useState, useEffect } from "react";
import { 
  Tv, Users, Radio, FileText, LayoutDashboard, Menu, X, 
  Settings, Activity, Play, AlertCircle, RefreshCw, ShieldAlert,
  MessageSquare, DollarSign, Coins
} from "lucide-react";

import { Client, Channel, ClientStats } from "./types";
import Dashboard from "./components/Dashboard";
import ClientsManager from "./components/ClientsManager";
import ChannelsManager from "./components/ChannelsManager";
import MiniPlayer from "./components/MiniPlayer";
import ManualGuia from "./components/ManualGuia";
import SecurityManager from "./components/SecurityManager";
import WebWatchPlayer from "./components/WebWatchPlayer";
import PublicTrialRequest from "./components/PublicTrialRequest";

import WhatsAppManager from "./components/WhatsAppManager";
import M3USyncManager from "./components/M3USyncManager";
import FinanceManager from "./components/FinanceManager";
import ResellerCreditManager from "./components/ResellerCreditManager";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("painel");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parse URL query options to enable instant client redirection (e.g. play=TOKEN or teste=1)
  const [playToken, setPlayToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("play") || params.get("token") || params.get("assistir");
  });

  const [showPublicTrial, setShowPublicTrial] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("teste") || params.has("trial");
  });

  // Core full-stack state
  const [clients, setClients] = useState<Client[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    trialClients: 0,
    expiredClients: 0,
    suspendedClients: 0,
    totalChannels: 0,
    liveChannelsCount: 0,
    vodCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  // Sync operations
  const fetchAllData = async () => {
    try {
      setErrorStr(null);
      const [resClients, resChannels, resStats] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/channels"),
        fetch("/api/stats")
      ]);

      if (!resClients.ok || !resChannels.ok || !resStats.ok) {
        throw new Error("Não foi possível conectar-se ao servidor de IPTV.");
      }

      const clientsData = await resClients.json();
      const channelsData = await resChannels.json();
      const statsData = await resStats.json();

      setClients(clientsData);
      setChannels(channelsData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Data syncing failed", err);
      setErrorStr("Erro ao conectar-se com o backend. O aplicativo iniciou em modo de segurança (local).");
      // Fallback static fallback so app maintains execution if any network block occurs
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddClient = async (clientPayload: Omit<Client, "id" | "createdAt">) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientPayload)
      });
      if (!res.ok) throw new Error("Erro ao salvar dados do cliente.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro inesperado.");
    }
  };

  const handleUpdateClient = async (id: string, updatedPayload: Partial<Client>) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });
      if (!res.ok) throw new Error("Erro ao atualizar o cliente.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro de rede.");
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erro ao excluir o cliente do servidor.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro de rede.");
    }
  };

  const handleAddChannel = async (channelPayload: Omit<Channel, "id">) => {
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channelPayload)
      });
      if (!res.ok) throw new Error("Erro ao salvar mídia.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Falha ao gravar canal.");
    }
  };

  const handleUpdateChannel = async (id: string, updatedPayload: Partial<Channel>) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });
      if (!res.ok) throw new Error("Erro ao editar dados do canal.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro.");
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erro ao remover canal da grade.");
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro de comunicação.");
    }
  };

  const handleImportM3U = async (m3uStr: string, replace: boolean) => {
    const res = await fetch("/api/channels/import-m3u", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ m3u: m3uStr, replace })
    });
    
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (!res.ok) {
        throw new Error(`Erro no servidor (${res.status}): A lista enviada pode ser muito pesada, gerando lentidão no servidor.`);
      }
      throw new Error("Erro de comunicação: resposta inválida do servidor.");
    }

    if (!res.ok) {
      throw new Error(data.error || "Formato M3U inválido ou erro no processador.");
    }

    await fetchAllData();
    return data;
  };

  // Direct Bypass for Client Web Watch Player
  if (playToken) {
    return (
      <WebWatchPlayer 
        token={playToken} 
        onExit={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("play");
          url.searchParams.delete("token");
          url.searchParams.delete("assistir");
          window.history.pushState({}, "", url.toString());
          setPlayToken(null);
        }} 
      />
    );
  }

  // Direct Bypass for Automated Public 4-Hour Trial Solicitation page
  if (showPublicTrial) {
    return (
      <PublicTrialRequest 
        onSuccess={(token) => {
          const url = new URL(window.location.href);
          url.searchParams.set("play", token);
          url.searchParams.delete("teste");
          url.searchParams.delete("trial");
          window.history.pushState({}, "", url.toString());
          setPlayToken(token);
          setShowPublicTrial(false);
        }}
        onExit={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("teste");
          url.searchParams.delete("trial");
          window.history.pushState({}, "", url.toString());
          setShowPublicTrial(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0 z-30 transition-all ${mobileMenuOpen ? 'block' : 'hidden md:flex flex-col'}`} id="main-sidebar">
        {/* Sidebar Brand header logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-500/10 text-sky-400 p-2 rounded-xl border border-sky-500/20 shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base leading-snug">Painel IPTV</h1>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Servidor Online
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-100 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto animate-fade-in" id="sidebar-nav">
          {[
            { id: "painel", label: "Painel & Visão Geral", icon: LayoutDashboard },
            { id: "clientes", label: "Clientes & Vendas", icon: Users },
            { id: "canais", label: "Canais & Mídias M3U", icon: Tv },
            { id: "m3u-sync", label: "Sincronizador M3U", icon: RefreshCw },
            { id: "mensagens", label: "Central de Mensagens", icon: MessageSquare },
            { id: "financeiro", label: "Controle Financeiro", icon: DollarSign },
            { id: "revendedores", label: "Sub-Revendedores", icon: Coins },
            { id: "player", label: "IPTV Player Monitor", icon: Play },
            { id: "guia", label: "Guia Oficial M3U", icon: FileText },
            { id: "seguranca", label: "Segurança & Backups", icon: ShieldAlert },
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition cursor-pointer ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/15'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
                id={`nav-${item.id}`}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer developer identifier panel */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/50 text-[11px] text-slate-500 space-y-1 select-none">
          <div>Suporte & Integração</div>
          <div className="text-slate-400 font-mono text-[10px] truncate select-all">{baseUrl}</div>
        </div>
      </aside>

      {/* MOBILE CONTAINER HEADER */}
      <header className="md:hidden bg-slate-950 border-b border-slate-850 p-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="font-extrabold text-slate-100 tracking-tight">Gestor IPTV</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-slate-350 hover:text-slate-100 p-1 bg-slate-900 border border-slate-800 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-slate-400 text-sm">Carregando dados do servidor de canais...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {errorStr && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-2.5 text-xs text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorStr}</span>
              </div>
            )}

            {activeTab === "painel" && (
              <Dashboard 
                stats={stats} 
                clients={clients} 
                channels={channels} 
                setActiveTab={setActiveTab} 
              />
            )}

            {activeTab === "clientes" && (
              <ClientsManager
                clients={clients}
                channels={channels}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                baseUrl={baseUrl}
              />
            )}

            {activeTab === "canais" && (
              <ChannelsManager
                channels={channels}
                onAddChannel={handleAddChannel}
                onUpdateChannel={handleUpdateChannel}
                onDeleteChannel={handleDeleteChannel}
                onImportM3U={handleImportM3U}
              />
            )}

            {activeTab === "m3u-sync" && (
              <M3USyncManager
                channels={channels}
                onImportM3U={handleImportM3U}
              />
            )}

            {activeTab === "mensagens" && (
              <WhatsAppManager
                clients={clients}
                baseUrl={baseUrl}
              />
            )}

            {activeTab === "financeiro" && (
              <FinanceManager
                clients={clients}
              />
            )}

            {activeTab === "revendedores" && (
              <ResellerCreditManager />
            )}

            {activeTab === "player" && (
              <MiniPlayer channels={channels} />
            )}

            {activeTab === "guia" && (
              <ManualGuia />
            )}

            {activeTab === "seguranca" && (
              <SecurityManager />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
