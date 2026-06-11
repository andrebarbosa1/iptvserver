import React, { useState } from "react";
import { 
  Users, Search, Plus, Edit, Trash, Copy, Check, Calendar, 
  UserX, UserCheck, AlertCircle, RefreshCw, Smartphone, Mail, FileText 
} from "lucide-react";
import { Client, Channel } from "../types";

interface ClientsManagerProps {
  clients: Client[];
  channels: Channel[];
  onAddClient: (client: Omit<Client, "id" | "createdAt">) => Promise<void>;
  onUpdateClient: (id: string, updated: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  baseUrl: string;
}

export default function ClientsManager({ 
  clients, 
  channels, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  baseUrl 
}: ClientsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Connect Modes & Dynamic Copying for Xtream Codes Compatibility
  const [clientSelectedApps, setClientSelectedApps] = useState<Record<string, "m3u" | "xc" | "smarters" | "tivimate" | "gse" | "ssiptv">>({});
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyField = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAppInstructions = (client: Client, appType: string) => {
    let text = "";
    if (appType === "smarters") {
      text = `*DADOS DE ACESSO - IPTV SMARTERS PRO* 📱\n\nAbra o aplicativo, escolha *Entrar com Xtream Codes API*:\n\n👤 *Nome do Perfil:* ${client.name}\n🌐 *URL do Servidor:* ${baseUrl}\n👤 *Usuário:* ${client.token}\n🔑 *Senha:* ${client.token}\n\n⚠️ *Atenção:* Respeite as maiúsculas e minúsculas ao digitar.`;
    } else if (appType === "tivimate") {
      text = `*CONFIGURAÇÃO TIVIMATE* ⭐\n\nVocê pode configurar no TiviMate por qualquer método abaixo:\n\n👉 *Opção 1: Xtream Codes (Recomendado)*\n🌐 *Endereço/URL:* ${baseUrl}\n👤 *Usuário:* ${client.token}\n🔑 *Senha:* ${client.token}\n\n👉 *Opção 2: Playlist M3U*\n🔗 *Playlist URL:* ${baseUrl}/playlist/${client.token}`;
    } else if (appType === "gse") {
      text = `*GSE SMART IPTV SETUP* 💎\n\nAbra o menu lateral do GSE Smart IPTV e escolha:\n\n👉 *Opção Playlist Remota (M3U):*\n🔗 *Link:* ${baseUrl}/playlist/${client.token}\n\n👉 *Opção Xtream Codes API:*\n🌐 *Servidor:* ${baseUrl}\n👤 *Usuário:* ${client.token}\n🔑 *Senha:* ${client.token}`;
    } else if (appType === "ssiptv") {
      text = `*SS IPTV / SMART TV SETUP* 🔌\n\nPara carregar a sua lista de canais via navegador ou painel de envio:\n\n🔗 *Link M3U:* ${baseUrl}/playlist/${client.token}\n\n💡 Cole o link m3u acima no campo correspondente ao seu código da TV.`;
    } else if (appType === "m3u") {
      text = `*LINK M3U DIRETO* 🔗\n\nCopie este link para qualquer reprodutor compatível:\n${baseUrl}/playlist/${client.token}`;
    } else {
      text = `*CREDENCIAIS XTREAM CODES API* 📺\n\n🌐 *Servidor:* ${baseUrl}\n👤 *Usuário:* ${client.token}\n🔑 *Senha:* ${client.token}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedAppId(`${appType}-${client.id}`);
    setTimeout(() => setCopiedAppId(null), 2500);
    alert(`Instruções para ${client.name} copiadas para a área de transferência!`);
  };

  const handleCopyXCAll = (client: Client) => {
    const formatted = `Servidor: ${baseUrl}\nUsuário: ${client.token}\nSenha: ${client.token}`;
    navigator.clipboard.writeText(formatted);
    alert(`Dados Xtream Codes copiados para ${client.name}!\n\n${formatted}`);
  };

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"trial" | "monthly" | "yearly">("monthly");
  const [status, setStatus] = useState<"active" | "expired" | "suspended" | "trial">("active");
  const [expirationDate, setExpirationDate] = useState("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Get distinct categories from channels to allocate as packages
  const availablePackages = Array.from(new Set(channels.map((ch) => ch.category))).filter((cat) => cat);
  if (availablePackages.length === 0) {
    availablePackages.push("Canais Abertos", "Esportes", "Filmes", "Notícias & Ciência");
  }

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName("");
    setEmail("");
    setPhone("");
    setSubscriptionType("monthly");
    setStatus("active");
    // default 30 days
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setExpirationDate(exp);
    setSelectedPackages([...availablePackages]); // select all by default
    setToken(Math.random().toString(36).substring(2, 10));
    setNotes("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setSubscriptionType(client.subscriptionType);
    setStatus(client.status);
    setExpirationDate(client.expirationDate);
    setSelectedPackages(client.packages);
    setToken(client.token);
    setNotes(client.notes || "");
    setIsModalOpen(true);
  };

  const handleCopyLink = (clientToken: string, clientId: string) => {
    // Standard playlist url that players fetch
    const url = `${baseUrl}/playlist/${clientToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clientId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePackage = (pkg: string) => {
    if (selectedPackages.includes(pkg)) {
      setSelectedPackages(selectedPackages.filter(p => p !== pkg));
    } else {
      setSelectedPackages([...selectedPackages, pkg]);
    }
  };

  const handleSelectSubscriptionType = (type: "trial" | "monthly" | "yearly") => {
    setSubscriptionType(type);
    let days = 30;
    if (type === "trial") {
      days = 3;
      setStatus("trial");
    } else if (type === "yearly") {
      days = 365;
      setStatus("active");
    } else {
      days = 30;
      setStatus("active");
    }
    const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setExpirationDate(exp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      email,
      phone,
      subscriptionType,
      status,
      expirationDate,
      packages: selectedPackages,
      token: token || Math.random().toString(36).substring(2, 10),
      notes: notes || ""
    };

    if (editingClient) {
      await onUpdateClient(editingClient.id, payload);
    } else {
      await onAddClient(payload);
    }
    setIsModalOpen(false);
  };

  const handleQuickRenew = async (client: Client) => {
    // Adds 30 days starting from either today or previous expiration (whichever is later)
    const currentExp = new Date(client.expirationDate);
    const today = new Date();
    const startDate = currentExp > today ? currentExp : today;
    const newExp = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    await onUpdateClient(client.id, {
      expirationDate: newExp,
      status: client.subscriptionType === "trial" ? "active" : client.status === "expired" ? "active" : client.status,
      subscriptionType: client.subscriptionType === "trial" ? "monthly" : client.subscriptionType
    });
  };

  // Filter lists
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.token.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if system date shows expired
    const isActuallyExpired = client.expirationDate < todayStr || client.status === 'expired';

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = client.status === 'active' && !isActuallyExpired;
    } else if (statusFilter === 'expired') {
      matchesStatus = isActuallyExpired;
    } else if (statusFilter === 'suspended') {
      matchesStatus = client.status === 'suspended';
    } else if (statusFilter === 'trial') {
      matchesStatus = client.status === 'trial' && !isActuallyExpired;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight" id="clients-title">Gerenciamento de Clientes</h2>
          <p className="text-slate-400 text-sm">Cadastre, edite, suspenda ou renove assinaturas e configure os pacotes M3U.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer self-start sm:self-auto transition duration-200"
          id="btn-add-client"
        >
          <Plus className="w-4 h-4" /> Cadastrar Cliente
        </button>
      </div>

      {/* Filter and Search rail */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por nome, celular, e-mail ou token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition duration-150"
            id="client-search"
          />
        </div>
        
        <div className="flex gap-2 min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-sky-500 transition"
            id="client-status-filter"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="trial">Contas Teste</option>
            <option value="expired">Vencidos / Expirados</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </div>

      {/* Grid of clients */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-12 text-center text-slate-500 shadow-md">
          <UserX className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-semibold text-slate-400">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Tente ajustar a sua busca ou filtros, ou comece adicionando um novo cliente no botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="clients-grid">
          {filteredClients.map((client) => {
            const isActuallyExpired = client.expirationDate < todayStr || client.status === 'expired';
            let statusBadge = null;

            if (client.status === 'suspended') {
              statusBadge = <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Suspenso</span>;
            } else if (isActuallyExpired) {
              statusBadge = <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Expirado</span>;
            } else if (client.status === 'trial') {
              statusBadge = <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Teste</span>;
            } else {
              statusBadge = <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Ativo</span>;
            }

            return (
              <div 
                key={client.id} 
                className={`bg-slate-850 border rounded-xl p-5 shadow-lg shadow-black/10 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 ${isActuallyExpired ? 'border-red-950/40 bg-zinc-900/65' : 'border-slate-800'}`}
                id={`client-card-${client.id}`}
              >
                {/* Client header information */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <h3 className="font-bold text-slate-100 text-[15px]">{client.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">ID: {client.id}</span>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className={isActuallyExpired ? "text-rose-400 font-semibold" : "text-slate-300"}>
                        Validade: {client.expirationDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/15 px-2 py-0.5 rounded">
                        {client.subscriptionType === 'trial' ? 'Teste (3d)' : client.subscriptionType === 'monthly' ? 'Mensal' : 'Anual'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {client.packages.length} pacotes ativos
                      </span>
                    </div>

                    {client.notes && (
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/40 mt-3 text-slate-400 text-[11px]">
                        <span className="font-semibold block text-slate-300 mb-0.5">Nota Interna:</span>
                        {client.notes}
                      </div>
                    )}
                  </div>
                </div>
                {/* Playlist URLs and action buttons */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  
                  {/* Select Export Format / App Profile */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Formato de Exportação / App:</label>
                    <select
                      value={clientSelectedApps[client.id] || "m3u"}
                      onChange={(e) => setClientSelectedApps(prev => ({ ...prev, [client.id]: e.target.value as any }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 transition font-medium cursor-pointer"
                    >
                      <option value="m3u">🔗 Link M3U Direto</option>
                      <option value="xc">📺 Xtream Codes Genérico</option>
                      <option value="smarters">📱 IPTV Smarters Pro (URL, Usuário, Senha)</option>
                      <option value="tivimate">⭐ TiviMate (M3U + Xtream API)</option>
                      <option value="gse">💎 GSE Smart IPTV (M3U + Xtream)</option>
                      <option value="ssiptv">🔌 SS IPTV / Smart TV (M3U Link)</option>
                    </select>
                  </div>

                  {/* Render content based on selected format */}
                  {(clientSelectedApps[client.id] || "m3u") === "m3u" && (
                    /* Playlist Link M3U Box */
                    <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-850 flex items-center justify-between">
                      <div className="text-left overflow-hidden mr-2 flex-1">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">Playlist Link M3U</span>
                        <span className="text-[11px] text-sky-400 truncate block font-mono select-all">
                          {`${baseUrl}/playlist/${client.token}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(client.token, client.id)}
                          className={`p-1.5 rounded-lg border border-slate-800 transition cursor-pointer ${
                            copiedId === client.id 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                              : 'bg-slate-800 hover:bg-slate-755 text-slate-400 hover:text-slate-100'
                          }`}
                          title="Copiar Link"
                        >
                          {copiedId === client.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Atenção: Deseja redefinir e trocar o token de acesso de ${client.name}? O link antigo de playlist deixará de funcionar imediatamente, gerando logs de erro de acesso para conexões antigas.`)) {
                              const newToken = Math.random().toString(36).substring(2, 10);
                              await onUpdateClient(client.id, { token: newToken });
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-800 hover:bg-slate-755 text-amber-500 hover:text-amber-400 transition cursor-pointer"
                          title="Redefinir Token (Segurança)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {(clientSelectedApps[client.id] || "m3u") === "xc" && (
                    /* Xtream Codes Detailed Credentials Box */
                    <div className="space-y-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-850">
                      <div className="flex items-center justify-between text-[9px] text-slate-550 uppercase font-bold tracking-wide pb-1 border-b border-transparent bg-slate-950/20 px-1 py-0.5 rounded">
                        <span className="text-slate-400">Credenciais Xtream Codes</span>
                        <button 
                          type="button"
                          onClick={() => handleCopyXCAll(client)}
                          className="text-sky-455 hover:text-sky-350 flex items-center gap-0.5 font-bold transition px-1 py-0.5 rounded hover:bg-sky-500/10 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copiar Tudo
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between bg-slate-950/50 p-1 px-2 rounded border border-slate-850">
                          <span className="text-slate-500 text-[8px] uppercase font-bold w-12 flex-shrink-0">URL:</span>
                          <span className="text-slate-300 truncate mr-1 flex-1 text-right select-all">{baseUrl}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(baseUrl, `server-${client.id}`)}
                            className="p-1 hover:bg-slate-850 text-slate-450 rounded transition cursor-pointer"
                            title="Copiar URL"
                          >
                            {copiedField === `server-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between bg-slate-950/50 p-1 px-2 rounded border border-slate-850">
                          <span className="text-slate-500 text-[8px] uppercase font-bold w-12 flex-shrink-0">User:</span>
                          <span className="text-slate-300 truncate mr-1 flex-1 text-right select-all">{client.token}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(client.token, `user-${client.id}`)}
                            className="p-1 hover:bg-slate-850 text-slate-450 rounded transition cursor-pointer"
                            title="Copiar Usuário"
                          >
                            {copiedField === `user-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950/50 p-1 px-2 rounded border border-slate-850">
                          <span className="text-slate-500 text-[8px] uppercase font-bold w-12 flex-shrink-0">Pass:</span>
                          <span className="text-slate-300 truncate mr-1 flex-1 text-right select-all">{client.token}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(client.token, `pass-${client.id}`)}
                            className="p-1 hover:bg-slate-850 text-slate-450 rounded transition cursor-pointer"
                            title="Copiar Senha"
                          >
                            {copiedField === `pass-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(clientSelectedApps[client.id] || "m3u") === "smarters" && (
                    /* IPTV Smarters Pro View Option */
                    <div className="space-y-1.5 bg-sky-955/20 p-2 rounded-lg border border-sky-500/20">
                      <div className="flex items-center justify-between pb-1 border-b border-sky-500/10">
                        <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wide flex items-center gap-1">
                          📱 IPTV Smarters Pro
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyAppInstructions(client, "smarters")}
                          className="bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 text-[9px] font-bold py-0.5 px-1.5 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          {copiedAppId === `smarters-${client.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          Copiar Formatado (Zap)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between bg-slate-905/40 p-1 px-2 rounded">
                          <span className="text-slate-400 text-[8px] uppercase font-bold w-16">U. Servidor:</span>
                          <span className="text-sky-305 truncate mr-1 flex-1 text-right select-all">{baseUrl}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(baseUrl, `server-${client.id}`)}
                            className="text-slate-450 hover:text-slate-305 p-0.5 cursor-pointer"
                          >
                            {copiedField === `server-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-slate-905/40 p-1 px-2 rounded">
                          <span className="text-slate-400 text-[8px] uppercase font-bold w-16">Usuário:</span>
                          <span className="text-sky-305 truncate mr-1 flex-1 text-right select-all">{client.token}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(client.token, `user-${client.id}`)}
                            className="text-slate-450 hover:text-slate-305 p-0.5 cursor-pointer"
                          >
                            {copiedField === `user-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-slate-905/40 p-1 px-2 rounded">
                          <span className="text-slate-400 text-[8px] uppercase font-bold w-16">Senha:</span>
                          <span className="text-sky-305 truncate mr-1 flex-1 text-right select-all">{client.token}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(client.token, `pass-${client.id}`)}
                            className="text-slate-450 hover:text-slate-305 p-0.5 cursor-pointer"
                          >
                            {copiedField === `pass-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-500 block leading-tight pt-0.5">💡 No Smarters, use a opção "Entrar com Xtream Codes API".</span>
                    </div>
                  )}

                  {(clientSelectedApps[client.id] || "m3u") === "tivimate" && (
                    /* TiviMate Multi-Setup Option */
                    <div className="space-y-1.5 bg-amber-955/15 p-2 rounded-lg border border-amber-500/20">
                      <div className="flex items-center justify-between pb-1 border-b border-amber-500/10">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                          ⭐ TiviMate IPTV
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyAppInstructions(client, "tivimate")}
                          className="bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-[9px] font-bold py-0.5 px-1.5 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          {copiedAppId === `tivimate-${client.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          Copiar Tudo (Zap)
                        </button>
                      </div>

                      <div className="space-y-1">
                        {/* Xtream API Box */}
                        <div className="p-1 px-1.5 bg-slate-950/45 rounded space-y-1">
                          <span className="text-[8px] text-amber-400 font-bold block uppercase tracking-wide">Método 1: Xtream API</span>
                          <div className="text-[10px] font-mono text-slate-350 space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-slate-450">URL:</span> <span className="select-all block text-[11px] truncate">{baseUrl}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-450">User/Pass:</span> <span className="select-all block text-[11px] font-bold text-amber-450">{client.token}</span>
                            </div>
                          </div>
                        </div>

                        {/* M3U Link option */}
                        <div className="p-1 px-1.5 bg-slate-950/45 rounded flex items-center justify-between">
                          <div className="text-left overflow-hidden flex-1 mr-1">
                            <span className="text-[8px] text-slate-505 block font-bold uppercase">Método 2: Playlist Link M3U</span>
                            <span className="text-[10.5px] text-sky-455 font-mono truncate block select-all">{`${baseUrl}/playlist/${client.token}`}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleCopyField(`${baseUrl}/playlist/${client.token}`, `m3u-${client.id}`)}
                            className="bg-slate-900 border border-slate-800 p-1 text-slate-400 hover:text-slate-100 rounded cursor-pointer"
                          >
                            {copiedField === `m3u-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(clientSelectedApps[client.id] || "m3u") === "gse" && (
                    /* GSE Smart IPTV Layout */
                    <div className="space-y-1.5 bg-violet-955/20 p-2 rounded-lg border border-violet-500/20">
                      <div className="flex items-center justify-between pb-1 border-b border-violet-500/10">
                        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wide flex items-center gap-1">
                          💎 GSE Smart IPTV
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyAppInstructions(client, "gse")}
                          className="bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 text-[9px] font-bold py-0.5 px-1.5 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          {copiedAppId === `gse-${client.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          Copiar GSE
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="p-1 px-1.5 bg-slate-955/45 rounded">
                          <span className="text-[8px] text-slate-505 block uppercase font-bold">1. Playlist Remota (Link M3U)</span>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-[10.5px] text-sky-400 font-mono truncate select-all block flex-1">{`${baseUrl}/playlist/${client.token}`}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyField(`${baseUrl}/playlist/${client.token}`, `m3u-${client.id}`)}
                              className="text-slate-450 hover:text-slate-300 p-0.5 cursor-pointer"
                            >
                              {copiedField === `m3u-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="p-1 px-1.5 bg-slate-955/45 rounded space-y-0.5 text-[10px] font-mono">
                          <span className="text-[8px] text-slate-505 block uppercase font-bold">2. Alternativa Xtream Codes API</span>
                          <div className="flex justify-between">
                            <span className="text-slate-455">Servidor:</span> <span className="select-all block truncate text-slate-300">{baseUrl}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-455">Usuário/Senha:</span> <span className="select-all block text-violet-350">{client.token}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(clientSelectedApps[client.id] || "m3u") === "ssiptv" && (
                    /* SS IPTV Smart TV focused format */
                    <div className="space-y-1.5 bg-emerald-955/15 p-2 rounded-lg border border-emerald-500/20">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-500/10">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1">
                          🔌 SS IPTV / Smart TV
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyAppInstructions(client, "ssiptv")}
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-[9px] font-bold py-0.5 px-1.5 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          {copiedAppId === `ssiptv-${client.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          Copiar Instruções (Zap)
                        </button>
                      </div>

                      <div className="space-y-1 bg-slate-955/45 p-1.5 rounded">
                        <span className="text-[8px] text-slate-505 block uppercase font-bold">Endereço de Link Externo (M3U)</span>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[11px] text-emerald-400 font-mono truncate select-all block flex-1">{`${baseUrl}/playlist/${client.token}`}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyField(`${baseUrl}/playlist/${client.token}`, `ssiptv-copy-${client.id}`)}
                            className="bg-slate-900 border border-slate-800 p-1 text-slate-400 hover:text-slate-100 rounded cursor-pointer"
                          >
                            {copiedField === `ssiptv-copy-${client.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-500 block leading-tight">💡 Insira este link na seção "Lista de Reprodução Externa" de SS IPTV.</span>
                    </div>
                  )}

                  {/* Player Web Browser Watch Box */}
                  <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-850 flex items-center justify-between font-normal">
                    <div className="text-left overflow-hidden mr-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide font-normal">Player Web (Assistir)</span>
                      <a 
                        href={`/?play=${client.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:underline truncate block font-mono"
                      >
                        {`${baseUrl}/?play=${client.token}`}
                      </a>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${baseUrl}/?play=${client.token}`;
                        navigator.clipboard.writeText(url);
                        alert(`Link do WebPlayer copiado para ${client.name}! \n\n${url}`);
                      }}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-800 hover:bg-slate-755 text-slate-400 hover:text-slate-105 transition cursor-pointer flex-shrink-0"
                      title="Copiar Link do Player"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleQuickRenew(client)}
                      className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition font-medium"
                      title="Renovar mais 30 dias"
                    >
                      <RefreshCw className="w-3 h-3" /> +30 Dias
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="bg-slate-800 hover:bg-slate-700 hover:text-slate-100 shadow border border-slate-700/40 p-1.5 rounded-lg text-slate-300 cursor-pointer transition"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza de que deseja remover o cliente ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="bg-red-950/30 hover:bg-red-950/70 text-red-400 p-1.5 rounded-lg shadow border border-red-950/50 hover:text-red-300 cursor-pointer transition"
                        title="Excluir"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-850 hover:shadow-black/75 rounded-2xl border border-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Head */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-lg">
                {editingClient ? "Editar Cadastro de Cliente" : "Adicionar Novo Cliente"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / Celular</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +55 (11) 99999-9999"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: joao@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="block text-xs font-semibold text-slate-400 mb-2">Plano de Assinatura</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["trial", "monthly", "yearly"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectSubscriptionType(type)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border uppercase transition cursor-pointer text-center ${
                        subscriptionType === type
                          ? 'bg-sky-500 border-sky-600 text-white shadow-md'
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      {type === "trial" ? "Teste (3d)" : type === "monthly" ? "Mensal (30d)" : "Anual (365d)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status do Acesso</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="active">✓ Ativo</option>
                    <option value="trial">⚡ Teste Temporário</option>
                    <option value="expired">⚠ Expirado / Pendente</option>
                    <option value="suspended">🔒 Suspenso / Bloqueado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Expiração</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Pacote checkbox configurations */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pacotes Permitidos (Filtro por Categorias)
                </label>
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {availablePackages.map((pkg) => (
                    <label key={pkg} className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg)}
                        onChange={() => handleTogglePackage(pkg)}
                        className="rounded bg-slate-800 border-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="truncate">{pkg}</span>
                    </label>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">O cliente terá acesso exclusivo apenas às categorias de canais selecionadas acima no M3U dele.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">M3U Token de Acesso</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="Chave única do link"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ações M3U</label>
                  <button
                    type="button"
                    onClick={() => setToken(Math.random().toString(36).substring(2, 11))}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:text-slate-100 text-slate-300 rounded-xl font-bold py-2.5 text-xs text-center cursor-pointer transition border-dashed"
                  >
                    Gerar Novo Token
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas Internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pagou via PIX no dia 10..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-150 focus:outline-none focus:border-sky-500 resize-none transition"
                />
              </div>

              <div className="flex gap-2.5 pt-4 justify-end border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {editingClient ? "Salvar Alterações" : "Salvar Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
