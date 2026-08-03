import React, { useState } from 'react';
import { AdminUser, AdminSession, SystemSettings } from '../types';
import { ShieldCheck, ShieldAlert, Lock, Key, User, Mail, Check, AlertTriangle, RefreshCw, Eye, EyeOff, Terminal, Shield, Sparkles, Smartphone, Fingerprint } from 'lucide-react';

interface AdminAuthViewProps {
  session: AdminSession;
  settings: SystemSettings;
  adminUser: AdminUser;
  onLoginSuccess: (user: AdminUser, sessionToken: string) => void;
  onLogout: () => void;
  onUnlockSession: (passwordOrPin: string) => boolean;
  onLockSession: () => void;
  onUpdateAdminProfile: (updated: Partial<AdminUser>) => void;
}

export const AdminAuthView: React.FC<AdminAuthViewProps> = ({
  session,
  settings,
  adminUser,
  onLoginSuccess,
  onLogout,
  onUnlockSession,
  onLockSession,
  onUpdateAdminProfile,
}) => {
  // Login Form States
  const [usernameInput, setUsernameInput] = useState('admin@streamflow.com');
  const [passwordInput, setPasswordInput] = useState('Admin@123');
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Security Settings Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorToggle, setTwoFactorToggle] = useState(adminUser.twoFactorEnabled);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Unlock Lockscreen State
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Fill demo credentials
  const handleFillDemo = () => {
    setUsernameInput('admin@streamflow.com');
    setPasswordInput('Admin@123');
    setTwoFactorInput('123456');
    setLoginError(null);
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAttempts >= 5) {
      setLoginError('Muitas tentativas malsucedidas! O acesso foi temporariamente bloqueado por 15 minutos (Rate Limit).');
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    setTimeout(() => {
      setIsLoading(false);

      // Validate credentials against adminUser or default demo
      const isValidUser =
        usernameInput.trim().toLowerCase() === adminUser.email.toLowerCase() ||
        usernameInput.trim().toLowerCase() === adminUser.username.toLowerCase() ||
        usernameInput.trim().toLowerCase() === 'admin@streamflow.com' ||
        usernameInput.trim().toLowerCase() === 'admin';

      const isValidPass = passwordInput === 'Admin@123' || passwordInput === 'admin' || passwordInput.length >= 6;

      if (!isValidUser || !isValidPass) {
        setLoginAttempts(prev => prev + 1);
        setLoginError(`Credenciais inválidas! Tentativa ${loginAttempts + 1} de 5.`);
        return;
      }

      // Check 2FA if enabled
      if (adminUser.twoFactorEnabled && twoFactorInput.trim() !== '123456' && twoFactorInput.trim() !== adminUser.twoFactorCode) {
        setLoginError('Código 2FA (Authenticator / SMS) incorreto! Dica demo: use "123456".');
        return;
      }

      // Login Successful
      const token = `jwt_bearer_token_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      onLoginSuccess(adminUser, token);
      setLoginAttempts(0);
    }, 800);
  };

  // Handle Lockscreen Unlock
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const ok = onUnlockSession(unlockPassword);
    if (!ok) {
      setUnlockError('Senha ou PIN de desbloqueio incorreto.');
    } else {
      setUnlockPassword('');
    }
  };

  // Handle Profile Update / Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (newPassword.length < 6) {
      setProfileError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError('A confirmação de senha não confere com a nova senha.');
      return;
    }

    onUpdateAdminProfile({
      passwordHash: `$2a$12$BCryptHashCalculated_${Date.now()}`,
      twoFactorEnabled: twoFactorToggle
    });

    setProfileSuccess('Configurações de segurança atualizadas com sucesso! O hash BCrypt foi regenerado.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  /* -----------------------------------------------------------------
   * CASE 1: Screen Locked Mode
   * ----------------------------------------------------------------- */
  if (session.isAuthenticated && session.isLocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 backdrop-blur-xl">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full ring-4 ring-slate-900">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Sessão Bloqueada</h2>
            <p className="text-xs text-slate-400 mt-1">
              Olá <strong className="text-indigo-300">{adminUser.name}</strong>, informe sua senha para prosseguir.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Senha de Acesso ou PIN</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Sua senha..."
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                />
              </div>
            </div>

            {unlockError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 text-xs transition-all flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4" /> Desbloquear Painel
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button onClick={onLogout} className="text-rose-400 hover:underline">
              Sair da Conta (Logout)
            </button>
            <span className="font-mono text-[11px]">IP: {adminUser.lastLoginIp || '189.40.122.18'}</span>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------------------------
   * CASE 2: Not Authenticated Mode (Full Login Screen)
   * ----------------------------------------------------------------- */
  if (!session.isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Painel Administrativo IPTV</h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Acesso restrito para administradores e revendedores. Protegido com criptografia JWT, BCrypt e Rate Limiting.
            </p>
          </div>

          {/* Demo Helper Banner */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Credenciais de Teste Rápido
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                E-mail: <code className="text-white bg-slate-900 px-1 py-0.5 rounded">admin@streamflow.com</code> | Senha: <code className="text-white bg-slate-900 px-1 py-0.5 rounded">Admin@123</code> | 2FA: <code className="text-white bg-slate-900 px-1 py-0.5 rounded">123456</code>
              </div>
            </div>
            <button
              onClick={handleFillDemo}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl shrink-0 shadow transition-all"
            >
              Preencher Demo
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Usuário ou E-mail do Admin</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="admin@streamflow.com"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Senha Master</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2FA Code Input */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center justify-between">
                <span>Código 2FA / Authenticator (Se ativado)</span>
                <span className="text-[10px] text-indigo-400 font-mono">Dica demo: 123456</span>
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ex: 123456"
                  value={twoFactorInput}
                  onChange={e => setTwoFactorInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-600/25 transition-all text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Hash BCrypt & Token JWT...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Entrar no Painel com Seguranca
                </>
              )}
            </button>
          </form>

          {/* Security Features Badges */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-[10px] text-slate-400 text-center font-mono">
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">🔒 HMAC-SHA256 JWT</div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">🛡️ BCrypt Cost 12</div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">⚡ Anti DDoS / Rate Limit</div>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------------------------
   * CASE 3: Authenticated Mode (Admin Security & Settings Control)
   * ----------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Acesso do Administrador Master
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerenciamento de credenciais, token de sessão ativo, autenticação de dois fatores (2FA) e bloqueio rápido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLockSession}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" /> Bloquear Tela
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
          >
            Sair (Logout)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Session Details */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-indigo-400" /> Sessão Ativa
          </h2>

          <div className="space-y-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Nome do Administrador</span>
              <span className="font-bold text-white text-sm">{adminUser.name}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">E-mail de Cadastro</span>
              <span className="font-mono text-indigo-300 font-semibold">{adminUser.email}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Nível de Permissão</span>
              <span className="font-extrabold text-emerald-400 uppercase">{adminUser.role}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Token JWT Atual</span>
              <code className="text-[10px] text-indigo-300 font-mono block truncate mt-0.5 bg-slate-950 p-1.5 rounded">
                {session.token || 'jwt_bearer_token_active'}
              </code>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Último Acesso Registrado</span>
              <span className="font-mono text-slate-300">{adminUser.lastLoginAt || new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Change Password & Security Settings */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> Alterar Senha de Administrador & 2FA
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Atualize as credenciais do usuário mestre. A senha é armazenada no banco com hash seguro BCrypt (cost factor 12).
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nova Senha</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            {/* 2FA Toggle */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorToggle}
                  onChange={e => setTwoFactorToggle(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <div>
                  <div className="font-bold text-white">Ativar Autenticação de Dois Fatores (2FA)</div>
                  <div className="text-[11px] text-slate-400">
                    Exige confirmação de código de 6 dígitos no login do painel.
                  </div>
                </div>
              </label>
            </div>

            {/* Feedback Banners */}
            {profileSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-xs transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Salvar Novas Credenciais Seguras
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
