import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Send, Copy, Check, Search, Calendar,
  Edit, Plus, Trash2, ShieldAlert, User, Smartphone, RefreshCw, Info, DollarSign, ExternalLink
} from "lucide-react";
import { Client, WhatsAppTemplate } from "../types";

interface WhatsAppManagerProps {
  clients: Client[];
  baseUrl: string;
}

export default function WhatsAppManager({ clients, baseUrl }: WhatsAppManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customPrice, setCustomPrice] = useState("35.00");

  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateText, setNewTemplateText] = useState("");
  
  const [copiedPreview, setCopiedPreview] = useState(false);

  // States to add new template
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addName, setAddName] = useState("");
  const [addText, setAddText] = useState("");

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await fetch("/api/whatsapp/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Format expiration dates safely
  const formatExpiDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Replace placeholders dynamically with real user records
  const compileMessage = (templateText: string, clientInstance: Client | null) => {
    if (!clientInstance) return templateText;
    
    const clientName = clientInstance.name;
    const clientExp = formatExpiDate(clientInstance.expirationDate);
    const clientPlayer = `${baseUrl}/?play=${clientInstance.token}`;
    const clientM3u = `${baseUrl}/playlist/${clientInstance.token}`;
    
    return templateText
      .replace(/{CLIENTE}/g, clientName)
      .replace(/{VENCIMENTO_CLIENTE}/g, clientExp)
      .replace(/{VALOR}/g, parseFloat(customPrice || "0").toFixed(2))
      .replace(/{LINK_PLAYER}/g, clientPlayer)
      .replace(/{LINK_M3U}/g, clientM3u)
      .replace(/{SERVIDOR}/g, baseUrl)
      .replace(/{USUARIO}/g, clientInstance.token)
      .replace(/{SENHA}/g, clientInstance.token);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/whatsapp/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingTemplate.name, text: editingTemplate.text })
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTemplate(updated);
        setEditingTemplate(null);
      }
    } catch (err) {
      alert("Erro ao salvar template.");
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addText.trim()) return;

    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, text: addText })
      });
      if (res.ok) {
        const created = await res.json();
        setTemplates(prev => [...prev, created]);
        setSelectedTemplate(created);
        setIsAddingNew(false);
        setAddName("");
        setAddText("");
      }
    } catch (err) {
      alert("Erro ao adicionar template.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este template de mensagem?")) return;
    try {
      const res = await fetch(`/api/whatsapp/templates/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(templates[0] || null);
        }
      }
    } catch (err) {
      alert("Erro ao apagar template.");
    }
  };

  const handleCopyPreview = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleTriggerWhatsApp = (clientInstance: Client, text: string) => {
    let cleanPhone = clientInstance.phone.trim();
    if (!cleanPhone) {
      alert("Este cliente não possui número de celular cadastrado!");
      return;
    }
    // Deep clean numbers
    cleanPhone = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("55") && cleanPhone.length <= 11) {
      cleanPhone = "55" + cleanPhone; // Fallback to Brazil DDI
    }
    
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(waUrl, "_blank");
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const previewMessageText = selectedTemplate && selectedClient 
    ? compileMessage(selectedTemplate.text, selectedClient) 
    : "";

  return (
    <div className="space-y-6" id="whatsapp-sender-dashboard">
      {/* Overview introduction */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> WhatsApp Direct Messaging
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Dispare notificações, cobranças e mensagens de onboarding com placeholders dinâmicos que puxam os dados do cliente instantaneamente.
            </p>
          </div>
          
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - Selection of Customer & Settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CLIENT SELECTOR BOX */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider block">Passo 1: Selecionar Cliente</h3>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou celular..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredClients.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">Nenhum cliente cadastrado.</div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  const expired = client.status === "expired";
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition cursor-pointer flex flex-col space-y-1 ${
                        isSelected 
                          ? 'bg-sky-500/10 border-sky-500 text-white shadow-md' 
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold truncate max-w-[150px]">{client.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          expired ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {client.subscriptionType === "trial" ? "TESTE 4H" : "ATIVO"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> {client.phone || "Sem Telefone"}
                        </span>
                        <span className="flex items-center gap-0.5">
                          Validade: {formatExpiDate(client.expirationDate)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PRICES CONFIG FOR BILLING PLACEHOLDER */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Valor da Renovação (Tag)
            </h3>
            <p className="text-[10px] text-slate-500 leading-snug">
              Altere o valor abaixo para preencher automaticamente a tag <strong className="text-slate-350">{"{VALOR}"}</strong> no seu template de mensagem.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Ex: 35.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

        </div>

        {/* MIDDLE / RIGHT COLUMN - Templates lists & interactive previews */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 2: TEMPLATE SELECTOR GRID */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider block">Passo 2: Selecionar ou Configurar Template</h3>
            
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> Lendo templates...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate?.id === tpl.id;
                  const isDefaultType = tpl.id.startsWith("tpl_");
                  return (
                    <div
                      key={tpl.id}
                      className={`relative rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500/20' 
                          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setEditingTemplate(null);
                        }}
                        className="w-full text-left cursor-pointer flex-grow"
                      >
                        <h4 className="font-bold text-xs text-white block pr-4 line-clamp-1">{tpl.name}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed mt-1">{tpl.text}</p>
                      </button>

                      <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[10px]">
                        <button
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setEditingTemplate(tpl);
                          }}
                          className="text-sky-400 hover:text-sky-350 flex items-center gap-0.5 font-bold cursor-pointer transition"
                        >
                          <Edit className="w-3" /> Editar
                        </button>

                        {!isDefaultType && (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="text-red-400 hover:text-red-300 transition flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC FORM/TEMPLATE REPLACEMENT PREVIEW CARD */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
            
            {editingTemplate ? (
              /* SUB-EDITOR VIEW */
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Modo Edição de Template</h4>
                  <button 
                    onClick={() => setEditingTemplate(null)}
                    className="text-slate-500 hover:text-slate-350 text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Nome do Template</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Mensagem</label>
                  <textarea
                    rows={6}
                    value={editingTemplate.text}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-sans leading-relaxed"
                  />
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-500 flex flex-wrap gap-2 leading-relaxed">
                  <strong>Tags permitidas:</strong>
                  <code>{"{CLIENTE}"}</code>
                  <code>{"{VENCIMENTO_CLIENTE}"}</code>
                  <code>{"{VALOR}"}</code>
                  <code>{"{LINK_PLAYER}"}</code>
                  <code>{"{LINK_M3U}"}</code>
                  <code>{"{SERVIDOR}"}</code>
                  <code>{"{USUARIO}"}</code>
                  <code>{"{SENHA}"}</code>
                </div>

                <button
                  type="button"
                  onClick={handleUpdateTemplate}
                  className="bg-sky-500 hover:bg-sky-450 p-2.5 text-xs text-white font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 w-full shadow-md"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            ) : (
              /* LIVE COPY/SEND PREVIEW SECTION */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider block">Passo 3: Visualizador & Disparo Direto</h3>
                  
                  {previewMessageText && (
                    <button
                      onClick={() => handleCopyPreview(previewMessageText)}
                      className={`text-[11px] font-bold flex items-center gap-1 transition ${
                        copiedPreview ? 'text-emerald-400' : 'text-sky-400 hover:text-sky-350 cursor-pointer'
                      }`}
                    >
                      {copiedPreview ? <Check className="w-3.5" /> : <Copy className="w-3.5" />}
                      <span>{copiedPreview ? "Copiado!" : "Copiar Texto"}</span>
                    </button>
                  )}
                </div>

                {selectedClient ? (
                  <div className="space-y-3">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 font-sans text-xs text-slate-100 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      {previewMessageText}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => handleTriggerWhatsApp(selectedClient, previewMessageText)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 text-xs uppercase tracking-wider cursor-pointer transition duration-150 flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4 fill-current pr-0.5" />
                        <span>Abrir WhatsApp do(a) {selectedClient.name}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex gap-2.5 mt-2 text-[11px] text-slate-450 text-slate-400 leading-normal">
                      <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        Nenhum custo extra! O sistema monta a mensagem e redireciona para o aplicativo WhatsApp Web ou mobile, mantendo o controle total na sua conta privada de forma inteiramente grátis.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-2 select-none">
                    <User className="w-10 h-10 text-slate-600 animate-pulse" />
                    <p className="text-xs text-slate-400">Por favor, selecione um Cliente no painel esquerdo para visualizar e gerar o disparo.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CREATE NEW TEMPLATE MODAL */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 animate-scale-up shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 text-emerald-400" /> Novo Template Customizado
              </h3>
              <button 
                onClick={() => setIsAddingNew(false)} 
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Título do Template</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cobrança IPTV 10 dias"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Texto da Mensagem</label>
                <textarea
                  required
                  rows={6}
                  placeholder={`Olá {CLIENTE}, passei para lembrar que seu acesso vence dia {VENCIMENTO_CLIENTE}...`}
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-550 space-y-1 select-none">
                <span className="font-bold text-slate-450 block">Dica de Placeholders (copie e use no texto):</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded">{"{CLIENTE}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded">{"{VENCIMENTO_CLIENTE}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded">{"{VALOR}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded">{"{LINK_PLAYER}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded">{"{LINK_M3U}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded text-sky-400">{"{SERVIDOR}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded text-sky-400">{"{USUARIO}"}</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 text-[9px] font-mono rounded text-sky-400">{"{SENHA}"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-350 p-3 rounded-xl font-bold transition text-xs cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-450 text-white p-3 rounded-xl font-bold transition text-xs cursor-pointer text-center"
                >
                  Criar Template
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
