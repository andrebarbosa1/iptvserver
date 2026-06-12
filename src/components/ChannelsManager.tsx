import React, { useState, useEffect } from "react";
import { 
  Tv, Film, Search, Plus, Trash, Edit, UploadCloud, Check, 
  HelpCircle, AlertCircle, RefreshCw, Layers, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Channel } from "../types";

interface ChannelsManagerProps {
  channels: Channel[];
  onAddChannel: (channel: Omit<Channel, "id">) => Promise<void>;
  onUpdateChannel: (id: string, updated: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  onImportM3U: (m3uStr: string, replace: boolean) => Promise<{ message: string; importedCount: number }>;
}

export default function ChannelsManager({
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onImportM3U
}: ChannelsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "live" | "vod">("all");

  // Forms
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Single Item form states
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isVOD, setIsVOD] = useState(false);
  const [active, setActive] = useState(true);

  // Import form states
  const [m3uInput, setM3uInput] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; msg: string } | null>(null);

  const distinctCategories = Array.from(new Set(channels.map(ch => ch.category))).filter(Boolean);

  const handleOpenSingleCreate = () => {
    setEditingChannel(null);
    setName("");
    setUrl("");
    setLogoUrl("");
    setCategory(distinctCategories[0] || "Canais Abertos");
    setIsVOD(false);
    setActive(true);
    setIsSingleModalOpen(true);
  };

  const handleOpenSingleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setName(channel.name);
    setUrl(channel.url);
    setLogoUrl(channel.logoUrl || "");
    setCategory(channel.category);
    setIsVOD(channel.isVOD);
    setActive(channel.active);
    setIsSingleModalOpen(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !category.trim()) return;

    const payload = {
      name,
      url,
      logoUrl: logoUrl || "",
      category,
      isVOD,
      active
    };

    if (editingChannel) {
      await onUpdateChannel(editingChannel.id, payload);
    } else {
      await onAddChannel(payload);
    }
    setIsSingleModalOpen(false);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uInput.trim()) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await onImportM3U(m3uInput, replaceExisting);
      setImportResult({
        success: true,
        msg: res.message || `${res.importedCount} canais importados com sucesso!`
      });
      setM3uInput("");
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportResult(null);
      }, 2500);
    } catch (err: any) {
      setImportResult({
        success: false,
        msg: err.message || "Erro desconhecido ao processar o arquivo M3U."
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Filter channels
  const filteredChannels = channels.filter(ch => {
    const matchesSearch = 
      ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || ch.category === categoryFilter;
    
    let matchesType = true;
    if (typeFilter === "live") matchesType = !ch.isVOD;
    else if (typeFilter === "vod") matchesType = ch.isVOD;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, typeFilter]);

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChannels = filteredChannels.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight" id="channels-title">Canais & Filmes Geral</h2>
          <p className="text-slate-400 text-sm">Organize a grade de canais de TV ao vivo ou vídeos sob demanda (VODs).</p>
        </div>
        <div className="flex gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setM3uInput("");
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-sky-400 font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition"
            id="btn-import-m3u"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" /> Importar Lista M3U
          </button>
          
          <button
            onClick={handleOpenSingleCreate}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-sky-500/10 transition"
            id="btn-add-channel"
          >
            <Plus className="w-4 h-4" /> Novo Canal / VOD
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800">
        <div className="text-center p-2 border-r border-slate-800">
          <div className="text-slate-400 text-xs">Total de Itens</div>
          <div className="text-xl font-extrabold text-slate-200 mt-0.5">{channels.length}</div>
        </div>
        <div className="text-center p-2 border-r border-slate-800">
          <div className="text-slate-400 text-xs text-center flex items-center justify-center gap-1">
            <Tv className="w-3" /> Canais TV Ao Vivo
          </div>
          <div className="text-xl font-extrabold text-slate-200 mt-0.5">
            {channels.filter(c => !c.isVOD).length}
          </div>
        </div>
        <div className="text-center p-2 border-r border-slate-800">
          <div className="text-slate-400 text-xs text-center flex items-center justify-center gap-1">
            <Film className="w-3" /> Catálogo VODs
          </div>
          <div className="text-xl font-extrabold text-slate-200 mt-0.5">
            {channels.filter(c => c.isVOD).length}
          </div>
        </div>
        <div className="text-center p-2">
          <div className="text-slate-400 text-xs text-center flex items-center justify-center gap-1">
            <Layers className="w-3" /> Categorias Ativas
          </div>
          <div className="text-xl font-extrabold text-slate-200 mt-0.5">{distinctCategories.length}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por nome de canal ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:min-w-[360px]">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Categorias</option>
            {distinctCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Filtro de Tipo: Todos</option>
            <option value="live">Canais Ao Vivo</option>
            <option value="vod">Filmes / VODs</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredChannels.length === 0 ? (
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Tv className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-semibold text-slate-400">Nenhum canal/filme encontrado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Sua busca não retornou dados. Adicione novos canais manualmente ou use o importador M3U!</p>
        </div>
      ) : (
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead className="bg-slate-900 text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Mídia</th>
                  <th className="py-3.5 px-4">Canal / Título</th>
                  <th className="py-3.5 px-4">Categoria / Pacote</th>
                  <th className="py-3.5 px-4">Endereço de Rede (Stream URL)</th>
                  <th className="py-3.5 px-4">Modificado</th>
                  <th className="py-3.5 px-5 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                {paginatedChannels.map(ch => (
                  <tr key={ch.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                        {ch.logoUrl ? (
                          <img
                            src={ch.logoUrl}
                            alt={ch.name}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // fallback
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          ch.isVOD ? <Film className="w-5 text-slate-600" /> : <Tv className="w-5 text-slate-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{ch.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {ch.isVOD ? (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/15 py-0.2 px-1.5 rounded uppercase font-bold font-mono">VOD Film</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 py-0.2 px-1.5 rounded uppercase font-bold font-mono">Live HLS</span>
                        )}
                        {!ch.active && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 py-0.2 px-1.5 rounded uppercase font-bold">Inativo</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      <span className="bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1 text-xs">
                        {ch.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="text-xs font-mono text-sky-400 truncate select-all" title={ch.url}>
                        {ch.url}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      ID: {ch.id}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSingleEdit(ch)}
                          className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-slate-300 hover:text-slate-100 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o canal "${ch.name}"?`)) {
                              onDeleteChannel(ch.id);
                            }
                          }}
                          className="bg-red-950/20 hover:bg-red-950/50 text-red-400 p-1.5 rounded hover:text-red-300 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-900 px-5 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="text-xs text-slate-400">
                Exibindo <span className="font-semibold text-slate-200">{Math.min(filteredChannels.length, startIndex + 1)}</span> a{" "}
                <span className="font-semibold text-slate-200">{Math.min(filteredChannels.length, startIndex + itemsPerPage)}</span> de{" "}
                <span className="font-semibold text-slate-200">{filteredChannels.length}</span> canais
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded bg-slate-850 border border-slate-850 hover:border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-slate-850 cursor-pointer disabled:cursor-not-allowed transition"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-xs rounded border font-semibold transition cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-sky-500 border-sky-400 text-white"
                          : "bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded bg-slate-850 border border-slate-850 hover:border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-slate-850 cursor-pointer disabled:cursor-not-allowed transition"
                  title="Próxima Página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SINGLE ADD/EDIT modal */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-850 hover:shadow-black/75 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base">
                {editingChannel ? "Editar Mídia" : "Cadastrar Nova Mídia"}
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Canal ou Filme</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: HBO Family HD, Matrix Resurrections..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL de Transmissão (Stream Link)</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Ex: http://servidor.xyz:80/live/user/pass/12.m3u8 (HLS ou MP4)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-sky-400 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link da Logo (Ícone de Canal)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Ex: https://dominio.com/logos/globo.png"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria (Pacote)</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Esportes, Filmes, Abertos"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {distinctCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Conteúdo</label>
                  <select
                    value={isVOD ? "vod" : "live"}
                    onChange={(e) => setIsVOD(e.target.value === "vod")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200"
                  >
                    <option value="live">Tv Ao Vivo / Streaming</option>
                    <option value="vod">Vídeo Sob Demanda (VOD / Filme)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-ch"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-sky-500 w-4 h-4 focus:ring-0"
                />
                <label htmlFor="active-ch" className="text-xs text-slate-300 select-none cursor-pointer">
                  Disponível para Clientes (Ativo)
                </label>
              </div>

              <div className="flex gap-2.5 pt-4 justify-end border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT M3U modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-850 hover:shadow-black/75 rounded-2xl border border-slate-800 max-w-2xl w-full shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Importador de Playlist M3U em Lote
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Como usar o importador?
                </p>
                <p>
                  Cole o arquivo M3U no campo de texto abaixo. O importador lerá as tags de metadados 
                  <code className="text-sky-400 font-mono ml-1">#EXTINF:-1 tvg-logo="url" group-title="Categoria",Nome Do Canal</code> 
                  e mapeará as URLs associadas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Conteúdo do Arquivo M3U</label>
                <textarea
                  required
                  value={m3uInput}
                  onChange={(e) => setM3uInput(e.target.value)}
                  placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://example.com/logo.jpg" group-title="Canais Esportivos",ESPN Brasil\nhttp://livestream.xyz/espnbr.m3u8\n#EXTINF:-1 group-title="Filmes",Matrix Revolutions (2003)\nhttps://videoclub.xyz/matrix.mp4`}
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-sky-450 font-mono leading-relaxed focus:outline-none focus:border-sky-500 focus:ring-0 resize-y"
                />
              </div>

              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Opção de Substituição</span>
                  <span className="text-[11px] text-slate-500">Apagar todos os canais antigos ou apenas acumular?</span>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!replaceExisting ? 'bg-sky-500 border-sky-600 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-250'}`}
                  >
                    Acumular Canais
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${replaceExisting ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-250'}`}
                  >
                    Substituir Grade Inteira
                  </button>
                </div>
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-center gap-2 ${importResult.success ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>
                    {importResult.msg}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-4 justify-end border-t border-slate-800">
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={() => setIsImportModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {importLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analisando M3U...
                    </>
                  ) : (
                    "Iniciar Importação"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
