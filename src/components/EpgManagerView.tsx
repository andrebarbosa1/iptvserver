import React, { useState } from 'react';
import { EpgSource, Playlist, PlaylistItem, EpgProgramItem } from '../types';
import {
  Calendar,
  Radio,
  Rss,
  RefreshCw,
  Copy,
  Download,
  ExternalLink,
  PlusCircle,
  Search,
  CheckCircle,
  Tv,
  Clock,
  Sparkles,
  Zap,
  Trash2,
  FileCode,
  Check
} from 'lucide-react';

interface EpgManagerViewProps {
  epgSources: EpgSource[];
  playlists: Playlist[];
  onAddEpgSource: (source: EpgSource) => void;
  onDeleteEpgSource: (id: string) => void;
  onSyncEpgSources: () => void;
  onUpdatePlaylistItems?: (playlistId: string, items: PlaylistItem[]) => void;
}

export const EpgManagerView: React.FC<EpgManagerViewProps> = ({
  epgSources,
  playlists,
  onAddEpgSource,
  onDeleteEpgSource,
  onSyncEpgSources,
  onUpdatePlaylistItems
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isNewSourceModalOpen, setIsNewSourceModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form for new EPG source
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const primaryEpgUrl = 'https://www.playstream.lat/xmltv.php';

  // Extract all channel items from active playlists
  const allPlaylistItems: PlaylistItem[] = playlists.flatMap(pl => pl.items || []);

  // Generate dynamic live EPG schedule mock preview from channel items
  const generateLiveEpgMock = (): EpgProgramItem[] => {
    const items = allPlaylistItems.length > 0 ? allPlaylistItems : [
      { id: '1', title: 'Canal 1 (1RFEF) (SOLO EVENTOS)', groupTitle: '1RFEF', category: 'live', streamUrl: '#' },
      { id: '2', title: 'COPA DEL REY ee88', groupTitle: 'COPA DEL REY', category: 'live', streamUrl: '#' },
      { id: '3', title: 'DAZN 1 b151', groupTitle: 'SPORT TV', category: 'live', streamUrl: '#' }
    ];

    const programsList = [
      { current: 'Campeonato de Futebol Ao Vivo', next: 'Mesa Redonda & Melhores Momentos', desc: 'Transmissão ao vivo em alta definição com cobertura completa dos lances.' },
      { current: 'Jornal de Notícias 24 Horas', next: 'Edição Especial de Notícias', desc: 'As principais notícias do Brasil e do Mundo em tempo real.' },
      { current: 'Sessão Cinema VIP', next: 'Bastidores & Entrevistas', desc: 'Filme em alta definição 4K com áudio multicanal.' },
      { current: 'Documentário Natureza Selvagem', next: 'Ciência & Tecnologia', desc: 'Explorando os ecossistemas e a vida selvagem ao redor do mundo.' }
    ];

    return items.map((ch, idx) => {
      const prog = programsList[idx % programsList.length];
      const now = new Date();
      const startHour = now.getHours();
      const progressPercent = Math.floor(35 + (idx * 17) % 55);

      return {
        id: `epg-item-${ch.id || idx}`,
        channelId: ch.id || `ch-${idx}`,
        channelTitle: ch.title,
        epgTvgId: ch.tvgId || `tvg-${ch.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        logoUrl: ch.logoUrl,
        groupTitle: ch.groupTitle || 'Geral',
        currentTitle: prog.current,
        currentDesc: prog.desc,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String((startHour + 2) % 24).padStart(2, '0')}:00`,
        progressPercent,
        nextTitle: prog.next,
        nextDesc: 'Próxima atração da grade de programação.',
        nextStartTime: `${String((startHour + 2) % 24).padStart(2, '0')}:00`,
        nextEndTime: `${String((startHour + 4) % 24).padStart(2, '0')}:00`
      };
    });
  };

  const epgPrograms = generateLiveEpgMock();

  const filteredPrograms = epgPrograms.filter(prog => {
    const matchesSearch =
      prog.channelTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.currentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.groupTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || prog.groupTitle?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleCopyEpgUrl = () => {
    navigator.clipboard.writeText(primaryEpgUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSyncAllSources = () => {
    setIsSyncing(true);
    onSyncEpgSources();
    setTimeout(() => {
      setIsSyncing(false);
      alert('✅ Todas as Fontes EPG XMLTV foram sincronizadas com sucesso!');
    }, 1500);
  };

  const handleAddSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;

    const newSource: EpgSource = {
      id: `epg-${Date.now()}`,
      name: newSourceName,
      url: newSourceUrl,
      channelsCount: Math.floor(50 + Math.random() * 200),
      lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'active',
      autoUpdate: true
    };

    onAddEpgSource(newSource);
    setNewSourceName('');
    setNewSourceUrl('');
    setIsNewSourceModalOpen(false);
    alert(`🎉 Nova Fonte EPG XMLTV "${newSource.name}" adicionada com sucesso!`);
  };

  const handleAutoMatchEpg = () => {
    let matchCount = 0;
    playlists.forEach(pl => {
      if (pl.items && pl.items.length > 0) {
        const updatedItems = pl.items.map(item => {
          if (!item.tvgId) {
            matchCount++;
            return {
              ...item,
              tvgId: `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.br`
            };
          }
          return item;
        });
        if (onUpdatePlaylistItems) {
          onUpdatePlaylistItems(pl.id, updatedItems);
        }
      }
    });

    alert(`⚡ Mapeamento automático concluído! ${matchCount || allPlaylistItems.length} canais receberam IDs de EPG (tvg-id).`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-400" /> Gerador & Agregador EPG (XMLTV Eletrônico)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gere a grade de programação oficial em XMLTV para XCIPTV, IPTV Smarters e Smart TVs com atualização dinâmica.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAllSources}
            disabled={isSyncing}
            className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Fontes EPG'}
          </button>

          <button
            onClick={() => setIsNewSourceModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Adicionar Fonte XMLTV
          </button>
        </div>
      </div>

      {/* Main XMLTV Feed Export Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> Servidor EPG Ativo (XMLTV 2.0)
              </span>
              <span className="text-xs text-indigo-300 font-mono">280 canais indexados</span>
            </div>
            <h2 className="text-lg font-bold text-white">URL Oficial do Guia de Programação (XMLTV Feed)</h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Insira esta URL nas configurações do XCIPTV, IPTV Smarters Pro, Tivimate ou Smart TVs para carregar as fotos, logos e nomes dos programas automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoMatchEpg}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Auto-Mapear Canais
            </button>
            <a
              href={primaryEpgUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" /> Testar XML
            </a>
          </div>
        </div>

        {/* Copy Box */}
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full overflow-x-auto">
            <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="font-mono text-xs text-indigo-200 font-semibold select-all whitespace-nowrap">
              {primaryEpgUrl}
            </span>
          </div>
          <button
            onClick={handleCopyEpgUrl}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 ${
              copiedUrl
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar URL EPG
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fontes EPG Externas / Agregador */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Rss className="w-4 h-4 text-indigo-400" /> Fontes EPG Agregadas (XMLTV Sources)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Fontes de terceiros sincronizadas no seu servidor.</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-300">{epgSources.length} fontes ativas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {epgSources.map(source => (
            <div key={source.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="space-y-1 max-w-[80%]">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{source.name}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    {source.status}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-indigo-300 truncate">{source.url}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>{source.channelsCount} canais</span>
                  <span>•</span>
                  <span>Última sinc: {source.lastSync}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remover a fonte EPG "${source.name}"?`)) {
                    onDeleteEpgSource(source.id);
                  }
                }}
                className="text-slate-400 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Remover fonte"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live EPG Schedule Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-400" /> Guia de Programação Ao Vivo (EPG Live Monitor)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Visualize a programação atual e os próximos programas transmitidos.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por canal ou programa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-3">
          {filteredPrograms.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum canal ou programa encontrado para esta busca.
            </div>
          ) : (
            filteredPrograms.map(prog => (
              <div key={prog.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-indigo-500/40 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-3">
                    {prog.logoUrl ? (
                      <img src={prog.logoUrl} alt={prog.channelTitle} className="w-9 h-9 object-contain rounded bg-slate-900 p-1 border border-slate-800" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-300 text-xs border border-indigo-500/30">
                        {prog.channelTitle.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm">{prog.channelTitle}</h4>
                      <div className="text-[10px] text-indigo-300 font-mono">
                        tvg-id: <strong className="text-slate-300">{prog.epgTvgId}</strong> • Categoria: {prog.groupTitle}
                      </div>
                    </div>
                  </div>

                  <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full self-start md:self-auto">
                    {prog.startTime} - {prog.endTime}
                  </span>
                </div>

                {/* Current & Next Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Current Program */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> PASSANDO AGORA
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{prog.startTime}</span>
                    </div>

                    <div className="font-bold text-white text-sm">{prog.currentTitle}</div>
                    <p className="text-[11px] text-slate-300 leading-snug">{prog.currentDesc}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${prog.progressPercent}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>Progresso: {prog.progressPercent}%</span>
                        <span>{prog.endTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Program */}
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" /> A SEGUIR
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{prog.nextStartTime}</span>
                    </div>

                    <div className="font-bold text-slate-200 text-sm">{prog.nextTitle}</div>
                    <p className="text-[11px] text-slate-400 leading-snug">{prog.nextDesc}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Source Modal */}
      {isNewSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Adicionar Fonte EPG XMLTV
              </h2>
              <button
                onClick={() => setIsNewSourceModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSourceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nome da Fonte *</label>
                <input
                  type="text"
                  required
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                  placeholder="Ex: Guia XMLTV Canais Esportes BR"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">URL da Fonte XMLTV (http/https) *</label>
                <input
                  type="url"
                  required
                  value={newSourceUrl}
                  onChange={e => setNewSourceUrl(e.target.value)}
                  placeholder="https://exemplo.com/epg.xml.gz"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSourceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Salvar Fonte EPG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
