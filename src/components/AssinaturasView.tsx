import React, { useState } from 'react';
import { Plan, Subscription, Customer, SystemSettings } from '../types';
import { CreditCard, RefreshCw, Plus, CheckCircle, Ban, AlertCircle, DollarSign, Calendar, Lock } from 'lucide-react';

interface AssinaturasViewProps {
  plans: Plan[];
  subscriptions: Subscription[];
  customers: Customer[];
  settings: SystemSettings;
  onUpdatePlan: (id: string, updated: Partial<Plan>) => void;
  onRenewSubscription: (customerId: string, planDays: number) => void;
}

export const AssinaturasView: React.FC<AssinaturasViewProps> = ({
  plans,
  subscriptions,
  customers,
  settings,
  onUpdatePlan,
  onRenewSubscription
}) => {
  const [selectedCustomerForRenew, setSelectedCustomerForRenew] = useState<Customer | null>(null);
  const [renewPlanDays, setRenewPlanDays] = useState(30);

  const handleRenew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForRenew) return;
    onRenewSubscription(selectedCustomerForRenew.id, renewPlanDays);
    setSelectedCustomerForRenew(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" /> Planos de Assinatura e Renovações
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure preços para os planos de 30, 60, 90, 180 e 365 dias. Bloqueio automático após o vencimento ativado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Bloqueio Automático:</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Ativo
          </span>
        </div>
      </div>

      {/* Plans Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map(p => (
          <div key={p.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {p.durationDays} Dias
                </span>
                <span className="text-xs font-bold text-emerald-400">{p.maxConnections} telas</span>
              </div>
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-2xl font-black text-white mb-3">
                {settings.currency} {p.price.toFixed(2)}
              </div>
              <button
                onClick={() => {
                  const newPrice = prompt(`Novo preço para ${p.name} (${p.durationDays} dias):`, p.price.toString());
                  if (newPrice && !isNaN(Number(newPrice))) {
                    onUpdatePlan(p.id, { price: Number(newPrice) });
                  }
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-700 transition-colors"
              >
                Editar Valor
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" /> Histórico de Renovações e Pagamentos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/80 uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Início</th>
                <th className="p-3">Vencimento</th>
                <th className="p-3">Método</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{s.customerName}</td>
                  <td className="p-3 font-semibold text-indigo-300">{s.planName}</td>
                  <td className="p-3 font-bold text-emerald-400">
                    {settings.currency} {s.amount.toFixed(2)}
                  </td>
                  <td className="p-3">{s.startDate}</td>
                  <td className="p-3">{s.endDate}</td>
                  <td className="p-3 uppercase font-mono text-[10px]">{s.paymentMethod}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        const cust = customers.find(c => c.id === s.customerId);
                        if (cust) setSelectedCustomerForRenew(cust);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded text-xs"
                    >
                      Renovar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Modal */}
      {selectedCustomerForRenew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" /> Renovar Assinatura de {selectedCustomerForRenew.name}
            </h2>

            <form onSubmit={handleRenew} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Escolha o Período de Renovação</label>
                <select
                  value={renewPlanDays}
                  onChange={e => setRenewPlanDays(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value={30}>+ 30 Dias (R$ 35,00)</option>
                  <option value={60}>+ 60 Dias (R$ 65,00)</option>
                  <option value={90}>+ 90 Dias (R$ 90,00)</option>
                  <option value={180}>+ 180 Dias (R$ 165,00)</option>
                  <option value={365}>+ 365 Dias (R$ 299,00)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForRenew(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Confirmar Renovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
