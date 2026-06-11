import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Tv, Film, Plus, RefreshCw, AlertCircle, Copy, Check, Radio } from "lucide-react";
import { Channel } from "../types";

interface MiniPlayerProps {
  channels: Channel[];
}

export default function MiniPlayer({ channels }: MiniPlayerProps) {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize with first VOD or channel if available
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const bbb = channels.find(c => c.id === 'vod_bbb') || channels[0];
      setSelectedChannel(bbb);
    }
  }, [channels]);

  // Load stream, handle play state reset
  useEffect(() => {
    setIsPlaying(false);
    setErrorStr(null);
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
          setErrorStr(null);
        })
        .catch((err) => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
          
          if (selectedChannel?.url.endsWith(".m3u8")) {
            setErrorStr(
              "Arquivos .m3u8 (HLS) requerem extensões de player de mídia no navegador Google Chrome (ex: 'Play HLS M3u8' ou 'Native HLS') ou reprodutores específicos como VLC, Smart TV, ou aplicativos IPTV (Smarters, SSIPTV)."
            );
          } else {
            setErrorStr(
              "Não foi possível iniciar a reprodução. Verifique se o link de transmissão está funcionando e suporta CORS no navegador (recomenda-se testar links MP4 ou testar a M3U direta nos apps IPTV)."
            );
          }
        });
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setCustomUrl("");
  };

  const handleTestCustomUrl = () => {
    if (!customUrl.trim()) return;
    
    const isVodText = customUrl.includes(".mp4") || customUrl.includes("sample");
    const artificialChannel: Channel = {
      id: "custom_" + Date.now(),
      name: "Stream Customizável",
      url: customUrl,
      category: "Testes Rápidos",
      isVOD: isVodText,
      active: true
    };
    setSelectedChannel(artificialChannel);
  };

  const currentStreamUrl = selectedChannel ? selectedChannel.url : "";

  const handleCopyUrl = () => {
    if (!currentStreamUrl) return;
    navigator.clipboard.writeText(currentStreamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Head details */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight" id="player-title">IPTV Monitor & Player</h2>
        <p className="text-slate-400 text-sm">Visualize, inspecione e valide links de reprodução direta dos canais e VODs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Player Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video relative flex flex-col justify-center items-center shadow-xl group">
            
            {/* Real HTML5 Player or Placeholder depending on state */}
            {selectedChannel ? (
              <video
                ref={videoRef}
                src={selectedChannel.url}
                className="w-full h-full object-cover"
                playsInline
                controls={isPlaying}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                    setErrorStr("O link estourou um erro de CORS ou formato inválido na rede.");
                  }
                }}
              />
            ) : (
              <div className="text-center text-slate-500">
                <Tv className="w-16 h-16 mx-auto mb-2 text-slate-700 animate-pulse" />
                <p className="text-sm">Selecione uma mídia para assistir</p>
              </div>
            )}

            {/* Dark Layer Overplay if paused / warning */}
            {(!isPlaying || errorStr) && selectedChannel && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center select-none">
                {errorStr ? (
                  <div className="max-w-md space-y-3">
                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-left leading-relaxed">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-1">Apareceu uma restrição no navegador web:</span>
                        {errorStr}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleCopyUrl}
                        className="bg-slate-800 border border-slate-700 hover:bg-slate-750 text-xs px-3 py-1.5 rounded-lg text-slate-200 hover:text-white cursor-pointer select-all transition flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3" /> : <Copy className="w-3" />} Copiar URL
                      </button>
                      <button
                        onClick={() => setErrorStr(null)}
                        className="bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-400"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedChannel.logoUrl && (
                      <div className="w-16 h-16 rounded-xl bg-slate-850 p-2 border border-slate-800 mx-auto flex items-center justify-center overflow-hidden">
                        <img src={selectedChannel.logoUrl} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-100 text-lg">{selectedChannel.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-semibold text-sky-400">{selectedChannel.category}</p>
                    </div>

                    <button
                      onClick={handlePlayToggle}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold p-4 h-14 w-14 rounded-full shadow-lg shadow-sky-500/20 hover:scale-105 transition cursor-pointer flex items-center justify-center"
                    >
                      <Play className="w-6 h-6 fill-current pr-0.5" />
                    </button>
                    
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      {selectedChannel.isVOD ? "Mídia do tipo MP4 suportada nativamente." : "Canais de TV ao vivo .m3u8 (HLS) requerem extensões de player."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Metadata Inspector */}
          {selectedChannel && (
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-xl space-y-3.5">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">Metadados da Transmissão</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID Interno: {selectedChannel.id}</p>
                </div>
                <span className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 font-mono">
                  {selectedChannel.isVOD ? "Format: MP4 VOD" : "Format: HLS Live stream"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-300">
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-bold">Título do Canal</span>
                  <span className="text-slate-200 mt-0.5 block">{selectedChannel.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-bold">Pacote Associado</span>
                  <span className="text-slate-200 mt-0.5 block">{selectedChannel.category}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] block uppercase font-bold">Endereço de Rede (Stream URL)</span>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  <span className="font-mono text-xs text-sky-450 truncate mr-2 select-all leading-relaxed">
                    {selectedChannel.url}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className={`p-1.5 rounded transition cursor-pointer flex-shrink-0 ${copied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-450 hover:text-slate-200'}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Channels Catalog sidebar selector */}
        <div className="space-y-4">
          {/* Custom Stream quick test */}
          <div className="bg-slate-850 p-4 border border-slate-800 rounded-xl shadow-lg shadow-black/10">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-2">Testar Link Externo</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Insira um link .mp4 ou .m3u8..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleTestCustomUrl}
                className="w-full bg-slate-800 hover:bg-sky-500 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-600 font-bold py-2 text-xs rounded-xl cursor-pointer transition text-center flex items-center justify-center gap-1"
              >
                <Radio className="w-3.5" /> Enviar para Player
              </button>
            </div>
          </div>

          {/* Quick Channels Navigator */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/10 flex flex-col h-[400px]">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-3">Selecione da sua Grade</h3>
            
            <div className="overflow-y-auto flex-grow divide-y divide-slate-800/80 pr-1 space-y-1">
              {channels.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">Nenhum canal ativo para listar.</div>
              ) : (
                channels.map((ch) => {
                  const isCur = selectedChannel?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChannel(ch)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                        isCur 
                          ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' 
                          : 'hover:bg-slate-800 text-slate-300 hover:text-slate-100'
                      }`}
                    >
                      <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                        {ch.logoUrl ? (
                          <img src={ch.logoUrl} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          ch.isVOD ? <Film className="w-3.5 text-slate-600" /> : <Tv className="w-3.5 text-slate-600" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold truncate leading-tight">{ch.name}</div>
                        <div className="text-[9px] text-slate-500 truncate uppercase mt-0.5 font-mono">{ch.category}</div>
                      </div>
                    </button>
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
