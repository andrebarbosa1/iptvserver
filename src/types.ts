export type UserStatus = 'active' | 'suspended' | 'expired' | 'trial';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  plainPassword?: string;
  status: UserStatus;
  planDurationDays: number; // 30, 60, 90, 180, 365 or 0 for trial
  createdAt: string;
  expiresAt: string;
  maxConnections: number;
  activeConnections: number;
  playlistId: string;
  notes?: string;
  lastLogin?: string;
  macAddress?: string;
}

export interface Trial {
  id: string;
  customerName: string;
  username: string;
  passwordHash: string;
  durationHours: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'converted' | 'cancelled';
  playlistId: string;
  phone?: string;
}

export interface Plan {
  id: string;
  name: string;
  durationDays: number; // 30, 60, 90, 180, 365
  price: number;
  maxConnections: number;
  description: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  paymentMethod: 'pix' | 'credit_card' | 'bank_slip' | 'manual';
  autoRenew: boolean;
}

export interface PlaylistItem {
  id: string;
  title: string;
  logoUrl?: string;
  groupTitle: string;
  streamUrl: string;
  tvgId?: string;
  tvgName?: string;
  category: 'live' | 'movie' | 'series';
  epgProgram?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  m3uUrl: string;
  category: string;
  itemCount: number;
  lastUpdated: string;
  status: 'active' | 'error' | 'syncing';
  autoUpdate: boolean;
  updateIntervalHours: number;
  items?: PlaylistItem[];
  macAddress?: string;
  portalUrl?: string;
  importType?: 'm3u_url' | 'mac' | 'raw_text';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  event: string;
  user: string;
  ip: string;
  details: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string; // BCrypt representation
  role: 'superadmin' | 'reseller_admin' | 'support';
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
}

export interface AdminSession {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
  expiresAt: string | null;
  isLocked: boolean;
}

export interface SystemSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  dnsServerUrl: string;
  supportPhone: string;
  supportTelegram: string;
  currency: string;
  autoBlockExpired: boolean;
  rateLimitPerMin: number;
  jwtSecret: string;
  enableCsrf: boolean;
  theme: 'dark' | 'light';
}

export interface AndroidAppConfig {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  primaryColor: string;
  serverUrl: string;
  enableExoPlayerCache: boolean;
  enableTvInterface: boolean;
  splashBgColor: string;
}

export interface Reseller {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  plainPassword?: string;
  credits: number;
  pricePerCredit: number;
  customersCount: number;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  notes?: string;
  maxConnectionsAllowed?: number;
}

export interface EpgSource {
  id: string;
  name: string;
  url: string;
  channelsCount: number;
  lastSync: string;
  status: 'active' | 'error' | 'syncing';
  autoUpdate: boolean;
}

export interface EpgProgramItem {
  id: string;
  channelId: string;
  channelTitle: string;
  epgTvgId: string;
  logoUrl?: string;
  groupTitle?: string;
  currentTitle: string;
  currentDesc: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  progressPercent: number;
  nextTitle: string;
  nextDesc: string;
  nextStartTime: string;
  nextEndTime: string;
}

