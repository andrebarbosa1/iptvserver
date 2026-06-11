import React, { useState } from "react";
import { 
  Tv, Radio, User, Phone, Play, Copy, Check, Info, 
  HelpCircle, ShieldCheck, Gamepad2, Laptop, Smartphone, ExternalLink 
} from "lucide-react";

interface PublicTrialRequestProps {
  onSuccess: (token: string) => void;
  onExit: () => void;
}

export default function PublicTrialRequest({ onSuccess, onExit }: PublicTrialRequestProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTrial, setCreatedTrial] = useState<any | null>(null);
  const [copiedM3u, setCopiedM3u] = useState(false);
  const [copiedPlayer, setCopiedPlayer] = useState(false);

  const handleGenerateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/trials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone })
      });

      if (!res.ok) {
        throw new Error("Não foi possível gerar um teste automático agora. Tente de novo.");
      }

      const data = await res.json();
      setCreatedTrial(data);
    } catch (err: any) {
      alert(err.message || "Erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyM3u = () => {
    if (!createdTrial) return;
    const m3uUrl = `${window.location.origin}/playlist/${createdTrial.client.token}`;
    navigator.clipboard.writeText(m3uUrl);
    setCopiedM3u(true);
    setTimeout(() => setCopiedM3u(false), 2000);
  };

  const handleCopyPlayerUrl = () => {
    if (!createdTrial) return;
    const playerUrl = `${window.location.origin}/?play=${createdTrial.client.token}`;
    navigator.clipboard.writeText(playerUrl);
    setCopiedPlayer(true);
    setTimeout(() => setCopiedPlayer(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans" id="public-trial-request">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-sky-500/15 text-sky-400 p-3.5 rounded-2xl border border-sky-500/20 shadow-md">
            <Radio className="w-8 h-8 animate-pulse text-sky-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">SISTEMA IPTV AUTOMÁTICO</h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Gere o seu teste gratuito de 4 horas sem burocracia e comece a assistir instantaneamente no seu celular, computador ou TV.
          </p>
        </div>

        {!createdTrial ? (
          /* SECTION A: Trial solicitation Form */
          <form onSubmit={handleGenerateTrial} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Seu Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition duration-150"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Celular / WhatsApp (Opcional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +55 (11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition duration-150"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Configurando Playlist...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Gerar Acesso Teste de 4 Horas</span>
                </>
              )}
            </button>

            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850/60 flex items-start gap-3 mt-4 text-[11px] text-slate-400 leading-relaxed select-none">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                Ao clicar no botão acima, nosso servidor provisionará um <strong className="text-slate-300">Token temporário de 4 horas</strong> com acesso à grade de canais abertos, filmes e mídias do teste de forma online e automatizada.
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onExit}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition font-medium underline"
              >
                Voltar à página inicial do Administrador
              </button>
            </div>

          </form>
        ) : (
          /* SECTION B: Success Dashboard */
          <div className="space-y-5 animate-fade-in">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-1.5 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" strokeWidth={1.5} />
              <h3 className="font-extrabold text-emerald-400 text-base">Acesso Liberado por 4 Horas!</h3>
              <p className="text-[11px] text-slate-400">
                Seu teste foi criado às {new Date().toLocaleTimeString('pt-BR')} e expira em exatamente 4 horas.
              </p>
            </div>

            {/* Direct Watch Stream Launcher Button */}
            <button
              onClick={() => onSuccess(createdTrial.client.token)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2.5 cursor-pointer text-sm tracking-wider uppercase"
            >
              <Play className="w-4.5 h-4.5 fill-current pr-0.5 animate-pulse" />
              <span>👉 ASSISTIR AGORA NO NAVEGADOR</span>
            </button>

            {/* Credential Links Board */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Dados para conectar na sua TV ou App</h4>
              
              {/* Box M3U Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Link da Playlist M3U</span>
                  <button
                    onClick={handleCopyM3u}
                    className="text-[10px] text-sky-400 hover:text-sky-305 transition flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedM3u ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedM3u ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg font-mono text-[10px] text-slate-300 truncate">
                  {window.location.origin}/playlist/{createdTrial.client.token}
                </div>
              </div>

              {/* Box Player Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Link do WebPlayer IPTV</span>
                  <button
                    onClick={handleCopyPlayerUrl}
                    className="text-[10px] text-sky-400 hover:text-sky-305 transition flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedPlayer ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedPlayer ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg font-mono text-[10px] text-slate-300 truncate">
                  {window.location.origin}/?play={createdTrial.client.token}
                </div>
              </div>
            </div>

            {/* Dynamic visual launcher tips */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                Como configurar no seu aparelho:
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] leading-snug">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 space-y-1">
                  <Laptop className="w-5 h-5 text-sky-400 mx-auto" />
                  <span className="font-bold block text-slate-200">Computador</span>
                  <span className="text-slate-500 font-medium">Use nosso WebPlayer acima ou carregue no app VLC.</span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 space-y-1">
                  <Smartphone className="w-5 h-5 text-sky-400 mx-auto" />
                  <span className="font-bold block text-slate-200">Celular / Tablet</span>
                  <span className="text-slate-500 font-medium font-sans">Baixe GSE IPTV ou use o WebPlayer.</span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 space-y-1">
                  <Tv className="w-5 h-5 text-sky-400 mx-auto" />
                  <span className="font-bold block text-slate-200">Smart TV / TV Box</span>
                  <span className="text-slate-500 font-medium font-sans">Adicione a lista no IPTV Smarters.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setCreatedTrial(null)}
                className="text-xs text-slate-450 text-slate-400 hover:text-slate-300 cursor-pointer transition font-semibold"
              >
                Gerar Outro Teste Grátis
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
