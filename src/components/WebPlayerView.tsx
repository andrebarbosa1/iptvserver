import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { PlaylistItem, Customer, Playlist } from '../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Search, Tv, Film, Tv2, Radio, Heart, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface WebPlayerViewProps {
  initialItem?: PlaylistItem | null;
  activeCustomer?: Customer | null;
  playlists?: Playlist[];
}

export const WebPlayerView: React.FC<WebPlayerViewProps> = ({ initialItem, activeCustomer, playlists = [] }) => {
  const [channels, setChannels] = useState<PlaylistItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<PlaylistItem | null>(initialItem || null);
  const [category, setCategory] = useState<'all' | 'live' | 'movie' | 'series'>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<PlaylistItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | 'fill'>('16:9');
  const [tvMode, setTvMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Add Channel Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStreamUrl, setNewStreamUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'live' | 'movie' | 'series'>('live');
  const [newGroupTitle, setNewGroupTitle] = useState('CANAIS HD');
  const [newLogoUrl, setNewLogoUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Sync channels from playlists and custom local player storage
  useEffect(() => {
    const playlistChannels: PlaylistItem[] = [];
    if (playlists && playlists.length > 0) {
      playlists.forEach(pl => {
        if (pl.items && pl.items.length > 0) {
          playlistChannels.push(...pl.items);
        }
      });
    }

    let customChannels: PlaylistItem[] = [];
    try {
      const saved = localStorage.getItem('streamflow_custom_player_channels');
      if (saved) {
        customChannels = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading custom channels from localStorage:', e);
    }

    const combined = [...customChannels, ...playlistChannels];
    setChannels(combined);

    if (initialItem) {
      setSelectedChannel(initialItem);
    } else if (combined.length > 0) {
      // Keep existing selected if valid, else pick first
      setSelectedChannel(prev => {
        if (prev && combined.some(c => c.id === prev.id)) return prev;
        return combined[0];
      });
    } else {
      setSelectedChannel(null);
    }
  }, [playlists, initialItem]);

  // Handle HLS Stream Loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedChannel?.streamUrl) {
      setIsPlaying(false);
      return;
    }

    setPlayerError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = selectedChannel.streamUrl;
    const isHls = streamUrl.toLowerCase().includes('.m3u8') || streamUrl.toLowerCase().includes('m3u') || !streamUrl.toLowerCase().endsWith('.mp4');

    if (Hls.isSupported() && isHls) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerError(null);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error encountered, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error encountered, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.warn('Fatal HLS playback error');
              setPlayerError('A transmissão não pôde ser carregada. Verifique se a URL M3U8 está ativa.');
              setIsPlaying(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
      video.src = streamUrl;
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.src = streamUrl;
      video.play().catch(() => setIsPlaying(false));
    }

    // Add to history
    setHistory(prev => {
      const exists = prev.find(item => item.id === selectedChannel.id);
      if (exists) return prev;
      return [selectedChannel, ...prev.slice(0, 9)];
    });

    setIsPlaying(true);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleAddChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStreamUrl.trim()) return;

    const newChannelItem: PlaylistItem = {
      id: `custom-ch-${Date.now()}`,
      title: newTitle.trim(),
      streamUrl: newStreamUrl.trim(),
      category: newCategory,
      groupTitle: newGroupTitle.trim() || 'CANAIS HD',
      logoUrl: newLogoUrl.trim() || undefined,
      epgProgram: 'Programação de alta qualidade'
    };

    let existingCustom: PlaylistItem[] = [];
    try {
      const saved = localStorage.getItem('streamflow_custom_player_channels');
      if (saved) existingCustom = JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }

    const updatedCustom = [newChannelItem, ...existingCustom];
    localStorage.setItem('streamflow_custom_player_channels', JSON.stringify(updatedCustom));

    setChannels(prev => [newChannelItem, ...prev]);
    setSelectedChannel(newChannelItem);

    // Reset form & close modal
    setNewTitle('');
    setNewStreamUrl('');
    setNewGroupTitle('CANAIS HD');
    setNewLogoUrl('');
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomChannel = (id: string) => {
    try {
      const saved = localStorage.getItem('streamflow_custom_player_channels');
      if (saved) {
        const parsed: PlaylistItem[] = JSON.parse(saved);
        const filtered = parsed.filter(c => c.id !== id);
        localStorage.setItem('streamflow_custom_player_channels', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    }

    setChannels(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (selectedChannel?.id === id) {
        setSelectedChannel(updated[0] || null);
      }
      return updated;
    });
  };

  const filteredChannels = channels.filter(ch => {
    const matchesCategory = category === 'all' || ch.category === category;
    const matchesSearch =
      ch.title.toLowerCase().includes(search.toLowerCase()) ||
      ch.groupTitle.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Keyboard Navigation for D-Pad / Smart TV Remote Emulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tvMode || filteredChannels.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredChannels.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredChannels.length) % filteredChannels.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredChannels[selectedIndex]) {
          setSelectedChannel(filteredChannels[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tvMode, filteredChannels, selectedIndex]);

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" /> Web Streaming Player ExoPlayer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeCustomer
              ? `Linha ativa de ${activeCustomer.name} (${activeCustomer.username})`
              : 'Player HLS.js ExoPlayer integrado. Adicione seus próprios canais ou carregue via M3U.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar Canal
          </button>

          <button
            onClick={() => setTvMode(!tvMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              tvMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
            {tvMode ? 'Controle D-Pad ATIVO' : 'Smart TV Mode'}
          </button>
        </div>
      </div>

      {/* Main Grid: Video Screen + Channel Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center">
            {selectedChannel ? (
              <>
                <video
                  ref={videoRef}
                  controls={false}
                  onError={() => {
                    setPlayerError('A fonte deste canal não pôde ser reproduzida no navegador. Verifique a URL M3U8.');
                    setIsPlaying(false);
                  }}
                  className={`w-full h-full object-${aspectRatio === 'fill' ? 'cover' : 'contain'}`}
                />

                {/* Error Overlay Fallback */}
                {playerError && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="text-white font-bold text-sm">Transmissão Indisponível</div>
                    <p className="text-xs text-slate-400 max-w-sm">{playerError}</p>
                    <button
                      onClick={() => {
                        setPlayerError(null);
                        if (videoRef.current && selectedChannel?.streamUrl) {
                          videoRef.current.src = selectedChannel.streamUrl;
                          videoRef.current.play().catch(() => {});
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                    >
                      Tentar Sincronizar Novamente
                    </button>
                  </div>
                )}

                {/* Live Indicator Overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-lg animate-pulse">
                    AO VIVO HD
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-md border border-white/10">
                    {selectedChannel.title}
                  </span>
                </div>

                {/* Custom Media Controls Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const video = videoRef.current;
                        if (video) {
                          if (isPlaying) video.pause();
                          else video.play();
                          setIsPlaying(!isPlaying);
                        }
                      }}
                      className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                      onClick={() => {
                        const video = videoRef.current;
                        if (video) {
                          video.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => toggleFavorite(selectedChannel.id)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.includes(selectedChannel.id) ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={aspectRatio}
                      onChange={e => setAspectRatio(e.target.value as any)}
                      className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 font-semibold"
                    >
                      <option value="16:9">Aspecto 16:9</option>
                      <option value="4:3">Aspecto 4:3</option>
                      <option value="fill">Preencher Tela</option>
                    </select>

                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty Viewport Placeholder */
              <div className="p-8 text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Radio className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Player ExoPlayer Zerado</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Nenhum canal selecionado ou cadastrado. Adicione seus canais para iniciar a transmissão HLS/M3U8.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Primeiro Canal
                </button>
              </div>
            )}
          </div>

          {/* EPG / Now Playing Metadata */}
          {selectedChannel && (
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedChannel.logoUrl ? (
                  <img
                    src={selectedChannel.logoUrl}
                    alt={selectedChannel.title}
                    className="w-12 h-12 object-contain bg-slate-950 rounded-xl p-1 border border-slate-800"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-indigo-400">
                    <Tv className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-white">{selectedChannel.title}</h2>
                  <p className="text-xs text-indigo-300">
                    {selectedChannel.epgProgram || 'Transmissão HLS em tempo real'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">Grupo / Categoria</span>
                <span className="text-xs font-bold text-emerald-400">{selectedChannel.groupTitle}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Channels List */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Categories */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase">Guia de Canais</span>
              <div className="flex items-center gap-1">
                {(['all', 'live', 'movie', 'series'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                      category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'live' ? 'Ao Vivo' : cat === 'movie' ? 'Filmes' : 'Séries'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar canais..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>

            {/* Channel List */}
            {filteredChannels.length === 0 ? (
              <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800 text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">Nenhum canal nesta lista</p>
                <p className="text-[11px] text-slate-500">
                  Adicione canais usando o botão "+ Cadastrar Canal" acima.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {filteredChannels.map((ch, idx) => {
                  const isActive = selectedChannel?.id === ch.id;
                  const isSelectedInTvMode = tvMode && selectedIndex === idx;
                  const isCustom = ch.id.startsWith('custom-ch-');

                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setSelectedChannel(ch);
                        setSelectedIndex(idx);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                          : isSelectedInTvMode
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {ch.logoUrl ? (
                          <img src={ch.logoUrl} alt="" className="w-7 h-7 object-contain bg-slate-900 rounded p-0.5 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center shrink-0 text-indigo-400">
                            <Tv className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{ch.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{ch.groupTitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Heart
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(ch.id);
                          }}
                          className={`w-3.5 h-3.5 cursor-pointer ${
                            favorites.includes(ch.id) ? 'text-rose-500 fill-rose-500' : 'text-slate-500'
                          }`}
                        />
                        {isCustom && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteCustomChannel(ch.id);
                            }}
                            title="Remover Canal"
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Android TV Remote Control Helper */}
          {tvMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs text-center space-y-1">
              <div className="font-bold">Controle Remoto Smart TV Ativo</div>
              <p className="text-[11px] text-slate-300">
                Use as setas do teclado <strong className="text-amber-400">&uarr; &darr;</strong> para navegar e <strong className="text-amber-400">ENTER</strong> para selecionar o canal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Channel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Cadastrar Novo Canal M3U8</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChannelSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nome do Canal / Conteúdo *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Canal Esportes HD"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">URL da Transmissão Stream (M3U8 / HLS / MP4) *</label>
                <input
                  type="url"
                  required
                  value={newStreamUrl}
                  onChange={e => setNewStreamUrl(e.target.value)}
                  placeholder="https://servidor.com/live/user/pass/123.m3u8"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tipo de Conteúdo</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="live">Ao Vivo</option>
                    <option value="movie">Filme (VOD)</option>
                    <option value="series">Série (VOD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Grupo / Categoria</label>
                  <input
                    type="text"
                    value={newGroupTitle}
                    onChange={e => setNewGroupTitle(e.target.value)}
                    placeholder="Ex: CANAIS ABERTO HD"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">URL da Logomarca (Opcional)</label>
                <input
                  type="url"
                  value={newLogoUrl}
                  onChange={e => setNewLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Salvar e Adicionar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

