<?php
// api/db.php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    private function getAppEnv($key, $default = null) {
        // Check for DATABASE_URL first if we're looking for DB related info
        $dbUrl = getenv('DATABASE_URL') ?: ($_ENV['DATABASE_URL'] ?? $_SERVER['DATABASE_URL'] ?? null);
        if ($dbUrl && in_array($key, ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'])) {
            $parsed = parse_url($dbUrl);
            if ($parsed) {
                switch ($key) {
                    case 'DB_HOST': return $parsed['host'] . (isset($parsed['port']) ? ':' . $parsed['port'] : '');
                    case 'DB_USER': return $parsed['user'] ?? null;
                    case 'DB_PASS': return $parsed['pass'] ?? null;
                    case 'DB_NAME': return ltrim($parsed['path'], '/') ?? null;
                }
            }
        }

        $val = getenv($key);
        if ($val !== false) return $val;
        if (isset($_ENV[$key])) return $_ENV[$key];
        if (isset($_SERVER[$key])) return $_SERVER[$key];
        
        // Case-insensitive fallback
        $upper = strtoupper($key);
        foreach ([$_ENV, $_SERVER] as $arr) {
            foreach ($arr as $k => $v) {
                if (strtoupper($k) === $upper) return $v;
            }
        }
        return $default;
    }

    public function __construct() {
        // Load .env if it exists
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($name, $value) = explode('=', $line, 2);
                putenv(trim($name) . '=' . trim($value));
                $_ENV[trim($name)] = trim($value);
                $_SERVER[trim($name)] = trim($value);
            }
        }

        // First check for Environment Variables (Docker/Dokploy way)
        $dbHost = $this->getAppEnv('DB_HOST');
        if ($dbHost) {
            $this->host = $dbHost;
            $this->db_name = $this->getAppEnv('DB_NAME');
            $this->username = $this->getAppEnv('DB_USER');
            $this->password = $this->getAppEnv('DB_PASS');
            return;
        }

        if (!file_exists(__DIR__ . '/../config.php')) {
            return;
        }
        
        require_once __DIR__ . '/../config.php';
        
        $this->host = DB_HOST;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }

    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            // Ideally log this, don't show to user in production
            // echo "Connection Error: " . $e->getMessage();
            return null;
        }

        return $this->conn;
    }
}
