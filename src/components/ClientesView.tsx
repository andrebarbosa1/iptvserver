import React, { useState } from 'react';
import { Customer, Playlist, UserStatus, SystemSettings } from '../types';
import { Search, Plus, Filter, Edit, Trash2, Copy, PlaySquare, Check, Ban, RefreshCw, Key, Shield, User, Smartphone, Sparkles, ExternalLink } from 'lucide-react';

interface ClientesViewProps {
  customers: Customer[];
  playlists: Playlist[];
  settings: SystemSettings;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (id: string, updated: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onTestLineInPlayer: (customer: Customer) => void;
  onClearAllData?: (includePlaylists?: boolean) => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  customers,
  playlists,
  settings,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onTestLineInPlayer,
  onClearAllData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedM3uCustomer, setSelectedM3uCustomer] = useState<Customer | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // New Customer Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlanDays, setFormPlanDays] = useState(30);
  const [formMaxConn, setFormMaxConn] = useState(2);
  const [formPlaylistId, setFormPlaylistId] = useState(playlists[0]?.id || 'pl-1');
  const [formNotes, setFormNotes] = useState('');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formPassword || !formName) return;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + formPlanDays);

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        username: formUsername,
        plainPassword: formPassword,
        planDurationDays: formPlanDays,
        maxConnections: formMaxConn,
        playlistId: formPlaylistId,
        notes: formNotes,
      });
    } else {
      const newCust: Customer = {
        id: `cli-${Date.now().toString(36)}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        username: formUsername,
        passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        plainPassword: formPassword,
        status: 'active',
        planDurationDays: formPlanDays,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        expiresAt: expiresDate.toISOString().replace('T', ' ').substring(0, 16),
        maxConnections: formMaxConn,
        activeConnections: 0,
        playlistId: formPlaylistId,
        notes: formNotes,
      };
      onAddCustomer(newCust);
    }

    closeModal();
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormUsername(`user_${Math.floor(1000 + Math.random() * 9000)}`);
    setFormPassword(`pass${Math.floor(100 + Math.random() * 900)}`);
    setFormPlanDays(30);
    setFormMaxConn(2);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormUsername(c.username);
    setFormPassword(c.plainPassword || 'password123');
    setFormPlanDays(c.planDurationDays);
    setFormMaxConn(c.maxConnections);
    setFormNotes(c.notes || '');
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCustomer(null);
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Ativo</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">Suspenso</span>;
      case 'expired':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">Expirado</span>;
      case 'trial':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">Em Teste</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" /> Gerenciamento de Clientes e Assinaturas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre clientes, ative planos, gere links M3U8 autorizados e monitore status em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onClearAllData && customers.length > 0 && (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Zerar Base de Clientes
            </button>
          )}

          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Cliente
          </button>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar por nome, usuário, e-mail ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Ativos' },
            { id: 'trial', label: 'Em Teste' },
            { id: 'expired', label: 'Expirados' },
            { id: 'suspended', label: 'Suspensos' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/80 uppercase font-extrabold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Cliente / E-mail</th>
                <th className="p-4">Usuário / Senha</th>
                <th className="p-4">Status</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Conexões</th>
                <th className="p-4">Expiração</th>
                <th className="p-4 text-center">Credenciais M3U</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum cliente encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.email || c.phone}</div>
                    </td>
                    <td className="p-4 font-mono">
                      <div className="text-indigo-300 font-semibold">{c.username}</div>
                      <div className="text-slate-400 text-[11px]">{c.plainPassword || '••••••••'}</div>
                    </td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-200">
                        {c.planDurationDays === 0 ? 'Teste Grátis' : `${c.planDurationDays} Dias`}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{c.activeConnections}</span> / {c.maxConnections} telas
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{c.expiresAt}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedM3uCustomer(c)}
                        className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <Key className="w-3.5 h-3.5 text-indigo-400" /> Gerar M3U / Xtream
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onTestLineInPlayer(c)}
                          title="Testar linha no Web Streaming Player"
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                        >
                          <PlaySquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          title="Editar Cliente"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {c.status === 'active' ? (
                          <button
                            onClick={() => onUpdateCustomer(c.id, { status: 'suspended' })}
                            title="Suspender Linha"
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateCustomer(c.id, { status: 'active' })}
                            title="Ativar Linha"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o cliente ${c.name}?`)) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          title="Excluir Cliente"
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+55 11 99999-8888"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">E-mail</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-indigo-300 mb-1 font-semibold">Usuário M3U / Xtream *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-indigo-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-indigo-300 mb-1 font-semibold">Senha *</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-indigo-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Duração do Plano</label>
                  <select
                    value={formPlanDays}
                    onChange={e => setFormPlanDays(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={30}>30 Dias (Mensal)</option>
                    <option value={60}>60 Dias (Bimestral)</option>
                    <option value={90}>90 Dias (Trimestral)</option>
                    <option value={180}>180 Dias (Semestral)</option>
                    <option value={365}>365 Dias (Anual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Telas Simultâneas</label>
                  <select
                    value={formMaxConn}
                    onChange={e => setFormMaxConn(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={1}>1 Conexão</option>
                    <option value={2}>2 Conexões</option>
                    <option value={3}>3 Conexões</option>
                    <option value={4}>4 Conexões</option>
                    <option value={5}>5 Conexões VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Playlist de Canais Autorizada</label>
                <select
                  value={formPlaylistId}
                  onChange={e => setFormPlaylistId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.itemCount} itens)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Observações / Notas</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Instruções de pagamento, preferências, etc..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* M3U & Xtream Credentials Modal */}
      {selectedM3uCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" /> Links M3U e Xtream Codes
                </h2>
                <p className="text-xs text-slate-400">Cliente: {selectedM3uCustomer.name}</p>
              </div>
              <button
                onClick={() => setSelectedM3uCustomer(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* M3U URL Plus */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-indigo-300 uppercase">URL da Lista M3U Plus</span>
                  {copiedKey === 'm3u' ? (
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  ) : (
                    <button
                      onClick={() =>
                        handleCopy(
                          `${settings.dnsServerUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/get.php?username=${selectedM3uCustomer.username}&password=${selectedM3uCustomer.plainPassword || 'password123'}&type=m3u_plus`,
                          'm3u'
                        )
                      }
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar M3U
                    </button>
                  )}
                </div>
                <code className="block bg-slate-900 p-2 rounded text-indigo-200 break-all font-mono text-[11px]">
                  {`${settings.dnsServerUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/get.php?username=${selectedM3uCustomer.username}&password=${selectedM3uCustomer.plainPassword || 'password123'}&type=m3u_plus`}
                </code>
              </div>

              {/* Xtream Credentials Format */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2">
                <span className="font-semibold text-emerald-400 uppercase block">Formato Xtream Codes / App Android / XCIPTV</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">Servidor / URL:</span>
                    <span className="text-white font-bold break-all">{settings.dnsServerUrl || (typeof window !== 'undefined' ? window.location.origin : '')}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">Usuário:</span>
                    <span className="text-indigo-300 font-bold">{selectedM3uCustomer.username}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">Senha:</span>
                    <span className="text-indigo-300 font-bold">{selectedM3uCustomer.plainPassword || 'password123'}</span>
                  </div>
                </div>
              </div>

              {/* Web Player Quick Launch */}
              <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Testar Linha no Player Web</div>
                  <div className="text-[11px] text-slate-300">Abre a transmissão ao vivo instantaneamente</div>
                </div>
                <button
                  onClick={() => {
                    onTestLineInPlayer(selectedM3uCustomer);
                    setSelectedM3uCustomer(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <PlaySquare className="w-4 h-4" /> Abrir Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wipe / Clear Data Confirmation Modal */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Zerar Todos os Clientes e Testes?</h2>
                <p className="text-xs text-slate-400">Esta ação é irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a apagar todos os clientes demonstrativos, testes e assinaturas do sistema para começar a cadastrar seus próprios dados reais.
            </p>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <div>✓ Apaga todos os clientes de teste</div>
              <div>✓ Apaga os logs e históricos anteriores</div>
              <div>✓ Permite que você crie seus novos clientes com o DNS <strong className="text-indigo-300">{settings.dnsServerUrl}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onClearAllData) {
                    onClearAllData(false);
                  }
                  setIsConfirmClearOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
              >
                Sim, Zerar Todos os Clientes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

