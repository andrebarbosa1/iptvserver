import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Client, Channel, ClientStats, AccessLog, WhatsAppTemplate, Transaction, Reseller } from "./src/types";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "iptv_data.json");

app.use(express.json({ limit: "50mb" }));

// Helper to load data
interface StoreData {
  clients: Client[];
  channels: Channel[];
  logs?: AccessLog[];
  whatsappTemplates?: WhatsAppTemplate[];
  transactions?: Transaction[];
  resellers?: Reseller[];
}

const DEFAULT_CHANNELS: Channel[] = [];
const DEFAULT_CLIENTS: Client[] = [];

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl_venc",
    name: "Aviso de Vencimento ⏰",
    text: "Olá {CLIENTE}, tudo bem? 🚀 Relembramos que o seu acesso IPTV expira em {VENCIMENTO_CLIENTE}. Para não perder o sinal dos seus canais favoritos, filmes e séries, faça a renovação rápida! Valor do plano: R$ {VALOR}. Assista pelo WebPlayer: {LINK_PLAYER}"
  },
  {
    id: "tpl_boas_vindas",
    name: "Boas-vindas (Assinatura Ativa) 🚀",
    text: "Olá {CLIENTE}! 🎉 Seu acesso oficial foi liberado com sucesso. Plano ativo até: {VENCIMENTO_CLIENTE}. 💻 Link do WebPlayer para assistir no celular/computador: {LINK_PLAYER} 📺 Link M3U para TV e outros Aplicativos: {LINK_M3U}"
  },
  {
    id: "tpl_teste_automatico",
    name: "Acesso de Teste (4 Horas) 🎮",
    text: "Olá {CLIENTE}! 🎉 Seu teste gratuito de 4 horas foi gerado e já está liberado. 👇 Copie o link abaixo para assistir instantaneamente de onde estiver: \n👉 {LINK_PLAYER} \n\nOu configure o link M3U na sua SmartTV/App: \n👉 {LINK_M3U}"
  }
];

function isClientExpired(client: Client): boolean {
  if (client.status === "expired") return true;
  if (!client.expirationDate) return true;
  
  const now = new Date();
  if (!client.expirationDate.includes("T") && !client.expirationDate.includes(":")) {
    const todayStr = now.toISOString().split('T')[0];
    return client.expirationDate < todayStr;
  } else {
    const exp = new Date(client.expirationDate);
    return exp.getTime() < now.getTime();
  }
}

function loadData(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      
      // Auto-clean any legacy demo data to ensure a completely empty database for the user from now on
      const hasMockData = (parsed.clients && parsed.clients.some((c: any) => c.id === "c1" || c.id === "c2" || c.id === "c3")) ||
                          (parsed.channels && parsed.channels.some((ch: any) => ch.id === "rtp1" || ch.id === "nasa_tv" || ch.id === "sport_tv1_mock" || ch.id === "globo_mock"));
      
      if (hasMockData) {
        const cleanData = { clients: [], channels: [], logs: [], whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES, transactions: [], resellers: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(cleanData), "utf-8");
        return cleanData;
      }

      return {
        clients: parsed.clients || DEFAULT_CLIENTS,
        channels: parsed.channels || DEFAULT_CHANNELS,
        logs: parsed.logs || [],
        whatsappTemplates: parsed.whatsappTemplates || DEFAULT_WHATSAPP_TEMPLATES,
        transactions: parsed.transactions || [],
        resellers: parsed.resellers || []
      };
    }
  } catch (err) {
    console.error("Error loading data.json, using defaults.", err);
  }
  return { 
    clients: DEFAULT_CLIENTS, 
    channels: DEFAULT_CHANNELS, 
    logs: [],
    whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
    transactions: [],
    resellers: []
  };
}

function saveData(data: StoreData) {
  try {
    const dataToSave = {
      clients: data.clients,
      channels: data.channels,
      logs: data.logs || [],
      whatsappTemplates: data.whatsappTemplates || DEFAULT_WHATSAPP_TEMPLATES,
      transactions: data.transactions || [],
      resellers: data.resellers || []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave), "utf-8");
  } catch (err) {
    console.error("Error saving data.json", err);
  }
}

// REST endpoints
app.get("/api/clients", (req, res) => {
  const data = loadData();
  res.json(data.clients);
});

app.post("/api/clients", (req, res) => {
  const data = loadData();
  const newClient: Client = {
    id: Math.random().toString(36).substring(2, 9),
    name: req.body.name || "Cliente sem nome",
    email: req.body.email || "",
    phone: req.body.phone || "",
    subscriptionType: req.body.subscriptionType || "monthly",
    status: req.body.status || "active",
    expirationDate: req.body.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    packages: req.body.packages || ["Canais Abertos"],
    token: req.body.token || Math.random().toString(36).substring(2, 10),
    notes: req.body.notes || "",
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.clients.push(newClient);
  saveData(data);
  res.status(201).json(newClient);
});

app.put("/api/clients/:id", (req, res) => {
  const data = loadData();
  const index = data.clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  data.clients[index] = {
    ...data.clients[index],
    ...req.body,
    id: data.clients[index].id, // protect id
    createdAt: data.clients[index].createdAt // protect date
  };

  saveData(data);
  res.json(data.clients[index]);
});

app.delete("/api/clients/:id", (req, res) => {
  const data = loadData();
  const index = data.clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const removed = data.clients.splice(index, 1);
  saveData(data);
  res.json(removed[0]);
});

app.get("/api/channels", (req, res) => {
  const data = loadData();
  res.json(data.channels);
});

app.post("/api/channels", (req, res) => {
  const data = loadData();
  const newChannel: Channel = {
    id: Math.random().toString(36).substring(2, 9),
    name: req.body.name || "Canal sem nome",
    url: req.body.url || "",
    logoUrl: req.body.logoUrl || "",
    category: req.body.category || "Geral",
    isVOD: req.body.isVOD || false,
    active: req.body.active !== undefined ? req.body.active : true
  };

  data.channels.push(newChannel);
  saveData(data);
  res.status(201).json(newChannel);
});

app.put("/api/channels/:id", (req, res) => {
  const data = loadData();
  const index = data.channels.findIndex(ch => ch.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }

  data.channels[index] = {
    ...data.channels[index],
    ...req.body,
    id: data.channels[index].id // protect id
  };

  saveData(data);
  res.json(data.channels[index]);
});

app.delete("/api/channels/:id", (req, res) => {
  const data = loadData();
  const index = data.channels.findIndex(ch => ch.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }
  const removed = data.channels.splice(index, 1);
  saveData(data);
  res.json(removed[0]);
});

// Import bulk M3U
app.post("/api/channels/import-m3u", (req, res) => {
  const m3uText = req.body.m3u || "";
  const replaceExisting = !!req.body.replace;
  
  if (!m3uText.trim()) {
    res.status(400).json({ error: "Conteúdo M3U vazio" });
    return;
  }

  const lines = m3uText.split(/\r?\n/);
  const channelsList: Channel[] = [];
  let currentMetadata: { name: string; logoUrl: string; category: string } | null = null;
  let isTruncated = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      // Regex parse to extract attributes
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);

      const name = nameMatch ? nameMatch[1].trim() : (tvgNameMatch ? tvgNameMatch[1].trim() : 'Canal Importado');
      const logoUrl = logoMatch ? logoMatch[1].trim() : '';
      const category = groupMatch ? groupMatch[1].trim() : 'Importados';

      currentMetadata = { name, logoUrl, category };
    } else if (!line.startsWith("#") && currentMetadata) {
      if (channelsList.length >= 15000) {
        isTruncated = true;
        break;
      }
      channelsList.push({
        id: Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString().slice(-4),
        name: currentMetadata.name,
        url: line,
        logoUrl: currentMetadata.logoUrl,
        category: currentMetadata.category,
        isVOD: currentMetadata.category.toLowerCase().includes('filme') || 
               currentMetadata.category.toLowerCase().includes('movie') || 
               currentMetadata.category.toLowerCase().includes('series') || 
               currentMetadata.category.toLowerCase().includes('vod'),
        active: true
      });
      currentMetadata = null;
    }
  }

  if (channelsList.length === 0) {
    res.status(400).json({ error: "Nenhum canal válido foi encontrado no texto M3U enviado. Certifique-se de que está no formato padrão." });
    return;
  }

  const data = loadData();
  if (replaceExisting) {
    data.channels = channelsList;
  } else {
    data.channels = data.channels.concat(channelsList);
  }

  saveData(data);
  
  const msg = isTruncated 
    ? `Importação concluída com limite de segurança! Foram importados 15.000 canais (a lista original possuía mais, porém foi truncada para garantir a velocidade e estabilidade do servidor).`
    : `${channelsList.length} canais importados com sucesso!`;

  res.json({ message: msg, importedCount: channelsList.length });
});

// Stats endpoint
app.get("/api/stats", (req, res) => {
  const data = loadData();
  const clients = data.clients;
  const channels = data.channels;

  const stats: ClientStats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active' && !isClientExpired(c)).length,
    trialClients: clients.filter(c => (c.status === 'trial' || c.subscriptionType === 'trial') && !isClientExpired(c)).length,
    expiredClients: clients.filter(c => isClientExpired(c)).length,
    suspendedClients: clients.filter(c => c.status === 'suspended').length,
    totalChannels: channels.length,
    liveChannelsCount: channels.filter(ch => !ch.isVOD).length,
    vodCount: channels.filter(ch => ch.isVOD).length
  };

  res.json(stats);
});

// Serve actual custom dynamic M3U list for client token!
app.get("/playlist/:token", (req, res) => {
  const token = req.params.token;
  const data = loadData();
  const client = data.clients.find(c => c.token === token);

  const todayStr = new Date().toISOString().split('T')[0];
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(',')[0].trim();
  const userAgent = req.headers["user-agent"] || "Suporte/Player IPTV";

  res.setHeader("Content-Type", "application/x-mpegurl; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="playlist.m3u"`);

  // Max 500 logs handler helper
  const addLog = (clientName: string, status: 'success' | 'expired' | 'suspended' | 'invalid_token') => {
    const newLog: AccessLog = {
      id: Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString().slice(-4),
      token,
      clientName,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      status
    };
    if (!data.logs) data.logs = [];
    data.logs.unshift(newLog); // Put new logs first
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }
    saveData(data);
  };

  if (!client) {
    addLog("Cliente Desconhecido", "invalid_token");
    // Return standard message playlist
    let m3u = "#EXTM3U\n";
    m3u += `#EXTINF:-1 tvg-name="ACESSO NEGADO" tvg-logo="https://cdn-icons-png.flaticon.com/512/148/148766.png" group-title="SUPORTE",ACESSO NEGADO: Token Invalido\n`;
    m3u += `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4\n`;
    res.send(m3u);
    return;
  }

  // Check if expired
  const isExpired = isClientExpired(client);
  const isSuspended = client.status === "suspended";

  if (isSuspended) {
    addLog(client.name, "suspended");
    let m3u = "#EXTM3U\n";
    const statusText = "Acesso Suspenso - Fale no Suporte";
    m3u += `#EXTINF:-1 tvg-id="aviso-status" tvg-name="${statusText}" tvg-logo="https://cdn-icons-png.flaticon.com/512/564/564619.png" group-title="AVISO IMPORTANTE",⚠️ ${statusText}\n`;
    m3u += `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4\n`;
    res.send(m3u);
    return;
  }

  if (isExpired) {
    addLog(client.name, "expired");
    let m3u = "#EXTM3U\n";
    const statusText = "Acesso Expirado - Renove sua Assinatura";
    m3u += `#EXTINF:-1 tvg-id="aviso-status" tvg-name="${statusText}" tvg-logo="https://cdn-icons-png.flaticon.com/512/564/564619.png" group-title="AVISO IMPORTANTE",⚠️ ${statusText}\n`;
    m3u += `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4\n`;
    res.send(m3u);
    return;
  }

  addLog(client.name, "success");

  // Filter channels based on customer package filters and active state
  const allowedChannels = data.channels.filter(ch => {
    if (!ch.active) return false;
    // Client must have the playlist category in their package configurations
    return client.packages.includes(ch.category);
  });

  let m3u = "#EXTM3U\n";
  m3u += `## Playlist gerada para ${client.name} (Validade: ${client.expirationDate})\n`;

  for (const ch of allowedChannels) {
    const logoPart = ch.logoUrl ? ` tvg-logo="${ch.logoUrl}"` : "";
    const groupPart = ch.category ? ` group-title="${ch.category}"` : "";
    m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}"${logoPart}${groupPart},${ch.name}\n`;
    m3u += `${ch.url}\n`;
  }

  res.send(m3u);
});

// ==========================================
// XTREAM CODES API CONFIGURATION (FOR ALL CLIENT MULTI-APPS)
// ==========================================
app.get("/player_api.php", (req, res) => {
  const { username, password, action, category_id } = req.query;
  const data = loadData();

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  // Find client
  const client = data.clients.find(c => c.token === username);
  if (!client) {
    return res.json({
      user_info: {
        auth: 0,
        status: "Not Found",
        message: "Cliente nao encontrado"
      }
    });
  }

  if (isClientExpired(client)) {
    return res.json({
      user_info: {
        auth: 0,
        status: "Expired",
        message: "Assinatura expirada"
      }
    });
  }

  if (client.status === "suspended") {
    return res.json({
      user_info: {
        auth: 0,
        status: "Suspended",
        message: "Assinatura suspensa"
      }
    });
  }

  // Calculate expiration timestamp
  let expTimestamp: number | null = null;
  if (client.expirationDate) {
    expTimestamp = Math.floor(new Date(client.expirationDate).getTime() / 1000);
  }

  // Handle logging of XC connection check if they are requesting authentication handshake
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(',')[0].trim();
  const userAgent = req.headers["user-agent"] || "Xtream Codes Player";
  
  const addLog = (clientName: string, status: 'success' | 'expired' | 'suspended' | 'invalid_token') => {
    const newLog: AccessLog = {
      id: Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString().slice(-4),
      token: String(username),
      clientName,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      status
    };
    if (!data.logs) data.logs = [];
    data.logs.unshift(newLog);
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }
    saveData(data);
  };

  // Log on initial handshake
  if (!action) {
    addLog(client.name, "success");
    return res.json({
      user_info: {
        username: client.token,
        password: client.token,
        auth: 1,
        status: "Active",
        exp_date: expTimestamp ? String(expTimestamp) : null,
        is_trial: client.subscriptionType === "trial" ? "1" : "0",
        active_cons: 0,
        max_connections: 1
      },
      server_info: {
        url: req.protocol + "://" + req.get("host"),
        port: "80",
        server_system_time: Math.floor(Date.now() / 1000)
      }
    });
  }

  // Filter allowed channels based on packages configured for this user
  const allowedChannels = data.channels.filter(ch => {
    if (!ch.active) return false;
    return client.packages.includes(ch.category);
  });

  const liveChannels = allowedChannels.filter(ch => !ch.isVOD);
  const vodChannels = allowedChannels.filter(ch => ch.isVOD);

  if (action === "get_live_categories") {
    const liveCategories = Array.from(new Set(liveChannels.map(ch => ch.category)));
    return res.json(liveCategories.map((cat) => ({
      category_id: cat,
      category_name: cat,
      parent_id: 0
    })));
  }

  if (action === "get_vod_categories") {
    const vodCategories = Array.from(new Set(vodChannels.map(ch => ch.category)));
    return res.json(vodCategories.map((cat) => ({
      category_id: cat,
      category_name: cat,
      parent_id: 0
    })));
  }

  if (action === "get_live_streams") {
    let list = liveChannels;
    if (category_id) {
      list = liveChannels.filter(ch => ch.category === category_id);
    }
    return res.json(list.map((ch, idx) => ({
      num: idx + 1,
      name: ch.name,
      stream_id: ch.id,
      stream_icon: ch.logoUrl || "",
      category_id: ch.category,
      category_name: ch.category,
      custom_sid: "",
      added: "1690000000",
      direct_source: ch.url,
      stream_type: "live",
      container_extension: "ts"
    })));
  }

  if (action === "get_vod_streams") {
    let list = vodChannels;
    if (category_id) {
      list = vodChannels.filter(ch => ch.category === category_id);
    }
    return res.json(list.map((ch, idx) => ({
      num: idx + 1,
      name: ch.name,
      stream_id: ch.id,
      stream_icon: ch.logoUrl || "",
      category_id: ch.category,
      category_name: ch.category,
      custom_sid: "",
      added: "1690000000",
      direct_source: ch.url,
      stream_type: "movie",
      container_extension: "mp4"
    })));
  }

  return res.json([]);
});

// Stream play proxy & routing redirection
app.get("/live/:username/:password/:stream_id", (req, res) => {
  const { username, password, stream_id } = req.params;
  const id = stream_id.replace(/\.[a-zA-Z0-9]+$/, "");

  const data = loadData();
  const client = data.clients.find(c => c.token === username);

  if (!client || isClientExpired(client) || client.status === "suspended") {
    return res.status(403).send("Acesso negado.");
  }

  const channel = data.channels.find(ch => ch.id === id);
  if (!channel || !channel.active || !client.packages.includes(channel.category)) {
    return res.status(404).send("Canal inexistente ou nao permitido.");
  }

  res.redirect(channel.url);
});

app.get("/movie/:username/:password/:stream_id", (req, res) => {
  const { username, password, stream_id } = req.params;
  const id = stream_id.replace(/\.[a-zA-Z0-9]+$/, "");

  const data = loadData();
  const client = data.clients.find(c => c.token === username);

  if (!client || isClientExpired(client) || client.status === "suspended") {
    return res.status(403).send("Acesso negado.");
  }

  const channel = data.channels.find(ch => ch.id === id);
  if (!channel || !channel.active || !client.packages.includes(channel.category)) {
    return res.status(404).send("Filme inexistente ou nao permitido.");
  }

  res.redirect(channel.url);
});

// Real-time IPTV connection logs endpoints
app.get("/api/logs", (req, res) => {
  const data = loadData();
  res.json(data.logs || []);
});

app.post("/api/logs/clear", (req, res) => {
  const data = loadData();
  data.logs = [];
  saveData(data);
  res.json({ message: "Logs limpos com sucesso!" });
});

// Client token anti-sharing reset endpoint
app.post("/api/clients/:id/reset-token", (req, res) => {
  const data = loadData();
  const index = data.clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Generate new secure randomized 8-char token
  const newToken = Math.random().toString(36).substring(2, 10);
  data.clients[index].token = newToken;
  saveData(data);
  res.json({ message: "Token redefinido com sucesso!", token: newToken });
});

// Automatic 4-Hour Trial Generation System
app.post("/api/trials/generate", (req, res) => {
  const data = loadData();
  
  // Collect all unique channel categories to provide full IPTV access for the trial
  const uniqueCategories = Array.from(new Set(data.channels.map(ch => ch.category)));
  if (uniqueCategories.length === 0) {
    uniqueCategories.push("Geral");
  }

  // Set precise expiration to exactly 4 hours from now
  const expirationDate = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const token = "tst_" + Math.random().toString(36).substring(2, 8);

  const newTrialClient: Client = {
    id: "trial_" + Math.random().toString(36).substring(2, 9),
    name: req.body.name || `Teste Automático (${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})`,
    email: req.body.email || "",
    phone: req.body.phone || "",
    subscriptionType: "trial",
    status: "trial",
    expirationDate,
    packages: uniqueCategories,
    token,
    notes: `Teste automático de 4 horas gerado às ${new Date().toLocaleTimeString("pt-BR")} via Web.`,
    createdAt: new Date().toISOString()
  };

  data.clients.push(newTrialClient);
  saveData(data);

  res.status(201).json({
    client: newTrialClient,
    message: "Acesso teste de 4 horas criado com sucesso!",
    playlistUrl: `/playlist/${token}`,
    watchUrl: `/?play=${token}`
  });
});

// JSON Playlist with Audit Logging for browser-based Web Player
app.get("/api/playlist-json/:token", (req, res) => {
  const token = req.params.token;
  const data = loadData();
  const client = data.clients.find(c => c.token === token);

  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(',')[0].trim();
  const userAgent = req.headers["user-agent"] || "WebPlayer IPTV Client";

  const addLog = (clientName: string, status: 'success' | 'expired' | 'suspended' | 'invalid_token') => {
    const newLog: AccessLog = {
      id: Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString().slice(-4),
      token,
      clientName,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      status
    };
    if (!data.logs) data.logs = [];
    data.logs.unshift(newLog);
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }
    saveData(data);
  };

  if (!client) {
    addLog("WebPlayer Desconhecido", "invalid_token");
    res.status(404).json({ error: "Token inválido ou inexistente." });
    return;
  }

  if (client.status === "suspended") {
    addLog(client.name, "suspended");
    res.status(403).json({ error: "Acesso suspenso. Entre em contato com o suporte técnico." });
    return;
  }

  if (isClientExpired(client)) {
    addLog(client.name, "expired");
    res.status(403).json({ error: "Este teste temporário de 4 horas já expirou ou foi cancelado.", expired: true });
    return;
  }

  addLog(client.name, "success");

  // Filter channels based on customer package filters and active state
  const allowedChannels = data.channels.filter(ch => {
    if (!ch.active) return false;
    return client.packages.includes(ch.category);
  });

  res.json({
    client: {
      name: client.name,
      expirationDate: client.expirationDate,
      subscriptionType: client.subscriptionType,
      status: client.status,
      token: client.token
    },
    channels: allowedChannels
  });
});

// ==========================================
// WHATSAPP TEMPLATES OPERATIONS
// ==========================================
app.get("/api/whatsapp/templates", (req, res) => {
  const data = loadData();
  res.json(data.whatsappTemplates || DEFAULT_WHATSAPP_TEMPLATES);
});

app.put("/api/whatsapp/templates/:id", (req, res) => {
  const data = loadData();
  if (!data.whatsappTemplates) data.whatsappTemplates = [...DEFAULT_WHATSAPP_TEMPLATES];
  const idx = data.whatsappTemplates.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Template não encontrado." });
    return;
  }
  data.whatsappTemplates[idx].text = req.body.text || "";
  if (req.body.name) data.whatsappTemplates[idx].name = req.body.name;
  saveData(data);
  res.json(data.whatsappTemplates[idx]);
});

app.post("/api/whatsapp/templates", (req, res) => {
  const data = loadData();
  if (!data.whatsappTemplates) data.whatsappTemplates = [...DEFAULT_WHATSAPP_TEMPLATES];
  const newTpl: WhatsAppTemplate = {
    id: "tpl_" + Math.random().toString(36).substring(2, 8),
    name: req.body.name || "Novo Template",
    text: req.body.text || ""
  };
  data.whatsappTemplates.push(newTpl);
  saveData(data);
  res.status(201).json(newTpl);
});

app.delete("/api/whatsapp/templates/:id", (req, res) => {
  const data = loadData();
  if (!data.whatsappTemplates) data.whatsappTemplates = [...DEFAULT_WHATSAPP_TEMPLATES];
  data.whatsappTemplates = data.whatsappTemplates.filter(t => t.id !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

// ==========================================
// SMART REMOTE M3U SYNCHRONIZER
// ==========================================
app.post("/api/channels/sync-url", async (req, res) => {
  const url = req.body.url || "";
  const replace = !!req.body.replace;
  if (!url) {
    res.status(400).json({ error: "URL da lista é necessária." });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Servidor remoto retornou código ${response.status}`);
    }
    const m3uText = await response.text();
    
    const lines = m3uText.split(/\r?\n/);
    const channelsList: Channel[] = [];
    let currentMetadata: { name: string; logoUrl: string; category: string } | null = null;
    let isTruncated = false;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith("#EXTINF:")) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);

        const name = nameMatch ? nameMatch[1].trim() : (tvgNameMatch ? tvgNameMatch[1].trim() : 'Canal Sincronizado');
        const logoUrl = logoMatch ? logoMatch[1].trim() : '';
        const category = groupMatch ? groupMatch[1].trim() : 'Sincronizados';

        currentMetadata = { name, logoUrl, category };
      } else if (!line.startsWith("#") && currentMetadata) {
        if (channelsList.length >= 15000) {
          isTruncated = true;
          break;
        }
        channelsList.push({
          id: Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString().slice(-4),
          name: currentMetadata.name,
          url: line,
          logoUrl: currentMetadata.logoUrl,
          category: currentMetadata.category,
          isVOD: currentMetadata.category.toLowerCase().includes('filme') || 
                 currentMetadata.category.toLowerCase().includes('movie') || 
                 currentMetadata.category.toLowerCase().includes('series') || 
                 currentMetadata.category.toLowerCase().includes('vod'),
          active: true
        });
        currentMetadata = null;
      }
    }

    if (channelsList.length === 0) {
      res.status(400).json({ error: "Nenhum canal válido foi identificado na URL de sincronização informada." });
      return;
    }

    const data = loadData();
    if (replace) {
      data.channels = channelsList;
    } else {
      data.channels = data.channels.concat(channelsList);
    }
    saveData(data);

    const msg = isTruncated
      ? `Sincronização concluída com limite de segurança! Foram importados 15.000 canais (a lista original possuía mais, porém foi truncada para garantir a velocidade e estabilidade do servidor).`
      : `Sincronização efetuada com sucesso!`;

    res.json({ message: msg, count: channelsList.length });
  } catch (err: any) {
    res.status(500).json({ error: `Erro de sincronização: ${err.message || String(err)}` });
  }
});

// ==========================================
// FINANCIAL OPERATIONS
// ==========================================
app.get("/api/finances", (req, res) => {
  const data = loadData();
  res.json(data.transactions || []);
});

app.post("/api/finances", (req, res) => {
  const data = loadData();
  if (!data.transactions) data.transactions = [];
  
  const newTx: Transaction = {
    id: "tx_" + Math.random().toString(36).substring(2, 9),
    type: req.body.type || "income",
    description: req.body.description || "Transação Avulsa",
    value: Number(req.body.value) || 0,
    category: req.body.category || "Geral",
    date: req.body.date || new Date().toISOString().split('T')[0],
    clientName: req.body.clientName || ""
  };

  data.transactions.push(newTx);
  saveData(data);
  res.status(201).json(newTx);
});

app.delete("/api/finances/:id", (req, res) => {
  const data = loadData();
  if (!data.transactions) data.transactions = [];
  data.transactions = data.transactions.filter(t => t.id !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

// ==========================================
// SUB-RESELLERS DEALS
// ==========================================
app.get("/api/resellers", (req, res) => {
  const data = loadData();
  res.json(data.resellers || []);
});

app.post("/api/resellers", (req, res) => {
  const data = loadData();
  if (!data.resellers) data.resellers = [];

  const newReseller: Reseller = {
    id: "res_" + Math.random().toString(36).substring(2, 9),
    name: req.body.name || "Revendedor sem Nome",
    phone: req.body.phone || "",
    credits: Number(req.body.credits) || 0,
    notes: req.body.notes || "",
    createdAt: new Date().toISOString().split('T')[0],
    history: [
      {
        id: "h_" + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        action: `Painel criado com saldo de ${Number(req.body.credits) || 0} créditos.`,
        creditsChanged: Number(req.body.credits) || 0
      }
    ]
  };

  data.resellers.push(newReseller);
  saveData(data);
  res.status(201).json(newReseller);
});

app.put("/api/resellers/:id", (req, res) => {
  const data = loadData();
  if (!data.resellers) data.resellers = [];
  const idx = data.resellers.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Reseller not found" });
    return;
  }

  data.resellers[idx] = {
    ...data.resellers[idx],
    name: req.body.name !== undefined ? req.body.name : data.resellers[idx].name,
    phone: req.body.phone !== undefined ? req.body.phone : data.resellers[idx].phone,
    notes: req.body.notes !== undefined ? req.body.notes : data.resellers[idx].notes,
  };

  saveData(data);
  res.json(data.resellers[idx]);
});

app.post("/api/resellers/:id/credit", (req, res) => {
  const data = loadData();
  if (!data.resellers) data.resellers = [];
  const idx = data.resellers.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Reseller not found" });
    return;
  }

  const amount = Number(req.body.amount) || 0;
  const actionType = req.body.action || "Ajuste de saldo";
  
  data.resellers[idx].credits += amount;
  data.resellers[idx].history.unshift({
    id: "h_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action: `${actionType}: ${amount > 0 ? '+' : ''}${amount} créditos. ${req.body.notes ? '(' + req.body.notes + ')' : ''}`,
    creditsChanged: amount
  });

  saveData(data);
  res.json(data.resellers[idx]);
});

app.delete("/api/resellers/:id", (req, res) => {
  const data = loadData();
  if (!data.resellers) data.resellers = [];
  data.resellers = data.resellers.filter(r => r.id !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

// Backup System for highly robust and durable persistence
app.get("/api/backup/download", (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="gestor_iptv_backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.sendFile(DATA_FILE);
  } else {
    res.status(404).json({ error: "Nenhum arquivo de banco de dados encontrado." });
  }
});

app.post("/api/backup/restore", (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData || !Array.isArray(importedData.clients) || !Array.isArray(importedData.channels)) {
      res.status(400).json({ error: "Formato de backup inválido. É preciso enviar um JSON com as propriedades 'clients' e 'channels'." });
      return;
    }

    const dataObj: StoreData = {
      clients: importedData.clients,
      channels: importedData.channels,
      logs: Array.isArray(importedData.logs) ? importedData.logs : []
    };

    saveData(dataObj);
    res.json({ message: "Backup restaurado com sucesso!", clientsCount: dataObj.clients.length, channelsCount: dataObj.channels.length });
  } catch (err) {
    res.status(500).json({ error: "Erro ao restaurar o backup.", details: String(err) });
  }
});

// Vite middleware flow
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
