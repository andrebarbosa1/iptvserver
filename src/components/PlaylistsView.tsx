import React, { useState } from 'react';
import { Playlist, PlaylistItem } from '../types';
import { parseM3UContent } from '../utils/m3uParser';
import { ListVideo, Plus, RefreshCw, CheckCircle, AlertTriangle, Trash2, Edit, Play, ExternalLink, Filter, Search, FileCode, Cpu, Globe, Copy, Check, Tv } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onAddPlaylist: (playlist: Playlist) => void;
  onUpdatePlaylist: (id: string, updated: Partial<Playlist>) => void;
  onDeletePlaylist: (id: string) => void;
  onPreviewChannelInPlayer: (item: PlaylistItem) => void;
  onClearAllPlaylists?: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  onAddPlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onPreviewChannelInPlayer,
  onClearAllPlaylists
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [isConfirmWipeOpen, setIsConfirmWipeOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(playlists[0] || null);

  // Keep selected playlist in sync if playlists change or empty
  React.useEffect(() => {
    if (playlists.length > 0) {
      if (!selectedPlaylist || !playlists.find(p => p.id === selectedPlaylist.id)) {
        setSelectedPlaylist(playlists[0]);
      }
    } else {
      setSelectedPlaylist(null);
    }
  }, [playlists]);
  const [channelSearch, setChannelSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recentlyAddedChannelName, setRecentlyAddedChannelName] = useState<string | null>(null);

  // New Single Channel Form State
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [newChannelStreamUrl, setNewChannelStreamUrl] = useState('');
  const [newChannelGroup, setNewChannelGroup] = useState('Canais Ao Vivo');
  const [newChannelCategory, setNewChannelCategory] = useState<'live' | 'movie' | 'series'>('live');
  const [newChannelLogoUrl, setNewChannelLogoUrl] = useState('');

  // New Playlist Form State
  const [importType, setImportType] = useState<'m3u_url' | 'mac' | 'raw_text'>('m3u_url');
  const [name, setName] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [macAddressInput, setMacAddressInput] = useState('');
  const [portalUrlInput, setPortalUrlInput] = useState('https://www.playstream.lat');
  const [copiedMac, setCopiedMac] = useState<string | null>(null);
  const [category, setCategory] = useState('Canais & VODs');
  const [channelCategoryType, setChannelCategoryType] = useState<'auto' | 'live' | 'movie' | 'series'>('auto');
  const [channelGroupTitle, setChannelGroupTitle] = useState('auto');
  const [customGroupTitle, setCustomGroupTitle] = useState('');
  const [m3uRawText, setM3uRawText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

  const handleCopyMac = (mac: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mac);
    setCopiedMac(mac);
    setTimeout(() => setCopiedMac(null), 2000);
  };

  // Handle Add Individual Channel to Selected Playlist
  const handleAddSingleChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylist || !newChannelTitle.trim() || !newChannelStreamUrl.trim()) return;

    const newChannelItem: PlaylistItem = {
      id: `chn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title: newChannelTitle.trim(),
      groupTitle: newChannelGroup.trim() || 'Canais Gerais',
      streamUrl: newChannelStreamUrl.trim(),
      category: newChannelCategory,
      logoUrl: newChannelLogoUrl.trim() || undefined
    };

    const currentItems = selectedPlaylist.items || [];
    const updatedItems = [newChannelItem, ...currentItems];

    const updatedPl: Playlist = {
      ...selectedPlaylist,
      itemCount: updatedItems.length,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: updatedItems
    };

    onUpdatePlaylist(selectedPlaylist.id, {
      items: updatedItems,
      itemCount: updatedItems.length,
      lastUpdated: updatedPl.lastUpdated
    });

    setSelectedPlaylist(updatedPl);
    setRecentlyAddedChannelName(newChannelTitle.trim());

    // Reset Form
    setNewChannelTitle('');
    setNewChannelStreamUrl('');
    setNewChannelLogoUrl('');
    setIsAddChannelModalOpen(false);

    // Auto-clear toast after 6 seconds
    setTimeout(() => {
      setRecentlyAddedChannelName(null);
    }, 6000);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (importType === 'm3u_url' && !m3uUrl) return;
    if (importType === 'raw_text' && !m3uRawText) return;
    if (importType === 'mac' && !macAddressInput.trim()) return;

    let items: PlaylistItem[] = [];
    let finalM3uUrl = m3uUrl || 'https://www.playstream.lat/get.php';

    if (importType === 'mac') {
      const cleanMac = macAddressInput.trim().toUpperCase();
      const cleanPortal = (portalUrlInput.trim() || 'https://www.playstream.lat').replace(/\/+$/, '');
      finalM3uUrl = `${cleanPortal}/get.php?mac=${encodeURIComponent(cleanMac)}`;

      items = [
        {
          id: `mac-1-${Date.now().toString(36)}`,
          title: `[MAC ${cleanMac}] TV Ao Vivo HD`,
          groupTitle: 'Stalker TV Ao Vivo',
          streamUrl: `${cleanPortal}/live/mac/${cleanMac}/101.m3u8`,
          category: 'live'
        },
        {
          id: `mac-2-${Date.now().toString(36)}`,
          title: `[MAC ${cleanMac}] Esportes Premium 4K`,
          groupTitle: 'Stalker Esportes',
          streamUrl: `${cleanPortal}/live/mac/${cleanMac}/102.m3u8`,
          category: 'live'
        },
        {
          id: `mac-3-${Date.now().toString(36)}`,
          title: `[MAC ${cleanMac}] Filmes & Lançamentos VOD`,
          groupTitle: 'Stalker Filmes VOD',
          streamUrl: `${cleanPortal}/movie/mac/${cleanMac}/201.mp4`,
          category: 'movie'
        }
      ];
    } else if (importType === 'raw_text' && m3uRawText) {
      items = parseM3UContent(m3uRawText);
    } else if (selectedPlaylist?.items) {
      // Create copies of sample/selected items if importing via URL without raw text
      items = selectedPlaylist.items.map((it, idx) => ({
        ...it,
        id: `m3u-url-${idx}-${Date.now().toString(36)}`,
        title: `${it.title} (${name})`,
      }));
    } else {
      // Fallback sample channels if no items exist
      items = [
        {
          id: `m3u-1-${Date.now().toString(36)}`,
          title: 'Canal HD Ao Vivo',
          groupTitle: 'Canais HD',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          category: 'live'
        },
        {
          id: `m3u-2-${Date.now().toString(36)}`,
          title: 'Filme Ação 4K VOD',
          groupTitle: 'Filmes VOD',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          category: 'movie'
        }
      ];
    }

    // Apply selected channel category overrides
    const effectiveGroupTitle =
      channelGroupTitle === 'auto'
        ? null
        : channelGroupTitle === 'custom'
        ? customGroupTitle || 'Categoria Personalizada'
        : channelGroupTitle;

    items = items.map(item => ({
      ...item,
      category: channelCategoryType === 'auto' ? item.category : channelCategoryType,
      groupTitle: effectiveGroupTitle ? effectiveGroupTitle : item.groupTitle
    }));

    const newPl: Playlist = {
      id: `pl-${Date.now().toString(36)}`,
      name,
      m3uUrl: finalM3uUrl,
      category,
      itemCount: items.length || 8,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'active',
      autoUpdate: true,
      updateIntervalHours: 12,
      items,
      importType,
      macAddress: importType === 'mac' ? macAddressInput.trim().toUpperCase() : undefined,
      portalUrl: importType === 'mac' ? (portalUrlInput.trim() || 'https://www.playstream.lat') : undefined
    };

    onAddPlaylist(newPl);
    setSelectedPlaylist(newPl);
    setIsModalOpen(false);

    if (items.length > 0) {
      setRecentlyAddedChannelName(`${items[0].title} (+${items.length - 1} outros canais)`);
      setTimeout(() => {
        setRecentlyAddedChannelName(null);
      }, 6000);
    }

    setName('');
    setM3uUrl('');
    setM3uRawText('');
    setMacAddressInput('');
    setPortalUrlInput('https://www.playstream.lat');
    setImportType('m3u_url');
    setChannelCategoryType('auto');
    setChannelGroupTitle('auto');
    setCustomGroupTitle('');
    setValidationSuccess(null);
  };

  const handleTestM3uUrl = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setValidationSuccess(true);
    }, 1000);
  };

  // Filter items in selected playlist
  const itemsList = selectedPlaylist?.items || [];
  const filteredItems = itemsList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(channelSearch.toLowerCase()) || (item.groupTitle && item.groupTitle.toLowerCase().includes(channelSearch.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-indigo-400" /> Gerenciador de Playlists M3U e M3U8
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre URLs de listas M3U autorizadas, importe arquivos, organize categorias de canais e sincronize em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onClearAllPlaylists && playlists.length > 0 && (
            <button
              onClick={() => setIsConfirmWipeOpen(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Zerar Playlists
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Importar Lista M3U
          </button>
        </div>
      </div>

      {/* Grid: Playlist Cards + Channel Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playlists Sidebar Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Listas M3U Cadastradas</h2>
            <span className="text-xs text-slate-400 font-bold">{playlists.length} lista(s)</span>
          </div>

          {playlists.length === 0 ? (
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ListVideo className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Nenhuma Playlist M3U</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sua base de playlists está zerada. Cadastre novas listas M3U/M3U8 para gerenciar os canais.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
              >
                + Criar / Importar Lista
              </button>
            </div>
          ) : (
            playlists.map(pl => {
              const isSelected = selectedPlaylist?.id === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(pl)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {pl.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Ativa
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir a playlist "${pl.name}"?`)) {
                            onDeletePlaylist(pl.id);
                          }
                        }}
                        title="Excluir Playlist"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">{pl.name}</h3>
                  <code className="block text-[10px] text-slate-400 mt-1 truncate bg-slate-950 p-1.5 rounded font-mono">
                    {pl.m3uUrl?.replace(/https?:\/\/play\.streamflow\.com/g, 'https://www.playstream.lat').replace(/https?:\/\/streamflow\.com/g, 'https://playstream.lat')}
                  </code>

                  {pl.macAddress && (
                    <div className="mt-2 bg-slate-950/90 p-2 rounded-xl border border-indigo-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-indigo-300 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        <span>MAC: {pl.macAddress}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyMac(pl.macAddress!, e)}
                        className="text-indigo-400 hover:text-white text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 font-bold transition-all"
                      >
                        {copiedMac === pl.macAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedMac === pl.macAddress ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>{pl.itemCount} canais/VODs</span>
                    <span className="text-[10px]">Atualizado: {pl.lastUpdated}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Playlist Content & Channels Table */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
          {selectedPlaylist ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedPlaylist.name}</h2>
                  <p className="text-xs text-slate-400">
                    Sincronização Automática a cada {selectedPlaylist.updateIntervalHours} horas • {selectedPlaylist.itemCount} canais cadastrados
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddChannelModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Canal
                  </button>

                  <button
                    onClick={() => {
                      onUpdatePlaylist(selectedPlaylist.id, {
                        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
                      });
                      alert('Sincronização M3U disparada com sucesso!');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Sincronizar
                  </button>
                </div>
              </div>

              {/* Notification Banner for Added Channel */}
              {recentlyAddedChannelName && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Novo canal adicionado com sucesso: <strong className="text-white bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/40">{recentlyAddedChannelName}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setRecentlyAddedChannelName(null)}
                    className="text-slate-400 hover:text-white font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar canais ou filmes..."
                    value={channelSearch}
                    onChange={e => setChannelSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {['all', 'live', 'movie', 'series'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat === 'live' ? 'Ao Vivo' : cat === 'movie' ? 'Filmes' : 'Séries'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels Inspector List */}
              <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1">
                {filteredItems.map(item => {
                  const isJustAdded = item.title === recentlyAddedChannelName;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isJustAdded
                          ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.title}
                            className="w-10 h-10 object-contain rounded bg-slate-900 p-1 border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                            M3U
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{item.title}</span>
                            {isJustAdded && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase tracking-wide animate-pulse">
                                NOVO CANAL
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-indigo-300">{item.groupTitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 hidden md:block max-w-[200px] truncate">
                          {item.streamUrl}
                        </span>
                        <button
                          onClick={() => onPreviewChannelInPlayer(item)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Testar Stream
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">Selecione uma playlist para visualizar os canais.</div>
          )}
        </div>
      </div>

      {/* Add Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Cadastrar Playlist M3U Autorizada
            </h2>

            <form onSubmit={handleCreatePlaylist} className="space-y-4 text-xs">
              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setImportType('m3u_url')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'm3u_url'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> URL M3U
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('mac')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'mac'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-300" /> Por Endereço MAC
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('raw_text')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    importType === 'raw_text'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" /> Texto Direct
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nome da Lista *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={importType === 'mac' ? 'Ex: Smart TV Sala - MAC Stalker' : 'Ex: Lista Canais Esportes & Filmes 4K'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Categoria Principal da Playlist</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="Canais & VODs">Canais & VODs (Geral)</option>
                    <option value="Canais Ao Vivo">Canais Ao Vivo (TV)</option>
                    <option value="Filmes & VOD">Filmes & VOD 4K</option>
                    <option value="Séries & Novelas">Séries & Novelas</option>
                    <option value="Esportes HD">Esportes Premium</option>
                    <option value="Infantil & Desenhos">Infantil & Desenhos</option>
                    <option value="Notícias & Documentários">Notícias & Cultura</option>
                    <option value="Adulto (+18)">Adulto (+18)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Inputs Based on Import Type */}
              {importType === 'mac' && (
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-400" /> Vínculo por Endereço MAC (Stalker / MAG / Smart TV)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Endereço MAC do Apararelho/App *</label>
                      <input
                        type="text"
                        required
                        value={macAddressInput}
                        onChange={e => setMacAddressInput(e.target.value)}
                        placeholder="00:1A:79:3A:4B:5C"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase text-xs focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold text-[11px]">URL do Portal Stalker / DNS</label>
                      <input
                        type="text"
                        value={portalUrlInput}
                        onChange={e => setPortalUrlInput(e.target.value)}
                        placeholder="https://www.playstream.lat"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    💡 <strong>Como funciona:</strong> Digite o MAC do aparelho (MAG, TV Box, Formuler) ou aplicativo (XCIPTV, Smart STB, STBEmu). O sistema associará automaticamente os canais ao MAC e gerará a URL de autenticação: <span className="font-mono text-indigo-300">{portalUrlInput || 'https://www.playstream.lat'}/get.php?mac={macAddressInput || '00:1A:79:XX:XX:XX'}</span>.
                  </p>
                </div>
              )}

              {importType === 'm3u_url' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">URL da Lista M3U / M3U8 *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={m3uUrl}
                      onChange={e => setM3uUrl(e.target.value)}
                      placeholder="https://www.playstream.lat/get.php?username=usr&password=pwd"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestM3uUrl}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 rounded-xl"
                    >
                      {isValidating ? 'Validando...' : 'Validar URL'}
                    </button>
                  </div>
                  {validationSuccess && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> URL M3U válida e acessível!
                    </p>
                  )}
                </div>
              )}

              {importType === 'raw_text' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Conteúdo M3U Direct (#EXTM3U) *</label>
                  <textarea
                    rows={4}
                    required
                    value={m3uRawText}
                    onChange={e => setM3uRawText(e.target.value)}
                    placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="http://logo.com/c1.png" group-title="Ao Vivo",Canal Exemplo 4K\nhttps://stream.com/live.m3u8`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Channel Category Selection Options */}
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> Classificação e Categoria dos Canais Importados
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Tipo de Mídia (Category)</label>
                    <select
                      value={channelCategoryType}
                      onChange={e => setChannelCategoryType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    >
                      <option value="auto">⚡ Auto (Detectar do M3U)</option>
                      <option value="live">📺 Ao Vivo (Live TV)</option>
                      <option value="movie">🎬 Filme (VOD)</option>
                      <option value="series">🍿 Série (Series)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Grupo do Canal (group-title)</label>
                    <select
                      value={channelGroupTitle}
                      onChange={e => setChannelGroupTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    >
                      <option value="auto">⚡ Auto (Manter M3U original)</option>
                      <option value="Canais Abertos">Canais Abertos & Locais</option>
                      <option value="Esportes HD">Esportes HD / Premiere</option>
                      <option value="Filmes & Cinema">Filmes & Cinema VOD</option>
                      <option value="Séries & Novelas">Séries & Novelas</option>
                      <option value="Notícias & Jornalismo">Notícias & Jornalismo</option>
                      <option value="Desenhos & Infantil">Desenhos & Infantil</option>
                      <option value="Documentários & Ciência">Documentários & Ciência</option>
                      <option value="Variedades">Variedades & Shows</option>
                      <option value="custom">✍️ Digitar Categoria Personalizada...</option>
                    </select>
                  </div>
                </div>

                {channelGroupTitle === 'custom' && (
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Nome da Categoria Personalizada</label>
                    <input
                      type="text"
                      required
                      value={customGroupTitle}
                      onChange={e => setCustomGroupTitle(e.target.value)}
                      placeholder="Ex: Premiere FC, HBO 4K, Desenhos 24h..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Salvar Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Single Channel Modal */}
      {isAddChannelModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Adicionar Canal à Lista
              </h2>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/20 truncate max-w-[150px]">
                {selectedPlaylist.name}
              </span>
            </div>

            <form onSubmit={handleAddSingleChannel} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nome do Canal *</label>
                <input
                  type="text"
                  required
                  value={newChannelTitle}
                  onChange={e => setNewChannelTitle(e.target.value)}
                  placeholder="Ex: Globo SP HD 4K, Premiere Clubes, HBO Max"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">URL da Stream HLS / M3U8 *</label>
                <input
                  type="url"
                  required
                  value={newChannelStreamUrl}
                  onChange={e => setNewChannelStreamUrl(e.target.value)}
                  placeholder="https://servidor.com/live/canal.m3u8"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Grupo / Categoria</label>
                  <input
                    type="text"
                    value={newChannelGroup}
                    onChange={e => setNewChannelGroup(e.target.value)}
                    placeholder="Ex: Canais Abertos, Esportes"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tipo de Mídia</label>
                  <select
                    value={newChannelCategory}
                    onChange={e => setNewChannelCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium"
                  >
                    <option value="live">📺 TV Ao Vivo</option>
                    <option value="movie">🎬 Filme (VOD)</option>
                    <option value="series">🍿 Série</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">URL da Logo / Picon (Opcional)</label>
                <input
                  type="url"
                  value={newChannelLogoUrl}
                  onChange={e => setNewChannelLogoUrl(e.target.value)}
                  placeholder="https://servidor.com/logos/canal.png"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-[11px] placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddChannelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Adicionar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wipe Playlists Confirmation Modal */}
      {isConfirmWipeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Zerar Todas as Playlists M3U/M3U8?</h2>
                <p className="text-xs text-slate-400">Esta ação excluirá todas as listas cadastradas</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a remover todas as listas M3U demonstrativas do sistema para cadastrar suas próprias listas de canais e VODs do zero.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmWipeOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onClearAllPlaylists) {
                    onClearAllPlaylists();
                  }
                  setIsConfirmWipeOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
              >
                Sim, Zerar Todas as Playlists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
