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

  // Xtream M3U Endpoint: /get.php?username=...&password=...&type=m3u_plus
  app.get('/get.php', (req: Request, res: Response) => {
    const username = (req.query.username as string) || 'demo';
    const password = (req.query.password as string) || 'demo';

    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${username}.m3u"`);

    const m3uContent = `#EXTM3U x-tvg-url="http://play.streamflow.com/epg.xml.gz"

#EXTINF:-1 tvg-id="NASA" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" group-title="Ao Vivo - Ciência",NASA TV Official HD
https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8

#EXTINF:-1 tvg-id="DW" tvg-name="DW News" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg" group-title="Ao Vivo - Notícias",DW News Live 24/7
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8

#EXTINF:-1 tvg-id="REDBULL" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/f/ff/Red_Bull_Logo.svg" group-title="Ao Vivo - Esportes",Red Bull TV Action Sports
https://rbmn-live.akamaized.net/hls/live/591070/FLI-RBTV-GLOBAL/master.m3u8

#EXTINF:-1 tvg-id="FRANCE24" tvg-name="France 24" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c2/France_24_logo.svg" group-title="Ao Vivo - Notícias",France 24 English
https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8

#EXTINF:-1 tvg-id="BBB" tvg-name="Big Buck Bunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg" group-title="Filmes - Animação",Big Buck Bunny (4K Ultra HD)
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="SINTEL" tvg-name="Sintel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg" group-title="Filmes - Fantasia",Sintel (Open Source Movie 1080p)
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
`;

    res.send(m3uContent);
  });

  // Xtream Codes Player API compatibility Endpoint for Android ExoPlayer App
  app.get('/player_api.php', (req: Request, res: Response) => {
    const username = (req.query.username as string) || '';
    const password = (req.query.password as string) || '';
    const action = (req.query.action as string) || '';

    if (!username || !password) {
      return res.json({ user_info: { auth: 0, message: 'Credenciais de usuário ou senha ausentes' } });
    }

    if (action === 'get_live_categories') {
      return res.json([
        { category_id: '1', category_name: 'Ao Vivo - Ciência & Notícias' },
        { category_id: '2', category_name: 'Ao Vivo - Esportes' },
        { category_id: '3', category_name: 'Filmes VOD 4K' }
      ]);
    }

    if (action === 'get_live_streams') {
      return res.json([
        {
          num: 1,
          name: 'NASA TV Official HD',
          stream_type: 'live',
          stream_id: 101,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
          category_id: '1'
        },
        {
          num: 2,
          name: 'DW News English',
          stream_type: 'live',
          stream_id: 102,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg',
          category_id: '1'
        },
        {
          num: 3,
          name: 'Red Bull TV Sports',
          stream_type: 'live',
          stream_id: 103,
          stream_icon: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Red_Bull_Logo.svg',
          category_id: '2'
        }
      ]);
    }

    // Default auth info
    return res.json({
      user_info: {
        username,
        password,
        message: 'Autenticado com sucesso no StreamFlow SaaS',
        auth: 1,
        status: 'Active',
        exp_date: '1786838400',
        active_cons: '1',
        max_connections: '2'
      },
      server_info: {
        url: 'play.streamflow.com',
        port: '80',
        https_port: '443',
        server_protocol: 'https',
        timezone: 'America/Sao_Paulo'
      }
    });
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
