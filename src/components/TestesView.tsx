import React, { useState } from 'react';
import { Trial, Playlist, Customer, SystemSettings } from '../types';
import { Clock, Zap, Plus, CheckCircle, Copy, Trash2, ArrowRightLeft, PlaySquare, AlertTriangle, Key } from 'lucide-react';

interface TestesViewProps {
  trials: Trial[];
  playlists: Playlist[];
  settings: SystemSettings;
  onAddTrial: (trial: Trial) => void;
  onCancelTrial: (id: string) => void;
  onConvertTrialToSubscription: (trial: Trial, planDays: number) => void;
  onTestLineInPlayer: (customer: Customer) => void;
}

export const TestesView: React.FC<TestesViewProps> = ({
  trials,
  playlists,
  settings,
  onAddTrial,
  onCancelTrial,
  onConvertTrialToSubscription,
  onTestLineInPlayer
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [durationHours, setDurationHours] = useState(12);
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id || 'pl-1');
  const [convertPlanDays, setConvertPlanDays] = useState(30);
  const [convertingTrial, setConvertingTrial] = useState<Trial | null>(null);

  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const now = new Date();
    const exp = new Date(now.getTime() + durationHours * 3600 * 1000);

    const userRand = `teste_${Math.floor(1000 + Math.random() * 9000)}`;
    const passRand = `pass${Math.floor(100 + Math.random() * 900)}`;

    const newTrial: Trial = {
      id: `t-${Date.now().toString(36)}`,
      customerName: name,
      username: userRand,
      passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      durationHours,
      createdAt: now.toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: exp.toISOString().replace('T', ' ').substring(0, 16),
      status: 'active',
      playlistId,
      phone
    };

    onAddTrial(newTrial);
    setIsModalOpen(false);
    setName('');
    setPhone('');
  };

  const copyTrialLink = (trial: Trial) => {
    const url = `${settings.dnsServerUrl}/get.php?username=${trial.username}&password=pass123&type=m3u_plus`;
    navigator.clipboard.writeText(url);
    setCopiedId(trial.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Gerador de Testes Grátis M3U
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crie testes temporários (2h, 4h, 6h, 12h, 24h, 48h) e converta potenciais clientes em assinantes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300" /> Criar Novo Teste Rápido
        </button>
      </div>

      {/* Trial Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trials.length === 0 ? (
          <div className="col-span-full bg-slate-900/80 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
            Nenhum teste grátis ativo no momento. Clique no botão acima para gerar.
          </div>
        ) : (
          trials.map(t => {
            const isExpired = t.status === 'expired' || new Date(t.expiresAt).getTime() < new Date().getTime();
            return (
              <div
                key={t.id}
                className={`bg-slate-900/90 rounded-2xl p-5 border transition-all ${
                  isExpired
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : t.status === 'converted'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isExpired
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : t.status === 'converted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {isExpired ? 'Expirado' : t.status === 'converted' ? 'Convertido em Assinatura' : `${t.durationHours}h Restantes`}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{t.createdAt}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <h3 className="text-base font-bold text-white">{t.customerName}</h3>
                  {t.phone && <div className="text-xs text-slate-400">Contato: {t.phone}</div>}

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 font-mono text-xs">
                    <div className="flex justify-between text-indigo-300">
                      <span>Usuário: {t.username}</span>
                      <span>Senha: pass123</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Expira em: {t.expiresAt}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => copyTrialLink(t)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    {copiedId === t.id ? 'Copiado!' : 'Copiar Link'}
                  </button>

                  {t.status === 'active' && !isExpired && (
                    <button
                      onClick={() => setConvertingTrial(t)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold shadow-md shadow-emerald-600/20"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Converter
                    </button>
                  )}

                  <button
                    onClick={() => onCancelTrial(t.id)}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    title="Cancelar Teste"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Trial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Gerar Teste Temporário
            </h2>

            <form onSubmit={handleCreateTrial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Pedro Henrique"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+55 11 98888-7777"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Duração do Teste</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 6, 12, 24, 48].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        durationHours === h
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {h} Horas
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Playlist do Teste</label>
                <select
                  value={playlistId}
                  onChange={e => setPlaylistId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  Gerar Teste Grátis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Trial Modal */}
      {convertingTrial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" /> Converter Teste em Assinatura
            </h2>
            <p className="text-xs text-slate-400">
              Transformando o teste de <strong className="text-white">{convertingTrial.customerName}</strong> em um plano pago.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Selecione a Duração do Plano</label>
                <select
                  value={convertPlanDays}
                  onChange={e => setConvertPlanDays(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value={30}>30 Dias (Mensal - R$ 35,00)</option>
                  <option value={60}>60 Dias (Bimestral - R$ 65,00)</option>
                  <option value={90}>90 Dias (Trimestral - R$ 90,00)</option>
                  <option value={180}>180 Dias (Semestral - R$ 165,00)</option>
                  <option value={365}>365 Dias (Anual - R$ 299,00)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConvertingTrial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConvertTrialToSubscription(convertingTrial, convertPlanDays);
                    setConvertingTrial(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Confirmar Conversão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
