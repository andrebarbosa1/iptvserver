import React from 'react';
import { SystemLog } from '../types';
import { ShieldCheck, ShieldAlert, Activity, Lock, Terminal, Filter } from 'lucide-react';

interface LogsViewProps {
  logs: SystemLog[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Logs do Sistema, Auditoria & Segurança PHP 8.3
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro em tempo real de autenticações JWT, tentativas de acesso, renovações e disparos de Rate Limit.
          </p>
        </div>
      </div>

      {/* Security Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/20">
          <div className="text-slate-400 font-semibold mb-1">Algoritmo de Senha</div>
          <div className="text-base font-bold text-emerald-400">BCrypt (Cost 12)</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Password_hash PHP 8.3</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/20">
          <div className="text-slate-400 font-semibold mb-1">Sessões & JWT</div>
          <div className="text-base font-bold text-indigo-300">HMAC-SHA256</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Expiração 24h Bearer</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-sky-500/20">
          <div className="text-slate-400 font-semibold mb-1">Proteção SQL</div>
          <div className="text-base font-bold text-sky-400">PDO Prepared Stmts</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Zero SQL Injection</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/20">
          <div className="text-slate-400 font-semibold mb-1">Rate Limit API</div>
          <div className="text-base font-bold text-amber-400">120 Req/min</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Bloqueio anti-DDoS</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Registro de Atividades e Eventos de Segurança
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/80 uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Nível</th>
                <th className="p-3">Evento</th>
                <th className="p-3">Usuário</th>
                <th className="p-3">IP do Cliente</th>
                <th className="p-3">Detalhes do Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.level === 'security'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.level === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white font-mono">{log.event}</td>
                  <td className="p-3 text-indigo-300 font-semibold">{log.user}</td>
                  <td className="p-3 font-mono text-slate-400">{log.ip}</td>
                  <td className="p-3 text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
