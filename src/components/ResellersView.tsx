import React, { useState } from 'react';
import { Reseller, Customer } from '../types';
import {
  Users,
  UserPlus,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Edit,
  PlusCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  DollarSign,
  Phone,
  Mail,
  Key,
  List
} from 'lucide-react';

interface ResellersViewProps {
  resellers: Reseller[];
  customers: Customer[];
  onSaveReseller: (reseller: Reseller) => void;
  onUpdateReseller: (id: string, reseller: Partial<Reseller>) => void;
  onDeleteReseller: (id: string) => void;
  onRechargeCredits: (resellerId: string, amount: number) => void;
}

export const ResellersView: React.FC<ResellersViewProps> = ({
  resellers,
  customers,
  onSaveReseller,
  onUpdateReseller,
  onDeleteReseller,
  onRechargeCredits
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isSubCustomersModalOpen, setIsSubCustomersModalOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);

  // Form state for creation / editing
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCredits, setFormCredits] = useState(25);
  const [formPricePerCredit, setFormPricePerCredit] = useState(8.50);
  const [formNotes, setFormNotes] = useState('');

  // Recharge state
  const [rechargeAmount, setRechargeAmount] = useState(10);

  // Stats
  const totalResellers = resellers.length;
  const activeResellers = resellers.filter(r => r.status === 'active').length;
  const totalCredits = resellers.reduce((acc, r) => acc + (r.credits || 0), 0);
  const totalSubCustomers = resellers.reduce((acc, r) => acc + (r.customersCount || 0), 0);

  const filteredResellers = resellers.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setSelectedReseller(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormUsername('');
    setFormPassword('');
    setFormCredits(25);
    setFormPricePerCredit(8.50);
    setFormNotes('');
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (r: Reseller) => {
    setSelectedReseller(r);
    setFormName(r.name);
    setFormEmail(r.email);
    setFormPhone(r.phone || '');
    setFormUsername(r.username);
    setFormPassword(r.plainPassword || '');
    setFormCredits(r.credits);
    setFormPricePerCredit(r.pricePerCredit || 8.50);
    setFormNotes(r.notes || '');
    setIsNewModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername) return;

    if (selectedReseller) {
      onUpdateReseller(selectedReseller.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        username: formUsername,
        plainPassword: formPassword,
        credits: Number(formCredits),
        pricePerCredit: Number(formPricePerCredit),
        notes: formNotes
      });
      alert(`✅ Revendedor ${formName} atualizado com sucesso!`);
    } else {
      const newReseller: Reseller = {
        id: `res-${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        username: formUsername.toLowerCase().trim(),
        plainPassword: formPassword || 'reseller123',
        credits: Number(formCredits),
        pricePerCredit: Number(formPricePerCredit),
        customersCount: 0,
        status: 'active',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: formNotes
      };
      onSaveReseller(newReseller);
      alert(`🎉 Novo Revendedor ${newReseller.name} criado com sucesso!`);
    }
    setIsNewModalOpen(false);
  };

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReseller || rechargeAmount <= 0) return;
    onRechargeCredits(selectedReseller.id, Number(rechargeAmount));
    alert(`💳 ${rechargeAmount} créditos recarregados com sucesso para ${selectedReseller.name}!`);
    setIsRechargeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" /> Painel de Revendedores (Master & Resellers)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie sua rede de revendedores, distribuição de créditos, novos logins e sub-clientes IPTV / P2P.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Cadastrar Novo Revendedor
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Total de Revendedores</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalResellers}</h3>
            <p className="text-[10px] text-emerald-400 mt-0.5">{activeResellers} ativos na rede</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Créditos em Circulação</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{totalCredits} <span className="text-xs text-slate-400 font-normal">créditos</span></h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Disponíveis para revenda</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Clientes da Rede</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalSubCustomers} <span className="text-xs text-slate-400 font-normal">sub-clientes</span></h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Criados via revendedores</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold">Faturamento Estimado</p>
            <h3 className="text-2xl font-black text-indigo-300 mt-1">
              R$ {(resellers.reduce((acc, r) => acc + (r.credits * (r.pricePerCredit || 8.5)), 0)).toFixed(2)}
            </h3>
            <p className="text-[10px] text-indigo-400 mt-0.5">Valor em saldo de créditos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar revendedor por nome, email ou usuário..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'active', 'suspended'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : 'Suspensos'}
              </button>
            ))}
          </div>
        </div>

        {/* Resellers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Revendedor</th>
                <th className="px-4 py-3">Contato / Login</th>
                <th className="px-4 py-3">Saldo Créditos</th>
                <th className="px-4 py-3">Preço / Crédito</th>
                <th className="px-4 py-3">Sub-Clientes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum revendedor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredResellers.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 uppercase shrink-0">
                          {r.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{r.name}</div>
                          <div className="text-[10px] text-slate-400">Cadastrado em {r.createdAt}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="font-mono text-indigo-300 flex items-center gap-1 text-[11px]">
                          <Key className="w-3 h-3 text-slate-400" /> {r.username}
                        </div>
                        {r.email && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {r.email}
                          </div>
                        )}
                        {r.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {r.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-sm ${r.credits > 10 ? 'text-emerald-400' : r.credits > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {r.credits}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedReseller(r);
                            setRechargeAmount(10);
                            setIsRechargeModalOpen(true);
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Coins className="w-3 h-3" /> Recarregar
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-300">
                      R$ {(r.pricePerCredit || 8.50).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-300">
                      <button
                        onClick={() => {
                          setSelectedReseller(r);
                          setIsSubCustomersModalOpen(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <List className="w-3.5 h-3.5 text-indigo-400" /> {r.customersCount || 0} clientes
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          onUpdateReseller(r.id, {
                            status: r.status === 'active' ? 'suspended' : 'active'
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all ${
                          r.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                      >
                        {r.status === 'active' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Suspenso
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          title="Editar Revendedor"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir o revendedor "${r.name}"?`)) {
                              onDeleteReseller(r.id);
                            }
                          }}
                          title="Excluir Revendedor"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                {selectedReseller ? 'Editar Revendedor' : 'Cadastrar Novo Revendedor'}
              </h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: Roberto Vendas IPTV"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nome de Usuário (Login) *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="Ex: robertovendas"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="roberto@email.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+55 11 99999-8888"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Senha de Acesso</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="Senha do painel"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Saldo Inicial de Créditos</label>
                  <input
                    type="number"
                    min="0"
                    value={formCredits}
                    onChange={e => setFormCredits(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Preço por Crédito (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formPricePerCredit}
                    onChange={e => setFormPricePerCredit(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Observações Internas</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Região de atuação, canal de suporte, etc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  {selectedReseller ? 'Salvar Alterações' : 'Criar Revendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recharge Credits Modal */}
      {isRechargeModalOpen && selectedReseller && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" /> Recarregar Créditos
              </h2>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Revendedor: <strong className="text-white">{selectedReseller.name}</strong>
              <br />
              Saldo Atual: <strong className="text-amber-400 font-mono">{selectedReseller.credits} créditos</strong>
            </p>

            <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quantidade de Créditos a Adicionar</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={rechargeAmount}
                  onChange={e => setRechargeAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Preço unitário:</span>
                  <span className="font-mono text-white">R$ {(selectedReseller.pricePerCredit || 8.5).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-300 pt-1 border-t border-slate-800">
                  <span>Valor total a cobrar:</span>
                  <span className="font-mono text-emerald-400">
                    R$ {(rechargeAmount * (selectedReseller.pricePerCredit || 8.5)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechargeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
                >
                  Confirmar Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub Customers List Modal */}
      {isSubCustomersModalOpen && selectedReseller && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Sub-Clientes de {selectedReseller.name}
              </h2>
              <button
                onClick={() => setIsSubCustomersModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Total de clientes registrados para este revendedor: <strong className="text-indigo-300 font-mono">{selectedReseller.customersCount || 0}</strong>
            </p>

            <div className="space-y-2">
              {customers.slice(0, selectedReseller.customersCount || 3).map((c, idx) => (
                <div key={c.id || idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[10px] text-indigo-300 font-mono">{c.username}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {c.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">Expira: {c.expiresAt}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSubCustomersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
