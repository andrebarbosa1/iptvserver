import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Coins, History, Phone, Edit, Trash2, 
  Plus, Minus, Save, Search, Check, AlertCircle, FileText, Info, RefreshCw
} from "lucide-react";
import { Reseller } from "../types";

export default function ResellerCreditManager() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resellerName, setResellerName] = useState("");
  const [resellerPhone, setResellerPhone] = useState("");
  const [resellerNotes, setResellerNotes] = useState("");
  const [initialCredits, setInitialCredits] = useState("10");

  // Credit Adjustment State
  const [adjustingReseller, setAdjustingReseller] = useState<Reseller | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentAction, setAdjustmentAction] = useState<"add" | "sub">("add");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const fetchResellers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/resellers");
      if (res.ok) {
        const data = await res.json();
        setResellers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resellerName.trim()) return;

    try {
      const res = await fetch("/api/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resellerName.trim(),
          phone: resellerPhone.trim(),
          credits: parseInt(initialCredits) || 0,
          notes: resellerNotes.trim()
        })
      });

      if (res.ok) {
        const nextReseller = await res.json();
        setResellers(prev => [...prev, nextReseller]);
        setShowCreateForm(false);
        setResellerName("");
        setResellerPhone("");
        setResellerNotes("");
        setInitialCredits("10");
      }
    } catch (err) {
      alert("Erro ao criar revendedor.");
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingReseller || !adjustmentAmount) return;

    const amountNum = parseInt(adjustmentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // determine negative multiplier
    const signedAmount = adjustmentAction === "add" ? amountNum : -amountNum;
    const labelAction = adjustmentAction === "add" ? "Venda de Créditos" : "Dedução Manual";

    try {
      const res = await fetch(`/api/resellers/${adjustingReseller.id}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: signedAmount,
          action: labelAction,
          notes: adjustmentReason.trim() || undefined
        })
      });

      if (res.ok) {
        const updatedReseller = await res.json();
        setResellers(prev => prev.map(r => r.id === updatedReseller.id ? updatedReseller : r));
        setAdjustingReseller(null);
        setAdjustmentAmount("");
        setAdjustmentReason("");
      }
    } catch (err) {
      alert("Erro ao atualizar os créditos do revendedor.");
    }
  };

  const handleDeleteReseller = async (id: string) => {
    if (!confirm("Tem certeza que deseja desvincular este sub-revendedor?")) return;

    try {
      const res = await fetch(`/api/resellers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setResellers(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert("Erro de comunicação ao apagar.");
    }
  };

  // Calculations
  const filteredResellers = resellers.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.phone && r.phone.includes(search))
  );

  const totalEcosystemCredits = resellers.reduce((sum, r) => sum + r.credits, 0);

  return (
    <div className="space-y-6" id="reseller-credits-dashboard">
      
      {/* Intro branding header panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" /> Painel de Sub-Revendedores (Créditos)
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Gerencie seus sub-parceiros de vendas. Adicione e gerencie pacotes de créditos consumíveis para criação e renovação de streamings de forma autônoma.
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 self-start shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Revendedor</span>
          </button>
        </div>
      </div>

      {/* METRIC INDEXES HEADER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* CARD 1: Reseller Count */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total de Revendedores</span>
            <span className="text-xl font-extrabold text-white font-mono">{resellers.length}</span>
            <span className="text-[10px] text-slate-450 text-slate-400 font-medium block">Contas registradas no sistema</span>
          </div>
          <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 2: Total Credits Circulation */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Créditos em Circulação</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">{totalEcosystemCredits}</span>
            <span className="text-[10px] text-slate-450 text-slate-400 font-medium block">Distribuídos na revenda</span>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 3: Rules of Consumption details */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Regra de Consumo</span>
            <span className="text-sm text-slate-205 text-slate-200 block font-semibold leading-relaxed mt-1">1 Crédito = 30 dias de acesso</span>
            <span className="text-[10px] text-slate-500 font-medium block leading-snug">Trial/Teste Dedução: R$ 0 de crédito</span>
          </div>
          <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
            <Info className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* FILTER SEARCH AREA */}
      <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Buscar revendedores por nome ou DDI/Celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* RESELLERS DETAILS COLLECTION LIST */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Sincronizando sistema revendedor...
          </div>
        ) : filteredResellers.length === 0 ? (
          <div className="text-center py-12 text-slate-550 text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs m-4">Sem sub-revendedores cadastrados ou encontrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-800">
                  <th className="p-4 font-black">Revendedor / Parceiro</th>
                  <th className="p-4 font-black">Celular suporte</th>
                  <th className="p-4 font-black text-center">Saldo Crédito</th>
                  <th className="p-4 font-black">Cadastro Data</th>
                  <th className="p-4 font-black text-right">Controles Rápidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredResellers.map((reseller) => (
                  <tr key={reseller.id} className="hover:bg-slate-900/40 transition">
                    
                    {/* Reseller Name Column */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-105 text-slate-100 block text-sm">{reseller.name}</span>
                        {reseller.notes && (
                          <p className="text-[10px] text-slate-500 font-sans italic max-w-xs truncate" title={reseller.notes}>
                            Obs: {reseller.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Phone Column */}
                    <td className="p-4">
                      <span className="text-slate-300 font-mono flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {reseller.phone || "Sem contato"}
                      </span>
                    </td>

                    {/* Credit Core metrics Column */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-white text-xs font-black">{reseller.credits}</span>
                      </div>
                    </td>

                    {/* CreatedAt Column */}
                    <td className="p-4 text-slate-450 text-slate-400 font-mono">
                      {reseller.createdAt.split("-").reverse().join("/")}
                    </td>

                    {/* Actions tools Column */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingReseller(reseller);
                            setAdjustmentAction("add");
                          }}
                          className="bg-emerald-600/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/25 text-emerald-400 text-[10px] px-2.5 py-1.5 rounded-lg font-extrabold cursor-pointer transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Créditos
                        </button>

                        <button
                          onClick={() => handleDeleteReseller(reseller.id)}
                          className="bg-slate-950 hover:bg-slate-900 hover:text-red-400 border border-slate-800 text-slate-500 p-1.5 rounded-lg transition cursor-pointer"
                          title="Excluir revendedor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RECENT HISTORICAL AUDITING ENTRIES PANEL */}
        <div className="lg:col-span-12 bg-slate-850 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-400 animate-spin-slow" /> Histórico Geral de Transações da Revenda (Auditoria)
          </h3>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
            {resellers.every(r => !r.history || r.history.length === 0) ? (
              <div className="text-slate-550 text-slate-500 py-8 text-center border-t border-slate-800">Ainda sem transações gravadas de consumo de créditos.</div>
            ) : (
              resellers.flatMap(r => r.history.map(h => ({ ...h, resellerName: r.name })))
                .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((log) => {
                  const isPositive = log.creditsChanged > 0;
                  return (
                    <div key={log.id} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex items-center justify-between gap-4">
                      <div className="text-left space-y-1">
                        <span className="font-extrabold text-slate-200 block">{log.action}</span>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
                          <strong className="text-sky-400">{log.resellerName}</strong>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <span className={`font-mono font-black text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? "+" : ""}{log.creditsChanged} CRD
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* CREATE RESELLER POPUP OVERLAY */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 animate-scale-up shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Novo Revendedor Parceiro</h3>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="text-slate-505 text-slate-500 hover:text-slate-350 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleCreateReseller} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Nome do Revendedor</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Vendas IPTV"
                  value={resellerName}
                  onChange={(e) => setResellerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Celular Suporte</label>
                  <input
                    type="text"
                    placeholder="DDI + DDD + Num (Ex: 5511999999999)"
                    value={resellerPhone}
                    onChange={(e) => setResellerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Carga Inicial de Créditos</label>
                  <input
                    type="number"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Recados / Notas Internas</label>
                <textarea
                  placeholder="Ex: Revendedor parceiro de Santa Catarina"
                  rows={3}
                  value={resellerNotes}
                  onChange={(e) => setResellerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-450 p-3 rounded-xl font-black text-white hover:shadow-lg transition cursor-pointer text-center uppercase tracking-wider"
              >
                Cadastrar Revendedor
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ADJUST CREDITS BALANCE MODAL PANEL */}
      {adjustingReseller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-4 animate-scale-up shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Ajustar Crédito</h3>
              <button 
                onClick={() => setAdjustingReseller(null)} 
                className="text-slate-500 hover:text-slate-350 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs">
              <span className="text-slate-500 font-semibold uppercase block">Revendedor Selecionado:</span>
              <strong className="text-white text-[13px] block mt-0.5">{adjustingReseller.name}</strong>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 font-medium text-slate-400">
                <span>Saldo Atual:</span>
                <strong className="text-amber-400 font-mono text-[13px]">{adjustingReseller.credits} CRD</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustCredits} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850 text-center font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustmentAction("add")}
                  className={`p-2 rounded-lg text-[10px] transition cursor-pointer ${
                    adjustmentAction === "add" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ➕ INSERIR SALDO (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentAction("sub")}
                  className={`p-2 rounded-lg text-[10px] transition cursor-pointer ${
                    adjustmentAction === "sub" ? "bg-red-500 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ➖ DEDUZIR SALDO (-)
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Quantidade de Créditos</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 5"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Observação / Justificativa</label>
                <input
                  type="text"
                  placeholder="Ex: Concedido via PIX de R$ 50"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-450 p-3 rounded-xl font-bold text-white transition uppercase tracking-wider cursor-pointer"
              >
                Confirmar Lançamento Crédito
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
