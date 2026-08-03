import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { Settings, Save, Shield, Palette, Globe, Phone, DollarSign, Key, Lock, Check, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

interface WhiteLabelSettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onClearAllData?: (includePlaylists?: boolean) => void;
}

export const WhiteLabelSettingsView: React.FC<WhiteLabelSettingsViewProps> = ({ settings, onUpdateSettings, onClearAllData }) => {
  const [form, setForm] = useState<SystemSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [includePlaylistsInWipe, setIncludePlaylistsInWipe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> Configurações White Label e Marca
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personalize a identidade visual do seu sistema de streaming, servidor DNS e regras de bloqueio.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6 text-xs">
        {/* Brand Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4" /> Identidade da Marca White Label
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Nome da Marca / Painel</label>
              <input
                type="text"
                value={form.brandName}
                onChange={e => setForm({ ...form, brandName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">URL do Logotipo</label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Server DNS & Support */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" /> Domínio DNS e Suporte ao Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-slate-400 font-semibold">URL / Domínio Servidor DNS (Principal)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.dnsServerUrl}
                  onChange={e => setForm({ ...form, dnsServerUrl: e.target.value })}
                  placeholder="https://play.streamflow.com"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, dnsServerUrl: 'https://play.streamflow.com' })}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Aplicar DNS Padrão
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Endereço DNS configurado: <strong className="text-white font-mono">https://play.streamflow.com</strong>. Todas as linhas M3U e conexões Xtream utilizarão este servidor.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">WhatsApp de Suporte</label>
              <input
                type="text"
                value={form.supportPhone}
                onChange={e => setForm({ ...form, supportPhone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Security & System Automation */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" /> Segurança e Automação de Vencimento
          </h2>

          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoBlockExpired}
                onChange={e => setForm({ ...form, autoBlockExpired: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <div className="font-bold text-white">Bloqueio Automático ao Vencer</div>
                <div className="text-[11px] text-slate-400">
                  Desativa automaticamente o acesso M3U e Xtream de clientes cuja data de validade expirar.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-800">
              <input
                type="checkbox"
                checked={form.enableCsrf}
                onChange={e => setForm({ ...form, enableCsrf: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <div className="font-bold text-white">Ativar Proteção CSRF na API</div>
                <div className="text-[11px] text-slate-400">
                  Valida tokens antiformulário para requisições do painel administrativo.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {saved && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Salvo com Sucesso!</span>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar Configurações
          </button>
        </div>
      </form>

      {/* Database Reset Section */}
      {onClearAllData && (
        <div className="bg-slate-900/80 rounded-2xl border border-rose-500/30 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Zerar / Limpar Base de Dados
              </h2>
              <p className="text-slate-400 mt-1">
                Apare todos os dados demonstrativos de clientes, testes e logs para que você possa iniciar do zero com seus próprios clientes reais.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWipeModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" /> Zerar Dados do Sistema
            </button>
          </div>
        </div>
      )}

      {/* Wipe Modal */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Confirmação de Zeramento do Sistema</h2>
                <p className="text-slate-400 text-[11px]">Limpar dados antigos do painel</p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Deseja zerar todos os dados de clientes, testes e assinaturas do sistema para adicionar seus próprios dados do zero?
            </p>

            <label className="flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includePlaylistsInWipe}
                onChange={e => setIncludePlaylistsInWipe(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <span className="text-slate-200 font-semibold">Incluir exclusão de Playlists de Canais e VODs também</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllData) {
                    onClearAllData(includePlaylistsInWipe);
                  }
                  setIsWipeModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20"
              >
                Sim, Zerar Tudo Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

