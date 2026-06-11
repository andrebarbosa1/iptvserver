import React, { useState, useEffect } from "react";
import { 
  Tv, Download, RefreshCw, Check, AlertCircle, FileText, 
  Layers, Settings, PlaySquare, Compass, Eye, ShieldAlert, ArrowRight, Save
} from "lucide-react";
import { Channel } from "../types";

interface M3USyncManagerProps {
  channels: Channel[];
  onImportM3U: (m3uStr: string, replace: boolean) => Promise<{ message: string; importedCount: number }>;
}

export default function M3USyncManager({ channels, onImportM3U }: M3USyncManagerProps) {
  const [syncUrl, setSyncUrl] = useState(() => {
    return localStorage.getItem("iptv_sync_url_source") || "";
  });
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [importMode, setImportMode] = useState<"url" | "text">("url");

  // Output messages metrics
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncHistory, setSyncHistory] = useState<{ date: string; url: string; count: number; mode: string }[]>(() => {
    const saved = localStorage.getItem("iptv_sync_history");
    return saved ? JSON.parse(saved) : [];
  });

  const saveHistory = (urlSource: string, count: number, mode: string) => {
    const newRecord = {
      date: new Date().toLocaleString("pt-BR"),
      url: urlSource || "Texto Copiado Manualmente",
      count,
      mode: mode === "replace" ? "Substituição Total" : "Adição / Mesclagem"
    };
    const updated = [newRecord, ...syncHistory].slice(0, 5);
    setSyncHistory(updated);
    localStorage.setItem("iptv_sync_history", JSON.stringify(updated));
  };

  // Safe remote URL synchronization proxy handler
  const handleRemoteUrlSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncUrl.trim()) return;

    try {
      setLoading(true);
      setFeedback(null);
      
      // Save current URL to localStorage preference
      localStorage.setItem("iptv_sync_url_source", syncUrl);

      const res = await fetch("/api/channels/sync-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: syncUrl, replace: replaceExisting })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Algo deu errado durante a sincronização.");
      }

      setFeedback({
        type: "success",
        text: `Sincronização concluída com sucesso! ${data.count} canais importados e sincronizados com os clientes.`
      });
      saveHistory(syncUrl, data.count, replaceExisting ? "replace" : "append");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Não foi possível conectar com a lista remota."
      });
    } finally {
      setLoading(false);
    }
  };

  // Manual copy-paste handler
  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    try {
      setLoading(true);
      setFeedback(null);
      const res = await onImportM3U(rawText, replaceExisting);
      setFeedback({
        type: "success",
        text: res.message
      });
      saveHistory("", res.importedCount, replaceExisting ? "replace" : "append");
      setRawText("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Erro no processamento da carga em massa."
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate quick metrics
  const uniqueCategories = Array.from(new Set(channels.map((c) => c.category)));
  const vodCount = channels.filter(c => c.isVOD).length;
  const liveCount = channels.filter(c => !c.isVOD).length;

  return (
    <div className="space-y-6" id="m3u-sync-dashboard">
      
      {/* Header Branding Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-sky-400 animate-spin-slow" /> M3U Smart Synchronizer
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Sincronize sua grade de canais e mídias de forma inteligente. Suporta carga em massa via arquivo local ou links remotos do seu servidor IPTV mestre.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border text-xs leading-relaxed animate-fade-in ${
          feedback.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold block text-sm uppercase">
              {feedback.type === "success" ? "Operação Executada" : "Houve um problema"}
            </span>
            <p>{feedback.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT - Setup & Import form */}
        <div className="lg:col-span-8 bg-slate-850 p-6 rounded-xl border border-slate-800 space-y-6">
          <div className="flex border-b border-slate-800 pb-2 flex-wrap gap-2">
            <button
              onClick={() => { setImportMode("url"); setFeedback(null); }}
              className={`p-2 px-4 rounded-lg font-bold text-xs transition cursor-pointer ${
                importMode === "url" ? "bg-sky-550 bg-sky-500 text-white" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              🔗 Sincronizar via URL Remota
            </button>
            <button
              onClick={() => { setImportMode("text"); setFeedback(null); }}
              className={`p-2 px-4 rounded-lg font-bold text-xs transition cursor-pointer ${
                importMode === "text" ? "bg-sky-550 bg-sky-500 text-white" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              📝 Carga em Massa (Copiar & Colar)
            </button>
          </div>

          <div className="space-y-4">
            {importMode === "url" ? (
              <form onSubmit={handleRemoteUrlSync} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Link URL M3U da sua Fonte Master</label>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Insira o link .m3u fornecido pelo seu servidor. Nosso backend buscará os dados filtrando contra limites do navegador automaticamente.
                  </p>
                  <input
                    type="url"
                    required
                    value={syncUrl}
                    onChange={(e) => setSyncUrl(e.target.value)}
                    placeholder="https://exemplo.com/get.php?auth=lista_completa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono transition"
                  />
                </div>

                {/* Sincronização options */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Configuração de Importação</span>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="replace-chk-url"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="replace-chk-url" className="text-xs text-slate-305 text-slate-300 font-semibold cursor-pointer">
                      Substituir canais existentes <span className="text-red-400 text-[10px] block font-medium font-sans mt-0.5">⚠️ Isso apagará canais e mídias atuais antes de importar a fonte nova.</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Lendo e Reconstruindo Playlist...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Sincronizar Fonte M3U Ativa</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleManualImport} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Copiar & Colar Texto M3U</label>
                  <p className="text-[10px] text-slate-500">
                    Insira as linhas das mídias respeitando o padrão #EXTM3U e #EXTINF.
                  </p>
                  <textarea
                    rows={8}
                    required
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="Canais Abertos",GLOBO SP HD\nhttp://exemplo.com/stream.m3u8`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-205 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-sky-500 font-mono transition leading-relaxed"
                  />
                </div>

                {/* Sincronização options */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Configuração de Importação</span>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="replace-chk-text"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 w-4 h-4"
                    />
                    <label htmlFor="replace-chk-text" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Substituir canais existentes <span className="text-red-400 text-[10px] block font-medium font-sans mt-0.5">⚠️ Isso apagará canais e mídias atuais antes de importar a fonte nova.</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Computando Carga...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Processar Importação Manual</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Status details and synchronization history */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CURRENT LIST STATUS DETAILS */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Estado Atual do Acervo</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-3 text-center space-y-1">
                <Compass className="w-5 h-5 text-sky-400 mx-auto" />
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Canais de TV</span>
                <span className="font-extrabold text-white text-lg font-mono">{liveCount}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-3 text-center space-y-1">
                <PlaySquare className="w-5 h-5 text-emerald-400 mx-auto" />
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Filmes & VOD</span>
                <span className="font-extrabold text-white text-lg font-mono">{vodCount}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800/60 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Categorias Ativas:
                </span>
                <span className="font-mono text-white text-xs font-extrabold">{uniqueCategories.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-pink-400" /> Total Mídias:
                </span>
                <span className="font-mono text-white text-xs font-extrabold">{channels.length}</span>
              </div>
            </div>
          </div>

          {/* SYNC HISTORY BOX */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Últimas Sincronizações</h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {syncHistory.length === 0 ? (
                <div className="text-[11px] text-slate-500 text-center py-6">Nenhuma sincronização gravada localmente.</div>
              ) : (
                syncHistory.map((hist, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[10px]">{hist.date}</span>
                      <span className="text-[9px] px-1 text-slate-400 rounded border border-slate-800 font-mono">{hist.count} mídias</span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate font-mono">
                      {hist.url}
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-medium">
                      Modo: {hist.mode}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HELP TIP BOX */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex gap-2.5 text-[11px] text-slate-450 text-slate-400 leading-normal">
            <ShieldAlert className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Como funciona o sincronismo?</strong> Sempre que você atualiza o catálogo, todas as SmartTVs conectadas recebem a lista nova imediatamente. O Token temporário do seu cliente serve como filtro seletivo de segurança.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
