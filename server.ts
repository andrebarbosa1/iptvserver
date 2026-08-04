import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // M3U Playlist Generator Helper
  const buildM3uPlaylist = (username: string, password: string, baseUrl: string): string => {
    return `#EXTM3U x-tvg-url="${baseUrl}/epg.xml.gz"

#EXTINF:-1 tvg-id="NASA" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" group-title="Ao Vivo - Ciência",NASA TV Official HD
${baseUrl}/live/${username}/${password}/101.m3u8

#EXTINF:-1 tvg-id="DW" tvg-name="DW News" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg" group-title="Ao Vivo - Notícias",DW News Live 24/7
${baseUrl}/live/${username}/${password}/102.m3u8

#EXTINF:-1 tvg-id="REDBULL" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/f/ff/Red_Bull_Logo.svg" group-title="Ao Vivo - Esportes",Red Bull TV Action Sports
${baseUrl}/live/${username}/${password}/103.m3u8

#EXTINF:-1 tvg-id="FRANCE24" tvg-name="France 24" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c2/France_24_logo.svg" group-title="Ao Vivo - Notícias",France 24 English
${baseUrl}/live/${username}/${password}/104.m3u8

#EXTINF:-1 tvg-id="BBB" tvg-name="Big Buck Bunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg" group-title="Filmes - Animação",Big Buck Bunny (4K Ultra HD)
${baseUrl}/movie/${username}/${password}/201.mp4

#EXTINF:-1 tvg-id="SINTEL" tvg-name="Sintel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg" group-title="Filmes - Fantasia",Sintel (Open Source Movie 1080p)
${baseUrl}/movie/${username}/${password}/202.mp4
`;
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

    // 1. Live Categories for XCIPTV
    if (action === 'get_live_categories') {
      return res.json([
        { category_id: '1', category_name: 'Ao Vivo - Notícias & Ciência', parent_id: 0 },
        { category_id: '2', category_name: 'Ao Vivo - Esportes', parent_id: 0 }
      ]);
    }

    // 2. Live Streams list for XCIPTV
    if (action === 'get_live_streams') {
      const catId = (req.query.category_id || req.body?.category_id || '') as string;
      const allStreams = [
        {
          num: 1,
          name: 'NASA TV Official HD',
          stream_type: 'live',
          stream_id: 101,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
          epg_channel_id: 'NASA',
          added: '1672531200',
          category_id: '1',
          custom_sid: '',
          tv_archive: 0,
          direct_source: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8',
          tv_archive_duration: 0
        },
        {
          num: 2,
          name: 'DW News English 24/7',
          stream_type: 'live',
          stream_id: 102,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg',
          epg_channel_id: 'DW',
          added: '1672531200',
          category_id: '1',
          custom_sid: '',
          tv_archive: 0,
          direct_source: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
          tv_archive_duration: 0
        },
        {
          num: 3,
          name: 'Red Bull TV Action Sports',
          stream_type: 'live',
          stream_id: 103,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Red_Bull_Logo.svg',
          epg_channel_id: 'REDBULL',
          added: '1672531200',
          category_id: '2',
          custom_sid: '',
          tv_archive: 0,
          direct_source: 'https://rbmn-live.akamaized.net/hls/live/591070/FLI-RBTV-GLOBAL/master.m3u8',
          tv_archive_duration: 0
        }
      ];

      if (catId) {
        return res.json(allStreams.filter(s => s.category_id === catId));
      }
      return res.json(allStreams);
    }

    // 3. VOD / Movie Categories for XCIPTV
    if (action === 'get_vod_categories') {
      return res.json([
        { category_id: '10', category_name: 'Filmes - Animação & Fantasia', parent_id: 0 }
      ]);
    }

    // 4. VOD / Movie Streams for XCIPTV
    if (action === 'get_vod_streams') {
      return res.json([
        {
          num: 1,
          name: 'Big Buck Bunny (4K)',
          stream_type: 'movie',
          stream_id: 201,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
          added: '1672531200',
          category_id: '10',
          container_extension: 'mp4',
          custom_sid: '',
          direct_source: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
        },
        {
          num: 2,
          name: 'Sintel (Open Source Movie)',
          stream_type: 'movie',
          stream_id: 202,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
          added: '1672531200',
          category_id: '10',
          container_extension: 'mp4',
          custom_sid: '',
          direct_source: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
        }
      ]);
    }

    // 5. Series Categories
    if (action === 'get_series_categories') {
      return res.json([
        { category_id: '20', category_name: 'Séries Principais', parent_id: 0 }
      ]);
    }

    // 6. Series Streams
    if (action === 'get_series_streams') {
      return res.json([]);
    }

    // 7. EPG / Short EPG for XCIPTV
    if (action === 'get_short_epg' || action === 'get_epg') {
      return res.json({
        epg_listings: [
          {
            id: '1',
            epg_id: '101',
            title: 'Transmissão Ao Vivo NASA HD',
            lang: 'en',
            start: '2026-08-04 00:00:00',
            end: '2026-08-05 00:00:00',
            description: 'Programação de espaço, lançamento de foguetes e transmissões da ISS.',
            channel_id: 'NASA',
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
  <channel id="NASA">
    <display-name>NASA TV Official HD</display-name>
  </channel>
  <programme start="20260804000000 +0000" stop="20260805000000 +0000" channel="NASA">
    <title lang="pt">NASA Space Station Live</title>
    <desc lang="pt">Transmissão em direto da Estação Espacial Internacional e Exploração Espacial.</desc>
  </programme>
</tv>`);
  });

  // Stream Player Proxy / Redirect endpoints for XCIPTV video playback
  app.all(['/live/:user/:pass/:id', '/live/:id'], (req: Request, res: Response) => {
    const id = req.params.id || '';
    if (id.includes('102')) {
      return res.redirect('https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8');
    }
    if (id.includes('103')) {
      return res.redirect('https://rbmn-live.akamaized.net/hls/live/591070/FLI-RBTV-GLOBAL/master.m3u8');
    }
    // Default NASA TV
    return res.redirect('https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8');
  });

  app.all(['/movie/:user/:pass/:id', '/movie/:id', '/series/:user/:pass/:id', '/series/:id'], (req: Request, res: Response) => {
    const id = req.params.id || '';
    if (id.includes('202')) {
      return res.redirect('https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8');
    }
    return res.redirect('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
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

startServer();
