import React, { useState } from 'react';
import { PHP_CODEBASE, PhpFile } from '../data/phpCodebase';
import { Database, CheckCircle, AlertCircle, Copy, Download, Code2, Server, Terminal, Shield, FileText } from 'lucide-react';

export const PhpInstallerExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'installer' | 'codebase'>('installer');
  const [selectedFile, setSelectedFile] = useState<PhpFile>(PHP_CODEBASE[0]);
  const [copied, setCopied] = useState(false);

  // Installer Wizard State
  const [installStep, setInstallStep] = useState<1 | 2 | 3>(1);
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('streamflow_db');
  const [dbUser, setDbUser] = useState('root');
  const [dbPass, setDbPass] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@streamflow.com');
  const [adminPass, setAdminPass] = useState('Admin@123');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunInstaller = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      setIsInstalled(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" /> Instalador do Banco de Dados & Arquitetura PHP 8.3 MVC
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulador de `install.php` com verificação de PDO MySQL, criação de tabelas e gerenciador de arquivos do backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('installer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'installer' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Simulador install.php
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'codebase' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Código Fonte PHP 8.3 (.zip)
          </button>
        </div>
      </div>

      {activeTab === 'installer' ? (
        <div className="max-w-2xl mx-auto bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" /> Instalador do Sistema (install.php)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Testando compatibilidade PHP 8.3, extensões cURL, OpenSSL, PDO_MySQL e permissões de escrita.
            </p>
          </div>

          {/* System Pre-Check Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'PHP 8.3.0+', ok: true },
              { label: 'PDO MySQL', ok: true },
              { label: 'cURL & MBString', ok: true },
              { label: 'OpenSSL', ok: true }
            ].map((check, idx) => (
              <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">{check.label}</span>
              </div>
            ))}
          </div>

          {isInstalled ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Instalação Concluída com Sucesso!</h3>
              <p className="text-xs text-slate-300">
                As tabelas do MySQL 8 foram criadas e o usuário administrador <strong>{adminEmail}</strong> foi registrado.
                O arquivo <code className="text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded">install.php</code> foi autodeletado por segurança.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRunInstaller} className="space-y-4 text-xs">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">1. Conexão MySQL 8</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Host MySQL</label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={e => setDbHost(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Porta MySQL</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={e => setDbPort(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={e => setDbName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Usuário MySQL</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={e => setDbUser(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-800" />

              <div className="space-y-3">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">2. Administrador Master</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">E-mail do Admin</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Senha do Admin</label>
                    <input
                      type="password"
                      value={adminPass}
                      onChange={e => setAdminPass(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInstalling}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 text-xs transition-all"
              >
                {isInstalling ? 'Criando Tabelas no MySQL 8...' : 'Executar Instalação e Criar Tabelas'}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* PHP MVC Codebase Browser */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estrutura de Arquivos PHP 8.3 MVC</h2>
            {PHP_CODEBASE.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${
                  selectedFile.path === f.path
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="truncate text-white font-sans font-bold">{f.path}</div>
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
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
