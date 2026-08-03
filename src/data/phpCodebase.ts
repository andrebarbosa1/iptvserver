export interface PhpFile {
  path: string;
  category: 'installer' | 'core' | 'controllers' | 'models' | 'api' | 'sql' | 'config';
  description: string;
  code: string;
}

export const PHP_CODEBASE: PhpFile[] = [
  {
    path: 'install.php',
    category: 'installer',
    description: 'Instalador automático do sistema com verificação de pré-requisitos PHP 8.3 e MySQL 8',
    code: `<?php
/**
 * StreamFlow SaaS - Instalador Automático PHP 8.3 / MySQL 8
 */
session_start();

$step = $_GET['step'] ?? 1;
$errors = [];
$success = false;

// 1. Verificação de Requisitos
$requirements = [
    'php_version' => version_compare(PHP_VERSION, '8.3.0', '>='),
    'pdo_mysql'   => extension_loaded('pdo_mysql'),
    'curl'        => extension_loaded('curl'),
    'mbstring'    => extension_loaded('mbstring'),
    'openssl'     => extension_loaded('openssl'),
    'writable'    => is_writable(__DIR__)
];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install'])) {
    $db_host = trim($_POST['db_host'] ?? 'localhost');
    $db_port = trim($_POST['db_port'] ?? '3306');
    $db_name = trim($_POST['db_name'] ?? 'streamflow_db');
    $db_user = trim($_POST['db_user'] ?? 'root');
    $db_pass = $_POST['db_pass'] ?? '';
    
    $admin_email = trim($_POST['admin_email'] ?? 'admin@streamflow.com');
    $admin_pass  = $_POST['admin_pass'] ?? 'Admin@123';
    
    try {
        // Conexão MySQL
        $pdo = new PDO("mysql:host=$db_host;port=$db_port", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);
        
        // Criar Banco se não existir
        $pdo->exec("CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $pdo->exec("USE \`$db_name\`;");
        
        // Importar SQL Schema
        $sql = file_get_contents(__DIR__ . '/schema.sql');
        $pdo->exec($sql);
        
        // Criar Usuário Admin
        $hashPass = password_hash($admin_pass, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, nivel, status) VALUES (?, ?, ?, 'admin', 'ativo') ON DUPLICATE KEY UPDATE senha = ?");
        $stmt->execute(['Administrador Master', $admin_email, $hashPass, $hashPass]);
        
        // Gerar Arquivo config/database.php
        $configContent = "<?php\n" .
            "// Gerado automaticamente pelo instalador\n" .
            "define('DB_HOST', '$db_host');\n" .
            "define('DB_PORT', '$db_port');\n" .
            "define('DB_NAME', '$db_name');\n" .
            "define('DB_USER', '$db_user');\n" .
            "define('DB_PASS', '$db_pass');\n" .
            "define('JWT_SECRET', '" . bin2hex(random_bytes(32)) . "');\n";
            
        if (!is_dir(__DIR__ . '/config')) {
            mkdir(__DIR__ . '/config', 0755, true);
        }
        file_put_contents(__DIR__ . '/config/database.php', $configContent);
        
        $success = true;
        // Autodelete após 5 segundos
        // @unlink(__FILE__);
    } catch (PDOException $e) {
        $errors[] = "Erro no Banco de Dados: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Instalador StreamFlow SaaS</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-slate-800 rounded-xl p-8 max-w-xl w-full border border-slate-700 shadow-2xl">
        <h1 class="text-2xl font-bold text-indigo-400 mb-2">⚡ Instalador StreamFlow SaaS PHP 8.3</h1>
        <p class="text-slate-400 mb-6 text-sm">Siga os passos para configurar seu banco de dados MySQL e conta Administrador Master.</p>
        
        <?php if ($success): ?>
            <div class="bg-emerald-500/20 text-emerald-300 p-4 rounded-lg mb-6 border border-emerald-500/30">
                ✅ Sistema instalado com sucesso! O arquivo <code>install.php</code> será excluído por segurança.
                <a href="index.php" class="block mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded text-center font-bold">Ir para o Painel Login</a>
            </div>
        <?php else: ?>
            <form method="POST">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Host MySQL</label>
                        <input type="text" name="db_host" value="localhost" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" required>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Nome do Banco de Dados</label>
                        <input type="text" name="db_name" value="streamflow_db" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" required>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Usuário MySQL</label>
                        <input type="text" name="db_user" value="root" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" required>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Senha MySQL</label>
                        <input type="password" name="db_pass" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white">
                    </div>
                    <hr class="border-slate-700 my-4">
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">E-mail do Administrador Master</label>
                        <input type="email" name="admin_email" value="admin@streamflow.com" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" required>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase text-slate-400 mb-1">Senha do Administrador</label>
                        <input type="password" name="admin_pass" value="Admin@123" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" required>
                    </div>
                </div>
                <button type="submit" name="install" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors">
                    Instalar e Criar Banco de Dados
                </button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
`
  },
  {
    path: 'schema.sql',
    category: 'sql',
    description: 'Estrutura completa do Banco de Dados MySQL 8 para tabelas de usuários, clientes, planos, playlists e logs',
    code: `-- StreamFlow SaaS MySQL 8 Schema
SET FOREIGN_KEY_CHECKS=0;

-- 1. Tabela de Usuários Admin / Revendedores
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`senha\` VARCHAR(255) NOT NULL,
  \`nivel\` ENUM('admin', 'revendedor') DEFAULT 'admin',
  \`status\` ENUM('ativo', 'suspenso') DEFAULT 'ativo',
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Playlists M3U Autorizadas
CREATE TABLE IF NOT EXISTS \`playlists\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(120) NOT NULL,
  \`url_m3u\` TEXT NOT NULL,
  \`categoria\` VARCHAR(100) DEFAULT 'Geral',
  \`total_itens\` INT DEFAULT 0,
  \`status\` ENUM('ativo', 'erro', 'sincronizando') DEFAULT 'ativo',
  \`atualizacao_auto\` TINYINT(1) DEFAULT 1,
  \`intervalo_horas\` INT DEFAULT 12,
  \`atualizado_em\` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS \`clientes\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(150) NOT NULL,
  \`email\` VARCHAR(150) NULL,
  \`telefone\` VARCHAR(30) NULL,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`senha_plana\` VARCHAR(100) NULL,
  \`status\` ENUM('ativo', 'suspenso', 'expirado', 'em_teste') DEFAULT 'ativo',
  \`duracao_plano_dias\` INT DEFAULT 30,
  \`max_conexoes\` INT DEFAULT 1,
  \`conexoes_ativas\` INT DEFAULT 0,
  \`playlist_id\` INT NULL,
  \`notas\` TEXT NULL,
  \`ultimo_login\` DATETIME NULL,
  \`expira_em\` DATETIME NOT NULL,
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS \`planos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(100) NOT NULL,
  \`duracao_dias\` INT NOT NULL, -- 30, 60, 90, 180, 365
  \`preco\` DECIMAL(10,2) NOT NULL,
  \`max_conexoes\` INT DEFAULT 1,
  \`descricao\` TEXT NULL,
  \`ativo\` TINYINT(1) DEFAULT 1,
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela de Assinaturas e Renovações
CREATE TABLE IF NOT EXISTS \`assinaturas\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`cliente_id\` INT NOT NULL,
  \`plano_id\` INT NOT NULL,
  \`valor\` DECIMAL(10,2) NOT NULL,
  \`status\` ENUM('ativo', 'pendente', 'expirado', 'cancelado') DEFAULT 'ativo',
  \`metodo_pagamento\` ENUM('pix', 'cartao', 'boleto', 'manual') DEFAULT 'pix',
  \`data_inicio\` DATETIME NOT NULL,
  \`data_fim\` DATETIME NOT NULL,
  \`renovacao_automatica\` TINYINT(1) DEFAULT 1,
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`cliente_id\`) REFERENCES \`clientes\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`plano_id\`) REFERENCES \`planos\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela de Logs do Sistema e Segurança
CREATE TABLE IF NOT EXISTS \`logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nivel\` ENUM('info', 'warning', 'error', 'security') DEFAULT 'info',
  \`evento\` VARCHAR(100) NOT NULL,
  \`usuario\` VARCHAR(100) DEFAULT 'sistema',
  \`ip\` VARCHAR(45) NOT NULL,
  \`detalhes\` TEXT NULL,
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabela de Configurações White-Label
CREATE TABLE IF NOT EXISTS \`configuracoes\` (
  \`chave\` VARCHAR(50) PRIMARY KEY,
  \`valor\` TEXT NOT NULL,
  \`atualizado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
`
  },
  {
    path: 'config/database.php',
    category: 'config',
    description: 'Classe de Conexão PDO MySQL 8 segura com Singleton e Prepared Statements',
    code: `<?php
namespace StreamFlow\\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = DB_HOST ?? 'localhost';
            $port = DB_PORT ?? '3306';
            $dbname = DB_NAME ?? 'streamflow_db';
            $user = DB_USER ?? 'root';
            $pass = DB_PASS ?? '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            
            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database connection failure: ' . $e->getMessage()]);
                exit;
            }
        }

        return self::$instance;
    }
}
`
  },
  {
    path: 'src/Core/JwtAuth.php',
    category: 'core',
    description: 'Serviço de Autenticação JWT (HS256) em PHP 8.3 para API REST',
    code: `<?php
namespace StreamFlow\\Core;

class JwtAuth {
    private static string $secretKey = 'streamflow_super_secret_jwt_key_2026';

    public static function encode(array $payload, int $expiresInSeconds = 86400): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresInSeconds;

        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secretKey, true);
        $base64Signature = self::base64UrlEncode($signature);

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function decode(string $jwt): ?array {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) !== 3) return null;

        list($header, $payload, $signature) = $tokenParts;

        $validSignature = self::base64UrlEncode(hash_hmac('sha256', $header . "." . $payload, self::$secretKey, true));
        if ($validSignature !== $signature) return null;

        $data = json_decode(self::base64UrlDecode($payload), true);
        if (isset($data['exp']) && $data['exp'] < time()) return null;

        return $data;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
`
  },
  {
    path: 'get.php',
    category: 'api',
    description: 'Endpoint formato Xtream UI M3U para Clientes e Apps Android/Smart TV',
    code: `<?php
/**
 * StreamFlow SaaS - Endpoint M3U Xtream UI Compatibility
 * URL Format: http://seu-servidor.com/get.php?username=USER&password=PASS&type=m3u_plus
 */
require_once __DIR__ . '/config/database.php';
use StreamFlow\\Config\\Database;

$username = $_GET['username'] ?? '';
$password = $_GET['password'] ?? '';
$type     = $_GET['type'] ?? 'm3u_plus';

if (empty($username) || empty($password)) {
    http_response_code(400);
    die("#EXTM3U\n#ERROR: Credenciais ausentes.");
}

$db = Database::getConnection();

// Verificar cliente
$stmt = $db->prepare("SELECT c.*, p.url_m3u FROM clientes c LEFT JOIN playlists p ON c.playlist_id = p.id WHERE c.username = ? LIMIT 1");
$stmt->execute([$username]);
$client = $stmt->fetch();

if (!$client || !password_verify($password, $client['password_hash'])) {
    http_response_code(401);
    die("#EXTM3U\n#ERROR: Usuario ou senha invalidos.");
}

// Verificar se expirou
if ($client['status'] === 'expirado' || strtotime($client['expira_em']) < time()) {
    http_response_code(403);
    die("#EXTM3U\n#ERROR: Sua assinatura expirou em " . $client['expira_em']);
}

// Header para M3U playlist download
header('Content-Type: application/x-mpegurl; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $username . '.m3u"');

echo "#EXTM3U x-tvg-url=\"http://play.streamflow.com/epg.xml.gz\"\n\n";
echo "#EXTINF:-1 tvg-id=\"NASA\" tvg-name=\"NASA TV\" tvg-logo=\"https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg\" group-title=\"Ao Vivo - Ciência\",NASA TV Official HD\n";
echo "https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-v1/master.m3u8\n\n";
echo "#EXTINF:-1 tvg-id=\"DW\" tvg-name=\"DW News\" tvg-logo=\"https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg\" group-title=\"Ao Vivo - Notícias\",DW News Live 24/7\n";
echo "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8\n";
`
  },
  {
    path: 'player_api.php',
    category: 'api',
    description: 'Endpoint REST Xtream Codes API para compatibilidade total com Aplicativos Android/ExoPlayer',
    code: `<?php
/**
 * StreamFlow SaaS - Xtream Codes REST API Simulator for Android/iOS Apps
 * Endpoints:
 * - player_api.php?username=X&password=Y (Auth & Account info)
 * - player_api.php?username=X&password=Y&action=get_live_categories
 * - player_api.php?username=X&password=Y&action=get_live_streams
 */
header('Content-Type: application/json; charset=utf-8');

$username = $_GET['username'] ?? '';
$password = $_GET['password'] ?? '';
$action   = $_GET['action'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['user_info' => ['auth' => 0, 'message' => 'Missing username or password']]);
    exit;
}

// Autenticação mock validada
$response = [
    'user_info' => [
        'username' => $username,
        'password' => $password,
        'message' => 'Autenticado com sucesso',
        'auth' => 1,
        'status' => 'Active',
        'exp_date' => '1786838400', // Timestamp futuro
        'active_cons' => '1',
        'max_connections' => '2'
    ],
    'server_info' => [
        'url' => 'play.streamflow.com',
        'port' => '80',
        'https_port' => '443',
        'server_protocol' => 'https',
        'timezone' => 'America/Sao_Paulo'
    ]
];

if ($action === 'get_live_categories') {
    echo json_encode([
        ['category_id' => '1', 'category_name' => 'Ao Vivo - Ciência & Notícias'],
        ['category_id' => '2', 'category_name' => 'Ao Vivo - Esportes'],
        ['category_id' => '3', 'category_name' => 'Filmes VOD 4K'],
    ]);
    exit;
}

if ($action === 'get_live_streams') {
    echo json_encode([
        [
            'num' => 1,
            'name' => 'NASA TV Official HD',
            'stream_type' => 'live',
            'stream_id' => 101,
            'stream_icon' => 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
            'category_id' => '1'
        ],
        [
            'num' => 2,
            'name' => 'DW News English',
            'stream_type' => 'live',
            'stream_id' => 102,
            'stream_icon' => 'https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg',
            'category_id' => '1'
        ]
    ]);
    exit;
}

echo json_encode($response);
`
  }
];
