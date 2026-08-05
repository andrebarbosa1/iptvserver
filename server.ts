import express, { Request, Response } from 'express';
import path from 'path';
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

  // In-memory store for synced playlists and customers from UI
  let syncedPlaylists: any[] = [];
  let syncedCustomers: any[] = [];

  // Sync API Endpoint
  app.post(['/api/v1/sync_playlists', '/api/sync_playlists'], (req: Request, res: Response) => {
    if (Array.isArray(req.body?.playlists)) {
      syncedPlaylists = req.body.playlists;
    }
    if (Array.isArray(req.body?.customers)) {
      syncedCustomers = req.body.customers;
    }
    res.json({
      status: 'ok',
      playlistsCount: syncedPlaylists.length,
      customersCount: syncedCustomers.length,
      timestamp: new Date().toISOString()
    });
  });

  // Helper to get active channels list
  const getAllSyncedItems = (): { items: any[]; categoriesMap: Map<string, string>; categoriesList: { category_id: string; category_name: string; parent_id: number }[] } => {
    let allItems: any[] = [];
    syncedPlaylists.forEach(pl => {
      if (Array.isArray(pl.items) && pl.items.length > 0) {
        allItems.push(...pl.items);
      }
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
  const buildM3uPlaylist = (username: string, password: string, baseUrl: string): string => {
    const { items } = getAllSyncedItems();
    let m3u = `#EXTM3U x-tvg-url="${baseUrl}/epg.xml.gz"\n\n`;

    items.forEach((item, idx) => {
      const streamId = 100 + idx;
      const type = item.category === 'movie' ? 'movie' : 'live';
      const ext = item.category === 'movie' ? '.mp4' : '.m3u8';
      m3u += `#EXTINF:-1 tvg-id="${item.id || streamId}" tvg-name="${item.title}" tvg-logo="${item.logoUrl || ''}" group-title="${item.groupTitle || 'Ao Vivo'}",${item.title}\n`;
      m3u += `${baseUrl}/${type}/${username}/${password}/${streamId}${ext}\n\n`;
    });

    return m3u;
  };

  // Xtream M3U Endpoint: /get.php (GET & POST)
  app.all('/get.php', (req: Request, res: Response) => {
    const username = (req.query.username || req.body?.username || 'demo') as string;
    const password = (req.query.password || req.body?.password || 'demo') as string;
    const baseUrl = resolveBaseDns(req);

    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${username}.m3u"`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const m3uContent = buildM3uPlaylist(username, password, baseUrl);
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
        return res.send(buildM3uPlaylist(username, password, baseUrl));
      }
    }

    // Default dynamic playlist generated with system DNS URL
    const m3uContent = buildM3uPlaylist(username, password, baseUrl);
    res.send(m3uContent);
  });

  // Xtream Codes Player API compatibility Endpoint for XCIPTV, Android ExoPlayer & Smart TV Apps
  app.all('/player_api.php', (req: Request, res: Response) => {
    const username = (req.query.username || req.body?.username || 'usuario') as string;
    const password = (req.query.password || req.body?.password || 'senha') as string;
    const action = (req.query.action || req.body?.action || '') as string;

    const host = req.headers.host || 'localhost:3000';
    const protocol = req.protocol || 'http';

    const { items, categoriesMap, categoriesList } = getAllSyncedItems();

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
        const streamId = 100 + idx;
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
      const vodItems = items.filter(it => {
        if (it.category === 'movie') return true;
        const gLower = (it.groupTitle || '').toLowerCase();
        return gLower.includes('filme') || gLower.includes('vod') || gLower.includes('movie');
      });

      const streams = vodItems.map((item, idx) => {
        const streamId = 200 + idx;
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
      const seriesItems = items.filter(it => {
        if (it.category === 'series') return true;
        const gLower = (it.groupTitle || '').toLowerCase();
        return gLower.includes('série') || gLower.includes('series');
      });

      const streams = seriesItems.map((item, idx) => {
        const streamId = 300 + idx;
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
      return res.json(streams);
    }

    // 7. EPG / Short EPG for XCIPTV
    if (action === 'get_short_epg' || action === 'get_epg') {
      return res.json({
        epg_listings: [
          {
            id: '1',
            epg_id: '101',
            title: 'Transmissão Ao Vivo StreamFlow HD',
            lang: 'pt',
            start: '2026-08-04 00:00:00',
            end: '2026-08-05 00:00:00',
            description: 'Programação de TV ao Vivo e Canais HLS / M3U8.',
            channel_id: '101',
            start_timestamp: Math.floor(Date.now() / 1000) - 3600,
            stop_timestamp: Math.floor(Date.now() / 1000) + 86400
          }
        ]
      });
    }

    // Default Xtream Codes Login Response for XCIPTV authentication check
    return res.json({
      user_info: {
        username: username || 'usuario',
        password: password || 'senha',
        message: 'Autenticação realizada com sucesso - StreamFlow Server',
        auth: 1,
        status: 'Active',
        exp_date: '1786838400',
        is_trial: '0',
        active_cons: '1',
        created_at: '1672531200',
        max_connections: '5',
        allowed_output_formats: ['m3u8', 'ts', 'rtmp', 'mp4', 'mkv']
      },
      server_info: {
        url: host.split(':')[0],
        port: host.split(':')[1] || '80',
        https_port: '443',
        server_protocol: protocol,
        rtmp_port: '8888',
        timezone: 'America/Sao_Paulo',
        timestamp_now: Math.floor(Date.now() / 1000),
        time_now: new Date().toISOString().replace('T', ' ').slice(0, 19),
        process: true
      }
    });
  });

  // EPG XMLTV Endpoints for XCIPTV & Smart IPTV
  app.all(['/xmltv.php', '/epg.xml.gz', '/epg.xml'], (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.send(`<?xml font="1.0" encoding="UTF-8"?>
<tv generator-info-name="StreamFlow EPG Generator">
  <channel id="101">
    <display-name>Canal Ao Vivo HD</display-name>
  </channel>
  <programme start="20260804000000 +0000" stop="20260805000000 +0000" channel="101">
    <title lang="pt">Programação em Tempo Real</title>
    <desc lang="pt">Sinal de TV ao Vivo e grade de programação sincronizada.</desc>
  </programme>
</tv>`);
  });

  // Stream Player Proxy / Redirect endpoints for XCIPTV video playback
  app.all(['/live/:user/:pass/:id', '/live/:id'], (req: Request, res: Response) => {
    const rawId = req.params.id || '';
    const cleanId = rawId.replace(/\.(m3u8|ts|mp4|mkv)$/i, '');
    const numId = parseInt(cleanId, 10);
    const { items } = getAllSyncedItems();

    if (!isNaN(numId)) {
      const index = numId >= 100 ? numId - 100 : numId - 1;
      if (items[index] && items[index].streamUrl) {
        return res.redirect(items[index].streamUrl);
      }
    }

    const found = items.find(it => it.id === cleanId);
    if (found && found.streamUrl) {
      return res.redirect(found.streamUrl);
    }

    return res.status(404).send('Canal ao vivo não encontrado ou sem canais cadastrados.');
  });

  app.all(['/movie/:user/:pass/:id', '/movie/:id', '/series/:user/:pass/:id', '/series/:id'], (req: Request, res: Response) => {
    const rawId = req.params.id || '';
    const cleanId = rawId.replace(/\.(m3u8|ts|mp4|mkv)$/i, '');
    const numId = parseInt(cleanId, 10);
    const { items } = getAllSyncedItems();

    if (!isNaN(numId)) {
      const index = numId >= 200 ? numId - 200 : numId - 1;
      if (items[index] && items[index].streamUrl) {
        return res.redirect(items[index].streamUrl);
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
