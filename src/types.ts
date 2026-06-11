export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  subscriptionType: 'trial' | 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'suspended' | 'trial';
  expirationDate: string;
  packages: string[]; // List of categories/groups they have access to
  token: string;      // Unique token for their M3U URL
  notes?: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  category: string;  // e.g. "Esportes", "Canais Abertos", "Filmes", "Adultos"
  isVOD: boolean;    // true for films/series, false for Live TV
  active: boolean;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  expiredClients: number;
  suspendedClients: number;
  totalChannels: number;
  liveChannelsCount: number;
  vodCount: number;
}

export interface AccessLog {
  id: string;
  token: string;
  clientName: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'expired' | 'suspended' | 'invalid_token';
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  text: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  value: number;
  category: string;
  date: string;
  clientName?: string;
}

export interface Reseller {
  id: string;
  name: string;
  phone: string;
  credits: number;
  notes?: string;
  createdAt: string;
  history: {
    id: string;
    timestamp: string;
    action: string;
    creditsChanged: number;
  }[];
}

