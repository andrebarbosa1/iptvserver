import React from 'react';
import { Users, Tv, Film, Calendar, AlertCircle, Clock, ShieldAlert, Zap, Globe, Package, RefreshCw, Check, Copy, ExternalLink } from 'lucide-react';
import { Client, Channel, ClientStats } from '../types';

interface DashboardProps {
  stats: ClientStats;
  clients: Client[];
  channels: Channel[];
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ stats, clients, channels, setActiveTab }: DashboardProps) {
  const [trialResult, setTrialResult] = React.useState<any | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/?teste=1`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPlaylist = (token: string) => {
    const link = `${window.location.origin}/playlist/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleQuickTrialGenerate = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/trials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Teste Expresso (${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})` })
      });
      if (!res.ok) throw new Error("Erro de resposta do servidor.");
      const data = await res.json();
      setTrialResult(data);
    } catch (err: any) {
      alert("Erro ao instanciar teste automático: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Compute some quick analytics
  const upcomingExpirations = clients.filter(c => {
    const today = new Date();
    const exp = new Date(c.expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5 && c.status === 'active';
  });

  const categories = Array.from(new Set(channels.map(ch => ch.category)));

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight" id="dash-title">Painel de Controle</h2>
        <p className="text-slate-400 text-sm">Resumo da sua operação de transmissão e gerenciamento de IPTV.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20" id="stat-active-users">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Clientes Ativos</span>
            <div className="text-3xl font-bold text-slate-100">{stats.activeClients}</div>
            <p className="text-xs text-slate-400">Suporte a streaming liberado</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20" id="stat-trial-users">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Contas Teste</span>
            <div className="text-3xl font-bold text-slate-100">{stats.trialClients}</div>
            <p className="text-xs text-slate-400">Demonstrações temporárias</p>
          </div>
          <div className="bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 text-sky-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20" id="stat-expired-users">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">Expirados / Vencidos</span>
            <div className="text-3xl font-bold text-slate-100">{stats.expiredClients}</div>
            <p className="text-xs text-slate-400">Acesso bloqueado na M3U</p>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/20" id="stat-channels">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Canais Globais</span>
            <div className="text-3xl font-bold text-slate-100">{stats.totalChannels}</div>
            <p className="text-xs text-slate-400">
              {stats.liveChannelsCount} TV | {stats.vodCount} VODs
            </p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-400">
            <Tv className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts and expirations column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications area */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20" id="expirations-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base">Vencimentos Próximos (Próximos 5 dias)</h3>
              </div>
              <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {upcomingExpirations.length} Alerta(s)
              </span>
            </div>

            {upcomingExpirations.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Nenhum cliente prestes a expirar nos próximos 5 dias! Ótimo trabalho.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[280px] overflow-y-auto pr-1 space-y-3">
                {upcomingExpirations.map(client => {
                  const expDate = new Date(client.expirationDate);
                  const today = new Date();
                  const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={client.id} className="flex items-center justify-between pt-3 first:pt-0">
                      <div>
                        <h4 className="font-medium text-slate-200 text-sm">{client.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{client.phone || client.email}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3" /> {client.expirationDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
                          Expira em {diff === 0 ? "Hoje" : `${diff} dias`}
                        </span>
                        <button
                          onClick={() => setActiveTab('clientes')}
                          className="block text-xs text-sky-400 hover:underline mt-1 font-medium transition cursor-pointer"
                        >
                          Gerenciar Cliente
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guidelines on IPTV architecture */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20" id="iptv-intro-card">
            <h3 className="font-bold text-slate-100 text-base mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" /> Como Funciona o Sistema M3U Dinâmico?
            </h3>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                Cada cliente cadastrado no sistema recebe uma chave de acesso única e exclusiva (<strong>Token M3U</strong>).
                Com esse token, o sistema gera o endereço final da lista:
              </p>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-xs text-sky-400 select-all overflow-x-auto">
                {window.location.origin}/playlist/[TOKEN-DO-CLIENTE]
              </div>
              <p>
                Ao conectar este link em qualquer aplicativo IPTV (Smarters, SSIPTV, etc.), o app fará consultas periódicas ao nosso servidor. 
                O backend do <strong>Gestor IPTV</strong> faz o seguinte trabalho:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                <li><strong className="text-slate-300">Validação Automática:</strong> Se a conta do cliente expirar no calendário ou estiver desativada, a M3U gerada no player passa a exibir automaticamente apenas canais de aviso de cobrança.</li>
                <li><strong className="text-slate-300">Filtro de Categorias:</strong> O cliente receberá no aplicativo apenas as categorias (Esportes, Filmes, ETC) selecionadas nas configurações de sua conta, possibilitando a venda de pacotes básicos ou premium.</li>
                <li><strong className="text-slate-100">Atualização em Tempo Real:</strong> Novos canais adicionados por você ao painel aparecem imediatamente no aplicativo do seu cliente, sem que devesse enviar um novo link!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick actions & category breakdown */}
        <div className="space-y-6">
          {/* Quick Trial Generator and Capturer card */}
          <div className="bg-slate-850 border border-indigo-950/20 rounded-xl p-5 shadow-lg shadow-black/20 relative overflow-hidden" id="trial-generator-card">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full pointer-events-none" />
            
            <h3 className="font-bold text-slate-100 text-base mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400 animate-pulse" /> Captura & Testes de 4 Horas
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Gere demonstrações temporárias expressas ou envie o link do formulário de teste público para os seus clientes.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleQuickTrialGenerate}
                disabled={generating}
                className="w-full bg-sky-550 hover:bg-sky-500 bg-sky-600 hover:bg-sky-500 border border-sky-700/50 hover:border-sky-600 text-slate-100 font-bold py-2.5 px-3 text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Criando Teste...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Gerar Teste Expresso (4h)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyPublicLink}
                className={`w-full py-2.5 px-3 text-xs rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  copiedLink 
                    ? 'bg-emerald-500/10 border-emerald-550/20 text-emerald-400' 
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-350 hover:text-slate-200'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Gerador Público"}</span>
              </button>
            </div>

            {/* Trial Generation Results popup-card inside */}
            {trialResult && (
              <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest font-mono">TESTE CRIADO COM SUCESSO</span>
                  <button 
                    onClick={() => setTrialResult(null)}
                    className="text-slate-500 hover:text-slate-350 text-[10px]"
                  >
                    Fechar
                  </button>
                </div>

                <div className="text-xs font-medium space-y-1 text-slate-300">
                  <div><span className="text-slate-550 text-slate-500">Nome:</span> {trialResult.client.name}</div>
                  <div><span className="text-slate-550 text-slate-500 font-mono">Token:</span> <span className="font-mono text-amber-400">{trialResult.client.token}</span></div>
                  <div><span className="text-slate-550 text-slate-500">Validade:</span> 4 Horas</div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleCopyPlaylist(trialResult.client.token)}
                    className={`p-2 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${
                      copiedToken
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {copiedToken ? "Copiado!" : "Copiar M3U"}
                  </button>

                  <a
                    href={`/?play=${trialResult.client.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded-lg text-[10px] font-bold transition text-center flex items-center justify-center gap-1"
                  >
                    Abrir Player <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20" id="quick-links-card">
            <h3 className="font-bold text-slate-100 text-base mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" /> Atalhos Rápidos
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setActiveTab('clientes')}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-3 rounded-lg hover:bg-slate-800 transition text-left cursor-pointer text-slate-300 hover:text-slate-100 text-sm group"
                id="quick-link-add-user"
              >
                <div className="bg-sky-500/10 text-sky-400 p-2 rounded group-hover:bg-sky-500/20 transition">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Cadastrar Cliente</div>
                  <div className="text-xs text-slate-500">Adicionar novo pagador ou teste</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('canais')}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-lg hover:bg-slate-800 transition text-left cursor-pointer text-slate-300 hover:text-slate-100 text-sm group"
                id="quick-link-add-channel"
              >
                <div className="bg-amber-500/10 text-amber-400 p-2 rounded group-hover:bg-amber-500/20 transition">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Cadastrar Canais</div>
                  <div className="text-xs text-slate-500">Adicionar stream ou importar M3U</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('player')}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-lg hover:bg-slate-800 transition text-left cursor-pointer text-slate-300 hover:text-slate-100 text-sm group"
                id="quick-link-player"
              >
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded group-hover:bg-emerald-500/20 transition">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">IPTV Player Integrado</div>
                  <div className="text-xs text-slate-500">Visualizar links e testar online</div>
                </div>
              </button>
            </div>
          </div>

          {/* Packages catalog distributions */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20" id="categories-breakdown-card">
            <h3 className="font-bold text-slate-100 text-base mb-3">Divisão por Categorias</h3>
            <div className="space-y-3">
              {categories.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">Nenhuma categoria registrada.</div>
              ) : (
                categories.map(cat => {
                  const count = channels.filter(ch => ch.category === cat).length;
                  const percent = Math.round((count / channels.length) * 100) || 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span>{cat}</span>
                        <span className="text-slate-400">{count} item(ns) ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/50">
                        <div
                          className="bg-sky-500 h-1.5 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
