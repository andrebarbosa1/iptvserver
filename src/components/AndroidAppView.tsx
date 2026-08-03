import React, { useState } from 'react';
import { ANDROID_CODEBASE } from '../data/androidCodebase';
import { DEFAULT_ANDROID_CONFIG } from '../data/initialData';
import { AndroidAppConfig } from '../types';
import { Smartphone, Tv, Download, Copy, Code2, Play, Check, Shield, Layers, Radio, Heart, Search, User } from 'lucide-react';

export const AndroidAppView: React.FC = () => {
  const [config, setConfig] = useState<AndroidAppConfig>(DEFAULT_ANDROID_CONFIG);
  const [activeTab, setActiveTab] = useState<'simulator' | 'codebase'>('simulator');
  const [deviceMode, setDeviceMode] = useState<'tv' | 'mobile'>('tv');
  const [selectedFile, setSelectedFile] = useState(ANDROID_CODEBASE[0]);
  const [copied, setCopied] = useState(false);

  // Simulator Interactive State
  const [simScreen, setSimScreen] = useState<'splash' | 'login' | 'home' | 'player'>('home');
  const [simChannel, setSimChannel] = useState('NASA TV Official HD');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" /> Aplicativo Android & Smart TV Box (Kotlin / ExoPlayer)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Projeto completo com Material Design 3, suporte a controle remoto Leanback D-Pad, ExoPlayer e API Xtream Codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Simulador de App
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'codebase'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Código Fonte Kotlin
          </button>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurator */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Personalizar App White Label
            </h2>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Nome do Aplicativo</label>
              <input
                type="text"
                value={config.appName}
                onChange={e => setConfig({ ...config, appName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Package ID (Android ID)</label>
              <input
                type="text"
                value={config.packageName}
                onChange={e => setConfig({ ...config, packageName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">URL Padrão do Servidor</label>
              <input
                type="text"
                value={config.serverUrl}
                onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono"
              />
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-2 font-semibold">Dispositivo Simulado</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeviceMode('tv')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                    deviceMode === 'tv'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Tv className="w-4 h-4" /> Android TV 16:9
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                    deviceMode === 'mobile'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Smartphone 9:16
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  alert('Gerando pacote Android Studio (.zip) para download...');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar Código Fonte Android (.zip)
              </button>
            </div>
          </div>

          {/* Interactive Screen Device Simulator */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
            {deviceMode === 'tv' ? (
              /* TV Frame 16:9 */
              <div className="w-full max-w-2xl aspect-video bg-slate-900 border-4 border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col justify-between p-4">
                {/* TV Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white text-sm">{config.appName} TV</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold">1080p 60fps</span>
                    <span>11:35</span>
                  </div>
                </div>

                {/* TV Main Body */}
                <div className="my-auto py-2">
                  {simScreen === 'home' && (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Categorias em Destaque (Leanback TV)
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div
                          onClick={() => {
                            setSimChannel('NASA TV Official HD');
                            setSimScreen('player');
                          }}
                          className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-500/40 hover:scale-105 cursor-pointer transition-transform"
                        >
                          <Radio className="w-6 h-6 text-indigo-400 mb-2" />
                          <div className="font-bold text-white text-sm">Canais Ao Vivo</div>
                          <div className="text-[10px] text-slate-300">TV Aberta & Esportes 4K</div>
                        </div>

                        <div
                          onClick={() => {
                            setSimChannel('Big Buck Bunny 4K');
                            setSimScreen('player');
                          }}
                          className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:scale-105 cursor-pointer transition-transform"
                        >
                          <Play className="w-6 h-6 text-emerald-400 mb-2" />
                          <div className="font-bold text-white text-sm">Filmes VOD</div>
                          <div className="text-[10px] text-slate-300">Lançamentos 2026</div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:scale-105 cursor-pointer transition-transform">
                          <Heart className="w-6 h-6 text-rose-400 mb-2" />
                          <div className="font-bold text-white text-sm">Favoritos</div>
                          <div className="text-[10px] text-slate-300">Canais salvos</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simScreen === 'player' && (
                    <div className="text-center space-y-3">
                      <div className="aspect-video max-h-48 bg-black rounded-xl mx-auto flex items-center justify-center border border-indigo-500/50">
                        <div className="text-center">
                          <Radio className="w-8 h-8 text-indigo-400 mx-auto animate-pulse mb-2" />
                          <div className="font-bold text-white">{simChannel}</div>
                          <div className="text-xs text-emerald-400 font-mono">ExoPlayer HLS Engine Playing</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSimScreen('home')}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-1.5 rounded-lg border border-slate-700"
                      >
                        Voltar para a Lista
                      </button>
                    </div>
                  )}
                </div>

                {/* TV Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Pressione D-Pad para navegar</span>
                  <span>Servidor: {config.serverUrl}</span>
                </div>
              </div>
            ) : (
              /* Mobile Frame Vertical 9:16 */
              <div className="w-64 h-[480px] bg-slate-900 border-4 border-slate-700 rounded-[32px] p-3 shadow-2xl relative flex flex-col justify-between">
                <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2"></div>
                <div className="flex-1 bg-slate-950 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-white">{config.appName}</span>
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>

                  <div className="space-y-2 my-auto">
                    <div className="bg-indigo-900/30 p-2.5 rounded-xl border border-indigo-500/30 text-xs">
                      <div className="font-bold text-white">Canal Ao Vivo</div>
                      <div className="text-[10px] text-slate-300">NASA TV 1080p</div>
                    </div>
                    <div className="bg-slate-800 p-2.5 rounded-xl text-xs">
                      <div className="font-bold text-white">Filme VOD</div>
                      <div className="text-[10px] text-slate-300">Sintel 4K</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-around border-t border-slate-800 pt-2 text-slate-400">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <Search className="w-4 h-4" />
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Codebase Explorer */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Arquivos Kotlin Android Studio</h2>
            {ANDROID_CODEBASE.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${
                  selectedFile.path === f.path
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="truncate text-white font-sans font-bold">{f.path.split('/').pop()}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{f.description}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white font-mono">{selectedFile.path}</h2>
                <p className="text-xs text-slate-400">{selectedFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-indigo-200 overflow-x-auto max-h-[500px]">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
