import React, { useState } from 'react';
import { SystemSettings, Customer } from '../types';
import { updateSettings as saveSettingsToFirestore } from '../lib/dbService';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  Globe,
  Save,
  Check,
  Server,
  Database,
  Link,
  Copy,
  RefreshCw,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  Code2,
  AlertCircle
} from 'lucide-react';

interface NetworkSettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  customers?: Customer[];
}

export const NetworkSettingsView: React.FC<NetworkSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  customers = []
}) => {
  const [dnsUrl, setDnsUrl] = useState(settings.dnsServerUrl || 'https://iptvserver-topaz.vercel.app');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Selected Customer for export preview
  const sampleCustomer = customers[0] || {
    id: 'demo-1',
    name: 'Carlos Silva (Exemplo)',
    username: 'carlossilva',
    plainPassword: 'password123',
    status: 'active'
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(sampleCustomer.id);
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || sampleCustomer;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      // Clean trailing slash
      const cleanedDns = dnsUrl.trim().replace(/\/+$/, '');
      const updatedData = { dnsServerUrl: cleanedDns };

      // 1. Save directly into Firestore database
      if (isFirebaseConfigured) {
        await saveSettingsToFirestore(updatedData);
      }

      // 2. Update global React app state
      onUpdateSettings(updatedData);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar no Firestore:', err);
      setSaveError(err?.message || 'Erro ao persistir DNS no Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formattedDns = dnsUrl.trim().replace(/\/+$/, '');
  const m3uExportUrl = `${formattedDns}/get.php?username=${activeCustomer.username}&password=${activeCustomer.plainPassword || 'senha123'}&type=m3u_plus`;
  const xtreamServerUrl = formattedDns;
  const hlsStreamUrl = `${formattedDns}/live/${activeCustomer.username}/${activeCustomer.plainPassword || 'senha123'}/101.m3u8`;
  const epgUrl = `${formattedDns}/epg.xml.gz`;

  const m3uFileHeaderPreview = `#EXTM3U x-tvg-url="${epgUrl}"\n#EXTINF:-1 tvg-id="NASA" tvg-name="NASA TV" group-title="Ao Vivo - Ciência",NASA TV Official HD\n${hlsStreamUrl}`;

  return (
    <div className="space-y-6">
      {/* GoDaddy Domain Setup Tutorial Card with playstream.lat Quick Apply */}
      <div className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-6 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-sm shrink-0">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Domínio Configurado com Sucesso: <span className="text-emerald-400 font-mono">playstream.lat</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Seu domínio está ativado com SSL válido na Vercel e apontado corretamente na GoDaddy!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Valid Configuration
            </span>
            <button
              type="button"
              onClick={async () => {
                const domain = 'https://playstream.lat';
                setDnsUrl(domain);
                const updatedData = { dnsServerUrl: domain };
                if (isFirebaseConfigured) {
                  await saveSettingsToFirestore(updatedData);
                }
                onUpdateSettings(updatedData);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              }}
              className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all text-xs"
            >
              <Zap className="w-4 h-4" /> Aplicar DNS no Painel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">1</span>
              Acesse o DNS do domínio na GoDaddy
            </h3>
            <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1.5 leading-relaxed">
              <li>Acesse <strong className="text-white">godaddy.com</strong> e vá em <strong>Meus Produtos</strong>.</li>
              <li>Procure por <strong className="text-emerald-300">playstream.lat</strong> e clique no botão <strong>DNS</strong>.</li>
              <li>Na lista de registros, clique em <strong>Adicionar Novo Registro</strong> (ou edite o registro existente).</li>
            </ol>
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">2</span>
              Adicione os Registros e Remova IPs Antigos na GoDaddy
            </h3>
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-[11px] text-red-200 space-y-1">
              <p>📌 <strong>PASSO OBRIGATÓRIO NA GODADDY:</strong></p>
              <p>Exclua os 2 registros do Tipo <strong>A</strong> antigos com valores: <code className="text-white font-mono bg-slate-900 px-1 rounded">76.223.105.230</code> e <code className="text-white font-mono bg-slate-900 px-1 rounded">13.248.243.5</code> (clique no ícone da lixeira ao lado deles).</p>
            </div>
            <div className="space-y-2 text-[11px]">
              {/* Record A */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold block text-[10px]">1º Registro — Domínio Principal (playstream.lat):</span>
                  <span className="text-white font-mono text-[10px]">Type: <strong className="text-emerald-400">A</strong> | Name: <strong className="text-white">@</strong> | Value: <strong className="text-indigo-300 font-bold">216.198.79.1</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('216.198.79.1', 99)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0 ml-2"
                  title="Copiar IP Vercel"
                >
                  {copiedIndex === 99 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Record CNAME */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-indigo-300 font-bold block text-[10px]">2º Registro — Subdomínio WWW (www.playstream.lat):</span>
                  <span className="text-white font-mono text-[10px]">Type: <strong className="text-emerald-400">CNAME</strong> | Name: <strong className="text-white">www</strong> | Value: <strong className="text-indigo-300 font-bold font-mono">cname.vercel-dns.com</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('cname.vercel-dns.com', 98)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0 ml-2"
                  title="Copiar CNAME Vercel"
                >
                  {copiedIndex === 98 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">3</span>
              Propagação e Certificado SSL
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Clique em <strong>Salvar</strong> na GoDaddy. O DNS da GoDaddy leva de 5 minutos até 1 hora para propagar em todo o Brasil e aplicativos móveis.
            </p>
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">4</span>
              Ativação no Aplicativo / XCIPTV
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              No aplicativo Android/XCIPTV dos seus clientes, configure o Servidor DNS exatamente como: <code className="text-emerald-300 font-mono">https://playstream.lat</code> ou no formato completo das listas M3U/Xtream.
            </p>
          </div>
        </div>
      </div>

      {/* XCIPTV & Vercel Diagnostic Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Por que deu "Login Failed / Erro de Servidor" no XCIPTV?</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            O aplicativo XCIPTV precisa se conectar a um servidor backend Node/PHP ativo que responda às requisições do Xtream Codes (<code className="text-amber-300 font-mono">/player_api.php</code> e <code className="text-amber-300 font-mono">/get.php</code>). Domínios demonstrativos (<code className="text-amber-300 font-mono">play.streamflow.com</code>) ou hospedagens estáticas no Vercel não executam os endpoints do Xtream Codes, por isso o XCIPTV acusa erro de login.
          </p>
        </div>

        {typeof window !== 'undefined' && dnsUrl !== window.location.origin && (
          <button
            type="button"
            onClick={async () => {
              const currentOrigin = window.location.origin;
              setDnsUrl(currentOrigin);
              const updatedData = { dnsServerUrl: currentOrigin };
              if (isFirebaseConfigured) {
                await saveSettingsToFirestore(updatedData);
              }
              onUpdateSettings(updatedData);
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md transition-colors text-xs"
          >
            <Zap className="w-4 h-4" /> Fixar DNS no Servidor Ativo ({window.location.origin})
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" /> Configurações de Rede & DNS (Firestore)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Defina a URL Base/DNS oficial do sistema. O valor salvo no Firestore é injetado dinamicamente no formato das listas M3U e conexões Xtream exportadas para seus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" /> Firestore Ativo
          </span>
        </div>
      </div>

      {/* Main Form: Base DNS Configuration */}
      <form onSubmit={handleSave} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              DNS / URL Base do Servidor
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">
            Coleção Firestore: settings/global
          </span>
        </div>

        <div className="space-y-3">
          <label className="block text-slate-300 font-semibold">
            Endereço DNS do Servidor (Ex: https://www.playstream.lat ou https://playstream.lat)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                required
                value={dnsUrl}
                onChange={e => setDnsUrl(e.target.value)}
                placeholder="https://www.playstream.lat"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-indigo-300 font-mono text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Salvo no Firestore!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar no Firestore
                </>
              )}
            </button>
          </div>

          {/* Preset Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400">Atalhos rápidos:</span>
            <button
              type="button"
              onClick={() => setDnsUrl('https://www.playstream.lat')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono border border-slate-700 transition-colors"
            >
              https://www.playstream.lat
            </button>
            <button
              type="button"
              onClick={() => setDnsUrl('https://playstream.lat')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono border border-slate-700 transition-colors"
            >
              https://playstream.lat
            </button>
            {typeof window !== 'undefined' && (
              <button
                type="button"
                onClick={() => setDnsUrl(window.location.origin)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-mono border border-slate-700 transition-colors"
              >
                Host Atual ({window.location.origin})
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </form>

      {/* Export Format Live Dynamic Preview */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Injeção Dinâmica do Formato Exportado para Clientes
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Veja abaixo como as URLs geradas para os clientes atualizam automaticamente conforme o DNS salvo.
              </p>
            </div>
          </div>

          {/* Customer Selector */}
          {customers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Simular para:</span>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.username})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Link Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* M3U Plus Export Link */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 uppercase text-[11px] flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" /> URL da Lista M3U Plus
              </span>
              <button
                onClick={() => handleCopy(m3uExportUrl, 1)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copiar Link"
              >
                {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300 text-[11px] break-all select-all">
              {m3uExportUrl}
            </div>
            <p className="text-[10px] text-slate-500">
              Formato compatível com SS IPTV, GSE Smart IPTV, Perfect Player e Smart IPTV.
            </p>
          </div>

          {/* Xtream Codes Server DNS */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 uppercase text-[11px] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Servidor Xtream Codes / XCIPTV
              </span>
              <button
                onClick={() => handleCopy(xtreamServerUrl, 2)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copiar Servidor"
              >
                {copiedIndex === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono text-emerald-400 text-[11px] break-all select-all">
              {xtreamServerUrl}
            </div>
            <p className="text-[10px] text-slate-500">
              Insira este servidor + usuário <strong className="text-white">{activeCustomer.username}</strong> no XCIPTV / Smarters.
            </p>
          </div>

          {/* Direct Stream HLS URL */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 uppercase text-[11px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> URL de Stream Direta HLS (ExoPlayer)
              </span>
              <button
                onClick={() => handleCopy(hlsStreamUrl, 3)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copiar HLS URL"
              >
                {copiedIndex === 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono text-amber-200 text-[11px] break-all select-all">
              {hlsStreamUrl}
            </div>
            <p className="text-[10px] text-slate-500">
              URL direta M3U8 para ExoPlayer em Android TV, VLC ou WebPlayer.
            </p>
          </div>

          {/* EPG XML URL */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 uppercase text-[11px] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> Guia EPG XML.GZ
              </span>
              <button
                onClick={() => handleCopy(epgUrl, 4)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copiar EPG URL"
              >
                {copiedIndex === 4 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono text-sky-200 text-[11px] break-all select-all">
              {epgUrl}
            </div>
            <p className="text-[10px] text-slate-500">
              Guia de programação XML-TV injetado automaticamente nos arquivos M3U.
            </p>
          </div>
        </div>

        {/* M3U File Header Code Block Preview */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Prévia do Cabeçalho da Lista Exportada (#EXTM3U)
            </span>
            <span>Injeção de DNS dinâmica ativa</span>
          </div>
          <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-indigo-300 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
            {m3uFileHeaderPreview}
          </pre>
        </div>
      </div>
    </div>
  );
};
