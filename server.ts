import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS for external Android apps or Web Player connections
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health API
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', system: 'StreamFlow SaaS PHP 8.3 / Node API Engine', time: new Date().toISOString() });
  });

  // Auth Login API
  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if ((username === 'admin' && password === 'admin123') || username === 'carlossilva') {
      res.json({
        status: 'success',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFN0cmVhbUZsb3ciLCJpYXQiOjE1MTYyMzkwMDB9.sample_jwt_signature',
        user: {
          id: '1',
          name: username === 'admin' ? 'Administrador Master' : 'Carlos Eduardo Silva',
          username,
          role: username === 'admin' ? 'admin' : 'customer',
          status: 'active'
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Credenciais inválidas. Tente admin / admin123' });
    }
  });

  // Persistence files to survive server restarts & serverless statelessness
  const SYNC_CACHE_FILES = [
    path.join(process.cwd(), 'streamflow_synced.json'),
    '/tmp/streamflow_synced.json'
  ];

  let syncedPlaylists: any[] = [];
  let syncedCustomers: any[] = [];

  // Load persistence cache from disk on boot
  for (const file of SYNC_CACHE_FILES) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.playlists) && parsed.playlists.length > 0) {
          syncedPlaylists = parsed.playlists;
        }
        if (Array.isArray(parsed.customers) && parsed.customers.length > 0) {
          syncedCustomers = parsed.customers;
        }
      }
    } catch (err) {
      console.warn(`[StreamFlow] Warning reading persistence cache ${file}:`, err);
    }
  }

  const saveSyncedCache = () => {
    const payload = JSON.stringify({ playlists: syncedPlaylists, customers: syncedCustomers, updatedAt: new Date().toISOString() });
    SYNC_CACHE_FILES.forEach(file => {
      try {
        fs.writeFileSync(file, payload, 'utf-8');
      } catch (e) {
        // Ignore write failures on read-only dirs
      }
    });
  };

  // Sync API Endpoint
  app.post(['/api/v1/sync_playlists', '/api/sync_playlists'], (req: Request, res: Response) => {
    if (Array.isArray(req.body?.playlists)) {
      syncedPlaylists = req.body.playlists;
    }
    if (Array.isArray(req.body?.customers)) {
      syncedCustomers = req.body.customers;
    }
    saveSyncedCache();
    res.json({
      status: 'ok',
      playlistsCount: syncedPlaylists.length,
      customersCount: syncedCustomers.length,
      timestamp: new Date().toISOString()
    });
  });

  // Helper M3U Parser for remote playlists
  const parseM3UText = (rawText: string): any[] => {
    const lines = rawText.split(/\r?\n/);
    const items: any[] = [];
    let currentItem: any = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        currentItem = {};
        const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
        if (logoMatch) currentItem.logoUrl = logoMatch[1];

        const groupMatch = line.match(/group-title="([^"]+)"/i);
        currentItem.groupTitle = groupMatch ? groupMatch[1] : 'Canais Principais';

        const commaIndex = line.indexOf(',');
        if (commaIndex !== -1) {
          currentItem.title = line.substring(commaIndex + 1).trim();
        } else {
          currentItem.title = 'Canal Desconhecido';
        }

        const lowerGroup = (currentItem.groupTitle || '').toLowerCase();
        if (lowerGroup.includes('filme') || lowerGroup.includes('vod') || lowerGroup.includes('movie')) {
          currentItem.category = 'movie';
        } else if (lowerGroup.includes('série') || lowerGroup.includes('series')) {
          currentItem.category = 'series';
        } else {
          currentItem.category = 'live';
        }
      } else if (line.startsWith('#EXTGRP:')) {
        currentItem.groupTitle = line.replace('#EXTGRP:', '').trim();
      } else if (line && !line.startsWith('#')) {
        if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('ace://')) {
          currentItem.streamUrl = line;
          currentItem.id = `m3u-${items.length + 1}`;
          if (currentItem.title && currentItem.streamUrl) {
            items.push({
              id: currentItem.id,
              title: currentItem.title,
              groupTitle: currentItem.groupTitle || 'Canais Principais',
              streamUrl: currentItem.streamUrl,
              logoUrl: currentItem.logoUrl || '',
              category: currentItem.category || 'live'
            });
          }
          currentItem = {};
        }
      }
    }
    return items;
  };

  // Remote M3U URL cache
  const remoteM3uCache = new Map<string, { items: any[]; fetchedAt: number }>();

  // Async helper to get active channels list, including fetching remote M3U URLs
  const getAllSyncedItemsAsync = async (): Promise<{ items: any[]; categoriesMap: Map<string, string>; categoriesList: { category_id: string; category_name: string; parent_id: number }[] }> => {
    // If syncedPlaylists is empty, try loading from disk cache
    if (syncedPlaylists.length === 0) {
      for (const file of SYNC_CACHE_FILES) {
        try {
          if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.playlists) && parsed.playlists.length > 0) syncedPlaylists = parsed.playlists;
            if (Array.isArray(parsed.customers) && parsed.customers.length > 0) syncedCustomers = parsed.customers;
          }
        } catch (e) {}
      }
    }

    let allItems: any[] = [];

    for (const pl of syncedPlaylists) {
      if (Array.isArray(pl.items) && pl.items.length > 0) {
        allItems.push(...pl.items);
      } else if (pl.m3uUrl && typeof pl.m3uUrl === 'string' && !pl.m3uUrl.includes('/get.php')) {
        // Fetch remote M3U playlist if items array is empty and m3uUrl is external
        const cache = remoteM3uCache.get(pl.m3uUrl);
        const now = Date.now();
        if (cache && (now - cache.fetchedAt) < 600000) { // 10 minutes cache
          allItems.push(...cache.items);
        } else {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(pl.m3uUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (response.ok) {
              const text = await response.text();
              const parsedItems = parseM3UText(text);
              if (parsedItems.length > 0) {
                remoteM3uCache.set(pl.m3uUrl, { items: parsedItems, fetchedAt: now });
                allItems.push(...parsedItems);
                pl.items = parsedItems; // cache back into memory
                saveSyncedCache();
              }
            }
          } catch (err) {
            console.warn(`[StreamFlow] Error fetching remote M3U URL ${pl.m3uUrl}:`, err);
            if (cache) allItems.push(...cache.items);
          }
        }
      }
    }

    // Assign consistent numeric stream IDs to all channels
    allItems.forEach((item, idx) => {
      item.stream_id = 1000 + idx;
    });

    const categoriesMap = new Map<string, string>();
    const categoriesList: { category_id: string; category_name: string; parent_id: number }[] = [];
    let catCounter = 1;

    allItems.forEach(item => {
      const gTitle = item.groupTitle || 'Canais Principais';
      if (!categoriesMap.has(gTitle)) {
        const catId = String(catCounter++);
        categoriesMap.set(gTitle, catId);
        categoriesList.push({ category_id: catId, category_name: gTitle, parent_id: 0 });
      }
    });

    return { items: allItems, categoriesMap, categoriesList };
  };

  // Helper to determine active DNS URL
  const resolveBaseDns = (req: Request): string => {
    const customDns = (req.query.dns || req.query.dns_url || req.query.sys_dns || req.body?.dns_url || req.headers['x-system-dns']) as string;
    if (customDns && customDns.trim()) {
      return customDns.trim().replace(/\/+$/, '');
    }
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    return `${protocol}://${forwardedHost}`;
  };

  // M3U Playlist Generator Helper using dynamic synced items
  const buildM3uPlaylist = async (username: string, password: string, baseUrl: string): Promise<string> => {
    const { items } = await getAllSyncedItemsAsync();
    let m3u = `#EXTM3U x-tvg-url="${baseUrl}/epg.xml.gz"\n\n`;

    items.forEach((item, idx) => {
      const streamId = item.stream_id || (1000 + idx);
      const type = item.category === 'movie' ? 'movie' : item.category === 'series' ? 'series' : 'live';
      const ext = item.category === 'movie' ? '.mp4' : item.category === 'series' ? '.mp4' : '.m3u8';
      m3u += `#EXTINF:-1 tvg-id="${item.id || streamId}" tvg-name="${item.title}" tvg-logo="${item.logoUrl || ''}" group-title="${item.groupTitle || 'Ao Vivo'}",${item.title}\n`;
      m3u += `${baseUrl}/${type}/${username}/${password}/${streamId}${ext}\n\n`;
    });

    return m3u;
  };

  // Xtream M3U Endpoint: /get.php (GET & POST)
  app.all('/get.php', async (req: Request, res: Response) => {
    const username = (req.query.username || req.body?.username || 'demo') as string;
    const password = (req.query.password || req.body?.password || 'demo') as string;
    const baseUrl = resolveBaseDns(req);

    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${username}.m3u"`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const m3uContent = await buildM3uPlaylist(username, password, baseUrl);
    res.send(m3uContent);
  });

  // Dedicated M3U Proxy Endpoint: /api/m3u/proxy & /api/v1/m3u/proxy
  app.all(['/api/m3u/proxy', '/api/v1/m3u/proxy'], async (req: Request, res: Response) => {
    const username = (req.query.username || req.body?.username || 'demo') as string;
    const password = (req.query.password || req.body?.password || 'demo') as string;
    const remoteUrl = (req.query.url || req.query.m3u_url || req.body?.url) as string;
    const baseUrl = resolveBaseDns(req);

    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', `inline; filename="${username}_playlist.m3u"`);

    // If an external M3U URL is provided, proxy and append/replace host dynamically
    if (remoteUrl) {
      try {
        const fetchRes = await fetch(remoteUrl);
        if (!fetchRes.ok) {
          throw new Error(`Erro HTTP ${fetchRes.status} ao carregar playlist remota.`);
        }
        let rawM3u = await fetchRes.text();

        // Rewrite stream lines relative or internal links to use the system DNS URL
        const lines = rawM3u.split('\n').map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            // Keep absolute external media links intact or proxy through baseUrl if needed
            return trimmed;
          }
          // Relative link: append system DNS
          return `${baseUrl}/${trimmed.replace(/^\/+/, '')}`;
        });

        return res.send(lines.join('\n'));
      } catch (err: any) {
        console.error('Erro no proxy M3U remoto:', err);
        // Fallback to dynamic local M3U playlist
        const fallbackM3u = await buildM3uPlaylist(username, password, baseUrl);
        return res.send(fallbackM3u);
      }
    }

    // Default dynamic playlist generated with system DNS URL
    const m3uContent = await buildM3uPlaylist(username, password, baseUrl);
    res.send(m3uContent);
  });

  // Xtream Codes Player API compatibility Endpoint for XCIPTV, Android ExoPlayer & Smart TV Apps
  app.all('/player_api.php', async (req: Request, res: Response) => {
    const username = (req.query.username || req.body?.username || 'usuario') as string;
    const password = (req.query.password || req.body?.password || 'senha') as string;
    const action = (req.query.action || req.body?.action || '') as string;

    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
    const hostDomain = forwardedHost.split(':')[0];
    const hostPort = forwardedHost.split(':')[1] || (forwardedProto === 'https' ? '443' : '80');

    const { items, categoriesMap, categoriesList } = await getAllSyncedItemsAsync();

    // 1. Live Categories for XCIPTV
    if (action === 'get_live_categories') {
      const liveCategories = categoriesList.filter(cat => {
        const catNameLower = cat.category_name.toLowerCase();
        return !catNameLower.includes('filme') && !catNameLower.includes('vod') && !catNameLower.includes('série') && !catNameLower.includes('series');
      });
      return res.json(liveCategories.length > 0 ? liveCategories : categoriesList);
    }

    // 2. Live Streams list for XCIPTV
    if (action === 'get_live_streams') {
      const catId = (req.query.category_id || req.body?.category_id || '') as string;
      const liveItems = items.filter(it => it.category !== 'movie' && it.category !== 'series');

      const streams = liveItems.map((item, idx) => {
        const streamId = item.stream_id || (1000 + idx);
        const gTitle = item.groupTitle || 'Canais Principais';
        const itemCatId = categoriesMap.get(gTitle) || '1';
        return {
          num: idx + 1,
          name: item.title,
          stream_type: 'live',
          stream_id: streamId,
          stream_icon: item.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
          epg_channel_id: item.id || `ch-${streamId}`,
          added: '1672531200',
          category_id: itemCatId,
          custom_sid: '',
          tv_archive: 0,
          direct_source: item.streamUrl,
          tv_archive_duration: 0
        };
      });

      if (catId) {
        return res.json(streams.filter(s => s.category_id === catId));
      }
      return res.json(streams);
    }

    // 3. VOD / Movie Categories for XCIPTV
    if (action === 'get_vod_categories') {
      const vodCategories = categoriesList.filter(cat => {
        const catNameLower = cat.category_name.toLowerCase();
        return catNameLower.includes('filme') || catNameLower.includes('vod') || catNameLower.includes('movie');
      });
      return res.json(vodCategories.length > 0 ? vodCategories : [
        { category_id: '10', category_name: 'Filmes & VODs', parent_id: 0 }
      ]);
    }

    // 4. VOD / Movie Streams for XCIPTV
    if (action === 'get_vod_streams') {
      const catId = (req.query.category_id || req.body?.category_id || '') as string;
      const vodItems = items.filter(it => {
        if (it.category === 'movie') return true;
        const gLower = (it.groupTitle || '').toLowerCase();
        return gLower.includes('filme') || gLower.includes('vod') || gLower.includes('movie');
      });

      const streams = vodItems.map((item, idx) => {
        const streamId = item.stream_id || (2000 + idx);
        const gTitle = item.groupTitle || 'Filmes & VODs';
        const itemCatId = categoriesMap.get(gTitle) || '10';
        return {
          num: idx + 1,
          name: item.title,
          stream_type: 'movie',
          stream_id: streamId,
          stream_icon: item.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100',
          added: '1672531200',
          category_id: itemCatId,
          container_extension: 'mp4',
          custom_sid: '',
          direct_source: item.streamUrl
        };
      });

      if (catId) {
        return res.json(streams.filter(s => s.category_id === catId));
      }
      return res.json(streams);
    }

    // 5. Series Categories
    if (action === 'get_series_categories') {
      const seriesCategories = categoriesList.filter(cat => {
        const catNameLower = cat.category_name.toLowerCase();
        return catNameLower.includes('série') || catNameLower.includes('series');
      });
      return res.json(seriesCategories.length > 0 ? seriesCategories : [
        { category_id: '20', category_name: 'Séries Principais', parent_id: 0 }
      ]);
    }

    // 6. Series Streams
    if (action === 'get_series_streams') {
      const catId = (req.query.category_id || req.body?.category_id || '') as string;
      const seriesItems = items.filter(it => {
        if (it.category === 'series') return true;
        const gLower = (it.groupTitle || '').toLowerCase();
        return gLower.includes('série') || gLower.includes('series');
      });

      const streams = seriesItems.map((item, idx) => {
        const streamId = item.stream_id || (3000 + idx);
        const gTitle = item.groupTitle || 'Séries Principais';
        const itemCatId = categoriesMap.get(gTitle) || '20';
        return {
          num: idx + 1,
          name: item.title,
          series_id: streamId,
          cover: item.logoUrl || '',
          plot: 'Série cadastrada no painel StreamFlow',
          cast: '',
          director: '',
          genre: gTitle,
          releaseDate: '2026',
          last_modified: '1672531200',
          rating: '5',
          category_id: itemCatId
        };
      });

      if (catId) {
        return res.json(streams.filter(s => s.category_id === catId));
      }
      return res.json(streams);
    }

    // 7. EPG / Short EPG for XCIPTV
    if (action === 'get_short_epg' || action === 'get_epg') {
      const streamIdReq = (req.query.stream_id || req.body?.stream_id || '') as string;
      const liveItems = items.filter(it => it.category !== 'movie' && it.category !== 'series');
      const targetItems = liveItems.length > 0 ? liveItems : items;

      const nowTs = Math.floor(Date.now() / 1000);
      const epgListings = targetItems.map((item, idx) => {
        const streamId = item.stream_id || (1000 + idx);
        return {
          id: String(idx + 1),
          epg_id: String(streamId),
          title: `${item.title} - Programação Ao Vivo`,
          lang: 'pt',
          start: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
          end: new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 19),
          description: `Transmissão ao vivo de ${item.title} (${item.groupTitle || 'Canais Principais'}). Sinal HLS / M3U8.`,
          channel_id: item.id || `ch-${streamId}`,
          start_timestamp: nowTs - 3600,
          stop_timestamp: nowTs + 86400
        };
      });

      if (streamIdReq) {
        const filtered = epgListings.filter(e => e.epg_id === String(streamIdReq));
        return res.json({ epg_listings: filtered.length > 0 ? filtered : epgListings.slice(0, 5) });
      }

      return res.json({ epg_listings: epgListings.slice(0, 100) });
    }

    // Check customer credentials from synced customers
    const matchedCustomer = syncedCustomers.find((c: any) =>
      c.username === username || c.email === username || c.id === username
    );

    const isAccountActive = matchedCustomer ? matchedCustomer.status !== 'inactive' && matchedCustomer.status !== 'expired' : true;

    // Default Xtream Codes Login Response for XCIPTV authentication check
    return res.json({
      user_info: {
        username: username || 'usuario',
        password: password || 'senha',
        message: matchedCustomer
          ? `Autenticação bem sucedida. Cliente: ${matchedCustomer.name || username}`
          : 'Autenticação realizada com sucesso - StreamFlow Server',
        auth: isAccountActive ? 1 : 0,
        status: isAccountActive ? 'Active' : 'Expired',
        exp_date: matchedCustomer?.expirationDate || matchedCustomer?.expiresAt
          ? String(Math.floor(new Date(matchedCustomer.expirationDate || matchedCustomer.expiresAt).getTime() / 1000))
          : '1786838400',
        is_trial: matchedCustomer?.status === 'trial' ? '1' : '0',
        active_cons: '1',
        created_at: '1672531200',
        max_connections: matchedCustomer?.maxConnections ? String(matchedCustomer.maxConnections) : '5',
        allowed_output_formats: ['m3u8', 'ts', 'rtmp', 'mp4', 'mkv']
      },
      server_info: {
        url: hostDomain,
        port: hostPort,
        https_port: '443',
        server_protocol: forwardedProto,
        rtmp_port: '8888',
        timezone: 'America/Sao_Paulo',
        timestamp_now: Math.floor(Date.now() / 1000),
        time_now: new Date().toISOString().replace('T', ' ').slice(0, 19),
        process: true
      }
    });
  });

  // Stream Health Checker API Endpoint
  app.post('/api/v1/check_stream_health', async (req: Request, res: Response) => {
    const { streamUrl, streamUrls } = req.body;

    const testSingleUrl = async (url: string) => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        return { url, online: resp.ok || resp.status < 400, statusCode: resp.status, latencyMs: latency };
      } catch (err: any) {
        const latency = Date.now() - startTime;
        return { url, online: false, statusCode: 0, error: err.message || 'Timeout / Unreachable', latencyMs: latency };
      }
    };

    if (streamUrl && typeof streamUrl === 'string') {
      const result = await testSingleUrl(streamUrl);
      return res.json({ status: 'ok', result });
    }

    if (Array.isArray(streamUrls) && streamUrls.length > 0) {
      const limited = streamUrls.slice(0, 30); // Test up to 30 channels per request
      const results = await Promise.all(limited.map(u => testSingleUrl(u)));
      return res.json({ status: 'ok', results });
    }

    return res.status(400).json({ status: 'error', message: 'URL de stream não fornecida.' });
  });

  // EPG XMLTV Endpoints for XCIPTV & Smart IPTV
  app.all(['/xmltv.php', '/epg.xml.gz', '/epg.xml'], async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    const { items } = await getAllSyncedItemsAsync();

    const now = new Date();
    const startTimeStr = now.toISOString().replace(/[-T:]/g, '').slice(0, 14) + ' +0000';
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const stopTimeStr = tomorrow.toISOString().replace(/[-T:]/g, '').slice(0, 14) + ' +0000';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="StreamFlow Dynamic EPG Engine">\n`;

    const liveItems = items.filter(it => it.category !== 'movie' && it.category !== 'series');
    const targetList = liveItems.length > 0 ? liveItems : items;

    targetList.forEach((item, idx) => {
      const chId = item.id || `ch-${100 + idx}`;
      const titleClean = (item.title || 'Canal Ao Vivo').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const groupClean = (item.groupTitle || 'Geral').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      xml += `  <channel id="${chId}">\n`;
      xml += `    <display-name>${titleClean}</display-name>\n`;
      if (item.logoUrl) {
        xml += `    <icon src="${item.logoUrl.replace(/&/g, '&amp;')}" />\n`;
      }
      xml += `  </channel>\n`;

      xml += `  <programme start="${startTimeStr}" stop="${stopTimeStr}" channel="${chId}">\n`;
      xml += `    <title lang="pt">${titleClean} - Transmissão Ao Vivo</title>\n`;
      xml += `    <desc lang="pt">Programação em tempo real para a categoria ${groupClean}. Sinal de streaming em alta definição.</desc>\n`;
      xml += `  </programme>\n`;
    });

    xml += `</tv>`;
    res.send(xml);
  });

  // Stream Player Proxy / Redirect endpoints for XCIPTV video playback
  app.all(['/live/:user/:pass/:id', '/live/:id'], async (req: Request, res: Response) => {
    const rawId = req.params.id || '';
    const cleanId = rawId.replace(/\.(m3u8|ts|mp4|mkv)$/i, '');
    const numId = parseInt(cleanId, 10);
    const { items } = await getAllSyncedItemsAsync();

    if (!isNaN(numId)) {
      // 1. Try matching exact stream_id
      const foundByStreamId = items.find(it => it.stream_id === numId);
      if (foundByStreamId && foundByStreamId.streamUrl) {
        return res.redirect(foundByStreamId.streamUrl);
      }

      // 2. Fallback index matching
      const liveItems = items.filter(it => it.category !== 'movie' && it.category !== 'series');
      const idx = numId >= 1000 ? numId - 1000 : numId >= 100 ? numId - 100 : numId - 1;
      const targetList = liveItems.length > 0 ? liveItems : items;
      if (targetList[idx] && targetList[idx].streamUrl) {
        return res.redirect(targetList[idx].streamUrl);
      }
    }

    const found = items.find(it => it.id === cleanId);
    if (found && found.streamUrl) {
      return res.redirect(found.streamUrl);
    }

    return res.status(404).send('Canal ao vivo não encontrado ou sem canais cadastrados.');
  });

  app.all(['/movie/:user/:pass/:id', '/movie/:id', '/series/:user/:pass/:id', '/series/:id'], async (req: Request, res: Response) => {
    const rawId = req.params.id || '';
    const cleanId = rawId.replace(/\.(m3u8|ts|mp4|mkv)$/i, '');
    const numId = parseInt(cleanId, 10);
    const { items } = await getAllSyncedItemsAsync();

    if (!isNaN(numId)) {
      // 1. Try matching exact stream_id
      const foundByStreamId = items.find(it => it.stream_id === numId);
      if (foundByStreamId && foundByStreamId.streamUrl) {
        return res.redirect(foundByStreamId.streamUrl);
      }

      // 2. Fallback index matching
      const vodItems = items.filter(it => it.category === 'movie' || it.category === 'series');
      const idx = numId >= 2000 ? numId - 2000 : numId >= 200 ? numId - 200 : numId - 1;
      const targetList = vodItems.length > 0 ? vodItems : items;
      if (targetList[idx] && targetList[idx].streamUrl) {
        return res.redirect(targetList[idx].streamUrl);
      }
    }

    const found = items.find(it => it.id === cleanId);
    if (found && found.streamUrl) {
      return res.redirect(found.streamUrl);
    }

    return res.status(404).send('Conteúdo VOD não encontrado ou sem conteúdos cadastrados.');
  });

  // Vite middleware setup for development/production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StreamFlow SaaS Server rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor StreamFlow:', err);
  process.exit(1);
});
