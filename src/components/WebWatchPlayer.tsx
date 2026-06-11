import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Tv, Film, Copy, Check, Clock, AlertTriangle, 
  Search, ShieldAlert, LogOut, ChevronLeft, Volume2, Maximize, RefreshCw 
} from "lucide-react";
import { Channel } from "../types";

interface WebWatchPlayerProps {
  token: string;
  onExit: () => void;
}

interface ClientData {
  name: string;
  expirationDate: string;
  subscriptionType: string;
  status: string;
  token: string;
}

export default function WebWatchPlayer({ token, onExit }: WebWatchPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientData | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [copiedM3u, setCopiedM3u] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch playlist json for the customer key token
  const loadPlaylist = async () => {
    try {
      setLoading(true);
      setErrorStr(null);
      const res = await fetch(`/api/playlist-json/${token}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Código de acesso expirado, suspenso ou inexistente.");
      }
      const data = await res.json();
      setClientInfo(data.client);
      setChannels(data.channels);
      
      if (data.channels.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || "Erro de rede ao conectar à transmissão do webplayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [token]);

  // Live Timer Countdown for trial accounts
  useEffect(() => {
    if (!clientInfo) return;

    const timer = setInterval(() => {
      const expDateStr = clientInfo.expirationDate;
      if (!expDateStr) {
        setTimeRemaining("Acesso ilimitado");
        return;
      }

      const isTimestamp = expDateStr.includes("T") || expDateStr.includes(":");
      const now = new Date().getTime();
      const expTime = new Date(expDateStr).getTime();
      const diff = expTime - now;

      if (diff <= 0) {
        setTimeRemaining("Acesso Expirado!");
        clearInterval(timer);
        return;
      }

      if (!isTimestamp) {
        // Standard day-by-day comparison
        const todayStr = new Date().toISOString().split("T")[0];
        if (expDateStr < todayStr) {
          setTimeRemaining("Acesso expirado");
        } else {
          // Calculate remaining calendar days
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          setTimeRemaining(`${days} dia(s) restante(s)`);
        }
      } else {
        // 4-Hour accurate dynamic hour counts
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n: number) => String(n).padStart(2, "0");
        setTimeRemaining(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [clientInfo]);

  // Handle source and video player playing states resets
  useEffect(() => {
    setIsPlaying(false);
    setPlayerError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [selectedChannel]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setPlayerError(null);
        })
        .catch((err) => {
          console.error("Watch playback failed", err);
          setIsPlaying(false);
          
          if (selectedChannel?.url.endsWith(".m3u8")) {
            setPlayerError(
              "Dica do Navegador: Para assistir canais .M3U8 transmitidos ao vivo direto no Chrome, instale a extensão gratuita Google Chrome 'Native HLS Playback' ou 'HLS Player'. Alternativamente, adicione o link M3U em players como VLC ou SmartTV."
            );
          } else {
            setPlayerError(
              "Erro ao iniciar o sinal de vídeo. Verifique se o link possui restrições de CORS ou teste outra transmissão da grade."
            );
          }
        });
    }
  };

  const handleCopyM3uUrl = () => {
    const fullUrl = `${window.location.origin}/playlist/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedM3u(true);
    setTimeout(() => setCopiedM3u(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4 font-sans select-none">
        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Conectando ao sinal de transmissão...</p>
      </div>
    );
  }

  if (errorStr) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-5 font-sans">
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl max-w-md text-center space-y-4">
          <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto animate-bounce" />
          <div>
            <h3 className="text-lg font-bold text-slate-100">Acesso Restrito</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {errorStr}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Dica: Se você gerou um teste rápido, certifique-se de que as 4 horas de licença ainda se encontram válidas.
          </p>
          <button
            onClick={onExit}
            className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Voltar para o Painel
          </button>
        </div>
      </div>
    );
  }

  // Categories parsing
  const categories = ["Todos", ...Array.from(new Set(channels.map((ch) => ch.category)))];

  // Filtering channel list
  const filteredChannels = channels.filter((ch) => {
    const matchesCategory = selectedCategory === "Todos" || ch.category === selectedCategory;
    const matchesSearch = ch.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col" id="web-watch-player">
      
      {/* 1. IMMERSIVE TOP BAR HUD */}
      <header className="bg-slate-900/60 border-b border-slate-900 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 bg-slate-850 hover:bg-slate-80 border border-slate-850 hover:border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Voltar ao Painel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-xl border border-sky-500/25 text-xs font-bold font-mono">
            WEB PLAYER MULTIMÍDIA
          </div>
          <div className="hidden sm:block">
            <h2 className="font-extrabold text-sm text-slate-100">{clientInfo?.name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Token de Acesso: {clientInfo?.token}</p>
          </div>
        </div>

        {/* Dynamic Countdown clock and playlist quick utilities */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Trial / countdown badge */}
          {clientInfo && (
            <div className="flex items-center gap-1.5 bg-slate-850/80 px-3.5 py-1.5 rounded-xl border border-slate-800/60 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
              <span className="text-[11px] text-slate-400">Tempo Restante:</span>
              <span className="font-bold text-amber-400">{timeRemaining}</span>
            </div>
          )}

          {/* Copiar Playlist M3U link */}
          <button
            onClick={handleCopyM3uUrl}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition ${
              copiedM3u 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Conectar no Smart TV / App IPTV"
          >
            {copiedM3u ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedM3u ? "Copiado!" : "Copiar Link M3U"}
          </button>
        </div>
      </header>

      {/* 2. CHANNELS AND STREAMING GRID AREA */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Side: Category Badge List & Live Search & Scrollable Channels cards */}
        <div className="w-full md:w-80 bg-slate-900/10 border-r border-slate-900 flex flex-col flex-shrink-0">
          
          {/* Channel Search box */}
          <div className="p-4 border-b border-slate-900 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-550 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar canal ou filme..."
                className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Quick List of Categories Badges */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 transition cursor-pointer border ${
                    selectedCategory === cat 
                      ? 'bg-sky-500 border-sky-400 text-white' 
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-850/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list of streams */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs select-none">
                <Tv className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                Nenhuma transmissão encontrada.
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const isSelected = selectedChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                      isSelected 
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-400 ring-1 ring-sky-500/10' 
                        : 'bg-slate-900/30 hover:bg-slate-900/70 border-slate-900/40 text-slate-300'
                    }`}
                  >
                    {/* Media channel logo wrapper */}
                    <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                      {ch.logoUrl ? (
                        <img src={ch.logoUrl} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        ch.isVOD ? <Film className="w-4 text-slate-600" /> : <Tv className="w-4 text-slate-600" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate pr-3">{ch.name}</div>
                      <span className="text-[9px] text-slate-500 font-semibold font-mono uppercase tracking-wide bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 mt-1 inline-block">
                        {ch.category}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Immersive cinema video player aspect ratio screen */}
        <div className="flex-grow flex flex-col bg-slate-950 p-4 sm:p-6 justify-center">
          
          <div className="max-w-4xl mx-auto w-full space-y-4">
            
            {/* Aspect theater element */}
            <div className="aspect-video bg-black border border-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center group">
              
              {selectedChannel ? (
                <video
                  ref={videoRef}
                  src={selectedChannel.url}
                  className="w-full h-full object-contain"
                  playsInline
                  controls={isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                      setPlayerError("O sinal de IPTV sofreu um erro de rede ou o link .m3u8 requer plugins CORS no seu navegador.");
                    }
                  }}
                />
              ) : (
                <div className="text-center text-slate-500 space-y-2 select-none">
                  <Tv className="w-12 h-12 mx-auto text-slate-705 text-slate-800" />
                  <p className="text-xs">Selecione uma transmissão no menu lateral</p>
                </div>
              )}

              {/* Theater dark film overlay layer for starting or alert warning */}
              {(!isPlaying || playerError) && selectedChannel && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-10 select-none">
                  
                  {playerError ? (
                    <div className="max-w-md space-y-4">
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-left leading-relaxed text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                          <span className="font-bold text-slate-100">Restrição de Player Web Detectada:</span>
                        </div>
                        <p>{playerError}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={handleCopyM3uUrl}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition shadow-lg shadow-sky-500/10 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar Link M3U de Transmissão
                        </button>
                        <button
                          onClick={() => setPlayerError(null)}
                          className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs px-4 py-2 rounded-xl cursor-pointer transition"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedChannel.logoUrl && (
                        <div className="w-16 h-16 rounded-2xl bg-white/5 p-2.5 border border-white/10 mx-auto flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={selectedChannel.logoUrl} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{selectedChannel.name}</h3>
                        <p className="text-[10px] text-sky-400 font-extrabold uppercase mt-1 tracking-wider">
                          Categoria: {selectedChannel.category}
                        </p>
                      </div>

                      <button
                        onClick={handlePlayToggle}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold p-4 h-16 w-16 rounded-full shadow-lg shadow-sky-500/25 cursor-pointer transform hover:scale-110 active:scale-95 transition flex items-center justify-center"
                      >
                        <Play className="w-7 h-7 fill-current ml-1" />
                      </button>

                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Sinal: {selectedChannel.url.startsWith("http") ? "Ativo" : "Redirecionamento local"}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Downstream Channel Info Banner & Troubleshooting Help */}
            {selectedChannel && (
              <div className="bg-slate-900/40 border border-slate-900 p-4.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-sm">Assista no seu Aparelho Preferido!</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px] max-w-xl">
                    Se você preferir assistir fora do navegador web, use o seu <strong className="text-slate-300">Link M3U</strong> no controle da sua Smart TV, Aplicativo IPTV Smarters, Flix, XCIPTV, SS IPTV, Smart STB, Apple TV ou VLC Media Player.
                  </p>
                </div>

                <button
                  onClick={handleCopyM3uUrl}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-850 px-4.5 py-2.5 rounded-xl text-slate-300 flex-shrink-0 cursor-pointer transition flex items-center gap-2 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedM3u ? "Copiado!" : "Copiar Playlist M3U"}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
