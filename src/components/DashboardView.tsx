import React from 'react';
import { Customer, Trial, Subscription, SystemLog, SystemSettings } from '../types';
import { Users, UserCheck, UserX, Clock, DollarSign, RefreshCw, Activity, Zap, TrendingUp, AlertCircle, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface DashboardViewProps {
  customers: Customer[];
  trials: Trial[];
  subscriptions: Subscription[];
  logs: SystemLog[];
  settings: SystemSettings;
  onNavigateTab: (tab: string) => void;
  onQuickTrial: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  trials,
  subscriptions,
  logs,
  settings,
  onNavigateTab,
  onQuickTrial
}) => {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const expiredCustomers = customers.filter(c => c.status === 'expired').length;
  const trialCustomers = customers.filter(c => c.status === 'trial').length + trials.filter(t => t.status === 'active').length;

  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  // Expiring soon (within next 5 days)
  const expiringSoon = customers.filter(c => {
    if (c.status !== 'active') return false;
    const expDate = new Date(c.expiresAt).getTime();
    const now = new Date().getTime();
    const diffDays = (expDate - now) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 5;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 p-6 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Painel de Controle Master SaaS White Label
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Visão Geral do Servidor de Streaming
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Gerencie seus clientes, playlists M3U, listas de canais autorizadas e renovações de assinatura em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onQuickTrial}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" /> Criar Teste Grátis
            </button>
            <button
              onClick={() => onNavigateTab('clientes')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              Ver Clientes
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Clients */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Clientes</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCustomers}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Cadastrados
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-2">
            <span>Clientes Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCustomers}</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            {totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}% da base
          </div>
        </div>

        {/* Expired Clients */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-2">
            <span>Expirados</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{expiredCustomers}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">Bloqueados auto</div>
        </div>

        {/* In Trial */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-2">
            <span>Em Teste</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{trialCustomers}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Duração limite</div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Assinaturas</span>
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeSubscriptions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Planos vigentes</div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold mb-2">
            <span>Receita Acumulada</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {settings.currency} {totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-indigo-400/80 mt-1">+18.5% este mês</div>
        </div>

        {/* Expiring Soon Alert */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-orange-500/30 hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between text-orange-400 text-xs font-semibold mb-2">
            <span>A Vencer (5 dias)</span>
            <AlertCircle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{expiringSoon.length}</div>
          <div className="text-[11px] text-orange-300/80 mt-1">Renovação pendente</div>
        </div>
      </div>

      {/* Main Dashboard Interactive Section: Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Growth Interactive Chart Visualizer */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Evolução de Vendas e Assinaturas
              </h2>
              <p className="text-xs text-slate-400">Receita acumulada por plano (30, 60, 90, 180, 365 dias)</p>
            </div>
            <div className="text-xs font-mono bg-slate-800 text-indigo-300 border border-slate-700 px-3 py-1 rounded-lg">
              Meta Mensal: R$ 5.000,00
            </div>
          </div>

          {/* Canvas SVG Simulated Responsive Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {[
              { month: 'Jan', val: 1200, count: 32 },
              { month: 'Fev', val: 1850, count: 48 },
              { month: 'Mar', val: 2400, count: 65 },
              { month: 'Abr', val: 2900, count: 78 },
              { month: 'Mai', val: 3400, count: 92 },
              { month: 'Jun', val: 4100, count: 110 },
              { month: 'Jul', val: 4850, count: 135 },
              { month: 'Ago', val: 5400, count: 152 }
            ].map((item, idx) => {
              const maxVal = 6000;
              const heightPct = (item.val / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    R$ {item.val}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-emerald-400 rounded-t-md transition-all group-hover:brightness-125 shadow-lg shadow-indigo-500/10"
                  ></div>
                  <span className="text-xs font-medium text-slate-400">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-around pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-500"></span>
              <span>Plano Mensal (30 dias)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-400"></span>
              <span>Plano Anual (365 dias)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-400"></span>
              <span>Trimestral / Semestral</span>
            </div>
          </div>
        </div>

        {/* Recent Activity / System Logs Panel */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Logs de Eventos do Servidor
              </h2>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                Ver tudo <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                        log.level === 'security'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.level === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {log.event}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-300 font-medium">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    IP: <code className="text-indigo-300">{log.ip}</code> | Usuário: {log.user}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sincronização M3U Ativa
            </span>
            <span>PHP 8.3 REST Engine</span>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert Table */}
      {expiringSoon.length > 0 && (
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Atenção: Clientes Próximos do Vencimento
            </h2>
            <button
              onClick={() => onNavigateTab('clientes')}
              className="text-xs text-indigo-400 hover:underline"
            >
              Gerenciar todos os clientes &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800/80 uppercase font-semibold text-slate-400">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Data de Expiração</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expiringSoon.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{c.name}</td>
                    <td className="p-3 font-mono text-indigo-300">{c.username}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3 text-amber-400 font-semibold">{c.expiresAt}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onNavigateTab('clientes')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-semibold"
                      >
                        Renovar Agora
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
