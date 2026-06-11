import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, RefreshCw, Trash2, Download, Upload, CheckCircle, 
  XOctagon, Clock, User, Globe, AlertTriangle, Terminal, Cpu, HardDrive
} from "lucide-react";
import { AccessLog } from "../types";

export default function SecurityManager() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Fetch access logs
  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setLogs(data);
      }
    } catch (err) {
      console.error("Falha ao buscar logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-update logs every 15 seconds to simulate real-time logging activity
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    if (!confirm("Tem certeza de que deseja apagar permanentemente todo o histórico de logs de conexão?")) {
      return;
    }
    try {
      const res = await fetch("/api/logs/clear", { method: "POST" });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      alert("Erro ao limpar logs");
    }
  };

  const handleDownloadBackup = () => {
    window.open("/api/backup/download", "_blank");
  };

  // Restore backup from uploaded JSON file
  const handleRestoreBackupFile = async (file: File) => {
    try {
      setRestoreMessage(null);
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        setRestoreMessage({ type: 'error', text: "O arquivo enviado não é um arquivo JSON válido." });
        return;
      }

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });

      if (res.ok) {
        const result = await res.json();
        setRestoreMessage({ 
          type: 'success', 
          text: `Backup restaurado com sucesso! Carregados ${result.clientsCount} clientes e ${result.channelsCount} canais/VODs.` 
        });
        // Force refresh all UI data if any
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await res.json();
        setRestoreMessage({ type: 'error', text: errorData.error || "Formato de backup inválido." });
      }
    } catch (err) {
      setRestoreMessage({ type: 'error', text: "Ocorreu um erro no carregamento do arquivo." });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRestoreBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleRestoreBackupFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6" id="security-manager">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-sky-400" />
          Segurança, Backup & Logs de Auditoria
        </h2>
        <p className="text-slate-400 text-sm">
          Monitore o tráfego de conexões das listas M3U em tempo real, faça download de backups seguros e garanta a integridade dos dados da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Backup Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Backup Action Panel */}
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/15 text-sky-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Cópia de Segurança</h3>
                <p className="text-[11px] text-slate-500">Salve seus dados fora do servidor local</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema armazena automaticamente os clientes, canais, listas importadas e logs em uma base de dados local. Você pode exportar essa base para um arquivo JSON em seu computador a qualquer momento.
            </p>

            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Backup Local (.JSON)
            </button>
          </div>

          {/* Restore Database Panel */}
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/15 text-amber-500">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Restaurar Banco de Dados</h3>
                <p className="text-[11px] text-slate-500">Substitua ou clone configurações IPTV</p>
              </div>
            </div>

            <form 
              onDragEnter={handleDrag} 
              onDragOver={handleDrag} 
              onDragLeave={handleDrag} 
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition duration-150 relative ${
                dragActive ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Arraste ou selecione o backup JSON"
              />
              <Upload className="w-8 h-8 text-slate-505 mx-auto mb-2.5 text-slate-500" />
              <p className="text-xs text-slate-300 font-medium">Solte o arquivo de backup aqui</p>
              <p className="text-[10px] text-slate-500 mt-1">ou clique para encontrar no computador</p>
            </form>

            {restoreMessage && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                restoreMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-450 text-rose-400'
              }`}>
                {restoreMessage.text}
              </div>
            )}
            
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed select-none">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>AVISO CRÍTICO:</strong> A restauração de um arquivo de backup substituirá 100% de clientes, canais e logs atuais no servidor de forma irreversível.
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Access Logs Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col min-h-[500px]">
            {/* Logs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400 border border-purple-500/15">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Tráfego de Playlist M3U</h3>
                  <p className="text-[11px] text-slate-500">Monitorando requisições ao vivo na porta HTTP</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchLogs}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs cursor-pointer transition font-medium"
                  title="Atualizar Logs"
                >
                  <RefreshCw className="w-3 h-3" /> Atualizar
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition font-medium ${
                    logs.length === 0 
                      ? 'bg-slate-900 text-slate-600 border border-slate-800/50 cursor-not-allowed' 
                      : 'bg-rose-950/40 text-rose-400 hover:bg-rose-950 hover:text-white border border-rose-950'
                  }`}
                  title="Limpar Histórico"
                >
                  <Trash2 className="w-3 h-3" /> Limpar Logs
                </button>
              </div>
            </div>

            {/* Table or Loading State */}
            {loadingLogs && logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
                <span className="text-xs">Buscando tráfego do servidor...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-2 select-none">
                <CheckCircle className="w-10 h-10 text-slate-600 mb-1" />
                <p className="font-semibold text-slate-400 text-sm">Sem tráfego recente</p>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Os logs serão gravados à medida que dispositivos externos (IPTV Smarters, VLC, Smart TVs) fizerem requisições de download das playlists usando os tokens dos clientes.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider bg-slate-900/40">
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Origem M3U</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Endereço IP</th>
                      <th className="py-2.5 px-3">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {logs.map((log) => {
                      let statusBadge = null;
                      if (log.status === "success") {
                        statusBadge = <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded font-bold text-[10px]">SUCCESS</span>;
                      } else if (log.status === "expired") {
                        statusBadge = <span className="text-rose-400 bg-rose-500/10 border border-rose-500/15 px-1.5 py-0.5 rounded font-bold text-[10px]">EXPIRADO</span>;
                      } else if (log.status === "suspended") {
                        statusBadge = <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/15 px-1.5 py-0.5 rounded font-bold text-[10px]">BLOQUEADO</span>;
                      } else {
                        statusBadge = <span className="text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold text-[10px]">AVISO: TOKEN_INV_</span>;
                      }

                      // Parse user agent to standard play client name
                      let playerType = "Player IPTV";
                      const ua = log.userAgent.toLowerCase();
                      if (ua.includes("smarters")) playerType = "IPTV Smarters";
                      else if (ua.includes("vlc")) playerType = "VLC Media Player";
                      else if (ua.includes("gse")) playerType = "GSE IPTV";
                      else if (ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari")) playerType = "Navegador Web / Player";
                      else if (ua.includes("ssiptv")) playerType = "SS IPTV App";
                      else if (ua.includes("ott")) playerType = "OTT Navigator";
                      else if (ua.length > 25) playerType = log.userAgent.slice(0, 22) + "...";
                      else playerType = log.userAgent;

                      return (
                        <tr key={log.id} className="hover:bg-slate-900/60 transition duration-100">
                          <td className="py-3 px-3 text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-sans font-medium" title={log.userAgent}>
                            {playerType}
                          </td>
                          <td className="py-3 px-3 text-sky-400 font-sans" title={`Token: ${log.token}`}>
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="truncate max-w-[120px] font-semibold">{log.clientName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-450 text-slate-500 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                            {log.ip}
                          </td>
                          <td className="py-3 px-3">{statusBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-slate-500 select-none">
              <Cpu className="w-4 h-4 text-sky-500/70" />
              <span>
                Monitor de Conexões atualizado ao vivo (a cada 15 segundos). Use essa tabela para auditar compartilhamentos ilegais de IPs duplicados ou tentativas de acesso de ex-clientes vencidos.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
