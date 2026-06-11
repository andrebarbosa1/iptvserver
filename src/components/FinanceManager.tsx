import React, { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Trash2, Calendar, Search, Filter, Info, PieChart, Tag, AlertCircle, RefreshCw, BarChart3, Receipt
} from "lucide-react";
import { Client, Transaction } from "../types";

interface FinanceManagerProps {
  clients: Client[];
}

export default function FinanceManager({ clients }: FinanceManagerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Manual Transaction Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("Mensalidade");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finances");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value || parseFloat(value) <= 0) return;

    try {
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          description,
          value: parseFloat(value),
          category,
          date,
          clientName: clientName.trim() || undefined
        })
      });

      if (res.ok) {
        const nextTx = await res.json();
        setTransactions(prev => [nextTx, ...prev]);
        setShowAddForm(false);
        setDescription("");
        setValue("");
        setClientName("");
      }
    } catch (err) {
      alert("Erro ao adicionar transação financeira.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este registro financeiro?")) return;
    try {
      const res = await fetch(`/api/finances/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      alert("Erro ao apagar registro.");
    }
  };

  // Safe helper to auto-detect client prices based on subscriptionType
  const getClientActiveValue = (client: Client) => {
    if (client.subscriptionType === "trial") return 0;
    if (client.subscriptionType === "yearly") return 300;
    return 35.00; // default standard R$ 35
  };

  // Core Math computations
  const totalIncomeAllTime = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpenseAllTime = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  // Current Month calculations
  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentYearMonth));

  const thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const thisMonthExpense = thisMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const thisMonthNetProfit = thisMonthIncome - thisMonthExpense;

  // Monthly Recurring Revenue Estimate (MRR based on actual active non-trial customers)
  const activePaidClients = clients.filter(c => c.status === "active" && c.subscriptionType !== "trial");
  const estimatedMRR = activePaidClients.reduce((sum, c) => {
    const rate = c.subscriptionType === "yearly" ? (300 / 12) : 35.00;
    return sum + rate;
  }, 0);

  // Filters logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          (t.clientName && t.clientName.toLowerCase().includes(search.toLowerCase())) ||
                          t.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Category statistics breakdown
  const categoryStats = transactions.reduce((acc: {[key: string]: number}, t) => {
    if (t.type === "income") {
      acc[t.category] = (acc[t.category] || 0) + t.value;
    }
    return acc;
  }, {});

  // Generate SVG Graphic historical points for the last 5 months
  const getMonthlyTimelineData = () => {
    const monthlySummary: {[key: string]: { income: number; expense: number }} = {};
    const months = [];
    
    // Build last 5 months labels
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
      const key = d.toISOString().slice(0, 7);
      months.push({ key, label });
      monthlySummary[key] = { income: 0, expense: 0 };
    }

    // Accumulate actual transaction data
    transactions.forEach(t => {
      const key = t.date.slice(0, 7);
      if (monthlySummary[key]) {
        if (t.type === "income") monthlySummary[key].income += t.value;
        else monthlySummary[key].expense += t.value;
      }
    });

    return months.map(m => ({
      label: m.label,
      income: monthlySummary[m.key].income,
      expense: monthlySummary[m.key].expense
    }));
  };

  const timelineData = getMonthlyTimelineData();
  const maxAxisVal = Math.max(...timelineData.map(d => Math.max(d.income, d.expense, 100))) * 1.15;

  return (
    <div className="space-y-6" id="finance-ledger-dashboard">
      
      {/* Title Header Branding banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Controle Financeiro & Faturamento
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Gerencie a receita das mensalidades e os pagamentos de sub-revenda. Acompanhe despesas e projete o faturamento mensal estimado do sistema.
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 self-start shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Transação</span>
          </button>
        </div>
      </div>

      {/* METRIC CARD WIDGETS GROUP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Monthly Profits */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Faturamento (Mês Atual)</span>
            <span className="text-xl font-extrabold text-white font-mono">
              R$ {thisMonthIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> faturamento ativo
            </div>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 2: Monthly Costs */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Despesas (Mês Atual)</span>
            <span className="text-xl font-extrabold text-red-400 font-mono">
              R$ {thisMonthExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" /> custos de infraestrutura
            </div>
          </div>
          <div className="bg-red-500/10 text-red-400 p-2.5 rounded-xl border border-red-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 3: Net Profit */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Lucro Líquido (Mês Atual)</span>
            <span className={`text-xl font-extrabold font-mono ${thisMonthNetProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              R$ {thisMonthNetProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              Saldo líquido apurado
            </span>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* CARD 4: Recurring Projections */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Projeção Mensal Recorrente (MRR)</span>
            <span className="text-xl font-extrabold text-sky-400 font-mono">
              R$ {estimatedMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              Base: {activePaidClients.length} clientes ativos pagos
            </span>
          </div>
          <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN - Historical Chart and Ledger lists */}
        <div className="lg:col-span-8 space-y-6">

          {/* HISTORICAL RECURRING TRENDS SVG CHART */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Fluxo Comparativo Mensal (Entradas vs. Saídas)</h3>
            
            {/* Interactive Custom SVG Chart */}
            <div className="relative pt-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl select-none">
              <div className="h-44 w-full flex items-end justify-between gap-1 mt-2">
                {timelineData.map((data, index) => {
                  const incomeHeight = data.income > 0 ? (data.income / maxAxisVal) * 100 : 2;
                  const expenseHeight = data.expense > 0 ? (data.expense / maxAxisVal) * 100 : 2;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end space-y-2 h-full">
                      <div className="flex items-end justify-center gap-1.5 w-full h-full max-w-[80px]">
                        {/* Income Bar */}
                        <div 
                          className="bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm w-3.5 transition-all duration-300 relative group"
                          style={{ height: `${incomeHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-white p-2 rounded-lg border border-slate-850 pointer-events-none transition whitespace-nowrap z-20 shadow-xl font-mono">
                            Receita: R$ {data.income.toFixed(2)}
                          </div>
                        </div>

                        {/* Expense Bar */}
                        <div 
                          className="bg-red-500/80 hover:bg-red-500 rounded-t-sm w-3.5 transition-all duration-300 relative group"
                          style={{ height: `${expenseHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-[10px] text-white p-2 rounded-lg border border-slate-850 pointer-events-none transition whitespace-nowrap z-20 shadow-xl font-mono">
                            Custo: R$ {data.expense.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-[9px] text-slate-500">{data.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend indicators */}
              <div className="flex justify-center gap-4 text-[10px] border-t border-slate-800/60 pt-3 mt-4 text-slate-450 text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                  <span>Entradas de Mensalidade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-red-400 rounded-full" />
                  <span>Saídas / Infraestrutura</span>
                </div>
              </div>
            </div>
          </div>

          {/* LEDGER TRANSACTIONS LIST WITH SEARCH & FILTERS */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Registros do Livro Caixa</h3>
              
              <div className="flex gap-2 flex-wrap">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-350 p-2 rounded-lg focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Filtro: Todos os fluxos</option>
                  <option value="income">Apenas Entradas (+)</option>
                  <option value="expense">Apenas Despesas (-)</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-350 p-2 rounded-lg focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="Mensalidade">Mensalidades</option>
                  <option value="Servidor">Servidor Panel</option>
                  <option value="Revenda">Revenda / Créditos</option>
                  <option value="Outros">Outras</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Filtrar por descrição ou cliente específico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Transactions lists table view */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Sincronizando extrato...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-slate-500 text-center py-10 border border-dashed border-slate-800 rounded-xl text-xs">Ainda não há lançamentos financeiros com os filtros selecionados.</div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  return (
                    <div
                      key={tx.id}
                      className="bg-slate-900 border border-slate-850 hover:border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 rounded-lg border flex-shrink-0 ${
                          isIncome 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {isIncome ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>

                        <div className="text-left overflow-hidden">
                          <span className="font-extrabold text-white block truncate">{tx.description}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="bg-slate-950 border border-slate-800 px-1 py-0.2 rounded font-sans uppercase font-bold text-slate-400 flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" /> {tx.category}
                            </span>
                            <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {tx.date.split("-").reverse().join("/")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right flex-shrink-0">
                        <div className="space-y-0.5 font-mono">
                          <span className={`text-[13px] font-black block ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isIncome ? "+" : "-"} R$ {tx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          {tx.clientName && (
                            <span className="text-[10px] text-slate-500 font-sans block max-w-[120px] truncate leading-none">
                              Cli: {tx.clientName}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1 px-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-600 hover:text-red-450 hover:text-red-400 rounded transition cursor-pointer"
                          title="Apagar lançamento"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Category summary and billing projection insights */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Faturamento por Distribuição</h3>
            
            <div className="space-y-2 pt-2 text-xs">
              {Object.keys(categoryStats).length === 0 ? (
                <div className="text-[10px] text-slate-500 py-4 text-center">Nenhum agrupamento de faturamento calculado.</div>
              ) : (
                Object.entries(categoryStats).map(([cat, rawTotal]) => {
                  const total = rawTotal as number;
                  const percent = totalIncomeAllTime > 0 ? (total / totalIncomeAllTime) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold">{cat}</span>
                        <span className="font-mono text-white font-extrabold text-[12px]">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/85">
                        <div className="bg-emerald-500 h-full rounded" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-sky-400" /> Balanço Acumulado Geral
            </h3>
            
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Incomes Recebidos:</span>
                <span className="font-mono text-emerald-400 font-extrabold">R$ {totalIncomeAllTime.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Despesas registradas:</span>
                <span className="font-mono text-red-400 font-extrabold">R$ {totalExpenseAllTime.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between">
                <span className="text-slate-300 font-bold">Saldo Geral de Caixa:</span>
                <span className={`font-mono text-[13px] font-black ${(totalIncomeAllTime - totalExpenseAllTime) >= 0 ? "text-amber-400" : "text-red-400"}`}>
                  R$ {(totalIncomeAllTime - totalExpenseAllTime).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ADD TRANSACTION OVERLAY PORTAL CONTAINER */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 animate-scale-up shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Novo Lançamento Financeiro</h3>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-500 hover:text-slate-350 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850 text-center font-bold">
                <button
                  type="button"
                  onClick={() => { setFormType("income"); setCategory("Mensalidade"); }}
                  className={`p-2 rounded-lg text-[11px] transition cursor-pointer ${
                    formType === "income" ? "bg-emerald-500 text-white shadow-inner" : "text-slate-400 hover:text-slate-150"
                  }`}
                >
                  📈 ENTRADA / RECEITA (+)
                </button>
                <button
                  type="button"
                  onClick={() => { setFormType("expense"); setCategory("Servidor"); }}
                  className={`p-2 rounded-lg text-[11px] transition cursor-pointer ${
                    formType === "expense" ? "bg-red-500 text-white shadow-offset" : "text-slate-400 hover:text-slate-150"
                  }`}
                >
                  📉 SAÍDA / DESPESA (-)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Valor da Transação (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="35.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Categoria do Lançamento</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-bold"
                  >
                    {formType === "income" ? (
                      <>
                        <option value="Mensalidade">Mensalidades</option>
                        <option value="Revenda">Revenda / Créditos</option>
                        <option value="Outros">Outras Receitas</option>
                      </>
                    ) : (
                      <>
                        <option value="Servidor">Custos do Servidor Mestre</option>
                        <option value="Infraestrutura">Infraestrutura Web/Hospedagem</option>
                        <option value="Divulgação">Marketing / Divulgações</option>
                        <option value="Outros">Outras Despesas</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Descrição Resumida</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assinatura Mensal João da Silva"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Nome do Cliente Relacionado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Data do Lançamento</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sky-550 bg-sky-500 hover:bg-sky-450 p-3 rounded-lg text-xs font-black text-white hover:shadow-lg transition cursor-pointer text-center uppercase tracking-wider"
              >
                Efetivar Lançamento Caixa
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
