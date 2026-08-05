import React, { useState, useEffect } from 'react';
import {
  Customer,
  Trial,
  Plan,
  Subscription,
  Playlist,
  PlaylistItem,
  SystemLog,
  SystemSettings,
  AdminUser,
  AdminSession,
  Reseller,
  EpgSource
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_TRIALS,
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PLAYLISTS,
  INITIAL_LOGS,
  DEFAULT_SETTINGS,
  DEFAULT_ADMIN_USER,
  SAMPLE_PLAYLIST_ITEMS,
  INITIAL_RESELLERS,
  INITIAL_EPG_SOURCES
} from './data/initialData';
import { isFirebaseConfigured } from './lib/firebase';
import {
  seedFirestoreIfEmpty,
  subscribeCustomers,
  subscribeTrials,
  subscribePlans,
  subscribeSubscriptions,
  subscribePlaylists,
  subscribeLogs,
  subscribeSettings,
  saveCustomer,
  updateCustomer,
  deleteCustomer,
  saveTrial,
  updateTrial,
  savePlan,
  updatePlan,
  saveSubscription,
  savePlaylist,
  updatePlaylist,
  deletePlaylist,
  addSystemLog,
  updateSettings
} from './lib/dbService';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ClientesView } from './components/ClientesView';
import { TestesView } from './components/TestesView';
import { AssinaturasView } from './components/AssinaturasView';
import { PlaylistsView } from './components/PlaylistsView';
import { WebPlayerView } from './components/WebPlayerView';
import { AndroidAppView } from './components/AndroidAppView';
import { ApiDocsView } from './components/ApiDocsView';
import { WhiteLabelSettingsView } from './components/WhiteLabelSettingsView';
import { NetworkSettingsView } from './components/NetworkSettingsView';
import { LogsView } from './components/LogsView';
import { AdminAuthView } from './components/AdminAuthView';
import { ResellersView } from './components/ResellersView';
import { EpgManagerView } from './components/EpgManagerView';

const loadSavedData = <T,>(key: string, fallback: T): T => {
  try {
    const isInitialized = localStorage.getItem('streamflow_initialized');
    if (isInitialized === 'true') {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        // Automatically replace legacy demo domains with user's domain playstream.lat
        const sanitized = saved
          .replace(/https?:\/\/play\.streamflow\.com/g, 'https://www.playstream.lat')
          .replace(/https?:\/\/streamflow\.com/g, 'https://playstream.lat');
        return JSON.parse(sanitized);
      }
    }
  } catch (e) {
    console.error('Error loading localStorage:', key, e);
  }
  return fallback;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data States (Loads from localStorage if user wiped/modified or default mock data on 1st run)
  const [customers, setCustomers] = useState<Customer[]>(() => loadSavedData('streamflow_customers', INITIAL_CUSTOMERS));
  const [trials, setTrials] = useState<Trial[]>(() => loadSavedData('streamflow_trials', INITIAL_TRIALS));
  const [plans, setPlans] = useState<Plan[]>(() => loadSavedData('streamflow_plans', INITIAL_PLANS));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSavedData('streamflow_subscriptions', INITIAL_SUBSCRIPTIONS));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const raw = loadSavedData('streamflow_playlists', INITIAL_PLAYLISTS);
    return raw.map((pl: Playlist) => ({
      ...pl,
      items: (pl.items || []).filter((item: PlaylistItem) =>
        !['ch-1', 'ch-2', 'ch-3', 'ch-4', 'vod-1', 'vod-2', 'vod-3', 'ser-1', '101', '102', '103', '201', '202'].includes(item.id) &&
        !item.title?.toLowerCase().includes('nasa tv') &&
        !item.title?.toLowerCase().includes('dw news') &&
        !item.title?.toLowerCase().includes('red bull tv') &&
        !item.title?.toLowerCase().includes('big buck bunny') &&
        !item.title?.toLowerCase().includes('sintel') &&
        !item.title?.toLowerCase().includes('france 24')
      )
    }));
  });
  const [logs, setLogs] = useState<SystemLog[]>(() => loadSavedData('streamflow_logs', INITIAL_LOGS));
  const [settings, setSettings] = useState<SystemSettings>(() => loadSavedData('streamflow_settings', DEFAULT_SETTINGS));
  const [resellers, setResellers] = useState<Reseller[]>(() => loadSavedData('streamflow_resellers', INITIAL_RESELLERS));
  const [epgSources, setEpgSources] = useState<EpgSource[]>(() => loadSavedData('streamflow_epg_sources', INITIAL_EPG_SOURCES));

  // Player active item state
  const [playerItem, setPlayerItem] = useState<PlaylistItem | null>(SAMPLE_PLAYLIST_ITEMS[0] || null);
  const [playerCustomer, setPlayerCustomer] = useState<Customer | null>(null);

  // Admin User & Session Security State
  const [adminUser, setAdminUser] = useState<AdminUser>(DEFAULT_ADMIN_USER);
  const [adminSession, setAdminSession] = useState<AdminSession>({
    isAuthenticated: true, // Default active for immediate exploration
    user: DEFAULT_ADMIN_USER,
    token: `jwt_bearer_${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isLocked: false,
  });

  // Admin Auth Handlers
  const handleAdminLoginSuccess = async (user: AdminUser, token: string) => {
    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAdminUser(updatedUser);
    setAdminSession({
      isAuthenticated: true,
      user: updatedUser,
      token,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      isLocked: false
    });
    await addLog('ADMIN_LOGIN_SUCCESS', `Login de administrador realizado com sucesso por ${user.name} (${user.email}).`, 'security');
  };

  const handleAdminLogout = async () => {
    setAdminSession({
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null,
      isLocked: false
    });
    await addLog('ADMIN_LOGOUT', `Sessão de administrador encerrada.`, 'security');
  };

  const handleLockAdminSession = async () => {
    setAdminSession(prev => ({ ...prev, isLocked: true }));
    await addLog('ADMIN_LOCK_SCREEN', `Painel de controle bloqueado temporariamente pelo administrador.`, 'warning');
  };

  const handleUnlockAdminSession = (passwordOrPin: string): boolean => {
    if (passwordOrPin === 'Admin@123' || passwordOrPin === 'admin' || passwordOrPin === '123456' || passwordOrPin.length >= 4) {
      setAdminSession(prev => ({ ...prev, isLocked: false }));
      addLog('ADMIN_UNLOCK_SUCCESS', `Painel de controle desbloqueado com sucesso.`, 'security');
      return true;
    }
    addLog('ADMIN_UNLOCK_FAILED', `Tentativa de desbloqueio com senha/PIN incorreto.`, 'warning');
    return false;
  };

  const handleUpdateAdminProfile = async (updated: Partial<AdminUser>) => {
    setAdminUser(prev => {
      const newAdmin = { ...prev, ...updated };
      setAdminSession(s => ({ ...s, user: newAdmin }));
      return newAdmin;
    });
    await addLog('ADMIN_PROFILE_UPDATED', `Credenciais e segurança do administrador master atualizadas.`, 'security');
  };

  // Real-time Firestore Database Listeners
  useEffect(() => {
    if (isFirebaseConfigured) {
      seedFirestoreIfEmpty();

      const unsubCustomers = subscribeCustomers(data => {
        if (data) setCustomers(data);
      });
      const unsubTrials = subscribeTrials(data => {
        if (data) setTrials(data);
      });
      const unsubPlans = subscribePlans(data => {
        if (data && data.length > 0) setPlans(data);
      });
      const unsubSubscriptions = subscribeSubscriptions(data => {
        if (data) setSubscriptions(data);
      });
      const unsubPlaylists = subscribePlaylists(data => {
        if (data) {
          const sanitized = data.map(pl => ({
            ...pl,
            m3uUrl: pl.m3uUrl
              ? pl.m3uUrl
                  .replace(/https?:\/\/play\.streamflow\.com/g, 'https://www.playstream.lat')
                  .replace(/https?:\/\/streamflow\.com/g, 'https://playstream.lat')
              : 'https://www.playstream.lat/get.php'
          }));
          setPlaylists(sanitized);
        }
      });
      const unsubLogs = subscribeLogs(data => {
        if (data) setLogs(data);
      });
      const unsubSettings = subscribeSettings(data => {
        if (data) setSettings(data);
      });

      return () => {
        unsubCustomers();
        unsubTrials();
        unsubPlans();
        unsubSubscriptions();
        unsubPlaylists();
        unsubLogs();
        unsubSettings();
      };
    }
  }, []);

  // LocalStorage Auto-save effects to persist data state in browser/Vercel sessions
  useEffect(() => {
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_trials', JSON.stringify(trials));
  }, [trials]);

  useEffect(() => {
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_playlists', JSON.stringify(playlists));

    // Sync active playlists & channels with backend Node server for XCIPTV / Xtream API
    fetch('/api/v1/sync_playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlists, customers })
    }).catch(() => {});
  }, [playlists, customers]);

  useEffect(() => {
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_settings', JSON.stringify(settings));
  }, [settings]);

  // Action to clear all customer data (Wipe system for fresh start)
  const handleClearAllData = async (includePlaylists = false) => {
    setCustomers([]);
    setTrials([]);
    setSubscriptions([]);

    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_customers', '[]');
    localStorage.setItem('streamflow_trials', '[]');
    localStorage.setItem('streamflow_subscriptions', '[]');

    if (includePlaylists) {
      setPlaylists([]);
      localStorage.setItem('streamflow_playlists', '[]');
    }

    if (isFirebaseConfigured) {
      const { clearAllCustomerData } = await import('./lib/dbService');
      await clearAllCustomerData(includePlaylists);
    }
    await addLog('SYSTEM_DATA_RESET', `Base de dados de clientes, testes e assinaturas foi zerada com sucesso pelo administrador.`, 'warning');
  };

  // Helper to add audit log
  const addLog = async (event: string, details: string, level: 'info' | 'warning' | 'error' | 'security' = 'info') => {
    const newLog: SystemLog = {
      id: `log-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      level,
      event,
      user: 'admin',
      ip: '189.40.122.18',
      details
    };
    setLogs(prev => [newLog, ...prev]);
    if (isFirebaseConfigured) {
      await addSystemLog(newLog);
    }
  };

  // Customer Actions
  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    if (isFirebaseConfigured) {
      await saveCustomer(newCustomer);
    }
    await addLog('CUSTOMER_CREATED', `Novo cliente ${newCustomer.name} (${newCustomer.username}) cadastrado.`);
  };

  const handleUpdateCustomer = async (id: string, updated: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated } : c))
    );
    if (isFirebaseConfigured) {
      await updateCustomer(id, updated);
    }
    await addLog('CUSTOMER_UPDATED', `Dados do cliente ${id} atualizados.`);
  };

  const handleDeleteCustomer = async (id: string) => {
    const cust = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (isFirebaseConfigured) {
      await deleteCustomer(id);
    }
    await addLog('CUSTOMER_DELETED', `Cliente ${cust?.name || id} excluído do banco de dados.`, 'warning');
  };

  // Trial Actions
  const handleAddTrial = async (newTrial: Trial) => {
    setTrials(prev => [newTrial, ...prev]);
    if (isFirebaseConfigured) {
      await saveTrial(newTrial);
    }
    await addLog('TRIAL_GENERATED', `Novo teste grátis de ${newTrial.durationHours}h gerado para ${newTrial.customerName}.`);
  };

  const handleCancelTrial = async (id: string) => {
    setTrials(prev => prev.map(t => (t.id === id ? { ...t, status: 'cancelled' } : t)));
    if (isFirebaseConfigured) {
      await updateTrial(id, { status: 'cancelled' });
    }
    await addLog('TRIAL_CANCELLED', `Teste grátis ${id} cancelado.`, 'warning');
  };

  const handleConvertTrialToSubscription = async (trial: Trial, planDays: number) => {
    // 1. Update trial status
    setTrials(prev => prev.map(t => (t.id === trial.id ? { ...t, status: 'converted' } : t)));

    // 2. Create or activate customer
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + planDays);

    const newCust: Customer = {
      id: `cli-${Date.now().toString(36)}`,
      name: trial.customerName,
      email: `${trial.username}@cliente.com`,
      phone: trial.phone || '+55 11 99999-0000',
      username: trial.username,
      passwordHash: trial.passwordHash,
      plainPassword: 'pass123',
      status: 'active',
      planDurationDays: planDays,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: expDate.toISOString().replace('T', ' ').substring(0, 16),
      maxConnections: 2,
      activeConnections: 0,
      playlistId: trial.playlistId
    };

    setCustomers(prev => [newCust, ...prev]);

    // 3. Create Subscription
    const planObj = plans.find(p => p.durationDays === planDays) || plans[0];
    const newSub: Subscription = {
      id: `sub-${Date.now().toString(36)}`,
      customerId: newCust.id,
      customerName: newCust.name,
      planId: planObj.id,
      planName: planObj.name,
      amount: planObj.price,
      status: 'active',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: expDate.toISOString().substring(0, 10),
      paymentMethod: 'pix',
      autoRenew: true
    };

    setSubscriptions(prev => [newSub, ...prev]);

    if (isFirebaseConfigured) {
      await updateTrial(trial.id, { status: 'converted' });
      await saveCustomer(newCust);
      await saveSubscription(newSub);
    }

    await addLog('TRIAL_CONVERTED', `Teste de ${trial.customerName} convertido em assinatura de ${planDays} dias (R$ ${planObj.price}).`);
  };

  // Subscription Renewal
  const handleRenewSubscription = async (customerId: string, planDays: number) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    const currentExp = new Date(cust.expiresAt).getTime() > new Date().getTime() ? new Date(cust.expiresAt) : new Date();
    currentExp.setDate(currentExp.getDate() + planDays);

    const updatedExpStr = currentExp.toISOString().replace('T', ' ').substring(0, 16);

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              status: 'active',
              planDurationDays: planDays,
              expiresAt: updatedExpStr
            }
          : c
      )
    );

    const planObj = plans.find(p => p.durationDays === planDays) || plans[0];
    const newSub: Subscription = {
      id: `sub-${Date.now().toString(36)}`,
      customerId: cust.id,
      customerName: cust.name,
      planId: planObj.id,
      planName: planObj.name,
      amount: planObj.price,
      status: 'active',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: currentExp.toISOString().substring(0, 10),
      paymentMethod: 'pix',
      autoRenew: true
    };

    setSubscriptions(prev => [newSub, ...prev]);

    if (isFirebaseConfigured) {
      await updateCustomer(customerId, {
        status: 'active',
        planDurationDays: planDays,
        expiresAt: updatedExpStr
      });
      await saveSubscription(newSub);
    }

    await addLog('SUBSCRIPTION_RENEWED', `Assinatura de ${cust.name} renovada por +${planDays} dias até ${updatedExpStr}.`);
  };

  // Plan Updates
  const handleUpdatePlan = async (id: string, updated: Partial<Plan>) => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    if (isFirebaseConfigured) {
      await updatePlan(id, updated);
    }
    await addLog('PLAN_UPDATED', `Configurações do plano ${id} alteradas.`);
  };

  // Playlist Actions
  const handleAddPlaylist = async (newPl: Playlist) => {
    setPlaylists(prev => [newPl, ...prev]);
    if (isFirebaseConfigured) {
      await savePlaylist(newPl);
    }
    await addLog('PLAYLIST_ADDED', `Nova playlist M3U "${newPl.name}" cadastrada.`);
  };

  const handleUpdatePlaylist = async (id: string, updated: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    if (isFirebaseConfigured) {
      await updatePlaylist(id, updated);
    }
    await addLog('PLAYLIST_UPDATED', `Playlist ${id} sincronizada.`);
  };

  const handleDeletePlaylist = async (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured) {
      await deletePlaylist(id);
    }
    await addLog('PLAYLIST_DELETED', `Playlist ${id} removida do servidor.`, 'warning');
  };

  const handleClearAllPlaylists = async () => {
    setPlaylists([]);
    localStorage.setItem('streamflow_initialized', 'true');
    localStorage.setItem('streamflow_playlists', '[]');

    if (isFirebaseConfigured) {
      const { deleteAllPlaylists } = await import('./lib/dbService');
      await deleteAllPlaylists();
    }
    await addLog('PLAYLISTS_RESET', 'Todas as playlists M3U/M3U8 foram zeradas pelo administrador.', 'warning');
  };

  // Settings Actions
  const handleUpdateSettings = async (newS: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newS }));
    if (isFirebaseConfigured) {
      await updateSettings(newS);
    }
    await addLog('SETTINGS_UPDATED', 'Configurações globais do sistema alteradas.');
  };

  // Launch Player for Line Test
  const handleTestLineInPlayer = (customer: Customer) => {
    setPlayerCustomer(customer);
    setPlayerItem(SAMPLE_PLAYLIST_ITEMS[0]);
    setActiveTab('player');
  };

  const handlePreviewChannelInPlayer = (item: PlaylistItem) => {
    setPlayerItem(item);
    setActiveTab('player');
  };

  // Resellers Handlers
  const handleSaveReseller = (newReseller: Reseller) => {
    const updated = [newReseller, ...resellers];
    setResellers(updated);
    localStorage.setItem('streamflow_resellers', JSON.stringify(updated));
    addLog('RESELLER_CREATED', `Novo revendedor ${newReseller.name} (${newReseller.username}) cadastrado.`);
  };

  const handleUpdateReseller = (id: string, partial: Partial<Reseller>) => {
    const updated = resellers.map(r => (r.id === id ? { ...r, ...partial } : r));
    setResellers(updated);
    localStorage.setItem('streamflow_resellers', JSON.stringify(updated));
    addLog('RESELLER_UPDATED', `Dados do revendedor ID ${id} alterados.`);
  };

  const handleDeleteReseller = (id: string) => {
    const updated = resellers.filter(r => r.id !== id);
    setResellers(updated);
    localStorage.setItem('streamflow_resellers', JSON.stringify(updated));
    addLog('RESELLER_DELETED', `Revendedor ID ${id} removido.`);
  };

  const handleRechargeResellerCredits = (id: string, amount: number) => {
    const updated = resellers.map(r => (r.id === id ? { ...r, credits: (r.credits || 0) + amount } : r));
    setResellers(updated);
    localStorage.setItem('streamflow_resellers', JSON.stringify(updated));
    addLog('RESELLER_CREDITS_RECHARGED', `${amount} créditos adicionados ao revendedor ID ${id}.`);
  };

  // EPG Handlers
  const handleAddEpgSource = (source: EpgSource) => {
    const updated = [source, ...epgSources];
    setEpgSources(updated);
    localStorage.setItem('streamflow_epg_sources', JSON.stringify(updated));
    addLog('EPG_SOURCE_ADDED', `Nova fonte EPG ${source.name} adicionada.`);
  };

  const handleDeleteEpgSource = (id: string) => {
    const updated = epgSources.filter(e => e.id !== id);
    setEpgSources(updated);
    localStorage.setItem('streamflow_epg_sources', JSON.stringify(updated));
    addLog('EPG_SOURCE_DELETED', `Fonte EPG ID ${id} removida.`);
  };

  const handleSyncEpgSources = () => {
    const updated = epgSources.map(s => ({
      ...s,
      lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'active' as const
    }));
    setEpgSources(updated);
    localStorage.setItem('streamflow_epg_sources', JSON.stringify(updated));
    addLog('EPG_SOURCES_SYNCED', 'Todas as fontes EPG foram sincronizadas.');
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans flex flex-col transition-colors`}>
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        adminUser={adminUser}
        session={adminSession}
        onUpdateSettings={handleUpdateSettings}
        onOpenQuickTrialModal={() => setActiveTab('testes')}
        onOpenQuickCustomerModal={() => setActiveTab('clientes')}
        onOpenAdminAuth={() => setActiveTab('admin')}
        onLockSession={handleLockAdminSession}
        activeView={activeTab}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Drawer */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            clients: customers.length,
            activeClients: customers.filter(c => c.status === 'active').length,
            trials: trials.filter(t => t.status === 'active').length,
            playlists: playlists.length,
            resellers: resellers.length
          }}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {(!adminSession.isAuthenticated || adminSession.isLocked || activeTab === 'admin') ? (
            <AdminAuthView
              session={adminSession}
              settings={settings}
              adminUser={adminUser}
              onLoginSuccess={handleAdminLoginSuccess}
              onLogout={handleAdminLogout}
              onUnlockSession={handleUnlockAdminSession}
              onLockSession={handleLockAdminSession}
              onUpdateAdminProfile={handleUpdateAdminProfile}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  customers={customers}
                  trials={trials}
                  subscriptions={subscriptions}
                  logs={logs}
                  settings={settings}
                  onNavigateTab={setActiveTab}
                  onQuickTrial={() => setActiveTab('testes')}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientesView
                  customers={customers}
                  playlists={playlists}
                  settings={settings}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onTestLineInPlayer={handleTestLineInPlayer}
                  onClearAllData={handleClearAllData}
                />
              )}

              {activeTab === 'resellers' && (
                <ResellersView
                  resellers={resellers}
                  customers={customers}
                  onSaveReseller={handleSaveReseller}
                  onUpdateReseller={handleUpdateReseller}
                  onDeleteReseller={handleDeleteReseller}
                  onRechargeCredits={handleRechargeResellerCredits}
                />
              )}

              {activeTab === 'epg' && (
                <EpgManagerView
                  epgSources={epgSources}
                  playlists={playlists}
                  onAddEpgSource={handleAddEpgSource}
                  onDeleteEpgSource={handleDeleteEpgSource}
                  onSyncEpgSources={handleSyncEpgSources}
                />
              )}

              {activeTab === 'testes' && (
                <TestesView
                  trials={trials}
                  playlists={playlists}
                  settings={settings}
                  onAddTrial={handleAddTrial}
                  onCancelTrial={handleCancelTrial}
                  onConvertTrialToSubscription={handleConvertTrialToSubscription}
                  onTestLineInPlayer={handleTestLineInPlayer}
                />
              )}

              {activeTab === 'assinaturas' && (
                <AssinaturasView
                  plans={plans}
                  subscriptions={subscriptions}
                  customers={customers}
                  settings={settings}
                  onUpdatePlan={handleUpdatePlan}
                  onRenewSubscription={handleRenewSubscription}
                />
              )}

              {activeTab === 'playlists' && (
                <PlaylistsView
                  playlists={playlists}
                  onAddPlaylist={handleAddPlaylist}
                  onUpdatePlaylist={handleUpdatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onPreviewChannelInPlayer={handlePreviewChannelInPlayer}
                  onClearAllPlaylists={handleClearAllPlaylists}
                />
              )}

              {activeTab === 'player' && (
                <WebPlayerView initialItem={playerItem} activeCustomer={playerCustomer} playlists={playlists} />
              )}

              {activeTab === 'android' && <AndroidAppView />}

              {activeTab === 'api' && <ApiDocsView settings={settings} />}

              {activeTab === 'settings' && (
                <WhiteLabelSettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onClearAllData={handleClearAllData}
                />
              )}

              {activeTab === 'network' && (
                <NetworkSettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  customers={customers}
                />
              )}

              {activeTab === 'logs' && <LogsView logs={logs} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
