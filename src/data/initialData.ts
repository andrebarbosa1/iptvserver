import { Customer, Trial, Plan, Subscription, Playlist, SystemLog, SystemSettings, AndroidAppConfig, PlaylistItem, AdminUser, Reseller, EpgSource } from '../types';

export const DEFAULT_ADMIN_USER: AdminUser = {
  id: 'adm-1',
  name: 'Admin Master Streamflow',
  email: 'admin@streamflow.com',
  username: 'admin',
  passwordHash: '$2a$12$e8J3...bcrypt_hash_simulated',
  role: 'superadmin',
  twoFactorEnabled: true,
  twoFactorCode: '123456',
  lastLoginAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  lastLoginIp: '189.40.122.18',
  createdAt: '2026-01-01 00:00:00'
};

export const SAMPLE_PLAYLIST_ITEMS: PlaylistItem[] = [];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    name: 'Lista Principal M3U',
    m3uUrl: 'https://www.playstream.lat/get.php?username=carlossilva&password=password123',
    category: 'Canais Abertos, Esportes, Filmes & Séries',
    itemCount: 0,
    lastUpdated: '2026-08-05 12:00',
    status: 'active',
    autoUpdate: true,
    updateIntervalHours: 12,
    items: []
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cli-101',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    phone: '+55 11 98765-4321',
    username: 'carlossilva',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // secret123
    plainPassword: 'password123',
    status: 'active',
    planDurationDays: 30,
    createdAt: '2026-07-15 14:20',
    expiresAt: '2026-08-15 14:20',
    maxConnections: 2,
    activeConnections: 1,
    playlistId: 'pl-1',
    notes: 'Cliente preferencial. Pagamento via PIX.',
    lastLogin: '2026-08-03 09:12'
  },
  {
    id: 'cli-102',
    name: 'Mariana Oliveira Ramos',
    email: 'mariana.ramos@email.com',
    phone: '+55 21 99887-1122',
    username: 'marianaramos',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    plainPassword: 'marianapassword',
    status: 'active',
    planDurationDays: 90,
    createdAt: '2026-06-01 10:00',
    expiresAt: '2026-09-01 10:00',
    maxConnections: 3,
    activeConnections: 2,
    playlistId: 'pl-1',
    notes: 'Plano Trimestral com 3 telas simultâneas.',
    lastLogin: '2026-08-02 21:45'
  },
  {
    id: 'cli-103',
    name: 'Lucas Ferreira Mendes',
    email: 'lucas.mendes@email.com',
    phone: '+55 31 97654-3210',
    username: 'lucas_mendes',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    plainPassword: 'lucaspass123',
    status: 'trial',
    planDurationDays: 0,
    createdAt: '2026-08-03 08:00',
    expiresAt: '2026-08-03 20:00',
    maxConnections: 1,
    activeConnections: 1,
    playlistId: 'pl-1',
    notes: 'Teste grátis de 12 horas gerado hoje.',
    lastLogin: '2026-08-03 08:30'
  },
  {
    id: 'cli-104',
    name: 'Fernanda Albuquerque',
    email: 'fernanda.albu@email.com',
    phone: '+55 41 99123-4567',
    username: 'fer_albuquerque',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    plainPassword: 'ferpassword',
    status: 'expired',
    planDurationDays: 30,
    createdAt: '2026-06-25 11:00',
    expiresAt: '2026-07-25 11:00',
    maxConnections: 1,
    activeConnections: 0,
    playlistId: 'pl-1',
    notes: 'Venceu em 25/07. Bloqueado automaticamente.',
    lastLogin: '2026-07-24 19:10'
  },
  {
    id: 'cli-105',
    name: 'Roberto Souza Neto',
    email: 'roberto.neto@email.com',
    phone: '+55 81 98877-6655',
    username: 'robertoneto',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    plainPassword: 'robertopass',
    status: 'suspended',
    planDurationDays: 180,
    createdAt: '2026-03-10 09:30',
    expiresAt: '2026-09-10 09:30',
    maxConnections: 2,
    activeConnections: 0,
    playlistId: 'pl-1',
    notes: 'Suspenso temporariamente a pedido do cliente.',
    lastLogin: '2026-07-01 15:00'
  }
];

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'p-30',
    name: 'Plano Mensal VIP',
    durationDays: 30,
    price: 35.00,
    maxConnections: 2,
    description: 'Acesso completo por 30 dias com até 2 conexões simultâneas.',
    active: true
  },
  {
    id: 'p-60',
    name: 'Plano Bimestral Super',
    durationDays: 60,
    price: 65.00,
    maxConnections: 2,
    description: 'Acesso por 60 dias economizando R$ 5,00 por mês.',
    active: true
  },
  {
    id: 'p-90',
    name: 'Plano Trimestral Pro',
    durationDays: 90,
    price: 90.00,
    maxConnections: 3,
    description: 'Melhor custo-benefício para famílias com 3 conexões.',
    active: true
  },
  {
    id: 'p-180',
    name: 'Plano Semestral Ultra',
    durationDays: 180,
    price: 165.00,
    maxConnections: 3,
    description: 'Acesso contínuo por 6 meses com suporte prioritário.',
    active: true
  },
  {
    id: 'p-365',
    name: 'Plano Anual Master Pass',
    durationDays: 365,
    price: 299.00,
    maxConnections: 4,
    description: 'Acesso ilimitado por 1 ano completo com 4 conexões simultâneas.',
    active: true
  }
];

export const INITIAL_TRIALS: Trial[] = [
  {
    id: 't-1',
    customerName: 'Lucas Ferreira Mendes',
    username: 'lucas_mendes',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    durationHours: 12,
    createdAt: '2026-08-03 08:00',
    expiresAt: '2026-08-03 20:00',
    status: 'active',
    playlistId: 'pl-1',
    phone: '+55 31 97654-3210'
  },
  {
    id: 't-2',
    customerName: 'Gabriel Santos',
    username: 'gabriel_test',
    passwordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    durationHours: 4,
    createdAt: '2026-08-03 02:00',
    expiresAt: '2026-08-03 06:00',
    status: 'expired',
    playlistId: 'pl-1',
    phone: '+55 11 91122-3344'
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    customerId: 'cli-101',
    customerName: 'Carlos Eduardo Silva',
    planId: 'p-30',
    planName: 'Plano Mensal VIP',
    amount: 35.00,
    status: 'active',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    paymentMethod: 'pix',
    autoRenew: true
  },
  {
    id: 'sub-2',
    customerId: 'cli-102',
    customerName: 'Mariana Oliveira Ramos',
    planId: 'p-90',
    planName: 'Plano Trimestral Pro',
    amount: 90.00,
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-09-01',
    paymentMethod: 'credit_card',
    autoRenew: true
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-03 11:20:15',
    level: 'info',
    event: 'CLIENT_CREATED',
    user: 'admin',
    ip: '189.40.122.18',
    details: 'Novo teste grátis criado para Lucas Ferreira Mendes (12 horas)'
  },
  {
    id: 'log-2',
    timestamp: '2026-08-03 10:45:00',
    level: 'security',
    event: 'JWT_LOGIN_SUCCESS',
    user: 'carlossilva',
    ip: '177.132.40.90',
    details: 'Login realizado via API REST /api/v1/auth/login (App Android)'
  },
  {
    id: 'log-3',
    timestamp: '2026-08-03 09:30:12',
    level: 'info',
    event: 'M3U_PLAYLIST_SYNC',
    user: 'system',
    ip: '127.0.0.1',
    details: 'Sincronização automática da Lista VIP Premium concluída. 8 canais e VODs atualizados.'
  },
  {
    id: 'log-4',
    timestamp: '2026-08-03 08:15:22',
    level: 'warning',
    event: 'RATE_LIMIT_WARNING',
    user: 'guest_ip',
    ip: '190.220.10.5',
    details: '45 requisições em 1 minuto detectadas no endpoint /get.php'
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  brandName: 'PlayStream.lat',
  logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=150&auto=format&fit=crop&q=80',
  primaryColor: '#6366f1', // Indigo
  dnsServerUrl: 'https://playstream.lat',
  supportPhone: '+55 11 99999-8888',
  supportTelegram: '@PlayStreamSuporte',
  currency: 'R$',
  autoBlockExpired: true,
  rateLimitPerMin: 120,
  jwtSecret: 'super-secret-jwt-key-streamflow-2026-production',
  enableCsrf: true,
  theme: 'dark'
};

export const DEFAULT_ANDROID_CONFIG: AndroidAppConfig = {
  appName: 'PlayStream TV',
  packageName: 'lat.playstream.tv',
  versionName: '2.4.0',
  versionCode: 24,
  primaryColor: '#6366F1',
  serverUrl: 'https://playstream.lat',
  enableExoPlayerCache: true,
  enableTvInterface: true,
  splashBgColor: '#0F172A'
};

export const INITIAL_RESELLERS: Reseller[] = [
  {
    id: 'res-1',
    name: 'Roberto Vendas IPTV',
    email: 'roberto.vendas@email.com',
    phone: '+55 11 97777-6666',
    username: 'robertovendas',
    plainPassword: 'reseller123',
    credits: 50,
    pricePerCredit: 8.50,
    customersCount: 12,
    status: 'active',
    createdAt: '2026-06-10 14:30',
    lastLogin: '2026-08-05 10:15',
    notes: 'Revendedor Master da região SP. Pagamentos via chave PIX.'
  },
  {
    id: 'res-2',
    name: 'Lucas Streaming Soluções',
    email: 'lucas.streaming@email.com',
    phone: '+55 21 98888-5555',
    username: 'lucas_stream',
    plainPassword: 'streamreseller',
    credits: 15,
    pricePerCredit: 10.00,
    customersCount: 5,
    status: 'active',
    createdAt: '2026-07-01 09:00',
    lastLogin: '2026-08-04 18:22',
    notes: 'Sub-revendedor focado em Smart TVs LG & Samsung.'
  },
  {
    id: 'res-3',
    name: 'Juliana Telecom',
    email: 'juliana.telecom@email.com',
    phone: '+55 31 99111-2233',
    username: 'julianatelecom',
    plainPassword: 'julianapassword',
    credits: 0,
    pricePerCredit: 12.00,
    customersCount: 2,
    status: 'suspended',
    createdAt: '2026-05-15 11:20',
    lastLogin: '2026-07-20 16:40',
    notes: 'Conta temporariamente suspensa por falta de renovação de créditos.'
  }
];

export const INITIAL_EPG_SOURCES: EpgSource[] = [
  {
    id: 'epg-1',
    name: 'Guia XMLTV Brasil & Latino (Sinal Principal)',
    url: 'https://playstream.lat/xmltv.php',
    channelsCount: 280,
    lastSync: '2026-08-05 12:00',
    status: 'active',
    autoUpdate: true
  },
  {
    id: 'epg-2',
    name: 'EPG Esportes & Canais Premium 24/7',
    url: 'https://epg.playstream.lat/sports_pt.xml.gz',
    channelsCount: 145,
    lastSync: '2026-08-05 08:30',
    status: 'active',
    autoUpdate: true
  }
];

