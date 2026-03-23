<?php
// api/db.php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // First check for Environment Variables (Docker/Dokploy way)
        $dbHost = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? null);
        if ($dbHost) {
            $this->host = $dbHost;
            $this->db_name = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? null);
            $this->username = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? null);
            $this->password = getenv('DB_PASS') ?: ($_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? null);
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
