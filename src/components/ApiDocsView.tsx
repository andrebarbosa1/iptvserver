import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { Code2, Key, Terminal, Send, Check, Copy, Server, Globe, Lock, ShieldCheck } from 'lucide-react';

interface ApiDocsViewProps {
  settings: SystemSettings;
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ settings }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'login' | 'profile' | 'get_m3u' | 'player_api'>('login');
  const [usernameInput, setUsernameInput] = useState('carlossilva');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'login',
      method: 'POST',
      path: '/api/v1/auth/login',
      title: 'Autenticação JWT',
      desc: 'Realiza login de administradores ou clientes e retorna JWT Bearer Token.'
    },
    {
      id: 'profile',
      method: 'GET',
      path: '/api/v1/user/profile',
      title: 'Perfil do Usuário',
      desc: 'Retorna informações da conta, status da assinatura, expiração e conexões ativas.'
    },
    {
      id: 'get_m3u',
      method: 'GET',
      path: '/get.php?username={u}&password={p}&type=m3u_plus',
      title: 'Xtream M3U Endpoint',
      desc: 'Gera e baixa o arquivo .m3u da lista de canais autorizada do cliente.'
    },
    {
      id: 'player_api',
      method: 'GET',
      path: '/player_api.php?username={u}&password={p}&action=get_live_streams',
      title: 'Xtream Codes API compatível com Android',
      desc: 'Endpoint em formato JSON compatível com aplicativos Android IPTV e ExoPlayer.'
    }
  ];

  const handleTestEndpoint = async () => {
    setIsLoading(true);
    setApiResponse(null);

    try {
      if (selectedEndpoint === 'login') {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        const data = await res.json();
        setApiResponse(JSON.stringify(data, null, 2));
      } else if (selectedEndpoint === 'get_m3u') {
        const res = await fetch(`/get.php?username=${usernameInput}&password=${passwordInput}&type=m3u_plus`);
        const text = await res.text();
        setApiResponse(text);
      } else if (selectedEndpoint === 'player_api') {
        const res = await fetch(`/player_api.php?username=${usernameInput}&password=${passwordInput}&action=get_live_streams`);
        const data = await res.json();
        setApiResponse(JSON.stringify(data, null, 2));
      } else {
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              data: {
                username: usernameInput,
                status: 'active',
                exp_date: '2026-09-01 10:00',
                max_connections: 2,
                active_connections: 1
              }
            },
            null,
            2
          )
        );
      }
    } catch (err: any) {
      setApiResponse(JSON.stringify({ status: 'error', message: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const currentEp = endpoints.find(e => e.id === selectedEndpoint)!;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" /> API REST & Documentação Xtream Codes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Testador interativo de endpoints JWT e formatos Xtream UI para aplicativos Android e Smart TV.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" /> JWT Bearer & HMAC HS256
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoints Selection List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endpoints Disponíveis</h2>
          {endpoints.map(e => {
            const isSelected = selectedEndpoint === e.id;
            return (
              <div
                key={e.id}
                onClick={() => setSelectedEndpoint(e.id as any)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${
                      e.method === 'POST' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {e.method}
                  </span>
                  <span className="font-bold text-xs">{e.title}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{e.desc}</p>
                <code className="block text-[10px] text-indigo-300 font-mono mt-2 bg-slate-950 p-1.5 rounded truncate">
                  {e.path}
                </code>
              </div>
            );
          })}
        </div>

        {/* API Playground Console */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500 text-white">
                {currentEp.method}
              </span>
              <h2 className="text-base font-bold text-white font-mono">{currentEp.path}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentEp.desc}</p>
          </div>

          {/* Input Parameters */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Usuário (Username)</label>
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Senha (Password)</label>
              <input
                type="text"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleTestEndpoint}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Executando requisição...' : 'Executar Requisição de Teste'}
          </button>

          {/* Response Console */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" /> Resposta do Servidor (HTTP 200 OK)
              </span>
              {apiResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiResponse);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {copied ? 'Copiado!' : 'Copiar Resposta'}
                </button>
              )}
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-80 border border-slate-800">
              <code>{apiResponse || '// Clique no botão acima para testar a resposta ao vivo da API...'}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
